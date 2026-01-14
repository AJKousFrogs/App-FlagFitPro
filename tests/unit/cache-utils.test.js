import { describe, it, expect } from "vitest";
import { generateCacheKey } from "../../routes/utils/cache.js";

describe("cache utils", () => {
  it("uses requested userId over authenticated userId", () => {
    const req = {
      userId: "auth-user",
      query: { userId: "requested-user" },
      params: {},
      baseUrl: "/api",
      path: "/dashboard/overview",
    };

    const key = generateCacheKey(req, "DASHBOARD");
    expect(key).toContain(":requested-user:");
  });

  it("falls back to authenticated userId when no requested userId", () => {
    const req = {
      userId: "auth-user",
      query: {},
      params: {},
      baseUrl: "/api",
      path: "/dashboard/overview",
    };

    const key = generateCacheKey(req, "DASHBOARD");
    expect(key).toContain(":auth-user:");
  });
});
