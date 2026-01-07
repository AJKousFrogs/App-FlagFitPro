#!/usr/bin/env node
/**
 * BLOCKER B: Player Programs Backfill Script
 * 
 * This script ensures every athlete has an active training program assigned.
 * 
 * Product stance: "Every athlete has a real plan"
 * This means: NO access to Today until assigned is unacceptable.
 * Instead: backfill + enforce operationally.
 * 
 * What this script does:
 * 1. Finds all users without an active player_program
 * 2. Assigns them to the appropriate base program based on their position
 * 3. Sets start_date to today (they start fresh)
 * 4. Logs all assignments for audit
 * 
 * Usage:
 *   node scripts/backfill-player-programs.cjs [--dry-run]
 * 
 * Options:
 *   --dry-run  Show what would be assigned without making changes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Program ID constants - these match the database
const PROGRAM_IDS = {
  QB: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',    // Ljubljana Frogs QB Annual Program 2025-2026
  WRDB: 'ffffffff-ffff-ffff-ffff-ffffffffffff', // Ljubljana Frogs WR/DB Annual Program 2025-2026 (default)
};

/**
 * Position mapping from UI values to modifier keys
 */
const POSITION_TO_PROGRAM = {
  QB: PROGRAM_IDS.QB,
  quarterback: PROGRAM_IDS.QB,
  
  // Everyone else gets WR/DB base program
  WR: PROGRAM_IDS.WRDB,
  DB: PROGRAM_IDS.WRDB,
  Center: PROGRAM_IDS.WRDB,
  Rusher: PROGRAM_IDS.WRDB,
  Blitzer: PROGRAM_IDS.WRDB,
  LB: PROGRAM_IDS.WRDB,
  Hybrid: PROGRAM_IDS.WRDB,
  
  // Lowercase variants
  wr_db: PROGRAM_IDS.WRDB,
  wr: PROGRAM_IDS.WRDB,
  db: PROGRAM_IDS.WRDB,
  center: PROGRAM_IDS.WRDB,
  rusher: PROGRAM_IDS.WRDB,
  blitzer: PROGRAM_IDS.WRDB,
  linebacker: PROGRAM_IDS.WRDB,
  hybrid: PROGRAM_IDS.WRDB,
};

/**
 * Determine which program a user should be assigned to
 */
function getProgramIdForUser(user, config) {
  // Priority 1: athlete_training_config.primary_position
  if (config?.primary_position) {
    const programId = POSITION_TO_PROGRAM[config.primary_position];
    if (programId) {
      console.log(`  → Using position from config: ${config.primary_position}`);
      return programId;
    }
  }
  
  // Priority 2: users.position
  if (user.position) {
    const programId = POSITION_TO_PROGRAM[user.position];
    if (programId) {
      console.log(`  → Using position from users table: ${user.position}`);
      return programId;
    }
  }
  
  // Priority 3: Check if profile metadata has position
  if (user.profile_metadata?.position) {
    const programId = POSITION_TO_PROGRAM[user.profile_metadata.position];
    if (programId) {
      console.log(`  → Using position from profile metadata: ${user.profile_metadata.position}`);
      return programId;
    }
  }
  
  // Default: WR/DB program (safest general position)
  console.log(`  → No position found, defaulting to WR/DB program`);
  return PROGRAM_IDS.WRDB;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  } else {
    console.log('✅ LIVE MODE - Changes will be committed\n');
  }
  
  // Initialize Supabase
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('📊 Step 1: Finding users without active programs...\n');
  
  // Get all users
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('id, email, full_name, position, profile_metadata');
  
  if (usersError) {
    console.error('❌ Error fetching users:', usersError);
    process.exit(1);
  }
  
  console.log(`Found ${allUsers.length} total users\n`);
  
  // Get all existing active player_programs
  const { data: existingPrograms, error: programsError } = await supabase
    .from('player_programs')
    .select('player_id, program_id, training_programs(name)')
    .eq('status', 'active');
  
  if (programsError) {
    console.error('❌ Error fetching player programs:', programsError);
    process.exit(1);
  }
  
  console.log(`Found ${existingPrograms.length} users with active programs\n`);
  
  // Create a set of user IDs that already have programs
  const usersWithPrograms = new Set(existingPrograms.map(p => p.player_id));
  
  // Filter users without programs
  const usersWithoutPrograms = allUsers.filter(user => !usersWithPrograms.has(user.id));
  
  console.log(`📋 Found ${usersWithoutPrograms.length} users WITHOUT active programs\n`);
  
  if (usersWithoutPrograms.length === 0) {
    console.log('✅ All users already have active programs. Nothing to do!');
    process.exit(0);
  }
  
  console.log('👥 Users without programs:\n');
  
  const assignmentsToCreate = [];
  const today = new Date().toISOString().split('T')[0];
  
  for (const user of usersWithoutPrograms) {
    console.log(`\n${user.email || user.id}`);
    console.log(`  Name: ${user.full_name || 'Unknown'}`);
    
    // Get their athlete_training_config if it exists
    const { data: config } = await supabase
      .from('athlete_training_config')
      .select('primary_position')
      .eq('user_id', user.id)
      .maybeSingle();
    
    const programId = getProgramIdForUser(user, config);
    
    // Get program name for logging
    const { data: program } = await supabase
      .from('training_programs')
      .select('name')
      .eq('id', programId)
      .single();
    
    console.log(`  Will assign: ${program?.name || programId}`);
    
    assignmentsToCreate.push({
      player_id: user.id,
      program_id: programId,
      status: 'active',
      start_date: today,
      current_week: 1,
      completion_percentage: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  
  console.log(`\n\n📝 Summary: ${assignmentsToCreate.length} assignments to create\n`);
  
  if (isDryRun) {
    console.log('🔍 Dry run complete. Run without --dry-run to apply changes.');
    process.exit(0);
  }
  
  // Actually create the assignments
  console.log('💾 Creating player program assignments...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const assignment of assignmentsToCreate) {
    const { error } = await supabase
      .from('player_programs')
      .insert(assignment);
    
    if (error) {
      console.error(`❌ Error creating assignment for ${assignment.player_id}:`, error.message);
      errorCount++;
    } else {
      successCount++;
    }
  }
  
  console.log('\n✅ Backfill complete!');
  console.log(`  ${successCount} assignments created successfully`);
  if (errorCount > 0) {
    console.log(`  ⚠️  ${errorCount} assignments failed`);
  }
  
  // Verify the results
  const { data: finalCount } = await supabase
    .from('player_programs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');
  
  console.log(`\n📊 Final count: ${finalCount?.length || 'unknown'} users with active programs`);
  
  process.exit(errorCount > 0 ? 1 : 0);
}

// Run the script
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

