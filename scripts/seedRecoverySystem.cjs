const { Pool } = require("pg");
require("dotenv").config();

class RecoverySystemSeeder {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  async seedRecoveryProtocols() {
    console.log("🔄 Seeding Recovery Protocols...");
    const recoveryProtocols = [
      {
        name: "Post-Game Recovery Protocol",
        description: "Comprehensive recovery protocol for post-game recovery",
        category: "post_competition",
        duration_minutes: 120,
        intensity_level: "low",
        created_at: new Date(),
      },
      {
        name: "Training Day Recovery Protocol",
        description: "Recovery protocol for training days",
        category: "post_training",
        duration_minutes: 60,
        intensity_level: "low",
        created_at: new Date(),
      },
    ];

    for (const protocol of recoveryProtocols) {
      try {
        const query = `
          INSERT INTO recovery_protocols (
            name, description, category,
            duration_minutes, intensity_level, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT DO NOTHING
        `;

        await this.pool.query(query, [
          protocol.name,
          protocol.description,
          protocol.category,
          protocol.duration_minutes,
          protocol.intensity_level,
          protocol.created_at,
        ]);

        console.log(`✅ Inserted recovery protocol: ${protocol.name}`);
      } catch (error) {
        console.error(`❌ Error inserting recovery protocol: ${error.message}`);
      }
    }
  }

  async seedRecoveryEquipment() {
    console.log("🛠️ Seeding Recovery Equipment...");
    const usersRes = await this.pool.query("SELECT id FROM users LIMIT 1");
    if (usersRes.rows.length === 0) {
      return;
    }

    const equipment = [
      {
        user_id: usersRes.rows[0].id,
        equipment_name: "Foam Roller",
        equipment_type: "active_recovery",
        brand: "TriggerPoint",
        created_at: new Date(),
      },
      {
        user_id: usersRes.rows[0].id,
        equipment_name: "Massage Gun",
        equipment_type: "manual_therapy",
        brand: "Theragun",
        created_at: new Date(),
      },
    ];

    for (const item of equipment) {
      try {
        const query = `
          INSERT INTO recovery_equipment (
            user_id, equipment_name, equipment_type, brand, created_at
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT DO NOTHING
        `;

        await this.pool.query(query, [
          item.user_id,
          item.equipment_name,
          item.equipment_type,
          item.brand,
          item.created_at,
        ]);

        console.log(`✅ Inserted recovery equipment: ${item.equipment_name}`);
      } catch (error) {
        console.error(
          `❌ Error inserting recovery equipment: ${error.message}`,
        );
      }
    }
  }

