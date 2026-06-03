import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
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

/**
 * Reusable YouTube session/exercise video. Uses the IFrame Player API (no API
 * key, no quota) — just a `videoId`. Shows the poster + a play button; on tap it
 * lazily loads the player and autoplays. When no videoId is assigned it shows the
 * poster with a "video coming" hint (honest, never a dead button). Styling reuses
 * the locked `.video` vocabulary.
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
        @if (poster()) { <img [src]="poster()" alt="" /> }
        <button class="play" type="button" [disabled]="!videoId()"
                [attr.aria-label]="videoId() ? 'Play ' + title() : 'No video yet'"
                (click)="play()">
          <lucide-icon name="play" />
        </button>
        <span class="vtitle">{{ videoId() ? title() : "Video coming from your coach" }}</span>
        @if (duration() && videoId()) { <span class="duration">{{ duration() }}</span> }
      </div>
    }
  `,
  styles: [`:host { display: block; } .yt-host { position: absolute; inset: 0; width: 100%; height: 100%; }`],
})
export class YtVideoComponent {
  readonly videoId = input<string | null>(null);
  readonly poster = input<string>("");
  readonly title = input<string>("Watch the session");
  readonly duration = input<string>("");

  readonly playing = signal(false);
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

  play(): void {
    if (this.videoId()) this.playing.set(true);
  }

  private async create(el: HTMLElement, videoId: string): Promise<void> {
    try {
      const YT = (await loadYouTubeIframeApi()) as YtCtor;
      this.player = new YT.Player(el, {
        videoId,
        playerVars: { playsinline: 1, autoplay: 1, rel: 0, modestbranding: 1 },
      });
    } catch {
      this.playing.set(false); // SSR or load failure → fall back to the poster
    }
  }
}
