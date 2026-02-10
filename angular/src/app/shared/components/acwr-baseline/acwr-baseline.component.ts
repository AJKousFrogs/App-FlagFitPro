/**
 * ACWR Baseline Widget
 *
 * Contract: Shows X/21 progress only, NO ratio, NO zones
 * Used when confidence is "building_baseline"
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ProgressBar } from "primeng/progressbar";

@Component({
  selector: "app-acwr-baseline",
  standalone: true,
  imports: [CommonModule, ProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./acwr-baseline.component.html",
  styleUrl: "./acwr-baseline.component.scss",
})
export class AcwrBaselineComponent {
  daysLogged = input.required<number>();
  targetDays = input<number>(21);
  label = input<string>("Load Management");

  progressPercent = computed(() => {
    return Math.min((this.daysLogged() / this.targetDays()) * 100, 100);
  });
}
