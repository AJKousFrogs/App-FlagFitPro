/**
 * event-travel.service.ts — `resource()` migration.
 *
 * This service is safety-relevant: `daysSinceArrival` feeds the V2.4
 * acclimatization guard and `arrivalDayTravelHours` feeds the arrival-day load
 * cap (a ≥3h same-day arrival caps the session to activation only). The
 * migration must not move either number, so the derivations are pinned here —
 * they had no tests before.
 *
 * It also pins the FAIL-OPEN behaviour on a failed load, which is pre-existing
 * and deliberately preserved: no travel data ⇒ null ⇒ no guard fires. That is
 * a safety/product call to change, not a refactor, so the test states it
 * explicitly rather than leaving it implied.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { signal } from "@angular/core";
import { of } from "rxjs";

import { EventTravelService, EventTravelLeg } from "./event-travel.service";
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
const HOUR = 3_600_000;
const DAY = 86_400_000;
const at = (msFromNow: number) =>
  new Date(Date.now() + msFromNow).toISOString();

function leg(over: Partial<EventTravelLeg> = {}): EventTravelLeg {
  return {
    id: "leg-1",
    competitionEventId: null,
    teamId: null,
    mode: "plane",
    departAt: at(-5 * HOUR),
    arriveAt: at(-1 * HOUR),
    timezoneDeltaHours: null,
    adaptationDay: null,
    overnightStay: false,
    notes: null,
    createdAt: at(-10 * DAY),
    updatedAt: at(-10 * DAY),
    ...over,
  };
}

function setup(opts: { legs?: EventTravelLeg[]; get?: unknown } = {}) {
  const get = vi.fn(() =>
    of(opts.get ?? { success: true, data: { legs: opts.legs ?? [] } }),
  );
  const post = vi.fn(() => of({ success: true, data: leg() }));
  const del = vi.fn(() => of({ success: true, data: { deleted: true } }));

  TestBed.configureTestingModule({
    providers: [
      EventTravelService,
      { provide: ApiService, useValue: { get, post, delete: del } },
      { provide: LoggerService, useValue: noopLogger },
      { provide: SupabaseService, useValue: { userId: signal("user-1") } },
    ],
  });

  return { service: TestBed.inject(EventTravelService), get, post, del };
}

describe("EventTravelService — eager load on the signed-in user", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("loads without anyone calling load() (the engine reads it every plan)", async () => {
    const { service, get } = setup({ legs: [leg()] });
    // Touch a derived signal, as the engine would.
    service.daysSinceArrival();
    await settle();
    expect(get).toHaveBeenCalledTimes(1);
    expect(service.legs()).toHaveLength(1);
  });

  it("load() forces a refetch for callers that want fresh data", async () => {
    const { service, get } = setup({ legs: [leg()] });
    service.legs();
    await settle();
    service.load();
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
  });
});

describe("EventTravelService — safety-relevant derivations", () => {
  beforeEach(() => TestBed.resetTestingModule());

  async function withLegs(legs: EventTravelLeg[]) {
    const { service } = setup({ legs });
    service.legs();
    await settle();
    return service;
  }

  it("arrival TODAY after a 4h flight → arrivalDayTravelHours = 4 (caps the day)", async () => {
    const s = await withLegs([
      leg({ departAt: at(-5 * HOUR), arriveAt: at(-1 * HOUR) }),
    ]);
    expect(s.daysSinceArrival()).toBe(0);
    expect(s.arrivalDayTravelHours()).toBe(4);
  });

  it("arrival two days ago → no arrival-day cap, but acclimatization still counts", async () => {
    const s = await withLegs([
      leg({
        departAt: at(-2 * DAY - 4 * HOUR),
        arriveAt: at(-2 * DAY),
      }),
    ]);
    expect(s.daysSinceArrival()).toBe(2);
    expect(s.arrivalDayTravelHours()).toBeNull();
  });

  it("picks the MOST RECENT past arrival when several exist", async () => {
    const s = await withLegs([
      leg({ id: "old", departAt: at(-9 * DAY), arriveAt: at(-8 * DAY) }),
      leg({ id: "recent", departAt: at(-4 * HOUR), arriveAt: at(-1 * HOUR) }),
    ]);
    expect(s.mostRecentArrival()?.id).toBe("recent");
    expect(s.daysSinceArrival()).toBe(0);
  });

  it("ignores a future leg for arrival maths", async () => {
    const s = await withLegs([
      leg({
        id: "future",
        departAt: at(2 * DAY),
        arriveAt: at(2 * DAY + HOUR),
      }),
    ]);
    expect(s.mostRecentArrival()).toBeNull();
    expect(s.daysSinceArrival()).toBeNull();
    expect(s.arrivalDayTravelHours()).toBeNull();
  });

  it("legToday / todayTravelHours cover a trip in progress right now", async () => {
    const s = await withLegs([
      leg({ departAt: at(-2 * HOUR), arriveAt: at(1 * HOUR) }),
    ]);
    expect(s.legToday()).not.toBeNull();
    expect(s.todayTravelHours()).toBe(3);
  });

  it("no travel on record → every derived signal is null", async () => {
    const s = await withLegs([]);
    expect(s.legToday()).toBeNull();
    expect(s.daysSinceArrival()).toBeNull();
    expect(s.arrivalDayTravelHours()).toBeNull();
    expect(s.todayTravelHours()).toBeNull();
  });
});

describe("EventTravelService — failed load stays FAIL-OPEN (pre-existing)", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("degrades to no-guard rather than throwing into the engine", async () => {
    const { service } = setup({ get: { success: false, error: "offline" } });
    service.legs();
    await settle();
    expect(() => service.legs()).not.toThrow();
    expect(() => service.daysSinceArrival()).not.toThrow();
    expect(() => service.arrivalDayTravelHours()).not.toThrow();
    // Fail-OPEN: the guards simply don't fire. Changing this is a safety call.
    expect(service.daysSinceArrival()).toBeNull();
    expect(service.arrivalDayTravelHours()).toBeNull();
    expect(service.error()).toBe("offline");
  });
});

describe("EventTravelService — mutations", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("create refetches the legs", async () => {
    const { service, get } = setup({ legs: [leg()] });
    service.legs();
    await settle();
    await service.create({ departAt: at(0), arriveAt: at(HOUR) });
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("remove refetches the legs", async () => {
    const { service, get } = setup({ legs: [leg()] });
    service.legs();
    await settle();
    await service.remove("leg-1");
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("a failed create rejects and surfaces the message", async () => {
    const { service, post } = setup();
    post.mockReturnValue(of({ success: false, error: "bad dates" }) as never);
    await expect(
      service.create({ departAt: at(0), arriveAt: at(-HOUR) }),
    ).rejects.toThrow("bad dates");
    expect(service.error()).toBe("bad dates");
  });
});
