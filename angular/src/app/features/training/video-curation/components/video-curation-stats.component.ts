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
  styles: [
    `
      .stats-section {
        margin-bottom: var(--space-6);
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-4);
      }

      .stat-card {
        background: var(--surface-primary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-xl);
        padding: var(--space-5);
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-lg);
        background: var(--color-brand-primary-subtle);
        color: var(--color-brand-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--icon-xl);
      }

      .stat-icon.approved {
        background: var(--color-status-success-light);
        color: var(--color-status-success);
      }

      .stat-icon.pending {
        background: var(--color-status-warning-light);
        color: var(--color-status-warning);
      }

      .stat-content {
        display: flex;
        flex-direction: column;
      }

      .stat-value {
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .stat-label {
        font-size: var(--font-body-sm);
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class VideoCurationStatsComponent {
  totalVideos = input.required<number>();
  approvedCount = input.required<number>();
  pendingCount = input.required<number>();
  playlistCount = input.required<number>();
}
