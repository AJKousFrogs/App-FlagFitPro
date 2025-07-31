/**
 * Nutrition Routes
 * Handles nutrition logging, meal planning, and dietary recommendations
 */

import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import db from '../config/database.js';

const router = express.Router();

// Get user's nutrition logs
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const { limit = 100, date } = req.query;
    
    let nutritionLogs;
    if (date) {
      nutritionLogs = await db.query`
        SELECT * FROM nutrition_logs 
        WHERE user_id = ${req.user.id}
          AND DATE(created_at) = ${date}
        ORDER BY created_at DESC
      `;
    } else {
      nutritionLogs = await db.getUserNutritionLogs(req.user.id, parseInt(limit));
    }

    res.json({
      success: true,
      data: nutritionLogs
    });
  } catch (error) {
    console.error('Get nutrition logs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nutrition logs'
    });
  }
});

// Create nutrition log entry
router.post('/logs', authenticateToken, [
  body('foodName').trim().isLength({ min: 1 }),
  body('calories').isFloat({ min: 0 }),
  body('protein').optional().isFloat({ min: 0 }),
  body('carbs').optional().isFloat({ min: 0 }),
  body('fat').optional().isFloat({ min: 0 }),
  body('mealType').isIn(['breakfast', 'lunch', 'dinner', 'snack'])
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

    const { foodName, calories, protein, carbs, fat, mealType, serving_size } = req.body;
    
    const logData = {
      userId: req.user.id,
      foodName,
      calories,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      mealType,
      serving_size: serving_size || '1 serving'
    };

    const nutritionLog = await db.createNutritionLog(logData);

    // Log analytics event
    await db.logAnalyticsEvent({
      userId: req.user.id,
      eventType: 'nutrition_logged',
      eventData: { 
        mealType, 
        calories,
        foodName
      },
      sessionId: req.headers['x-session-id'] || 'unknown',
      pageUrl: req.headers.referer || '',
      userAgent: req.headers['user-agent'] || ''
    });

    res.status(201).json({
      success: true,
      message: 'Nutrition logged successfully',
      data: nutritionLog
    });
  } catch (error) {
    console.error('Create nutrition log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log nutrition'
    });
  }
});

// Get food database
router.get('/foods', async (req, res) => {
  try {
    const { search, category, limit = 50 } = req.query;
    
    let foods;
    if (search) {
      foods = await db.query`
        SELECT 
          id,
          food_name,
          calories_per_100g,
          protein_per_100g,
          carbs_per_100g,
          fat_per_100g,
          category,
          brand
        FROM food_items
        WHERE food_name ILIKE ${'%' + search + '%'}
        ORDER BY food_name
        LIMIT ${parseInt(limit)}
      `;
    } else if (category) {
      foods = await db.query`
        SELECT 
          id,
          food_name,
          calories_per_100g,
          protein_per_100g,
          carbs_per_100g,
          fat_per_100g,
          category,
          brand
        FROM food_items
        WHERE category = ${category}
        ORDER BY food_name
        LIMIT ${parseInt(limit)}
      `;
    } else {
      foods = await db.query`
        SELECT 
          id,
          food_name,
          calories_per_100g,
          protein_per_100g,
          carbs_per_100g,
          fat_per_100g,
          category,
          brand
        FROM food_items
        ORDER BY food_name
        LIMIT ${parseInt(limit)}
      `;
    }

    res.json({
      success: true,
      data: foods
    });
  } catch (error) {
    console.error('Get foods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch foods'
    });
  }
});

