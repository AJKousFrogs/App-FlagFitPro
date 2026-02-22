/**
 * Video Curation Analytics Component
 *
 * Displays analytics and statistics for video curation.
 */

import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { CommonModule } from "@angular/common";

// PrimeNG
import { Card } from "primeng/card";
import { ProgressBar } from "primeng/progressbar";
import { Avatar } from "primeng/avatar";

import { PositionStat, FocusStat, CreatorStat } from "../video-curation.models";
import { formatFocus } from "../video-curation-utils";

@Component({
  selector: "app-video-curation-analytics",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, Card, ProgressBar, Avatar],
  template: `
    <div class="tab-content">
      <div class="analytics-grid">
        <!-- Most Viewed Videos -->
        <p-card header="Top Videos by Position">
          <div class="analytics-list">
            @for (stat of videosByPosition(); track stat.position) {
              <div class="analytics-item">
                <span
                  class="analytics-label"
                  [id]="'position-label-' + stat.position"
                  >{{ stat.position }}</span
                >
                <p-progressBar
                  [value]="stat.percentage"
                  [showValue]="false"
                  class="analytics-bar"
                  [attr.aria-label]="
                    stat.position +
                    ': ' +
                    stat.count +
                    ' videos (' +
                    stat.percentage +
                    '%)'
                  "
                  [attr.aria-labelledby]="'position-label-' + stat.position"
                ></p-progressBar>
                <span class="analytics-value" aria-hidden="true">{{
                  stat.count
                }}</span>
              </div>
            }
          </div>
        </p-card>

        <!-- Videos by Focus -->
        <p-card header="Videos by Training Focus">
          <div class="analytics-list">
            @for (stat of videosByFocus(); track stat.focus) {
              <div class="analytics-item">
                <span
                  class="analytics-label"
                  [id]="'focus-label-' + stat.focus"
                  >{{ getFormatFocus(stat.focus) }}</span
                >
                <p-progressBar
                  [value]="stat.percentage"
                  [showValue]="false"
                  class="analytics-bar"
                  [attr.aria-label]="
                    getFormatFocus(stat.focus) +
                    ': ' +
                    stat.count +
                    ' videos (' +
                    stat.percentage +
                    '%)'
                  "
                  [attr.aria-labelledby]="'focus-label-' + stat.focus"
                ></p-progressBar>
                <span class="analytics-value" aria-hidden="true">{{
                  stat.count
                }}</span>
              </div>
            }
          </div>
        </p-card>

        <!-- Creator Stats -->
        <p-card header="Top Creators">
          <div class="creator-stats-list">
            @for (creator of topCreators(); track creator.username) {
              <div class="creator-stat-item">
                <p-avatar
                  [label]="creator.displayName.charAt(0)"
                  shape="circle"
                  class="creator-stat-avatar"
                  [ariaLabel]="creator.displayName + ' avatar'"
                ></p-avatar>
                <div class="creator-stat-info">
                  <span class="creator-stat-name">
                    {{ creator.displayName }}
                    @if (creator.verified) {
                      <i
                        class="pi pi-verified"
                        aria-label="Verified creator"
                      ></i>
                    }
                  </span>
                  <span class="creator-stat-count"
                    >{{ creator.videoCount }} videos</span
                  >
                </div>
              </div>
            }
          </div>
        </p-card>
      </div>
    </div>
  `,
  styleUrl: "./video-curation-analytics.component.scss",
})
export class VideoCurationAnalyticsComponent {
  videosByPosition = input.required<PositionStat[]>();
  videosByFocus = input.required<FocusStat[]>();
  topCreators = input.required<CreatorStat[]>();

  getFormatFocus(focus: string): string {
    return formatFocus(focus);
  }
}
