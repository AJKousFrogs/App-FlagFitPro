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
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";

import { InstagramVideo } from "../video-curation.models";

@Component({
  selector: "app-video-curation-pending",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TagModule, ButtonModule],
  template: `
    <div class="tab-content">
      @if (videos().length === 0) {
        <div class="empty-state">
          <i class="pi pi-check-circle"></i>
          <h3>All caught up!</h3>
          <p>No videos pending review</p>
        </div>
      } @else {
        <div class="pending-grid">
          @for (video of videos(); track video.id) {
            <div class="pending-card">
              <div class="pending-thumbnail">
                <i class="pi pi-play-circle"></i>
              </div>
              <div class="pending-content">
                <h4>{{ video.title }}</h4>
                <p>{{ video.description }}</p>
                <div class="pending-meta">
                  <span>
                    <i class="pi pi-user"></i>
                    {{ video.creator.displayName }}
                  </span>
                  <span>
                    <i class="pi pi-star-fill"></i>
                    {{ video.rating.toFixed(1) }}
                  </span>
                </div>
                <div class="pending-tags">
                  @for (pos of video.positions; track pos) {
                    <p-tag [value]="pos" severity="info"></p-tag>
                  }
                </div>
              </div>
              <div class="pending-actions">
                <button
                  pButton
                  label="Approve"
                  icon="pi pi-check"
                  class="p-button-success"
                  (click)="approve.emit(video)"
                ></button>
                <button
                  pButton
                  label="Reject"
                  icon="pi pi-times"
                  class="p-button-outlined p-button-danger"
                  (click)="reject.emit(video)"
                ></button>
                <button
                  pButton
                  label="Preview"
                  icon="pi pi-eye"
                  class="p-button-text"
                  (click)="preview.emit(video)"
                ></button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './video-curation-pending.component.scss',
})
export class VideoCurationPendingComponent {
  videos = input.required<InstagramVideo[]>();

  approve = output<InstagramVideo>();
  reject = output<InstagramVideo>();
  preview = output<InstagramVideo>();
}
