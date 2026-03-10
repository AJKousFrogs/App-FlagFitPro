import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormGroup, ReactiveFormsModule } from "@angular/forms";

import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { Slider } from "primeng/slider";

import { AlertComponent, AlertVariant } from "../alert/alert.component";
import { ButtonComponent } from "../button/button.component";
import {
  StatusTagComponent,
  StatusTagSeverity,
} from "../status-tag/status-tag.component";

@Component({
  selector: "app-training-builder-parameters-step",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Slider,
    Select,
    InputText,
    AlertComponent,
    ButtonComponent,
    StatusTagComponent,
  ],
  templateUrl: "./training-builder-parameters-step.component.html",
  styleUrl: "./training-builder-parameters-step.component.scss",
})
export class TrainingBuilderParametersStepComponent {
  sessionForm = input.required<FormGroup>();
  intensityLevels = input.required<ReadonlyArray<{ label: string; value: string }>>();
  weatherData = input<{
    condition: string;
    temperature: number;
    recommendation: string;
  } | null>(null);
  weatherSummary = input<string>("");
  weatherAlertVariant = input<AlertVariant>("info");
  weatherSeverity = input<StatusTagSeverity>("info");

  previous = output<void>();
  generate = output<void>();
}
