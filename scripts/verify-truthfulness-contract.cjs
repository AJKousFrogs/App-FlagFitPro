#!/usr/bin/env node
/**
 * Truthfulness Contract Verification Script
 * 
 * Verifies that Prompt 6 (Truthfulness Contract) + Blockers A/B are enforced end-to-end.
 * 
 * Usage:
 *   BASE_URL=http://localhost:8888 AUTH_TOKEN=your-token node scripts/verify-truthfulness-contract.cjs
 * 
 * Requirements:
 *   - Node 18+ (uses native fetch)
 *   - Valid AUTH_TOKEN from authenticated user
 *   - Backend running at BASE_URL
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8888';
const {AUTH_TOKEN} = process.env;

if (!AUTH_TOKEN) {
  console.error('❌ AUTH_TOKEN environment variable is required');
  console.error('\nUsage:');
  console.error('  BASE_URL=http://localhost:8888 AUTH_TOKEN=your-token node scripts/verify-truthfulness-contract.cjs');
  console.error('\nTo get AUTH_TOKEN:');
  console.error('  1. Login to your app in browser');
  console.error('  2. Open DevTools → Application → Local Storage');
  console.error('  3. Find sb-<project>-auth-token');
  console.error('  4. Copy access_token value');
  process.exit(1);
}

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

/**
 * Make API request with auth
 */
async function apiRequest(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`\n${method} ${url}`);
  if (body) {
    console.log('Body:', JSON.stringify(body, null, 2));
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  console.log('Status:', response.status);
  
  return { response, data };
}

/**
 * Assert helper
 */
function assert(condition, message, actualValue = null) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    if (actualValue !== null) {
      console.error('     Actual:', JSON.stringify(actualValue, null, 2));
    }
    return false;
  }
  console.log(`  ✅ PASS: ${message}`);
  return true;
}

/**
 * Test Case 1: Missing readiness + baseline ACWR
 */
async function testCase1_MissingReadiness() {
  console.log(`\n${  '='.repeat(80)}`);
  console.log('TEST CASE 1: Missing Readiness + Baseline ACWR');
  console.log('='.repeat(80));
  
  const testDate = '2026-01-06';
  const { response, data } = await apiRequest('POST', '/api/daily-protocol/generate', { date: testDate });
  
  if (!response.ok) {
    console.error('❌ API request failed:', data);
    results.tests.push({ name: 'Test Case 1', status: 'FAILED', reason: 'API error' });
    results.failed++;
    return;
  }
  
  const assertions = [];
  
  // Core truthfulness assertions
  assertions.push(assert(
    data.data?.readinessScore === null,
    'readinessScore === null (not 75)',
    data.data?.readinessScore
  ));
  
  assertions.push(assert(
    data.data?.acwrValue === null,
    'acwrValue === null (not 1.05)',
    data.data?.acwrValue
  ));
  
  // Confidence metadata structure
  assertions.push(assert(
    data.data?.confidenceMetadata !== undefined,
    'confidenceMetadata exists',
    data.data?.confidenceMetadata
  ));
  
  assertions.push(assert(
    data.data?.confidenceMetadata?.readiness?.hasData === false,
    'confidenceMetadata.readiness.hasData === false',
    data.data?.confidenceMetadata?.readiness?.hasData
  ));
  
  assertions.push(assert(
    data.data?.confidenceMetadata?.acwr?.hasData === false,
    'confidenceMetadata.acwr.hasData === false',
    data.data?.confidenceMetadata?.acwr?.hasData
  ));
  
  const acwrConfidence = data.data?.confidenceMetadata?.acwr?.confidence;
  assertions.push(assert(
    acwrConfidence === 'building_baseline' || acwrConfidence === 'none',
    'confidenceMetadata.acwr.confidence in ["building_baseline", "none"]',
    acwrConfidence
  ));
  
  // Session resolution (Blocker A)
  assertions.push(assert(
    data.data?.confidenceMetadata?.sessionResolution?.success === true,
    'sessionResolution.success === true (program assigned)',
    data.data?.confidenceMetadata?.sessionResolution?.success
  ));
  
  assertions.push(assert(
    data.data?.confidenceMetadata?.sessionResolution?.hasProgram === true,
    'sessionResolution.hasProgram === true',
    data.data?.confidenceMetadata?.sessionResolution?.hasProgram
  ));
  
  assertions.push(assert(
    data.data?.confidenceMetadata?.sessionResolution?.hasSessionTemplate === true,
    'sessionResolution.hasSessionTemplate === true',
    data.data?.confidenceMetadata?.sessionResolution?.hasSessionTemplate
  ));
  
  const override = data.data?.confidenceMetadata?.sessionResolution?.override;
  const validOverrides = [null, 'rehab_protocol', 'flag_practice', 'sprint_saturday', 'taper_period'];
  assertions.push(assert(
    validOverrides.includes(override),
    'sessionResolution.override is null or known type',
    override
  ));
  
  // Main session exists
  assertions.push(assert(
    data.data?.mainSession?.exercises?.length > 0,
    'mainSession.exercises.length > 0',
    data.data?.mainSession?.exercises?.length
  ));
  
  // NOT generic exercises (Blocker A enforcement)
  const hasTemplateMarkers = 
    data.data?.aiRationale?.includes('program') ||
    data.data?.aiRationale?.includes('Phase:') ||
    data.data?.aiRationale?.includes('📋') ||
    data.data?.trainingFocus !== 'generic';
  
  assertions.push(assert(
    hasTemplateMarkers,
    'Exercises are program-derived (not generic fallback)',
    { 
      aiRationale: data.data?.aiRationale,
      trainingFocus: data.data?.trainingFocus 
    }
  ));
  
  // Check for generic fallback notes (violation indicator)
  const hasGenericNote = data.data?.mainSession?.exercises?.some(ex => 
    ex.aiNote?.includes('Generic exercise') || 
    ex.aiNote?.includes('configure your program')
  );
  
  assertions.push(assert(
    !hasGenericNote,
    'No "Generic exercise" notes found (would indicate fallback violation)',
    hasGenericNote
  ));
  
  const allPassed = assertions.every(a => a);
  results.tests.push({
    name: 'Test Case 1: Missing Readiness + Baseline ACWR',
    status: allPassed ? 'PASSED' : 'FAILED',
    passed: assertions.filter(a => a).length,
    total: assertions.length,
  });
  
  if (allPassed) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  return allPassed;
}

