/**
 * Onboarding regression lock.
 *
 * P0: finish() must NEVER navigate when a critical write fails. Before this was
 * fixed, onboarding advanced past a failed write, dropping the user into the app
 * half-configured (no team, no profile) and stuck.
 *
 * Also locks the team+role flow: players join a team then save their profile and
 * land on /today; staff join (no athlete profile) and land on /staff.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Observable, Subject, of, throwError } from "rxjs";
import { provideRouter, Router } from "@angular/router";
import { OnboardingComponent } from "./onboarding.component";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";

const mockLogger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };

// One joinable team so the constructor's GET auto-selects it (single-team
// convenience), letting finish() run without a manual team pick in most tests.
const ONE_TEAM = {
  data: {
    teams: [
      { id: "team-1", name: "International Frogs", homeCity: "Ljubljana" },
    ],
  },
};

interface OnboardingApiMock {
  get: (...args: unknown[]) => Observable<unknown>;
  post: (...args: unknown[]) => Observable<unknown>;
}

async function mountComponent(apiMock: OnboardingApiMock) {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [OnboardingComponent],
    providers: [
      provideRouter([]),
      { provide: ApiService, useValue: apiMock },
      { provide: LoggerService, useValue: mockLogger },
    ],
  });
  return TestBed.createComponent(OnboardingComponent);
}

interface FinishComp {
  finish(): void;
  saving: () => boolean;
  error: () => string | null;
  setRole(v: string): void;
}

describe("OnboardingComponent finish()", () => {
  beforeEach(() => {
    mockLogger.error.mockClear();
  });

  it("player: joins team, saves profile, navigates to /today on success", async () => {
    const post = vi.fn(() => of({ success: true }));
    const fixture = await mountComponent({ get: () => of(ONE_TEAM), post });
    const navigate = vi
      .spyOn(TestBed.inject(Router), "navigate")
      .mockResolvedValue(true);

    (fixture.componentInstance as unknown as FinishComp).finish();
    await fixture.whenStable();

    // team-join first, then player-settings (player marks onboarding complete).
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[0][0]).toBe("/api/team-join");
    expect(post.mock.calls[1][0]).toBe("/api/player-settings");
    expect(navigate).toHaveBeenCalledWith(["/today"]);
  });

  it("staff: joins team, skips player-settings, navigates to /staff", async () => {
    const post = vi.fn(() => of({ success: true }));
    const fixture = await mountComponent({ get: () => of(ONE_TEAM), post });
    const comp = fixture.componentInstance as unknown as FinishComp;
    comp.setRole("coach");
    const navigate = vi
      .spyOn(TestBed.inject(Router), "navigate")
      .mockResolvedValue(true);

    comp.finish();
    await fixture.whenStable();

    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][0]).toBe("/api/team-join");
    expect(navigate).toHaveBeenCalledWith(["/staff"]);
  });

  it("does NOT navigate when the join write fails", async () => {
    vi.useFakeTimers();
    try {
      const post = vi.fn(() => throwError(() => new Error("network error")));
      const fixture = await mountComponent({ get: () => of(ONE_TEAM), post });
      const navigate = vi
        .spyOn(TestBed.inject(Router), "navigate")
        .mockResolvedValue(true);

      (fixture.componentInstance as unknown as FinishComp).finish();
      await vi.advanceTimersByTimeAsync(2100);
      await fixture.whenStable();

      expect(navigate).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("clears saving flag and shows error message on write failure", async () => {
    // finish() retries the write once after a 2s delay before surfacing the
    // error, so drive fake timers past the retry window.
    vi.useFakeTimers();
    try {
      const post = vi.fn(() => throwError(() => new Error("timeout")));
      const fixture = await mountComponent({ get: () => of(ONE_TEAM), post });
      const comp = fixture.componentInstance as unknown as FinishComp;

      comp.finish();
      await vi.advanceTimersByTimeAsync(2100);
      await fixture.whenStable();

      expect(comp.saving()).toBe(false);
      expect(comp.error()).toBeTruthy();
      expect(typeof comp.error()).toBe("string");
    } finally {
      vi.useRealTimers();
    }
  });

  it("re-entrancy guard: double-tap does NOT make two join calls", async () => {
    const subject = new Subject<unknown>();
    const post = vi.fn(() => subject);
    const fixture = await mountComponent({ get: () => of(ONE_TEAM), post });
    const comp = fixture.componentInstance as unknown as FinishComp;

    comp.finish();
    comp.finish();

    expect(post).toHaveBeenCalledTimes(1);
  });
});
