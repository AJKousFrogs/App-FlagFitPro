import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core";
import { LucideAngularModule } from "lucide-angular";
import { NgOptimizedImage } from "@angular/common";
import { TopbarComponent } from "../shared/topbar.component";
import { SkeletonComponent } from "../shared/skeleton.component";

import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";

interface Achievement {
  name?: string;
  earned?: boolean;
  progress?: number;
  progressMax?: number;
}
interface AchievementsData {
  achievements?: Achievement[];
  summary?: {
    totalEarned?: number;
    totalAvailable?: number;
    totalPoints?: number;
  };
}

/**
 * Achievements — streak / points / earned + next-up. Ported 1:1 from
 * redesign/ground-zero/02-hifi/achievements.html. Reads GET /api/achievements
 * (player_achievements + definitions + streaks); honest empty states with no data.
 */
@Component({
  selector: "app-achievements",
  imports: [
    NgOptimizedImage,
    TopbarComponent,
    SkeletonComponent,
    LucideAngularModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./achievements.component.html",
})
export class AchievementsComponent {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  private readonly data = signal<AchievementsData | null>(null);
  readonly streak = signal<number | null>(null);
  /** True until the achievements list fetch settles — drives the list
   * skeletons so the earned/next-up lists don't flash their empty states. */
  readonly loading = signal(true);

  readonly earned = computed(() =>
    (this.data()?.achievements ?? []).filter((a) => a.earned),
  );
  readonly nextUp = computed(() =>
    (this.data()?.achievements ?? []).filter((a) => !a.earned).slice(0, 4),
  );
  readonly points = computed(() => this.data()?.summary?.totalPoints ?? null);
  readonly earnedCount = computed(
    () => this.data()?.summary?.totalEarned ?? null,
  );

  constructor() {
    this.api.get<AchievementsData>("/api/achievements").subscribe({
      next: (res) => {
        this.data.set(res?.data ?? null);
        this.loading.set(false);
      },
      error: (e) => {
        this.logger.error("achievements_load_failed", e);
        this.loading.set(false);
      },
    });
    this.api
      .get<{ current_streak?: number }>("/api/achievements/streaks")
      .subscribe({
        next: (res) => this.streak.set(res?.data?.current_streak ?? null),
        error: () => this.streak.set(null),
      });
  }
}
