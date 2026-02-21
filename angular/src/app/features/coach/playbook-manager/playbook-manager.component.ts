/**
 * Playbook Manager Component (Coach View)
 *
 * Create, manage, and organize team plays. Design formations, routes, and
 * assignments. Track which plays players have memorized.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { ProgressBar } from "primeng/progressbar";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ApiResponse } from "../../../core/models/common.models";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Dialog,
    
    InputText,
    ProgressBar,
    RadioButton,
    Select,
    TableModule,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,

    ButtonComponent,
    EmptyStateComponent,
    StatusTagComponent,
  ],
  template: `
    <app-main-layout>
<div class="playbook-manager-page">
        <app-page-header
          title="Playbook Manager"
          subtitle="Create and manage team plays"
          icon="pi-book"
        >
          <app-button iconLeft="pi-plus" (clicked)="openCreateDialog()"
            >New Play</app-button
          >
        </app-page-header>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'all'"
            (click)="activeTab.set('all')"
          >
            All Plays
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'offense'"
            (click)="activeTab.set('offense')"
          >
            Offense
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'defense'"
            (click)="activeTab.set('defense')"
          >
            Defense
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'special'"
            (click)="activeTab.set('special')"
          >
            Special
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'archived'"
            (click)="activeTab.set('archived')"
          >
            Archived
          </button>
        </div>

        <!-- Filters -->
        <div class="filters-row">
          <span class="p-input-icon-left filter-search">
            <i class="pi pi-search"></i>
            <input
              type="text"
              pInputText
              placeholder="Search plays..."
              [(ngModel)]="searchQuery"
            />
          </span>
          <p-select
            [options]="formationOptions"
            [(ngModel)]="formationFilter"
            placeholder="Formation"
            [showClear]="true"
            class="playbook-filter-select"
          ></p-select>
          <p-select
            [options]="situationOptions"
            [(ngModel)]="situationFilter"
            placeholder="Situation"
            [showClear]="true"
            class="playbook-filter-select"
          ></p-select>
        </div>

        <!-- Stats Summary -->
        <div class="stats-summary">
          <div class="stat-card">
            <span class="stat-icon"><i class="pi pi-list" aria-hidden="true"></i></span>
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ totalPlays() }}</span>
              <span class="stat-block__label">Total Plays</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><i class="pi pi-shield" aria-hidden="true"></i></span>
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ offensePlays() }}</span>
              <span class="stat-block__label">Offense</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><i class="pi pi-shield" aria-hidden="true"></i></span>
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ defensePlays() }}</span>
              <span class="stat-block__label">Defense</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><i class="pi pi-chart-bar" aria-hidden="true"></i></span>
            <div class="stat-content stat-block__content">
              <span class="stat-block__value">{{ avgMemorized() }}%</span>
              <span class="stat-block__label">Team Memorized</span>
            </div>
          </div>
        </div>

        <!-- Plays Grid -->
        @if (filteredPlays().length > 0) {
          <div class="plays-grid">
            @for (play of filteredPlays(); track play.id) {
              <div class="play-card">
                <div class="play-diagram">
                  <div class="diagram-placeholder">
                    <span class="formation-label">{{
                      getFormationLabel(play.formation)
                    }}</span>
                    <div class="mini-field">
                      <div class="end-zone"></div>
                      <div class="player-positions">
                        <span class="player-dot center">C</span>
                        <span class="player-dot qb">QB</span>
                        <span class="player-dot wr1">WR</span>
                        <span class="player-dot wr2">WR</span>
                        <span class="player-dot wr3">WR</span>
                      </div>
                      <div class="line-of-scrimmage"></div>
                    </div>
                  </div>
                </div>

                <div class="play-info">
                  <h4>{{ play.name }}</h4>
                  <p class="play-details">
                    {{ getFormationLabel(play.formation) }} •
                    {{ getSituationLabel(play.situation) }}
                  </p>
                </div>

                <div class="memorization-bar">
                  <span class="mem-label"
                    >Team Memorized: {{ play.teamMemorized }}%</span
                  >
                  <p-progressBar
                    [value]="play.teamMemorized"
                    [showValue]="false"
                    class="memorization-progress"
                  ></p-progressBar>
                  @if (play.teamMemorized < 70) {
                    <span class="mem-warning">⚠️ Low memorization</span>
                  }
                </div>

                <div class="play-actions">
                  <app-button
                    variant="secondary"
                    size="sm"
                    iconLeft="pi-pencil"
                    (clicked)="editPlay(play)"
                    >Edit</app-button
                  >
                  <app-button
                    variant="text"
                    size="sm"
                    iconLeft="pi-eye"
                    (clicked)="viewPlay(play)"
                    >View</app-button
                  >
                  <app-button
                    variant="text"
                    size="sm"
                    iconLeft="pi-chart-bar"
                    (clicked)="viewStats(play)"
                    >Stats</app-button
                  >
                  <app-button
                    variant="text"
                    size="sm"
                    iconLeft="pi-archive"
                    (clicked)="archivePlay(play)"
                    >Archive play</app-button
                  >
                </div>
              </div>
            }
          </div>
        } @else {
          <p-card class="empty-state-card">
            <app-empty-state
              icon="pi-book"
              heading="No Plays Found"
              description="Create your first play to get started"
              actionLabel="Create Play"
              actionIcon="pi-plus"
              [actionHandler]="openCreateDialogHandler"
            />
          </p-card>
        }
      </div>

      <!-- Create/Edit Play Dialog -->
      <p-dialog
        [(visible)]="showPlayDialog"
        [header]="isEditing() ? 'Edit Play' : 'Create New Play'"
        [modal]="true"
        class="play-dialog"
      >
        <div class="play-form">
          <div class="form-columns">
            <!-- Left: Designer -->
            <div class="designer-column">
              <h4>Play Designer</h4>
              <div class="play-designer">
                <div class="field-canvas">
                  <div class="end-zone-area">END ZONE</div>
                  <div class="play-area">
                    <div class="player-marker center" draggable="true">C</div>
                    <div class="player-marker qb" draggable="true">QB</div>
                    <div class="player-marker wr1" draggable="true">WR1</div>
                    <div class="player-marker wr2" draggable="true">WR2</div>
                    <div class="player-marker wr3" draggable="true">WR3</div>
                  </div>
                  <div class="scrimmage-line">LINE OF SCRIMMAGE</div>
                </div>
                <div class="designer-tools">
                  <span class="tool-label">Tools:</span>
                  <app-button
                    variant="secondary"
                    size="sm"
                    iconLeft="pi-arrows-alt"
                    >Select</app-button
                  >
                  <app-button variant="secondary" size="sm" iconLeft="pi-pencil"
                    >Draw</app-button
                  >
                  <app-button
                    variant="secondary"
                    size="sm"
                    iconLeft="pi-map-marker"
                    >Add player</app-button
                  >
                  <app-button variant="text" size="sm" iconLeft="pi-trash"
                    >Delete</app-button
                  >
                  <app-button variant="text" size="sm" iconLeft="pi-undo"
                    >Undo</app-button
                  >
                </div>
                <div class="route-buttons">
                  <span class="tool-label">Routes:</span>
                  @for (route of routeOptions; track route.value) {
                    <app-button variant="text" size="sm"></app-button>
                  }
                </div>
              </div>
            </div>

            <!-- Right: Details -->
            <div class="details-column">
              <h4>Play Details</h4>
              <div class="form-field">
                <label for="playName">Play Name</label>
                <input
                  id="playName"
                  type="text"
                  pInputText
                  [(ngModel)]="playForm.name"
                  placeholder="e.g., Mesh Right"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="formation">Formation</label>
                <p-select
                  inputId="formation"
                  [options]="formationOptions"
                  [(ngModel)]="playForm.formation"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select formation"
                  class="w-full"
                ></p-select>
              </div>

              <div class="form-field">
                <label for="situation">Situation</label>
                <p-select
                  inputId="situation"
                  [options]="situationOptions"
                  [(ngModel)]="playForm.situation"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select situation"
                  class="w-full"
                ></p-select>
              </div>

              <div class="form-field">
                <label>Type</label>
                <div class="radio-group">
                  <div class="radio-option">
                    <p-radioButton
                      name="type"
                      value="offense"
                      [(ngModel)]="playForm.type"
                      inputId="typeOff"
                    ></p-radioButton>
                    <label for="typeOff">Offense</label>
                  </div>
                  <div class="radio-option">
                    <p-radioButton
                      name="type"
                      value="defense"
                      [(ngModel)]="playForm.type"
                      inputId="typeDef"
                    ></p-radioButton>
                    <label for="typeDef">Defense</label>
                  </div>
                </div>
              </div>

              <h4>Assignments</h4>
              <div class="assignments-section">
                @for (
                  assignment of playForm.assignments;
                  track assignment.position
                ) {
                  <div
                    class="assignment-item"
                    [class.primary]="assignment.isPrimary"
                  >
                    <div class="assignment-header">
                      <strong>{{ assignment.position }}</strong>
                      @if (assignment.isPrimary) {
                        <app-status-tag
                          value="PRIMARY"
                          severity="success"
                          size="sm"
                        />
                      }
                    </div>
                    <textarea
                      pTextarea
                      [(ngModel)]="assignment.instructions[0]"
                      placeholder="Instructions for this position..."
                      rows="2"
                    ></textarea>
                  </div>
                }
              </div>

              <h4>Coach Notes</h4>
              <textarea
                pTextarea
                [(ngModel)]="playForm.coachNotes"
                placeholder="When to call this play, key coaching points..."
                rows="4"
              ></textarea>
            </div>
          </div>
        </div>

        <ng-template #footer>
          <app-button variant="secondary" (clicked)="showPlayDialog = false"
            >Cancel</app-button
          >
          <app-button
            iconLeft="pi-check"
            [disabled]="!playForm.name"
            (clicked)="savePlay()"
            >Save Play</app-button
          >
        </ng-template>
      </p-dialog>

      <!-- Stats Dialog -->
      <p-dialog
        [(visible)]="showStatsDialog"
        header="Memorization Stats"
        [modal]="true"
        class="play-stats-dialog"
      >
        @if (selectedPlay()) {
          <div class="stats-content">
            <div class="stats-header">
              <h3>{{ selectedPlay()?.name }}</h3>
              <p>
                Team Memorization: {{ selectedPlay()?.teamMemorized }}% ({{
                  memorizedCount()
                }}/{{ totalPlayers() }} players)
              </p>
            </div>

            <div class="memorization-section">
              <h4>Memorized ({{ memorizedCount() }})</h4>
              <div class="player-list memorized">
                @for (status of memorizedPlayers(); track status.playerId) {
                  <div class="player-row">
                    <span class="status-icon"><i class="pi pi-check" aria-hidden="true"></i></span>
                    <span class="player-name">{{ status.playerName }}</span>
                    <span class="memorized-date"
                      >Memorized {{ status.memorizedAt }}</span
                    >
                    <span class="quiz-score"
                      >Quiz: {{ status.quizScore }}%</span
                    >
                  </div>
                }
              </div>
            </div>

            @if (needsReviewPlayers().length > 0) {
              <div class="memorization-section">
                <h4>Needs Review ({{ needsReviewPlayers().length }})</h4>
                <div class="player-list needs-review">
                  @for (status of needsReviewPlayers(); track status.playerId) {
                    <div class="player-row">
                      <span class="status-icon"><i class="pi pi-refresh" aria-hidden="true"></i></span>
                      <span class="player-name">{{ status.playerName }}</span>
                      <span class="last-studied">{{
                        status.lastStudied || "Never studied"
                      }}</span>
                      <app-button
                        variant="secondary"
                        size="sm"
                        (clicked)="sendReminder(status)"
                        >Send Reminder</app-button
                      >
                    </div>
                  }
                </div>
              </div>
            }

            <div class="stats-actions">
              <app-button
                variant="secondary"
                iconLeft="pi-bell"
                [disabled]="needsReviewPlayers().length === 0"
                (clicked)="sendAllReminders()"
                >Send Reminder to All Unmemorized</app-button
              >
            </div>
          </div>
        }
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./playbook-manager.component.scss",
})
export class PlaybookManagerComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // State
  readonly activeTab = signal<
    "all" | "offense" | "defense" | "special" | "archived"
  >("all");
  readonly plays = signal<Play[]>([]);
  readonly memorizationData = signal<MemorizationStatus[]>([]);
  readonly selectedPlay = signal<Play | null>(null);
  readonly isLoading = signal(true);
  readonly isEditing = signal(false);

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

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response: ApiResponse<{ plays?: Play[] }> = await firstValueFrom(
        this.api.get(API_ENDPOINTS.coach.playbook),
      );
      if (response?.success && response.data?.plays) {
        this.plays.set(response.data.plays);
      }
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

  // Dialog methods
  openCreateDialog(): void {
    this.isEditing.set(false);
    this.playForm = this.getEmptyPlayForm();
    this.showPlayDialog = true;
  }

  readonly openCreateDialogHandler = (): void => this.openCreateDialog();

  editPlay(play: Play): void {
    this.isEditing.set(true);
    this.playForm = {
      id: play.id,
      name: play.name,
      formation: play.formation,
      situation: play.situation,
      type: play.type,
      assignments: play.assignments.map((a) => ({
        ...a,
        instructions: [...a.instructions],
      })),
      coachNotes: play.coachNotes,
    };
    this.showPlayDialog = true;
  }

  savePlay(): void {
    if (!this.playForm.name) return;

    this.toastService.success(
      `${this.playForm.name} has been saved`,
      "Play Saved",
    );
    this.showPlayDialog = false;
    // Would submit to API
  }

  viewPlay(play: Play): void {
    this.toastService.info(`Opening ${play.name} in full view`, "View Play");
  }

  viewStats(play: Play): void {
    this.selectedPlay.set(play);
    this.showStatsDialog = true;
  }

  archivePlay(play: Play): void {
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
