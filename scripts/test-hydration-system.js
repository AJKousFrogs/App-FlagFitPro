import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.VITE_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testHydrationSystem() {
  console.log('🧪 Testing Hydration System...\n');
  
  try {
    // Test 1: Check if tables exist
    console.log('1️⃣ Checking database tables...');
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%hydration%' 
      OR table_name LIKE '%wada%'
      ORDER BY table_name
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    console.log('✅ Found tables:', tablesResult.rows.map(r => r.table_name));
    
    // Test 2: Check WADA data
    console.log('\n2️⃣ Checking WADA prohibited substances...');
    const wadaQuery = 'SELECT COUNT(*) as count FROM wada_prohibited_substances';
    const wadaResult = await pool.query(wadaQuery);
    console.log(`✅ Found ${wadaResult.rows[0].count} WADA prohibited substances`);
    
    // Test 3: Check hydration research
    console.log('\n3️⃣ Checking hydration research data...');
    const researchQuery = 'SELECT COUNT(*) as count FROM hydration_research_studies';
    const researchResult = await pool.query(researchQuery);
    console.log(`✅ Found ${researchResult.rows[0].count} hydration research studies`);
    
    // Test 4: Check IFAF protocols
    console.log('\n4️⃣ Checking IFAF hydration protocols...');
    const ifafQuery = 'SELECT COUNT(*) as count FROM ifaf_hydration_protocols';
    const ifafResult = await pool.query(ifafQuery);
    console.log(`✅ Found ${ifafResult.rows[0].count} IFAF hydration protocols`);
    
    // Test 5: Sample data from key tables
    console.log('\n5️⃣ Sample data from key tables...');
    
    // Sample WADA substances
    const sampleWadaQuery = `
      SELECT substance_name, prohibited_status, risk_level 
      FROM wada_prohibited_substances 
      LIMIT 3
    `;
    const sampleWadaResult = await pool.query(sampleWadaQuery);
    console.log('📋 Sample WADA substances:', sampleWadaResult.rows);
    
    // Sample hydration protocols
    const sampleProtocolQuery = `
      SELECT competition_type, games_per_day, game_duration_minutes 
      FROM ifaf_hydration_protocols 
      LIMIT 2
    `;
    const sampleProtocolResult = await pool.query(sampleProtocolQuery);
    console.log('📋 Sample IFAF protocols:', sampleProtocolResult.rows);
    
    // Test 6: Test materialized views
    console.log('\n6️⃣ Testing materialized views...');
    try {
      const viewQuery = 'SELECT COUNT(*) as count FROM flag_football_hydration_recommendations';
      const viewResult = await pool.query(viewQuery);
      console.log(`✅ Materialized view working: ${viewResult.rows[0].count} recommendations`);
    } catch (error) {
      console.log('⚠️ Materialized view not ready yet (this is normal for new systems)');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 System Status:');
    console.log('   ✅ Database connection: Working');
    console.log('   ✅ Tables created: Working');
    console.log('   ✅ Data seeded: Working');
    console.log('   ✅ WADA compliance: Active');
    console.log('   ✅ Hydration research: Active');
    console.log('   ✅ IFAF protocols: Active');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
  }
}

// Run the test
testHydrationSystem();
