import { Injectable, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { LoggerService } from "./logger.service";
import { ProfileCompletionService } from "./profile-completion.service";
import { SupabaseService } from "./supabase.service";
import { ToastService } from "./toast.service";
import { isBenignSupabaseQueryError } from "../../shared/utils/error.utils";

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
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly supabaseService = inject(SupabaseService);
  private readonly router = inject(Router);

  // Track if we've already shown the notification this session
  private readonly hasShownNotification = signal(false);

  // Track if check is in progress
  private readonly isChecking = signal(false);
  private notificationsUnavailable = false;
  private notificationsRetryAt = 0;
  private readonly toastSuppressedRoutes = new Set([
    "/dashboard",
    "/player-dashboard",
    "/coach/dashboard",
    "/onboarding",
    "/profile",
    "/settings",
    "/settings/profile",
  ]);

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
      const userId = this.requireCurrentUserId();
      if (!userId) {
        this.logger.debug(
          "[ProfileNotification] No authenticated user, skipping check",
        );
        return;
      }

      // Load fresh profile data
      await this.profileService.loadProfileData();

      const status = this.profileService.completionStatus();
      const percentage = status.percentage;

      this.logger.info(
        `[ProfileNotification] Profile completion: ${percentage}%, missing: ${status.missingFields.join(", ")}`,
      );

      // Show notification if profile is incomplete (less than 100%)
      if (!status.isComplete) {
        this.showIncompleteProfileNotification(
          status.missingFields,
          percentage,
        );
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
    percentage: number,
  ): void {
    const hasLoadedProfileData =
      missingFields.length > 0 &&
      !missingFields.every((field) => field === "Profile not loaded");
    const shouldShowToast =
      hasLoadedProfileData &&
      !this.isOnBlockingProfileRoute() &&
      !this.hasShownNotification();

    const missingList =
      missingFields.length <= 3
        ? missingFields.join(", ")
        : `${missingFields.slice(0, 3).join(", ")} and ${missingFields.length - 3} more`;

    if (shouldShowToast) {
      this.toastService.warn(
        `Your profile is ${percentage}% complete. Missing: ${missingList}. Complete your profile for the best experience.`,
        {
          life: 10000,
          sticky: false,
        },
      );
    }

    if (hasLoadedProfileData) {
      this.saveProfileNotificationToDatabase(missingFields, percentage);
    }

    this.hasShownNotification.set(true);
  }

  private isOnBlockingProfileRoute(): boolean {
    const currentUrl = this.router.url.split("?")[0] ?? "";
    for (const route of this.toastSuppressedRoutes) {
      if (currentUrl === route || currentUrl.startsWith(`${route}/`)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Save a persistent notification to the database
   * This ensures the notification appears in the notification center
   */
  private async saveProfileNotificationToDatabase(
    missingFields: string[],
    percentage: number,
  ): Promise<void> {
    const userId = this.requireCurrentUserId();
    if (!userId || this.shouldBypassNotifications()) return;

    try {
      // Check if there's already an active profile completion notification
      const { data: existing, error: existingError } = await this.supabaseService.client
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("notification_type", "profile_incomplete")
        .eq("dismissed", false)
        .maybeSingle();

      if (existingError) {
        if (isBenignSupabaseQueryError(existingError)) {
          this.markNotificationsUnavailable();
          return;
        }
        throw existingError;
      }

      // If there's already an active notification, update it instead of creating a new one
      if (existing) {
        const { error: updateError } = await this.supabaseService.client
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

        if (updateError) {
          if (isBenignSupabaseQueryError(updateError)) {
            this.markNotificationsUnavailable();
            return;
          }
          throw updateError;
        }

        this.logger.debug(
          "[ProfileNotification] Updated existing notification",
        );
      } else {
        // Create new notification
        const { error: insertError } = await this.supabaseService.client
          .from("notifications")
          .insert({
            user_id: userId,
            notification_type: "profile_incomplete",
            title: "Complete Your Profile",
            message: `Your profile is ${percentage}% complete. Add your ${missingFields[0]?.toLowerCase() || "missing information"} to unlock all features.`,
            priority: "normal",
            data: {
              percentage,
              missingFields,
              actionRoute: "/settings/profile",
              actionLabel: "Complete Profile",
            },
          });

        if (insertError) {
          if (
            isBenignSupabaseQueryError(insertError) ||
            insertError.code === "23505" ||
            Number((insertError as { status?: number }).status) === 409
          ) {
            this.markNotificationsUnavailable();
            return;
          }
          throw insertError;
        }

        this.logger.debug("[ProfileNotification] Created new notification");
      }
    } catch (error) {
      this.logger.warn(
        "[ProfileNotification] Failed to save notification to database:",
        error,
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
    const userId = this.requireCurrentUserId();
    if (!userId || this.shouldBypassNotifications()) return;

    try {
      const { error } = await this.supabaseService.client
        .from("notifications")
        .update({ dismissed: true })
        .eq("user_id", userId)
        .eq("notification_type", "profile_incomplete");

      if (error) {
        if (isBenignSupabaseQueryError(error)) {
          this.markNotificationsUnavailable();
          return;
        }
        throw error;
      }

      this.logger.debug("[ProfileNotification] Notification dismissed");
    } catch (error) {
      this.logger.warn(
        "[ProfileNotification] Failed to dismiss notification:",
        error,
      );
    }
  }

  /**
   * Reset the notification state (call when user logs out)
   */
  reset(): void {
    this.hasShownNotification.set(false);
  }

  private requireCurrentUserId(): string | null {
    return this.supabaseService.userId();
  }

  private shouldBypassNotifications(): boolean {
    if (!this.notificationsUnavailable) {
      return false;
    }

    if (Date.now() >= this.notificationsRetryAt) {
      this.resetNotificationsAvailability();
      return false;
    }

    return true;
  }

  private markNotificationsUnavailable(): void {
    this.notificationsUnavailable = true;
    this.notificationsRetryAt = Date.now() + 30_000;
  }

  private resetNotificationsAvailability(): void {
    this.notificationsUnavailable = false;
    this.notificationsRetryAt = 0;
  }
}
