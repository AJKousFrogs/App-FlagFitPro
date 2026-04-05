import {
  ChangeDetectionStrategy,
  Component,
  signal,
  computed,
  inject,
} from "@angular/core";
import { firstValueFrom } from "rxjs";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";
import { Card } from "primeng/card";
import { Tag } from "primeng/tag";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";
import { AppLoadingComponent } from "../../../../shared/components/loading/loading.component";
import { EmptyStateComponent } from "../../../../shared/components/empty-state/empty-state.component";
import { PageErrorStateComponent } from "../../../../shared/components/page-error-state/page-error-state.component";
import {
  getMappedStatusSeverity,
  roadmapStatusSeverityMap,
} from "../../../../shared/utils/status.utils";
import { Tooltip } from "primeng/tooltip";
import { ProgressBar } from "primeng/progressbar";
import { Timeline } from "primeng/timeline";
import { ApiService, API_ENDPOINTS } from "../../../../core/services/api.service";
import { LoggerService } from "../../../../core/services/logger.service";
import { extractApiPayload } from "../../../../core/utils/api-response-mapper";
import { formatDate as formatDateUtil } from "../../../../shared/utils/date.utils";
import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";
import {
  AppDialogComponent,
  DialogHeaderComponent,
} from "../../../../shared/components/ui-components";

interface ProgramCycle {
  id: string;
  cycle_name: string;
  cycle_year: string;
  start_date: string;
  end_date: string;
  focus_area: string;
  target_event: string;
  description: string;
  cycle_order: number;
}

interface PlayerCycle {
  id: string;
  cycle_id: string;
  status: "not_started" | "in_progress" | "completed";
  started_at?: string;
  completed_at?: string;
  completion_percentage: number;
  notes?: string;
  program_cycle?: ProgramCycle;
}

interface Milestone {
  title: string;
  date: string;
  type: "tournament" | "cycle" | "checkpoint" | "olympics";
  description: string;
  status: "past" | "current" | "upcoming";
  icon: string;
}

