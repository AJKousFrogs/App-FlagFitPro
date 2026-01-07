/**
 * Dashboard Skeleton Component
 * 
 * Loading placeholder for player dashboard
 * Matches exact layout of stat cards, weekly progress, and schedule
 * 
 * Evidence: Facebook, LinkedIn use content-specific skeletons for 20-30% perceived performance gain
 * Pattern: Apple Human Interface Guidelines - "Placeholder UI"
 */

import {
  Component,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { SkeletonComponent } from "../skeleton/skeleton.component";

@Component({
  selector: "app-dashboard-skeleton",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SkeletonComponent],
  template: `
    <div class="dashboard-skeleton" aria-label="Loading dashboard...">
      <!-- Header Skeleton -->
      <div class="header-skeleton">
        <app-skeleton variant="text" width="200px" height="32px"></app-skeleton>
        <app-skeleton variant="text" width="300px" height="20px"></app-skeleton>
      </div>

      <!-- Stat Cards Grid (4 cards) -->
      <div class="stats-skeleton">
        @for (i of [1,2,3,4]; track i) {
          <div class="stat-card-skeleton">
            <div class="stat-icon-skeleton">
              <app-skeleton variant="circle" width="48px" height="48px"></app-skeleton>
            </div>
            <div class="stat-content-skeleton">
              <app-skeleton variant="text" width="60px" height="28px"></app-skeleton>
              <app-skeleton variant="text" width="80px" height="16px"></app-skeleton>
            </div>
            <app-skeleton variant="rectangle" width="60px" height="24px" borderRadius="12px"></app-skeleton>
          </div>
        }
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid-skeleton">
        <!-- Weekly Progress Card -->
        <div class="card-skeleton">
          <div class="card-header-skeleton">
            <app-skeleton variant="text" width="140px" height="20px"></app-skeleton>
          </div>
          <div class="progress-skeleton">
            @for (day of [1,2,3,4,5,6,7]; track day) {
              <app-skeleton variant="circle" width="40px" height="40px"></app-skeleton>
            }
          </div>
          <app-skeleton variant="rectangle" width="100%" height="8px" borderRadius="4px"></app-skeleton>
        </div>

        <!-- Today's Schedule Card -->
        <div class="card-skeleton">
          <div class="card-header-skeleton">
            <app-skeleton variant="text" width="140px" height="20px"></app-skeleton>
          </div>
          @for (item of [1,2,3]; track item) {
            <div class="schedule-item-skeleton">
              <app-skeleton variant="circle" width="32px" height="32px"></app-skeleton>
              <div class="schedule-content-skeleton">
                <app-skeleton variant="text" width="120px" height="16px"></app-skeleton>
                <app-skeleton variant="text" width="80px" height="14px"></app-skeleton>
              </div>
            </div>
          }
        </div>

        <!-- Performance Chart Card -->
        <div class="card-skeleton">
          <div class="card-header-skeleton">
            <app-skeleton variant="text" width="180px" height="20px"></app-skeleton>
          </div>
          <app-skeleton variant="rectangle" width="100%" height="180px"></app-skeleton>
        </div>

        <!-- Quick Actions Card -->
        <div class="card-skeleton">
          <div class="card-header-skeleton">
            <app-skeleton variant="text" width="120px" height="20px"></app-skeleton>
          </div>
          <div class="quick-actions-skeleton">
            @for (action of [1,2,3,4]; track action) {
              <app-skeleton variant="rectangle" width="100%" height="48px" borderRadius="8px"></app-skeleton>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: "./dashboard-skeleton.component.scss",
})
export class DashboardSkeletonComponent {}
