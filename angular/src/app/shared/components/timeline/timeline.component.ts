import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule } from "@angular/common";

export interface TimelineItem {
  date: string;
  title: string;
  description?: string;
  icon?: string;
}

/**
 * Timeline Component - Angular 21
 *
 * A timeline component for displaying chronological events
 * Uses Angular 21 signals for reactive state management
 */
@Component({
  selector: "app-timeline",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="timeline" [class]="'timeline-' + orientation()">
      @for (item of items(); track item.date + item.title) {
        <div class="timeline-item">
          <div class="timeline-marker">
            @if (item.icon) {
              <i [class]="item.icon"></i>
            }
          </div>
          <div class="timeline-content">
            <div class="timeline-date">{{ item.date }}</div>
            <h3 class="timeline-title">{{ item.title }}</h3>
            @if (item.description) {
              <p class="timeline-description">{{ item.description }}</p>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .timeline {
        position: relative;
      }

      .timeline-vertical {
        padding-left: 2rem;
      }

      .timeline-vertical::before {
        content: "";
        position: absolute;
        left: 0.5rem;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--p-surface-border);
      }

      .timeline-item {
        position: relative;
        padding-bottom: 2rem;
      }

      .timeline-item:last-child {
        padding-bottom: 0;
      }

      .timeline-marker {
        position: absolute;
        left: -1.75rem;
        top: 0.25rem;
        width: 1rem;
        height: 1rem;
        border-radius: 50%;
        background: var(--p-primary-color);
        border: 3px solid var(--p-surface-0);
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .timeline-marker i {
        color: white;
        font-size: 0.75rem;
      }

      .timeline-content {
        background: var(--p-surface-0);
        border: 1px solid var(--p-surface-border);
        border-radius: var(--p-border-radius);
        padding: 1rem;
      }

      .timeline-date {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--p-primary-color);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
      }

      .timeline-title {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--p-text-color);
      }

      .timeline-description {
        margin: 0;
        font-size: 0.875rem;
        color: var(--p-text-color-secondary);
        line-height: 1.5;
      }

      /* Horizontal Timeline */
      .timeline-horizontal {
        display: flex;
        padding-top: 2rem;
        position: relative;
      }

      .timeline-horizontal::before {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        top: 2.5rem;
        height: 2px;
        background: var(--p-surface-border);
      }

      .timeline-horizontal .timeline-item {
        flex: 1;
        padding-bottom: 0;
        padding-right: 1rem;
      }

      .timeline-horizontal .timeline-item:last-child {
        padding-right: 0;
      }

      .timeline-horizontal .timeline-marker {
        position: relative;
        left: auto;
        top: auto;
        margin: 0 auto 1rem;
      }

      .timeline-horizontal .timeline-content {
        text-align: center;
      }
    `,
  ],
})
export class TimelineComponent {
  items = input.required<TimelineItem[]>();
  orientation = input<"vertical" | "horizontal">("vertical");
}
