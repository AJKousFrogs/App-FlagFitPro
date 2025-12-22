/**
 * Dashboard Routes API
 * Provides dashboard data and overview metrics for FlagFit Pro
 * 
 * @module routes/dashboardRoutes
 * @version 2.0.0
 */

import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { safeQuery, safeParseInt, safeFormatDate } from './utils/query-helper.js';

dotenv.config();

const router = express.Router();
const ROUTE_NAME = 'dashboard';

// Database connection with enhanced error handling and fallbacks
let pool;
try {
  const connectionString = process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;
  
  if (!connectionString) {
    serverLogger.warn(`⚠️  ${ROUTE_NAME.toUpperCase()}: DATABASE_URL not configured`);
  }
  
  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20,
    allowExitOnIdle: false
  });
  
  pool.on('connect', () => {
    serverLogger.success(`${ROUTE_NAME.toUpperCase()} database connected successfully`);
  });
  
  pool.on('error', (err) => {
    serverLogger.error(`❌ ${ROUTE_NAME.toUpperCase()} database connection error:`, err);
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      serverLogger.warn(`⚠️  ${ROUTE_NAME.toUpperCase()}: Attempting to reconnect...`);
    }
  });
  
} catch (error) {
  serverLogger.error(`❌ Failed to create ${ROUTE_NAME} database pool:`, error);
  pool = null;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Wrapper for safeQuery that uses this route's pool and name
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters for parameterized queries
 * @returns {Promise<object>} Query result object
 */
async function executeQuery(query, params = []) {
  return safeQuery(pool, query, params, ROUTE_NAME);
}

/**
 * Safely parse floats with validation
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed float or default value
 */
function safeParseFloat(value, defaultValue = 0) {
  try {
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (error) {
    return defaultValue;
  }
}

// parseIntSafe and formatDate removed - unused functions (use safeParseInt and safeFormatDate from query-helper instead)

/**
 * Safely calculate percentages
 * @param {number} numerator - Numerator value
 * @param {number} denominator - Denominator value
 * @param {number} defaultValue - Default value if calculation fails
 * @returns {number} Percentage value (0-100)
 */
function safePercentage(numerator, denominator, defaultValue = 0) {
  try {
    const num = safeParseFloat(numerator, 0);
    const den = safeParseFloat(denominator, 0);
    
    if (!den || den === 0) return defaultValue;
    
    const percentage = (num / den) * 100;
    return Math.max(0, Math.min(100, Math.round(percentage)));
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Validate user ID parameter
 * @param {string} userId - User ID to validate
 * @returns {object} Validation result with isValid and sanitized userId
 */
function validateUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    return { isValid: false, error: 'User ID must be a non-empty string' };
  }
  
  const sanitized = userId.trim();
  
  if (sanitized.length === 0) {
    return { isValid: false, error: 'User ID cannot be empty' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    return { isValid: false, error: 'User ID contains invalid characters' };
  }
  
  return { isValid: true, userId: sanitized };
}

/**
 * Create standardized error response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @param {string} details - Additional error details (dev only)
 * @returns {object} Error response object
 */
function createErrorResponse(message, code, statusCode = 500, details = null) {
  const response = {
    success: false,
    error: message,
    code,
    timestamp: safeFormatDate(new Date())
  };
  
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }
  
  return { statusCode, response };
}

/**
 * GET /overview
 * Get dashboard overview data including training progress, performance, and team chemistry
 * @query {string} userId - User ID (optional, defaults to '1' for demo)
 * @returns {object} Dashboard overview data
 */
router.get('/overview', async (req, res) => {
  try {
    const userIdParam = req.query.userId || '1'; // Default for demo
    
    // Validate userId if provided
    if (req.query.userId) {
      const validation = validateUserId(userIdParam);
      if (!validation.isValid) {
        const { statusCode, response } = createErrorResponse(validation.error, 'INVALID_USER_ID', 400);
        return res.status(statusCode).json(response);
      }
    }
    
    const userId = userIdParam;
    
    // Get training progress
    const trainingProgressQuery = `
      SELECT 
        COUNT(*) as completed_sessions,
        COUNT(*) * 100.0 / 7 as progress_percentage
      FROM training_sessions 
      WHERE user_id = $1 
      AND session_date >= CURRENT_DATE - INTERVAL '7 days'
      AND status = 'completed'
    `;
    
    // Get performance score
    const performanceQuery = `
      SELECT 
        AVG(performance_score) as avg_score,
        COUNT(*) as total_sessions
      FROM performance_metrics 
      WHERE user_id = $1 
      AND created_at >= CURRENT_DATE - INTERVAL '30 days'
    `;
    
    // Get team chemistry
    const teamChemistryQuery = `
      SELECT 
        AVG(chemistry_score) as avg_chemistry,
        AVG(communication_score) as avg_communication,
        AVG(trust_score) as avg_trust
      FROM team_chemistry 
      WHERE user_id = $1 
      AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    `;
    
    // Get upcoming sessions
    const upcomingQuery = `
      SELECT 
        session_type,
        scheduled_time,
        duration_minutes
      FROM training_sessions 
      WHERE user_id = $1 
      AND session_date >= CURRENT_DATE
      AND status = 'scheduled'
      ORDER BY session_date ASC
      LIMIT 1
    `;
    
    const [trainingResult, performanceResult, chemistryResult, upcomingResult] = await Promise.all([
      executeQuery(trainingProgressQuery, [userId]),
      executeQuery(performanceQuery, [userId]),
      executeQuery(teamChemistryQuery, [userId]),
      executeQuery(upcomingQuery, [userId])
    ]);
    
    const overview = {
      trainingProgress: {
        percentage: safePercentage(
          trainingResult.rows[0]?.completed_sessions || 0, 
          7, 
          0
        ),
        completed: safeParseInt(trainingResult.rows[0]?.completed_sessions, 0),
        trend: '+12% from last week'
      },
      performanceScore: {
        score: safeParseFloat(performanceResult.rows[0]?.avg_score, 8.4).toFixed(1),
        total: safeParseInt(performanceResult.rows[0]?.total_sessions, 0),
        status: 'Olympic standard reached'
      },
      teamChemistry: {
        overall: safeParseFloat(chemistryResult.rows[0]?.avg_chemistry, 9.1).toFixed(1),
        communication: safeParseFloat(chemistryResult.rows[0]?.avg_communication, 9.1).toFixed(1),
        trust: safeParseFloat(chemistryResult.rows[0]?.avg_trust, 8.7).toFixed(1),
        status: 'Excellent team synergy'
      },
      nextSession: {
        type: upcomingResult.rows[0]?.session_type || 'Olympic preparation training',
        time: upcomingResult.rows[0]?.scheduled_time || '4:00 PM',
        duration: safeParseInt(upcomingResult.rows[0]?.duration_minutes, 120)
      }
    };
    
    res.json({ success: true, data: overview });
  } catch (error) {
    serverLogger.error(`${ROUTE_NAME.toUpperCase()} overview error:`, error);
    const { statusCode, response } = createErrorResponse(
      'Failed to fetch dashboard data',
      'FETCH_ERROR',
      500,
      error.message
    );
    return res.status(statusCode).json(response);
  }
});

/**
 * GET /training-calendar
 * Get 7-day training calendar data
 * @query {string} userId - User ID (optional, defaults to '1')
 * @returns {object} Training calendar data for the week
 */
router.get('/training-calendar', async (req, res) => {
  try {
    const userIdParam = req.query.userId || '1';
    
    if (req.query.userId) {
      const validation = validateUserId(userIdParam);
      if (!validation.isValid) {
        const { statusCode, response } = createErrorResponse(validation.error, 'INVALID_USER_ID', 400);
        return res.status(statusCode).json(response);
      }
    }
    
    const userId = userIdParam;
    
    const query = `
      SELECT 
        session_date,
        session_type,
        status,
        duration_minutes,
        performance_score
      FROM training_sessions 
      WHERE user_id = $1 
      AND session_date >= CURRENT_DATE - INTERVAL '3 days'
      AND session_date <= CURRENT_DATE + INTERVAL '3 days'
      ORDER BY session_date ASC
    `;
    
    const result = await executeQuery(query, [userId]);
    
    // Generate calendar data for the week
    const calendar = [];
    const today = new Date();
    
    try {
      for (let i = -3; i <= 3; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const dayData = result.rows.find(row => {
          try {
            const rowDate = new Date(row.session_date);
            return rowDate.toDateString() === date.toDateString();
          } catch (dateError) {
            serverLogger.warn('Date parsing error:', dateError);
            return false;
          }
        });
        
        const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        
        calendar.push({
          dayName: dayNames[date.getDay()],
          dayDate: date.getDate(),
          dayTraining: dayData?.session_type || 'Rest Day',
          trainingStatus: dayData?.status || 'Scheduled',
          isToday: i === 0,
          isCompleted: dayData?.status === 'completed',
          performanceScore: safeParseFloat(dayData?.performance_score, 0)
        });
      }
    } catch (calendarError) {
      serverLogger.error('Error generating calendar:', calendarError);
      // Return fallback calendar data
      calendar.push({
        dayName: 'MON',
        dayDate: today.getDate(),
        dayTraining: 'Rest Day',
        trainingStatus: 'Scheduled',
        isToday: true,
        isCompleted: false,
        performanceScore: 0
      });
    }
    
    res.json({ success: true, data: calendar });
  } catch (error) {
    serverLogger.error(`${ROUTE_NAME.toUpperCase()} training calendar error:`, error);
    const { statusCode, response } = createErrorResponse(
      'Failed to fetch training calendar',
      'FETCH_ERROR',
      500,
      error.message
    );
    return res.status(statusCode).json(response);
  }
});

// Get LA28 Olympic qualification data
router.get('/olympic-qualification', async (req, res) => {
  try {
    const userId = req.query.userId || '1';
    
    const query = `
      SELECT 
        qualification_probability,
        world_ranking,
        days_until_championship,
        european_championship_date,
        world_championship_date,
        olympic_date
      FROM olympic_qualification 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await executeQuery(query, [userId]);
    
    const olympicData = result.rows[0] || {
      qualification_probability: 73,
      world_ranking: 8,
      days_until_championship: 124,
      european_championship_date: '2025-09-24',
      world_championship_date: '2026-07-15',
      olympic_date: '2028-07-14'
    };
    
    // Get performance benchmarks
    const benchmarksQuery = `
      SELECT 
        metric_name,
        current_value,
        target_value,
        unit
      FROM performance_benchmarks 
      WHERE user_id = $1
      ORDER BY metric_name
    `;
    
    const benchmarksResult = await executeQuery(benchmarksQuery, [userId]);
    
    const benchmarks = benchmarksResult.rows.length > 0 ? benchmarksResult.rows : [
      { metric_name: '40-Yard Dash', current_value: 4.52, target_value: 4.40, unit: 's' },
      { metric_name: 'Passing Accuracy', current_value: 82.5, target_value: 85, unit: '%' },
      { metric_name: 'Agility Shuttle', current_value: 4.18, target_value: 4.00, unit: 's' },
      { metric_name: 'Game IQ Score', current_value: 87, target_value: 90, unit: '' }
    ];
    
    res.json({
      success: true,
      data: {
        qualification: olympicData,
        benchmarks: benchmarks
      }
    });
  } catch (error) {
    serverLogger.error('Olympic qualification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch Olympic data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get sponsor rewards data
router.get('/sponsor-rewards', async (req, res) => {
  try {
    const userId = req.query.userId || '1';
    
    const query = `
      SELECT 
        available_points,
        current_tier,
        products_available,
        tier_progress_percentage
      FROM sponsor_rewards 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await executeQuery(query, [userId]);
    
    const sponsorData = result.rows[0] || {
      available_points: 2847,
      current_tier: 'GOLD',
      products_available: 236,
      tier_progress_percentage: 65
    };
    
    // Get featured products
    const productsQuery = `
      SELECT 
        product_name,
        points_cost,
        relevance_score,
        category
      FROM sponsor_products 
      WHERE is_featured = true
      ORDER BY relevance_score DESC
      LIMIT 4
    `;
    
    const productsResult = await executeQuery(productsQuery);
    
    const products = productsResult.rows.length > 0 ? productsResult.rows : [
      { product_name: 'Pro Grip Football Socks', points_cost: 350, relevance_score: 92, category: 'Gear' },
      { product_name: 'Recovery Massage Gun', points_cost: 1650, relevance_score: 78, category: 'Recovery' },
      { product_name: 'Elite Training Shorts', points_cost: 780, relevance_score: 89, category: 'Gear' },
      { product_name: 'Recovery Band Set', points_cost: 420, relevance_score: 94, category: 'Recovery' }
    ];
    
    res.json({
      success: true,
      data: {
        rewards: sponsorData,
        products: products
      }
    });
  } catch (error) {
    serverLogger.error('Sponsor rewards error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch sponsor data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get wearables data
router.get('/wearables', async (req, res) => {
  try {
    const userId = req.query.userId || '1';
    
    const query = `
      SELECT 
        device_type,
        heart_rate,
        hrv,
        sleep_score,
        training_load,
        last_sync,
        connection_status
      FROM wearables_data 
      WHERE user_id = $1
      ORDER BY last_sync DESC
    `;
    
    const result = await executeQuery(query, [userId]);
    
    const wearablesData = result.rows.length > 0 ? result.rows : [
      {
        device_type: 'Apple Watch',
        heart_rate: 142,
        hrv: 38,
        sleep_score: 87,
        training_load: 247,
        last_sync: safeFormatDate(new Date()),
        connection_status: 'connected'
      }
    ];
    
    res.json({ success: true, data: wearablesData });
  } catch (error) {
    serverLogger.error('Wearables error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch wearables data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get team chemistry data
router.get('/team-chemistry', async (req, res) => {
  try {
    const userId = req.query.userId || '1';
    
    const query = `
      SELECT 
        overall_chemistry,
        communication_score,
        trust_score,
        leadership_score,
        last_intervention,
        intervention_effectiveness
      FROM team_chemistry 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await executeQuery(query, [userId]);
    
    const chemistryData = result.rows[0] || {
      overall_chemistry: 8.4,
      communication_score: 9.1,
      trust_score: 8.7,
      leadership_score: 8.2,
      last_intervention: 'Trust building exercise',
      intervention_effectiveness: 87
    };
    
    res.json({ success: true, data: chemistryData });
  } catch (error) {
    serverLogger.error('Team chemistry error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch team chemistry data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get notifications
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.query.userId || '1';
    
    const query = `
      SELECT 
        notification_type,
        message,
        is_read,
        created_at,
        priority
      FROM notifications 
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `;
    
    const result = await executeQuery(query, [userId]);
    
    const notifications = result.rows.length > 0 ? result.rows : [
      {
        notification_type: 'injury_risk',
        message: 'Injury risk alert: Landing mechanics suboptimal',
        is_read: false,
        created_at: safeFormatDate(new Date(Date.now() - 15 * 60 * 1000)),
        priority: 'high'
      },
      {
        notification_type: 'weather',
        message: 'Weather alert: Tomorrow\'s practice moved to 6PM',
        is_read: false,
        created_at: safeFormatDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
        priority: 'medium'
      },
      {
        notification_type: 'tournament',
        message: 'European Championship bracket updated',
        is_read: false,
        created_at: safeFormatDate(new Date(Date.now() - 4 * 60 * 60 * 1000)),
        priority: 'low'
      }
    ];
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    serverLogger.error('Notifications error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notifications',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get daily quote
router.get('/daily-quote', async (req, res) => {
  try {
    const query = `
      SELECT 
        quote_text,
        author,
        category
      FROM daily_quotes 
      WHERE is_active = true
      ORDER BY RANDOM()
      LIMIT 1
    `;
    
    const result = await safeQuery(query);
    
    const quote = result.rows[0] || {
      quote_text: 'Champions aren\'t made in comfort zones. Today\'s training is tomorrow\'s victory.',
      author: 'Coach Marcus Rivera',
      category: 'motivation'
    };
    
    res.json({ success: true, data: quote });
  } catch (error) {
    serverLogger.error('Daily quote error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch daily quote',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /health
 * Health check endpoint for monitoring and load balancers
 * @returns {object} Health status with service availability
 */
router.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      success: true,
      status: 'healthy',
      service: ROUTE_NAME,
      version: '2.0.0',
      timestamp: safeFormatDate(new Date()),
      database: pool ? 'disconnected' : 'not_configured'
    };

    if (!pool) {
      healthStatus.success = false;
      healthStatus.status = 'unhealthy';
      healthStatus.message = 'Database connection not available';
      return res.status(503).json(healthStatus);
    }
    
    // Test database connection
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const responseTime = Date.now() - startTime;
    
    healthStatus.database = 'connected';
    healthStatus.databaseResponseTime = `${responseTime}ms`;
    
    res.json(healthStatus);
  } catch (error) {
    serverLogger.error(`${ROUTE_NAME.toUpperCase()} health check error:`, error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      service: ROUTE_NAME,
      message: 'Database connection failed',
      timestamp: safeFormatDate(new Date()),
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * Global error handler (catches unhandled errors)
 */
router.use((err, req, res, next) => {
  serverLogger.error(`${ROUTE_NAME.toUpperCase()} unhandled error:`, err);
  
  const { statusCode, response } = createErrorResponse(
    'An unexpected error occurred',
    'INTERNAL_ERROR',
    500,
    process.env.NODE_ENV === 'development' ? err.message : null
  );
  
  res.status(statusCode).json(response);
});

export default router;
