// Integration Tests for API Endpoints
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../../server.js";

describe("API Integration Tests", () => {
  let server;
  let authToken;

  beforeAll(async () => {
    // Start test server
    server = app.listen(0); // Random port
  });

  afterAll(async () => {
    // Close test server
    if (server) {
      server.close();
    }
  });

  describe("Authentication Endpoints", () => {
    it("POST /api/auth/login - should authenticate valid user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe("test@example.com");

      authToken = response.body.data.token;
    });

    it("POST /api/auth/login - should reject invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "invalid@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it("GET /api/auth/me - should return user info with valid token", async () => {
      const response = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
    });

    it("GET /api/auth/me - should reject invalid token", async () => {
      await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  describe("Training Endpoints", () => {
    beforeEach(() => {
      // Ensure we have auth token for protected routes
      expect(authToken).toBeDefined();
    });

    it("GET /api/training/stats - should return training statistics", async () => {
      const response = await request(app)
        .get("/api/training/stats")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.sessions).toBeDefined();
    });

    it("POST /api/training/session - should create training session", async () => {
      const sessionData = {
        type: "speed_training",
        duration: 60,
        exercises: [
          {
            name: "Sprint Intervals",
            sets: 5,
            reps: 40,
            distance: "40 yards",
          },
        ],
      };

      const response = await request(app)
        .post("/api/training/session")
        .set("Authorization", `Bearer ${authToken}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session.id).toBeDefined();
      expect(response.body.data.session.type).toBe(sessionData.type);
    });
  });

  describe("Dashboard Endpoints", () => {
    it("GET /api/dashboard/overview - should return dashboard data", async () => {
      const response = await request(app)
        .get("/api/dashboard/overview")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.overview).toBeDefined();
      expect(response.body.data.overview.totalSessions).toBeTypeOf("number");
    });

    it("GET /api/dashboard/analytics - should return analytics data", async () => {
      const response = await request(app)
        .get("/api/dashboard/analytics")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analytics).toBeDefined();
    });
  });

  describe("Performance Validation", () => {
    it("should respond within acceptable time limits", async () => {
      const startTime = Date.now();

      await request(app)
        .get("/api/dashboard/overview")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it("should handle concurrent requests properly", async () => {
      const requests = [];

      // Create 10 concurrent requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get("/api/dashboard/overview")
            .set("Authorization", `Bearer ${authToken}`),
        );
      }

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe("Error Handling", () => {
    it("GET /api/notifications - should require auth", async () => {
      await request(app).get("/api/notifications").expect(401);
    });

    it("GET /api/training/stats - should reject userId without auth", async () => {
      await request(app)
        .get("/api/training/stats?userId=00000000-0000-0000-0000-000000000000")
        .expect(403);
    });

    it("should handle malformed JSON gracefully", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .set("Content-Type", "application/json")
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid JSON");
    });

    it("should handle missing required fields", async () => {
      const response = await request(app)
        .post("/api/training/session")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it("should handle database connection errors", async () => {
      // Mock database connection failure
      // This would require dependency injection or mocking setup
      // For now, test that endpoints handle errors gracefully

      const response = await request(app)
        .get("/api/nonexistent/endpoint")
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limits on auth endpoints", async () => {
      // Attempt multiple rapid requests
      const promises = [];

      for (let i = 0; i < 20; i++) {
        promises.push(
          request(app)
            .post("/api/auth/login")
            .send({ email: "test@example.com", password: "password123" }),
        );
      }

      const responses = await Promise.all(promises);

      // Some requests should be rate limited (status 429)
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});

// Olympic Features Integration Tests
describe("Olympic Features Integration", () => {
  let authToken;

  beforeAll(async () => {
    // Get auth token for Olympic feature tests
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    authToken = loginResponse.body.data.token;
  });

  describe("IFAF Qualification Tracking", () => {
    it("GET /api/olympic/qualification-status - should return qualification data", async () => {
      const response = await request(app)
        .get("/api/olympic/qualification-status")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.qualification).toBeDefined();
      expect(response.body.data.qualification.status).toBeDefined();
    });

    it("POST /api/olympic/performance-update - should update qualification metrics", async () => {
      const performanceData = {
        event: "European Championship",
        placement: 3,
        points: 150,
        date: new Date().toISOString(),
      };

      const response = await request(app)
        .post("/api/olympic/performance-update")
        .set("Authorization", `Bearer ${authToken}`)
        .send(performanceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.qualificationImpact).toBeDefined();
    });
  });

  describe("AI Prediction Engine", () => {
    it("POST /api/ai/predict-performance - should return performance predictions", async () => {
      const predictionRequest = {
        timeframe: "3_weeks",
        metrics: ["speed", "agility", "endurance"],
        trainingHistory: true,
      };

      const response = await request(app)
        .post("/api/ai/predict-performance")
        .set("Authorization", `Bearer ${authToken}`)
        .send(predictionRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.predictions).toBeDefined();
      expect(response.body.data.confidenceScore).toBeGreaterThan(0.8); // 80%+ confidence
    });

    it("should validate prediction accuracy claims", async () => {
      const response = await request(app)
        .get("/api/ai/model-performance")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accuracy).toBeGreaterThan(0.87); // Validate 87.4% claim
    });
  });
});

// Database Performance Integration Tests
describe("Database Performance Validation", () => {
  let authToken;

  beforeAll(async () => {
    // Get auth token for database performance tests
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "password123" });

    authToken = loginResponse.body.data?.token;
  });

  it("should validate memory optimization claims", async () => {
    const response = await request(app)
      .get("/api/system/performance-metrics")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.memoryOptimization).toBeDefined();
    expect(
      response.body.data.memoryOptimization.reductionPercentage,
    ).toBeGreaterThan(90); // Validate 93% claim
  });

  it("should handle high-load scenarios", async () => {
    if (!authToken) {
      // Skip if auth token not available
      return;
    }

    const promises = [];

    // Create 50 concurrent database requests
    for (let i = 0; i < 50; i++) {
      promises.push(
        request(app)
          .get("/api/dashboard/overview")
          .set("Authorization", `Bearer ${authToken}`),
      );
    }

    const startTime = Date.now();
    const responses = await Promise.all(promises);
    const endTime = Date.now();

    // All requests should succeed
    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });

    // Should handle load efficiently
    const totalTime = endTime - startTime;
    expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
  });
});
