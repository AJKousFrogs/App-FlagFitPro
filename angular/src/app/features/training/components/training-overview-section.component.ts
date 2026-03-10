import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { Tooltip } from "primeng/tooltip";
import { AlertComponent } from "../../../shared/components/alert/alert.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

export interface TrainingQuickActionView {
  icon: string;
  label: string;
  route: string;
  tooltip: string;
}

export interface TrainingPriorityWorkoutView {
  title: string;
  description: string;
  icon: string;
  priority: "high" | "medium" | "low";
}

export interface TrainingWellnessAlertView {
  severity: "info" | "warning" | "critical";
  message: string;
}

@Component({
  selector: "app-training-overview-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    Tooltip,
    AlertComponent,
    ButtonComponent,
    CardShellComponent,
    StatusTagComponent,
  ],
  templateUrl: "./training-overview-section.component.html",
  styleUrl: "./training-overview-section.component.scss",
})
export class TrainingOverviewSectionComponent {
  readonly isRefreshing = input(false);
  readonly streakCount = input(0);
  readonly positionIcon = input("🏈");
  readonly positionLabel = input("Athlete");
  readonly readinessScore = input<number | null>(null);
  readonly readinessStatus = input("good");
  readonly wellnessAlert = input<TrainingWellnessAlertView | null>(null);
  readonly wellnessAlertVariant = input<"warning" | "error">("warning");
  readonly wellnessAlertTitle = input("");
  readonly totalAchievements = input(0);
  readonly quickActions = input.required<TrainingQuickActionView[]>();
  readonly priorityWorkouts = input.required<TrainingPriorityWorkoutView[]>();

  readonly openDailyProtocol = output<void>();
  readonly openWellness = output<void>();
  readonly dismissWellness = output<void>();
  readonly selectAction = output<string>();
  readonly selectPriorityWorkout = output<TrainingPriorityWorkoutView>();
}
