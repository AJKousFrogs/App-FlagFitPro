#!/usr/bin/env node

/**
 * Apply team_members INSERT policy migration
 * This script applies the RLS policy fix directly to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('🔧 Applying team_members INSERT policy fix...\n');

  // Read the migration SQL
  const migrationPath = join(__dirname, 'supabase', 'migrations', '20260110_fix_team_members_insert_policy.sql');
  const sql = readFileSync(migrationPath, 'utf8');

  console.log('📋 Manual application required:\n');
  console.log('Since direct SQL execution via Supabase client has limitations,');
  console.log('please apply this migration manually:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/pvziciccwxgftcielknm/sql');
  console.log('2. Copy the SQL below');
  console.log('3. Paste into the SQL Editor and click "Run"\n');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  console.log('\n✅ After running the SQL, players who complete onboarding will appear on the roster.');
}

applyMigration();
