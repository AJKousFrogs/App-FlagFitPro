/**
 * Status Timeline Component
 *
 * A visual timeline for showing training/recovery status over time.
 * Perfect for weekly training overview, recovery progress, etc.
 *
 * Features:
 * - Horizontal or vertical layout
 * - Color-coded status dots
 * - Current position indicator
 * - Connecting lines with progress
 * - Responsive design
 *
 * @example
 * <app-status-timeline
 *   [items]="weekDays"
 *   [currentIndex]="todayIndex"
 *   orientation="horizontal"
 * />
 */

import {
  Component,
  input,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";

export interface TimelineItem {
  id: string;
  label: string;
  sublabel?: string;
  status: "completed" | "current" | "upcoming" | "skipped" | "rest";
  value?: string | number;
  icon?: string;
  tooltip?: string;
}

@Component({
  selector: "app-status-timeline",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div
      class="status-timeline"
      [class]="'orientation-' + orientation() + ' variant-' + variant()"
      role="list"
      [attr.aria-label]="ariaLabel()"
    >
      @for (item of items(); track item.id; let i = $index; let last = $last) {
        <div
          class="timeline-item"
          [class]="'status-' + item.status"
          [class.is-current]="i === currentIndex()"
          role="listitem"
          [title]="item.tooltip || ''"
        >
          <!-- Connector line (before) -->
          @if (i > 0) {
            <div
              class="connector connector-before"
              [class.filled]="isConnectorFilled(i, 'before')"
            ></div>
          }

          <!-- Item content -->
          <div class="item-content">
            <!-- Status dot -->
            <div class="status-dot">
              @if (item.icon) {
                <i [class]="'pi ' + item.icon"></i>
              } @else {
                @switch (item.status) {
                  @case ("completed") {
                    <i class="pi pi-check"></i>
                  }
                  @case ("current") {
                    <span class="current-pulse"></span>
                  }
                  @case ("skipped") {
                    <i class="pi pi-times"></i>
                  }
                  @case ("rest") {
                    <i class="pi pi-moon"></i>
                  }
                  @default {
                    <span class="dot-inner"></span>
                  }
                }
              }
            </div>

            <!-- Labels -->
            <div class="item-labels">
              <span class="item-label">{{ item.label }}</span>
              @if (item.sublabel) {
                <span class="item-sublabel">{{ item.sublabel }}</span>
              }
              @if (item.value) {
                <span class="item-value">{{ item.value }}</span>
              }
            </div>
          </div>

          <!-- Connector line (after) -->
          @if (!last) {
            <div
              class="connector connector-after"
              [class.filled]="isConnectorFilled(i, 'after')"
            ></div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .status-timeline {
        display: flex;
        width: 100%;
      }

      /* Horizontal orientation */
      .orientation-horizontal {
        flex-direction: row;
        align-items: flex-start;
      }

      .orientation-horizontal .timeline-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
      }

      .orientation-horizontal .item-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        z-index: 1;
      }

      .orientation-horizontal .connector {
        position: absolute;
        top: 16px;
        height: 3px;
        background: var(--p-surface-200);
      }

      .orientation-horizontal .connector-before {
        right: 50%;
        left: 0;
        margin-right: 16px;
      }

      .orientation-horizontal .connector-after {
        left: 50%;
        right: 0;
        margin-left: 16px;
      }

      .orientation-horizontal .connector.filled {
        background: var(--color-brand-primary);
      }

      /* Vertical orientation */
      .orientation-vertical {
        flex-direction: column;
        gap: 0;
      }

      .orientation-vertical .timeline-item {
        display: flex;
        align-items: flex-start;
        position: relative;
        padding-left: 40px;
        min-height: 60px;
      }

      .orientation-vertical .item-content {
        display: flex;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .orientation-vertical .status-dot {
        position: absolute;
        left: 0;
      }

      .orientation-vertical .connector {
        position: absolute;
        left: 15px;
        width: 3px;
        background: var(--p-surface-200);
      }

      .orientation-vertical .connector-before {
        top: 0;
        bottom: 50%;
        margin-bottom: 16px;
      }

      .orientation-vertical .connector-after {
        top: 50%;
        bottom: 0;
        margin-top: 16px;
      }

      .orientation-vertical .connector.filled {
        background: var(--color-brand-primary);
      }

      /* Status dot */
      .status-dot {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        z-index: 2;
      }

      .status-completed .status-dot {
        background: var(--color-status-success);
        color: white;
      }

      .status-current .status-dot {
        background: var(--color-brand-primary);
        color: white;
        box-shadow: 0 0 0 4px rgba(var(--ds-primary-green-rgb), 0.2);
      }

      .status-upcoming .status-dot {
        background: var(--p-surface-200);
        color: var(--text-tertiary);
      }

      .status-skipped .status-dot {
        background: var(--p-surface-300);
        color: var(--text-tertiary);
      }

      .status-rest .status-dot {
        background: var(--color-status-info-light);
        color: var(--color-status-info);
      }

      .dot-inner {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }

      /* Current pulse */
      .current-pulse {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: white;
        animation: current-pulse 2s ease-in-out infinite;
      }

      @keyframes current-pulse {
        0%,
        100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.3);
          opacity: 0.8;
        }
      }

      /* Labels */
      .item-labels {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        text-align: center;
      }

      .orientation-vertical .item-labels {
        align-items: flex-start;
        text-align: left;
      }

      .item-label {
        font-size: var(--font-body-sm);
        font-weight: 600;
        color: var(--text-primary);
      }

      .status-upcoming .item-label,
      .status-skipped .item-label {
        color: var(--text-secondary);
      }

      .is-current .item-label {
        color: var(--color-brand-primary);
      }

      .item-sublabel {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .item-value {
        font-size: var(--font-body-xs);
        font-weight: 600;
        padding: 2px 8px;
        border-radius: var(--radius-full);
        background: var(--p-surface-100);
        color: var(--text-secondary);
      }

      .status-completed .item-value {
        background: var(--color-status-success-light);
        color: var(--color-status-success);
      }

      .is-current .item-value {
        background: var(--color-brand-light);
        color: var(--color-brand-primary);
      }

      /* Variants */
      .variant-default {
        padding: var(--space-4);
      }

      .variant-compact .status-dot {
        width: 24px;
        height: 24px;
        font-size: 0.75rem;
      }

      .variant-compact .item-label {
        font-size: var(--font-body-xs);
      }

      .variant-compact .item-sublabel,
      .variant-compact .item-value {
        display: none;
      }

      .variant-compact .orientation-horizontal .connector {
        top: 12px;
      }

      .variant-compact .orientation-horizontal .connector-before {
        margin-right: 12px;
      }

      .variant-compact .orientation-horizontal .connector-after {
        margin-left: 12px;
      }

      /* Hover effects */
      .timeline-item:hover .status-dot {
        transform: scale(1.1);
      }

      /* Responsive */
      @media (max-width: 640px) {
        .orientation-horizontal .item-labels {
          display: none;
        }

        .orientation-horizontal .status-dot {
          width: 28px;
          height: 28px;
        }

        .orientation-horizontal .connector {
          top: 14px;
        }

        .orientation-horizontal .connector-before {
          margin-right: 14px;
        }

        .orientation-horizontal .connector-after {
          margin-left: 14px;
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .status-dot {
          transition: none;
        }

        .current-pulse {
          animation: none;
        }
      }
    `,
  ],
})
export class StatusTimelineComponent {
  // Inputs
  items = input<TimelineItem[]>([]);
  currentIndex = input<number>(-1);
  orientation = input<"horizontal" | "vertical">("horizontal");
  variant = input<"default" | "compact">("default");
  ariaLabel = input<string>("Status timeline");

  isConnectorFilled(index: number, position: "before" | "after"): boolean {
    const current = this.currentIndex();

    if (position === "before") {
      // Connector before is filled if this item or previous items are completed
      return index <= current;
    } else {
      // Connector after is filled if next item is completed or current
      return index < current;
    }
  }
}
