/**
 * Team Wellness Overview Component
 *
 * Coach view showing team-wide wellness status:
 * - At-a-glance team health
 * - Athletes needing attention
 * - Check-in compliance
 * - ACWR risk distribution
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";

// PrimeNG
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { ProgressBarModule } from "primeng/progressbar";
import { AvatarModule } from "primeng/avatar";
import { TooltipModule } from "primeng/tooltip";
import { BadgeModule } from "primeng/badge";
import { SkeletonModule } from "primeng/skeleton";

// Services
import { LoggerService } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { CONSENT_BLOCKED_MESSAGES } from "../../utils/privacy-ux-copy";

interface AthleteWellnessStatus {
  id: string;
  name: string;
  avatar?: string;
  position: string;
  lastCheckIn?: Date;
  checkedInToday: boolean;
  wellnessScore: number;
  acwr: number;
  acwrStatus: "optimal" | "caution" | "danger" | "unknown";
  alerts: string[];
  needsAttention: boolean;
  isConsentBlocked?: boolean;
}

interface TeamWellnessSummary {
  totalAthletes: number;
  checkedInToday: number;
  checkInRate: number;
  averageWellness: number;
  athletesAtRisk: number;
  athletesOptimal: number;
  athletesCaution: number;
}

@Component({
  selector: "app-team-wellness-overview",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TagModule,
    ProgressBarModule,
    AvatarModule,
    TooltipModule,
    BadgeModule,
    SkeletonModule,
  ],
  template: `
    <div class="team-wellness-overview">
      <!-- Partial Data Notice (when some athletes have blocked consent) -->
      @if (hasBlockedAthletes()) {
        <div class="partial-data-notice">
          <div class="notice-icon">
            <i class="pi pi-info-circle"></i>
          </div>
          <div class="notice-content">
            <h4>{{ partialDataMessage.title }}</h4>
            <p>{{ partialDataMessage.reason }}</p>
            <p class="notice-action">{{ partialDataMessage.action }}</p>
            <a [routerLink]="partialDataMessage.helpLink" class="notice-link">
              <i class="pi pi-external-link"></i>
              {{ partialDataMessage.actionLabel }}
            </a>
          </div>
        </div>
      }

      <!-- Summary Cards -->
      <div class="summary-grid">
        <!-- Check-in Rate -->
        <div class="summary-card checkin-card">
          <div class="card-header">
            <i class="pi pi-check-square"></i>
            <span>Today's Check-ins</span>
          </div>
          <div class="card-value">
            <span class="big-number">{{ summary().checkedInToday }}</span>
            <span class="total">/ {{ summary().totalAthletes }}</span>
          </div>
          <p-progressBar
            [value]="summary().checkInRate"
            [showValue]="false"
            [style]="{ height: '6px' }"
            [styleClass]="getCheckInClass()"
          ></p-progressBar>
          <span class="card-label"
            >{{ summary().checkInRate }}% compliance</span
          >
        </div>

        <!-- Team Wellness -->
        <div class="summary-card wellness-card">
          <div class="card-header">
            <i class="pi pi-heart"></i>
            <span>Team Wellness</span>
          </div>
          <div class="card-value">
            <span class="big-number" [class]="getWellnessClass()">
              {{ summary().averageWellness | number: "1.0-0" }}
            </span>
            <span class="unit">/100</span>
          </div>
          <div class="wellness-indicator">
            <div
              class="indicator-bar"
              [style.width.%]="summary().averageWellness"
              [class]="getWellnessClass()"
            ></div>
          </div>
          <span class="card-label">{{ getWellnessLabel() }}</span>
        </div>

        <!-- ACWR Distribution -->
        <div class="summary-card acwr-card">
          <div class="card-header">
            <i class="pi pi-chart-pie"></i>
            <span>ACWR Status</span>
          </div>
          <div class="acwr-distribution">
            <div
              class="acwr-segment optimal"
              [pTooltip]="summary().athletesOptimal + ' optimal'"
            >
              <span class="count">{{ summary().athletesOptimal }}</span>
              <span class="label">Optimal</span>
            </div>
            <div
              class="acwr-segment caution"
              [pTooltip]="summary().athletesCaution + ' caution'"
            >
              <span class="count">{{ summary().athletesCaution }}</span>
              <span class="label">Caution</span>
            </div>
            <div
              class="acwr-segment danger"
              [pTooltip]="summary().athletesAtRisk + ' at risk'"
            >
              <span class="count">{{ summary().athletesAtRisk }}</span>
              <span class="label">At Risk</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Needs Attention Section -->
      @if (athletesNeedingAttention().length > 0) {
        <div class="attention-section">
          <div class="section-header">
            <h3>
              <i class="pi pi-exclamation-triangle"></i>
              Needs Attention
              <p-badge
                [value]="athletesNeedingAttention().length.toString()"
              ></p-badge>
            </h3>
            <p-button
              label="View All"
              [text]="true"
              size="small"
              routerLink="/roster"
            ></p-button>
          </div>

          <div class="attention-list">
            @for (athlete of athletesNeedingAttention(); track athlete.id) {
              <div class="athlete-card attention">
                <div class="athlete-info">
                  <p-avatar
                    [label]="getInitials(athlete.name)"
                    [image]="athlete.avatar"
                    shape="circle"
                    size="large"
                  ></p-avatar>
                  <div class="athlete-details">
                    <span class="athlete-name">{{ athlete.name }}</span>
                    <span class="athlete-position">{{ athlete.position }}</span>
                  </div>
                </div>

                <div class="athlete-alerts">
                  @for (alert of athlete.alerts; track alert) {
                    <p-tag
                      [value]="alert"
                      severity="danger"
                      size="small"
                    ></p-tag>
                  }
                </div>

                <div class="athlete-metrics">
                  <div class="metric">
                    <span class="metric-label">Wellness</span>
                    <span
                      class="metric-value"
                      [class]="getScoreClass(athlete.wellnessScore)"
                    >
                      {{ athlete.wellnessScore }}
                    </span>
                  </div>
                  <div class="metric">
                    <span class="metric-label">ACWR</span>
                    <span class="metric-value" [class]="athlete.acwrStatus">
                      {{ athlete.acwr | number: "1.2-2" }}
                    </span>
                  </div>
                </div>

                <p-button
                  icon="pi pi-arrow-right"
                  [rounded]="true"
                  [text]="true"
                  [routerLink]="['/roster']"
                  [queryParams]="{ player: athlete.id }"
                  pTooltip="View athlete details"
                ></p-button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Not Checked In Section -->
      @if (athletesNotCheckedIn().length > 0) {
        <div class="not-checked-section">
          <div class="section-header">
            <h3>
              <i class="pi pi-clock"></i>
              Not Checked In Today
            </h3>
            <p-button
              label="Send Reminder"
              icon="pi pi-bell"
              size="small"
              [outlined]="true"
              (onClick)="sendReminders()"
            ></p-button>
          </div>

          <div class="not-checked-list">
            @for (athlete of athletesNotCheckedIn(); track athlete.id) {
              <div class="athlete-chip">
                <p-avatar
                  [label]="getInitials(athlete.name)"
                  [image]="athlete.avatar"
                  shape="circle"
                  size="normal"
                ></p-avatar>
                <span class="chip-name">{{ athlete.name }}</span>
                @if (athlete.lastCheckIn) {
                  <span class="last-checkin">
                    Last: {{ getRelativeTime(athlete.lastCheckIn) }}
                  </span>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- All Athletes Grid -->
      <div class="all-athletes-section">
        <div class="section-header">
          <h3>
            <i class="pi pi-users"></i>
            All Athletes
          </h3>
          <div class="filter-buttons">
            <button
              class="filter-btn"
              [class.active]="filter() === 'all'"
              (click)="setFilter('all')"
            >
              All
            </button>
            <button
              class="filter-btn"
              [class.active]="filter() === 'optimal'"
              (click)="setFilter('optimal')"
            >
              Optimal
            </button>
            <button
              class="filter-btn"
              [class.active]="filter() === 'caution'"
              (click)="setFilter('caution')"
            >
              Caution
            </button>
            <button
              class="filter-btn"
              [class.active]="filter() === 'danger'"
              (click)="setFilter('danger')"
            >
              At Risk
            </button>
          </div>
        </div>

        <div class="athletes-grid">
          @for (athlete of filteredAthletes(); track athlete.id) {
            <div
              class="athlete-mini-card"
              [class.not-checked]="!athlete.checkedInToday"
              [class.consent-blocked]="athlete.isConsentBlocked"
              (click)="onAthleteClick(athlete)"
            >
              <div class="mini-header">
                <p-avatar
                  [label]="getInitials(athlete.name)"
                  [image]="athlete.avatar"
                  shape="circle"
                ></p-avatar>
                @if (athlete.isConsentBlocked) {
                  <div class="status-indicator blocked">
                    <i class="pi pi-lock"></i>
                  </div>
                } @else {
                  <div
                    class="status-indicator"
                    [class]="athlete.acwrStatus"
                  ></div>
                }
              </div>
              <span class="mini-name">{{ athlete.name.split(" ")[0] }}</span>
              @if (athlete.isConsentBlocked) {
                <div class="mini-blocked-label">
                  <span>Private</span>
                </div>
              } @else {
                <div class="mini-metrics">
                  <span
                    class="mini-wellness"
                    [class]="getScoreClass(athlete.wellnessScore)"
                  >
                    {{ athlete.wellnessScore }}
                  </span>
                  <span class="mini-acwr" [class]="athlete.acwrStatus">
                    {{ athlete.acwr | number: "1.1-1" }}
                  </span>
                </div>
              }
              @if (!athlete.checkedInToday && !athlete.isConsentBlocked) {
                <div class="not-checked-badge">
                  <i class="pi pi-clock"></i>
                </div>
              }
              @if (athlete.isConsentBlocked) {
                <div
                  class="blocked-badge"
                  pTooltip="Data not shared - ask athlete to enable"
                >
                  <i class="pi pi-lock"></i>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .team-wellness-overview {
        display: flex;
        flex-direction: column;
        gap: var(--space-6);
      }

      /* Summary Grid */
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-4);
      }

      .summary-card {
        background: var(--surface-primary);
        border-radius: 16px;
        padding: var(--space-5);
        border: 1px solid var(--p-surface-200);
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-3);
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--text-secondary);
      }

      .card-header i {
        font-size: 1rem;
      }

      .checkin-card .card-header i {
        color: var(--p-blue-500);
      }

      .wellness-card .card-header i {
        color: var(--p-red-500);
      }

      .acwr-card .card-header i {
        color: var(--p-purple-500);
      }

      .card-value {
        display: flex;
        align-items: baseline;
        gap: var(--space-1);
        margin-bottom: var(--space-3);
      }

      .big-number {
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--text-primary);
        line-height: 1;
      }

      .big-number.good {
        color: var(--p-green-600);
      }

      .big-number.moderate {
        color: var(--p-orange-600);
      }

      .big-number.poor {
        color: var(--p-red-600);
      }

      .total,
      .unit {
        font-size: 1rem;
        color: var(--text-secondary);
      }

      .card-label {
        display: block;
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-top: var(--space-2);
      }

      :host ::ng-deep .checkin-green .p-progressbar-value {
        background: var(--p-green-500);
      }

      :host ::ng-deep .checkin-orange .p-progressbar-value {
        background: var(--p-orange-500);
      }

      :host ::ng-deep .checkin-red .p-progressbar-value {
        background: var(--p-red-500);
      }

      .wellness-indicator {
        height: 8px;
        background: var(--p-surface-200);
        border-radius: 4px;
        overflow: hidden;
      }

      .indicator-bar {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;
      }

      .indicator-bar.good {
        background: var(--p-green-500);
      }

      .indicator-bar.moderate {
        background: var(--p-orange-500);
      }

      .indicator-bar.poor {
        background: var(--p-red-500);
      }

      /* ACWR Distribution */
      .acwr-distribution {
        display: flex;
        gap: var(--space-3);
      }

      .acwr-segment {
        flex: 1;
        text-align: center;
        padding: var(--space-3);
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s;
      }

      .acwr-segment:hover {
        transform: scale(1.05);
      }

      .acwr-segment.optimal {
        background: var(--p-green-50);
      }

      .acwr-segment.caution {
        background: var(--p-orange-50);
      }

      .acwr-segment.danger {
        background: var(--p-red-50);
      }

      .acwr-segment .count {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
      }

      .acwr-segment.optimal .count {
        color: var(--p-green-600);
      }

      .acwr-segment.caution .count {
        color: var(--p-orange-600);
      }

      .acwr-segment.danger .count {
        color: var(--p-red-600);
      }

      .acwr-segment .label {
        font-size: 0.625rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Section Headers */
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);
      }

      .section-header h3 {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .section-header h3 i {
        font-size: 1rem;
      }

      /* Attention Section */
      .attention-section {
        background: var(--p-red-50);
        border-radius: 16px;
        padding: var(--space-5);
        border: 1px solid var(--p-red-200);
      }

      .attention-section .section-header h3 i {
        color: var(--p-red-500);
      }

      .attention-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .athlete-card {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4);
        background: white;
        border-radius: 12px;
      }

      .athlete-card.attention {
        border-left: 4px solid var(--p-red-400);
      }

      .athlete-info {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        flex: 1;
      }

      .athlete-details {
        display: flex;
        flex-direction: column;
      }

      .athlete-name {
        font-weight: 600;
        color: var(--text-primary);
      }

      .athlete-position {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .athlete-alerts {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      .athlete-metrics {
        display: flex;
        gap: var(--space-4);
      }

      .metric {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .metric-label {
        font-size: 0.625rem;
        color: var(--text-secondary);
        text-transform: uppercase;
      }

      .metric-value {
        font-size: 1rem;
        font-weight: 700;
      }

      .metric-value.good,
      .metric-value.optimal {
        color: var(--p-green-600);
      }

      .metric-value.moderate,
      .metric-value.caution {
        color: var(--p-orange-600);
      }

      .metric-value.poor,
      .metric-value.danger {
        color: var(--p-red-600);
      }

      /* Not Checked Section */
      .not-checked-section {
        background: var(--p-surface-50);
        border-radius: 16px;
        padding: var(--space-5);
      }

      .not-checked-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-3);
      }

      .athlete-chip {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: white;
        border-radius: 24px;
        border: 1px solid var(--p-surface-200);
      }

      .chip-name {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      .last-checkin {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      /* All Athletes Section */
      .filter-buttons {
        display: flex;
        gap: var(--space-2);
      }

      .filter-btn {
        padding: var(--space-2) var(--space-3);
        background: var(--p-surface-100);
        border: none;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s;
      }

      .filter-btn:hover {
        background: var(--p-surface-200);
      }

      .filter-btn.active {
        background: var(--color-brand-primary);
        color: white;
      }

      .athletes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: var(--space-3);
      }

      .athlete-mini-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-4);
        background: var(--surface-primary);
        border-radius: 12px;
        border: 1px solid var(--p-surface-200);
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      }

      .athlete-mini-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .athlete-mini-card.not-checked {
        opacity: 0.7;
        border-style: dashed;
      }

      .mini-header {
        position: relative;
      }

      .status-indicator {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid white;
      }

      .status-indicator.optimal {
        background: var(--p-green-500);
      }

      .status-indicator.caution {
        background: var(--p-orange-500);
      }

      .status-indicator.danger {
        background: var(--p-red-500);
      }

      .status-indicator.unknown {
        background: var(--p-surface-400);
      }

      .mini-name {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-primary);
        text-align: center;
      }

      .mini-metrics {
        display: flex;
        gap: var(--space-2);
        font-size: 0.625rem;
        font-weight: 600;
      }

      .mini-wellness.good {
        color: var(--p-green-600);
      }

      .mini-wellness.moderate {
        color: var(--p-orange-600);
      }

      .mini-wellness.poor {
        color: var(--p-red-600);
      }

      .mini-acwr.optimal {
        color: var(--p-green-600);
      }

      .mini-acwr.caution {
        color: var(--p-orange-600);
      }

      .mini-acwr.danger {
        color: var(--p-red-600);
      }

      .not-checked-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 20px;
        height: 20px;
        background: var(--p-orange-100);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .not-checked-badge i {
        font-size: 0.625rem;
        color: var(--p-orange-600);
      }

      /* Partial Data Notice */
      .partial-data-notice {
        display: flex;
        align-items: flex-start;
        gap: var(--space-4);
        padding: var(--space-4);
        background: var(--p-blue-50);
        border: 1px solid var(--p-blue-200);
        border-radius: 12px;
        margin-bottom: var(--space-4);
      }

      .notice-icon {
        width: 40px;
        height: 40px;
        background: var(--p-blue-100);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .notice-icon i {
        font-size: 1.25rem;
        color: var(--p-blue-600);
      }

      .notice-content {
        flex: 1;
      }

      .notice-content h4 {
        margin: 0 0 var(--space-1);
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .notice-content p {
        margin: 0 0 var(--space-1);
        font-size: 0.875rem;
        color: var(--text-secondary);
      }

      .notice-action {
        font-size: 0.8125rem;
        color: var(--text-secondary);
        font-style: italic;
      }

      .notice-link {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        margin-top: var(--space-2);
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--p-blue-600);
        text-decoration: none;
      }

      .notice-link:hover {
        text-decoration: underline;
      }

      .notice-link i {
        font-size: 0.75rem;
      }

      /* Consent Blocked Athlete Card */
      .athlete-mini-card.consent-blocked {
        opacity: 0.75;
        border-style: dashed;
        border-color: var(--p-surface-300);
        cursor: pointer;
      }

      .athlete-mini-card.consent-blocked:hover {
        border-color: var(--p-blue-400);
      }

      .status-indicator.blocked {
        background: var(--p-surface-400);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .status-indicator.blocked i {
        font-size: 6px;
        color: white;
      }

      .mini-blocked-label {
        font-size: 0.625rem;
        color: var(--text-secondary);
        font-style: italic;
      }

      .blocked-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 20px;
        height: 20px;
        background: var(--p-surface-400);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .blocked-badge i {
        font-size: 0.625rem;
        color: white;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .summary-grid {
          grid-template-columns: 1fr;
        }

        .athlete-card {
          flex-wrap: wrap;
        }

        .athlete-metrics {
          width: 100%;
          justify-content: space-around;
        }

        .athletes-grid {
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
        }
      }
    `,
  ],
})
export class TeamWellnessOverviewComponent implements OnInit {
  private logger = inject(LoggerService);
  private supabaseService = inject(SupabaseService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  // State
  isLoading = signal(true);
  filter = signal<"all" | "optimal" | "caution" | "danger">("all");

  athletes = signal<AthleteWellnessStatus[]>([]);

  // Get partial data message from centralized privacy copy
  partialDataMessage = CONSENT_BLOCKED_MESSAGES.coachTeamPartialBlock;

  // Computed values
  summary = computed<TeamWellnessSummary>(() => {
    const all = this.athletes();
    const checkedIn = all.filter((a) => a.checkedInToday);
    const atRisk = all.filter((a) => a.acwrStatus === "danger");
    const caution = all.filter((a) => a.acwrStatus === "caution");
    const optimal = all.filter((a) => a.acwrStatus === "optimal");

    const avgWellness =
      all.length > 0
        ? all.reduce((sum, a) => sum + a.wellnessScore, 0) / all.length
        : 0;

    return {
      totalAthletes: all.length,
      checkedInToday: checkedIn.length,
      checkInRate:
        all.length > 0 ? Math.round((checkedIn.length / all.length) * 100) : 0,
      averageWellness: avgWellness,
      athletesAtRisk: atRisk.length,
      athletesCaution: caution.length,
      athletesOptimal: optimal.length,
    };
  });

  athletesNeedingAttention = computed(() => {
    return this.athletes().filter((a) => a.needsAttention);
  });

  athletesNotCheckedIn = computed(() => {
    return this.athletes().filter((a) => !a.checkedInToday);
  });

  filteredAthletes = computed(() => {
    const all = this.athletes();
    const f = this.filter();

    if (f === "all") return all;
    return all.filter((a) => a.acwrStatus === f);
  });

  ngOnInit(): void {
    this.loadTeamData();
  }

  private async loadTeamData(): Promise<void> {
    try {
      // Load team roster with wellness data
      // This would typically come from a combined query
      const mockAthletes: AthleteWellnessStatus[] = [
        {
          id: "1",
          name: "Alex Johnson",
          position: "QB",
          checkedInToday: true,
          wellnessScore: 85,
          acwr: 1.1,
          acwrStatus: "optimal",
          alerts: [],
          needsAttention: false,
        },
        {
          id: "2",
          name: "Maria Garcia",
          position: "WR",
          checkedInToday: true,
          wellnessScore: 62,
          acwr: 1.6,
          acwrStatus: "danger",
          alerts: ["High ACWR", "Low Sleep"],
          needsAttention: true,
        },
        {
          id: "3",
          name: "James Wilson",
          position: "RB",
          checkedInToday: false,
          lastCheckIn: new Date(Date.now() - 24 * 60 * 60 * 1000),
          wellnessScore: 75,
          acwr: 0.9,
          acwrStatus: "optimal",
          alerts: [],
          needsAttention: false,
        },
        {
          id: "4",
          name: "Sarah Chen",
          position: "DB",
          checkedInToday: true,
          wellnessScore: 70,
          acwr: 1.4,
          acwrStatus: "caution",
          alerts: ["Elevated ACWR"],
          needsAttention: false,
        },
        {
          id: "5",
          name: "Mike Thompson",
          position: "LB",
          checkedInToday: false,
          lastCheckIn: new Date(Date.now() - 48 * 60 * 60 * 1000),
          wellnessScore: 55,
          acwr: 0.6,
          acwrStatus: "caution",
          alerts: ["Low training load"],
          needsAttention: true,
        },
        // Add more mock athletes...
      ];

      this.athletes.set(mockAthletes);
      this.isLoading.set(false);
    } catch (error) {
      this.logger.error("Error loading team data:", error);
      this.isLoading.set(false);
    }
  }

  setFilter(f: "all" | "optimal" | "caution" | "danger"): void {
    this.filter.set(f);
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  getCheckInClass(): string {
    const rate = this.summary().checkInRate;
    if (rate >= 80) return "checkin-green";
    if (rate >= 50) return "checkin-orange";
    return "checkin-red";
  }

  getWellnessClass(): string {
    const score = this.summary().averageWellness;
    if (score >= 70) return "good";
    if (score >= 50) return "moderate";
    return "poor";
  }

  getWellnessLabel(): string {
    const score = this.summary().averageWellness;
    if (score >= 80) return "Excellent team wellness";
    if (score >= 70) return "Good team wellness";
    if (score >= 50) return "Moderate - some concerns";
    return "Low - needs attention";
  }

  getScoreClass(score: number): string {
    if (score >= 70) return "good";
    if (score >= 50) return "moderate";
    return "poor";
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Recently";
  }

  sendReminders(): void {
    // Would integrate with notification service
    this.logger.info("Sending check-in reminders to athletes");
    this.toastService.info("Sending check-in reminders to athletes...");
  }

  /**
   * Check if any athletes have blocked consent
   */
  hasBlockedAthletes(): boolean {
    return this.athletes().some((a) => a.isConsentBlocked);
  }

  /**
   * Handle click on a blocked athlete card
   */
  onBlockedAthleteClick(athlete: AthleteWellnessStatus): void {
    this.toastService.info(
      `${athlete.name}'s data is private. Ask them to enable sharing in their Privacy Settings.`,
    );
  }

  /**
   * Handle click on an athlete card - navigate to roster with player query param
   */
  onAthleteClick(athlete: AthleteWellnessStatus): void {
    if (athlete.isConsentBlocked) {
      this.onBlockedAthleteClick(athlete);
    } else {
      this.router.navigate(["/roster"], {
        queryParams: { player: athlete.id },
      });
    }
  }
}
