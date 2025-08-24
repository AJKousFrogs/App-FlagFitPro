const { Pool } = require('pg');

class CompetitionProtocolsSeeder {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.VITE_DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async seedEuropeanChampionshipProtocols() {
    console.log('🏆 Seeding European Championship protocols...');
    
    const protocols = [
      {
        championship_year: 2024,
        host_country: 'Germany',
        climate_zone: 'temperate',
        teams_participating: 16,
        games_per_team: 6,
        tournament_duration_days: 14,
        average_temperature_celsius: 22.5,
        average_humidity_percentage: 65.0,
        altitude_variations_meters: [100, 300, 500],
        pre_tournament_hydration_protocol: 'Begin hydration protocol 7 days before tournament with 20ml/kg/day baseline',
        daily_hydration_targets_ml_per_kg: 18.0,
        between_games_hydration_strategy: '150ml every 20 minutes between games, electrolyte replacement for games >2 hours apart',
        recovery_hydration_protocol: 'Post-game rehydration: 150% of weight loss within 2 hours, continue for 24 hours',
        hydration_status_checks_per_day: 4,
        body_weight_monitoring_frequency: 'pre_post_each_game',
        cognitive_testing_schedule: ['reaction_time', 'decision_making', 'memory_recall'],
        hydration_related_injuries: 0,
        performance_consistency_score: 92.5,
        athlete_feedback_score: 94.0
      },
      {
        championship_year: 2025,
        host_country: 'Netherlands',
        climate_zone: 'temperate',
        teams_participating: 20,
        games_per_team: 7,
        tournament_duration_days: 16,
        average_temperature_celsius: 20.0,
        average_humidity_percentage: 70.0,
        altitude_variations_meters: [0, 100, 200],
        pre_tournament_hydration_protocol: 'Enhanced hydration protocol 10 days before with climate adaptation training',
        daily_hydration_targets_ml_per_kg: 20.0,
        between_games_hydration_strategy: '200ml every 15 minutes between games, increased sodium for high humidity conditions',
        recovery_hydration_protocol: 'Advanced recovery: 160% of weight loss within 1.5 hours, protein-electrolyte mix',
        hydration_status_checks_per_day: 5,
        body_weight_monitoring_frequency: 'continuous_monitoring',
        cognitive_testing_schedule: ['reaction_time', 'decision_making', 'memory_recall', 'spatial_awareness'],
        hydration_related_injuries: 0,
        performance_consistency_score: 95.0,
        athlete_feedback_score: 96.5
      }
    ];

    for (const protocol of protocols) {
      try {
        // First check if record exists
        const checkQuery = 'SELECT id FROM european_championship_protocols WHERE championship_year = $1';
        const checkResult = await this.pool.query(checkQuery, [protocol.championship_year]);
        
        if (checkResult.rows.length > 0) {
          // Update existing record
          const updateQuery = `
            UPDATE european_championship_protocols SET
              host_country = $2, climate_zone = $3, teams_participating = $4,
              games_per_team = $5, tournament_duration_days = $6, average_temperature_celsius = $7,
              average_humidity_percentage = $8, altitude_variations_meters = $9,
              pre_tournament_hydration_protocol = $10, daily_hydration_targets_ml_per_kg = $11,
              between_games_hydration_strategy = $12, recovery_hydration_protocol = $13,
              hydration_status_checks_per_day = $14, body_weight_monitoring_frequency = $15,
              cognitive_testing_schedule = $16, hydration_related_injuries = $17,
              performance_consistency_score = $18, athlete_feedback_score = $19
            WHERE championship_year = $1
            RETURNING *
          `;
          
          const values = [
            protocol.championship_year, protocol.host_country, protocol.climate_zone,
            protocol.teams_participating, protocol.games_per_team, protocol.tournament_duration_days,
            protocol.average_temperature_celsius, protocol.average_humidity_percentage,
            protocol.altitude_variations_meters, protocol.pre_tournament_hydration_protocol,
            protocol.daily_hydration_targets_ml_per_kg, protocol.between_games_hydration_strategy,
            protocol.recovery_hydration_protocol, protocol.hydration_status_checks_per_day,
            protocol.body_weight_monitoring_frequency, protocol.cognitive_testing_schedule,
            protocol.hydration_related_injuries, protocol.performance_consistency_score,
            protocol.athlete_feedback_score
          ];
          
          await this.pool.query(updateQuery, values);
          console.log(`✅ Updated European Championship ${protocol.championship_year} protocol`);
        } else {
          // Insert new record
          const insertQuery = `
            INSERT INTO european_championship_protocols (
              championship_year, host_country, climate_zone, teams_participating,
              games_per_team, tournament_duration_days, average_temperature_celsius,
              average_humidity_percentage, altitude_variations_meters,
              pre_tournament_hydration_protocol, daily_hydration_targets_ml_per_kg,
              between_games_hydration_strategy, recovery_hydration_protocol,
              hydration_status_checks_per_day, body_weight_monitoring_frequency,
              cognitive_testing_schedule, hydration_related_injuries,
              performance_consistency_score, athlete_feedback_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            RETURNING *
          `;
          
          const values = [
            protocol.championship_year, protocol.host_country, protocol.climate_zone,
            protocol.teams_participating, protocol.games_per_team, protocol.tournament_duration_days,
            protocol.average_temperature_celsius, protocol.average_humidity_percentage,
            protocol.altitude_variations_meters, protocol.pre_tournament_hydration_protocol,
            protocol.daily_hydration_targets_ml_per_kg, protocol.between_games_hydration_strategy,
            protocol.recovery_hydration_protocol, protocol.hydration_status_checks_per_day,
            protocol.body_weight_monitoring_frequency, protocol.cognitive_testing_schedule,
            protocol.hydration_related_injuries, protocol.performance_consistency_score,
            protocol.athlete_feedback_score
          ];
          
          await this.pool.query(insertQuery, values);
          console.log(`✅ Inserted European Championship ${protocol.championship_year} protocol`);
        }
      } catch (error) {
        console.error(`❌ Error seeding European Championship ${protocol.championship_year}:`, error.message);
      }
    }
  }

