import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";
import type { ApiResponse } from "../core/models/common.models";

interface AthleteInjury {
  id: string;
  athlete_id: string;
  athlete_name: string;
  injury_type: string;
  status: "acute" | "rehab" | "rtp";
  current_phase: number;
  estimated_return_date: string;
  rts_rate_percent: number;
  created_at: string;
  daysToReturn?: number;
}

interface DashboardData {
  injuries: AthleteInjury[];
  stats: {
    total_active: number;
    in_phase_1: number;
    in_phase_2: number;
    in_phase_3: number;
    in_phase_4: number;
    in_phase_5: number;
  };
}

type FilterStatus = "all" | "acute" | "rehab" | "rtp";

@Component({
  selector: "app-physiotherapist-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <h1>Physiotherapist Dashboard</h1>
        <p class="subtitle">Manage athlete injuries and return-to-play protocols</p>
      </div>

      <!-- Stats Grid -->
      @if (!loading() && dashboardData(); as data) {
        <div class="stats-grid">
          <div class="stat-card total">
            <div class="stat-value">{{ data.stats.total_active || 0 }}</div>
            <div class="stat-label">Active Cases</div>
          </div>

          <div class="stat-card phase-1">
            <div class="stat-value">{{ data.stats.in_phase_1 || 0 }}</div>
            <div class="stat-label">Phase 1</div>
          </div>

          <div class="stat-card phase-2">
            <div class="stat-value">{{ data.stats.in_phase_2 || 0 }}</div>
            <div class="stat-label">Phase 2</div>
          </div>

          <div class="stat-card phase-3">
            <div class="stat-value">{{ data.stats.in_phase_3 || 0 }}</div>
            <div class="stat-label">Phase 3</div>
          </div>

          <div class="stat-card phase-4">
            <div class="stat-value">{{ data.stats.in_phase_4 || 0 }}</div>
            <div class="stat-label">Phase 4</div>
          </div>

          <div class="stat-card phase-5">
            <div class="stat-value">{{ data.stats.in_phase_5 || 0 }}</div>
            <div class="stat-label">Phase 5</div>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="filters-section">
        <div class="filter-group">
          <span class="filter-label">Filter by Status:</span>
          <div class="filter-buttons">
            @for (status of statuses; track status) {
              <button
                [class.active]="statusFilter() === status"
                (click)="statusFilter.set(status)"
                class="filter-btn"
              >
                {{ formatStatus(status) }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Content -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i-lucide name="alert-triangle"></i-lucide>
          <p>{{ error() }}</p>
        </div>
      } @else if (filteredInjuries().length === 0) {
        <div class="empty-state">
          <i-lucide name="inbox"></i-lucide>
          <p>No injuries matching this status</p>
        </div>
      } @else {
        <div class="injuries-section">
          <h2 class="section-title">Active Cases</h2>

          <div class="injuries-grid">
            @for (injury of filteredInjuries(); track injury.id) {
              <div class="injury-card" [attr.data-status]="injury.status">
                <div class="card-header">
                  <div>
                    <h3>{{ injury.athlete_name }}</h3>
                    <p class="injury-type">{{ injury.injury_type }}</p>
                  </div>
                  <span class="status-badge" [attr.data-status]="injury.status">
                    {{ formatStatus(injury.status) }}
                  </span>
                </div>

                <div class="card-content">
                  <div class="info-row">
                    <span class="label">Current Phase:</span>
                    <span class="value phase-badge" [attr.data-phase]="injury.current_phase">
                      Phase {{ injury.current_phase }}/5
                    </span>
                  </div>

                  <div class="info-row">
                    <span class="label">Est. Return Date:</span>
                    <span class="value">
                      @if (injury.daysToReturn !== undefined) {
                        @if (injury.daysToReturn <= 0) {
                          <span class="overdue">Overdue</span>
                        } @else {
                          {{ injury.daysToReturn }}d
                        }
                      }
                    </span>
                  </div>

                  <div class="info-row">
                    <span class="label">RTS Rate:</span>
                    <span class="value">{{ injury.rts_rate_percent }}%</span>
                  </div>
                </div>

                <div class="card-actions">
                  <a
                    [routerLink]="['/staff/physio-protocol', injury.athlete_id, injury.id]"
                    class="btn-link"
                  >
                    View Details
                    <i-lucide name="arrow-right" class="icon"></i-lucide>
                  </a>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        max-width: 1400px;
        margin: 0 auto;
        padding: 30px 20px;
      }

      .dashboard-header {
        margin-bottom: 40px;
      }

      .dashboard-header h1 {
        font-size: 32px;
        font-weight: 700;
        margin: 0 0 8px 0;
        color: #333;
      }

      .subtitle {
        font-size: 16px;
        color: #666;
        margin: 0;
      }

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 20px;
        margin-bottom: 40px;
      }

      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        text-align: center;
        border-left: 4px solid #999;
      }

      .stat-card.total {
        border-left-color: #667eea;
      }

      .stat-card.phase-1 {
        border-left-color: #c92a2a;
      }

      .stat-card.phase-2 {
        border-left-color: #e65100;
      }

      .stat-card.phase-3 {
        border-left-color: #f59f00;
      }

      .stat-card.phase-4 {
        border-left-color: #1976d2;
      }

      .stat-card.phase-5 {
        border-left-color: #155724;
      }

      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: #333;
        margin-bottom: 8px;
      }

      .stat-label {
        font-size: 13px;
        color: #666;
        text-transform: uppercase;
        font-weight: 600;
      }

      /* Filters */
      .filters-section {
        background: #f9f9f9;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 30px;
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }

      .filter-label {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        white-space: nowrap;
      }

      .filter-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .filter-btn {
        padding: 8px 16px;
        border: 1px solid #ddd;
        border-radius: 6px;
        background: white;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .filter-btn:hover {
        border-color: #667eea;
        color: #667eea;
      }

      .filter-btn.active {
        background: #667eea;
        color: white;
        border-color: #667eea;
      }

      /* States */
      .loading-state,
      .error-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 80px 20px;
        text-align: center;
        color: #666;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e0e0e0;
        border-top-color: #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Injuries Section */
      .injuries-section {
        margin-top: 40px;
      }

      .section-title {
        font-size: 20px;
        font-weight: 600;
        margin: 0 0 24px 0;
        color: #333;
      }

      .injuries-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 20px;
      }

      /* Injury Card */
      .injury-card {
        background: white;
        border-radius: 12px;
        border: 1px solid #e0e0e0;
        overflow: hidden;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
      }

      .injury-card:hover {
        border-color: #667eea;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .card-header {
        padding: 20px;
        border-bottom: 1px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .card-header h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 4px 0;
        color: #333;
      }

      .injury-type {
        font-size: 13px;
        color: #666;
        margin: 0;
      }

      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        white-space: nowrap;
      }

      .status-badge[data-status="acute"] {
        background: #fee;
        color: #c33;
      }

      .status-badge[data-status="rehab"] {
        background: #fef0e0;
        color: #d97706;
      }

      .status-badge[data-status="rtp"] {
        background: #e8f5e9;
        color: #2e7d32;
      }

      .card-content {
        padding: 16px 20px;
        flex: 1;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-size: 13px;
      }

      .info-row:last-child {
        margin-bottom: 0;
      }

      .info-row .label {
        color: #999;
        font-weight: 500;
      }

      .info-row .value {
        color: #333;
        font-weight: 600;
      }

      .phase-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 12px;
        font-weight: 600;
      }

      .phase-badge[data-phase="1"] {
        background: #ffe3e3;
        color: #c92a2a;
      }

      .phase-badge[data-phase="2"] {
        background: #fff3e0;
        color: #e65100;
      }

      .phase-badge[data-phase="3"] {
        background: #fff9e6;
        color: #f59f00;
      }

      .phase-badge[data-phase="4"] {
        background: #e3f2fd;
        color: #1976d2;
      }

      .phase-badge[data-phase="5"] {
        background: #d4edda;
        color: #155724;
      }

      .overdue {
        color: #c92a2a;
        font-weight: 700;
      }

      .card-actions {
        padding: 16px 20px;
        border-top: 1px solid #f0f0f0;
        background: #fafafa;
      }

      .btn-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #667eea;
        text-decoration: none;
        font-size: 13px;
        font-weight: 600;
        transition: color 0.2s;
      }

      .btn-link:hover {
        color: #5568d3;
      }

      .btn-link .icon {
        width: 16px;
        height: 16px;
      }
    `,
  ],
})
export class PhysiotherapistDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private logger = inject(LoggerService);

  loading = signal(false);
  error = signal<string | null>(null);
  dashboardData = signal<DashboardData | null>(null);

  statusFilter = signal<FilterStatus>("all");
  statuses: FilterStatus[] = ["all", "acute", "rehab", "rtp"];

  filteredInjuries = computed(() => {
    const data = this.dashboardData();
    if (!data?.injuries) return [];

    let filtered = [...data.injuries];

    if (this.statusFilter() !== "all") {
      filtered = filtered.filter((i) => i.status === this.statusFilter());
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.estimated_return_date).getTime();
      const dateB = new Date(b.estimated_return_date).getTime();
      return dateA - dateB;
    });

    return filtered;
  });

  ngOnInit() {
    this.loadDashboard();
  }

  private loadDashboard() {
    this.loading.set(true);
    this.error.set(null);

    this.api.get<DashboardData>("/api/staff/physiotherapist/dashboard").subscribe({
      next: (response: ApiResponse<DashboardData>) => {
        const payload = response?.data || (response as unknown as DashboardData);
        if (payload?.injuries) {
          const injuriesWithCalcs = payload.injuries.map((injury: AthleteInjury) => {
            const returnDate = new Date(injury.estimated_return_date);
            const today = new Date();
            const daysToReturn = Math.ceil(
              (returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            return { ...injury, daysToReturn };
          });

          this.dashboardData.set({
            ...payload,
            injuries: injuriesWithCalcs,
          });

          this.logger.info(`Loaded ${injuriesWithCalcs.length} injuries`);
        }
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.logger.error("Failed to load dashboard", err);
        this.error.set("Failed to load dashboard data");
        this.loading.set(false);
      },
    });
  }

  formatStatus(status: string): string {
    const map: Record<string, string> = {
      all: "All Cases",
      acute: "Acute",
      rehab: "Rehabilitation",
      rtp: "Return-to-Play",
    };
    return map[status] || status;
  }
}
