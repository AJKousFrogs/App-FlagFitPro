import {
    afterNextRender,
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    inject,
    signal,
} from "@angular/core";

import { animate, style, transition, trigger } from "@angular/animations";
import { Router, RouterModule } from "@angular/router";

import { TOAST } from "../../core/constants/toast-messages.constants";
import {
    LoggerService,
} from "../../core/services/logger.service";
import { PlatformService } from "../../core/services/platform.service";
import { ToastService } from "../../core/services/toast.service";
import { AuthFlowDataService } from "../auth/services/auth-flow-data.service";
import { OnboardingProgressShellComponent } from "./components/onboarding-progress-shell.component";
import { OnboardingCompletionService } from "./services/onboarding-completion.service";
import { OnboardingDataService } from "./services/onboarding-data.service";
import { OnboardingStateService } from "./services/onboarding-state.service";
import { OnboardingStepWelcomeComponent } from "./steps/onboarding-step-welcome.component";
import { OnboardingStepPersonalComponent } from "./steps/onboarding-step-personal.component";
import { OnboardingStepRoleComponent } from "./steps/onboarding-step-role.component";
import { OnboardingStepPhysicalComponent } from "./steps/onboarding-step-physical.component";
import { OnboardingStepHealthComponent } from "./steps/onboarding-step-health.component";
import { OnboardingStepGoalsComponent } from "./steps/onboarding-step-goals.component";
import { OnboardingStepScheduleComponent } from "./steps/onboarding-step-schedule.component";
import { OnboardingStepSummaryComponent } from "./steps/onboarding-step-summary.component";

@Component({
  selector: "app-onboarding",
  host: { class: "onboarding" },
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("onboardingStepAnim", [
      transition(
        ":increment",
        [
          style({ opacity: 0, transform: "translateX(28px)" }),
          animate(
            "320ms cubic-bezier(0.16, 1, 0.3, 1)",
            style({ opacity: 1, transform: "none" }),
          ),
        ],
      ),
      transition(
        ":decrement",
        [
          style({ opacity: 0, transform: "translateX(-28px)" }),
          animate(
            "280ms cubic-bezier(0.16, 1, 0.3, 1)",
            style({ opacity: 1, transform: "none" }),
          ),
        ],
      ),
    ]),
  ],
  imports: [
    RouterModule,
    OnboardingProgressShellComponent,
    OnboardingStepWelcomeComponent,
    OnboardingStepPersonalComponent,
    OnboardingStepRoleComponent,
    OnboardingStepPhysicalComponent,
    OnboardingStepHealthComponent,
    OnboardingStepGoalsComponent,
    OnboardingStepScheduleComponent,
    OnboardingStepSummaryComponent,
  ],
  templateUrl: "./onboarding.component.html",
  styleUrl: "./onboarding.component.scss",
})
export class OnboardingComponent implements OnInit, OnDestroy {
  /** Respect system preference; disables Angular step transitions when true. */
  readonly prefersReducedMotion = signal(false);

  /** Controls whether the welcome splash screen is shown before step 0. */
  readonly showWelcome = signal(true);

