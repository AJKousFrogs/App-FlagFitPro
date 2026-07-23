import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { signal } from "@angular/core";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  LucideAngularModule,
  Flag,
  Home,
  Lock,
  Dumbbell,
  HeartPulse,
  LineChart,
  Menu,
  Plus,
  CalendarPlus,
} from "lucide-angular";
import { ShellComponent } from "./shell.component";
import { BillingService, type BillingStatus } from "../core/services/billing.service";
import { FreezeSignalService } from "../core/services/freeze-signal.service";

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

function mount(opts: { status?: BillingStatus | null; locked?: boolean }) {
  const initialStatus = "status" in opts ? opts.status : billingStatus();
  const statusSignal = signal<BillingStatus | null>(initialStatus);
  const loadStatus = vi.fn(async () => statusSignal());
  const freeze = new FreezeSignalService();
  freeze.setLocked(opts.locked ?? false);

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      ShellComponent,
      LucideAngularModule.pick({
        Flag,
        Home,
        Lock,
        Dumbbell,
        HeartPulse,
        LineChart,
        Menu,
        Plus,
        CalendarPlus,
      }),
    ],
    providers: [
      provideRouter([]),
      { provide: BillingService, useValue: { status: statusSignal, loadStatus } },
      { provide: FreezeSignalService, useValue: freeze },
    ],
  });

  const fixture = TestBed.createComponent(ShellComponent);
  fixture.detectChanges();
  return { fixture, freeze, loadStatus };
}

describe("ShellComponent frozen banner", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("hides the frozen banner when unlocked", () => {
    const { fixture } = mount({ locked: false });
    expect(fixture.nativeElement.querySelector(".frozen-banner")).toBeNull();
  });

  it("shows the frozen banner with trial-expired copy when locked", () => {
    const { fixture } = mount({
      status: billingStatus({ tier: "trial_expired", locked: true }),
      locked: true,
    });
    const banner = fixture.nativeElement.querySelector(".frozen-banner");
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain("7-day trial has ended");
  });

  it("shows distinct copy for a suspended subscription", () => {
    const { fixture } = mount({
      status: billingStatus({ tier: "suspended", locked: true }),
      locked: true,
    });
    const banner = fixture.nativeElement.querySelector(".frozen-banner");
    expect(banner.textContent).toContain("didn't go through");
  });

  it("adds the flash class briefly when a write is refused", () => {
    vi.useFakeTimers();
    const { fixture, freeze } = mount({ locked: true });
    freeze.flash();
    fixture.detectChanges();
    let banner = fixture.nativeElement.querySelector(".frozen-banner");
    expect(banner.classList.contains("flash")).toBe(true);

    vi.advanceTimersByTime(700);
    fixture.detectChanges();
    banner = fixture.nativeElement.querySelector(".frozen-banner");
    expect(banner.classList.contains("flash")).toBe(false);
    vi.useRealTimers();
  });

  it("loads billing status once when none is cached", () => {
    const { loadStatus } = mount({ status: null });
    expect(loadStatus).toHaveBeenCalledOnce();
  });
});
