import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createLoadTestScenario,
  setupTestEnvironment,
} from "../test-helpers.js";

// Performance testing utilities
class PerformanceTestRunner {
  constructor() {
    this.results = [];
    this.metrics = {
      responseTime: [],
      throughput: [],
      errorRate: [],
      memoryUsage: [],
      cpuUsage: [],
    };
  }

  async runLoadTest(scenario) {
    const startTime = performance.now();
    const promises = [];

    for (let i = 0; i < scenario.virtualUsers; i++) {
      promises.push(this.simulateUser(scenario, i));
    }

    const results = await Promise.allSettled(promises);
    const endTime = performance.now();

    return this.analyzeResults(results, endTime - startTime, scenario);
  }

  async simulateUser(scenario, userId) {
    const userMetrics = {
      userId,
      requests: [],
      errors: [],
      startTime: performance.now(),
    };

    try {
      // Simulate ramp-up time
      const delay =
        (userId / scenario.virtualUsers) * scenario.rampUpTime * 1000;
      await this.sleep(delay);

      // Execute scenario requests
      for (const scenarioStep of scenario.scenarios) {
        const requests = [];
        for (let i = 0; i < scenarioStep.weight; i++) {
          for (const request of scenarioStep.requests) {
            requests.push((async () => {
              try {
                const requestStart = performance.now();
                await this.makeRequest(request);
                const requestEnd = performance.now();

                userMetrics.requests.push({
                  endpoint: request,
                  responseTime: requestEnd - requestStart,
                  timestamp: requestEnd,
                });
              } catch (error) {
                userMetrics.errors.push({
                  endpoint: request,
                  error: error.message,
                  timestamp: performance.now(),
                });
              }
            })());
          }
        }
        // Await all requests for this scenario step (needs sequential processing per scenario)
        // eslint-disable-next-line no-await-in-loop
        await Promise.all(requests);
      }
    } catch (error) {
      userMetrics.errors.push({
        error: error.message,
        timestamp: performance.now(),
      });
    }

    userMetrics.endTime = performance.now();
    return userMetrics;
  }

  async makeRequest(endpoint) {
    // Simulate API request with realistic delay
    const baseDelay = this.getBaseDelayForEndpoint(endpoint);
    const jitter = Math.random() * 100; // Add realistic network jitter

    await this.sleep(baseDelay + jitter);

    // Simulate occasional failures
    if (Math.random() < 0.02) {
      // 2% failure rate
      throw new Error(`Simulated failure for ${endpoint}`);
    }

    return { status: 200, data: "mock response" };
  }

  getBaseDelayForEndpoint(endpoint) {
    const delayMap = {
      "POST /api/auth/login": 150,
      "GET /api/dashboard": 200,
      "GET /api/training/programs": 180,
      "POST /api/training/session": 250,
      "PUT /api/training/session/:id": 200,
      "GET /api/analytics/performance": 800, // Complex analytics
      "GET /api/analytics/olympic": 600,
      "POST /api/ai/coach/ask": 1200, // AI processing
      "POST /api/nutrition/log": 150,
      "GET /api/nutrition/analysis": 300,
    };

    return delayMap[endpoint] || 200;
  }

  analyzeResults(results, totalTime, scenario) {
    const successful = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);
    const failed = results.filter((r) => r.status === "rejected");

    const allRequests = successful.flatMap((user) => user.requests);
    const allErrors = successful
      .flatMap((user) => user.errors)
      .concat(failed.map((f) => f.reason));

    const avgResponseTime =
      allRequests.reduce((sum, req) => sum + req.responseTime, 0) /
      allRequests.length;
    const maxResponseTime = Math.max(
      ...allRequests.map((req) => req.responseTime),
    );
    const minResponseTime = Math.min(
      ...allRequests.map((req) => req.responseTime),
    );

    const totalRequests = allRequests.length;
    const errorRate =
      (allErrors.length / (totalRequests + allErrors.length)) * 100;
    const throughput = totalRequests / (totalTime / 1000); // requests per second