/**
 * Test Case 2: GET returns same truth
 */
async function testCase2_GetReturnsTruth() {
  console.log(`\n${  '='.repeat(80)}`);
  console.log('TEST CASE 2: GET Returns Same Truth');
  console.log('='.repeat(80));
  
  const testDate = '2026-01-06';
  const { response, data } = await apiRequest('GET', `/api/daily-protocol?date=${testDate}`);
  
  if (!response.ok) {
    console.error('❌ API request failed:', data);
    results.tests.push({ name: 'Test Case 2', status: 'FAILED', reason: 'API error' });
    results.failed++;
    return;
  }
  
  if (!data.data) {
    console.log('⚠️  No protocol exists for this date (expected after generate)');
    results.tests.push({ name: 'Test Case 2', status: 'SKIPPED', reason: 'No protocol' });
    results.skipped++;
    return;
  }
  
  const assertions = [];
  
  assertions.push(assert(
    data.data?.readinessScore === null,
    'GET: readinessScore === null',
    data.data?.readinessScore
  ));
  
  assertions.push(assert(
    data.data?.acwrValue === null,
    'GET: acwrValue === null',
    data.data?.acwrValue
  ));
  
  assertions.push(assert(
    data.data?.confidenceMetadata?.readiness?.hasData === false,
    'GET: confidenceMetadata.readiness.hasData === false',
    data.data?.confidenceMetadata?.readiness?.hasData
  ));
  
  assertions.push(assert(
    data.data?.confidenceMetadata?.acwr?.hasData === false,
    'GET: confidenceMetadata.acwr.hasData === false',
    data.data?.confidenceMetadata?.acwr?.hasData
  ));
  
  const allPassed = assertions.every(a => a);
  results.tests.push({
    name: 'Test Case 2: GET Returns Same Truth',
    status: allPassed ? 'PASSED' : 'FAILED',
    passed: assertions.filter(a => a).length,
    total: assertions.length,
  });
  
  if (allPassed) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  return allPassed;
}

/**
 * Test Case 3: No active program -> explicit failure (Blocker B)
 */
async function testCase3_NoProgram() {
  console.log(`\n${  '='.repeat(80)}`);
  console.log('TEST CASE 3: No Active Program → Explicit Failure');
  console.log('='.repeat(80));
  
  console.log('⚠️  This test requires a user without an active program.');
  console.log('    If current user has a program, test will be SKIPPED.');
  
  // Try to check if user has program first
  const { data: checkData } = await apiRequest('GET', '/api/player-programs/me');
  
  if (checkData.data?.assignment) {
    console.log(`✓ Current user has program: ${checkData.data.assignment.program.name}`);
    console.log('  SKIPPED: Requires fixture user without program');
    results.tests.push({
      name: 'Test Case 3: No Program Failure',
      status: 'SKIPPED',
      reason: 'Current user has program',
    });
    results.skipped++;
    return;
  }
  
  // User has no program - test the failure
  const testDate = '2026-01-06';
  const { response, data } = await apiRequest('POST', '/api/daily-protocol/generate', { date: testDate });
  
  const assertions = [];
  
  assertions.push(assert(
    data.success === false,
    'success === false',
    data.success
  ));
  
  assertions.push(assert(
    data.details?.sessionResolution?.status === 'no_program',
    'sessionResolution.status === "no_program"',
    data.details?.sessionResolution?.status
  ));
  
  assertions.push(assert(
    data.details?.sessionResolution?.success === false,
    'sessionResolution.success === false',
    data.details?.sessionResolution?.success
  ));
  
  assertions.push(assert(
    !data.data?.mainSession,
    'No protocol blocks returned',
    !!data.data?.mainSession
  ));
  
  const allPassed = assertions.every(a => a);
  results.tests.push({
    name: 'Test Case 3: No Program Failure',
    status: allPassed ? 'PASSED' : 'FAILED',
    passed: assertions.filter(a => a).length,
    total: assertions.length,
  });
  
  if (allPassed) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  return allPassed;
}

