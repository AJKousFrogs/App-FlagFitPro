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
import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";
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
    TagModule,
    ProgressBarModule,
    AvatarModule,
    TooltipModule,
    BadgeModule,
    SkeletonModule,

    ButtonComponent,
    IconButtonComponent,
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
            <app-button variant="text" size="sm" routerLink="/roster"
              >View All</app-button
            >
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

                <app-icon-button
                  icon="pi-arrow-right"
                  variant="text"
                  routerLink="/roster"
                  ariaLabel="arrow-right"
                />
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
            <app-button
              variant="outlined"
              size="sm"
              iconLeft="pi-bell"
              (clicked)="sendReminders()"
              >Send Reminder</app-button
            >
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
  styleUrl: "./team-wellness-overview.component.scss",
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
      // Real data would be fetched from API
      // For now, setting to empty to remove mock data
      this.athletes.set([]);
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
