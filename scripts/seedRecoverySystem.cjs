const { Pool } = require('pg');
require('dotenv').config();

class RecoverySystemSeeder {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async seedRecoveryProtocols() {
    console.log('🔄 Seeding Recovery Protocols...');
    const recoveryProtocols = [
      {
        protocol_name: 'Post-Game Recovery Protocol',
        protocol_description: 'Comprehensive recovery protocol for post-game recovery',
        target_athlete_type: 'elite_competitor',
        recovery_type: 'post_competition',
        duration_minutes: 120,
        intensity_level: 'low',
        recovery_phases: [
          {
            phase: 'immediate_recovery',
            duration_minutes: 15,
            activities: ['light_stretching', 'hydration', 'cool_down_walk'],
            equipment_needed: ['water', 'stretching_mat']
          },
          {
            phase: 'active_recovery',
            duration_minutes: 30,
            activities: ['foam_rolling', 'mobility_work', 'light_massage'],
            equipment_needed: ['foam_roller', 'mobility_bands', 'massage_gun']
          },
          {
            phase: 'nutrition_recovery',
            duration_minutes: 45,
            activities: ['protein_intake', 'carbohydrate_replenishment', 'electrolyte_balance'],
            equipment_needed: ['protein_shake', 'electrolyte_drink']
          },
          {
            phase: 'rest_recovery',
            duration_minutes: 30,
            activities: ['compression_garments', 'elevation', 'ice_bath'],
            equipment_needed: ['compression_socks', 'ice_bath', 'elevation_pillow']
          }
        ],
        evidence_level: 'high',
        created_at: new Date()
      },
      {
        protocol_name: 'Training Day Recovery Protocol',
        protocol_description: 'Recovery protocol for training days',
        target_athlete_type: 'all_levels',
        recovery_type: 'post_training',
        duration_minutes: 60,
        intensity_level: 'low',
        recovery_phases: [
          {
            phase: 'cool_down',
            duration_minutes: 15,
            activities: ['light_cardio', 'stretching', 'breathing_exercises'],
            equipment_needed: ['treadmill', 'stretching_mat']
          },
          {
            phase: 'mobility_work',
            duration_minutes: 20,
            activities: ['joint_mobility', 'dynamic_stretching', 'foam_rolling'],
            equipment_needed: ['foam_roller', 'mobility_bands']
          },
          {
            phase: 'recovery_nutrition',
            duration_minutes: 25,
            activities: ['protein_intake', 'hydration', 'light_snack'],
            equipment_needed: ['protein_shake', 'water', 'recovery_snack']
          }
        ],
        evidence_level: 'high',
        created_at: new Date()
      },
      {
        protocol_name: 'Injury Recovery Protocol',
        protocol_description: 'Specialized recovery protocol for injured athletes',
        target_athlete_type: 'injured_athlete',
        recovery_type: 'injury_recovery',
        duration_minutes: 90,
        intensity_level: 'very_low',
        recovery_phases: [
          {
            phase: 'pain_management',
            duration_minutes: 20,
            activities: ['ice_therapy', 'compression', 'elevation'],
            equipment_needed: ['ice_pack', 'compression_bandage', 'elevation_pillow']
          },
          {
            phase: 'gentle_mobility',
            duration_minutes: 30,
            activities: ['passive_range_of_motion', 'gentle_stretching', 'breathing_work'],
            equipment_needed: ['stretching_bands', 'yoga_mat']
          },
          {
            phase: 'therapeutic_intervention',
            duration_minutes: 40,
            activities: ['physical_therapy', 'massage', 'ultrasound'],
            equipment_needed: ['massage_gun', 'ultrasound_machine', 'therapeutic_balls']
          }
        ],
        evidence_level: 'high',
        created_at: new Date()
      }
    ];

