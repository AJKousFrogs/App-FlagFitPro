
import UserModel from '../database/models/User.js';

class NutritionService {
  constructor(database) {
    this.db = database;
  }

  // Validate userId to prevent SQL injection
  static validateUserId(userId) {
    // Ensure userId is a positive integer
    const parsed = parseInt(userId, 10);
    if (isNaN(parsed) || parsed <= 0 || parsed > 2147483647) {
      throw new Error('Invalid user ID');
    }
    return parsed;
  }

  // Calculate personalized nutrition targets based on user profile and training
  static async calculateNutritionTargets(userId) {
    try {
      // Validate userId before using in queries
      userId = this.validateUserId(userId);

      const user = await UserModel.findById(userId);
      if (!user) throw new Error('User not found');

      // Get user's physical stats and training data
      const userStats = await this.db.query(`
        SELECT
          height_cm, weight_kg, body_fat_percentage, position,
          birth_date, gender
        FROM users
        WHERE id = $1
      `, [userId]);

      const trainingLoad = await this.db.query(`
        SELECT 
          AVG(duration_minutes) as avg_duration,
          AVG(intensity_level::numeric) as avg_intensity,
          COUNT(*) as sessions_per_week
        FROM training_sessions 
        WHERE user_id = $1 
          AND session_date >= CURRENT_DATE - INTERVAL '7 days'
      `, [userId]);

      const { height_cm, weight_kg, position, birth_date, gender } = userStats.rows[0];
      const { sessions_per_week } = trainingLoad.rows[0] || {};

      // Calculate age
      const age = Math.floor((Date.now() - new Date(birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      // Calculate BMR using Mifflin-St Jeor equation with strategy pattern
      const bmr = this.calculateBMR(weight_kg, height_cm, age, gender);

      // Activity factor using data-driven approach
      const { ActivityLevelCalculator } = require('../utils/RuleEngine');
      const activityLevel = ActivityLevelCalculator.getActivityLevel(sessions_per_week);
      const activityFactor = activityLevel.multiplier;

      // Position-specific adjustments using centralized config
      const { POSITION_MULTIPLIERS } = require('../config/thresholds');
      const positionData = POSITION_MULTIPLIERS[position];
      const positionMultiplier = positionData ? positionData.nutrition : 1.0;
      const dailyCalories = Math.round(bmr * activityFactor * positionMultiplier);

      // Macronutrient distribution for athletes
      const proteinGrams = Math.round(weight_kg * 1.6); // 1.6g per kg bodyweight
      const proteinCalories = proteinGrams * 4;
      
      const fatPercentage = 0.25; // 25% of calories from fat
      const fatCalories = dailyCalories * fatPercentage;
      const fatGrams = Math.round(fatCalories / 9);
      
      const carbCalories = dailyCalories - proteinCalories - fatCalories;
      const carbGrams = Math.round(carbCalories / 4);

      // Training day adjustments
      const trainingDayBonus = Math.round(dailyCalories * 0.15); // 15% more calories
      const trainingDayCarbBonus = Math.round(trainingDayBonus / 4); // mostly carbs

      const nutritionTargets = {
        daily_calories_target: dailyCalories,
        daily_calories_min: Math.round(dailyCalories * 0.9),
        daily_calories_max: Math.round(dailyCalories * 1.2),
        protein_target: proteinGrams,
        carbs_target: carbGrams,
        fat_target: fatGrams,
        fiber_target: 25 + Math.round(dailyCalories / 1000 * 10), // 35g per 2000 calories
        water_target: Math.max(2.5, weight_kg * 0.035), // 35ml per kg bodyweight
        training_day_calorie_bonus: trainingDayBonus,
        training_day_carb_bonus: trainingDayCarbBonus,
        calculated_by: 'ai_recommendation'
      };

      return nutritionTargets;
    } catch (error) {
      console.error('Error calculating nutrition targets:', error);
      throw error;
    }
  }

  // Save nutrition targets for a user
  static async saveNutritionTargets(userId, teamId, targets, goal = 'peak_performance') {
    try {
      // Validate user and team IDs
      userId = this.validateUserId(userId);
      teamId = this.validateUserId(teamId);

      const query = `
        INSERT INTO user_nutrition_targets (
          user_id, team_id, start_date, daily_calories_target, daily_calories_min,
          daily_calories_max, protein_target, carbs_target, fat_target, 
          fiber_target, water_target, training_day_calorie_bonus, 
          training_day_carb_bonus, goal, calculated_by
        ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (user_id, start_date) DO UPDATE SET
          daily_calories_target = EXCLUDED.daily_calories_target,
          daily_calories_min = EXCLUDED.daily_calories_min,
          daily_calories_max = EXCLUDED.daily_calories_max,
          protein_target = EXCLUDED.protein_target,
          carbs_target = EXCLUDED.carbs_target,
          fat_target = EXCLUDED.fat_target,
          fiber_target = EXCLUDED.fiber_target,
          water_target = EXCLUDED.water_target,
          training_day_calorie_bonus = EXCLUDED.training_day_calorie_bonus,
          training_day_carb_bonus = EXCLUDED.training_day_carb_bonus,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;

      const result = await this.db.query(query, [
        userId, teamId, targets.daily_calories_target, targets.daily_calories_min,
        targets.daily_calories_max, targets.protein_target, targets.carbs_target,
        targets.fat_target, targets.fiber_target, targets.water_target,
        targets.training_day_calorie_bonus, targets.training_day_carb_bonus,
        goal, targets.calculated_by
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error saving nutrition targets:', error);
      throw error;
    }
  }

  // Log a meal for a user
  static async logMeal(mealData) {
    try {
      const {
        userId, teamId, date, mealType, mealTime, foods, 
        trainingSessionId, satisfactionRating, energyLevelAfter, notes, loggedVia
      } = mealData;

      // Calculate total nutrition from foods
      let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;

      for (const food of foods) {
        const multiplier = food.quantity / 100; // convert from per 100g
        totalCalories += food.calories_per_100g * multiplier;
        totalProtein += food.protein_per_100g * multiplier;
        totalCarbs += food.carbs_per_100g * multiplier;
        totalFat += food.fat_per_100g * multiplier;
      }

      // Insert meal
      const mealQuery = `
        INSERT INTO user_meals (
          user_id, team_id, date, meal_type, meal_time, total_calories,
          total_protein, total_carbs, total_fat, training_session_id,
          satisfaction_rating, energy_level_after, notes, logged_via
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const mealResult = await this.db.query(mealQuery, [
        userId, teamId, date, mealType, mealTime, totalCalories.toFixed(2),
        totalProtein.toFixed(2), totalCarbs.toFixed(2), totalFat.toFixed(2),
        trainingSessionId, satisfactionRating, energyLevelAfter, notes, loggedVia
      ]);

      const mealId = mealResult.rows[0].id;

      // Insert individual foods
      for (const food of foods) {
        const multiplier = food.quantity / 100;
        await this.db.query(`
          INSERT INTO user_meal_foods (
            user_meal_id, food_item_id, quantity, serving_description,
            calories, protein, carbs, fat
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          mealId, food.food_item_id, food.quantity, food.serving_description,
          (food.calories_per_100g * multiplier).toFixed(2),
          (food.protein_per_100g * multiplier).toFixed(2),
          (food.carbs_per_100g * multiplier).toFixed(2),
          (food.fat_per_100g * multiplier).toFixed(2)
        ]);
      }

      return mealResult.rows[0];
    } catch (error) {
      console.error('Error logging meal:', error);
      throw error;
    }
  }

  // Get daily nutrition summary
  static async getDailyNutritionSummary(userId, date) {
    try {
      // Validate userId
      userId = this.validateUserId(userId);

      const query = `
        SELECT 
          COUNT(*) as meals_logged,
          SUM(total_calories) as total_calories,
          SUM(total_protein) as total_protein,
          SUM(total_carbs) as total_carbs,
          SUM(total_fat) as total_fat,
          AVG(satisfaction_rating) as avg_satisfaction,
          AVG(energy_level_after) as avg_energy_level
        FROM user_meals 
        WHERE user_id = $1 AND date = $2
      `;

      const nutritionResult = await this.db.query(query, [userId, date]);

      // Get hydration data
      const hydrationQuery = `
        SELECT SUM(amount_ml) as total_water_ml
        FROM user_hydration 
        WHERE user_id = $1 AND date = $2
      `;

      const hydrationResult = await this.db.query(hydrationQuery, [userId, date]);

      // Get targets
      const targetsQuery = `
        SELECT * FROM user_nutrition_targets 
        WHERE user_id = $1 
          AND start_date <= $2 
          AND (end_date IS NULL OR end_date >= $2)
        ORDER BY start_date DESC 
        LIMIT 1
      `;

      const targetsResult = await this.db.query(targetsQuery, [userId, date]);

      const nutrition = nutritionResult.rows[0];
      const hydration = hydrationResult.rows[0];
      const targets = targetsResult.rows[0];

      return {
        date,
        nutrition: {
          calories: parseFloat(nutrition.total_calories) || 0,
          protein: parseFloat(nutrition.total_protein) || 0,
          carbs: parseFloat(nutrition.total_carbs) || 0,
          fat: parseFloat(nutrition.total_fat) || 0,
          meals_logged: parseInt(nutrition.meals_logged) || 0,
          avg_satisfaction: parseFloat(nutrition.avg_satisfaction) || null,
          avg_energy_level: parseFloat(nutrition.avg_energy_level) || null
        },
        hydration: {
          total_water_ml: parseInt(hydration.total_water_ml) || 0,
          total_water_liters: (parseInt(hydration.total_water_ml) || 0) / 1000
        },
        targets: targets || null,
        compliance: targets ? {
          calories_percentage: (parseFloat(nutrition.total_calories) || 0) / targets.daily_calories_target * 100,
          protein_percentage: (parseFloat(nutrition.total_protein) || 0) / targets.protein_target * 100,
          carbs_percentage: (parseFloat(nutrition.total_carbs) || 0) / targets.carbs_target * 100,
          fat_percentage: (parseFloat(nutrition.total_fat) || 0) / targets.fat_target * 100,
          water_percentage: ((parseInt(hydration.total_water_ml) || 0) / 1000) / targets.water_target * 100
        } : null
      };
    } catch (error) {
      console.error('Error getting daily nutrition summary:', error);
      throw error;
    }
  }

  // Generate meal recommendations based on targets and preferences
  static async generateMealRecommendations(userId, mealType, targetCalories, dietaryRestrictions = []) {
    try {
      // Validate userId
      userId = this.validateUserId(userId);

      // Get user's position for position-specific recommendations
      const userQuery = `SELECT position FROM users WHERE id = $1`;
      const userResult = await this.db.query(userQuery, [userId]);
      const position = userResult.rows[0]?.position;

      // Build base query for meal templates
      let restrictionFilter = '';
      if (dietaryRestrictions.length > 0) {
        restrictionFilter = `AND NOT tags && $3`;
      }

      const query = `
        SELECT 
          mt.*,
          CASE 
            WHEN mt.total_calories BETWEEN $2 * 0.8 AND $2 * 1.2 THEN 10
            WHEN mt.total_calories BETWEEN $2 * 0.6 AND $2 * 1.4 THEN 8
            ELSE 5
          END as calorie_match_score,
          CASE 
            WHEN $4 = ANY(string_to_array(COALESCE(array_to_string(tags, ','), ''), ',')) THEN 5
            ELSE 0
          END as position_bonus
        FROM meal_templates mt
        WHERE meal_type = $1 
          AND (is_public = true OR is_team_template = true)
          ${restrictionFilter}
        ORDER BY 
          (calorie_match_score + position_bonus + performance_rating) DESC,
          total_calories ASC
        LIMIT 10
      `;

      const params = [mealType, targetCalories];
      if (restrictionFilter) params.push(dietaryRestrictions);
      params.push(position?.toLowerCase());

      const result = await this.db.query(query, params);

      // Enhance recommendations with timing and context
      const recommendations = result.rows.map(template => ({
        ...template,
        recommendation_reason: this.generateRecommendationReason(template, targetCalories, position),
        timing_guidance: this.getTimingGuidance(mealType),
        calorie_match: this.getCalorieMatchRating(template.total_calories, targetCalories)
      }));

      return recommendations;
    } catch (error) {
      console.error('Error generating meal recommendations:', error);
      throw error;
    }
  }

  static generateRecommendationReason(template, targetCalories, position) {
    const reasons = [];
    
    if (Math.abs(template.total_calories - targetCalories) <= targetCalories * 0.1) {
      reasons.push('Perfect calorie match');
    }
    
    if (template.performance_rating >= 4) {
      reasons.push('High performance rating');
    }
    
    if (position && template.tags?.includes(position.toLowerCase())) {
      reasons.push(`Optimized for ${position} position`);
    }
    
    if (template.suitable_for_training_day) {
      reasons.push('Great for training days');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Good nutritional balance';
  }

  static getTimingGuidance(mealType) {
    const guidance = {
      'pre_workout': 'Eat 2-3 hours before training for optimal energy',
      'post_workout': 'Consume within 30 minutes after training for recovery',
      'breakfast': 'Start your day with balanced nutrition',
      'lunch': 'Midday fuel to maintain energy levels',
      'dinner': 'Recovery-focused evening meal',
      'snack': 'Quick energy boost between meals'
    };
    
    return guidance[mealType] || 'Enjoy as part of your balanced diet';
  }

  static getCalorieMatchRating(templateCalories, targetCalories) {
    // Use CalorieMatchEvaluator with guard clauses
    const { CalorieMatchEvaluator } = require('../utils/RuleEngine');
    const evaluation = CalorieMatchEvaluator.evaluate(templateCalories, targetCalories);
    return evaluation.rating;
  }

  // BMR calculation strategy - polymorphic approach
  static calculateBMR(weight_kg, height_cm, age, gender) {
    // Guard clause for invalid inputs
    if (!weight_kg || !height_cm || !age) {
      throw new Error('Invalid input for BMR calculation');
    }

    // Base calculation
    const baseCalc = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);

    // Gender-specific adjustment using guard clause pattern
    if (gender === 'male') return baseCalc + 5;
    if (gender === 'female') return baseCalc - 161;

    // Default to male if gender not specified
    return baseCalc + 5;
  }

  // Search for food items in database
  static async searchFoodItems(searchTerm, category = null, limit = 20) {
    try {
      let query = `
        SELECT 
          id, name, brand, category, calories_per_100g, protein_per_100g,
          carbs_per_100g, fat_per_100g, default_serving_size, 
          default_serving_description, performance_category
        FROM food_items 
        WHERE (
          name ILIKE $1 
          OR brand ILIKE $1
          OR $1 = ANY(string_to_array(name, ' '))
        )
      `;
      
      const params = [`%${searchTerm}%`];
      
      if (category) {
        query += ` AND category = $${params.length + 1}`;
        params.push(category);
      }
      
      query += ` ORDER BY 
        CASE WHEN name ILIKE $1 THEN 1 ELSE 2 END,
        verification_score DESC,
        name ASC
        LIMIT $${params.length + 1}
      `;
      
      params.push(limit);

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error searching food items:', error);
      throw error;
    }
  }
}

module.exports = NutritionService;