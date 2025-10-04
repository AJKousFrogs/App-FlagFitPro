import express from 'express';
import dotenv from 'dotenv';
import { safeQuery, getPool } from '../config/database.js';

dotenv.config();

const router = express.Router();
const pool = getPool();

// Helper function to safely format dates
function safeFormatDate(date) {
  try {
    if (!date) return new Date().toISOString();
    return new Date(date).toISOString();
  } catch (error) {
    return new Date().toISOString();
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

// Get community feed
router.get('/feed', async (req, res) => {
  try {
    const userId = req.query.userId || '1';
    const limit = safeParseInt(req.query.limit, 20);
    
    const feedQuery = `
      SELECT 
        p.id,
        p.content,
        p.created_at,
        u.full_name as author_name,
        u.id as author_id,
        COUNT(l.id) as likes_count,
        COUNT(c.id) as comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN likes l ON p.id = l.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.is_active = true
      GROUP BY p.id, p.content, p.created_at, u.full_name, u.id
      ORDER BY p.created_at DESC
      LIMIT $1
    `;
    
    const result = await safeQuery(feedQuery, [limit]);
    
    const feed = result.rows.length > 0 ? result.rows : [
      {
        id: '1',
        content: 'Great training session today! Improved my 40-yard dash time by 0.2 seconds 🏃‍♂️',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
        author_name: 'Alex Rodriguez',
        author_id: '2',
        likes_count: 8,
        comments_count: 3
      },
      {
        id: '2',
        content: 'Team chemistry workshop tomorrow at 3 PM. Don\'t miss it! 💪',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000),
        author_name: 'Coach Johnson',
        author_id: '1',
        likes_count: 15,
        comments_count: 7
      },
      {
        id: '3',
        content: 'Anyone want to practice route running this weekend?',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000),
        author_name: 'Jordan Smith',
        author_id: '3',
        likes_count: 5,
        comments_count: 12
      }
    ];
    
    res.json({ success: true, data: feed });
  } catch (error) {
    console.error('Community feed error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch community feed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create new post
router.post('/posts', async (req, res) => {
  try {
    const { content, userId } = req.body;
    
    if (!content || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Content and user ID are required'
      });
    }
    
    if (content.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Post content cannot exceed 500 characters'
      });
    }
    
    const insertQuery = `
      INSERT INTO posts (user_id, content, created_at, is_active)
      VALUES ($1, $2, NOW(), true)
      RETURNING id, content, created_at
    `;
    
    const result = await safeQuery(insertQuery, [userId, content]);
    
    res.json({ 
      success: true, 
      data: result.rows[0],
      message: 'Post created successfully'
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create post',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get post comments
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const commentsQuery = `
      SELECT 
        c.id,
        c.content,
        c.created_at,
        u.full_name as author_name,
        u.id as author_id
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = $1
      AND c.is_active = true
      ORDER BY c.created_at ASC
    `;
    
    const result = await safeQuery(commentsQuery, [postId]);
    
    const comments = result.rows.length > 0 ? result.rows : [
      {
        id: '1',
        content: 'Great job! Keep it up!',
        created_at: new Date(),
        author_name: 'Taylor Brown',
        author_id: '4'
      }
    ];
    
    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch comments',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Like/unlike post
router.post('/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }
    
    // Check if already liked
    const checkQuery = `
      SELECT id FROM likes WHERE post_id = $1 AND user_id = $2
    `;
    
    const existing = await safeQuery(checkQuery, [postId, userId]);
    
    if (existing.rows.length > 0) {
      // Unlike
      const deleteQuery = `DELETE FROM likes WHERE post_id = $1 AND user_id = $2`;
      await safeQuery(deleteQuery, [postId, userId]);
      
      res.json({ 
        success: true, 
        liked: false,
        message: 'Post unliked successfully'
      });
    } else {
      // Like
      const insertQuery = `
        INSERT INTO likes (post_id, user_id, created_at)
        VALUES ($1, $2, NOW())
      `;
      await safeQuery(insertQuery, [postId, userId]);
      
      res.json({ 
        success: true, 
        liked: true,
        message: 'Post liked successfully'
      });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update like status',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const category = req.query.category || 'overall';
    const limit = safeParseInt(req.query.limit, 10);
    
    let leaderboardQuery = '';
    
    switch (category) {
      case 'speed':
        leaderboardQuery = `
          SELECT 
            u.full_name,
            u.id,
            MIN(CAST(pm.metric_value AS DECIMAL)) as best_time
          FROM users u
          JOIN performance_metrics pm ON u.id = pm.user_id
          WHERE pm.metric_name = '40-Yard Dash'
          GROUP BY u.id, u.full_name
          ORDER BY best_time ASC
          LIMIT $1
        `;
        break;
      case 'overall':
      default:
        leaderboardQuery = `
          SELECT 
            u.full_name,
            u.id,
            AVG(pm.performance_score) as avg_score
          FROM users u
          JOIN performance_metrics pm ON u.id = pm.user_id
          WHERE pm.created_at >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY u.id, u.full_name
          ORDER BY avg_score DESC
          LIMIT $1
        `;
        break;
    }
    
    const result = await safeQuery(leaderboardQuery, [limit]);
    
    const leaderboard = result.rows.length > 0 ? result.rows : [
      { full_name: 'Alex Rodriguez', id: '2', avg_score: 9.2 },
      { full_name: 'Jordan Smith', id: '3', avg_score: 8.8 },
      { full_name: 'Taylor Brown', id: '4', avg_score: 8.5 },
      { full_name: 'Casey Wilson', id: '5', avg_score: 8.3 },
      { full_name: 'Morgan Davis', id: '6', avg_score: 8.1 }
    ];
    
    res.json({ success: true, data: leaderboard, category });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch leaderboard',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get challenges
router.get('/challenges', async (req, res) => {
  try {
    const challengesQuery = `
      SELECT 
        id,
        title,
        description,
        start_date,
        end_date,
        participants_count,
        reward_points,
        challenge_type
      FROM challenges
      WHERE end_date >= CURRENT_DATE
      AND is_active = true
      ORDER BY start_date ASC
    `;
    
    const result = await safeQuery(challengesQuery);
    
    const challenges = result.rows.length > 0 ? result.rows : [
      {
        id: '1',
        title: 'Speed Demon Challenge',
        description: 'Improve your 40-yard dash time by 0.3 seconds this month',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        participants_count: 23,
        reward_points: 500,
        challenge_type: 'speed'
      },
      {
        id: '2',
        title: 'Team Player Award',
        description: 'Complete 10 team training sessions this month',
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        participants_count: 18,
        reward_points: 300,
        challenge_type: 'team'
      }
    ];
    
    res.json({ success: true, data: challenges });
  } catch (error) {
    console.error('Challenges error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch challenges',
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
    
    await pool.query('SELECT 1');
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: safeFormatDate(new Date()),
      database: 'connected'
    });
  } catch (error) {
    console.error('Community routes health check error:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      message: 'Database connection failed',
      timestamp: safeFormatDate(new Date())
    });
  }
});

export default router;