    for (const protocol of recoveryProtocols) {
      try {
        const query = `
          INSERT INTO recovery_protocols (
            protocol_name, protocol_description, target_athlete_type,
            recovery_type, duration_minutes, intensity_level, recovery_phases,
            evidence_level, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
        await this.pool.query(query, [
          protocol.protocol_name, protocol.protocol_description, protocol.target_athlete_type,
          protocol.recovery_type, protocol.duration_minutes, protocol.intensity_level,
          JSON.stringify(protocol.recovery_phases), protocol.evidence_level, protocol.created_at
        ]);
        
        console.log(`✅ Inserted recovery protocol: ${protocol.protocol_name}`);
      } catch (error) {
        console.error(`❌ Error inserting recovery protocol: ${error.message}`);
      }
    }
  }

  async seedRecoveryEquipment() {
    console.log('🛠️ Seeding Recovery Equipment...');
    const recoveryEquipment = [
      {
        equipment_name: 'Foam Roller',
        equipment_type: 'self_massage',
        primary_function: 'muscle_release',
        target_muscle_groups: ['legs', 'back', 'shoulders'],
        usage_instructions: 'Roll slowly over tight muscles for 1-2 minutes per area',
        maintenance_requirements: 'Clean with mild soap, replace when worn',
        cost_range: '15-50',
        durability_months: 24,
        flag_football_relevance: 'high',
        created_at: new Date()
      },
      {
        equipment_name: 'Massage Gun',
        equipment_type: 'percussion_therapy',
        primary_function: 'deep_tissue_massage',
        target_muscle_groups: ['all_major_muscles'],
        usage_instructions: 'Use on low setting, avoid bones and joints',
        maintenance_requirements: 'Charge battery, clean attachments',
        cost_range: '100-400',
        durability_months: 36,
        flag_football_relevance: 'high',
        created_at: new Date()
      },
      {
        equipment_name: 'Compression Garments',
        equipment_type: 'compression_therapy',
        primary_function: 'circulation_improvement',
        target_muscle_groups: ['legs', 'arms', 'core'],
        usage_instructions: 'Wear during and after exercise for 2-4 hours',
        maintenance_requirements: 'Machine wash cold, air dry',
        cost_range: '30-100',
        durability_months: 18,
        flag_football_relevance: 'high',
        created_at: new Date()
      },
      {
        equipment_name: 'Ice Bath',
        equipment_type: 'cold_therapy',
        primary_function: 'inflammation_reduction',
        target_muscle_groups: ['full_body'],
        usage_instructions: '10-15 minutes at 10-15°C',
        maintenance_requirements: 'Clean regularly, monitor temperature',
        cost_range: '200-1000',
        durability_months: 60,
        flag_football_relevance: 'medium',
        created_at: new Date()
      },
      {
        equipment_name: 'Mobility Bands',
        equipment_type: 'resistance_training',
        primary_function: 'mobility_improvement',
        target_muscle_groups: ['shoulders', 'hips', 'ankles'],
        usage_instructions: 'Use for dynamic stretching and mobility work',
        maintenance_requirements: 'Inspect for tears, clean regularly',
        cost_range: '10-30',
        durability_months: 12,
        flag_football_relevance: 'high',
        created_at: new Date()
      }
    ];

    for (const equipment of recoveryEquipment) {
      try {
        const query = `
          INSERT INTO recovery_equipment (
            equipment_name, equipment_type, primary_function, target_muscle_groups,
            usage_instructions, maintenance_requirements, cost_range,
            durability_months, flag_football_relevance, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
        
        await this.pool.query(query, [
          equipment.equipment_name, equipment.equipment_type, equipment.primary_function,
          equipment.target_muscle_groups, equipment.usage_instructions,
          equipment.maintenance_requirements, equipment.cost_range,
          equipment.durability_months, equipment.flag_football_relevance, equipment.created_at
        ]);
        
        console.log(`✅ Inserted recovery equipment: ${equipment.equipment_name}`);
      } catch (error) {
        console.error(`❌ Error inserting recovery equipment: ${error.message}`);
      }
    }
  }

