/**
 * Analytics ViewModel
 * 
 * Manages analytics state with signals
 * Uses ReactiveViewModel for real-time data streams
 * Perfect for live analytics dashboards
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { interval } from 'rxjs';
import { switchMap, map, shareReplay, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveViewModel } from './reactive.view-model';
import { AnalyticsDataService, PerformanceTrendsData, TeamChemistryData, TrainingDistributionData } from '../services/data/analytics-data.service';

@Injectable()
export class AnalyticsViewModel extends ReactiveViewModel {
  private analyticsDataService = inject(AnalyticsDataService);

  // State signals
  readonly performanceTrends = signal<PerformanceTrendsData | null>(null);
  readonly teamChemistry = signal<TeamChemistryData | null>(null);
  readonly trainingDistribution = signal<TrainingDistributionData | null>(null);
  readonly positionPerformance = signal<any>(null);
  readonly injuryRisk = signal<any>(null);
  readonly speedDevelopment = signal<any>(null);

  // Real-time data stream (updates every 5 seconds)
  private realTimeUpdateInterval = 5000; // 5 seconds
  readonly realTimeEnabled = signal<boolean>(false);

  // Reactive stream for real-time updates
  readonly performanceTrends$ = this.createStream(
    interval(this.realTimeUpdateInterval).pipe(
      startWith(0),
      switchMap(() => this.analyticsDataService.getPerformanceTrends()),
      shareReplay(1)
    ),
    'performanceTrends'
  );

  // Convert stream to signal for reactive updates
  readonly livePerformanceTrends = toSignal(
    this.performanceTrends$.pipe(
      map(data => data)
    ),
    { initialValue: null }
  );

  // Derived/computed signals
  readonly hasPerformanceData = computed(() => this.performanceTrends() !== null);
  readonly hasTeamChemistryData = computed(() => this.teamChemistry() !== null);
  readonly hasTrainingDistributionData = computed(() => this.trainingDistribution() !== null);

  /**
   * Initialize analytics - loads all data
   */
  override initialize(athleteId?: string, enableRealTime: boolean = false): void {
    if (this.initialized()) {
      return;
    }

    this.realTimeEnabled.set(enableRealTime);
    this.loadAllAnalytics(athleteId);

    // If real-time enabled, start reactive updates
    if (enableRealTime) {
      this.startRealTimeUpdates(athleteId);
    }
  }

  /**
   * Load all analytics data
   */
  loadAllAnalytics(athleteId?: string): void {
    this.subscribe(
      this.analyticsDataService.getAllAnalytics(athleteId),
      {
        next: (data) => {
          if (data.performanceTrends) {
            this.performanceTrends.set(data.performanceTrends);
          }
          if (data.teamChemistry) {
            this.teamChemistry.set(data.teamChemistry);
          }
          if (data.trainingDistribution) {
            this.trainingDistribution.set(data.trainingDistribution);
          }
          if (data.positionPerformance) {
            this.positionPerformance.set(data.positionPerformance);
          }
          if (data.injuryRisk) {
            this.injuryRisk.set(data.injuryRisk);
          }
          if (data.speedDevelopment) {
            this.speedDevelopment.set(data.speedDevelopment);
          }
          this.initialized.set(true);
        }
      }
    );
  }

  /**
   * Load individual analytics sections
   */
  loadPerformanceTrends(athleteId?: string): void {
    this.subscribe(
      this.analyticsDataService.getPerformanceTrends(athleteId),
      {
        next: (data) => {
          this.performanceTrends.set(data);
        },
        showLoading: false
      }
    );
  }

  loadTeamChemistry(): void {
    this.subscribe(
      this.analyticsDataService.getTeamChemistry(),
      {
        next: (data) => {
          this.teamChemistry.set(data);
        },
        showLoading: false
      }
    );
  }

  loadTrainingDistribution(): void {
    this.subscribe(
      this.analyticsDataService.getTrainingDistribution(),
      {
        next: (data) => {
          this.trainingDistribution.set(data);
        },
        showLoading: false
      }
    );
  }

  /**
   * Start real-time updates
   */
  startRealTimeUpdates(athleteId?: string): void {
    this.realTimeEnabled.set(true);
    
    // Subscribe to reactive stream
    this.subscribe(
      this.performanceTrends$,
      {
        next: (data) => {
          this.performanceTrends.set(data);
        },
        showLoading: false
      }
    );
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates(): void {
    this.realTimeEnabled.set(false);
  }

  /**
   * Refresh all analytics data
   */
  refresh(athleteId?: string): void {
    this.initialized.set(false);
    this.loadAllAnalytics(athleteId);
  }

  /**
   * Reset all analytics state
   */
  override reset(): void {
    super.reset();
    this.stopRealTimeUpdates();
    this.performanceTrends.set(null);
    this.teamChemistry.set(null);
    this.trainingDistribution.set(null);
    this.positionPerformance.set(null);
    this.injuryRisk.set(null);
    this.speedDevelopment.set(null);
  }
}

