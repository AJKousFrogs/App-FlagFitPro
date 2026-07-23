import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, firstValueFrom, map } from "rxjs";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { extractApiPayload } from "../utils/api-response-mapper";

export type WearableConsentState = "granted" | "revoked" | null;

export interface DeviceStatus {
  id: string;
  name: string;
  connected: boolean;
  pairedAt: string | null;
  lastSync: string | null;
  consentState: WearableConsentState;
}

export interface AppleHealthImportResult {
  recordCount: number;
  skippedCount: number;
  truncated: boolean;
  ingested?: number;
  partial?: boolean;
}

/**
 * Client for the wearable OAuth-connect / consent / manual-import surface.
 * `status()` reads real device_pairings/monitoring_providers/wearable_consent
 * state (Garmin/Oura/WHOOP/Polar) — no vendor credentials are configured yet,
 * so every device reads disconnected in practice, but the Connect flow itself
 * is real (GET /api/wearables/connect/:provider returns the vendor's
 * authorize URL; the caller navigates there themselves, since a Bearer-token
 * request can't be a plain `<a href>` navigation — same pattern as
 * BillingService's checkout/portal URLs).
 */
@Injectable({ providedIn: "root" })
export class WearableService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  status(): Observable<DeviceStatus[]> {
    return this.api
      .get<{ devices: DeviceStatus[] }>("/api/wearables/status")
      .pipe(
        map((res) => extractApiPayload(res)?.devices ?? []),
        catchError(() => of([])),
      );
  }

  /** Resolves the vendor's OAuth authorize URL, or null on failure. */
  async connect(providerKey: string): Promise<string | null> {
    try {
      const res = await firstValueFrom(
        this.api.get<{ authorizeUrl: string }>(
          `/api/wearables/connect/${providerKey}`,
        ),
      );
      return extractApiPayload(res)?.authorizeUrl ?? null;
    } catch (err) {
      this.logger.error("wearable_connect_failed", err);
      return null;
    }
  }

  /** Grants or revokes ingestion consent for a device source. */
  async setConsent(
    source: string,
    state: "granted" | "revoked",
  ): Promise<boolean> {
    try {
      await firstValueFrom(
        this.api.put("/api/wearable-health-ingest", { source, state }),
      );
      return true;
    } catch (err) {
      this.logger.error("wearable_consent_update_failed", err);
      return false;
    }
  }

  /** Uploads a raw Apple Health `export.xml` for one-time ingestion. */
  async uploadAppleHealthXml(
    xml: string,
  ): Promise<
    { ok: true; data: AppleHealthImportResult } | { ok: false; error: string }
  > {
    try {
      const res = await firstValueFrom(
        this.api.post<AppleHealthImportResult>(
          "/api/wearable-health-ingest/apple-health-xml",
          { xml },
        ),
      );
      const data = extractApiPayload(res);
      if (!data) {
        return { ok: false, error: "Import failed — try again." };
      }
      return { ok: true, data };
    } catch (err) {
      this.logger.error("apple_health_import_failed", err);
      // Unlike billing errors, this message IS shown verbatim — the backend's
      // validation text ("no <Record> elements", "consent required", …) is
      // exactly what tells the athlete what to fix, not an internal detail.
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Import failed — try again.";
      return { ok: false, error: message };
    }
  }
}
