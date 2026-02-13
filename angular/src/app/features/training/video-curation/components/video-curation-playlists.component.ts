/**
 * Video Curation Playlists Component
 *
 * Displays and manages video playlists.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from "@angular/core";
import { CommonModule } from "@angular/common";

// PrimeNG

import { EmptyStateComponent } from "../../../../shared/components/empty-state/empty-state.component";
import { StatusTagComponent } from "../../../../shared/components/status-tag/status-tag.component";

import { Chip } from "primeng/chip";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";

import { InstagramPlaylist } from "../video-curation.models";
import { formatFocus, formatDuration } from "../video-curation-utils";

@Component({
  selector: "app-video-curation-playlists",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    EmptyStateComponent,
    StatusTagComponent,
    Chip,
    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <div class="tab-content">
      <div class="playlists-header">
        <h3>Your Playlists</h3>
        <app-button iconLeft="pi-plus" (clicked)="create.emit()"
          >Create Playlist</app-button
        >
      </div>

      @if (playlists().length === 0) {
        <app-empty-state
          icon="pi-list"
          heading="No playlists yet"
          description="Create your first playlist to organize training videos."
          actionLabel="Create Playlist"
          actionIcon="pi-plus"
          [actionHandler]="createPlaylistHandler"
        />
      } @else {
        <div class="playlists-grid">
          @for (playlist of playlists(); track playlist.id) {
            <div class="playlist-card">
              <div class="playlist-header">
                <h4>{{ playlist.name }}</h4>
                @if (playlist.position) {
                  <app-status-tag
                    [value]="playlist.position"
                    severity="info"
                    size="sm"
                  />
                }
              </div>
              <p class="playlist-description">{{ playlist.description }}</p>
              <div class="playlist-stats">
                <span>
                  <i class="pi pi-video"></i>
                  {{ playlist.videos.length }} videos
                </span>
                <span>
                  <i class="pi pi-clock"></i>
                  {{ getDuration(playlist.totalDuration) }}
                </span>
              </div>
              <div class="playlist-focus">
                @for (focus of playlist.focus; track focus) {
                  <p-chip [label]="getFormatFocus(focus)"></p-chip>
                }
              </div>
              <div class="playlist-actions">
                <app-icon-button
                  icon="pi-pencil"
                  ariaLabel="Edit playlist"
                  tooltip="Edit"
                  (clicked)="edit.emit(playlist)"
                />
                <app-icon-button
                  icon="pi-share-alt"
                  ariaLabel="Share playlist"
                  tooltip="Share with team"
                  (clicked)="share.emit(playlist)"
                />
                <app-icon-button
                  icon="pi-trash"
                  variant="danger"
                  ariaLabel="Delete playlist"
                  tooltip="Delete"
                  (clicked)="delete.emit(playlist)"
                />
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: "./video-curation-playlists.component.scss",
})
export class VideoCurationPlaylistsComponent {
  playlists = input.required<InstagramPlaylist[]>();

  create = output<void>();
  edit = output<InstagramPlaylist>();
  share = output<InstagramPlaylist>();
  delete = output<InstagramPlaylist>();

  readonly createPlaylistHandler = (): void => this.create.emit();

  getFormatFocus(focus: string): string {
    return formatFocus(focus);
  }

  getDuration(seconds: number): string {
    return formatDuration(seconds);
  }
}
