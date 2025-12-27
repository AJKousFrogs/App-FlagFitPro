import {
  Component,
  inject,
  computed,
  ChangeDetectionStrategy,
  effect,
  untracked,
} from "@angular/core";

import { CommonModule } from "@angular/common";
import { AthleteDashboardComponent } from "./athlete-dashboard.component";
import { CoachDashboardComponent } from "./coach-dashboard.component";
import { AuthService } from "../../core/services/auth.service";
import { HeaderService } from "../../core/services/header.service";

@Component({
  selector: "app-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AthleteDashboardComponent,
    CoachDashboardComponent,
  ],
  template: `
    @if (userRole() === "coach") {
      <app-coach-dashboard></app-coach-dashboard>
    } @else {
      <app-athlete-dashboard></app-athlete-dashboard>
    }
  `,
  styles: [
    `
      .dashboard-content {
        padding: var(--space-6);
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: var(--space-6);
      }

      .dashboard-card {
        min-height: 300px;
      }

      .activity-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .activity-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--p-border-radius);
        transition: background 0.2s;
      }

      .activity-item:hover {
        background: var(--p-surface-50);
      }

      .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--p-primary-50);
        color: var(--p-primary-600);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .activity-content {
        flex: 1;
      }

      .activity-title {
        font-weight: 600;
        color: var(--text-primary);
      }

      .activity-time {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .sessions-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .session-item {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-3);
        border-radius: var(--p-border-radius);
        border: 1px solid var(--p-surface-200);
      }

      .session-date {
        text-align: center;
        min-width: 60px;
      }

      .session-day {
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-brand-primary);
      }

      .session-month {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
        text-transform: uppercase;
      }

      .session-info {
        flex: 1;
      }

      .session-title {
        font-weight: 600;
        color: var(--text-primary);
      }

      .session-time {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }
    `,
  ],
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private headerService = inject(HeaderService);

  // Signal-based user role computation
  userRole = computed(() => {
    const user = this.authService.currentUser();
    return user?.role || "player";
  });

  constructor() {
    // Configure header for dashboard using effect (zoneless change detection compatible)
    // Use untracked() to prevent this effect from re-running on signal changes
    // since setDashboardHeader() is a one-time setup, not reactive to user changes
    effect(() => {
      // Read the signal to establish dependency (for future reactivity if needed)
      const _role = this.userRole();
      // Use untracked for the side effect to prevent unnecessary re-runs
      untracked(() => {
        this.headerService.setDashboardHeader();
      });
    });
  }
}
