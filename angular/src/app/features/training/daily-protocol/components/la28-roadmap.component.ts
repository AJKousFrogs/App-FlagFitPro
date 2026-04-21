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
  templateUrl: "./la28-roadmap.component.html",
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

  formatDate(date?: string, formatStr = "MMM yyyy"): string {
    if (!date) return "";
    return formatDateUtil(date, formatStr);
  }
}
