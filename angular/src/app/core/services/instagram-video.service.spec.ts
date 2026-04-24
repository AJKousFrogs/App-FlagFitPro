 
import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { InstagramVideoService } from "./instagram-video.service";
import { LoggerService } from "./logger.service";

describe("InstagramVideoService", () => {
  let service: InstagramVideoService;

  const mockLoggerService = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        InstagramVideoService,
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(InstagramVideoService);
  });

  describe("initialization", () => {
    it("should be created", () => {
      expect(service).toBeTruthy();
    });

    it("should have curated videos loaded", () => {
      expect(service.totalVideos()).toBeGreaterThan(0);
    });

    it("should have featured creators loaded", () => {
      const creators = service.getFeaturedCreators();
      expect(creators.length).toBeGreaterThan(0);
    });
  });

  describe("getAllVideos", () => {
    it("should return all curated videos", () => {
      const videos = service.getAllVideos();
      expect(videos.length).toBeGreaterThan(0);
      expect(videos[0].id).toBeDefined();
      expect(videos[0].title).toBeDefined();
    });
  });

  describe("getVideoById", () => {
    it("should return video when ID exists", () => {
      const video = service.getVideoById("ig_real_001");
      expect(video).toBeDefined();
      expect(video?.title).toContain("Quick Release");
    });

    it("should return undefined for non-existent ID", () => {
      const video = service.getVideoById("non_existent_id");
      expect(video).toBeUndefined();
    });
  });

  describe("filterVideos", () => {
    it("should filter by position", () => {
      const qbVideos = service.filterVideos({ positions: ["QB"] });
      expect(qbVideos.length).toBeGreaterThan(0);
      qbVideos.forEach((video) => {
        expect(
          video.positions.includes("QB") || video.positions.includes("All"),
        ).toBe(true);
      });
    });

    it("should filter by training focus", () => {
      const speedVideos = service.filterVideos({ focus: ["speed"] });
      expect(speedVideos.length).toBeGreaterThan(0);
      speedVideos.forEach((video) => {
        expect(video.trainingFocus).toContain("speed");
      });
    });

    it("should filter by skill level", () => {
      const beginnerVideos = service.filterVideos({ skillLevel: "beginner" });
      beginnerVideos.forEach((video) => {
        expect(["beginner", "all"]).toContain(video.skillLevel);
      });
    });

    it("should filter by minimum rating", () => {
      const highRatedVideos = service.filterVideos({ minRating: 4.7 });
      highRatedVideos.forEach((video) => {
        expect(video.rating).toBeGreaterThanOrEqual(4.7);
      });
    });

    it("should combine multiple filters", () => {
      const filtered = service.filterVideos({
        positions: ["WR"],
        focus: ["route_running"],
      });
      filtered.forEach((video) => {
        expect(
          video.positions.includes("WR") || video.positions.includes("All"),
        ).toBe(true);
        expect(video.trainingFocus).toContain("route_running");
      });
    });
  });

  describe("getVideosForPosition", () => {
    it("should return videos for QB position", () => {
      const videos = service.getVideosForPosition("QB");
      expect(videos.length).toBeGreaterThan(0);
    });

    it("should return videos for WR position", () => {
      const videos = service.getVideosForPosition("WR");
      expect(videos.length).toBeGreaterThan(0);
    });

    it("should return videos for DB position", () => {
      const videos = service.getVideosForPosition("DB");
      expect(videos.length).toBeGreaterThan(0);
    });
  });

  describe("getVideosForFocus", () => {
    it("should return videos for speed focus", () => {
      const videos = service.getVideosForFocus("speed");
      expect(videos.length).toBeGreaterThan(0);
    });

    it("should return videos for mobility focus", () => {
      const videos = service.getVideosForFocus("mobility");
      expect(videos.length).toBeGreaterThan(0);
    });
  });

  describe("getRecommendedVideos", () => {
    it("should return recommended videos based on profile", () => {
      const recommended = service.getRecommendedVideos(
        "QB",
        "in_season",
        "intermediate",
        3,
      );
      expect(recommended.length).toBeLessThanOrEqual(3);
    });

    it("should return videos sorted by rating", () => {
      const recommended = service.getRecommendedVideos("All", "all", "all", 10);
      for (let i = 1; i < recommended.length; i++) {
        expect(recommended[i - 1].rating).toBeGreaterThanOrEqual(
          recommended[i].rating,
        );
      }
    });
  });

  describe("getTodaysFeaturedVideo", () => {
    it("should return a video", () => {
      const featured = service.getTodaysFeaturedVideo();
      expect(featured).toBeDefined();
    });

    it("should return position-specific video when position provided", () => {
      const featured = service.getTodaysFeaturedVideo("QB");
      if (featured) {
        expect(
          featured.positions.includes("QB") ||
            featured.positions.includes("All"),
        ).toBe(true);
      }
    });
  });

  describe("extractShortcode", () => {
    it("should extract shortcode from reel URL", () => {
      const shortcode = service.extractShortcode(
        "https://www.instagram.com/reel/ABC123xyz/",
      );
      expect(shortcode).toBe("ABC123xyz");
    });

    it("should extract shortcode from post URL", () => {
      const shortcode = service.extractShortcode(
        "https://www.instagram.com/p/DEF456abc/",
      );
      expect(shortcode).toBe("DEF456abc");
    });

    it("should extract shortcode from TV URL", () => {
      const shortcode = service.extractShortcode(
        "https://www.instagram.com/tv/GHI789def/",
      );
      expect(shortcode).toBe("GHI789def");
    });

    it("should return null for invalid URL", () => {
      const shortcode = service.extractShortcode("https://example.com/video");
      expect(shortcode).toBeNull();
    });
  });

  describe("buildInstagramUrl", () => {
    it("should build reel URL", () => {
      const url = service.buildInstagramUrl("ABC123", "reel");
      expect(url).toBe("https://www.instagram.com/reel/ABC123/");
    });

    it("should build post URL", () => {
      const url = service.buildInstagramUrl("ABC123", "post");
      expect(url).toBe("https://www.instagram.com/p/ABC123/");
    });
  });

  describe("generateEmbedHtml", () => {
    it("should generate embed HTML with default options", () => {
      const video = service.getVideoById("ig_real_001");
      if (video) {
        const html = service.generateEmbedHtml(video);
        expect(html).toContain("iframe");
        expect(html).toContain(video.embedUrl);
        expect(html).not.toContain("onload=");
        expect(html).not.toContain("onerror=");
        expect(html).not.toContain("<script>");
      }
    });

    it("should include captioned parameter when enabled", () => {
      const video = service.getVideoById("ig_real_001");
      if (video) {
        const html = service.generateEmbedHtml(video, { captioned: true });
        expect(html).toContain("captioned=true");
      }
    });

    it("should respect custom width", () => {
      const video = service.getVideoById("ig_real_001");
      if (video) {
        const html = service.generateEmbedHtml(video, { width: 500 });
        expect(html).toContain('width="500"');
      }
    });
  });

  describe("creator management", () => {
    it("should get all featured creators", () => {
      const creators = service.getFeaturedCreators();
      expect(creators.length).toBeGreaterThan(0);
    });

    it("should get creator by username", () => {
      const creator = service.getCreatorByUsername("qb_mechanics");
      expect(creator).toBeDefined();
      expect(creator?.displayName).toBe("QB Mechanics Lab");
    });

    it("should return undefined for non-existent creator", () => {
      const creator = service.getCreatorByUsername("non_existent");
      expect(creator).toBeUndefined();
    });

    it("should get videos by creator", () => {
      // Use a creator that exists in the actual video data
      const allVideos = service.getAllVideos();
      const firstVideoCreator = allVideos[0].creator.username;
      const videos = service.getVideosByCreator(firstVideoCreator);
      expect(videos.length).toBeGreaterThan(0);
      videos.forEach((video) => {
        expect(video.creator.username).toBe(firstVideoCreator);
      });
    });
  });

  describe("playlist management", () => {
    it("should create custom playlist", () => {
      const playlist = service.createPlaylist("My Playlist", "Test playlist", [
        "ig_real_001",
        "ig_real_003",
      ]);
      expect(playlist.name).toBe("My Playlist");
      expect(playlist.videos.length).toBe(2);
    });

    it("should get position playlist", () => {
      const playlist = service.getPositionPlaylist("QB");
      expect(playlist.name).toContain("QB");
      expect(playlist.videos.length).toBeGreaterThan(0);
    });

    it("should get focus playlist", () => {
      const playlist = service.getFocusPlaylist("speed");
      expect(playlist.name).toContain("Speed");
      expect(playlist.videos.length).toBeGreaterThan(0);
    });
  });

  describe("selection state", () => {
    it("should select video", () => {
      const video = service.getVideoById("ig_real_001");
      service.selectVideo(video!);
      expect(service.selectedVideo()).toBe(video);
    });

    it("should select video by ID", () => {
      const result = service.selectVideoById("ig_real_001");
      expect(result).toBe(true);
      expect(service.selectedVideo()?.id).toBe("ig_real_001");
    });

    it("should return false for non-existent ID", () => {
      const result = service.selectVideoById("non_existent");
      expect(result).toBe(false);
    });

    it("should clear selection", () => {
      service.selectVideoById("ig_real_001");
      service.selectVideo(null);
      expect(service.selectedVideo()).toBeNull();
    });
  });

  describe("statistics", () => {
    it("should return statistics object", () => {
      const stats = service.getStatistics();
      expect(stats.totalVideos).toBeGreaterThan(0);
      expect(stats.totalCreators).toBeGreaterThan(0);
      expect(stats.averageRating).toBeGreaterThan(0);
    });

    it("should have position breakdown", () => {
      const stats = service.getStatistics();
      expect(Object.keys(stats.byPosition).length).toBeGreaterThan(0);
    });

    it("should have focus breakdown", () => {
      const stats = service.getStatistics();
      expect(Object.keys(stats.byFocus).length).toBeGreaterThan(0);
    });
  });

  describe("search", () => {
    it("should search by title", () => {
      const results = service.searchVideos("footwork");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should search by tag", () => {
      const results = service.searchVideos("acceleration");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should search by creator", () => {
      // Use a creator that exists in the actual video data
      const allVideos = service.getAllVideos();
      const firstVideoCreator = allVideos[0].creator.username;
      const results = service.searchVideos(firstVideoCreator);
      expect(results.length).toBeGreaterThan(0);
    });

    it("should return empty array for no matches", () => {
      const results = service.searchVideos("xyznonexistent123");
      expect(results.length).toBe(0);
    });
  });

  describe("computed signals", () => {
    it("should compute total videos", () => {
      expect(service.totalVideos()).toBeGreaterThan(0);
    });

    it("should compute reels only", () => {
      const reels = service.reelsOnly();
      reels.forEach((video) => {
        expect(video.isReel).toBe(true);
      });
    });

    it("should compute verified creators", () => {
      const verified = service.verifiedCreators();
      verified.forEach((creator) => {
        expect(creator.verified).toBe(true);
      });
    });

    it("should compute videos by position", () => {
      const byPosition = service.videosByPosition();
      expect(byPosition.size).toBeGreaterThan(0);
    });

    it("should compute videos by focus", () => {
      const byFocus = service.videosByFocus();
      expect(byFocus.size).toBeGreaterThan(0);
    });
  });
});
