/**
 * ScheduleService — resource error-state regression.
 *
 * Found 2026-07-18 while migrating qb-throwing.service.ts to `resource()`:
 * `resource.value()` THROWS while the resource is in an error state, so the
 * natural-looking `computed(() => resource.value() ?? null)` does NOT degrade
 * to null on a failed request — it propagates an exception into every
 * consumer that reads it.
 *
 * That matters more here than in the pilot: `snapshot()` is the schedule
 * spine. `nextEvent`, `currentPhase` and the density signals all derive from
 * it, and ~10 call sites (Today, gameday, periodization inputs, …) read those.
 * A transient /api/schedule failure — expired token, 500, offline — would
 * throw through all of them instead of showing an empty schedule.
 *
 * These tests fail against the pre-fix implementation.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { signal } from "@angular/core";
import { of, throwError } from "rxjs";

import { ScheduleService } from "./schedule.service";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";

const noopLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  success: () => {},
};

const settle = () => new Promise((r) => setTimeout(r, 0));

function setup(get: () => unknown) {
  const userId = signal<string | null>("user-1");
  TestBed.configureTestingModule({
    providers: [
      ScheduleService,
      { provide: ApiService, useValue: { get: vi.fn(get) } },
      { provide: LoggerService, useValue: noopLogger },
      { provide: SupabaseService, useValue: { userId } },
    ],
  });
  return TestBed.inject(ScheduleService);
}

describe("ScheduleService — failed load degrades instead of throwing", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("snapshot() returns null when the request fails (envelope error)", async () => {
    const service = setup(() => of({ success: false, error: "server error" }));
    await settle();
    expect(() => service.snapshot()).not.toThrow();
    expect(service.snapshot()).toBeNull();
  });

  it("snapshot() returns null when the request throws (network/offline)", async () => {
    const service = setup(() => throwError(() => new Error("offline")));
    await settle();
    expect(() => service.snapshot()).not.toThrow();
    expect(service.snapshot()).toBeNull();
  });

  it("the derived spine signals stay safe to read after a failure", async () => {
    const service = setup(() => of({ success: false, error: "server error" }));
    await settle();
    // Each of these is read by the engine / Today / gameday.
    expect(() => service.nextEvent()).not.toThrow();
    expect(() => service.lastEvent()).not.toThrow();
    expect(() => service.upcoming()).not.toThrow();
    expect(() => service.currentPhase()).not.toThrow();
    expect(() => service.density7d()).not.toThrow();
    expect(service.nextEvent()).toBeNull();
    expect(service.upcoming()).toEqual([]);
    // Falls back to the documented default rather than exploding.
    expect(service.currentPhase()).toBe("transition");
  });

  it("error() still reports the failure (degrading is not swallowing)", async () => {
    const service = setup(() => of({ success: false, error: "server error" }));
    await settle();
    expect(service.error()).toBeTruthy();
  });
});
