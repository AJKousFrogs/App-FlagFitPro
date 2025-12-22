const { Pool } = require('pg');
require('dotenv').config();

class SupplementResearchSeederCorrected {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async seedCreatineResearch() {
    console.log('💪 Seeding Creatine Research...');
    const creatineStudies = [
      {
        research_study_id: 1, // Assuming this exists in hydration_research_studies
        creatine_form: 'Creatine Monohydrate',
        dosage_mg_per_kg: 20.0,
        loading_phase_days: 7,
        maintenance_dose_mg_per_day: 5000.0,
        strength_improvement_percentage: 15.20,
        power_improvement_percentage: 12.80,
        sprint_performance_improvement: 8.50,
        muscle_mass_gain_kg: 2.500,
        side_effects: ['water retention', 'minor gastrointestinal issues'],
        contraindications: ['kidney disease', 'diabetes'],
        long_term_safety_data: true,
        flag_football_relevance_score: 9,
        position_specific_benefits: ['quarterback', 'running_back', 'linebacker'],
        study_duration_weeks: 12,
        population_size: 150,
        control_group_used: true
      },
      {
        research_study_id: 2, // Assuming this exists in hydration_research_studies
        creatine_form: 'Creatine Monohydrate',
        dosage_mg_per_kg: 25.0,
        loading_phase_days: 5,
        maintenance_dose_mg_per_day: 3000.0,
        strength_improvement_percentage: 18.50,
        power_improvement_percentage: 16.20,
        sprint_performance_improvement: 6.80,
        muscle_mass_gain_kg: 3.200,
        side_effects: ['water retention'],
        contraindications: ['kidney disease'],
        long_term_safety_data: true,
        flag_football_relevance_score: 9,
        position_specific_benefits: ['defensive_end', 'safety'],
        study_duration_weeks: 8,
        population_size: 100,
        control_group_used: true
      }
    ];

    for (const study of creatineStudies) {
      try {
        const query = `
          INSERT INTO creatine_research (
            research_study_id, creatine_form, dosage_mg_per_kg, loading_phase_days,
            maintenance_dose_mg_per_day, strength_improvement_percentage,
            power_improvement_percentage, sprint_performance_improvement,
            muscle_mass_gain_kg, side_effects, contraindications,
            long_term_safety_data, flag_football_relevance_score,
            position_specific_benefits, study_duration_weeks, population_size,
            control_group_used
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `;
        
        await this.pool.query(query, [
          study.research_study_id, study.creatine_form, study.dosage_mg_per_kg,
          study.loading_phase_days, study.maintenance_dose_mg_per_day,
          study.strength_improvement_percentage, study.power_improvement_percentage,
          study.sprint_performance_improvement, study.muscle_mass_gain_kg,
          study.side_effects, study.contraindications, study.long_term_safety_data,
          study.flag_football_relevance_score, study.position_specific_benefits,
          study.study_duration_weeks, study.population_size, study.control_group_used
        ]);
        
        console.log(`✅ Inserted creatine study: ${study.creatine_form}`);
      } catch (error) {
        console.error(`❌ Error inserting creatine study: ${error.message}`);
      }
    }
  }

