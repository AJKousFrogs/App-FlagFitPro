import { Injectable, inject, signal, computed } from "@angular/core";
import { LoggerService } from "./logger.service";

/**
 * Data Source Service
 *
 * Implements the "Data State" contract from PLAYER_DATA_SAFETY_GUIDE.md:
 * - Never show mock data as real data
 * - Don't compute metrics without enough data
 * - Clear visual indicators for data state
 *
 * This service provides a shared contract for all data-dependent features
 * to ensure player safety and data integrity.
 *
 * Športno društvo Žabe - Athletes helping athletes since 2020
 */

// ============================================================================
// DATA STATE TYPES
// ============================================================================

/**
 * Data state enum - defines the possible states of data
 */
export enum DataState {
  /** No data exists at all */
  NO_DATA = "NO_DATA",

  /** Some data exists but not enough for reliable calculations */
  INSUFFICIENT_DATA = "INSUFFICIENT_DATA",

  /** Real, verified data with sufficient history */
  REAL_DATA = "REAL_DATA",
}

/**
 * Minimum data requirements for different metrics
 * Based on sports science research (Gabbett 2016, etc.)
 */
export const MINIMUM_DATA_REQUIREMENTS = {
  // ACWR requires 28 days of data for chronic load calculation
  acwr: {
    minimumDays: 28,
    description:
      "28 days of training data required for reliable ACWR calculation",
    source: "Gabbett, T.J. (2016) - The training-injury prevention paradox",
  },

  // Acute load requires 7 days
  acuteLoad: {
    minimumDays: 7,
    description: "7 days of training data required for acute load",
    source: "Standard rolling average calculation",
  },

  // Chronic load requires 28 days
  chronicLoad: {
    minimumDays: 28,
    description: "28 days of training data required for chronic load",
    source: "Gabbett, T.J. (2016)",
  },

  // Training monotony requires 7 days
  trainingMonotony: {
    minimumDays: 7,
    description: "7 days of data required for monotony calculation",
    source: "Foster, C. (1998)",
  },

  // Performance trends require at least 14 days
  performanceTrends: {
    minimumDays: 14,
    description: "14 days of data required for meaningful trends",
    source: "Statistical significance",
  },

  // Readiness baseline requires 7 days
  readinessBaseline: {
    minimumDays: 7,
    description: "7 days of readiness scores for personalized baseline",
    source: "Individual baseline calculation",
  },

  // Injury risk prediction requires 28 days
  injuryRiskPrediction: {
    minimumDays: 28,
    description: "28 days of load data for injury risk assessment",
    source: "ACWR-based injury prediction models",
  },
} as const;

export type MetricType = keyof typeof MINIMUM_DATA_REQUIREMENTS;

/**
 * Alias for backward compatibility - DATA_REQUIREMENTS maps metric names
 * to their minimum data point requirements
 */
export const DATA_REQUIREMENTS = {
  acwr: {
    name: "ACWR (Acute:Chronic Workload Ratio)",
    minimumDataPoints: MINIMUM_DATA_REQUIREMENTS.acwr.minimumDays,
    description: MINIMUM_DATA_REQUIREMENTS.acwr.description,
  },
  readiness: {
    name: "Readiness Score",
    minimumDataPoints: MINIMUM_DATA_REQUIREMENTS.readinessBaseline.minimumDays,
    description: MINIMUM_DATA_REQUIREMENTS.readinessBaseline.description,
  },
  acuteLoad: {
    name: "Acute Load",
    minimumDataPoints: MINIMUM_DATA_REQUIREMENTS.acuteLoad.minimumDays,
    description: MINIMUM_DATA_REQUIREMENTS.acuteLoad.description,
  },
  chronicLoad: {
    name: "Chronic Load",
    minimumDataPoints: MINIMUM_DATA_REQUIREMENTS.chronicLoad.minimumDays,
    description: MINIMUM_DATA_REQUIREMENTS.chronicLoad.description,
  },
  performanceTrends: {
    name: "Performance Trends",
    minimumDataPoints: MINIMUM_DATA_REQUIREMENTS.performanceTrends.minimumDays,
    description: MINIMUM_DATA_REQUIREMENTS.performanceTrends.description,
  },
  injuryRisk: {
    name: "Injury Risk Prediction",
    minimumDataPoints:
      MINIMUM_DATA_REQUIREMENTS.injuryRiskPrediction.minimumDays,
    description: MINIMUM_DATA_REQUIREMENTS.injuryRiskPrediction.description,
  },
} as const;

/**
 * Response wrapper for data with state information
 */
export interface DataWithState<T> {
  /** The actual data value (null if insufficient) */
  value: T | null;

  /** Current state of the data */
  dataState: DataState;

  /** Number of data points currently available */
  currentDataPoints: number;

  /** Minimum data points required for this metric */
  minimumRequiredDataPoints: number;

  /** Human-readable warnings */
  warnings: string[];

  /** When the data was last updated */
  lastUpdated: string | null;

  /** Additional metadata */
  metadata?: {
    source?: string;
    confidence?: number;
    calculationMethod?: string;
  };
}

/**
 * Risk level for displaying data state
 */
