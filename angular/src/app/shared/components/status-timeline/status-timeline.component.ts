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
  styleUrl: './status-timeline.component.scss',
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