  async seedRecoverySessions() {
    console.log('🏃 Seeding Recovery Sessions...');
    const recoverySessions = [
      {
        user_id: '1', // Assuming user ID 1 exists
        session_date: new Date(),
        session_type: 'post_game_recovery',
        protocol_id: 1, // Assuming protocol ID 1 exists
        duration_minutes: 120,
        perceived_recovery_score: 8,
        muscle_soreness_level: 6,
        fatigue_level: 7,
        sleep_quality_previous_night: 7,
        stress_level: 5,
        hydration_status: 'well_hydrated',
        nutrition_status: 'adequately_fueled',
        equipment_used: ['foam_roller', 'massage_gun', 'compression_garments'],
        notes: 'Good recovery session, legs feeling much better',
        created_at: new Date()
      },
      {
        user_id: '2', // Assuming user ID 2 exists
        session_date: new Date(),
        session_type: 'post_training_recovery',
        protocol_id: 2, // Assuming protocol ID 2 exists
        duration_minutes: 60,
        perceived_recovery_score: 7,
        muscle_soreness_level: 4,
        fatigue_level: 5,
        sleep_quality_previous_night: 8,
        stress_level: 3,
        hydration_status: 'slightly_dehydrated',
        nutrition_status: 'adequately_fueled',
        equipment_used: ['foam_roller', 'mobility_bands'],
        notes: 'Standard recovery session, feeling ready for next training',
        created_at: new Date()
      }
    ];

    for (const session of recoverySessions) {
      try {
        const query = `
          INSERT INTO recovery_sessions (
            user_id, session_date, session_type, protocol_id, duration_minutes,
            perceived_recovery_score, muscle_soreness_level, fatigue_level,
            sleep_quality_previous_night, stress_level, hydration_status,
            nutrition_status, equipment_used, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `;
        
        await this.pool.query(query, [
          session.user_id, session.session_date, session.session_type,
          session.protocol_id, session.duration_minutes, session.perceived_recovery_score,
          session.muscle_soreness_level, session.fatigue_level,
          session.sleep_quality_previous_night, session.stress_level,
          session.hydration_status, session.nutrition_status,
          session.equipment_used, session.notes, session.created_at
        ]);
        
        console.log(`✅ Inserted recovery session for user ID: ${session.user_id}`);
      } catch (error) {
        console.error(`❌ Error inserting recovery session: ${error.message}`);
      }
    }
  }

  async seedRecoveryRecommendations() {
    console.log('💡 Seeding Recovery Recommendations...');
    const recoveryRecommendations = [
      {
        recommendation_type: 'sleep_optimization',
        target_athlete_type: 'all_levels',
        priority_level: 'high',
        recommendation_text: 'Aim for 7-9 hours of quality sleep per night',
        implementation_steps: [
          'Establish consistent sleep schedule',
          'Create dark, quiet sleep environment',
          'Avoid screens 1 hour before bed',
          'Practice relaxation techniques'
        ],
        expected_benefits: ['improved recovery', 'better performance', 'reduced injury risk'],
        evidence_level: 'very_high',
        created_at: new Date()
      },
      {
        recommendation_type: 'hydration_recovery',
        target_athlete_type: 'elite_competitor',
        priority_level: 'high',
        recommendation_text: 'Rehydrate with 150% of fluid loss within 2 hours post-exercise',
        implementation_steps: [
          'Weigh before and after exercise',
          'Drink 16-24 oz of fluid immediately',
          'Continue drinking every 15-20 minutes',
          'Monitor urine color (should be light yellow)'
        ],
        expected_benefits: ['faster recovery', 'reduced muscle soreness', 'improved performance'],
        evidence_level: 'very_high',
        created_at: new Date()
      },
      {
        recommendation_type: 'nutrition_timing',
        target_athlete_type: 'all_levels',
        priority_level: 'medium',
        recommendation_text: 'Consume protein and carbohydrates within 30 minutes post-exercise',
        implementation_steps: [
          'Prepare recovery meal/snack in advance',
          'Aim for 20-30g protein',
          'Include 60-90g carbohydrates',
          'Add electrolytes if sweating heavily'
        ],
        expected_benefits: ['muscle repair', 'glycogen replenishment', 'reduced soreness'],
        evidence_level: 'high',
        created_at: new Date()
      },
      {
        recommendation_type: 'active_recovery',
        target_athlete_type: 'all_levels',
        priority_level: 'medium',
        recommendation_text: 'Include light activity on rest days to promote blood flow',
        implementation_steps: [
          'Light walking or cycling',
          'Gentle stretching or yoga',
          'Swimming or water activities',
          'Keep intensity below 60% max heart rate'
        ],
        expected_benefits: ['improved circulation', 'reduced stiffness', 'mental recovery'],
        evidence_level: 'high',
        created_at: new Date()
      }
    ];

    for (const recommendation of recoveryRecommendations) {
      try {
        const query = `
          INSERT INTO recovery_recommendations (
            recommendation_type, target_athlete_type, priority_level,
            recommendation_text, implementation_steps, expected_benefits,
            evidence_level, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `;
        
        await this.pool.query(query, [
          recommendation.recommendation_type, recommendation.target_athlete_type,
          recommendation.priority_level, recommendation.recommendation_text,
          recommendation.implementation_steps, recommendation.expected_benefits,
          recommendation.evidence_level, recommendation.created_at
        ]);
        
        console.log(`✅ Inserted recovery recommendation: ${recommendation.recommendation_type}`);
      } catch (error) {
        console.error(`❌ Error inserting recovery recommendation: ${error.message}`);
      }
    }
  }

