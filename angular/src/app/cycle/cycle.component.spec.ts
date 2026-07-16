import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { describe, it, expect, vi } from "vitest";
import {
  LucideAngularModule,
  Moon,
  Lock,
  Activity,
  Info,
  Trash2,
} from "lucide-angular";
import { CycleComponent, CYCLE_CONSENT_VERSION } from "./cycle.component";
import { CycleService } from "./cycle.service";
import { SupabaseService } from "../core/services/supabase.service";
import type { CycleApiProfile, CycleData } from "./cycle.service";

function profile(over: Partial<CycleApiProfile> = {}): CycleApiProfile {
  return {
    enabled: true,
    hormonalContraception: false,
    adaptationLevel: "inform",
    typicalCycleLength: null,
    typicalPeriodLength: null,
    consentVersion: CYCLE_CONSENT_VERSION,
    consentGrantedAt: "2026-07-16",
    ...over,
  };
}

function mount(opts: {
  metadata?: Record<string, unknown>;
  data?: CycleData;
  saveProfile?: ReturnType<typeof vi.fn>;
}) {
  const saveProfile =
    opts.saveProfile ?? vi.fn((p: Partial<CycleApiProfile>) => of(profile(p)));
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      CycleComponent,
      LucideAngularModule.pick({ Moon, Lock, Activity, Info, Trash2 }),
    ],
    providers: [
      provideRouter([]),
      {
        provide: SupabaseService,
        useValue: {
          currentUser: () => ({ user_metadata: opts.metadata ?? {} }),
        },
      },
      {
        provide: CycleService,
        useValue: {
          get: () => of(opts.data ?? { profile: null, logs: [] }),
          saveProfile,
          saveLog: vi.fn(() => of(null)),
          deleteLog: vi.fn(() => of(true)),
          wipe: vi.fn(() => of(true)),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(CycleComponent);
  fixture.detectChanges();
  return { fixture, saveProfile };
}

describe("CycleComponent", () => {
  it("force-disables under 18 (never fetches cycle data for a minor)", () => {
    const { fixture } = mount({ metadata: { date_of_birth: "2010-06-01" } }); // ~16
    expect(fixture.componentInstance.isYouth()).toBe(true);
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("isn't available under 18");
  });

  it("shows the consent gate when the module is off", () => {
    const { fixture } = mount({ data: { profile: null, logs: [] } });
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("Turn on cycle tracking");
    expect(txt).toContain("No coach"); // privacy promise
  });

  it("enabling records explicit versioned consent", () => {
    const { fixture, saveProfile } = mount({
      data: { profile: null, logs: [] },
    });
    fixture.componentInstance.enable();
    expect(saveProfile).toHaveBeenCalledOnce();
    expect(saveProfile.mock.calls[0][0]).toMatchObject({
      enabled: true,
      consentVersion: CYCLE_CONSENT_VERSION,
    });
  });

  it("shows the inform-only advisory once enabled", () => {
    const { fixture } = mount({ data: { profile: profile(), logs: [] } });
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("Log today");
  });

  it("wipe is gated behind typing DELETE", () => {
    const { fixture } = mount({ data: { profile: profile(), logs: [] } });
    const c = fixture.componentInstance;
    const wipeSpy = vi.spyOn(
      TestBed.inject(CycleService) as unknown as { wipe: () => unknown },
      "wipe",
    );
    c.wipeConfirm.set("nope");
    c.wipe();
    expect(wipeSpy).not.toHaveBeenCalled();
    c.wipeConfirm.set("DELETE");
    c.wipe();
    expect(wipeSpy).toHaveBeenCalled();
  });
});
