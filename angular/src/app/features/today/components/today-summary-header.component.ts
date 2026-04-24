import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import {
  buildYouTubeEmbedUrl,
  buildYouTubeWatchUrl,
} from "../../../shared/utils/youtube-video.utils";
import type {
  ExactTrainingSummary,
  ExactTrainingVideoItem,
  TodayReadinessDisplay,
} from "../today-protocol.facade";

@Component({
  selector: "app-today-summary-header",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, CardShellComponent],
  templateUrl: "./today-summary-header.component.html",
  styleUrl: "./today-summary-header.component.scss",
})
export class TodaySummaryHeaderComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly todayDateLabel = input.required<string>();
  readonly readinessDisplay = input.required<TodayReadinessDisplay>();
  readonly exactTrainingSummary = input<ExactTrainingSummary | null>(null);
  readonly selectedVideoId = signal<string | null>(null);

  readonly logSession = output<void>();
  readonly startExactPlan = output<void>();

  constructor() {
    effect(() => {
      const videos = this.exactTrainingSummary()?.featuredVideos ?? [];
      const nextSelectedVideoId = videos[0]?.videoId ?? null;
      const currentSelectedVideoId = untracked(() => this.selectedVideoId());

      if (videos.length === 0) {
        if (currentSelectedVideoId !== null) {
          this.selectedVideoId.set(null);
        }
        return;
      }

      if (
        !currentSelectedVideoId ||
        !videos.some((video) => video.videoId === currentSelectedVideoId)
      ) {
        this.selectedVideoId.set(nextSelectedVideoId);
      }
    });
  }

  readonly selectedVideo = computed<ExactTrainingVideoItem | null>(() => {
    const videos = this.exactTrainingSummary()?.featuredVideos ?? [];
    const selectedVideoId = this.selectedVideoId();

    return (
      videos.find((video) => video.videoId === selectedVideoId) ?? videos[0] ?? null
    );
  });

  readonly featuredVideoEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const videoId = this.selectedVideo()?.videoId;
    const embedUrl = buildYouTubeEmbedUrl(videoId);
    return embedUrl
      ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl)
      : null;
  });

  readonly featuredVideoWatchUrl = computed(() => {
    const videoId = this.selectedVideo()?.videoId;
    return buildYouTubeWatchUrl(videoId);
  });

  selectVideo(videoId: string): void {
    this.selectedVideoId.set(videoId);
  }
}
