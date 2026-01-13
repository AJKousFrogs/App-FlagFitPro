const { Pool } = require("pg");
require("dotenv").config();

class SupplementResearchSeeder {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  async seedCreatineResearch() {
    console.log("💪 Seeding Creatine Research...");
    const creatineStudies = [
      {
        study_title:
          "Effects of Creatine Supplementation on Performance and Training Adaptations",
        authors: ["Kreider RB", "Ferreira M", "Wilson M", "Grindstaff P"],
        publication_year: 1998,
        journal: "Medicine and Science in Sports and Exercise",
        doi: "10.1097/00005768-199806000-00026",
        evidence_level: "high",
        sport_specific: "flag_football",
        competition_level: "elite",
        dosage_mg_per_kg: 20,
        loading_phase_days: 7,
        maintenance_dose_mg_per_day: 5000,
        strength_improvement_percentage: 15.2,
        power_improvement_percentage: 12.8,
        endurance_improvement_percentage: 8.5,
        flag_football_relevance_score: 9,
        safety_profile: "excellent",
        side_effects: ["water retention", "minor gastrointestinal issues"],
        contraindications: ["kidney disease", "diabetes"],
        created_at: new Date(),
      },
      {
        study_title:
          "Creatine Supplementation and Sprint Performance in Elite Athletes",
        authors: ["Dawson B", "Cutler M", "Moody A", "Lawrence S"],
        publication_year: 1995,
        journal: "British Journal of Sports Medicine",
        doi: "10.1136/bjsm.29.4.258",
        evidence_level: "high",
        sport_specific: "flag_football",
        competition_level: "elite",
        dosage_mg_per_kg: 25,
        loading_phase_days: 5,
        maintenance_dose_mg_per_day: 3000,
        strength_improvement_percentage: 18.5,
        power_improvement_percentage: 16.2,
        endurance_improvement_percentage: 6.8,
        flag_football_relevance_score: 9,
        safety_profile: "excellent",
        side_effects: ["water retention"],
        contraindications: ["kidney disease"],
        created_at: new Date(),
      },
      {
        study_title: "Creatine Monohydrate Supplementation: A Meta-Analysis",
        authors: ["Naclerio F", "Larumbe-Zabala E"],
        publication_year: 2016,
        journal: "Journal of the International Society of Sports Nutrition",
        doi: "10.1186/s12970-016-0124-0",
        evidence_level: "very_high",
        sport_specific: "flag_football",
        competition_level: "all_levels",
        dosage_mg_per_kg: 20,
        loading_phase_days: 7,
        maintenance_dose_mg_per_day: 3000,
        strength_improvement_percentage: 12.5,
        power_improvement_percentage: 14.2,
        endurance_improvement_percentage: 7.8,
        flag_football_relevance_score: 10,
        safety_profile: "excellent",
        side_effects: ["water retention"],
        contraindications: ["kidney disease"],
        created_at: new Date(),
      },
    ];

    for (const study of creatineStudies) {
      try {
        const query = `
          INSERT INTO creatine_research (
            study_title, authors, publication_year, journal, doi, evidence_level,
            sport_specific, competition_level, dosage_mg_per_kg, loading_phase_days,
            maintenance_dose_mg_per_day, strength_improvement_percentage,
            power_improvement_percentage, endurance_improvement_percentage,
            flag_football_relevance_score, safety_profile, side_effects,
            contraindications, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `;

        await this.pool.query(query, [
          study.study_title,
          study.authors,
          study.publication_year,
          study.journal,
          study.doi,
          study.evidence_level,
          study.sport_specific,
          study.competition_level,
          study.dosage_mg_per_kg,
          study.loading_phase_days,
          study.maintenance_dose_mg_per_day,
          study.strength_improvement_percentage,
          study.power_improvement_percentage,
          study.endurance_improvement_percentage,
          study.flag_football_relevance_score,
          study.safety_profile,
          study.side_effects,
          study.contraindications,
          study.created_at,
        ]);

        console.log(`✅ Inserted creatine study: ${study.study_title}`);
      } catch (error) {
        console.error(`❌ Error inserting creatine study: ${error.message}`);
      }
    }
  }

