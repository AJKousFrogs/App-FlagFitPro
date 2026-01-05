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
    <section class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-video"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalVideos() }}</span>
            <span class="stat-label">Total Videos</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon approved">
            <i class="pi pi-check-circle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ approvedCount() }}</span>
            <span class="stat-label">Approved</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon pending">
            <i class="pi pi-clock"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ pendingCount() }}</span>
            <span class="stat-label">Pending Review</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="pi pi-list"></i>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ playlistCount() }}</span>
            <span class="stat-label">Playlists</span>
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
