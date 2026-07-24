import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { signal } from "@angular/core";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { billingGuard } from "./billing.guard";
import { BillingService, type BillingStatus } from "../services/billing.service";

function billingStatus(over: Partial<BillingStatus> = {}): BillingStatus {
  return {
    tier: "trial",
    status: "trial",
    locked: false,
    trialDaysRemaining: 5,
    appliedTiers: [],
    subscription: null,
    hasIndividualBillingCustomer: false,
    ...over,
  };
}

function setup(opts: {
  status?: BillingStatus | null;
  loadStatus?: () => Promise<BillingStatus | null>;
}) {
  const statusSignal = signal<BillingStatus | null>(opts.status ?? null);
  const loadStatus = vi.fn(opts.loadStatus ?? (async () => statusSignal()));

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: BillingService, useValue: { status: statusSignal, loadStatus } },
    ],
  });

  return { loadStatus, statusSignal };
}

function runGuard() {
  return TestBed.runInInjectionContext(() => billingGuard({} as never, {} as never));
}

describe("billingGuard", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("never blocks navigation, even when the cached status is locked", async () => {
    setup({ status: billingStatus({ locked: true, tier: "trial_expired" }) });
    expect(await runGuard()).toBe(true);
  });

  it("never blocks navigation when unlocked", async () => {
    setup({ status: billingStatus({ locked: false }) });
    expect(await runGuard()).toBe(true);
  });

  it("fetches status once when none is cached yet", async () => {
    const { loadStatus } = setup({ status: null });
    expect(await runGuard()).toBe(true);
    expect(loadStatus).toHaveBeenCalledOnce();
  });

  it("does not re-fetch status once it's already cached", async () => {
    const { loadStatus } = setup({ status: billingStatus() });
    expect(await runGuard()).toBe(true);
    expect(loadStatus).not.toHaveBeenCalled();
  });
});
