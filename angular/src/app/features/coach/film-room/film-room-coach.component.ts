/**
 * Film Room Component (Coach View)
 *
 * Upload and manage game/practice film, create timestamps and tags for players,
 * assign film to team or individuals, and track viewing compliance.
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
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { ProgressBar } from "primeng/progressbar";
import { type SelectChangeEvent } from "primeng/select";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { LoggerService } from "../../../core/services/logger.service";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { CoachFilmRoomDataService } from "../services/coach-film-room-data.service";

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
    AppDialogComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
    ProgressBar,
    FormInputComponent,
    SelectComponent,
    TextareaComponent,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
  ],
  templateUrl: "./film-room-coach.component.html",
  styleUrl: "./film-room-coach.component.scss",
})
export class FilmRoomCoachComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly coachFilmRoomDataService = inject(CoachFilmRoomDataService);

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
      const { sessions, players, plays, error } =
        await this.coachFilmRoomDataService.loadFilmRoom();
      if (error) {
        throw error;
      }

      this.sessions.set(sessions);
      this.players.set(players);
      this.plays.set(plays);
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

  closeUploadDialog(): void {
    this.showUploadDialog = false;
    this.uploadForm = this.getEmptyUploadForm();
  }

  closeTagDialog(): void {
    this.showTagDialog = false;
    this.tagForm = this.getEmptyTagForm();
  }

  // Actions
  openUploadDialog(): void {
    this.closeUploadDialog();
    this.showUploadDialog = true;
  }

  readonly openUploadDialogHandler = (): void => this.openUploadDialog();

  async uploadFilm(): Promise<void> {
    if (!this.uploadForm.title) return;

    const { data, error } = await this.coachFilmRoomDataService.saveSession({
      source: this.uploadForm.source,
      url: this.uploadForm.url,
      title: this.uploadForm.title,
      type: this.uploadForm.type,
      description: this.uploadForm.description,
    });

    if (error || !data) {
      this.logger.error("Failed to upload film", error);
      this.toastService.error("We couldn't save this film.", "Upload Failed");
      return;
    }

    this.sessions.update((sessions) => [data, ...sessions]);
    this.toastService.success(
      `${data.title} has been uploaded`,
      "Film Uploaded",
    );
    this.closeUploadDialog();
  }

  watchFilm(session: FilmSession): void {
    this.closeSessionDialog();
    this.selectedSession.set(session);
    this.showSessionDialog = true;
  }

  editTags(session: FilmSession): void {
    this.closeTagDialog();
    this.selectedSession.set(session);
    this.showTagDialog = true;
  }

  viewCompliance(session: FilmSession): void {
    this.closeComplianceDialog();
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
    this.closeTagDialog();
    this.showTagDialog = true;
  }

  async saveTag(): Promise<void> {
    if (!this.tagForm.comment) return;

    const session = this.selectedSession();
    if (!session) {
      this.toastService.warn("Open a film session before adding a tag.");
      return;
    }

    const playerIds =
      this.tagForm.target === "everyone"
        ? this.players().map((player) => player.id)
        : this.tagForm.playerIds;
    const { error } = await this.coachFilmRoomDataService.saveTag({
      sessionId: session.id,
      timestamp: this.tagForm.timestamp,
      type: this.tagForm.type,
      target: this.tagForm.target,
      playerIds,
      playId: this.tagForm.playId,
      comment: this.tagForm.comment,
    });

    if (error) {
      this.logger.error("Failed to save film tag", error);
      this.toastService.error("We couldn't save this tag.", "Save Failed");
      return;
    }

    this.sessions.update((sessions) =>
      sessions.map((entry) =>
        entry.id === session.id
          ? { ...entry, tagCount: entry.tagCount + 1 }
          : entry,
      ),
    );
    this.toastService.success(
      "Timestamp tag has been added",
      "Tag Saved",
    );
    this.closeTagDialog();
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
