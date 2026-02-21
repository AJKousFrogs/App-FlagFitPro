import { describe, expect, it } from "vitest";
import { lookup } from "node:dns/promises";

const hasLiveEnv =
  Boolean(process.env.SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) &&
  Boolean(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);

let hasNetworkAccessToSupabase = false;
if (hasLiveEnv) {
  try {
    const supabaseHost = new URL(process.env.SUPABASE_URL).hostname;
    await lookup(supabaseHost);
    hasNetworkAccessToSupabase = true;
  } catch {
    hasNetworkAccessToSupabase = false;
  }
}

describe.skipIf(!(hasLiveEnv && hasNetworkAccessToSupabase))("knowledge-search live schema integration", () => {
  it("returns normalized results from live knowledge_base_entries schema", async () => {
    const { handler } = await import("../../netlify/functions/knowledge-search.js");

    const response = await handler(
      {
        httpMethod: "POST",
        path: "/.netlify/functions/knowledge-search",
        headers: {},
        body: JSON.stringify({
          query: "recovery",
          limit: 5,
        }),
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.success).toBe(true);
    expect(Array.isArray(payload.data?.results)).toBe(true);

    if ((payload.data?.results || []).length > 0) {
      const first = payload.data.results[0];
      expect(typeof first.title).toBe("string");
      expect(typeof first.content).toBe("string");
      expect(typeof first.category).toBe("string");
      expect(first).toHaveProperty("evidenceGrade");
      expect(first).toHaveProperty("sourceType");
    }
  });

  it("returns live categories including new entry_type values", async () => {
    const { handler } = await import("../../netlify/functions/knowledge-search.js");

    const response = await handler(
      {
        httpMethod: "GET",
        path: "/knowledge-search/categories",
        headers: {},
        queryStringParameters: {},
      },
      {},
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload.success).toBe(true);
    expect(Array.isArray(payload.data)).toBe(true);

    const names = payload.data.map((c) => c.category);
    expect(names.length).toBeGreaterThan(0);
  });
});
