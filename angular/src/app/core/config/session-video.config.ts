/**
 * Last-resort fallback for the Today session-video card. The card is fed by the
 * real library: TodayComponent reads TrainingVideoService.forIntent(rx.intent),
 * which resolves a YouTube ID from public.training_videos (global + team-scoped),
 * mapped category-per-intent. The seeded global library covers every intent
 * category, so a real, relevant video is shown in practice.
 *
 * This constant only surfaces if the library genuinely fails to load (or is
 * emptied). It is deliberately `null` — per the data-source contract we never
 * show an unrelated demo clip as if it were the athlete's session; the player
 * renders an honest "video coming from your coach" poster instead.
 */
export const SESSION_VIDEO_ID: string | null = null;