  async seedRecoveryAnalytics() {
    console.log('📊 Seeding Recovery Analytics...');
    const recoveryAnalytics = [
      {
        user_id: '1', // Assuming user ID 1 exists
        analysis_date: new Date(),
        recovery_trend: 'improving',
        average_recovery_score: 7.5,
        recovery_consistency: 0.85,
        sleep_quality_trend: 'stable',
        stress_management_score: 7.0,
        hydration_compliance: 0.90,
        nutrition_compliance: 0.85,
        equipment_utilization: 0.80,
        recommendations_followed: 0.75,
        overall_recovery_grade: 'B+',
        areas_for_improvement: ['sleep_consistency', 'stress_management'],
        next_week_goals: ['increase sleep to 8 hours', 'practice stress reduction techniques'],
        created_at: new Date()
      },
      {
        user_id: '2', // Assuming user ID 2 exists
        analysis_date: new Date(),
        recovery_trend: 'stable',
        average_recovery_score: 6.8,
        recovery_consistency: 0.70,
        sleep_quality_trend: 'improving',
        stress_management_score: 6.5,
        hydration_compliance: 0.75,
        nutrition_compliance: 0.80,
        equipment_utilization: 0.60,
        recommendations_followed: 0.70,
        overall_recovery_grade: 'B-',
        areas_for_improvement: ['equipment_usage', 'recovery_consistency'],
        next_week_goals: ['use foam roller daily', 'follow recovery protocols consistently'],
        created_at: new Date()
      }
    ];

    for (const analytics of recoveryAnalytics) {
      try {
        const query = `
          INSERT INTO recovery_analytics (
            user_id, analysis_date, recovery_trend, average_recovery_score,
            recovery_consistency, sleep_quality_trend, stress_management_score,
            hydration_compliance, nutrition_compliance, equipment_utilization,
            recommendations_followed, overall_recovery_grade, areas_for_improvement,
            next_week_goals, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `;
        
        await this.pool.query(query, [
          analytics.user_id, analytics.analysis_date, analytics.recovery_trend,
          analytics.average_recovery_score, analytics.recovery_consistency,
          analytics.sleep_quality_trend, analytics.stress_management_score,
          analytics.hydration_compliance, analytics.nutrition_compliance,
          analytics.equipment_utilization, analytics.recommendations_followed,
          analytics.overall_recovery_grade, analytics.areas_for_improvement,
          analytics.next_week_goals, analytics.created_at
        ]);
        
        console.log(`✅ Inserted recovery analytics for user ID: ${analytics.user_id}`);
      } catch (error) {
        console.error(`❌ Error inserting recovery analytics: ${error.message}`);
      }
    }
  }

