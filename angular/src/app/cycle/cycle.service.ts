import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs";
import { ApiService } from "../core/services/api.service";
import { extractApiPayload } from "../core/utils/api-response-mapper";
import type { CycleLog, CycleProfile } from "./cycle.logic";

export interface CycleApiProfile extends CycleProfile {
  consentVersion: string | null;
  consentGrantedAt: string | null;
}

export interface CycleData {
  profile: CycleApiProfile | null;
  logs: CycleLog[];
}

/**
 * Thin client for `/api/cycle` (SPECIAL-CATEGORY data). Owner-only end to end:
 * the endpoint self-scopes to the caller and the tables have owner-only RLS with
 * no staff policy, so there is no `athleteId` parameter here — by design.
 */
@Injectable({ providedIn: "root" })
export class CycleService {
  private readonly api = inject(ApiService);

  get(): Observable<CycleData> {
    return this.api.get<CycleData>("/api/cycle").pipe(
      map((res) => extractApiPayload<CycleData>(res)),
      map((d) => ({ profile: d?.profile ?? null, logs: d?.logs ?? [] })),
      catchError(() => of({ profile: null, logs: [] as CycleLog[] })),
    );
  }

  saveProfile(
    profile: Partial<CycleApiProfile>,
  ): Observable<CycleApiProfile | null> {
    return this.api
      .put<{ profile: CycleApiProfile }>("/api/cycle/profile", profile)
      .pipe(
        map(
          (res) =>
            extractApiPayload<{ profile: CycleApiProfile }>(res)?.profile ??
            null,
        ),
        catchError(() => of(null)),
      );
  }

  saveLog(log: CycleLog): Observable<CycleLog | null> {
    return this.api.post<{ log: CycleLog }>("/api/cycle/log", log).pipe(
      map((res) => extractApiPayload<{ log: CycleLog }>(res)?.log ?? null),
      catchError(() => of(null)),
    );
  }

  deleteLog(date: string): Observable<boolean> {
    return this.api.delete("/api/cycle/log", { params: { date } }).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  /** Withdrawal = erasure. Hard-deletes all cycle data + profile. */
  wipe(): Observable<boolean> {
    return this.api.delete("/api/cycle").pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }
}
