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
  styles: [
    `
      :host {
        display: inline-flex;
      }

      .pulse-indicator {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
      }

      /* Container */
      .pulse-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Sizes */
      .size-xs .pulse-container {
        width: 8px;
        height: 8px;
      }

      .size-sm .pulse-container {
        width: 12px;
        height: 12px;
      }

      .size-md .pulse-container {
        width: 16px;
        height: 16px;
      }

      .size-lg .pulse-container {
        width: 20px;
        height: 20px;
      }

      /* Core dot */
      .pulse-dot {
        position: relative;
        z-index: 1;
        border-radius: 50%;
      }

      .size-xs .pulse-dot {
        width: 6px;
        height: 6px;
      }

      .size-sm .pulse-dot {
        width: 8px;
        height: 8px;
      }

      .size-md .pulse-dot {
        width: 10px;
        height: 10px;
      }

      .size-lg .pulse-dot {
        width: 12px;
        height: 12px;
      }

      /* Pulse rings */
      .pulse-ring {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        opacity: 0;
      }

      .pulse-ring-1 {
        animation: pulse-expand 2s ease-out infinite;
      }

      .pulse-ring-2 {
        animation: pulse-expand 2s ease-out infinite 1s;
      }

      @keyframes pulse-expand {
        0% {
          transform: scale(0.8);
          opacity: 0.8;
        }
        100% {
          transform: scale(2.5);
          opacity: 0;
        }
      }

      /* Status colors */
      .status-live .pulse-dot,
      .status-online .pulse-dot {
        background: var(--color-status-success);
        box-shadow: 0 0 8px var(--color-status-success);
      }

      .status-live .pulse-ring,
      .status-online .pulse-ring {
        background: var(--color-status-success);
      }

      .status-offline .pulse-dot {
        background: var(--p-surface-400);
      }

      .status-connecting .pulse-dot {
        background: var(--color-status-warning);
        animation: blink 1s ease-in-out infinite;
      }

      .status-connecting .pulse-ring {
        background: var(--color-status-warning);
      }

      .status-warning .pulse-dot {
        background: var(--color-status-warning);
        box-shadow: 0 0 8px var(--color-status-warning);
      }

      .status-warning .pulse-ring {
        background: var(--color-status-warning);
      }

      .status-error .pulse-dot {
        background: var(--color-status-error);
        box-shadow: 0 0 8px var(--color-status-error);
      }

      .status-error .pulse-ring {
        background: var(--color-status-error);
      }

      @keyframes blink {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.4;
        }
      }

      /* Label */
      .pulse-label {
        font-size: var(--font-body-sm);
        font-weight: 500;
        color: var(--text-secondary);
        white-space: nowrap;
      }

      .size-xs .pulse-label {
        font-size: var(--font-body-xs);
      }

      .size-lg .pulse-label {
        font-size: var(--font-body-md);
      }

      .status-live .pulse-label,
      .status-online .pulse-label {
        color: var(--color-status-success);
      }

      .status-warning .pulse-label {
        color: var(--color-status-warning);
      }

      .status-error .pulse-label {
        color: var(--color-status-error);
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .pulse-ring {
          animation: none;
          display: none;
        }

        .status-connecting .pulse-dot {
          animation: none;
        }
      }
    `,
  ],
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
