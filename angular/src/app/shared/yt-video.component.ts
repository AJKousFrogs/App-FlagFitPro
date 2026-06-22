import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";

import { loadYouTubeIframeApi } from "./youtube-iframe-api";

interface YtPlayer {
  destroy(): void;
}
interface YtCtor {
  Player: new (el: HTMLElement, opts: unknown) => YtPlayer;
}

/** Local placeholder shown whenever the (external) poster can't load. */
const LOCAL_POSTER = "assets/images/rebuild/video-session.jpg";
/** Cap the IFrame-API load so a slow/blocked YouTube (504) can't hang the tile. */
const API_LOAD_TIMEOUT_MS = 8000;

/**
 * Reusable YouTube session/exercise video. Uses the IFrame Player API (no API
 * key, no quota) — just a `videoId`. Shows the poster + a play button; on tap it
 * lazily loads the player and autoplays.
 *
 * Resilience (the app must stay usable when YouTube is slow/blocked — 504s on
 * iframe_api / hqdefault.jpg break the embed but must NOT hide the exercise):
 *  - the poster falls back to a bundled local image if its src errors,
 *  - the IFrame-API load is time-boxed; on timeout/failure we drop back to the
 *    poster and surface an "Open on YouTube" link so the video is still reachable.
 * The exercise's how-to TEXT is rendered by the parent regardless, so the athlete
 * always knows the movement even if no video loads at all.
 */
@Component({
  selector: "app-yt-video",
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (playing()) {
      <div class="video"><div #host class="yt-host"></div></div>
    } @else {
      <div class="video">
        <img [src]="posterSrc()" alt="" (error)="onPosterError()" />
        <button class="play" type="button" [disabled]="!videoId()"
                [attr.aria-label]="videoId() ? 'Play ' + title() : 'No video yet'"
                (click)="play()">
          <lucide-icon name="play" />
        </button>
        <span class="vtitle">{{ videoId() ? title() : "Video coming from your coach" }}</span>
        @if (duration() && videoId()) { <span class="duration">{{ duration() }}</span> }
      </div>
      @if (loadFailed() && videoId()) {
        <a class="yt-fallback" [href]="watchUrl()" target="_blank" rel="noopener">
          <lucide-icon name="arrow-up-right" /> Couldn't load the player — open on YouTube
        </a>
      }
    }
  `,
  styles: [
    `
      :host { display: block; }
      .yt-host { position: absolute; inset: 0; width: 100%; height: 100%; }
      .yt-fallback { display: inline-flex; align-items: center; gap: 6px; margin-top: var(--s-2);
        font-size: var(--fs-sm); color: var(--accent); }
      .yt-fallback svg.lucide { width: 14px; height: 14px; }
    `,
  ],
})
export class YtVideoComponent {
  readonly videoId = input<string | null>(null);
  readonly poster = input<string>("");
  readonly title = input<string>("Watch the session");
  readonly duration = input<string>("");

  readonly playing = signal(false);
  readonly loadFailed = signal(false);
  private readonly posterBroken = signal(false);

  /** Poster src that degrades to the bundled image once the external one errors. */
  readonly posterSrc = computed(() =>
    this.posterBroken() ? LOCAL_POSTER : this.poster() || LOCAL_POSTER,
  );
  readonly watchUrl = computed(() =>
    this.videoId() ? `https://www.youtube.com/watch?v=${this.videoId()}` : "",
  );

  private readonly host = viewChild<ElementRef<HTMLDivElement>>("host");
  private player: YtPlayer | null = null;

  constructor() {
    effect(() => {
      const el = this.host()?.nativeElement;
      if (this.playing() && el && !this.player && this.videoId()) {
        void this.create(el, this.videoId()!);
      }
    });
  }

  onPosterError(): void {
    this.posterBroken.set(true);
  }

  play(): void {
    if (this.videoId()) {
      this.loadFailed.set(false);
      this.playing.set(true);
    }
  }

  private async create(el: HTMLElement, videoId: string): Promise<void> {
    try {
      // Time-box the API load: a blocked/slow YouTube (504) otherwise hangs here.
      const YT = (await Promise.race([
        loadYouTubeIframeApi(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("yt_api_timeout")), API_LOAD_TIMEOUT_MS),
        ),
      ])) as YtCtor;
      this.player = new YT.Player(el, {
        videoId,
        playerVars: { playsinline: 1, autoplay: 1, rel: 0, modestbranding: 1 },
      });
    } catch {
      // SSR, timeout, or load failure → back to the poster + an "open on YouTube" link.
      this.playing.set(false);
      this.loadFailed.set(true);
    }
  }
}
