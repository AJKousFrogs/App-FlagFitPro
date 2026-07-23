import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BillingService } from "./billing.service";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";

function mount(overrides: Partial<Record<"get" | "post", ReturnType<typeof vi.fn>>> = {}) {
  const get = overrides.get ?? vi.fn();
  const post = overrides.post ?? vi.fn();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: ApiService, useValue: { get, post } },
      { provide: LoggerService, useValue: { error: vi.fn(), info: vi.fn() } },
    ],
  });
  return TestBed.inject(BillingService);
}

describe("BillingService", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("loads and stores billing status from the wrapped API response", async () => {
    const status = {
      tier: "trial",
      status: "trial",
      locked: false,
      trialDaysRemaining: 4,
      appliedTiers: [],
      subscription: null,
      hasIndividualBillingCustomer: false,
    };
    const get = vi.fn(() => of({ success: true, data: status }));
    const service = mount({ get });

    const result = await service.loadStatus();

    expect(get).toHaveBeenCalledWith("/api/billing/status");
    expect(result).toEqual(status);
    expect(service.status()).toEqual(status);
    expect(service.loading()).toBe(false);
  });

  it("returns null and logs on a failed status load, without leaving loading stuck true", async () => {
    const get = vi.fn(() => throwError(() => new Error("network down")));
    const service = mount({ get });

    const result = await service.loadStatus();

    expect(result).toBeNull();
    expect(service.status()).toBeNull();
    expect(service.loading()).toBe(false);
  });

  it("resolves the checkout URL from the wrapped response", async () => {
    const post = vi.fn(() =>
      of({ success: true, data: { checkoutUrl: "https://checkout.stripe.example/cs_1" } }),
    );
    const service = mount({ post });

    const { url, error } = await service.startCheckout("athlete_pro", "monthly");

    expect(post).toHaveBeenCalledWith("/api/billing/checkout", {
      tier: "athlete_pro",
      interval: "monthly",
    });
    expect(url).toBe("https://checkout.stripe.example/cs_1");
    expect(error).toBeNull();
  });

  it("includes teamId only for team-tier checkout", async () => {
    const post = vi.fn(() =>
      of({ success: true, data: { checkoutUrl: "https://checkout.stripe.example/cs_2" } }),
    );
    const service = mount({ post });

    await service.startCheckout("team_domestic", "annual", "team-123");

    expect(post).toHaveBeenCalledWith("/api/billing/checkout", {
      tier: "team_domestic",
      interval: "annual",
      teamId: "team-123",
    });
  });

  it("surfaces the backend's error when checkout can't start", async () => {
    const post = vi.fn(() =>
      of({ success: false, error: "You must be 18 or older for an individual plan" }),
    );
    const service = mount({ post });

    const { url, error } = await service.startCheckout("athlete_pro", "monthly");

    expect(url).toBeNull();
    expect(error).toBe("You must be 18 or older for an individual plan");
  });

  it("falls back to a generic message when checkout throws", async () => {
    const post = vi.fn(() => throwError(() => new Error("boom")));
    const service = mount({ post });

    const { url, error } = await service.startCheckout("athlete_pro", "monthly");

    expect(url).toBeNull();
    expect(error).toBe("Couldn't start checkout — try again.");
  });

  it("resolves the billing portal URL, omitting teamId for an individual subscription", async () => {
    const post = vi.fn(() =>
      of({ success: true, data: { portalUrl: "https://billing.stripe.example/p_1" } }),
    );
    const service = mount({ post });

    const { url, error } = await service.openPortal();

    expect(post).toHaveBeenCalledWith("/api/billing/portal", {});
    expect(url).toBe("https://billing.stripe.example/p_1");
    expect(error).toBeNull();
  });

  it("passes teamId through to the portal request when managing team billing", async () => {
    const post = vi.fn(() =>
      of({ success: true, data: { portalUrl: "https://billing.stripe.example/p_2" } }),
    );
    const service = mount({ post });

    await service.openPortal("team-456");

    expect(post).toHaveBeenCalledWith("/api/billing/portal", { teamId: "team-456" });
  });

  it("falls back to a generic message when opening the portal throws", async () => {
    const post = vi.fn(() => throwError(() => new Error("boom")));
    const service = mount({ post });

    const { url, error } = await service.openPortal();

    expect(url).toBeNull();
    expect(error).toBe("Couldn't open billing portal — try again.");
  });
});
