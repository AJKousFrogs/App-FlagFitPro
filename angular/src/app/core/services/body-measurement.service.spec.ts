/**
 * body-measurement.service.ts — `resource()` migration.
 *
 * `latestWeightKg` feeds PER-KG nutrition dosing, so the two behaviours this
 * service deliberately had before the migration are the ones pinned here:
 *
 *  1. a failed load KEEPS the previous history (dropping it would swap real
 *     macro targets for "add your weight" while a real weight is on record), and
 *  2. load failures are SILENT — `error` is for mutation failures only, because
 *     Stats renders it and an unavailable history is a real state, not
 *     something to alarm the athlete about.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { signal } from "@angular/core";
import { of, throwError } from "rxjs";

import {
  BodyMeasurementService,
  BodyMeasurement,
} from "./body-measurement.service";
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
const DAY = 86_400_000;
const at = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * DAY).toISOString();

function m(over: Partial<BodyMeasurement> = {}): BodyMeasurement {
  return {
    id: "m-1",
    weight: 82,
    height: null,
    bodyFat: null,
    muscleMass: null,
    timestamp: at(1),
    ...over,
  };
}

function setup(opts: { rows?: BodyMeasurement[]; get?: unknown } = {}) {
  const get = vi.fn(() =>
    opts.get === "throw"
      ? throwError(() => new Error("offline"))
      : of(opts.get ?? { success: true, data: { data: opts.rows ?? [m()] } }),
  );
  const post = vi.fn(() => of({ success: true, data: {} }));

  TestBed.configureTestingModule({
    providers: [
      BodyMeasurementService,
      { provide: ApiService, useValue: { get, post } },
      { provide: LoggerService, useValue: noopLogger },
      { provide: SupabaseService, useValue: { userId: signal("user-1") } },
    ],
  });
  return { service: TestBed.inject(BodyMeasurementService), get, post };
}

describe("BodyMeasurementService — lazy load", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("costs nothing until a screen asks", async () => {
    const { service, get } = setup();
    expect(service.latestWeightKg()).toBeNull();
    await settle();
    expect(get).not.toHaveBeenCalled();
  });

  it("loads on loadHistory() and exposes the latest weight", async () => {
    const { service, get } = setup({ rows: [m({ weight: 82 })] });
    service.loadHistory();
    await settle();
    expect(get).toHaveBeenCalledTimes(1);
    expect(service.latestWeightKg()).toBe(82);
  });

  it("loadHistory() always refetches — both screens call it on init", async () => {
    const { service, get } = setup();
    service.loadHistory();
    await settle();
    service.loadHistory();
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("orders history oldest→newest and takes the newest as latest", async () => {
    const { service } = setup({
      rows: [
        m({ id: "old", weight: 80, timestamp: at(30) }),
        m({ id: "new", weight: 84, timestamp: at(1) }),
      ],
    });
    service.loadHistory();
    await settle();
    expect(service.weightHistory().map((x) => x.id)).toEqual(["old", "new"]);
    expect(service.latestWeightKg()).toBe(84);
  });

  it("ignores rows with no usable weight (never fabricates one)", async () => {
    const { service } = setup({
      rows: [m({ id: "a", weight: null }), m({ id: "b", weight: 81 })],
    });
    service.loadHistory();
    await settle();
    expect(service.weightHistory()).toHaveLength(1);
    expect(service.latestWeightKg()).toBe(81);
  });

  it("no data at all → null, so per-kg targets correctly refuse to compute", async () => {
    const { service } = setup({ rows: [] });
    service.loadHistory();
    await settle();
    expect(service.latestWeightKg()).toBeNull();
  });
});

describe("BodyMeasurementService — a failed refetch must not drop the weight", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("KEEPS the last good weight when a reload fails", async () => {
    const { service, get } = setup({ rows: [m({ weight: 82 })] });
    service.loadHistory();
    await settle();
    expect(service.latestWeightKg()).toBe(82);

    get.mockReturnValue(throwError(() => new Error("offline")) as never);
    service.loadHistory();
    await settle();

    // Still 82. Dropping to null here would tell an athlete with a real weight
    // on record to "add your weight", and silently withdraw their macro targets.
    expect(service.latestWeightKg()).toBe(82);
  });

  it("stays SILENT on a load failure — error is for mutations only", async () => {
    const { service, get } = setup({ rows: [m()] });
    service.loadHistory();
    await settle();
    get.mockReturnValue(throwError(() => new Error("offline")) as never);
    service.loadHistory();
    await settle();
    expect(service.error()).toBeNull();
  });
});

describe("BodyMeasurementService — logWeight", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it.each([29.9, 300.1, 0, -5])(
    "rejects %s kg without calling the API",
    async (w) => {
      const { service, post } = setup();
      expect(await service.logWeight(w)).toBe(false);
      expect(service.error()).toContain("between 30 and 300");
      expect(post).not.toHaveBeenCalled();
    },
  );

  it.each([30, 82.5, 300])("accepts %s kg", async (w) => {
    const { service, post } = setup();
    expect(await service.logWeight(w)).toBe(true);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("resolves only AFTER the fresh weight is in (feeds per-kg dosing)", async () => {
    const { service, get } = setup({ rows: [m({ weight: 82 })] });
    service.loadHistory();
    await settle();
    expect(service.latestWeightKg()).toBe(82);

    get.mockReturnValue(
      of({ success: true, data: { data: [m({ weight: 85 })] } }) as never,
    );
    await service.logWeight(85);

    // No intervening settle — the caller shows this immediately.
    expect(service.latestWeightKg()).toBe(85);
  });

  it("surfaces a save failure and clears saving", async () => {
    const { service, post } = setup();
    post.mockReturnValue(throwError(() => new Error("nope")) as never);
    expect(await service.logWeight(82)).toBe(false);
    expect(service.error()).toContain("Couldn't save");
    expect(service.saving()).toBe(false);
  });
});
