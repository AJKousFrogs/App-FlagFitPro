const { Pool } = require("pg");

class CompetitionProtocolsSeeder {
  constructor() {
    this.pool = new Pool({
      connectionString:
        process.env.DATABASE_URL || process.env.VITE_DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  async seedEuropeanChampionshipProtocols() {
    console.log("🏆 Seeding European Championship protocols...");

    const protocols = [
      {
        championship_year: 2024,
        location: "Germany",
        climate_zone: "temperate",
        typical_temperature_celsius: 22.5,
        typical_humidity_percentage: 65.0,
        games_per_day: 3,
        game_duration_minutes: 40,
        total_playing_time_minutes: 120,
        time_between_games_minutes: 45,
        pre_game_hydration_ml_per_kg: 18.0,
        pre_game_timing_hours: 2.5,
        during_game_hydration_ml_per_15min: 220.0,
        between_games_hydration_ml_per_kg: 12.0,
        post_game_hydration_ml_per_kg: 20.0,
        sodium_mg_per_liter: 800.0,
        potassium_mg_per_liter: 200.0,
        magnesium_mg_per_liter: 100.0,
        calcium_mg_per_liter: 300.0,
        urine_color_target: 3,
        body_weight_loss_limit_kg: 1.5,
        cognitive_test_recommendations: [
          "reaction_time",
          "decision_making",
          "memory_recall",
        ],
        evidence_strength: "high",
        flag_football_specific_notes:
          "European climate requires moderate hydration adjustments",
      },
      {
        championship_year: 2025,
        location: "Netherlands",
        climate_zone: "temperate",
        typical_temperature_celsius: 20.0,
        typical_humidity_percentage: 70.0,
        games_per_day: 4,
        game_duration_minutes: 40,
        total_playing_time_minutes: 160,
        time_between_games_minutes: 40,
        pre_game_hydration_ml_per_kg: 20.0,
        pre_game_timing_hours: 3.0,
        during_game_hydration_ml_per_15min: 250.0,
        between_games_hydration_ml_per_kg: 15.0,
        post_game_hydration_ml_per_kg: 22.0,
        sodium_mg_per_liter: 850.0,
        potassium_mg_per_liter: 220.0,
        magnesium_mg_per_liter: 110.0,
        calcium_mg_per_liter: 320.0,
        urine_color_target: 2,
        body_weight_loss_limit_kg: 1.2,
        cognitive_test_recommendations: [
          "reaction_time",
          "decision_making",
          "memory_recall",
          "spatial_awareness",
        ],
        evidence_strength: "high",
        flag_football_specific_notes:
          "Higher humidity requires increased electrolyte replacement",
      },
    ];

    for (const protocol of protocols) {
      try {
        const query = `
          INSERT INTO european_championship_protocols (
            championship_year, location, climate_zone, typical_temperature_celsius,
            typical_humidity_percentage, games_per_day, game_duration_minutes,
            total_playing_time_minutes, time_between_games_minutes,
            pre_game_hydration_ml_per_kg, pre_game_timing_hours,
            during_game_hydration_ml_per_15min, between_games_hydration_ml_per_kg,
            post_game_hydration_ml_per_kg, sodium_mg_per_liter,
            potassium_mg_per_liter, magnesium_mg_per_liter, calcium_mg_per_liter,
            urine_color_target, body_weight_loss_limit_kg,
            cognitive_test_recommendations, evidence_strength,
            flag_football_specific_notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (championship_year) DO UPDATE SET
            location = EXCLUDED.location,
            climate_zone = EXCLUDED.climate_zone,
            typical_temperature_celsius = EXCLUDED.typical_temperature_celsius,
            typical_humidity_percentage = EXCLUDED.typical_humidity_percentage,
            games_per_day = EXCLUDED.games_per_day,
            game_duration_minutes = EXCLUDED.game_duration_minutes,
            total_playing_time_minutes = EXCLUDED.total_playing_time_minutes,
            time_between_games_minutes = EXCLUDED.time_between_games_minutes,
            pre_game_hydration_ml_per_kg = EXCLUDED.pre_game_hydration_ml_per_kg,
            pre_game_timing_hours = EXCLUDED.pre_game_timing_hours,
            during_game_hydration_ml_per_15min = EXCLUDED.during_game_hydration_ml_per_15min,
            between_games_hydration_ml_per_kg = EXCLUDED.between_games_hydration_ml_per_kg,
            post_game_hydration_ml_per_kg = EXCLUDED.post_game_hydration_ml_per_kg,
            sodium_mg_per_liter = EXCLUDED.sodium_mg_per_liter,
            potassium_mg_per_liter = EXCLUDED.potassium_mg_per_liter,
            magnesium_mg_per_liter = EXCLUDED.magnesium_mg_per_liter,
            calcium_mg_per_liter = EXCLUDED.calcium_mg_per_liter,
            urine_color_target = EXCLUDED.urine_color_target,
            body_weight_loss_limit_kg = EXCLUDED.body_weight_loss_limit_kg,
            cognitive_test_recommendations = EXCLUDED.cognitive_test_recommendations,
            evidence_strength = EXCLUDED.evidence_strength,
            flag_football_specific_notes = EXCLUDED.flag_football_specific_notes
          RETURNING *
        `;

        const values = [
          protocol.championship_year,
          protocol.location,
          protocol.climate_zone,
          protocol.typical_temperature_celsius,
          protocol.typical_humidity_percentage,
          protocol.games_per_day,
          protocol.game_duration_minutes,
          protocol.total_playing_time_minutes,
          protocol.time_between_games_minutes,
          protocol.pre_game_hydration_ml_per_kg,
          protocol.pre_game_timing_hours,
          protocol.during_game_hydration_ml_per_15min,
          protocol.between_games_hydration_ml_per_kg,
          protocol.post_game_hydration_ml_per_kg,
          protocol.sodium_mg_per_liter,
          protocol.potassium_mg_per_liter,
          protocol.magnesium_mg_per_liter,
          protocol.calcium_mg_per_liter,
          protocol.urine_color_target,
          protocol.body_weight_loss_limit_kg,
          protocol.cognitive_test_recommendations,
          protocol.evidence_strength,
          protocol.flag_football_specific_notes,
        ];

        const _result = await this.pool.query(query, values);
        console.log(
          `✅ Seeded European Championship ${protocol.championship_year} protocol`,
        );
      } catch (error) {
        console.error(
          `❌ Error seeding European Championship ${protocol.championship_year}:`,
          error.message,
        );
      }
    }
  }

  async seedWorldChampionshipProtocols() {
    console.log("🌍 Seeding World Championship protocols...");

    const protocols = [
      {
        championship_year: 2024,
        location: "USA",
        climate_zone: "mixed",
        typical_temperature_celsius: 25.0,
        typical_humidity_percentage: 60.0,
        games_per_day: 4,
        game_duration_minutes: 40,
        total_playing_time_minutes: 160,
        time_between_games_minutes: 35,
        pre_game_hydration_ml_per_kg: 22.0,
        pre_game_timing_hours: 3.5,
        during_game_hydration_ml_per_15min: 280.0,
        between_games_hydration_ml_per_kg: 18.0,
        post_game_hydration_ml_per_kg: 25.0,
        sodium_mg_per_liter: 900.0,
        potassium_mg_per_liter: 250.0,
        magnesium_mg_per_liter: 120.0,
        calcium_mg_per_liter: 350.0,
        urine_color_target: 2,
        body_weight_loss_limit_kg: 1.0,
        cognitive_test_recommendations: [
          "reaction_time",
          "decision_making",
          "memory_recall",
          "spatial_awareness",
          "pattern_recognition",
        ],
        evidence_strength: "very_high",
        flag_football_specific_notes:
          "World Championship intensity requires maximum hydration preparation",
      },
      {
        championship_year: 2026,
        location: "Canada",
        climate_zone: "temperate",
        typical_temperature_celsius: 18.0,
        typical_humidity_percentage: 55.0,
        games_per_day: 4,
        game_duration_minutes: 40,
        total_playing_time_minutes: 160,
        time_between_games_minutes: 40,
        pre_game_hydration_ml_per_kg: 20.0,
        pre_game_timing_hours: 3.0,
        during_game_hydration_ml_per_15min: 260.0,
        between_games_hydration_ml_per_kg: 16.0,
        post_game_hydration_ml_per_kg: 23.0,
        sodium_mg_per_liter: 850.0,
        potassium_mg_per_liter: 230.0,
        magnesium_mg_per_liter: 110.0,
        calcium_mg_per_liter: 330.0,
        urine_color_target: 2,
        body_weight_loss_limit_kg: 1.1,
        cognitive_test_recommendations: [
          "reaction_time",
          "decision_making",
          "memory_recall",
          "spatial_awareness",
        ],
        evidence_strength: "very_high",
        flag_football_specific_notes:
          "Canadian climate allows for optimal performance conditions",
      },
    ];

    for (const protocol of protocols) {
      try {
        const query = `
          INSERT INTO world_championship_protocols (
            championship_year, location, climate_zone, typical_temperature_celsius,
            typical_humidity_percentage, games_per_day, game_duration_minutes,
            total_playing_time_minutes, time_between_games_minutes,
            pre_game_hydration_ml_per_kg, pre_game_timing_hours,
            during_game_hydration_ml_per_15min, between_games_hydration_ml_per_kg,
            post_game_hydration_ml_per_kg, sodium_mg_per_liter,
            potassium_mg_per_liter, magnesium_mg_per_liter, calcium_mg_per_liter,
            urine_color_target, body_weight_loss_limit_kg,
            cognitive_test_recommendations, evidence_strength,
            flag_football_specific_notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (championship_year) DO UPDATE SET
            location = EXCLUDED.location,
            climate_zone = EXCLUDED.climate_zone,
            typical_temperature_celsius = EXCLUDED.typical_temperature_celsius,
            typical_humidity_percentage = EXCLUDED.typical_humidity_percentage,
            games_per_day = EXCLUDED.games_per_day,
            game_duration_minutes = EXCLUDED.game_duration_minutes,
            total_playing_time_minutes = EXCLUDED.total_playing_time_minutes,
            time_between_games_minutes = EXCLUDED.time_between_games_minutes,
            pre_game_hydration_ml_per_kg = EXCLUDED.pre_game_hydration_ml_per_kg,
            pre_game_timing_hours = EXCLUDED.pre_game_timing_hours,
            during_game_hydration_ml_per_15min = EXCLUDED.during_game_hydration_kg,
            between_games_hydration_ml_per_kg = EXCLUDED.between_games_hydration_ml_per_kg,
            post_game_hydration_ml_per_kg = EXCLUDED.post_game_hydration_ml_per_kg,
            sodium_mg_per_liter = EXCLUDED.sodium_mg_per_liter,
            potassium_mg_per_liter = EXCLUDED.potassium_mg_per_liter,
            magnesium_mg_per_liter = EXCLUDED.magnesium_mg_per_liter,
            calcium_mg_per_liter = EXCLUDED.calcium_mg_per_liter,
            urine_color_target = EXCLUDED.urine_color_target,
            body_weight_loss_limit_kg = EXCLUDED.body_weight_loss_limit_kg,
            cognitive_test_recommendations = EXCLUDED.cognitive_test_recommendations,
            evidence_strength = EXCLUDED.evidence_strength,
            flag_football_specific_notes = EXCLUDED.flag_football_specific_notes
          RETURNING *
        `;

        const values = [
          protocol.championship_year,
          protocol.location,
          protocol.climate_zone,
          protocol.typical_temperature_celsius,
          protocol.typical_humidity_percentage,
          protocol.games_per_day,
          protocol.game_duration_minutes,
          protocol.total_playing_time_minutes,
          protocol.time_between_games_minutes,
          protocol.pre_game_hydration_ml_per_kg,
          protocol.pre_game_timing_hours,
          protocol.during_game_hydration_ml_per_15min,
          protocol.between_games_hydration_ml_per_kg,
          protocol.post_game_hydration_ml_per_kg,
          protocol.sodium_mg_per_liter,
          protocol.potassium_mg_per_liter,
          protocol.magnesium_mg_per_liter,
          protocol.calcium_mg_per_liter,
          protocol.urine_color_target,
          protocol.body_weight_loss_limit_kg,
          protocol.cognitive_test_recommendations,
          protocol.evidence_strength,
          protocol.flag_football_specific_notes,
        ];

        const _result = await this.pool.query(query, values);
        console.log(
          `✅ Seeded World Championship ${protocol.championship_year} protocol`,
        );
      } catch (error) {
        console.error(
          `❌ Error seeding World Championship ${protocol.championship_year}:`,
          error.message,
        );
      }
    }
  }

  async seedOlympicGamesProtocols() {
    console.log("🥇 Seeding Olympic Games protocols...");

    const protocols = [
      {
        olympic_year: 2028,
        location: "Los Angeles, USA",
        climate_zone: "mediterranean",
        typical_temperature_celsius: 28.0,
        typical_humidity_percentage: 45.0,
        games_per_day: 4,
        game_duration_minutes: 40,
        total_playing_time_minutes: 160,
        time_between_games_minutes: 30,
        pre_game_hydration_ml_per_kg: 25.0,
        pre_game_timing_hours: 4.0,
        during_game_hydration_ml_per_15min: 300.0,
        between_games_hydration_ml_per_kg: 20.0,
        post_game_hydration_ml_per_kg: 28.0,
        sodium_mg_per_liter: 1000.0,
        potassium_mg_per_liter: 280.0,
        magnesium_mg_per_liter: 130.0,
        calcium_mg_per_liter: 380.0,
        urine_color_target: 1,
        body_weight_loss_limit_kg: 0.8,
        cognitive_test_recommendations: [
          "reaction_time",
          "decision_making",
          "memory_recall",
          "spatial_awareness",
          "pattern_recognition",
          "stress_tolerance",
        ],
        evidence_strength: "highest",
        flag_football_specific_notes:
          "Olympic level requires maximum hydration and recovery protocols",
      },
    ];

    for (const protocol of protocols) {
      try {
        const query = `
          INSERT INTO olympic_games_protocols (
            olympic_year, location, climate_zone, typical_temperature_celsius,
            typical_humidity_percentage, games_per_day, game_duration_minutes,
            total_playing_time_minutes, time_between_games_minutes,
            pre_game_hydration_ml_per_kg, pre_game_timing_hours,
            during_game_hydration_ml_per_15min, between_games_hydration_ml_per_kg,
            post_game_hydration_ml_per_kg, sodium_mg_per_liter,
            potassium_mg_per_liter, magnesium_mg_per_liter, calcium_mg_per_liter,
            urine_color_target, body_weight_loss_limit_kg,
            cognitive_test_recommendations, evidence_strength,
            flag_football_specific_notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (olympic_year) DO UPDATE SET
            location = EXCLUDED.location,
            climate_zone = EXCLUDED.climate_zone,
            typical_temperature_celsius = EXCLUDED.typical_temperature_celsius,
            typical_humidity_percentage = EXCLUDED.typical_humidity_percentage,
            games_per_day = EXCLUDED.games_per_day,
            game_duration_minutes = EXCLUDED.game_duration_minutes,
            total_playing_time_minutes = EXCLUDED.total_playing_time_minutes,
            time_between_games_minutes = EXCLUDED.time_between_games_minutes,
            pre_game_hydration_ml_per_kg = EXCLUDED.pre_game_hydration_ml_per_kg,
            pre_game_timing_hours = EXCLUDED.pre_game_timing_hours,
            during_game_hydration_ml_per_15min = EXCLUDED.during_game_hydration_ml_per_15min,
            between_games_hydration_ml_per_kg = EXCLUDED.between_games_hydration_ml_per_kg,
            post_game_hydration_ml_per_kg = EXCLUDED.post_game_hydration_ml_per_kg,
            sodium_mg_per_liter = EXCLUDED.sodium_mg_per_liter,
            potassium_mg_per_liter = EXCLUDED.potassium_mg_per_liter,
            magnesium_mg_per_liter = EXCLUDED.magnesium_mg_per_liter,
            calcium_mg_per_liter = EXCLUDED.calcium_mg_per_liter,
            urine_color_target = EXCLUDED.urine_color_target,
            body_weight_loss_limit_kg = EXCLUDED.body_weight_loss_limit_kg,
            cognitive_test_recommendations = EXCLUDED.cognitive_test_recommendations,
            evidence_strength = EXCLUDED.evidence_strength,
            flag_football_specific_notes = EXCLUDED.flag_football_specific_notes
          RETURNING *
        `;

        const values = [
          protocol.olympic_year,
          protocol.location,
          protocol.climate_zone,
          protocol.typical_temperature_celsius,
          protocol.typical_humidity_percentage,
          protocol.games_per_day,
          protocol.game_duration_minutes,
          protocol.total_playing_time_minutes,
          protocol.time_between_games_minutes,
          protocol.pre_game_hydration_ml_per_kg,
          protocol.pre_game_timing_hours,
          protocol.during_game_hydration_ml_per_15min,
          protocol.between_games_hydration_ml_per_kg,
          protocol.post_game_hydration_ml_per_kg,
          protocol.sodium_mg_per_liter,
          protocol.potassium_mg_per_liter,
          protocol.magnesium_mg_per_liter,
          protocol.calcium_mg_per_liter,
          protocol.urine_color_target,
          protocol.body_weight_loss_limit_kg,
          protocol.cognitive_test_recommendations,
          protocol.evidence_strength,
          protocol.flag_football_specific_notes,
        ];

        const _result = await this.pool.query(query, values);
        console.log(
          `✅ Seeded Olympic Games ${protocol.olympic_year} protocol`,
        );
      } catch (error) {
        console.error(
          `❌ Error seeding Olympic Games ${protocol.olympic_year}:`,
          error.message,
        );
      }
    }
  }

  async runAllSeeders() {
    console.log("🚀 Starting Competition Protocols seeding...\n");

    try {
      await this.seedEuropeanChampionshipProtocols();
      await this.seedWorldChampionshipProtocols();
      await this.seedOlympicGamesProtocols();

      console.log("\n🎉 Competition Protocols seeding completed successfully!");
      console.log("\n📊 Seeded protocols:");
      console.log("   ✅ European Championships: 2 protocols");
      console.log("   ✅ World Championships: 2 protocols");
      console.log("   ✅ Olympic Games: 1 protocol");
    } catch (error) {
      console.error("❌ Seeding failed:", error.message);
    } finally {
      await this.pool.end();
    }
  }
}

if (require.main === module) {
  const seeder = new CompetitionProtocolsSeeder();
  seeder.runAllSeeders();
}

module.exports = CompetitionProtocolsSeeder;
