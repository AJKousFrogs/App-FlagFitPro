/**
 * Film Room Component (Player View)
 *
 * Allows players to watch assigned game film, review tagged moments,
 * and participate in discussion threads with coaches.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule, DatePipe } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  DestroyRef,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ToastService } from "../../core/services/toast.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { ProgressBar } from "primeng/progressbar";

import { SearchInputComponent } from "../../shared/components/search-input/search-input.component";
import { SelectComponent } from "../../shared/components/select/select.component";
import { TextareaComponent } from "../../shared/components/textarea/textarea.component";
import { firstValueFrom } from "rxjs";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";

import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { extractApiPayload } from "../../core/utils/api-response-mapper";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../shared/components/dialog-header/dialog-header.component";
import { MobileOptimizedImageDirective } from "../../shared/directives/mobile-optimized-image.directive";

// ===== Interfaces =====
interface FilmSession {
  id: string;
  title: string;
  gameDate: string;
  opponent: string;
  thumbnailUrl?: string;
  videoUrl: string;
  duration: number; // seconds
  watchProgress: number; // 0-100
  assignedAt: string;
  dueBy?: string;
  taggedMoments: TaggedMoment[];
  isWatched: boolean;
}

interface TaggedMoment {
  id: string;
  timestamp: number; // seconds
  type: "positive" | "correction";
  title: string;
  coachComment: string;
  coachName: string;
  discussionThread: DiscussionMessage[];
}

interface DiscussionMessage {
  id: string;
  author: string;
  authorRole: "coach" | "player";
  message: string;
  timestamp: string;
}

@Component({
  selector: "app-film-room",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    ProgressBar,
    StatusTagComponent,
    SearchInputComponent,
    SelectComponent,
    TextareaComponent,

    MainLayoutComponent,
    AppLoadingComponent,
    PageHeaderComponent,
    PageErrorStateComponent,
    MobileOptimizedImageDirective,
    ButtonComponent,
    EmptyStateComponent,
    CardShellComponent,
    AppDialogComponent,
    DialogHeaderComponent,
  ],
  templateUrl: "./film-room.component.html",
  styleUrl: "./film-room.component.scss",
})
export class FilmRoomComponent implements OnInit {
  private readonly api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // State
  readonly films = signal<FilmSession[]>([]);
  readonly selectedFilm = signal<FilmSession | null>(null);
  readonly expandedMoment = signal<string | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  // Filter state
  readonly searchQuery = signal("");
  readonly selectedStatus = signal<"watched" | "unwatched" | null>(null);

  // Dialog state
  showFilmDetail = false;
  readonly replyMessage = signal("");

  // Options
  readonly statusOptions = [
    { label: "Watched", value: "watched" },
    { label: "Unwatched", value: "unwatched" },
  ];

  // Computed values
  readonly filteredFilms = computed(() => {
    let result = this.films();

    // Search filter
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          f.opponent.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (this.selectedStatus()) {
      result = result.filter((f) =>
        this.selectedStatus() === "watched" ? f.isWatched : !f.isWatched,
      );
    }

    return result;
  });

  readonly watchedCount = computed(
    () => this.films().filter((f) => f.isWatched).length,
  );

  readonly totalFilms = computed(() => this.films().length);

  readonly totalTaggedMoments = computed(() =>
    this.films().reduce((sum, f) => sum + f.taggedMoments.length, 0),
  );

  readonly progressPercent = computed(() => {
    const total = this.totalFilms();
    if (total === 0) return 0;
    return Math.round((this.watchedCount() / total) * 100);
  });

  getEmptyDescription(): string {
    return this.searchQuery() || this.selectedStatus()
      ? "Try adjusting your filters"
      : "Your coach hasn't assigned any film yet";
  }

  onStatusChange(value: "watched" | "unwatched" | null | undefined): void {
    this.selectedStatus.set(value ?? null);
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const response = await firstValueFrom(
        this.api.get<{ films?: FilmSession[] }>("/api/film-room"),
      );
      const films =
        extractApiPayload<{ films?: FilmSession[] }>(response)?.films ?? [];
      this.films.set(films);
    } catch (err) {
      this.logger.error("Failed to load film room data", err);
      this.films.set([]);
      this.errorMessage.set(
        "We couldn't load your assigned film right now. Please try again.",
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  selectFilm(film: FilmSession): void {
    this.closeFilmDetail();
    this.selectedFilm.set(film);
    this.showFilmDetail = true;
  }

  closeFilmDetail(): void {
    this.showFilmDetail = false;
    this.selectedFilm.set(null);
    this.expandedMoment.set(null);
    this.replyMessage.set("");
  }

  toggleWatched(film: FilmSession): void {
    const newStatus = !film.isWatched;

    this.films.update((films) =>
      films.map((f) =>
        f.id === film.id
          ? {
              ...f,
              isWatched: newStatus,
              watchProgress: newStatus ? 100 : f.watchProgress,
            }
          : f,
      ),
    );

    this.selectedFilm.update((f) =>
      f?.id === film.id ? { ...f, isWatched: newStatus } : f,
    );

    this.api
      .post(API_ENDPOINTS.filmRoom.watched, { filmId: film.id, watched: newStatus })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toastService.success(
            film.title,
            newStatus ? "Marked as Watched" : "Marked as Unwatched",
          );
        },
        error: (err) =>
          this.logger.error("Failed to update watched status", err),
      });
  }

  toggleExpand(momentId: string): void {
    if (this.expandedMoment() === momentId) {
      this.expandedMoment.set(null);
    } else {
      this.expandedMoment.set(momentId);
    }
  }

  jumpToMoment(timestamp: number): void {
    const video = document.querySelector("video") as HTMLVideoElement;
    if (video) {
      video.currentTime = timestamp;
      video.play();
    }
  }

  onTimeUpdate(event: Event): void {
    const video = event.target as HTMLVideoElement;
    const film = this.selectedFilm();
    if (!film || film.isWatched) return;

    const progress = Math.round((video.currentTime / video.duration) * 100);

    // Update progress
    this.films.update((films) =>
      films.map((f) =>
        f.id === film.id
          ? { ...f, watchProgress: Math.max(f.watchProgress, progress) }
          : f,
      ),
    );
  }

  sendReply(momentId: string): void {
    const film = this.selectedFilm();
    if (!film || !this.replyMessage().trim()) return;

    const newMessage: DiscussionMessage = {
      id: `msg-${Date.now()}`,
      author: "You",
      authorRole: "player",
      message: this.replyMessage().trim(),
      timestamp: new Date().toISOString(),
    };

    const appendReply = (candidateFilm: FilmSession): FilmSession => ({
      ...candidateFilm,
      taggedMoments: candidateFilm.taggedMoments.map((moment) =>
        moment.id === momentId
          ? {
              ...moment,
              discussionThread: [...moment.discussionThread, newMessage],
            }
          : moment,
      ),
    });

    this.films.update((films) =>
      films.map((candidateFilm) =>
        candidateFilm.id === film.id ? appendReply(candidateFilm) : candidateFilm,
      ),
    );

    this.selectedFilm.update((candidateFilm) =>
      candidateFilm ? appendReply(candidateFilm) : null,
    );

    this.api
      .post(API_ENDPOINTS.filmRoom.reply, {
        filmId: film.id,
        momentId,
        message: this.replyMessage(),
      })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toastService.success("Reply sent");
        },
        error: (err) => this.logger.error("Failed to send reply", err),
      });

    this.replyMessage.set("");
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  formatTimestamp(seconds: number): string {
    return this.formatDuration(seconds);
  }

  hasCorrections(film: FilmSession): boolean {
    return film.taggedMoments.some((m) => m.type === "correction");
  }

  isOverdue(dueBy: string): boolean {
    return new Date(dueBy) < new Date();
  }
}
