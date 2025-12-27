/**
 * Data Source Service
 *
 * CRITICAL SAFETY SERVICE - Tracks whether data is real or mock
 *
 * This service is essential for athlete safety. Mock data can lead to:
 * - Incorrect training load calculations
 * - Wrong recovery recommendations
 * - Potential injury from following false metrics
 *
 * BEST PRACTICES:
 * 1. Always check dataSource before displaying performance metrics
 * 2. Show clear warnings when using mock/demo data
 * 3. Show "No data entry yet" for empty states (not mock data)
 * 4. Never allow training decisions based on mock data
 */

import { Injectable, signal, computed, inject } from "@angular/core";
import { LoggerService } from "./logger.service";

export type DataSourceType = "real" | "mock" | "cache" | "unknown";

export interface DataSourceInfo {
  /** Whether data comes from real user entries */
  isRealData: boolean;
  /** The source of the data */
  source: DataSourceType;
  /** When the data was last updated */
  lastUpdated: Date | null;
  /** Whether this is the user's first time (no data entry yet) */
  isFirstTimeUser: boolean;
  /** Number of real data entries the user has */
  realDataCount: number;
  /** Minimum data points needed for reliable calculations */
  minimumDataRequired: number;
  /** Whether enough data exists for reliable calculations */
  hasEnoughData: boolean;
}

export interface MetricDataSource {
  metricId: string;
  metricName: string;
  source: DataSourceType;
  lastUpdated: Date | null;
  dataPoints: number;
  minimumRequired: number;
  isReliable: boolean;
}

/**
 * Data requirements for different metrics
 * These minimums are based on sports science best practices
 */
export const DATA_REQUIREMENTS = {
  // ACWR needs 4 weeks of data minimum
  acwr: {
    minimumDataPoints: 28, // 4 weeks daily
    warningThreshold: 14, // 2 weeks - show warning
    name: "Acute:Chronic Workload Ratio",
  },
  // Readiness needs at least 7 days of data
  readiness: {
    minimumDataPoints: 7,
    warningThreshold: 3,
    name: "Readiness Score",
  },
  // Performance trends need at least 2 data points
  performanceTrends: {
    minimumDataPoints: 2,
    warningThreshold: 1,
    name: "Performance Trends",
  },
  // Wellness tracking needs consistent daily entries
  wellness: {
    minimumDataPoints: 7,
    warningThreshold: 3,
    name: "Wellness Metrics",
  },
  // Body composition trends
  bodyComposition: {
    minimumDataPoints: 4,
    warningThreshold: 2,
    name: "Body Composition",
  },
  // Training load
  trainingLoad: {
    minimumDataPoints: 7,
    warningThreshold: 3,
    name: "Training Load",
  },
} as const;

@Injectable({
  providedIn: "root",
})
export class DataSourceService {
  private logger = inject(LoggerService);

  // Global data source state
  private readonly _globalSource = signal<DataSourceInfo>({
    isRealData: false,
    source: "unknown",
    lastUpdated: null,
    isFirstTimeUser: true,
    realDataCount: 0,
    minimumDataRequired: 7,
    hasEnoughData: false,
  });

  // Per-metric data source tracking
  private readonly _metricSources = signal<Map<string, MetricDataSource>>(
    new Map()
  );

  // Whether the app is in demo mode
  private readonly _isDemoMode = signal<boolean>(false);

  // Public readonly signals
  readonly globalSource = this._globalSource.asReadonly();
  readonly metricSources = this._metricSources.asReadonly();
  readonly isDemoMode = this._isDemoMode.asReadonly();

  // Computed signals for common checks
  readonly isRealData = computed(() => this._globalSource().isRealData);
  readonly isFirstTimeUser = computed(() => this._globalSource().isFirstTimeUser);
  readonly hasEnoughData = computed(() => this._globalSource().hasEnoughData);

  /**
   * Check if a specific metric has enough data for reliable calculations
   */
  readonly getMetricReliability = (metricId: string) =>
    computed(() => {
      const sources = this._metricSources();
      const metric = sources.get(metricId);
      return metric?.isReliable ?? false;
    });

  /**
   * Get warning level for data reliability
   */
  readonly dataWarningLevel = computed<"none" | "low" | "warning" | "critical">(() => {
    const source = this._globalSource();

    if (source.isRealData && source.hasEnoughData) {
      return "none";
    }

    if (source.isFirstTimeUser) {
      return "critical"; // No data at all
    }

    if (!source.isRealData) {
      return "critical"; // Using mock data
    }

    if (source.realDataCount < source.minimumDataRequired / 2) {
      return "warning"; // Some data but not enough
    }

    return "low"; // Almost enough data
  });

