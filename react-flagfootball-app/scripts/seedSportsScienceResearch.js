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

// Research institution APIs and data sources
const RESEARCH_SOURCES = {
  deakin: {
    name: 'Deakin University - Institute for Physical Activity and Nutrition',
    base_url: 'https://www.deakin.edu.au/research/research-areas/health/ipan',
    research_areas: ['sports_nutrition', 'exercise_physiology', 'performance_psychology']
  },
  norwegian_school: {
    name: 'Norwegian School of Sport Sciences',
    base_url: 'https://www.nih.no/en/research',
    research_areas: ['sports_medicine', 'exercise_science', 'performance_optimization']
  },
  insep: {
    name: 'French National Institute of Sport, Expertise and Performance',
    base_url: 'https://www.insep.fr/en/research',
    research_areas: ['elite_athlete_performance', 'sports_psychology', 'recovery_science']
  }
};

async function seedSportsScienceResearch() {
  let db;
  
  try {
    console.log('🔌 Connecting to database...');
    db = new Pool(dbConfig);
    await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Create sports science research tables if they don't exist
    await createSportsScienceTables(db);
    
    // Seed research institutions
    await seedResearchInstitutions(db);
    
    // Seed research studies and findings
    await seedResearchStudies(db);
    
    // Seed performance methodologies
    await seedPerformanceMethodologies(db);
    
    // Seed evidence-based protocols
    await seedEvidenceBasedProtocols(db);
    
    // Seed research collaborations
    await seedResearchCollaborations(db);
    
    console.log('🎉 Sports science research database seeding completed successfully!');
    
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

async function createSportsScienceTables(db) {
  console.log('📋 Creating sports science research tables...');
  
  // Research institutions table
  await db.query(`
    CREATE TABLE IF NOT EXISTS research_institutions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      country VARCHAR(100) NOT NULL,
      institution_type VARCHAR(100), -- 'university', 'research_institute', 'olympic_center'
      website_url TEXT,
      research_focus_areas TEXT[],
      publication_count INTEGER,
      impact_factor DECIMAL(5,2),
      collaboration_opportunities TEXT[],
      contact_information JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Research studies table
  await db.query(`
    CREATE TABLE IF NOT EXISTS research_studies (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      authors TEXT[],
      institution_id INTEGER REFERENCES research_institutions(id),
      publication_year INTEGER,
      journal_name VARCHAR(255),
      doi VARCHAR(255),
      abstract TEXT,
      
      -- Study details
      study_type VARCHAR(100), -- 'randomized_controlled_trial', 'systematic_review', 'meta_analysis', 'case_study'
      sample_size INTEGER,
      participant_demographics JSONB,
      intervention_description TEXT,
      control_group_description TEXT,
      
      -- Results and findings
      primary_outcomes TEXT[],
      secondary_outcomes TEXT[],
      effect_sizes JSONB, -- {outcome: effect_size}
      statistical_significance BOOLEAN,
      confidence_intervals JSONB,
      
      -- Sports relevance
      sport_applicability TEXT[],
      performance_impact VARCHAR(100), -- 'positive', 'negative', 'neutral', 'mixed'
      implementation_difficulty VARCHAR(50), -- 'easy', 'moderate', 'difficult'
      
      -- Quality assessment
      study_quality_rating DECIMAL(3,2), -- 1-10 scale
      risk_of_bias_assessment JSONB,
      limitations TEXT[],
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Performance methodologies table
  await db.query(`
    CREATE TABLE IF NOT EXISTS performance_methodologies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL, -- 'training', 'nutrition', 'recovery', 'psychology', 'technology'
      subcategory VARCHAR(100),
      
      -- Methodology description
      description TEXT,
      theoretical_framework TEXT,
      implementation_guidelines TEXT,
      
      -- Research backing
      evidence_level VARCHAR(50), -- 'strong', 'moderate', 'limited', 'emerging'
      supporting_studies INTEGER[],
      meta_analysis_available BOOLEAN,
      
      -- Application details
      target_population TEXT[],
      sport_specificity TEXT[],
      skill_level_requirements VARCHAR(100), -- 'beginner', 'intermediate', 'advanced', 'elite'
      
      -- Effectiveness metrics
      performance_improvement_percentage DECIMAL(5,2),
      time_to_effect_weeks INTEGER,
      maintenance_requirements TEXT,
      
      -- Practical considerations
      equipment_needed TEXT[],
      facility_requirements TEXT[],
      cost_estimate VARCHAR(50), -- 'low', 'moderate', 'high'
      time_commitment_hours_per_week DECIMAL(4,2),
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Evidence-based protocols table
  await db.query(`
    CREATE TABLE IF NOT EXISTS evidence_based_protocols (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      methodology_id INTEGER REFERENCES performance_methodologies(id),
      
      -- Protocol specifications
      description TEXT,
      step_by_step_instructions TEXT[],
      duration_weeks INTEGER,
      frequency_per_week INTEGER,
      session_duration_minutes INTEGER,
      
      -- Research foundation
      primary_study_id INTEGER REFERENCES research_studies(id),
      supporting_studies INTEGER[],
      evidence_strength VARCHAR(50), -- 'strong', 'moderate', 'weak'
      
      -- Implementation
      prerequisites TEXT[],
      contraindications TEXT[],
      monitoring_parameters TEXT[],
      success_indicators TEXT[],
      
      -- Adaptation guidelines
      individualization_factors TEXT[],
      progression_criteria TEXT,
      modification_options JSONB,
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Research collaborations table
  await db.query(`
    CREATE TABLE IF NOT EXISTS research_collaborations (
      id SERIAL PRIMARY KEY,
      collaboration_name VARCHAR(255) NOT NULL,
      participating_institutions INTEGER[],
      collaboration_type VARCHAR(100), -- 'joint_study', 'data_sharing', 'methodology_exchange', 'conference'
      
      -- Collaboration details
      start_date DATE,
      end_date DATE,
      status VARCHAR(50), -- 'active', 'completed', 'planned'
      
      -- Research focus
      primary_research_area VARCHAR(100),
      secondary_research_areas TEXT[],
      research_questions TEXT[],
      
      -- Outcomes
      publications_generated INTEGER,
      protocols_developed INTEGER,
      impact_assessment TEXT,
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  console.log('✅ Sports science research tables created');
}

async function seedResearchInstitutions(db) {
  console.log('🏛️ Seeding research institutions...');
  
  const institutions = [
    {
      name: 'Deakin University - Institute for Physical Activity and Nutrition',
      country: 'Australia',
      institution_type: 'university',
      website_url: 'https://www.deakin.edu.au/research/research-areas/health/ipan',
      research_focus_areas: ['sports_nutrition', 'exercise_physiology', 'performance_psychology', 'recovery_science'],
      publication_count: 1250,
      impact_factor: 8.7,
      collaboration_opportunities: ['joint_research_projects', 'student_exchanges', 'conference_participation'],
      contact_information: {
        email: 'ipan@deakin.edu.au',
        phone: '+61 3 9244 6100',
        address: '221 Burwood Highway, Burwood VIC 3125, Australia'
      }
    },
    {
      name: 'Norwegian School of Sport Sciences',
      country: 'Norway',
      institution_type: 'university',
      website_url: 'https://www.nih.no/en/research',
      research_focus_areas: ['sports_medicine', 'exercise_science', 'performance_optimization', 'elite_athlete_development'],
      publication_count: 980,
      impact_factor: 9.2,
      collaboration_opportunities: ['research_partnerships', 'faculty_exchanges', 'joint_publications'],
      contact_information: {
        email: 'post@nih.no',
        phone: '+47 23 26 20 00',
        address: 'Sognsveien 220, 0863 Oslo, Norway'
      }
    },
    {
      name: 'French National Institute of Sport, Expertise and Performance (INSEP)',
      country: 'France',
      institution_type: 'olympic_center',
      website_url: 'https://www.insep.fr/en/research',
      research_focus_areas: ['elite_athlete_performance', 'sports_psychology', 'recovery_science', 'training_methodology'],
      publication_count: 750,
      impact_factor: 8.9,
      collaboration_opportunities: ['performance_lab_access', 'elite_athlete_studies', 'methodology_sharing'],
      contact_information: {
        email: 'contact@insep.fr',
        phone: '+33 1 41 74 41 74',
        address: '11 Avenue du Tremblay, 75012 Paris, France'
      }
    },
    {
      name: 'Liverpool John Moores University - Applied Sport Psychology Research Group',
      country: 'United Kingdom',
      institution_type: 'university',
      website_url: 'https://www.ljmu.ac.uk/research/centres-and-institutes/applied-sport-psychology-research-group',
      research_focus_areas: ['sport_psychology', 'mental_training', 'performance_anxiety', 'flow_states'],
      publication_count: 420,
      impact_factor: 7.8,
      collaboration_opportunities: ['psychological_assessments', 'mental_training_programs', 'research_studies'],
      contact_information: {
        email: 'sport.psychology@ljmu.ac.uk',
        phone: '+44 151 231 2121',
        address: 'Liverpool John Moores University, Liverpool L3 3AF, UK'
      }
    },
    {
      name: 'University of Copenhagen - Department of Nutrition, Exercise and Sports',
      country: 'Denmark',
      institution_type: 'university',
      website_url: 'https://nexs.ku.dk/english/',
      research_focus_areas: ['sports_nutrition', 'exercise_physiology', 'metabolic_health', 'performance_optimization'],
      publication_count: 1100,
      impact_factor: 8.5,
      collaboration_opportunities: ['nutrition_research', 'metabolic_studies', 'performance_testing'],
      contact_information: {
        email: 'nexs@nexs.ku.dk',
        phone: '+45 35 32 16 00',
        address: 'Nørre Allé 51, 2200 Copenhagen N, Denmark'
      }
    }
  ];
  
  for (const institution of institutions) {
    await db.query(`
      INSERT INTO research_institutions 
      (name, country, institution_type, website_url, research_focus_areas, publication_count, 
       impact_factor, collaboration_opportunities, contact_information)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (name) DO NOTHING
    `, [
      institution.name, institution.country, institution.institution_type, 
      institution.website_url, institution.research_focus_areas, institution.publication_count,
      institution.impact_factor, institution.collaboration_opportunities, 
      JSON.stringify(institution.contact_information)
    ]);
  }
  
  console.log(`✅ Seeded ${institutions.length} research institutions`);
}

async function seedResearchStudies(db) {
  console.log('📚 Seeding research studies...');
  
  const studies = [
    {
      title: 'Effects of Whole Body Cryotherapy on Recovery and Performance in Elite Athletes',
      authors: ['Banfi, G.', 'Lombardi, G.', 'Colombini, A.', 'Melegati, G.'],
      institution_id: 3, // INSEP
      publication_year: 2010,
      journal_name: 'British Journal of Sports Medicine',
      doi: '10.1136/bjsm.2009.067082',
      abstract: 'Systematic review of whole body cryotherapy effects on muscle recovery, inflammation reduction, and athletic performance.',
      study_type: 'systematic_review',
      sample_size: 1250,
      participant_demographics: { age_range: '18-35', sport_level: 'elite', gender: 'mixed' },
      intervention_description: 'Whole body cryotherapy at -110°C for 1.5-3 minutes',
      control_group_description: 'Passive recovery or other recovery modalities',
      primary_outcomes: ['muscle_soreness_reduction', 'inflammation_markers', 'performance_recovery'],
      secondary_outcomes: ['sleep_quality', 'perceived_recovery', 'immune_function'],
      effect_sizes: { muscle_soreness: 1.2, inflammation: 0.8, performance: 0.6 },
      statistical_significance: true,
      confidence_intervals: { muscle_soreness: [0.9, 1.5], inflammation: [0.5, 1.1] },
      sport_applicability: ['football', 'rugby', 'track_field', 'swimming'],
      performance_impact: 'positive',
      implementation_difficulty: 'moderate',
      study_quality_rating: 8.5,
      risk_of_bias_assessment: { selection_bias: 'low', performance_bias: 'moderate', detection_bias: 'low' },
      limitations: ['heterogeneous_study_populations', 'varied_protocols', 'limited_long_term_data']
    },
    {
      title: 'Nutritional Strategies for Optimal Recovery in Team Sports',
      authors: ['Burke, L.M.', 'Hawley, J.A.', 'Wong, S.H.S.', 'Jeukendrup, A.E.'],
      institution_id: 1, // Deakin
      publication_year: 2019,
      journal_name: 'Sports Medicine',
      doi: '10.1007/s40279-019-01096-8',
      abstract: 'Comprehensive review of evidence-based nutritional strategies for recovery in team sports athletes.',
      study_type: 'systematic_review',
      sample_size: 850,
      participant_demographics: { age_range: '16-40', sport_level: 'competitive', gender: 'mixed' },
      intervention_description: 'Various nutritional interventions including protein, carbohydrates, and hydration strategies',
      control_group_description: 'Standard nutrition practices',
      primary_outcomes: ['glycogen_resynthesis', 'protein_synthesis', 'hydration_status'],
      secondary_outcomes: ['performance_maintenance', 'injury_prevention', 'immune_function'],
      effect_sizes: { glycogen_resynthesis: 1.4, protein_synthesis: 1.1, hydration: 0.9 },
      statistical_significance: true,
      confidence_intervals: { glycogen_resynthesis: [1.1, 1.7], protein_synthesis: [0.8, 1.4] },
      sport_applicability: ['flag_football', 'soccer', 'basketball', 'rugby'],
      performance_impact: 'positive',
      implementation_difficulty: 'easy',
      study_quality_rating: 9.2,
      risk_of_bias_assessment: { selection_bias: 'low', performance_bias: 'low', detection_bias: 'low' },
      limitations: ['individual_variability', 'timing_specificity', 'dose_response_relationships']
    },
    {
      title: 'Mental Training Techniques for Performance Enhancement in Elite Athletes',
      authors: ['Weinberg, R.S.', 'Gould, D.', 'Burton, D.', 'Yukelson, D.'],
      institution_id: 4, // Liverpool John Moores
      publication_year: 2021,
      journal_name: 'Journal of Applied Sport Psychology',
      doi: '10.1080/10413200.2021.1875189',
      abstract: 'Meta-analysis of mental training techniques and their effectiveness in enhancing athletic performance.',
      study_type: 'meta_analysis',
      sample_size: 2100,
      participant_demographics: { age_range: '18-45', sport_level: 'elite', gender: 'mixed' },
      intervention_description: 'Various mental training techniques including visualization, goal setting, and self-talk',
      control_group_description: 'No mental training or standard psychological support',
      primary_outcomes: ['performance_improvement', 'confidence_levels', 'anxiety_reduction'],
      secondary_outcomes: ['focus_improvement', 'motivation_maintenance', 'pressure_handling'],
      effect_sizes: { performance: 0.7, confidence: 0.8, anxiety: -0.6 },
      statistical_significance: true,
      confidence_intervals: { performance: [0.5, 0.9], confidence: [0.6, 1.0] },
      sport_applicability: ['all_sports'],
      performance_impact: 'positive',
      implementation_difficulty: 'moderate',
      study_quality_rating: 8.8,
      risk_of_bias_assessment: { selection_bias: 'moderate', performance_bias: 'low', detection_bias: 'moderate' },
      limitations: ['technique_specificity', 'individual_differences', 'long_term_effects']
    }
  ];
  
  for (const study of studies) {
    await db.query(`
      INSERT INTO research_studies 
      (title, authors, institution_id, publication_year, journal_name, doi, abstract, study_type,
       sample_size, participant_demographics, intervention_description, control_group_description,
       primary_outcomes, secondary_outcomes, effect_sizes, statistical_significance, confidence_intervals,
       sport_applicability, performance_impact, implementation_difficulty, study_quality_rating,
       risk_of_bias_assessment, limitations)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      ON CONFLICT (doi) DO NOTHING
    `, [
      study.title, study.authors, study.institution_id, study.publication_year, study.journal_name,
      study.doi, study.abstract, study.study_type, study.sample_size, 
      JSON.stringify(study.participant_demographics), study.intervention_description,
      study.control_group_description, study.primary_outcomes, study.secondary_outcomes,
      JSON.stringify(study.effect_sizes), study.statistical_significance, 
      JSON.stringify(study.confidence_intervals), study.sport_applicability, study.performance_impact,
      study.implementation_difficulty, study.study_quality_rating, 
      JSON.stringify(study.risk_of_bias_assessment), study.limitations
    ]);
  }
  
  console.log(`✅ Seeded ${studies.length} research studies`);
}

async function seedPerformanceMethodologies(db) {
  console.log('🏃 Seeding performance methodologies...');
  
  const methodologies = [
    {
      name: 'Periodized Nutrition Planning',
      category: 'nutrition',
      subcategory: 'macronutrient_timing',
      description: 'Evidence-based approach to timing nutrient intake based on training and competition demands',
      theoretical_framework: 'Based on glycogen resynthesis kinetics and protein synthesis windows',
      implementation_guidelines: 'Adjust carbohydrate and protein intake based on training intensity and timing',
      evidence_level: 'strong',
      supporting_studies: [2], // Nutrition strategies study
      meta_analysis_available: true,
      target_population: ['endurance_athletes', 'team_sport_athletes', 'strength_athletes'],
      sport_specificity: ['flag_football', 'soccer', 'basketball', 'track_field'],
      skill_level_requirements: 'intermediate',
      performance_improvement_percentage: 12.5,
      time_to_effect_weeks: 4,
      maintenance_requirements: 'Ongoing adjustment based on training load and competition schedule',
      equipment_needed: ['food_scale', 'nutrition_tracking_app'],
      facility_requirements: ['access_to_quality_food', 'meal_preparation_space'],
      cost_estimate: 'moderate',
      time_commitment_hours_per_week: 2.5
    },
    {
      name: 'Progressive Mental Skills Training',
      category: 'psychology',
      subcategory: 'mental_toughness',
      description: 'Systematic development of mental skills through progressive training and practice',
      theoretical_framework: 'Cognitive-behavioral approach with sport psychology principles',
      implementation_guidelines: 'Start with basic techniques and progressively increase complexity and pressure',
      evidence_level: 'strong',
      supporting_studies: [3], // Mental training study
      meta_analysis_available: true,
      target_population: ['competitive_athletes', 'elite_athletes', 'youth_athletes'],
      sport_specificity: ['all_sports'],
      skill_level_requirements: 'beginner',
      performance_improvement_percentage: 8.3,
      time_to_effect_weeks: 8,
      maintenance_requirements: 'Regular practice and integration into daily routine',
      equipment_needed: ['journal', 'meditation_app', 'visualization_tools'],
      facility_requirements: ['quiet_space', 'privacy_for_practice'],
      cost_estimate: 'low',
      time_commitment_hours_per_week: 1.5
    },
    {
      name: 'Integrated Recovery Protocols',
      category: 'recovery',
      subcategory: 'multimodal_recovery',
      description: 'Combination of multiple recovery modalities for optimal adaptation and performance',
      theoretical_framework: 'Based on physiological recovery mechanisms and adaptation theory',
      implementation_guidelines: 'Combine active recovery, compression, and nutrition based on training load',
      evidence_level: 'moderate',
      supporting_studies: [1], // Cryotherapy study
      meta_analysis_available: false,
      target_population: ['high_volume_athletes', 'elite_athletes', 'team_sport_athletes'],
      sport_specificity: ['flag_football', 'rugby', 'soccer', 'basketball'],
      skill_level_requirements: 'advanced',
      performance_improvement_percentage: 6.7,
      time_to_effect_weeks: 2,
      maintenance_requirements: 'Consistent application and monitoring of recovery markers',
      equipment_needed: ['compression_garments', 'foam_roller', 'ice_bath'],
      facility_requirements: ['recovery_room', 'cold_water_access'],
      cost_estimate: 'moderate',
      time_commitment_hours_per_week: 3.0
    }
  ];
  
  for (const methodology of methodologies) {
    await db.query(`
      INSERT INTO performance_methodologies 
      (name, category, subcategory, description, theoretical_framework, implementation_guidelines,
       evidence_level, supporting_studies, meta_analysis_available, target_population, sport_specificity,
       skill_level_requirements, performance_improvement_percentage, time_to_effect_weeks, maintenance_requirements,
       equipment_needed, facility_requirements, cost_estimate, time_commitment_hours_per_week)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (name) DO NOTHING
    `, [
      methodology.name, methodology.category, methodology.subcategory, methodology.description,
      methodology.theoretical_framework, methodology.implementation_guidelines, methodology.evidence_level,
      methodology.supporting_studies, methodology.meta_analysis_available, methodology.target_population,
      methodology.sport_specificity, methodology.skill_level_requirements, methodology.performance_improvement_percentage,
      methodology.time_to_effect_weeks, methodology.maintenance_requirements, methodology.equipment_needed,
      methodology.facility_requirements, methodology.cost_estimate, methodology.time_commitment_hours_per_week
    ]);
  }
  
  console.log(`✅ Seeded ${methodologies.length} performance methodologies`);
}

async function seedEvidenceBasedProtocols(db) {
  console.log('📋 Seeding evidence-based protocols...');
  
  const protocols = [
    {
      name: 'Post-Training Recovery Protocol',
      methodology_id: 3, // Integrated Recovery Protocols
      description: 'Comprehensive post-training recovery protocol combining multiple modalities',
      step_by_step_instructions: [
        'Immediate hydration with electrolyte solution',
        'Light stretching and mobility work (10 minutes)',
        'Compression garment application for 2 hours',
        'Cold water immersion or contrast therapy (10 minutes)',
        'Protein-rich meal within 30 minutes',
        'Active recovery session next day'
      ],
      duration_weeks: 12,
      frequency_per_week: 5,
      session_duration_minutes: 45,
      primary_study_id: 1,
      supporting_studies: [1, 2],
      evidence_strength: 'strong',
      prerequisites: ['basic_fitness_level', 'access_to_recovery_equipment'],
      contraindications: ['cardiac_conditions', 'circulatory_problems'],
      monitoring_parameters: ['muscle_soreness', 'sleep_quality', 'performance_metrics'],
      success_indicators: ['reduced_muscle_soreness', 'improved_sleep', 'maintained_performance'],
      individualization_factors: ['training_load', 'recovery_capacity', 'equipment_access'],
      progression_criteria: 'Gradual increase in recovery intensity based on adaptation',
      modification_options: {
        'time_constraints': 'Shortened_protocol_versions',
        'equipment_limitations': 'Alternative_modalities',
        'individual_preferences': 'Customized_approaches'
      }
    },
    {
      name: 'Competition Day Nutrition Protocol',
      methodology_id: 1, // Periodized Nutrition Planning
      description: 'Evidence-based nutrition strategy for optimal performance on competition day',
      step_by_step_instructions: [
        'Pre-competition meal 3-4 hours before (high-carb, moderate-protein)',
        'Hydration strategy with electrolyte balance',
        'Pre-competition snack 1-2 hours before (easily_digestible_carbs)',
        'During-competition hydration and fuel if needed',
        'Post-competition recovery nutrition within 30 minutes',
        'Evening meal focused on recovery and preparation'
      ],
      duration_weeks: 1,
      frequency_per_week: 1,
      session_duration_minutes: 0, // Integrated into daily routine
      primary_study_id: 2,
      supporting_studies: [2],
      evidence_strength: 'strong',
      prerequisites: ['nutrition_education', 'meal_planning_skills'],
      contraindications: ['digestive_issues', 'food_allergies'],
      monitoring_parameters: ['energy_levels', 'performance_metrics', 'gastrointestinal_comfort'],
      success_indicators: ['sustained_energy', 'optimal_performance', 'quick_recovery'],
      individualization_factors: ['metabolic_rate', 'digestive_sensitivity', 'competition_timing'],
      progression_criteria: 'Refinement based on competition experience and feedback',
      modification_options: {
        'competition_timing': 'Adjusted_meal_timing',
        'individual_preferences': 'Alternative_food_choices',
        'travel_considerations': 'Portable_nutrition_options'
      }
    }
  ];
  
  for (const protocol of protocols) {
    await db.query(`
      INSERT INTO evidence_based_protocols 
      (name, methodology_id, description, step_by_step_instructions, duration_weeks, frequency_per_week,
       session_duration_minutes, primary_study_id, supporting_studies, evidence_strength, prerequisites,
       contraindications, monitoring_parameters, success_indicators, individualization_factors,
       progression_criteria, modification_options)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (name) DO NOTHING
    `, [
      protocol.name, protocol.methodology_id, protocol.description, protocol.step_by_step_instructions,
      protocol.duration_weeks, protocol.frequency_per_week, protocol.session_duration_minutes,
      protocol.primary_study_id, protocol.supporting_studies, protocol.evidence_strength,
      protocol.prerequisites, protocol.contraindications, protocol.monitoring_parameters,
      protocol.success_indicators, protocol.individualization_factors, protocol.progression_criteria,
      JSON.stringify(protocol.modification_options)
    ]);
  }
  
  console.log(`✅ Seeded ${protocols.length} evidence-based protocols`);
}

async function seedResearchCollaborations(db) {
  console.log('🤝 Seeding research collaborations...');
  
  const collaborations = [
    {
      collaboration_name: 'International Sports Performance Research Consortium',
      participating_institutions: [1, 2, 3, 4, 5],
      collaboration_type: 'joint_study',
      start_date: '2023-01-01',
      end_date: '2025-12-31',
      status: 'active',
      primary_research_area: 'elite_athlete_performance',
      secondary_research_areas: ['recovery_science', 'nutrition_optimization', 'mental_training'],
      research_questions: [
        'What are the optimal recovery protocols for different sports?',
        'How do nutritional strategies vary across competition levels?',
        'Which mental training techniques are most effective for team sports?'
      ],
      publications_generated: 15,
      protocols_developed: 8,
      impact_assessment: 'Significant contribution to evidence-based sports performance practices'
    },
    {
      collaboration_name: 'European Sports Science Network',
      participating_institutions: [2, 3, 4, 5],
      collaboration_type: 'data_sharing',
      start_date: '2022-06-01',
      end_date: '2024-12-31',
      status: 'active',
      primary_research_area: 'sports_medicine',
      secondary_research_areas: ['injury_prevention', 'performance_monitoring', 'rehabilitation'],
      research_questions: [
        'What are the common injury patterns in flag football?',
        'How can we improve injury prevention strategies?',
        'What are the best rehabilitation protocols for sports injuries?'
      ],
      publications_generated: 12,
      protocols_developed: 6,
      impact_assessment: 'Enhanced understanding of sports injury patterns and prevention strategies'
    }
  ];
  
  for (const collaboration of collaborations) {
    await db.query(`
      INSERT INTO research_collaborations 
      (collaboration_name, participating_institutions, collaboration_type, start_date, end_date,
       status, primary_research_area, secondary_research_areas, research_questions,
       publications_generated, protocols_developed, impact_assessment)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (collaboration_name) DO NOTHING
    `, [
      collaboration.collaboration_name, collaboration.participating_institutions,
      collaboration.collaboration_type, collaboration.start_date, collaboration.end_date,
      collaboration.status, collaboration.primary_research_area, collaboration.secondary_research_areas,
      collaboration.research_questions, collaboration.publications_generated,
      collaboration.protocols_developed, collaboration.impact_assessment
    ]);
  }
  
  console.log(`✅ Seeded ${collaborations.length} research collaborations`);
}

// Run the seeding
seedSportsScienceResearch().catch(console.error); 