  async seedRecoverySessions() {
    console.log("🏃 Seeding Recovery Sessions...");
    const usersRes = await this.pool.query("SELECT id FROM users LIMIT 1");
    if (usersRes.rows.length === 0) {
      return;
    }

    const sessions = [
      {
        user_id: usersRes.rows[0].id,
        recovery_type: "active_recovery",
        duration_minutes: 30,
        session_date: new Date(),
        start_time: new Date(),
        intensity_level: "low",
        created_at: new Date(),
      },
    ];

    for (const session of sessions) {
      try {
        const query = `
          INSERT INTO recovery_sessions (
            user_id, recovery_type, duration_minutes, session_date, start_time,
            intensity_level, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        await this.pool.query(query, [
          session.user_id,
          session.recovery_type,
          session.duration_minutes,
          session.session_date,
          session.start_time,
          session.intensity_level,
          session.created_at,
        ]);

        console.log(
          `✅ Inserted recovery session for user: ${session.user_id}`,
        );
      } catch (error) {
        console.error(`❌ Error inserting recovery session: ${error.message}`);
      }
    }
  }

  async seedRecoveryRecommendations() {
    console.log("💡 Seeding Recovery Recommendations...");
    const usersRes = await this.pool.query("SELECT id FROM users LIMIT 1");
    if (usersRes.rows.length === 0) {
      return;
    }

    const recommendations = [
      {
        user_id: usersRes.rows[0].id,
        title: "Post-Game Ice Bath",
        description: "10-15 minutes at 10-12°C to reduce muscle inflammation",
        recommendation_type: "cryotherapy",
        recommended_activities: ["Cold plunge", "Breathing exercises"],
        date_generated: new Date(),
        created_at: new Date(),
      },
    ];

    for (const rec of recommendations) {
      try {
        const query = `
          INSERT INTO recovery_recommendations (
            user_id, title, description, recommendation_type, 
            recommended_activities, date_generated, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        await this.pool.query(query, [
          rec.user_id,
          rec.title,
          rec.description,
          rec.recommendation_type,
          rec.recommended_activities,
          rec.date_generated,
          rec.created_at,
        ]);

        console.log(`✅ Inserted recovery recommendation: ${rec.title}`);
      } catch (error) {
        console.error(
          `❌ Error inserting recovery recommendation: ${error.message}`,
        );
      }
    }
  }

  async seedRecoveryAnalytics() {
    console.log("📊 Seeding Recovery Analytics...");
    const usersRes = await this.pool.query("SELECT id FROM users LIMIT 1");
    if (usersRes.rows.length === 0) {
      return;
    }

    const analytics = [
      {
        user_id: usersRes.rows[0].id,
        analysis_period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        analysis_period_end: new Date(),
        recovery_compliance_rate: 92.5,
        key_insights: [
          "Better sleep quality correlates with 15% reduction in soreness",
        ],
      },
    ];

    for (const entry of analytics) {
      try {
        const query = `
          INSERT INTO recovery_analytics (
            user_id, analysis_period_start, analysis_period_end,
            recovery_compliance_rate, key_insights
          ) VALUES ($1, $2, $3, $4, $5)
        `;

        await this.pool.query(query, [
          entry.user_id,
          entry.analysis_period_start,
          entry.analysis_period_end,
          entry.recovery_compliance_rate,
          entry.key_insights,
        ]);

        console.log(
          `✅ Inserted recovery analytics for user: ${entry.user_id}`,
        );
      } catch (error) {
        console.error(
          `❌ Error inserting recovery analytics: ${error.message}`,
        );
      }
    }
  }

  async seedAthleteRecoveryProfiles() {
    console.log("👤 Seeding Athlete Recovery Profiles...");
    const usersRes = await this.pool.query("SELECT id FROM users LIMIT 1");
    if (usersRes.rows.length === 0) {
      return;
    }

    const profile = {
      user_id: usersRes.rows[0].id,
      age: 25,
      training_experience_years: 5,
      protocol_compliance_percentage: 88.0,
      created_at: new Date(),
    };

    try {
      const query = `
        INSERT INTO athlete_recovery_profiles (
          user_id, age, training_experience_years, 
          protocol_compliance_percentage, created_at
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `;

      await this.pool.query(query, [
        profile.user_id,
        profile.age,
        profile.training_experience_years,
        profile.protocol_compliance_percentage,
        profile.created_at,
      ]);

      console.log(`✅ Inserted recovery profile for user: ${profile.user_id}`);
    } catch (error) {
      console.error(`❌ Error inserting recovery profile: ${error.message}`);
    }
  }

  async runAllSeeders() {
    try {
      await this.seedRecoveryProtocols();
      await this.seedRecoveryEquipment();
      await this.seedRecoverySessions();
      await this.seedRecoveryRecommendations();
      await this.seedRecoveryAnalytics();
      await this.seedAthleteRecoveryProfiles();
      console.log(
        "🎉 Recovery System Database Seeding Completed Successfully!",
      );
    } catch (error) {
      console.error(`❌ Database seeding failed: ${error.message}`);
    } finally {
      await this.pool.end();
    }
  }
}

const seeder = new RecoverySystemSeeder();
seeder.runAllSeeders();