  readonly state = inject(OnboardingStateService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly onboardingDataService = inject(OnboardingDataService);
  private readonly logger = inject(LoggerService);
  private readonly platform = inject(PlatformService);
  private readonly authFlowDataService = inject(AuthFlowDataService);
  private readonly completionService = inject(OnboardingCompletionService);

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

  getStepPosition(): string {
    return `${this.state.currentStep() + 1} of ${this.state.steps().length}`;
  }

  getCurrentStepLabel(): string {
    return this.state.steps()[this.state.currentStep()]?.label || "Setup";
  }

  getCompletionStats(): {
    completed: number;
    total: number;
    percent: number;
    remaining: number;
  } {
    const requirements = this.getCompletionRequirements();
    const total = requirements.length;
    const completed = requirements.filter((item) => item.done).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return {
      completed,
      total,
      percent,
      remaining: Math.max(0, total - completed),
    };
  }

  getPendingRequirementLabels(limit = 4): string[] {
    return this.getCompletionRequirements()
      .filter((item) => !item.done)
      .slice(0, limit)
      .map((item) => item.label);
  }

  hasPendingRequirements(): boolean {
    return this.getCompletionStats().remaining > 0;
  }

  private getCompletionRequirements(): { label: string; done: boolean }[] {
    const f = this.state.formData;
    const isPlayer = this.state.isPlayer();
    const hasMetricPhysical = !!(f.heightCm && f.weightKg);
    const hasImperialPhysical = !!(
      (f.heightFt || f.heightIn) &&
      f.weightLbs
    );
    const hasPhysical =
      f.unitSystem === "metric" ? hasMetricPhysical : hasImperialPhysical;
    const isQB = this.state.isQBSelected();

    const shared = [
      { label: "Add full name", done: !!f.name?.trim() },
      { label: "Add date of birth", done: !!f.dateOfBirth },
      { label: "Select country", done: !!f.country },
      { label: "Verify email", done: this.isEmailVerified() },
      { label: "Choose team", done: !!f.team },
      { label: "Accept Terms", done: !!f.consentTermsOfService },
      { label: "Accept Privacy Policy", done: !!f.consentPrivacyPolicy },
      { label: "Accept data use consent", done: !!f.consentDataUsage },
    ];

    if (!isPlayer) {
      return [
        ...shared,
        { label: "Choose staff role", done: !!f.staffRole },
      ];
    }

    const playerOnly = [
      { label: "Choose primary position", done: !!f.position },
      { label: "Choose experience level", done: !!f.experience },
      { label: "Set throwing arm (QB)", done: !isQB || !!f.throwingArm },
      { label: "Add height and weight", done: hasPhysical },
      { label: "Pick at least one goal", done: f.goals.length > 0 },
      { label: "Choose schedule type", done: !!f.scheduleType },
    ];

    return [...shared, ...playerOnly];
  }

  constructor() {
    afterNextRender(() => {
      if (typeof globalThis.matchMedia !== "function") {
        return;
      }
      const mq = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
      const apply = (): void => {
        this.prefersReducedMotion.set(mq.matches);
      };
      apply();
      mq.addEventListener("change", apply);
    });
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
        this.logger.info("onboarding_email_verified");
      } else {
        this.logger.info("onboarding_email_not_verified");
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

      const { error } = await this.onboardingDataService.resendVerificationEmail(
        user.email,
        this.authFlowDataService.getEmailVerificationRedirectUrl(),
      );

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
      this.logger.debug("onboarding_broadcast_channel_unsupported");
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
        this.logger.warn("onboarding_email_missing_profile_lookup");
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

      case 4: // Goals
        if (this.state.formData.goals.length === 0) {
          return {
            valid: false,
            message: "Please select at least one training goal",
          };
        }
        return { valid: true };

      case 5: // Schedule
        if (!this.state.formData.scheduleType) {
          return { valid: false, message: "Please select your schedule type" };
        }
        return { valid: true };

      case 6: // Summary & Consent
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

  onSummaryConsentChange(event: { type: string; checked: boolean }): void {
    this.onConsentChange(event.type, { checked: event.checked });
  }

  /** Dismiss welcome screen and enter the step flow. */
  startOnboarding(): void {
    this.showWelcome.set(false);
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

  async completeOnboarding(): Promise<void> {
    this.isCompleting.set(true);
    try {
      const result = await this.completionService.execute();
      if (result.success) {
        setTimeout(() => {
          if (result.redirectUrl) {
            void this.router.navigateByUrl(result.redirectUrl);
          } else if (result.isStaff) {
            void this.router.navigate(["/team/workspace"]);
          } else {
            void this.router.navigate(["/dashboard"]);
          }
        }, 1000);
      }
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
}
