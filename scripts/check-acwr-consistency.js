#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * ACWR & RPE Data Consistency Checker
 * 
 * Checks if all training session tables have proper RPE and duration fields
 * for accurate ACWR calculations.
 * 
 * Usage:
 *   node scripts/check-acwr-consistency.js [athlete_id]
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConsistency(athleteId = null) {
  console.log('🔍 Checking ACWR & RPE Data Consistency...\n');
  console.log(`Scope: ${athleteId ? `Athlete ${athleteId}` : 'All Athletes'}\n`);

  try {
    // Check training_sessions table
    console.log('📊 Checking training_sessions table...');
    let query = supabase
      .from('training_sessions')
      .select('id, user_id, athlete_id, session_date, date, duration_minutes, rpe, intensity_level', { count: 'exact' });

    if (athleteId) {
      query = query.or(`user_id.eq.${athleteId},athlete_id.eq.${athleteId}`);
    }

    const { data: trainingSessions, error: tsError, count: tsCount } = await query;

    if (tsError) {
      console.error('❌ Error querying training_sessions:', tsError);
    } else {
      const withRPE = trainingSessions?.filter(s => s.rpe !== null && s.rpe !== undefined).length || 0;
      const withDuration = trainingSessions?.filter(s => s.duration_minutes !== null && s.duration_minutes !== undefined).length || 0;
      const withBoth = trainingSessions?.filter(s => 
        (s.rpe !== null && s.rpe !== undefined || s.intensity_level !== null) && 
        s.duration_minutes !== null && s.duration_minutes !== undefined
      ).length || 0;
      const withIntensity = trainingSessions?.filter(s => s.intensity_level !== null && s.intensity_level !== undefined).length || 0;

      console.log(`   Total sessions: ${tsCount || 0}`);
      console.log(`   With RPE: ${withRPE}`);
      console.log(`   With intensity_level: ${withIntensity}`);
      console.log(`   With duration_minutes: ${withDuration}`);
      console.log(`   With both (RPE/intensity + duration): ${withBoth}`);
      console.log(`   Missing RPE but has intensity: ${withIntensity - withRPE}`);
      console.log(`   Missing duration: ${(tsCount || 0) - withDuration}`);
      console.log(`   Can calculate load: ${withBoth}`);
    }

    // Check sessions table
    console.log('\n📊 Checking sessions table...');
    let sessionsQuery = supabase
      .from('sessions')
      .select('id, athlete_id, date, duration_minutes, rpe', { count: 'exact' });

    if (athleteId) {
      sessionsQuery = sessionsQuery.eq('athlete_id', athleteId);
    }

    const { data: sessions, error: sError, count: sCount } = await sessionsQuery;

    if (sError) {
      console.error('❌ Error querying sessions:', sError);
    } else {
      const withRPE = sessions?.filter(s => s.rpe !== null && s.rpe !== undefined).length || 0;
      const withDuration = sessions?.filter(s => s.duration_minutes !== null && s.duration_minutes !== undefined).length || 0;
      const withBoth = sessions?.filter(s => 
        s.rpe !== null && s.rpe !== undefined && 
        s.duration_minutes !== null && s.duration_minutes !== undefined
      ).length || 0;

      console.log(`   Total sessions: ${sCount || 0}`);
      console.log(`   With RPE: ${withRPE}`);
      console.log(`   With duration_minutes: ${withDuration}`);
      console.log(`   With both: ${withBoth}`);
      console.log(`   Missing RPE: ${(sCount || 0) - withRPE}`);
      console.log(`   Missing duration: ${(sCount || 0) - withDuration}`);
      console.log(`   Can calculate load: ${withBoth}`);
    }

    // Check training_load_metrics table
    console.log('\n📊 Checking training_load_metrics table...');
    let tlmQuery = supabase
      .from('training_load_metrics')
      .select('id, user_id, session_date, session_duration, session_rpe, training_load', { count: 'exact' });

    if (athleteId) {
      tlmQuery = tlmQuery.eq('user_id', athleteId);
    }

    const { data: loadMetrics, error: tlmError, count: tlmCount } = await tlmQuery;

    if (tlmError) {
      console.error('❌ Error querying training_load_metrics:', tlmError);
    } else {
      const withRPE = loadMetrics?.filter(s => s.session_rpe !== null && s.session_rpe !== undefined).length || 0;
      const withDuration = loadMetrics?.filter(s => s.session_duration !== null && s.session_duration !== undefined).length || 0;
      const withBoth = loadMetrics?.filter(s => 
        s.session_rpe !== null && s.session_rpe !== undefined && 
        s.session_duration !== null && s.session_duration !== undefined
      ).length || 0;
      const withCalculatedLoad = loadMetrics?.filter(s => {
        if (!s.session_rpe || !s.session_duration) {return false;}
        const expectedLoad = s.session_rpe * s.session_duration;
        return s.training_load === expectedLoad;
      }).length || 0;

      console.log(`   Total records: ${tlmCount || 0}`);
      console.log(`   With session_rpe: ${withRPE}`);
      console.log(`   With session_duration: ${withDuration}`);
      console.log(`   With both: ${withBoth}`);
      console.log(`   With correctly calculated training_load: ${withCalculatedLoad}`);
      console.log(`   Missing RPE: ${(tlmCount || 0) - withRPE}`);
      console.log(`   Missing duration: ${(tlmCount || 0) - withDuration}`);
    }

    // Sample ACWR calculation check
    console.log('\n🧮 Testing ACWR Calculation...');
    if (athleteId) {
      const { data: acwrTest, error: acwrError } = await supabase
        .rpc('compute_acwr', { athlete: athleteId })
        .limit(5);

      if (acwrError) {
        console.error('❌ Error testing ACWR calculation:', acwrError);
        console.log('   Note: compute_acwr function may not exist or may use different table');
      } else {
        console.log(`   ✅ ACWR function works`);
        console.log(`   Sample results: ${acwrTest?.length || 0} records`);
        if (acwrTest && acwrTest.length > 0) {
          const sample = acwrTest[0];
          console.log(`   Sample - Date: ${sample.session_date}, Load: ${sample.load}, ACWR: ${sample.acwr}`);
        }
      }
    } else {
      console.log('   ⚠️  Skipping ACWR test (need athlete_id)');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    const tsMissingRPE = (tsCount || 0) - (trainingSessions?.filter(s => s.rpe !== null).length || 0);
    const tsHasIntensity = trainingSessions?.filter(s => s.intensity_level !== null).length || 0;

    if (tsMissingRPE > 0 && tsHasIntensity > 0) {
      console.log(`   🔧 ${tsMissingRPE} training_sessions missing RPE but have intensity_level`);
      console.log(`      Run: SELECT sync_intensity_to_rpe(); to copy intensity_level to rpe`);
    }

    if ((tsCount || 0) - (trainingSessions?.filter(s => s.duration_minutes !== null).length || 0) > 0) {
      console.log(`   ⚠️  Some training_sessions are missing duration_minutes`);
      console.log(`      These cannot be used for ACWR calculations`);
    }

    console.log('\n✅ Consistency check complete!\n');

  } catch (error) {
    console.error('❌ Error during consistency check:', error);
    process.exit(1);
  }
}

// Run check
const athleteId = process.argv[2] || null;
checkConsistency(athleteId).then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

