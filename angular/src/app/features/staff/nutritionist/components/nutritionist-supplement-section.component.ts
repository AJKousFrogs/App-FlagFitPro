import { CommonModule } from "@angular/common";
import { Component, input } from "@angular/core";
import { ProgressBarComponent } from "../../../../shared/components/progress-bar/progress-bar.component";

import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../../shared/components/empty-state/empty-state.component";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";

interface SupplementComplianceView {
  athleteId: string;
  supplements: {
    name: string;
    complianceRate: number;
    missedDays: number;
    timingAdherence: number;
  }[];
  overallComplianceRate: number;
  timingIssues: string[];
}

@Component({
  selector: "app-nutritionist-supplement-section",
  standalone: true,
  imports: [CommonModule, ProgressBarComponent, CardShellComponent, EmptyStateComponent, StatusTagComponent],
  templateUrl: "./nutritionist-supplement-section.component.html",
  styleUrl: "./nutritionist-supplement-section.component.scss",
})
export class NutritionistSupplementSectionComponent {
  readonly items = input.required<SupplementComplianceView[]>();
  readonly athleteName = input.required<(athleteId: string) => string>();
  readonly complianceSeverity = input.required<
    (value: number) => "success" | "warning" | "danger" | "secondary" | "info"
  >();
}