  async seedWorldChampionshipProtocols() {
    console.log('🌍 Seeding World Championship protocols...');
    
    const protocols = [
      {
        championship_year: 2024,
        host_country: 'USA',
        climate_zone: 'mixed',
        teams_participating: 24,
        qualification_process: 'Regional qualifiers + wildcard entries based on world rankings',
        tournament_format: 'Group stage + knockout rounds',
        climate_variations_across_venues: ['temperate', 'hot', 'humid', 'dry'],
        altitude_challenges: ['sea_level', 'moderate_altitude', 'high_altitude'],
        travel_impact_on_hydration: ['jet_lag_adaptation', 'climate_acclimatization', 'time_zone_adjustment'],
        personalized_hydration_plans: true,
        real_time_hydration_monitoring: true,
        emergency_hydration_protocols: ['heat_stroke_prevention', 'dehydration_emergency', 'electrolyte_imbalance'],
        data_collection_protocols: ['continuous_monitoring', 'biometric_tracking', 'performance_correlation'],
        performance_correlation_studies: true,
        long_term_follow_up_studies: true
      },
      {
        championship_year: 2026,
        host_country: 'Canada',
        climate_zone: 'temperate',
        teams_participating: 28,
        qualification_process: 'Expanded regional qualifiers + performance-based wildcards',
        tournament_format: 'Enhanced group stage + double elimination',
        climate_variations_across_venues: ['temperate', 'cool', 'moderate_humidity'],
        altitude_challenges: ['sea_level', 'low_altitude'],
        travel_impact_on_hydration: ['climate_acclimatization', 'time_zone_adjustment'],
        personalized_hydration_plans: true,
        real_time_hydration_monitoring: true,
        emergency_hydration_protocols: ['dehydration_emergency', 'electrolyte_imbalance'],
        data_collection_protocols: ['continuous_monitoring', 'biometric_tracking'],
        performance_correlation_studies: true,
        long_term_follow_up_studies: true
      }
    ];

    for (const protocol of protocols) {
      try {
        // First check if record exists
        const checkQuery = 'SELECT id FROM world_championship_protocols WHERE championship_year = $1';
        const checkResult = await this.pool.query(checkQuery, [protocol.championship_year]);
        
        if (checkResult.rows.length > 0) {
          // Update existing record
          const updateQuery = `
            UPDATE world_championship_protocols SET
              host_country = $2, climate_zone = $3, teams_participating = $4,
              qualification_process = $5, tournament_format = $6, climate_variations_across_venues = $7,
              altitude_challenges = $8, travel_impact_on_hydration = $9, personalized_hydration_plans = $10,
              real_time_hydration_monitoring = $11, emergency_hydration_protocols = $12,
              data_collection_protocols = $13, performance_correlation_studies = $14,
              long_term_follow_up_studies = $15
            WHERE championship_year = $1
            RETURNING *
          `;
          
          const values = [
            protocol.championship_year, protocol.host_country, protocol.climate_zone,
            protocol.teams_participating, protocol.qualification_process, protocol.tournament_format,
            protocol.climate_variations_across_venues, protocol.altitude_challenges,
            protocol.travel_impact_on_hydration, protocol.personalized_hydration_plans,
            protocol.real_time_hydration_monitoring, protocol.emergency_hydration_protocols,
            protocol.data_collection_protocols, protocol.performance_correlation_studies,
            protocol.long_term_follow_up_studies
          ];
          
          await this.pool.query(updateQuery, values);
          console.log(`✅ Updated World Championship ${protocol.championship_year} protocol`);
        } else {
          // Insert new record
          const insertQuery = `
            INSERT INTO world_championship_protocols (
              championship_year, host_country, climate_zone, teams_participating,
              qualification_process, tournament_format, climate_variations_across_venues,
              altitude_challenges, travel_impact_on_hydration, personalized_hydration_plans,
              real_time_hydration_monitoring, emergency_hydration_protocols,
              data_collection_protocols, performance_correlation_studies,
              long_term_follow_up_studies
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
          `;
          
          const values = [
            protocol.championship_year, protocol.host_country, protocol.climate_zone,
            protocol.teams_participating, protocol.qualification_process, protocol.tournament_format,
            protocol.climate_variations_across_venues, protocol.altitude_challenges,
            protocol.travel_impact_on_hydration, protocol.personalized_hydration_plans,
            protocol.real_time_hydration_monitoring, protocol.emergency_hydration_protocols,
            protocol.data_collection_protocols, protocol.performance_correlation_studies,
            protocol.long_term_follow_up_studies
          ];
          
          await this.pool.query(insertQuery, values);
          console.log(`✅ Inserted World Championship ${protocol.championship_year} protocol`);
        }
      } catch (error) {
        console.error(`❌ Error seeding World Championship ${protocol.championship_year}:`, error.message);
      }
    }
  }

