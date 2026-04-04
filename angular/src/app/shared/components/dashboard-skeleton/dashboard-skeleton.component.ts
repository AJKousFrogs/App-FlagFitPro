/**
 * Dashboard Skeleton Component
 *
 * Loading placeholder for player dashboard
 * Matches exact layout of stat cards, weekly progress, and schedule
 *
 * Evidence: Facebook, LinkedIn use content-specific skeletons for 20-30% perceived performance gain
 * Pattern: Apple Human Interface Guidelines - "Placeholder UI"
 */

import { Component, ChangeDetectionStrategy } from "@angular/core";
import { SkeletonComponent } from "../skeleton/skeleton.component";

@Component({
  selector: "app-dashboard-skeleton",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkeletonComponent],
  template: `
    <div class="dashboard-skeleton" aria-label="Loading dashboard...">
      <!-- Header Skeleton -->
      <div class="header-skeleton">
        <app-skeleton
          variant="text"
          width="var(--size-200)"
          height="var(--space-8)"
        ></app-skeleton>
        <app-skeleton
          variant="text"
          width="calc(var(--size-150) * 2)"
          height="var(--space-5)"
        ></app-skeleton>
      </div>

      <!-- Stat Cards Grid (4 cards) -->
      <div class="stats-skeleton">
        @for (i of [1, 2, 3, 4]; track i) {
          <div class="stat-card-skeleton">
            <div class="stat-icon-skeleton">
              <app-skeleton
                variant="circle"
                width="var(--icon-container-lg)"
                height="var(--icon-container-lg)"
              ></app-skeleton>
            </div>
            <div class="stat-content-skeleton">
              <app-skeleton
                variant="text"
                width="calc(var(--size-120) * 0.5)"
                height="calc(var(--space-5) + var(--space-2))"
              ></app-skeleton>
              <app-skeleton
                variant="text"
                width="var(--size-80)"
                height="var(--space-4)"
              ></app-skeleton>
            </div>
            <app-skeleton
              variant="rectangle"
              width="calc(var(--size-120) * 0.5)"
              height="var(--space-6)"
              borderRadius="var(--radius-xl)"
            ></app-skeleton>
          </div>
        }
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid-skeleton">
        <!-- Weekly Progress Card -->
        <div class="card-skeleton">
          <div class="card-header-skeleton">
            <app-skeleton
              variant="text"
              width="calc(var(--size-100) + var(--space-10))"
              height="var(--space-5)"
            ></app-skeleton>
          </div>
          <div class="progress-skeleton">
            @for (day of [1, 2, 3, 4, 5, 6, 7]; track day) {
              <app-skeleton
                variant="circle"
                width="var(--icon-container-md)"
                height="var(--icon-container-md)"
              ></app-skeleton>
            }
          </div>
          <app-skeleton
            variant="rectangle"
            width="100%"
            height="var(--space-2)"
            borderRadius="var(--radius-sm)"
          ></app-skeleton>
        </div>

        <!-- Today's Schedule Card -->
        <div class="card-skeleton">
          <div class="card-header-skeleton">
            <app-skeleton
              variant="text"
              width="calc(var(--size-100) + var(--space-10))"
              height="var(--space-5)"
            ></app-skeleton>
          </div>
          @for (item of [1, 2, 3]; track item) {
            <div class="schedule-item-skeleton">
              <app-skeleton
                variant="circle"
                width="var(--space-8)"
                height="var(--space-8)"
              ></app-skeleton>
              <div class="schedule-content-skeleton">
                <app-skeleton
                  variant="text"
                  width="var(--size-120)"
                  height="var(--space-4)"
                ></app-skeleton>
                <app-skeleton
                  variant="text"
                  width="var(--size-80)"
                  height="var(--ds-font-size-sm)"
                ></app-skeleton>
              </div>
            </div>
          }
        </div>

        <!-- Performance Chart Card -->
        <div class="card-skeleton">
          <div class="card-header-skeleton">
            <app-skeleton
              variant="text"
              width="calc(var(--size-200) * 0.9)"
              height="var(--space-5)"
            ></app-skeleton>
          </div>
          <app-skeleton
            variant="rectangle"
            width="100%"
            height="calc(var(--size-200) * 0.9)"
          ></app-skeleton>
        </div>

        <!-- Quick Actions Card -->
        <div class="card-skeleton">
          <div class="card-header-skeleton">
            <app-skeleton
              variant="text"
              width="var(--size-120)"
              height="var(--space-5)"
            ></app-skeleton>
          </div>
          <div class="quick-actions-skeleton">
            @for (action of [1, 2, 3, 4]; track action) {
              <app-skeleton
                variant="rectangle"
                width="100%"
                height="var(--icon-container-lg)"
                borderRadius="var(--radius-lg)"
              ></app-skeleton>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: "./dashboard-skeleton.component.scss",
})
export class DashboardSkeletonComponent {}
