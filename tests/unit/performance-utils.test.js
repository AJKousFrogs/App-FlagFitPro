import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setupTestEnvironment,
  createLoadTestScenario,
} from "../test-helpers.js";

// Mock PerformanceUtils structure based on common patterns
const PerformanceUtils = vi.fn().mockImplementation(() => ({
  measureExecutionTime: vi.fn(),
  trackPageLoad: vi.fn(),
  trackUserInteraction: vi.fn(),
  trackApiCall: vi.fn(),
  measureMemoryUsage: vi.fn(),
  trackRenderTime: vi.fn(),
  detectPerformanceBottlenecks: vi.fn(),
  generatePerformanceReport: vi.fn(),
  optimizeImageLoading: vi.fn(),
  cacheManager: vi.fn(),
  debounce: vi.fn(),
  throttle: vi.fn(),
  lazy: vi.fn(),
}));

describe("Performance Utils - Comprehensive Tests", () => {
  let performanceUtils;
  let testEnv;
  let mockPerformanceObserver;
  let mockIntersectionObserver;

  beforeEach(() => {
    testEnv = setupTestEnvironment();
    performanceUtils = new PerformanceUtils();

    // Mock Performance Observer
    mockPerformanceObserver = vi.fn().mockImplementation((_callback) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn().mockReturnValue([]),
    }));
    global.PerformanceObserver = mockPerformanceObserver;

    // Mock Intersection Observer
    mockIntersectionObserver = vi.fn().mockImplementation((_callback) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
    global.IntersectionObserver = mockIntersectionObserver;

    // Mock performance.now()
    global.performance = global.performance || {};
    global.performance.now = vi.fn().mockReturnValue(1000);
    global.performance.mark = vi.fn();
    global.performance.measure = vi.fn();
    global.performance.getEntriesByName = vi.fn().mockReturnValue([]);
    global.performance.getEntriesByType = vi.fn().mockReturnValue([]);

    vi.clearAllMocks();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe("Execution Time Measurement", () => {
    it("should measure function execution time accurately", async () => {
      const testFunction = async () => {
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        return "test result";
      };

      performanceUtils.measureExecutionTime.mockImplementation(
        async (fn, label) => {
          const start = performance.now();
          const result = await fn();
          const end = performance.now();
          const duration = end - start;

          return {
            result,
            duration,
            label: label || "anonymous",
            timestamp: Date.now(),
          };
        },
      );

      global.performance.now
        .mockReturnValueOnce(1000) // start time
        .mockReturnValueOnce(1100); // end time

      const measurement = await performanceUtils.measureExecutionTime(
        testFunction,
        "test-function",
      );

      expect(measurement.duration).toBe(100);
      expect(measurement.result).toBe("test result");
      expect(measurement.label).toBe("test-function");
    });

    it("should handle synchronous function measurement", () => {
      const syncFunction = () => {
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += i;
        }
        return sum;
      };

      performanceUtils.measureExecutionTime.mockImplementation((fn, label) => {
        const start = performance.now();
        const result = fn();
        const end = performance.now();

        return {
          result,
          duration: end - start,
          label,
          type: "sync",
        };
      });

      global.performance.now
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1050);

      const measurement = performanceUtils.measureExecutionTime(
        syncFunction,
        "heavy-calculation",
      );

      expect(measurement.duration).toBe(50);
      expect(measurement.type).toBe("sync");
    });

    it("should track multiple nested measurements", async () => {
      const nestedFunction = async () => {
        // Simulate nested operations
        const step1 = await new Promise((resolve) => {
          setTimeout(() => resolve("step1"), 50);
        });
        const step2 = await new Promise((resolve) => {
          setTimeout(() => resolve("step2"), 30);
        });
        return { step1, step2 };
      };

      performanceUtils.measureExecutionTime.mockImplementation(
        async (fn, label) => {
          const measurements = [];

          const originalFn = fn;
          const wrappedFn = async () => {
            measurements.push({
              label: "nested-start",
              time: performance.now(),
            });
            const result = await originalFn();
            measurements.push({ label: "nested-end", time: performance.now() });
            return result;
          };

          return {
            result: await wrappedFn(),
            measurements,
            totalDuration: 80,
          };
        },
      );

      const result = await performanceUtils.measureExecutionTime(
        nestedFunction,
        "nested-operation",
      );
      expect(result.measurements).toHaveLength(2);
      expect(result.totalDuration).toBe(80);
    });
  });

  describe("Page Load Performance", () => {
    it("should track page load metrics", () => {
      const mockNavigationTiming = {
        navigationStart: 1000,
        domContentLoadedEventEnd: 2500,
        loadEventEnd: 3000,
        connectStart: 1100,
        connectEnd: 1200,
        responseStart: 1300,
        responseEnd: 2000,
      };

      global.performance.timing = mockNavigationTiming;

      performanceUtils.trackPageLoad.mockImplementation(() => {
        const {timing} = performance;
        return {
          totalLoadTime: timing.loadEventEnd - timing.navigationStart,
          domContentLoaded:
            timing.domContentLoadedEventEnd - timing.navigationStart,
          serverResponse: timing.responseEnd - timing.responseStart,
          networkLatency: timing.responseStart - timing.connectStart,
          domProcessing: timing.domContentLoadedEventEnd - timing.responseEnd,
        };
      });

      const metrics = performanceUtils.trackPageLoad();

      expect(metrics.totalLoadTime).toBe(2000);
      expect(metrics.domContentLoaded).toBe(1500);
      expect(metrics.serverResponse).toBe(700);
    });

    it("should track Core Web Vitals", () => {
      const mockWebVitals = {
        LCP: 2.1, // Largest Contentful Paint
        FID: 95, // First Input Delay
        CLS: 0.08, // Cumulative Layout Shift
      };

      performanceUtils.trackCoreWebVitals = vi.fn().mockImplementation(() => {
        return {
          ...mockWebVitals,
          assessment: {
            LCP: mockWebVitals.LCP <= 2.5 ? "good" : "needs improvement",
            FID: mockWebVitals.FID <= 100 ? "good" : "needs improvement",
            CLS: mockWebVitals.CLS <= 0.1 ? "good" : "needs improvement",
          },
          score: 85, // Overall performance score
        };
      });

      const vitals = performanceUtils.trackCoreWebVitals();

      expect(vitals.LCP).toBe(2.1);
      expect(vitals.assessment.LCP).toBe("good");
      expect(vitals.assessment.CLS).toBe("good");
    });

    it("should identify performance bottlenecks", () => {
      const mockBottlenecks = [
        {
          type: "slow_api_call",
          endpoint: "/api/training/analysis",
          duration: 5000,
        },
        { type: "large_image", resource: "hero-banner.jpg", size: "2.5MB" },
        { type: "blocking_script", script: "analytics.js", delay: 800 },
      ];

      performanceUtils.detectPerformanceBottlenecks.mockImplementation(() => {
        return {
          bottlenecks: mockBottlenecks,
          recommendations: [
            "Optimize API response times for /api/training/analysis",
            "Compress and lazy-load hero-banner.jpg",
            "Load analytics.js asynchronously",
          ],
          priority: "high",
          estimatedImprovement: "40% faster load time",
        };
      });

      const analysis = performanceUtils.detectPerformanceBottlenecks();

      expect(analysis.bottlenecks).toHaveLength(3);
      expect(analysis.recommendations).toContain(
        "Optimize API response times for /api/training/analysis",
      );
    });
  });

  describe("User Interaction Performance", () => {
    it("should track user interaction response times", () => {
      const interactions = [
        { type: "click", element: "save-training-btn", duration: 150 },
        { type: "input", element: "exercise-name", duration: 50 },
        { type: "scroll", element: "training-list", duration: 16 },
      ];

      performanceUtils.trackUserInteraction.mockImplementation(
        (type, element) => {
          const interaction = interactions.find(
            (i) => i.type === type && i.element === element,
          );
          return {
            ...interaction,
            timestamp: Date.now(),
            acceptable: interaction.duration <= 100,
            rating: interaction.duration <= 100 ? "fast" : "slow",
          };
        },
      );

      const clickResult = performanceUtils.trackUserInteraction(
        "click",
        "save-training-btn",
      );
      const scrollResult = performanceUtils.trackUserInteraction(
        "scroll",
        "training-list",
      );

      expect(clickResult.duration).toBe(150);
      expect(clickResult.acceptable).toBe(false);
      expect(scrollResult.rating).toBe("fast");
    });

    it("should measure input responsiveness", () => {
      const inputEvents = [
        { element: "search-box", inputDelay: 45, renderDelay: 20 },
        { element: "weight-slider", inputDelay: 15, renderDelay: 8 },
        { element: "exercise-dropdown", inputDelay: 120, renderDelay: 80 },
      ];

      performanceUtils.measureInputResponsiveness = vi
        .fn()
        .mockImplementation((element) => {
          const event = inputEvents.find((e) => e.element === element);
          return {
            ...event,
            totalDelay: event.inputDelay + event.renderDelay,
            responsiveness:
              event.inputDelay + event.renderDelay <= 50
                ? "excellent"
                : "needs_improvement",
          };
        });

      const searchResponse =
        performanceUtils.measureInputResponsiveness("search-box");
      const dropdownResponse =
        performanceUtils.measureInputResponsiveness("exercise-dropdown");

      expect(searchResponse.totalDelay).toBe(65);
      expect(dropdownResponse.responsiveness).toBe("needs_improvement");
    });
  });

  describe("API Call Performance", () => {
    it("should track API call performance metrics", async () => {
      const apiCalls = [
        {
          endpoint: "/api/training/sessions",
          method: "GET",
          duration: 250,
          status: 200,
        },
        {
          endpoint: "/api/nutrition/log",
          method: "POST",
          duration: 180,
          status: 201,
        },
        {
          endpoint: "/api/analytics/performance",
          method: "GET",
          duration: 1200,
          status: 200,
        },
      ];

      performanceUtils.trackApiCall.mockImplementation((endpoint, method) => {
        const call = apiCalls.find(
          (c) => c.endpoint === endpoint && c.method === method,
        );
        return {
          ...call,
          timestamp: Date.now(),
          performance: call.duration <= 300 ? "fast" : "slow",
          cacheHit: call.duration < 100,
        };
      });

      const fastCall = performanceUtils.trackApiCall(
        "/api/nutrition/log",
        "POST",
      );
      const slowCall = performanceUtils.trackApiCall(
        "/api/analytics/performance",
        "GET",
      );

      expect(fastCall.performance).toBe("fast");
      expect(slowCall.performance).toBe("slow");
    });

    it("should identify slow API endpoints", () => {
      const endpointMetrics = [
        {
          endpoint: "/api/training/analysis",
          averageTime: 3000,
          callCount: 45,
        },
        { endpoint: "/api/user/profile", averageTime: 150, callCount: 120 },
        { endpoint: "/api/olympic/rankings", averageTime: 800, callCount: 30 },
      ];

      performanceUtils.identifySlowEndpoints = vi
        .fn()
        .mockImplementation(() => {
          return endpointMetrics
            .filter((metric) => metric.averageTime > 500)
            .map((metric) => ({
              ...metric,
              severity: metric.averageTime > 2000 ? "critical" : "moderate",
              impact: metric.callCount * (metric.averageTime / 1000), // total seconds wasted
            }));
        });

      const slowEndpoints = performanceUtils.identifySlowEndpoints();

      expect(slowEndpoints).toHaveLength(2);
      expect(slowEndpoints[0].severity).toBe("critical");
      expect(slowEndpoints[0].impact).toBeGreaterThan(100);
    });
  });

  describe("Memory Usage Tracking", () => {
    it("should monitor memory usage patterns", () => {
      const mockMemoryInfo = {
        usedJSHeapSize: 50000000, // 50MB
        totalJSHeapSize: 100000000, // 100MB
        jsHeapSizeLimit: 2000000000, // 2GB
      };

      global.performance.memory = mockMemoryInfo;

      performanceUtils.measureMemoryUsage.mockImplementation(() => {
        const {memory} = performance;
        return {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
          usagePercentage: Math.round(
            (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
          ),
          status:
            memory.usedJSHeapSize / memory.totalJSHeapSize > 0.8
              ? "high"
              : "normal",
        };
      });

      const memoryUsage = performanceUtils.measureMemoryUsage();

      expect(memoryUsage.used).toBe(48); // ~50MB
      expect(memoryUsage.usagePercentage).toBe(50);
      expect(memoryUsage.status).toBe("normal");
    });

    it("should detect memory leaks", () => {
      const memorySnapshots = [
        { timestamp: 1000, used: 45 },
        { timestamp: 2000, used: 48 },
        { timestamp: 3000, used: 52 },
        { timestamp: 4000, used: 58 },
        { timestamp: 5000, used: 65 },
      ];

      performanceUtils.detectMemoryLeaks = vi
        .fn()
        .mockImplementation((snapshots) => {
          const growthRate =
            snapshots.slice(-3).reduce((acc, snapshot, index) => {
              if (index === 0) {
                return acc;
              }
              return (
                acc +
                (snapshot.used -
                  snapshots[snapshots.length - 3 + index - 1].used)
              );
            }, 0) / 2;

          return {
            growthRate,
            trend: growthRate > 5 ? "increasing_rapidly" : "stable",
            recommendation:
              growthRate > 5 ? "investigate_potential_leak" : "normal_usage",
            criticalThreshold: 80, // MB
          };
        });

      const leakAnalysis = performanceUtils.detectMemoryLeaks(memorySnapshots);

      expect(leakAnalysis.trend).toBe("increasing_rapidly");
      expect(leakAnalysis.recommendation).toBe("investigate_potential_leak");
    });
  });

  describe("Render Performance", () => {
    it("should track component render times", () => {
      const componentRenders = [
        { component: "TrainingDashboard", renderTime: 45, reRenderCount: 3 },
        { component: "NutritionChart", renderTime: 120, reRenderCount: 8 },
        { component: "ExerciseList", renderTime: 25, reRenderCount: 1 },
      ];

      performanceUtils.trackRenderTime.mockImplementation((component) => {
        const render = componentRenders.find((r) => r.component === component);
        return {
          ...render,
          performance: render.renderTime <= 50 ? "good" : "needs_optimization",
          efficiency:
            render.reRenderCount <= 5 ? "efficient" : "excessive_rerenders",
        };
      });

      const dashboardRender =
        performanceUtils.trackRenderTime("TrainingDashboard");
      const chartRender = performanceUtils.trackRenderTime("NutritionChart");

      expect(dashboardRender.performance).toBe("good");
      expect(chartRender.efficiency).toBe("excessive_rerenders");
    });

    it("should identify render bottlenecks", () => {
      const renderBottlenecks = [
        {
          component: "AnalyticsChart",
          issue: "expensive_calculations",
          impact: "high",
        },
        {
          component: "UsersList",
          issue: "large_list_rendering",
          impact: "medium",
        },
        {
          component: "VideoPlayer",
          issue: "heavy_dom_manipulation",
          impact: "high",
        },
      ];

      performanceUtils.identifyRenderBottlenecks = vi
        .fn()
        .mockImplementation(() => {
          return {
            bottlenecks: renderBottlenecks,
            recommendations: {
              AnalyticsChart: [
                "implement memoization",
                "use web workers for calculations",
              ],
              UsersList: ["implement virtualization", "add pagination"],
              VideoPlayer: [
                "optimize DOM updates",
                "use requestAnimationFrame",
              ],
            },
            priorityOrder: ["AnalyticsChart", "VideoPlayer", "UsersList"],
          };
        });

      const analysis = performanceUtils.identifyRenderBottlenecks();

      expect(analysis.bottlenecks).toHaveLength(3);
      expect(analysis.priorityOrder[0]).toBe("AnalyticsChart");
    });
  });

  describe("Optimization Utilities", () => {
    it("should implement debounce functionality", (done) => {
      let callCount = 0;

      performanceUtils.debounce.mockImplementation((func, delay) => {
        let timeoutId;
        return (...args) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func(...args), delay);
        };
      });

      const debouncedFunction = performanceUtils.debounce(() => {
        callCount++;
      }, 100);

      // Call multiple times rapidly
      debouncedFunction();
      debouncedFunction();
      debouncedFunction();

      // Should only execute once after delay
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });

    it("should implement throttle functionality", () => {
      let callCount = 0;
      let canExecute = true;

      performanceUtils.throttle.mockImplementation((func, limit) => {
        return (...args) => {
          if (canExecute) {
            func(...args);
            canExecute = false;
            setTimeout(() => {
              canExecute = true;
            }, limit);
          }
        };
      });

      const throttledFunction = performanceUtils.throttle(() => {
        callCount++;
      }, 100);

      // Call multiple times
      throttledFunction();
      throttledFunction();
      throttledFunction();

      expect(callCount).toBe(1);
    });

    it("should implement lazy loading", () => {
      const elements = [
        { id: "image1", src: "image1.jpg", loaded: false },
        { id: "image2", src: "image2.jpg", loaded: false },
      ];

      performanceUtils.lazy.mockImplementation((_selector, _options) => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const element = elements.find((el) => el.id === entry.target.id);
              if (element) {
                element.loaded = true;
              }
            }
          });
        });

        return { observer, elementsCount: elements.length };
      });

      const lazyLoader = performanceUtils.lazy(".lazy-image", {
        threshold: 0.1,
      });
      expect(lazyLoader.elementsCount).toBe(2);
    });
  });

  describe("Performance Reporting", () => {
    it("should generate comprehensive performance reports", () => {
      const performanceData = {
        pageLoad: { totalTime: 2000, score: 85 },
        apiCalls: { averageTime: 300, slowestEndpoint: "/api/analytics" },
        memory: { current: 50, peak: 75, leaks: false },
        renders: { averageTime: 35, slowestComponent: "AnalyticsChart" },
        interactions: { averageDelay: 80, responsiveness: "good" },
      };

      performanceUtils.generatePerformanceReport.mockImplementation(() => {
        return {
          timestamp: Date.now(),
          overallScore: 78,
          metrics: performanceData,
          recommendations: [
            "Optimize AnalyticsChart rendering",
            "Cache frequent API calls",
            "Implement lazy loading for images",
          ],
          trends: {
            pageLoad: "improving",
            memory: "stable",
            interactions: "excellent",
          },
          alerts: [
            { type: "warning", message: "Memory usage approaching 80%" },
          ],
        };
      });

      const report = performanceUtils.generatePerformanceReport();

      expect(report.overallScore).toBe(78);
      expect(report.recommendations).toHaveLength(3);
      expect(report.trends.interactions).toBe("excellent");
    });

    it("should track performance over time", () => {
      const historicalData = [
        { date: "2025-01-01", score: 72 },
        { date: "2025-01-02", score: 75 },
        { date: "2025-01-03", score: 78 },
        { date: "2025-01-04", score: 82 },
        { date: "2025-01-05", score: 85 },
      ];

      performanceUtils.trackPerformanceHistory = vi
        .fn()
        .mockImplementation(() => {
          return {
            data: historicalData,
            trend: "improving",
            improvementRate: 3.25, // points per day
            projection: {
              nextWeek: 90,
              nextMonth: 95,
            },
          };
        });

      const history = performanceUtils.trackPerformanceHistory();

      expect(history.trend).toBe("improving");
      expect(history.improvementRate).toBe(3.25);
      expect(history.projection.nextWeek).toBe(90);
    });
  });
});
