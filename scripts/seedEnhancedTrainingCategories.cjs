const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// LA28 Olympics date
const LA28_DATE = new Date('2028-07-28');
const WEEKS_TO_LA28 = Math.ceil((LA28_DATE.getTime() - new Date().getTime()) / (1000 * 3600 * 24 * 7));

// Enhanced training categories for LA28 Olympics preparation
const enhancedTrainingCategories = [
  {
    name: 'route_running',
    display_name: 'Route Running',
    icon: '🏃',
    color: '#3B82F6',
    description: 'Perfect your route running techniques and precision',
    category_type: 'skill',
    difficulty_level: 'intermediate',
    priority_level: 1,
    la28_weekly_target: 3,
    la28_total_sessions: WEEKS_TO_LA28 * 3,
    la28_minimum_proficiency: 85.0,
    session_duration_minutes: 60,
    rest_hours_required: 12,
    energy_expenditure: 6,
    skill_transfer_rate: 0.8,
    fatigue_factor: 0.12,
    recovery_factor: 0.85,
    plateau_factor: 0.04,
    synergy_factor: 0.18
  },
  {
    name: 'plyometrics',
    display_name: 'Plyometrics',
    icon: '⚡',
    color: '#F59E0B',
    description: 'Explosive power training for speed and agility',
    category_type: 'strength',
    difficulty_level: 'advanced',
    priority_level: 2,
    la28_weekly_target: 2,
    la28_total_sessions: WEEKS_TO_LA28 * 2,
    la28_minimum_proficiency: 80.0,
    session_duration_minutes: 45,
    rest_hours_required: 24,
    energy_expenditure: 8,
    skill_transfer_rate: 0.7,
    fatigue_factor: 0.15,
    recovery_factor: 0.75,
    plateau_factor: 0.06,
    synergy_factor: 0.12
  },
  {
    name: 'speed_training',
    display_name: 'Speed Training',
    icon: '🏃‍♂️',
    color: '#EF4444',
    description: 'Improve acceleration and top speed capabilities',
    category_type: 'skill',
    difficulty_level: 'advanced',
    priority_level: 1,
    la28_weekly_target: 3,
    la28_total_sessions: WEEKS_TO_LA28 * 3,
    la28_minimum_proficiency: 88.0,
    session_duration_minutes: 50,
    rest_hours_required: 18,
    energy_expenditure: 7,
    skill_transfer_rate: 0.9,
    fatigue_factor: 0.14,
    recovery_factor: 0.80,
    plateau_factor: 0.05,
    synergy_factor: 0.15
  },
  {
    name: 'catching',
    display_name: 'Catching',
    icon: '🎯',
    color: '#8B5CF6',
    description: 'Enhance catching skills and hand-eye coordination',
    category_type: 'skill',
    difficulty_level: 'intermediate',
    priority_level: 2,
    la28_weekly_target: 4,
    la28_total_sessions: WEEKS_TO_LA28 * 4,
    la28_minimum_proficiency: 90.0,
    session_duration_minutes: 40,
    rest_hours_required: 8,
    energy_expenditure: 4,
    skill_transfer_rate: 0.6,
    fatigue_factor: 0.08,
    recovery_factor: 0.90,
    plateau_factor: 0.03,
    synergy_factor: 0.10
  },
  {
    name: 'flag_pulling',
    display_name: 'Flag Pulling',
    icon: '🏁',
    color: '#10B981',
    description: 'Master flag pulling techniques and defensive skills',
    category_type: 'technique',
    difficulty_level: 'intermediate',
    priority_level: 2,
    la28_weekly_target: 3,
    la28_total_sessions: WEEKS_TO_LA28 * 3,
    la28_minimum_proficiency: 87.0,
    session_duration_minutes: 45,
    rest_hours_required: 10,
    energy_expenditure: 5,
    skill_transfer_rate: 0.7,
    fatigue_factor: 0.10,
    recovery_factor: 0.85,
    plateau_factor: 0.04,
    synergy_factor: 0.12
  },
  {
    name: 'db_technique',
    display_name: 'DB Technique',
    icon: '🛡️',
    color: '#06B6D4',
    description: 'Defensive back positioning and coverage techniques',
    category_type: 'technique',
    difficulty_level: 'advanced',
    priority_level: 1,
    la28_weekly_target: 3,
    la28_total_sessions: WEEKS_TO_LA28 * 3,
    la28_minimum_proficiency: 85.0,
    session_duration_minutes: 55,
    rest_hours_required: 12,
    energy_expenditure: 6,
    skill_transfer_rate: 0.8,
    fatigue_factor: 0.12,
    recovery_factor: 0.82,
    plateau_factor: 0.05,
    synergy_factor: 0.14
  },
  {
    name: 'pass_deflecting',
    display_name: 'Pass Deflecting',
    icon: '✋',
    color: '#F97316',
    description: 'Develop pass deflection and interception skills',
    category_type: 'technique',
    difficulty_level: 'advanced',
    priority_level: 2,
    la28_weekly_target: 2,
    la28_total_sessions: WEEKS_TO_LA28 * 2,
    la28_minimum_proficiency: 82.0,
    session_duration_minutes: 40,
    rest_hours_required: 14,
    energy_expenditure: 5,
    skill_transfer_rate: 0.6,
    fatigue_factor: 0.09,
    recovery_factor: 0.88,
    plateau_factor: 0.04,
    synergy_factor: 0.11
  },
  {
    name: 'zone_man_coverage',
    display_name: 'Zone/Man Coverage',
    icon: '🎯',
    color: '#84CC16',
    description: 'Master zone and man-to-man coverage strategies',
    category_type: 'technique',
    difficulty_level: 'advanced',
    priority_level: 1,
    la28_weekly_target: 3,
    la28_total_sessions: WEEKS_TO_LA28 * 3,
    la28_minimum_proficiency: 86.0,
    session_duration_minutes: 60,
    rest_hours_required: 16,
    energy_expenditure: 7,
    skill_transfer_rate: 0.9,
    fatigue_factor: 0.13,
    recovery_factor: 0.78,
    plateau_factor: 0.06,
    synergy_factor: 0.16
  },
  {
    name: 'snapping',
    display_name: 'Snapping',
    icon: '🏈',
    color: '#EC4899',
    description: 'Perfect center snapping techniques and timing',
    category_type: 'technique',
    difficulty_level: 'intermediate',
    priority_level: 3,
    la28_weekly_target: 2,
    la28_total_sessions: WEEKS_TO_LA28 * 2,
    la28_minimum_proficiency: 89.0,
    session_duration_minutes: 30,
    rest_hours_required: 6,
    energy_expenditure: 3,
    skill_transfer_rate: 0.4,
    fatigue_factor: 0.06,
    recovery_factor: 0.95,
    plateau_factor: 0.02,
    synergy_factor: 0.08
  },
  {
    name: 'strength',
    display_name: 'Strength',
    icon: '💪',
    color: '#10B981',
    description: 'Build functional strength and power',
    category_type: 'strength',
    difficulty_level: 'intermediate',
    priority_level: 2,
    la28_weekly_target: 3,
    la28_total_sessions: WEEKS_TO_LA28 * 3,
    la28_minimum_proficiency: 83.0,
    session_duration_minutes: 75,
    rest_hours_required: 24,
    energy_expenditure: 8,
    skill_transfer_rate: 0.7,
    fatigue_factor: 0.16,
    recovery_factor: 0.70,
    plateau_factor: 0.07,
    synergy_factor: 0.13
  },
  {
    name: 'recovery',
    display_name: 'Recovery',
    icon: '🧘',
    color: '#06B6D4',
    description: 'Active recovery and regeneration protocols',
    category_type: 'recovery',
    difficulty_level: 'beginner',
    priority_level: 1,
    la28_weekly_target: 4,
    la28_total_sessions: WEEKS_TO_LA28 * 4,
    la28_minimum_proficiency: 95.0,
    session_duration_minutes: 45,
    rest_hours_required: 0,
    energy_expenditure: 2,
    skill_transfer_rate: 0.3,
    fatigue_factor: 0.02,
    recovery_factor: 1.0,
    plateau_factor: 0.01,
    synergy_factor: 0.20
  },
  {
    name: 'throwing_trainings',
    display_name: 'Throwing Trainings',
    icon: '🏈',
    color: '#3B82F6',
    description: 'Develop throwing accuracy, power, and technique',
    category_type: 'skill',
    difficulty_level: 'advanced',
    priority_level: 1,
    la28_weekly_target: 4,
    la28_total_sessions: WEEKS_TO_LA28 * 4,
    la28_minimum_proficiency: 88.0,
    session_duration_minutes: 50,
    rest_hours_required: 14,
    energy_expenditure: 6,
    skill_transfer_rate: 0.8,
    fatigue_factor: 0.11,
    recovery_factor: 0.83,
    plateau_factor: 0.05,
    synergy_factor: 0.14
  }
];

