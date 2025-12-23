#!/usr/bin/env node

// Using native fetch (Node.js 18+)
// import fetch from "node-fetch";

const BASE_URL = "http://localhost:3001/api";

// Test colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(endpoint, description) {
  try {
    log(`\n🔍 Testing: ${description}`, "cyan");
    log(`   Endpoint: ${endpoint}`, "blue");

    const response = await fetch(endpoint);
    const data = await response.json();

    if (response.ok && data.success) {
      log(`   ✅ Status: ${response.status} - Success`, "green");
      log(
        `   📊 Data received: ${JSON.stringify(data.data).substring(0, 100)}...`,
        "green",
      );
    } else {
      log(`   ❌ Status: ${response.status} - Failed`, "red");
      log(`   📝 Response: ${JSON.stringify(data)}`, "red");
    }

    return { success: response.ok, data };
  } catch (error) {
    log(`   💥 Error: ${error.message}`, "red");
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log("🚀 Starting Dashboard API Tests", "bright");
  log("Make sure your server is running on http://localhost:3001", "yellow");

  const tests = [
    {
      endpoint: `${BASE_URL}/health`,
      description: "Health Check",
    },
    {
      endpoint: `${BASE_URL}/dashboard/overview?userId=1`,
      description: "Dashboard Overview",
    },
    {
      endpoint: `${BASE_URL}/dashboard/training-calendar?userId=1`,
      description: "Training Calendar",
    },
    {
      endpoint: `${BASE_URL}/dashboard/olympic-qualification?userId=1`,
      description: "Olympic Qualification",
    },
    {
      endpoint: `${BASE_URL}/dashboard/sponsor-rewards?userId=1`,
      description: "Sponsor Rewards",
    },
    {
      endpoint: `${BASE_URL}/dashboard/wearables?userId=1`,
      description: "Wearables Data",
    },
    {
      endpoint: `${BASE_URL}/dashboard/team-chemistry?userId=1`,
      description: "Team Chemistry",
    },
    {
      endpoint: `${BASE_URL}/dashboard/notifications?userId=1`,
      description: "Notifications",
    },
    {
      endpoint: `${BASE_URL}/dashboard/daily-quote`,
      description: "Daily Quote",
    },
  ];

  let passedTests = 0;
  const totalTests = tests.length;

  for (const test of tests) {
    const result = await testEndpoint(test.endpoint, test.description);
    if (result.success) {
      passedTests++;
    }

    // Small delay between tests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Summary
  log("\n📊 Test Summary", "bright");
  log(`   Total Tests: ${totalTests}`, "blue");
  log(`   Passed: ${passedTests}`, "green");
  log(`   Failed: ${totalTests - passedTests}`, "red");

  if (passedTests === totalTests) {
    log(
      "\n🎉 All tests passed! Your dashboard API is working correctly.",
      "green",
    );
  } else {
    log(
      "\n⚠️  Some tests failed. Check your server and database connection.",
      "yellow",
    );
  }

  log("\n💡 Next Steps:", "bright");
  log("   1. Open dashboard-complete-wireframe.html in your browser", "cyan");
  log("   2. Check browser console for API calls", "cyan");
  log("   3. Verify data is loading from database", "cyan");
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch((error) => {
    log(`\n💥 Test runner failed: ${error.message}`, "red");
    process.exit(1);
  });
}
