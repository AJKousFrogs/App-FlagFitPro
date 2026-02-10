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
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { Card } from "primeng/card";
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { ProgressBar } from "primeng/progressbar";
import { Select } from "primeng/select";

import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";

import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    Card,
    Dialog,
    InputText,
    ProgressBar,
    Select,
    StatusTagComponent,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    MobileOptimizedImageDirective,
    ButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
<div class="film-room-page">
        <app-page-header
          title="Film Room"
          subtitle="Watch assigned game film and review coach feedback"
          icon="pi-video"
        ></app-page-header>

        <!-- Progress Overview -->
        <p-card class="progress-card">
          <div class="progress-header">
            <div class="progress-stats">
              <div class="stat-item stat-block stat-block--compact">
                <div class="stat-block__content">
                  <span class="stat-block__value">{{ watchedCount() }}</span>
                  <span class="stat-block__label">Watched</span>
                </div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item stat-block stat-block--compact">
                <div class="stat-block__content">
                  <span class="stat-block__value">{{ totalFilms() }}</span>
                  <span class="stat-block__label">Assigned</span>
                </div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item stat-block stat-block--compact">
                <div class="stat-block__content">
                  <span class="stat-block__value">{{
                    totalTaggedMoments()
                  }}</span>
                  <span class="stat-block__label">Tags to Review</span>
                </div>
              </div>
            </div>
          </div>
          <p-progressBar
            [value]="progressPercent()"
            [showValue]="false"
            class="progress-overall"
          ></p-progressBar>
          <p class="progress-text">{{ progressPercent() }}% complete</p>
        </p-card>

        <!-- Filters -->
        <div class="filters-row">
          <span class="p-input-icon-left filter-search">
            <i class="pi pi-search"></i>
            <input
              type="text"
              pInputText
              placeholder="Search film sessions..."
              [(ngModel)]="searchQuery"
            />
          </span>

          <p-select
            [options]="statusOptions"
            [(ngModel)]="selectedStatus"
            optionLabel="label"
            optionValue="value"
            placeholder="Status"
            [showClear]="true"
            class="filter-select"
          ></p-select>
        </div>

        <!-- Film Sessions List -->
        @if (filteredFilms().length > 0) {
          <div class="films-grid">
            @for (film of filteredFilms(); track film.id) {
              <p-card class="film-card" (click)="selectFilm(film)">
                <div class="film-thumbnail">
                  @if (film.thumbnailUrl) {
                    <img
                      appMobileOptimized
                      [width]="320"
                      [height]="180"
                      [src]="film.thumbnailUrl"
                      [alt]="film.title"
                    />
                  } @else {
                    <div class="thumbnail-placeholder">
                      <i class="pi pi-video"></i>
                    </div>
                  }
                  <span class="duration-badge">{{
                    formatDuration(film.duration)
                  }}</span>
                  @if (film.isWatched) {
                    <span class="watched-badge"
                      ><i class="pi pi-check"></i
                    ></span>
                  }
                </div>

                <div class="film-info">
                  <h3>{{ film.title }}</h3>
                  <p class="opponent">vs {{ film.opponent }}</p>
                  <p class="date">{{ film.gameDate | date: "MMM d, y" }}</p>

                  <div class="film-meta">
                    @if (film.taggedMoments.length > 0) {
                      <span
                        class="tag-count"
                        [class.has-corrections]="hasCorrections(film)"
                      >
                        <i class="pi pi-bookmark"></i>
                        {{ film.taggedMoments.length }} moments
                      </span>
                    }
                    @if (film.dueBy) {
                      <span
                        class="due-date"
                        [class.overdue]="isOverdue(film.dueBy)"
                      >
                        <i class="pi pi-calendar"></i>
                        Due: {{ film.dueBy | date: "MMM d" }}
                      </span>
                    }
                  </div>

                  @if (film.watchProgress > 0 && film.watchProgress < 100) {
                    <p-progressBar
                      [value]="film.watchProgress"
                      [showValue]="false"
                      class="film-progress"
                    ></p-progressBar>
                  }
                </div>
              </p-card>
            }
          </div>
        } @else {
          <p-card class="empty-state-card">
            <div class="empty-state">
              <i class="pi pi-video"></i>
              <h3>No film assigned</h3>
              <p>
                @if (searchQuery || selectedStatus) {
                  Try adjusting your filters
                } @else {
                  Your coach hasn't assigned any film yet
                }
              </p>
            </div>
          </p-card>
        }
      </div>

      <!-- Film Detail Dialog -->
      <p-dialog
        [(visible)]="showFilmDetail"
        [header]="selectedFilm()?.title || 'Film Details'"
        [modal]="true"
        [closable]="true"
        class="film-detail-dialog"
      >
        @if (selectedFilm(); as film) {
          <div class="film-detail">
            <!-- Video Player -->
            <div class="video-container">
              <video
                #videoPlayer
                [src]="film.videoUrl"
                controls
                poster=""
                (timeupdate)="onTimeUpdate($event)"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <!-- Tagged Moments -->
            @if (film.taggedMoments.length > 0) {
              <div class="tagged-moments">
                <h4><i class="pi pi-bookmark"></i> Tagged Moments</h4>
                <div class="moments-list">
                  @for (moment of film.taggedMoments; track moment.id) {
                    <div
                      class="moment-item"
                      [class.positive]="moment.type === 'positive'"
                      [class.correction]="moment.type === 'correction'"
                      (click)="jumpToMoment(moment.timestamp)"
                    >
                      <div class="moment-header">
                        <span
                          class="timestamp"
                          (click)="
                            jumpToMoment(moment.timestamp);
                            $event.stopPropagation()
                          "
                        >
                          <i class="pi pi-play-circle"></i>
                          {{ formatTimestamp(moment.timestamp) }}
                        </span>
                        <app-status-tag
                          [value]="
                            moment.type === 'positive'
                              ? 'Great play!'
                              : 'Correction'
                          "
                          [severity]="
                            moment.type === 'positive' ? 'success' : 'warning'
                          "
                          size="sm"
                        />
                      </div>
                      <h5>{{ moment.title }}</h5>
                      <p class="coach-comment">
                        <strong>{{ moment.coachName }}:</strong>
                        {{ moment.coachComment }}
                      </p>

                      <!-- Discussion Thread -->
                      @if (
                        moment.discussionThread.length > 0 ||
                        expandedMoment() === moment.id
                      ) {
                        <div class="discussion-thread">
                          @for (msg of moment.discussionThread; track msg.id) {
                            <div
                              class="thread-message"
                              [class.player]="msg.authorRole === 'player'"
                            >
                              <span class="msg-author">{{ msg.author }}</span>
                              <p>{{ msg.message }}</p>
                              <span class="msg-time">{{
                                msg.timestamp | date: "short"
                              }}</span>
                            </div>
                          }

                          @if (expandedMoment() === moment.id) {
                            <div class="reply-form">
                              <textarea
                                pTextarea
                                [(ngModel)]="replyMessage"
                                placeholder="Add a comment..."
                                rows="2"
                              ></textarea>
                              <app-button
                                iconLeft="pi-send"
                                [disabled]="!replyMessage.trim()"
                                (clicked)="sendReply(moment.id)"
                                >Send</app-button
                              >
                            </div>
                          }
                        </div>
                      }

                      <button
                        class="expand-btn"
                        (click)="
                          toggleExpand(moment.id); $event.stopPropagation()
                        "
                      >
                        <i
                          class="pi"
                          [ngClass]="
                            expandedMoment() === moment.id
                              ? 'pi-chevron-up'
                              : 'pi-chevron-down'
                          "
                        ></i>
                        {{
                          expandedMoment() === moment.id
                            ? "Collapse"
                            : "Reply/Discuss"
                        }}
                      </button>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Film Actions -->
            <div class="film-actions">
              <app-button (clicked)="toggleWatched(film)"></app-button>
            </div>
          </div>
        }
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./film-room.component.scss",
})
export class FilmRoomComponent implements OnInit {
  private readonly api = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // State
  readonly films = signal<FilmSession[]>([]);
  readonly selectedFilm = signal<FilmSession | null>(null);
  readonly expandedMoment = signal<string | null>(null);
  readonly isLoading = signal(true);