  /**
   * Set the app to demo mode (for development/testing)
   */
  setDemoMode(isDemoMode: boolean): void {
    this._isDemoMode.set(isDemoMode);
    this.logger.info(`[DataSource] Demo mode ${isDemoMode ? "enabled" : "disabled"}`);

    if (isDemoMode) {
      this._globalSource.update((current) => ({
        ...current,
        isRealData: false,
        source: "mock",
      }));
    }
  }

  /**
   * Update global data source information
   */
  updateGlobalSource(info: Partial<DataSourceInfo>): void {
    this._globalSource.update((current) => ({
      ...current,
      ...info,
      hasEnoughData: (info.realDataCount ?? current.realDataCount) >=
        (info.minimumDataRequired ?? current.minimumDataRequired),
    }));

    this.logger.debug("[DataSource] Global source updated:", this._globalSource());
  }

  /**
   * Register a metric's data source
   */
  registerMetric(
    metricId: string,
    metricName: string,
    dataPoints: number,
    minimumRequired: number,
    source: DataSourceType = "unknown"
  ): void {
    const isReliable = dataPoints >= minimumRequired && source === "real";

    this._metricSources.update((sources) => {
      const newSources = new Map(sources);
      newSources.set(metricId, {
        metricId,
        metricName,
        source,
        lastUpdated: source === "real" ? new Date() : null,
        dataPoints,
        minimumRequired,
        isReliable,
      });
      return newSources;
    });

    if (!isReliable) {
      this.logger.warn(
        `[DataSource] Metric "${metricName}" has insufficient data: ${dataPoints}/${minimumRequired} points`
      );
    }
  }

  /**
   * Update a metric's data source
   */
  updateMetricSource(metricId: string, updates: Partial<MetricDataSource>): void {
    this._metricSources.update((sources) => {
      const current = sources.get(metricId);
      if (!current) {
        this.logger.warn(`[DataSource] Metric ${metricId} not found`);
        return sources;
      }

      const newSources = new Map(sources);
      const updated = { ...current, ...updates };
      updated.isReliable =
        updated.dataPoints >= updated.minimumRequired && updated.source === "real";
      newSources.set(metricId, updated);
      return newSources;
    });
  }

  /**
   * Check if user has entered any real data
   */
  checkUserHasRealData(dataCount: number): void {
    const isFirstTimeUser = dataCount === 0;
    const isRealData = dataCount > 0;

    this._globalSource.update((current) => ({
      ...current,
      isRealData,
      isFirstTimeUser,
      realDataCount: dataCount,
      source: isRealData ? "real" : "unknown",
      lastUpdated: isRealData ? new Date() : null,
      hasEnoughData: dataCount >= current.minimumDataRequired,
    }));
  }

  /**
   * Get a human-readable message about data status
   */
  getDataStatusMessage(): string {
    const source = this._globalSource();

    if (source.isFirstTimeUser) {
      return "Welcome! Start logging your training data to see personalized metrics.";
    }

    if (!source.isRealData) {
      return "⚠️ Showing demo data. Your real metrics will appear after you log training data.";
    }

    if (!source.hasEnoughData) {
      const remaining = source.minimumDataRequired - source.realDataCount;
      return `📊 ${remaining} more data entries needed for reliable calculations.`;
    }

    return "✅ Using your real performance data.";
  }

  /**
   * Get warning message for a specific metric
   */
  getMetricWarningMessage(metricId: string): string | null {
    const sources = this._metricSources();
    const metric = sources.get(metricId);

    if (!metric) {
      return "No data available for this metric.";
    }

    if (metric.source === "mock") {
      return `⚠️ DEMO DATA - This ${metric.metricName} is not based on your real performance.`;
    }

    if (metric.dataPoints === 0) {
      return `No ${metric.metricName} data entered yet. Start logging to see your metrics.`;
    }

    if (!metric.isReliable) {
      const remaining = metric.minimumRequired - metric.dataPoints;
      return `${remaining} more entries needed for reliable ${metric.metricName} calculations.`;
    }

    return null; // No warning needed
  }

  /**
   * Reset all data source tracking (e.g., on logout)
   */
  reset(): void {
    this._globalSource.set({
      isRealData: false,
      source: "unknown",
      lastUpdated: null,
      isFirstTimeUser: true,
      realDataCount: 0,
      minimumDataRequired: 7,
      hasEnoughData: false,
    });
    this._metricSources.set(new Map());
    this._isDemoMode.set(false);
    this.logger.info("[DataSource] Data source tracking reset");
  }
}
