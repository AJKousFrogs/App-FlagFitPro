import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, map } from "rxjs";
import { ApiService } from "./api.service";
import { extractApiPayload } from "../utils/api-response-mapper";

export type RequesterRole = "self" | "physio" | "sc_coach" | "head_coach";

export interface MonitoringReport {
  meta: {
    athleteId: string;
    requesterRole: RequesterRole;
    generatedAt: string;
    disclaimer: string;
  };
  identity: {
    name: string | null;
    sex: string | null;
    position: string | null;
  } | null;
  physioBlock: {
    active: boolean;
    restrictions: string[];
    maxLoadPercent: number | null;
    endDate: string | null;
    suppressesLoadPrescription: boolean;
    bodyRegion?: string | null;
    blockType?: string | null;
    clinicalNote?: string | null;
  } | null;
  daily: {
    latest: {
      date: string;
      sleepQuality: number | null;
      stress: number | null;
      fatigue: number | null;
      soreness: number | null;
      sleepHours: number | null;
    } | null;
    series: { date: string; hooperIndex: number | null }[];
    hooperIndex: number | null;
    flags: { hooper?: string | null };
    promptRequired: boolean;
  };
  weekly: {
    acwr: {
      primary: {
        method: string;
        lambdaAcute: number;
        lambdaChronic: number;
        value: number | null;
        band: string | null;
      };
      comparison: {
        method: string;
        value: number | null;
        band: string | null;
        label: string;
      };
      monitoringNotPrediction: boolean;
    } | null;
    monotony: number | null;
    strain: number | null;
    plPerMin: { value: number | null; flag: string } | null;
    promptRequired: boolean;
  };
  bloodwork:
    | {
        mode: "raw";
        collectedDate: string | null;
        daysSinceDraw?: number | null;
        markers: {
          name: string;
          value: number | null;
          unit: string | null;
          flag: string;
        }[];
        promptRequired: boolean;
      }
    | {
        mode: "signal";
        status: string | null;
        categories: string[];
        promptRequired: boolean;
      }
    | null;
  wearable:
    | {
        mode: "raw";
        latest: Record<
          string,
          { value: number | null; source: string; at: string }
        > | null;
        derivedRecovery: string | null;
        promptRequired: boolean;
      }
    | {
        mode: "derived";
        derivedRecovery: string | null;
        promptRequired: boolean;
      }
    | null;
  thresholds: Record<string, Record<string, number | string | undefined>>;
}

/**
 * Thin client for `/api/monitoring-report`. The server returns a payload already
 * SHAPED by the caller's role — the component renders whatever it receives and
 * makes NO threshold decisions of its own.
 */
@Injectable({ providedIn: "root" })
export class MonitoringReportService {
  private readonly api = inject(ApiService);

  get(athleteId?: string): Observable<MonitoringReport | null> {
    return this.api
      .get<MonitoringReport>(
        "/api/monitoring-report",
        athleteId ? { athleteId } : undefined,
      )
      .pipe(
        map((res) => extractApiPayload(res)),
        catchError(() => of(null)),
      );
  }
}
