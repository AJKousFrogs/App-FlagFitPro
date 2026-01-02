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
  styleUrl: './timeline.component.scss',
})
export class TimelineComponent {
  items = input.required<TimelineItem[]>();
  orientation = input<"vertical" | "horizontal">("vertical");
}
