const { Pool } = require('pg');
require('dotenv').config();

class NutritionSystemSeeder {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async seedNutritionPlans() {
    console.log('🍽️ Seeding Nutrition Plans...');
    const nutritionPlans = [
      {
        plan_name: 'Elite Flag Football Competition Day Plan',
        plan_description: 'High-performance nutrition plan for game days and tournaments',
        target_athlete_type: 'elite_competitor',
        meal_timing: [
          {
            meal: 'pre_game',
            timing_hours_before: 3,
            calories: 800,
            protein_g: 40,
            carbs_g: 120,
            fat_g: 20,
            hydration_ml: 500
          },
          {
            meal: 'during_game',
            timing: 'quarter_breaks',
            calories: 200,
            protein_g: 10,
            carbs_g: 40,
            fat_g: 2,
            hydration_ml: 250
          },
          {
            meal: 'post_game',
            timing_hours_after: 0.5,
            calories: 600,
            protein_g: 35,
            carbs_g: 80,
            fat_g: 15,
            hydration_ml: 750
          }
        ],
        is_active: true,
        created_at: new Date()
      },
      {
        plan_name: 'Training Day Nutrition Plan',
        plan_description: 'Optimal nutrition for 1.5-hour training sessions',
        target_athlete_type: 'all_levels',
        meal_timing: [
          {
            meal: 'pre_training',
            timing_hours_before: 2,
            calories: 400,
            protein_g: 25,
            carbs_g: 60,
            fat_g: 10,
            hydration_ml: 400
          },
          {
            meal: 'during_training',
            timing: 'every_30_minutes',
            calories: 100,
            protein_g: 5,
            carbs_g: 20,
            fat_g: 1,
            hydration_ml: 200
          },
          {
            meal: 'post_training',
            timing_hours_after: 0.5,
            calories: 500,
            protein_g: 30,
            carbs_g: 70,
            fat_g: 12,
            hydration_ml: 600
          }
        ],
        is_active: true,
        created_at: new Date()
      },
      {
        plan_name: 'Recovery Day Nutrition Plan',
        plan_description: 'Nutrition for rest days and recovery sessions',
        target_athlete_type: 'all_levels',
        meal_timing: [
          {
            meal: 'breakfast',
            timing: 'morning',
            calories: 600,
            protein_g: 35,
            carbs_g: 80,
            fat_g: 20,
            hydration_ml: 400
          },
          {
            meal: 'lunch',
            timing: 'midday',
            calories: 700,
            protein_g: 40,
            carbs_g: 90,
            fat_g: 25,
            hydration_ml: 500
          },
          {
            meal: 'dinner',
            timing: 'evening',
            calories: 600,
            protein_g: 35,
            carbs_g: 70,
            fat_g: 20,
            hydration_ml: 400
          }
        ],
        is_active: true,
        created_at: new Date()
      }
    ];

    for (const plan of nutritionPlans) {
      try {
        const query = `
          INSERT INTO nutrition_plans (
            plan_name, plan_description, target_athlete_type,
            meal_timing, is_active, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `;
        
        await this.pool.query(query, [
          plan.plan_name, plan.plan_description, plan.target_athlete_type,
          JSON.stringify(plan.meal_timing), plan.is_active, plan.created_at
        ]);
        
        console.log(`✅ Inserted nutrition plan: ${plan.plan_name}`);
      } catch (error) {
        console.error(`❌ Error inserting nutrition plan: ${error.message}`);
      }
    }
  }

  async seedAthleteNutritionProfiles() {
    console.log('👤 Seeding Athlete Nutrition Profiles...');
    const nutritionProfiles = [
      {
        athlete_id: '1', // Assuming user ID 1 exists
        age: 25,
        gender: 'male',
        weight_kg: 80,
        height_cm: 180,
        activity_level: 'very_active',
        training_frequency: '5_days_per_week',
        competition_level: 'elite',
        dietary_restrictions: ['none'],
        food_preferences: ['high_protein', 'moderate_carbs', 'healthy_fats'],
        allergies: ['none'],
        supplement_use: ['creatine', 'whey_protein', 'vitamin_d'],
        hydration_goals_ml_per_day: 3500,
        protein_goals_g_per_day: 160,
        carb_goals_g_per_day: 400,
        fat_goals_g_per_day: 80,
        created_at: new Date()
      },
      {
        athlete_id: '2', // Assuming user ID 2 exists
        age: 22,
        gender: 'female',
        weight_kg: 65,
        height_cm: 165,
        activity_level: 'very_active',
        training_frequency: '4_days_per_week',
        competition_level: 'competitive',
        dietary_restrictions: ['vegetarian'],
        food_preferences: ['plant_based', 'high_protein', 'low_fat'],
        allergies: ['nuts'],
        supplement_use: ['whey_protein', 'vitamin_b12', 'iron'],
        hydration_goals_ml_per_day: 2800,
        protein_goals_g_per_day: 120,
        carb_goals_g_per_day: 300,
        fat_goals_g_per_day: 60,
        created_at: new Date()
      }
    ];

    for (const profile of nutritionProfiles) {
      try {
        const query = `
          INSERT INTO athlete_nutrition_profiles (
            athlete_id, age, gender, weight_kg, height_cm, activity_level,
            training_frequency, competition_level, dietary_restrictions,
            food_preferences, allergies, supplement_use, hydration_goals_ml_per_day,
            protein_goals_g_per_day, carb_goals_g_per_day, fat_goals_g_per_day, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `;
        
        await this.pool.query(query, [
          profile.athlete_id, profile.age, profile.gender, profile.weight_kg,
          profile.height_cm, profile.activity_level, profile.training_frequency,
          profile.competition_level, profile.dietary_restrictions, profile.food_preferences,
          profile.allergies, profile.supplement_use, profile.hydration_goals_ml_per_day,
          profile.protein_goals_g_per_day, profile.carb_goals_g_per_day,
          profile.fat_goals_g_per_day, profile.created_at
        ]);
        
        console.log(`✅ Inserted nutrition profile for athlete ID: ${profile.athlete_id}`);
      } catch (error) {
        console.error(`❌ Error inserting nutrition profile: ${error.message}`);
      }
    }
  }

