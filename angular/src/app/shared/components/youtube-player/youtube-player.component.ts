import {
  Component,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
  ElementRef,
  viewChild,
  inject,
  effect,
  DestroyRef,
  input,
  output,
  afterNextRender,
  Injector,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";
import { timer, Subscription } from "rxjs";
import { formatTimeMMSS } from "../../utils/format.utils";

// YouTube IFrame Player API Type Definitions
interface YTPlayerVars {
  autoplay?: 0 | 1;
  controls?: 0 | 1;
  start?: number;
  end?: number;
  [key: string]: string | number | undefined;
}

interface YTEvent {
  target: YTPlayer;
  data: number;
}

interface YTPlayer {
  loadVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  setVolume(volume: number): void;
  getDuration(): number;
  getCurrentTime(): number;
  destroy(): void;
}

interface YTPlayerConstructor {
  new (
    element: HTMLElement,
    options: {
      videoId: string;
      width: number;
      height: number;
      playerVars: YTPlayerVars;
      events: {
        onReady: (event: YTEvent) => void;
        onStateChange: (event: YTEvent) => void;
        onError: (event: YTEvent) => void;
      };
    },
  ): YTPlayer;
}

interface YouTubeIFrameAPI {
  Player: YTPlayerConstructor;
}

declare const YT: YouTubeIFrameAPI;

interface WindowWithYouTubeAPI {
  onYouTubeIframeAPIReady?: () => void;
  YT?: YouTubeIFrameAPI;
}

/**
 * Angular 21 YouTube Player Component
 * Wrapper around YouTube IFrame API for Angular 21
 */
@Component({
  selector: "app-youtube-player",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, ButtonComponent, IconButtonComponent],
  template: `
    <div class="youtube-player-container">
      @if (loading()) {
        <div class="loading-state">
          <i class="pi pi-spin pi-spinner"></i>
          <span>Loading video...</span>
        </div>
      }

      <div
        #youtubeContainer
        class="youtube-container"
        [style.width.px]="width()"
        [style.height.px]="height()"
      ></div>

      @if (showControls()) {
        <div class="player-controls">
          <app-button
            [disabled]="!playerReady()"
            (clicked)="togglePlay()"
          ></app-button>
          <app-button
            iconLeft="pi-stop"
            [disabled]="!playerReady()"
            (clicked)="stop()"
            >Stop</app-button
          >
          <app-icon-button
            icon="pi-volume-up"
            [disabled]="!playerReady()"
            (clicked)="toggleMute()"
            ariaLabel="volume-up"
          />
        </div>
      }

      @if (showInfo()) {
        <div class="player-info">
          <div class="info-item">
            <span class="info-label">Duration:</span>
            <span class="info-value">{{ formatTime(duration()) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Current Time:</span>
            <span class="info-value">{{ formatTime(currentTime()) }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: "./youtube-player.component.scss",
})
export class YoutubePlayerComponent implements OnDestroy {
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  // Angular 21: Use input() signal instead of @Input() with signal assignment
  videoId = input.required<string>();
  width = input<number>(640);
  height = input<number>(360);
  autoplay = input<boolean>(false);
  showControls = input<boolean>(true);
  showInfo = input<boolean>(false);
  startSeconds = input<number>(0);
  endSeconds = input<number>(0);
  volume = input<number>(50);

  // Angular 21: Use output() signal (already correct, just removed @Output() decorator)
  ready = output<void>();
  stateChange = output<string>();
  error = output<string>();

  // Angular 21: Use viewChild() signal instead of @ViewChild()
  youtubeContainer = viewChild.required<ElementRef<HTMLDivElement>>("youtubeContainer");

  private youtubeApiLoaded = signal<boolean>(false);
  playerReady = signal<boolean>(false);
  loading = signal<boolean>(true);
  isPlaying = signal<boolean>(false);
  duration = signal<number>(0);
  currentTime = signal<number>(0);

  private player: YTPlayer | null = null;
  private timeTrackingSubscription: Subscription | null = null;

  constructor() {
    // Angular 21: Use afterNextRender for DOM-dependent initialization
    // This ensures the DOM is ready before accessing document APIs
    afterNextRender(
      () => {
        this.loadYoutubeApi();
      },
      { injector: this.injector },
    );

    // Watch for videoId changes and reload player
    effect(() => {
      const id = this.videoId();
      if (id && this.youtubeApiLoaded()) {
        this.loadVideo(id);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.timeTrackingSubscription) {
      this.timeTrackingSubscription.unsubscribe();
    }
    if (this.player) {
      try {
        this.player.destroy();
      } catch (_e) {
        // Ignore errors during cleanup
      }
    }
  }

  private loadYoutubeApi(): void {
    if (this.youtubeApiLoaded()) {
      return;
    }

    // Check if API is already loaded
    const win = window as unknown as WindowWithYouTubeAPI;
    if (typeof YT !== "undefined" && YT.Player) {
      this.youtubeApiLoaded.set(true);
      this.initializePlayer();
      return;
    }

    // Load the IFrame Player API
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Set up callback
    win.onYouTubeIframeAPIReady = () => {
      this.youtubeApiLoaded.set(true);
      this.initializePlayer();
    };
  }

  private initializePlayer(): void {
    const container = this.youtubeContainer();
    if (!container || !this.youtubeApiLoaded()) {
      return;
    }

    const videoId = this.videoId();
    if (!videoId) {
      return;
    }

    this.loading.set(true);

    const playerVars: YTPlayerVars = {
      autoplay: this.autoplay() ? 1 : 0,
      controls: this.showControls() ? 1 : 0,
      start: this.startSeconds(),
    };

    if (this.endSeconds() > 0) {
      playerVars.end = this.endSeconds();
    }

    this.player = new YT.Player(container.nativeElement, {
      videoId: videoId,
      width: this.width(),
      height: this.height(),
      playerVars: playerVars,
      events: {
        onReady: (event: YTEvent) => {
          this.onPlayerReady(event);
        },
        onStateChange: (event: YTEvent) => {
          this.onPlayerStateChange(event);
        },
        onError: (event: YTEvent) => {
          this.onPlayerError(event);
        },
      },
    });
  }

  private loadVideo(videoId: string): void {
    if (this.player && this.youtubeApiLoaded()) {
      this.loading.set(true);
      this.player.loadVideoById(videoId);
    } else {
      // videoId is an input signal, can't be set directly - just initialize player
      this.initializePlayer();
    }
  }

  private onPlayerReady(_event: YTEvent): void {
    this.playerReady.set(true);
    this.loading.set(false);
    if (this.player) {
      this.duration.set(this.player.getDuration());
      this.player.setVolume(this.volume());
    }

    // Start tracking current time
    this.startTimeTracking();

    this.ready.emit();
  }

  private onPlayerStateChange(event: YTEvent): void {
    const states = [
      "UNSTARTED",
      "ENDED",
      "PLAYING",
      "PAUSED",
      "BUFFERING",
      "CUED",
    ];
    const state = states[event.data] || "UNKNOWN";
    this.stateChange.emit(state);

    this.isPlaying.set(state === "PLAYING");
  }

  private onPlayerError(event: YTEvent): void {
    const errors: Record<number, string> = {
      2: "Invalid video ID",
      5: "HTML5 player error",
      100: "Video not found",
      101: "Video not allowed",
      150: "Video not allowed",
    };
    const errorMsg = errors[event.data] || "Unknown error";
    this.error.emit(errorMsg);
    this.loading.set(false);
  }

  private startTimeTracking(): void {
    if (this.timeTrackingSubscription) {
      this.timeTrackingSubscription.unsubscribe();
    }

    this.timeTrackingSubscription = timer(0, 1000).subscribe(() => {
      if (this.player && this.playerReady()) {
        try {
          const current = this.player.getCurrentTime();
          this.currentTime.set(Math.floor(current));
        } catch (_e) {
          // Ignore errors
        }
      }
    });
  }

  togglePlay(): void {
    if (!this.player || !this.playerReady()) {
      return;
    }

    if (this.isPlaying()) {
      this.player.pauseVideo();
    } else {
      this.player.playVideo();
    }
  }

  stop(): void {
    if (this.player && this.playerReady()) {
      this.player.stopVideo();
    }
  }

  toggleMute(): void {
    if (this.player && this.playerReady()) {
      if (this.player.isMuted()) {
        this.player.unMute();
      } else {
        this.player.mute();
      }
    }
  }

  formatTime = formatTimeMMSS;
}
