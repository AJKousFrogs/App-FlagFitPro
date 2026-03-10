import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";

interface ProfileActivity {
  icon: string;
  title: string;
  time: string;
}

@Component({
  selector: "app-profile-overview-section",
  standalone: true,
  imports: [CommonModule, CardShellComponent, EmptyStateComponent],
  templateUrl: "./profile-overview-section.component.html",
  styleUrl: "./profile-overview-section.component.scss",
})
export class ProfileOverviewSectionComponent {
  readonly activities = input<ProfileActivity[]>([]);

  protected trackByActivityTitle(index: number, activity: ProfileActivity): string {
    return activity.title || index.toString();
  }
}
