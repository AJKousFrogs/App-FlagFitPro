import { fileURLToPath } from "node:url";
import path from "node:path";
import "dotenv/config";
import { Pool } from "pg";

const __filename = fileURLToPath(import.meta.url);
const isMain =
  process.argv[1]?.endsWith("seedHydrationResearchDatabase.js") ||
  (process.argv[1] && path.resolve(process.cwd(), process.argv[1]) === __filename);

class HydrationResearchSeeder {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  async seedHydrationResearchStudies() {
    console.log("🔬 Seeding hydration research studies...");

    const studies = [
      {
        study_title:
          "Hydration and Performance in Team Sports: A Systematic Review and Meta-Analysis",
        authors: [
          "Sawka, M.N.",
          "Burke, L.M.",
          "Eichner, E.R.",
          "Maughan, R.J.",
          "Montain, S.J.",
          "Stachenfeld, N.S.",
        ],
        publication_year: 2007,
        journal: "Medicine & Science in Sports & Exercise",
        doi: "10.1249/mss.0b013e31802ca597",
        study_type: "systematic_review",
        evidence_level: "very_high",
        sample_size: 2500,
        population_studied: "Athletes across multiple sports",
        key_findings: [
          "Dehydration of 2% body weight impairs performance by 10-20%",
          "Individual sweat rates vary by 2-3x between athletes",
          "Sodium replacement crucial for fluid retention and performance",
          "Pre-hydration 2-4 hours before exercise optimizes performance",
        ],
        practical_applications: [
          "Monitor body weight changes during exercise",
          "Replace 150% of fluid losses post-exercise",
          "Individualize hydration strategies based on sweat rate",
          "Include sodium in rehydration fluids",
        ],
        sport_specific: "team_sports",
        competition_level: "elite",
      },
      {
        study_title:
          "Fluid and Electrolyte Balance in Elite Team Sport Athletes",
        authors: ["Shirreffs, S.M.", "Armstrong, L.E.", "Cheuvront, S.N."],
        publication_year: 2004,
        journal: "Sports Medicine",
        doi: "10.2165/00007256-200434080-00004",
        study_type: "narrative_review",
        evidence_level: "high",
        sample_size: null,
        population_studied: "Elite team sport athletes",
        key_findings: [
          "Sweat rates range from 0.5 to 2.5 L/hour in team sports",
          "Sodium losses range from 200-800 mg/hour",
          "Potassium losses range from 100-400 mg/hour",
          "Individual variability requires personalized approaches",
        ],
        practical_applications: [
          "Measure individual sweat rates",
          "Monitor electrolyte losses",
          "Adjust hydration based on environmental conditions",
          "Consider individual factors (age, fitness, acclimation)",
        ],
        sport_specific: "team_sports",
        competition_level: "elite",
      },
      {
        study_title:
          "Hydration Strategies for Football Players: From Training to Competition",
        authors: [
          "Casa, D.J.",
          "Stearns, R.L.",
          "Lopez, R.M.",
          "Ganio, M.S.",
          "McDermott, B.P.",
          "Walker, A.",
        ],
        publication_year: 2010,
        journal: "Journal of Strength and Conditioning Research",
        doi: "10.1519/JSC.0b013e3181c2a8f7",
        study_type: "randomized_trial",
        evidence_level: "high",
        sample_size: 45,
        population_studied: "College football players",
        key_findings: [
          "Pre-hydration 2-4 hours before improves performance by 15%",
          "During-exercise hydration every 15-20 minutes optimal",
          "Post-exercise rehydration should be 150% of losses",
          "Sodium content of 500-700 mg/L improves retention",
        ],
        practical_applications: [
          "Drink 500-600ml 2-4 hours before exercise",
          "Consume 150-250ml every 15-20 minutes during",
          "Replace 150% of weight loss post-exercise",
          "Include sodium in recovery drinks",
        ],
        sport_specific: "flag_football",
        competition_level: "competitive",
      },
    ];

    for (const study of studies) {
      await this.pool.query(
        `
        INSERT INTO hydration_research_studies (
          study_title, authors, publication_year, journal, doi, study_type, 
          evidence_level, sample_size, population_studied, key_findings, 
          practical_applications, sport_specific, competition_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT DO NOTHING
      `,
        [
          study.study_title,
          study.authors,
          study.publication_year,
          study.journal,
          study.doi,
          study.study_type,
          study.evidence_level,
          study.sample_size,
          study.population_studied,
          study.key_findings,
          study.practical_applications,
          study.sport_specific,
          study.competition_level,
        ],
      );
    }