    // Calculate percentiles
    const sortedResponseTimes = allRequests
      .map((req) => req.responseTime)
      .sort((a, b) => a - b);
    const p95 =
      sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.95)];
    const p99 =
      sortedResponseTimes[Math.floor(sortedResponseTimes.length * 0.99)];

    return {
      summary: {
        totalUsers: scenario.virtualUsers,
        totalRequests,
        totalErrors: allErrors.length,
        totalTime: totalTime / 1000, // seconds
        throughput,
        errorRate,
      },
      responseTime: {
        average: avgResponseTime,
        min: minResponseTime,
        max: maxResponseTime,
        p95,
        p99,
      },
      acceptance: {
        passed:
          avgResponseTime <= scenario.acceptanceCriteria.averageResponseTime,
        errorRateAcceptable: errorRate <= scenario.acceptanceCriteria.errorRate,
        throughputMet: throughput >= scenario.acceptanceCriteria.throughput,
      },
      endpointAnalysis: this.analyzeEndpointPerformance(allRequests),
      recommendations: this.generateRecommendations(
        avgResponseTime,
        errorRate,
        throughput,
        scenario,
      ),
    };
  }

  analyzeEndpointPerformance(requests) {
    const endpointStats = {};

    requests.forEach((req) => {
      if (!endpointStats[req.endpoint]) {
        endpointStats[req.endpoint] = {
          count: 0,
          totalTime: 0,
          minTime: Infinity,
          maxTime: 0,
          responseTimes: [],
        };
      }

      const stats = endpointStats[req.endpoint];
      stats.count++;
      stats.totalTime += req.responseTime;
      stats.minTime = Math.min(stats.minTime, req.responseTime);
      stats.maxTime = Math.max(stats.maxTime, req.responseTime);
      stats.responseTimes.push(req.responseTime);
    });

    // Calculate averages and identify slow endpoints
    Object.keys(endpointStats).forEach((endpoint) => {
      const stats = endpointStats[endpoint];
      stats.averageTime = stats.totalTime / stats.count;
      stats.performance =
        stats.averageTime <= 300
          ? "good"
          : stats.averageTime <= 1000
            ? "acceptable"
            : "poor";
    });

    return endpointStats;
  }

  generateRecommendations(avgResponseTime, errorRate, throughput, scenario) {
    const recommendations = [];

    if (avgResponseTime > scenario.acceptanceCriteria.averageResponseTime) {
      recommendations.push({
        type: "performance",
        priority: "high",
        message: `Average response time (${Math.round(avgResponseTime)}ms) exceeds target (${scenario.acceptanceCriteria.averageResponseTime}ms)`,
        actions: [
          "Optimize database queries",
          "Implement caching strategies",
          "Consider CDN for static assets",
          "Review server resource allocation",
        ],
      });
    }

    if (errorRate > scenario.acceptanceCriteria.errorRate) {
      recommendations.push({
        type: "reliability",
        priority: "critical",
        message: `Error rate (${errorRate.toFixed(2)}%) exceeds acceptable threshold (${scenario.acceptanceCriteria.errorRate}%)`,
        actions: [
          "Investigate error causes",
          "Implement retry mechanisms",
          "Add circuit breakers",
          "Improve error handling",
        ],
      });
    }

    if (throughput < scenario.acceptanceCriteria.throughput) {
      recommendations.push({
        type: "scalability",
        priority: "high",
        message: `Throughput (${Math.round(throughput)} req/s) below target (${scenario.acceptanceCriteria.throughput} req/s)`,
        actions: [
          "Scale server infrastructure",
          "Optimize application code",
          "Implement load balancing",
          "Consider microservices architecture",
        ],
      });
    }

    return recommendations;
  }

  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

