import { TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LucideAngularModule, Camera, ChevronRight } from "lucide-angular";
import { SettingsComponent } from "./settings.component";
import { ApiService } from "../core/services/api.service";
import { SupabaseService } from "../core/services/supabase.service";
import { LoggerService } from "../core/services/logger.service";
import { PrivacySettingsService } from "../core/services/privacy-settings.service";
import { PeriodizationService } from "../core/services/periodization.service";
import { RecoveryService } from "../core/services/recovery.service";
import { IdentityService } from "../core/services/identity.service";
import {
  BillingService,
  type BillingStatus,
} from "../core/services/billing.service";

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
  loadStatus?: () => Promise<BillingStatus | null>;
  openPortal?: () => Promise<{ url: string | null; error: string | null }>;
}) {
  const statusSignal = signal<BillingStatus | null>(opts.status ?? null);
  const loadStatus = vi.fn(
    opts.loadStatus ??
      (async () => {
        // Default: don't clobber whatever status the test seeded — only
        // set one if the test genuinely started from nothing.
        if (!statusSignal()) statusSignal.set(billingStatus());
        return statusSignal();
      }),
  );
  const openPortal = vi.fn(
    opts.openPortal ?? (async () => ({ url: null, error: null })),
  );

  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      SettingsComponent,
      LucideAngularModule.pick({ Camera, ChevronRight }),
    ],
    providers: [
      provideRouter([]),
      {
        provide: ApiService,
        useValue: {
          get: () => of({ success: true, data: {} }),
          post: () => of({ success: true, data: {} }),
          put: () => of({ success: true, data: {} }),
        },
      },
      {
        provide: SupabaseService,
        useValue: {
          currentUser: () => ({
            email: "athlete@example.com",
            user_metadata: { full_name: "Test Athlete" },
          }),
          updateUser: async () => ({ error: null }),
          refreshCurrentUser: async () => undefined,
          resetPassword: async () => ({ error: null }),
        },
      },
      { provide: LoggerService, useValue: { error: () => undefined, info: () => undefined } },
      {
        provide: PrivacySettingsService,
        useValue: {
          loadSettings: async () => undefined,
          settings: () => null,
          aiProcessingEnabled: () => false,
        },
      },
      { provide: PeriodizationService, useValue: { refreshSettings: () => undefined } },
      { provide: RecoveryService, useValue: { loadEquipment: async () => undefined } },
      {
        provide: IdentityService,
        useValue: { initials: () => "TA", avatarUrl: () => null },
      },
      {
        provide: BillingService,
        useValue: { status: statusSignal, loading: () => false, loadStatus, openPortal },
      },
    ],
  });

  const fixture = TestBed.createComponent(SettingsComponent);
  fixture.detectChanges();
  return { fixture, loadStatus, openPortal, statusSignal };
}

describe("SettingsComponent — Billing tab", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("does not load billing status until the Billing tab is opened", () => {
    const { loadStatus } = mount({});
    expect(loadStatus).not.toHaveBeenCalled();
  });

  it("loads billing status exactly once the first time the Billing tab is opened", () => {
    const { fixture, loadStatus } = mount({});
    const c = fixture.componentInstance;
    c.selectTab("Billing");
    c.selectTab("Notifications");
    c.selectTab("Billing");
    expect(loadStatus).toHaveBeenCalledOnce();
  });

  it("shows the trial countdown when on an active trial", () => {
    const { fixture } = mount({ status: billingStatus({ trialDaysRemaining: 3 }) });
    fixture.componentInstance.selectTab("Billing");
    fixture.detectChanges();
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("3");
    expect(txt).toContain("left in your trial");
  });

  it("shows a locked message once the trial has expired", () => {
    const { fixture } = mount({
      status: billingStatus({ tier: "trial_expired", locked: true, trialDaysRemaining: 0 }),
    });
    fixture.componentInstance.selectTab("Billing");
    fixture.detectChanges();
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("Your trial has ended");
  });

  it("shows a suspended message distinct from a plain expired trial", () => {
    const { fixture } = mount({
      status: billingStatus({ tier: "suspended", status: "suspended", locked: true }),
    });
    fixture.componentInstance.selectTab("Billing");
    fixture.detectChanges();
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("didn't go through");
  });

  it("only shows Manage billing when there is an individual billing customer", () => {
    const { fixture } = mount({
      status: billingStatus({ hasIndividualBillingCustomer: false }),
    });
    fixture.componentInstance.selectTab("Billing");
    fixture.detectChanges();
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).not.toContain("Manage billing");
  });

  it("navigates to the billing portal URL when manageBilling succeeds", async () => {
    const { fixture, openPortal } = mount({
      status: billingStatus({ hasIndividualBillingCustomer: true }),
      openPortal: async () => ({ url: "https://billing.stripe.example/session", error: null }),
    });
    const c = fixture.componentInstance;
    c.selectTab("Billing");
    await c.manageBilling();
    expect(openPortal).toHaveBeenCalledOnce();
    expect(c.billingActionBusy()).toBe(false);
  });

  it("surfaces an error message when opening the portal fails", async () => {
    const { fixture } = mount({
      status: billingStatus({ hasIndividualBillingCustomer: true }),
      openPortal: async () => ({ url: null, error: "Couldn't open billing portal." }),
    });
    const c = fixture.componentInstance;
    c.selectTab("Billing");
    await c.manageBilling();
    expect(c.billingMsg()).toBe("Couldn't open billing portal.");
  });
});
