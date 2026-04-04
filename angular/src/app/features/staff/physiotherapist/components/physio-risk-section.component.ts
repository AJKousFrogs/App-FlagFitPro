import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ProgressBarComponent } from "../../../../shared/components/progress-bar/progress-bar.component";

import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../../shared/components/empty-state/empty-state.component";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";

interface RiskIndicatorView {
  athleteId: string;
  acwrRisk: "low" | "moderate" | "high" | "unknown";
  acwrValue: number | null;
  trainingLoadSpike: boolean;
  sleepDeficit: boolean;
  weightFluctuation: boolean;
  soreness: number | null;
  asymmetries: { test: string; leftRight: string; concern: boolean }[];
}

@Component({
  selector: "app-physio-risk-section",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ProgressBarComponent,
    ButtonComponent,
    CardShellComponent,
    EmptyStateComponent,
    StatusTagComponent,
  ],
  templateUrl: "./physio-risk-section.component.html",
  styleUrl: "./physio-risk-section.component.scss",
})
export class PhysioRiskSectionComponent {
  readonly items = input.required<RiskIndicatorView[]>();
  readonly athleteName = input.required<(athleteId: string) => string>();
  readonly riskSeverity = input.required<
    (risk: string) => "success" | "warning" | "danger" | "secondary"
  >();

  readonly viewPositionRisks = output<string>();
}