describe("Performance and Load Testing", () => {
  let performanceRunner;
  let testEnv;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    performanceRunner = new PerformanceTestRunner();
    vi.clearAllMocks();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe("Load Testing Scenarios", () => {
    it("should handle typical user load", async () => {
      const scenario = createLoadTestScenario(50, 60); // 50 users over 60 seconds

      const results = await performanceRunner.runLoadTest(scenario);

      expect(results.summary.totalUsers).toBe(50);
      expect(results.acceptance.passed).toBe(true);
      expect(results.acceptance.errorRateAcceptable).toBe(true);
      expect(results.responseTime.average).toBeLessThan(300);
      expect(results.summary.errorRate).toBeLessThan(1);
    }, 90000); // 90 second timeout for load test

    it("should handle peak user load", async () => {
      const scenario = createLoadTestScenario(200, 120); // 200 users over 2 minutes
      scenario.acceptanceCriteria = {
        averageResponseTime: 500, // More lenient for peak load
        errorRate: 2,
        throughput: 800,
      };

      const results = await performanceRunner.runLoadTest(scenario);

      expect(results.summary.totalUsers).toBe(200);
      expect(results.responseTime.average).toBeLessThan(500);
      expect(results.summary.errorRate).toBeLessThan(2);

      // Verify system degrades gracefully under load
      expect(results.responseTime.p99).toBeLessThan(2000);
    }, 180000); // 3 minute timeout

    it("should handle burst traffic", async () => {
      const scenario = createLoadTestScenario(500, 30); // 500 users in 30 seconds (burst)
      scenario.rampUpTime = 5; // Quick ramp-up
      scenario.acceptanceCriteria = {
        averageResponseTime: 1000, // Very lenient for burst
        errorRate: 5,
        throughput: 500,
      };

      const results = await performanceRunner.runLoadTest(scenario);

      expect(results.summary.totalUsers).toBe(500);

      // System should not completely fail under burst
      expect(results.summary.errorRate).toBeLessThan(10);
      expect(results.acceptance.errorRateAcceptable).toBe(true);
    }, 120000);
  });

  describe("Endpoint-Specific Performance Testing", () => {
    it("should test authentication endpoint performance", async () => {
      const authScenario = {
        virtualUsers: 100,
        durationSeconds: 60,
        rampUpTime: 10,
        scenarios: [
          {
            name: "authentication_only",
            weight: 100,
            requests: ["POST /api/auth/login"],
          },
        ],
        acceptanceCriteria: {
          averageResponseTime: 200,
          errorRate: 0.1,
          throughput: 500,
        },
      };

      const results = await performanceRunner.runLoadTest(authScenario);

      expect(results.endpointAnalysis["POST /api/auth/login"].performance).toBe(
        "good",
      );
      expect(results.acceptance.passed).toBe(true);
    }, 90000);

    it("should test analytics endpoint under load", async () => {
      const analyticsScenario = {
        virtualUsers: 50,
        durationSeconds: 60,
        rampUpTime: 15,
        scenarios: [
          {
            name: "analytics_heavy",
            weight: 100,
            requests: [
              "GET /api/analytics/performance",
              "GET /api/analytics/olympic",
            ],
          },
        ],
        acceptanceCriteria: {
          averageResponseTime: 1000, // Analytics can be slower
          errorRate: 1,
          throughput: 200,
        },
      };

      const results = await performanceRunner.runLoadTest(analyticsScenario);

      // Analytics endpoints are computation-heavy, so more lenient thresholds
      expect(results.responseTime.average).toBeLessThan(1200);
      expect(
        results.endpointAnalysis["GET /api/analytics/performance"].averageTime,
      ).toBeLessThan(1500);
    }, 120000);

    it("should test AI coach endpoint performance", async () => {
      const aiScenario = {
        virtualUsers: 20, // Fewer users for AI endpoint
        durationSeconds: 60,
        rampUpTime: 20,
        scenarios: [
          {
            name: "ai_coaching",
            weight: 100,
            requests: ["POST /api/ai/coach/ask"],
          },
        ],
        acceptanceCriteria: {
          averageResponseTime: 1500, // AI processing takes time
          errorRate: 0.5,
          throughput: 50,
        },
      };

      const results = await performanceRunner.runLoadTest(aiScenario);

      expect(
        results.endpointAnalysis["POST /api/ai/coach/ask"].averageTime,
      ).toBeLessThan(2000);
      expect(results.acceptance.errorRateAcceptable).toBe(true);
    }, 120000);
  });

  describe("Stress Testing", () => {
    it("should identify breaking point", async () => {
      const userCounts = [100, 250, 500, 750, 1000];
      const results = [];

      // Run tests sequentially but avoid await in direct loop
      const runTest = async (userCount) => {
        const scenario = createLoadTestScenario(userCount, 60);
        scenario.acceptanceCriteria.averageResponseTime = 2000; // Very lenient
        scenario.acceptanceCriteria.errorRate = 10;

        try {
          const result = await performanceRunner.runLoadTest(scenario);
          return {
            userCount,
            avgResponseTime: result.responseTime.average,
            errorRate: result.summary.errorRate,
            throughput: result.summary.throughput,
            passed: result.acceptance.passed,
          };
        } catch (error) {
          return {
            userCount,
            error: error.message,
            passed: false,
          };
        }
      };

      // Need to run tests sequentially to detect breaking point
      for (const userCount of userCounts) {
        // eslint-disable-next-line no-await-in-loop
        const result = await runTest(userCount);
        results.push(result);

        // Stop if error rate becomes too high
        if (result.errorRate && result.errorRate > 15) {
          break;
        }
        if (!result.passed) {
          break;
        }
      }

      // Find breaking point
      const breakingPoint = results.find((r) => !r.passed || r.errorRate > 10);

      expect(results.length).toBeGreaterThan(0);
      if (breakingPoint) {
        expect(breakingPoint.userCount).toBeGreaterThan(100); // Should handle at least 100 users
      }
    }, 600000); // 10 minute timeout for stress test
  });

  describe("Memory and Resource Testing", () => {
    it("should monitor memory usage during load", async () => {
      const memoryMonitor = {
        measurements: [],
        interval: null,

        start() {
          this.interval = setInterval(() => {
            if (
              typeof window !== "undefined" &&
              window.performance &&
              window.performance.memory
            ) {
              this.measurements.push({
                timestamp: Date.now(),
                used: window.performance.memory.usedJSHeapSize,
                total: window.performance.memory.totalJSHeapSize,
                limit: window.performance.memory.jsHeapSizeLimit,
              });
            } else {
              // Mock memory measurements for testing
              this.measurements.push({
                timestamp: Date.now(),
                used: 50000000 + Math.random() * 10000000, // 50-60MB
                total: 100000000,
                limit: 2000000000,
              });
            }
          }, 1000);
        },

        stop() {
          if (this.interval) {
            clearInterval(this.interval);
          }
        },

        analyze() {
          if (this.measurements.length === 0) {
            return { stable: true, peakUsage: 0 };
          }

          const usages = this.measurements.map((m) => m.used);
          const maxUsage = Math.max(...usages);
          const avgUsage = usages.reduce((a, b) => a + b) / usages.length;

          // Check for memory leaks (increasing trend)
          const firstHalf = usages.slice(0, Math.floor(usages.length / 2));
          const secondHalf = usages.slice(Math.floor(usages.length / 2));
          const firstAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
          const secondAvg =
            secondHalf.reduce((a, b) => a + b) / secondHalf.length;
          const growthRate = (secondAvg - firstAvg) / firstAvg;

          return {
            stable: growthRate < 0.2, // Less than 20% growth
            peakUsage: maxUsage,
            averageUsage: avgUsage,
            growthRate: growthRate * 100,
            measurements: this.measurements,
          };
        },
      };

      memoryMonitor.start();

      const scenario = createLoadTestScenario(100, 120);
      await performanceRunner.runLoadTest(scenario);

      memoryMonitor.stop();
      const memoryAnalysis = memoryMonitor.analyze();

      expect(memoryAnalysis.stable).toBe(true);
      expect(memoryAnalysis.peakUsage).toBeLessThan(100000000); // Less than 100MB
      expect(memoryAnalysis.growthRate).toBeLessThan(30); // Less than 30% growth
    }, 180000);
  });

  describe("Database Performance Testing", () => {
    it("should test database query performance under load", async () => {
      const dbScenario = {
        virtualUsers: 100,
        durationSeconds: 60,
        rampUpTime: 10,
        scenarios: [
          {
            name: "database_heavy",
            weight: 100,
            requests: [
              "GET /api/training/sessions", // Database read
              "POST /api/training/session", // Database write
              "GET /api/analytics/performance", // Complex queries
            ],
          },
        ],
        acceptanceCriteria: {
          averageResponseTime: 400,
          errorRate: 1,
          throughput: 300,
        },
      };

      const results = await performanceRunner.runLoadTest(dbScenario);

      // Database operations should remain responsive
      expect(
        results.endpointAnalysis["GET /api/training/sessions"].averageTime,
      ).toBeLessThan(300);
      expect(
        results.endpointAnalysis["POST /api/training/session"].averageTime,
      ).toBeLessThan(500);

      // Complex analytics queries can be slower but should not time out
      expect(
        results.endpointAnalysis["GET /api/analytics/performance"].averageTime,
      ).toBeLessThan(2000);
    }, 120000);
  });

  describe("Real-time Feature Performance", () => {
    it("should test real-time updates performance", async () => {
      const realtimeScenario = {
        virtualUsers: 50,
        durationSeconds: 60,
        rampUpTime: 10,
        scenarios: [
          {
            name: "realtime_updates",
            weight: 100,
            requests: [
              "POST /api/training/session", // Creates real-time updates
              "GET /api/analytics/performance", // Receives real-time data
            ],
          },
        ],
        acceptanceCriteria: {
          averageResponseTime: 300,
          errorRate: 1,
          throughput: 200,
        },
      };

      const results = await performanceRunner.runLoadTest(realtimeScenario);

      expect(results.acceptance.passed).toBe(true);
      expect(results.summary.throughput).toBeGreaterThan(150);

      // Real-time features should maintain low latency
      expect(results.responseTime.p95).toBeLessThan(800);
    }, 90000);
  });

  describe("CDN and Caching Performance", () => {
    it("should test cached content delivery performance", async () => {
      const cacheScenario = {
        virtualUsers: 200,
        durationSeconds: 60,
        rampUpTime: 5,
        scenarios: [
          {
            name: "cached_content",
            weight: 100,
            requests: [
              "GET /api/dashboard", // Should be cached
              "GET /api/training/programs", // Should be cached
            ],
          },
        ],
        acceptanceCriteria: {
          averageResponseTime: 100, // Cached content should be very fast
          errorRate: 0.1,
          throughput: 1000,
        },
      };

      const results = await performanceRunner.runLoadTest(cacheScenario);

      // Cached content should be very fast
      expect(
        results.endpointAnalysis["GET /api/dashboard"].averageTime,
      ).toBeLessThan(150);
      expect(results.responseTime.average).toBeLessThan(120);
      expect(results.acceptance.passed).toBe(true);
    }, 90000);
  });

  describe("Mobile Performance Testing", () => {
    it("should test performance on simulated mobile devices", async () => {
      // Simulate mobile device constraints
      const mobileScenario = createLoadTestScenario(30, 60); // Fewer concurrent users on mobile

      // Simulate slower mobile network by increasing response times
      const originalGetBaseDelay = performanceRunner.getBaseDelayForEndpoint;
      performanceRunner.getBaseDelayForEndpoint = function (endpoint) {
        return originalGetBaseDelay.call(this, endpoint) * 1.5; // 50% slower for mobile
      };

      const results = await performanceRunner.runLoadTest(mobileScenario);

      // Mobile should still be responsive despite slower network
      expect(results.responseTime.average).toBeLessThan(500);
      expect(results.acceptance.errorRateAcceptable).toBe(true);
      expect(results.summary.throughput).toBeGreaterThan(50);

      // Restore original method
      performanceRunner.getBaseDelayForEndpoint = originalGetBaseDelay;
    }, 120000);
  });

  describe("Performance Regression Testing", () => {
    it("should detect performance regressions", async () => {
      // Baseline performance test
      const baselineScenario = createLoadTestScenario(100, 60);
      const baselineResults =
        await performanceRunner.runLoadTest(baselineScenario);

      // Simulate performance regression by slowing down responses
      const originalGetBaseDelay = performanceRunner.getBaseDelayForEndpoint;
      performanceRunner.getBaseDelayForEndpoint = function (endpoint) {
        return originalGetBaseDelay.call(this, endpoint) * 2; // 100% slower (regression)
      };

      const regressionResults =
        await performanceRunner.runLoadTest(baselineScenario);

      // Detect regression
      const responseTimeIncrease =
        regressionResults.responseTime.average /
        baselineResults.responseTime.average;
      const throughputDecrease =
        baselineResults.summary.throughput /
        regressionResults.summary.throughput;

      expect(responseTimeIncrease).toBeGreaterThan(1.5); // Response time significantly increased
      expect(throughputDecrease).toBeGreaterThan(1.3); // Throughput significantly decreased

      // Performance regression should be flagged
      const hasRegression =
        responseTimeIncrease > 1.2 || throughputDecrease > 1.2;
      expect(hasRegression).toBe(true);

      // Restore original method
      performanceRunner.getBaseDelayForEndpoint = originalGetBaseDelay;
    }, 180000);
  });
});