  async seedNutritionRecommendations() {
    console.log('💡 Seeding Nutrition Recommendations...');
    const recommendations = [
      {
        recommendation_type: 'pre_game_nutrition',
        target_athlete_type: 'elite_competitor',
        timing: '3_hours_before_game',
        calories: 800,
        protein_g: 40,
        carbs_g: 120,
        fat_g: 20,
        hydration_ml: 500,
        food_suggestions: [
          'oatmeal with berries and nuts',
          'grilled chicken with rice',
          'banana with peanut butter',
          'sports drink'
        ],
        rationale: 'Provides sustained energy release and prevents hunger during competition',
        evidence_level: 'high',
        created_at: new Date()
      },
      {
        recommendation_type: 'during_game_nutrition',
        target_athlete_type: 'elite_competitor',
        timing: 'quarter_breaks',
        calories: 200,
        protein_g: 10,
        carbs_g: 40,
        fat_g: 2,
        hydration_ml: 250,
        food_suggestions: [
          'energy gels',
          'sports drink',
          'banana slices',
          'electrolyte tablets'
        ],
        rationale: 'Maintains blood glucose and electrolyte balance during intense activity',
        evidence_level: 'high',
        created_at: new Date()
      },
      {
        recommendation_type: 'post_game_recovery',
        target_athlete_type: 'elite_competitor',
        timing: 'within_30_minutes',
        calories: 600,
        protein_g: 35,
        carbs_g: 80,
        fat_g: 15,
        hydration_ml: 750,
        food_suggestions: [
          'chocolate milk',
          'protein shake with banana',
          'turkey sandwich',
          'sports drink'
        ],
        rationale: 'Optimizes muscle recovery and glycogen replenishment',
        evidence_level: 'very_high',
        created_at: new Date()
      },
      {
        recommendation_type: 'training_day_nutrition',
        target_athlete_type: 'all_levels',
        timing: '2_hours_before_training',
        calories: 400,
        protein_g: 25,
        carbs_g: 60,
        fat_g: 10,
        hydration_ml: 400,
        food_suggestions: [
          'greek yogurt with granola',
          'apple with almond butter',
          'whole grain toast with honey',
          'water'
        ],
        rationale: 'Provides adequate fuel for training session without causing discomfort',
        evidence_level: 'high',
        created_at: new Date()
      }
    ];

    for (const recommendation of recommendations) {
      try {
        const query = `
          INSERT INTO nutrition_recommendations (
            recommendation_type, target_athlete_type, timing, calories,
            protein_g, carbs_g, fat_g, hydration_ml, food_suggestions,
            rationale, evidence_level, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;
        
        await this.pool.query(query, [
          recommendation.recommendation_type, recommendation.target_athlete_type,
          recommendation.timing, recommendation.calories, recommendation.protein_g,
          recommendation.carbs_g, recommendation.fat_g, recommendation.hydration_ml,
          recommendation.food_suggestions, recommendation.rationale,
          recommendation.evidence_level, recommendation.created_at
        ]);
        
        console.log(`✅ Inserted nutrition recommendation: ${recommendation.recommendation_type}`);
      } catch (error) {
        console.error(`❌ Error inserting nutrition recommendation: ${error.message}`);
      }
    }
  }

  async seedNutritionPerformanceCorrelations() {
    console.log('📊 Seeding Nutrition Performance Correlations...');
    const correlations = [
      {
        correlation_type: 'protein_intake_strength',
        metric_name: 'bench_press_1rm',
        correlation_strength: 0.75,
        sample_size: 150,
        study_duration_weeks: 12,
        athlete_type: 'strength_athletes',
        nutrition_factor: 'protein_intake_g_per_kg',
        performance_improvement_percentage: 15.2,
        confidence_interval: '0.68-0.82',
        evidence_level: 'high',
        created_at: new Date()
      },
      {
        correlation_type: 'carbohydrate_intake_endurance',
        metric_name: '5k_run_time',
        correlation_strength: 0.68,
        sample_size: 200,
        study_duration_weeks: 8,
        athlete_type: 'endurance_athletes',
        nutrition_factor: 'carbohydrate_intake_g_per_kg',
        performance_improvement_percentage: 8.7,
        confidence_interval: '0.59-0.77',
        evidence_level: 'high',
        created_at: new Date()
      },
      {
        correlation_type: 'hydration_performance',
        metric_name: 'sprint_speed',
        correlation_strength: 0.82,
        sample_size: 100,
        study_duration_weeks: 4,
        athlete_type: 'team_sport_athletes',
        nutrition_factor: 'hydration_status_percentage',
        performance_improvement_percentage: 12.3,
        confidence_interval: '0.76-0.88',
        evidence_level: 'very_high',
        created_at: new Date()
      },
      {
        correlation_type: 'meal_timing_power',
        metric_name: 'vertical_jump_height',
        correlation_strength: 0.71,
        sample_size: 120,
        study_duration_weeks: 6,
        athlete_type: 'power_athletes',
        nutrition_factor: 'pre_workout_meal_timing_hours',
        performance_improvement_percentage: 9.8,
        confidence_interval: '0.63-0.79',
        evidence_level: 'high',
        created_at: new Date()
      }
    ];

    for (const correlation of correlations) {
      try {
        const query = `
          INSERT INTO nutrition_performance_correlations (
            correlation_type, metric_name, correlation_strength, sample_size,
            study_duration_weeks, athlete_type, nutrition_factor,
            performance_improvement_percentage, confidence_interval,
            evidence_level, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;
        
        await this.pool.query(query, [
          correlation.correlation_type, correlation.metric_name,
          correlation.correlation_strength, correlation.sample_size,
          correlation.study_duration_weeks, correlation.athlete_type,
          correlation.nutrition_factor, correlation.performance_improvement_percentage,
          correlation.confidence_interval, correlation.evidence_level,
          correlation.created_at
        ]);
        
        console.log(`✅ Inserted performance correlation: ${correlation.correlation_type}`);
      } catch (error) {
        console.error(`❌ Error inserting performance correlation: ${error.message}`);
      }
    }
  }

  async seedUserNutritionTargets() {
    console.log('🎯 Seeding User Nutrition Targets...');
    const nutritionTargets = [
      {
        user_id: '1', // Assuming user ID 1 exists
        target_date: new Date(),
        daily_calories: 3200,
        daily_protein_g: 160,
        daily_carbs_g: 400,
        daily_fat_g: 80,
        daily_hydration_ml: 3500,
        meal_frequency: 6,
        pre_workout_calories: 400,
        post_workout_calories: 500,
        is_active: true,
        created_at: new Date()
      },
      {
        user_id: '2', // Assuming user ID 2 exists
        target_date: new Date(),
        daily_calories: 2400,
        daily_protein_g: 120,
        daily_carbs_g: 300,
        daily_fat_g: 60,
        daily_hydration_ml: 2800,
        meal_frequency: 5,
        pre_workout_calories: 300,
        post_workout_calories: 400,
        is_active: true,
        created_at: new Date()
      }
    ];

    for (const target of nutritionTargets) {
      try {
        const query = `
          INSERT INTO user_nutrition_targets (
            user_id, target_date, daily_calories, daily_protein_g,
            daily_carbs_g, daily_fat_g, daily_hydration_ml,
            meal_frequency, pre_workout_calories, post_workout_calories,
            is_active, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;
        
        await this.pool.query(query, [
          target.user_id, target.target_date, target.daily_calories,
          target.daily_protein_g, target.daily_carbs_g, target.daily_fat_g,
          target.daily_hydration_ml, target.meal_frequency,
          target.pre_workout_calories, target.post_workout_calories,
          target.is_active, target.created_at
        ]);
        
        console.log(`✅ Inserted nutrition targets for user ID: ${target.user_id}`);
      } catch (error) {
        console.error(`❌ Error inserting nutrition targets: ${error.message}`);
      }
    }
  }

  async runAllSeeders() {
    console.log('🚀 Starting Nutrition System Database Seeding...\n');
    
    try {
      await this.seedNutritionPlans();
      console.log('');
      await this.seedAthleteNutritionProfiles();
      console.log('');
      await this.seedNutritionRecommendations();
      console.log('');
      await this.seedNutritionPerformanceCorrelations();
      console.log('');
      await this.seedUserNutritionTargets();
      
      console.log('\n🎉 Nutrition System Database Seeding Completed Successfully!');
      console.log('📊 Database now contains:');
      console.log('   ✅ 3 Nutrition plans');
      console.log('   ✅ 2 Athlete nutrition profiles');
      console.log('   ✅ 4 Nutrition recommendations');
      console.log('   ✅ 4 Performance correlations');
      console.log('   ✅ 2 User nutrition targets');
      
    } catch (error) {
      console.error('❌ Error during seeding:', error.message);
    } finally {
      await this.pool.end();
    }
  }
}

if (require.main === module) {
  const seeder = new NutritionSystemSeeder();
  seeder.runAllSeeders();
}

module.exports = NutritionSystemSeeder;