  async seedOlympicGamesProtocols() {
    console.log('🥇 Seeding Olympic Games protocols...');
    
    const protocols = [
      {
        olympic_year: 2028,
        host_city: 'Los Angeles, USA',
        flag_football_status: 'demonstration_sport',
        anti_doping_compliance: ['wada_standards', 'real_time_monitoring', 'athlete_education'],
        international_standards_application: ['olympic_charter', 'ifaf_regulations', 'world_anti_doping_code'],
        cultural_dietary_considerations: ['multicultural_nutrition', 'religious_dietary_laws', 'local_food_integration'],
        wearable_technology_integration: true,
        real_time_biometric_monitoring: true,
        ai_powered_hydration_optimization: true,
        research_collaborations: ['olympic_research_center', 'university_partnerships', 'international_studies'],
        knowledge_transfer_programs: ['coach_education', 'athlete_mentorship', 'sports_science_exchange'],
        long_term_impact_studies: true
      }
    ];

    for (const protocol of protocols) {
      try {
        // First check if record exists
        const checkQuery = 'SELECT id FROM olympic_games_protocols WHERE olympic_year = $1';
        const checkResult = await this.pool.query(checkQuery, [protocol.olympic_year]);
        
        if (checkResult.rows.length > 0) {
          // Update existing record
          const updateQuery = `
            UPDATE olympic_games_protocols SET
              host_city = $2, flag_football_status = $3, anti_doping_compliance = $4,
              international_standards_application = $5, cultural_dietary_considerations = $6,
              wearable_technology_integration = $7, real_time_biometric_monitoring = $8,
              ai_powered_hydration_optimization = $9, research_collaborations = $10,
              knowledge_transfer_programs = $11, long_term_impact_studies = $12
            WHERE olympic_year = $1
            RETURNING *
          `;
          
          const values = [
            protocol.olympic_year, protocol.host_city, protocol.flag_football_status,
            protocol.anti_doping_compliance, protocol.international_standards_application,
            protocol.cultural_dietary_considerations, protocol.wearable_technology_integration,
            protocol.real_time_biometric_monitoring, protocol.ai_powered_hydration_optimization,
            protocol.research_collaborations, protocol.knowledge_transfer_programs,
            protocol.long_term_impact_studies
          ];
          
          await this.pool.query(updateQuery, values);
          console.log(`✅ Updated Olympic Games ${protocol.olympic_year} protocol`);
        } else {
          // Insert new record
          const insertQuery = `
            INSERT INTO olympic_games_protocols (
              olympic_year, host_city, flag_football_status, anti_doping_compliance,
              international_standards_application, cultural_dietary_considerations,
              wearable_technology_integration, real_time_biometric_monitoring,
              ai_powered_hydration_optimization, research_collaborations,
              knowledge_transfer_programs, long_term_impact_studies
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
          `;
          
          const values = [
            protocol.olympic_year, protocol.host_city, protocol.flag_football_status,
            protocol.anti_doping_compliance, protocol.international_standards_application,
            protocol.cultural_dietary_considerations, protocol.wearable_technology_integration,
            protocol.real_time_biometric_monitoring, protocol.ai_powered_hydration_optimization,
            protocol.research_collaborations, protocol.knowledge_transfer_programs,
            protocol.long_term_impact_studies
          ];
          
          await this.pool.query(insertQuery, values);
          console.log(`✅ Inserted Olympic Games ${protocol.olympic_year} protocol`);
        }
      } catch (error) {
        console.error(`❌ Error seeding Olympic Games ${protocol.olympic_year}:`, error.message);
      }
    }
  }

  async runAllSeeders() {
    console.log('🚀 Starting Competition Protocols seeding (Final Version)...\n');
    
    try {
      await this.seedEuropeanChampionshipProtocols();
      await this.seedWorldChampionshipProtocols();
      await this.seedOlympicGamesProtocols();
      
      console.log('\n🎉 Competition Protocols seeding completed successfully!');
      console.log('\n📊 Seeded protocols:');
      console.log('   ✅ European Championships: 2 protocols');
      console.log('   ✅ World Championships: 2 protocols');
      console.log('   ✅ Olympic Games: 1 protocol');
      
    } catch (error) {
      console.error('❌ Seeding failed:', error.message);
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
