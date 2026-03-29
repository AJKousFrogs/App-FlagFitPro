import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";

import { WeeklyTrainingTemplate } from "../../../../core/services/flag-football-periodization.service";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";

@Component({
  selector: "app-periodization-schedule-tab",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, StatusTagComponent],
  templateUrl: "./periodization-schedule-tab.component.html",
  styleUrl: "./periodization-schedule-tab.component.scss",
})
export class PeriodizationScheduleTabComponent {
  readonly template = input<WeeklyTrainingTemplate | null>(null);

  getSessionSeverity(
    sessionType: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    switch (sessionType) {
      case "game":
        return "warning";
      case "recovery":
        return "success";
      case "rest":
        return "secondary";
      default:
        return "info";
    }
  }

  formatFocus(focus: string): string {
    return focus.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
