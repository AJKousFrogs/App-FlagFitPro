/**
 * Dashboard ViewModel
 *
 * Manages dashboard state using signals
 * Subscribes to DashboardDataService for data fetching
 *
 * Pattern: View Model = Signals (state) + RxJS (data fetching)
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { BaseViewModel } from "./base.view-model";
import {
  DashboardDataService,
  DashboardStats,
  DashboardData,
} from "../services/data/dashboard-data.service";

@Injectable()
export class DashboardViewModel extends BaseViewModel {
  private dashboardDataService = inject(DashboardDataService);

  // State signals
  readonly stats = signal<DashboardStats | null>(null);
  readonly recentActivity = signal<{ id: string; type: string; date: string; description: string }[]>([]);
  readonly upcomingSessions = signal<{ id: string; title: string; date: string; type: string }[]>([]);
  readonly performanceChartData = signal<{ labels: string[]; datasets: { label: string; data: number[] }[] } | null>(null);
  readonly trainingChartData = signal<{ labels: string[]; datasets: { label: string; data: number[] }[] } | null>(null);

  // Derived/computed signals
  readonly hasData = computed(() => this.stats() !== null);
  readonly totalSessions = computed(() => this.stats()?.totalSessions ?? 0);
  readonly performanceScore = computed(
    () => this.stats()?.performanceScore ?? 0,
  );
  readonly weeklyLoad = computed(() => this.stats()?.weeklyLoad ?? 0);
  readonly acwr = computed(() => this.stats()?.acwr ?? 0);

  /**
   * Initialize dashboard - loads all data
   */
  override initialize(athleteId?: string): void {
    if (this.initialized()) {
      return; // Already initialized
    }

    this.loadDashboard(athleteId);
  }

  /**
   * Load dashboard data
   */
  loadDashboard(_athleteId?: string): void {
    this.subscribe(this.dashboardDataService.getDashboard(), {
      next: (data: DashboardData) => {
        this.stats.set(data.stats);
        this.recentActivity.set(data.recentActivity || []);
        this.upcomingSessions.set(data.upcomingSessions || []);
        this.performanceChartData.set(data.performanceChart);
        this.trainingChartData.set(data.trainingChart);
        this.initialized.set(true);
      },
      error: (err) => {
        this.handleError(err);
        // Set defaults on error
        this.stats.set({
          totalSessions: 0,
          performanceScore: 0,
          weeklyLoad: 0,
          acwr: 0,
        });
      },
    });
  }

  /**
   * Refresh dashboard data
   */
  refresh(): void {
    this.initialized.set(false);
    this.loadDashboard();
  }

  /**
   * Load recent activity
   */
  loadRecentActivity(limit: number = 10): void {
    this.subscribe(this.dashboardDataService.getRecentActivity(limit), {
      next: (activity) => {
        this.recentActivity.set(activity);
      },
      showLoading: false, // Don't show loading for background updates
    });
  }

  /**
   * Load upcoming sessions
   */
  loadUpcomingSessions(limit: number = 5): void {
    this.subscribe(this.dashboardDataService.getUpcomingSessions(limit), {
      next: (sessions) => {
        this.upcomingSessions.set(sessions);
      },
      showLoading: false,
    });
  }

  /**
   * Reset all dashboard state
   */
  override reset(): void {
    super.reset();
    this.stats.set(null);
    this.recentActivity.set([]);
    this.upcomingSessions.set([]);
    this.performanceChartData.set(null);
    this.trainingChartData.set(null);
  }
}