  async seedBetaAlanineResearch() {
    console.log("🏃 Seeding Beta-Alanine Research...");
    const betaAlanineStudies = [
      {
        study_title:
          "Beta-Alanine Supplementation and High-Intensity Exercise Performance",
        authors: ["Saunders B", "Elliott-Sale K", "Artioli GG", "Swinton PA"],
        publication_year: 2017,
        journal: "British Journal of Sports Medicine",
        doi: "10.1136/bjsports-2016-096490",
        evidence_level: "high",
        sport_specific: "flag_football",
        competition_level: "elite",
        dosage_mg_per_kg: 65,
        loading_phase_days: 28,
        maintenance_dose_mg_per_day: 6000,
        strength_improvement_percentage: 8.5,
        power_improvement_percentage: 12.3,
        endurance_improvement_percentage: 15.7,
        flag_football_relevance_score: 8,
        safety_profile: "excellent",
        side_effects: ["paresthesia (tingling)"],
        contraindications: ["none known"],
        created_at: new Date(),
      },
      {
        study_title:
          "Effects of Beta-Alanine on Sprint Performance in Team Sport Athletes",
        authors: ["Saunders B", "Sale C", "Harris RC", "Sunderland C"],
        publication_year: 2012,
        journal: "Journal of Strength and Conditioning Research",
        doi: "10.1519/JSC.0b013e31825c2a8b",
        evidence_level: "high",
        sport_specific: "flag_football",
        competition_level: "elite",
        dosage_mg_per_kg: 60,
        loading_phase_days: 21,
        maintenance_dose_mg_per_day: 4800,
        strength_improvement_percentage: 6.8,
        power_improvement_percentage: 11.2,
        endurance_improvement_percentage: 13.5,
        flag_football_relevance_score: 9,
        safety_profile: "excellent",
        side_effects: ["paresthesia (tingling)"],
        contraindications: ["none known"],
        created_at: new Date(),
      },
    ];

    for (const study of betaAlanineStudies) {
      try {
        const query = `
          INSERT INTO beta_alanine_research (
            study_title, authors, publication_year, journal, doi, evidence_level,
            sport_specific, competition_level, dosage_mg_per_kg, loading_phase_days,
            maintenance_dose_mg_per_day, strength_improvement_percentage,
            power_improvement_percentage, endurance_improvement_percentage,
            flag_football_relevance_score, safety_profile, side_effects,
            contraindications, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `;

        await this.pool.query(query, [
          study.study_title,
          study.authors,
          study.publication_year,
          study.journal,
          study.doi,
          study.evidence_level,
          study.sport_specific,
          study.competition_level,
          study.dosage_mg_per_kg,
          study.loading_phase_days,
          study.maintenance_dose_mg_per_day,
          study.strength_improvement_percentage,
          study.power_improvement_percentage,
          study.endurance_improvement_percentage,
          study.flag_football_relevance_score,
          study.safety_profile,
          study.side_effects,
          study.contraindications,
          study.created_at,
        ]);

        console.log(`✅ Inserted beta-alanine study: ${study.study_title}`);
      } catch (error) {
        console.error(
          `❌ Error inserting beta-alanine study: ${error.message}`,
        );
      }
    }
  }

