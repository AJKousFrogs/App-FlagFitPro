import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LucideAngularModule, Activity, Check } from "lucide-angular";
import { DeviceDataComponent } from "./device-data.component";
import {
  ExternalLoadService,
  type ExternalLoadMetric,
} from "../core/services/external-load.service";
import { WearableService } from "../core/services/wearable.service";

function metric(over: Partial<ExternalLoadMetric>): ExternalLoadMetric {
  return {
    id: "1",
    sessionDate: "2026-07-16",
    source: "manual",
    deviceName: "Garmin",
    totalDistanceM: 4200,
    highSpeedDistanceM: 600,
    sprintDistanceM: null,
    playerLoad: null,
    accelerations: null,
    decelerations: null,
    maxVelocityKmh: 27.5,
    avgHeartRate: null,
    maxHeartRate: null,
    durationMinutes: 55,
    trainingSessionId: null,
    notes: null,
    ...over,
  };
}

function mount(opts: {
  history?: ExternalLoadMetric[];
  logResult?: ExternalLoadMetric | null;
}) {
  const log = vi.fn((_entry: Partial<ExternalLoadMetric>) =>
    of(opts.logResult ?? metric({ id: "new" })),
  );
  const list = vi.fn(() => of(opts.history ?? []));
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [
      DeviceDataComponent,
      LucideAngularModule.pick({ Activity, Check }),
    ],
    providers: [
      { provide: ExternalLoadService, useValue: { list, log } },
      {
        provide: WearableService,
        useValue: {
          status: () =>
            of([
              {
                id: "garmin",
                name: "Garmin",
                connected: false,
                lastSync: null,
              },
            ]),
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(DeviceDataComponent);
  fixture.detectChanges();
  return { fixture, log, list };
}

describe("DeviceDataComponent", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("shows an empty state when there is no history (never zeros)", () => {
    const { fixture } = mount({ history: [] });
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("No device sessions logged yet");
  });

  it("renders logged sessions with their real metrics", () => {
    const { fixture } = mount({ history: [metric({ totalDistanceM: 4200 })] });
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("4,200");
    expect(txt).toContain("Garmin");
  });

  it("blocks save until at least one metric is entered (no all-null rows)", () => {
    const { fixture } = mount({ history: [] });
    const c = fixture.componentInstance;
    expect(c.canSave()).toBe(false);
    c.model.update((v) => ({ ...v, totalDistanceM: 3000 }));
    expect(c.canSave()).toBe(true);
  });

  it("surfaces the schema's message rather than a hardcoded hint", () => {
    const { fixture } = mount({ history: [] });
    const c = fixture.componentInstance;
    expect(c.formError()).toContain("at least one metric");
    c.model.update((v) => ({ ...v, totalDistanceM: 3000 }));
    expect(c.formError()).toBeNull();
  });

  it("rejects a negative metric (would corrupt the objective-load feed)", () => {
    const { fixture } = mount({ history: [] });
    const c = fixture.componentInstance;
    c.model.update((v) => ({
      ...v,
      totalDistanceM: 3000,
      durationMinutes: -10,
    }));
    expect(c.canSave()).toBe(false);
    expect(c.formError()).toContain("negative");
  });

  it("logs a session and refreshes history", () => {
    const { fixture, log, list } = mount({ history: [] });
    const c = fixture.componentInstance;
    c.model.update((v) => ({ ...v, totalDistanceM: 5000 }));
    c.save();
    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0][0]).toMatchObject({
      totalDistanceM: 5000,
      source: "manual",
    });
    // one list() in constructor + one after save
    expect(list).toHaveBeenCalledTimes(2);
    expect(c.saved()).toBe(true);
    expect(c.model().totalDistanceM).toBeNull(); // metrics reset
  });

  it("keeps date + device after a save, for a quick second entry", () => {
    const { fixture } = mount({ history: [] });
    const c = fixture.componentInstance;
    c.model.update((v) => ({
      ...v,
      deviceName: "Garmin",
      totalDistanceM: 5000,
    }));
    const date = c.model().sessionDate;
    c.save();
    expect(c.model().deviceName).toBe("Garmin");
    expect(c.model().sessionDate).toBe(date);
  });

  it("shows the supported-device catalogue honestly (sync coming)", () => {
    const { fixture } = mount({ history: [] });
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("sync coming");
    expect(txt).not.toContain("Connect"); // no fake connect button
  });
});
