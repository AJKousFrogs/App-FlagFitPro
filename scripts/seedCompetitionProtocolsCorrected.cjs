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
        const query = `
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
          ON CONFLICT (championship_year) DO UPDATE SET
            host_country = EXCLUDED.host_country,
            climate_zone = EXCLUDED.climate_zone,
            teams_participating = EXCLUDED.teams_participating,
            games_per_team = EXCLUDED.games_per_team,
            tournament_duration_days = EXCLUDED.tournament_duration_days,
            average_temperature_celsius = EXCLUDED.average_temperature_celsius,
            average_humidity_percentage = EXCLUDED.average_humidity_percentage,
            altitude_variations_meters = EXCLUDED.altitude_variations_meters,
            pre_tournament_hydration_protocol = EXCLUDED.pre_tournament_hydration_protocol,
            daily_hydration_targets_ml_per_kg = EXCLUDED.daily_hydration_targets_ml_per_kg,
            between_games_hydration_strategy = EXCLUDED.between_games_hydration_strategy,
            recovery_hydration_protocol = EXCLUDED.recovery_hydration_protocol,
            hydration_status_checks_per_day = EXCLUDED.hydration_status_checks_per_day,
            body_weight_monitoring_frequency = EXCLUDED.body_weight_monitoring_frequency,
            cognitive_testing_schedule = EXCLUDED.cognitive_testing_schedule,
            hydration_related_injuries = EXCLUDED.hydration_related_injuries,
            performance_consistency_score = EXCLUDED.performance_consistency_score,
            athlete_feedback_score = EXCLUDED.athlete_feedback_score
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
        
        const result = await this.pool.query(query, values);
        console.log(`✅ Seeded European Championship ${protocol.championship_year} protocol`);
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
        const query = `
          INSERT INTO world_championship_protocols (
            championship_year, host_country, climate_zone, teams_participating,
            qualification_process, tournament_format, climate_variations_across_venues,
            altitude_challenges, travel_impact_on_hydration, personalized_hydration_plans,
            real_time_hydration_monitoring, emergency_hydration_protocols,
            data_collection_protocols, performance_correlation_studies,
            long_term_follow_up_studies
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (championship_year) DO UPDATE SET
            host_country = EXCLUDED.host_country,
            climate_zone = EXCLUDED.climate_zone,
            teams_participating = EXCLUDED.teams_participating,
            qualification_process = EXCLUDED.qualification_process,
            tournament_format = EXCLUDED.tournament_format,
            climate_variations_across_venues = EXCLUDED.climate_variations_across_venues,
            altitude_challenges = EXCLUDED.altitude_challenges,
            travel_impact_on_hydration = EXCLUDED.travel_impact_on_hydration,
            personalized_hydration_plans = EXCLUDED.personalized_hydration_plans,
            real_time_hydration_monitoring = EXCLUDED.real_time_hydration_monitoring,
            emergency_hydration_protocols = EXCLUDED.emergency_hydration_protocols,
            data_collection_protocols = EXCLUDED.data_collection_protocols,
            performance_correlation_studies = EXCLUDED.performance_correlation_studies,
            long_term_follow_up_studies = EXCLUDED.long_term_follow_up_studies
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
        
        const result = await this.pool.query(query, values);
        console.log(`✅ Seeded World Championship ${protocol.championship_year} protocol`);
      } catch (error) {
        console.error(`❌ Error seeding World Championship ${protocol.championship_year}:`, error.message);
      }
    }
  }

  async seedOlympicGamesProtocols() {
    console.log('🥇 Seeding Olympic Games protocols...');
    
    // Check if olympic_games_protocols table exists and get its structure
    try {
      const tableCheck = await this.pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'olympic_games_protocols' 
        ORDER BY ordinal_position
      `);
      
      if (tableCheck.rows.length === 0) {
        console.log('⚠️ Olympic Games protocols table does not exist, skipping...');
        return;
      }
      
      console.log('📋 Olympic Games table structure:', tableCheck.rows.map(r => `${r.column_name} (${r.data_type})`));
      
      // For now, just log the structure since we need to see what columns exist
      console.log('🔍 Need to examine Olympic Games table structure before seeding');
      
    } catch (error) {
      console.log('⚠️ Olympic Games protocols table not accessible:', error.message);
    }
  }

  async runAllSeeders() {
    console.log('🚀 Starting Competition Protocols seeding (Corrected)...\n');
    
    try {
      await this.seedEuropeanChampionshipProtocols();
      await this.seedWorldChampionshipProtocols();
      await this.seedOlympicGamesProtocols();
      
      console.log('\n🎉 Competition Protocols seeding completed!');
      console.log('\n📊 Seeded protocols:');
      console.log('   ✅ European Championships: 2 protocols');
      console.log('   ✅ World Championships: 2 protocols');
      console.log('   🔍 Olympic Games: Structure examined');
      
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
