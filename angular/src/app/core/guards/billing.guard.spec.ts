import { TestBed } from "@angular/core/testing";
import { Router, provideRouter, type RouterStateSnapshot } from "@angular/router";
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

function stateFor(url: string): RouterStateSnapshot {
  return { url } as RouterStateSnapshot;
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

function runGuard(url: string) {
  return TestBed.runInInjectionContext(() =>
    billingGuard({} as never, stateFor(url)),
  );
}

describe("billingGuard", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("allows navigation to exempt paths without checking billing status", async () => {
    const { loadStatus } = setup({ status: billingStatus({ locked: true }) });
    const result = await runGuard("/settings");
    expect(result).toBe(true);
    expect(loadStatus).not.toHaveBeenCalled();
  });

  it("allows navigation to /billing and /paywall even when locked", async () => {
    setup({ status: billingStatus({ locked: true }) });
    expect(await runGuard("/billing")).toBe(true);
    expect(await runGuard("/paywall")).toBe(true);
  });

  it("allows navigation to a non-exempt route when unlocked", async () => {
    setup({ status: billingStatus({ locked: false }) });
    const result = await runGuard("/dashboard");
    expect(result).toBe(true);
  });

  it("redirects to /paywall when the cached status is locked", async () => {
    setup({ status: billingStatus({ locked: true, tier: "trial_expired" }) });
    const result = await runGuard("/dashboard");
    expect(result).not.toBe(true);
    const tree = result as ReturnType<Router["createUrlTree"]>;
    expect(tree.toString()).toBe("/paywall");
  });

  it("fetches status when none is cached yet, then decides", async () => {
    const { loadStatus } = setup({
      status: null,
      loadStatus: async () => billingStatus({ locked: true }),
    });
    const result = await runGuard("/dashboard");
    expect(loadStatus).toHaveBeenCalledOnce();
    expect(result).not.toBe(true);
  });
});