// Get food categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.query`
      SELECT 
        id,
        category_name,
        description,
        color_code
      FROM food_categories
      WHERE is_active = true
      ORDER BY display_order, category_name
    `;

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get food categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch food categories'
    });
  }
});

// Get meal templates
router.get('/meal-templates', async (req, res) => {
  try {
    const { meal_type, goal } = req.query;
    
    let templates = await db.query`
      SELECT 
        mt.id,
        mt.template_name,
        mt.meal_type,
        mt.total_calories,
        mt.total_protein,
        mt.total_carbs,
        mt.total_fat,
        mt.description,
        mt.preparation_time,
        mt.difficulty_level
      FROM meal_templates mt
      WHERE mt.is_active = true
      ${meal_type ? db.query`AND mt.meal_type = ${meal_type}` : db.query``}
      ORDER BY mt.template_name
    `;

    // Get ingredients for each template
    for (let template of templates) {
      const ingredients = await db.query`
        SELECT 
          mti.quantity,
          mti.unit,
          fi.food_name,
          fi.calories_per_100g,
          fi.protein_per_100g,
          fi.carbs_per_100g,
          fi.fat_per_100g
        FROM meal_template_ingredients mti
        JOIN food_items fi ON mti.food_item_id = fi.id
        WHERE mti.meal_template_id = ${template.id}
        ORDER BY mti.display_order
      `;
      template.ingredients = ingredients;
    }

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get meal templates error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch meal templates'
    });
  }
});

// Get nutrition recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    // Get user's recent nutrition data
    const recentLogs = await db.getUserNutritionLogs(req.user.id, 30);
    
    // Calculate averages
    const totalCalories = recentLogs.reduce((sum, log) => sum + (log.calories || 0), 0);
    const totalProtein = recentLogs.reduce((sum, log) => sum + (log.protein || 0), 0);
    const totalCarbs = recentLogs.reduce((sum, log) => sum + (log.carbs || 0), 0);
    const totalFat = recentLogs.reduce((sum, log) => sum + (log.fat || 0), 0);
    
    const days = Math.max(1, Math.ceil(recentLogs.length / 3)); // Assume 3 meals per day
    const avgCalories = totalCalories / days;
    const avgProtein = totalProtein / days;
    const avgCarbs = totalCarbs / days;
    const avgFat = totalFat / days;

    // Basic recommendations (in a real app, this would be more sophisticated)
    const recommendations = {
      dailyTargets: {
        calories: 2500, // Should be calculated based on user profile
        protein: 150,   // ~1.5g per kg body weight
        carbs: 300,     // ~45-65% of calories
        fat: 85         // ~20-35% of calories
      },
      currentAverages: {
        calories: Math.round(avgCalories),
        protein: Math.round(avgProtein),
        carbs: Math.round(avgCarbs),
        fat: Math.round(avgFat)
      },
      suggestions: []
    };

    // Add suggestions based on gaps
    if (avgProtein < 120) {
      recommendations.suggestions.push({
        type: 'increase_protein',
        message: 'Consider adding more protein-rich foods like chicken, fish, or beans',
        priority: 'high'
      });
    }

    if (avgCalories < 2000) {
      recommendations.suggestions.push({
        type: 'increase_calories',
        message: 'Your calorie intake seems low for athletic performance',
        priority: 'medium'
      });
    }

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Get nutrition recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations'
    });
  }
});

// Get nutrition analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Get daily nutrition totals
    const dailyTotals = await db.query`
      SELECT 
        DATE(created_at) as date,
        SUM(calories) as total_calories,
        SUM(protein) as total_protein,
        SUM(carbs) as total_carbs,
        SUM(fat) as total_fat,
        COUNT(DISTINCT meal_type) as meals_logged
      FROM nutrition_logs
      WHERE user_id = ${req.user.id}
        AND created_at >= NOW() - INTERVAL '${period === '7d' ? '7 days' : '30 days'}'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Get meal type distribution
    const mealDistribution = await db.query`
      SELECT 
        meal_type,
        COUNT(*) as log_count,
        AVG(calories) as avg_calories
      FROM nutrition_logs
      WHERE user_id = ${req.user.id}
        AND created_at >= NOW() - INTERVAL '${period === '7d' ? '7 days' : '30 days'}'
      GROUP BY meal_type
      ORDER BY log_count DESC
    `;

    // Get top foods
    const topFoods = await db.query`
      SELECT 
        food_name,
        COUNT(*) as frequency,
        AVG(calories) as avg_calories
      FROM nutrition_logs
      WHERE user_id = ${req.user.id}
        AND created_at >= NOW() - INTERVAL '${period === '7d' ? '7 days' : '30 days'}'
      GROUP BY food_name
      ORDER BY frequency DESC
      LIMIT 10
    `;

    res.json({
      success: true,
      data: {
        dailyTotals,
        mealDistribution,
        topFoods,
        period
      }
    });
  } catch (error) {
    console.error('Get nutrition analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nutrition analytics'
    });
  }
});

export default router;