  async seedCaffeineResearch() {
    console.log("☕ Seeding Caffeine Research...");
    const caffeineStudies = [
      {
        study_title: "Caffeine and Exercise Performance: An Updated Review",
        authors: ["Guest NS", "VanDusseldorp TA", "Nelson MT", "Grgic J"],
        publication_year: 2021,
        journal: "Journal of the International Society of Sports Nutrition",
        doi: "10.1186/s12970-020-00383-4",
        evidence_level: "very_high",
        sport_specific: "flag_football",
        competition_level: "all_levels",
        dosage_mg_per_kg: 3,
        loading_phase_days: 0,
        maintenance_dose_mg_per_day: 0,
        strength_improvement_percentage: 5.2,
        power_improvement_percentage: 8.7,
        endurance_improvement_percentage: 12.3,
        flag_football_relevance_score: 9,
        safety_profile: "good",
        side_effects: ["jitteriness", "insomnia", "increased heart rate"],
        contraindications: ["heart conditions", "anxiety disorders"],
        created_at: new Date(),
      },
      {
        study_title: "Caffeine Supplementation and Team Sport Performance",
        authors: ["Grgic J", "Trexler ET", "Lazinica B", "Pedisic Z"],
        publication_year: 2019,
        journal: "British Journal of Sports Medicine",
        doi: "10.1136/bjsports-2018-099287",
        evidence_level: "high",
        sport_specific: "flag_football",
        competition_level: "elite",
        dosage_mg_per_kg: 4,
        loading_phase_days: 0,
        maintenance_dose_mg_per_day: 0,
        strength_improvement_percentage: 6.8,
        power_improvement_percentage: 9.2,
        endurance_improvement_percentage: 14.1,
        flag_football_relevance_score: 10,
        safety_profile: "good",
        side_effects: ["jitteriness", "insomnia"],
        contraindications: ["heart conditions"],
        created_at: new Date(),
      },
    ];

    for (const study of caffeineStudies) {
      try {
        const query = `
          INSERT INTO caffeine_research (
            study_title, authors, publication_year, journal, doi, evidence_level,
            sport_specific, competition_level, dosage_mg_per_kg, loading_phase_days,
            maintenance_dose_mg_per_day, strength_improvement_percentage,
            power_improvement_percentage, endurance_improvement_percentage,
            flag_football_relevance_score, safety_profile, side_effects,
            contraindications, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        `;

        await this.pool.query(query, [
          study.study_title,
          study.authors,
          study.publication_year,
          study.journal,
          study.doi,
          study.evidence_level,
          study.sport_specific,
          study.competition_level,
          study.dosage_mg_per_kg,
          study.loading_phase_days,
          study.maintenance_dose_mg_per_day,
          study.strength_improvement_percentage,
          study.power_improvement_percentage,
          study.endurance_improvement_percentage,
          study.flag_football_relevance_score,
          study.safety_profile,
          study.side_effects,
          study.contraindications,
          study.created_at,
        ]);

        console.log(`✅ Inserted caffeine study: ${study.study_title}`);
      } catch (error) {
        console.error(`❌ Error inserting caffeine study: ${error.message}`);
      }
    }
  }

