/**
 * Session video source. Playback uses the YouTube IFrame Player API — only a
 * video ID is needed (no API key, no quota).
 *
 * TODO (content): replace this placeholder with the club's real videos. The
 * proper model is to assign a YouTube ID per session/exercise (coach-side) and
 * read it from the data (e.g. protocol_exercises.youtube_id). Until that's wired,
 * this constant lets the player work end-to-end; set it to `null` to show the
 * honest "video coming from your coach" poster instead.
 */
export const SESSION_VIDEO_ID: string | null = "M7lc1UVf-VE"; // placeholder demo clip