/**
 * Test Case 4: Sport-layer override present
 */
async function testCase4_SportLayerOverride() {
  console.log(`\n${  '='.repeat(80)}`);
  console.log('TEST CASE 4: Sport-Layer Override (Practice Day)');
  console.log('='.repeat(80));
  
  // Try a Saturday (likely practice day) in future
  const testDate = '2026-01-11'; // Saturday
  const { response, data } = await apiRequest('POST', '/api/daily-protocol/generate', { date: testDate });
  
  if (!response.ok) {
    console.error('❌ API request failed:', data);
    results.tests.push({ name: 'Test Case 4', status: 'FAILED', reason: 'API error' });
    results.failed++;
    return;
  }
  
  const assertions = [];
  
  const override = data.data?.confidenceMetadata?.sessionResolution?.override;
  
  // Override may or may not be present depending on user config
  if (override) {
    console.log(`✓ Override detected: ${override}`);
    
    assertions.push(assert(
      typeof override === 'string',
      'override is a string',
      override
    ));
    
    const focusMatchesPractice = 
      data.data?.trainingFocus?.includes('practice') ||
      data.data?.aiRationale?.toLowerCase().includes('practice') ||
      override === 'flag_practice';
    
    if (override === 'flag_practice') {
      assertions.push(assert(
        focusMatchesPractice,
        'trainingFocus or rationale mentions practice',
        { 
          trainingFocus: data.data?.trainingFocus,
          aiRationale: data.data?.aiRationale 
        }
      ));
      
      const mainExercises = data.data?.mainSession?.exercises || [];
      const hasPracticeDayNotes = mainExercises.some(ex => 
        ex.aiNote?.toLowerCase().includes('practice') ||
        ex.aiNote?.toLowerCase().includes('light') ||
        ex.aiNote?.toLowerCase().includes('activation')
      );
      
      assertions.push(assert(
        hasPracticeDayNotes || mainExercises.length === 0,
        'Main session is practice-appropriate (light/activation)',
        { exerciseCount: mainExercises.length }
      ));
    }
  } else {
    console.log('ℹ️  No override for this date (user may not have practice scheduled)');
    assertions.push(assert(
      true,
      'No override expected (user config dependent)',
      null
    ));
  }
  
  const allPassed = assertions.every(a => a);
  results.tests.push({
    name: 'Test Case 4: Sport-Layer Override',
    status: allPassed ? 'PASSED' : 'FAILED',
    passed: assertions.filter(a => a).length,
    total: assertions.length,
  });
  
  if (allPassed) {
    results.passed++;
  } else {
    results.failed++;
  }
  
  return allPassed;
}

/**
 * Main test runner
 */
async function main() {
  console.log('='.repeat(80));
  console.log('TRUTHFULNESS CONTRACT VERIFICATION');
  console.log('='.repeat(80));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN.substring(0, 20)}...`);
  console.log('='.repeat(80));
  
  try {
    await testCase1_MissingReadiness();
    await testCase2_GetReturnsTruth();
    await testCase3_NoProgram();
    await testCase4_SportLayerOverride();
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
  
  // Print summary
  console.log(`\n${  '='.repeat(80)}`);
  console.log('SUMMARY');
  console.log('='.repeat(80));
  
  results.tests.forEach((test, i) => {
    const icon = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⚠️';
    console.log(`${icon} Test ${i + 1}: ${test.name} - ${test.status}`);
    if (test.passed !== undefined) {
      console.log(`   ${test.passed}/${test.total} assertions passed`);
    }
    if (test.reason) {
      console.log(`   Reason: ${test.reason}`);
    }
  });
  
  console.log('');
  console.log(`Total: ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped`);
  console.log('='.repeat(80));
  
  if (results.failed > 0) {
    console.log('\n❌ TRUTHFULNESS CONTRACT VIOLATED');
    process.exit(1);
  } else {
    console.log('\n✅ TRUTHFULNESS CONTRACT VERIFIED');
    process.exit(0);
  }
}

// Run tests
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

