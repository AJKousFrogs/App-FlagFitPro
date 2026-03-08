import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../netlify/functions/utils/base-handler.js", () => ({
  baseHandler: async (event, context, options) => options.handler(event, context, {}),
}));

vi.mock("../../netlify/functions/utils/auth-helper.js", () => ({
  authenticateRequest: async () => ({
    success: true,
    token: "test-token",
    user: { id: "user-1" },
  }),
}));

vi.mock("../../netlify/functions/utils/supabase-client.js", () => ({
  supabaseAdmin: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

describe("daily-protocol video transform", () => {
  let testTransforms;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import("../../netlify/functions/daily-protocol.js");
    testTransforms = mod.testTransforms;
  });

  it("derives youtube embed metadata for fallback exercises that only have a url", () => {
    const transformed = testTransforms.transformExercise({
      id: "pe-1",
      block_type: "morning_mobility",
      sequence_order: 1,
      prescribed_sets: 1,
      prescribed_duration_seconds: 600,
      ai_note: "Morning mobility flow",
      video_url: "https://www.youtube.com/watch?v=IWNnTJFwi3s",
    });

    expect(transformed.exercise.videoId).toBe("IWNnTJFwi3s");
    expect(transformed.exercise.videoUrl).toBe(
      "https://www.youtube.com/watch?v=IWNnTJFwi3s",
    );
    expect(transformed.exercise.thumbnailUrl).toBe(
      "https://img.youtube.com/vi/IWNnTJFwi3s/hqdefault.jpg",
    );
  });

  it("builds canonical acwr presentation text from the protocol value", () => {
    const acwr = testTransforms.buildAcwrPresentation(1.09, {
      acwr: { trainingDaysLogged: 21 },
    });

    expect(acwr).toEqual({
      value: 1.09,
      level: "sweet-spot",
      label: "sweet spot",
      text: "ACWR 1.09 · sweet spot",
    });
  });

  it("surfaces baseline-building acwr state when no ratio is available yet", () => {
    const acwr = testTransforms.buildAcwrPresentation(null, {
      acwr: { trainingDaysLogged: 7 },
    });

    expect(acwr).toEqual({
      value: null,
      level: "no-data",
      label: "baseline building",
      text: "ACWR baseline building (7/21 logged)",
    });
  });
});
