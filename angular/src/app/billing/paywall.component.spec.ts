import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { signal } from "@angular/core";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LucideAngularModule, Lock } from "lucide-angular";
import { PaywallComponent } from "./paywall.component";
import { BillingService, type BillingStatus } from "../core/services/billing.service";

function billingStatus(over: Partial<BillingStatus> = {}): BillingStatus {
  return {
    tier: "trial_expired",
    status: "trial_expired",
    locked: true,
    trialDaysRemaining: 0,
    appliedTiers: [],
    subscription: null,
    hasIndividualBillingCustomer: false,
    ...over,
  };
}

function mount(status: BillingStatus | null) {
  const statusSignal = signal<BillingStatus | null>(status);
  const loadStatus = vi.fn(async () => statusSignal());

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [PaywallComponent, LucideAngularModule.pick({ Lock })],
    providers: [
      provideRouter([]),
      { provide: BillingService, useValue: { status: statusSignal, loadStatus } },
    ],
  });

  const fixture = TestBed.createComponent(PaywallComponent);
  fixture.detectChanges();
  return { fixture, loadStatus };
}

describe("PaywallComponent", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("fetches status on init when none is cached yet", () => {
    const { loadStatus } = mount(null);
    expect(loadStatus).toHaveBeenCalledOnce();
  });

  it("does not re-fetch when a status is already cached", () => {
    const { loadStatus } = mount(billingStatus());
    expect(loadStatus).not.toHaveBeenCalled();
  });

  it("shows trial-expired copy for a locked trial", () => {
    const { fixture } = mount(billingStatus({ tier: "trial_expired" }));
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("Your trial has ended");
    expect(txt).not.toContain("Payment needed");
  });

  it("shows suspended-payment copy for a suspended subscription", () => {
    const { fixture } = mount(billingStatus({ tier: "suspended" }));
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("Payment needed");
    expect(txt).not.toContain("Your trial has ended");
  });

  it("offers links to plans and billing management", () => {
    const { fixture } = mount(billingStatus());
    const links = Array.from(
      fixture.nativeElement.querySelectorAll("a"),
    ) as HTMLAnchorElement[];
    const hrefs = links.map((a) => a.getAttribute("routerLink"));
    expect(hrefs).toContain("/billing");
    expect(hrefs).toContain("/settings");
  });
});