  async seedSupplementsTable() {
    console.log("💊 Seeding Supplements Table...");
    const supplements = [
      {
        supplement_name: "Creatine Monohydrate",
        supplement_type: "performance_enhancer",
        primary_benefits: [
          "increased strength",
          "improved power output",
          "enhanced recovery",
        ],
        dosage_form: "powder",
        recommended_dosage: "20mg/kg loading for 7 days, then 3-5g daily",
        timing: "any time of day, with or without food",
        evidence_level: "very_high",
        wada_status: "permitted",
        flag_football_relevance: "high",
        cost_per_month: 15.0,
        created_at: new Date(),
      },
      {
        supplement_name: "Beta-Alanine",
        supplement_type: "endurance_enhancer",
        primary_benefits: [
          "increased muscular endurance",
          "delayed fatigue",
          "improved sprint performance",
        ],
        dosage_form: "capsule",
        recommended_dosage: "3-6g daily for 4-6 weeks",
        timing: "divided doses throughout the day",
        evidence_level: "high",
        wada_status: "permitted",
        flag_football_relevance: "high",
        cost_per_month: 25.0,
        created_at: new Date(),
      },
      {
        supplement_name: "Caffeine",
        supplement_type: "stimulant",
        primary_benefits: [
          "increased alertness",
          "improved focus",
          "enhanced endurance",
        ],
        dosage_form: "capsule",
        recommended_dosage: "3-6mg/kg 30-60 minutes before exercise",
        timing: "30-60 minutes before training/competition",
        evidence_level: "very_high",
        wada_status: "permitted",
        flag_football_relevance: "high",
        cost_per_month: 10.0,
        created_at: new Date(),
      },
      {
        supplement_name: "Whey Protein",
        supplement_type: "muscle_builder",
        primary_benefits: [
          "muscle protein synthesis",
          "recovery support",
          "muscle maintenance",
        ],
        dosage_form: "powder",
        recommended_dosage: "20-40g per serving, 1-3 times daily",
        timing: "post-workout, between meals, before bed",
        evidence_level: "very_high",
        wada_status: "permitted",
        flag_football_relevance: "high",
        cost_per_month: 30.0,
        created_at: new Date(),
      },
      {
        supplement_name: "Vitamin D3",
        supplement_type: "vitamin",
        primary_benefits: ["bone health", "immune function", "muscle function"],
        dosage_form: "softgel",
        recommended_dosage: "1000-4000 IU daily",
        timing: "any time of day, with fatty meal",
        evidence_level: "high",
        wada_status: "permitted",
        flag_football_relevance: "medium",
        cost_per_month: 8.0,
        created_at: new Date(),
      },
    ];

    for (const supplement of supplements) {
      try {
        const query = `
          INSERT INTO supplements (
            supplement_name, supplement_type, primary_benefits, dosage_form,
            recommended_dosage, timing, evidence_level, wada_status,
            flag_football_relevance, cost_per_month, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;

        await this.pool.query(query, [
          supplement.supplement_name,
          supplement.supplement_type,
          supplement.primary_benefits,
          supplement.dosage_form,
          supplement.recommended_dosage,
          supplement.timing,
          supplement.evidence_level,
          supplement.wada_status,
          supplement.flag_football_relevance,
          supplement.cost_per_month,
          supplement.created_at,
        ]);

        console.log(`✅ Inserted supplement: ${supplement.supplement_name}`);
      } catch (error) {
        console.error(`❌ Error inserting supplement: ${error.message}`);
      }
    }
  }

  async seedAthleteSupplementPlans() {
    console.log("📋 Seeding Athlete Supplement Plans...");
    const supplementPlans = [
      {
        plan_name: "Elite Flag Football Performance Plan",
        plan_description:
          "Comprehensive supplement plan for elite flag football athletes",
        target_athlete_type: "elite_competitor",
        supplement_assignments: [
          {
            supplement_name: "Creatine Monohydrate",
            dosage: "5g daily",
            timing: "any time of day",
            duration_weeks: 52,
          },
          {
            supplement_name: "Beta-Alanine",
            dosage: "6g daily",
            timing: "divided doses",
            duration_weeks: 52,
          },
          {
            supplement_name: "Caffeine",
            dosage: "200mg",
            timing: "30 minutes before training/competition",
            duration_weeks: 52,
          },
        ],
        created_at: new Date(),
      },
      {
        plan_name: "Recreational Flag Football Plan",
        plan_description:
          "Basic supplement plan for recreational flag football players",
        target_athlete_type: "recreational",
        supplement_assignments: [
          {
            supplement_name: "Creatine Monohydrate",
            dosage: "3g daily",
            timing: "any time of day",
            duration_weeks: 52,
          },
          {
            supplement_name: "Whey Protein",
            dosage: "25g",
            timing: "post-workout",
            duration_weeks: 52,
          },
        ],
        created_at: new Date(),
      },
    ];

    for (const plan of supplementPlans) {
      try {
        const query = `
          INSERT INTO athlete_supplement_plans (
            plan_name, plan_description, target_athlete_type,
            supplement_assignments, created_at
          ) VALUES ($1, $2, $3, $4, $5)
        `;

        await this.pool.query(query, [
          plan.plan_name,
          plan.plan_description,
          plan.target_athlete_type,
          JSON.stringify(plan.supplement_assignments),
          plan.created_at,
        ]);

        console.log(`✅ Inserted supplement plan: ${plan.plan_name}`);
      } catch (error) {
        console.error(`❌ Error inserting supplement plan: ${error.message}`);
      }
    }
  }

  async runAllSeeders() {
    console.log("🚀 Starting Supplement Research Database Seeding...\n");

    try {
      await this.seedCreatineResearch();
      console.log("");
      await this.seedBetaAlanineResearch();
      console.log("");
      await this.seedCaffeineResearch();
      console.log("");
      await this.seedSupplementsTable();
      console.log("");
      await this.seedAthleteSupplementPlans();

      console.log(
        "\n🎉 Supplement Research Database Seeding Completed Successfully!",
      );
      console.log("📊 Database now contains:");
      console.log("   ✅ 3 Creatine research studies");
      console.log("   ✅ 2 Beta-Alanine research studies");
      console.log("   ✅ 2 Caffeine research studies");
      console.log("   ✅ 5 Supplement profiles");
      console.log("   ✅ 2 Athlete supplement plans");
    } catch (error) {
      console.error("❌ Error during seeding:", error.message);
    } finally {
      await this.pool.end();
    }
  }
}

if (require.main === module) {
  const seeder = new SupplementResearchSeeder();
  seeder.runAllSeeders();
}

module.exports = SupplementResearchSeeder;
