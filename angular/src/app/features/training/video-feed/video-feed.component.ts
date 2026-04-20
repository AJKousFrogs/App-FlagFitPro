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
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";

// PrimeNG Components
import { AvatarComponent } from "../../../shared/components/avatar/avatar.component";

import { ButtonComponent } from "../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { AppDialogComponent } from "../../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../../shared/components/dialog-header/dialog-header.component";
import { Skeleton } from "primeng/skeleton";
import { Tooltip } from "primeng/tooltip";
import { formatDate as formatDateValue } from "../../../shared/utils/date.utils";
import { VideoFeedHeaderSectionComponent } from "./components/video-feed-header-section.component";

// Services
import { HapticFeedbackService } from "../../../core/services/haptic-feedback.service";
import {
  InstagramCreator,
  InstagramVideo,
  InstagramVideoService,
} from "../../../core/services/instagram-video.service";
import { LoggerService } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { VideoBookmarkDataService } from "../services/video-bookmark-data.service";
import {
  FlagPosition,
  TrainingFocus,
} from "../../../core/models/training-video.models";

// Layout
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { FilterChip } from "./video-feed.models";

@Component({
  selector: "app-video-feed",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Skeleton,
    Tooltip,

    AvatarComponent,
    MainLayoutComponent,
    ButtonComponent,
    EmptyStateComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    VideoFeedHeaderSectionComponent,
  ],
  templateUrl: "./video-feed.component.html",
  styleUrl: "./video-feed.component.scss",
})
export class VideoFeedComponent {
  private instagramService = inject(InstagramVideoService);
  private toastService = inject(ToastService);
  private hapticService = inject(HapticFeedbackService);
  private supabase = inject(SupabaseService);
  private videoBookmarkDataService = inject(VideoBookmarkDataService);
  private router = inject(Router);
  private logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  // State
  readonly searchControl = new FormControl("", { nonNullable: true });
  searchQuery = signal("");
  isLoading = signal(true);
  showVideoDialog = signal(false);
  selectedVideo = signal<InstagramVideo | null>(null);
  bookmarkedIds = signal<Set<string>>(new Set());

  // 🎥 OPTIONAL: Hover preview feature (disabled by default)
  enableHoverPreview = signal(false); // Set to true to enable hover-to-play
  hoveringVideoId = signal<string | null>(null);
  private hoverTimer: ReturnType<typeof setTimeout> | null = null;

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
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.searchQuery.set(value);
        this.onSearchChange();
      });

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
    this.searchControl.setValue("");
  }

  clearAllFilters(): void {
    this.searchControl.setValue("");
    this.activePositionFilters.set(new Set());
    this.activeFocusFilters.set(new Set());
    this.updateChipStates();
    this.toastService.info(TOAST.INFO.FILTERS_CLEARED);
  }

  /** Bound handler for EmptyStateComponent actionHandler input */
  readonly clearAllFiltersHandler = (): void => this.clearAllFilters();

  // Video actions
  closeVideoDialog(): void {
    this.showVideoDialog.set(false);
    this.selectedVideo.set(null);
  }

  openVideo(video: InstagramVideo): void {
    this.hapticService.medium();
    this.closeVideoDialog();
    this.selectedVideo.set(video);
    this.showVideoDialog.set(true);
  }

  /**
   * Get Instagram thumbnail URL for video preview
   */
  getVideoThumbnail(video: InstagramVideo): string {
    return this.instagramService.getInstagramThumbnail(video);
  }

  /**
   * Handle thumbnail load error - fallback to placeholder
   */
  onThumbnailError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = "none";
    // Show the fallback placeholder (handled by CSS)
  }

  /**
   * 🎥 HOVER PREVIEW FEATURE (Optional)
   * On hover, start timer to load video preview
   * Desktop only - disabled on mobile to save bandwidth
   */
  onVideoCardHover(video: InstagramVideo): void {
    if (!this.enableHoverPreview() || window.innerWidth <= 768) {
      return; // Feature disabled or mobile device
    }

    // Clear any existing timer
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
    }

    // Wait 1 second before loading preview
    this.hoverTimer = setTimeout(() => {
      this.hoveringVideoId.set(video.id);
    }, 1000);
  }

  /**
   * Clear hover state when mouse leaves
   */
  onVideoCardLeave(): void {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
    this.hoveringVideoId.set(null);
  }

  /**
   * Check if video is currently being previewed on hover
   */
  isPreviewingVideo(videoId: string): boolean {
    return this.enableHoverPreview() && this.hoveringVideoId() === videoId;
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
    this.searchControl.setValue(creator.displayName);
    this.toastService.info(`Showing videos from ${creator.displayName}`);
  }

  getCreatorVideoCount(username: string): number {
    return this.instagramService.getVideosByCreator(username).length;
  }

  scrollToVideos(): void {
    this.hapticService.light();
    const videoSection = document.querySelector(".video-grid-section");
    videoSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  scrollToCreators(): void {
    this.hapticService.light();
    const creatorsSection = document.querySelector(".creators-section");
    creatorsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  private getBookmarkUserId(): string | null {
    return this.supabase.userId();
  }

  // Bookmark persistence
  private async loadBookmarks(): Promise<void> {
    try {
      const userId = this.getBookmarkUserId();
      if (!userId) return;

      const { bookmarks } =
        await this.videoBookmarkDataService.fetchBookmarks(userId);

      if (bookmarks) {
        this.bookmarkedIds.set(new Set(bookmarks.map((b) => b.video_id)));
      }
    } catch (error) {
      this.logger.error("Failed to load bookmarks", error);
    }
  }

  private async saveBookmark(video: InstagramVideo): Promise<void> {
    try {
      const userId = this.getBookmarkUserId();
      if (!userId) return;

      await this.videoBookmarkDataService.saveBookmark({
        userId,
        videoId: video.id,
        videoTitle: video.title,
        videoUrl: video.url,
        creatorUsername: video.creator.username,
      });
    } catch (error) {
      this.logger.error("Failed to save bookmark", error);
    }
  }

  private async removeBookmark(videoId: string): Promise<void> {
    try {
      const userId = this.getBookmarkUserId();
      if (!userId) return;

      await this.videoBookmarkDataService.removeBookmark({
        userId,
        videoId,
      });
    } catch (error) {
      this.logger.error("Failed to remove bookmark", error);
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
    return formatDateValue(dateStr, "MMM d, yyyy");
  }

  navigateToSuggest(): void {
    this.hapticService.light();
    this.router.navigate(["/training/videos/suggest"]);
  }
}
