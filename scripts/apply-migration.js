#!/usr/bin/env node
 

/**
 * Apply Database Migration Script
 * Applies a specific migration file to the Supabase database
 *
 * Usage: node scripts/apply-migration.js <migration-file>
 * Example: node scripts/apply-migration.js database/migrations/038_add_username_and_verification_fields.sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check if migration file is provided
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Error: No migration file specified');
  console.log('Usage: node scripts/apply-migration.js <migration-file>');
  console.log('Example: node scripts/apply-migration.js database/migrations/038_add_username_and_verification_fields.sql');
  process.exit(1);
}

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env file');
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

    // Split SQL into individual statements (handle DO blocks properly)
    const statements = migrationSQL
      .split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)(?!\s*END)/) // Split on ; but not inside strings or DO blocks
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔄 Executing ${statements.length} SQL statement(s)...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty statements and comments
      if (!statement || statement.startsWith('--')) {
        continue;
      }

      console.log(`\n[${i + 1}/${statements.length}] Executing statement...`);

      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          // If exec_sql RPC doesn't exist, we'll get an error
          // In that case, we need to use the Postgres client directly
          console.warn('⚠️  RPC method not available, attempting direct execution...');

          // For Supabase, we can't execute arbitrary SQL from JavaScript
          // We need to use the Supabase SQL Editor or psql
          console.error('❌ Cannot execute SQL directly from Node.js with Supabase');
          console.log('\n📋 Please apply this migration manually:');
          console.log('1. Go to your Supabase Dashboard → SQL Editor');
          console.log('2. Copy and paste the following SQL:\n');
          console.log('─'.repeat(80));
          console.log(migrationSQL);
          console.log('─'.repeat(80));
          console.log('\n3. Click "Run" to execute the migration');

          process.exit(0);
        }

        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (execError) {
        console.error(`❌ Error executing statement ${i + 1}:`, execError.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
        throw execError;
      }
    }

    console.log('\n✅ Migration applied successfully!');
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
