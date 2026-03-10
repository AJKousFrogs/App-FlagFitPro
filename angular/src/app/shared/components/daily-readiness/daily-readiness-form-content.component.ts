import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { InputNumber } from "primeng/inputnumber";
import { Slider } from "primeng/slider";

interface DailyState {
  pain_level: number;
  fatigue_level: number;
  sleep_quality: number;
  motivation_level: number;
  weight_kg: number | null;
}

@Component({
  selector: "app-daily-readiness-form-content",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, Slider, InputNumber],
  templateUrl: "./daily-readiness-form-content.component.html",
  styleUrl: "./daily-readiness-form-content.component.scss",
})
export class DailyReadinessFormContentComponent {
  readonly state = input.required<DailyState>();
  readonly readinessScore = input.required<number>();
  readonly readinessClass = input.required<string>();
  readonly readinessHint = input.required<string>();
  readonly riskFlags = input.required<string[]>();
  readonly lastWeight = input<number | null>(null);

  readonly sliderChange = output<{
    key: Exclude<keyof DailyState, "weight_kg">;
    value: number | number[] | null | undefined;
  }>();
  readonly weightChange = output<number | null | undefined>();
}
