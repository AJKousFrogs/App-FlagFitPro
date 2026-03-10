import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";

interface ProfileAchievement {
  icon: string;
  title: string;
  description: string;
  date: string;
}

@Component({
  selector: "app-profile-achievements-section",
  standalone: true,
  imports: [CommonModule, EmptyStateComponent, CardShellComponent],
  templateUrl: "./profile-achievements-section.component.html",
  styleUrl: "./profile-achievements-section.component.scss",
})
export class ProfileAchievementsSectionComponent {
  readonly achievements = input<ProfileAchievement[]>([]);

  protected trackByAchievementTitle(
    index: number,
    achievement: ProfileAchievement,
  ): string {
    return achievement.title || index.toString();
  }
}
