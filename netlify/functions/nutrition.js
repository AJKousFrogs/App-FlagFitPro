import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: Nutrition API
// Handles nutrition calculations, meal planning, and athlete nutrition profiles
//
// Implements evidence-based nutrition calculations:
// - BMR (Basal Metabolic Rate) using Mifflin-St Jeor equation
// - TDEE (Total Daily Energy Expenditure) with activity multipliers
// - Macro calculations based on goals (performance, cutting, bulking)
// - Sport-specific nutrition recommendations for flag football
//
// =============================================================================

import { baseHandler } from "./utils/base-handler.js";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { supabaseAdmin } from "./utils/supabase-client.js";

// =============================================================================
// NUTRITION CALCULATION CONSTANTS
// =============================================================================

// Activity level multipliers for TDEE calculation
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2, // Little or no exercise
  light: 1.375, // Light exercise 1-3 days/week
  moderate: 1.55, // Moderate exercise 3-5 days/week
  active: 1.725, // Hard exercise 6-7 days/week
  very_active: 1.9, // Very hard exercise, physical job, or 2x training
  athlete: 2.0, // Professional athlete, intense daily training
};

// Macro ratios by goal (as percentage of total calories)
const MACRO_RATIOS = {
  performance: {
    protein: 0.25, // 25% - Support muscle recovery and performance
    carbs: 0.5, // 50% - Primary fuel for high-intensity activity
    fat: 0.25, // 25% - Hormone production and satiety
  },
  cutting: {
    protein: 0.35, // 35% - Preserve muscle during deficit
    carbs: 0.35, // 35% - Maintain training performance
    fat: 0.3, // 30% - Satiety and hormone function
  },
  bulking: {
    protein: 0.25, // 25% - Support muscle growth
    carbs: 0.55, // 55% - Fuel intense training and recovery
    fat: 0.2, // 20% - Essential fats
  },
  maintenance: {
    protein: 0.25, // 25% - Standard athletic protein
    carbs: 0.5, // 50% - Energy for activity
    fat: 0.25, // 25% - Balanced fat intake
  },
  endurance: {
    protein: 0.2, // 20% - Lower protein needs
    carbs: 0.6, // 60% - High carb for endurance
    fat: 0.2, // 20% - Essential fats
  },
  aggressive_cut: {
    protein: 0.35, // mirrors cutting ratio with larger calorie deficit
    carbs: 0.35,
    fat: 0.3,
  },
  aggressive_bulk: {
    protein: 0.25, // mirrors bulking ratio with larger calorie surplus
    carbs: 0.55,
    fat: 0.2,
  },
};

// Calorie adjustments by goal
const CALORIE_ADJUSTMENTS = {
  performance: 0, // Maintain current weight
  cutting: -500, // ~1 lb/week loss
  aggressive_cut: -750, // ~1.5 lb/week loss (not recommended long-term)
  bulking: 300, // Lean bulk
  aggressive_bulk: 500, // Faster muscle gain (more fat gain risk)
  maintenance: 0, // No change
};

// Protein per kg body weight by goal
const PROTEIN_PER_KG = {
  sedentary: 0.8, // RDA minimum
  light: 1.2, // Light activity
  moderate: 1.4, // Moderate activity
  active: 1.6, // Active individuals
  athlete: 1.8, // Athletes
  cutting: 2.0, // Higher protein when cutting
  bulking: 1.8, // Muscle building
};

const NUTRITION_PLAN_FORBIDDEN_FIELDS = new Set([
  "id",
  "user_id",
  "is_active",
  "created_at",
  "updated_at",
]);
const VALID_SEXES = new Set(["male", "female"]);
const VALID_ACTIVITY_LEVELS = new Set(Object.keys(ACTIVITY_MULTIPLIERS));
const VALID_GOALS = new Set(Object.keys(CALORIE_ADJUSTMENTS));
const VALID_TRAINING_TIMES = new Set(["morning", "afternoon", "evening"]);

function createValidationError(message) {
  const error = new Error(message);
  error.isValidation = true;
  return error;
}

function parseOptionalBoundedInt(value, { min, max, field }) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const normalized = String(value).trim();
  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`${field} must be an integer between ${min} and ${max}`);
  }
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${field} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

function parseOptionalBoundedFloat(value, { min, max, field }) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const normalized = String(value).trim();
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) {
    throw createValidationError(`${field} must be a number between ${min} and ${max}`);
  }
  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw createValidationError(`${field} must be a number between ${min} and ${max}`);
  }
  return parsed;
}

