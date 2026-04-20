/**
 * Playbook Manager Component (Coach View)
 *
 * Create, manage, and organize team plays. Design formations, routes, and
 * assignments. Track which plays players have memorized.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { ProgressBar } from "primeng/progressbar";
import { TableModule } from "primeng/table";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { SearchInputComponent } from "../../../shared/components/search-input/search-input.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

import { LoggerService } from "../../../core/services/logger.service";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { CoachPlaybookDataService } from "../services/coach-playbook-data.service";

// ===== Interfaces =====
interface Play {
  id: string;
  name: string;
  formation: string;
  situation: string;
  type: "offense" | "defense" | "special";
  assignments: PlayAssignment[];
  coachNotes: string;
  teamMemorized: number;
  status: "active" | "archived";
  createdAt: string;
}

interface PlayAssignment {
  position: string;
  playerName?: string;
  route?: string;
  instructions: string[];
  isPrimary?: boolean;
}

interface MemorizationStatus {
  playerId: string;
  playerName: string;
  status: "memorized" | "needs-review" | "not-started";
  memorizedAt?: string;
  quizScore?: number;
  lastStudied?: string;
}

// ===== Constants =====
const FORMATIONS = [
  { label: "Trips Right", value: "trips-right" },
  { label: "Trips Left", value: "trips-left" },
  { label: "Stack", value: "stack" },
  { label: "Spread", value: "spread" },
  { label: "Bunch Right", value: "bunch-right" },
  { label: "Bunch Left", value: "bunch-left" },
  { label: "Empty", value: "empty" },
];

const SITUATIONS = [
  { label: "Base Offense", value: "base" },
  { label: "Red Zone", value: "red-zone" },
  { label: "3rd & Short", value: "3rd-short" },
  { label: "3rd & Long", value: "3rd-long" },
  { label: "Deep Shot", value: "deep-shot" },
  { label: "2-Minute Drill", value: "2-minute" },
];

const ROUTES = [
  { label: "Out (→)", value: "out" },
  { label: "Corner (↗)", value: "corner" },
  { label: "Slant (↓)", value: "slant" },
  { label: "Mesh (↘)", value: "mesh" },
  { label: "Go (↑)", value: "go" },
  { label: "Curl (↙)", value: "curl" },
  { label: "Post (⬆)", value: "post" },
  { label: "Drag (⬅)", value: "drag" },
];

@Component({
  selector: "app-playbook-manager",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppDialogComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
    FormInputComponent,
    SearchInputComponent,
    ProgressBar,
    SelectComponent,
    TableModule,
    TextareaComponent,

    MainLayoutComponent,
    PageHeaderComponent,

    ButtonComponent,
    EmptyStateComponent,
    StatusTagComponent,
  ],
  templateUrl: "./playbook-manager.component.html",
  styleUrl: "./playbook-manager.component.scss",
})
export class PlaybookManagerComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly coachPlaybookDataService = inject(CoachPlaybookDataService);

  // State
  readonly activeTab = signal<
    "all" | "offense" | "defense" | "special" | "archived"
  >("all");
  readonly plays = signal<Play[]>([]);
  readonly memorizationData = signal<MemorizationStatus[]>([]);
  readonly selectedPlay = signal<Play | null>(null);
  readonly isLoading = signal(true);
  readonly isEditing = signal(false);
  readonly isViewing = signal(false);

  // Filter state
  searchQuery = "";
  formationFilter: string | null = null;
  situationFilter: string | null = null;

  // Dialog state
  showPlayDialog = false;
  showStatsDialog = false;

  // Form
  playForm = this.getEmptyPlayForm();

  // Options
  readonly formationOptions = FORMATIONS;
  readonly situationOptions = SITUATIONS;
  readonly routeOptions = ROUTES;

  // Computed
  readonly filteredPlays = computed(() => {
    let result = this.plays();

    // Filter by tab
    const tab = this.activeTab();
    if (tab === "archived") {
      result = result.filter((p) => p.status === "archived");
    } else if (tab !== "all") {
      result = result.filter((p) => p.type === tab && p.status === "active");
    } else {
      result = result.filter((p) => p.status === "active");
    }

    // Filter by search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }

    // Filter by formation
    if (this.formationFilter) {
      result = result.filter((p) => p.formation === this.formationFilter);
    }

    // Filter by situation
    if (this.situationFilter) {
      result = result.filter((p) => p.situation === this.situationFilter);
    }

    return result;
  });

  readonly totalPlays = computed(
    () => this.plays().filter((p) => p.status === "active").length,
  );

  readonly offensePlays = computed(
    () =>
      this.plays().filter((p) => p.type === "offense" && p.status === "active")
        .length,
  );

  readonly defensePlays = computed(
    () =>
      this.plays().filter((p) => p.type === "defense" && p.status === "active")
        .length,
  );

  readonly avgMemorized = computed(() => {
    const active = this.plays().filter((p) => p.status === "active");
    if (active.length === 0) return 0;
    return Math.round(
      active.reduce((sum, p) => sum + p.teamMemorized, 0) / active.length,
    );
  });

  readonly memorizedPlayers = computed(() =>
    this.memorizationData().filter((m) => m.status === "memorized"),
  );

  readonly needsReviewPlayers = computed(() =>
    this.memorizationData().filter((m) => m.status !== "memorized"),
  );

  readonly memorizedCount = computed(() => this.memorizedPlayers().length);

  readonly totalPlayers = computed(() => this.memorizationData().length);

  ngOnInit(): void {
    this.loadData();
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery = value;
  }

  onFormationFilterChange(value: string | null): void {
    this.formationFilter = value;
  }

  onSituationFilterChange(value: string | null): void {
    this.situationFilter = value;
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const { plays, memorization, error } =
        await this.coachPlaybookDataService.loadPlaybook();

      if (error) {
        throw error;
      }

      this.plays.set(plays);
      this.memorizationData.set(memorization);
    } catch (err) {
      this.logger.error("Failed to load playbook", err);
      this.plays.set([]);
      this.memorizationData.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private getEmptyPlayForm() {
    return {
      id: "",
      name: "",
      formation: "trips-right",
      situation: "base",
      type: "offense" as "offense" | "defense" | "special",
      assignments: [
        { position: "QB", instructions: [""] },
        { position: "WR1", instructions: [""], isPrimary: true },
        { position: "WR2", instructions: [""] },
        { position: "WR3", instructions: [""] },
        { position: "C", instructions: [""] },
      ],
      coachNotes: "",
    };
  }

  private populatePlayForm(play: Play): void {
    this.playForm = {
      id: play.id,
      name: play.name,
      formation: play.formation,
      situation: play.situation,
      type: play.type,
      assignments: play.assignments.map((assignment) => ({
        ...assignment,
        instructions: [...assignment.instructions],
      })),
      coachNotes: play.coachNotes,
    };
  }

  closePlayDialog(): void {
    this.showPlayDialog = false;
    this.isEditing.set(false);
    this.isViewing.set(false);
    this.playForm = this.getEmptyPlayForm();
  }

  closeStatsDialog(): void {
    this.showStatsDialog = false;
  }

  onPlayNameChange(value: string): void {
    this.playForm = { ...this.playForm, name: value };
  }

  onPlayFormationChange(value: string | null): void {
    this.playForm = { ...this.playForm, formation: value ?? "trips-right" };
  }

  onPlaySituationChange(value: string | null): void {
    this.playForm = { ...this.playForm, situation: value ?? "base" };
  }

  onPlayTypeChange(value: "offense" | "defense" | "special"): void {
    this.playForm = { ...this.playForm, type: value };
  }

  onAssignmentInstructionChange(index: number, value: string): void {
    this.playForm = {
      ...this.playForm,
      assignments: this.playForm.assignments.map((assignment, i) =>
        i === index
          ? {
              ...assignment,
              instructions: [value],
            }
          : assignment,
      ),
    };
  }

  onPlayCoachNotesChange(value: string): void {
    this.playForm = { ...this.playForm, coachNotes: value };
  }

  // Dialog methods
  openCreateDialog(): void {
    this.closePlayDialog();
    this.showPlayDialog = true;
  }

  readonly openCreateDialogHandler = (): void => this.openCreateDialog();

  editPlay(play: Play): void {
    this.isEditing.set(true);
    this.isViewing.set(false);
    this.selectedPlay.set(play);
    this.populatePlayForm(play);
    this.showPlayDialog = true;
  }

  async savePlay(): Promise<void> {
    if (!this.playForm.name) return;

    const { data, error } = await this.coachPlaybookDataService.savePlay({
      id: this.playForm.id || undefined,
      name: this.playForm.name,
      formation: this.playForm.formation,
      situation: this.playForm.situation,
      type: this.playForm.type,
      assignments: this.playForm.assignments,
      coachNotes: this.playForm.coachNotes,
      status: "active",
    });

    if (error || !data) {
      this.logger.error("Failed to save play", error);
      this.toastService.error("We couldn't save this play.", "Save Failed");
      return;
    }

    this.plays.update((plays) => {
      const existingIndex = plays.findIndex((play) => play.id === data.id);
      if (existingIndex === -1) {
        return [data, ...plays];
      }

      return plays.map((play) => (play.id === data.id ? data : play));
    });
    this.toastService.success(`${data.name} has been saved`, "Play Saved");
    this.closePlayDialog();
  }

  viewPlay(play: Play): void {
    this.selectedPlay.set(play);
    this.isEditing.set(false);
    this.isViewing.set(true);
    this.populatePlayForm(play);
    this.showPlayDialog = true;
  }

  editViewedPlay(): void {
    const play = this.selectedPlay();
    if (!play) {
      return;
    }
    this.editPlay(play);
  }

  viewStats(play: Play): void {
    this.selectedPlay.set(play);
    this.showStatsDialog = true;
  }

  async archivePlay(play: Play): Promise<void> {
    const { error } = await this.coachPlaybookDataService.archivePlay(play.id);
    if (error) {
      this.logger.error("Failed to archive play", error);
      this.toastService.error(
        "We couldn't archive this play.",
        "Archive Failed",
      );
      return;
    }

    this.plays.update((plays) =>
      plays.map((p) =>
        p.id === play.id ? { ...p, status: "archived" as const } : p,
      ),
    );
    this.toastService.info(`${play.name} has been archived`, "Play Archived");
  }

  sendReminder(status: MemorizationStatus): void {
    this.toastService.success(
      `Reminder sent to ${status.playerName}`,
      "Reminder Sent",
    );
  }

  sendAllReminders(): void {
    const count = this.needsReviewPlayers().length;
    this.toastService.success(
      `Reminders sent to ${count} players`,
      "Reminders Sent",
    );
  }

  // Helper methods
  getFormationLabel(value: string): string {
    return FORMATIONS.find((f) => f.value === value)?.label || value;
  }

  getSituationLabel(value: string): string {
    return SITUATIONS.find((s) => s.value === value)?.label || value;
  }
}
