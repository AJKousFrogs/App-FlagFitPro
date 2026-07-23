import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs";
import { ApiService } from "./api.service";
import { extractApiPayload } from "../utils/api-response-mapper";

export interface DeviceStatus {
  id: string;
  name: string;
  connected: boolean;
  lastSync: string | null;
}

/**
 * Thin client for `/api/wearables/status`. The backend reads real
 * device_pairings/monitoring_providers state (Garmin/Oura/WHOOP/Polar) — the
 * OAuth connect/callback backend exists (2026-07-23), but no vendor
 * credentials are configured yet, so every device reads disconnected in
 * practice. The UI presents this honestly (no fake "Connect" that does
 * nothing); until real credentials land, athletes enter their objective
 * session metrics manually via `ExternalLoadService`.
 */
@Injectable({ providedIn: "root" })
export class WearableService {
  private readonly api = inject(ApiService);

  status(): Observable<DeviceStatus[]> {
    return this.api
      .get<{ devices: DeviceStatus[] }>("/api/wearables/status")
      .pipe(
        map((res) => extractApiPayload(res)?.devices ?? []),
        catchError(() => of([])),
      );
  }
}
