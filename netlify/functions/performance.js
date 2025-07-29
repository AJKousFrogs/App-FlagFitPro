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
      case 'POST':
        return await recordPerformanceMetric(event);
      case 'GET':
        return await getPerformanceReport(event);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Performance function error:', error);
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

async function recordPerformanceMetric(event) {
  const { 
    user_id,
    page_url,
    load_time,
    api_response_time,
    bundle_size,
    memory_usage,
    user_agent,
    connection_type
  } = JSON.parse(event.body);

  const [result] = await sql`
    INSERT INTO performance_metrics (
      user_id,
      page_url,
      load_time,
      api_response_time,
      bundle_size,
      memory_usage,
      user_agent,
      connection_type,
      created_at
    )
    VALUES (
      ${user_id},
      ${page_url},
      ${load_time},
      ${api_response_time},
      ${bundle_size},
      ${memory_usage},
      ${user_agent},
      ${connection_type},
      NOW()
    )
    RETURNING *
  `;

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ 
      success: true, 
      metric: result 
    })
  };
}

async function getPerformanceReport(event) {
  const { timeframe = '7d' } = event.queryStringParameters || {};

  let timeFilter = '';
  switch (timeframe) {
    case '1d':
      timeFilter = "WHERE created_at >= NOW() - INTERVAL '1 day'";
      break;
    case '7d':
      timeFilter = "WHERE created_at >= NOW() - INTERVAL '7 days'";
      break;
    case '30d':
      timeFilter = "WHERE created_at >= NOW() - INTERVAL '30 days'";
      break;
    default:
      timeFilter = "WHERE created_at >= NOW() - INTERVAL '7 days'";
  }

  // Get performance summary
  const [summary] = await sql`
    SELECT 
      AVG(load_time) as avg_load_time,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY load_time) as p95_load_time,
      AVG(api_response_time) as avg_api_response,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY api_response_time) as p95_api_response,
      AVG(memory_usage) as avg_memory_usage,
      COUNT(*) as total_measurements
    FROM performance_metrics 
    ${sql.unsafe(timeFilter)}
  `;

  // Get performance by page
  const pagePerformance = await sql`
    SELECT 
      page_url,
      AVG(load_time) as avg_load_time,
      COUNT(*) as measurements
    FROM performance_metrics 
    ${sql.unsafe(timeFilter)}
    GROUP BY page_url
    ORDER BY avg_load_time DESC
    LIMIT 10
  `;

  // Get performance trends (daily averages)
  const trends = await sql`
    SELECT 
      DATE(created_at) as date,
      AVG(load_time) as avg_load_time,
      AVG(api_response_time) as avg_api_response
    FROM performance_metrics 
    ${sql.unsafe(timeFilter)}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `;

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      summary: {
        avgLoadTime: parseFloat(summary.avg_load_time || 0).toFixed(2),
        p95LoadTime: parseFloat(summary.p95_load_time || 0).toFixed(2),
        avgApiResponse: parseFloat(summary.avg_api_response || 0).toFixed(2),
        p95ApiResponse: parseFloat(summary.p95_api_response || 0).toFixed(2),
        avgMemoryUsage: parseFloat(summary.avg_memory_usage || 0).toFixed(2),
        totalMeasurements: parseInt(summary.total_measurements || 0)
      },
      pagePerformance: pagePerformance.map(p => ({
        page: p.page_url,
        avgLoadTime: parseFloat(p.avg_load_time).toFixed(2),
        measurements: parseInt(p.measurements)
      })),
      trends: trends.map(t => ({
        date: t.date,
        avgLoadTime: parseFloat(t.avg_load_time).toFixed(2),
        avgApiResponse: parseFloat(t.avg_api_response).toFixed(2)
      }))
    })
  };
}