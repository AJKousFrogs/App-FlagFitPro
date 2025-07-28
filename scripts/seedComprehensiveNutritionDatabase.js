#!/usr/bin/env node

import dotenv from 'dotenv';
import pg from 'pg';
import fetch from 'node-fetch';

dotenv.config();
const { Pool } = pg;

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'flagfootball_dev',
  user: process.env.DB_USER || 'aljosaursakous',
  password: process.env.DB_PASSWORD || ''
};

// USDA FoodData Central API configuration
const USDA_API_KEY = process.env.USDA_API_KEY || 'DEMO_KEY';
const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

async function seedNutritionDatabase() {
  let db;
  
  try {
    console.log('🔌 Connecting to database...');
    db = new Pool(dbConfig);
    await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // First, seed nutrients table with comprehensive nutrient list
    await seedNutrients(db);
    
    // Seed food categories
    await seedFoodCategories(db);
    
    // Seed sports nutrition plans
    await seedNutritionPlans(db);
    
    // Seed meal templates
    await seedMealTemplates(db);
    
    // Seed supplements database
    await seedSupplements(db);
    
    // Seed food synergies
    await seedFoodSynergies(db);
    
    // Seed sample foods from USDA (if API key available)
    if (USDA_API_KEY !== 'DEMO_KEY') {
      await seedUSDAFoods(db);
    } else {
      await seedSampleFoods(db);
    }
    
    console.log('🎉 Nutrition database seeding completed successfully!');
    
  } catch (error) {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  } finally {
    if (db) {
      await db.end();
      console.log('🔌 Database connection closed');
    }
  }
}

