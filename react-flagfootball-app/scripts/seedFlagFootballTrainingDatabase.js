#!/usr/bin/env node

import dotenv from 'dotenv';
import pg from 'pg';

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

async function seedFlagFootballTrainingDatabase() {
  let db;
  
  try {
    console.log('🔌 Connecting to database...');
    db = new Pool(dbConfig);
    await db.query('SELECT NOW()');
    console.log('✅ Database connected successfully');

    // Create flag football training tables
    await createFlagFootballTrainingTables(db);
    
    // Seed flag football fundamentals
    await seedFlagFootballFundamentals(db);
    
    // Seed quarterback training
    await seedQuarterbackTraining(db);
    
    // Seed wide receiver training
    await seedWideReceiverTraining(db);
    
    // Seed defensive back training
    await seedDefensiveBackTraining(db);
    
    // Seed footwork and agility training
    await seedFootworkTraining(db);
    
    // Seed flag football drills and plays
    await seedFlagFootballDrills(db);
    
    // Seed practice plans and sessions
    await seedPracticePlans(db);
    
    console.log('🎉 Flag football training database seeding completed successfully!');
    
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

async function createFlagFootballTrainingTables(db) {
  console.log('📋 Creating flag football training tables...');
  
  // Flag football fundamentals table
  await db.query(`
    CREATE TABLE IF NOT EXISTS flag_football_fundamentals (
      id SERIAL PRIMARY KEY,
      fundamental_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      importance_level VARCHAR(50), -- 'critical', 'important', 'moderate'
      skill_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
      age_group VARCHAR(50), -- 'youth', 'teen', 'adult'
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Position-specific training table
  await db.query(`
    CREATE TABLE IF NOT EXISTS position_training (
      id SERIAL PRIMARY KEY,
      position VARCHAR(50) NOT NULL,
      skill_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      detailed_instructions TEXT,
      difficulty_level VARCHAR(50), -- 'beginner', 'intermediate', 'advanced'
      equipment_needed TEXT[],
      space_requirements VARCHAR(100),
      duration_minutes INTEGER,
      repetitions INTEGER,
      coaching_points TEXT[],
      common_mistakes TEXT[],
      progression_steps TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Quarterback training table
  await db.query(`
    CREATE TABLE IF NOT EXISTS quarterback_training (
      id SERIAL PRIMARY KEY,
      skill_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL, -- 'throwing', 'footwork', 'decision_making', 'leadership'
      description TEXT,
      detailed_instructions TEXT,
      throwing_mechanics TEXT[],
      footwork_patterns TEXT[],
      decision_making_factors TEXT[],
      practice_drills TEXT[],
      difficulty_level VARCHAR(50),
      equipment_needed TEXT[],
      space_requirements VARCHAR(100),
      duration_minutes INTEGER,
      coaching_points TEXT[],
      common_mistakes TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Wide receiver training table
  await db.query(`
    CREATE TABLE IF NOT EXISTS wide_receiver_training (
      id SERIAL PRIMARY KEY,
      skill_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL, -- 'route_running', 'catching', 'footwork', 'blocking'
      description TEXT,
      detailed_instructions TEXT,
      route_techniques TEXT[],
      catching_mechanics TEXT[],
      footwork_patterns TEXT[],
      practice_drills TEXT[],
      difficulty_level VARCHAR(50),
      equipment_needed TEXT[],
      space_requirements VARCHAR(100),
      duration_minutes INTEGER,
      coaching_points TEXT[],
      common_mistakes TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Defensive back training table
  await db.query(`
    CREATE TABLE IF NOT EXISTS defensive_back_training (
      id SERIAL PRIMARY KEY,
      skill_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL, -- 'coverage', 'tackling', 'footwork', 'ball_skills'
      description TEXT,
      detailed_instructions TEXT,
      coverage_techniques TEXT[],
      flag_pulling_mechanics TEXT[],
      footwork_patterns TEXT[],
      practice_drills TEXT[],
      difficulty_level VARCHAR(50),
      equipment_needed TEXT[],
      space_requirements VARCHAR(100),
      duration_minutes INTEGER,
      coaching_points TEXT[],
      common_mistakes TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Footwork and agility training table
  await db.query(`
    CREATE TABLE IF NOT EXISTS footwork_training (
      id SERIAL PRIMARY KEY,
      drill_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL, -- 'agility', 'speed', 'balance', 'coordination'
      description TEXT,
      detailed_instructions TEXT,
      movement_patterns TEXT[],
      cone_setup TEXT,
      distance_requirements VARCHAR(100),
      duration_minutes INTEGER,
      repetitions INTEGER,
      sets INTEGER,
      rest_period_seconds INTEGER,
      difficulty_level VARCHAR(50),
      equipment_needed TEXT[],
      space_requirements VARCHAR(100),
      coaching_points TEXT[],
      progression_variations TEXT[],
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Flag football drills table
  await db.query(`
    CREATE TABLE IF NOT EXISTS flag_football_drills (
      id SERIAL PRIMARY KEY,
      drill_name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL, -- 'offensive', 'defensive', 'special_teams', 'conditioning'
      description TEXT,
      detailed_instructions TEXT,
      player_count INTEGER,
      duration_minutes INTEGER,
      equipment_needed TEXT[],
      space_requirements VARCHAR(100),
      skill_focus TEXT[],
      coaching_points TEXT[],
      variations TEXT[],
      difficulty_level VARCHAR(50),
      age_group VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  // Practice plans table
  await db.query(`
    CREATE TABLE IF NOT EXISTS practice_plans (
      id SERIAL PRIMARY KEY,
      plan_name VARCHAR(255) NOT NULL,
      session_type VARCHAR(100) NOT NULL, -- 'fundamentals', 'position_specific', 'team_offense', 'team_defense'
      duration_minutes INTEGER,
      warm_up_drills TEXT[],
      main_drills TEXT[],
      cool_down_drills TEXT[],
      skill_focus TEXT[],
      coaching_notes TEXT,
      equipment_needed TEXT[],
      space_requirements VARCHAR(100),
      difficulty_level VARCHAR(50),
      age_group VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  
  console.log('✅ Flag football training tables created');
}

async function seedFlagFootballFundamentals(db) {
  console.log('🏈 Seeding flag football fundamentals...');
  
  const fundamentals = [
    {
      fundamental_name: 'Flag Pulling Technique',
      category: 'Defensive Fundamentals',
      description: 'Proper technique for pulling flags without making contact with the ball carrier',
      importance_level: 'critical',
      skill_level: 'beginner',
      age_group: 'youth'
    },
    {
      fundamental_name: 'Flag Guarding',
      category: 'Offensive Fundamentals',
      description: 'Legal techniques for protecting flags while running with the ball',
      importance_level: 'critical',
      skill_level: 'beginner',
      age_group: 'youth'
    },
    {
      fundamental_name: 'Snap Count Recognition',
      category: 'Offensive Fundamentals',
      description: 'Understanding and responding to snap counts and cadences',
      importance_level: 'important',
      skill_level: 'beginner',
      age_group: 'youth'
    },
    {
      fundamental_name: 'Route Running',
      category: 'Offensive Fundamentals',
      description: 'Proper technique for running pass routes with precision and timing',
      importance_level: 'critical',
      skill_level: 'intermediate',
      age_group: 'youth'
    },
    {
      fundamental_name: 'Pass Coverage',
      category: 'Defensive Fundamentals',
      description: 'Techniques for covering receivers and defending passes',
      importance_level: 'critical',
      skill_level: 'intermediate',
      age_group: 'youth'
    },
    {
      fundamental_name: 'Ball Security',
      category: 'Offensive Fundamentals',
      description: 'Proper techniques for securing the ball while running and avoiding fumbles',
      importance_level: 'critical',
      skill_level: 'beginner',
      age_group: 'youth'
    },
    {
      fundamental_name: 'Spatial Awareness',
      category: 'Game Awareness',
      description: 'Understanding field position, boundaries, and game situations',
      importance_level: 'important',
      skill_level: 'intermediate',
      age_group: 'youth'
    },
    {
      fundamental_name: 'Communication',
      category: 'Team Fundamentals',
      description: 'Effective communication between teammates on both offense and defense',
      importance_level: 'important',
      skill_level: 'beginner',
      age_group: 'youth'
    }
  ];
  
  for (const fundamental of fundamentals) {
    await db.query(`
      INSERT INTO flag_football_fundamentals 
      (fundamental_name, category, description, importance_level, skill_level, age_group)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (fundamental_name) DO NOTHING
    `, [
      fundamental.fundamental_name, fundamental.category, fundamental.description,
      fundamental.importance_level, fundamental.skill_level, fundamental.age_group
    ]);
  }
  
  console.log(`✅ Seeded ${fundamentals.length} flag football fundamentals`);
}

async function seedQuarterbackTraining(db) {
  console.log('🏈 Seeding quarterback training...');
  
  const qbTraining = [
    {
      skill_name: 'Throwing Mechanics',
      category: 'throwing',
      description: 'Proper throwing mechanics for accuracy and power',
      detailed_instructions: 'Start with proper grip, step into throw, follow through with arm and body',
      throwing_mechanics: [
        'Proper grip on the ball',
        'Stance and balance',
        'Step into the throw',
        'Arm motion and release',
        'Follow through'
      ],
      footwork_patterns: [
        'Three-step drop',
        'Five-step drop',
        'Rollout footwork',
        'Quick release stance'
      ],
      decision_making_factors: [
        'Read defensive coverage',
        'Identify open receivers',
        'Check down progression',
        'Clock management'
      ],
      practice_drills: [
        'Target throwing',
        'Moving target drills',
        'Progression reads',
        'Clock management scenarios'
      ],
      difficulty_level: 'intermediate',
      equipment_needed: ['football', 'targets', 'cones'],
      space_requirements: '20x20 yards minimum',
      duration_minutes: 30,
      coaching_points: [
        'Keep eyes downfield',
        'Step toward target',
        'Follow through completely',
        'Stay balanced throughout throw'
      ],
      common_mistakes: [
        'Not stepping into throw',
        'Poor grip on ball',
        'Incomplete follow through',
        'Rushing the throw'
      ]
    },
    {
      skill_name: 'Footwork and Movement',
      category: 'footwork',
      description: 'Proper footwork for pocket presence and mobility',
      detailed_instructions: 'Practice drop steps, pocket movement, and throwing on the run',
      throwing_mechanics: [
        'Balance in pocket',
        'Throwing on the move',
        'Quick release mechanics'
      ],
      footwork_patterns: [
        'Drop back steps',
        'Pocket movement',
        'Rollout footwork',
        'Quick release stance'
      ],
      decision_making_factors: [
        'Pocket awareness',
        'Pressure recognition',
        'Escape routes',
        'Throwing lanes'
      ],
      practice_drills: [
        'Drop back drills',
        'Pocket movement',
        'Rollout passing',
        'Quick release drills'
      ],
      difficulty_level: 'intermediate',
      equipment_needed: ['football', 'cones', 'defenders (optional)'],
      space_requirements: '30x30 yards minimum',
      duration_minutes: 25,
      coaching_points: [
        'Stay balanced in pocket',
        'Keep eyes downfield',
        'Step toward target',
        'Maintain throwing position'
      ],
      common_mistakes: [
        'Poor balance in pocket',
        'Not stepping toward target',
        'Rushing footwork',
        'Poor body position'
      ]
    },
    {
      skill_name: 'Reading Defenses',
      category: 'decision_making',
      description: 'Understanding defensive coverages and making proper reads',
      detailed_instructions: 'Learn to identify coverages and make proper progression reads',
      throwing_mechanics: [
        'Quick release for hot reads',
        'Progression throwing',
        'Check down mechanics'
      ],
      footwork_patterns: [
        'Quick set position',
        'Progression footwork',
        'Check down movement'
      ],
      decision_making_factors: [
        'Coverage identification',
        'Safety alignment',
        'Linebacker movement',
        'Cornerback technique'
      ],
      practice_drills: [
        'Coverage recognition',
        'Progression reads',
        'Hot read scenarios',
        'Check down drills'
      ],
      difficulty_level: 'advanced',
      equipment_needed: ['football', 'receivers', 'defenders'],
      space_requirements: '40x40 yards minimum',
      duration_minutes: 35,
      coaching_points: [
        'Read safeties first',
        'Identify coverage quickly',
        'Go through progressions',
        'Take what defense gives'
      ],
      common_mistakes: [
        'Not reading safeties',
        'Locking on to one receiver',
        'Forcing throws',
        'Not checking down'
      ]
    }
  ];
  
  for (const training of qbTraining) {
    await db.query(`
      INSERT INTO quarterback_training 
      (skill_name, category, description, detailed_instructions, throwing_mechanics, footwork_patterns,
       decision_making_factors, practice_drills, difficulty_level, equipment_needed, space_requirements,
       duration_minutes, coaching_points, common_mistakes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (skill_name) DO NOTHING
    `, [
      training.skill_name, training.category, training.description, training.detailed_instructions,
      training.throwing_mechanics, training.footwork_patterns, training.decision_making_factors,
      training.practice_drills, training.difficulty_level, training.equipment_needed,
      training.space_requirements, training.duration_minutes, training.coaching_points, training.common_mistakes
    ]);
  }
  
  console.log(`✅ Seeded ${qbTraining.length} quarterback training skills`);
}

async function seedWideReceiverTraining(db) {
  console.log('🏈 Seeding wide receiver training...');
  
  const wrTraining = [
    {
      skill_name: 'Route Running',
      category: 'route_running',
      description: 'Precise route running with proper technique and timing',
      detailed_instructions: 'Practice crisp cuts, proper angles, and consistent timing',
      route_techniques: [
        'Crisp cuts and breaks',
        'Proper route angles',
        'Consistent timing',
        'Route depth precision'
      ],
      catching_mechanics: [
        'Hands in front of body',
        'Catch with hands, not body',
        'Secure the ball quickly',
        'Tuck and protect'
      ],
      footwork_patterns: [
        'Release footwork',
        'Route running steps',
        'Cut footwork',
        'Break point steps'
      ],
      practice_drills: [
        'Route tree practice',
        'Cut drills',
        'Timing routes',
        'Cone route drills'
      ],
      difficulty_level: 'intermediate',
      equipment_needed: ['football', 'cones', 'quarterback'],
      space_requirements: '30x30 yards minimum',
      duration_minutes: 30,
      coaching_points: [
        'Run routes at full speed',
        'Make crisp cuts',
        'Keep hands ready',
        'Stay on timing'
      ],
      common_mistakes: [
        'Rounding off cuts',
        'Not running full speed',
        'Poor hand position',
        'Off timing'
      ]
    },
    {
      skill_name: 'Catching Technique',
      category: 'catching',
      description: 'Proper catching mechanics for all types of passes',
      detailed_instructions: 'Focus on hand position, eye tracking, and ball security',
      route_techniques: [
        'Hand positioning',
        'Eye tracking',
        'Body control',
        'Route adjustment'
      ],
      catching_mechanics: [
        'Hands in diamond position',
        'Catch with hands first',
        'Secure ball quickly',
        'Tuck and protect'
      ],
      footwork_patterns: [
        'Adjustment steps',
        'Catching stance',
        'Balance maintenance',
        'After-catch footwork'
      ],
      practice_drills: [
        'Hand-eye coordination',
        'Different catch types',
        'Contested catches',
        'After-catch drills'
      ],
      difficulty_level: 'beginner',
      equipment_needed: ['football', 'quarterback', 'targets'],
      space_requirements: '20x20 yards minimum',
      duration_minutes: 25,
      coaching_points: [
        'Keep hands in front',
        'Track ball with eyes',
        'Catch with hands',
        'Secure immediately'
      ],
      common_mistakes: [
        'Catching with body',
        'Not tracking ball',
        'Poor hand position',
        'Not securing ball'
      ]
    },
    {
      skill_name: 'Release Techniques',
      category: 'route_running',
      description: 'Effective release techniques to get open at the line of scrimmage',
      detailed_instructions: 'Practice various release moves to beat press coverage',
      route_techniques: [
        'Jab step release',
        'Swim move release',
        'Rip move release',
        'Speed release'
      ],
      catching_mechanics: [
        'Hand fighting',
        'Body positioning',
        'Balance maintenance'
      ],
      footwork_patterns: [
        'Release footwork',
        'Hand fighting steps',
        'Balance recovery',
        'Route continuation'
      ],
      practice_drills: [
        'Release vs press',
        'Hand fighting drills',
        'Speed release',
        'Route continuation'
      ],
      difficulty_level: 'advanced',
      equipment_needed: ['football', 'defender', 'quarterback'],
      space_requirements: '20x20 yards minimum',
      duration_minutes: 20,
      coaching_points: [
        'Use hands effectively',
        'Stay balanced',
        'Get separation',
        'Continue route'
      ],
      common_mistakes: [
        'Getting jammed',
        'Poor hand usage',
        'Losing balance',
        'Stopping route'
      ]
    }
  ];
  
  for (const training of wrTraining) {
    await db.query(`
      INSERT INTO wide_receiver_training 
      (skill_name, category, description, detailed_instructions, route_techniques, catching_mechanics,
       footwork_patterns, practice_drills, difficulty_level, equipment_needed, space_requirements,
       duration_minutes, coaching_points, common_mistakes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (skill_name) DO NOTHING
    `, [
      training.skill_name, training.category, training.description, training.detailed_instructions,
      training.route_techniques, training.catching_mechanics, training.footwork_patterns,
      training.practice_drills, training.difficulty_level, training.equipment_needed,
      training.space_requirements, training.duration_minutes, training.coaching_points, training.common_mistakes
    ]);
  }
  
  console.log(`✅ Seeded ${wrTraining.length} wide receiver training skills`);
}

async function seedDefensiveBackTraining(db) {
  console.log('🏈 Seeding defensive back training...');
  
  const dbTraining = [
    {
      skill_name: 'Flag Pulling Technique',
      category: 'tackling',
      description: 'Proper technique for pulling flags without making contact',
      detailed_instructions: 'Focus on proper angle, hand placement, and flag removal',
      coverage_techniques: [
        'Proper pursuit angle',
        'Hand placement',
        'Flag removal technique',
        'Avoiding contact'
      ],
      flag_pulling_mechanics: [
        'Approach angle',
        'Hand positioning',
        'Flag removal',
        'Balance maintenance'
      ],
      footwork_patterns: [
        'Pursuit footwork',
        'Angle adjustment',
        'Balance recovery',
        'After-pull movement'
      ],
      practice_drills: [
        'Flag pulling practice',
        'Angle pursuit',
        'Hand placement',
        'Contact avoidance'
      ],
      difficulty_level: 'beginner',
      equipment_needed: ['flags', 'ball carrier', 'cones'],
      space_requirements: '20x20 yards minimum',
      duration_minutes: 20,
      coaching_points: [
        'Take proper angle',
        'Use both hands',
        'Avoid contact',
        'Secure flag'
      ],
      common_mistakes: [
        'Poor pursuit angle',
        'Making contact',
        'Missing flag',
        'Poor hand placement'
      ]
    },
    {
      skill_name: 'Pass Coverage',
      category: 'coverage',
      description: 'Effective pass coverage techniques for different situations',
      detailed_instructions: 'Practice man coverage, zone coverage, and ball skills',
      coverage_techniques: [
        'Man coverage technique',
        'Zone coverage positioning',
        'Ball skills',
        'Communication'
      ],
      flag_pulling_mechanics: [
        'Interception technique',
        'Pass breakup',
        'Flag pulling on catch'
      ],
      footwork_patterns: [
        'Backpedal technique',
        'Break on ball',
        'Recovery steps',
        'Tackling footwork'
      ],
      practice_drills: [
        'Backpedal drills',
        'Break on ball',
        'Interception practice',
        'Coverage scenarios'
      ],
      difficulty_level: 'intermediate',
      equipment_needed: ['football', 'quarterback', 'receivers', 'flags'],
      space_requirements: '30x30 yards minimum',
      duration_minutes: 30,
      coaching_points: [
        'Stay in phase',
        'Break on ball',
        'Use proper technique',
        'Communicate with teammates'
      ],
      common_mistakes: [
        'Getting out of phase',
        'Poor ball skills',
        'Not breaking on ball',
        'Poor communication'
      ]
    },
    {
      skill_name: 'Ball Skills',
      category: 'ball_skills',
      description: 'Developing interception and pass breakup skills',
      detailed_instructions: 'Practice catching, deflecting, and intercepting passes',
      coverage_techniques: [
        'Interception technique',
        'Pass breakup',
        'Ball tracking',
        'Hand positioning'
      ],
      flag_pulling_mechanics: [
        'Catch technique',
        'Deflection technique',
        'After-catch movement'
      ],
      footwork_patterns: [
        'Break on ball',
        'Catching footwork',
        'After-catch steps',
        'Return footwork'
      ],
      practice_drills: [
        'Interception practice',
        'Pass breakup drills',
        'Ball tracking',
        'Return drills'
      ],
      difficulty_level: 'intermediate',
      equipment_needed: ['football', 'quarterback', 'targets'],
      space_requirements: '20x20 yards minimum',
      duration_minutes: 25,
      coaching_points: [
        'Track ball with eyes',
        'Use proper hands',
        'Catch at highest point',
        'Secure ball quickly'
      ],
      common_mistakes: [
        'Not tracking ball',
        'Poor hand position',
        'Dropping interceptions',
        'Not securing ball'
      ]
    }
  ];
  
  for (const training of dbTraining) {
    await db.query(`
      INSERT INTO defensive_back_training 
      (skill_name, category, description, detailed_instructions, coverage_techniques, flag_pulling_mechanics,
       footwork_patterns, practice_drills, difficulty_level, equipment_needed, space_requirements,
       duration_minutes, coaching_points, common_mistakes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (skill_name) DO NOTHING
    `, [
      training.skill_name, training.category, training.description, training.detailed_instructions,
      training.coverage_techniques, training.flag_pulling_mechanics, training.footwork_patterns,
      training.practice_drills, training.difficulty_level, training.equipment_needed,
      training.space_requirements, training.duration_minutes, training.coaching_points, training.common_mistakes
    ]);
  }
  
  console.log(`✅ Seeded ${dbTraining.length} defensive back training skills`);
}

async function seedFootworkTraining(db) {
  console.log('🏃 Seeding footwork and agility training...');
  
  const footworkDrills = [
    {
      drill_name: 'Ladder Drills',
      category: 'agility',
      description: 'Various ladder drills to improve foot speed and coordination',
      detailed_instructions: 'Practice different patterns through agility ladder to improve foot speed',
      movement_patterns: [
        'One foot in each square',
        'Two feet in each square',
        'Lateral movement',
        'High knees'
      ],
      cone_setup: 'Agility ladder on ground',
      distance_requirements: '10-15 yards',
      duration_minutes: 15,
      repetitions: 3,
      sets: 3,
      rest_period_seconds: 60,
      difficulty_level: 'beginner',
      equipment_needed: ['agility ladder'],
      space_requirements: '15x5 yards',
      coaching_points: [
        'Stay on balls of feet',
        'Quick, light steps',
        'Keep eyes up',
        'Maintain rhythm'
      ],
      progression_variations: [
        'Increase speed',
        'Add direction changes',
        'Combine patterns',
        'Add ball handling'
      ]
    },
    {
      drill_name: 'Cone Weave',
      category: 'agility',
      description: 'Weaving through cones to improve change of direction',
      detailed_instructions: 'Set up cones in zigzag pattern and weave through them',
      movement_patterns: [
        'Forward weave',
        'Backward weave',
        'Lateral weave',
        'Combination patterns'
      ],
      cone_setup: '5-7 cones in zigzag pattern, 3-5 yards apart',
      distance_requirements: '20-30 yards total',
      duration_minutes: 20,
      repetitions: 4,
      sets: 3,
      rest_period_seconds: 90,
      difficulty_level: 'intermediate',
      equipment_needed: ['cones'],
      space_requirements: '30x10 yards',
      coaching_points: [
        'Stay low in cuts',
        'Use proper footwork',
        'Keep eyes up',
        'Maintain speed through turns'
      ],
      progression_variations: [
        'Increase speed',
        'Add ball',
        'Change directions',
        'Add defenders'
      ]
    },
    {
      drill_name: 'Box Drill',
      category: 'agility',
      description: 'Four-cone box drill to improve multi-directional movement',
      detailed_instructions: 'Run around four cones in a square pattern',
      movement_patterns: [
        'Forward, lateral, backward, lateral',
        'All forward with direction changes',
        'Combination patterns'
      ],
      cone_setup: 'Four cones in 10x10 yard square',
      distance_requirements: '10x10 yards',
      duration_minutes: 15,
      repetitions: 5,
      sets: 3,
      rest_period_seconds: 60,
      difficulty_level: 'intermediate',
      equipment_needed: ['cones'],
      space_requirements: '15x15 yards',
      coaching_points: [
        'Stay low in cuts',
        'Use proper footwork',
        'Keep eyes up',
        'Maintain balance'
      ],
      progression_variations: [
        'Increase speed',
        'Add ball handling',
        'Change patterns',
        'Add competition'
      ]
    },
    {
      drill_name: 'Shuttle Run',
      category: 'speed',
      description: 'Short shuttle runs to improve acceleration and change of direction',
      detailed_instructions: 'Run 5-10-5 yard shuttle pattern',
      movement_patterns: [
        '5-10-5 yard shuttle',
        '10-20-10 yard shuttle',
        'Variations with different distances'
      ],
      cone_setup: 'Three cones in line, 5-10 yards apart',
      distance_requirements: '5-10-5 yards or 10-20-10 yards',
      duration_minutes: 20,
      repetitions: 6,
      sets: 3,
      rest_period_seconds: 120,
      difficulty_level: 'intermediate',
      equipment_needed: ['cones'],
      space_requirements: '25x5 yards',
      coaching_points: [
        'Explode out of cuts',
        'Stay low in direction changes',
        'Use proper footwork',
        'Maintain speed'
      ],
      progression_variations: [
        'Increase distance',
        'Add ball handling',
        'Change patterns',
        'Add competition'
      ]
    }
  ];
  
  for (const drill of footworkDrills) {
    await db.query(`
      INSERT INTO footwork_training 
      (drill_name, category, description, detailed_instructions, movement_patterns, cone_setup,
       distance_requirements, duration_minutes, repetitions, sets, rest_period_seconds, difficulty_level,
       equipment_needed, space_requirements, coaching_points, progression_variations)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (drill_name) DO NOTHING
    `, [
      drill.drill_name, drill.category, drill.description, drill.detailed_instructions,
      drill.movement_patterns, drill.cone_setup, drill.distance_requirements, drill.duration_minutes,
      drill.repetitions, drill.sets, drill.rest_period_seconds, drill.difficulty_level,
      drill.equipment_needed, drill.space_requirements, drill.coaching_points, drill.progression_variations
    ]);
  }
  
  console.log(`✅ Seeded ${footworkDrills.length} footwork training drills`);
}

async function seedFlagFootballDrills(db) {
  console.log('🏈 Seeding flag football drills...');
  
  const drills = [
    {
      drill_name: 'Flag Pulling Practice',
      category: 'defensive',
      description: 'Practice proper flag pulling technique without contact',
      detailed_instructions: 'Set up scenarios where defenders practice pulling flags from ball carriers',
      player_count: 6,
      duration_minutes: 20,
      equipment_needed: ['flags', 'football', 'cones'],
      space_requirements: '30x20 yards',
      skill_focus: ['flag pulling', 'pursuit angles', 'avoiding contact'],
      coaching_points: [
        'Take proper pursuit angle',
        'Use both hands to pull flags',
        'Avoid any contact with ball carrier',
        'Secure flag immediately'
      ],
      variations: [
        'One-on-one flag pulling',
        'Multiple defender scenarios',
        'Game situation practice',
        'Competition format'
      ],
      difficulty_level: 'beginner',
      age_group: 'youth'
    },
    {
      drill_name: 'Route Tree Practice',
      category: 'offensive',
      description: 'Practice running all routes in the route tree',
      detailed_instructions: 'Receivers practice running different routes with proper technique',
      player_count: 4,
      duration_minutes: 25,
      equipment_needed: ['football', 'cones', 'quarterback'],
      space_requirements: '40x20 yards',
      skill_focus: ['route running', 'timing', 'catching'],
      coaching_points: [
        'Run routes at full speed',
        'Make crisp cuts',
        'Stay on timing',
        'Catch with hands'
      ],
      variations: [
        'Individual route practice',
        'Route combinations',
        'Timing routes',
        'Game situation routes'
      ],
      difficulty_level: 'intermediate',
      age_group: 'youth'
    },
    {
      drill_name: 'Coverage Recognition',
      category: 'defensive',
      description: 'Practice identifying and responding to different coverages',
      detailed_instructions: 'Defenders practice recognizing offensive formations and adjusting coverage',
      player_count: 8,
      duration_minutes: 30,
      equipment_needed: ['football', 'cones', 'offensive players'],
      space_requirements: '40x30 yards',
      skill_focus: ['coverage recognition', 'communication', 'positioning'],
      coaching_points: [
        'Read offensive formation',
        'Communicate coverage',
        'Stay in proper position',
        'React to route development'
      ],
      variations: [
        'Man coverage practice',
        'Zone coverage practice',
        'Coverage adjustments',
        'Game situation coverage'
      ],
      difficulty_level: 'advanced',
      age_group: 'youth'
    },
    {
      drill_name: 'Quick Game Passing',
      category: 'offensive',
      description: 'Practice quick passing game with short routes',
      detailed_instructions: 'Quarterback and receivers practice quick timing routes',
      player_count: 6,
      duration_minutes: 20,
      equipment_needed: ['football', 'cones', 'defenders'],
      space_requirements: '30x20 yards',
      skill_focus: ['quick release', 'timing', 'route precision'],
      coaching_points: [
        'Quick release by quarterback',
        'Precise route running',
        'Good timing',
        'Secure catches'
      ],
      variations: [
        'Slant routes',
        'Quick outs',
        'Screens',
        'Hot reads'
      ],
      difficulty_level: 'intermediate',
      age_group: 'youth'
    }
  ];
  
  for (const drill of drills) {
    await db.query(`
      INSERT INTO flag_football_drills 
      (drill_name, category, description, detailed_instructions, player_count, duration_minutes,
       equipment_needed, space_requirements, skill_focus, coaching_points, variations, difficulty_level, age_group)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (drill_name) DO NOTHING
    `, [
      drill.drill_name, drill.category, drill.description, drill.detailed_instructions,
      drill.player_count, drill.duration_minutes, drill.equipment_needed, drill.space_requirements,
      drill.skill_focus, drill.coaching_points, drill.variations, drill.difficulty_level, drill.age_group
    ]);
  }
  
  console.log(`✅ Seeded ${drills.length} flag football drills`);
}

async function seedPracticePlans(db) {
  console.log('📋 Seeding practice plans...');
  
  const practicePlans = [
    {
      plan_name: 'Fundamentals Practice',
      session_type: 'fundamentals',
      duration_minutes: 90,
      warm_up_drills: [
        'Dynamic stretching',
        'Light jogging',
        'Agility ladder work'
      ],
      main_drills: [
        'Flag pulling practice',
        'Route running basics',
        'Catching fundamentals',
        'Footwork drills'
      ],
      cool_down_drills: [
        'Static stretching',
        'Light throwing',
        'Team huddle'
      ],
      skill_focus: ['basic skills', 'team building', 'fundamentals'],
      coaching_notes: 'Focus on proper technique and building confidence in basic skills',
      equipment_needed: ['footballs', 'flags', 'cones', 'agility ladder'],
      space_requirements: '50x30 yards',
      difficulty_level: 'beginner',
      age_group: 'youth'
    },
    {
      plan_name: 'Position-Specific Training',
      session_type: 'position_specific',
      duration_minutes: 90,
      warm_up_drills: [
        'Dynamic stretching',
        'Position-specific movements',
        'Light throwing/catching'
      ],
      main_drills: [
        'Quarterback throwing mechanics',
        'Receiver route running',
        'Defensive back coverage',
        'Position-specific footwork'
      ],
      cool_down_drills: [
        'Static stretching',
        'Position-specific review',
        'Team discussion'
      ],
      skill_focus: ['position skills', 'technique refinement', 'individual development'],
      coaching_notes: 'Focus on individual position development and technique improvement',
      equipment_needed: ['footballs', 'flags', 'cones', 'targets'],
      space_requirements: '50x40 yards',
      difficulty_level: 'intermediate',
      age_group: 'youth'
    },
    {
      plan_name: 'Team Offense Practice',
      session_type: 'team_offense',
      duration_minutes: 90,
      warm_up_drills: [
        'Dynamic stretching',
        'Route running',
        'Throwing warm-up'
      ],
      main_drills: [
        'Passing game installation',
        'Route combinations',
        'Timing routes',
        'Game situation offense'
      ],
      cool_down_drills: [
        'Static stretching',
        'Offensive review',
        'Team huddle'
      ],
      skill_focus: ['team offense', 'timing', 'execution'],
      coaching_notes: 'Focus on offensive execution and team timing',
      equipment_needed: ['footballs', 'flags', 'cones', 'defenders'],
      space_requirements: '60x40 yards',
      difficulty_level: 'intermediate',
      age_group: 'youth'
    },
    {
      plan_name: 'Team Defense Practice',
      session_type: 'team_defense',
      duration_minutes: 90,
      warm_up_drills: [
        'Dynamic stretching',
        'Flag pulling practice',
        'Coverage movements'
      ],
      main_drills: [
        'Coverage installation',
        'Flag pulling scenarios',
        'Team defense communication',
        'Game situation defense'
      ],
      cool_down_drills: [
        'Static stretching',
        'Defensive review',
        'Team huddle'
      ],
      skill_focus: ['team defense', 'communication', 'execution'],
      coaching_notes: 'Focus on defensive execution and team communication',
      equipment_needed: ['footballs', 'flags', 'cones', 'offensive players'],
      space_requirements: '60x40 yards',
      difficulty_level: 'intermediate',
      age_group: 'youth'
    }
  ];
  
  for (const plan of practicePlans) {
    await db.query(`
      INSERT INTO practice_plans 
      (plan_name, session_type, duration_minutes, warm_up_drills, main_drills, cool_down_drills,
       skill_focus, coaching_notes, equipment_needed, space_requirements, difficulty_level, age_group)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (plan_name) DO NOTHING
    `, [
      plan.plan_name, plan.session_type, plan.duration_minutes, plan.warm_up_drills,
      plan.main_drills, plan.cool_down_drills, plan.skill_focus, plan.coaching_notes,
      plan.equipment_needed, plan.space_requirements, plan.difficulty_level, plan.age_group
    ]);
  }
  
  console.log(`✅ Seeded ${practicePlans.length} practice plans`);
}

// Run the seeding
seedFlagFootballTrainingDatabase().catch(console.error); 