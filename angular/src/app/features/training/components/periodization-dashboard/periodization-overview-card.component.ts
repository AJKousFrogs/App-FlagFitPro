import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { ProgressBar } from "primeng/progressbar";
import {
  ACWRCalculation,
  LoadRecommendation,
} from "../../../../core/services/phase-load-calculator.service";
import { PhaseConfig } from "../../../../core/services/flag-football-periodization.service";
import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";
import { Chip } from "primeng/chip";

@Component({
  selector: "app-periodization-overview-card",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardShellComponent,
    StatusTagComponent,
    ProgressBar,
    Chip,
  ],
  templateUrl: "./periodization-overview-card.component.html",
  styleUrl: "./periodization-overview-card.component.scss",
})
export class PeriodizationOverviewCardComponent {
  @Input() currentPhase: PhaseConfig | null = null;
  @Input() currentWeek = 1;
  @Input() currentDate = new Date();
  @Input() loadRecommendation: LoadRecommendation | null = null;
  @Input() acwrStatus: ACWRCalculation | null = null;

  getPhaseSeverity(): "success" | "info" | "warning" | "danger" | "secondary" {
    const phase = this.currentPhase;
    if (!phase) return "info";

    switch (phase.type) {
      case "peak":
      case "taper":
        return "danger";
      case "speed_development":
      case "power_development":
        return "warning";
      case "in_season_maintenance":
      case "mid_season_reload":
        return "success";
      default:
        return "info";
    }
  }

  getAcwrSeverity(): "success" | "info" | "warning" | "danger" {
    const status = this.acwrStatus;
    if (!status) return "info";

    switch (status.riskZone) {
      case "optimal":
        return "success";
      case "caution":
        return "warning";
      case "danger":
        return "danger";
      default:
        return "info";
    }
  }

  getLoadProgress(): number {
    if (!this.loadRecommendation) return 50;
    return 65;
  }

  formatFocus(focus: string): string {
    return focus.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
