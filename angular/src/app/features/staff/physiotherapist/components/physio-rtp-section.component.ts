import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ProgressBarComponent } from "../../../../shared/components/progress-bar/progress-bar.component";

import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../../shared/components/empty-state/empty-state.component";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";

interface RtpPhase {
  phase: number;
  name: string;
}

interface ReturnToPlayDataView {
  athleteId: string;
  injury: {
    type: string;
  };
  currentPhase: {
    phase: number;
    phaseName: string;
    daysInPhase: number;
    criteria: { requirement: string; met: boolean }[];
  };
  progressMetrics: {
    painLevel: number[];
    functionScore: number;
    strengthRecovery: number;
    confidenceLevel: number;
  };
  clearanceRecommendation: {
    status: "not_ready" | "limited_return" | "full_clearance";
  };
}

@Component({
  selector: "app-physio-rtp-section",
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
  templateUrl: "./physio-rtp-section.component.html",
  styleUrl: "./physio-rtp-section.component.scss",
})
export class PhysioRtpSectionComponent {
  readonly items = input.required<ReturnToPlayDataView[]>();
  readonly phases = input.required<RtpPhase[]>();
  readonly athleteName = input.required<(athleteId: string) => string>();
  readonly statusSeverity = input.required<
    (
      status: string,
    ) => "success" | "warning" | "danger" | "secondary"
  >();
  readonly latestPain = input.required<(rtp: ReturnToPlayDataView) => number>();

  readonly updateProgress = output<unknown>();
  readonly viewReport = output<unknown>();
}
