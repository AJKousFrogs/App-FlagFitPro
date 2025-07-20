import { neon } from '@netlify/neon';

const sql = neon(); // automatically uses env NETLIFY_DATABASE_URL

// CORS headers for frontend access
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

export async function handler(event, context) {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    switch (event.httpMethod) {
      case 'POST':
        return await createAnalyticsEvent(event);
      case 'GET':
        return await getAnalyticsData(event);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Analytics function error:', error);
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

async function createAnalyticsEvent(event) {
  const { 
    user_id, 
    event_type, 
    event_data, 
    session_id, 
    page_url, 
    user_agent 
  } = JSON.parse(event.body);

  const [result] = await sql`
    INSERT INTO analytics_events (
      user_id, 
      event_type, 
      event_data, 
      session_id, 
      page_url, 
      user_agent,
      created_at
    )
    VALUES (
      ${user_id}, 
      ${event_type}, 
      ${JSON.stringify(event_data)}, 
      ${session_id}, 
      ${page_url}, 
      ${user_agent},
      NOW()
    )
    RETURNING *
  `;

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ 
      success: true, 
      event: result 
    })
  };
}

async function getAnalyticsData(event) {
  const { userId, timeframe = '7d', eventType } = event.queryStringParameters || {};

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
    case '90d':
      timeFilter = "AND created_at >= NOW() - INTERVAL '90 days'";
      break;
    default:
      timeFilter = "AND created_at >= NOW() - INTERVAL '7 days'";
  }

  let userFilter = userId ? `WHERE user_id = '${userId}'` : 'WHERE 1=1';
  let eventTypeFilter = eventType && eventType !== 'all' ? `AND event_type = '${eventType}'` : '';

  // Get events
  const events = await sql`
    SELECT * FROM analytics_events 
    ${sql.unsafe(userFilter)} 
    ${sql.unsafe(eventTypeFilter)}
    ${sql.unsafe(timeFilter)}
    ORDER BY created_at DESC 
    LIMIT 1000
  `;

  // Get metrics
  const [metrics] = await sql`
    SELECT 
      COUNT(*) as total_events,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(DISTINCT session_id) as total_sessions,
      COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
      COUNT(CASE WHEN event_type = 'training_session' THEN 1 END) as training_events
    FROM analytics_events 
    ${sql.unsafe(userFilter)} 
    ${sql.unsafe(timeFilter)}
  `;

  // Get top pages
  const topPages = await sql`
    SELECT 
      page_url,
      COUNT(*) as visits
    FROM analytics_events 
    WHERE event_type = 'page_view'
    ${sql.unsafe(userFilter.replace('WHERE', 'AND'))} 
    ${sql.unsafe(timeFilter)}
    GROUP BY page_url
    ORDER BY visits DESC
    LIMIT 10
  `;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      events,
      metrics: {
        totalEvents: parseInt(metrics.total_events),
        uniqueUsers: parseInt(metrics.unique_users),
        totalSessions: parseInt(metrics.total_sessions),
        pageViews: parseInt(metrics.page_views),
        trainingEvents: parseInt(metrics.training_events)
      },
      topPages
    })
  };
}