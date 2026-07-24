import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";
import { signal } from "@angular/core";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LucideAngularModule, Bell, Check, Flag } from "lucide-angular";
import { CompetitionComponent } from "./competition.component";
import { ApiService } from "../core/services/api.service";
import { ScheduleService } from "../core/services/schedule.service";
import { LoggerService } from "../core/services/logger.service";

const PENDING = [{ competition_event_id: "ev-1", competition_name: "Adria Bowl" }];

function sampleGames() {
  return [
    {
      id: "game-1",
      gameNumber: 1,
      gameDate: "2026-07-20",
      opponent: "Lizzards",
      expectedDurationMinutes: 40,
      status: "final",
    },
    {
      id: "game-2",
      gameNumber: 2,
      gameDate: "2026-07-20",
      opponent: "Nuola",
      expectedDurationMinutes: 40,
      status: "final",
    },
  ];
}

function mount(opts: {
  get?: (url: string) => ReturnType<typeof of>;
  post?: ReturnType<typeof vi.fn>;
}) {
  const get = vi.fn((url: string) => {
    if (opts.get) return opts.get(url);
    if (url.startsWith("/api/event-participation")) {
      return of({ success: true, data: { pending: PENDING } });
    }
    if (url.startsWith("/api/event-games")) {
      return of({ success: true, data: sampleGames() });
    }
    return of({ success: true, data: null });
  });
  const post = opts.post ?? vi.fn(() => of({ success: true, data: {} }));

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [CompetitionComponent, LucideAngularModule.pick({ Bell, Check, Flag })],
    providers: [
      provideRouter([]),
      { provide: ApiService, useValue: { get, post } },
      {
        provide: ScheduleService,
        useValue: {
          upcoming: signal([]),
          nextEvent: signal(null),
          loading: signal(false),
        },
      },
      { provide: LoggerService, useValue: { error: vi.fn() } },
    ],
  });

  const fixture = TestBed.createComponent(CompetitionComponent);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, get, post };
}

describe("CompetitionComponent — per-game actuals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches the event's games on entering per-game mode", async () => {
    const { component } = mount({});
    await Promise.resolve();

    component.enterPerGameMode();
    await Promise.resolve();

    expect(component.perGameMode()).toBe(true);
    expect(component.eventGames()).toHaveLength(2);
  });

  it("does not refetch games if already loaded", async () => {
    const { component, get } = mount({});
    await Promise.resolve();
    component.enterPerGameMode();
    await Promise.resolve();
    const callsAfterFirst = get.mock.calls.length;

    component.exitPerGameMode();
    component.enterPerGameMode();

    expect(get.mock.calls.length).toBe(callsAfterFirst);
  });

  it("selectGame resets attended/RPE defaults", async () => {
    const { component } = mount({});
    await Promise.resolve();
    component.enterPerGameMode();
    await Promise.resolve();

    component.gameAttended.set(false);
    component.gameRpe.set(3);
    component.selectGame("game-1");

    expect(component.selectedGameId()).toBe("game-1");
    expect(component.gameAttended()).toBe(true);
    expect(component.gameRpe()).toBe(7);
    expect(component.selectedGame()?.id).toBe("game-1");
  });

  it("logs a specific game with gameId + gamesPlayed derived from attended", async () => {
    const post = vi.fn(() => of({ success: true, data: {} }));
    const { component } = mount({ post });
    await Promise.resolve();
    component.enterPerGameMode();
    await Promise.resolve();
    component.selectGame("game-2");
    component.gameRpe.set(6);

    component.logGame();
    await Promise.resolve();

    expect(post).toHaveBeenCalledWith("/api/event-participation", {
      competitionEventId: "ev-1",
      gameId: "game-2",
      attended: true,
      gamesPlayed: 1,
      avgRpe: 6,
    });
    expect(component.loggedGameIds().has("game-2")).toBe(true);
    // Selection clears after a successful log, ready for the next game.
    expect(component.selectedGameId()).toBeNull();
  });

  it("logs a not-played game with gamesPlayed 0 and no avgRpe", async () => {
    const post = vi.fn(() => of({ success: true, data: {} }));
    const { component } = mount({ post });
    await Promise.resolve();
    component.enterPerGameMode();
    await Promise.resolve();
    component.selectGame("game-1");
    component.gameAttended.set(false);

    component.logGame();
    await Promise.resolve();

    expect(post).toHaveBeenCalledWith("/api/event-participation", {
      competitionEventId: "ev-1",
      gameId: "game-1",
      attended: false,
      gamesPlayed: 0,
      avgRpe: undefined,
    });
  });

  it("surfaces a logGame failure without marking the game logged", async () => {
    const post = vi.fn(() => throwError(() => new Error("nope")));
    const { component } = mount({ post });
    await Promise.resolve();
    component.enterPerGameMode();
    await Promise.resolve();
    component.selectGame("game-1");

    component.logGame();
    await Promise.resolve();

    expect(component.loggedGameIds().has("game-1")).toBe(false);
    expect(component.gamesError()).toContain("Could not log this game");
  });

  it("formats a game label with its opponent", async () => {
    const { component } = mount({});
    expect(
      component.gameLabel({
        id: "g",
        gameNumber: 3,
        gameDate: "2026-07-20",
        opponent: "Frogs",
        expectedDurationMinutes: 40,
        status: "final",
      }),
    ).toBe("Game 3 vs Frogs");
    expect(
      component.gameLabel({
        id: "g",
        gameNumber: 3,
        gameDate: "2026-07-20",
        opponent: null,
        expectedDurationMinutes: 40,
        status: "final",
      }),
    ).toBe("Game 3");
  });
});
