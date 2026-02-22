/**
 * Live Indicator Component
 *
 * Shows a live status indicator when real-time subscriptions are active.
 * Displays a pulsing red dot with "LIVE" text.
 */

import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-live-indicator",
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="live-indicator" [class.live-active]="isLive()">
      <span class="live-dot"></span>
      <span class="live-text">LIVE</span>
    </div>
  `,
  styleUrl: "./live-indicator.component.scss",
})
export class LiveIndicatorComponent {
  // Angular 21: Use input() signal instead of @Input()
  isLive = input<boolean>(false);
}
