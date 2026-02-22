import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    inject,
    signal,
} from "@angular/core";

import { CommonModule } from "@angular/common";
import { Router, RouterModule } from "@angular/router";

import { Card } from "primeng/card";
import { ProgressBar } from "primeng/progressbar";
import { Step, StepList, Stepper } from "primeng/stepper";
import { firstValueFrom } from "rxjs";
import { UI_LIMITS } from "../../core/constants/app.constants";
import { TOAST } from "../../core/constants/toast-messages.constants";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import {
    LoggerService,
    toLogContext,
} from "../../core/services/logger.service";
import { PlatformService } from "../../core/services/platform.service";
import {
    PlayerProgramService,
    getProgramIdForPosition,
    normalizePositionForModifiers,
} from "../../core/services/player-program.service";
import { ToastService } from "../../core/services/toast.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { RosterService } from "../roster/roster.service";
import { OnboardingDataService } from "./services/onboarding-data.service";
import { OnboardingStateService } from "./services/onboarding-state.service";
import { OnboardingStepPersonalComponent } from "./steps/onboarding-step-personal.component";
import { OnboardingStepRoleComponent } from "./steps/onboarding-step-role.component";
import { OnboardingStepPhysicalComponent } from "./steps/onboarding-step-physical.component";
import { OnboardingStepHealthComponent } from "./steps/onboarding-step-health.component";
import { OnboardingStepEquipmentComponent } from "./steps/onboarding-step-equipment.component";
import { OnboardingStepGoalsComponent } from "./steps/onboarding-step-goals.component";
import { OnboardingStepScheduleComponent } from "./steps/onboarding-step-schedule.component";
import { OnboardingStepRecoveryComponent } from "./steps/onboarding-step-recovery.component";
import { OnboardingStepSummaryComponent } from "./steps/onboarding-step-summary.component";

