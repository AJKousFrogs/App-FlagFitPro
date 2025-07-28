import { DataSource } from 'apollo-datasource';
import NutritionService from '../../services/NutritionService.js';

class NutritionAPI extends DataSource {
  constructor({ database }) {
    super();
    this.db = database;
    this.nutritionService = new NutritionService(database);
  }

  initialize(config) {
    this.context = config.context;
  }

  async getNutritionTargets(userId) {
    try {
      const query = `
        SELECT * FROM user_nutrition_targets 
        WHERE user_id = $1 
          AND start_date <= CURRENT_DATE 
          AND (end_date IS NULL OR end_date >= CURRENT_DATE)
        ORDER BY start_date DESC 
        LIMIT 1
      `;
      
      const result = await this.db.query(query, [userId]);
      
      if (result.rows.length === 0) {
        // Generate and save default targets
        const targets = await NutritionService.calculateNutritionTargets(userId);
        return await NutritionService.saveNutritionTargets(userId, null, targets);
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error getting nutrition targets:', error);
      throw error;
    }
  }

  async getDailyNutritionSummary(userId, date) {
    return await NutritionService.getDailyNutritionSummary(userId, date);
  }

  async searchFoodItems(searchTerm, category, limit) {
    return await NutritionService.searchFoodItems(searchTerm, category, limit);
  }

  async getMealTemplates({ mealType, targetCalories, userId }) {
    try {
      let query = `
        SELECT 
          mt.*,
          CASE 
            WHEN $3 IS NOT NULL AND mt.total_calories BETWEEN $3 * 0.8 AND $3 * 1.2 THEN 10
            WHEN $3 IS NOT NULL AND mt.total_calories BETWEEN $3 * 0.6 AND $3 * 1.4 THEN 8
            ELSE 5
          END as calorie_match_score
        FROM meal_templates mt
        WHERE (is_public = true OR is_team_template = true)
      `;
      
      const params = [];
      let paramCount = 0;

      if (mealType) {
        paramCount++;
        query += ` AND meal_type = $${paramCount}`;
        params.push(mealType);
      }

      paramCount++;
      params.push(userId); // For user context (not used in WHERE but for future features)
      
      paramCount++;
      params.push(targetCalories);

      query += ` ORDER BY 
        (calorie_match_score + performance_rating) DESC,
        total_calories ASC
        LIMIT 20
      `;

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting meal templates:', error);
      throw error;
    }
  }

  async getUserMeals(userId, startDate, endDate) {
    try {
      const query = `
        SELECT * FROM user_meals
        WHERE user_id = $1 AND date BETWEEN $2 AND $3
        ORDER BY date DESC, meal_time DESC
      `;
      
      const result = await this.db.query(query, [userId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user meals:', error);
      throw error;
    }
  }

  async logMeal(mealData) {
    // First get food items with their nutritional data
    const foodItems = await Promise.all(
      mealData.foods.map(async (food) => {
        const foodQuery = `SELECT * FROM food_items WHERE id = $1`;
        const result = await this.db.query(foodQuery, [food.foodItemId]);
        return {
          ...result.rows[0],
          quantity: food.quantity,
          serving_description: food.servingDescription,
          food_item_id: food.foodItemId
        };
      })
    );

    const enrichedMealData = {
      ...mealData,
      foods: foodItems
    };

    return await NutritionService.logMeal(enrichedMealData);
  }

  async getUserMeal(mealId) {
    try {
      const query = `SELECT * FROM user_meals WHERE id = $1`;
      const result = await this.db.query(query, [mealId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting user meal:', error);
      throw error;
    }
  }

  async updateMeal(mealId, mealData) {
    try {
      // Get food items with nutritional data
      const foodItems = await Promise.all(
        mealData.foods.map(async (food) => {
          const foodQuery = `SELECT * FROM food_items WHERE id = $1`;
          const result = await this.db.query(foodQuery, [food.foodItemId]);
          return {
            ...result.rows[0],
            quantity: food.quantity,
            serving_description: food.servingDescription,
            food_item_id: food.foodItemId
          };
        })
      );

      // Calculate total nutrition
      let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
      for (const food of foodItems) {
        const multiplier = food.quantity / 100;
        totalCalories += food.calories_per_100g * multiplier;
        totalProtein += food.protein_per_100g * multiplier;
        totalCarbs += food.carbs_per_100g * multiplier;
        totalFat += food.fat_per_100g * multiplier;
      }

      // Update meal
      const updateQuery = `
        UPDATE user_meals SET
          date = $2, meal_type = $3, meal_time = $4,
          total_calories = $5, total_protein = $6, total_carbs = $7, total_fat = $8,
          satisfaction_rating = $9, energy_level_after = $10, notes = $11,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await this.db.query(updateQuery, [
        mealId, mealData.date, mealData.mealType, mealData.mealTime,
        totalCalories.toFixed(2), totalProtein.toFixed(2), 
        totalCarbs.toFixed(2), totalFat.toFixed(2),
        mealData.satisfactionRating, mealData.energyLevelAfter, mealData.notes
      ]);

      // Delete existing food items and insert new ones
      await this.db.query('DELETE FROM user_meal_foods WHERE user_meal_id = $1', [mealId]);
      
      for (const food of foodItems) {
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

      return result.rows[0];
    } catch (error) {
      console.error('Error updating meal:', error);
      throw error;
    }
  }

  async deleteMeal(mealId) {
    try {
      const query = `DELETE FROM user_meals WHERE id = $1`;
      await this.db.query(query, [mealId]);
      return true;
    } catch (error) {
      console.error('Error deleting meal:', error);
      return false;
    }
  }

  async logHydration(hydrationData) {
    try {
      const query = `
        INSERT INTO user_hydration (
          user_id, date, timestamp, amount_ml, beverage_type, logged_via
        ) VALUES ($1, $2::date, $3, $4, $5, $6)
        RETURNING *
      `;

      await this.db.query(query, [
        hydrationData.userId,
        hydrationData.timestamp,
        hydrationData.timestamp,
        hydrationData.amountMl,
        hydrationData.beverageType,
        hydrationData.loggedVia
      ]);

      return true;
    } catch (error) {
      console.error('Error logging hydration:', error);
      return false;
    }
  }

  async getFoodItem(foodItemId) {
    try {
      const query = `SELECT * FROM food_items WHERE id = $1`;
      const result = await this.db.query(query, [foodItemId]);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting food item:', error);
      throw error;
    }
  }

  async getMealFoods(mealId) {
    try {
      const query = `
        SELECT umf.*, fi.*
        FROM user_meal_foods umf
        JOIN food_items fi ON fi.id = umf.food_item_id
        WHERE umf.user_meal_id = $1
        ORDER BY umf.created_at
      `;
      
      const result = await this.db.query(query, [mealId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting meal foods:', error);
      throw error;
    }
  }

  async getMealTemplateIngredients(templateId) {
    try {
      const query = `
        SELECT mti.quantity, mti.serving_description, fi.*
        FROM meal_template_ingredients mti
        JOIN food_items fi ON fi.id = mti.food_item_id
        WHERE mti.meal_template_id = $1
        ORDER BY mti.order_index
      `;
      
      const result = await this.db.query(query, [templateId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting meal template ingredients:', error);
      throw error;
    }
  }

  async getTeamMealTemplates(teamId) {
    try {
      const query = `
        SELECT * FROM meal_templates
        WHERE team_id = $1 OR (is_public = true AND team_id IS NULL)
        ORDER BY performance_rating DESC, name ASC
      `;
      
      const result = await this.db.query(query, [teamId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting team meal templates:', error);
      throw error;
    }
  }
}

export default NutritionAPI;