  async seedAthleteRecoveryProfiles() {
    console.log('👤 Seeding Athlete Recovery Profiles...');
    const recoveryProfiles = [
      {
        athlete_id: '1', // Assuming user ID 1 exists
        recovery_preferences: ['ice_bath', 'massage', 'compression'],
        sleep_pattern: 'early_bird',
        stress_triggers: ['competition_pressure', 'travel', 'injury_concerns'],
        recovery_goals: ['reduce_muscle_soreness', 'improve_sleep_quality', 'manage_stress'],
        preferred_recovery_times: ['evening', 'post_workout', 'weekends'],
        recovery_environment: 'quiet_private_space',
        recovery_equipment_owned: ['foam_roller', 'massage_gun', 'compression_socks'],
        recovery_equipment_desired: ['ice_bath', 'sauna'],
        recovery_budget_monthly: 200,
        created_at: new Date()
      },
      {
        athlete_id: '2', // Assuming user ID 2 exists
        recovery_preferences: ['stretching', 'yoga', 'light_cardio'],
        sleep_pattern: 'night_owl',
        stress_triggers: ['work_schedule', 'family_commitments', 'performance_pressure'],
        recovery_goals: ['improve_flexibility', 'reduce_stress', 'better_sleep'],
        preferred_recovery_times: ['morning', 'lunch_break', 'evening'],
        recovery_environment: 'group_setting',
        recovery_equipment_owned: ['yoga_mat', 'stretching_bands'],
        recovery_equipment_desired: ['foam_roller', 'massage_gun'],
        recovery_budget_monthly: 100,
        created_at: new Date()
      }
    ];

    for (const profile of recoveryProfiles) {
      try {
        const query = `
          INSERT INTO athlete_recovery_profiles (
            athlete_id, recovery_preferences, sleep_pattern, stress_triggers,
            recovery_goals, preferred_recovery_times, recovery_environment,
            recovery_equipment_owned, recovery_equipment_desired,
            recovery_budget_monthly, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `;
        
        await this.pool.query(query, [
          profile.athlete_id, profile.recovery_preferences, profile.sleep_pattern,
          profile.stress_triggers, profile.recovery_goals, profile.preferred_recovery_times,
          profile.recovery_environment, profile.recovery_equipment_owned,
          profile.recovery_equipment_desired, profile.recovery_budget_monthly, profile.created_at
        ]);
        
        console.log(`✅ Inserted recovery profile for athlete ID: ${profile.athlete_id}`);
      } catch (error) {
        console.error(`❌ Error inserting recovery profile: ${error.message}`);
      }
    }
  }

  async runAllSeeders() {
    console.log('🚀 Starting Recovery System Database Seeding...\n');
    
    try {
      await this.seedRecoveryProtocols();
      console.log('');
      await this.seedRecoveryEquipment();
      console.log('');
      await this.seedRecoverySessions();
      console.log('');
      await this.seedRecoveryRecommendations();
      console.log('');
      await this.seedRecoveryAnalytics();
      console.log('');
      await this.seedAthleteRecoveryProfiles();
      
      console.log('\n🎉 Recovery System Database Seeding Completed Successfully!');
      console.log('📊 Database now contains:');
      console.log('   ✅ 3 Recovery protocols');
      console.log('   ✅ 5 Recovery equipment items');
      console.log('   ✅ 2 Recovery sessions');
      console.log('   ✅ 4 Recovery recommendations');
      console.log('   ✅ 2 Recovery analytics');
      console.log('   ✅ 2 Athlete recovery profiles');
      
    } catch (error) {
      console.error('❌ Error during seeding:', error.message);
    } finally {
      await this.pool.end();
    }
  }
}

if (require.main === module) {
  const seeder = new RecoverySystemSeeder();
  seeder.runAllSeeders();
}

module.exports = RecoverySystemSeeder;
