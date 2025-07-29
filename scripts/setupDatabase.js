#!/usr/bin/env node

import dotenv from 'dotenv';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  console.log('🚀 Starting comprehensive database setup...');
  console.log('==========================================');
  
  try {
    // Step 1: Run database migrations
    console.log('\n📋 Step 1: Running database migrations...');
    console.log('------------------------------------------');
    
    const migrationScript = path.join(__dirname, 'runMigrations.js');
    execSync(`node ${migrationScript}`, { 
      stdio: 'inherit',
      cwd: path.dirname(__dirname)
    });
    
    console.log('✅ Database migrations completed successfully!');
    
    // Step 2: Seed comprehensive nutrition database
    console.log('\n🥗 Step 2: Seeding comprehensive nutrition database...');
    console.log('-----------------------------------------------------');
    
    const nutritionScript = path.join(__dirname, 'seedComprehensiveNutritionDatabase.js');
    execSync(`node ${nutritionScript}`, { 
      stdio: 'inherit',
      cwd: path.dirname(__dirname)
    });
    
    console.log('✅ Nutrition database seeding completed successfully!');
    
    // Step 3: Seed recovery science database
    console.log('\n🏥 Step 3: Seeding recovery science database...');
    console.log('-----------------------------------------------');
    
    const recoveryScript = path.join(__dirname, 'seedRecoveryScienceDatabase.js');
    execSync(`node ${recoveryScript}`, { 
      stdio: 'inherit',
      cwd: path.dirname(__dirname)
    });
    
    console.log('✅ Recovery science database seeding completed successfully!');
    
    // Step 4: Seed AI coaches and sport psychology database
    console.log('\n🤖 Step 4: Seeding AI coaches and sport psychology database...');
    console.log('----------------------------------------------------------------');
    
    const aiCoachesScript = path.join(__dirname, 'seedAICoachesDatabase.js');
    execSync(`node ${aiCoachesScript}`, { 
      stdio: 'inherit',
      cwd: path.dirname(__dirname)
    });
    
    console.log('✅ AI coaches database seeding completed successfully!');
    
    // Step 5: Seed sports science research data
    console.log('\n🔬 Step 5: Seeding sports science research data...');
    console.log('------------------------------------------------');
    
    const sportsScienceScript = path.join(__dirname, 'seedSportsScienceResearch.js');
    execSync(`node ${sportsScienceScript}`, { 
      stdio: 'inherit',
      cwd: path.dirname(__dirname)
    });
    
    console.log('✅ Sports science research data seeding completed successfully!');
    
    // Step 6: Seed enhanced sport psychology database
    console.log('\n🧠 Step 6: Seeding enhanced sport psychology database...');
    console.log('------------------------------------------------------');
    
    const enhancedPsychologyScript = path.join(__dirname, 'seedEnhancedSportPsychologyDatabase.js');
    execSync(`node ${enhancedPsychologyScript}`, { 
      stdio: 'inherit',
      cwd: path.dirname(__dirname)
    });
    
    console.log('✅ Enhanced sport psychology database seeding completed successfully!');
    
    // Step 7: Seed enhanced sports nutrition database
    console.log('\n🥗 Step 7: Seeding enhanced sports nutrition database...');
    console.log('-----------------------------------------------------');
    
    const enhancedNutritionScript = path.join(__dirname, 'seedEnhancedSportsNutritionDatabase.js');
    execSync(`node ${enhancedNutritionScript}`, { 
      stdio: 'inherit',
      cwd: path.dirname(__dirname)
    });
    
    console.log('✅ Enhanced sports nutrition database seeding completed successfully!');
    
    // Step 8: Integrate sports medicine APIs
    console.log('\n🔗 Step 8: Integrating sports medicine APIs...');
    console.log('---------------------------------------------');
    
    const apiIntegrationScript = path.join(__dirname, 'integrateSportsMedicineAPIs.js');
    execSync(`node ${apiIntegrationScript}`, { 
      stdio: 'inherit',
      cwd: path.dirname(__dirname)
    });
    
    console.log('✅ Sports medicine API integration completed successfully!');
    
    // Step 9: Seed flag football training database
    console.log('\n🏈 Step 9: Seeding flag football training database...');
    console.log('--------------------------------------------------');
    
    const flagFootballTrainingScript = path.join(__dirname, 'seedFlagFootballTrainingDatabase.js');
    execSync(`node ${flagFootballTrainingScript}`, { 
      stdio: 'inherit',
      cwd: path.dirname(__dirname)
    });
    
    console.log('✅ Flag football training database seeding completed successfully!');
    
    // Step 10: Verify database setup
    console.log('\n🔍 Step 10: Verifying database setup...');
    console.log('---------------------------------------');
    
    await verifyDatabaseSetup();
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('==========================================');
    console.log('\n📊 Database Summary:');
    console.log('   • Nutrition system: USDA FoodData Central integration');
    console.log('   • Recovery system: Cryotherapy, compression, foam rolling protocols');
    console.log('   • AI coaches: Sport psychology content from leading institutions');
    console.log('   • Sports science research: Data from Deakin, Norwegian School, INSEP');
    console.log('   • Enhanced sport psychology: Wikipedia-based content with rehabilitation, nutrition psychology');
    console.log('   • Enhanced sports nutrition: Wikipedia-based content with gender-specific and exercise-specific nutrition');
    console.log('   • API integration: Peer-reviewed sports medicine research from BMJ, MDPI, PubMed, Crossref, Europe PMC');
    console.log('   • Flag football training: Comprehensive training for QB, WR, DB positions with footwork and drills');
    console.log('   • Evidence-based protocols: Performance methodologies and interventions');
    console.log('\n🚀 Your FlagFit Pro application is ready to use!');
    
  } catch (error) {
    console.error('\n💥 Database setup failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Check your database connection settings in .env');
    console.error('   2. Ensure PostgreSQL is running and accessible');
    console.error('   3. Verify database user permissions');
    console.error('   4. Check if database exists: flagfootball_dev');
    process.exit(1);
  }
}

