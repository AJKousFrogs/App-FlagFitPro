import { Injectable, inject, signal } from "@angular/core";
import { ApiService, API_ENDPOINTS } from "./api.service";
import { LoggerService } from "./logger.service";
import { getErrorMessage } from "../../shared/utils/error.utils";
import { extractApiPayload } from "../utils/api-response-mapper";

export interface NextGenBaselineStats {
  mean: number;
  stdDev: number;
  samples: number;
}

export interface NextGenLoadSpikeResult {
  acuteLoad: number;
  priorLoad: number;
  spikePct: number | null;
  spikeDetected: boolean;
  wellnessScore: number | null;
  riskLevel: "low" | "moderate" | "high" | "critical";
}

export interface NextGenWellnessScoreResult {
  score: number | null;
  includedMetrics: number;
}

export interface NextGenReadinessResult {
  score: number;
  dataMode: "baseline" | "reduced" | "insufficient_data";
  components: {
    wellness?: number;
    sleep?: number;
    energy?: number;
    performance?: number;
  };
}

export interface NextGenLoadManagementPreview {
  workload: NextGenLoadSpikeResult;
  wellness: NextGenWellnessScoreResult;
  readiness: NextGenReadinessResult;
  baselines: {
    wellness: NextGenBaselineStats | null;
    sleepHours: NextGenBaselineStats | null;
    energyScore: NextGenBaselineStats | null;
  };
  data_source: {
    workloadEntries: number;
    wellnessEntries: number;
  };
}

interface LoadManagementResponse {
  acwr: number | null;
  acute_load: number | null;
  chronic_load: number | null;
  risk_level: string | null;
  next_gen?: NextGenLoadManagementPreview;
}

@Injectable({
  providedIn: "root",
})
export class NextGenMetricsService {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly loadPreview = signal<NextGenLoadManagementPreview | null>(null);

  refreshLoadPreview(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiService
      .get<LoadManagementResponse>(API_ENDPOINTS.loadManagement.acwr, {
        useNextGenMetrics: true,
      })
      .subscribe({
        next: (response) => {
          this.loadPreview.set(
            extractApiPayload<LoadManagementResponse>(response)?.next_gen ?? null,
          );
          this.loading.set(false);
        },
        error: (error: Error) => {
          this.error.set(getErrorMessage(error, "Failed to load next-gen metrics"));
          this.loading.set(false);
          this.logger.error(
            "[NextGenMetricsService] Failed to load preview metrics",
            error,
          );
        },
      });
  }

  clearPreview(): void {
    this.loadPreview.set(null);
    this.error.set(null);
  }
}
