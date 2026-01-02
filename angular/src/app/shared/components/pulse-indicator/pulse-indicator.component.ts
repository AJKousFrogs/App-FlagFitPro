/**
 * Pulse Indicator Component
 *
 * A live status indicator with pulsing animation.
 * Perfect for showing real-time connection status, live data, etc.
 *
 * Features:
 * - Multiple status states
 * - Smooth pulsing animation
 * - Size variants
 * - Optional label
 * - Accessibility support
 *
 * @example
 * <app-pulse-indicator
 *   status="live"
 *   label="Live"
 *   size="md"
 * />
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export type PulseStatus =
  | "live"
  | "online"
  | "offline"
  | "connecting"
  | "warning"
  | "error";

@Component({
  selector: "app-pulse-indicator",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      class="pulse-indicator"
      [class]="'status-' + status() + ' size-' + size()"
      [attr.role]="'status'"
      [attr.aria-label]="ariaLabel()"
    >
      <div class="pulse-container">
        <!-- Pulse rings -->
        @if (shouldPulse()) {
          <span class="pulse-ring pulse-ring-1"></span>
          <span class="pulse-ring pulse-ring-2"></span>
        }

        <!-- Core dot -->
        <span class="pulse-dot"></span>
      </div>

      <!-- Label -->
      @if (label()) {
        <span class="pulse-label">{{ label() }}</span>
      }
    </div>
  `,
  styleUrl: './pulse-indicator.component.scss',
})
export class PulseIndicatorComponent {
  // Inputs
  status = input<PulseStatus>("online");
  label = input<string>("");
  size = input<"xs" | "sm" | "md" | "lg">("md");

  // Computed
  shouldPulse = computed(() => {
    const s = this.status();
    return (
      s === "live" ||
      s === "online" ||
      s === "connecting" ||
      s === "warning" ||
      s === "error"
    );
  });

  ariaLabel = computed(() => {
    const s = this.status();
    const l = this.label();
    const statusText = s.charAt(0).toUpperCase() + s.slice(1);
    return l ? `${l}: ${statusText}` : statusText;
  });
}
