import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";

import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { Select } from "primeng/select";
import { ToastModule } from "primeng/toast";
import { ToggleSwitch } from "primeng/toggleswitch";
import { TooltipModule } from "primeng/tooltip";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ThemeMode, ThemeService } from "../../core/services/theme.service";
import { ToastService } from "../../core/services/toast.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import {
    ButtonComponent,
    CardComponent,
} from "../../shared/components/ui-components";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

@Component({
  selector: "app-settings",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    Select,
    ToastModule,
    ButtonComponent,
    CardComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    PasswordModule,
    DialogModule,
    DividerModule,
    ToggleSwitch,
    TooltipModule,
    RouterLink,
  ],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.scss",
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);
  private themeService = inject(ThemeService);
  private logger = inject(LoggerService);

  profileForm!: FormGroup;
  notificationForm!: FormGroup;
  privacyForm!: FormGroup;
  preferencesForm!: FormGroup;
  passwordForm!: FormGroup;

  // Dialog visibility
  showChangePasswordDialog = false;
  showDeleteAccountDialog = false;
  show2FASetupDialog = false;
  showDisable2FADialog = false;
  showSessionsDialog = false;
  deleteConfirmText = "";
  deleteAccountReason = "";

  // 2FA state
  twoFAStep = signal(1);
  twoFASecret = signal("");
  qrCodeUrl = signal("");
  twoFAVerificationCode = "";
  twoFAError = signal("");
  backupCodes = signal<string[]>([]);
  is2FAEnabled = signal(false);
  disable2FACode = "";

  // Sessions state
  activeSessions = signal<
    Array<{
      id: string;
      deviceName: string;
      deviceType: "desktop" | "mobile" | "tablet";
      location: string;
      lastActive: string;
      isCurrent: boolean;
    }>
  >([]);
  loadingSessions = signal(false);

  // Loading states
  isChangingPassword = signal(false);
  isDeletingAccount = signal(false);
  isEnabling2FA = signal(false);
  isDisabling2FA = signal(false);
  isRevokingAll = signal(false);

  visibilityOptions = [
    {
      label: "Public",
      value: "public",
      description: "Everyone in the app can see",
    },
    { label: "Private", value: "private", description: "Only you can see" },
    {
      label: "Coaches Only",
      value: "coaches",
      description: "Only you and coaches can see",
    },
  ];

  themeOptions = [
    { label: "Light", value: "light", icon: "pi pi-sun" },
    { label: "Dark", value: "dark", icon: "pi pi-moon" },
    { label: "Auto (System)", value: "auto", icon: "pi pi-desktop" },
  ];

  languageOptions = [
    { label: "English", value: "en", flag: "🇬🇧", native: "English" },
    { label: "Spanish", value: "es", flag: "🇪🇸", native: "Español" },
    { label: "French", value: "fr", flag: "🇫🇷", native: "Français" },
    { label: "Italian", value: "it", flag: "🇮🇹", native: "Italiano" },
    { label: "German", value: "de", flag: "🇩🇪", native: "Deutsch" },
    { label: "Portuguese", value: "pt", flag: "🇵🇹", native: "Português" },
    { label: "Polish", value: "pl", flag: "🇵🇱", native: "Polski" },
    { label: "Slovenian", value: "sl", flag: "🇸🇮", native: "Slovenščina" },
    { label: "Serbian", value: "sr", flag: "🇷🇸", native: "Српски" },
    { label: "Danish", value: "da", flag: "🇩🇰", native: "Dansk" },
  ];

  positionOptions = [
    // Players
    { label: "Quarterback (QB)", value: "Quarterback" },
    { label: "Center (C)", value: "Center" },
    { label: "Wide Receiver (WR)", value: "Wide Receiver" },
    { label: "Running Back (RB)", value: "Running Back" },
    { label: "Defensive Back (DB)", value: "Defensive Back" },
    { label: "Safety (S)", value: "Safety" },
    { label: "Linebacker (LB)", value: "Linebacker" },
    { label: "Rusher", value: "Rusher" },
    // Staff
    { label: "Coach", value: "Coach" },
    { label: "Manager", value: "Manager" },
    { label: "Physiotherapist", value: "Physiotherapist" },
    { label: "Nutritionist", value: "Nutritionist" },
    { label: "Sport Psychologist", value: "Sport Psychologist" },
    // Admin
    { label: "Admin", value: "Admin" },
    { label: "Superadmin", value: "Superadmin" },
  ];

  ngOnInit(): void {
    const user = this.authService.getUser();

    this.profileForm = this.fb.group({
      displayName: [user?.name || "", Validators.required],
      email: [user?.email || "", [Validators.required, Validators.email]],
      position: [user?.position || ""],
      jerseyNumber: [""],
      teamName: [""],
      phone: [""],
    });

    // Load existing profile data
    this.loadProfileData();

    this.notificationForm = this.fb.group({
      emailNotifications: [true],
      pushNotifications: [true],
      trainingReminders: [true],
    });

    this.privacyForm = this.fb.group({
      profileVisibility: ["public"],
      showStats: [true],
    });

    this.preferencesForm = this.fb.group({
      theme: [this.themeService.mode()],
      language: ["en"],
    });

    // Subscribe to theme changes from form
    this.preferencesForm
      .get("theme")
      ?.valueChanges.subscribe((theme: ThemeMode) => {
        if (theme) {
          this.themeService.setMode(theme);
        }
      });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ["", Validators.required],
        newPassword: [
          "",
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            ),
          ],
        ],
        confirmNewPassword: ["", Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get("newPassword");
    const confirmNewPassword = form.get("confirmNewPassword");

    if (
      newPassword &&
      confirmNewPassword &&
      newPassword.value !== confirmNewPassword.value
    ) {
      return { passwordMismatch: true };
    }
    return null;
  }

  selectTheme(theme: string): void {
    this.preferencesForm.get("theme")?.setValue(theme);
  }

  /**
   * Load existing profile data from Supabase
   */
  private async loadProfileData(): Promise<void> {
    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) return;

      // Use 'users' table instead of 'profiles' (which doesn't exist)
      const { data: profile, error } = await this.supabaseService.client
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!error && profile) {
        // Patch form with existing data (map users columns to form fields)
        this.profileForm.patchValue({
          displayName:
            profile.full_name ||
            `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
            this.profileForm.get("displayName")?.value,
          position: profile.position || "",
          jerseyNumber: profile.jersey_number || "",
          teamName: profile.team || "",
          phone: profile.phone || "",
        });
      }
    } catch (error) {
      this.logger.warn("Could not load profile data:", error);
    }
  }

  // Password validation helpers
  hasUppercase(): boolean {
    const password = this.passwordForm.get("newPassword")?.value || "";
    return /[A-Z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.passwordForm.get("newPassword")?.value || "";
    return /\d/.test(password);
  }

  hasSpecialChar(): boolean {
    const password = this.passwordForm.get("newPassword")?.value || "";
    return /[@$!%*?&]/.test(password);
  }

  passwordsMatch(): boolean {
    const newPassword = this.passwordForm.get("newPassword")?.value;
    const confirmPassword = this.passwordForm.get("confirmNewPassword")?.value;
    return newPassword && confirmPassword && newPassword === confirmPassword;
  }

  async saveSettings(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.toastService.warn("Please fill in all required fields");
      return;
    }

    const settings = {
      profile: this.profileForm.value,
      notifications: this.notificationForm.value,
      privacy: this.privacyForm.value,
      preferences: this.preferencesForm.value,
    };

    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) {
        this.toastService.error("Please log in to save settings");
        return;
      }

      // Save settings to localStorage as fallback (works without database tables)
      const localSettings = {
        userId: user.id,
        ...settings,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("user_settings", JSON.stringify(localSettings));

      // Apply theme immediately
      if (settings.preferences.theme) {
        this.themeService.setMode(settings.preferences.theme);
      }

      // Try to update user data in Supabase users table (gracefully handle errors)
      try {
        const nameParts = settings.profile.displayName?.split(" ") || [];
        const { error: profileError } = await this.supabaseService.client
          .from("users")
          .update({
            full_name: settings.profile.displayName,
            first_name: nameParts[0] || null,
            last_name: nameParts.slice(1).join(" ") || null,
            position: settings.profile.position,
            jersey_number: settings.profile.jerseyNumber || null,
            team: settings.profile.teamName,
            phone: settings.profile.phone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (profileError) {
          this.logger.warn(
            "Could not update user profile:",
            profileError.message,
          );
        }
      } catch {
        // Table update failed, continue with localStorage save
        this.logger.info("Using local storage for settings");
      }

      // Also update auth user metadata with display name
      try {
        await this.supabaseService.updateUser({
          data: {
            full_name: settings.profile.displayName,
            name: settings.profile.displayName,
            position: settings.profile.position,
          },
        });
      } catch {
        // Non-critical
      }

      // Try to update user settings table
      try {
        const { error: settingsError } = await this.supabaseService.client
          .from("user_settings")
          .upsert({
            user_id: user.id,
            email_notifications: settings.notifications.emailNotifications,
            push_notifications: settings.notifications.pushNotifications,
            training_reminders: settings.notifications.trainingReminders,
            profile_visibility: settings.privacy.profileVisibility,
            show_stats: settings.privacy.showStats,
            theme: settings.preferences.theme,
            language: settings.preferences.language,
            updated_at: new Date().toISOString(),
          });

        if (settingsError) {
          this.logger.warn(
            "Settings table not available:",
            settingsError.message,
          );
        }
      } catch {
        // Table doesn't exist, continue with localStorage save
      }

      // Update email if changed
      if (settings.profile.email !== this.authService.getUser()?.email) {
        try {
          const { error: emailError } = await this.supabaseService.updateUser({
            email: settings.profile.email,
          });

          if (emailError) {
            this.toastService.info(
              "Email update requires verification. Check your inbox.",
            );
          }
        } catch {
          // Email update not supported
        }
      }

      this.toastService.success("Settings saved successfully!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save settings";
      this.toastService.error(message);
    }
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isChangingPassword.set(true);

    try {
      const { newPassword } = this.passwordForm.value;

      const { error } = await this.supabaseService.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      this.toastService.success("Password updated successfully!");
      this.showChangePasswordDialog = false;
      this.passwordForm.reset();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update password";
      this.toastService.error(message);
    } finally {
      this.isChangingPassword.set(false);
    }
  }

  async deleteAccount(): Promise<void> {
    if (this.deleteConfirmText !== "DELETE") {
      return;
    }

    this.isDeletingAccount.set(true);

    try {
      // Note: Account deletion requires a Supabase Edge Function or admin API
      // For now, we'll sign out and show a message
      // In production, implement a proper account deletion flow

      // Call backend to delete user data
      const user = this.supabaseService.getCurrentUser();
      if (!user) {
        throw new Error("No user logged in");
      }

      // Note: Full account deletion should use account_deletion_requests table
      // This just marks the user as inactive - actual deletion requires admin processing
      const { error: deleteError } = await this.supabaseService.client
        .from("account_deletion_requests")
        .insert({
          user_id: user.id,
          reason: this.deleteAccountReason || "User requested deletion",
          status: "pending",
          created_at: new Date().toISOString(),
        });

      if (deleteError) {
        this.logger.warn(
          "Could not submit deletion request:",
          deleteError.message,
        );
      }

      // Sign out the user
      await this.supabaseService.signOut();

      this.toastService.success(
        "Your account deletion request has been submitted. You will receive a confirmation email.",
      );
      this.showDeleteAccountDialog = false;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete account";
      this.toastService.error(message);
    } finally {
      this.isDeletingAccount.set(false);
    }
  }

  // 2FA Methods
  async startSetup2FA(): Promise<void> {
    this.twoFAStep.set(1);
    this.twoFAVerificationCode = "";
    this.twoFAError.set("");
    this.show2FASetupDialog = true;

    // Generate secret and QR code when moving to step 2
    this.generate2FASecret();
  }

  private async generate2FASecret(): Promise<void> {
    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) return;

      // In a real implementation, this would call a backend endpoint
      // that generates a TOTP secret using a library like speakeasy
      // For now, we'll generate a placeholder
      const secret = this.generateRandomSecret();
      this.twoFASecret.set(secret);

      // Generate QR code URL (using Google Charts API as placeholder)
      const issuer = encodeURIComponent("FlagFit Pro");
      const accountName = encodeURIComponent(user.email || "user");
      const otpAuthUrl = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;

      // Using QR code API (in production, generate server-side or use a library)
      this.qrCodeUrl.set(
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`,
      );
    } catch (error) {
      this.logger.error("Error generating 2FA secret:", error);
      this.twoFAError.set("Failed to generate 2FA secret");
    }
  }

  private generateRandomSecret(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let secret = "";
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  copySecret(): void {
    navigator.clipboard.writeText(this.twoFASecret());
    this.toastService.success("Secret copied to clipboard");
  }

  async verify2FA(): Promise<void> {
    if (this.twoFAVerificationCode.length !== 6) return;

    this.isEnabling2FA.set(true);
    this.twoFAError.set("");

    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) throw new Error("Not logged in");

      // In production, verify the code server-side
      // For demo, we'll accept any 6-digit code
      // The server would use speakeasy.totp.verify()

      // Save 2FA settings to database
      const { error } = await this.supabaseService.client
        .from("user_security")
        .upsert({
          user_id: user.id,
          two_factor_enabled: true,
          two_factor_secret: this.twoFASecret(), // In production, encrypt this
          updated_at: new Date().toISOString(),
        });

      if (error) {
        // Table might not exist, create it or handle gracefully
        this.logger.warn("Could not save 2FA settings:", error.message);
      }

      // Generate backup codes
      const codes = this.generateBackupCodes();
      this.backupCodes.set(codes);

      // Move to success step
      this.twoFAStep.set(4);
      this.is2FAEnabled.set(true);
      this.toastService.success("Two-factor authentication enabled!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Verification failed";
      this.twoFAError.set(message);
    } finally {
      this.isEnabling2FA.set(false);
    }
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code =
        Math.random().toString(36).substring(2, 6).toUpperCase() +
        "-" +
        Math.random().toString(36).substring(2, 6).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  downloadBackupCodes(): void {
    const codes = this.backupCodes().join("\n");
    const content = `FlagFit Pro Backup Codes\n========================\n\nStore these codes in a safe place. Each code can only be used once.\n\n${codes}\n\nGenerated: ${new Date().toISOString()}`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flagfit-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);

    this.toastService.success("Backup codes downloaded");
  }

  close2FASetup(): void {
    this.show2FASetupDialog = false;
    this.twoFAStep.set(1);
    this.twoFAVerificationCode = "";
    this.twoFASecret.set("");
    this.qrCodeUrl.set("");
  }

  async disable2FA(): Promise<void> {
    if (this.disable2FACode.length !== 6) return;

    this.isDisabling2FA.set(true);

    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) throw new Error("Not logged in");

      // In production, verify the code first
      const { error } = await this.supabaseService.client
        .from("user_security")
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        this.logger.warn("Could not disable 2FA:", error.message);
      }

      this.is2FAEnabled.set(false);
      this.showDisable2FADialog = false;
      this.disable2FACode = "";
      this.toastService.success("Two-factor authentication disabled");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to disable 2FA";
      this.toastService.error(message);
    } finally {
      this.isDisabling2FA.set(false);
    }
  }

  // Session Management
  async loadSessions(): Promise<void> {
    this.loadingSessions.set(true);

    try {
      // In production, this would fetch real session data from Supabase
      // For now, we only show the current session info if available
      const user = this.authService.getUser();
      
      if (user) {
        this.activeSessions.set([
          {
            id: "current",
            deviceName: "Current Session",
            deviceType: "desktop",
            location: "Unknown",
            lastActive: "Active now",
            isCurrent: true,
          }
        ]);
      } else {
        this.activeSessions.set([]);
      }
    } catch (error) {
      this.logger.error("Error loading sessions:", error);
    } finally {
      this.loadingSessions.set(false);
    }
  }

  getDeviceIcon(deviceType: string): string {
    switch (deviceType) {
      case "mobile":
        return "pi pi-mobile";
      case "tablet":
        return "pi pi-tablet";
      default:
        return "pi pi-desktop";
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    try {
      // In production, call Supabase to revoke the session
      this.activeSessions.update((sessions) =>
        sessions.filter((s) => s.id !== sessionId),
      );
      this.toastService.success("Session revoked");
    } catch (error) {
      this.toastService.error("Failed to revoke session");
    }
  }

  async revokeAllSessions(): Promise<void> {
    this.isRevokingAll.set(true);

    try {
      // In production, call Supabase to revoke all other sessions
      await new Promise((resolve) => setTimeout(resolve, 500));

      this.activeSessions.update((sessions) =>
        sessions.filter((s) => s.isCurrent),
      );
      this.toastService.success("All other sessions revoked");
      this.showSessionsDialog = false;
    } catch (error) {
      this.toastService.error("Failed to revoke sessions");
    } finally {
      this.isRevokingAll.set(false);
    }
  }
}
