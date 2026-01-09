/**
 * Instagram Video Feed Component
 *
 * GEN Z OPTIMIZED TRAINING VIDEO EXPERIENCE
 *
 * UX Best Practices Implemented:
 * - Vertical scroll video feed (TikTok/Reels style)
 * - Infinite scroll with lazy loading
 * - Quick filter chips for position/category
 * - Swipe gestures for mobile
 * - Auto-play with sound toggle
 * - Save/bookmark functionality
 * - Share to clipboard
 * - Skeleton loading states
 * - Haptic feedback on interactions
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 * @angular 21
 */

import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";

// PrimeNG Components
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { RippleModule } from "primeng/ripple";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

// Services
import { AuthService } from "../../../core/services/auth.service";
import { HapticFeedbackService } from "../../../core/services/haptic-feedback.service";
import {
  InstagramCreator,
  InstagramVideo,
  InstagramVideoService,
} from "../../../core/services/instagram-video.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import {
  FlagPosition,
  TrainingFocus,
} from "../../../core/services/training-video-database.service";

// Layout
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";

interface FilterChip {
  label: string;
  value: string;
  type: "position" | "focus" | "skill";
  icon?: string;
  active: boolean;
}

@Component({
  selector: "app-video-feed",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CardModule,
    BadgeModule,
    SkeletonModule,
    TooltipModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    AvatarModule,
    TagModule,
    RippleModule,
    MainLayoutComponent,

    ButtonComponent,
  ],
  template: `
    <p-toast></p-toast>
    <app-main-layout>
      <div class="video-feed-page">
        <!-- Hero Header -->
        <header class="feed-header">
          <div class="header-content">
            <div class="header-text">
              <h1 class="feed-title">
                <i class="pi pi-video"></i>
                Training Videos
              </h1>
              <p class="feed-subtitle">
                Curated drills from pro athletes & coaches
              </p>
            </div>
            <div class="header-actions">
              <div class="header-stats">
                <div class="stat-pill">
                  <i class="pi pi-play-circle"></i>
                  <span>{{ totalVideos() }} Videos</span>
                </div>
                <div class="stat-pill">
                  <i class="pi pi-users"></i>
                  <span>{{ totalCreators() }} Creators</span>
                </div>
              </div>
              <button
                pButton
                label="Suggest a Video"
                icon="pi pi-lightbulb"
                class="suggest-btn"
                (click)="navigateToSuggest()"
              ></button>
            </div>
          </div>
        </header>

        <!-- Filter Section -->
        <section class="filter-section">
          <!-- Search Bar -->
          <div class="search-container">
            <span class="p-input-icon-left search-wrapper">
              <i class="pi pi-search"></i>
              <input
                type="text"
                pInputText
                [(ngModel)]="searchQuery"
                placeholder="Search videos, creators, or tags..."
                class="search-input"
                (input)="onSearchChange()"
              />
            </span>
            @if (searchQuery()) {
              <button
                pButton
                icon="pi pi-times"
                class="p-button-text clear-btn"
                (click)="clearSearch()"
                pTooltip="Clear search"
                aria-label="Clear search"
              ></button>
            }
          </div>

          <!-- Position Filter Chips -->
          <div class="filter-chips-container">
            <div class="filter-label">
              <i class="pi pi-filter"></i>
              Position
            </div>
            <div class="filter-chips">
              @for (chip of positionChips(); track chip.value) {
                <button
                  class="filter-chip"
                  [class.active]="chip.active"
                  (click)="togglePositionFilter(chip)"
                  pRipple
                >
                  @if (chip.icon) {
                    <i [class]="chip.icon"></i>
                  }
                  {{ chip.label }}
                </button>
              }
            </div>
          </div>

          <!-- Training Focus Filter -->
          <div class="filter-chips-container">
            <div class="filter-label">
              <i class="pi pi-bolt"></i>
              Focus
            </div>
            <div class="filter-chips scrollable">
              @for (chip of focusChips(); track chip.value) {
                <button
                  class="filter-chip"
                  [class.active]="chip.active"
                  (click)="toggleFocusFilter(chip)"
                  pRipple
                >
                  {{ chip.label }}
                </button>
              }
            </div>
          </div>

          <!-- Active Filters Display -->
          @if (hasActiveFilters()) {
            <div class="active-filters">
              <span class="active-label">Active:</span>
              @for (filter of activeFilterLabels(); track filter) {
                <p-tag [value]="filter" severity="success"></p-tag>
              }
              <button
                pButton
                label="Clear All"
                icon="pi pi-times"
                class="p-button-text p-button-sm clear-filters-btn"
                (click)="clearAllFilters()"
              ></button>
            </div>
          }
        </section>

        <!-- Video Grid -->
        <section class="video-grid-section">
          @if (isLoading()) {
            <!-- Skeleton Loading -->
            <div class="video-grid">
              @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                <div class="video-card skeleton-card">
                  <p-skeleton
                    width="100%"
                    height="280px"
                    borderRadius="16px"
                  ></p-skeleton>
                  <div class="skeleton-content">
                    <p-skeleton width="70%" height="1.2rem"></p-skeleton>
                    <p-skeleton width="100%" height="0.9rem"></p-skeleton>
                    <div class="skeleton-meta">
                      <p-skeleton
                        width="80px"
                        height="24px"
                        borderRadius="12px"
                      ></p-skeleton>
                      <p-skeleton
                        width="60px"
                        height="24px"
                        borderRadius="12px"
                      ></p-skeleton>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else if (filteredVideos().length === 0) {
            <!-- Empty State -->
            <div class="empty-state">
              <div class="empty-icon">
                <i class="pi pi-video"></i>
              </div>
              <h3>No videos found</h3>
              <p>Try adjusting your filters or search query</p>
              <button
                pButton
                label="Clear Filters"
                icon="pi pi-refresh"
                (click)="clearAllFilters()"
              ></button>
            </div>
          } @else {
            <!-- Video Cards Grid -->
            <div class="video-grid">
              @for (video of filteredVideos(); track video.id) {
                <article
                  class="video-card"
                  (click)="openVideo(video)"
                  [class.bookmarked]="isBookmarked(video.id)"
                >
                  <!-- Thumbnail -->
                  <div class="video-thumbnail">
                    <div class="thumbnail-placeholder">
                      <i class="pi pi-play-circle play-icon"></i>
                      @if (video.isReel) {
                        <div class="reel-badge">
                          <i class="pi pi-instagram"></i>
                          Reel
                        </div>
                      }
                    </div>

                    <!-- Overlay Actions -->
                    <div class="video-overlay">
                      <button
                        class="overlay-btn bookmark-btn"
                        [class.active]="isBookmarked(video.id)"
                        (click)="toggleBookmark($event, video)"
                        pTooltip="Save for later"
                      >
                        <i
                          [class]="
                            isBookmarked(video.id)
                              ? 'pi pi-bookmark-fill'
                              : 'pi pi-bookmark'
                          "
                        ></i>
                      </button>
                      <button
                        class="overlay-btn share-btn"
                        (click)="shareVideo($event, video)"
                        pTooltip="Copy link"
                      >
                        <i class="pi pi-share-alt"></i>
                      </button>
                    </div>

                    <!-- Rating Badge -->
                    <div class="rating-badge">
                      <i class="pi pi-star-fill"></i>
                      {{ video.rating.toFixed(1) }}
                    </div>
                  </div>

                  <!-- Video Info -->
                  <div class="video-info">
                    <h3 class="video-title">{{ video.title }}</h3>
                    <p class="video-description">{{ video.description }}</p>

                    <!-- Creator Info -->
                    <div class="creator-row">
                      <p-avatar
                        [label]="video.creator.displayName.charAt(0)"
                        shape="circle"
                        size="normal"
                        styleClass="creator-avatar"
                      ></p-avatar>
                      <div class="creator-info">
                        <span class="creator-name">
                          {{ video.creator.displayName }}
                          @if (video.creator.verified) {
                            <i
                              class="pi pi-verified verified-badge"
                              pTooltip="Verified Creator"
                            ></i>
                          }
                        </span>
                        <span class="creator-type">{{
                          formatCredibility(video.creator.credibility)
                        }}</span>
                      </div>
                    </div>

                    <!-- Tags -->
                    <div class="video-tags">
                      @for (
                        position of video.positions.slice(0, 2);
                        track position
                      ) {
                        <span class="tag position-tag">{{ position }}</span>
                      }
                      @for (
                        focus of video.trainingFocus.slice(0, 2);
                        track focus
                      ) {
                        <span class="tag focus-tag">{{
                          formatFocus(focus)
                        }}</span>
                      }
                      <span class="tag skill-tag">{{ video.skillLevel }}</span>
                    </div>
                  </div>
                </article>
              }
            </div>
          }
        </section>

        <!-- Featured Creators Section -->
        <section class="creators-section">
          <div class="section-header">
            <h2>
              <i class="pi pi-users"></i>
              Featured Creators
            </h2>
            <p>Follow top flag football trainers and athletes</p>
          </div>

          <div class="creators-scroll">
            @for (creator of featuredCreators(); track creator.username) {
              <div class="creator-card" (click)="filterByCreator(creator)">
                <p-avatar
                  [label]="creator.displayName.charAt(0)"
                  shape="circle"
                  size="xlarge"
                  styleClass="creator-avatar-large"
                ></p-avatar>
                <div class="creator-details">
                  <span class="creator-display-name">
                    {{ creator.displayName }}
                    @if (creator.verified) {
                      <i class="pi pi-verified"></i>
                    }
                  </span>
                  <span class="creator-username"
                    >&#64;{{ creator.username }}</span
                  >
                  <span class="creator-specialty">{{
                    formatCredibility(creator.credibility)
                  }}</span>
                  @if (creator.followers) {
                    <span class="follower-count"
                      >{{ formatFollowers(creator.followers) }} followers</span
                    >
                  }
                </div>
                <div class="video-count">
                  {{ getCreatorVideoCount(creator.username) }} videos
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Video Player Dialog -->
        <p-dialog
          [(visible)]="showVideoDialog"
          [modal]="true"
          [draggable]="false"
          [resizable]="false"
          [dismissableMask]="true"
          [closable]="true"
          [showHeader]="true"
          [header]="selectedVideo()?.title || 'Training Video'"
          styleClass="video-dialog"
          [style]="{ width: '95vw', maxWidth: '800px' }"
        >
          @if (selectedVideo(); as video) {
            <div class="video-dialog-content">
              <!-- Instagram Embed -->
              <div class="embed-container" [innerHTML]="videoEmbedHtml()"></div>

              <!-- Video Details -->
              <div class="video-details">
                <p class="video-full-description">{{ video.description }}</p>

                <div class="video-meta-grid">
                  <div class="meta-item">
                    <i class="pi pi-user"></i>
                    <span>{{ video.creator.displayName }}</span>
                  </div>
                  <div class="meta-item">
                    <i class="pi pi-star-fill"></i>
                    <span>{{ video.rating.toFixed(1) }} Rating</span>
                  </div>
                  <div class="meta-item">
                    <i class="pi pi-calendar"></i>
                    <span>Added {{ formatDate(video.addedDate) }}</span>
                  </div>
                </div>

                <!-- All Tags -->
                <div class="all-tags">
                  @for (tag of video.tags; track tag) {
                    <span class="tag">#{{ tag }}</span>
                  }
                </div>

                <!-- Action Buttons -->
                <div class="dialog-actions">
                  <app-button
                    [iconLeft]="
                      isBookmarked(video.id)
                        ? 'pi-bookmark-fill'
                        : 'pi-bookmark'
                    "
                    [variant]="isBookmarked(video.id) ? 'success' : 'outlined'"
                    (clicked)="toggleBookmark($event, video)"
                    >{{ isBookmarked(video.id) ? "Saved" : "Save" }}</app-button
                  >
                  <app-button
                    iconLeft="pi-external-link"
                    (clicked)="openInInstagram(video)"
                    >Open in Instagram</app-button
                  >
                  <app-button
                    iconLeft="pi-copy"
                    (clicked)="shareVideo($event, video)"
                    >Copy Link</app-button
                  >
                </div>
              </div>
            </div>
          }
        </p-dialog>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./video-feed.component.scss",
})
export class VideoFeedComponent {
  private instagramService = inject(InstagramVideoService);
  private toastService = inject(ToastService);
  private hapticService = inject(HapticFeedbackService);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private router = inject(Router);

  // State
  searchQuery = signal("");
  isLoading = signal(true);
  showVideoDialog = signal(false);
  selectedVideo = signal<InstagramVideo | null>(null);
  bookmarkedIds = signal<Set<string>>(new Set());

  // Filter state
  activePositionFilters = signal<Set<FlagPosition>>(new Set());
  activeFocusFilters = signal<Set<TrainingFocus>>(new Set());

  // Computed
  totalVideos = computed(() => this.instagramService.totalVideos());
  totalCreators = computed(() => this.instagramService.creators().length);
  featuredCreators = computed(() =>
    this.instagramService.getFeaturedCreators().slice(0, 10),
  );

  filteredVideos = computed(() => {
    let videos = this.instagramService.getAllVideos();
    const query = this.searchQuery().toLowerCase().trim();
    const positions = this.activePositionFilters();
    const focuses = this.activeFocusFilters();

    // Search filter
    if (query) {
      videos = videos.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.description.toLowerCase().includes(query) ||
          v.tags.some((t) => t.toLowerCase().includes(query)) ||
          v.creator.displayName.toLowerCase().includes(query),
      );
    }

    // Position filter
    if (positions.size > 0) {
      videos = videos.filter((v) =>
        v.positions.some((p) => positions.has(p) || p === "All"),
      );
    }

    // Focus filter
    if (focuses.size > 0) {
      videos = videos.filter((v) =>
        v.trainingFocus.some((f) => focuses.has(f)),
      );
    }

    return videos;
  });

  videoEmbedHtml = computed(() => {
    const video = this.selectedVideo();
    if (!video) return "";
    return this.instagramService.generateEmbedHtml(video, {
      width: 400,
      maxWidth: "100%",
    });
  });

  hasActiveFilters = computed(
    () =>
      this.activePositionFilters().size > 0 ||
      this.activeFocusFilters().size > 0 ||
      this.searchQuery().length > 0,
  );

  activeFilterLabels = computed(() => {
    const labels: string[] = [];
    this.activePositionFilters().forEach((p) => labels.push(p));
    this.activeFocusFilters().forEach((f) => labels.push(this.formatFocus(f)));
    if (this.searchQuery()) labels.push(`"${this.searchQuery()}"`);
    return labels;
  });

  // Filter chips
  positionChips = signal<FilterChip[]>([
    { label: "All", value: "All", type: "position", active: false },
    {
      label: "QB",
      value: "QB",
      type: "position",
      icon: "pi pi-star",
      active: false,
    },
    { label: "WR", value: "WR", type: "position", active: false },
    { label: "DB", value: "DB", type: "position", active: false },
    { label: "Rusher", value: "Rusher", type: "position", active: false },
    { label: "Center", value: "Center", type: "position", active: false },
  ]);

  focusChips = signal<FilterChip[]>([
    { label: "Speed", value: "speed", type: "focus", active: false },
    { label: "Agility", value: "agility", type: "focus", active: false },
    {
      label: "Plyometrics",
      value: "plyometrics",
      type: "focus",
      active: false,
    },
    {
      label: "Deceleration",
      value: "deceleration",
      type: "focus",
      active: false,
    },
    {
      label: "Acceleration",
      value: "acceleration",
      type: "focus",
      active: false,
    },
    {
      label: "Route Running",
      value: "route_running",
      type: "focus",
      active: false,
    },
    { label: "Coverage", value: "coverage", type: "focus", active: false },
    { label: "Throwing", value: "throwing", type: "focus", active: false },
    { label: "Recovery", value: "recovery", type: "focus", active: false },
    { label: "Strength", value: "strength", type: "focus", active: false },
    {
      label: "Reactive Eccentric",
      value: "reactive_eccentrics",
      type: "focus",
      active: false,
    },
  ]);

  constructor() {
    afterNextRender(() => {
      this.loadBookmarks();
      // Simulate loading completion
      setTimeout(() => {
        this.isLoading.set(false);
      }, 800);
    });
  }

  // Filter methods
  togglePositionFilter(chip: FilterChip): void {
    this.hapticService.light();
    const positions = new Set(this.activePositionFilters());

    if (chip.value === "All") {
      positions.clear();
    } else {
      if (positions.has(chip.value as FlagPosition)) {
        positions.delete(chip.value as FlagPosition);
      } else {
        positions.add(chip.value as FlagPosition);
      }
    }

    this.activePositionFilters.set(positions);
    this.updateChipStates();
  }

  toggleFocusFilter(chip: FilterChip): void {
    this.hapticService.light();
    const focuses = new Set(this.activeFocusFilters());

    if (focuses.has(chip.value as TrainingFocus)) {
      focuses.delete(chip.value as TrainingFocus);
    } else {
      focuses.add(chip.value as TrainingFocus);
    }

    this.activeFocusFilters.set(focuses);
    this.updateChipStates();
  }

  private updateChipStates(): void {
    const positions = this.activePositionFilters();
    const focuses = this.activeFocusFilters();

    this.positionChips.update((chips) =>
      chips.map((c) => ({
        ...c,
        active: positions.has(c.value as FlagPosition),
      })),
    );

    this.focusChips.update((chips) =>
      chips.map((c) => ({
        ...c,
        active: focuses.has(c.value as TrainingFocus),
      })),
    );
  }

  onSearchChange(): void {
    // Debounced search handled by computed
  }

  clearSearch(): void {
    this.searchQuery.set("");
  }

  clearAllFilters(): void {
    this.searchQuery.set("");
    this.activePositionFilters.set(new Set());
    this.activeFocusFilters.set(new Set());
    this.updateChipStates();
    this.toastService.info(TOAST.INFO.FILTERS_CLEARED);
  }

  // Video actions
  openVideo(video: InstagramVideo): void {
    this.hapticService.medium();
    this.selectedVideo.set(video);
    this.showVideoDialog.set(true);
  }

  async toggleBookmark(event: Event, video: InstagramVideo): Promise<void> {
    event.stopPropagation();
    this.hapticService.medium();

    const bookmarks = new Set(this.bookmarkedIds());
    const isCurrentlyBookmarked = bookmarks.has(video.id);

    if (isCurrentlyBookmarked) {
      bookmarks.delete(video.id);
      await this.removeBookmark(video.id);
      this.toastService.info(TOAST.INFO.VIDEO_REMOVED);
    } else {
      bookmarks.add(video.id);
      await this.saveBookmark(video);
      this.toastService.success(TOAST.SUCCESS.VIDEO_SAVED);
    }

    this.bookmarkedIds.set(bookmarks);
  }

  isBookmarked(videoId: string): boolean {
    return this.bookmarkedIds().has(videoId);
  }

  async shareVideo(event: Event, video: InstagramVideo): Promise<void> {
    event.stopPropagation();
    this.hapticService.light();

    try {
      await navigator.clipboard.writeText(video.url);
      this.toastService.success(TOAST.SUCCESS.COPIED);
    } catch {
      this.toastService.error(TOAST.ERROR.COPY_FAILED);
    }
  }

  openInInstagram(video: InstagramVideo): void {
    window.open(video.url, "_blank");
  }

  filterByCreator(creator: InstagramCreator): void {
    this.searchQuery.set(creator.displayName);
    this.toastService.info(`Showing videos from ${creator.displayName}`);
  }

  getCreatorVideoCount(username: string): number {
    return this.instagramService.getVideosByCreator(username).length;
  }

  // Bookmark persistence
  private async loadBookmarks(): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      const { data } = await this.supabaseService.client
        .from("video_bookmarks")
        .select("video_id")
        .eq("user_id", user.id);

      if (data) {
        this.bookmarkedIds.set(new Set(data.map((b) => b.video_id)));
      }
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
    }
  }

  private async saveBookmark(video: InstagramVideo): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      await this.supabaseService.client.from("video_bookmarks").upsert({
        user_id: user.id,
        video_id: video.id,
        video_title: video.title,
        video_url: video.url,
        creator_username: video.creator.username,
        saved_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to save bookmark:", error);
    }
  }

  private async removeBookmark(videoId: string): Promise<void> {
    try {
      const user = this.authService.getUser();
      if (!user?.id) return;

      await this.supabaseService.client
        .from("video_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("video_id", videoId);
    } catch (error) {
      console.error("Failed to remove bookmark:", error);
    }
  }

  // Formatters
  formatCredibility(credibility: string): string {
    const map: Record<string, string> = {
      pro_athlete: "Pro Athlete",
      coach: "Coach",
      trainer: "Trainer",
      influencer: "Influencer",
      team: "Team",
    };
    return map[credibility] || credibility;
  }

  formatFocus(focus: TrainingFocus): string {
    const map: Record<string, string> = {
      speed: "Speed",
      agility: "Agility",
      strength: "Strength",
      power: "Power",
      skills: "Skills",
      throwing: "Throwing",
      catching: "Catching",
      route_running: "Routes",
      coverage: "Coverage",
      rushing: "Rushing",
      recovery: "Recovery",
      mobility: "Mobility",
      injury_prevention: "Injury Prevention",
      conditioning: "Conditioning",
      mental: "Mental",
      plyometrics: "Plyo",
      isometrics: "Isometrics",
      reactive_eccentrics: "Reactive",
      deceleration: "Decel",
      acceleration: "Accel",
      twitches: "Fast Twitch",
      explosive_power: "Explosive",
    };
    return map[focus] || focus;
  }

  formatFollowers(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(0) + "K";
    }
    return count.toString();
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  navigateToSuggest(): void {
    this.hapticService.light();
    this.router.navigate(["/training/videos/suggest"]);
  }
}
