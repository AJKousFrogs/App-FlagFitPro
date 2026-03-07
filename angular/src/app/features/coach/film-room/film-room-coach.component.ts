/**
 * Film Room Component (Coach View)
 *
 * Upload and manage game/practice film, create timestamps and tags for players,
 * assign film to team or individuals, and track viewing compliance.
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
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";

import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";

import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";

import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ApiResponse } from "../../../core/models/common.models";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

// ===== Interfaces =====
interface FilmSession {
  id: string;
  title: string;
  type: "game" | "practice" | "scouting" | "training";
  duration: string;
  uploadDate: string;
  thumbnailUrl?: string;
  videoUrl: string;
  tagCount: number;
  assignment: string;
  dueDate: string;
  watchedCount: number;
  totalAssigned: number;
  notWatched: string[];
}

interface VideoTag {
  id: string;
  timestamp: string;
  timestampSeconds: number;
  type: "positive" | "correction" | "teaching" | "opponent";
  playerName?: string;
  playerId?: string;
  playerNumber?: string;
  playName?: string;
  comment: string;
}

interface Player {
  id: string;
  name: string;
  number: string;
}

// ===== Constants =====
const FILM_TYPES = [
  { label: "Game Film", value: "game" },
  { label: "Practice Film", value: "practice" },
  { label: "Scouting / Opponent", value: "scouting" },
  { label: "Training / Educational", value: "training" },
];

const TAG_TYPES = [
  { label: "Positive - Great execution", value: "positive" },
  { label: "Correction - Area for improvement", value: "correction" },
  { label: "Teaching Point - General team learning", value: "teaching" },
  { label: "Opponent Tendency - Scouting observation", value: "opponent" },
];

@Component({
  selector: "app-film-room-coach",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    Dialog,
    
    InputText,
    ProgressBar,
    Select,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
  ],
  template: `
    <app-main-layout>
<div class="film-room-page ui-page-stack">
        <app-page-header
          title="Film Room"
          subtitle="Manage game and practice film"
          icon="pi-video"
        >
          <app-button iconLeft="pi-upload" (clicked)="openUploadDialog()"
            >Upload Film</app-button
          >
        </app-page-header>

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'all'"
            (click)="activeTab.set('all')"
          >
            All Film
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'games'"
            (click)="activeTab.set('games')"
          >
            Games
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'practices'"
            (click)="activeTab.set('practices')"
          >
            Practices
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'scouting'"
            (click)="activeTab.set('scouting')"
          >
            Scouting
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'assigned'"
            (click)="activeTab.set('assigned')"
          >
            Assigned
          </button>
        </div>

        <!-- Film Overview Stats -->
        <div class="film-stats">
          <div class="stat-card">
            <span class="stat-icon"><i class="pi pi-video" aria-hidden="true"></i></span>
            <div class="stat-content">
              <span class="stat-block__value">{{ totalFilmCount() }}</span>
              <span class="stat-block__label">Total Film Sessions</span>
              <span class="stat-sub">This season</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><i class="pi pi-clock" aria-hidden="true"></i></span>
            <div class="stat-content">
              <span class="stat-block__value">{{ totalDuration() }}</span>
              <span class="stat-block__label">Total Duration</span>
              <span class="stat-sub">All film</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><i class="pi pi-list" aria-hidden="true"></i></span>
            <div class="stat-content">
              <span class="stat-block__value">{{ assignedThisWeek() }}</span>
              <span class="stat-block__label">Assigned This Week</span>
              <span class="stat-sub">Active</span>
            </div>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><i class="pi pi-eye" aria-hidden="true"></i></span>
            <div class="stat-content">
              <span class="stat-block__value">{{ avgWatchRate() }}%</span>
              <span class="stat-block__label">Watch Rate</span>
              <span class="stat-sub">Team average</span>
            </div>
          </div>
        </div>

        <!-- Film List -->
        <div class="film-list">
          @for (session of filteredSessions(); track session.id) {
            <div class="film-card">
              <div class="film-header">
                <div class="film-title">
                  <span class="film-icon"><i class="pi pi-video" aria-hidden="true"></i></span>
                  <h3>{{ session.title }}</h3>
                </div>
                <div class="film-actions-header">
                  <app-button variant="text" size="sm" iconLeft="pi-pencil"
                    >Edit</app-button
                  >
                  <app-button variant="text" size="sm" iconLeft="pi-ellipsis-v"
                    >More options</app-button
                  >
                </div>
              </div>

              <div class="film-body">
                <div class="film-thumbnail">
                  <div class="thumbnail-placeholder">
                    <i class="pi pi-play-circle"></i>
                  </div>
                </div>

                <div class="film-info">
                  <p><strong>Type:</strong> {{ getTypeLabel(session.type) }}</p>
                  <p><strong>Duration:</strong> {{ session.duration }}</p>
                  <p><strong>Uploaded:</strong> {{ session.uploadDate }}</p>
                  <p>
                    <strong>Tags:</strong> {{ session.tagCount }} timestamps
                  </p>
                </div>
              </div>

              <div class="film-assignment">
                <p>
                  <strong>Assignment:</strong> {{ session.assignment }}
                  <span class="due-date">Due: {{ session.dueDate }}</span>
                </p>
                <div class="watch-progress">
                  <span class="progress-label"
                    >Watch Status: {{ session.watchedCount }}/{{
                      session.totalAssigned
                    }}
                    complete ({{ getWatchPercent(session) }}%)</span
                  >
                  <p-progressBar
                    [value]="getWatchPercent(session)"
                    [showValue]="false"
                    class="film-watch-progress"
                  ></p-progressBar>
                </div>
                @if (session.notWatched.length > 0) {
                  <p class="not-watched">
                    Not watched: {{ session.notWatched.join(", ") }}
                  </p>
                }
              </div>

              <div class="film-actions">
                <app-button
                  size="sm"
                  iconLeft="pi-play"
                  (clicked)="watchFilm(session)"
                  >Watch</app-button
                >
                <app-button
                  variant="secondary"
                  size="sm"
                  (clicked)="editTags(session)"
                  >Edit Tags</app-button
                >
                <app-button
                  variant="text"
                  size="sm"
                  (clicked)="viewCompliance(session)"
                  >View Compliance</app-button
                >
                <app-button
                  variant="text"
                  size="sm"
                  (clicked)="sendReminder(session)"
                  >Send Reminder</app-button
                >
              </div>
            </div>
          } @empty {
            <app-empty-state
              icon="pi-video"
              heading="No Film Found"
              description="Upload your first film to get started"
              actionLabel="Upload Film"
              actionIcon="pi-upload"
              [actionHandler]="openUploadDialogHandler"
            />
          }
        </div>
      </div>

      <!-- Upload Dialog -->
      <p-dialog
        [(visible)]="showUploadDialog"
        header="Upload Film"
        [modal]="true"
        class="film-upload-dialog"
      >
        <div class="upload-form">
          <div class="form-field">
            <label>Source</label>
            <div class="radio-group">
              <div class="radio-option">
                <input
                  type="radio"
                  name="source"
                  value="url"
                  id="sourceUrl"
                  [checked]="uploadForm.source === 'url'"
                  (change)="onUploadSourceChange('url')"
                />
                <label for="sourceUrl">YouTube / Vimeo URL</label>
              </div>
              <div class="radio-option">
                <input
                  type="radio"
                  name="source"
                  value="file"
                  id="sourceFile"
                  [checked]="uploadForm.source === 'file'"
                  (change)="onUploadSourceChange('file')"
                />
                <label for="sourceFile">Upload File</label>
              </div>
            </div>
          </div>

          @if (uploadForm.source === "url") {
            <div class="form-field">
              <label>Video URL</label>
              <input
                type="text"
                pInputText
                [value]="uploadForm.url"
                (input)="onUploadUrlChange(getInputValue($event))"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
          }

          <div class="form-field">
            <label>Title</label>
            <input
              type="text"
              pInputText
              [value]="uploadForm.title"
              (input)="onUploadTitleChange(getInputValue($event))"
              placeholder="Week 3 vs Panthers - Offense"
            />
          </div>

          <div class="form-field">
            <label>Type</label>
            <div class="radio-group">
              @for (type of filmTypes; track type.value) {
                <div class="radio-option">
                  <input
                    type="radio"
                    name="filmType"
                    [value]="type.value"
                    [id]="'filmType-' + type.value"
                    [checked]="uploadForm.type === type.value"
                    (change)="onUploadTypeChange(type.value)"
                  />
                  <label [for]="'filmType-' + type.value">{{
                    type.label
                  }}</label>
                </div>
              }
            </div>
          </div>

          <div class="form-field">
            <label>Description</label>
            <textarea
              pTextarea
              [value]="uploadForm.description"
              (input)="onUploadDescriptionChange(getInputValue($event))"
              rows="3"
              placeholder="Brief description of the film..."
            ></textarea>
          </div>
        </div>

        <ng-template #footer>
          <app-button variant="secondary" (clicked)="showUploadDialog = false"
            >Cancel</app-button
          >
          <app-button iconLeft="pi-upload" (clicked)="uploadFilm()"
            >Upload & Open</app-button
          >
        </ng-template>
      </p-dialog>

      <!-- Tag Editor Dialog -->
      <p-dialog
        [(visible)]="showTagDialog"
        header="Add Tag"
        [modal]="true"
        class="film-tag-dialog"
      >
        <div class="tag-form">
          <p class="tag-timestamp">
            Adding tag at <strong>{{ tagForm.timestamp }}</strong>
          </p>

          <div class="form-field">
            <label>Tag Type</label>
            <div class="radio-group">
              @for (type of tagTypes; track type.value) {
                <div class="radio-option">
                  <input
                    type="radio"
                    name="tagType"
                    [value]="type.value"
                    [id]="'tagType-' + type.value"
                    [checked]="tagForm.type === type.value"
                    (change)="onTagTypeChange(type.value)"
                  />
                  <label [for]="'tagType-' + type.value">{{
                    type.label
                  }}</label>
                </div>
              }
            </div>
          </div>

          <div class="form-field">
            <label>Tag Player(s)</label>
            <div class="radio-group">
              <div class="radio-option">
                <input
                  type="radio"
                  name="tagTarget"
                  value="everyone"
                  id="tagEveryone"
                  [checked]="tagForm.target === 'everyone'"
                  (change)="onTagTargetChange('everyone')"
                />
                <label for="tagEveryone">Everyone (team)</label>
              </div>
              <div class="radio-option">
                <input
                  type="radio"
                  name="tagTarget"
                  value="specific"
                  id="tagSpecific"
                  [checked]="tagForm.target === 'specific'"
                  (change)="onTagTargetChange('specific')"
                />
                <label for="tagSpecific">Specific player(s):</label>
              </div>
            </div>
            @if (tagForm.target === "specific") {
              <div class="player-checkboxes">
                @for (player of players(); track player.id) {
                  <div class="checkbox-option">
                    <input
                      type="checkbox"
                      [id]="'player-' + player.id"
                      [checked]="tagForm.playerIds.includes(player.id)"
                      (change)="onTagPlayerToggle(player.id, isChecked($event))"
                    />
                    <label [for]="'player-' + player.id"
                      >{{ player.name }} (#{{ player.number }})</label
                    >
                  </div>
                }
              </div>
            }
          </div>

          <div class="form-field">
            <label>Link to Play (optional)</label>
            <p-select
              [options]="plays()"
              (onChange)="onTagPlayIdChange($event.value)"
              optionLabel="name"
              optionValue="id"
              placeholder="Select play"
              [showClear]="true"
              class="w-full"
            ></p-select>
          </div>

          <div class="form-field">
            <label>Comment</label>
            <textarea
              pTextarea
              [value]="tagForm.comment"
              (input)="onTagCommentChange(getInputValue($event))"
              rows="4"
              placeholder="What should the player learn from this moment?"
            ></textarea>
          </div>
        </div>

        <ng-template #footer>
          <app-button variant="secondary" (clicked)="showTagDialog = false"
            >Cancel</app-button
          >
          <app-button iconLeft="pi-check" (clicked)="saveTag()"
            >Save Tag</app-button
          >
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./film-room-coach.component.scss",
})
export class FilmRoomCoachComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // State
  readonly sessions = signal<FilmSession[]>([]);
  readonly tags = signal<VideoTag[]>([]);
  readonly players = signal<Player[]>([]);
  readonly plays = signal<{ id: string; name: string }[]>([]);
  readonly activeTab = signal<
    "all" | "games" | "practices" | "scouting" | "assigned"
  >("all");
  readonly selectedSession = signal<FilmSession | null>(null);
  readonly isLoading = signal(true);

  // Dialog state
  showUploadDialog = false;
  showTagDialog = false;

  // Forms
  uploadForm = this.getEmptyUploadForm();
  tagForm = this.getEmptyTagForm();

  // Options
  readonly filmTypes = FILM_TYPES;
  readonly tagTypes = TAG_TYPES;

  // Computed
  readonly totalFilmCount = computed(() => this.sessions().length);

  readonly totalDuration = computed(() => "4h 32m");

  readonly assignedThisWeek = computed(
    () => this.sessions().filter((s) => s.assignment).length,
  );

  readonly avgWatchRate = computed(() => {
    const sessions = this.sessions();
    if (sessions.length === 0) return 0;
    const total = sessions.reduce((sum, s) => {
      if (s.totalAssigned === 0) return sum;
      return sum + (s.watchedCount / s.totalAssigned) * 100;
    }, 0);
    return Math.round(total / sessions.length);
  });

  readonly filteredSessions = computed(() => {
    const tab = this.activeTab();
    let result = this.sessions();

    if (tab === "games") {
      result = result.filter((s) => s.type === "game");
    } else if (tab === "practices") {
      result = result.filter((s) => s.type === "practice");
    } else if (tab === "scouting") {
      result = result.filter((s) => s.type === "scouting");
    } else if (tab === "assigned") {
      result = result.filter(
        (s) => s.assignment && s.watchedCount < s.totalAssigned,
      );
    }

    return result;
  });

  ngOnInit(): void {
    this.loadData();
  }

  onUploadSourceChange(value: "url" | "file"): void {
    this.uploadForm = { ...this.uploadForm, source: value };
  }

  onUploadUrlChange(value: string): void {
    this.uploadForm = { ...this.uploadForm, url: value };
  }

  onUploadTitleChange(value: string): void {
    this.uploadForm = { ...this.uploadForm, title: value };
  }

  onUploadTypeChange(value: string): void {
    if (
      value === "game" ||
      value === "practice" ||
      value === "scouting" ||
      value === "training"
    ) {
      this.uploadForm = { ...this.uploadForm, type: value };
    }
  }

  onUploadDescriptionChange(value: string): void {
    this.uploadForm = { ...this.uploadForm, description: value };
  }

  onTagTypeChange(value: string): void {
    if (
      value === "positive" ||
      value === "correction" ||
      value === "teaching" ||
      value === "opponent"
    ) {
      this.tagForm = { ...this.tagForm, type: value };
    }
  }

  onTagTargetChange(value: "everyone" | "specific"): void {
    this.tagForm = { ...this.tagForm, target: value };
  }

  onTagPlayerIdsChange(value: string[] | null): void {
    this.tagForm = { ...this.tagForm, playerIds: value ?? [] };
  }

  onTagPlayerToggle(playerId: string, checked: boolean): void {
    const nextPlayerIds = checked
      ? Array.from(new Set([...this.tagForm.playerIds, playerId]))
      : this.tagForm.playerIds.filter((id) => id !== playerId);
    this.tagForm = { ...this.tagForm, playerIds: nextPlayerIds };
  }

  onTagPlayIdChange(value: string | null): void {
    this.tagForm = { ...this.tagForm, playId: value ?? "" };
  }

  onTagCommentChange(value: string): void {
    this.tagForm = { ...this.tagForm, comment: value };
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response: ApiResponse<{
        sessions?: FilmSession[];
        players?: Player[];
        plays?: { id: string; name: string }[];
      }> = await firstValueFrom(
        this.api.get(API_ENDPOINTS.coach.film),
      );
      if (response?.success && response.data) {
        this.sessions.set(response.data.sessions || []);
        this.players.set(response.data.players || []);
        this.plays.set(response.data.plays || []);
      }
    } catch (err) {
      this.logger.error("Failed to load film data", err);
      this.sessions.set([]);
      this.players.set([]);
      this.plays.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  private getEmptyUploadForm() {
    return {
      source: "url" as "url" | "file",
      url: "",
      title: "",
      type: "game" as "game" | "practice" | "scouting" | "training",
      description: "",
    };
  }

  private getEmptyTagForm() {
    return {
      timestamp: "4:32",
      type: "correction" as "positive" | "correction" | "teaching" | "opponent",
      target: "specific" as "everyone" | "specific",
      playerIds: [] as string[],
      playId: "",
      comment: "",
    };
  }

  // Actions
  openUploadDialog(): void {
    this.uploadForm = this.getEmptyUploadForm();
    this.showUploadDialog = true;
  }

  readonly openUploadDialogHandler = (): void => this.openUploadDialog();

  uploadFilm(): void {
    if (!this.uploadForm.title) return;
    this.toastService.success(
      `${this.uploadForm.title} has been uploaded`,
      "Film Uploaded",
    );
    this.showUploadDialog = false;
  }

  watchFilm(session: FilmSession): void {
    this.selectedSession.set(session);
    this.toastService.info(`Playing ${session.title}`, "Opening Film");
  }

  editTags(session: FilmSession): void {
    this.selectedSession.set(session);
    this.toastService.info(
      `Opening tag editor for ${session.title}`,
      "Tag Editor",
    );
  }

  viewCompliance(session: FilmSession): void {
    this.toastService.info(
      `${session.watchedCount}/${session.totalAssigned} have watched`,
      "Compliance",
    );
  }

  sendReminder(session: FilmSession): void {
    this.toastService.success(
      `Reminders sent to ${session.notWatched.length} players`,
      "Reminders Sent",
    );
  }

  openAddTag(): void {
    this.tagForm = this.getEmptyTagForm();
    this.showTagDialog = true;
  }

  saveTag(): void {
    if (!this.tagForm.comment) return;
    this.toastService.success(
      "Timestamp tag has been added",
      "Tag Saved",
    );
    this.showTagDialog = false;
  }

  getInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | null)
      ?.value ?? "";
  }

  isChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
  }

  // Helpers
  getTypeLabel(type: string): string {
    return FILM_TYPES.find((t) => t.value === type)?.label || type;
  }

  getWatchPercent(session: FilmSession): number {
    if (session.totalAssigned === 0) return 100;
    return Math.round((session.watchedCount / session.totalAssigned) * 100);
  }
}
