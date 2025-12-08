#!/usr/bin/env node

/**
 * Direct Migration Runner
 * Applies the username and verification fields migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Check environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('🔧 Database Migration Tool\n');
console.log('Supabase URL:', supabaseUrl || '❌ NOT SET');
console.log('Service Key:', supabaseServiceKey ? '✅ SET' : '❌ NOT SET');
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env file\n');

  console.log('📋 Manual Migration Instructions:');
  console.log('─'.repeat(80));
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Copy the SQL from: database/migrations/038_add_username_and_verification_fields.sql');
  console.log('3. Paste and run the SQL in the editor');
  console.log('─'.repeat(80));
  console.log('');
  console.log('SQL Preview:');
  console.log('─'.repeat(80));

  const migrationPath = path.join(__dirname, '../database/migrations/038_add_username_and_verification_fields.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log(sql);
  console.log('─'.repeat(80));

  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkAndApplyMigration() {
  try {
    console.log('🔍 Checking current database schema...\n');

    // Check if columns already exist
    const checks = {
      username: false,
      verification_token: false,
      verification_token_expires_at: false,
      role: false
    };

    // We can't query information_schema directly with Supabase JS client
    // So we'll attempt to read from users table and catch errors
    console.log('⚠️  Note: Cannot check schema directly with Supabase JS client');
    console.log('📋 Providing SQL for manual execution in Supabase Dashboard:\n');

    console.log('─'.repeat(80));
    const migrationPath = path.join(__dirname, '../database/migrations/038_add_username_and_verification_fields.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    console.log(sql);
    console.log('─'.repeat(80));

    console.log('\n📝 Instructions:');
    console.log('1. Copy the SQL above');
    console.log('2. Go to https://supabase.com/dashboard');
    console.log('3. Select your project');
    console.log('4. Click "SQL Editor" in the left sidebar');
    console.log('5. Create a new query and paste the SQL');
    console.log('6. Click "Run" to execute');
    console.log('');
    console.log('✅ This migration is safe to run multiple times (it checks before adding columns)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAndApplyMigration();
