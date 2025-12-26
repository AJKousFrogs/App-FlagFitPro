// Netlify Function: Nutrition API
// Handles nutrition tracking, food search, meals, and AI suggestions

const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

/**
 * Search USDA FoodData Central database
 * Note: In production, this would integrate with USDA API
 * For now, returns mock data based on query
 */
async function searchUSDAFoods(query) {
  // TODO: Integrate with USDA FoodData Central API
  // For now, return mock data
  const mockFoods = [
    {
      fdcId: 1001,
      description: `${query} - Raw`,
      foodCategory: "Vegetables",
      energy: 25,
      protein: 2,
      carbohydrates: 5,
      fat: 0.2,
      fiber: 2,
      sugars: 3,
      sodium: 5,
      calcium: 20,
      iron: 0.5,
      vitaminC: 10,
    },
    {
      fdcId: 1002,
      description: `${query} - Cooked`,
      foodCategory: "Vegetables",
      energy: 35,
      protein: 2.5,
      carbohydrates: 7,
      fat: 0.3,
      fiber: 2.5,
      sugars: 4,
      sodium: 8,
      calcium: 25,
      iron: 0.6,
      vitaminC: 8,
    },
  ];

  return mockFoods.filter((food) =>
    food.description.toLowerCase().includes(query.toLowerCase()),
  );
}

/**
 * Get user's nutrition goals
 */
async function getNutritionGoals(userId) {
  try {
    // Try to get from database, fallback to defaults
    const { data, error } = await supabaseAdmin
      .from("user_nutrition_goals")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching nutrition goals:", error);
    }

    if (data) {
      return data.goals || getDefaultGoals();
    }

    return getDefaultGoals();
  } catch (error) {
    console.error("Error in getNutritionGoals:", error);
    return getDefaultGoals();
  }
}

/**
 * Get default nutrition goals
 */
function getDefaultGoals() {
  return [
    {
      nutrient: "Calories",
      current: 0,
      target: 2500,
      unit: "kcal",
      priority: "high",
    },
    {
      nutrient: "Protein",
      current: 0,
      target: 150,
      unit: "g",
      priority: "high",
    },
    {
      nutrient: "Carbohydrates",
      current: 0,
      target: 300,
      unit: "g",
      priority: "medium",
    },
    { nutrient: "Fat", current: 0, target: 80, unit: "g", priority: "medium" },
    {
      nutrient: "Fiber",
      current: 0,
      target: 30,
      unit: "g",
      priority: "medium",
    },
    {
      nutrient: "Sodium",
      current: 0,
      target: 2300,
      unit: "mg",
      priority: "low",
    },
  ];
}

/**
 * Get today's meals for user
 */
async function getTodaysMeals(userId) {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("timestamp", `${today}T00:00:00`)
      .lte("timestamp", `${today}T23:59:59`)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching meals:", error);
      return [];
    }

    // Group by meal type
    const meals = [];
    const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

    mealTypes.forEach((type) => {
      const mealFoods = (data || []).filter((log) => log.meal_type === type);
      if (mealFoods.length > 0) {
        meals.push({
          id: `${type}-${today}`,
          type: type,
          timestamp: new Date(mealFoods[0].timestamp),
          foods: mealFoods.map((f) => ({
            name: f.food_name,
            amount: f.amount,
            unit: f.unit,
            calories: f.calories || 0,
            nutrients: f.nutrients || {},
          })),
          totalCalories: mealFoods.reduce(
            (sum, f) => sum + (f.calories || 0),
            0,
          ),
        });
      }
    });

    return meals;
  } catch (error) {
    console.error("Error in getTodaysMeals:", error);
    return [];
  }
}

/**
 * Add food to user's meal
 */
