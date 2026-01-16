/**
 * Video Curation Pending Component
 *
 * Displays pending videos for review in a card grid layout.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from "@angular/core";
import { CommonModule } from "@angular/common";

// PrimeNG
import { Tag } from "primeng/tag";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { InstagramVideo } from "../video-curation.models";

@Component({
  selector: "app-video-curation-pending",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Tag, StatusTagComponent, ButtonComponent],
  template: `
    <div class="tab-content">
      @if (videos().length === 0) {
        <div class="empty-state">
          <i class="pi pi-check-circle" aria-hidden="true"></i>
          <h3>All caught up!</h3>
          <p>No videos pending review</p>
        </div>
      } @else {
        <div class="pending-grid">
          @for (video of videos(); track video.id) {
            <div class="pending-card">
              <div class="pending-thumbnail">
                <i class="pi pi-play-circle" aria-hidden="true"></i>
              </div>
              <div class="pending-content">
                <h4>{{ video.title }}</h4>
                <p>{{ video.description }}</p>
                <div class="pending-meta">
                  <span>
                    <i class="pi pi-user" aria-hidden="true"></i>
                    <span class="visually-hidden">Creator:</span>
                    {{ video.creator.displayName }}
                  </span>
                  <span>
                    <i class="pi pi-star-fill" aria-hidden="true"></i>
                    <span class="visually-hidden">Rating:</span>
                    {{ video.rating.toFixed(1) }}
                  </span>
                </div>
                <div class="pending-tags">
                  @for (pos of video.positions; track pos) {
                    <app-status-tag [value]="pos" severity="info" size="sm" />
                  }
                </div>
              </div>
              <div class="pending-actions">
                <app-button
                  iconLeft="pi-check"
                  variant="success"
                  (clicked)="approve.emit(video)"
                  >Approve</app-button
                >
                <app-button
                  iconLeft="pi-times"
                  variant="danger"
                  (clicked)="reject.emit(video)"
                  >Reject</app-button
                >
                <app-button
                  iconLeft="pi-eye"
                  variant="text"
                  (clicked)="preview.emit(video)"
                  >Preview</app-button
                >
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: "./video-curation-pending.component.scss",
})
export class VideoCurationPendingComponent {
  videos = input.required<InstagramVideo[]>();

  approve = output<InstagramVideo>();
  reject = output<InstagramVideo>();
  preview = output<InstagramVideo>();
}
