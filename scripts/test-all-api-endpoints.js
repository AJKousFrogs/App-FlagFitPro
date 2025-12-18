#!/usr/bin/env node
/**
 * Comprehensive API Endpoint Testing Script
 * Tests all API endpoints defined in the application
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

// Configuration
const CONFIG = {
  baseUrl: process.env.API_BASE_URL || null, // Will be auto-detected
  timeout: 10000,
  testAuth: false, // Set to true if you want to test authenticated endpoints
  authToken: process.env.AUTH_TOKEN || null,
};

// Test results storage
const results = {
  passed: [],
  failed: [],
  skipped: [],
  errors: [],
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Helper function to make HTTP requests
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
        'Accept': 'application/json',
        ...(CONFIG.authToken && { 'Authorization': `Bearer ${CONFIG.authToken}` }),
        ...options.headers,
      },
      timeout: CONFIG.timeout,
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          url: url,
        });
      });
    });

    req.on('error', (error) => {
      reject({
        error: error.message,
        code: error.code,
        url: url,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        error: 'Request timeout',
        url: url,
      });
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

// Try to detect which server is running
async function detectServer() {
  const servers = [
    { url: 'http://localhost:8888', name: 'Netlify Dev' },
    { url: 'http://localhost:4000', name: 'Simple Server' },
    { url: 'http://localhost:3001', name: 'API Server' },
  ];

  for (const server of servers) {
    try {
      const response = await makeRequest(`${server.url}/api/health`, { timeout: 2000 });
      if (response.status === 200) {
        return { url: server.url, name: server.name };
      }
    } catch (e) {
      // Server not available, try next
    }
  }

  // Default to Netlify Dev if none detected
  return { url: 'http://localhost:8888', name: 'Netlify Dev (assumed)' };
}

// Test endpoint function
async function testEndpoint(name, endpoint, method = 'GET', body = null, expectedStatus = [200, 201]) {
  const fullUrl = endpoint.startsWith('http') ? endpoint : `${CONFIG.baseUrl}${endpoint}`;
  
  try {
    const response = await makeRequest(fullUrl, {
      method,
      body,
    });

    const isSuccess = Array.isArray(expectedStatus) 
      ? expectedStatus.includes(response.status)
      : response.status === expectedStatus;

    // Try to parse JSON response
    let parsedBody = null;
    try {
      parsedBody = JSON.parse(response.body);
    } catch (e) {
      // Not JSON, that's okay
    }

    if (isSuccess) {
      results.passed.push({
        name,
        endpoint,
        status: response.status,
        responseTime: response.headers['x-response-time'] || 'N/A',
      });
      return { success: true, response, parsedBody };
    } else {
      results.failed.push({
        name,
        endpoint,
        expectedStatus,
        actualStatus: response.status,
        error: parsedBody?.error || response.body.substring(0, 100),
      });
      return { success: false, response, parsedBody };
    }
  } catch (error) {
    results.failed.push({
      name,
      endpoint,
      error: error.error || error.message || 'Unknown error',
      code: error.code,
    });
    results.errors.push({
      name,
      endpoint,
      error: error.error || error.message || 'Unknown error',
      code: error.code,
    });
    return { success: false, error };
  }
}

// Define all endpoints to test
const endpoints = [
  // Health checks (should work without auth)
  { name: 'Health Check', endpoint: '/api/health', method: 'GET' },
  { name: 'Dashboard Health', endpoint: '/api/dashboard/health', method: 'GET' },
  { name: 'Analytics Health', endpoint: '/api/analytics/health', method: 'GET' },
  { name: 'Coach Health', endpoint: '/api/coach/health', method: 'GET' },
  { name: 'Community Health', endpoint: '/api/community/health', method: 'GET' },
  { name: 'Tournaments Health', endpoint: '/api/tournaments/health', method: 'GET' },

  // Auth endpoints
  { name: 'Auth Me', endpoint: '/auth-me', method: 'GET', expectedStatus: [200, 401] },

  // Dashboard endpoints
  { name: 'Dashboard Overview', endpoint: '/api/dashboard/overview', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Dashboard Training Calendar', endpoint: '/api/dashboard/training-calendar', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Dashboard Olympic Qualification', endpoint: '/api/dashboard/olympic-qualification', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Dashboard Sponsor Rewards', endpoint: '/api/dashboard/sponsor-rewards', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Dashboard Wearables', endpoint: '/api/dashboard/wearables', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Dashboard Team Chemistry', endpoint: '/api/dashboard/team-chemistry', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Dashboard Notifications', endpoint: '/api/dashboard/notifications', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Dashboard Notifications Count', endpoint: '/notifications-count', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Dashboard Daily Quote', endpoint: '/api/dashboard/daily-quote', method: 'GET', expectedStatus: [200, 401] },

  // Training endpoints
  { name: 'Training Stats', endpoint: '/training-stats', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Training Stats Enhanced', endpoint: '/training-stats-enhanced', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Training Complete', endpoint: '/api/training/complete', method: 'POST', body: {}, expectedStatus: [200, 201, 400, 401] },
  { name: 'Training Suggestions', endpoint: '/api/training/suggestions', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Training Sessions', endpoint: '/api/training/sessions', method: 'GET', expectedStatus: [200, 401] },

  // Performance endpoints
  { name: 'Performance Metrics', endpoint: '/api/performance/metrics', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Performance Heatmap', endpoint: '/api/performance/heatmap', method: 'GET', expectedStatus: [200, 401] },

  // Weather endpoints
  { name: 'Weather Current', endpoint: '/api/weather/current', method: 'GET', expectedStatus: [200, 401, 500] },

  // Analytics endpoints
  { name: 'Analytics Performance Trends', endpoint: '/api/analytics/performance-trends', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Analytics Team Chemistry', endpoint: '/api/analytics/team-chemistry', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Analytics Training Distribution', endpoint: '/api/analytics/training-distribution', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Analytics Position Performance', endpoint: '/api/analytics/position-performance', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Analytics Injury Risk', endpoint: '/api/analytics/injury-risk', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Analytics Speed Development', endpoint: '/api/analytics/speed-development', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Analytics User Engagement', endpoint: '/api/analytics/user-engagement', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Analytics Summary', endpoint: '/api/analytics/summary', method: 'GET', expectedStatus: [200, 401] },

  // Trends endpoints
  { name: 'Trends Change of Direction', endpoint: '/api/trends/change-of-direction', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Trends Sprint Volume', endpoint: '/api/trends/sprint-volume', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Trends Game Performance', endpoint: '/api/trends/game-performance', method: 'GET', expectedStatus: [200, 401] },

  // Coach endpoints
  { name: 'Coach Dashboard', endpoint: '/api/coach/dashboard', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Coach Team', endpoint: '/api/coach/team', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Coach Training Analytics', endpoint: '/api/coach/training-analytics', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Coach Create Training Session', endpoint: '/api/coach/training-session', method: 'POST', body: {}, expectedStatus: [200, 201, 400, 401] },
  { name: 'Coach Games', endpoint: '/api/coach/games', method: 'GET', expectedStatus: [200, 401] },

  // Community endpoints
  { name: 'Community Feed', endpoint: '/api/community/feed', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Community Create Post', endpoint: '/api/community/posts', method: 'POST', body: { content: 'Test post' }, expectedStatus: [200, 201, 400, 401] },
  { name: 'Community Leaderboard', endpoint: '/api/community/leaderboard', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Community Challenges', endpoint: '/api/community/challenges', method: 'GET', expectedStatus: [200, 401] },

  // Tournaments endpoints
  { name: 'Tournaments List', endpoint: '/api/tournaments', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Tournaments Details', endpoint: '/api/tournaments/test-id', method: 'GET', expectedStatus: [200, 404, 401] },

  // Knowledge endpoints
  { name: 'Knowledge Search', endpoint: '/knowledge-search', method: 'GET', expectedStatus: [200, 400, 401] },
  { name: 'Knowledge Search with Topic', endpoint: '/knowledge-search?topic=training', method: 'GET', expectedStatus: [200, 400, 401] },

  // Wellness endpoints
  { name: 'Wellness Checkin', endpoint: '/api/wellness/checkin', method: 'POST', body: {}, expectedStatus: [200, 201, 400, 401] },
  { name: 'Wellness Get', endpoint: '/api/performance-data/wellness', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Wellness Post', endpoint: '/api/performance-data/wellness', method: 'POST', body: {}, expectedStatus: [200, 201, 400, 401] },

  // Supplements endpoints
  { name: 'Supplements Log', endpoint: '/api/supplements/log', method: 'POST', body: {}, expectedStatus: [200, 201, 400, 401] },
  { name: 'Supplements Get', endpoint: '/api/performance-data/supplements', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Supplements Post', endpoint: '/api/performance-data/supplements', method: 'POST', body: {}, expectedStatus: [200, 201, 400, 401] },

  // Performance Data endpoints
  { name: 'Performance Data Measurements', endpoint: '/api/performance-data/measurements', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Performance Data Performance Tests', endpoint: '/api/performance-data/performance-tests', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Performance Data Injuries', endpoint: '/api/performance-data/injuries', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Performance Data Trends', endpoint: '/api/performance-data/trends', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Performance Data Export', endpoint: '/api/performance-data/export', method: 'GET', expectedStatus: [200, 401] },

  // Nutrition endpoints
  { name: 'Nutrition Search Foods', endpoint: '/api/nutrition/search-foods', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Nutrition Add Food', endpoint: '/api/nutrition/add-food', method: 'POST', body: {}, expectedStatus: [200, 201, 400, 401] },
  { name: 'Nutrition Goals', endpoint: '/api/nutrition/goals', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Nutrition Meals', endpoint: '/api/nutrition/meals', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Nutrition AI Suggestions', endpoint: '/api/nutrition/ai-suggestions', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Nutrition Performance Insights', endpoint: '/api/nutrition/performance-insights', method: 'GET', expectedStatus: [200, 401] },

  // Recovery endpoints
  { name: 'Recovery Metrics', endpoint: '/api/recovery/metrics', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Recovery Protocols', endpoint: '/api/recovery/protocols', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Recovery Start Session', endpoint: '/api/recovery/start-session', method: 'POST', body: {}, expectedStatus: [200, 201, 400, 401] },
  { name: 'Recovery Complete Session', endpoint: '/api/recovery/complete-session', method: 'POST', body: {}, expectedStatus: [200, 201, 400, 401] },
  { name: 'Recovery Stop Session', endpoint: '/api/recovery/stop-session', method: 'POST', body: {}, expectedStatus: [200, 201, 400, 401] },
  { name: 'Recovery Research Insights', endpoint: '/api/recovery/research-insights', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Recovery Weekly Trends', endpoint: '/api/recovery/weekly-trends', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Recovery Protocol Effectiveness', endpoint: '/api/recovery/protocol-effectiveness', method: 'GET', expectedStatus: [200, 401] },

  // Admin endpoints
  { name: 'Admin Health Metrics', endpoint: '/api/admin/health-metrics', method: 'GET', expectedStatus: [200, 401, 403] },
  { name: 'Admin Sync USDA', endpoint: '/api/admin/sync-usda', method: 'POST', body: {}, expectedStatus: [200, 201, 401, 403] },
  { name: 'Admin Sync Research', endpoint: '/api/admin/sync-research', method: 'POST', body: {}, expectedStatus: [200, 201, 401, 403] },
  { name: 'Admin Create Backup', endpoint: '/api/admin/create-backup', method: 'POST', body: {}, expectedStatus: [200, 201, 401, 403] },
  { name: 'Admin Sync Status', endpoint: '/api/admin/sync-status', method: 'GET', expectedStatus: [200, 401, 403] },
  { name: 'Admin USDA Stats', endpoint: '/api/admin/usda-stats', method: 'GET', expectedStatus: [200, 401, 403] },
  { name: 'Admin Research Stats', endpoint: '/api/admin/research-stats', method: 'GET', expectedStatus: [200, 401, 403] },

  // Games endpoints
  { name: 'Games List', endpoint: '/games', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Games Create', endpoint: '/games', method: 'POST', body: {}, expectedStatus: [200, 201, 400, 401] },
  { name: 'Games Get', endpoint: '/games/test-id', method: 'GET', expectedStatus: [200, 404, 401] },

  // Readiness endpoints
  { name: 'Readiness Calculate', endpoint: '/api/calc-readiness', method: 'POST', body: {}, expectedStatus: [200, 201, 400, 401] },
  { name: 'Readiness History', endpoint: '/api/readiness-history', method: 'GET', expectedStatus: [200, 401] },

  // Training Plan endpoints
  { name: 'Training Plan Today', endpoint: '/api/training-plan', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Training Plan Date', endpoint: '/api/training-plan?date=2025-01-15', method: 'GET', expectedStatus: [200, 401] },

  // Player Stats endpoints
  { name: 'Player Stats Aggregated', endpoint: '/api/player-stats/aggregated', method: 'GET', expectedStatus: [200, 401] },
  { name: 'Player Stats Date Range', endpoint: '/api/player-stats/date-range', method: 'GET', expectedStatus: [200, 401] },

  // Fixtures endpoints
  { name: 'Fixtures', endpoint: '/api/fixtures', method: 'GET', expectedStatus: [200, 401] },

  // Load Management endpoints
  { name: 'Load Management', endpoint: '/api/load-management', method: 'GET', expectedStatus: [200, 401] },

  // Compute ACWR endpoints
  { name: 'Compute ACWR', endpoint: '/api/compute-acwr', method: 'POST', body: {}, expectedStatus: [200, 201, 400, 401] },

  // Training Metrics endpoints
  { name: 'Training Metrics', endpoint: '/api/training-metrics', method: 'GET', expectedStatus: [200, 401] },
];

// Run all tests
async function runTests() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║     API Endpoint Testing Script                           ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  // Detect server
  console.log(`${colors.blue}Detecting server...${colors.reset}`);
  const detectedServer = await detectServer();
  CONFIG.baseUrl = CONFIG.baseUrl || detectedServer.url;
  
  console.log(`${colors.blue}Configuration:${colors.reset}`);
  console.log(`  Server: ${detectedServer.name}`);
  console.log(`  Base URL: ${CONFIG.baseUrl}`);
  console.log(`  Timeout: ${CONFIG.timeout}ms`);
  console.log(`  Auth Token: ${CONFIG.authToken ? '***' : 'Not provided'}\n`);

  console.log(`${colors.blue}Testing ${endpoints.length} endpoints...${colors.reset}\n`);

  const startTime = Date.now();

  // Run tests sequentially to avoid overwhelming the server
  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    process.stdout.write(`[${i + 1}/${endpoints.length}] Testing ${endpoint.name}... `);
    
    const result = await testEndpoint(
      endpoint.name,
      endpoint.endpoint,
      endpoint.method,
      endpoint.body,
      endpoint.expectedStatus || [200, 201]
    );

    if (result.success) {
      console.log(`${colors.green}✓${colors.reset}`);
    } else {
      console.log(`${colors.red}✗${colors.reset}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Print results
  console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                    Test Results                            ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`${colors.green}✓ Passed: ${results.passed.length}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${results.failed.length}${colors.reset}`);
  console.log(`⏱  Duration: ${duration}s\n`);

  // Print failed endpoints
  if (results.failed.length > 0) {
    console.log(`${colors.red}Failed Endpoints:${colors.reset}`);
    results.failed.forEach((failure) => {
      console.log(`  ${colors.red}✗${colors.reset} ${failure.name}`);
      console.log(`    Endpoint: ${failure.endpoint}`);
      if (failure.actualStatus) {
        console.log(`    Expected: ${Array.isArray(failure.expectedStatus) ? failure.expectedStatus.join(' or ') : failure.expectedStatus}`);
        console.log(`    Actual: ${failure.actualStatus}`);
      }
      if (failure.error) {
        console.log(`    Error: ${failure.error}`);
      }
      if (failure.code) {
        console.log(`    Code: ${failure.code}`);
      }
      console.log('');
    });
  }

  // Print error details
  if (results.errors.length > 0) {
    console.log(`${colors.yellow}Connection Errors:${colors.reset}`);
    results.errors.forEach((error) => {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${error.name}`);
      console.log(`    Endpoint: ${error.endpoint}`);
      console.log(`    Error: ${error.error}`);
      if (error.code) {
        console.log(`    Code: ${error.code}`);
      }
      console.log('');
    });
  }

  // Summary statistics
  const successRate = ((results.passed.length / endpoints.length) * 100).toFixed(1);
  console.log(`${colors.cyan}Summary:${colors.reset}`);
  console.log(`  Success Rate: ${successRate}%`);
  console.log(`  Total Endpoints: ${endpoints.length}`);
  console.log(`  Working: ${results.passed.length}`);
  console.log(`  Not Working: ${results.failed.length}`);
  console.log(`  Connection Errors: ${results.errors.length}\n`);

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run the tests
runTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});

