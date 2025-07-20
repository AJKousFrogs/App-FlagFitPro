import { neon } from '@netlify/neon';

const sql = neon();

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        return await getUserBehaviorAnalysis(event);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('User behavior function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
}

async function getUserBehaviorAnalysis(event) {
  const { timeframe = '7d', userId } = event.queryStringParameters || {};

  let timeFilter = '';
  switch (timeframe) {
    case '1d':
      timeFilter = "AND created_at >= NOW() - INTERVAL '1 day'";
      break;
    case '7d':
      timeFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
      break;
    case '30d':
      timeFilter = "AND created_at >= NOW() - INTERVAL '30 days'";
      break;
    default:
      timeFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
  }

  let userFilter = userId ? `user_id = '${userId}'` : '1=1';

  // Get user journey data
  const userJourneys = await sql`
    WITH user_sessions AS (
      SELECT 
        user_id,
        session_id,
        STRING_AGG(page_url, ' -> ' ORDER BY created_at) as journey,
        COUNT(*) as page_count,
        MAX(created_at) - MIN(created_at) as session_duration
      FROM analytics_events 
      WHERE event_type = 'page_view' 
        AND ${sql.unsafe(userFilter)}
        ${sql.unsafe(timeFilter)}
      GROUP BY user_id, session_id
      HAVING COUNT(*) > 1
    )
    SELECT 
      journey,
      COUNT(*) as frequency,
      AVG(page_count) as avg_page_count,
      AVG(EXTRACT(EPOCH FROM session_duration)) as avg_duration_seconds
    FROM user_sessions
    GROUP BY journey
    ORDER BY frequency DESC
    LIMIT 20
  `;

  // Get feature usage
  const featureUsage = await sql`
    SELECT 
      event_data->>'feature' as feature,
      COUNT(*) as usage_count,
      COUNT(DISTINCT user_id) as unique_users
    FROM analytics_events 
    WHERE event_type = 'feature_usage' 
      AND ${sql.unsafe(userFilter)}
      ${sql.unsafe(timeFilter)}
      AND event_data->>'feature' IS NOT NULL
    GROUP BY event_data->>'feature'
    ORDER BY usage_count DESC
    LIMIT 15
  `;

  // Get conversion funnel
  const conversionFunnel = await sql`
    WITH funnel_events AS (
      SELECT 
        user_id,
        session_id,
        CASE 
          WHEN event_type = 'page_view' AND page_url LIKE '%/dashboard%' THEN 'dashboard_visit'
          WHEN event_type = 'page_view' AND page_url LIKE '%/training%' THEN 'training_visit'
          WHEN event_type = 'training_session' THEN 'training_start'
          WHEN event_type = 'goal_created' THEN 'goal_creation'
          WHEN event_type = 'profile_completed' THEN 'profile_completion'
        END as funnel_step
      FROM analytics_events 
      WHERE ${sql.unsafe(userFilter)}
        ${sql.unsafe(timeFilter)}
    )
    SELECT 
      funnel_step,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(*) as total_events
    FROM funnel_events 
    WHERE funnel_step IS NOT NULL
    GROUP BY funnel_step
    ORDER BY unique_users DESC
  `;

  // Get retention analysis
  const retention = await sql`
    WITH user_first_visit AS (
      SELECT 
        user_id,
        MIN(DATE(created_at)) as first_visit_date
      FROM analytics_events 
      WHERE ${sql.unsafe(userFilter)}
        ${sql.unsafe(timeFilter)}
      GROUP BY user_id
    ),
    user_activity AS (
      SELECT 
        a.user_id,
        f.first_visit_date,
        DATE(a.created_at) as activity_date,
        DATE(a.created_at) - f.first_visit_date as days_since_first_visit
      FROM analytics_events a
      JOIN user_first_visit f ON a.user_id = f.user_id
      WHERE ${sql.unsafe(userFilter)}
        ${sql.unsafe(timeFilter)}
      GROUP BY a.user_id, f.first_visit_date, DATE(a.created_at)
    )
    SELECT 
      CASE 
        WHEN days_since_first_visit = 0 THEN 'Day 0'
        WHEN days_since_first_visit <= 1 THEN 'Day 1'
        WHEN days_since_first_visit <= 7 THEN 'Week 1'
        WHEN days_since_first_visit <= 30 THEN 'Month 1'
        ELSE 'Month 1+'
      END as retention_period,
      COUNT(DISTINCT user_id) as returning_users
    FROM user_activity
    GROUP BY 
      CASE 
        WHEN days_since_first_visit = 0 THEN 'Day 0'
        WHEN days_since_first_visit <= 1 THEN 'Day 1'
        WHEN days_since_first_visit <= 7 THEN 'Week 1'
        WHEN days_since_first_visit <= 30 THEN 'Month 1'
        ELSE 'Month 1+'
      END
    ORDER BY 
      CASE retention_period
        WHEN 'Day 0' THEN 1
        WHEN 'Day 1' THEN 2
        WHEN 'Week 1' THEN 3
        WHEN 'Month 1' THEN 4
        ELSE 5
      END
  `;

  // Get bounce rate analysis
  const bounceRate = await sql`
    WITH session_page_counts AS (
      SELECT 
        session_id,
        COUNT(*) as page_views
      FROM analytics_events 
      WHERE event_type = 'page_view'
        AND ${sql.unsafe(userFilter)}
        ${sql.unsafe(timeFilter)}
      GROUP BY session_id
    )
    SELECT 
      CASE WHEN page_views = 1 THEN 'bounced' ELSE 'engaged' END as session_type,
      COUNT(*) as session_count
    FROM session_page_counts
    GROUP BY CASE WHEN page_views = 1 THEN 'bounced' ELSE 'engaged' END
  `;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      userJourneys: userJourneys.map(j => ({
        journey: j.journey,
        frequency: parseInt(j.frequency),
        avgPageCount: parseFloat(j.avg_page_count).toFixed(1),
        avgDurationSeconds: parseFloat(j.avg_duration_seconds || 0).toFixed(1)
      })),
      featureUsage: featureUsage.map(f => ({
        feature: f.feature,
        usageCount: parseInt(f.usage_count),
        uniqueUsers: parseInt(f.unique_users)
      })),
      conversionFunnel: conversionFunnel.map(c => ({
        step: c.funnel_step,
        uniqueUsers: parseInt(c.unique_users),
        totalEvents: parseInt(c.total_events)
      })),
      retention: retention.map(r => ({
        period: r.retention_period,
        returningUsers: parseInt(r.returning_users)
      })),
      bounceRate: {
        bounced: bounceRate.find(b => b.session_type === 'bounced')?.session_count || 0,
        engaged: bounceRate.find(b => b.session_type === 'engaged')?.session_count || 0
      }
    })
  };
}