// Mathematical correction factors
const mathematicalCorrectionFactors = [
  {
    factor_name: 'fatigue_decay',
    factor_type: 'fatigue',
    description: 'Cumulative fatigue impact on performance over time',
    base_value: 0.15,
    min_value: 0.05,
    max_value: 0.25,
    adjustment_rate: 0.02,
    decay_factor: 0.95,
    recovery_rate: 0.85,
    research_source: 'Sports Medicine Research on Cumulative Fatigue',
    evidence_level: 'strong',
    last_updated: new Date()
  },
  {
    factor_name: 'recovery_optimization',
    factor_type: 'recovery',
    description: 'Optimal recovery rate based on training intensity',
    base_value: 0.85,
    min_value: 0.70,
    max_value: 1.00,
    adjustment_rate: 0.03,
    decay_factor: 0.98,
    recovery_rate: 1.05,
    research_source: 'Exercise Physiology Studies on Recovery',
    evidence_level: 'strong',
    last_updated: new Date()
  },
  {
    factor_name: 'plateau_effect',
    factor_type: 'plateau',
    description: 'Diminishing returns as proficiency increases',
    base_value: 0.05,
    min_value: 0.02,
    max_value: 0.10,
    adjustment_rate: 0.01,
    decay_factor: 0.99,
    recovery_rate: 0.90,
    research_source: 'Skill Acquisition Research on Learning Plateaus',
    evidence_level: 'moderate',
    last_updated: new Date()
  },
  {
    factor_name: 'synergy_bonus',
    factor_type: 'synergy',
    description: 'Performance bonus from complementary training combinations',
    base_value: 0.12,
    min_value: 0.05,
    max_value: 0.20,
    adjustment_rate: 0.02,
    decay_factor: 0.97,
    recovery_rate: 1.02,
    research_source: 'Cross-Training Effectiveness Studies',
    evidence_level: 'moderate',
    last_updated: new Date()
  }
];

