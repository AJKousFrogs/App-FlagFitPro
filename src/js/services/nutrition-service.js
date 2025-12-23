/**
 * Nutrition Service
 * Handles nutrition tracking, food search, and AI suggestions via real Supabase connection
 */

import { apiClient } from "../../api-client.js";
import { logger } from "../../logger.js";
import { authManager } from "../../auth-manager.js";

class NutritionService {
  /**
   * Search for food items in the real database
   * @param {string} query - Search term
   * @returns {Promise<Array>} List of food items
   */
  async searchFoods(query) {
    try {
      const response = await apiClient.get("/api/nutrition/search-foods", { query });
      return response.data || [];
    } catch (error) {
      logger.error("[NutritionService] Error searching foods:", error);
      return [];
    }
  }

  /**
   * Add a food item to a user's meal log
   * @param {Object} foodData - Data for the food item being logged
   * @returns {Promise<boolean>} Success status
   */
  async logFood(foodData) {
    try {
      const response = await apiClient.post("/api/nutrition/add-food", foodData);
      return response.success;
    } catch (error) {
      logger.error("[NutritionService] Error logging food:", error);
      return false;
    }
  }

  /**
   * Get user's nutrition goals from Supabase
   * @returns {Promise<Array>} List of nutrition goals
   */
  async getGoals() {
    try {
      const response = await apiClient.get("/api/nutrition/goals");
      return response.data || [];
    } catch (error) {
      logger.error("[NutritionService] Error fetching goals:", error);
      return [];
    }
  }

  /**
   * Get today's meals logged by the user
   * @returns {Promise<Array>} List of today's meals
   */
  async getTodaysMeals() {
    try {
      const response = await apiClient.get("/api/nutrition/meals");
      return response.data || [];
    } catch (error) {
      logger.error("[NutritionService] Error fetching today's meals:", error);
      return [];
    }
  }

  /**
   * Get AI-generated nutrition suggestions based on real data
   * @returns {Promise<Array>} List of AI suggestions
   */
  async getAISuggestions() {
    try {
      const response = await apiClient.get("/api/nutrition/ai-suggestions");
      return response.data || [];
    } catch (error) {
      logger.error("[NutritionService] Error fetching AI suggestions:", error);
      return [];
    }
  }

  /**
   * Get performance insights based on nutrition and training data
   * @returns {Promise<Array>} List of performance insights
   */
  async getPerformanceInsights() {
    try {
      const response = await apiClient.get("/api/nutrition/performance-insights");
      return response.data || [];
    } catch (error) {
      logger.error("[NutritionService] Error fetching performance insights:", error);
      return [];
    }
  }
}

export const nutritionService = new NutritionService();
export default nutritionService;

