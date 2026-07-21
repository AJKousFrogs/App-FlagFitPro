import {
  Component,
  signal,
  computed,
  inject,
  input,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";

interface ProtocolAssignment {
  id: string;
  athlete_id: string;
  athlete_name: string;
  injury_id: string;
  injury_type: string;
  current_phase: number;
  phase_name: string;
  estimated_return_date: string;
  rts_rate_percent: number;
  created_at: string;
  daysToReturn?: number;
  phaseProgress?: {
    passed: number;
    total: number;
  };
}

interface ProtocolListResponse {
  protocols: ProtocolAssignment[];
  phaseProgress: Record<string, { passed: number; total: number }>;
  count: number;
}

type SortBy = "phase" | "returnDate" | "injury" | "athlete";

@Component({
  selector: "app-rtp-protocol-list",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="protocol-list-container">
      <div class="list-header">
        <h2>Active Return-to-Play Protocols</h2>
        <p class="header-subtitle">
          {{
            filteredProtocols().length === 0
              ? "No active protocols"
              : filteredProtocols().length + " protocol(s)"
          }}
        </p>
      </div>

      <!-- Filters and Controls -->
      <div class="controls-section">
        <div class="filter-group">
          <div class="search-box">
            <i-lucide name="search" class="search-icon"></i-lucide>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              placeholder="Search by athlete or injury..."
              class="search-input"
            />
          </div>

          <div class="phase-filter">
            <select [(ngModel)]="phaseFilter" class="filter-select">
              <option value="">All Phases</option>
              <option value="1">Phase 1</option>
              <option value="2">Phase 2</option>
              <option value="3">Phase 3</option>
              <option value="4">Phase 4</option>
              <option value="5">Phase 5</option>
            </select>
          </div>

          <div class="sort-control">
            <select [(ngModel)]="sortBy" class="filter-select">
              <option value="returnDate">Sort by Return Date</option>
              <option value="phase">Sort by Phase</option>
              <option value="injury">Sort by Injury</option>
              <option value="athlete">Sort by Athlete</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Protocol List -->
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading protocols...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <i-lucide name="alert-triangle"></i-lucide>
          <p>{{ error() }}</p>
        </div>
      } @else if (filteredProtocols().length === 0) {
        <div class="empty-state">
          <i-lucide name="inbox"></i-lucide>
          <p>No protocols matching your search</p>
        </div>
      } @else {
        <div class="protocol-cards">
          @for (protocol of filteredProtocols(); track protocol.id) {
            <a
              [routerLink]="[
                '/staff/physio-protocol',
                protocol.athlete_id,
                protocol.injury_id,
              ]"
              class="protocol-card"
              [attr.data-phase]="protocol.current_phase"
            >
              <!-- Phase Badge -->
              <div class="phase-badge" [ngClass]="'phase-' + protocol.current_phase">
                Phase {{ protocol.current_phase }}/5
              </div>

              <!-- Athlete & Injury -->
              <div class="protocol-header">
                <h3>{{ protocol.athlete_name }}</h3>
                <p class="injury-type">{{ protocol.injury_type }}</p>
              </div>

              <!-- Status Grid -->
              <div class="status-grid">
                <div class="status-item">
                  <span class="label">Current Phase</span>
                  <span class="value">{{ protocol.phase_name }}</span>
                </div>

                <div class="status-item">
                  <span class="label">Return Date</span>
                  <span class="value">
                    @if (protocol.daysToReturn !== undefined) {
                      @if (protocol.daysToReturn <= 0) {
                        <span class="overdue">Overdue</span>
                      } @else {
                        {{ protocol.daysToReturn }}d
                      }
                    }
                  </span>
                </div>

                <div class="status-item">
                  <span class="label">RTS Rate</span>
                  <span class="value">{{ protocol.rts_rate_percent }}%</span>
                </div>

                <div class="status-item">
                  <span class="label">Phase Progress</span>
                  @if (protocol.phaseProgress) {
                    <span class="value">
                      {{ protocol.phaseProgress.passed }}/{{
                        protocol.phaseProgress.total
                      }}
                    </span>
                  }
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="progress-container">
                @if (protocol.phaseProgress) {
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      [style.width.%]="
                        (protocol.phaseProgress.passed /
                          protocol.phaseProgress.total) *
                          100
                      "
                    ></div>
                  </div>
                  <p class="progress-text">
                    {{ protocol.phaseProgress.passed }}/{{
                      protocol.phaseProgress.total
                    }}
                    criteria passed
                  </p>
                }
              </div>

              <!-- Arrow -->
              <div class="card-arrow">
                <i-lucide name="arrow-right" class="w-5 h-5"></i-lucide>
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .protocol-list-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      .list-header {
        margin-bottom: 25px;
      }

      .list-header h2 {
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 5px 0;
      }

      .header-subtitle {
        font-size: 14px;
        color: #666;
        margin: 0;
      }

      /* Controls Section */
      .controls-section {
        margin-bottom: 25px;
        padding: 15px;
        background: #f9f9f9;
        border-radius: 8px;
      }

      .filter-group {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .search-box {
        flex: 1;
        min-width: 250px;
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-icon {
        position: absolute;
        left: 10px;
        width: 18px;
        height: 18px;
        color: #999;
        pointer-events: none;
      }

      .search-input {
        width: 100%;
        padding: 8px 12px 8px 35px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
      }

      .search-input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }

      .filter-select {
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        background: white;
      }

      .filter-select:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }

      /* States */
      .loading-state,
      .error-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        text-align: center;
        color: #666;
      }

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e0e0e0;
        border-top-color: #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* Protocol Cards */
      .protocol-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 15px;
      }

      .protocol-card {
        display: flex;
        flex-direction: column;
        padding: 16px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        text-decoration: none;
        color: inherit;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .protocol-card:hover {
        border-color: #007bff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      /* Phase Badge */
      .phase-badge {
        display: inline-block;
        width: fit-content;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        margin-bottom: 12px;
      }

      .phase-badge.phase-1 {
        background: #ffe3e3;
        color: #c92a2a;
      }

      .phase-badge.phase-2 {
        background: #fff3e0;
        color: #e65100;
      }

      .phase-badge.phase-3 {
        background: #fff9e6;
        color: #f59f00;
      }

      .phase-badge.phase-4 {
        background: #e3f2fd;
        color: #1976d2;
      }

      .phase-badge.phase-5 {
        background: #d4edda;
        color: #155724;
      }

      /* Protocol Header */
      .protocol-header {
        margin-bottom: 12px;
      }

      .protocol-header h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 4px 0;
      }

      .injury-type {
        font-size: 13px;
        color: #666;
        margin: 0;
      }

      /* Status Grid */
      .status-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f0f0f0;
      }

      .status-item {
        display: flex;
        flex-direction: column;
      }

      .status-item .label {
        font-size: 11px;
        text-transform: uppercase;
        color: #999;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .status-item .value {
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }

      .status-item .overdue {
        color: #c92a2a;
        font-weight: 700;
      }

      /* Progress */
      .progress-container {
        margin-bottom: 12px;
      }

      .progress-bar {
        width: 100%;
        height: 6px;
        background: #e0e0e0;
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: 4px;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #007bff, #0056b3);
        transition: width 0.3s ease;
      }

      .progress-text {
        font-size: 12px;
        color: #666;
        margin: 0;
      }

      /* Card Arrow */
      .card-arrow {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .protocol-card:hover .card-arrow {
        opacity: 1;
      }
    `,
  ],
})
export class RtpProtocolListComponent implements OnInit {
  private api = inject(ApiService);
  private logger = inject(LoggerService);

  teamId = input<string | undefined>(undefined);

  loading = signal(false);
  error = signal<string | null>(null);
  protocols = signal<ProtocolAssignment[]>([]);

  searchTerm = signal("");
  phaseFilter = signal("");
  sortBy = signal<SortBy>("returnDate");

  filteredProtocols = computed(() => {
    let filtered = this.protocols();

    // Phase filter
    if (this.phaseFilter()) {
      filtered = filtered.filter(
        (p) => p.current_phase === parseInt(this.phaseFilter())
      );
    }

    // Search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.athlete_name.toLowerCase().includes(search) ||
          p.injury_type.toLowerCase().includes(search)
      );
    }

    // Sort
    const sortBy = this.sortBy();
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "phase":
          return b.current_phase - a.current_phase;
        case "returnDate":
          return (
            new Date(a.estimated_return_date).getTime() -
            new Date(b.estimated_return_date).getTime()
          );
        case "injury":
          return a.injury_type.localeCompare(b.injury_type);
        case "athlete":
          return a.athlete_name.localeCompare(b.athlete_name);
        default:
          return 0;
      }
    });

    return filtered;
  });

  ngOnInit() {
    this.loadProtocols();
  }

  private loadProtocols() {
    this.loading.set(true);
    this.error.set(null);

    const endpoint = this.teamId()
      ? `/api/rtp/team/${this.teamId()}/protocols`
      : `/api/rtp/protocols`;

    this.api.get<ProtocolListResponse>(endpoint).subscribe({
      next: (response: Record<string, unknown> | ProtocolListResponse) => {
        const payload = ((response as Record<string, unknown>)?.data || response) as ProtocolListResponse;
        if (payload?.protocols) {
          const protocolsWithCalcs = payload.protocols.map(
            (p: ProtocolAssignment) => {
              const returnDate = new Date(p.estimated_return_date);
              const today = new Date();
              const daysToReturn = Math.ceil(
                (returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );

              return {
                ...p,
                daysToReturn,
                phaseProgress: payload.phaseProgress?.[p.id] || {
                  passed: 0,
                  total: 0,
                },
              };
            }
          );

          this.protocols.set(protocolsWithCalcs);
          this.logger.info(`Loaded ${protocolsWithCalcs.length} protocols`);
        }
        this.loading.set(false);
      },
      error: (err: Error) => {
        this.logger.error("Failed to load protocols", err);
        this.error.set("Failed to load protocols");
        this.loading.set(false);
      },
    });
  }
}
