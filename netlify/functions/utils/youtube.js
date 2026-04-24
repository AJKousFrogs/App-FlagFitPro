const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;

const CURATED_DRILL_VIDEO_IDS = {
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

function normalizeDrillName(name) {
  if (!name || typeof name !== "string") {
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

export function resolveCuratedDrillVideoId(exerciseName) {
  const normalized = normalizeDrillName(exerciseName);
  if (!normalized) {
    return null;
  }

  return CURATED_DRILL_VIDEO_IDS[normalized] || null;
}

export function extractYouTubeVideoId(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  const match = url.match(YOUTUBE_ID_PATTERN);
  return match ? match[1] : null;
}

export function buildYouTubeWatchUrl(videoId) {
  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function buildYouTubeThumbnailUrl(videoId) {
  if (!videoId) {
    return null;
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function resolveYouTubeVideoMetadata({
  videoId = null,
  videoUrl = null,
  thumbnailUrl = null,
  exerciseName = null,
} = {}) {
  const resolvedVideoId =
    videoId || extractYouTubeVideoId(videoUrl) || resolveCuratedDrillVideoId(exerciseName);
  const resolvedVideoUrl = videoUrl || buildYouTubeWatchUrl(resolvedVideoId);
  const resolvedThumbnailUrl =
    thumbnailUrl || buildYouTubeThumbnailUrl(resolvedVideoId);

  return {
    videoId: resolvedVideoId,
    videoUrl: resolvedVideoUrl,
    thumbnailUrl: resolvedThumbnailUrl,
  };
}