export type DataStateRisk = "safe" | "warning" | "danger" | "info";

// ============================================================================
// SERVICE
// ============================================================================

/**
 * Registered metric tracking
 */
interface RegisteredMetric {
  id: string;
  name: string;
  currentDataPoints: number;
  requiredDataPoints: number;
  dataSource: "real" | "demo" | "unknown";
  lastUpdated: Date;
}

@Injectable({
  providedIn: "root",
})
export class DataSourceService {
  private logger = inject(LoggerService);

  // Global demo mode flag (for development/testing)
  private _demoMode = signal(false);
  readonly demoMode = this._demoMode.asReadonly();

  // User has real data flag
  private _userHasRealData = signal(false);
  readonly userHasRealData = this._userHasRealData.asReadonly();

  // First time user (no data at all)
  readonly isFirstTimeUser = computed(() => !this._userHasRealData());

  // Registered metrics tracking
  private _registeredMetrics = signal<Map<string, RegisteredMetric>>(new Map());
  readonly registeredMetrics = computed(() =>
    Array.from(this._registeredMetrics().values()),
  );

  // ============================================================================
  // STATE EVALUATION
  // ============================================================================

  /**
   * Evaluate the data state based on available data points
   */
  evaluateDataState(
    currentDataPoints: number,
    metricType: MetricType,
  ): DataState {
    if (currentDataPoints === 0) {
      return DataState.NO_DATA;
    }

    const requirement = MINIMUM_DATA_REQUIREMENTS[metricType];
    if (currentDataPoints < requirement.minimumDays) {
      return DataState.INSUFFICIENT_DATA;
    }

    return DataState.REAL_DATA;
  }

  /**
   * Create a data response with state information
   */
  createDataResponse<T>(
    value: T | null,
    currentDataPoints: number,
    metricType: MetricType,
    options: {
      lastUpdated?: string | null;
      metadata?: DataWithState<T>["metadata"];
    } = {},
  ): DataWithState<T> {
    const { lastUpdated = null, metadata } = options;
    const requirement = MINIMUM_DATA_REQUIREMENTS[metricType];
    const dataState = this.evaluateDataState(
      currentDataPoints,
      metricType,
    );

    const warnings: string[] = [];

    // Generate appropriate warnings
    switch (dataState) {
      case DataState.NO_DATA:
        warnings.push(
          "No data available yet. Start logging your training to see metrics.",
        );
        break;
      case DataState.INSUFFICIENT_DATA: {
        const daysNeeded = requirement.minimumDays - currentDataPoints;
        warnings.push(
          `${requirement.description}. You have ${currentDataPoints} days, need ${daysNeeded} more.`,
        );
        break;
      }
    }

    // If data is insufficient, don't return the value
    const safeValue = dataState === DataState.REAL_DATA ? value : null;

    return {
      value: safeValue,
      dataState,
      currentDataPoints,
      minimumRequiredDataPoints: requirement.minimumDays,
      warnings,
      lastUpdated,
      metadata,
    };
  }

  /**
   * Check if data is safe to display as real
   */
  isDataSafe(dataState: DataState): boolean {
    return dataState === DataState.REAL_DATA;
  }

  /**
   * Check if data can be used for calculations
   */
  canCalculate(currentDataPoints: number, metricType: MetricType): boolean {
    const requirement = MINIMUM_DATA_REQUIREMENTS[metricType];
    return currentDataPoints >= requirement.minimumDays;
  }

  /**
   * Get the risk level for UI display
   */
  getDataStateRisk(dataState: DataState): DataStateRisk {
    switch (dataState) {
      case DataState.NO_DATA:
        return "info";
      case DataState.INSUFFICIENT_DATA:
        return "warning";
      case DataState.REAL_DATA:
        return "safe";
    }
  }

  /**
   * Get display label for data state
   */
  getDataStateLabel(dataState: DataState): string {
    switch (dataState) {
      case DataState.NO_DATA:
        return "No Data";
      case DataState.INSUFFICIENT_DATA:
        return "Insufficient Data";
      case DataState.REAL_DATA:
        return "Real Data";
    }
  }

  /**
   * Get icon for data state
   */
  getDataStateIcon(dataState: DataState): string {
    switch (dataState) {
      case DataState.NO_DATA:
        return "pi-inbox";
      case DataState.INSUFFICIENT_DATA:
        return "pi-exclamation-triangle";
      case DataState.REAL_DATA:
        return "pi-check-circle";
    }
  }

  // ============================================================================
  // DEMO MODE
  // ============================================================================

  /**
   * Enable demo mode (for development/testing)
   */
  enableDemoMode(): void {
    this._demoMode.set(true);
    this.logger.warn("Demo mode enabled - all data will be marked as demo");
  }

  /**
   * Disable demo mode
   */
  disableDemoMode(): void {
    this._demoMode.set(false);
    this.logger.info("Demo mode disabled");
  }

  // ============================================================================
  // ACWR-SPECIFIC HELPERS
  // ============================================================================

