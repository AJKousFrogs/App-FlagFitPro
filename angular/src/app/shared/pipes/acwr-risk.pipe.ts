import { Pipe, PipeTransform } from "@angular/core";
import { TRAINING_THRESHOLDS } from "../../core/constants/training-thresholds";

@Pipe({
  name: "acwrRisk",
  standalone: true,
})
export class AcwrRiskPipe implements PipeTransform {
  transform(
    ratio: number | null | undefined,
    output: "label" | "full" | "ratio" = "label",
  ): string {
    if (ratio === null || ratio === undefined) {
      return "Insufficient Data";
    }

    const label = this.getLabel(ratio);

    switch (output) {
      case "ratio":
        return ratio.toFixed(2);
      case "full":
        return `${ratio.toFixed(2)} — ${label}`;
      default:
        return label;
    }
  }

  private getLabel(ratio: number): string {
    if (ratio < TRAINING_THRESHOLDS.ACWR_UNDER_TRAINING) return "Under-Training";
    if (ratio <= TRAINING_THRESHOLDS.ACWR_SWEET_SPOT_MAX) return "Optimal";
    if (ratio <= TRAINING_THRESHOLDS.ACWR_ELEVATED_RISK) return "Elevated Risk";
    return "High Risk";
  }
}
