import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs";
import { ApiService } from "./api.service";
import { extractApiPayload } from "../utils/api-response-mapper";

export interface ExternalLoadMetric {
  id: string;
  sessionDate: string;
  source: string;
  deviceName: string | null;
  totalDistanceM: number | null;
  highSpeedDistanceM: number | null;
  sprintDistanceM: number | null;
  playerLoad: number | null;
  accelerations: number | null;
  decelerations: number | null;
  maxVelocityKmh: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  durationMinutes: number | null;
  trainingSessionId: string | null;
  notes: string | null;
}

/**
 * Thin client for `/api/external-load`. Access is enforced server-side by RLS
 * (own rows, or a teammate's when the caller is same-team staff in a load role
 * WITH the athlete's training-notes consent) — the client just asks and shows
 * whatever comes back.
 */
@Injectable({ providedIn: "root" })
export class ExternalLoadService {
  private readonly api = inject(ApiService);

  /** External-load rows for the caller (default) or a specific athlete. */
  list(athleteId?: string): Observable<ExternalLoadMetric[]> {
    return this.api
      .get<{
        metrics: ExternalLoadMetric[];
      }>("/api/external-load", athleteId ? { athleteId } : undefined)
      .pipe(
        map((res) => extractApiPayload(res)?.metrics ?? []),
        catchError(() => of([])),
      );
  }

  /** Log an external-load session for the caller. */
  log(
    entry: Partial<ExternalLoadMetric> & { sessionDate: string },
  ): Observable<ExternalLoadMetric | null> {
    return this.api.post<ExternalLoadMetric>("/api/external-load", entry).pipe(
      map((res) => extractApiPayload(res)),
      catchError(() => of(null)),
    );
  }
}
