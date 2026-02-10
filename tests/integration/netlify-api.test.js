import "dotenv/config";
import { describe, it, expect, beforeAll } from "vitest";

let healthHandler;
let apiDocsHandler;

const buildEvent = (path) => ({
  httpMethod: "GET",
  headers: {},
  path,
  queryStringParameters: {},
  body: null,
  isBase64Encoded: false,
});

describe("Netlify Functions (API smoke)", () => {
  beforeAll(async () => {
    const required = [
      "SUPABASE_URL",
      "SUPABASE_SERVICE_KEY",
      "SUPABASE_ANON_KEY",
    ];
    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables for Netlify Functions: ${missing.join(", ")}`,
      );
    }
    const health = await import("../../netlify/functions/health.js");
    const apiDocs = await import("../../netlify/functions/api-docs.js");
    healthHandler = health.handler;
    apiDocsHandler = apiDocs.handler;
  });

  it("GET /api/health returns a valid health payload", async () => {
    const response = await healthHandler(buildEvent("/api/health"), {});

    expect([200, 503]).toContain(response?.statusCode ?? 200);
    expect(response?.body).toBeDefined();
    const payload = JSON.parse(response.body);
    expect(typeof payload.success).toBe("boolean");
    if (payload.success) {
      expect(payload.data).toBeDefined();
      expect(payload.data.status).toBeDefined();
    } else {
      expect(payload.error).toBeDefined();
    }
  });

  it("GET /api/api-docs returns API metadata", async () => {
    const response = await apiDocsHandler(buildEvent("/api/api-docs"), {});

    expect([200, 503]).toContain(response?.statusCode ?? 200);
    expect(response?.body).toBeDefined();
    const payload = JSON.parse(response.body);
    expect(typeof payload.success).toBe("boolean");
    if (payload.success) {
      expect(payload.data).toBeDefined();
      expect(payload.data.endpoints).toBeDefined();
      expect(payload.data.endpoints.health).toBeDefined();
    } else {
      expect(payload.error).toBeDefined();
    }
  });
});
