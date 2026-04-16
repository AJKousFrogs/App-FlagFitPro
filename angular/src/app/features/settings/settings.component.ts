import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    ElementRef,
    inject,
    OnInit,
    signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";

import {
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms";

import {
    COUNTRY_OPTIONS,
    TIMEOUTS,
    TOAST,
} from "../../core/constants";
import {
    LoggerService,
    toLogContext,
} from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ThemeMode, ThemeService } from "../../core/services/theme.service";
import { ToastService } from "../../core/services/toast.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { AppLoadingComponent } from "../../shared/components/loading/loading.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { ButtonComponent } from "../../shared/components/ui-components";
import { calculateAge } from "../../shared/utils/date.utils";
import { SettingsAccountDeletionService } from "./services/settings-account-deletion.service";
import { SettingsBirthdayService } from "./services/settings-birthday.service";
import {
  DataExportFormat,
  DataExportOptions,
  SettingsDataExportService,
} from "./services/settings-data-export.service";
import { SettingsFormFactoryService } from "./services/settings-form-factory.service";
import { SettingsProfileInitService } from "./services/settings-profile-init.service";
import {
  SaveSettingsInput,
  SettingsSaveSettingsService,
} from "./services/settings-save-settings.service";
import { SettingsSecurityService } from "./services/settings-security.service";
import { SettingsSessionManagementService } from "./services/settings-session-management.service";
import { SettingsTeamRequestService } from "./services/settings-team-request.service";
import { SettingsTwoFactorService } from "./services/settings-two-factor.service";
import { NotificationPreferencesCardComponent } from "./components/notification-preferences-card/notification-preferences-card.component";
import { PrivacyControlsCardComponent } from "./components/privacy-controls-card/privacy-controls-card.component";
import { SecuritySettingsCardComponent } from "./components/security-settings-card/security-settings-card.component";
import { AppPreferencesCardComponent } from "./components/app-preferences-card/app-preferences-card.component";
import { ChangePasswordDialogComponent } from "./components/change-password-dialog/change-password-dialog.component";
import { DeleteAccountDialogComponent } from "./components/delete-account-dialog/delete-account-dialog.component";
import { TwofaSetupDialogComponent } from "./components/twofa-setup-dialog/twofa-setup-dialog.component";
import { DisableTwofaDialogComponent } from "./components/disable-twofa-dialog/disable-twofa-dialog.component";
import { ActiveSessionsDialogComponent } from "./components/active-sessions-dialog/active-sessions-dialog.component";
import { DataExportDialogComponent } from "./components/data-export-dialog/data-export-dialog.component";
import { SettingsAccountSectionComponent } from "./components/settings-account-section.component";
import {
  SettingsNavItem,
  SettingsNavSectionComponent,
} from "./components/settings-nav-section.component";