@Component({
  selector: "app-onboarding",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    Card,
    Stepper,
    StepList,
    Step,
    ProgressBar,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    OnboardingStepPersonalComponent,
    OnboardingStepRoleComponent,
    OnboardingStepPhysicalComponent,
    OnboardingStepHealthComponent,
    OnboardingStepEquipmentComponent,
    OnboardingStepGoalsComponent,
    OnboardingStepScheduleComponent,
    OnboardingStepRecoveryComponent,
    OnboardingStepSummaryComponent,
  ],
  templateUrl: "./onboarding.component.html",
  styleUrl: "./onboarding.component.scss",
})
export class OnboardingComponent implements OnInit, OnDestroy {
  readonly state = inject(OnboardingStateService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private onboardingDataService = inject(OnboardingDataService);
  private logger = inject(LoggerService);
  private playerProgramService = inject(PlayerProgramService);
  private rosterService = inject(RosterService);
  private api = inject(ApiService);
  private platform = inject(PlatformService);

  isCompleting = signal(false);
  isLoading = signal(true);
  isEmailVerified = signal(false);
  isResendingVerification = signal(false);

  // Max date for DOB (must be at least 13 years old)
  maxDate = new Date(new Date().setFullYear(new Date().getFullYear() - 13));
  minDate = new Date(new Date().setFullYear(new Date().getFullYear() - 80));

  // Check if current step is the summary step (last step)
  isSummaryStep(): boolean {
    return this.state.currentStep() === this.state.steps().length - 1;
  }

  async ngOnInit(): Promise<void> {
    // Load saved draft first
    if (this.state.loadDraft()) {
      this.toastService.info(
        "Your previous progress has been restored",
        "Welcome back!",
      );
    }

    // Check email verification status
    await this.checkEmailVerification();

    // Set up listeners for email verification from other tabs
    this.setupEmailVerificationListeners();

    // Load teams from database
    await this.state.loadTeams();

    // Then load user profile
    await this.loadUserProfile();
  }

  /**
   * Check if current user's email is verified
   */
  async checkEmailVerification(): Promise<void> {
    try {
      // Refresh session to get latest verification status
      const { data, error } = await this.onboardingDataService.getAuthUser();

      if (error) {
        this.logger.error(
          "[Onboarding] Error checking email verification:",
          error,
        );
        return;
      }

      const isVerified = !!data?.user?.email_confirmed_at;
      this.isEmailVerified.set(isVerified);

      if (isVerified) {
        this.logger.info("[Onboarding] Email is verified");
      } else {
        this.logger.info("[Onboarding] Email not yet verified");
      }
    } catch (error) {
      this.logger.error(
        "[Onboarding] Error checking email verification:",
        error,
      );
    }
  }

  /**
   * Resend verification email to the user
   */
  async resendVerificationEmail(): Promise<void> {
    this.isResendingVerification.set(true);
    try {
      const user = this.onboardingDataService.getCurrentUser();
      if (!user?.email) {
        this.toastService.error(
          "No email address found. Please try logging in again.",
        );
        return;
      }

      const { error } =
        await this.onboardingDataService.resendVerificationEmail(user.email);

      if (error) {
        throw error;
      }

      this.toastService.success(
        "Verification email sent! Please check your inbox.",
        "Email Sent",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to resend verification email";
      this.toastService.error(message);
    } finally {
      this.isResendingVerification.set(false);
    }
  }

  /**
   * Refresh email verification status (user can click after verifying)
   */
  async refreshVerificationStatus(): Promise<void> {
    await this.checkEmailVerification();
    if (this.isEmailVerified()) {
      this.toastService.success(
        "Email verified! You can now continue.",
        "Verified",
      );
    } else {
      this.toastService.info(
        "Email not yet verified. Please check your inbox and click the verification link.",
      );
    }
  }

  // BroadcastChannel for cross-tab communication
  private authChannel: BroadcastChannel | null = null;
  private storageListener: ((event: StorageEvent) => void) | null = null;

  /**
   * Set up listeners for email verification from other tabs
   */
  private setupEmailVerificationListeners(): void {
    // Listen via BroadcastChannel API
    try {
      this.authChannel = new BroadcastChannel("flagfit-auth");
      this.authChannel.onmessage = async (event) => {
        if (event.data?.type === "EMAIL_VERIFIED") {
          this.logger.info(
            "[Onboarding] Received email verification broadcast",
          );
          await this.checkEmailVerification();
          if (this.isEmailVerified()) {
            this.toastService.success(
              "Email verified! You can now continue.",
              "Verified",
            );
          }
        }
      };
    } catch {
      this.logger.debug("[Onboarding] BroadcastChannel not supported");
    }

    // Also listen to localStorage changes as fallback
    this.storageListener = async (event: StorageEvent) => {
      if (event.key === "flagfit_email_verified" && event.newValue) {
        this.logger.info(
          "[Onboarding] Detected email verification via storage",
        );
        await this.checkEmailVerification();
        if (this.isEmailVerified()) {
          this.toastService.success(
            "Email verified! You can now continue.",
            "Verified",
          );
        }
        // Clear the flag
        this.platform.removeLocalStorage("flagfit_email_verified");
      }
    };
    window.addEventListener("storage", this.storageListener);
  }

  /**
   * Clean up email verification listeners
   */
  private cleanupEmailVerificationListeners(): void {
    if (this.authChannel) {
      this.authChannel.close();
      this.authChannel = null;
    }
    if (this.storageListener) {
      window.removeEventListener("storage", this.storageListener);
      this.storageListener = null;
    }
  }

  ngOnDestroy(): void {
    // Save draft when leaving
    this.state.saveDraft();

    // Clean up listeners
    this.cleanupEmailVerificationListeners();
  }

  private async loadUserProfile(): Promise<void> {
    this.isLoading.set(true);
    try {
      const user = this.onboardingDataService.getCurrentUser();
      if (!user) {
        this.router.navigate(["/login"]);
        return;
      }

      // Per audit: use maybeSingle() since user profile may not exist yet (avoids 406)
      if (!user.email) {
        this.logger.warn("[Onboarding] User email missing for profile lookup");
        return;
      }

      const { data, error } =
        await this.onboardingDataService.fetchUserProfileByEmail(user.email);

      if (data && !error) {
        this.state.formData.name =
          data.full_name ||
          `${data.first_name || ""} ${data.last_name || ""}`.trim();
        this.state.formData.position = data.position ?? null;
        this.state.formData.experience = data.experience_level ?? null;
      }
    } catch (error) {
      this.logger.error("Failed to load user profile:", error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Check if onboarding can be completed (all required consents accepted) */
  canCompleteOnboarding(): boolean {
    // Must be on the summary step (last step for both player and staff)
    if (!this.isSummaryStep()) {
      return false;
    }

    // All required consents must be accepted
    return (
      this.state.formData.consentTermsOfService &&
      this.state.formData.consentPrivacyPolicy &&
      this.state.formData.consentDataUsage
    );
  }

  validateCurrentStep(): { valid: boolean; message?: string } {
    const step = this.state.currentStep();

    switch (step) {
      case 0: // Personal Info
        if (!this.state.formData.name?.trim()) {
          return { valid: false, message: "Please enter your full name" };
        }
        if (!this.state.formData.dateOfBirth) {
          return { valid: false, message: "Please select your date of birth" };
        }
        if (!this.state.formData.country) {
          return { valid: false, message: "Please select your country" };
        }
        // Check email verification before allowing to proceed
        if (!this.isEmailVerified()) {
          return {
            valid: false,
            message:
              "Please verify your email address before continuing. Check your inbox for a verification link.",
          };
        }
        return { valid: true };

      case 1: // User Type & Role
        if (!this.state.formData.team) {
          return { valid: false, message: "Please select your team" };
        }
        // Staff validation
        if (this.state.formData.userType === "staff") {
          if (!this.state.formData.staffRole) {
            return { valid: false, message: "Please select your staff role" };
          }
          return { valid: true };
        }
        // Player validation
        if (!this.state.formData.position) {
          return {
            valid: false,
            message: "Please select your primary position",
          };
        }
        if (!this.state.formData.experience) {
          return {
            valid: false,
            message: "Please select your experience level",
          };
        }
        if (this.state.isQBSelected() && !this.state.formData.throwingArm) {
          return { valid: false, message: "Please select your throwing arm" };
        }
        return { valid: true };

      case 2: // Physical Measurements
        if (this.state.formData.unitSystem === "metric") {
          if (!this.state.formData.heightCm) {
            return { valid: false, message: "Please enter your height" };
          }
          if (!this.state.formData.weightKg) {
            return { valid: false, message: "Please enter your weight" };
          }
        } else {
          if (!this.state.formData.heightFt && !this.state.formData.heightIn) {
            return { valid: false, message: "Please enter your height" };
          }
          if (!this.state.formData.weightLbs) {
            return { valid: false, message: "Please enter your weight" };
          }
        }
        return { valid: true };

      case 5: // Goals
        if (this.state.formData.goals.length === 0) {
          return {
            valid: false,
            message: "Please select at least one training goal",
          };
        }
        return { valid: true };

      case 6: // Schedule
        if (!this.state.formData.scheduleType) {
          return { valid: false, message: "Please select your schedule type" };
        }
        return { valid: true };

      case 8: // Summary & Consent
        if (!this.state.formData.consentTermsOfService) {
          return {
            valid: false,
            message: "Please accept the Terms of Service",
          };
        }
        if (!this.state.formData.consentPrivacyPolicy) {
          return {
            valid: false,
            message: "Please accept the Privacy Policy",
          };
        }
        if (!this.state.formData.consentDataUsage) {
          return {
            valid: false,
            message: "Please consent to data usage for personalized training",
          };
        }
        return { valid: true };

      default:
        return { valid: true };
    }
  }


  onConsentChange(consentType: string, event: { checked?: boolean }): void {
    const isChecked = event.checked ?? false;
    this.logger.debug(`Consent ${consentType} changed`, { checked: isChecked });

    // Manually update the value to ensure it's set
    switch (consentType) {
      case "Terms of Service":
        this.state.formData.consentTermsOfService = isChecked;
        break;
      case "Privacy Policy":
        this.state.formData.consentPrivacyPolicy = isChecked;
        break;
      case "Data Usage":
        this.state.formData.consentDataUsage = isChecked;
        break;
      case "Merlin AI":
        this.state.formData.consentAICoach = isChecked;
        break;
      case "Email Updates":
        this.state.formData.consentEmailUpdates = isChecked;
        break;
    }
    // Signal-based components don't need manual change detection
    this.state.saveDraft();
  }

  /**
   * Navigate to a specific step when user clicks on a step number
   */
  onStepperChange(event: number | Event | undefined): void {
    const targetIndex = typeof event === "number" ? event : undefined;
    if (!this.state.goToStep(targetIndex)) {
      this.toastService.info(TOAST.INFO.COMPLETE_CURRENT_STEP);
    }
  }

  // Wrapper for next step with validation (used by Next button)
  nextStep(): void {
    const validation = this.validateCurrentStep();
    if (!validation.valid) {
      this.toastService.warn(
        validation.message || "Please complete all required fields",
      );
      return;
    }
    this.state.nextStep();
  }

  // Convert imperial to metric for storage (database always stores metric)
  private getHeightInCm(): number | null {
    if (this.state.formData.unitSystem === "metric") {
      return this.state.formData.heightCm;
    } else {
      if (this.state.formData.heightFt || this.state.formData.heightIn) {
        const totalInches =
          (this.state.formData.heightFt || 0) * 12 +
          (this.state.formData.heightIn || 0);
        return Math.round(totalInches * 2.54);
      }
      return null;
    }
  }

  private getWeightInKg(): number | null {
    if (this.state.formData.unitSystem === "metric") {
      return this.state.formData.weightKg;
    } else {
      if (this.state.formData.weightLbs) {
        return Math.round(this.state.formData.weightLbs * 0.453592 * 10) / 10;
      }
      return null;
    }
  }

  async completeOnboarding(): Promise<void> {
    this.isCompleting.set(true);

    try {
      const user = this.onboardingDataService.getCurrentUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const nameParts = this.state.formData.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // For staff, don't save player-specific data
      const isStaffUser = this.state.isStaff();

      // Convert to metric for storage (database always stores in metric)
      const heightCm = isStaffUser ? null : this.getHeightInCm();
      const weightKg = isStaffUser ? null : this.getWeightInKg();

      // Prepare user profile data - different for staff vs players
      // Note: user_type, staff_role, staff_visibility are stored in auth.users metadata
      // and team_members.role, NOT in the users table
      const profileData = {
        full_name: this.state.formData.name,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: this.state.formData.dateOfBirth
          ?.toISOString()
          .split("T")[0],
        gender: this.state.formData.gender,
        country: this.state.formData.country,
        phone: this.state.formData.phone || null,
        team: this.state.formData.team,
        // Player-specific fields (null for staff)
        position: isStaffUser ? null : this.state.formData.position,
        secondary_position: isStaffUser
          ? null
          : this.state.formData.secondaryPosition,
        throwing_arm: isStaffUser ? null : this.state.formData.throwingArm,
        experience_level: isStaffUser ? null : this.state.formData.experience,
        jersey_number: isStaffUser ? null : this.state.formData.jerseyNumber,
        height_cm: heightCm,
        weight_kg: weightKg,
        preferred_units: isStaffUser ? null : this.state.formData.unitSystem,
        updated_at: new Date().toISOString(),
      };

      // Update user profile with onboarding_completed flag
      const profileDataWithOnboarding = {
        ...profileData,
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      };

      const { error: updateError } =
        await this.onboardingDataService.updateUserProfileByEmail(
          user.email ?? "",
          profileDataWithOnboarding,
        );

      if (updateError) {
        const { error: insertError } =
          await this.onboardingDataService.insertUserProfile({
            email: user.email,
            ...profileDataWithOnboarding,
            is_active: true,
            email_verified: true,
          });

        if (insertError) {
          throw new Error(`Failed to save profile: ${insertError.message}`);
        }
      }

      // Update auth user_metadata with role for dashboard routing
      // Map user_type to appropriate role for auth metadata
      const authRole = isStaffUser
        ? this.state.formData.staffRole === "head_coach"
          ? "coach"
          : this.state.formData.staffRole === "assistant_coach"
            ? "assistant_coach"
            : this.state.formData.staffRole || "coach"
        : "player";

      await this.onboardingDataService.updateAuthUser({
        data: {
          role: authRole,
          user_type: this.state.formData.userType,
          full_name: this.state.formData.name,
        },
      });

      // Player-only: Save training preferences and assign program
      if (!isStaffUser) {
        // Save training preferences (schedule, mobility, recovery)
        await this.saveTrainingPreferences(user.email ?? "");

        // Save current injuries to wellness_checkins table
        await this.saveCurrentInjuries(user.id);

        // Create athlete_training_config for daily-protocol position modifiers
        // This maps UI position values to normalized database keys
        await this.createAthleteTrainingConfig(user.id);

        // BLOCKER B ENFORCEMENT: Assign training program based on position
        // This is now MANDATORY - every athlete must have a real plan
        const assignmentResult = await this.assignTrainingProgram();

        if (!assignmentResult) {
          this.logger.error(
            "[Onboarding] Program assignment FAILED - this is a critical error",
          );

          // Show user a warning but allow completion
          // They can still access the app and admin can assign program later
          this.toastService.warn(
            "Training program assignment is pending. You can still access the app, but your personalized plan may not be ready yet. Please contact support if this persists.",
            "Setup Incomplete",
          );

          // Set flag for dashboard to show program assignment prompt
          this.platform.setSessionStorage("programAssignmentPending", "true");

          // Log error details for debugging but don't block onboarding
          this.logger.error(
            "[Onboarding] Allowing user to proceed without program assignment",
            { position: this.state.formData.position },
          );
        }

        // Add player to team roster
        if (this.state.formData.team) {
          await this.addPlayerToTeamRoster(user.id);
        }

        // Always set flag to refresh program assignment on dashboard
        // This ensures the dashboard checks for the program even if assignment had issues
        this.platform.setSessionStorage("refreshProgramAssignment", "true");
      } else {
        // Staff-only: Add staff member to team roster with appropriate role
        if (this.state.formData.team) {
          await this.addStaffToTeamRoster(user.id);
        }
      }

      // Clear the draft after successful completion
      this.state.clearDraft();

      const successMessage = isStaffUser
        ? "Your staff profile has been set up!"
        : "Your profile and training preferences have been set up!";

      this.toastService.success(successMessage, "Welcome to FlagFit Pro!");

      setTimeout(() => {
        // Check for post-onboarding redirect (e.g., team invitation)
        const postOnboardingRedirect = this.platform.getSessionStorage(
          "postOnboardingRedirect",
        );
        if (postOnboardingRedirect) {
          this.platform.removeSessionStorage("postOnboardingRedirect");
          this.router.navigateByUrl(postOnboardingRedirect);
        } else {
          // Redirect based on user type
          if (isStaffUser) {
            this.router.navigate(["/coach/team"]);
          } else {
            this.router.navigate(["/dashboard"]);
          }
        }
      }, 1000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to complete setup. Please try again.";
      this.toastService.error(message);
    } finally {
      this.isCompleting.set(false);
    }
  }

  private async saveTrainingPreferences(email: string): Promise<void> {
    try {
      const preferences = {
        email: email,
        schedule_type: this.state.formData.scheduleType,
        practices_per_week: this.state.formData.practicesPerWeek,
        practice_days: this.state.formData.practiceDays,
        morning_mobility: this.state.formData.morningMobility,
        evening_mobility: this.state.formData.eveningMobility,
        foam_rolling_time: this.state.formData.foamRollingTime,
        rest_day_preference: this.state.formData.restDayPreference,
        training_goals: this.state.formData.goals,
        equipment_available: this.state.formData.equipmentAvailable,
        current_injuries: this.state.formData.currentInjuries,
        injury_history: this.state.formData.injuryHistory,
        medical_notes: this.state.formData.medicalNotes || null,
        enable_reminders: this.state.formData.enableReminders,
        reminder_time: this.state.formData.reminderTime,
        notification_preferences: this.state.formData.notificationPreferences,
        // Consent preferences
        consent_terms_of_service: this.state.formData.consentTermsOfService,
        consent_privacy_policy: this.state.formData.consentPrivacyPolicy,
        consent_data_usage: this.state.formData.consentDataUsage,
        consent_ai_coach: this.state.formData.consentAICoach,
        consent_email_updates: this.state.formData.consentEmailUpdates,
        consent_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } =
        await this.onboardingDataService.upsertUserPreferences(preferences);

      if (error) {
        this.logger.info(
          "Saving preferences to localStorage:",
          toLogContext(error.message),
        );
        this.platform.setLocalStorage(
          "flagfit_preferences",
          JSON.stringify(preferences),
        );
      }
    } catch (_e) {
      const preferences = {
        scheduleType: this.state.formData.scheduleType,
        practicesPerWeek: this.state.formData.practicesPerWeek,
        practiceDays: this.state.formData.practiceDays,
        morningMobility: this.state.formData.morningMobility,
        eveningMobility: this.state.formData.eveningMobility,
        foamRollingTime: this.state.formData.foamRollingTime,
        restDayPreference: this.state.formData.restDayPreference,
        trainingGoals: this.state.formData.goals,
        equipmentAvailable: this.state.formData.equipmentAvailable,
        currentInjuries: this.state.formData.currentInjuries,
        injuryHistory: this.state.formData.injuryHistory,
      };
      this.platform.setLocalStorage(
        "flagfit_preferences",
        JSON.stringify(preferences),
      );
    }
  }

  /**
   * Create or update athlete_training_config record
   * This is used by daily-protocol.js to determine position-specific modifiers
   *
   * Maps UI position values to normalized database values:
   * - QB -> "quarterback"
   * - WR, DB, LB, Hybrid -> "wr_db"
   * - Center -> "center"
   * - Rusher -> "rusher" (also "blitzer" in Europe)
   */
  private async createAthleteTrainingConfig(userId: string): Promise<void> {
    try {
      const normalizedPosition = normalizePositionForModifiers(
        this.state.formData.position || "WR",
      );

      // Availability schedule is set separately via player-settings API
      // Coaches schedule team activities via team_activities table (authority)

      const config = {
        user_id: userId,
        primary_position: normalizedPosition,
        secondary_position: this.state.formData.secondaryPosition
          ? normalizePositionForModifiers(this.state.formData.secondaryPosition)
          : null,
        birth_date:
          this.state.formData.dateOfBirth?.toISOString().split("T")[0] || null,
        preferred_training_days: this.getPreferredTrainingDays(),
        max_sessions_per_week: this.state.formData.practicesPerWeek || 3,
        available_equipment: this.state.formData.equipmentAvailable || [],
        has_gym_access:
          this.state.formData.equipmentAvailable?.includes("gym") || false,
        has_field_access:
          this.state.formData.equipmentAvailable?.includes("field") || true,
        current_limitations:
          this.state.formData.currentInjuries?.length > 0
            ? { injuries: this.state.formData.currentInjuries }
            : null,
        // Default ACWR targets (can be adjusted by coach later)
        acwr_target_min: 0.8,
        acwr_target_max: 1.3,
        updated_at: new Date().toISOString(),
      };

      const { error } =
        await this.onboardingDataService.upsertAthleteTrainingConfig(config);

      if (error) {
        this.logger.warn(
          "[Onboarding] Failed to create athlete_training_config:",
          error.message,
        );
        // Non-blocking - continue with onboarding
      } else {
        this.logger.info(
          `[Onboarding] Created athlete_training_config for position: ${normalizedPosition}`,
        );
      }
    } catch (e) {
      this.logger.warn(
        "[Onboarding] Error creating athlete_training_config:",
        e,
      );
      // Non-blocking - continue with onboarding
    }
  }

  /**
   * Save current injuries to daily_wellness_checkin via API
   * This ensures injuries are properly tracked for training modifications
   */
  private async saveCurrentInjuries(_userId: string): Promise<void> {
    try {
      // Only save if there are current injuries
      if (
        !this.state.formData.currentInjuries ||
        this.state.formData.currentInjuries.length === 0
      ) {
        return;
      }

      // Save injury history as notes
      const injuryHistoryNotes =
        this.state.formData.injuryHistory.length > 0
          ? `Past injuries: ${this.state.formData.injuryHistory.join(", ")}`
          : null;

      // Create or update wellness entry for today with current injuries via API
      const today = new Date().toISOString().split("T")[0];
      const payload = {
        date: today,
        notes: injuryHistoryNotes || null,
        sleepQuality: 5,
        sleepHours: 7,
        energyLevel: 5,
        muscleSoreness: this.state.formData.currentInjuries.length > 0 ? 5 : 0,
        stressLevel: 5,
        sorenessAreas: this.state.formData.currentInjuries.map(
          (injury) => injury.area,
        ),
      };

      const response = await firstValueFrom(
        this.api.post(API_ENDPOINTS.wellness.checkin, payload),
      );

      if (!response.success) {
        this.logger.warn(
          "[Onboarding] Failed to save current injuries via API:",
          response.error,
        );
        // Non-blocking - continue with onboarding
      } else {
        this.logger.info(
          `[Onboarding] Saved ${this.state.formData.currentInjuries.length} current injuries via wellness-checkin API`,
        );
      }
    } catch (e) {
      this.logger.warn(
        "[Onboarding] Error saving current injuries:",
        toLogContext(e),
      );
      // Non-blocking - continue with onboarding
    }
  }

  /**
   * Add player to team roster (team_members and team_players tables)
   * This ensures the player appears on the Roster page
   */
  private async addPlayerToTeamRoster(userId: string): Promise<void> {
    try {
      const teamName = this.state.formData.team;
      if (!teamName) {
        this.logger.warn(
          "[Onboarding] No team name provided, skipping roster addition",
        );
        return;
      }

      // 1. Find or create the team
      let teamId: string | null = null;

      // First, try to find existing team by name
      // Per audit: use maybeSingle() since team may not exist yet (avoids 406)
      const { team: existingTeam } =
        await this.onboardingDataService.findTeamByName(teamName);

      if (existingTeam) {
        teamId = existingTeam.id;
        this.logger.info(
          `[Onboarding] Found existing team: ${teamName} (${teamId})`,
        );
      } else {
        // Create new team - single() is OK here since we're inserting and expect exactly one row back
        const { team: newTeam, error: teamError } =
          await this.onboardingDataService.createTeam({
            name: teamName,
            createdBy: userId,
          });

        if (teamError) {
          this.logger.warn(
            "[Onboarding] Failed to create team:",
            teamError.message,
          );
          return;
        }
        if (!newTeam) {
          this.logger.warn("[Onboarding] Team creation returned no team");
          return;
        }
        teamId = newTeam.id;
        this.logger.info(
          `[Onboarding] Created new team: ${teamName} (${teamId})`,
        );
      }

      if (!teamId) {
        this.logger.warn("[Onboarding] Could not determine team ID");
        return;
      }

      // 2. Add user to team_members with role='player'
      // Check if already a member
      // Per audit: use maybeSingle() since membership may not exist yet (avoids 406)
      const { member: existingMember } =
        await this.onboardingDataService.findTeamMember({
          teamId,
          userId,
        });

      if (!existingMember) {
        const { error: memberError } =
          await this.onboardingDataService.addTeamMember({
            teamId,
            userId,
            role: "player",
          });

        if (memberError) {
          this.logger.warn(
            "[Onboarding] Failed to add team member:",
            memberError.message,
          );
        } else {
          this.logger.info(`[Onboarding] Added user to team_members as player`);
        }
      }

      // 3. Add player to team_players table with profile data
      // Calculate age from date of birth
      let age = 0;
      if (this.state.formData.dateOfBirth) {
        const birthDate = new Date(this.state.formData.dateOfBirth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
      }

      const heightCm = this.getHeightInCm();
      const weightKg = this.getWeightInKg();

      // Use RosterService as single source of truth for team_players operations
      const result = await this.rosterService.addPlayer({
        name: this.state.formData.name,
        position: this.state.formData.position || "Unassigned",
        jersey: this.state.formData.jerseyNumber?.toString() || "0",
        country: this.state.formData.country || "Unknown",
        age,
        height: heightCm ? `${heightCm} cm` : "N/A",
        weight: weightKg ? `${weightKg} kg` : "N/A",
        status: "active",
        user_id: userId,
      });

      if (!result.success) {
        this.logger.warn(
          "[Onboarding] Failed to add to team_players:",
          result.error,
        );
      } else {
        this.logger.info(
          `[Onboarding] Added player to team_players: ${this.state.formData.name}`,
        );
      }
    } catch (e) {
      this.logger.warn(
        "[Onboarding] Error adding player to team roster:",
        toLogContext(e),
      );
      // Non-blocking - continue with onboarding
    }
  }

  /**
   * Add staff member to team roster
   */
  private async addStaffToTeamRoster(userId: string): Promise<void> {
    try {
      const teamName = this.state.formData.team;
      if (!teamName) {
        this.logger.warn(
          "[Onboarding] No team name provided, skipping staff roster addition",
        );
        return;
      }

      // 1. Find or create the team
      let teamId: string | null = null;

      // First, try to find existing team by name
      // Per audit: use maybeSingle() since team may not exist yet (avoids 406)
      const { team: existingTeam } =
        await this.onboardingDataService.findTeamByName(teamName);

      if (existingTeam) {
        teamId = existingTeam.id;
        this.logger.info(
          `[Onboarding] Found existing team for staff: ${teamName} (${teamId})`,
        );
      } else {
        // Create new team with staff member as creator - single() OK for insert
        const { team: newTeam, error: teamError } =
          await this.onboardingDataService.createTeam({
            name: teamName,
            createdBy: userId,
          });

        if (teamError) {
          this.logger.warn(
            "[Onboarding] Failed to create team:",
            teamError.message,
          );
          return;
        }
        if (!newTeam) {
          this.logger.warn("[Onboarding] Team creation returned no team");
          return;
        }
        teamId = newTeam.id;
        this.logger.info(
          `[Onboarding] Created new team for staff: ${teamName} (${teamId})`,
        );
      }

      if (!teamId) {
        this.logger.warn("[Onboarding] Could not determine team ID for staff");
        return;
      }

      // 2. Add user to team_members with appropriate role based on staff role
      // Map staff role to team member role
      const staffRoleToMemberRole: Record<string, string> = {
        head_coach: "coach",
        assistant_coach: "coach",
        offensive_coordinator: "coach",
        defensive_coordinator: "coach",
        strength_coach: "staff",
        athletic_trainer: "staff",
        physiotherapist: "staff",
        nutritionist: "staff",
        sports_psychologist: "staff",
        team_manager: "manager",
        video_analyst: "staff",
        equipment_manager: "staff",
        other_staff: "staff",
      };

      const memberRole =
        staffRoleToMemberRole[this.state.formData.staffRole || ""] || "staff";

      // Check if already a member
      // Per audit: use maybeSingle() since membership may not exist yet (avoids 406)
      const { member: existingMember } =
        await this.onboardingDataService.findTeamMember({
          teamId,
          userId,
        });

      if (!existingMember) {
        const { error: memberError } =
          await this.onboardingDataService.addTeamMember({
            teamId,
            userId,
            role: memberRole,
          });

        if (memberError) {
          this.logger.warn(
            "[Onboarding] Failed to add staff member:",
            memberError.message,
          );
        } else {
          this.logger.info(
            `[Onboarding] Added staff to team_members as ${memberRole}`,
          );
        }
      }
    } catch (e) {
      this.logger.warn(
        "[Onboarding] Error adding staff to team roster:",
        toLogContext(e),
      );
      // Non-blocking - continue with onboarding
    }
  }

  /**
   * Convert day name to day number (0 = Sunday, 1 = Monday, etc.)
   */
  private getDayNumber(dayName: string): number {
    const days: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    return days[dayName.toLowerCase()] ?? 1;
  }

  /**
   * Get preferred training days based on practice schedule
   * Returns days that are NOT practice days (for strength training)
   */
  private getPreferredTrainingDays(): string[] {
    const allDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const practiceDays = this.state.formData.practiceDays || [];
    // Prefer non-practice days for strength training
    const trainingDays = allDays.filter(
      (day) => !practiceDays.map((d: string) => d.toLowerCase()).includes(day),
    );
    // Return at least 3 days
    return trainingDays.length >= 3
      ? trainingDays.slice(0, UI_LIMITS.ONBOARDING_DAYS_PREVIEW)
      : allDays.slice(0, UI_LIMITS.ONBOARDING_DAYS_PREVIEW);
  }

  /**
   * Assign training program based on selected position
   *
   * Program mapping:
   * - QB -> Ljubljana Frogs QB Annual Program 2025-2026
   * - Everyone else (WR, DB, Center, Rusher, LB, Hybrid) -> Ljubljana Frogs WR/DB Annual Program 2025-2026
   *
   * This is idempotent: if user already has the same program assigned, it succeeds without duplicates.
   * If user has a different program, it will switch (force=true) to maintain consistency.
   *
   * Non-blocking: If this fails, user can still enter app and admin can assign later.
   */
  private async assignTrainingProgram(): Promise<boolean> {
    const position = this.state.formData.position;

    if (!position) {
      // BLOCKER B: Position is mandatory for program assignment
      this.logger.error(
        "[Onboarding] No position selected - cannot assign program (CRITICAL)",
      );
      return false;
    }

    const programId = getProgramIdForPosition(position);
    this.logger.info(
      `[Onboarding] Assigning program for position "${position}" -> ${programId}`,
    );

    try {
      const assignment = await firstValueFrom(
        this.playerProgramService.assignMyProgram(programId, { force: true }),
      );

      if (assignment) {
        this.logger.info(
          `[Onboarding] ✅ Successfully assigned program: ${assignment.program.name}`,
        );
        return true;
      } else {
        // Assignment returned null - this is now a CRITICAL failure
        this.logger.error(
          "[Onboarding] ❌ Program assignment returned null (CRITICAL - BLOCKER B)",
          {
            position: position,
            programId: programId,
            reason:
              "API returned null - possible causes: program not found in DB, RLS policy blocking, or API error",
          },
        );
        return false;
      }
    } catch (error) {
      // BLOCKER B: This is now a BLOCKING error - but we'll log details and allow completion
      this.logger.error(
        "[Onboarding] ❌ Failed to assign training program (CRITICAL - BLOCKER B):",
        {
          position: position,
          programId: programId,
          error: error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorCode:
            typeof error === "object" && error !== null && "code" in error
              ? (error as { code: unknown }).code
              : undefined,
          errorDetails:
            typeof error === "object" && error !== null && "details" in error
              ? (error as { details: unknown }).details
              : undefined,
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      return false;
    }
  }
}
