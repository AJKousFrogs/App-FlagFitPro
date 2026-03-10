import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { Tooltip } from "primeng/tooltip";

import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";

export interface TrainingAchievementPreview {
  id: string;
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: "app-training-footer-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Tooltip, ButtonComponent, CardShellComponent],
  templateUrl: "./training-footer-section.component.html",
  styleUrl: "./training-footer-section.component.scss",
})
export class TrainingFooterSectionComponent {
  readonly recentAchievements = input.required<TrainingAchievementPreview[]>();
  readonly daysUntilOlympics = input.required<number>();
  readonly overallProgress = input.required<number>();

  readonly openAchievements = output<void>();
  readonly openRoadmap = output<void>();

  protected trackByAchievementTitle(
    index: number,
    achievement: TrainingAchievementPreview,
  ): string {
    return achievement.title || achievement.id || index.toString();
  }
}
