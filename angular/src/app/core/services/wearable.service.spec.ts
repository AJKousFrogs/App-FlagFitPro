import { TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WearableService, type DeviceStatus } from "./wearable.service";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";

function mount(overrides: Partial<Record<"get" | "put" | "post", ReturnType<typeof vi.fn>>> = {}) {
  const get = overrides.get ?? vi.fn();
  const put = overrides.put ?? vi.fn();
  const post = overrides.post ?? vi.fn();
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      { provide: ApiService, useValue: { get, put, post } },
      { provide: LoggerService, useValue: { error: vi.fn(), info: vi.fn() } },
    ],
  });
  return TestBed.inject(WearableService);
}

describe("WearableService", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("reads the device catalogue from the wrapped status response", async () => {
    const devices: DeviceStatus[] = [
      {
        id: "garmin",
        name: "Garmin",
        connected: false,
        pairedAt: null,
        lastSync: null,
        consentState: null,
      },
    ];
    const get = vi.fn(() => of({ success: true, data: { devices } }));
    const service = mount({ get });

    const result = await new Promise<DeviceStatus[]>((resolve) =>
      service.status().subscribe(resolve),
    );

    expect(get).toHaveBeenCalledWith("/api/wearables/status");
    expect(result).toEqual(devices);
  });

  it("returns an empty catalogue rather than throwing when status fails", async () => {
    const get = vi.fn(() => throwError(() => new Error("network down")));
    const service = mount({ get });

    const result = await new Promise<DeviceStatus[]>((resolve) =>
      service.status().subscribe(resolve),
    );

    expect(result).toEqual([]);
  });

  it("resolves the vendor authorize URL for a given provider", async () => {
    const get = vi.fn(() =>
      of({ success: true, data: { authorizeUrl: "https://connect.garmin.example/authorize" } }),
    );
    const service = mount({ get });

    const url = await service.connect("garmin");

    expect(get).toHaveBeenCalledWith("/api/wearables/connect/garmin");
    expect(url).toBe("https://connect.garmin.example/authorize");
  });

  it("returns null when connect fails", async () => {
    const get = vi.fn(() => throwError(() => new Error("provider_not_configured")));
    const service = mount({ get });

    const url = await service.connect("whoop");

    expect(url).toBeNull();
  });

  it("grants consent for a device source", async () => {
    const put = vi.fn(() => of({ success: true, data: { source: "garmin", state: "granted" } }));
    const service = mount({ put });

    const ok = await service.setConsent("garmin", "granted");

    expect(put).toHaveBeenCalledWith("/api/wearable-health-ingest", {
      source: "garmin",
      state: "granted",
    });
    expect(ok).toBe(true);
  });

  it("returns false when a consent update fails", async () => {
    const put = vi.fn(() => throwError(() => new Error("boom")));
    const service = mount({ put });

    const ok = await service.setConsent("garmin", "revoked");

    expect(ok).toBe(false);
  });

  it("uploads an Apple Health export and returns the parsed result", async () => {
    const post = vi.fn(() =>
      of({
        success: true,
        data: { recordCount: 12, skippedCount: 1, truncated: false },
      }),
    );
    const service = mount({ post });

    const result = await service.uploadAppleHealthXml("<HealthData></HealthData>");

    expect(post).toHaveBeenCalledWith(
      "/api/wearable-health-ingest/apple-health-xml",
      { xml: "<HealthData></HealthData>" },
    );
    expect(result).toEqual({
      ok: true,
      data: { recordCount: 12, skippedCount: 1, truncated: false },
    });
  });

  it("surfaces the backend's validation message verbatim on failure", async () => {
    const post = vi.fn(() =>
      throwError(() => new Error("No <Record> elements found — is this a real export?")),
    );
    const service = mount({ post });

    const result = await service.uploadAppleHealthXml("not xml");

    expect(result).toEqual({
      ok: false,
      error: "No <Record> elements found — is this a real export?",
    });
  });

  it("falls back to a generic message when the thrown error has no message", async () => {
    const post = vi.fn(() => throwError(() => ({})));
    const service = mount({ post });

    const result = await service.uploadAppleHealthXml("<HealthData></HealthData>");

    expect(result).toEqual({ ok: false, error: "Import failed — try again." });
  });
});
