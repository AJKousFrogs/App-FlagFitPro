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
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { InputText } from "primeng/inputtext";
import { ProgressBar } from "primeng/progressbar";
import { Select, type SelectChangeEvent } from "primeng/select";

import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";

import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { extractApiPayload } from "../../../core/utils/api-response-mapper";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
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
    AppDialogComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
    InputText,
    ProgressBar,
    Select,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
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
          @if (isLoading()) {
            <app-loading message="Loading film room..." />
          } @else if (loadError()) {
            <app-page-error-state
              title="Unable to load film room"
              [message]="loadError()!"
              (retry)="retryLoadData()"
            />
          } @else {
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
          }
        </div>
      </div>

      <!-- Upload Dialog -->
      <app-dialog
        [(visible)]="showUploadDialog"
        [modal]="true"
        styleClass="film-upload-dialog"
        [blockScroll]="true"
        [draggable]="false"
        [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
        ariaLabel="Upload film"
      >
        <app-dialog-header
          icon="upload"
          title="Upload Film"
          subtitle="Add a new game, practice, scouting, or training video to the film room."
          (close)="showUploadDialog = false"
        />
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
                (input)="onUploadUrlInput($event)"
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
              (input)="onUploadTitleInput($event)"
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
              (input)="onUploadDescriptionInput($event)"
              rows="3"
              placeholder="Brief description of the film..."
            ></textarea>
          </div>
        </div>

        <app-dialog-footer
          dialogFooter
          cancelLabel="Cancel"
          primaryLabel="Upload & Open"
          primaryIcon="upload"
          (cancel)="showUploadDialog = false"
          (primary)="uploadFilm()"
        />
      </app-dialog>

      <!-- Tag Editor Dialog -->
      <app-dialog
        [(visible)]="showTagDialog"
        [modal]="true"
        styleClass="film-tag-dialog"
        [blockScroll]="true"
        [draggable]="false"
        [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
        ariaLabel="Add film tag"
      >
        <app-dialog-header
          icon="tag"
          title="Add Tag"
          subtitle="Highlight a film moment and connect it to the right player, play, or teaching point."
          (close)="showTagDialog = false"
        />
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
                      (change)="onTagPlayerToggleInput(player.id, $event)"
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
              (onChange)="onTagPlaySelect($event)"
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
              (input)="onTagCommentInput($event)"
              rows="4"
              placeholder="What should the player learn from this moment?"
            ></textarea>
          </div>
        </div>

        <app-dialog-footer
          dialogFooter
          cancelLabel="Cancel"
          primaryLabel="Save Tag"
          primaryIcon="check"
          (cancel)="showTagDialog = false"
          (primary)="saveTag()"
        />
      </app-dialog>

      <!-- Session Detail Dialog -->
      <app-dialog
        [(visible)]="showSessionDialog"
        [modal]="true"
        styleClass="film-session-dialog"
        [blockScroll]="true"
        [draggable]="false"
        [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
        ariaLabel="Film session details"
      >
        <app-dialog-header
          icon="video"
          [title]="selectedSession()?.title || 'Film Session'"
          subtitle="Review assignment details before coaching actions."
          (close)="closeSessionDialog()"
        />
        @if (selectedSession(); as session) {
          <div class="film-session-detail">
            <div class="film-session-preview">
              <div class="thumbnail-placeholder">
                <i class="pi pi-play-circle" aria-hidden="true"></i>
              </div>
            </div>

            <div class="film-session-grid">
              <div class="detail-block">
                <span class="detail-label">Type</span>
                <span class="detail-value">{{ getTypeLabel(session.type) }}</span>
              </div>
              <div class="detail-block">
                <span class="detail-label">Duration</span>
                <span class="detail-value">{{ session.duration }}</span>
              </div>
              <div class="detail-block">
                <span class="detail-label">Uploaded</span>
                <span class="detail-value">{{ session.uploadDate }}</span>
              </div>
              <div class="detail-block">
                <span class="detail-label">Tags</span>
                <span class="detail-value">{{ session.tagCount }} timestamps</span>
              </div>
              <div class="detail-block detail-block--wide">
                <span class="detail-label">Assignment</span>
                <span class="detail-value">{{ session.assignment }}</span>
              </div>
              <div class="detail-block detail-block--wide">
                <span class="detail-label">Due date</span>
                <span class="detail-value">{{ session.dueDate }}</span>
              </div>
            </div>
          </div>
        }

        <app-dialog-footer
          dialogFooter
          cancelLabel="Close"
          primaryLabel="Add Tag"
          primaryIcon="tag"
          (cancel)="closeSessionDialog()"
          (primary)="openTagDialogFromSession()"
        />
      </app-dialog>

      <!-- Compliance Dialog -->
      <app-dialog
        [(visible)]="showComplianceDialog"
        [modal]="true"
        styleClass="film-compliance-dialog"
        [blockScroll]="true"
        [draggable]="false"
        [breakpoints]="{ '960px': '92vw', '640px': '96vw' }"
        ariaLabel="Film compliance details"
      >
        <app-dialog-header
          icon="check-square"
          title="Viewing Compliance"
          subtitle="Track who has completed the assignment and who still needs follow-up."
          (close)="closeComplianceDialog()"
        />
        @if (selectedSession(); as session) {
          <div class="film-compliance-detail">
            <div class="compliance-summary">
              <span class="detail-label">Watch progress</span>
              <span class="detail-value"
                >{{ session.watchedCount }}/{{ session.totalAssigned }} complete</span
              >
              <p-progressBar
                [value]="getWatchPercent(session)"
                [showValue]="false"
                class="film-watch-progress"
              ></p-progressBar>
            </div>

            <div class="compliance-columns">
              <div class="compliance-list">
                <h4>Waiting On</h4>
                @if (session.notWatched.length > 0) {
                  @for (playerName of session.notWatched; track playerName) {
                    <span class="compliance-pill compliance-pill--pending">{{
                      playerName
                    }}</span>
                  }
                } @else {
                  <p>Everyone assigned has completed this film.</p>
                }
              </div>

              <div class="compliance-list">
                <h4>Assignment</h4>
                <p>{{ session.assignment }}</p>
                <p><strong>Due:</strong> {{ session.dueDate }}</p>
                <p><strong>Watch rate:</strong> {{ getWatchPercent(session) }}%</p>
              </div>
            </div>
          </div>
        }

        <app-dialog-footer
          dialogFooter
          cancelLabel="Close"
          primaryLabel="Send Reminder"
          primaryIcon="send"
          (cancel)="closeComplianceDialog()"
          (primary)="sendReminderForSelectedSession()"
        />
      </app-dialog>
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
  readonly loadError = signal<string | null>(null);

  // Dialog state
  showUploadDialog = false;
  showTagDialog = false;
  showSessionDialog = false;
  showComplianceDialog = false;

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

  onUploadUrlInput(event: Event): void {
    this.onUploadUrlChange(this.readInputValue(event));
  }

  onUploadTitleChange(value: string): void {
    this.uploadForm = { ...this.uploadForm, title: value };
  }

  onUploadTitleInput(event: Event): void {
    this.onUploadTitleChange(this.readInputValue(event));
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

  onUploadDescriptionInput(event: Event): void {
    this.onUploadDescriptionChange(this.readInputValue(event));
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

  onTagPlayerToggleInput(playerId: string, event: Event): void {
    this.onTagPlayerToggle(playerId, this.readChecked(event));
  }

  onTagPlayIdChange(value: string | null): void {
    this.tagForm = { ...this.tagForm, playId: value ?? "" };
  }

  onTagPlaySelect(event: SelectChangeEvent): void {
    this.onTagPlayIdChange(typeof event.value === "string" ? event.value : null);
  }

  onTagCommentChange(value: string): void {
    this.tagForm = { ...this.tagForm, comment: value };
  }

  onTagCommentInput(event: Event): void {
    this.onTagCommentChange(this.readInputValue(event));
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const response = await firstValueFrom(
        this.api.get<{
          sessions?: FilmSession[];
          players?: Player[];
          plays?: { id: string; name: string }[];
        }>(API_ENDPOINTS.coach.film),
      );
      const payload = extractApiPayload<{
        sessions?: FilmSession[];
        players?: Player[];
        plays?: { id: string; name: string }[];
      }>(response);
      if (payload) {
        this.sessions.set(payload.sessions || []);
        this.players.set(payload.players || []);
        this.plays.set(payload.plays || []);
      } else {
        throw new Error("Film room payload missing");
      }
    } catch (err) {
      this.logger.error("Failed to load film data", err);
      this.sessions.set([]);
      this.players.set([]);
      this.plays.set([]);
      this.loadError.set("We couldn't load film room data. Please try again.");
    } finally {
      this.isLoading.set(false);
    }
  }

  retryLoadData(): void {
    void this.loadData();
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
    this.showSessionDialog = true;
  }

  editTags(session: FilmSession): void {
    this.selectedSession.set(session);
    this.tagForm = this.getEmptyTagForm();
    this.showTagDialog = true;
  }

  viewCompliance(session: FilmSession): void {
    this.selectedSession.set(session);
    this.showComplianceDialog = true;
  }

  sendReminder(session: FilmSession): void {
    this.toastService.success(
      `Reminders sent to ${session.notWatched.length} players`,
      "Reminders Sent",
    );
  }

  sendReminderForSelectedSession(): void {
    const session = this.selectedSession();
    if (!session) return;
    this.sendReminder(session);
    this.closeComplianceDialog();
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

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | null)
      ?.value ?? "";
  }

  private readChecked(event: Event): boolean {
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

  closeSessionDialog(): void {
    this.showSessionDialog = false;
  }

  closeComplianceDialog(): void {
    this.showComplianceDialog = false;
  }

  openTagDialogFromSession(): void {
    this.closeSessionDialog();
    this.openAddTag();
  }
}
