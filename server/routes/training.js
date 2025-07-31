/**
 * Training Routes
 * Handles training sessions, exercises, and performance data
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import db from '../config/database.js';

const router = express.Router();

// Get user's training sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const sessions = await db.getUserTrainingSessions(req.user.id, parseInt(limit));
    
    res.json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get training sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training sessions'
    });
  }
});

// Create new training session
router.post('/sessions', authenticateToken, [
  body('sessionType').trim().isLength({ min: 1 }),
  body('duration').isInt({ min: 1 }),
  body('exercises').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { sessionType, duration, exercises, notes } = req.body;
    
    const sessionData = {
      userId: req.user.id,
      sessionType,
      duration,
      exercises,
      notes: notes || ''
    };

    const newSession = await db.createTrainingSession(sessionData);

    // Log analytics event
    await db.logAnalyticsEvent({
      userId: req.user.id,
      eventType: 'training_session_created',
      eventData: { 
        sessionType, 
        duration, 
        exerciseCount: exercises.length 
      },
      sessionId: req.headers['x-session-id'] || 'unknown',
      pageUrl: req.headers.referer || '',
      userAgent: req.headers['user-agent'] || ''
    });

    res.status(201).json({
      success: true,
      message: 'Training session created successfully',
      data: newSession
    });
  } catch (error) {
    console.error('Create training session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create training session'
    });
  }
});

// Get training categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.query`
      SELECT 
        id,
        name,
        description,
        difficulty_level,
        equipment_needed,
        focus_areas,
        estimated_duration
      FROM enhanced_training_categories
      WHERE is_active = true
      ORDER BY display_order, name
    `;

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get training categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training categories'
    });
  }
});

// Get training programs
router.get('/programs', async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    
    let programs = [];
    
    if (type === 'isometrics' || type === 'all') {
      const isometricPrograms = await db.query`
        SELECT 
          id,
          program_name as name,
          description,
          difficulty_level,
          duration_weeks,
          sessions_per_week,
          'isometrics' as type
        FROM isometrics_training_programs
        WHERE is_active = true
      `;
      programs = [...programs, ...isometricPrograms];
    }

    if (type === 'plyometrics' || type === 'all') {
      const plyometricPrograms = await db.query`
        SELECT 
          id,
          program_name as name,
          description,
          difficulty_level,
          duration_weeks,
          sessions_per_week,
          'plyometrics' as type
        FROM plyometrics_training_programs
        WHERE is_active = true
      `;
      programs = [...programs, ...plyometricPrograms];
    }

    res.json({
      success: true,
      data: programs
    });
  } catch (error) {
    console.error('Get training programs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch training programs'
    });
  }
});

// Get exercises
router.get('/exercises', async (req, res) => {
  try {
    const { type, difficulty, category } = req.query;
    
    let exercises = [];
    
    // Get isometric exercises
    if (!type || type === 'isometrics') {
      const isometricExercises = await db.query`
        SELECT 
          id,
          exercise_name as name,
          description,
          primary_muscles,
          secondary_muscles,
          equipment_needed,
          difficulty_level,
          hold_duration_seconds,
          sets_recommended,
          'isometrics' as type
        FROM isometrics_exercises
        WHERE is_active = true
        ${difficulty ? db.query`AND difficulty_level = ${difficulty}` : db.query``}
        ORDER BY exercise_name
      `;
      exercises = [...exercises, ...isometricExercises];
    }
    
    // Get plyometric exercises
    if (!type || type === 'plyometrics') {
      const plyometricExercises = await db.query`
        SELECT 
          id,
          exercise_name as name,
          description,
          primary_muscles,
          equipment_needed,
          difficulty_level,
          'plyometrics' as type
        FROM plyometrics_exercises
        WHERE is_active = true
        ${difficulty ? db.query`AND difficulty_level = ${difficulty}` : db.query``}
        ORDER BY exercise_name
      `;
      exercises = [...exercises, ...plyometricExercises];
    }

    res.json({
      success: true,
      data: exercises
    });
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exercises'
    });
  }
});

// Get AI coach recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    // Get user's recent training history
    const recentSessions = await db.getUserTrainingSessions(req.user.id, 10);
    
    // Get AI coach knowledge for recommendations
    const coachKnowledge = await db.query`
      SELECT 
        knowledge_type,
        content,
        confidence_score
      FROM ai_coach_knowledge
      WHERE knowledge_type IN ('training_recommendation', 'exercise_progression')
      ORDER BY confidence_score DESC
      LIMIT 5
    `;

    // Simple recommendation logic (in a real app, this would be more sophisticated)
    const recommendations = {
      nextSession: {
        type: 'agility',
        duration: 30,
        focus: 'footwork and speed',
        reason: 'Based on your recent training patterns'
      },
      exercises: [
        {
          name: 'Cone Drills',
          type: 'agility',
          difficulty: 'intermediate',
          duration: 10
        },
        {
          name: 'Sprint Intervals',
          type: 'speed',
          difficulty: 'intermediate',
          duration: 15
        }
      ],
      recovery: {
        needed: recentSessions.length > 3,
        type: 'active recovery',
        duration: 20
      }
    };

    res.json({
      success: true,
      data: {
        recommendations,
        basedOnSessions: recentSessions.length,
        coachInsights: coachKnowledge
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations'
    });
  }
});

// Get performance analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Get training analytics for the user
    const analytics = await db.query`
      SELECT 
        training_type,
        COUNT(*) as session_count,
        AVG(duration_minutes) as avg_duration,
        AVG(performance_score) as avg_performance,
        MAX(performance_score) as best_performance
      FROM training_analytics
      WHERE user_id = ${req.user.id}
        AND created_at >= NOW() - INTERVAL '${period === '7d' ? '7 days' : '30 days'}'
      GROUP BY training_type
      ORDER BY session_count DESC
    `;

    // Get recent performance trends
    const trends = await db.query`
      SELECT 
        DATE(created_at) as date,
        AVG(performance_score) as avg_score,
        COUNT(*) as sessions
      FROM training_analytics
      WHERE user_id = ${req.user.id}
        AND created_at >= NOW() - INTERVAL '${period === '7d' ? '7 days' : '30 days'}'
      GROUP BY DATE(created_at)
      ORDER BY date
    `;

    res.json({
      success: true,
      data: {
        summary: analytics,
        trends: trends,
        period: period
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

export default router;