// LA28 Olympic requirements
const la28OlympicRequirements = [
  {
    requirement_name: 'Route Running Precision',
    category: 'route_running',
    description: 'Execute routes with 95% precision at game speed',
    minimum_proficiency: 85.0,
    target_proficiency: 92.0,
    elite_proficiency: 98.0,
    minimum_weekly_sessions: 3,
    recommended_weekly_sessions: 4,
    total_sessions_by_la28: WEEKS_TO_LA28 * 4,
    deadline_date: LA28_DATE,
    weeks_remaining: WEEKS_TO_LA28,
    critical_path_weeks: Math.ceil(WEEKS_TO_LA28 * 0.3),
    importance_weight: 0.95,
    difficulty_level: 'advanced'
  },
  {
    requirement_name: 'Explosive Power Development',
    category: 'plyometrics',
    description: 'Achieve elite-level explosive power and jumping ability',
    minimum_proficiency: 80.0,
    target_proficiency: 88.0,
    elite_proficiency: 95.0,
    minimum_weekly_sessions: 2,
    recommended_weekly_sessions: 3,
    total_sessions_by_la28: WEEKS_TO_LA28 * 3,
    deadline_date: LA28_DATE,
    weeks_remaining: WEEKS_TO_LA28,
    critical_path_weeks: Math.ceil(WEEKS_TO_LA28 * 0.4),
    importance_weight: 0.90,
    difficulty_level: 'advanced'
  },
  {
    requirement_name: 'Speed Optimization',
    category: 'speed_training',
    description: 'Reach maximum acceleration and top speed potential',
    minimum_proficiency: 88.0,
    target_proficiency: 94.0,
    elite_proficiency: 99.0,
    minimum_weekly_sessions: 3,
    recommended_weekly_sessions: 4,
    total_sessions_by_la28: WEEKS_TO_LA28 * 4,
    deadline_date: LA28_DATE,
    weeks_remaining: WEEKS_TO_LA28,
    critical_path_weeks: Math.ceil(WEEKS_TO_LA28 * 0.35),
    importance_weight: 0.98,
    difficulty_level: 'advanced'
  },
  {
    requirement_name: 'Catching Excellence',
    category: 'catching',
    description: 'Maintain 95% catch rate under pressure',
    minimum_proficiency: 90.0,
    target_proficiency: 96.0,
    elite_proficiency: 99.0,
    minimum_weekly_sessions: 4,
    recommended_weekly_sessions: 5,
    total_sessions_by_la28: WEEKS_TO_LA28 * 5,
    deadline_date: LA28_DATE,
    weeks_remaining: WEEKS_TO_LA28,
    critical_path_weeks: Math.ceil(WEEKS_TO_LA28 * 0.25),
    importance_weight: 0.92,
    difficulty_level: 'advanced'
  },
  {
    requirement_name: 'Flag Pulling Mastery',
    category: 'flag_pulling',
    description: 'Execute flag pulls with 90% success rate',
    minimum_proficiency: 87.0,
    target_proficiency: 93.0,
    elite_proficiency: 97.0,
    minimum_weekly_sessions: 3,
    recommended_weekly_sessions: 4,
    total_sessions_by_la28: WEEKS_TO_LA28 * 4,
    deadline_date: LA28_DATE,
    weeks_remaining: WEEKS_TO_LA28,
    critical_path_weeks: Math.ceil(WEEKS_TO_LA28 * 0.3),
    importance_weight: 0.88,
    difficulty_level: 'advanced'
  },
  {
    requirement_name: 'Defensive Back Excellence',
    category: 'db_technique',
    description: 'Master all defensive back techniques and positioning',
    minimum_proficiency: 85.0,
    target_proficiency: 91.0,
    elite_proficiency: 96.0,
    minimum_weekly_sessions: 3,
    recommended_weekly_sessions: 4,
    total_sessions_by_la28: WEEKS_TO_LA28 * 4,
    deadline_date: LA28_DATE,
    weeks_remaining: WEEKS_TO_LA28,
    critical_path_weeks: Math.ceil(WEEKS_TO_LA28 * 0.35),
    importance_weight: 0.93,
    difficulty_level: 'advanced'
  },
  {
    requirement_name: 'Pass Defense Mastery',
    category: 'pass_deflecting',
    description: 'Achieve 85% pass deflection rate',
    minimum_proficiency: 82.0,
    target_proficiency: 89.0,
    elite_proficiency: 94.0,
    minimum_weekly_sessions: 2,
    recommended_weekly_sessions: 3,
    total_sessions_by_la28: WEEKS_TO_LA28 * 3,
    deadline_date: LA28_DATE,
    weeks_remaining: WEEKS_TO_LA28,
    critical_path_weeks: Math.ceil(WEEKS_TO_LA28 * 0.4),
    importance_weight: 0.87,
    difficulty_level: 'advanced'
  },
  {
    requirement_name: 'Coverage Strategy Mastery',
    category: 'zone_man_coverage',
    description: 'Execute both zone and man coverage at elite level',
    minimum_proficiency: 86.0,
    target_proficiency: 92.0,
    elite_proficiency: 97.0,
    minimum_weekly_sessions: 3,
    recommended_weekly_sessions: 4,
    total_sessions_by_la28: WEEKS_TO_LA28 * 4,
    deadline_date: LA28_DATE,
    weeks_remaining: WEEKS_TO_LA28,
    critical_path_weeks: Math.ceil(WEEKS_TO_LA28 * 0.3),
    importance_weight: 0.94,
    difficulty_level: 'advanced'
  },
  {
    requirement_name: 'Snapping Precision',
    category: 'snapping',
    description: 'Maintain 99% snapping accuracy and timing',
    minimum_proficiency: 89.0,
    target_proficiency: 96.0,
    elite_proficiency: 99.5,
    minimum_weekly_sessions: 2,
    recommended_weekly_sessions: 3,
    total_sessions_by_la28: WEEKS_TO_LA28 * 3,
    deadline_date: LA28_DATE,
    weeks_remaining: WEEKS_TO_LA28,
    critical_path_weeks: Math.ceil(WEEKS_TO_LA28 * 0.2),
    importance_weight: 0.85,
    difficulty_level: 'intermediate'
  },
  {
    requirement_name: 'Functional Strength',
    category: 'strength',
    description: 'Develop Olympic-level functional strength',
    minimum_proficiency: 83.0,
    target_proficiency: 90.0,
    elite_proficiency: 95.0,
    minimum_weekly_sessions: 3,
    recommended_weekly_sessions: 4,
    total_sessions_by_la28: WEEKS_TO_LA28 * 4,
    deadline_date: LA28_DATE,
    weeks_remaining: WEEKS_TO_LA28,
    critical_path_weeks: Math.ceil(WEEKS_TO_LA28 * 0.4),
    importance_weight: 0.91,
    difficulty_level: 'advanced'
  },
  {
    requirement_name: 'Recovery Optimization',
    category: 'recovery',
    description: 'Maintain optimal recovery and regeneration',
    minimum_proficiency: 95.0,
    target_proficiency: 98.0,
    elite_proficiency: 99.5,
    minimum_weekly_sessions: 4,
    recommended_weekly_sessions: 5,
    total_sessions_by_la28: WEEKS_TO_LA28 * 5,
    deadline_date: LA28_DATE,
    weeks_remaining: WEEKS_TO_LA28,
    critical_path_weeks: WEEKS_TO_LA28,
    importance_weight: 0.96,
    difficulty_level: 'intermediate'
  },
  {
    requirement_name: 'Throwing Excellence',
    category: 'throwing_trainings',
    description: 'Achieve 95% throwing accuracy and power',
    minimum_proficiency: 88.0,
    target_proficiency: 94.0,
    elite_proficiency: 98.0,
    minimum_weekly_sessions: 4,
    recommended_weekly_sessions: 5,
    total_sessions_by_la28: WEEKS_TO_LA28 * 5,
    deadline_date: LA28_DATE,
    weeks_remaining: WEEKS_TO_LA28,
    critical_path_weeks: Math.ceil(WEEKS_TO_LA28 * 0.25),
    importance_weight: 0.97,
    difficulty_level: 'advanced'
  }
];