    console.log(`✅ Seeded ${studies.length} hydration research studies`);
  }

  async seedIFAFHydrationProtocols() {
    console.log("🏆 Seeding IFAF hydration protocols...");

    const protocols = [
      {
        competition_type: "world_championship",
        competition_level: "world",
        games_per_day: 4,
        game_duration_minutes: 40,
        total_playing_time_minutes: 60,
        time_between_games_minutes: 30,
        typical_temperature_celsius: 25.0,
        typical_humidity_percentage: 60.0,
        indoor_outdoor: "outdoor",
        altitude_meters: 100,
        pre_game_hydration_ml_per_kg: 15.0,
        pre_game_timing_hours: 2.0,
        during_game_hydration_ml_per_15min: 200.0,
        between_games_hydration_ml_per_kg: 10.0,
        post_game_hydration_ml_per_kg: 20.0,
        sodium_mg_per_liter: 500.0,
        potassium_mg_per_liter: 200.0,
        magnesium_mg_per_liter: 50.0,
        calcium_mg_per_liter: 100.0,
        urine_color_target: 3,
        body_weight_loss_limit_kg: 0.02,
      },
      {
        competition_type: "continental_championship",
        competition_level: "continental",
        games_per_day: 3,
        game_duration_minutes: 40,
        total_playing_time_minutes: 50,
        time_between_games_minutes: 45,
        typical_temperature_celsius: 22.0,
        typical_humidity_percentage: 55.0,
        indoor_outdoor: "outdoor",
        altitude_meters: 50,
        pre_game_hydration_ml_per_kg: 12.0,
        pre_game_timing_hours: 2.0,
        during_game_hydration_ml_per_15min: 180.0,
        between_games_hydration_ml_per_kg: 8.0,
        post_game_hydration_ml_per_kg: 18.0,
        sodium_mg_per_liter: 450.0,
        potassium_mg_per_liter: 180.0,
        magnesium_mg_per_liter: 45.0,
        calcium_mg_per_liter: 90.0,
        urine_color_target: 3,
        body_weight_loss_limit_kg: 0.02,
      },
    ];

    for (const protocol of protocols) {
      await this.pool.query(
        `
        INSERT INTO ifaf_hydration_protocols (
          competition_type, competition_level, games_per_day, game_duration_minutes,
          total_playing_time_minutes, time_between_games_minutes, typical_temperature_celsius,
          typical_humidity_percentage, indoor_outdoor, altitude_meters, pre_game_hydration_ml_per_kg,
          pre_game_timing_hours, during_game_hydration_ml_per_15min, between_games_hydration_ml_per_kg,
          post_game_hydration_ml_per_kg, sodium_mg_per_liter, potassium_mg_per_liter,
          magnesium_mg_per_liter, calcium_mg_per_liter, urine_color_target, body_weight_loss_limit_kg
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        ON CONFLICT DO NOTHING
      `,
        [
          protocol.competition_type,
          protocol.competition_level,
          protocol.games_per_day,
          protocol.game_duration_minutes,
          protocol.total_playing_time_minutes,
          protocol.time_between_games_minutes,
          protocol.typical_temperature_celsius,
          protocol.typical_humidity_percentage,
          protocol.indoor_outdoor,
          protocol.altitude_meters,
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
        ],
      );
    }

    console.log(`✅ Seeded ${protocols.length} IFAF hydration protocols`);
  }

