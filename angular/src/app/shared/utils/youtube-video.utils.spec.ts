import { describe, expect, it } from "vitest";
import {
  resolveCuratedDrillVideoId,
  resolveYouTubeVideoMetadata,
} from "./youtube-video.utils";

describe("youtube-video.utils", () => {
  it("resolves curated drill videos from exact exercise names", () => {
    expect(resolveCuratedDrillVideoId("Morning Mobility - Day 1 (Monday)")).toBe(
      "IWNnTJFwi3s",
    );
    expect(resolveCuratedDrillVideoId("Hip Mobility Flow")).toBe(
      "IWNnTJFwi3s",
    );
  });

  it("uses explicit video metadata before curated drill fallbacks", () => {
    const metadata = resolveYouTubeVideoMetadata({
      exerciseName: "Hip Mobility Flow",
      videoUrl: "https://www.youtube.com/watch?v=abcdefghijk",
    });

    expect(metadata.videoId).toBe("abcdefghijk");
    expect(metadata.videoUrl).toBe(
      "https://www.youtube.com/watch?v=abcdefghijk",
    );
    expect(metadata.thumbnailUrl).toBe(
      "https://img.youtube.com/vi/abcdefghijk/hqdefault.jpg",
    );
  });
});