async function seedNutrients(db) {
  console.log('🥗 Seeding nutrients table...');
  
  const nutrients = [
    // Macronutrients
    { number: '208', name: 'Energy', unit_name: 'kcal', performance_impact: 'energy', timing_importance: 'daily', athlete_focus_level: 'critical', nutrient_class: 'macronutrient', is_essential: true },
    { number: '203', name: 'Protein', unit_name: 'g', performance_impact: 'muscle_building', timing_importance: 'post_exercise', athlete_focus_level: 'critical', nutrient_class: 'macronutrient', is_essential: true },
    { number: '205', name: 'Carbohydrate, by difference', unit_name: 'g', performance_impact: 'energy', timing_importance: 'pre_exercise', athlete_focus_level: 'critical', nutrient_class: 'macronutrient', is_essential: true },
    { number: '204', name: 'Total lipid (fat)', unit_name: 'g', performance_impact: 'energy', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'macronutrient', is_essential: true },
    { number: '291', name: 'Fiber, total dietary', unit_name: 'g', performance_impact: 'recovery', timing_importance: 'daily', athlete_focus_level: 'moderate', nutrient_class: 'macronutrient', is_essential: false },
    
    // Vitamins
    { number: '318', name: 'Vitamin A, IU', unit_name: 'IU', performance_impact: 'immune', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'vitamin', is_essential: true },
    { number: '401', name: 'Vitamin C, total ascorbic acid', unit_name: 'mg', performance_impact: 'immune', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'vitamin', is_essential: true },
    { number: '328', name: 'Vitamin D (D2 + D3)', unit_name: 'µg', performance_impact: 'muscle_building', timing_importance: 'daily', athlete_focus_level: 'critical', nutrient_class: 'vitamin', is_essential: true },
    { number: '323', name: 'Vitamin E (alpha-tocopherol)', unit_name: 'mg', performance_impact: 'recovery', timing_importance: 'daily', athlete_focus_level: 'moderate', nutrient_class: 'vitamin', is_essential: true },
    { number: '430', name: 'Vitamin K (phylloquinone)', unit_name: 'µg', performance_impact: 'recovery', timing_importance: 'daily', athlete_focus_level: 'moderate', nutrient_class: 'vitamin', is_essential: true },
    
    // B Vitamins
    { number: '404', name: 'Thiamin', unit_name: 'mg', performance_impact: 'energy', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'vitamin', is_essential: true },
    { number: '405', name: 'Riboflavin', unit_name: 'mg', performance_impact: 'energy', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'vitamin', is_essential: true },
    { number: '406', name: 'Niacin', unit_name: 'mg', performance_impact: 'energy', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'vitamin', is_essential: true },
    { number: '415', name: 'Vitamin B-6', unit_name: 'mg', performance_impact: 'muscle_building', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'vitamin', is_essential: true },
    { number: '435', name: 'Folate, total', unit_name: 'µg', performance_impact: 'recovery', timing_importance: 'daily', athlete_focus_level: 'moderate', nutrient_class: 'vitamin', is_essential: true },
    { number: '418', name: 'Vitamin B-12', unit_name: 'µg', performance_impact: 'energy', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'vitamin', is_essential: true },
    
    // Minerals
    { number: '301', name: 'Calcium, Ca', unit_name: 'mg', performance_impact: 'muscle_building', timing_importance: 'daily', athlete_focus_level: 'critical', nutrient_class: 'mineral', is_essential: true },
    { number: '303', name: 'Iron, Fe', unit_name: 'mg', performance_impact: 'energy', timing_importance: 'daily', athlete_focus_level: 'critical', nutrient_class: 'mineral', is_essential: true },
    { number: '304', name: 'Magnesium, Mg', unit_name: 'mg', performance_impact: 'muscle_building', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'mineral', is_essential: true },
    { number: '305', name: 'Phosphorus, P', unit_name: 'mg', performance_impact: 'energy', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'mineral', is_essential: true },
    { number: '306', name: 'Potassium, K', unit_name: 'mg', performance_impact: 'hydration', timing_importance: 'daily', athlete_focus_level: 'critical', nutrient_class: 'mineral', is_essential: true },
    { number: '307', name: 'Sodium, Na', unit_name: 'mg', performance_impact: 'hydration', timing_importance: 'during_exercise', athlete_focus_level: 'critical', nutrient_class: 'mineral', is_essential: true },
    { number: '309', name: 'Zinc, Zn', unit_name: 'mg', performance_impact: 'immune', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'mineral', is_essential: true },
    
    // Amino Acids (Essential)
    { number: '501', name: 'Tryptophan', unit_name: 'g', performance_impact: 'recovery', timing_importance: 'daily', athlete_focus_level: 'moderate', nutrient_class: 'amino_acid', is_essential: true },
    { number: '502', name: 'Threonine', unit_name: 'g', performance_impact: 'muscle_building', timing_importance: 'post_exercise', athlete_focus_level: 'moderate', nutrient_class: 'amino_acid', is_essential: true },
    { number: '503', name: 'Isoleucine', unit_name: 'g', performance_impact: 'muscle_building', timing_importance: 'post_exercise', athlete_focus_level: 'important', nutrient_class: 'amino_acid', is_essential: true },
    { number: '504', name: 'Leucine', unit_name: 'g', performance_impact: 'muscle_building', timing_importance: 'post_exercise', athlete_focus_level: 'critical', nutrient_class: 'amino_acid', is_essential: true },
    { number: '505', name: 'Lysine', unit_name: 'g', performance_impact: 'muscle_building', timing_importance: 'post_exercise', athlete_focus_level: 'important', nutrient_class: 'amino_acid', is_essential: true },
    { number: '506', name: 'Methionine', unit_name: 'g', performance_impact: 'recovery', timing_importance: 'daily', athlete_focus_level: 'moderate', nutrient_class: 'amino_acid', is_essential: true },
    { number: '508', name: 'Phenylalanine', unit_name: 'g', performance_impact: 'muscle_building', timing_importance: 'post_exercise', athlete_focus_level: 'moderate', nutrient_class: 'amino_acid', is_essential: true },
    { number: '509', name: 'Valine', unit_name: 'g', performance_impact: 'muscle_building', timing_importance: 'post_exercise', athlete_focus_level: 'important', nutrient_class: 'amino_acid', is_essential: true },
    { number: '512', name: 'Arginine', unit_name: 'g', performance_impact: 'muscle_building', timing_importance: 'pre_exercise', athlete_focus_level: 'moderate', nutrient_class: 'amino_acid', is_essential: false },
    { number: '513', name: 'Histidine', unit_name: 'g', performance_impact: 'muscle_building', timing_importance: 'daily', athlete_focus_level: 'moderate', nutrient_class: 'amino_acid', is_essential: true },
    
    // Fatty Acids
    { number: '606', name: 'Fatty acids, total saturated', unit_name: 'g', performance_impact: 'energy', timing_importance: 'daily', athlete_focus_level: 'moderate', nutrient_class: 'fatty_acid', is_essential: false },
    { number: '645', name: 'Fatty acids, total monounsaturated', unit_name: 'g', performance_impact: 'recovery', timing_importance: 'daily', athlete_focus_level: 'moderate', nutrient_class: 'fatty_acid', is_essential: false },
    { number: '646', name: 'Fatty acids, total polyunsaturated', unit_name: 'g', performance_impact: 'recovery', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'fatty_acid', is_essential: true },
    { number: '851', name: 'Linoleic acid', unit_name: 'g', performance_impact: 'recovery', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'fatty_acid', is_essential: true },
    { number: '852', name: 'Alpha-linolenic acid (ALA)', unit_name: 'g', performance_impact: 'recovery', timing_importance: 'daily', athlete_focus_level: 'important', nutrient_class: 'fatty_acid', is_essential: true },
    
    // Other compounds
    { number: '262', name: 'Caffeine', unit_name: 'mg', performance_impact: 'energy', timing_importance: 'pre_exercise', athlete_focus_level: 'moderate', nutrient_class: 'other', is_essential: false },
    { number: '421', name: 'Choline, total', unit_name: 'mg', performance_impact: 'muscle_building', timing_importance: 'daily', athlete_focus_level: 'moderate', nutrient_class: 'other', is_essential: true }
  ];

  for (const nutrient of nutrients) {
    await db.query(`
      INSERT INTO nutrients (number, name, unit_name, performance_impact, timing_importance, athlete_focus_level, nutrient_class, is_essential, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (number) DO UPDATE SET
        name = EXCLUDED.name,
        unit_name = EXCLUDED.unit_name,
        performance_impact = EXCLUDED.performance_impact,
        timing_importance = EXCLUDED.timing_importance,
        athlete_focus_level = EXCLUDED.athlete_focus_level,
        nutrient_class = EXCLUDED.nutrient_class,
        is_essential = EXCLUDED.is_essential
    `, [
      nutrient.number,
      nutrient.name,
      nutrient.unit_name,
      nutrient.performance_impact,
      nutrient.timing_importance,
      nutrient.athlete_focus_level,
      nutrient.nutrient_class,
      nutrient.is_essential,
      `Essential ${nutrient.nutrient_class} for athletic performance, particularly important for ${nutrient.performance_impact}.`
    ]);
  }
  
  console.log(`   ✅ Seeded ${nutrients.length} nutrients`);
}

