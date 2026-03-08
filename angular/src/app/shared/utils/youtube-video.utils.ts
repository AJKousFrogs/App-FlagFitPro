const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;

export interface YouTubeVideoMetadataInput {
  videoId?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
}

export interface YouTubeVideoMetadata {
  videoId: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
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
  const videoId = input.videoId || extractYouTubeVideoId(input.videoUrl);
  const videoUrl = input.videoUrl || buildYouTubeWatchUrl(videoId);
  const thumbnailUrl = input.thumbnailUrl || buildYouTubeThumbnailUrl(videoId);

  return {
    videoId,
    videoUrl,
    thumbnailUrl,
  };
}