@Component({
  selector: "app-settings",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    ButtonComponent,
    AppLoadingComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    PageErrorStateComponent,
    SettingsAccountSectionComponent,
    NotificationPreferencesCardComponent,
    PrivacyControlsCardComponent,
    SecuritySettingsCardComponent,
    AppPreferencesCardComponent,
    ChangePasswordDialogComponent,
    DeleteAccountDialogComponent,
    TwofaSetupDialogComponent,
    DisableTwofaDialogComponent,
    ActiveSessionsDialogComponent,
    DataExportDialogComponent,
    SettingsNavSectionComponent,
  ],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.scss",
})
export class SettingsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private supabase = inject(SupabaseService);
  private accountDeletionService = inject(SettingsAccountDeletionService);
  private birthdayService = inject(SettingsBirthdayService);
  private dataExportService = inject(SettingsDataExportService);
  private formFactory = inject(SettingsFormFactoryService);
  private profileInitService = inject(SettingsProfileInitService);
  private saveSettingsService = inject(SettingsSaveSettingsService);
  private securityService = inject(SettingsSecurityService);
  private sessionManagementService = inject(SettingsSessionManagementService);
  private teamRequestService = inject(SettingsTeamRequestService);
  private twoFactorService = inject(SettingsTwoFactorService);
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

  // 2FA state
  twoFAStep = this.twoFactorService.twoFAStep;
  twoFASecret = this.twoFactorService.twoFASecret;
  qrCodeUrl = this.twoFactorService.qrCodeUrl;
  twoFAVerificationCode = "";
  twoFAError = this.twoFactorService.twoFAError;
  backupCodes = this.twoFactorService.backupCodes;
  is2FAEnabled = this.twoFactorService.is2FAEnabled;
  disable2FACode = "";

  // Sessions state
  activeSessions = this.sessionManagementService.activeSessions;
  loadingSessions = this.sessionManagementService.loadingSessions;

  // Loading states
  readonly isPageLoading = signal(true);
  readonly pageErrorMessage = signal<string | null>(null);
  readonly settingsLoadErrorFallback =
    "We couldn't load your settings right now. Please try again.";
  isSavingSettings = this.saveSettingsService.isSavingSettings;
  isChangingPassword = this.securityService.isChangingPassword;
  isDeletingAccount = this.accountDeletionService.isDeletingAccount;
  isEnabling2FA = this.twoFactorService.isEnabling2FA;
  isDisabling2FA = this.twoFactorService.isDisabling2FA;
  isRevokingAll = this.sessionManagementService.isRevokingAll;
  isExportingData = this.dataExportService.isExportingData;
  exportProgress = this.dataExportService.exportProgress;
  exportTakingLong = this.dataExportService.exportTakingLong;

  // Data export dialog
  showDataExportDialog = false;
  exportFormat: DataExportFormat = "json";
  exportOptions: DataExportOptions = {
    profile: true,
    training: true,
    wellness: true,
    achievements: true,
    settings: true,
  };

  // Team selection
  availableTeams = this.teamRequestService.availableTeams;
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

  // Date constraints for date of birth field
  maxBirthDate = new Date(new Date().setFullYear(new Date().getFullYear() - 5)); // Must be at least 5 years old

  // Birthday suggestion state
  birthdaySuggestion = this.birthdayService.birthdaySuggestion;

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

  countryOptions = COUNTRY_OPTIONS;

  readonly settingsNavItems: SettingsNavItem[] = [
    {
      id: "account-settings",
      icon: "pi-user",
      label: "Account",
      route: "/settings/profile",
      keywords: ["profile", "name", "email", "birthday", "team", "position"],
    },
    {
      id: "notifications-settings",
      icon: "pi-bell",
      label: "Notifications",
      route: "/settings/notifications",
      keywords: ["alerts", "messages", "email", "push", "reminders"],
    },
    {
      id: "privacy-settings",
      icon: "pi-lock",
      label: "Privacy & Security",
      route: "/settings/privacy-security",
      keywords: ["privacy", "sharing", "visibility", "security", "data"],
    },
    {
      id: "preferences-settings",
      icon: "pi-sliders-h",
      label: "Preferences",
      route: "/settings/preferences",
      keywords: ["theme", "language", "app", "display", "preferences"],
    },
    {
      id: "security-settings",
      icon: "pi-shield",
      label: "Security",
      route: "/settings/security",
      keywords: ["password", "2fa", "sessions", "delete", "account"],
    },
  ];

  readonly activeSettingsSection = signal("account-settings");
  readonly settingsSearchQuery = signal("");
  readonly filteredSettingsNavItems = computed(() => {
    const query = this.settingsSearchQuery().trim().toLowerCase();
    if (!query) {
      return this.settingsNavItems;
    }

    return this.settingsNavItems.filter((item) => {
      const searchableText = [item.label, ...(item.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      return searchableText.includes(query);
    });
  });

  ngOnInit(): void {
    const currentUser = this.supabase.currentUser();
    const user = currentUser
      ? {
          name:
            (currentUser.user_metadata?.["name"] as string | undefined) ??
            (currentUser.user_metadata?.["full_name"] as string | undefined) ??
            currentUser.email ??
            "",
          email: currentUser.email ?? "",
          position:
            (currentUser.user_metadata?.["position"] as string | undefined) ??
            "",
        }
      : null;

    this.profileForm = this.formFactory.createProfileForm(user);
    this.notificationForm = this.formFactory.createNotificationForm();
    this.privacyForm = this.formFactory.createPrivacyForm();
    this.preferencesForm = this.formFactory.createPreferencesForm(
      this.themeService.mode(),
    );
    this.passwordForm = this.formFactory.createPasswordForm();

    void this.loadInitialData();
    this.syncSectionFromRoute();

    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.syncSectionFromRoute();
        }
      });

    // Subscribe to theme changes from form
    this.preferencesForm
      .get("theme")
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((theme: ThemeMode) => {
        if (theme) {
          this.themeService.setMode(theme);
        }
      });
  }

  onBirthdayInputTyped(typedValue: string): void {
    if (typedValue.length > 0) {
      this.birthdayService.parseAndSuggestBirthday(
        typedValue,
        this.maxBirthDate,
      );
      return;
    }

    this.birthdayService.clearSuggestion();
  }

  onBirthdayInputBlurred(): void {
    const currentValue = this.profileForm.get("dateOfBirth")?.value;
    if (currentValue instanceof Date && !isNaN(currentValue.getTime())) {
      setTimeout(() => {
        this.birthdayService.clearSuggestion();
      }, TIMEOUTS.DEBOUNCE_TIME);
    }
  }

  /**
   * Apply the suggested birthday to the form
   */
  applyBirthdaySuggestion(): void {
    this.birthdayService.applyBirthdaySuggestion(
      this.profileForm.get("dateOfBirth") ?? null,
    );
  }

  selectTheme(theme: string): void {
    this.preferencesForm.get("theme")?.setValue(theme);
  }

  /**
   * Load existing profile data from Supabase and TeamMembershipService
   */
  private async loadInitialData(): Promise<void> {
    this.isPageLoading.set(true);
    this.pageErrorMessage.set(null);

    const [
      {
        profilePatch,
        membershipPatch,
        notificationPatch,
        privacyPatch,
        preferencePatch,
        errorMessage,
      },
      teamsErrorMessage,
    ] =
      await Promise.all([
        this.profileInitService.loadProfileData(),
        this.teamRequestService.loadAvailableTeams(),
      ]);

    if (errorMessage || teamsErrorMessage) {
      this.pageErrorMessage.set(
        errorMessage ||
          teamsErrorMessage ||
          this.settingsLoadErrorFallback,
      );
      this.isPageLoading.set(false);
      return;
    }

    if (profilePatch) {
      this.profileForm.patchValue({
        ...profilePatch,
        displayName:
          profilePatch.displayName ||
          this.profileForm.get("displayName")?.value,
      });
    }

    if (membershipPatch) {
      this.profileForm.patchValue({
        teamId: membershipPatch.teamId,
        position:
          membershipPatch.position || this.profileForm.get("position")?.value,
        jerseyNumber:
          membershipPatch.jerseyNumber ||
          this.profileForm.get("jerseyNumber")?.value,
      });

      this.logger.info("settings_form_values_debug", {
        position: this.profileForm.get("position")?.value,
        jerseyNumber: this.profileForm.get("jerseyNumber")?.value,
      });
    }

    if (notificationPatch) {
      this.notificationForm.patchValue(notificationPatch);
    }

    if (privacyPatch) {
      this.privacyForm.patchValue(privacyPatch);
    }

    if (preferencePatch) {
      this.preferencesForm.patchValue(preferencePatch);
    }

    this.isPageLoading.set(false);
  }

  retryLoad(): void {
    void this.loadInitialData();
  }

  async saveSettings(): Promise<void> {
    this.logger.debug(
      "[saveSettings] Form states:",
      toLogContext({
        profileValid: this.profileForm.valid,
        notificationValid: this.notificationForm.valid,
        privacyValid: this.privacyForm.valid,
        preferencesValid: this.preferencesForm.valid,
      }),
    );

    if (this.profileForm.invalid) {
      this.logger.warn("settings_save_profile_invalid");
      this.profileForm.markAllAsTouched();
      this.toastService.warn(TOAST.WARN.REQUIRED_FIELDS);
      return;
    }

    const settings: SaveSettingsInput = {
      profile: this.profileForm.value,
      notifications: this.notificationForm.value,
      privacy: this.privacyForm.value,
      preferences: this.preferencesForm.value,
    };
    await this.saveSettingsService.saveSettings(settings);
  }

  async changePassword(): Promise<void> {
    this.logger.debug(
      "[changePassword] Form valid:",
      toLogContext(this.passwordForm.valid),
    );

    if (this.passwordForm.invalid) {
      this.logger.warn("settings_change_password_invalid");
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { newPassword } = this.passwordForm.value;
    const changed = await this.securityService.changePassword(
      String(newPassword ?? ""),
    );
    if (changed) {
      this.closeChangePasswordDialog();
    }
  }

  async deleteAccount(): Promise<void> {
    if (this.deleteConfirmText !== "DELETE") {
      this.logger.warn("settings_delete_account_confirmation_mismatch");
      return;
    }

    const submitted = await this.accountDeletionService.requestDeletion();
    if (submitted) {
      this.closeDeleteAccountDialog();
    }
  }

  // 2FA Methods
  async startSetup2FA(): Promise<void> {
    this.twoFAVerificationCode = "";
    this.show2FASetupDialog = true;
    await this.twoFactorService.startSetup();
  }

  copySecret(): void {
    this.twoFactorService.copySecret();
  }

  async verify2FA(): Promise<void> {
    await this.twoFactorService.verify(this.twoFAVerificationCode);
  }

  downloadBackupCodes(): void {
    this.twoFactorService.downloadBackupCodes();
  }

  close2FASetup(): void {
    this.show2FASetupDialog = false;
    this.twoFAVerificationCode = "";
    this.twoFactorService.resetSetup();
  }

  async disable2FA(): Promise<void> {
    const disabled = await this.twoFactorService.disable(this.disable2FACode);
    if (disabled) {
      this.closeDisable2FADialog();
    }
  }

  // Session Management
  async loadSessions(): Promise<void> {
    await this.sessionManagementService.loadSessions();
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionManagementService.revokeSession(sessionId);
  }

  async revokeAllSessions(): Promise<void> {
    const revoked = await this.sessionManagementService.revokeAllSessions();
    if (revoked) {
      this.closeSessionsDialog();
    }
  }

  // ============================================================================
  // DATA EXPORT
  // ============================================================================

  /**
   * Export user data in selected format
   */
  async exportUserData(): Promise<void> {
    const exported = await this.dataExportService.exportUserData({
      format: this.exportFormat,
      options: this.exportOptions,
    });
    if (exported) {
      this.closeDataExportDialog();
    }
  }

  /**
   * Calculate user's age from date of birth
   * Uses centralized date utility
   */
  calculateAge(): number | null {
    const dob = this.profileForm.get("dateOfBirth")?.value;
    if (!dob) return null;
    return calculateAge(dob);
  }

  // ============================================================================
  // TEAM SELECTION
  // ============================================================================

  /**
   * Handle team selection change
   */
  onTeamChange(value: string | null): void {
    if (value === "__new_team__") {
      this.profileForm.get("teamId")?.setValue(null);
      this.toastService.info(
        "Team creation requests have moved out of Settings for the 2.0 flow.",
        "Choose an Existing Team",
      );
    }
  }

  /**
   * Scroll to a settings section smoothly using Angular-friendly approach
   * Uses ElementRef and querySelector through the component's element reference
   * @param sectionId The ID of the section to scroll to
   */
  scrollToSection(sectionId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.activeSettingsSection.set(sectionId);
    this.navigateToSection(sectionId);
    this.scrollSectionIntoView(sectionId);
  }

  clearSettingsSearch(): void {
    this.settingsSearchQuery.set("");
  }

  private syncSectionFromRoute(): void {
    const sectionId = this.getSectionIdForCurrentRoute();
    this.activeSettingsSection.set(sectionId);

    if (this.isPageLoading()) {
      return;
    }

    this.scrollSectionIntoView(sectionId);
  }

  private getSectionIdForCurrentRoute(): string {
    const path = this.route.snapshot.routeConfig?.path ?? "settings";

    switch (path) {
      case "settings/profile":
      case "settings":
        return "account-settings";
      case "settings/notifications":
        return "notifications-settings";
      case "settings/privacy-security":
        return "privacy-settings";
      case "settings/preferences":
        return "preferences-settings";
      case "settings/security":
        return "security-settings";
      default:
        return "account-settings";
    }
  }

  private navigateToSection(sectionId: string): void {
    const route = this.settingsNavItems.find((item) => item.id === sectionId)?.route;
    if (!route || this.router.url === route) {
      return;
    }

    void this.router.navigateByUrl(route);
  }

  private scrollSectionIntoView(sectionId: string): void {

    setTimeout(() => {
      const settingsContainer = this.elementRef?.nativeElement;
      if (settingsContainer) {
        const element = settingsContainer.querySelector(`#${sectionId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }, 0);
  }

  // Inject ElementRef for scoped DOM queries
  private elementRef = inject(ElementRef);

  closeChangePasswordDialog(): void {
    this.showChangePasswordDialog = false;
    this.passwordForm.reset();
  }

  closeDeleteAccountDialog(): void {
    this.showDeleteAccountDialog = false;
    this.deleteConfirmText = "";
  }

  closeDisable2FADialog(): void {
    this.showDisable2FADialog = false;
    this.disable2FACode = "";
  }

  closeSessionsDialog(): void {
    this.showSessionsDialog = false;
  }

  closeDataExportDialog(): void {
    this.showDataExportDialog = false;
  }
}
