/**
 * Video Curation Analytics Component
 *
 * Displays analytics and statistics for video curation.
 */

import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { CommonModule } from "@angular/common";

// PrimeNG
import { ProgressBarComponent } from "../../../../shared/components/progress-bar/progress-bar.component";
import { AvatarComponent } from "../../../../shared/components/avatar/avatar.component";

import { PositionStat, FocusStat, CreatorStat } from "../video-curation.models";
import { formatFocus } from "../video-curation-utils";
import { CardShellComponent } from "../../../../shared/components/card-shell/card-shell.component";

@Component({
  selector: "app-video-curation-analytics",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardShellComponent, ProgressBarComponent, AvatarComponent],
  template: `
    <div class="tab-content">
      <div class="analytics-grid">
        <!-- Most Viewed Videos -->
        <app-card-shell title="Top Videos by Position" class="analytics-card">
          <div class="analytics-list">
            @for (stat of videosByPosition(); track stat.position) {
              <div class="analytics-item">
                <span
                  class="analytics-label"
                  [id]="'position-label-' + stat.position"
                  >{{ stat.position }}</span
                >
                <app-progress-bar
                  [value]="stat.percentage"
                  [showValue]="false"
                  styleClass="analytics-bar"
                />
                <span class="analytics-value" aria-hidden="true">{{
                  stat.count
                }}</span>
              </div>
            }
          </div>
        </app-card-shell>

        <!-- Videos by Focus -->
        <app-card-shell
          title="Videos by Training Focus"
          class="analytics-card"
        >
          <div class="analytics-list">
            @for (stat of videosByFocus(); track stat.focus) {
              <div class="analytics-item">
                <span
                  class="analytics-label"
                  [id]="'focus-label-' + stat.focus"
                  >{{ getFormatFocus(stat.focus) }}</span
                >
                <app-progress-bar
                  [value]="stat.percentage"
                  [showValue]="false"
                  styleClass="analytics-bar"
                />
                <span class="analytics-value" aria-hidden="true">{{
                  stat.count
                }}</span>
              </div>
            }
          </div>
        </app-card-shell>

        <!-- Creator Stats -->
        <app-card-shell title="Top Creators" class="analytics-card">
          <div class="creator-stats-list">
            @for (creator of topCreators(); track creator.username) {
              <div class="creator-stat-item">
                <app-avatar
                  [label]="creator.displayName.charAt(0)"
                  shape="circle"
                  styleClass="creator-stat-avatar"
                  [ariaLabel]="creator.displayName + ' avatar'"
                />
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
        </app-card-shell>
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