function parseBooleanQuery(value, field) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  throw createValidationError(`${field} must be true or false`);
}

function parseJsonObjectBody(rawBody) {
  let parsed;
  try {
    parsed = JSON.parse(rawBody || "{}");
  } catch {
    const error = new Error("Invalid JSON body");
    error.code = "invalid_json";
    throw error;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw createValidationError("Request body must be an object");
  }
  return parsed;
}

function normalizeNutritionInputs(input) {
  const weightKg = parseOptionalBoundedFloat(input.weightKg, {
    min: 20,
    max: 300,
    field: "weightKg",
  });
  const heightCm = parseOptionalBoundedFloat(input.heightCm, {
    min: 100,
    max: 260,
    field: "heightCm",
  });
  const age = parseOptionalBoundedFloat(input.age, {
    min: 8,
    max: 100,
    field: "age",
  });

  const normalizedSex = String(input.sex || "")
    .trim()
    .toLowerCase();

  if (
    weightKg === undefined ||
    heightCm === undefined ||
    age === undefined ||
    normalizedSex.length === 0
  ) {
    throw createValidationError(
      "Missing required fields: weightKg, heightCm, age, sex",
    );
  }

  if (!VALID_SEXES.has(normalizedSex)) {
    throw createValidationError("sex must be one of: male, female");
  }

  const activityLevel = input.activityLevel ?? "moderate";
  if (!VALID_ACTIVITY_LEVELS.has(activityLevel)) {
    throw createValidationError(
      `activityLevel must be one of: ${Array.from(VALID_ACTIVITY_LEVELS).join(", ")}`,
    );
  }

  const goal = input.goal ?? "performance";
  if (!VALID_GOALS.has(goal)) {
    throw createValidationError(
      `goal must be one of: ${Array.from(VALID_GOALS).join(", ")}`,
    );
  }

  const trainingTime = input.trainingTime ?? "afternoon";
  if (!VALID_TRAINING_TIMES.has(trainingTime)) {
    throw createValidationError(
      `trainingTime must be one of: ${Array.from(VALID_TRAINING_TIMES).join(", ")}`,
    );
  }

  const isTrainingDay =
    input.isTrainingDay === undefined ? true : input.isTrainingDay;
  if (typeof isTrainingDay !== "boolean") {
    throw createValidationError("isTrainingDay must be a boolean");
  }

  return {
    weightKg,
    heightCm,
    age,
    sex: normalizedSex,
    activityLevel,
    goal,
    trainingTime,
    isTrainingDay,
  };
}

// =============================================================================
// CALCULATION FUNCTIONS
// =============================================================================

/**
 * Calculate BMR using Mifflin-St Jeor equation
 * More accurate than Harris-Benedict for modern populations
 *
 * @param {number} weightKg - Weight in kilograms
 * @param {number} heightCm - Height in centimeters
 * @param {number} age - Age in years
 * @param {string} sex - 'male' or 'female'
 * @returns {number} BMR in calories/day
 */
