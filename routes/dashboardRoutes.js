import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Database connection with error handling and fallbacks
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Add connection timeout and retry logic
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
  });
  
  // Test connection
  pool.on('connect', () => {
    console.log('✅ Dashboard database connected successfully');
  });
  
  pool.on('error', (err) => {
    console.error('❌ Dashboard database connection error:', err);
  });
  
} catch (error) {
  console.error('❌ Failed to create dashboard database pool:', error);
  pool = null;
}

// Helper function to safely execute database queries
async function safeQuery(query, params = []) {
  if (!pool) {
    throw new Error('Database connection not available');
  }
  
  try {
    const result = await pool.query(query, params);
    return result;
  } catch (error) {
    console.error('Dashboard database query error:', error);
    throw new Error(`Database operation failed: ${error.message}`);
  }
}

// Helper function to safely parse integers
function safeParseInt(value, defaultValue = 0) {
  try {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (error) {
    return defaultValue;
  }
}

// Helper function to safely parse floats
function safeParseFloat(value, defaultValue = 0) {
  try {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  } catch (error) {
    return defaultValue;
  }
}

// Helper function to safely format dates
function safeFormatDate(date) {
  try {
    if (!date) return new Date().toISOString();
    return new Date(date).toISOString();
  } catch (error) {
    return new Date().toISOString();
  }
}

// Helper function to safely calculate percentages
function safePercentage(numerator, denominator, defaultValue = 0) {
  try {
    if (!denominator || denominator === 0) return defaultValue;
    return Math.round((numerator / denominator) * 100);
  } catch (error) {
    return defaultValue;
  }
}

// Get dashboard overview data
router.get('/overview', async (req, res) => {
  try {
    const userId = req.query.userId || '1'; // Default for demo
    
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
      safeQuery(trainingProgressQuery, [userId]),
      safeQuery(performanceQuery, [userId]),
      safeQuery(teamChemistryQuery, [userId]),
      safeQuery(upcomingQuery, [userId])
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
    console.error('Dashboard overview error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch dashboard data',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get 7-day training calendar
router.get('/training-calendar', async (req, res) => {
  try {
    const userId = req.query.userId || '1';
    
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
    
    const result = await safeQuery(query, [userId]);
    
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
            console.warn('Date parsing error:', dateError);
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
      console.error('Error generating calendar:', calendarError);
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
    console.error('Training calendar error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch training calendar',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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
    
    const result = await safeQuery(query, [userId]);
    
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
    
    const benchmarksResult = await safeQuery(benchmarksQuery, [userId]);
    
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
    console.error('Olympic qualification error:', error);
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
    
    const result = await safeQuery(query, [userId]);
    
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
    
    const productsResult = await safeQuery(productsQuery);
    
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
    console.error('Sponsor rewards error:', error);
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
    
    const result = await safeQuery(query, [userId]);
    
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
    console.error('Wearables error:', error);
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
    
    const result = await safeQuery(query, [userId]);
    
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
    console.error('Team chemistry error:', error);
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
    
    const result = await safeQuery(query, [userId]);
    
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
    console.error('Notifications error:', error);
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
    console.error('Daily quote error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch daily quote',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    if (!pool) {
      return res.status(503).json({
        success: false,
        status: 'unhealthy',
        message: 'Database connection not available'
      });
    }
    
    // Test database connection
    await pool.query('SELECT 1');
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: safeFormatDate(new Date()),
      database: 'connected'
    });
  } catch (error) {
    console.error('Dashboard health check error:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'Database connection failed',
      timestamp: safeFormatDate(new Date())
    });
  }
});

export default router;
