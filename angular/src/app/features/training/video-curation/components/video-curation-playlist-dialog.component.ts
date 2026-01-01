/**
 * Video Curation Playlist Dialog Component
 *
 * Dialog for creating and editing playlists.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  model,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

// PrimeNG
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TextareaModule } from "primeng/textarea";
import { Select } from "primeng/select";
import { MultiSelect } from "primeng/multiselect";

import { PlaylistForm, VideoOption } from "../video-curation.models";
import { POSITION_OPTIONS, FOCUS_OPTIONS } from "../video-curation-utils";

@Component({
  selector: "app-video-curation-playlist-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    Select,
    MultiSelect,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      header="Create Playlist"
      [style]="{ width: '500px' }"
    >
      <div class="playlist-form">
        <div class="form-field">
          <label for="playlistName">Playlist Name</label>
          <input
            id="playlistName"
            type="text"
            pInputText
            [(ngModel)]="form.name"
            placeholder="e.g., QB Pre-Game Drills"
          />
        </div>

        <div class="form-field">
          <label for="playlistDescription">Description</label>
          <textarea
            id="playlistDescription"
            pTextarea
            [(ngModel)]="form.description"
            [rows]="3"
            placeholder="Describe this playlist..."
          ></textarea>
        </div>

        <div class="form-field">
          <label for="playlistPosition">Target Position</label>
          <p-select
            id="playlistPosition"
            [(ngModel)]="form.position"
            [options]="positionOptions"
            placeholder="Select position (optional)"
            [showClear]="true"
          ></p-select>
        </div>

        <div class="form-field">
          <label for="playlistFocus">Training Focus</label>
          <p-multiselect
            id="playlistFocus"
            [(ngModel)]="form.focus"
            [options]="focusOptions"
            placeholder="Select focus areas"
            [maxSelectedLabels]="3"
          ></p-multiselect>
        </div>

        <div class="form-field">
          <label>Select Videos</label>
          <p-multiselect
            [(ngModel)]="form.videoIds"
            [options]="videoOptions()"
            optionLabel="label"
            optionValue="value"
            placeholder="Add videos to playlist"
            [filter]="true"
            filterPlaceholder="Search videos..."
            [maxSelectedLabels]="5"
          ></p-multiselect>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <button
          pButton
          label="Cancel"
          class="p-button-text"
          (click)="onCancel()"
        ></button>
        <button
          pButton
          label="Create Playlist"
          icon="pi pi-check"
          (click)="onSubmit()"
          [disabled]="!form.name || form.videoIds.length === 0"
        ></button>
      </ng-template>
    </p-dialog>
  `,
  styles: [
    `
      .playlist-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);

        label {
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }
      }
    `,
  ],
})
export class VideoCurationPlaylistDialogComponent {
  videoOptions = input.required<VideoOption[]>();
  visible = model<boolean>(false);

  submit = output<PlaylistForm>();
  cancel = output<void>();

  positionOptions = POSITION_OPTIONS;
  focusOptions = FOCUS_OPTIONS;

  form: PlaylistForm = {
    name: "",
    description: "",
    position: null,
    focus: [],
    videoIds: [],
  };

  resetForm(): void {
    this.form = {
      name: "",
      description: "",
      position: null,
      focus: [],
      videoIds: [],
    };
  }

  setForm(form: Partial<PlaylistForm>): void {
    this.form = {
      name: form.name || "",
      description: form.description || "",
      position: form.position || null,
      focus: form.focus || [],
      videoIds: form.videoIds || [],
    };
  }

  onSubmit(): void {
    this.submit.emit({ ...this.form });
    this.visible.set(false);
    this.resetForm();
  }

  onCancel(): void {
    this.visible.set(false);
    this.cancel.emit();
    this.resetForm();
  }
}