function calculateBMR(weightKg, heightCm, age, sex) {
  // Mifflin-St Jeor Equation
  // Men: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5
  // Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161

  const baseBMR = 10 * weightKg + 6.25 * heightCm - 5 * age;

  if (sex === "male") {
    return Math.round(baseBMR + 5);
  } else {
    return Math.round(baseBMR - 161);
  }
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 *
 * @param {number} bmr - Basal Metabolic Rate
 * @param {string} activityLevel - Activity level key
 * @returns {number} TDEE in calories/day
 */
function calculateTDEE(bmr, activityLevel) {
  const multiplier =
    ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.moderate;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate target calories based on goal
 *
 * @param {number} tdee - Total Daily Energy Expenditure
 * @param {string} goal - Nutrition goal
 * @returns {number} Target calories/day
 */
function calculateTargetCalories(tdee, goal) {
  const adjustment = CALORIE_ADJUSTMENTS[goal] || 0;
  return Math.round(tdee + adjustment);
}

/**
 * Calculate macro targets in grams
 *
 * @param {number} targetCalories - Daily calorie target
 * @param {number} weightKg - Body weight in kg
 * @param {string} goal - Nutrition goal
 * @param {string} activityLevel - Activity level
 * @returns {Object} Macro targets in grams
 */
function calculateMacros(targetCalories, weightKg, goal, activityLevel) {
  const ratios = MACRO_RATIOS[goal] || MACRO_RATIOS.maintenance;

  // Calculate protein based on body weight (more accurate for athletes)
  let proteinPerKg = PROTEIN_PER_KG[activityLevel] || PROTEIN_PER_KG.moderate;

  // Adjust protein for cutting (higher) or endurance (lower)
  if (goal === "cutting" || goal === "aggressive_cut") {
    proteinPerKg = Math.max(proteinPerKg, PROTEIN_PER_KG.cutting);
  }

  // Calculate protein in grams
  const proteinGrams = Math.round(weightKg * proteinPerKg);
  const proteinCalories = proteinGrams * 4; // 4 cal/g

  // Remaining calories split between carbs and fat
  const remainingCalories = targetCalories - proteinCalories;

  // Adjust carb/fat ratio based on goal
  const carbRatio = ratios.carbs / (ratios.carbs + ratios.fat);
  const fatRatio = ratios.fat / (ratios.carbs + ratios.fat);

  const carbCalories = remainingCalories * carbRatio;
  const fatCalories = remainingCalories * fatRatio;

  const carbGrams = Math.round(carbCalories / 4); // 4 cal/g
  const fatGrams = Math.round(fatCalories / 9); // 9 cal/g

  return {
    protein: {
      grams: proteinGrams,
      calories: proteinCalories,
      percentage: Math.round((proteinCalories / targetCalories) * 100),
    },
    carbs: {
      grams: carbGrams,
      calories: Math.round(carbCalories),
      percentage: Math.round((carbCalories / targetCalories) * 100),
    },
    fat: {
      grams: fatGrams,
      calories: Math.round(fatCalories),
      percentage: Math.round((fatCalories / targetCalories) * 100),
    },
    fiber: {
      // Recommended fiber: 14g per 1000 calories
      grams: Math.round((targetCalories / 1000) * 14),
      note: "14g per 1000 calories",
    },
  };
}

/**
 * Calculate hydration needs
 *
 * @param {number} weightKg - Body weight in kg
 * @param {string} activityLevel - Activity level
 * @param {boolean} isTrainingDay - Whether it's a training day
 * @returns {Object} Hydration recommendations
 */
function calculateHydration(weightKg, activityLevel, isTrainingDay = false) {
  // Base: 30-35ml per kg body weight
  let baseWaterMl = weightKg * 33;

  // Add for activity level
  const activityAddition = {
    sedentary: 0,
    light: 250,
    moderate: 500,
    active: 750,
    very_active: 1000,
    athlete: 1250,
  };

  baseWaterMl += activityAddition[activityLevel] || 500;

  // Add for training days
  if (isTrainingDay) {
    baseWaterMl += 500; // Extra 500ml on training days
  }

  return {
    dailyWaterMl: Math.round(baseWaterMl),
    dailyWaterOz: Math.round(baseWaterMl / 29.5735),
    dailyWaterLiters: (baseWaterMl / 1000).toFixed(1),
    duringExercise: "150-250ml every 15-20 minutes",
    postExercise: "500-750ml per 0.5kg body weight lost",
    electrolytes:
      activityLevel === "athlete" || activityLevel === "very_active"
        ? "Consider electrolyte supplementation for sessions >60 minutes"
        : "Water is sufficient for most activities",
  };
}

/**
 * Generate meal timing recommendations for flag football
 *
 * @param {number} targetCalories - Daily calorie target
 * @param {Object} macros - Macro targets
 * @param {string} trainingTime - Preferred training time (morning, afternoon, evening)
 * @returns {Object} Meal timing recommendations
 */
function generateMealTiming(
  targetCalories,
  macros,
  trainingTime = "afternoon",
) {
  const mealDistribution = {
    morning: {
      breakfast: { percent: 25, timing: "7:00 AM" },
      preworkout: {
        percent: 15,
        timing: "9:00 AM",
        note: "Light, carb-focused",
      },
      postworkout: { percent: 20, timing: "11:30 AM", note: "Protein + carbs" },
      lunch: { percent: 20, timing: "1:00 PM" },
      dinner: { percent: 20, timing: "6:00 PM" },
    },
    afternoon: {
      breakfast: { percent: 25, timing: "7:00 AM" },
      lunch: { percent: 25, timing: "12:00 PM" },
      preworkout: { percent: 10, timing: "3:00 PM", note: "Light snack" },
      postworkout: { percent: 20, timing: "5:30 PM", note: "Protein + carbs" },
      dinner: { percent: 20, timing: "7:30 PM" },
    },
    evening: {
      breakfast: { percent: 25, timing: "7:00 AM" },
      lunch: { percent: 30, timing: "12:00 PM" },
      preworkout: { percent: 15, timing: "5:00 PM", note: "Moderate meal" },
      postworkout: { percent: 20, timing: "8:00 PM", note: "Protein-focused" },
      snack: { percent: 10, timing: "9:30 PM", note: "Casein/slow protein" },
    },
  };

  const distribution =
    mealDistribution[trainingTime] || mealDistribution.afternoon;

  const meals = {};
  for (const [meal, data] of Object.entries(distribution)) {
    meals[meal] = {
      ...data,
      calories: Math.round(targetCalories * (data.percent / 100)),
      protein: Math.round(macros.protein.grams * (data.percent / 100)),
      carbs: Math.round(macros.carbs.grams * (data.percent / 100)),
      fat: Math.round(macros.fat.grams * (data.percent / 100)),
    };
  }

  return {
    meals,
    generalGuidelines: [
      "Eat protein with every meal (20-40g)",
      "Consume carbs around training for energy",
      "Pre-workout: 2-3 hours before for full meal, 30-60 min for snack",
      "Post-workout: Consume protein within 2 hours",
      "Spread protein intake throughout the day",
    ],
    flagFootballSpecific: [
      "Higher carbs on game days for explosive movements",
      "Extra sodium on hot days to replace sweat losses",
      "Caffeine 30-60 min pre-game can enhance performance",
      "Avoid high-fat meals within 2 hours of play",
    ],
  };
}

/**
 * Calculate full nutrition profile for an athlete
 */
function calculateNutritionProfile(athleteData) {
  const {
    weightKg,
    heightCm,
    age,
    sex,
    activityLevel,
    goal,
    trainingTime,
    isTrainingDay,
  } = normalizeNutritionInputs(athleteData || {});

  // Calculate BMR
  const bmr = calculateBMR(weightKg, heightCm, age, sex);

  // Calculate TDEE
  const tdee = calculateTDEE(bmr, activityLevel);

  // Calculate target calories
  const targetCalories = calculateTargetCalories(tdee, goal);

  // Calculate macros
  const macros = calculateMacros(targetCalories, weightKg, goal, activityLevel);

  // Calculate hydration
  const hydration = calculateHydration(weightKg, activityLevel, isTrainingDay);

  // Generate meal timing
  const mealTiming = generateMealTiming(targetCalories, macros, trainingTime);

  return {
    calculations: {
      bmr,
      tdee,
      targetCalories,
      calorieAdjustment: CALORIE_ADJUSTMENTS[goal] || 0,
    },
    macros,
    hydration,
    mealTiming,
    inputs: {
      weightKg,
      heightCm,
      age,
      sex,
      activityLevel,
      goal,
    },
    methodology: {
      bmrEquation: "Mifflin-St Jeor",
      activityMultiplier: ACTIVITY_MULTIPLIERS[activityLevel],
      proteinPerKg: PROTEIN_PER_KG[activityLevel],
    },
    disclaimer:
      "These calculations are estimates. Individual needs may vary. Consult a registered dietitian for personalized advice.",
  };
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Get or create athlete nutrition profile
 */
async function getAthleteNutritionProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from("athlete_nutrition_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

/**
 * Save athlete nutrition profile
 */
async function saveAthleteNutritionProfile(userId, profileData) {
  const { data, error } = await supabaseAdmin
    .from("athlete_nutrition_profiles")
    .upsert(
      {
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}

/**
 * Get user's nutrition plan
 */
async function getNutritionPlan(userId) {
  const { data, error } = await supabaseAdmin
    .from("nutrition_plans")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

/**
 * Create or update nutrition plan
 */
async function saveNutritionPlan(userId, planData) {
  const sanitizedPlanData = { ...(planData || {}) };
  for (const field of NUTRITION_PLAN_FORBIDDEN_FIELDS) {
    delete sanitizedPlanData[field];
  }

  // Deactivate existing plans
  await supabaseAdmin
    .from("nutrition_plans")
    .update({ is_active: false })
    .eq("user_id", userId);

  const { data, error } = await supabaseAdmin
    .from("nutrition_plans")
    .insert({
      user_id: userId,
      ...sanitizedPlanData,
      is_active: true,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}

/**
 * Get meal templates
 */
async function getMealTemplates(filters = {}) {
  let query = supabaseAdmin
    .from("meal_templates")
    .select("*")
    .eq("is_active", true);

  if (filters.category) {
    query = query.eq("category", filters.category);
  }
  if (filters.mealType) {
    query = query.eq("meal_type", filters.mealType);
  }
  if (filters.maxCalories) {
    query = query.lte("calories", filters.maxCalories);
  }
  if (filters.minProtein) {
    query = query.gte("protein_g", filters.minProtein);
  }

  const { data, error } = await query.order("name");

  if (error) {
    throw error;
  }
  return data || [];
}

/**
 * Search USDA foods
 */
async function searchFoods(searchQuery, limit = 20) {
  const trimmedQuery = String(searchQuery || "").trim();
  if (!/^[a-zA-Z0-9\s\-']{1,100}$/.test(trimmedQuery)) {
    const error = new Error(
      "Search query can only include letters, numbers, spaces, apostrophes, and hyphens",
    );
    error.isValidation = true;
    throw error;
  }

  const safeLimit = Number.isInteger(limit) && limit > 0 && limit <= 100 ? limit : 20;

  const { data, error } = await supabaseAdmin
    .from("usda_foods")
    .select(
      "id, fdc_id, description, food_category, energy_kcal, protein_g, carbohydrates_g, fat_g, serving_size, serving_size_unit",
    )
    .or(
      `description.ilike.%${trimmedQuery}%,search_keywords.cs.{${trimmedQuery.toLowerCase()}}`,
    )
    .limit(safeLimit);

  if (error) {
    throw error;
  }
  return data || [];
}

// =============================================================================
// REQUEST HANDLER
// =============================================================================

async function handleRequest(event, _context, { userId }) {
  const path =
    event.path
      .replace("/.netlify/functions/nutrition", "")
      .replace(/^\/api\/nutrition\/?/, "")
      .replace(/^\//, "") || "";

  let body = {};
  if (event.body && ["POST", "PUT"].includes(event.httpMethod)) {
    try {
      body = parseJsonObjectBody(event.body);
    } catch (error) {
      if (error.code === "invalid_json") {
        return createErrorResponse("Invalid JSON body", 400, "invalid_json");
      }
      if (error.isValidation) {
        return createErrorResponse(error.message, 422, "validation_error");
      }
      return createErrorResponse("Invalid JSON body", 400, "invalid_json");
    }
  }

  try {
    // Calculate nutrition profile (no auth required for calculation)
    if (event.httpMethod === "POST" && path === "calculate") {
      const profile = calculateNutritionProfile(body);
      return createSuccessResponse(profile);
    }

    // Get athlete's saved nutrition profile
    if (event.httpMethod === "GET" && path === "profile") {
      const profile = await getAthleteNutritionProfile(userId);
      if (!profile) {
        return createSuccessResponse({
          exists: false,
          message:
            "No nutrition profile found. Create one with POST /nutrition/profile",
        });
      }
      return createSuccessResponse(profile);
    }

    // Save athlete nutrition profile
    if (event.httpMethod === "POST" && path === "profile") {
      // First calculate the full profile
      const calculatedProfile = calculateNutritionProfile(body);

      // Save to database
      const saved = await saveAthleteNutritionProfile(userId, {
        weight_kg: body.weightKg,
        height_cm: body.heightCm,
        age: body.age,
        sex: body.sex,
        activity_level: body.activityLevel,
        goal: body.goal,
        training_time: body.trainingTime,
        bmr: calculatedProfile.calculations.bmr,
        tdee: calculatedProfile.calculations.tdee,
        target_calories: calculatedProfile.calculations.targetCalories,
        protein_g: calculatedProfile.macros.protein.grams,
        carbs_g: calculatedProfile.macros.carbs.grams,
        fat_g: calculatedProfile.macros.fat.grams,
        calculated_profile: calculatedProfile,
      });

      return createSuccessResponse(
        {
          saved,
          profile: calculatedProfile,
        },
        201,
      );
    }

    // Get nutrition plan
    if (event.httpMethod === "GET" && path === "plan") {
      const plan = await getNutritionPlan(userId);
      if (!plan) {
        return createSuccessResponse({
          exists: false,
          message:
            "No active nutrition plan. Create one with POST /nutrition/plan",
        });
      }
      return createSuccessResponse(plan);
    }

    // Create nutrition plan
    if (event.httpMethod === "POST" && path === "plan") {
      const plan = await saveNutritionPlan(userId, body);
      return createSuccessResponse(plan, 201);
    }

    // Get meal templates
    if (event.httpMethod === "GET" && path === "meals") {
      const params = event.queryStringParameters || {};
      let maxCalories;
      let minProtein;
      try {
        maxCalories = parseOptionalBoundedInt(params.maxCalories, {
          min: 1,
          max: 10000,
          field: "maxCalories",
        });
        minProtein = parseOptionalBoundedInt(params.minProtein, {
          min: 0,
          max: 500,
          field: "minProtein",
        });
      } catch (validationError) {
        return createErrorResponse(
          validationError.message || "Invalid meals filter parameter",
          422,
          "validation_error",
        );
      }
      const meals = await getMealTemplates({
        category: params.category,
        mealType: params.mealType,
        maxCalories,
        minProtein,
      });
      return createSuccessResponse(meals);
    }

    // Search foods
    if (event.httpMethod === "GET" && path === "foods/search") {
      const params = event.queryStringParameters || {};
      if (!params.q) {
        return createErrorResponse(
          "Search query 'q' is required",
          400,
          "missing_query",
        );
      }
      let limit;
      try {
        limit = parseOptionalBoundedInt(params.limit, {
          min: 1,
          max: 100,
          field: "limit",
        });
      } catch (validationError) {
        return createErrorResponse(
          validationError.message || "limit must be an integer between 1 and 100",
          422,
          "validation_error",
        );
      }
      const foods = await searchFoods(params.q, limit ?? 20);
      return createSuccessResponse(foods);
    }

    // Get hydration recommendations
    if (event.httpMethod === "GET" && path === "hydration") {
      const params = event.queryStringParameters || {};
      try {
        const weightKg = parseOptionalBoundedFloat(params.weightKg, {
          min: 20,
          max: 300,
          field: "weightKg",
        });
        const activityLevel = params.activityLevel || "moderate";
        const parsedTrainingDay = parseBooleanQuery(
          params.trainingDay,
          "trainingDay",
        );
        const isTrainingDay = parsedTrainingDay ?? false;

        if (weightKg === undefined) {
          return createErrorResponse(
            "weightKg is required",
            422,
            "validation_error",
          );
        }
        if (!VALID_ACTIVITY_LEVELS.has(activityLevel)) {
          return createErrorResponse(
            `activityLevel must be one of: ${Array.from(VALID_ACTIVITY_LEVELS).join(", ")}`,
            422,
            "validation_error",
          );
        }

        const hydration = calculateHydration(
          weightKg,
          activityLevel,
          isTrainingDay,
        );
        return createSuccessResponse(hydration);
      } catch (validationError) {
        if (validationError.isValidation) {
          return createErrorResponse(
            validationError.message,
            422,
            "validation_error",
          );
        }
        throw validationError;
      }
    }

    // Get macro ratios reference
    if (event.httpMethod === "GET" && path === "macros/reference") {
      return createSuccessResponse({
        macroRatios: MACRO_RATIOS,
        activityMultipliers: ACTIVITY_MULTIPLIERS,
        proteinPerKg: PROTEIN_PER_KG,
        calorieAdjustments: CALORIE_ADJUSTMENTS,
      });
    }

    return createErrorResponse("Endpoint not found", 404, "not_found");
  } catch (error) {
    console.error("Nutrition API error:", error);
    if (error.isValidation) {
      return createErrorResponse(error.message, 422, "validation_error");
    }
    throw error;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

const handler = async (event, context) => {
  const isPublicPath =
    event.path.includes("/calculate") ||
    event.path.includes("/macros/reference");
  if (!isPublicPath) {
    return baseHandler(event, context, {
      functionName: "nutrition",
      allowedMethods: ["GET", "POST", "PUT"],
      rateLimitType: "DEFAULT",
      requireAuth: true,
      handler: handleRequest,
    });
  }
  return baseHandler(event, context, {
    functionName: "nutrition",
    allowedMethods: ["GET", "POST", "PUT"],
    rateLimitType: "DEFAULT",
    requireAuth: false,
    handler: handleRequest,
  });
};

// Export calculation functions for use in other modules
export { calculateBMR };

export { calculateTDEE };
export { calculateMacros };
export { calculateNutritionProfile };

export const testHandler = handler;
export default createRuntimeV2Handler(handler);
