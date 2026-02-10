import { Pool } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.VITE_DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function demoHydrationSystem() {
  console.log("🎬 HYDRATION SYSTEM DEMO\n");
  console.log("=".repeat(50));

  try {
    // Demo 1: Show WADA Compliance
    console.log("\n🛡️  WADA COMPLIANCE DEMO");
    console.log("-".repeat(30));

    const wadaQuery = `
      SELECT substance_name, prohibited_status, risk_level, flag_football_relevance
      FROM wada_prohibited_substances 
      ORDER BY risk_level DESC 
      LIMIT 5
    `;

    const wadaResult = await pool.query(wadaQuery);
    console.log("Top 5 WADA Prohibited Substances:");
    wadaResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.substance_name}`);
      console.log(`   Status: ${row.prohibited_status}`);
      console.log(`   Risk: ${row.risk_level}`);
      console.log(`   Flag Football: ${row.flag_football_relevance}`);
      console.log("");
    });

    // Demo 2: Show Hydration Research
    console.log("\n🔬 HYDRATION RESEARCH DEMO");
    console.log("-".repeat(30));

    const researchQuery = `
      SELECT study_title, authors, publication_year, evidence_level, sport_specific, competition_level
      FROM hydration_research_studies 
      ORDER BY evidence_level DESC, publication_year DESC
      LIMIT 3
    `;

    const researchResult = await pool.query(researchQuery);
    console.log("Top 3 Hydration Research Studies:");
    researchResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.study_title}`);
      console.log(`   Authors: ${row.authors.join(", ")}`);
      console.log(`   Year: ${row.publication_year}`);
      console.log(`   Evidence: ${row.evidence_level}`);
      console.log(`   Sport: ${row.sport_specific || "General"}`);
      console.log(`   Level: ${row.competition_level || "All levels"}`);
      console.log("");
    });

    // Demo 3: Show IFAF Protocols
    console.log("\n🏆 IFAF COMPETITION PROTOCOLS DEMO");
    console.log("-".repeat(30));

    const ifafQuery = `
      SELECT competition_type, games_per_day, game_duration_minutes, 
             pre_game_hydration_ml_per_kg, during_game_hydration_ml_per_15min, post_game_hydration_ml_per_kg
      FROM ifaf_hydration_protocols 
      ORDER BY games_per_day DESC
    `;

    const ifafResult = await pool.query(ifafQuery);
    console.log("IFAF Hydration Protocols:");
    ifafResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.competition_type.toUpperCase()}`);
      console.log(`   Games per day: ${row.games_per_day}`);
      console.log(`   Game duration: ${row.game_duration_minutes} minutes`);
      console.log(`   Pre-game: ${row.pre_game_hydration_ml_per_kg}ml/kg`);
      console.log(
        `   During: ${row.during_game_hydration_ml_per_15min}ml/15min`,
      );
      console.log(`   Post-game: ${row.post_game_hydration_ml_per_kg}ml/kg`);
      console.log("");
    });

    // Demo 4: Show Training Protocols
    console.log("\n💪 TRAINING HYDRATION PROTOCOLS DEMO");
    console.log("-".repeat(30));

    const trainingQuery = `
      SELECT training_type, training_duration_minutes, training_intensity, 
             pre_training_hydration_ml_per_kg, during_training_hydration_ml_per_15min, post_training_hydration_ml_per_kg
      FROM training_hydration_protocols 
      ORDER BY training_duration_minutes DESC
    `;

    const trainingResult = await pool.query(trainingQuery);
    console.log("Training Hydration Protocols:");
    trainingResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.training_type}`);
      console.log(`   Duration: ${row.training_duration_minutes} minutes`);
      console.log(`   Intensity: ${row.training_intensity}`);
      console.log(`   Pre: ${row.pre_training_hydration_ml_per_kg}ml/kg`);
      console.log(
        `   During: ${row.during_training_hydration_ml_per_15min}ml/15min`,
      );
      console.log(`   Post: ${row.post_training_hydration_ml_per_kg}ml/kg`);
      console.log("");
    });

    // Demo 5: Show Supplement Research
    console.log("\n💊 SUPPLEMENT RESEARCH DEMO");
    console.log("-".repeat(30));

    const creatineQuery = `
      SELECT dosage_mg_per_kg, loading_phase_days, maintenance_dose_mg_per_day, 
             strength_improvement_percentage, flag_football_relevance_score
      FROM creatine_research 
      ORDER BY flag_football_relevance_score DESC 
      LIMIT 2
    `;

    const creatineResult = await pool.query(creatineQuery);
    console.log("Creatine Research (Top 2):");
    creatineResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. Dosage: ${row.dosage_mg_per_kg}mg/kg`);
      console.log(`   Loading Phase: ${row.loading_phase_days} days`);
      console.log(`   Maintenance: ${row.maintenance_dose_mg_per_day}mg/day`);
      console.log(
        `   Strength Improvement: ${row.strength_improvement_percentage}%`,
      );
      console.log(
        `   Flag Football Relevance: ${row.flag_football_relevance_score}/10`,
      );
      console.log("");
    });

    // Demo 6: Show Materialized Views
    console.log("\n📊 MATERIALIZED VIEWS DEMO");
    console.log("-".repeat(30));

    try {
      const viewQuery = `
        SELECT recommendation_text, hydration_amount_ml, timing_minutes, evidence_level
        FROM flag_football_hydration_recommendations 
        ORDER BY evidence_level DESC 
        LIMIT 3
      `;

      const viewResult = await pool.query(viewQuery);
      console.log("Flag Football Hydration Recommendations:");
      viewResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.recommendation_text}`);
        console.log(`   Amount: ${row.hydration_amount_ml}ml`);
        console.log(`   Timing: ${row.timing_minutes} minutes`);
        console.log(`   Evidence: ${row.evidence_level}`);
        console.log("");
      });
    } catch (_error) {
      console.log("⚠️ Materialized view not ready yet");
    }

    // Demo 7: Show System Statistics
    console.log("\n📈 SYSTEM STATISTICS");
    console.log("-".repeat(30));

    const statsQueries = [
      {
        name: "WADA Prohibited Substances",
        query: "SELECT COUNT(*) as count FROM wada_prohibited_substances",
      },
      {
        name: "Hydration Research Studies",
        query: "SELECT COUNT(*) as count FROM hydration_research_studies",
      },
      {
        name: "IFAF Protocols",
        query: "SELECT COUNT(*) as count FROM ifaf_hydration_protocols",
      },
      {
        name: "Training Protocols",
        query: "SELECT COUNT(*) as count FROM training_hydration_protocols",
      },
      {
        name: "Creatine Research",
        query: "SELECT COUNT(*) as count FROM creatine_research",
      },
      {
        name: "Beta-Alanine Research",
        query: "SELECT COUNT(*) as count FROM beta_alanine_research",
      },
      {
        name: "Caffeine Research",
        query: "SELECT COUNT(*) as count FROM caffeine_research",
      },
    ];

    for (const stat of statsQueries) {
      try {
        const result = await pool.query(stat.query);
        console.log(`${stat.name}: ${result.rows[0].count}`);
      } catch (_error) {
        console.log(`${stat.name}: 0 (table not created yet)`);
      }
    }

    console.log("\n🎉 DEMO COMPLETED SUCCESSFULLY!");
    console.log("\n🚀 NEXT STEPS:");
    console.log("   1. Frontend integration with HydrationDashboard component");
    console.log("   2. Real-time data updates via HydrationAPI service");
    console.log("   3. Automated research scraping via ResearchUpdateService");
    console.log("   4. WADA compliance monitoring via WADADataScrapingService");
    console.log("   5. Machine learning model training and updates");
  } catch (error) {
    console.error("❌ Demo failed:", error.message);
  } finally {
    await pool.end();
  }
}

// Run the demo
demoHydrationSystem();
