import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { RouterLink } from "@angular/router";

import { ButtonComponent } from "../../../shared/components/button/button.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";

export interface DataImportResult {
  success: boolean;
  message: string;
  itemsImported: number;
  warnings: string[];
  nextSteps: string[];
}

@Component({
  selector: "app-data-import-result-step",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardShellComponent, ButtonComponent, RouterLink],
  templateUrl: "./data-import-result-step.component.html",
})
export class DataImportResultStepComponent {
  result = input.required<DataImportResult>();

  reset = output<void>();
}
