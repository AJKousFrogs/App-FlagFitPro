const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;

export interface YouTubeVideoMetadataInput {
  videoId?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  exerciseName?: string | null;
}

export interface YouTubeVideoMetadata {
  videoId: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
}

const CURATED_DRILL_VIDEO_IDS: Record<string, string> = {
  "morning mobility": "IWNnTJFwi3s",
  "morning mobility day 1": "IWNnTJFwi3s",
  "morning mobility day 2": "IWNnTJFwi3s",
  "morning mobility day 3": "IWNnTJFwi3s",
  "morning mobility day 4": "IWNnTJFwi3s",
  "morning mobility day 5": "IWNnTJFwi3s",
  "morning mobility day 6": "IWNnTJFwi3s",
  "morning mobility day 7": "IWNnTJFwi3s",
  "hip flow": "IWNnTJFwi3s",
  "hip mobility flow": "IWNnTJFwi3s",
};

function normalizeDrillName(name?: string | null): string | null {
  if (!name) {
    return null;
  }

  const normalized = name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  return normalized || null;
}

export function resolveCuratedDrillVideoId(
  exerciseName?: string | null,
): string | null {
  const normalized = normalizeDrillName(exerciseName);
  if (!normalized) {
    return null;
  }

  return CURATED_DRILL_VIDEO_IDS[normalized] ?? null;
}

export function extractYouTubeVideoId(
  videoUrl?: string | null,
): string | null {
  if (!videoUrl) {
    return null;
  }

  const match = videoUrl.match(YOUTUBE_ID_PATTERN);
  return match ? match[1] : null;
}

export function buildYouTubeWatchUrl(
  videoId?: string | null,
): string | null {
  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function buildYouTubeEmbedUrl(
  videoId?: string | null,
): string | null {
  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

export function buildYouTubeThumbnailUrl(
  videoId?: string | null,
): string | null {
  if (!videoId) {
    return null;
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function resolveYouTubeVideoMetadata(
  input: YouTubeVideoMetadataInput,
): YouTubeVideoMetadata {
  const videoId =
    input.videoId ||
    extractYouTubeVideoId(input.videoUrl) ||
    resolveCuratedDrillVideoId(input.exerciseName);
  const videoUrl = input.videoUrl || buildYouTubeWatchUrl(videoId);
  const thumbnailUrl = input.thumbnailUrl || buildYouTubeThumbnailUrl(videoId);

  return {
    videoId,
    videoUrl,
    thumbnailUrl,
  };
}