async function seedFoodCategories(db) {
  console.log('🏷️ Seeding food categories...');
  
  const categories = [
    { id: 1, code: 'PROT', description: 'Protein Foods', performance_category: 'protein', timing_category: 'post_workout' },
    { id: 2, code: 'CARB', description: 'Carbohydrate Foods', performance_category: 'energy', timing_category: 'pre_workout' },
    { id: 3, code: 'FRUIT', description: 'Fruits', performance_category: 'energy', timing_category: 'during_workout' },
    { id: 4, code: 'VEG', description: 'Vegetables', performance_category: 'recovery', timing_category: 'daily' },
    { id: 5, code: 'DAIRY', description: 'Dairy Products', performance_category: 'protein', timing_category: 'post_workout' },
    { id: 6, code: 'GRAIN', description: 'Grains and Cereals', performance_category: 'energy', timing_category: 'pre_workout' },
    { id: 7, code: 'NUTS', description: 'Nuts and Seeds', performance_category: 'recovery', timing_category: 'daily' },
    { id: 8, code: 'OILS', description: 'Fats and Oils', performance_category: 'recovery', timing_category: 'daily' },
    { id: 9, code: 'SPORTS', description: 'Sports Nutrition Products', performance_category: 'supplements', timing_category: 'during_workout' },
    { id: 10, code: 'HYDRAT', description: 'Hydration Products', performance_category: 'hydration', timing_category: 'during_workout' }
  ];

  for (const category of categories) {
    await db.query(`
      INSERT INTO food_categories (id, code, description, performance_category, timing_category)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        description = EXCLUDED.description,
        performance_category = EXCLUDED.performance_category,
        timing_category = EXCLUDED.timing_category
    `, [category.id, category.code, category.description, category.performance_category, category.timing_category]);
  }
  
  console.log(`   ✅ Seeded ${categories.length} food categories`);
}

