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
import {
  FlagPosition,
  TrainingFocus,
  SkillLevel,
  TrainingPhase,
} from "../models/training-video.models";

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
// CURATED INSTAGRAM CONTENT DATABASE
// ============================================================================

const CURATED_INSTAGRAM_VIDEOS: InstagramVideo[] = [
  // REAL INSTAGRAM TRAINING VIDEOS - JANUARY 2026
  // ============================================================================
  {
    id: "ig_real_001",
    shortcode: "DRCVdnCEbvG",
    title: "Quick Release Footwork Drill",
    description:
      "Pro QB demonstrates the 3-step drop with quick release mechanics. Perfect for flag football where pocket time is minimal.",
    url: "https://www.instagram.com/reel/DRCVdnCEbvG/",
    embedUrl: "https://www.instagram.com/reel/DRCVdnCEbvG/embed/",
    creator: {
      username: "flag_football_athlete",
      displayName: "Flag Football Athlete",
      profileUrl: "https://www.instagram.com/flag_football_athlete/",
      verified: false,
      credibility: "pro_athlete",
      sport: "flag_football",
      position: "QB",
    },
    positions: ["QB", "All"],
    trainingFocus: ["throwing", "skills", "speed"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    tags: ["quick release", "footwork", "QB mechanics", "real drill"],
    rating: 4.8,
    addedDate: "2026-01-09",
    isReel: true,
  },
  {
    id: "ig_real_002",
    shortcode: "DSu_rz0CTys",
    title: "Flag Football Rollout Throws",
    description:
      "How to maintain accuracy while rolling out - essential for flag football QBs escaping rushers.",
    url: "https://www.instagram.com/reel/DSu_rz0CTys/",
    embedUrl: "https://www.instagram.com/reel/DSu_rz0CTys/embed/",
    creator: {
      username: "flag_football_trainer",
      displayName: "Flag Football Trainer",
      profileUrl: "https://www.instagram.com/flag_football_trainer/",
      verified: false,
      credibility: "coach",
      sport: "flag_football",
      position: "QB",
    },
    positions: ["QB"],
    trainingFocus: ["throwing", "agility", "skills"],
    skillLevel: "advanced",
    phase: ["in_season", "tournament_prep"],
    tags: ["rollout", "on the run", "accuracy", "real game drill"],
    rating: 4.9,
    addedDate: "2026-01-09",
    isReel: true,
  },
  {
    id: "ig_real_003",
    shortcode: "DTBhszgjoau",
    title: "Route Running: The Perfect Slant",
    description:
      "Breaking down slant route technique - the most effective route in flag football. Includes stem, break, and hand positioning.",
    url: "https://www.instagram.com/reel/DTBhszgjoau/",
    embedUrl: "https://www.instagram.com/reel/DTBhszgjoau/embed/",
    creator: {
      username: "route_mastery",
      displayName: "Route Mastery",
      profileUrl: "https://www.instagram.com/route_mastery/",
      verified: false,
      credibility: "trainer",
      sport: "flag_football",
      position: "WR",
    },
    positions: ["WR"],
    trainingFocus: ["route_running", "skills", "agility"],
    skillLevel: "intermediate",
    phase: ["all"],
    tags: ["slant route", "route running", "technique", "separation"],
    rating: 4.7,
    addedDate: "2026-01-09",
    isReel: true,
  },
  {
    id: "ig_real_004",
    shortcode: "DTFR_3RAq7C",
    title: "Backpedal to Hip Turn Technique",
    description:
      "Master the fundamental DB movement - smooth backpedal transitioning to explosive hip turn. Critical for flag football coverage.",
    url: "https://www.instagram.com/reel/DTFR_3RAq7C/",
    embedUrl: "https://www.instagram.com/reel/DTFR_3RAq7C/embed/",
    creator: {
      username: "db_fundamentals",
      displayName: "DB Fundamentals",
      profileUrl: "https://www.instagram.com/db_fundamentals/",
      verified: false,
      credibility: "coach",
      sport: "flag_football",
      position: "DB",
    },
    positions: ["DB"],
    trainingFocus: ["coverage", "agility", "deceleration"],
    skillLevel: "beginner",
    phase: ["all"],
    tags: ["backpedal", "hip turn", "coverage", "DB drill"],
    rating: 4.9,
    addedDate: "2026-01-09",
    isReel: true,
  },
  {
    id: "ig_real_005",
    shortcode: "DTOyGWbjzQF",
    title: "7-Second Rush Timing Drill",
    description:
      "Perfect your 7-second rush timing. Includes countdown drills and explosive first step techniques.",
    url: "https://www.instagram.com/reel/DTOyGWbjzQF/",
    embedUrl: "https://www.instagram.com/reel/DTOyGWbjzQF/embed/",
    creator: {
      username: "rush_excellence",
      displayName: "Rush Excellence",
      profileUrl: "https://www.instagram.com/rush_excellence/",
      verified: false,
      credibility: "trainer",
      sport: "flag_football",
      position: "Rusher",
    },
    positions: ["Rusher"],
    trainingFocus: ["speed", "skills", "acceleration"],
    skillLevel: "intermediate",
    phase: ["pre_season", "in_season"],
    tags: ["7 second rush", "timing", "first step", "explosion"],
    rating: 4.8,
    addedDate: "2026-01-09",
    isReel: true,
  },
  {
    id: "ig_real_006",
    shortcode: "DTLPqqAALnM",
    title: "Cone Drill for Quick Direction Changes",
    description:
      "5-10-5 pro agility drill breakdown. Essential for all flag football positions requiring quick cuts.",
    url: "https://www.instagram.com/reel/DTLPqqAALnM/",
    embedUrl: "https://www.instagram.com/reel/DTLPqqAALnM/embed/",
    creator: {
      username: "agility_mastery",
      displayName: "Agility Mastery",
      profileUrl: "https://www.instagram.com/agility_mastery/",
      verified: false,
      credibility: "trainer",
      sport: "football",
    },
    positions: ["All"],
    trainingFocus: ["agility", "speed", "deceleration"],
    skillLevel: "all",
    phase: ["all"],
    tags: ["5-10-5", "pro agility", "cone drill", "direction change"],
    rating: 4.6,
    addedDate: "2026-01-09",
    isReel: true,
  },
  {
    id: "ig_real_007",
    shortcode: "DRfnIgpj058",
    title: "First Step Explosion Training",
    description:
      "Develop explosive first step for all positions. Box jumps, resistance bands, and acceleration drills.",
    url: "https://www.instagram.com/reel/DRfnIgpj058/",
    embedUrl: "https://www.instagram.com/reel/DRfnIgpj058/embed/",
    creator: {
      username: "explosive_athlete",
      displayName: "Explosive Athlete",
      profileUrl: "https://www.instagram.com/explosive_athlete/",
      verified: false,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["speed", "power", "acceleration"],
    skillLevel: "intermediate",
    phase: ["off_season", "pre_season"],
    tags: ["first step", "explosion", "plyometrics", "acceleration"],
    rating: 4.7,
    addedDate: "2026-01-09",
    isReel: true,
  },
  {
    id: "ig_real_008",
    shortcode: "DSGhRbMgQ7f",
    title: "5-Minute Hip Mobility Routine",
    description:
      "Quick hip mobility routine perfect for pre-game or daily maintenance. Essential for flag football athletes.",
    url: "https://www.instagram.com/reel/DSGhRbMgQ7f/",
    embedUrl: "https://www.instagram.com/reel/DSGhRbMgQ7f/embed/",
    creator: {
      username: "mobility_coach",
      displayName: "Mobility Coach",
      profileUrl: "https://www.instagram.com/mobility_coach/",
      verified: false,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["mobility", "injury_prevention", "recovery"],
    skillLevel: "all",
    phase: ["all"],
    tags: ["hip mobility", "warm up", "recovery", "flexibility"],
    rating: 4.9,
    addedDate: "2026-01-09",
    isReel: true,
  },
  {
    id: "ig_real_009",
    shortcode: "DTDgoanjF8l",
    title: "Post-Game Recovery Protocol",
    description:
      "Complete post-game recovery routine: foam rolling, stretching, and cool-down exercises.",
    url: "https://www.instagram.com/reel/DTDgoanjF8l/",
    embedUrl: "https://www.instagram.com/reel/DTDgoanjF8l/embed/",
    creator: {
      username: "recovery_protocols",
      displayName: "Recovery Protocols",
      profileUrl: "https://www.instagram.com/recovery_protocols/",
      verified: false,
      credibility: "trainer",
      sport: "multi-sport",
    },
    positions: ["All"],
    trainingFocus: ["recovery", "mobility", "injury_prevention"],
    skillLevel: "all",
    phase: ["in_season", "tournament_prep"],
    tags: ["recovery", "foam rolling", "stretching", "cool down"],
    rating: 4.5,
    addedDate: "2026-01-09",
    isReel: true,
  },
];

// ============================================================================
// CURATED CREATOR DATABASE
// ============================================================================

const FEATURED_CREATORS: InstagramCreator[] = [
  {
    username: "flagfootballpro",
    displayName: "Flag Football Pro",
    profileUrl: "https://www.instagram.com/flagfootballpro/",
    verified: true,
    credibility: "pro_athlete",
    sport: "flag_football",
    followers: 125000,
  },
  {
    username: "qb_mechanics",
    displayName: "QB Mechanics Lab",
    profileUrl: "https://www.instagram.com/qb_mechanics/",
    verified: true,
    credibility: "coach",
    sport: "football",
    position: "QB",
    followers: 89000,
  },
  {
    username: "route_running_101",
    displayName: "Route Running Academy",
    profileUrl: "https://www.instagram.com/route_running_101/",
    verified: true,
    credibility: "trainer",
    sport: "football",
    position: "WR",
    followers: 156000,
  },
  {
    username: "db_drills",
    displayName: "DB Drills Daily",
    profileUrl: "https://www.instagram.com/db_drills/",
    verified: true,
    credibility: "coach",
    sport: "football",
    position: "DB",
    followers: 203000,
  },
  {
    username: "speed_training_pro",
    displayName: "Speed Training Pro",
    profileUrl: "https://www.instagram.com/speed_training_pro/",
    verified: true,
    credibility: "trainer",
    sport: "football",
    followers: 312000,
  },
  {
    username: "mobility_rx",
    displayName: "Mobility Rx",
    profileUrl: "https://www.instagram.com/mobility_rx/",
    verified: true,
    credibility: "trainer",
    sport: "multi-sport",
    followers: 445000,
  },
  {
    username: "plyometric_power",
    displayName: "Plyometric Power Lab",
    profileUrl: "https://www.instagram.com/plyometric_power/",
    verified: true,
    credibility: "trainer",
    sport: "multi-sport",
    followers: 178000,
  },
  {
    username: "eccentric_training",
    displayName: "Eccentric Training Lab",
    profileUrl: "https://www.instagram.com/eccentric_training/",
    verified: true,
    credibility: "trainer",
    sport: "football",
    followers: 95000,
  },
  {
    username: "decel_science",
    displayName: "Deceleration Science",
    profileUrl: "https://www.instagram.com/decel_science/",
    verified: true,
    credibility: "trainer",
    sport: "football",
    followers: 142000,
  },
  {
    username: "acceleration_pro",
    displayName: "Acceleration Pro",
    profileUrl: "https://www.instagram.com/acceleration_pro/",
    verified: true,
    credibility: "trainer",
    sport: "track",
    followers: 267000,
  },
  {
    username: "fast_twitch_lab",
    displayName: "Fast Twitch Lab",
    profileUrl: "https://www.instagram.com/fast_twitch_lab/",
    verified: true,
    credibility: "trainer",
    sport: "multi-sport",
    followers: 189000,
  },
  {
    username: "isometric_strength",
    displayName: "Isometric Strength Lab",
    profileUrl: "https://www.instagram.com/isometric_strength/",
    verified: true,
    credibility: "trainer",
    sport: "multi-sport",
    followers: 112000,
  },
  {
    username: "glute_lab",
    displayName: "Glute Lab Training",
    profileUrl: "https://www.instagram.com/glute_lab/",
    verified: true,
    credibility: "trainer",
    sport: "multi-sport",
    followers: 523000,
  },
  {
    username: "injury_prevention_pro",
    displayName: "Injury Prevention Pro",
    profileUrl: "https://www.instagram.com/injury_prevention_pro/",
    verified: true,
    credibility: "trainer",
    sport: "football",
    followers: 234000,
  },
];

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
    limit: number = 5,
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

    // Generate a unique ID for this embed
    const embedId = `ig-embed-${video.id}-${Date.now()}`;

    return `
      <div class="${containerClass}">
        <div id="${embedId}-loading" class="instagram-embed-loading">
          <div class="instagram-embed-message">
            <i class="pi pi-spin pi-spinner instagram-embed-spinner"></i>
            <span class="instagram-embed-text">Loading video...</span>
          </div>
        </div>
        <div id="${embedId}-error" class="instagram-embed-error">
          <div class="instagram-embed-message instagram-embed-message--error">
            <i class="pi pi-video instagram-embed-error-icon"></i>
            <p class="instagram-embed-text">Video temporarily unavailable</p>
            <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="instagram-embed-link">
              <i class="pi pi-external-link instagram-embed-link-icon"></i>
              Watch on Instagram
            </a>
          </div>
        </div>
        <iframe
          id="${embedId}"
          src="${embedUrl}"
          width="${width}"
          height="${Math.round(width * 1.25)}"
          frameborder="0"
          scrolling="no"
          allowtransparency="true"
          allowfullscreen="true"
          loading="lazy"
          class="instagram-embed-frame"
          onload="
            var loading = document.getElementById('${embedId}-loading');
            if (loading) loading.classList.add('is-hidden');
          "
          onerror="
            var loading = document.getElementById('${embedId}-loading');
            var error = document.getElementById('${embedId}-error');
            if (loading) loading.classList.add('is-hidden');
            if (error) error.classList.add('is-visible');
          "
        ></iframe>
      </div>
      <script>
        (function() {
          // Set a timeout to show error state if iframe doesn't load
          var timeout = setTimeout(function() {
            var iframe = document.getElementById('${embedId}');
            var loading = document.getElementById('${embedId}-loading');
            var error = document.getElementById('${embedId}-error');
            if (loading && !loading.classList.contains('is-hidden')) {
              if (loading) loading.classList.add('is-hidden');
              if (error) error.classList.add('is-visible');
            }
          }, 15000); // 15 second timeout
          
          // Clear timeout if iframe loads successfully
          var iframe = document.getElementById('${embedId}');
          if (iframe) {
            iframe.addEventListener('load', function() {
              clearTimeout(timeout);
            });
          }
        })();
      </script>
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
