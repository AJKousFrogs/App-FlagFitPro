import {
  Component,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy,
  effect,
  untracked,
} from "@angular/core";

import { CommonModule } from "@angular/common";
import { AthleteDashboardComponent } from "./athlete-dashboard.component";
import { CoachDashboardComponent } from "./coach-dashboard.component";
import { FeatureWalkthroughComponent } from "../../shared/components/feature-walkthrough/feature-walkthrough.component";
import { AuthService } from "../../core/services/auth.service";
import { HeaderService } from "../../core/services/header.service";
import { LoggerService } from "../../core/services/logger.service";

@Component({
  selector: "app-dashboard",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AthleteDashboardComponent,
    CoachDashboardComponent,
    FeatureWalkthroughComponent,
  ],
  template: `
    @if (userRole() === "coach") {
      <app-coach-dashboard></app-coach-dashboard>
    } @else {
      <app-athlete-dashboard></app-athlete-dashboard>
    }

    <!-- Feature Walkthrough for First-Time Users -->
    @if (showWalkthrough()) {
      <app-feature-walkthrough
        (completed)="onWalkthroughComplete()"
        (skipped)="onWalkthroughSkipped()"
      ></app-feature-walkthrough>
    }
  `,
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private headerService = inject(HeaderService);
  private logger = inject(LoggerService);

  // Signal-based user role computation
  userRole = computed(() => {
    const user = this.authService.currentUser();
    return user?.role || "player";
  });

  // Feature walkthrough state
  showWalkthrough = signal<boolean>(false);

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

    // Check if user should see the walkthrough
    this.checkWalkthroughStatus();
  }

  /**
   * Check if user should see the feature walkthrough
   * Shows for first-time users who haven't completed it
   */
  private checkWalkthroughStatus(): void {
    if (typeof localStorage === "undefined") return;

    const hasCompleted = FeatureWalkthroughComponent.hasCompletedWalkthrough();
    const isFirstLogin = this.isFirstTimeUser();

    if (!hasCompleted && isFirstLogin) {
      // Delay showing walkthrough to let dashboard load first
      setTimeout(() => {
        this.showWalkthrough.set(true);
        this.logger.info(
          "[Dashboard] Showing feature walkthrough for first-time user",
        );
      }, 1500);
    }
  }

  /**
   * Check if this is a first-time user (no training data logged)
   */
  private isFirstTimeUser(): boolean {
    // Check for onboarding completion flag
    const onboardingComplete = localStorage.getItem("onboarding-complete");
    const hasTrainingData = localStorage.getItem("has-training-data");

    // Show walkthrough if:
    // 1. User just completed onboarding (onboarding-complete is recent)
    // 2. OR user has no training data yet
    if (onboardingComplete) {
      const completedDate = new Date(onboardingComplete);
      const now = new Date();
      const daysSinceOnboarding =
        (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24);

      // If onboarding was completed within last 7 days, show walkthrough
      if (daysSinceOnboarding < 7) {
        return true;
      }
    }

    // If no training data has been logged, consider them a first-time user
    return hasTrainingData !== "true";
  }

  /**
   * Handle walkthrough completion
   */
  onWalkthroughComplete(): void {
    this.showWalkthrough.set(false);
    this.logger.info("[Dashboard] Feature walkthrough completed");
  }

  /**
   * Handle walkthrough skip
   */
  onWalkthroughSkipped(): void {
    this.showWalkthrough.set(false);
    this.logger.info("[Dashboard] Feature walkthrough skipped");
  }
}