async function verifyDatabaseSetup() {
  const { Pool } = await import('pg');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'flagfootball_dev',
    user: process.env.DB_USER || 'aljosaursakous',
    password: process.env.DB_PASSWORD || ''
  };
  
  let db;
  
  try {
    db = new Pool(dbConfig);
    
    // Check nutrition tables
    const nutritionTables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('foods', 'nutrients', 'nutrition_plans', 'supplements')
    `);
    
    // Check recovery tables
    const recoveryTables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('recovery_protocols', 'cryotherapy_protocols', 'compression_protocols')
    `);
    
    // Check AI coaches tables
    const aiCoachesTables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('ai_coaches', 'mental_training_techniques', 'psychological_assessments')
    `);
    
    // Check sports science research tables
    const sportsScienceTables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('research_institutions', 'research_studies', 'performance_methodologies', 'evidence_based_protocols')
    `);
    
    // Check enhanced sport psychology tables
    const enhancedPsychologyTables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sport_psychology_history', 'applied_sport_psychology_techniques', 'rehabilitation_psychology', 'sport_nutrition_psychology', 'recovery_session_psychology')
    `);
    
    // Check enhanced sports nutrition tables
    const enhancedNutritionTables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('sports_nutrition_fundamentals', 'gender_specific_nutrition', 'anaerobic_exercise_nutrition', 'aerobic_exercise_nutrition', 'enhanced_supplements')
    `);
    
    // Check API integration tables
    const apiIntegrationTables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('api_sources', 'api_articles', 'api_search_queries')
    `);
    
    // Check flag football training tables
    const flagFootballTrainingTables = await db.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('flag_football_fundamentals', 'quarterback_training', 'wide_receiver_training', 'defensive_back_training', 'footwork_training', 'flag_football_drills', 'practice_plans')
    `);
    
    // Check data counts
    const nutritionCount = await db.query('SELECT COUNT(*) as count FROM foods');
    const recoveryCount = await db.query('SELECT COUNT(*) as count FROM recovery_protocols');
    const coachesCount = await db.query('SELECT COUNT(*) as count FROM ai_coaches');
    const researchCount = await db.query('SELECT COUNT(*) as count FROM research_studies');
    const psychologyCount = await db.query('SELECT COUNT(*) as count FROM applied_sport_psychology_techniques');
    const enhancedNutritionCount = await db.query('SELECT COUNT(*) as count FROM enhanced_supplements');
    const apiArticlesCount = await db.query('SELECT COUNT(*) as count FROM api_articles');
    const flagFootballDrillsCount = await db.query('SELECT COUNT(*) as count FROM flag_football_drills');
    
    console.log('   ✅ Nutrition tables created:', nutritionTables.rows.length, 'tables');
    console.log('   ✅ Recovery tables created:', recoveryTables.rows.length, 'tables');
    console.log('   ✅ AI coaches tables created:', aiCoachesTables.rows.length, 'tables');
    console.log('   ✅ Sports science research tables created:', sportsScienceTables.rows.length, 'tables');
    console.log('   ✅ Enhanced sport psychology tables created:', enhancedPsychologyTables.rows.length, 'tables');
    console.log('   ✅ Enhanced sports nutrition tables created:', enhancedNutritionTables.rows.length, 'tables');
    console.log('   ✅ API integration tables created:', apiIntegrationTables.rows.length, 'tables');
    console.log('   ✅ Flag football training tables created:', flagFootballTrainingTables.rows.length, 'tables');
    console.log('   📊 Data loaded:');
    console.log('      • Foods:', nutritionCount.rows[0].count, 'records');
    console.log('      • Recovery protocols:', recoveryCount.rows[0].count, 'records');
    console.log('      • AI coaches:', coachesCount.rows[0].count, 'records');
    console.log('      • Research studies:', researchCount.rows[0].count, 'records');
    console.log('      • Sport psychology techniques:', psychologyCount.rows[0].count, 'records');
    console.log('      • Enhanced supplements:', enhancedNutritionCount.rows[0].count, 'records');
    console.log('      • API articles:', apiArticlesCount.rows[0].count, 'records');
    console.log('      • Flag football drills:', flagFootballDrillsCount.rows[0].count, 'records');
    
  } catch (error) {
    console.error('   ❌ Database verification failed:', error.message);
    throw error;
  } finally {
    if (db) {
      await db.end();
    }
  }
}

// Run the setup
setupDatabase().catch(console.error); 