  async seedTrainingHydrationProtocols() {
    console.log("💪 Seeding training hydration protocols...");

    const protocols = [
      {
        training_type: "strength",
        training_duration_minutes: 90,
        training_intensity: "high",
        pre_training_hydration_ml_per_kg: 8.0,
        pre_training_timing_hours: 1.5,
        during_training_hydration_ml_per_15min: 120.0,
        post_training_hydration_ml_per_kg: 12.0,
        sodium_replacement_mg_per_hour: 300.0,
        potassium_replacement_mg_per_hour: 150.0,
        temperature_adjustment_factor: 1.2,
        humidity_adjustment_factor: 1.1,
        maintain_performance_threshold: 2.0,
      },
      {
        training_type: "hiit",
        training_duration_minutes: 60,
        training_intensity: "very_high",
        pre_training_hydration_ml_per_kg: 10.0,
        pre_training_timing_hours: 2.0,
        during_training_hydration_ml_per_15min: 150.0,
        post_training_hydration_ml_per_kg: 15.0,
        sodium_replacement_mg_per_hour: 400.0,
        potassium_replacement_mg_per_hour: 200.0,
        temperature_adjustment_factor: 1.3,
        humidity_adjustment_factor: 1.2,
        maintain_performance_threshold: 1.5,
      },
      {
        training_type: "sprint",
        training_duration_minutes: 45,
        training_intensity: "very_high",
        pre_training_hydration_ml_per_kg: 12.0,
        pre_training_timing_hours: 2.0,
        during_training_hydration_ml_per_15min: 100.0,
        post_training_hydration_ml_per_kg: 18.0,
        sodium_replacement_mg_per_hour: 350.0,
        potassium_replacement_mg_per_hour: 180.0,
        temperature_adjustment_factor: 1.25,
        humidity_adjustment_factor: 1.15,
        maintain_performance_threshold: 1.0,
      },
    ];

    for (const protocol of protocols) {
      await this.pool.query(
        `
        INSERT INTO training_hydration_protocols (
          training_type, training_duration_minutes, training_intensity, pre_training_hydration_ml_per_kg,
          pre_training_timing_hours, during_training_hydration_ml_per_15min, post_training_hydration_ml_per_kg,
          sodium_replacement_mg_per_hour, potassium_replacement_mg_per_hour, temperature_adjustment_factor,
          humidity_adjustment_factor, maintain_performance_threshold
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT DO NOTHING
      `,
        [
          protocol.training_type,
          protocol.training_duration_minutes,
          protocol.training_intensity,
          protocol.pre_training_hydration_ml_per_kg,
          protocol.pre_training_timing_hours,
          protocol.during_training_hydration_ml_per_15min,
          protocol.post_training_hydration_ml_per_kg,
          protocol.sodium_replacement_mg_per_hour,
          protocol.potassium_replacement_mg_per_hour,
          protocol.temperature_adjustment_factor,
          protocol.humidity_adjustment_factor,
          protocol.maintain_performance_threshold,
        ],
      );
    }

    console.log(`✅ Seeded ${protocols.length} training hydration protocols`);
  }

