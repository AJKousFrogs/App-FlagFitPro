import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { CountdownTimerComponent } from "../../../shared/components/countdown-timer/countdown-timer.component";
import { PrescribedExercise, formatPrescription } from "../../training/daily-protocol/daily-protocol.models";
import {
  buildYouTubeEmbedUrl,
  resolveYouTubeVideoMetadata,
} from "../../../shared/utils/youtube-video.utils";

@Component({
  selector: "app-today-workout-player",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CountdownTimerComponent],
  templateUrl: "./today-workout-player.component.html",
  styleUrl: "./today-workout-player.component.scss",
})
export class TodayWorkoutPlayerComponent {
  private sanitizer = inject(DomSanitizer);

  readonly exercise    = input.required<PrescribedExercise>();
  readonly blockName   = input<string>("");
  readonly exerciseIndex = input<number>(0);
  readonly totalExercises = input<number>(1);
  readonly hasPrev     = input<boolean>(false);
  readonly hasNext     = input<boolean>(false);

  readonly close    = output<void>();
  readonly complete = output<PrescribedExercise>();
  readonly skip     = output<PrescribedExercise>();
  readonly prev     = output<void>();
  readonly next     = output<void>();

  readonly currentSet = signal(1);

  readonly prescriptionText = computed(() => formatPrescription(this.exercise()));

  readonly totalSets = computed(() => this.exercise().prescribedSets ?? 1);

  readonly setDots = computed(() =>
    Array.from({ length: this.totalSets() }, (_, i) => i + 1),
  );

  private readonly videoMeta = computed(() =>
    resolveYouTubeVideoMetadata({
      videoId: this.exercise().exercise.videoId,
      videoUrl: this.exercise().exercise.videoUrl,
      exerciseName: this.exercise().exercise.name,
    }),
  );

  readonly videoEmbedUrl = computed((): SafeResourceUrl | null => {
    const url = buildYouTubeEmbedUrl(this.videoMeta().videoId);
    return url
      ? this.sanitizer.bypassSecurityTrustResourceUrl(url + "&autoplay=0")
      : null;
  });

  readonly hasDuration = computed(
    () => !!this.exercise().prescribedDurationSeconds,
  );

  advanceSet(): void {
    const next = this.currentSet() + 1;
    if (next > this.totalSets()) {
      this.complete.emit(this.exercise());
    } else {
      this.currentSet.set(next);
    }
  }

  onComplete(): void {
    this.complete.emit(this.exercise());
  }

  onSkip(): void {
    this.skip.emit(this.exercise());
  }

  onTimerComplete(): void {
    this.advanceSet();
  }
}