  /**
   * Validate ACWR calculation prerequisites
   * Returns null if calculation should not proceed
   */
  validateAcwrCalculation(
    trainingDays: number,
    acuteLoadDays: number,
    chronicLoadDays: number,
  ): { canCalculate: boolean; reason?: string } {
    if (trainingDays === 0) {
      return {
        canCalculate: false,
        reason: "No training data recorded yet",
      };
    }

    if (acuteLoadDays < MINIMUM_DATA_REQUIREMENTS.acuteLoad.minimumDays) {
      return {
        canCalculate: false,
        reason: `Need at least ${MINIMUM_DATA_REQUIREMENTS.acuteLoad.minimumDays} days for acute load (have ${acuteLoadDays})`,
      };
    }

    if (chronicLoadDays < MINIMUM_DATA_REQUIREMENTS.chronicLoad.minimumDays) {
      return {
        canCalculate: false,
        reason: `Need at least ${MINIMUM_DATA_REQUIREMENTS.chronicLoad.minimumDays} days for chronic load (have ${chronicLoadDays})`,
      };
    }

    return { canCalculate: true };
  }

  /**
   * Create a safe ACWR response
   * Returns null value if data is insufficient
   */
  createSafeAcwrResponse(
    acwr: number | null,
    acuteLoad: number | null,
    chronicLoad: number | null,
    trainingDays: number,
  ): DataWithState<{
    acwr: number;
    acuteLoad: number;
    chronicLoad: number;
    riskLevel: string;
  }> {
    const validation = this.validateAcwrCalculation(
      trainingDays,
      trainingDays, // Simplified - in practice these might differ
      trainingDays,
    );

    if (
      !validation.canCalculate ||
      acwr === null ||
      acuteLoad === null ||
      chronicLoad === null
    ) {
      return {
        value: null,
        dataState:
          trainingDays === 0 ? DataState.NO_DATA : DataState.INSUFFICIENT_DATA,
        currentDataPoints: trainingDays,
        minimumRequiredDataPoints: MINIMUM_DATA_REQUIREMENTS.acwr.minimumDays,
        warnings: [
          validation.reason || "Insufficient data for ACWR calculation",
        ],
        lastUpdated: null,
        metadata: {
          source: "ACWR calculation",
          calculationMethod: "Rolling average (7-day acute / 28-day chronic)",
        },
      };
    }

    // Determine risk level based on ACWR value
    let riskLevel: string;
    if (acwr < 0.8) {
      riskLevel = "undertraining";
    } else if (acwr <= 1.3) {
      riskLevel = "optimal";
    } else if (acwr <= 1.5) {
      riskLevel = "moderate";
    } else {
      riskLevel = "high";
    }

    return {
      value: { acwr, acuteLoad, chronicLoad, riskLevel },
      dataState: DataState.REAL_DATA,
      currentDataPoints: trainingDays,
      minimumRequiredDataPoints: MINIMUM_DATA_REQUIREMENTS.acwr.minimumDays,
      warnings: [],
      lastUpdated: new Date().toISOString(),
      metadata: {
        source: "ACWR calculation",
        confidence: Math.min(trainingDays / 56, 1), // Higher confidence with more data
        calculationMethod: "Rolling average (7-day acute / 28-day chronic)",
      },
    };
  }

  // ============================================================================
  // USER DATA STATE TRACKING
  // ============================================================================

  /**
   * Check if user has real data based on training session count
   * Updates the global userHasRealData flag
   */
  checkUserHasRealData(trainingSessionCount: number): void {
    const hasRealData = trainingSessionCount > 0;
    this._userHasRealData.set(hasRealData);

    this.logger.debug(
      `[DataSource] User has real data: ${hasRealData} (${trainingSessionCount} sessions)`,
    );
  }

  /**
   * Register a metric with its data requirements for tracking
   */
  registerMetric(
    id: string,
    name: string,
    currentDataPoints: number,
    requiredDataPoints: number,
    dataSource: "real" | "demo" | "unknown",
  ): void {
    const metrics = new Map(this._registeredMetrics());

    metrics.set(id, {
      id,
      name,
      currentDataPoints,
      requiredDataPoints,
      dataSource,
      lastUpdated: new Date(),
    });

    this._registeredMetrics.set(metrics);

    this.logger.debug(
      `[DataSource] Registered metric: ${name} (${currentDataPoints}/${requiredDataPoints} points, source: ${dataSource})`,
    );
  }

  /**
   * Get a registered metric by ID
   */
  getMetric(id: string): RegisteredMetric | undefined {
    return this._registeredMetrics().get(id);
  }

  /**
   * Check if a metric has sufficient data
   */
  metricHasSufficientData(id: string): boolean {
    const metric = this.getMetric(id);
    if (!metric) return false;
    return metric.currentDataPoints >= metric.requiredDataPoints;
  }

  /**
   * Get all metrics that need more data
   */
  getMetricsNeedingData(): RegisteredMetric[] {
    return this.registeredMetrics().filter(
      (m) => m.currentDataPoints < m.requiredDataPoints,
    );
  }

  /**
   * Clear all registered metrics
   */
  clearMetrics(): void {
    this._registeredMetrics.set(new Map());
    this.logger.debug("[DataSource] Cleared all registered metrics");
  }
}
