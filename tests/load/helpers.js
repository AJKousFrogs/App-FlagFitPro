/**
 * Artillery Load Test Helpers
 * Custom processors for performance metrics
 */

module.exports = {
  /**
   * Record custom metric for response time
   * Emits to Artillery stats collector
   */
  recordMetric(req, res, ctx, ee, next) {
    // Get response time from first byte
    const responseTime = res.timings?.phases?.firstByte || 0;

    // Emit custom stat
    ee.emit("customStat", {
      stat: "endpoint_response_time",
      value: responseTime,
      tags: {
        endpoint: req.url,
        method: req.method,
        status: res.statusCode,
      },
    });

    // Log slow requests (>2s threshold)
    if (responseTime > 2000) {
      console.warn(
        `⚠️  Slow request detected: ${req.method} ${req.url} - ${responseTime}ms`,
      );
    }

    return next();
  },

  /**
   * Generate realistic training data
   */
  generateSessionData(context, events, done) {
    const sessionTypes = [
      "practice",
      "game",
      "strength",
      "speed",
      "recovery",
      "skills",
    ];
    const now = new Date();

    context.vars.sessionData = {
      session_type:
        sessionTypes[Math.floor(Math.random() * sessionTypes.length)],
      duration_minutes: Math.floor(Math.random() * 90) + 30, // 30-120 min
      rpe: Math.floor(Math.random() * 10) + 1, // 1-10
      session_date: now.toISOString().split("T")[0],
      sprint_reps: Math.floor(Math.random() * 30),
      cutting_movements: Math.floor(Math.random() * 50),
      throw_count: Math.floor(Math.random() * 60),
      jump_count: Math.floor(Math.random() * 40),
      notes: `Load test - ${Date.now()}`,
    };

    return done();
  },

  /**
   * Before test hook - log start time
   */
  beforeTest(context, events, done) {
    console.log("🚀 Starting load test...");
    console.log(`Target: ${context.vars.target}`);
    console.log(`Phases: ${JSON.stringify(context.config.phases)}`);
    return done();
  },

  /**
   * After test hook - log summary
   */
  afterTest(summary, events, done) {
    console.log("\n📊 Load Test Summary:");
    console.log(
      `Total requests: ${summary.aggregate.counters["http.requests"]}`,
    );
    console.log(
      `Successful: ${summary.aggregate.counters["http.codes.200"] || 0}`,
    );
    console.log(`Errors: ${summary.aggregate.counters["errors.total"] || 0}`);
    console.log(`Median response time: ${summary.aggregate.latency.median}ms`);
    console.log(`95th percentile: ${summary.aggregate.latency.p95}ms`);
    console.log(`99th percentile: ${summary.aggregate.latency.p99}ms`);

    // Check if thresholds met
    const errorRate =
      ((summary.aggregate.counters["errors.total"] || 0) /
        summary.aggregate.counters["http.requests"]) *
      100;
    const { p95 } = summary.aggregate.latency;

    console.log("\n✅ Threshold Checks:");
    console.log(
      `Error rate: ${errorRate.toFixed(2)}% ${errorRate < 1 ? "✅" : "❌"} (<1%)`,
    );
    console.log(`P95 latency: ${p95}ms ${p95 < 2000 ? "✅" : "❌"} (<2000ms)`);

    return done();
  },
};
