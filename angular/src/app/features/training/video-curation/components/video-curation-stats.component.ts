/**
 * Video Curation Stats Component
 *
 * Displays overview statistics for the video curation dashboard.
 */

import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-video-curation-stats",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <section class="stats-section" aria-label="Video curation statistics">
      <div class="stats-grid">
        <div class="stat-card" role="group" aria-labelledby="stat-total-label">
          <div class="stat-icon" aria-hidden="true">
            <i class="pi pi-video"></i>
          </div>
          <div class="stat-content stat-block__content">
            <span class="stat-block__value">{{ totalVideos() }}</span>
            <span class="stat-block__label" id="stat-total-label">Total Videos</span>
          </div>
        </div>
        <div class="stat-card" role="group" aria-labelledby="stat-approved-label">
          <div class="stat-icon approved" aria-hidden="true">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-content stat-block__content">
            <span class="stat-block__value">{{ approvedCount() }}</span>
            <span class="stat-block__label" id="stat-approved-label">Approved</span>
          </div>
        </div>
        <div class="stat-card" role="group" aria-labelledby="stat-pending-label">
          <div class="stat-icon pending" aria-hidden="true">
            <i class="pi pi-clock"></i>
          </div>
          <div class="stat-content stat-block__content">
            <span class="stat-block__value">{{ pendingCount() }}</span>
            <span class="stat-block__label" id="stat-pending-label">Pending Review</span>
          </div>
        </div>
        <div class="stat-card" role="group" aria-labelledby="stat-playlists-label">
          <div class="stat-icon" aria-hidden="true">
            <i class="pi pi-list"></i>
          </div>
          <div class="stat-content stat-block__content">
            <span class="stat-block__value">{{ playlistCount() }}</span>
            <span class="stat-block__label" id="stat-playlists-label">Playlists</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrl: "./video-curation-stats.component.scss",
})
export class VideoCurationStatsComponent {
  totalVideos = input.required<number>();
  approvedCount = input.required<number>();
  pendingCount = input.required<number>();
  playlistCount = input.required<number>();
}
