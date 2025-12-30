/**
 * Video Curation Playlists Component
 *
 * Displays and manages video playlists.
 */

import { Component, ChangeDetectionStrategy, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";

// PrimeNG
import { TagModule } from "primeng/tag";
import { ButtonModule } from "primeng/button";
import { TooltipModule } from "primeng/tooltip";
import { ChipModule } from "primeng/chip";

import { InstagramPlaylist } from "../video-curation.models";
import { formatFocus, formatDuration } from "../video-curation-utils";

@Component({
  selector: "app-video-curation-playlists",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TagModule, ButtonModule, TooltipModule, ChipModule],
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
  styles: [
    `
      .tab-content {
        padding: var(--space-4) 0;
      }

      .playlists-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-4);

        h3 {
          font-size: var(--font-heading-md);
          font-weight: var(--font-weight-semibold);
          margin: 0;
        }
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
          margin: 0 0 var(--space-4);
        }
      }

      .playlists-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--space-4);
      }

      .playlist-card {
        background: var(--surface-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-xl);
        padding: var(--space-5);
      }

      .playlist-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-3);

        h4 {
          font-size: var(--font-body-lg);
          font-weight: var(--font-weight-semibold);
          margin: 0;
          color: var(--color-text-primary);
        }
      }

      .playlist-description {
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
        margin: 0 0 var(--space-3);
      }

      .playlist-stats {
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
      }

      .playlist-focus {
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
        margin-bottom: var(--space-4);
      }

      .playlist-actions {
        display: flex;
        gap: var(--space-1);
        justify-content: flex-end;
      }

      @media (max-width: 768px) {
        .playlists-grid {
          grid-template-columns: 1fr;
          gap: var(--space-3);
        }

        .playlist-card {
          padding: var(--space-3);
        }
      }

      @media (min-width: 1400px) {
        .playlists-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }
    `,
  ],
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

