/**
 * Video Curation Preview Dialog Component
 *
 * Dialog for previewing video details and embed.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  model,
  computed,
} from "@angular/core";
import { CommonModule } from "@angular/common";

// PrimeNG
import { DialogModule } from "primeng/dialog";

import { InstagramVideo } from "../video-curation.models";

@Component({
  selector: "app-video-curation-preview-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DialogModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      [header]="video()?.title || 'Video Preview'"
      [style]="{ width: '90vw', maxWidth: '800px' }"
    >
      @if (video(); as v) {
        <div class="preview-content">
          <div class="preview-embed" [innerHTML]="embedHtml()"></div>
          <div class="preview-details">
            <p>{{ v.description }}</p>
            <div class="preview-meta">
              <span
                ><i class="pi pi-user"></i> {{ v.creator.displayName }}</span
              >
              <span
                ><i class="pi pi-star-fill"></i> {{ v.rating.toFixed(1) }}</span
              >
              <span><i class="pi pi-calendar"></i> {{ v.addedDate }}</span>
            </div>
          </div>
        </div>
      }
    </p-dialog>
  `,
  styles: [
    `
      .preview-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .preview-embed {
        min-height: 400px;
        background: var(--color-video-background);
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .preview-details {
        p {
          color: var(--color-text-primary);
          margin: 0 0 var(--space-3);
        }
      }

      .preview-meta {
        display: flex;
        gap: var(--space-4);
        font-size: var(--font-body-sm);
        color: var(--color-text-muted);

        span {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .pi-star-fill {
          color: var(--color-star-rating);
        }
      }
    `,
  ],
})
export class VideoCurationPreviewDialogComponent {
  video = input<InstagramVideo | null>(null);
  embedHtml = input<string>("");
  visible = model<boolean>(false);
}