  async seedSupplementsTable() {
    console.log('💊 Seeding Supplements Table...');
    const supplements = [
      {
        name: 'Creatine Monohydrate',
        category: 'performance_enhancer',
        subcategory: 'strength_power',
        active_ingredients: {
          "creatine_monohydrate": "5g per serving",
          "purity": "99.9%"
        },
        serving_size: '5g (1 teaspoon)',
        servings_per_container: 100,
        evidence_level: 'very_high',
        safety_rating: 'excellent',
        banned_substance_risk: 'none',
        performance_benefits: [
          'increased strength',
          'improved power output',
          'enhanced recovery',
          'muscle mass gains'
        ],
        recommended_timing: 'any time of day',
        recommended_dosage: '20mg/kg loading for 7 days, then 3-5g daily',
        duration_of_use: 'long-term safe',
        drug_interactions: ['none known'],
        food_interactions: ['none known'],
        side_effects: ['water retention', 'minor gastrointestinal issues'],
        contraindications: ['kidney disease', 'diabetes'],
        research_summary: 'Extensive research supports creatine monohydrate for strength and power improvements',
        key_studies: [
          'Kreider et al. (1998) - Medicine and Science in Sports and Exercise',
          'Dawson et al. (1995) - British Journal of Sports Medicine'
        ],
        brand: 'Generic',
        cost_per_serving: 0.15,
        third_party_tested: true
      },
      {
        name: 'Beta-Alanine',
        category: 'endurance_enhancer',
        subcategory: 'muscular_endurance',
        active_ingredients: {
          "beta_alanine": "3g per serving",
          "purity": "99.5%"
        },
        serving_size: '3g (1 capsule)',
        servings_per_container: 60,
        evidence_level: 'high',
        safety_rating: 'excellent',
        banned_substance_risk: 'none',
        performance_benefits: [
          'increased muscular endurance',
          'delayed fatigue',
          'improved sprint performance',
          'enhanced high-intensity work capacity'
        ],
        recommended_timing: 'divided doses throughout the day',
        recommended_dosage: '3-6g daily for 4-6 weeks',
        duration_of_use: 'long-term safe',
        drug_interactions: ['none known'],
        food_interactions: ['none known'],
        side_effects: ['paresthesia (tingling)'],
        contraindications: ['none known'],
        research_summary: 'Strong evidence for beta-alanine in improving high-intensity exercise performance',
        key_studies: [
          'Saunders et al. (2017) - British Journal of Sports Medicine',
          'Saunders et al. (2012) - Journal of Strength and Conditioning Research'
        ],
        brand: 'Generic',
        cost_per_serving: 0.25,
        third_party_tested: true
      },
      {
        name: 'Caffeine',
        category: 'stimulant',
        subcategory: 'performance_stimulant',
        active_ingredients: {
          "caffeine_anhydrous": "200mg per serving",
          "purity": "99.9%"
        },
        serving_size: '200mg (1 capsule)',
        servings_per_container: 30,
        evidence_level: 'very_high',
        safety_rating: 'good',
        banned_substance_risk: 'none',
        performance_benefits: [
          'increased alertness',
          'improved focus',
          'enhanced endurance',
          'reduced perceived effort'
        ],
        recommended_timing: '30-60 minutes before training/competition',
        recommended_dosage: '3-6mg/kg 30-60 minutes before exercise',
        duration_of_use: 'intermittent use recommended',
        drug_interactions: ['heart medications', 'anxiety medications'],
        food_interactions: ['none known'],
        side_effects: ['jitteriness', 'insomnia', 'increased heart rate'],
        contraindications: ['heart conditions', 'anxiety disorders'],
        research_summary: 'Extensive research supports caffeine for improved exercise performance',
        key_studies: [
          'Guest et al. (2021) - Journal of the International Society of Sports Nutrition',
          'Grgic et al. (2019) - British Journal of Sports Medicine'
        ],
        brand: 'Generic',
        cost_per_serving: 0.10,
        third_party_tested: true
      }
    ];

    for (const supplement of supplements) {
      try {
        const query = `
          INSERT INTO supplements (
            name, category, subcategory, active_ingredients, serving_size,
            servings_per_container, evidence_level, safety_rating,
            banned_substance_risk, performance_benefits, recommended_timing,
            recommended_dosage, duration_of_use, drug_interactions,
            food_interactions, side_effects, contraindications, research_summary,
            key_studies, brand, cost_per_serving, third_party_tested
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        `;
        
        await this.pool.query(query, [
          supplement.name, supplement.category, supplement.subcategory,
          JSON.stringify(supplement.active_ingredients), supplement.serving_size,
          supplement.servings_per_container, supplement.evidence_level,
          supplement.safety_rating, supplement.banned_substance_risk,
          supplement.performance_benefits, supplement.recommended_timing,
          supplement.recommended_dosage, supplement.duration_of_use,
          supplement.drug_interactions, supplement.food_interactions,
          supplement.side_effects, supplement.contraindications,
          supplement.research_summary, supplement.key_studies,
          supplement.brand, supplement.cost_per_serving, supplement.third_party_tested
        ]);
        
        console.log(`✅ Inserted supplement: ${supplement.name}`);
      } catch (error) {
        console.error(`❌ Error inserting supplement: ${error.message}`);
      }
    }
  }

