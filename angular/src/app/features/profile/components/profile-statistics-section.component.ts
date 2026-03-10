import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { StatusTagComponent } from "../../../shared/components/status-tag/status-tag.component";

interface ProfilePerformanceStat {
  label: string;
  value: string;
  trend: string;
  trendType:
    | "success"
    | "info"
    | "warning"
    | "secondary"
    | "contrast"
    | "danger";
}

@Component({
  selector: "app-profile-statistics-section",
  standalone: true,
  imports: [CommonModule, CardShellComponent, StatusTagComponent],
  templateUrl: "./profile-statistics-section.component.html",
  styleUrl: "./profile-statistics-section.component.scss",
})
export class ProfileStatisticsSectionComponent {
  readonly performanceStats = input<ProfilePerformanceStat[]>([]);

  protected trackByPerformanceStatLabel(
    index: number,
    stat: ProfilePerformanceStat,
  ): string {
    return stat.label || index.toString();
  }
}
