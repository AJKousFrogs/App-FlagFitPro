import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs";
import { ApiService } from "./api.service";
import { extractApiPayload } from "../utils/api-response-mapper";

export interface BloodworkMarker {
  id: string;
  markerName: string;
  value: number | null;
  unit: string | null;
  referenceLow: number | null;
  referenceHigh: number | null;
  flag: string | null;
}

export interface BloodworkPanel {
  id: string;
  collectedDate: string;
  panelType: string | null;
  labName: string | null;
  orderedBy: string | null;
  notes: string | null;
  markers: BloodworkMarker[];
}

/**
 * Thin client for `/api/bloodwork`. Bloodwork is the medical lane — RLS lets
 * only the athlete and same-team physiotherapist/admin/owner read it (no coach
 * or consent path). The client just asks; the server decides.
 */
@Injectable({ providedIn: "root" })
export class BloodworkService {
  private readonly api = inject(ApiService);

  /** Panels (with markers) for the caller (default) or a specific athlete. */
  list(athleteId?: string): Observable<BloodworkPanel[]> {
    return this.api
      .get<{
        panels: BloodworkPanel[];
      }>("/api/bloodwork", athleteId ? { athleteId } : undefined)
      .pipe(
        map((res) => extractApiPayload(res)?.panels ?? []),
        catchError(() => of([])),
      );
  }

  /** Save a panel (with optional markers) for the caller. */
  savePanel(panel: {
    collectedDate: string;
    panelType?: string;
    labName?: string;
    orderedBy?: string;
    notes?: string;
    markers?: Partial<BloodworkMarker>[];
  }): Observable<BloodworkPanel | null> {
    return this.api.post<BloodworkPanel>("/api/bloodwork", panel).pipe(
      map((res) => extractApiPayload(res)),
      catchError(() => of(null)),
    );
  }
}
