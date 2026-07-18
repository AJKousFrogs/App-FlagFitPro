/**
 * qb-throwing.service.ts — the `resource()` migration pilot.
 *
 * Two jobs:
 *  1. Lock the CONVENTION the remaining hand-rolled services will copy —
 *     especially the `params: () => undefined` idle-gate, which is the whole
 *     reason a non-QB never pays for this lane. If a future Angular version
 *     changes that semantic, this suite fails loudly instead of the app
 *     quietly firing a request for every athlete.
 *  2. Cover `monitor` — the actual sports-science logic in here (ramp +
 *     arm-feeling flags, QB_THROW_MONITOR) which had NO tests before this.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { signal } from "@angular/core";
import { of } from "rxjs";

import { QbThrowingService } from "./qb-throwing.service";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import {
  QbThrowingData,
  QbThrowingSession,
} from "../models/qb-throwing.models";

const noopLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  success: () => {},
};

const DAY = 86_400_000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY).toISOString();

function session(
  overrides: Partial<QbThrowingSession> = {},
): QbThrowingSession {
  return {
    id: "s-1",
    sessionDate: daysAgo(1),
    sessionType: "practice",
    totalThrows: 50,
    shortThrows: null,
    mediumThrows: null,
    longThrows: null,
    location: null,
    armFeelingBefore: 5,
    armFeelingAfter: 5,
    preThrowingWarmupDone: true,
    postThrowingArmCareDone: true,
    iceApplied: false,
    notes: null,
    ...overrides,
  };
}

function data(overrides: Partial<QbThrowingData> = {}): QbThrowingData {
  return {
    recentSessions: [],
    weeklyStats: [],
    progression: {
      currentWeekAvg: 0,
      targetThrows: 0,
      progressionPhase: "base",
      daysSinceLastSession: 0,
      weeklyCompliancePct: 0,
      recommendation: "",
    },
    ...overrides,
  };
}

/** Let the resource's async loader settle. */
const settle = () => new Promise((r) => setTimeout(r, 0));

function setup(opts: { userId?: string | null; get?: unknown } = {}) {
  const userId = signal<string | null>(
    opts.userId === undefined ? "user-1" : opts.userId,
  );
  const get = vi.fn(() => of(opts.get ?? { success: true, data: data() }));
  const post = vi.fn(() => of({ success: true, data: {} }));

  TestBed.configureTestingModule({
    providers: [
      QbThrowingService,
      { provide: ApiService, useValue: { get, post } },
      { provide: LoggerService, useValue: noopLogger },
      { provide: SupabaseService, useValue: { userId } },
    ],
  });

  return { service: TestBed.inject(QbThrowingService), get, post, userId };
}

describe("QbThrowingService — resource() gating", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("does NOT fetch until the lane is enabled (params → undefined stays idle)", async () => {
    const { service, get } = setup();
    // Touching the signals must not be what triggers a load.
    expect(service.data()).toBeNull();
    expect(service.loading()).toBe(false);
    await settle();
    expect(get).not.toHaveBeenCalled();
  });

  it("fetches once enabled, and exposes the data", async () => {
    const { service, get } = setup({
      get: { success: true, data: data({ recentSessions: [session()] }) },
    });
    service.enable();
    await settle();
    expect(get).toHaveBeenCalledTimes(1);
    expect(service.data()?.recentSessions).toHaveLength(1);
  });

  it("enable() is idempotent — repeated calls do not re-fetch", async () => {
    const { service, get } = setup();
    service.enable();
    await settle();
    service.enable();
    service.enable();
    await settle();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("stays idle with no signed-in user, and does not blow up", async () => {
    const { service, get } = setup({ userId: null });
    service.enable();
    await settle();
    // params is null (not undefined) so the loader runs, but short-circuits.
    expect(service.data()).toBeNull();
    expect(get).not.toHaveBeenCalled();
  });

  it("surfaces a failed load through the single error signal", async () => {
    const { service } = setup({
      get: { success: false, error: "backend exploded" },
    });
    service.enable();
    await settle();
    expect(service.error()).toBe("backend exploded");
    expect(service.data()).toBeNull();
  });
});

describe("QbThrowingService — mutation stays imperative", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("logSession posts and triggers a reload of the read resource", async () => {
    const { service, get, post } = setup();
    service.enable();
    await settle();
    expect(get).toHaveBeenCalledTimes(1);

    await service.logSession({ sessionType: "practice", totalThrows: 40 });
    await settle();

    expect(post).toHaveBeenCalledTimes(1);
    // The write refetches the read side rather than patching it by hand.
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("a failed logSession rethrows and surfaces the message", async () => {
    const { service, post } = setup();
    post.mockReturnValue(
      of({ success: false, error: "could not save" }) as never,
    );
    await expect(
      service.logSession({ sessionType: "practice", totalThrows: 40 }),
    ).rejects.toThrow("could not save");
    expect(service.error()).toBe("could not save");
  });

  it("saving flips false again after a failure", async () => {
    const { service, post } = setup();
    post.mockReturnValue(of({ success: false, error: "nope" }) as never);
    await service
      .logSession({ sessionType: "practice", totalThrows: 10 })
      .catch(() => null);
    expect(service.saving()).toBe(false);
  });
});

describe("QbThrowingService — monitor (QB_THROW_MONITOR flags)", () => {
  beforeEach(() => TestBed.resetTestingModule());

  async function monitorFor(sessions: QbThrowingSession[]) {
    const { service } = setup({
      get: { success: true, data: data({ recentSessions: sessions }) },
    });
    service.enable();
    await settle();
    return service.monitor();
  }

  it("no sessions → no flags", async () => {
    expect((await monitorFor([])).flags).toEqual([]);
  });

  it("a steady week raises no ramp flag", async () => {
    const flags = (
      await monitorFor([
        session({ sessionDate: daysAgo(1), totalThrows: 50 }),
        session({ sessionDate: daysAgo(9), totalThrows: 50 }),
      ])
    ).flags;
    expect(flags.filter((f) => /jumped/i.test(f))).toHaveLength(0);
  });

  it("flags a week-over-week throw-volume spike", async () => {
    const flags = (
      await monitorFor([
        session({ sessionDate: daysAgo(1), totalThrows: 200 }),
        session({ sessionDate: daysAgo(9), totalThrows: 50 }),
      ])
    ).flags;
    expect(flags.some((f) => /jumped/i.test(f))).toBe(true);
  });

  it("flags an in-session arm-feeling falloff", async () => {
    const flags = (
      await monitorFor([session({ armFeelingBefore: 8, armFeelingAfter: 3 })])
    ).flags;
    expect(flags.some((f) => /arm feeling dropped/i.test(f))).toBe(true);
  });

  it("does not flag a falloff when the after-value is missing", async () => {
    const flags = (
      await monitorFor([
        session({ armFeelingBefore: 8, armFeelingAfter: null }),
      ])
    ).flags;
    expect(flags.some((f) => /arm feeling dropped/i.test(f))).toBe(false);
  });
});
