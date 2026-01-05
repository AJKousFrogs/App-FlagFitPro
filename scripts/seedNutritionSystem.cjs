const { Pool } = require("pg");
require("dotenv").config();

class NutritionSystemSeeder {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  async seedNutritionPlans() {
    console.log("🍽️ Seeding Nutrition Plans...");
    const nutritionPlans = [
      {
        name: "Elite Flag Football Competition Day Plan",
        description: "High-performance nutrition plan for game days and tournaments",
        athlete_level: "elite_competitor",
        created_at: new Date(),
      },
      {
        name: "Training Day Nutrition Plan",
        description: "Optimal nutrition for 1.5-hour training sessions",
        athlete_level: "all_levels",
        created_at: new Date(),
      },
    ];

    for (const plan of nutritionPlans) {
      try {
        const query = `
          INSERT INTO nutrition_plans (
            name, description, athlete_level, created_at
          ) VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `;

        await this.pool.query(query, [
          plan.name,
          plan.description,
          plan.athlete_level,
          plan.created_at,
        ]);

        console.log(`✅ Inserted nutrition plan: ${plan.name}`);
      } catch (error) {
        console.error(`❌ Error inserting nutrition plan: ${error.message}`);
      }
    }
  }

  async seedAthleteNutritionProfiles() {
    console.log("👤 Seeding Athlete Nutrition Profiles...");
    const usersRes = await this.pool.query("SELECT id FROM users LIMIT 2");
    if (usersRes.rows.length === 0) {
      console.warn("⚠️ No users found, skipping athlete nutrition profiles");
      return;
    }

    const profiles = usersRes.rows.map((row, index) => ({
      user_id: row.id,
      weight_kg: index === 0 ? 80 : 65,
      height_cm: index === 0 ? 180 : 165,
      training_days_per_week: 5,
      created_at: new Date(),
    }));

    for (const profile of profiles) {
      try {
        const query = `
          INSERT INTO athlete_nutrition_profiles (
            user_id, weight_kg, height_cm, training_days_per_week, created_at
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT DO NOTHING
        `;

        await this.pool.query(query, [
          profile.user_id,
          profile.weight_kg,
          profile.height_cm,
          profile.training_days_per_week,
          profile.created_at,
        ]);

        console.log(`✅ Inserted nutrition profile for user: ${profile.user_id}`);
      } catch (error) {
        console.error(`❌ Error inserting nutrition profile: ${error.message}`);
      }
    }
  }

  async seedNutritionRecommendations() {
    console.log("💡 Seeding Nutrition Recommendations...");
    const usersRes = await this.pool.query("SELECT id FROM users LIMIT 1");
    if (usersRes.rows.length === 0) {return;}

    const recommendations = [
      {
        user_id: usersRes.rows[0].id,
        title: "Pre-Game Fueling",
        description: "Focus on slow-digesting carbs 3-4 hours before the match.",
        recommendation_type: "pre_game",
        date_generated: new Date(),
      }
    ];

    for (const rec of recommendations) {
      try {
        const query = `
          INSERT INTO nutrition_recommendations (
            user_id, title, description, recommendation_type, date_generated
          ) VALUES ($1, $2, $3, $4, $5)
        `;

        await this.pool.query(query, [
          rec.user_id,
          rec.title,
          rec.description,
          rec.recommendation_type,
          rec.date_generated,
        ]);

        console.log(`✅ Inserted nutrition recommendation: ${rec.title}`);
      } catch (error) {
        console.error(`❌ Error inserting nutrition recommendation: ${error.message}`);
      }
    }
  }

  async seedNutritionPerformanceCorrelations() {
    console.log("📊 Seeding Nutrition Performance Correlations...");
    const usersRes = await this.pool.query("SELECT id FROM users LIMIT 1");
    if (usersRes.rows.length === 0) {return;}

    const correlations = [
      {
        user_id: usersRes.rows[0].id,
        analysis_date: new Date(),
        correlation_strength: 0.85,
        key_insights: ["Carb loading correlates with +10% speed endurance"],
      }
    ];

    for (const corr of correlations) {
      try {
        const query = `
          INSERT INTO nutrition_performance_correlations (
            user_id, analysis_date, correlation_strength, key_insights
          ) VALUES ($1, $2, $3, $4)
        `;

        await this.pool.query(query, [
          corr.user_id,
          corr.analysis_date,
          corr.correlation_strength,
          corr.key_insights,
        ]);

        console.log(`✅ Inserted performance correlation for user: ${corr.user_id}`);
      } catch (error) {
        console.error(`❌ Error inserting performance correlation: ${error.message}`);
      }
    }
  }

  async seedUserNutritionTargets() {
    console.log("🎯 Seeding User Nutrition Targets...");
    const usersRes = await this.pool.query("SELECT id FROM users LIMIT 1");
    if (usersRes.rows.length === 0) {return;}

    const target = {
      user_id: usersRes.rows[0].id,
      daily_calories_target: 2800,
      daily_calories_min: 2500,
      daily_calories_max: 3100,
      protein_target: 160,
      carbs_target: 350,
      fat_target: 80,
      start_date: new Date(),
    };

    try {
      const query = `
        INSERT INTO user_nutrition_targets (
          user_id, daily_calories_target, daily_calories_min, daily_calories_max,
          protein_target, carbs_target, fat_target, start_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await this.pool.query(query, [
        target.user_id,
        target.daily_calories_target,
        target.daily_calories_min,
        target.daily_calories_max,
        target.protein_target,
        target.carbs_target,
        target.fat_target,
        target.start_date,
      ]);

      console.log(`✅ Inserted nutrition targets for user: ${target.user_id}`);
    } catch (error) {
      console.error(`❌ Error inserting nutrition targets: ${error.message}`);
    }
  }

  async runAllSeeders() {
    try {
      await this.seedNutritionPlans();
      await this.seedAthleteNutritionProfiles();
      await this.seedNutritionRecommendations();
      await this.seedNutritionPerformanceCorrelations();
      await this.seedUserNutritionTargets();
      console.log("🎉 Nutrition System Database Seeding Completed Successfully!");
    } catch (error) {
      console.error(`❌ Database seeding failed: ${error.message}`);
    } finally {
      await this.pool.end();
    }
  }
}

const seeder = new NutritionSystemSeeder();
seeder.runAllSeeders();