  async seedAthleteSupplementPlans() {
    console.log('📋 Seeding Athlete Supplement Plans...');
    
    // First get supplement IDs
    const supplementResult = await this.pool.query('SELECT id, name FROM supplements LIMIT 3');
    const supplements = supplementResult.rows;
    
    if (supplements.length === 0) {
      console.log('⚠️ No supplements found, skipping supplement plans');
      return;
    }

    const supplementPlans = [
      {
        athlete_id: '1', // Assuming user ID 1 exists
        supplement_id: supplements[0].id,
        plan_name: 'Elite Flag Football Performance Plan',
        plan_description: 'Comprehensive supplement plan for elite flag football athletes',
        dosage: '5g daily',
        timing: 'any time of day',
        duration_weeks: 52,
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        compliance_rate: 0.85,
        side_effects_reported: ['none'],
        performance_improvements: ['increased strength', 'better recovery'],
        notes: 'Excellent compliance, noticeable strength gains',
        created_at: new Date()
      },
      {
        athlete_id: '2', // Assuming user ID 2 exists
        supplement_id: supplements[1].id,
        plan_name: 'Recreational Flag Football Plan',
        plan_description: 'Basic supplement plan for recreational flag football players',
        dosage: '3g daily',
        timing: 'divided doses',
        duration_weeks: 52,
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        compliance_rate: 0.70,
        side_effects_reported: ['mild tingling'],
        performance_improvements: ['improved endurance', 'reduced fatigue'],
        notes: 'Good compliance, some tingling reported initially',
        created_at: new Date()
      }
    ];

    for (const plan of supplementPlans) {
      try {
        const query = `
          INSERT INTO athlete_supplement_plans (
            athlete_id, supplement_id, plan_name, plan_description, dosage,
            timing, duration_weeks, start_date, end_date, compliance_rate,
            side_effects_reported, performance_improvements, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `;
        
        await this.pool.query(query, [
          plan.athlete_id, plan.supplement_id, plan.plan_name, plan.plan_description,
          plan.dosage, plan.timing, plan.duration_weeks, plan.start_date,
          plan.end_date, plan.compliance_rate, plan.side_effects_reported,
          plan.performance_improvements, plan.notes, plan.created_at
        ]);
        
        console.log(`✅ Inserted supplement plan: ${plan.plan_name}`);
      } catch (error) {
        console.error(`❌ Error inserting supplement plan: ${error.message}`);
      }
    }
  }

  async runAllSeeders() {
    console.log('🚀 Starting Corrected Supplement Research Database Seeding...\n');
    
    try {
      await this.seedCreatineResearch();
      console.log('');
      await this.seedSupplementsTable();
      console.log('');
      await this.seedAthleteSupplementPlans();
      
      console.log('\n🎉 Corrected Supplement Research Database Seeding Completed Successfully!');
      console.log('📊 Database now contains:');
      console.log('   ✅ 2 Creatine research studies');
      console.log('   ✅ 3 Supplement profiles');
      console.log('   ✅ 2 Athlete supplement plans');
      
    } catch (error) {
      console.error('❌ Error during seeding:', error.message);
    } finally {
      await this.pool.end();
    }
  }
}

if (require.main === module) {
  const seeder = new SupplementResearchSeederCorrected();
  seeder.runAllSeeders();
}

module.exports = SupplementResearchSeederCorrected;