async function addFoodToMeal(userId, foodData) {
  try {
    const { food, mealType, amount, unit } = foodData;

    // Calculate calories and nutrients
    const calories = food.energy || (food.calories || 0) * (amount || 1);

    const { data: _data, error } = await supabaseAdmin
      .from("nutrition_logs")
      .insert({
        user_id: userId,
        food_name: food.description || food.name,
        meal_type: mealType || "snack",
        amount: amount || 1,
        unit: unit || "serving",
        calories: calories,
        nutrients: {
          protein: food.protein || 0,
          carbohydrates: food.carbohydrates || 0,
          fat: food.fat || 0,
          fiber: food.fiber || 0,
          sodium: food.sodium || 0,
        },
        timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding food:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in addFoodToMeal:", error);
    return false;
  }
}

/**
 * Generate AI nutrition suggestions
 */
async function getAINutritionSuggestions(userId) {
  try {
    // Get user's recent meals and goals
    const goals = await getNutritionGoals(userId);
    const meals = await getTodaysMeals(userId);

    const _totalCalories = meals.reduce(
      (sum, meal) => sum + (meal.totalCalories || 0),
      0,
    );
    const proteinGoal =
      goals.find((g) => g.nutrient === "Protein")?.target || 150;
    const currentProtein = meals.reduce((sum, meal) => {
      return (
        sum + meal.foods.reduce((s, f) => s + (f.nutrients?.protein || 0), 0)
      );
    }, 0);

    const suggestions = [];

    // Check protein intake
    if (currentProtein < proteinGoal * 0.7) {
      suggestions.push({
        name: "Increase Protein Intake",
        benefit: `You're at ${Math.round(currentProtein)}g protein. Aim for ${proteinGoal}g to support muscle recovery.`,
        priority: "high",
      });
    }

    // Check meal timing
    if (meals.length < 3) {
      suggestions.push({
        name: "Add More Meals",
        benefit:
          "Eating 4-5 smaller meals helps maintain energy levels throughout the day.",
        priority: "medium",
      });
    }

    // Check hydration (if we had hydration data)
    suggestions.push({
      name: "Stay Hydrated",
      benefit:
        "Drink water throughout the day, especially around training sessions.",
      priority: "medium",
    });

    return suggestions;
  } catch (error) {
    console.error("Error generating AI suggestions:", error);
    return [];
  }
}

/**
 * Get performance insights based on nutrition
 */
async function getPerformanceInsights(userId) {
  try {
    // Get recent training performance and nutrition data
    const { data: sessions } = await supabaseAdmin
      .from("training_sessions")
      .select("score, session_date, completed_at")
      .eq("user_id", userId)
      .order("session_date", { ascending: false })
      .limit(10);

    const meals = await getTodaysMeals(userId);
    const _goals = await getNutritionGoals(userId);

    const insights = [];

    // Analyze performance trends
    if (sessions && sessions.length > 0) {
      const avgScore =
        sessions.reduce((sum, s) => sum + (s.score || 70), 0) / sessions.length;

      if (avgScore < 75) {
        insights.push({
          title: "Performance Below Average",
          message: `Your average training score is ${Math.round(avgScore)}. Consider reviewing your nutrition timing around workouts.`,
          type: "warning",
          actionable: true,
        });
      }
    }

    // Check meal timing
    const hasPreWorkoutMeal = meals.some((m) => {
      const mealTime = new Date(m.timestamp);
      const now = new Date();
      const hoursDiff = (now - mealTime) / (1000 * 60 * 60);
      return hoursDiff >= 1 && hoursDiff <= 3; // Meal 1-3 hours before
    });

    if (!hasPreWorkoutMeal && meals.length > 0) {
      insights.push({
        title: "Pre-Workout Nutrition",
        message:
          "Consider eating a meal 1-3 hours before training for optimal performance.",
        type: "info",
        actionable: true,
      });
    }

    return insights;
  } catch (error) {
    console.error("Error getting performance insights:", error);
    return [];
  }
}

/**
 * Main handler function
 */
async function handleRequest(event, context, { userId }) {
  const { path, httpMethod, queryStringParameters, body } = event;

  // Extract endpoint from path
  // Netlify redirects /api/nutrition/search-foods to /.netlify/functions/nutrition
  // Try to extract from original path or use query parameter
  let endpoint = null;

  // Method 1: Check if path contains /api/nutrition/ (original path preserved)
  const apiNutritionMatch = path.match(/\/api\/nutrition\/([^\/\?]+)/);
  if (apiNutritionMatch) {
    endpoint = apiNutritionMatch[1];
  }

  // Method 2: Extract from path segments if nutrition is in path
  if (!endpoint) {
    const pathSegments = path.split("/").filter(Boolean);
    const nutritionIndex = pathSegments.indexOf("nutrition");
    if (nutritionIndex >= 0 && pathSegments.length > nutritionIndex + 1) {
      endpoint = pathSegments[nutritionIndex + 1];
    }
  }

  // Method 3: Use query parameter as fallback
  if (!endpoint) {
    endpoint = queryStringParameters?.endpoint || null;
  }

  try {
    let requestBody = {};
    if (body) {
      try {
        requestBody = JSON.parse(body);
      } catch (_e) {
        // Body might not be JSON
      }
    }

    switch (endpoint) {
      case "search-foods":
        if (httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const query = queryStringParameters?.query || "";
        const foods = await searchUSDAFoods(query);
        return createSuccessResponse(foods);

      case "add-food":
        if (httpMethod !== "POST") {
          return createErrorResponse("Method not allowed", 405);
        }
        const added = await addFoodToMeal(userId, requestBody);
        return createSuccessResponse(added);

      case "goals":
        if (httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const goals = await getNutritionGoals(userId);
        return createSuccessResponse(goals);

      case "meals":
        if (httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const meals = await getTodaysMeals(userId);
        return createSuccessResponse(meals);

      case "ai-suggestions":
        if (httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const suggestions = await getAINutritionSuggestions(userId);
        return createSuccessResponse(suggestions);

      case "performance-insights":
        if (httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const insights = await getPerformanceInsights(userId);
        return createSuccessResponse(insights);

      default:
        return createErrorResponse(`Endpoint not found: ${endpoint}`, 404);
    }
  } catch (error) {
    console.error("Error in nutrition handler:", error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "Nutrition",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: handleRequest,
  });
};
