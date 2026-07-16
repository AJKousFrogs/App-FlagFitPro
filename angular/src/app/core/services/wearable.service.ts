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
 * Thin client for `/api/wearables/status`. The backend currently returns a
 * placeholder catalogue (Garmin / Polar / WHOOP / Catapult, all disconnected) —
 * automated OAuth sync is a separate integration that needs provider credentials.
 * The UI presents this honestly (no fake "Connect" that does nothing); until sync
 * lands, athletes enter their objective session metrics manually via
 * `ExternalLoadService`.
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
