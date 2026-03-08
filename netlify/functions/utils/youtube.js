const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;

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
} = {}) {
  const resolvedVideoId = videoId || extractYouTubeVideoId(videoUrl);
  const resolvedVideoUrl = videoUrl || buildYouTubeWatchUrl(resolvedVideoId);
  const resolvedThumbnailUrl =
    thumbnailUrl || buildYouTubeThumbnailUrl(resolvedVideoId);

  return {
    videoId: resolvedVideoId,
    videoUrl: resolvedVideoUrl,
    thumbnailUrl: resolvedThumbnailUrl,
  };
}