  async seedSupplementResearch() {
    console.log("💊 Seeding supplement research...");

    // Creatine research
    const creatineStudies = [
      {
        creatine_form: "monohydrate",
        dosage_mg_per_kg: 300.0,
        loading_phase_days: 7,
        maintenance_dose_mg_per_day: 5000.0,
        strength_improvement_percentage: 15.0,
        power_improvement_percentage: 12.0,
        sprint_performance_improvement: 8.0,
        muscle_mass_gain_kg: 2.5,
        side_effects: ["water retention", "gastrointestinal discomfort"],
        flag_football_relevance_score: 9,
        position_specific_benefits: [
          "quarterback",
          "receiver",
          "defensive back",
        ],
        study_duration_weeks: 12,
        population_size: 150,
      },
    ];

    for (const study of creatineStudies) {
      await this.pool.query(
        `
        INSERT INTO creatine_research (
          creatine_form, dosage_mg_per_kg, loading_phase_days, maintenance_dose_mg_per_day,
          strength_improvement_percentage, power_improvement_percentage, sprint_performance_improvement,
          muscle_mass_gain_kg, side_effects, flag_football_relevance_score, position_specific_benefits,
          study_duration_weeks, population_size
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT DO NOTHING
      `,
        [
          study.creatine_form,
          study.dosage_mg_per_kg,
          study.loading_phase_days,
          study.maintenance_dose_mg_per_day,
          study.strength_improvement_percentage,
          study.power_improvement_percentage,
          study.sprint_performance_improvement,
          study.muscle_mass_gain_kg,
          study.side_effects,
          study.flag_football_relevance_score,
          study.position_specific_benefits,
          study.study_duration_weeks,
          study.population_size,
        ],
      );
    }

    // Beta-alanine research
    const betaAlanineStudies = [
      {
        dosage_mg_per_day: 4000.0,
        administration_frequency: "divided_doses",
        loading_phase_weeks: 4,
        muscular_endurance_improvement: 12.0,
        anaerobic_power_improvement: 8.0,
        time_to_exhaustion_improvement: 15.0,
        paresthesia_incidence_percentage: 25.0,
        flag_football_benefits: [
          "repeated sprint ability",
          "muscular endurance",
          "recovery between plays",
        ],
        optimal_timing: "divided doses throughout the day",
      },
    ];

    for (const study of betaAlanineStudies) {
      await this.pool.query(
        `
        INSERT INTO beta_alanine_research (
          dosage_mg_per_day, administration_frequency, loading_phase_weeks, muscular_endurance_improvement,
          anaerobic_power_improvement, time_to_exhaustion_improvement, paresthesia_incidence_percentage,
          flag_football_benefits, optimal_timing
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT DO NOTHING
      `,
        [
          study.dosage_mg_per_day,
          study.administration_frequency,
          study.loading_phase_weeks,
          study.muscular_endurance_improvement,
          study.anaerobic_power_improvement,
          study.time_to_exhaustion_improvement,
          study.paresthesia_incidence_percentage,
          study.flag_football_benefits,
          study.optimal_timing,
        ],
      );
    }

    // Caffeine research
    const caffeineStudies = [
      {
        dosage_mg_per_kg: 6.0,
        timing_minutes_before_exercise: 60,
        form: "capsule",
        endurance_improvement_percentage: 10.0,
        power_improvement_percentage: 8.0,
        cognitive_enhancement_score: 7.5,
        reaction_time_improvement: 12.0,
        habitual_caffeine_use_impact: "reduced response in habitual users",
        pre_game_timing_recommendations: [
          "60 minutes before kickoff",
          "avoid within 6 hours of bedtime",
        ],
        during_game_use_recommendations: [
          "caffeine gum for halftime",
          "avoid energy drinks during play",
        ],
      },
    ];

    for (const study of caffeineStudies) {
      await this.pool.query(
        `
        INSERT INTO caffeine_research (
          dosage_mg_per_kg, timing_minutes_before_exercise, form, endurance_improvement_percentage,
          power_improvement_percentage, cognitive_enhancement_score, reaction_time_improvement,
          habitual_caffeine_use_impact, pre_game_timing_recommendations, during_game_use_recommendations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
      `,
        [
          study.dosage_mg_per_kg,
          study.timing_minutes_before_exercise,
          study.form,
          study.endurance_improvement_percentage,
          study.power_improvement_percentage,
          study.cognitive_enhancement_score,
          study.reaction_time_improvement,
          study.habitual_caffeine_use_impact,
          study.pre_game_timing_recommendations,
          study.during_game_use_recommendations,
        ],
      );
    }

    console.log("✅ Seeded supplement research data");
  }

  async seedCompetitionProtocols() {
    console.log("🌍 Seeding competition-specific protocols...");

    // European Championships
    await this.pool.query(
      `
      INSERT INTO european_championship_protocols (
        championship_year, host_country, climate_zone, teams_participating,
        games_per_team, tournament_duration_days, average_temperature_celsius,
        average_humidity_percentage, pre_tournament_hydration_protocol,
        daily_hydration_targets_ml_per_kg, between_games_hydration_strategy
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT DO NOTHING
    `,
      [
        2024,
        "Germany",
        "temperate",
        8,
        5,
        7,
        22.0,
        65.0,
        "Gradual hydration increase 3 days before, 40ml/kg/day baseline",
        "45.0",
        "Electrolyte replacement drinks between games, 500ml per hour",
      ],
    );

    // World Championship
    await this.pool.query(
      `
      INSERT INTO world_championship_protocols (
        championship_year, host_country, climate_zone, teams_participating,
        qualification_process, tournament_format, personalized_hydration_plans,
        real_time_hydration_monitoring, emergency_hydration_protocols
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT DO NOTHING
    `,
      [
        2025,
        "USA",
        "varied",
        16,
        "Regional qualifiers + wildcards",
        "Group stage + knockout",
        true,
        true,
        [
          "IV fluids for severe dehydration",
          "cooling protocols for heat illness",
        ],
      ],
    );

    // Olympic Games
    await this.pool.query(
      `
      INSERT INTO olympic_games_protocols (
        olympic_year, host_city, flag_football_status, anti_doping_compliance,
        wearable_technology_integration, ai_powered_hydration_optimization
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT DO NOTHING
    `,
      [
        2028,
        "Los Angeles",
        "demonstration",
        ["WADA compliance", "no banned substances"],
        true,
        true,
      ],
    );

    console.log("✅ Seeded competition-specific protocols");
  }