async function seedNutritionPlans(db) {
  console.log('📋 Seeding nutrition plans...');
  
  const plans = [
    {
      name: 'Elite Flag Football Performance Plan',
      description: 'Comprehensive nutrition plan for competitive flag football players based on sports science research',
      sport_type: 'flag_football',
      athlete_level: 'elite',
      goal: 'performance',
      protein_g_per_kg: 2.2,
      carbs_g_per_kg: 6.5,
      fat_g_per_kg: 1.2,
      total_calories_per_kg: 45,
      fluid_ml_per_kg: 40,
      electrolyte_requirements: JSON.stringify({
        sodium_mg_per_hour: 600,
        potassium_mg_per_day: 4700,
        magnesium_mg_per_day: 420
      }),
      pre_exercise_timing: '3-4 hours before: High carb meal (1-4g/kg). 1 hour before: 30-60g carbs',
      during_exercise_timing: 'Every 15-20 minutes: 150-250ml sports drink containing 6-8% carbs',
      post_exercise_timing: 'Within 30 minutes: 1g/kg carbs + 0.3g/kg protein. 2 hours: Complete meal',
      recommended_supplements: JSON.stringify(['creatine_monohydrate', 'whey_protein', 'beta_alanine', 'caffeine']),
      research_source: 'ACSM Position Stand on Nutrition and Athletic Performance',
      evidence_level: 'high'
    },
    {
      name: 'Flag Football Weight Management Plan',
      description: 'Nutrition plan for flag football players looking to optimize body composition',
      sport_type: 'flag_football',
      athlete_level: 'competitive',
      goal: 'weight_loss',
      protein_g_per_kg: 2.5,
      carbs_g_per_kg: 4.0,
      fat_g_per_kg: 1.0,
      total_calories_per_kg: 35,
      fluid_ml_per_kg: 45,
      electrolyte_requirements: JSON.stringify({
        sodium_mg_per_hour: 500,
        potassium_mg_per_day: 4700,
        magnesium_mg_per_day: 400
      }),
      pre_exercise_timing: 'Focus on lean protein and complex carbs 2-3 hours before training',
      during_exercise_timing: 'Water for sessions <1 hour, diluted sports drink for longer sessions',
      post_exercise_timing: 'Prioritize protein within 30 minutes, moderate carbs based on next session timing',
      recommended_supplements: JSON.stringify(['whey_protein', 'bcaa', 'green_tea_extract', 'multivitamin']),
      research_source: 'International Society of Sports Nutrition Position Stand: Protein',
      evidence_level: 'high'
    },
    {
      name: 'Youth Flag Football Development Plan',
      description: 'Age-appropriate nutrition plan for young flag football athletes',
      sport_type: 'flag_football',
      athlete_level: 'youth',
      goal: 'development',
      protein_g_per_kg: 1.8,
      carbs_g_per_kg: 5.5,
      fat_g_per_kg: 1.5,
      total_calories_per_kg: 50,
      fluid_ml_per_kg: 50,
      electrolyte_requirements: JSON.stringify({
        sodium_mg_per_hour: 400,
        potassium_mg_per_day: 3500,
        magnesium_mg_per_day: 300
      }),
      pre_exercise_timing: 'Balanced meals with familiar foods 2-3 hours before play',
      during_exercise_timing: 'Water primarily, fruit juice diluted 50% for longer sessions',
      post_exercise_timing: 'Chocolate milk or similar recovery drink, followed by regular meal',
      recommended_supplements: JSON.stringify(['multivitamin', 'vitamin_d', 'calcium']),
      research_source: 'AAP Clinical Report: Sports Drinks and Energy Drinks for Children',
      evidence_level: 'moderate'
    }
  ];

  for (const plan of plans) {
    await db.query(`
      INSERT INTO nutrition_plans (
        name, description, sport_type, athlete_level, goal,
        protein_g_per_kg, carbs_g_per_kg, fat_g_per_kg, total_calories_per_kg,
        fluid_ml_per_kg, electrolyte_requirements, pre_exercise_timing,
        during_exercise_timing, post_exercise_timing, recommended_supplements,
        research_source, evidence_level, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      ON CONFLICT DO NOTHING
    `, [
      plan.name, plan.description, plan.sport_type, plan.athlete_level, plan.goal,
      plan.protein_g_per_kg, plan.carbs_g_per_kg, plan.fat_g_per_kg, plan.total_calories_per_kg,
      plan.fluid_ml_per_kg, plan.electrolyte_requirements, plan.pre_exercise_timing,
      plan.during_exercise_timing, plan.post_exercise_timing, plan.recommended_supplements,
      plan.research_source, plan.evidence_level, 'system'
    ]);
  }
  
  console.log(`   ✅ Seeded ${plans.length} nutrition plans`);
}

