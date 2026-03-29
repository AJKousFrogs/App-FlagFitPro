import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../../shared/components/empty-state/empty-state.component";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";

interface GeneratedReport {
  type: string;
  generatedDate: Date;
  periodStart: Date;
  periodEnd: Date;
  includedSections: string[];
}

@Component({
  selector: "app-psychology-reports-list-section",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ButtonComponent,
    CardShellComponent,
    EmptyStateComponent,
    IconButtonComponent,
  ],
  templateUrl: "./psychology-reports-list-section.component.html",
  styleUrl: "./psychology-reports-list-section.component.scss",
})
export class PsychologyReportsListSectionComponent {
  readonly reports = input.required<GeneratedReport[]>();
  readonly reportIcon = input.required<(type: string) => string>();
  readonly reportTypeLabel = input.required<(type: string) => string>();

  readonly openGenerate = output<void>();
  readonly downloadPdf = output<GeneratedReport>();
  readonly downloadCsv = output<GeneratedReport>();
  readonly deleteReport = output<GeneratedReport>();

  trackByGeneratedReport(index: number, report: GeneratedReport): string {
    return `${report.type}-${report.generatedDate.toISOString()}-${index}`;
  }
}
