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
import { AppDialogComponent } from "../../../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../../../shared/components/dialog-header/dialog-header.component";

import { InstagramVideo } from "../video-curation.models";

@Component({
  selector: "app-video-curation-preview-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppDialogComponent, DialogHeaderComponent],
  template: `
    <app-dialog
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="true"
      [blockScroll]="true"
      [draggable]="false"
      dialogSize="2xl"
      ariaLabel="Video preview"
      class="video-curation-preview-dialog"
    >
      <app-dialog-header
        dialogHeader
        icon="video"
        [title]="video()?.title || 'Video Preview'"
        (close)="visible.set(false)"
      />
      @if (video(); as v) {
        <div class="preview-content">
          <div class="preview-embed" [innerHTML]="embedHtml()"></div>
          <div class="preview-details">
            <p>{{ v.description }}</p>
            <div class="preview-meta">
              <span
                ><i class="pi pi-user" aria-hidden="true"></i>
                <span class="visually-hidden">Creator:</span>
                {{ v.creator.displayName }}</span
              >
              <span
                ><i class="pi pi-star-fill" aria-hidden="true"></i>
                <span class="visually-hidden">Rating:</span>
                {{ v.rating.toFixed(1) }}</span
              >
              <span
                ><i class="pi pi-calendar" aria-hidden="true"></i>
                <span class="visually-hidden">Added:</span>
                {{ v.addedDate }}</span
              >
            </div>
          </div>
        </div>
      }
    </app-dialog>
  `,
  styleUrl: "./video-curation-preview-dialog.component.scss",
})
export class VideoCurationPreviewDialogComponent {
  video = input<InstagramVideo | null>(null);
  embedHtml = input<string>("");
  visible = model<boolean>(false);
}
