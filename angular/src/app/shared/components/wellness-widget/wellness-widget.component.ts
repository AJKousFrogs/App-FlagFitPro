import {
  Component,
  ChangeDetectionStrategy,
} from "@angular/core";
import { WellnessScoreDisplayComponent } from "../wellness-score-display/wellness-score-display.component";

/**
 * Wellness Widget Component
 *
 * @deprecated This component is now a thin wrapper around WellnessScoreDisplayComponent.
 * Consider using WellnessScoreDisplayComponent directly with variant="full" for new code.
 *
 * Migration:
 * Before: <app-wellness-widget></app-wellness-widget>
 * After:  <app-wellness-score-display variant="full" [showDetails]="true"></app-wellness-score-display>
 */
@Component({
  selector: "app-wellness-widget",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WellnessScoreDisplayComponent],
  template: `
    <!-- Delegates to unified WellnessScoreDisplayComponent -->
    <app-wellness-score-display
      variant="full"
      [showDetails]="true"
      [clickable]="true"
      navigateTo="/wellness"
    ></app-wellness-score-display>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }
    `,
  ],
})
export class WellnessWidgetComponent {
  // Component now delegates all logic to WellnessScoreDisplayComponent
  // No local state needed - this is just a wrapper for backward compatibility
}
