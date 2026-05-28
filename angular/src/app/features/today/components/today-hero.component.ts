import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from "@angular/core";

@Component({
  selector: "app-today-hero",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./today-hero.component.html",
  styleUrl: "./today-hero.component.scss",
})
export class TodayHeroComponent {
  /* ── Inputs ── */
  readonly sessionTitle = input<string>("Today's Session");
  readonly sessionType = input<string>("Training");
  readonly dateLabel = input<string>("");
  readonly weekPhase = input<string>("");
  readonly description = input<string>("");
  readonly blockCount = input<number>(0);
  readonly exerciseCount = input<number>(0);
  readonly durationMinutes = input<number>(0);
  readonly readinessScore = input<number | null>(null);
  readonly readinessLabel = input<string>("");
  readonly hasCheckedIn = input<boolean>(false);

  /* ── Outputs ── */
  readonly startWorkout = output<void>();
  readonly logCheckin = output<void>();

  /* ── Computed ── */
  readonly ringPercent = computed(() => this.readinessScore() ?? 0);

  readonly readinessScoreDisplay = computed(() => {
    const score = this.readinessScore();
    return score !== null && score !== undefined ? `${score}` : "--";
  });

  readonly durationDisplay = computed(() => {
    const m = this.durationMinutes();
    return m > 0 ? `${m}` : "--";
  });
}
