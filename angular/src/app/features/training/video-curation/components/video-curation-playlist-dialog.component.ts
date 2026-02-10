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
import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { Textarea } from "primeng/textarea";
import { Select } from "primeng/select";
import { MultiSelect } from "primeng/multiselect";
import { ButtonComponent } from "../../../../shared/components/button/button.component";

import { PlaylistForm, VideoOption } from "../video-curation.models";
import { POSITION_OPTIONS, FOCUS_OPTIONS } from "../video-curation-utils";

@Component({
  selector: "app-video-curation-playlist-dialog",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Dialog,
    
    InputText,
    Textarea,
    Select,
    MultiSelect,
    ButtonComponent,
  ],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [draggable]="false"
      header="Create Playlist"
      class="video-curation-playlist-dialog"
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
            inputId="playlistPosition"
            [(ngModel)]="form.position"
            [options]="positionOptions"
            placeholder="Select position (optional)"
            [showClear]="true"
            [attr.aria-label]="'Select target position for playlist'"
          ></p-select>
        </div>

        <div class="form-field">
          <label for="playlistFocus">Training Focus</label>
          <p-multiselect
            inputId="playlistFocus"
            [(ngModel)]="form.focus"
            [options]="focusOptions"
            placeholder="Select focus areas"
            [maxSelectedLabels]="3"
            [attr.aria-label]="'Select training focus areas'"
          ></p-multiselect>
        </div>

        <div class="form-field">
          <label for="playlistVideos">Select Videos</label>
          <p-multiselect
            inputId="playlistVideos"
            [(ngModel)]="form.videoIds"
            [options]="videoOptions()"
            optionLabel="label"
            optionValue="value"
            placeholder="Add videos to playlist"
            [filter]="true"
            filterPlaceholder="Search videos..."
            [maxSelectedLabels]="5"
            [attr.aria-label]="'Select videos to add to playlist'"
          ></p-multiselect>
        </div>
      </div>

      <ng-template #footer>
        <app-button variant="text" (clicked)="onCancel()">Cancel</app-button>
        <app-button
          iconLeft="pi-check"
          (clicked)="onSubmit()"
          [disabled]="!form.name || form.videoIds.length === 0"
          >Create Playlist</app-button
        >
      </ng-template>
    </p-dialog>
  `,
  styleUrl: "./video-curation-playlist-dialog.component.scss",
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