async function seedEnhancedTrainingCategories() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting enhanced training categories seeding...');
    
    // Clear existing data
    await client.query('DELETE FROM la28_olympic_requirements');
    await client.query('DELETE FROM mathematical_correction_factors');
    await client.query('DELETE FROM enhanced_training_categories');
    
    console.log('✅ Cleared existing data');
    
    // Insert enhanced training categories
    for (const category of enhancedTrainingCategories) {
      const query = `
        INSERT INTO enhanced_training_categories (
          name, display_name, icon, color, description, category_type, difficulty_level,
          priority_level, la28_weekly_target, la28_total_sessions, la28_minimum_proficiency,
          session_duration_minutes, rest_hours_required, energy_expenditure, skill_transfer_rate,
          fatigue_factor, recovery_factor, plateau_factor, synergy_factor
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id, name
      `;
      
      const values = [
        category.name, category.display_name, category.icon, category.color, category.description,
        category.category_type, category.difficulty_level, category.priority_level,
        category.la28_weekly_target, category.la28_total_sessions, category.la28_minimum_proficiency,
        category.session_duration_minutes, category.rest_hours_required, category.energy_expenditure,
        category.skill_transfer_rate, category.fatigue_factor, category.recovery_factor,
        category.plateau_factor, category.synergy_factor
      ];
      
      const result = await client.query(query, values);
      console.log(`✅ Inserted category: ${result.rows[0].name}`);
    }
    
    // Insert mathematical correction factors
    for (const factor of mathematicalCorrectionFactors) {
      const query = `
        INSERT INTO mathematical_correction_factors (
          factor_name, factor_type, description, base_value, min_value, max_value,
          adjustment_rate, decay_factor, recovery_rate, research_source, evidence_level, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING factor_name
      `;
      
      const values = [
        factor.factor_name, factor.factor_type, factor.description, factor.base_value,
        factor.min_value, factor.max_value, factor.adjustment_rate, factor.decay_factor,
        factor.recovery_rate, factor.research_source, factor.evidence_level, factor.last_updated
      ];
      
      const result = await client.query(query, values);
      console.log(`✅ Inserted correction factor: ${result.rows[0].factor_name}`);
    }
    
    // Insert LA28 Olympic requirements
    for (const requirement of la28OlympicRequirements) {
      const query = `
        INSERT INTO la28_olympic_requirements (
          requirement_name, category, description, minimum_proficiency, target_proficiency,
          elite_proficiency, minimum_weekly_sessions, recommended_weekly_sessions,
          total_sessions_by_la28, deadline_date, weeks_remaining, critical_path_weeks,
          importance_weight, difficulty_level
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING requirement_name
      `;
      
      const values = [
        requirement.requirement_name, requirement.category, requirement.description,
        requirement.minimum_proficiency, requirement.target_proficiency, requirement.elite_proficiency,
        requirement.minimum_weekly_sessions, requirement.recommended_weekly_sessions,
        requirement.total_sessions_by_la28, requirement.deadline_date, requirement.weeks_remaining,
        requirement.critical_path_weeks, requirement.importance_weight, requirement.difficulty_level
      ];
      
      const result = await client.query(query, values);
      console.log(`✅ Inserted LA28 requirement: ${result.rows[0].requirement_name}`);
    }
    
    console.log('\n🎉 Enhanced training categories seeding completed successfully!');
    console.log(`📊 Total categories inserted: ${enhancedTrainingCategories.length}`);
    console.log(`📊 Total correction factors inserted: ${mathematicalCorrectionFactors.length}`);
    console.log(`📊 Total LA28 requirements inserted: ${la28OlympicRequirements.length}`);
    console.log(`🏆 LA28 Olympics target date: ${LA28_DATE.toDateString()}`);
    console.log(`⏰ Weeks until LA28: ${WEEKS_TO_LA28}`);
    
  } catch (error) {
    console.error('❌ Error seeding enhanced training categories:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
if (require.main === module) {
  seedEnhancedTrainingCategories()
    .then(() => {
      console.log('✅ Seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedEnhancedTrainingCategories }; 