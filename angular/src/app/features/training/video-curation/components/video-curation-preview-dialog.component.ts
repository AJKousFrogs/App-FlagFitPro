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
} from "@angular/core";
import { CommonModule } from "@angular/common";

// PrimeNG
import { Dialog } from "primeng/dialog";

import { InstagramVideo } from "../video-curation.models";

@Component({
  selector: "app-video-curation-preview-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Dialog],
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
                ><i class="pi pi-user" aria-hidden="true"></i> <span class="visually-hidden">Creator:</span> {{ v.creator.displayName }}</span
              >
              <span
                ><i class="pi pi-star-fill" aria-hidden="true"></i> <span class="visually-hidden">Rating:</span> {{ v.rating.toFixed(1) }}</span
              >
              <span><i class="pi pi-calendar" aria-hidden="true"></i> <span class="visually-hidden">Added:</span> {{ v.addedDate }}</span>
            </div>
          </div>
        </div>
      }
    </p-dialog>
  `,
  styleUrl: "./video-curation-preview-dialog.component.scss",
})
export class VideoCurationPreviewDialogComponent {
  video = input<InstagramVideo | null>(null);
  embedHtml = input<string>("");
  visible = model<boolean>(false);
}
