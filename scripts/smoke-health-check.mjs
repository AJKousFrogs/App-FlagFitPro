#!/usr/bin/env node
/**
 * Health check for smoke-test — loads ESM health handler
 * Used by scripts/smoke-check.sh
 */
import "dotenv/config";
import { handler as healthHandler } from "../netlify/functions/health.js";

async function runHealthCheck() {
  const result = await healthHandler(
    {
      httpMethod: "GET",
      headers: {},
      path: "/api/health",
      queryStringParameters: {},
      body: null,
      isBase64Encoded: false,
    },
    {},
  );

  if (!result?.body) {
    throw new Error("Health check returned an empty response");
  }

  const payload = JSON.parse(result.body);
  if (!payload?.success) {
    throw new Error("Health check failed");
  }

  console.log("Health check passed.");
}

runHealthCheck().catch((error) => {
  console.error("Health check failed:", error.message);
  process.exit(1);
});