async function seedMealTemplates(db) {
  console.log('🍽️ Seeding meal templates...');
  
  // Get nutrition plan IDs
  const plansResult = await db.query('SELECT id, name FROM nutrition_plans LIMIT 3');
  const planIds = plansResult.rows.map(row => row.id);
  
  const mealTemplates = [
    {
      nutrition_plan_id: planIds[0],
      name: 'Pre-Game Power Breakfast',
      meal_type: 'breakfast',
      timing_relative_to_exercise: '-3h',
      protein_percentage: 20,
      carbs_percentage: 65,
      fat_percentage: 15,
      serving_size_description: 'Large portion to fuel 3-4 hours of energy',
      recommended_foods: JSON.stringify(['oatmeal', 'banana', 'honey', 'greek_yogurt', 'berries', 'almonds']),
      avoid_foods: JSON.stringify(['high_fiber_foods', 'spicy_foods', 'high_fat_foods']),
      preparation_time_minutes: 15,
      complexity_level: 'simple',
      portable: false
    },
    {
      nutrition_plan_id: planIds[0],
      name: 'Post-Workout Recovery Shake',
      meal_type: 'post_workout',
      timing_relative_to_exercise: '+30min',
      protein_percentage: 35,
      carbs_percentage: 55,
      fat_percentage: 10,
      serving_size_description: '16-20oz shake within 30 minutes post-exercise',
      recommended_foods: JSON.stringify(['whey_protein', 'banana', 'milk', 'honey', 'spinach']),
      avoid_foods: JSON.stringify(['high_fiber_additions', 'caffeine']),
      preparation_time_minutes: 5,
      complexity_level: 'simple',
      portable: true
    },
    {
      nutrition_plan_id: planIds[1],
      name: 'Lean Performance Lunch',
      meal_type: 'lunch',
      timing_relative_to_exercise: 'non_training_day',
      protein_percentage: 40,
      carbs_percentage: 35,
      fat_percentage: 25,
      serving_size_description: 'Moderate portion focused on lean protein',
      recommended_foods: JSON.stringify(['grilled_chicken', 'quinoa', 'mixed_vegetables', 'avocado', 'olive_oil']),
      avoid_foods: JSON.stringify(['processed_foods', 'sugary_drinks', 'fried_foods']),
      preparation_time_minutes: 25,
      complexity_level: 'moderate',
      portable: false
    }
  ];

  for (const template of mealTemplates) {
    await db.query(`
      INSERT INTO meal_templates (
        nutrition_plan_id, name, meal_type, timing_relative_to_exercise,
        protein_percentage, carbs_percentage, fat_percentage,
        serving_size_description, recommended_foods, avoid_foods,
        preparation_time_minutes, complexity_level, portable
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT DO NOTHING
    `, [
      template.nutrition_plan_id, template.name, template.meal_type, template.timing_relative_to_exercise,
      template.protein_percentage, template.carbs_percentage, template.fat_percentage,
      template.serving_size_description, template.recommended_foods, template.avoid_foods,
      template.preparation_time_minutes, template.complexity_level, template.portable
    ]);
  }
  
  console.log(`   ✅ Seeded ${mealTemplates.length} meal templates`);
}

