/**
 * athlete-events.service.ts — `resource()` migration.
 *
 * The behaviour worth locking here is the lazy gate (this list is only read by
 * the Schedule screen, so it must not cost a request for athletes who never
 * open it) and the pre-resource contract that `load()` ALWAYS results in a
 * fetch — the Schedule screen calls it from ngOnInit on every mount.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { signal } from "@angular/core";
import { of } from "rxjs";

import { AthleteEventsService } from "./athlete-events.service";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { ScheduleService } from "./schedule.service";
import { SupabaseService } from "./supabase.service";
import { AthleteEvent } from "../models/athlete-event.models";

const noopLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  success: () => {},
};

const settle = () => new Promise((r) => setTimeout(r, 0));
const DAY = 86_400_000;
const iso = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * DAY).toISOString();

function event(over: Partial<AthleteEvent> = {}): AthleteEvent {
  return {
    id: "ae-1",
    category: "personal",
    kind: "gameday",
    title: "Test event",
    startsAt: iso(3),
    endsAt: null,
    expectedGameCount: 1,
    importance: "high",
    tier: null,
    location: null,
    venue: null,
    surface: null,
    notes: null,
    status: "scheduled",
    createdAt: iso(-10),
    updatedAt: iso(-10),
    ...over,
  };
}

function setup(opts: { get?: unknown } = {}) {
  const get = vi.fn(() =>
    of(opts.get ?? { success: true, data: { events: [event()] } }),
  );
  const post = vi.fn(() => of({ success: true, data: event() }));
  const put = vi.fn(() => of({ success: true, data: event() }));
  const del = vi.fn(() => of({ success: true, data: { deleted: true } }));
  const refresh = vi.fn(() => Promise.resolve());

  TestBed.configureTestingModule({
    providers: [
      AthleteEventsService,
      { provide: ApiService, useValue: { get, post, put, delete: del } },
      { provide: LoggerService, useValue: noopLogger },
      { provide: ScheduleService, useValue: { refresh } },
      { provide: SupabaseService, useValue: { userId: signal("user-1") } },
    ],
  });

  return {
    service: TestBed.inject(AthleteEventsService),
    get,
    post,
    put,
    del,
    refresh,
  };
}

describe("AthleteEventsService — lazy gate", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("costs nothing for an athlete who never opens the Schedule screen", async () => {
    const { service, get } = setup();
    expect(service.events()).toEqual([]);
    expect(service.upcoming()).toEqual([]);
    await settle();
    expect(get).not.toHaveBeenCalled();
  });

  it("loads once the screen asks", async () => {
    const { service, get } = setup();
    service.load();
    await settle();
    expect(get).toHaveBeenCalledTimes(1);
    expect(service.events()).toHaveLength(1);
  });

  it("load() always refetches — the screen calls it from every ngOnInit", async () => {
    const { service, get } = setup();
    service.load();
    await settle();
    service.load();
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("degrades to [] on a failed load instead of throwing", async () => {
    const { service } = setup({ get: { success: false, error: "nope" } });
    service.load();
    await settle();
    expect(() => service.events()).not.toThrow();
    expect(() => service.upcoming()).not.toThrow();
    expect(service.events()).toEqual([]);
    expect(service.error()).toBe("nope");
  });
});

describe("AthleteEventsService — upcoming filter", () => {
  beforeEach(() => TestBed.resetTestingModule());

  async function upcomingFor(events: AthleteEvent[]) {
    const { service } = setup({ get: { success: true, data: { events } } });
    service.load();
    await settle();
    return service.upcoming();
  }

  it("drops cancelled events", async () => {
    expect(await upcomingFor([event({ status: "cancelled" })])).toEqual([]);
  });

  it("drops events that already finished", async () => {
    expect(await upcomingFor([event({ startsAt: iso(-5) })])).toEqual([]);
  });

  it("keeps a multi-day event that is still running", async () => {
    const running = await upcomingFor([
      event({ startsAt: iso(-1), endsAt: iso(1) }),
    ]);
    expect(running).toHaveLength(1);
  });

  it("keeps a future event", async () => {
    expect(await upcomingFor([event({ startsAt: iso(3) })])).toHaveLength(1);
  });
});

describe("AthleteEventsService — mutations refresh the schedule spine", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("create refetches the list AND the schedule (engine depends on it)", async () => {
    const { service, get, refresh } = setup();
    service.load();
    await settle();
    await service.create({
      category: "personal",
      kind: "gameday",
      title: "New",
      startsAt: iso(5),
    });
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("update refetches both", async () => {
    const { service, get, refresh } = setup();
    service.load();
    await settle();
    await service.update("ae-1", { title: "Renamed" });
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("remove refetches both", async () => {
    const { service, get, refresh } = setup();
    service.load();
    await settle();
    await service.remove("ae-1");
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("a failed mutation rejects, surfaces the message, and does NOT refresh", async () => {
    const { service, post, refresh } = setup();
    post.mockReturnValue(of({ success: false, error: "clash" }) as never);
    await expect(
      service.create({
        category: "personal",
        kind: "gameday",
        title: "Bad",
        startsAt: iso(5),
      }),
    ).rejects.toThrow("clash");
    expect(service.error()).toBe("clash");
    expect(refresh).not.toHaveBeenCalled();
  });
});
