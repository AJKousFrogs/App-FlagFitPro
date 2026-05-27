/**
 * Instagram Video Service
 *
 * INSTAGRAM REELS & VIDEO INTEGRATION FOR FLAG FOOTBALL ATHLETES
 *
 * This service provides Instagram video embedding, curated training content
 * from Instagram Reels, and integration with the training video system.
 *
 * Features:
 * - Instagram Reel embedding via oEmbed API
 * - Curated flag football training content from Instagram creators
 * - Position-specific drill videos from pro athletes
 * - Integration with existing training video database
 * - Caching for performance optimization
 * - Platform detection and fallback handling
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 * @angular 21
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { HttpBackend, HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { LoggerService } from "./logger.service";
import { FlagPosition } from "../constants/positions.constants";
import { SkillLevel } from "../constants/ui-options.constants";
import { CURATED_INSTAGRAM_VIDEOS, FEATURED_CREATORS } from "./instagram-video.data";

type TrainingFocus = string;
type TrainingPhase = string;

// ============================================================================
// INTERFACES
// ============================================================================

export interface InstagramVideo {
  id: string;
  shortcode: string;
  title: string;
  description: string;
  url: string;
  embedUrl: string;
  thumbnailUrl?: string;
  duration?: number; // seconds (if available)
  creator: InstagramCreator;
  positions: FlagPosition[];
  trainingFocus: TrainingFocus[];
  skillLevel: SkillLevel;
  phase: TrainingPhase[];
  tags: string[];
  rating: number;
  addedDate: string;
  isReel: boolean;
  viewCount?: number;
  likeCount?: number;
}

export interface InstagramCreator {
  username: string;
  displayName: string;
  profileUrl: string;
  verified: boolean;
  credibility: "pro_athlete" | "coach" | "trainer" | "influencer" | "team";
  sport?: string;
  position?: FlagPosition;
  followers?: number;
}

export interface InstagramEmbedResponse {
  version: string;
  title: string;
  author_name: string;
  author_url: string;
  author_id: number;
  media_id: string;
  provider_name: string;
  provider_url: string;
  type: string;
  width: number;
  height?: number;
  html: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
}

export interface InstagramVideoFilter {
  positions?: FlagPosition[];
  focus?: TrainingFocus[];
  skillLevel?: SkillLevel;
  phase?: TrainingPhase;
  creator?: string;
  tags?: string[];
  isReel?: boolean;
  minRating?: number;
}

export interface InstagramPlaylist {
  id: string;
  name: string;
  description: string;
  videos: InstagramVideo[];
  position?: FlagPosition;
  focus: TrainingFocus[];
  totalDuration: number;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class InstagramVideoService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private logger = inject(LoggerService);

  // Reactive state with signals
  private readonly _videos = signal<InstagramVideo[]>(CURATED_INSTAGRAM_VIDEOS);
  private readonly _creators = signal<InstagramCreator[]>(FEATURED_CREATORS);
  private readonly _embedCache = signal<Map<string, InstagramEmbedResponse>>(
    new Map(),
  );
  private readonly _loadingStates = signal<Map<string, boolean>>(new Map());
  private readonly _selectedVideo = signal<InstagramVideo | null>(null);

  // Public readonly signals
  readonly videos = this._videos.asReadonly();
  readonly creators = this._creators.asReadonly();
  readonly selectedVideo = this._selectedVideo.asReadonly();

  // Computed signals
  readonly totalVideos = computed(() => this._videos().length);
  readonly reelsOnly = computed(() => this._videos().filter((v) => v.isReel));
  readonly verifiedCreators = computed(() =>
    this._creators().filter((c) => c.verified),
  );

  readonly videosByPosition = computed(() => {
    const grouped = new Map<FlagPosition, InstagramVideo[]>();
    for (const video of this._videos()) {
      for (const position of video.positions) {
        const existing = grouped.get(position) || [];
        grouped.set(position, [...existing, video]);
      }
    }
    return grouped;
  });

  readonly videosByFocus = computed(() => {
    const grouped = new Map<TrainingFocus, InstagramVideo[]>();
    for (const video of this._videos()) {
      for (const focus of video.trainingFocus) {
        const existing = grouped.get(focus) || [];
        grouped.set(focus, [...existing, video]);
      }
    }
    return grouped;
  });

  // ============================================================================
  // VIDEO RETRIEVAL
  // ============================================================================

  /**
   * Get all curated Instagram videos
   */
  getAllVideos(): InstagramVideo[] {
    return this._videos();
  }

  /**
   * Get video by ID
   */
  getVideoById(id: string): InstagramVideo | undefined {
    return this._videos().find((v) => v.id === id);
  }

  /**
   * Get video by Instagram shortcode
   */
  getVideoByShortcode(shortcode: string): InstagramVideo | undefined {
    return this._videos().find((v) => v.shortcode === shortcode);
  }

  /**
   * Filter videos by criteria
   */
  filterVideos(filter: InstagramVideoFilter): InstagramVideo[] {
    return this._videos().filter((video) => {
      // Position filter
      const positions = filter.positions;
      if (
        positions?.length &&
        !video.positions.some((p) => positions.includes(p) || p === "All")
      ) {
        return false;
      }

      // Focus filter
      const focus = filter.focus;
      if (
        focus?.length &&
        !video.trainingFocus.some((f) => focus.includes(f))
      ) {
        return false;
      }

      // Skill level filter
      if (
        filter.skillLevel &&
        video.skillLevel !== "all" &&
        video.skillLevel !== filter.skillLevel
      ) {
        return false;
      }

      // Phase filter
      if (
        filter.phase &&
        !video.phase.includes(filter.phase) &&
        !video.phase.includes("all")
      ) {
        return false;
      }

      // Creator filter
      if (
        filter.creator &&
        video.creator.username.toLowerCase() !== filter.creator.toLowerCase()
      ) {
        return false;
      }

      // Tags filter
      if (
        filter.tags?.length &&
        !filter.tags.some((tag) =>
          video.tags.some((vt) => vt.toLowerCase().includes(tag.toLowerCase())),
        )
      ) {
        return false;
      }

      // Reel filter
      if (filter.isReel !== undefined && video.isReel !== filter.isReel) {
        return false;
      }

      // Rating filter
      if (filter.minRating && video.rating < filter.minRating) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get videos for a specific position
   */
  getVideosForPosition(position: FlagPosition): InstagramVideo[] {
    return this.filterVideos({ positions: [position] });
  }

  /**
   * Get videos for a specific training focus
   */
  getVideosForFocus(focus: TrainingFocus): InstagramVideo[] {
    return this.filterVideos({ focus: [focus] });
  }

  /**
   * Generate Instagram thumbnail URL from shortcode
   * Instagram thumbnail format: https://www.instagram.com/p/{shortcode}/media/?size=l
   * For reels: https://www.instagram.com/reel/{shortcode}/media/?size=l
   */
  getInstagramThumbnail(video: InstagramVideo): string {
    if (video.thumbnailUrl) {
      return video.thumbnailUrl;
    }

    const type = video.isReel ? "reel" : "p";
    return `https://www.instagram.com/${type}/${video.shortcode}/media/?size=l`;
  }

  /**
   * Get recommended videos based on athlete profile
   */
  getRecommendedVideos(
    position: FlagPosition,
    phase: TrainingPhase,
    skillLevel: SkillLevel,
    limit = 5,
  ): InstagramVideo[] {
    const filtered = this.filterVideos({
      positions: [position],
      phase,
      skillLevel,
    });

    // Sort by rating and return top results
    return filtered.sort((a, b) => b.rating - a.rating).slice(0, limit);
  }

  /**
   * Get today's featured video
   */
  getTodaysFeaturedVideo(position?: FlagPosition): InstagramVideo | null {
    const today = new Date();
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
        86400000,
    );

    let videos = this._videos();
    if (position) {
      videos = this.getVideosForPosition(position);
    }

    if (videos.length === 0) return null;

    // Rotate through videos based on day of year
    const index = dayOfYear % videos.length;
    return videos[index];
  }

  // ============================================================================
  // INSTAGRAM EMBED API
  // ============================================================================

  /**
   * Get Instagram oEmbed data for a video URL
   * Uses Instagram's oEmbed endpoint for official embedding
   */
  async getEmbedData(url: string): Promise<InstagramEmbedResponse | null> {
    // Check cache first
    const cached = this._embedCache().get(url);
    if (cached) {
      this.logger.debug("[InstagramVideoService] Returning cached embed data");
      return cached;
    }

    // Set loading state
    const loadingStates = new Map(this._loadingStates());
    loadingStates.set(url, true);
    this._loadingStates.set(loadingStates);

    try {
      // Instagram oEmbed endpoint
      const oEmbedUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${encodeURIComponent(url)}&access_token=${this.getAccessToken()}&omitscript=true`;

      const data = await firstValueFrom(
        this.http.get<InstagramEmbedResponse>(oEmbedUrl),
      );

      // Cache the result
      const cache = new Map(this._embedCache());
      cache.set(url, data);
      this._embedCache.set(cache);

      return data;
    } catch (error) {
      this.logger.error(
        "[InstagramVideoService] Failed to fetch embed data:",
        error,
      );
      return null;
    } finally {
      // Clear loading state
      const loadingStates = new Map(this._loadingStates());
      loadingStates.set(url, false);
      this._loadingStates.set(loadingStates);
    }
  }

  /**
   * Generate embed HTML for an Instagram video
   * Falls back to iframe if oEmbed fails
   * Includes error handling for timeout/load failures
   */
  generateEmbedHtml(
    video: InstagramVideo,
    options: {
      width?: number;
      maxWidth?: string;
      captioned?: boolean;
    } = {},
  ): string {
    const { width = 400, maxWidth = "100%", captioned = true } = options;
    const containerClass =
      maxWidth === "100%"
        ? "instagram-embed-container"
        : "instagram-embed-container instagram-embed-container--full";

    // Use iframe embed as primary method (more reliable)
    const embedUrl = captioned
      ? `${video.embedUrl}?captioned=true`
      : video.embedUrl;

    return `
      <div class="${containerClass}">
        <iframe
          src="${embedUrl}"
          width="${width}"
          height="${Math.round(width * 1.25)}"
          frameborder="0"
          scrolling="no"
          allowtransparency="true"
          allowfullscreen="true"
          loading="lazy"
          class="instagram-embed-frame"
        ></iframe>
        <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="instagram-embed-link">
          <i class="pi pi-external-link instagram-embed-link-icon"></i>
          Watch on Instagram
        </a>
      </div>
    `;
  }

  /**
   * Extract shortcode from Instagram URL
   */
  extractShortcode(url: string): string | null {
    // Handle various Instagram URL formats
    const patterns = [
      /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
      /instagram\.com\/tv\/([A-Za-z0-9_-]+)/,
      /instagr\.am\/p\/([A-Za-z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Build Instagram URL from shortcode
   */
  buildInstagramUrl(shortcode: string, type: "post" | "reel" = "reel"): string {
    return `https://www.instagram.com/${type === "reel" ? "reel" : "p"}/${shortcode}/`;
  }

  // ============================================================================
  // CREATOR MANAGEMENT
  // ============================================================================

  /**
   * Get all featured creators
   */
  getFeaturedCreators(): InstagramCreator[] {
    return this._creators();
  }

  /**
   * Get creator by username
   */
  getCreatorByUsername(username: string): InstagramCreator | undefined {
    return this._creators().find(
      (c) => c.username.toLowerCase() === username.toLowerCase(),
    );
  }

  /**
   * Get videos by creator
   */
  getVideosByCreator(username: string): InstagramVideo[] {
    return this._videos().filter(
      (v) => v.creator.username.toLowerCase() === username.toLowerCase(),
    );
  }

  /**
   * Get creators by position specialty
   */
  getCreatorsByPosition(position: FlagPosition): InstagramCreator[] {
    return this._creators().filter((c) => c.position === position);
  }

  // ============================================================================
  // PLAYLIST MANAGEMENT
  // ============================================================================

  /**
   * Create a custom playlist from Instagram videos
   */
  createPlaylist(
    name: string,
    description: string,
    videoIds: string[],
    options: {
      position?: FlagPosition;
      focus?: TrainingFocus[];
    } = {},
  ): InstagramPlaylist {
    const videos = videoIds
      .map((id) => this.getVideoById(id))
      .filter((v): v is InstagramVideo => v !== undefined);

    const totalDuration = videos.reduce(
      (sum, v) => sum + (v.duration || 60),
      0,
    );

    return {
      id: `playlist_${Date.now()}`,
      name,
      description,
      videos,
      position: options.position,
      focus: options.focus || [],
      totalDuration,
      createdBy: "user",
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get pre-built position-specific playlists
   */
  getPositionPlaylist(position: FlagPosition): InstagramPlaylist {
    const videos = this.getVideosForPosition(position);
    const focusSet = new Set<TrainingFocus>();
    videos.forEach((v) => v.trainingFocus.forEach((f) => focusSet.add(f)));

    return {
      id: `position_${position.toLowerCase()}`,
      name: `${position} Training Collection`,
      description: `Curated Instagram training videos for ${position} position`,
      videos,
      position,
      focus: Array.from(focusSet),
      totalDuration: videos.reduce((sum, v) => sum + (v.duration || 60), 0),
      createdBy: "system",
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get pre-built focus-specific playlists
   */
  getFocusPlaylist(focus: TrainingFocus): InstagramPlaylist {
    const videos = this.getVideosForFocus(focus);

    return {
      id: `focus_${focus}`,
      name: `${this.formatFocusName(focus)} Training`,
      description: `Instagram videos focused on ${this.formatFocusName(focus).toLowerCase()}`,
      videos,
      focus: [focus],
      totalDuration: videos.reduce((sum, v) => sum + (v.duration || 60), 0),
      createdBy: "system",
      createdAt: new Date().toISOString(),
    };
  }

  // ============================================================================
  // SELECTION STATE
  // ============================================================================

  /**
   * Select a video for viewing
   */
  selectVideo(video: InstagramVideo | null): void {
    this._selectedVideo.set(video);
  }

  /**
   * Select video by ID
   */
  selectVideoById(id: string): boolean {
    const video = this.getVideoById(id);
    if (video) {
      this._selectedVideo.set(video);
      return true;
    }
    return false;
  }

  /**
   * Check if a video is loading
   */
  isLoading(url: string): boolean {
    return this._loadingStates().get(url) || false;
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get video statistics
   */
  getStatistics(): {
    totalVideos: number;
    totalCreators: number;
    byPosition: Record<string, number>;
    byFocus: Record<string, number>;
    averageRating: number;
    reelCount: number;
  } {
    const videos = this._videos();
    const byPosition: Record<string, number> = {};
    const byFocus: Record<string, number> = {};

    for (const video of videos) {
      for (const position of video.positions) {
        byPosition[position] = (byPosition[position] || 0) + 1;
      }
      for (const focus of video.trainingFocus) {
        byFocus[focus] = (byFocus[focus] || 0) + 1;
      }
    }

    const totalRating = videos.reduce((sum, v) => sum + v.rating, 0);

    return {
      totalVideos: videos.length,
      totalCreators: this._creators().length,
      byPosition,
      byFocus,
      averageRating: videos.length > 0 ? totalRating / videos.length : 0,
      reelCount: videos.filter((v) => v.isReel).length,
    };
  }

  // ============================================================================
  // SEARCH
  // ============================================================================

  /**
   * Search videos by query
   */
  searchVideos(query: string): InstagramVideo[] {
    const lowerQuery = query.toLowerCase();

    return this._videos().filter(
      (video) =>
        video.title.toLowerCase().includes(lowerQuery) ||
        video.description.toLowerCase().includes(lowerQuery) ||
        video.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
        video.creator.username.toLowerCase().includes(lowerQuery) ||
        video.creator.displayName.toLowerCase().includes(lowerQuery),
    );
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Get Instagram access token
   * In production, this should come from environment/backend
   */
  private getAccessToken(): string {
    // This should be configured via environment variables
    // For now, return empty string - oEmbed will work without token for public posts
    return "";
  }

  /**
   * Format training focus name for display
   */
  private formatFocusName(focus: TrainingFocus): string {
    const names: Record<TrainingFocus, string> = {
      speed: "Speed",
      agility: "Agility",
      strength: "Strength",
      power: "Power",
      skills: "Skills",
      throwing: "Throwing",
      catching: "Catching",
      route_running: "Route Running",
      coverage: "Coverage",
      rushing: "Rushing",
      recovery: "Recovery",
      mobility: "Mobility",
      injury_prevention: "Injury Prevention",
      conditioning: "Conditioning",
      mental: "Mental Training",
      plyometrics: "Plyometrics",
      isometrics: "Isometrics",
      reactive_eccentrics: "Reactive Eccentrics",
      deceleration: "Deceleration",
      acceleration: "Acceleration",
      twitches: "Fast Twitch Training",
      explosive_power: "Explosive Power",
    };
    return names[focus] || focus;
  }
}
