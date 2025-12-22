#!/usr/bin/env node

import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seedWeatherTrainingDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌦️ Seeding Weather Training Knowledge Base...');

    // Create weather training adaptation table
    await client.query(`
      CREATE TABLE IF NOT EXISTS weather_training_adaptations (
        id SERIAL PRIMARY KEY,
        weather_condition VARCHAR(100) NOT NULL,
        temperature_range VARCHAR(50),
        humidity_range VARCHAR(50),
        wind_conditions VARCHAR(100),
        precipitation_type VARCHAR(50),
        training_modifications JSONB,
        safety_considerations TEXT[],
        performance_impacts JSONB,
        equipment_adjustments TEXT[],
        hydration_guidelines TEXT[],
        timing_recommendations TEXT[],
        intensity_adjustments JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create weather prediction training impact table
    await client.query(`
      CREATE TABLE IF NOT EXISTS weather_prediction_impacts (
        id SERIAL PRIMARY KEY,
        weather_type VARCHAR(100) NOT NULL,
        condition_severity VARCHAR(50),
        training_effectiveness_percentage INTEGER,
        injury_risk_multiplier DECIMAL(3,2),
        recommended_alternatives TEXT[],
        indoor_backup_options TEXT[],
        optimal_training_windows TEXT[],
        equipment_requirements TEXT[],
        athlete_preparation_tips TEXT[],
        coach_adaptation_strategies TEXT[],
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Seed weather condition data
    const weatherConditions = [
      {
        weather_condition: 'Hot and Humid',
        temperature_range: '80-95°F (27-35°C)',
        humidity_range: '70-90%',
        wind_conditions: 'Light winds < 10 mph',
        precipitation_type: null,
        training_modifications: {
          'duration_reduction': '20-30%',
          'intensity_reduction': '15-25%',
          'rest_periods': 'Increase by 50%',
          'hydration_breaks': 'Every 10-15 minutes',
          'start_time': 'Early morning or evening'
        },
        safety_considerations: [
          'Monitor for heat exhaustion symptoms',
          'Mandatory water breaks every 15 minutes',
          'Shade areas required for rest periods',
          'Medical staff on standby',
          'Cancel if heat index exceeds 105°F'
        ],
        performance_impacts: {
          'endurance': '-25%',
          'speed': '-15%',
          'decision_making': '-20%',
          'reaction_time': '-10%',
          'dehydration_risk': 'High'
        },
        equipment_adjustments: [
          'Light-colored, moisture-wicking clothing',
          'Cooling towels and ice packs',
          'Electrolyte supplements',
          'Portable shade structures',
          'Extra water bottles and sports drinks'
        ],
        hydration_guidelines: [
          'Pre-training: 16-20 oz fluid 2 hours before',
          'During training: 6-8 oz every 15-20 minutes',
          'Post-training: 150% of fluid lost through sweat',
          'Monitor urine color for hydration status',
          'Include electrolytes in fluids'
        ],
        timing_recommendations: [
          'Train before 10 AM or after 6 PM',
          'Avoid peak sun hours (11 AM - 4 PM)',
          'Consider split sessions',
          'Allow 3-5 days for heat acclimatization'
        ],
        intensity_adjustments: {
          'aerobic_work': 'Reduce by 20%',
          'anaerobic_work': 'Reduce by 30%',
          'skill_work': 'Maintain normal intensity',
          'strength_training': 'Move indoors if possible'
        }
      },
      {
        weather_condition: 'Cold and Dry',
        temperature_range: '20-40°F (-7-4°C)',
        humidity_range: '20-40%',
        wind_conditions: 'Variable winds',
        precipitation_type: null,
        training_modifications: {
          'warm_up_extension': '50% longer',
          'layer_management': 'Progressive removal system',
          'equipment_prep': 'Pre-warm balls and gear',
          'surface_conditions': 'Check for ice/frost'
        },
        safety_considerations: [
          'Extended warm-up period (15-20 minutes)',
          'Monitor for hypothermia signs',
          'Check field conditions for ice',
          'Proper layering system education',
          'Emergency warming protocols'
        ],
        performance_impacts: {
          'muscle_flexibility': '-20%',
          'injury_risk': '+15%',
          'ball_handling': '-10%',
          'breathing_efficiency': '-5%',
          'motivation_levels': 'Variable'
        },
        equipment_adjustments: [
          'Compression layers as base',
          'Insulated gloves for skill players',
          'Warm-up gear for sideline',
          'Hand/foot warmers',
          'Wind-resistant outer layers'
        ],
        hydration_guidelines: [
          'Maintain normal fluid intake',
          'Warm beverages during breaks',
          'Monitor for dehydration (still occurs in cold)',
          'Avoid alcohol-containing drinks',
          'Consider electrolyte needs'
        ],
        timing_recommendations: [
          'Allow extra time for equipment prep',
          'Extended warm-up protocols',
          'Shorter outdoor exposure periods',
          'Indoor alternatives for skill work'
        ],
        intensity_adjustments: {
          'warm_up_intensity': 'Gradually progressive',
          'skill_work': 'Normal intensity once warm',
          'conditioning': 'Monitor for overexertion',
          'cool_down': 'Move indoors quickly'
        }
      },
      {
        weather_condition: 'Rainy',
        temperature_range: 'Variable',
        humidity_range: '90-100%',
        wind_conditions: 'Often with wind',
        precipitation_type: 'Light to heavy rain',
        training_modifications: {
          'footing_adjustments': 'Shorter steps, lower center of gravity',
          'ball_handling': 'Extra grip techniques',
          'field_conditions': 'Assess drainage and safety',
          'visibility': 'Bright colored gear'
        },
        safety_considerations: [
          'Field condition assessment mandatory',
          'Lightning protocol awareness',
          'Slip and fall prevention',
          'Hypothermia risk in cool rain',
          '30-30 lightning rule enforcement'
        ],
        performance_impacts: {
          'traction': '-30%',
          'ball_security': '-25%',
          'visibility': '-20%',
          'comfort_level': '-15%',
          'injury_risk': '+20%'
        },
        equipment_adjustments: [
          'Cleats with better traction',
          'Gloves for better grip',
          'Waterproof outer layers',
          'Towels for equipment drying',
          'Change of clothes available'
        ],
        hydration_guidelines: [
          'Continue normal hydration despite cool feeling',
          'Warm fluids preferred',
          'Monitor electrolyte balance',
          'Post-training rehydration crucial'
        ],
        timing_recommendations: [
          'Monitor weather radar constantly',
          'Have indoor backup plan ready',
          'Consider postponing if severe',
          'Quick transition protocols'
        ],
        intensity_adjustments: {
          'contact_drills': 'Reduce or eliminate',
          'cutting_movements': 'Reduce intensity',
          'skill_work': 'Focus on ball security',
          'conditioning': 'Indoor alternatives preferred'
        }
      },
      {
        weather_condition: 'Windy',
        temperature_range: 'Variable',
        humidity_range: 'Variable',
        wind_conditions: '15-30+ mph sustained',
        precipitation_type: null,
        training_modifications: {
          'passing_adjustments': 'Account for wind drift',
          'field_positioning': 'Use wind as training tool',
          'equipment_security': 'Weight down loose items',
          'safety_zones': 'Avoid areas with debris risk'
        },
        safety_considerations: [
          'Secure all loose equipment',
          'Check for flying debris hazards',
          'Monitor wind speeds continuously',
          'Avoid high kicks/throws if extreme',
          'Eye protection from dust/debris'
        ],
        performance_impacts: {
          'passing_accuracy': '-15% to -30%',
          'kick_accuracy': '-25% to -40%',
          'balance_stability': '-10%',
          'communication': '-20% (noise)',
          'psychological_comfort': 'Variable'
        },
        equipment_adjustments: [
          'Secure all loose gear',
          'Eye protection if dusty',
          'Weighted practice balls',
          'Wind-resistant clothing',
          'Extra equipment anchoring'
        ],
        hydration_guidelines: [
          'Increased fluid needs due to wind chill',
          'Protect fluids from contamination',
          'Monitor for dehydration masking',
          'Consider wind chill effects'
        ],
        timing_recommendations: [
          'Use as natural training resistance',
          'Practice wind-affected scenarios',
          'Adjust passing/kicking drills',
          'Indoor alternative if extreme (30+ mph)'
        ],
        intensity_adjustments: {
          'passing_drills': 'Focus on technique adaptation',
          'agility_work': 'Use wind as resistance',
          'conditioning': 'Normal intensity',
          'skill_work': 'Emphasize fundamentals'
        }
      }
    ];

    // Seed weather prediction impacts
    const predictionImpacts = [
      {
        weather_type: 'Severe Thunderstorm',
        condition_severity: 'High',
        training_effectiveness_percentage: 0,
        injury_risk_multiplier: 3.0,
        recommended_alternatives: ['Indoor facility training', 'Film study', 'Mental training'],
        indoor_backup_options: ['Gymnasium workouts', 'Weight room', 'Classroom sessions'],
        optimal_training_windows: ['Before storm arrival', 'After storm passes completely'],
        equipment_requirements: ['Lightning detection system', 'Emergency communication'],
        athlete_preparation_tips: ['Monitor weather updates', 'Have indoor gear ready'],
        coach_adaptation_strategies: ['Flexible scheduling', 'Indoor practice plans ready']
      },
      {
        weather_type: 'Light Rain',
        condition_severity: 'Low',
        training_effectiveness_percentage: 75,
        injury_risk_multiplier: 1.2,
        recommended_alternatives: ['Modified outdoor training', 'Covered area drills'],
        indoor_backup_options: ['Partial indoor training', 'Skills work under cover'],
        optimal_training_windows: ['Between showers', 'Light steady rain periods'],
        equipment_requirements: ['Non-slip surfaces', 'Towels for drying'],
        athlete_preparation_tips: ['Extra grip techniques', 'Layer management'],
        coach_adaptation_strategies: ['Emphasis on ball security', 'Shorter drill segments']
      },
      {
        weather_type: 'Extreme Heat',
        condition_severity: 'High',
        training_effectiveness_percentage: 40,
        injury_risk_multiplier: 2.5,
        recommended_alternatives: ['Very early morning training', 'Indoor conditioning'],
        indoor_backup_options: ['Air-conditioned facility', 'Pool training'],
        optimal_training_windows: ['5:00-8:00 AM', '7:00-9:00 PM'],
        equipment_requirements: ['Cooling stations', 'Medical personnel'],
        athlete_preparation_tips: ['Pre-cooling techniques', 'Acclimatization protocol'],
        coach_adaptation_strategies: ['Mandatory rest periods', 'Split sessions']
      }
    ];

    // Insert weather conditions data
    for (const condition of weatherConditions) {
      await client.query(`
        INSERT INTO weather_training_adaptations (
          weather_condition, temperature_range, humidity_range, wind_conditions,
          precipitation_type, training_modifications, safety_considerations,
          performance_impacts, equipment_adjustments, hydration_guidelines,
          timing_recommendations, intensity_adjustments
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT DO NOTHING
      `, [
        condition.weather_condition,
        condition.temperature_range,
        condition.humidity_range,
        condition.wind_conditions,
        condition.precipitation_type,
        JSON.stringify(condition.training_modifications),
        condition.safety_considerations,
        JSON.stringify(condition.performance_impacts),
        condition.equipment_adjustments,
        condition.hydration_guidelines,
        condition.timing_recommendations,
        JSON.stringify(condition.intensity_adjustments)
      ]);
    }

    // Insert prediction impacts data
    for (const impact of predictionImpacts) {
      await client.query(`
        INSERT INTO weather_prediction_impacts (
          weather_type, condition_severity, training_effectiveness_percentage,
          injury_risk_multiplier, recommended_alternatives, indoor_backup_options,
          optimal_training_windows, equipment_requirements, athlete_preparation_tips,
          coach_adaptation_strategies
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING
      `, [
        impact.weather_type,
        impact.condition_severity,
        impact.training_effectiveness_percentage,
        impact.injury_risk_multiplier,
        impact.recommended_alternatives,
        impact.indoor_backup_options,
        impact.optimal_training_windows,
        impact.equipment_requirements,
        impact.athlete_preparation_tips,
        impact.coach_adaptation_strategies
      ]);
    }

    console.log(`✅ Seeded ${weatherConditions.length} weather conditions and ${predictionImpacts.length} prediction impacts`);

  } catch (error) {
    console.error('❌ Error seeding weather training database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedWeatherTrainingDatabase()
    .then(() => {
      console.log('🎉 Weather training database seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export default seedWeatherTrainingDatabase;