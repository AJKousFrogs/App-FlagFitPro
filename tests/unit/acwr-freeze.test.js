/**
 * Unit tests for resolveAcwrEvaluationDate — the acwr_frozen wiring.
 *
 * A paused account with account_pause_requests.acwr_frozen=true must freeze
 * the ACWR evaluation date at the pause moment, never let it silently
 * advance (and zero-fill/decay) through the paused gap. See calc-readiness.js
 * and compute-acwr.js, the two callers.
 */
import { describe, it, expect } from "vitest";
import { resolveAcwrEvaluationDate } from "../../netlify/functions/utils/acwr.js";

function fakeSupabase(pauseRow) {
  return {
    from(table) {
      if (table !== "account_pause_requests") {
        throw new Error(`Unexpected table: ${table}`);
      }
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        order() {
          return this;
        },
        limit() {
          return this;
        },
        maybeSingle: async () => ({ data: pauseRow, error: null }),
      };
    },
  };
}

describe("resolveAcwrEvaluationDate", () => {
  it("returns the requested date unchanged when there is no active pause", async () => {
    const requested = new Date("2026-07-23T00:00:00.000Z");
    const result = await resolveAcwrEvaluationDate(
      fakeSupabase(null),
      "user-1",
      requested,
    );
    expect(result.getTime()).toBe(requested.getTime());
  });

  it("freezes at paused_at when an active, ACWR-frozen pause predates the requested date", async () => {
    const requested = new Date("2026-07-23T00:00:00.000Z");
    const pausedAt = new Date("2026-07-01T00:00:00.000Z");
    const result = await resolveAcwrEvaluationDate(
      fakeSupabase({ paused_at: pausedAt.toISOString() }),
      "user-1",
      requested,
    );
    expect(result.getTime()).toBe(pausedAt.getTime());
  });

  it("never moves evaluation LATER than requested, even if paused_at is in the future", async () => {
    const requested = new Date("2026-07-01T00:00:00.000Z");
    const pausedAt = new Date("2026-07-23T00:00:00.000Z");
    const result = await resolveAcwrEvaluationDate(
      fakeSupabase({ paused_at: pausedAt.toISOString() }),
      "user-1",
      requested,
    );
    expect(result.getTime()).toBe(requested.getTime());
  });

  it("returns the requested date unchanged when userId is missing", async () => {
    const requested = new Date("2026-07-23T00:00:00.000Z");
    const result = await resolveAcwrEvaluationDate(
      fakeSupabase({ paused_at: "2026-07-01T00:00:00.000Z" }),
      undefined,
      requested,
    );
    expect(result.getTime()).toBe(requested.getTime());
  });
});