async function seedSupplements(db) {
  console.log('💊 Seeding supplements database...');
  
  const supplements = [
    {
      name: 'Creatine Monohydrate',
      category: 'performance',
      subcategory: 'strength_power',
      active_ingredients: JSON.stringify({ creatine_monohydrate: '5g' }),
      serving_size: '5g (1 teaspoon)',
      servings_per_container: 60,
      evidence_level: 'strong',
      safety_rating: 'safe',
      banned_substance_risk: 'none',
      performance_benefits: JSON.stringify(['increased_power_output', 'improved_strength', 'enhanced_recovery_between_sets']),
      recommended_timing: 'daily, timing not critical',
      recommended_dosage: '3-5g daily, with or without loading phase',
      duration_of_use: 'ongoing during training periods',
      research_summary: 'Most researched sports supplement with consistent benefits for high-intensity, short-duration activities',
      key_studies: JSON.stringify(['Kreider et al. 2017 ISSN Position Stand', 'Antonio et al. 2021 meta-analysis']),
      brand: 'Various',
      third_party_tested: true
    },
    {
      name: 'Whey Protein Isolate',
      category: 'protein',
      subcategory: 'complete_protein',
      active_ingredients: JSON.stringify({ whey_protein_isolate: '25g', leucine: '2.5g' }),
      serving_size: '30g (1 scoop)',
      servings_per_container: 33,
      evidence_level: 'strong',
      safety_rating: 'safe',
      banned_substance_risk: 'none',
      performance_benefits: JSON.stringify(['muscle_protein_synthesis', 'recovery_enhancement', 'muscle_mass_maintenance']),
      recommended_timing: 'post-workout within 2 hours',
      recommended_dosage: '20-40g post-exercise, 1-2 servings daily',
      duration_of_use: 'ongoing',
      research_summary: 'High-quality complete protein with rapid absorption and high leucine content',
      key_studies: JSON.stringify(['Moore et al. 2014 protein dose-response', 'Devries & Phillips 2015 protein timing']),
      brand: 'Various',
      third_party_tested: true
    },
    {
      name: 'Beta-Alanine',
      category: 'performance',
      subcategory: 'endurance',
      active_ingredients: JSON.stringify({ beta_alanine: '3.2g' }),
      serving_size: '800mg (1/4 teaspoon)',
      servings_per_container: 125,
      evidence_level: 'moderate',
      safety_rating: 'safe',
      banned_substance_risk: 'none',
      performance_benefits: JSON.stringify(['reduced_muscle_fatigue', 'improved_high_intensity_endurance', 'delayed_neuromuscular_fatigue']),
      recommended_timing: 'divided doses throughout day with meals',
      recommended_dosage: '3.2-6.4g daily in divided doses',
      duration_of_use: '4+ weeks for adaptation, ongoing during training',
      side_effects: JSON.stringify(['harmless_tingling_sensation']),
      research_summary: 'Increases muscle carnosine levels, buffering acid accumulation during high-intensity exercise',
      key_studies: JSON.stringify(['Stellingwerff & Cox 2014 systematic review', 'Trexler et al. 2015 ISSN Position Stand']),
      brand: 'Various',
      third_party_tested: true
    },
    {
      name: 'Caffeine',
      category: 'performance',
      subcategory: 'stimulant',
      active_ingredients: JSON.stringify({ caffeine_anhydrous: '200mg' }),
      serving_size: '200mg (1 capsule)',
      servings_per_container: 100,
      evidence_level: 'strong',
      safety_rating: 'likely_safe',
      banned_substance_risk: 'low',
      performance_benefits: JSON.stringify(['increased_alertness', 'reduced_perceived_exertion', 'enhanced_fat_oxidation', 'improved_power_output']),
      recommended_timing: '30-60 minutes pre-exercise',
      recommended_dosage: '3-6mg/kg body weight (200-400mg for 70kg athlete)',
      duration_of_use: 'as needed, avoid daily use to prevent tolerance',
      side_effects: JSON.stringify(['jitters', 'anxiety', 'sleep_disruption_if_taken_late']),
      contraindications: JSON.stringify(['caffeine_sensitivity', 'anxiety_disorders', 'pregnancy']),
      research_summary: 'Well-established ergogenic aid with benefits across various exercise modalities',
      key_studies: JSON.stringify(['Grgic et al. 2019 meta-analysis', 'Ganio et al. 2009 systematic review']),
      brand: 'Various',
      third_party_tested: true
    }
  ];

  for (const supplement of supplements) {
    await db.query(`
      INSERT INTO supplements (
        name, category, subcategory, active_ingredients, serving_size, servings_per_container,
        evidence_level, safety_rating, banned_substance_risk, performance_benefits,
        recommended_timing, recommended_dosage, duration_of_use, side_effects,
        contraindications, research_summary, key_studies, brand, third_party_tested
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT DO NOTHING
    `, [
      supplement.name, supplement.category, supplement.subcategory, supplement.active_ingredients,
      supplement.serving_size, supplement.servings_per_container, supplement.evidence_level,
      supplement.safety_rating, supplement.banned_substance_risk, supplement.performance_benefits,
      supplement.recommended_timing, supplement.recommended_dosage, supplement.duration_of_use,
      supplement.side_effects || null, supplement.contraindications || null, supplement.research_summary,
      supplement.key_studies, supplement.brand, supplement.third_party_tested
    ]);
  }
  
  console.log(`   ✅ Seeded ${supplements.length} supplements`);
}

