/**
 * List ALL tables in Supabase using direct PostgreSQL connection
 * This requires a direct database connection string
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Get database connection string
// Supabase connection string format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
const databaseUrl = process.env.DATABASE_URL || 
  process.env.SUPABASE_DB_URL ||
  (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY 
    ? `postgresql://postgres.pvziciccwxgftcielknm:${process.env.SUPABASE_SERVICE_KEY}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`
    : null);

if (!databaseUrl) {
  console.error('❌ Error: Missing database connection string');
  console.error('Please set DATABASE_URL or SUPABASE_DB_URL environment variable');
  console.error('\n💡 You can construct it from:');
  console.error('   postgresql://postgres.[PROJECT_REF]:[SERVICE_KEY]@aws-0-[REGION].pooler.supabase.com:5432/postgres');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function listAllTables() {
  console.log('🔍 Querying Supabase database directly for ALL tables...\n');

  try {
    // Query information_schema to get all tables
    const query = `
      SELECT 
        table_name,
        (SELECT COUNT(*) 
         FROM information_schema.columns 
         WHERE table_schema = 'public' 
         AND table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log('⚠️  No tables found in the public schema');
      return;
    }

    console.log('='.repeat(70));
    console.log(`📊 FOUND ${result.rows.length} TABLES IN YOUR SUPABASE DATABASE\n`);
    console.log('='.repeat(70));
    
    result.rows.forEach((row, index) => {
      console.log(`${(index + 1).toString().padStart(3)}. ${row.table_name.padEnd(40)} (${row.column_count} columns)`);
    });

    console.log('='.repeat(70));
    console.log(`\n📊 TOTAL: ${result.rows.length} tables\n`);

    // Group by category if possible
    const categories = {
      'Core': ['users', 'teams', 'players'],
      'Training': result.rows.filter(r => r.table_name.includes('training') || r.table_name.includes('exercise') || r.table_name.includes('workout')),
      'Analytics': result.rows.filter(r => r.table_name.includes('analytics') || r.table_name.includes('event')),
      'Communication': result.rows.filter(r => r.table_name.includes('chat') || r.table_name.includes('notification') || r.table_name.includes('post') || r.table_name.includes('comment')),
      'Wellness': result.rows.filter(r => r.table_name.includes('wellness') || r.table_name.includes('hydration') || r.table_name.includes('nutrition') || r.table_name.includes('recovery')),
      'Research': result.rows.filter(r => r.table_name.includes('research') || r.table_name.includes('knowledge')),
      'Other': []
    };

    // Show summary by category
    console.log('📋 SUMMARY BY CATEGORY:');
    console.log('-'.repeat(70));
    Object.entries(categories).forEach(([category, tables]) => {
      if (tables.length > 0 && category !== 'Other') {
        console.log(`   ${category}: ${tables.length} tables`);
      }
    });

  } catch (error) {
    console.error('❌ Error querying database:', error.message);
    console.error('\n💡 Make sure you have:');
    console.error('   1. DATABASE_URL or SUPABASE_DB_URL set in your .env file');
    console.error('   2. The connection string format is correct');
    console.error('   3. Your Supabase service key has database access');
  } finally {
    await pool.end();
  }
}

listAllTables().catch(console.error);