  // Filter state
  searchQuery = "";
  selectedStatus: "watched" | "unwatched" | null = null;

  // Dialog state
  showFilmDetail = false;
  replyMessage = "";

  // Options
  readonly statusOptions = [
    { label: "Watched", value: "watched" },
    { label: "Unwatched", value: "unwatched" },
  ];

  // Computed values
  readonly filteredFilms = computed(() => {
    let result = this.films();

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          f.opponent.toLowerCase().includes(query),
      );
    }

    // Status filter
    if (this.selectedStatus) {
      result = result.filter((f) =>
        this.selectedStatus === "watched" ? f.isWatched : !f.isWatched,
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

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.api.get<{ films?: FilmSession[] }>("/api/film-room"),
      );
      if (response?.success && response.data?.films) {
        this.films.set(response.data.films);
      }
    } catch (err) {
      this.logger.error("Failed to load film room data", err);
      // No film sessions assigned to player
      this.films.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  selectFilm(film: FilmSession): void {
    this.selectedFilm.set(film);
    this.showFilmDetail = true;
    this.expandedMoment.set(null);
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
      .post("/api/film-room/watched", { filmId: film.id, watched: newStatus })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.messageService.add({
            severity: "success",
            summary: newStatus ? "Marked as Watched" : "Marked as Unwatched",
            detail: film.title,
          });
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
    if (!film || !this.replyMessage.trim()) return;

    const newMessage: DiscussionMessage = {
      id: `msg-${Date.now()}`,
      author: "You",
      authorRole: "player",
      message: this.replyMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    // Update local state
    this.films.update((films) =>
      films.map((f) =>
        f.id === film.id
          ? {
              ...f,
              taggedMoments: f.taggedMoments.map((m) =>
                m.id === momentId
                  ? {
                      ...m,
                      discussionThread: [...m.discussionThread, newMessage],
                    }
                  : m,
              ),
            }
          : f,
      ),
    );

    // Update selected film
    this.selectedFilm.update((f) =>
      f
        ? {
            ...f,
            taggedMoments: f.taggedMoments.map((m) =>
              m.id === momentId
                ? {
                    ...m,
                    discussionThread: [...m.discussionThread, newMessage],
                  }
                : m,
            ),
          }
        : null,
    );

    this.api
      .post("/api/film-room/reply", {
        filmId: film.id,
        momentId,
        message: this.replyMessage,
      })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.messageService.add({
            severity: "success",
            summary: "Reply sent",
          });
        },
        error: (err) => this.logger.error("Failed to send reply", err),
      });

    this.replyMessage = "";
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