async function seedFoodSynergies(db) {
  console.log('🤝 Seeding food synergies...');
  
  // This would typically reference actual food IDs, but for demo we'll use placeholder logic
  const synergies = [
    {
      synergy_type: 'absorption_enhancement',
      benefit_description: 'Iron absorption enhanced by vitamin C',
      timing_importance: 'same_meal',
      research_source: 'Hurrell & Egli 2010 Iron bioavailability review',
      evidence_strength: 'strong'
    },
    {
      synergy_type: 'protein_completion',
      benefit_description: 'Complete amino acid profile when combining rice and beans',
      timing_importance: 'same_day',
      research_source: 'Young & Pellett 1994 Plant protein complementation',
      evidence_strength: 'strong'
    },
    {
      synergy_type: 'antioxidant_boost',
      benefit_description: 'Enhanced antioxidant activity combining berries with green tea',
      timing_importance: 'same_meal',
      research_source: 'Lambert & Yang 2003 Antioxidant synergy research',
      evidence_strength: 'moderate'
    }
  ];

  for (const synergy of synergies) {
    await db.query(`
      INSERT INTO food_synergies (
        synergy_type, benefit_description, timing_importance, research_source, evidence_strength
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
    `, [
      synergy.synergy_type, synergy.benefit_description, synergy.timing_importance,
      synergy.research_source, synergy.evidence_strength
    ]);
  }
  
  console.log(`   ✅ Seeded ${synergies.length} food synergies`);
}

