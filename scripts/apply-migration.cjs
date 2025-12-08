#!/usr/bin/env node

/**
 * Apply Database Migration Script
 * Applies a specific migration file to the Supabase database
 *
 * Usage: node scripts/apply-migration.cjs <migration-file>
 * Example: node scripts/apply-migration.cjs database/migrations/033_readiness_score_system.sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check if migration file is provided
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Error: No migration file specified');
  console.log('Usage: node scripts/apply-migration.cjs <migration-file>');
  console.log('Example: node scripts/apply-migration.cjs database/migrations/033_readiness_score_system.sql');
  process.exit(1);
}

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env file');
  process.exit(1);
}

// Initialize Supabase client with service key (admin access)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🔧 Reading migration file...');

    // Read migration file
    const migrationPath = path.resolve(process.cwd(), migrationFile);
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Error: Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`✅ Migration file loaded: ${path.basename(migrationPath)}`);
    console.log(`📄 SQL length: ${migrationSQL.length} characters\n`);

    // For Supabase, we need to use the SQL Editor or provide instructions
    // Supabase doesn't allow arbitrary SQL execution via RPC without a custom function
    console.log('📋 Supabase Migration Instructions:');
    console.log('─────────────────────────────────────────────────────────────────────────────');
    console.log('1. Go to your Supabase Dashboard → SQL Editor');
    console.log('   https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1]?.split('.')[0] || 'your-project');
    console.log('2. Copy and paste the following SQL:\n');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    console.log('\n3. Click "Run" to execute the migration');
    console.log('4. Verify the migration was successful by checking the tables:');
    console.log('   - wellness_logs');
    console.log('   - fixtures');
    console.log('   - readiness_scores');
    console.log('   - training_sessions (should have rpe column)');
    console.log('\n✅ Migration SQL ready to execute!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the migration
applyMigration();

