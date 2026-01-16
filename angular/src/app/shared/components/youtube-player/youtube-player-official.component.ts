import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  input,
  ChangeDetectionStrategy,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { YouTubePlayerModule } from "@angular/youtube-player";
import { Card } from "primeng/card";
import { ButtonComponent } from "../button/button.component";
import { LoggerService } from "../../../core/services/logger.service";

/**
 * Angular 21 Official YouTube Player Component
 * Uses @angular/youtube-player package (Angular 21 native)
 */
@Component({
  selector: "app-youtube-player-official",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, YouTubePlayerModule, Card, ButtonComponent],
  template: `
    <div class="youtube-player-container">
      @if (videoId()) {
        <youtube-player
          [videoId]="videoId()"
          [width]="width()"
          [height]="height()"
          [startSeconds]="startSeconds()"
          [endSeconds]="endSeconds()"
          [suggestedQuality]="'highres'"
          (ready)="onPlayerReady()"
          (stateChange)="onStateChange($event)"
          (error)="onError($event)"
        />
      }

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
        </div>
      }

      @if (showInfo()) {
        <div class="player-info">
          <div class="info-item">
            <span class="info-label">Video ID:</span>
            <span class="info-value">{{ videoId() }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Status:</span>
            <span class="info-value">{{ playerState() }}</span>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: "./youtube-player-official.component.scss",
})
export class YoutubePlayerOfficialComponent implements OnInit, OnDestroy {
  // Angular 21: Use input() signal instead of @Input() with signal assignment
  videoId = input.required<string>();
  width = input<number>(640);
  height = input<number>(360);
  private logger = inject(LoggerService);
  startSeconds = input<number>(0);
  endSeconds = input<number>(0);
  showControls = input<boolean>(true);
  showInfo = input<boolean>(false);

  playerReady = signal<boolean>(false);
  isPlaying = signal<boolean>(false);
  playerState = signal<string>("UNSTARTED");

  ngOnInit(): void {
    // Load YouTube IFrame API script if not already loaded
    this.loadYouTubeScript();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private loadYouTubeScript(): void {
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      return; // Script already loaded
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
  }

  onPlayerReady(): void {
    this.playerReady.set(true);
  }

  onStateChange(event: YT.OnStateChangeEvent): void {
    const states = [
      "UNSTARTED",
      "ENDED",
      "PLAYING",
      "PAUSED",
      "BUFFERING",
      "CUED",
    ];
    const state = states[event.data] || "UNKNOWN";
    this.playerState.set(state);
    this.isPlaying.set(state === "PLAYING");
  }

  onError(event: YT.OnErrorEvent): void {
    this.logger.error("YouTube Player Error:", event);
    this.playerState.set("ERROR");
  }

  togglePlay(): void {
    // Note: The official YouTube player component handles play/pause internally
    // This is just for UI feedback
    this.isPlaying.update((playing) => !playing);
  }

  stop(): void {
    this.isPlaying.set(false);
    this.playerState.set("STOPPED");
  }
}
