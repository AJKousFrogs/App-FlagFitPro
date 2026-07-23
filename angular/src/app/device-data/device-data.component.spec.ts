import { TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LucideAngularModule, Activity, Check } from "lucide-angular";
import { DeviceDataComponent } from "./device-data.component";
import {
  ExternalLoadService,
  type ExternalLoadMetric,
} from "../core/services/external-load.service";
import {
  WearableService,
  type DeviceStatus,
} from "../core/services/wearable.service";

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
  devices?: DeviceStatus[];
  connect?: (providerKey: string) => Promise<string | null>;
  setConsent?: (source: string, state: "granted" | "revoked") => Promise<boolean>;
  uploadAppleHealthXml?: (
    xml: string,
  ) => ReturnType<WearableService["uploadAppleHealthXml"]>;
  queryParams?: Record<string, string>;
}) {
  const log = vi.fn((_entry: Partial<ExternalLoadMetric>) =>
    of(opts.logResult ?? metric({ id: "new" })),
  );
  const list = vi.fn(() => of(opts.history ?? []));
  const connect = vi.fn(opts.connect ?? (async () => null));
  const setConsent = vi.fn(opts.setConsent ?? (async () => true));
  const uploadAppleHealthXml = vi.fn(
    opts.uploadAppleHealthXml ??
      (async () => ({
        ok: true as const,
        data: { recordCount: 1, skippedCount: 0, truncated: false },
      })),
  );
  const defaultDevices: DeviceStatus[] = [
    {
      id: "garmin",
      name: "Garmin",
      connected: false,
      pairedAt: null,
      lastSync: null,
      consentState: null,
    },
  ];
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
          status: () => of(opts.devices ?? defaultDevices),
          connect,
          setConsent,
          uploadAppleHealthXml,
        },
      },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            queryParamMap: {
              get: (key: string) => opts.queryParams?.[key] ?? null,
            },
          },
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(DeviceDataComponent);
  fixture.detectChanges();
  return { fixture, log, list, connect, setConsent, uploadAppleHealthXml };
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

  it("shows a real Connect button for an unpaired device", () => {
    const { fixture } = mount({ history: [] });
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("not connected");
    expect(txt).toContain("Connect");
  });

  it("resolves the vendor authorize URL and leaves the busy state for the (real) navigation away", async () => {
    // jsdom in this environment locks `window.location`/`.href` against
    // redefinition, so the actual `window.location.href = url` assignment
    // (identical to BillingService's already-working checkout/portal
    // pattern) isn't directly observable here. What IS verified: the right
    // provider is requested, and on success the component deliberately does
    // NOT clear connectingProvider — the page is about to navigate away.
    const { fixture, connect } = mount({
      history: [],
      connect: async () => "https://connect.garmin.example/authorize?x=1",
    });
    const c = fixture.componentInstance;
    await c.connectDevice("garmin");
    expect(connect).toHaveBeenCalledWith("garmin");
    expect(c.connectError()).toBeNull();
    expect(c.connectingProvider()).toBe("garmin");
  });

  it("surfaces an error and clears the busy state when connect fails", async () => {
    const { fixture } = mount({ history: [], connect: async () => null });
    const c = fixture.componentInstance;
    await c.connectDevice("garmin");
    expect(c.connectError()).toBeTruthy();
    expect(c.connectingProvider()).toBeNull();
  });

  it("shows a banner and a Grant-sync button after the OAuth callback returns ?connected=", () => {
    const connectedDevice: DeviceStatus = {
      id: "garmin",
      name: "Garmin",
      connected: true,
      pairedAt: "2026-07-23T00:00:00Z",
      lastSync: null,
      consentState: null,
    };
    const { fixture } = mount({
      history: [],
      devices: [connectedDevice],
      queryParams: { connected: "garmin" },
    });
    const txt = fixture.nativeElement.textContent as string;
    expect(txt).toContain("garmin connected");
    expect(txt).toContain("Grant sync");
  });

  it("toggles consent and refreshes device status", async () => {
    const connectedDevice: DeviceStatus = {
      id: "garmin",
      name: "Garmin",
      connected: true,
      pairedAt: "2026-07-23T00:00:00Z",
      lastSync: null,
      consentState: "granted",
    };
    const { fixture, setConsent } = mount({
      history: [],
      devices: [connectedDevice],
    });
    const c = fixture.componentInstance;
    await c.toggleConsent(connectedDevice);
    expect(setConsent).toHaveBeenCalledWith("garmin", "revoked");
  });

  it("uploads an Apple Health export and reports the imported count", async () => {
    const { fixture, uploadAppleHealthXml } = mount({
      history: [],
      uploadAppleHealthXml: async () => ({
        ok: true,
        data: { recordCount: 10, skippedCount: 2, truncated: false },
      }),
    });
    const c = fixture.componentInstance;
    const file = new File(["<HealthData></HealthData>"], "export.xml", {
      type: "text/xml",
    });
    const input = document.createElement("input");
    input.type = "file";
    Object.defineProperty(input, "files", { value: [file] });
    await c.onAppleHealthFileSelected({ target: input } as unknown as Event);
    expect(uploadAppleHealthXml).toHaveBeenCalled();
    expect(c.appleHealthMsg()).toContain("Imported 8 of 10");
  });

  it("surfaces the backend's message when an Apple Health import fails", async () => {
    const { fixture } = mount({
      history: [],
      uploadAppleHealthXml: async () => ({
        ok: false,
        error: "No <Record> elements found",
      }),
    });
    const c = fixture.componentInstance;
    const file = new File(["not xml"], "export.xml", { type: "text/xml" });
    const input = document.createElement("input");
    input.type = "file";
    Object.defineProperty(input, "files", { value: [file] });
    await c.onAppleHealthFileSelected({ target: input } as unknown as Event);
    expect(c.appleHealthMsg()).toBe("No <Record> elements found");
  });
});
