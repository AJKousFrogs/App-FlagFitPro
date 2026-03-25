import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ProgressBar } from "primeng/progressbar";
import { Select, type SelectChangeEvent } from "primeng/select";

import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";
import {
  LazyChartComponent,
  type LazyChartData,
  type LazyChartOptionsInput,
} from "../../../../shared/components/lazy-chart/lazy-chart.component";
import {
  StatusTagComponent,
  type StatusTagSeverity,
} from "../../../../shared/components/status-tag/status-tag.component";
import type { SimpleChartData } from "../../../../core/models/chart.models";

interface MentalWellnessReport {
  wellnessTrends: {
    avgMoodScore: number;
    moodTrend: "improving" | "stable" | "declining";
    avgStressLevel: number;
    stressTrend: "improving" | "stable" | "declining";
    avgMotivation: number;
    avgConfidence: number;
  };
  sleepPatterns: {
    avgSleepHours: number;
    sleepQualityAvg: number;
    consistentBedtime: boolean;
    sleepDebtDays: number;
    weekendOversleep: boolean;
  };
  recoveryBehaviors: {
    avgRecoveryScore: number;
    recoveryActivitiesLogged: string[];
    socialRecoveryActivities: number;
    screenTimeBeforeBed: "low" | "moderate" | "high";
  };
  observedPatterns: {
    stressTriggers: string[];
    positiveCorrelations: string[];
    concerningPatterns: string[];
  };
}

@Component({
  selector: "app-psychology-wellness-section",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardShellComponent,
    LazyChartComponent,
    ProgressBar,
    Select,
    StatusTagComponent,
  ],
  templateUrl: "./psychology-wellness-section.component.html",
  styleUrl: "./psychology-wellness-section.component.scss",
})
export class PsychologyWellnessSectionComponent {
  readonly data = input.required<MentalWellnessReport | null>();
  readonly selectedPeriod = input.required<string>();
  readonly timePeriods = input.required<Array<{ label: string; value: string }>>();
  readonly chartData = input.required<
    LazyChartData | SimpleChartData | Record<string, unknown> | null
  >();
  readonly chartOptions = input.required<LazyChartOptionsInput>();
  readonly trendSeverity = input.required<
    (
      trend: "improving" | "stable" | "declining",
      invert?: boolean,
    ) => StatusTagSeverity
  >();
  readonly screenTimeSeverity = input.required<
    (level: "low" | "moderate" | "high") => StatusTagSeverity
  >();

  readonly periodChange = output<string>();

  emitPeriodChange(event: SelectChangeEvent): void {
    this.periodChange.emit((event.value as string | null | undefined) ?? "30days");
  }
}
