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
  styles: [
    `
      .tab-content {
        padding: var(--space-4) 0;
      }

      .empty-state {
        text-align: center;
        padding: var(--space-12);

        i {
          font-size: 4rem;
          color: var(--color-brand-primary);
          opacity: 0.5;
          margin-bottom: var(--space-4);
        }

        h3 {
          font-size: var(--font-heading-md);
          color: var(--color-text-primary);
          margin: 0 0 var(--space-2);
        }

        p {
          color: var(--color-text-secondary);
          margin: 0;
        }
      }

      .pending-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: var(--space-4);
      }

      .pending-card {
        background: var(--surface-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-xl);
        overflow: hidden;
      }

      .pending-thumbnail {
        height: 150px;
        background: linear-gradient(
          135deg,
          var(--color-brand-primary-subtle) 0%,
          var(--surface-secondary) 100%
        );
        display: flex;
        align-items: center;
        justify-content: center;

        i {
          font-size: 3rem;
          color: var(--color-brand-primary);
        }
      }

      .pending-content {
        padding: var(--space-4);

        h4 {
          font-size: var(--font-body-lg);
          font-weight: var(--font-weight-semibold);
          margin: 0 0 var(--space-2);
          color: var(--color-text-primary);
        }

        p {
          font-size: var(--font-body-sm);
          color: var(--color-text-secondary);
          margin: 0 0 var(--space-3);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }

      .pending-meta {
        display: flex;
        gap: var(--space-4);
        font-size: var(--font-body-sm);
        color: var(--color-text-muted);
        margin-bottom: var(--space-3);

        span {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .pi-star-fill {
          color: var(--color-star-rating);
        }
      }

      .pending-tags {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      .pending-actions {
        padding: var(--space-4);
        border-top: 1px solid var(--color-border-primary);
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      @media (max-width: 768px) {
        .pending-grid {
          grid-template-columns: 1fr;
          gap: var(--space-3);
        }
      }

      @media (min-width: 1400px) {
        .pending-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }
    `,
  ],
})
export class VideoCurationPendingComponent {
  videos = input.required<InstagramVideo[]>();

  approve = output<InstagramVideo>();
  reject = output<InstagramVideo>();
  preview = output<InstagramVideo>();
}
