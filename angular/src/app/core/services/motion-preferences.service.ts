import { DestroyRef, Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class MotionPreferencesService {
  private static readonly REDUCED_MOTION_QUERY =
    "(prefers-reduced-motion: reduce)";

  watchReducedMotion(
    onChange: (prefersReducedMotion: boolean) => void,
    destroyRef: DestroyRef,
  ): void {
    if (typeof window === "undefined" || !("matchMedia" in window)) {
      return;
    }

    const mediaQuery = window.matchMedia(
      MotionPreferencesService.REDUCED_MOTION_QUERY,
    );
    onChange(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      onChange(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    destroyRef.onDestroy(() =>
      mediaQuery.removeEventListener("change", handleChange),
    );
  }
}
