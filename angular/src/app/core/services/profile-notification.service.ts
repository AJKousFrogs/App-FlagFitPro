import { Injectable, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";
import { ProfileCompletionService } from "./profile-completion.service";
import { SupabaseService } from "./supabase.service";
import { ToastService } from "./toast.service";

/**
 * ProfileNotificationService
 *
 * Monitors user profile completion and shows persistent notifications
 * until the user completes their profile.
 *
 * This service:
 * 1. Checks profile completion on every login/app load
 * 2. Shows a notification if profile is incomplete
 * 3. Persists until user completes their profile
 * 4. Provides navigation to profile settings
 */
@Injectable({
  providedIn: "root",
})
export class ProfileNotificationService {
  private readonly profileService = inject(ProfileCompletionService);
  private readonly authService = inject(AuthService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  // Track if we've already shown the notification this session
  private readonly hasShownNotification = signal(false);

  // Track if check is in progress
  private readonly isChecking = signal(false);

  /**
   * Check profile completion and show notification if incomplete.
   * Call this on app initialization (after authentication).
   */
  async checkAndNotify(): Promise<void> {
    // Prevent duplicate checks
    if (this.isChecking()) {
      return;
    }

    this.isChecking.set(true);

    try {
      const user = this.authService.getUser();
      if (!user?.id) {
        this.logger.debug(
          "[ProfileNotification] No authenticated user, skipping check"
        );
        return;
      }

      // Load fresh profile data
      await this.profileService.loadProfileData();

      const status = this.profileService.completionStatus();
      const percentage = status.percentage;

      this.logger.info(
        `[ProfileNotification] Profile completion: ${percentage}%, missing: ${status.missingFields.join(", ")}`
      );

      // Show notification if profile is incomplete (less than 100%)
      if (!status.isComplete) {
        this.showIncompleteProfileNotification(status.missingFields, percentage);
      }
    } catch (error) {
      this.logger.error("[ProfileNotification] Error checking profile:", error);
    } finally {
      this.isChecking.set(false);
    }
  }

  /**
   * Show notification for incomplete profile
   */
  private showIncompleteProfileNotification(
    missingFields: string[],
    percentage: number
  ): void {
    // Always show notification for incomplete profiles
    // This ensures users see it on every login until they complete their profile
    const missingCount = missingFields.length;
    const missingList =
      missingFields.length <= 3
        ? missingFields.join(", ")
        : `${missingFields.slice(0, 3).join(", ")} and ${missingFields.length - 3} more`;

    this.toastService.warn(
      `Your profile is ${percentage}% complete. Missing: ${missingList}. Complete your profile for the best experience.`,
      {
        life: 10000, // 10 seconds
        sticky: false,
      }
    );

    // Also save a persistent notification to the database
    this.saveProfileNotificationToDatabase(missingFields, percentage);

    this.hasShownNotification.set(true);
  }

  /**
   * Save a persistent notification to the database
   * This ensures the notification appears in the notification center
   */
  private async saveProfileNotificationToDatabase(
    missingFields: string[],
    percentage: number
  ): Promise<void> {
    const user = this.authService.getUser();
    if (!user?.id) return;

    try {
      // Check if there's already an active profile completion notification
      const { data: existing } = await this.supabaseService.client
        .from("notifications")
        .select("id")
        .eq("user_id", user.id)
        .eq("notification_type", "profile_incomplete")
        .eq("dismissed", false)
        .maybeSingle();

      // If there's already an active notification, update it instead of creating a new one
      if (existing) {
        await this.supabaseService.client
          .from("notifications")
          .update({
            message: `Your profile is ${percentage}% complete. Add your ${missingFields[0]?.toLowerCase() || "missing information"} to unlock all features.`,
            data: {
              percentage,
              missingFields,
              actionRoute: "/settings/profile",
              actionLabel: "Complete Profile",
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        this.logger.debug(
          "[ProfileNotification] Updated existing notification"
        );
      } else {
        // Create new notification
        await this.supabaseService.client.from("notifications").insert({
          user_id: user.id,
          notification_type: "profile_incomplete",
          title: "Complete Your Profile",
          message: `Your profile is ${percentage}% complete. Add your ${missingFields[0]?.toLowerCase() || "missing information"} to unlock all features.`,
          priority: "medium",
          data: {
            percentage,
            missingFields,
            actionRoute: "/settings/profile",
            actionLabel: "Complete Profile",
          },
        });

        this.logger.debug("[ProfileNotification] Created new notification");
      }
    } catch (error) {
      this.logger.warn(
        "[ProfileNotification] Failed to save notification to database:",
        error
      );
    }
  }

  /**
   * Navigate user to profile settings
   */
  goToProfile(): void {
    this.router.navigate(["/settings/profile"]);
  }

  /**
   * Dismiss the incomplete profile notification (marks it as dismissed in DB)
   * Note: This only dismisses for the current session - it will show again on next login
   */
  async dismissNotification(): Promise<void> {
    const user = this.authService.getUser();
    if (!user?.id) return;

    try {
      await this.supabaseService.client
        .from("notifications")
        .update({ dismissed: true })
        .eq("user_id", user.id)
        .eq("notification_type", "profile_incomplete");

      this.logger.debug("[ProfileNotification] Notification dismissed");
    } catch (error) {
      this.logger.warn(
        "[ProfileNotification] Failed to dismiss notification:",
        error
      );
    }
  }

  /**
   * Reset the notification state (call when user logs out)
   */
  reset(): void {
    this.hasShownNotification.set(false);
  }
}
