import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LucideAngularModule, Sparkles, Lock, Check } from "lucide-angular";
import { PricingComponent } from "./pricing.component";
import { BillingService, type BillingStatus } from "../core/services/billing.service";
import { TeamMembershipService } from "../core/services/team-membership.service";
import { LoggerService } from "../core/services/logger.service";

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

function mount(opts: {
  status?: BillingStatus | null;
  role?: "owner" | "admin" | "player" | null;
  teamId?: string | null;
  startCheckout?: (
    tier: string,
    interval: string,
    teamId?: string,
  ) => Promise<{ url: string | null; error: string | null }>;
}) {
  const statusSignal = signal<BillingStatus | null>(opts.status ?? billingStatus());
  const startCheckout = vi.fn(
    opts.startCheckout ??
      (async () => ({ url: "https://checkout.stripe.example/cs_1", error: null })),
  );

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [PricingComponent, LucideAngularModule.pick({ Sparkles, Lock, Check })],
    providers: [
      {
        provide: BillingService,
        useValue: {
          status: statusSignal,
          loading: () => false,
          loadStatus: vi.fn(async () => statusSignal()),
          startCheckout,
        },
      },
      {
        provide: TeamMembershipService,
        useValue: {
          role: () => opts.role ?? null,
          teamId: () => opts.teamId ?? null,
        },
      },
      { provide: LoggerService, useValue: { error: vi.fn(), info: vi.fn() } },
    ],
  });

  const fixture = TestBed.createComponent(PricingComponent);
  fixture.detectChanges();
  return { fixture, startCheckout };
}

describe("PricingComponent", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("shows the trial countdown banner while unlocked", () => {
    const { fixture } = mount({ status: billingStatus({ trialDaysRemaining: 5 }) });
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("5");
    expect(txt).toContain("free 7-day trial");
  });

  it("shows the locked banner (expired-trial copy) once locked", () => {
    const { fixture } = mount({
      status: billingStatus({ tier: "trial_expired", locked: true }),
    });
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("Your trial has ended");
  });

  it("shows the suspended-payment copy distinctly", () => {
    const { fixture } = mount({ status: billingStatus({ tier: "suspended", locked: true }) });
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("didn't go through");
  });

  it("switches displayed price between monthly and annual", () => {
    const { fixture } = mount({});
    const c = fixture.componentInstance;
    const athletePro = c.tiers.find((t) => t.key === "athlete_pro")!;
    expect(c.priceFor(athletePro)).toBe(149.99); // defaults to annual
    c.interval.set("monthly");
    expect(c.priceFor(athletePro)).toBe(14.99);
  });

  it("marks the athlete's currently-applied tier", () => {
    const { fixture } = mount({ status: billingStatus({ appliedTiers: ["athlete_pro"] }) });
    const c = fixture.componentInstance;
    const athletePro = c.tiers.find((t) => t.key === "athlete_pro")!;
    const coachPro = c.tiers.find((t) => t.key === "coach_pro")!;
    expect(c.isCurrentTier(athletePro)).toBe(true);
    expect(c.isCurrentTier(coachPro)).toBe(false);
  });

  it("starts checkout for a non-team tier without a teamId", async () => {
    const { fixture, startCheckout } = mount({});
    const c = fixture.componentInstance;
    const athletePro = c.tiers.find((t) => t.key === "athlete_pro")!;
    await c.subscribe(athletePro);
    expect(startCheckout).toHaveBeenCalledWith("athlete_pro", "annual", undefined);
  });

  it("blocks a team-tier purchase for a non-owner/admin without calling checkout", async () => {
    const { fixture, startCheckout } = mount({ role: "player", teamId: "team-1" });
    const c = fixture.componentInstance;
    const teamDomestic = c.tiers.find((t) => t.key === "team_domestic")!;
    await c.subscribe(teamDomestic);
    expect(startCheckout).not.toHaveBeenCalled();
    expect(c.checkoutError()).toContain("owner/admin");
  });

  it("passes the current team's id for a team-tier purchase by an owner", async () => {
    const { fixture, startCheckout } = mount({ role: "owner", teamId: "team-42" });
    const c = fixture.componentInstance;
    const teamDomestic = c.tiers.find((t) => t.key === "team_domestic")!;
    await c.subscribe(teamDomestic);
    expect(startCheckout).toHaveBeenCalledWith("team_domestic", "annual", "team-42");
  });

  it("surfaces the backend's error when checkout can't start", async () => {
    const { fixture } = mount({
      startCheckout: async () => ({ url: null, error: "You must be 18 or older" }),
    });
    const c = fixture.componentInstance;
    const athletePro = c.tiers.find((t) => t.key === "athlete_pro")!;
    await c.subscribe(athletePro);
    expect(c.checkoutError()).toBe("You must be 18 or older");
    expect(c.startingCheckout()).toBeNull();
  });
});