@Component({
  selector: "app-la28-roadmap",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Tag,
    StatusTagComponent,
    Tooltip,
    ProgressBar,
    Timeline,
    Card,
    IconButtonComponent,
    AppLoadingComponent,
    EmptyStateComponent,
    PageErrorStateComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    CardShellComponent,
  ],
  template: `
    <div class="roadmap-panel">
      <!-- Summary Card -->
      <div class="summary-card">
        <div class="summary-header">
          <div class="header-content">
            <h3><i class="pi pi-trophy" aria-hidden="true"></i> Road to LA28</h3>
            <span class="days-count">{{ daysUntilOlympics() }} days</span>
          </div>
          <app-icon-button
            icon="pi-external-link"
            variant="text"
            ariaLabel="View LA28 roadmap details"
            tooltip="View details"
          />
        </div>

        @if (isLoading()) {
          <app-loading message="Loading roadmap..." variant="inline" />
        } @else if (loadError()) {
          <app-page-error-state
            title="Unable to load roadmap"
            [message]="loadError()!"
            (retry)="retryLoadCycles()"
          />
        } @else if (playerCycles().length === 0) {
          <app-empty-state
            icon="pi-map"
            heading="No roadmap available yet"
            description="Your coach has not assigned any long-term program cycles yet."
          />
        } @else {
          <!-- Progress Ring -->
          <div class="progress-overview">
            <div class="progress-ring">
              <svg viewBox="0 0 100 100">
                <circle class="ring-bg" cx="50" cy="50" r="45" />
                <circle
                  class="ring-fill"
                  cx="50"
                  cy="50"
                  r="45"
                  [style.strokeDasharray]="ringCircumference"
                  [style.strokeDashoffset]="ringOffset()"
                />
              </svg>
              <div class="ring-content">
                <span class="ring-value">{{ overallProgress() }}%</span>
                <span class="ring-label">Complete</span>
              </div>
            </div>

            <div class="current-phase">
              <span class="phase-label">Current Phase</span>
              <span class="phase-name">{{
                currentCycle()?.program_cycle?.cycle_name || "Not Started"
              }}</span>
              @if (currentCycle()?.program_cycle?.focus_area) {
                <span class="phase-focus">{{
                  currentCycle()?.program_cycle?.focus_area
                }}</span>
              }
            </div>
          </div>

          <!-- Mini Timeline -->
          <div class="mini-timeline">
            @for (
              milestone of upcomingMilestones().slice(0, 3);
              track milestone.title
            ) {
              <div class="milestone-item" [class]="milestone.status">
                <span class="milestone-icon" aria-hidden="true"
                  ><i [class]="'pi ' + milestone.icon"></i
                ></span>
                <div class="milestone-info">
                  <span class="milestone-title">{{ milestone.title }}</span>
                  <span class="milestone-date">{{
                    formatDate(milestone.date, "MMM yyyy")
                  }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Full Dialog -->
      <app-dialog
        [(visible)]="showFullDialog"
        [blockScroll]="true"
        [draggable]="false"
        dialogSize="2xl"
        styleClass="la28-roadmap-dialog"
        ariaLabel="Road to LA28 Olympics"
      >
        <app-dialog-header
          icon="trophy"
          title="Road to LA28 Olympics"
          subtitle="Track your long-term progress toward the Games"
          (close)="showFullDialog = false"
        />

        <div class="roadmap-full">
          <!-- Stats Header -->
          <div class="stats-header">
            <div class="stat-item stat-block stat-block--compact">
              <div class="stat-block__content">
                <span class="stat-block__value">{{ daysUntilOlympics() }}</span>
                <span class="stat-block__label">Days Until LA28</span>
              </div>
            </div>
            <div class="stat-item stat-block stat-block--compact">
              <div class="stat-block__content">
                <span class="stat-block__value"
                  >{{ completedCycles() }}/{{ totalCycles() }}</span
                >
                <span class="stat-block__label">Cycles Completed</span>
              </div>
            </div>
            <div class="stat-item stat-block stat-block--compact">
              <div class="stat-block__content">
                <span class="stat-block__value">{{ overallProgress() }}%</span>
                <span class="stat-block__label">Overall Progress</span>
              </div>
            </div>
          </div>

          <!-- Cycle Cards -->
          <div class="cycles-section">
            <h4>Training Cycles</h4>
            <div class="cycles-grid">
              @for (cycle of playerCycles(); track cycle.id) {
                <div
                  class="cycle-card"
                  [class.active]="cycle.status === 'in_progress'"
                  [class.completed]="cycle.status === 'completed'"
                >
                  <div class="cycle-header">
                    <div class="cycle-year">
                      {{ cycle.program_cycle?.cycle_year }}
                    </div>
                    <app-status-tag
                      [value]="getStatusLabel(cycle.status)"
                      [severity]="getStatusSeverity(cycle.status)"
                      size="sm"
                    />
                  </div>
                  <h5>{{ cycle.program_cycle?.cycle_name }}</h5>
                  <p class="cycle-focus">
                    {{ cycle.program_cycle?.focus_area }}
                  </p>
                  @if (cycle.program_cycle?.target_event) {
                    <div class="target-event">
                      <i class="pi pi-flag"></i>
                      {{ cycle.program_cycle?.target_event }}
                    </div>
                  }
                  @if (cycle.status !== "not_started") {
                    <div class="cycle-progress">
                      <p-progressBar
                        [value]="cycle.completion_percentage"
                        [showValue]="false"
                        class="h-2"
                      />
                      <span class="progress-text"
                        >{{ cycle.completion_percentage }}%</span
                      >
                    </div>
                  }
                  <p class="cycle-dates">
                    {{
                      formatDate(cycle.program_cycle?.start_date, "MMM yyyy")
                    }}
                    -
                    {{ formatDate(cycle.program_cycle?.end_date, "MMM yyyy") }}
                  </p>
                </div>
              }
            </div>
          </div>

          <!-- Timeline -->
          <div class="timeline-section">
            <h4>Journey Timeline</h4>
            <p-timeline
              [value]="milestones()"
              align="alternate"
              class="roadmap-timeline"
            >
              <ng-template #content let-event>
                <app-card-shell
                  class="milestone-card"
                  [title]="event.title"
                  [subtitle]="formatDate(event.date, 'MMM yyyy')"
                  density="compact"
                >
                  <p>{{ event.description }}</p>
                  <app-status-tag
                    [value]="event.type"
                    [severity]="getMilestoneTypeSeverity(event.type)"
                    size="sm"
                  />
                </app-card-shell>
              </ng-template>
              <ng-template #opposite let-event>
                <span class="milestone-icon-large" aria-hidden="true"
                  ><i [class]="'pi ' + event.icon"></i
                ></span>
              </ng-template>
            </p-timeline>
          </div>

          <!-- Olympic Countdown -->
          <div class="olympic-countdown">
            <div class="countdown-content">
              <div class="olympic-rings"><i class="pi pi-trophy" aria-hidden="true"></i></div>
              <div class="countdown-text">
                <h3>LA 2028 Olympics</h3>
                <p>Flag Football Debut</p>
                <div class="countdown-numbers">
                  <div class="countdown-item">
                    <span class="number">{{ countdownYears() }}</span>
                    <span class="label">Years</span>
                  </div>
                  <div class="countdown-item">
                    <span class="number">{{ countdownMonths() }}</span>
                    <span class="label">Months</span>
                  </div>
                  <div class="countdown-item">
                    <span class="number">{{ countdownDays() }}</span>
                    <span class="label">Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </app-dialog>
    </div>
  `,
  styleUrl: "./la28-roadmap.component.scss",
})
export class La28RoadmapComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  // LA 2028 Olympics date (July 14, 2028 - Opening Ceremony)
  private readonly olympicsDate = new Date("2028-07-14");
  readonly ringCircumference = 2 * Math.PI * 45; // circumference = 2πr

  readonly playerCycles = signal<PlayerCycle[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  showFullDialog = false;

  // Computed values
  readonly daysUntilOlympics = computed(() => {
    const now = new Date();
    const diff = this.olympicsDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  });

  readonly countdownYears = computed(() => {
    const days = this.daysUntilOlympics();
    return Math.floor(days / 365);
  });

  readonly countdownMonths = computed(() => {
    const days = this.daysUntilOlympics();
    const remainingDays = days % 365;
    return Math.floor(remainingDays / 30);
  });

  readonly countdownDays = computed(() => {
    const days = this.daysUntilOlympics();
    return days % 30;
  });

  readonly totalCycles = computed(() => this.playerCycles().length);

  readonly completedCycles = computed(
    () => this.playerCycles().filter((c) => c.status === "completed").length,
  );

  readonly overallProgress = computed(() => {
    const cycles = this.playerCycles();
    if (cycles.length === 0) return 0;
    const total = cycles.reduce((sum, c) => sum + c.completion_percentage, 0);
    return Math.round(total / cycles.length);
  });

  readonly ringOffset = computed(() => {
    const progress = this.overallProgress();
    return this.ringCircumference * (1 - progress / 100);
  });

  readonly currentCycle = computed(() =>
    this.playerCycles().find((c) => c.status === "in_progress"),
  );

  readonly milestones = computed<Milestone[]>(() => {
    const now = new Date();
    const milestones: Milestone[] = [];

    // Add cycles as milestones
    this.playerCycles().forEach((cycle) => {
      const startDate = new Date(cycle.program_cycle?.start_date || "");
      milestones.push({
        title: cycle.program_cycle?.cycle_name || "Training Cycle",
        date: cycle.program_cycle?.start_date || "",
        type: "cycle",
        description: cycle.program_cycle?.description || "",
        status:
          startDate < now
            ? cycle.status === "completed"
              ? "past"
              : "current"
            : "upcoming",
        icon:
          cycle.status === "completed"
            ? "pi-check"
            : cycle.status === "in_progress"
              ? "pi-forward"
              : "pi-calendar",
      });
    });

    // Add Olympic milestone
    milestones.push({
      title: "LA 2028 Olympics",
      date: "2028-07-14",
      type: "olympics",
      description: "Flag Football Olympic Debut - Los Angeles",
      status: "upcoming",
      icon: "pi-trophy",
    });

    return milestones.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  });

  readonly upcomingMilestones = computed(() => {
    const now = new Date();
    return this.milestones()
      .filter((m) => new Date(m.date) >= now || m.status === "current")
      .slice(0, 5);
  });

  constructor() {
    // Initialize on construction (Angular 21 pattern)
    void this.loadCycles();
  }

  async loadCycles(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const response = await firstValueFrom(
        this.api.get<PlayerCycle[] | null>(API_ENDPOINTS.programCycles),
      );
      const payload = extractApiPayload<PlayerCycle[] | null>(response);
      if (Array.isArray(payload)) {
        this.playerCycles.set(payload);
      } else {
        this.playerCycles.set([]);
        this.logger.info("No program cycles found - showing empty state");
      }
    } catch (err) {
      this.logger.error("Failed to load program cycles", err);
      this.playerCycles.set([]);
      this.loadError.set(
        "We couldn't load your long-term roadmap. Please try again.",
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  retryLoadCycles(): void {
    void this.loadCycles();
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      not_started: "Not Started",
      in_progress: "In Progress",
      completed: "Completed",
    };
    return labels[status] || status;
  }

  getStatusSeverity(
    status: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    return getMappedStatusSeverity(
      status,
      roadmapStatusSeverityMap,
      "secondary",
    );
  }

  getMilestoneTypeSeverity(
    type: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    const severities: Record<
      string,
      "success" | "info" | "warning" | "danger" | "secondary" | "contrast"
    > = {
      tournament: "info",
      cycle: "secondary",
      checkpoint: "warning",
      olympics: "success",
    };
    return severities[type] || "secondary";
  }

  formatDate(date?: string, formatStr: string = "MMM yyyy"): string {
    if (!date) return "";
    return formatDateUtil(date, formatStr);
  }
}
