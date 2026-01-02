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
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { Chip } from "primeng/chip";

import { InstagramPlaylist } from "../video-curation.models";
import { formatFocus, formatDuration } from "../video-curation-utils";

@Component({
  selector: "app-video-curation-playlists",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TagModule, ButtonModule, TooltipModule, Chip],
  template: `
    <div class="tab-content">
      <div class="playlists-header">
        <h3>Your Playlists</h3>
        <button
          pButton
          label="Create Playlist"
          icon="pi pi-plus"
          (click)="create.emit()"
        ></button>
      </div>

      @if (playlists().length === 0) {
        <div class="empty-state">
          <i class="pi pi-list"></i>
          <h3>No playlists yet</h3>
          <p>Create your first playlist to organize training videos</p>
          <button
            pButton
            label="Create Playlist"
            icon="pi pi-plus"
            (click)="create.emit()"
          ></button>
        </div>
      } @else {
        <div class="playlists-grid">
          @for (playlist of playlists(); track playlist.id) {
            <div class="playlist-card">
              <div class="playlist-header">
                <h4>{{ playlist.name }}</h4>
                @if (playlist.position) {
                  <p-tag [value]="playlist.position" severity="info"></p-tag>
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
                <button
                  pButton
                  icon="pi pi-pencil"
                  class="p-button-text p-button-rounded"
                  pTooltip="Edit"
                  (click)="edit.emit(playlist)"
                ></button>
                <button
                  pButton
                  icon="pi pi-share-alt"
                  class="p-button-text p-button-rounded"
                  pTooltip="Share with team"
                  (click)="share.emit(playlist)"
                ></button>
                <button
                  pButton
                  icon="pi pi-trash"
                  class="p-button-text p-button-rounded p-button-danger"
                  pTooltip="Delete"
                  (click)="delete.emit(playlist)"
                ></button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './video-curation-playlists.component.scss',
})
export class VideoCurationPlaylistsComponent {
  playlists = input.required<InstagramPlaylist[]>();

  create = output<void>();
  edit = output<InstagramPlaylist>();
  share = output<InstagramPlaylist>();
  delete = output<InstagramPlaylist>();

  getFormatFocus(focus: string): string {
    return formatFocus(focus);
  }

  getDuration(seconds: number): string {
    return formatDuration(seconds);
  }
}
