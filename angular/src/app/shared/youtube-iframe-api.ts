/**
 * Loads the YouTube IFrame Player API once and resolves when `window.YT` is ready.
 * No API key, no quota — playback only. SSR-safe (no-op on the server).
 * https://developers.google.com/youtube/iframe_api_reference
 */
type YT = unknown;
let ready: Promise<YT> | null = null;

export function loadYouTubeIframeApi(): Promise<YT> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window (SSR)"));
  const w = window as unknown as { YT?: { Player?: unknown }; onYouTubeIframeAPIReady?: () => void };
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (ready) return ready;

  ready = new Promise<YT>((resolve) => {
    // The API invokes this global when the script finishes loading.
    w.onYouTubeIframeAPIReady = () => resolve(w.YT as YT);
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ready;
}
