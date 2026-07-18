/**
 * event-games.service.ts — second `resource()` migration.
 *
 * Written by following `core/services/README.md`, deliberately, to check the
 * convention generalizes past the qb-throwing pilot. The difference that
 * matters: this resource is keyed on an ARBITRARY id (a competition_event)
 * rather than the signed-in user, so the key changes during normal use as the
 * athlete's next event changes.
 *
 * `games` degrading to [] rather than throwing is the load-bearing part —
 * TournamentPlanService, the game-day timeline and the supplements caffeine
 * card all read it directly.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { of } from "rxjs";

import { EventGamesService } from "./event-games.service";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { EventGame } from "../models/tournament-plan.models";

const noopLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  success: () => {},
};

const settle = () => new Promise((r) => setTimeout(r, 0));

function game(overrides: Partial<EventGame> = {}): EventGame {
  return {
    id: "g-1",
    competitionEventId: "ev-1",
    gameNumber: 1,
    gameDate: "2026-08-01",
    kickoffTime: "11:00:00",
    ...overrides,
  } as EventGame;
}

function setup(opts: { get?: unknown } = {}) {
  const get = vi.fn(() =>
    of(opts.get ?? { success: true, data: { games: [game()] } }),
  );
  const post = vi.fn(() => of({ success: true, data: { games: [game()] } }));
  const patch = vi.fn(() => of({ success: true, data: game() }));
  const del = vi.fn(() => of({ success: true, data: { deleted: true } }));

  TestBed.configureTestingModule({
    providers: [
      EventGamesService,
      { provide: ApiService, useValue: { get, post, patch, delete: del } },
      { provide: LoggerService, useValue: noopLogger },
    ],
  });

  return {
    service: TestBed.inject(EventGamesService),
    get,
    post,
    patch,
    del,
  };
}

describe("EventGamesService — resource() keyed on an event id", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("stays idle until an event is selected", async () => {
    const { service, get } = setup();
    expect(service.games()).toEqual([]);
    await settle();
    expect(get).not.toHaveBeenCalled();
  });

  it("loads once an event is selected", async () => {
    const { service, get } = setup();
    service.load("ev-1");
    await settle();
    expect(get).toHaveBeenCalledTimes(1);
    expect(service.games()).toHaveLength(1);
  });

  it("re-selecting the SAME event does not re-fetch", async () => {
    const { service, get } = setup();
    service.load("ev-1");
    await settle();
    service.load("ev-1");
    service.load("ev-1");
    await settle();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("switching to a DIFFERENT event re-fetches", async () => {
    const { service, get } = setup();
    service.load("ev-1");
    await settle();
    service.load("ev-2");
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("an empty id returns to idle with no games", async () => {
    const { service } = setup();
    service.load("ev-1");
    await settle();
    service.load("");
    await settle();
    expect(service.games()).toEqual([]);
  });

  it("games() degrades to [] on a failed load rather than throwing", async () => {
    const { service } = setup({ get: { success: false, error: "boom" } });
    service.load("ev-1");
    await settle();
    expect(() => service.games()).not.toThrow();
    expect(service.games()).toEqual([]);
    expect(() => service.sortedGames()).not.toThrow();
    expect(service.error()).toBe("boom");
  });
});

describe("EventGamesService — mutations", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("bulkSet publishes the response directly without a refetch", async () => {
    const { service, get, post } = setup();
    const saved = await service.bulkSet("ev-1", [
      { gameNumber: 1, gameDate: "2026-08-01", kickoffTime: "11:00" },
    ]);
    await settle();
    expect(post).toHaveBeenCalledTimes(1);
    expect(saved).toHaveLength(1);
    expect(service.games()).toHaveLength(1);
    // The POST response was authoritative — no wasted GET.
    expect(get).not.toHaveBeenCalled();
  });

  it("create refetches, because a single-row response isn't the whole list", async () => {
    const { service, get, post } = setup();
    post.mockReturnValue(of({ success: true, data: game() }) as never);
    service.load("ev-1");
    await settle();
    expect(get).toHaveBeenCalledTimes(1);

    await service.create("ev-1", {
      gameNumber: 2,
      gameDate: "2026-08-01",
      kickoffTime: "13:00",
    });
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("update refetches", async () => {
    const { service, get } = setup();
    service.load("ev-1");
    await settle();
    await service.update("g-1", {
      gameNumber: 1,
      gameDate: "2026-08-01",
      kickoffTime: "12:00",
    });
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("remove refetches", async () => {
    const { service, get } = setup();
    service.load("ev-1");
    await settle();
    await service.remove("g-1");
    await settle();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("a failed mutation rejects and surfaces the message", async () => {
    const { service, post } = setup();
    post.mockReturnValue(of({ success: false, error: "no room" }) as never);
    await expect(service.bulkSet("ev-1", [])).rejects.toThrow("no room");
    expect(service.error()).toBe("no room");
  });
});
