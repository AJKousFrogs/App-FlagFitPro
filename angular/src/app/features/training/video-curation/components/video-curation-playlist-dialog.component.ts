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
import { AppDialogComponent } from "../../../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../../../shared/components/dialog-header/dialog-header.component";
import { InputText } from "primeng/inputtext";
import { Textarea } from "primeng/textarea";
import { Select } from "primeng/select";
import { MultiSelect } from "primeng/multiselect";

import { PlaylistForm, VideoOption } from "../video-curation.models";
import { POSITION_OPTIONS, FOCUS_OPTIONS } from "../video-curation-utils";

@Component({
  selector: "app-video-curation-playlist-dialog",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
    InputText,
    Textarea,
    Select,
    MultiSelect,
  ],
  template: `
    <app-dialog
      [visible]="visible()"
      (visibleChange)="visible.set($event)"
      [modal]="true"
      [blockScroll]="true"
      [draggable]="false"
      ariaLabel="Create playlist"
      class="video-curation-playlist-dialog"
    >
      <app-dialog-header
        dialogHeader
        icon="list"
        title="Create Playlist"
        (close)="onCancel()"
      />
      <div class="playlist-form">
        <div class="form-field">
          <label for="playlistName">Playlist Name</label>
          <input
            id="playlistName"
            type="text"
            pInputText
            [value]="form.name"
            (input)="onNameInput($event)"
            placeholder="e.g., QB Pre-Game Drills"
          />
        </div>

        <div class="form-field">
          <label for="playlistDescription">Description</label>
          <textarea
            id="playlistDescription"
            pTextarea
            [value]="form.description"
            (input)="onDescriptionInput($event)"
            [rows]="3"
            placeholder="Describe this playlist..."
          ></textarea>
        </div>

        <div class="form-field">
          <label for="playlistPosition">Target Position</label>
          <p-select
            inputId="playlistPosition"
            [ngModel]="form.position"
            (onChange)="onPositionChange($event.value)"
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
            [ngModel]="form.focus"
            (onChange)="onFocusChange($event.value)"
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
            [ngModel]="form.videoIds"
            (onChange)="onVideoIdsChange($event.value)"
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

      <app-dialog-footer
        dialogFooter
        cancelLabel="Cancel"
        primaryLabel="Create Playlist"
        [disabled]="!form.name || form.videoIds.length === 0"
        (cancel)="onCancel()"
        (primary)="onSubmit()"
      />
    </app-dialog>
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

  onNameInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.form.name = input?.value ?? "";
  }

  onDescriptionInput(event: Event): void {
    const input = event.target as HTMLTextAreaElement | null;
    this.form.description = input?.value ?? "";
  }

  onPositionChange(value: PlaylistForm["position"] | undefined): void {
    this.form.position = value ?? null;
  }

  onFocusChange(value: PlaylistForm["focus"] | undefined): void {
    this.form.focus = value ?? [];
  }

  onVideoIdsChange(value: string[] | null | undefined): void {
    this.form.videoIds = value ?? [];
  }
}
