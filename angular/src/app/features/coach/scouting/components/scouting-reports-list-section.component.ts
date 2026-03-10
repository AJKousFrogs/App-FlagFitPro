import { CommonModule, DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { Select } from "primeng/select";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";
import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";
import { EmptyStateComponent } from "../../../../shared/components/empty-state/empty-state.component";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";

export interface ScoutingReportListItem {
  id: string;
  opponentId: string;
  opponentName: string;
  gameDate: Date;
  createdBy: string;
  executiveSummary: string;
  sharedWith: "team" | "coaches_only";
  requiredReading: boolean;
  readBy: string[];
}

export interface ScoutingOpponentFilterOption {
  label: string;
  value: string;
}

@Component({
  selector: "app-scouting-reports-list-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    Select,
    ButtonComponent,
    IconButtonComponent,
    CardShellComponent,
    EmptyStateComponent,
    StatusTagComponent,
  ],
  templateUrl: "./scouting-reports-list-section.component.html",
  styleUrl: "./scouting-reports-list-section.component.scss",
})
export class ScoutingReportsListSectionComponent {
  readonly items = input.required<ScoutingReportListItem[]>();
  readonly filterOptions = input.required<ScoutingOpponentFilterOption[]>();

  readonly filterChange = output<string | null>();
  readonly createReport = output<void>();
  readonly viewReport = output<ScoutingReportListItem>();
  readonly shareReport = output<ScoutingReportListItem>();
  readonly editReport = output<ScoutingReportListItem>();
}