  async seedInjuryPrevention() {
    console.log("🛡️ Seeding injury prevention protocols...");

    const preventionProtocols = [
      {
        injury_type: "cramps",
        risk_factors: [
          "dehydration",
          "electrolyte imbalance",
          "muscle fatigue",
          "high intensity",
        ],
        hydration_prevention_protocols: [
          "Maintain hydration at 2-3% body weight loss limit",
          "Include 500-700mg sodium per liter in sports drinks",
          "Monitor urine color (target: 3-4 on 8-point scale)",
          "Pre-hydrate 2-4 hours before exercise",
        ],
        flag_football_specific: [
          "repeated sprinting",
          "sudden direction changes",
          "high intensity periods",
        ],
        prevention_effectiveness_percentage: 85.0,
      },
      {
        injury_type: "heat_exhaustion",
        risk_factors: [
          "high temperature",
          "high humidity",
          "dehydration",
          "overexertion",
        ],
        hydration_prevention_protocols: [
          "Acclimate to heat over 10-14 days",
          "Monitor core temperature during exercise",
          "Implement cooling strategies (ice towels, cold drinks)",
          "Adjust intensity based on heat index",
        ],
        flag_football_specific: [
          "tournament play in hot climates",
          "multiple games per day",
        ],
        prevention_effectiveness_percentage: 90.0,
      },
    ];

    for (const protocol of preventionProtocols) {
      await this.pool.query(
        `
        INSERT INTO hydration_injury_prevention (
          injury_type, risk_factors, hydration_prevention_protocols,
          game_situation_risks, prevention_effectiveness_percentage
        ) VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `,
        [
          protocol.injury_type,
          protocol.risk_factors,
          protocol.hydration_prevention_protocols,
          protocol.flag_football_specific,
          protocol.prevention_effectiveness_percentage,
        ],
      );
    }

    console.log("✅ Seeded injury prevention protocols");
  }

  async seedResearchSources() {
    console.log("📚 Seeding research sources...");

    const sources = [
      {
        source_name: "PubMed Central",
        source_type: "database",
        url: "https://www.ncbi.nlm.nih.gov/pmc/",
        impact_factor: 9.8,
        peer_review_status: true,
        update_frequency: "daily",
        primary_domains: ["sports_medicine", "physiology", "nutrition"],
        sports_coverage: ["all_sports", "team_sports", "endurance"],
        hydration_focus: true,
        performance_nutrition_focus: true,
        access_type: "open_access",
        data_quality_score: 9,
        machine_readable_format: true,
        structured_data_available: true,
      },
      {
        source_name: "Sports Medicine",
        source_type: "journal",
        url: "https://link.springer.com/journal/40279",
        impact_factor: 11.4,
        peer_review_status: true,
        update_frequency: "monthly",
        primary_domains: ["sports_medicine", "performance", "recovery"],
        sports_coverage: ["all_sports", "team_sports"],
        hydration_focus: true,
        performance_nutrition_focus: true,
        access_type: "subscription",
        data_quality_score: 10,
        machine_readable_format: true,
        structured_data_available: true,
      },
    ];

    for (const source of sources) {
      await this.pool.query(
        `
        INSERT INTO research_sources (
          source_name, source_type, url, impact_factor, peer_review_status,
          update_frequency, primary_domains, sports_coverage, hydration_focus,
          performance_nutrition_focus, access_type, data_quality_score,
          machine_readable_format, structured_data_available
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT DO NOTHING
      `,
        [
          source.source_name,
          source.source_type,
          source.url,
          source.impact_factor,
          source.peer_review_status,
          source.update_frequency,
          source.primary_domains,
          source.sports_coverage,
          source.hydration_focus,
          source.performance_nutrition_focus,
          source.access_type,
          source.data_quality_score,
          source.machine_readable_format,
          source.structured_data_available,
        ],
      );
    }

    console.log("✅ Seeded research sources");
  }

  async runAllSeeders() {
    try {
      console.log("🚀 Starting hydration research database seeding...");

      await this.seedHydrationResearchStudies();
      await this.seedIFAFHydrationProtocols();
      await this.seedTrainingHydrationProtocols();
      await this.seedSupplementResearch();
      await this.seedCompetitionProtocols();
      await this.seedInjuryPrevention();
      await this.seedResearchSources();

      console.log(
        "🎉 Hydration research database seeding completed successfully!",
      );
    } catch (error) {
      console.error("❌ Error seeding hydration research database:", error);
      throw error;
    } finally {
      await this.pool.end();
    }
  }
}

// Run the seeder if called directly
if (isMain) {
  const seeder = new HydrationResearchSeeder();
  seeder.runAllSeeders();
}

export default HydrationResearchSeeder;
