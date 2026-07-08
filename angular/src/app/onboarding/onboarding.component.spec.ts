/**
 * Onboarding P0 regression lock.
 *
 * Locks: finish() must NEVER navigate to /today when the API write fails.
 * Before this was fixed, onboarding advanced past a failed critical write,
 * dropping the athlete into the app with no profile (no position, no DOB,
 * no season calendar) and no way back in.
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Observable, Subject, throwError } from "rxjs";
import { provideRouter, Router } from "@angular/router";
import { OnboardingComponent } from "./onboarding.component";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";

const mockLogger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };

// Structural mock type: `post` may return any observable — a Subject (driven
// manually in the success/timing tests) or throwError()'s Observable<never>
// (the write-failure tests). Typed loosely so both call patterns type-check.
interface OnboardingApiMock {
  post: (...args: unknown[]) => Observable<unknown>;
}

function buildApiMock(observable: Subject<unknown>): OnboardingApiMock {
  return { post: vi.fn(() => observable) };
}

async function mountComponent(apiMock: OnboardingApiMock) {
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

describe("OnboardingComponent finish() — P0 write-failure guard", () => {
  beforeEach(() => mockLogger.error.mockClear());

  it("navigates to /today when the API write succeeds", async () => {
    const subject = new Subject<unknown>();
    const fixture = await mountComponent(buildApiMock(subject));
    const navigate = vi
      .spyOn(TestBed.inject(Router), "navigate")
      .mockResolvedValue(true);

    (fixture.componentInstance as unknown as { finish(): void }).finish?.();
    subject.next({ success: true });
    subject.complete();
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(["/today"]);
  });

  it("does NOT navigate when the API write fails", async () => {
    const apiMock = {
      post: vi.fn(() => throwError(() => new Error("network error"))),
    };
    const fixture = await mountComponent(apiMock);
    const navigate = vi
      .spyOn(TestBed.inject(Router), "navigate")
      .mockResolvedValue(true);

    (fixture.componentInstance as unknown as { finish(): void }).finish?.();
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
  });

  it("clears saving flag and shows error message on write failure", async () => {
    // finish() retries the write once after a 2s delay (transient cold-start
    // guard) before surfacing the error, so drive fake timers past the retry
    // window before asserting the failure state is reached.
    vi.useFakeTimers();
    try {
      const apiMock = {
        post: vi.fn(() => throwError(() => new Error("timeout"))),
      };
      const fixture = await mountComponent(apiMock);
      const comp = fixture.componentInstance as unknown as {
        finish(): void;
        saving: () => boolean;
        error: () => string | null;
      };

      comp.finish?.();
      await vi.advanceTimersByTimeAsync(2100);
      await fixture.whenStable();

      expect(comp.saving()).toBe(false);
      expect(comp.error()).toBeTruthy();
      expect(typeof comp.error()).toBe("string");
    } finally {
      vi.useRealTimers();
    }
  });

  it("re-entrancy guard: double-tap does NOT make two API calls", async () => {
    const subject = new Subject<unknown>();
    const apiMock = { post: vi.fn(() => subject) };
    const fixture = await mountComponent(apiMock);
    const comp = fixture.componentInstance as unknown as { finish(): void };

    comp.finish?.();
    comp.finish?.();

    expect(apiMock.post).toHaveBeenCalledTimes(1);
  });
});
