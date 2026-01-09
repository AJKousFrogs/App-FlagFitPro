#!/usr/bin/env node

/**
 * API Smoke Test Script
 * 
 * Tests basic API endpoints to verify:
 * 1. Health endpoint is accessible
 * 2. Auth endpoint works with valid token
 * 3. Error handling works correctly
 * 
 * Usage:
 *   node scripts/api-smoke-test.js [baseUrl] [token]
 * 
 * Examples:
 *   # Local development
 *   node scripts/api-smoke-test.js http://localhost:8888
 * 
 *   # Production with token
 *   node scripts/api-smoke-test.js https://your-site.netlify.app YOUR_JWT_TOKEN
 */

const https = require('https');
const http = require('http');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

// Parse command line arguments
const args = process.argv.slice(2);
const baseUrl = args[0] || 'http://localhost:8888';
const authToken = args[1] || null;

log(`\n🧪 API Smoke Test`, 'blue');
log(`Base URL: ${baseUrl}`, 'cyan');
log(`Auth Token: ${authToken ? 'Provided' : 'Not provided (auth tests will be skipped)'}\n`, 'cyan');

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

function recordTest(name, passed, skipped = false, details = '') {
  results.tests.push({ name, passed, skipped, details });
  if (skipped) {
    results.skipped++;
    logWarning(`SKIPPED: ${name}`);
  } else if (passed) {
    results.passed++;
    logSuccess(`${name}${details ? ` - ${details}` : ''}`);
  } else {
    results.failed++;
    logError(`${name}${details ? ` - ${details}` : ''}`);
  }
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (options.body) {
      const bodyStr = JSON.stringify(options.body);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = data;
        }

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsedData,
          raw: data,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test 1: Health Check (No Auth)
async function testHealthCheck() {
  try {
    const response = await makeRequest(`${baseUrl}/api/health`);
    
    if (response.statusCode === 200) {
      const isValid = response.data && (
        response.data.success === true ||
        response.data.status === 'healthy' ||
        response.data.status === 'degraded'
      );
      
      recordTest(
        'Health Check (GET /api/health)',
        isValid,
        false,
        `Status: ${response.statusCode}, Response: ${JSON.stringify(response.data).substring(0, 100)}`
      );
    } else {
      recordTest(
        'Health Check (GET /api/health)',
        false,
        false,
        `Expected 200, got ${response.statusCode}`
      );
    }
  } catch (error) {
    recordTest(
      'Health Check (GET /api/health)',
      false,
      false,
      `Error: ${error.message}`
    );
  }
}

// Test 2: Health Check - Wrong Method (Should return 405)
async function testHealthCheckWrongMethod() {
  try {
    const response = await makeRequest(`${baseUrl}/api/health`, {
      method: 'POST',
    });
    
    // Should return 405 Method Not Allowed or 400 Bad Request
    const isValid = response.statusCode === 405 || response.statusCode === 400;
    
    recordTest(
      'Health Check - Wrong Method (POST /api/health)',
      isValid,
      false,
      `Expected 405/400, got ${response.statusCode}`
    );
  } catch (error) {
    recordTest(
      'Health Check - Wrong Method (POST /api/health)',
      false,
      false,
      `Error: ${error.message}`
    );
  }
}

// Test 3: Auth-Me Endpoint (With Token)
async function testAuthMe() {
  if (!authToken) {
    recordTest('Auth-Me (GET /auth-me)', false, true, 'No auth token provided');
    return;
  }

  try {
    const response = await makeRequest(`${baseUrl}/auth-me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (response.statusCode === 200) {
      const isValid = response.data && (
        response.data.success === true ||
        (response.data.data && response.data.data.user)
      );
      
      recordTest(
        'Auth-Me (GET /auth-me)',
        isValid,
        false,
        `Status: ${response.statusCode}, User ID: ${response.data?.data?.user?.id || 'N/A'}`
      );
    } else if (response.statusCode === 401) {
      recordTest(
        'Auth-Me (GET /auth-me)',
        false,
        false,
        `Unauthorized (401) - Token may be invalid or expired`
      );
    } else {
      recordTest(
        'Auth-Me (GET /auth-me)',
        false,
        false,
        `Expected 200, got ${response.statusCode}`
      );
    }
  } catch (error) {
    recordTest(
      'Auth-Me (GET /auth-me)',
      false,
      false,
      `Error: ${error.message}`
    );
  }
}

// Test 4: Auth-Me Endpoint (Without Token - Should return 401)
async function testAuthMeNoToken() {
  try {
    const response = await makeRequest(`${baseUrl}/auth-me`);
    
    const isValid = response.statusCode === 401;
    
    recordTest(
      'Auth-Me - No Token (GET /auth-me)',
      isValid,
      false,
      `Expected 401, got ${response.statusCode}`
    );
  } catch (error) {
    recordTest(
      'Auth-Me - No Token (GET /auth-me)',
      false,
      false,
      `Error: ${error.message}`
    );
  }
}

// Test 5: Dashboard Endpoint (With Token)
async function testDashboard() {
  if (!authToken) {
    recordTest('Dashboard (GET /api/dashboard)', false, true, 'No auth token provided');
    return;
  }

  try {
    const response = await makeRequest(`${baseUrl}/api/dashboard/overview`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });
    
    if (response.statusCode === 200) {
      const isValid = response.data && (
        response.data.success === true ||
        response.data.data !== undefined
      );
      
      recordTest(
        'Dashboard (GET /api/dashboard/overview)',
        isValid,
        false,
        `Status: ${response.statusCode}`
      );
    } else if (response.statusCode === 401) {
      recordTest(
        'Dashboard (GET /api/dashboard/overview)',
        false,
        false,
        `Unauthorized (401) - Token may be invalid or expired`
      );
    } else {
      recordTest(
        'Dashboard (GET /api/dashboard/overview)',
        false,
        false,
        `Expected 200, got ${response.statusCode}`
      );
    }
  } catch (error) {
    recordTest(
      'Dashboard (GET /api/dashboard/overview)',
      false,
      false,
      `Error: ${error.message}`
    );
  }
}

// Test 6: Non-existent Endpoint (Should return 404)
async function testNotFound() {
  try {
    const response = await makeRequest(`${baseUrl}/api/non-existent-endpoint`);
    
    const isValid = response.statusCode === 404;
    
    recordTest(
      'Not Found (GET /api/non-existent-endpoint)',
      isValid,
      false,
      `Expected 404, got ${response.statusCode}`
    );
  } catch (error) {
    recordTest(
      'Not Found (GET /api/non-existent-endpoint)',
      false,
      false,
      `Error: ${error.message}`
    );
  }
}

// Test 7: API Docs Endpoint
async function testApiDocs() {
  try {
    const response = await makeRequest(`${baseUrl}/api/api-docs`);
    
    const isValid = response.statusCode === 200;
    
    recordTest(
      'API Docs (GET /api/api-docs)',
      isValid,
      false,
      `Status: ${response.statusCode}`
    );
  } catch (error) {
    recordTest(
      'API Docs (GET /api/api-docs)',
      false,
      false,
      `Error: ${error.message}`
    );
  }
}

// Run all tests
async function runTests() {
  logInfo('Running smoke tests...\n');

  await testHealthCheck();
  await testHealthCheckWrongMethod();
  await testApiDocs();
  await testNotFound();
  await testAuthMeNoToken();
  await testAuthMe();
  await testDashboard();

  // Print summary
  log(`\n${  '='.repeat(60)}`, 'blue');
  log('📊 Test Summary', 'blue');
  log('='.repeat(60), 'blue');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Skipped: ${results.skipped}`, 'yellow');
  log(`📈 Total: ${results.tests.length}`, 'cyan');
  
  if (results.failed > 0) {
    log('\n❌ Some tests failed. Check the output above for details.', 'red');
    process.exit(1);
  } else if (results.passed > 0) {
    log('\n✅ All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  No tests ran. Check your configuration.', 'yellow');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  logError(`\nFatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