async function seedSampleFoods(db) {
  console.log('🍎 Seeding sample foods (demo data)...');
  
  const sampleFoods = [
    {
      fdc_id: 100001,
      data_type: 'foundation',
      description: 'Chicken breast, skinless, boneless, cooked',
      food_category_id: 1,
      is_sports_supplement: false,
      is_recovery_food: true,
      is_post_workout: true,
      contains_gluten: false,
      contains_dairy: false
    },
    {
      fdc_id: 100002,
      data_type: 'foundation',
      description: 'Brown rice, cooked',
      food_category_id: 6,
      is_sports_supplement: false,
      is_pre_workout: true,
      contains_gluten: false,
      contains_dairy: false
    },
    {
      fdc_id: 100003,
      data_type: 'foundation',
      description: 'Banana, fresh',
      food_category_id: 3,
      is_sports_supplement: false,
      is_pre_workout: true,
      contains_gluten: false,
      contains_dairy: false
    }
  ];

  for (const food of sampleFoods) {
    await db.query(`
      INSERT INTO foods (
        fdc_id, data_type, description, food_category_id, is_sports_supplement,
        is_recovery_food, is_post_workout, is_pre_workout, contains_gluten, contains_dairy
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (fdc_id) DO NOTHING
    `, [
      food.fdc_id, food.data_type, food.description, food.food_category_id,
      food.is_sports_supplement, food.is_recovery_food, food.is_post_workout || false,
      food.is_pre_workout || false, food.contains_gluten, food.contains_dairy
    ]);
  }
  
  console.log(`   ✅ Seeded ${sampleFoods.length} sample foods`);
}

async function seedUSDAFoods(db) {
  console.log('🔗 Fetching foods from USDA FoodData Central...');
  
  try {
    // Search for common sports nutrition foods
    const searchTerms = ['chicken breast', 'brown rice', 'banana', 'oats', 'greek yogurt'];
    
    for (const term of searchTerms) {
      const response = await fetch(`${USDA_BASE_URL}/foods/search?query=${encodeURIComponent(term)}&dataType=Foundation&pageSize=5&api_key=${USDA_API_KEY}`);
      
      if (!response.ok) {
        console.log(`   ⚠️ USDA API request failed for ${term}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (data.foods && data.foods.length > 0) {
        for (const food of data.foods.slice(0, 2)) { // Take first 2 results
          try {
            await db.query(`
              INSERT INTO foods (
                fdc_id, data_type, description, food_category_id, publication_date,
                is_sports_supplement, is_recovery_food
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (fdc_id) DO NOTHING
            `, [
              food.fdcId,
              food.dataType,
              food.description,
              1, // Default category
              food.publishedDate,
              false,
              term.includes('chicken') || term.includes('greek')
            ]);
            
            // Fetch detailed nutrient data
            const detailResponse = await fetch(`${USDA_BASE_URL}/food/${food.fdcId}?api_key=${USDA_API_KEY}`);
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              
              if (detailData.foodNutrients) {
                for (const nutrient of detailData.foodNutrients.slice(0, 10)) { // Limit to prevent overflow
                  if (nutrient.amount) {
                    await db.query(`
                      INSERT INTO food_nutrients (fdc_id, nutrient_id, amount, amount_per_100g)
                      VALUES ($1, $2, $3, $4)
                      ON CONFLICT (fdc_id, nutrient_id) DO NOTHING
                    `, [
                      food.fdcId,
                      nutrient.nutrient.id,
                      nutrient.amount,
                      nutrient.amount
                    ]);
                  }
                }
              }
            }
            
          } catch (error) {
            console.log(`   ⚠️ Error inserting food ${food.fdcId}: ${error.message}`);
          }
        }
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`   ✅ Fetched foods from USDA API`);
    
  } catch (error) {
    console.log(`   ⚠️ USDA API integration failed: ${error.message}`);
    console.log('   📝 Falling back to sample data...');
    await seedSampleFoods(db);
  }
}

// Run the seeding
seedNutritionDatabase();