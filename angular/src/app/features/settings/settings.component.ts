import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    inject,
    OnInit,
    signal,
    viewChild,
} from "@angular/core";

import {
    FormBuilder,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    Validators,
} from "@angular/forms";
import { RouterLink } from "@angular/router";
import { CardModule } from "primeng/card";
import { DatePicker } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { ProgressBarModule } from "primeng/progressbar";
import { Select } from "primeng/select";
import { ToastModule } from "primeng/toast";
import { ToggleSwitch } from "primeng/toggleswitch";
import { TooltipModule } from "primeng/tooltip";
import { TIMEOUTS, TOAST, UI_LIMITS } from "../../core/constants";
import { AuthService } from "../../core/services/auth.service";
import {
    LoggerService,
    toLogContext,
} from "../../core/services/logger.service";
import { PlatformService } from "../../core/services/platform.service";
import { ProfileCompletionService } from "../../core/services/profile-completion.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { ThemeMode, ThemeService } from "../../core/services/theme.service";
import { ToastService } from "../../core/services/toast.service";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import {
    ButtonComponent,
    CardComponent,
    ControlRowComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
} from "../../shared/components/ui-components";
import { MobileOptimizedImageDirective } from "../../shared/directives/mobile-optimized-image.directive";
import { calculateAge } from "../../shared/utils/date.utils";

@Component({
  selector: "app-settings",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CardModule,
    DatePicker,
    InputTextModule,
    ProgressBarModule,
    Select,
    ToastModule,
    ButtonComponent,
    IconButtonComponent,
    CardComponent,
    ControlRowComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    MobileOptimizedImageDirective,
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
export class SettingsComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);
  private themeService = inject(ThemeService);
  private logger = inject(LoggerService);
  private profileCompletionService = inject(ProfileCompletionService);
  private teamMembershipService = inject(TeamMembershipService);
  private platform = inject(PlatformService);

  // Angular 21: Use viewChild() signal instead of @ViewChild()
  dobDatePickerRef = viewChild<ElementRef<HTMLElement>>("dobDatePicker");

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
  isSavingSettings = signal(false);
  isChangingPassword = signal(false);
  isDeletingAccount = signal(false);
  isEnabling2FA = signal(false);
  isDisabling2FA = signal(false);
  isRevokingAll = signal(false);
  isExportingData = signal(false);
  exportProgress = signal(0);

  // Data export dialog
  showDataExportDialog = false;
  exportFormat: "json" | "csv" = "json";
  exportOptions = {
    profile: true,
    training: true,
    wellness: true,
    achievements: true,
    settings: true,
  };

  // Team selection
  availableTeams = signal<Array<{ label: string; value: string }>>([]);
  showNewTeamDialog = false;
  newTeamName = "";
  newTeamNotes = "";
  isSubmittingTeamRequest = signal(false);

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
  birthdaySuggestion = signal<{
    date: Date | null;
    age: number | null;
    formatted: string;
  } | null>(null);

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
      dateOfBirth: [null as Date | null],
      position: [user?.position || ""],
      jerseyNumber: [""],
      heightCm: [null as number | null],
      weightKg: [null as number | null],
      teamId: [null as string | null],
      phone: [""],
    });

    // Load existing profile data and available teams
    this.loadProfileData();
    this.loadAvailableTeams();

    this.notificationForm = this.fb.group({
      // Delivery channels
      emailNotifications: [true],
      pushNotifications: [true],
      inAppNotifications: [true],
      // Notification categories
      trainingReminders: [true],
      wellnessReminders: [true],
      gameAlerts: [true],
      teamAnnouncements: [true],
      coachMessages: [true],
      achievementAlerts: [true],
      tournamentAlerts: [true],
      injuryRiskAlerts: [true],
      // Frequency & timing
      digestFrequency: ["realtime"], // 'realtime', 'daily', 'weekly'
      quietHoursEnabled: [true],
      quietHoursStart: ["22:00"],
      quietHoursEnd: ["07:00"],
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

  ngAfterViewInit(): void {
    // Set up input listener for manual date typing
    setTimeout(() => {
      this.setupBirthdayInputListener();
    }, TIMEOUTS.UI_MICRO_DELAY);
  }

  private retryCount = 0;
  private readonly MAX_RETRIES = 10;

  /**
   * Set up input event listener on the datepicker input element
   * to detect manual typing and provide suggestions
   */
  private setupBirthdayInputListener(): void {
    const ref = this.dobDatePickerRef();
    if (!ref?.nativeElement) {
      // Retry after a short delay if element not found
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        setTimeout(
          () => this.setupBirthdayInputListener(),
          TIMEOUTS.UI_MICRO_DELAY,
        );
      }
      return;
    }

    // Find the input element within the datepicker
    // PrimeNG datepicker wraps input in .p-datepicker or .p-calendar
    const datepickerWrapper = ref.nativeElement.querySelector(
      ".p-datepicker, .p-calendar",
    );
    const inputElement = datepickerWrapper
      ? (datepickerWrapper.querySelector("input") as HTMLInputElement)
      : (ref.nativeElement.querySelector(
          "input",
        ) as HTMLInputElement);

    if (!inputElement) {
      // Retry after a short delay if input not found
      if (this.retryCount < this.MAX_RETRIES) {
        this.retryCount++;
        setTimeout(
          () => this.setupBirthdayInputListener(),
          TIMEOUTS.UI_MICRO_DELAY,
        );
      }
      return;
    }

    // Reset retry count on success
    this.retryCount = 0;

    // Mark as set up to avoid duplicate listeners
    const el = inputElement as HTMLInputElement & {
      __suggestionListenerSetup?: boolean;
    };
    if (el.__suggestionListenerSetup) {
      return;
    }
    el.__suggestionListenerSetup = true;

    // Listen for input events (manual typing)
    const inputHandler = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const typedValue = target.value.trim();

      if (typedValue.length > 0) {
        this.parseAndSuggestBirthday(typedValue);
      } else {
        this.birthdaySuggestion.set(null);
      }
    };

    inputElement.addEventListener("input", inputHandler);

    // Clear suggestion on blur if date is valid
    const blurHandler = () => {
      const currentValue = this.profileForm.get("dateOfBirth")?.value;
      if (currentValue instanceof Date && !isNaN(currentValue.getTime())) {
        // Valid date selected, clear suggestion after a short delay
        setTimeout(() => {
          this.birthdaySuggestion.set(null);
        }, TIMEOUTS.DEBOUNCE_TIME);
      }
    };

    inputElement.addEventListener("blur", blurHandler);
  }

  /**
   * Parse manually typed birthday string and provide suggestions
   * Supports formats: DD.MM.YYYY, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY
   */
  private parseAndSuggestBirthday(typedValue: string): void {
    // Try to parse various date formats
    const formats = [
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY (European)
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY or MM/DD/YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
      /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/, // DD.MM.YY (2-digit year)
      /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, // DD/MM/YY or MM/DD/YY
    ];

    let parsedDate: Date | null = null;
    let day = 0;
    let month = 0;
    let year = 0;

    for (const format of formats) {
      const match = typedValue.match(format);
      if (match) {
        const [, part1, part2, part3] = match;
        const num1 = parseInt(part1, 10);
        const num2 = parseInt(part2, 10);
        const num3 = parseInt(part3, 10);

        // Determine format based on values
        // If first part > 12, it's likely DD.MM format (European)
        // Otherwise, try MM/DD format (US)
        if (num1 > 12) {
          // European format: DD.MM.YYYY
          day = num1;
          month = num2 - 1; // JavaScript months are 0-indexed
          year = num3 < 100 ? 2000 + num3 : num3;
        } else if (num2 > 12) {
          // US format: MM/DD/YYYY
          month = num1 - 1;
          day = num2;
          year = num3 < 100 ? 2000 + num3 : num3;
        } else {
          // Ambiguous - try both formats, prefer European for birthday context
          // Check if it's a valid date in DD.MM format first
          if (num1 <= 31 && num2 <= 12) {
            day = num1;
            month = num2 - 1;
            year = num3 < 100 ? 2000 + num3 : num3;
          } else {
            month = num1 - 1;
            day = num2;
            year = num3 < 100 ? 2000 + num3 : num3;
          }
        }

        // Validate date
        parsedDate = new Date(year, month, day);
        if (
          parsedDate.getFullYear() === year &&
          parsedDate.getMonth() === month &&
          parsedDate.getDate() === day
        ) {
          // Check if date is valid (not in future, at least 5 years old)
          const today = new Date();
          const maxDate = this.maxBirthDate;
          if (parsedDate <= today && parsedDate <= maxDate) {
            break;
          } else {
            parsedDate = null;
          }
        } else {
          parsedDate = null;
        }
      }
    }

    if (parsedDate && !isNaN(parsedDate.getTime())) {
      // Calculate age
      const age = this.calculateAgeFromDate(parsedDate);

      // Format date for display
      const formatted = parsedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      this.birthdaySuggestion.set({
        date: parsedDate,
        age,
        formatted,
      });
    } else {
      // Invalid or incomplete date
      this.birthdaySuggestion.set(null);
    }
  }

  /**
   * Calculate age from a birth date using centralized utility
   */
  private calculateAgeFromDate(birthDate: Date): number {
    return calculateAge(birthDate);
  }

  /**
   * Apply the suggested birthday to the form
   */
  applyBirthdaySuggestion(): void {
    const suggestion = this.birthdaySuggestion();
    if (suggestion?.date) {
      this.profileForm.get("dateOfBirth")?.setValue(suggestion.date);
      this.birthdaySuggestion.set(null);
    }
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
   * Load existing profile data from Supabase and TeamMembershipService
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
        .maybeSingle();

      if (!error && profile) {
        this.logger.debug("[Settings] Loaded user profile:", {
          position: profile.position,
          jerseyNumber: profile.jersey_number,
        });

        // Patch form with existing data (map users columns to form fields)
        this.profileForm.patchValue({
          displayName:
            profile.full_name ||
            `${profile.first_name || ""} ${profile.last_name || ""}`.trim() ||
            this.profileForm.get("displayName")?.value,
          dateOfBirth: profile.date_of_birth
            ? new Date(profile.date_of_birth)
            : null,
          position: profile.position || "",
          jerseyNumber: profile.jersey_number?.toString() || "",
          heightCm: profile.height_cm || null,
          weightKg: profile.weight_kg || null,
          phone: profile.phone || "",
        });
      }

      // Load team membership using centralized service
      await this.teamMembershipService.loadMembership();
      const membership = this.teamMembershipService.membership();

      if (membership) {
        this.logger.debug(
          "[Settings] Loaded team membership (authoritative):",
          {
            position: membership.position,
            jerseyNumber: membership.jerseyNumber,
          },
        );

        this.profileForm.patchValue({
          teamId: membership.teamId,
          // team_members is authoritative for position/jersey, override users table values
          position:
            membership.position || this.profileForm.get("position")?.value,
          jerseyNumber:
            membership.jerseyNumber?.toString() ||
            this.profileForm.get("jerseyNumber")?.value,
        });

        this.logger.info("[Settings] Final form values:", {
          position: this.profileForm.get("position")?.value,
          jerseyNumber: this.profileForm.get("jerseyNumber")?.value,
        });
      }
    } catch (error) {
      this.logger.warn("Could not load profile data:", toLogContext(error));
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
    this.logger.debug("[saveSettings] Form states:", toLogContext({
      profileValid: this.profileForm.valid,
      notificationValid: this.notificationForm.valid,
      privacyValid: this.privacyForm.valid,
      preferencesValid: this.preferencesForm.valid,
    }));

    if (this.profileForm.invalid) {
      this.logger.warn("[saveSettings] Profile form invalid, aborting");
      this.profileForm.markAllAsTouched();
      this.toastService.warn(TOAST.WARN.REQUIRED_FIELDS);
      return;
    }

    this.isSavingSettings.set(true);

    const settings = {
      profile: this.profileForm.value,
      notifications: this.notificationForm.value,
      privacy: this.privacyForm.value,
      preferences: this.preferencesForm.value,
    };

    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) {
        this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
        return;
      }

      this.logger.info("Saving settings for user:", user.id);

      // Save settings to localStorage as fallback (works without database tables)
      const localSettings = {
        userId: user.id,
        ...settings,
        updatedAt: new Date().toISOString(),
      };
      this.platform.setLocalStorage("user_settings", JSON.stringify(localSettings));
      this.logger.info("Settings saved to localStorage");

      // Apply theme immediately
      if (settings.preferences.theme) {
        this.themeService.setMode(settings.preferences.theme);
        this.logger.info("Theme applied:", settings.preferences.theme);
      }

      // Track if user exists for later toast message
      let existingUser: any = null;

      // Try to update user data in Supabase users table
      try {
        const nameParts = settings.profile.displayName?.split(" ") || [];

        // Format date of birth for database (YYYY-MM-DD)
        let dateOfBirthStr: string | null = null;
        if (settings.profile.dateOfBirth) {
          const dob = new Date(settings.profile.dateOfBirth);
          if (!isNaN(dob.getTime())) {
            dateOfBirthStr = dob.toISOString().split("T")[0];
          }
        }

        // Prepare update data - NEVER include id, created_at, or password_hash
        const updateData = {
          email: user.email || null,
          full_name: settings.profile.displayName,
          first_name: nameParts[0] || null,
          last_name: nameParts.slice(1).join(" ") || null,
          position: settings.profile.position,
          jersey_number: settings.profile.jerseyNumber
            ? parseInt(settings.profile.jerseyNumber, 10)
            : null,
          height_cm: settings.profile.heightCm || null,
          weight_kg: settings.profile.weightKg || null,
          phone: settings.profile.phone || null,
          date_of_birth: dateOfBirthStr,
          onboarding_completed: true, // Mark as onboarded when profile is saved
          updated_at: new Date().toISOString(),
        };

        this.logger.info("Updating users table with:", updateData);

        // CRITICAL: Check if user exists, then INSERT or UPDATE accordingly
        // This ensures user record is created if it doesn't exist
        const { data } = await this.supabaseService.client
          .from("users")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        existingUser = data;

        this.logger.info("User exists check:", { exists: !!existingUser });

        let upsertedUser;
        let profileError;

        if (existingUser) {
          // User exists - UPDATE
          this.logger.info("User exists in users table, updating...");
          const result = await this.supabaseService.client
            .from("users")
            .update(updateData)
            .eq("id", user.id)
            .select()
            .maybeSingle();

          upsertedUser = result.data;
          profileError = result.error;
        } else {
          // User doesn't exist - INSERT with required fields
          this.logger.info("User not in users table, inserting...");
          const insertData = {
            ...updateData,
            id: user.id,
            created_at: new Date().toISOString(),
            // Don't include password_hash - it's nullable now and managed by Supabase Auth
          };

          const result = await this.supabaseService.client
            .from("users")
            .insert(insertData)
            .select()
            .maybeSingle();

          upsertedUser = result.data;
          profileError = result.error;
        }

        if (profileError) {
          this.logger.error(
            "User profile save failed:",
            profileError.message,
            profileError,
          );
          this.toastService.error(
            `Failed to save profile: ${profileError.message}`,
          );
          throw profileError;
        }

        if (upsertedUser) {
          this.logger.info("User profile saved successfully:", upsertedUser);
        } else {
          this.logger.warn("User profile save returned no data");
        }

        // ALWAYS update team_members if user has an existing membership
        // This ensures position/jersey/team stay in sync
        const { data: existingTeamMember } = await this.supabaseService.client
          .from("team_members")
          .select("id, team_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingTeamMember) {
          const parsedJersey = settings.profile.jerseyNumber
            ? parseInt(settings.profile.jerseyNumber, 10)
            : null;

          // Check if team has changed
          const teamChanged =
            settings.profile.teamId &&
            settings.profile.teamId !== existingTeamMember.team_id;

          this.logger.info("Updating team_members:", {
            position: settings.profile.position,
            jersey: parsedJersey,
            requestedTeamId: settings.profile.teamId,
            currentTeamId: existingTeamMember.team_id,
            teamChanged,
          });

          if (teamChanged) {
            // Team transfer: Delete old membership and create new one
            this.logger.info("Team transfer detected, creating new membership");

            // Delete old membership
            const { error: deleteError } = await this.supabaseService.client
              .from("team_members")
              .delete()
              .eq("id", existingTeamMember.id);

            if (deleteError) {
              this.logger.error(
                "Failed to delete old team membership:",
                deleteError,
              );
              throw new Error(
                `Failed to transfer teams: ${deleteError.message}`,
              );
            }

            // Create new membership in new team
            const { data: newMember, error: insertError } =
              await this.supabaseService.client
                .from("team_members")
                .insert({
                  user_id: user.id,
                  team_id: settings.profile.teamId!,
                  role: "player",
                  position: settings.profile.position || null,
                  jersey_number: parsedJersey,
                  status: "active",
                })
                .select()
                .maybeSingle();

            if (insertError) {
              this.logger.error(
                "Failed to create new team membership:",
                insertError,
              );
              throw new Error(
                `Failed to join new team: ${insertError.message}`,
              );
            }

            this.logger.info(
              "Successfully transferred to new team:",
              newMember,
            );
          } else {
            // Same team, just update position/jersey
            const { data: updatedMember, error: memberError } =
              await this.supabaseService.client
                .from("team_members")
                .update({
                  position: settings.profile.position || null,
                  jersey_number: parsedJersey,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existingTeamMember.id)
                .select()
                .maybeSingle();

            if (memberError) {
              this.logger.error(
                "Failed to update team_members:",
                memberError.message,
                memberError,
              );
              throw new Error(
                `Failed to update team membership: ${memberError.message}`,
              );
            }

            this.logger.info(
              "Successfully updated team membership:",
              updatedMember,
            );
          }
        } else if (settings.profile.teamId) {
          // No existing membership but team was selected - create new
          this.logger.info(
            "Creating team membership:",
            settings.profile.teamId,
          );
          await this.updateTeamMembership(
            user.id,
            settings.profile.teamId,
            settings.profile.position,
            settings.profile.jerseyNumber,
          );
        }
      } catch (error) {
        // Table update failed, continue with localStorage save
        this.logger.warn("Users table update failed:", toLogContext(error));
      }

      // Also update auth user metadata with display name
      try {
        const { data: authData, error: authError } =
          await this.supabaseService.updateUser({
            data: {
              full_name: settings.profile.displayName,
              name: settings.profile.displayName,
              position: settings.profile.position,
            },
          });

        if (authError) {
          this.logger.warn("Auth metadata update failed:", authError);
        } else {
          this.logger.info("Auth metadata updated successfully:", authData);
        }
      } catch (error) {
        // Non-critical
        this.logger.warn("Auth metadata update error:", toLogContext(error));
      }

      // Try to update user settings table
      try {
        const settingsData = {
          user_id: user.id,
          email_notifications: settings.notifications.emailNotifications,
          push_notifications: settings.notifications.pushNotifications,
          training_reminders: settings.notifications.trainingReminders,
          profile_visibility: settings.privacy.profileVisibility,
          show_stats: settings.privacy.showStats,
          theme: settings.preferences.theme,
          language: settings.preferences.language,
          updated_at: new Date().toISOString(),
        };

        this.logger.info("Upserting user_settings:", settingsData);

        // Check if settings record exists first
        const { data: existingSettings } = await this.supabaseService.client
          .from("user_settings")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        let settingsResult;
        let settingsError;

        if (existingSettings) {
          // Settings exist - UPDATE
          this.logger.info("User settings exist, updating...");
          const result = await this.supabaseService.client
            .from("user_settings")
            .update({
              email_notifications: settings.notifications.emailNotifications,
              push_notifications: settings.notifications.pushNotifications,
              training_reminders: settings.notifications.trainingReminders,
              profile_visibility: settings.privacy.profileVisibility,
              show_stats: settings.privacy.showStats,
              theme: settings.preferences.theme,
              language: settings.preferences.language,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
            .select()
            .maybeSingle();

          settingsResult = result.data;
          settingsError = result.error;
        } else {
          // Settings don't exist - INSERT
          this.logger.info("User settings don't exist, inserting...");
          const result = await this.supabaseService.client
            .from("user_settings")
            .insert(settingsData)
            .select()
            .maybeSingle();

          settingsResult = result.data;
          settingsError = result.error;
        }

        if (settingsError) {
          this.logger.warn(
            "Settings table update failed:",
            settingsError.message,
          );
        } else {
          this.logger.info("User settings saved successfully:", settingsResult);
        }
      } catch (error) {
        // Table doesn't exist, continue with localStorage save
        this.logger.warn("user_settings table error:", toLogContext(error));
      }

      // Update email if changed
      if (settings.profile.email !== this.authService.getUser()?.email) {
        try {
          this.logger.info("Updating email to:", settings.profile.email);
          const { error: emailError } = await this.supabaseService.updateUser({
            email: settings.profile.email,
          });

          if (emailError) {
            this.logger.warn("Email update error:", emailError);
            this.toastService.info(
              "Email update requires verification. Check your inbox.",
            );
          } else {
            this.logger.info("Email update initiated");
          }
        } catch (error) {
          // Email update not supported
          this.logger.warn("Email update failed:", toLogContext(error));
        }
      }

      // Refresh centralized services so all views update
      this.logger.info("Refreshing centralized services...");
      await this.authService.refreshUser();
      await this.profileCompletionService.refresh();
      await this.teamMembershipService.refresh();
      this.logger.info("Services refreshed successfully");

      this.toastService.success(TOAST.SUCCESS.SETTINGS_SAVED);

      // Provide helpful guidance if this is first-time setup
      if (!existingUser) {
        this.toastService.info(
          "Profile created! Visit the Roster page to see yourself listed.",
          { life: 5000 },
        );
      }
    } catch (error) {
      console.error("❌ [saveSettings] Failed to save settings:", error);
      console.trace("Error stack trace:");
      this.logger.error("Save settings error:", toLogContext(error));
      const message =
        error instanceof Error ? error.message : "Failed to save settings";
      this.toastService.error(message);
    } finally {
      this.isSavingSettings.set(false);
    }
  }

  async changePassword(): Promise<void> {
    this.logger.debug("[changePassword] Form valid:", toLogContext(this.passwordForm.valid));

    if (this.passwordForm.invalid) {
      this.logger.warn("[changePassword] Form invalid, aborting");
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

      this.toastService.success(TOAST.SUCCESS.PASSWORD_CHANGED);
      this.showChangePasswordDialog = false;
      this.passwordForm.reset();
      this.logger.info("[changePassword] Password changed successfully");
    } catch (error) {
      this.logger.error("[changePassword] Failed to change password:", error);
      const message =
        error instanceof Error ? error.message : "Failed to update password";
      this.toastService.error(message);
    } finally {
      this.isChangingPassword.set(false);
    }
  }

  async deleteAccount(): Promise<void> {
    this.logger.debug("[deleteAccount] Attempting account deletion");

    if (this.deleteConfirmText !== "DELETE") {
      this.logger.warn("[deleteAccount] Confirmation text mismatch, aborting");
      return;
    }

    this.isDeletingAccount.set(true);

    try {
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
          reason: "User requested deletion",
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
      this.logger.info("[deleteAccount] Deletion request submitted successfully");
    } catch (error) {
      this.logger.error("[deleteAccount] Failed to delete account:", error);
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
    this.toastService.success(TOAST.SUCCESS.COPIED);
  }

  async verify2FA(): Promise<void> {
    this.logger.debug("[verify2FA] Attempting verification");

    if (this.twoFAVerificationCode.length !== 6) {
      this.logger.warn("[verify2FA] Invalid code length, aborting");
      return;
    }

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
        this.logger.warn(
          "Could not save 2FA settings:",
          toLogContext(error.message),
        );
      }

      // Generate backup codes
      const codes = this.generateBackupCodes();
      this.backupCodes.set(codes);

      // Move to success step
      this.twoFAStep.set(4);
      this.is2FAEnabled.set(true);
      this.toastService.success(TOAST.SUCCESS.UPDATED);
      this.logger.info("[verify2FA] 2FA enabled successfully");
    } catch (error) {
      this.logger.error("[verify2FA] Verification failed:", error);
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

    this.toastService.success(TOAST.SUCCESS.COPIED);
  }

  close2FASetup(): void {
    this.show2FASetupDialog = false;
    this.twoFAStep.set(1);
    this.twoFAVerificationCode = "";
    this.twoFASecret.set("");
    this.qrCodeUrl.set("");
  }

  async disable2FA(): Promise<void> {
    this.logger.debug("[disable2FA] Attempting to disable 2FA");

    if (this.disable2FACode.length !== 6) {
      this.logger.warn("[disable2FA] Invalid code length, aborting");
      return;
    }

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
        this.logger.warn("Could not disable 2FA:", toLogContext(error.message));
      }

      this.is2FAEnabled.set(false);
      this.showDisable2FADialog = false;
      this.disable2FACode = "";
      this.toastService.success(TOAST.SUCCESS.UPDATED);
      this.logger.info("[disable2FA] 2FA disabled successfully");
    } catch (error) {
      this.logger.error("[disable2FA] Failed to disable 2FA:", error);
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
          },
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
      this.toastService.success(TOAST.SUCCESS.UPDATED);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.UPDATE_FAILED);
    }
  }

  async revokeAllSessions(): Promise<void> {
    this.isRevokingAll.set(true);

    try {
      // In production, call Supabase to revoke all other sessions
      await new Promise((resolve) =>
        setTimeout(resolve, TIMEOUTS.UI_TRANSITION_DELAY),
      );

      this.activeSessions.update((sessions) =>
        sessions.filter((s) => s.isCurrent),
      );
      this.toastService.success(TOAST.SUCCESS.UPDATED);
      this.showSessionsDialog = false;
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.UPDATE_FAILED);
    } finally {
      this.isRevokingAll.set(false);
    }
  }

  // ============================================================================
  // DATA EXPORT
  // ============================================================================

  /**
   * Export user data in selected format
   */
  async exportUserData(): Promise<void> {
    this.logger.debug("[exportUserData] Starting export", toLogContext({
      format: this.exportFormat,
      options: this.exportOptions,
    }));

    this.isExportingData.set(true);
    this.exportProgress.set(0);

    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) {
        this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
        return;
      }

      const exportData: Record<string, unknown> = {
        exportDate: new Date().toISOString(),
        userId: user.id,
        email: user.email,
      };

      // Collect data based on selected options
      let progress = 0;
      const totalSteps = Object.values(this.exportOptions).filter(
        Boolean,
      ).length;

      if (this.exportOptions.profile) {
        this.exportProgress.set((progress += 100 / totalSteps));
        const { data: profile } = await this.supabaseService.client
          .from("users")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (profile) {
          exportData.profile = {
            fullName: profile.full_name,
            firstName: profile.first_name,
            lastName: profile.last_name,
            dateOfBirth: profile.date_of_birth,
            position: profile.position,
            jerseyNumber: profile.jersey_number,
            team: profile.team,
            phone: profile.phone,
            createdAt: profile.created_at,
          };
        }
      }

      if (this.exportOptions.training) {
        this.exportProgress.set((progress += 100 / totalSteps));
        const { data: sessions } = await this.supabaseService.client
          .from("training_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("session_date", { ascending: false })
          .limit(UI_LIMITS.EXPORT_SESSIONS_MAX);
        exportData.trainingSessions = sessions || [];
      }

      if (this.exportOptions.wellness) {
        this.exportProgress.set((progress += 100 / totalSteps));
        const { data: wellness } = await this.supabaseService.client
          .from("daily_wellness_checkin")
          .select("*")
          .eq("user_id", user.id)
          .order("checkin_date", { ascending: false })
          .limit(UI_LIMITS.EXPORT_WELLNESS_MAX);
        exportData.wellnessCheckins = wellness || [];
      }

      if (this.exportOptions.achievements) {
        this.exportProgress.set((progress += 100 / totalSteps));
        const { data: achievements } = await this.supabaseService.client
          .from("user_achievements")
          .select("*")
          .eq("user_id", user.id);
        exportData.achievements = achievements || [];
      }

      if (this.exportOptions.settings) {
        this.exportProgress.set((progress += 100 / totalSteps));
        // Get settings from localStorage
        const localSettings = this.platform.getLocalStorage("user_settings");
        exportData.settings = localSettings ? JSON.parse(localSettings) : {};
      }

      this.exportProgress.set(100);

      // Generate and download the file
      let content: string;
      let filename: string;
      let mimeType: string;

      if (this.exportFormat === "json") {
        content = JSON.stringify(exportData, null, 2);
        filename = `flagfit-data-export-${new Date().toISOString().split("T")[0]}.json`;
        mimeType = "application/json";
      } else {
        // CSV format - flatten the data
        content = this.convertToCSV(exportData);
        filename = `flagfit-data-export-${new Date().toISOString().split("T")[0]}.csv`;
        mimeType = "text/csv";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      this.toastService.success(TOAST.SUCCESS.DATA_EXPORTED);
      this.showDataExportDialog = false;
      this.logger.info("[exportUserData] Data exported successfully");
    } catch (error) {
      this.logger.error("[exportUserData] Export failed:", error);
      this.toastService.error(TOAST.ERROR.EXPORT_FAILED);
    } finally {
      this.isExportingData.set(false);
      this.exportProgress.set(0);
    }
  }

  /**
   * Convert export data to CSV format
   */
  private convertToCSV(data: Record<string, unknown>): string {
    const lines: string[] = [];

    // Add header
    lines.push("FlagFit Pro Data Export");
    lines.push(`Export Date: ${data["exportDate"]}`);
    lines.push(`User ID: ${data["userId"]}`);
    lines.push(`Email: ${data["email"]}`);
    lines.push("");

    // Profile section
    if (data["profile"]) {
      lines.push("=== PROFILE ===");
      Object.entries(data["profile"] as Record<string, unknown>).forEach(
        ([key, value]) => {
          lines.push(`${key},${value || ""}`);
        },
      );
      lines.push("");
    }

    // Training sessions
    const sessions = data["trainingSessions"] as
      | Record<string, unknown>[]
      | undefined;
    if (sessions && sessions.length > 0) {
      lines.push("=== TRAINING SESSIONS ===");
      const headers = Object.keys(sessions[0]);
      lines.push(headers.join(","));
      sessions.forEach((session: Record<string, unknown>) => {
        lines.push(
          headers.map((h) => JSON.stringify(session[h] || "")).join(","),
        );
      });
      lines.push("");
    }

    // Wellness checkins
    const checkins = data["wellnessCheckins"] as
      | Record<string, unknown>[]
      | undefined;
    if (checkins && checkins.length > 0) {
      lines.push("=== WELLNESS CHECKINS ===");
      const headers = Object.keys(checkins[0]);
      lines.push(headers.join(","));
      checkins.forEach((checkin: Record<string, unknown>) => {
        lines.push(
          headers.map((h) => JSON.stringify(checkin[h] || "")).join(","),
        );
      });
      lines.push("");
    }

    // Achievements
    const achievements = data["achievements"] as
      | Record<string, unknown>[]
      | undefined;
    if (achievements && achievements.length > 0) {
      lines.push("=== ACHIEVEMENTS ===");
      const headers = Object.keys(achievements[0]);
      lines.push(headers.join(","));
      achievements.forEach((achievement: Record<string, unknown>) => {
        lines.push(
          headers.map((h) => JSON.stringify(achievement[h] || "")).join(","),
        );
      });
    }

    return lines.join("\n");
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
   * Load available teams from database (only approved teams)
   */
  private async loadAvailableTeams(): Promise<void> {
    try {
      const { data: teams, error } = await this.supabaseService.client
        .from("teams")
        .select("id, name")
        .eq("approval_status", "approved")
        .order("name");

      if (error) {
        this.logger.warn("Could not load teams:", toLogContext(error.message));
        return;
      }

      const teamOptions = (teams || []).map((team) => ({
        label: team.name,
        value: team.id,
      }));

      // Add "Request new team" option at the end
      teamOptions.push({
        label: "➕ Request to create a new team...",
        value: "__new_team__",
      });

      this.availableTeams.set(teamOptions);
    } catch (error) {
      this.logger.warn("Failed to load teams:", toLogContext(error));
    }
  }

  /**
   * Handle team selection change
   */
  onTeamChange(event: { value: string | null }): void {
    if (event.value === "__new_team__") {
      // Reset the dropdown selection and show new team dialog
      this.profileForm.get("teamId")?.setValue(null);
      this.showNewTeamDialog = true;
    }
  }

  /**
   * Submit request for a new team
   */
  async submitNewTeamRequest(): Promise<void> {
    this.logger.debug("[submitNewTeamRequest] Attempting to create team:", toLogContext(this.newTeamName));

    if (!this.newTeamName.trim()) {
      this.logger.warn("[submitNewTeamRequest] Team name empty, aborting");
      this.toastService.warn(TOAST.WARN.REQUIRED_FIELDS);
      return;
    }

    this.isSubmittingTeamRequest.set(true);

    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) {
        this.toastService.error(TOAST.ERROR.NOT_AUTHENTICATED);
        return;
      }

      // Create the team with pending_approval status
      const { data: newTeam, error: teamError } =
        await this.supabaseService.client
          .from("teams")
          .insert({
            name: this.newTeamName.trim(),
            approval_status: "pending_approval",
            application_notes: this.newTeamNotes.trim() || null,
            coach_id: user.id,
          })
          .select("id, name")
          .maybeSingle();

      if (teamError) {
        throw new Error(teamError.message);
      }

      if (!newTeam) {
        throw new Error("Failed to create team - no data returned");
      }

      // Create an approval request record
      await this.supabaseService.client.from("approval_requests").insert({
        request_type: "new_team",
        team_id: newTeam.id,
        user_id: user.id,
        request_reason:
          this.newTeamNotes.trim() ||
          `User requested to create team: ${this.newTeamName}`,
        status: "pending",
      });

      // Send email notification to superadmin
      await this.sendTeamApprovalNotification(user, this.newTeamName.trim());

      this.toastService.success(
        "Your team request has been submitted for approval. You will be notified once it's reviewed.",
      );

      this.showNewTeamDialog = false;
      this.newTeamName = "";
      this.newTeamNotes = "";
      this.logger.info("[submitNewTeamRequest] Team request submitted successfully");
    } catch (error) {
      this.logger.error("[submitNewTeamRequest] Failed to submit team request:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to submit team request";
      this.toastService.error(message);
    } finally {
      this.isSubmittingTeamRequest.set(false);
    }
  }

  /**
   * Send email notification to superadmin about new team request
   */
  private async sendTeamApprovalNotification(
    user: { id: string; email?: string },
    teamName: string,
  ): Promise<void> {
    try {
      // Call edge function to send email
      const { error } = await this.supabaseService.client.functions.invoke(
        "send-team-approval-notification",
        {
          body: {
            teamName,
            requestedBy: user.email || "Unknown user",
            requestedById: user.id,
            adminEmail: "merlin@ljubljanafrogs.si",
          },
        },
      );

      if (error) {
        this.logger.warn(
          "Could not send notification email:",
          toLogContext(error.message),
        );
        // Don't throw - the request was still created successfully
      }
    } catch (error) {
      this.logger.warn(
        "Failed to send team approval notification:",
        toLogContext(error),
      );
      // Don't throw - the request was still created successfully
    }
  }

  /**
   * Update user's team membership in team_members table
   * Syncs position and jersey number to team_members (authoritative source)
   */
  private async updateTeamMembership(
    userId: string,
    teamId: string,
    position?: string,
    jerseyNumber?: string,
  ): Promise<void> {
    try {
      const currentMembership = this.teamMembershipService.membership();
      const parsedJersey = jerseyNumber ? parseInt(jerseyNumber, 10) : null;

      // If we have current membership from the centralized service, use its method
      if (currentMembership && currentMembership.teamId === teamId) {
        // Use centralized service to update position and jersey
        await this.teamMembershipService.updatePositionAndJersey(
          position || null,
          parsedJersey,
        );
        return;
      }

      // Fallback: Check if user already has a membership in this team
      const { data: existingMembership } = await this.supabaseService.client
        .from("team_members")
        .select("id")
        .eq("user_id", userId)
        .eq("team_id", teamId)
        .maybeSingle();

      if (existingMembership) {
        // Update existing membership
        await this.supabaseService.client
          .from("team_members")
          .update({
            position: position || null,
            jersey_number: parsedJersey,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingMembership.id);
      } else {
        // Check if user has membership in another team
        const { data: otherMembership } = await this.supabaseService.client
          .from("team_members")
          .select("id, team_id")
          .eq("user_id", userId)
          .neq("team_id", teamId)
          .maybeSingle();

        if (otherMembership) {
          // Update to new team (effectively transfer)
          await this.supabaseService.client
            .from("team_members")
            .update({
              team_id: teamId,
              position: position || null,
              jersey_number: parsedJersey,
              updated_at: new Date().toISOString(),
            })
            .eq("id", otherMembership.id);
        } else {
          // Create new membership
          await this.supabaseService.client.from("team_members").insert({
            user_id: userId,
            team_id: teamId,
            role: "player",
            position: position || null,
            jersey_number: parsedJersey,
            status: "active",
          });
        }
      }
    } catch (error) {
      this.logger.warn(
        "Could not update team membership:",
        toLogContext(error),
      );
      // Don't throw - profile update was still successful
    }
  }

  /**
   * Scroll to a settings section smoothly
   * @param sectionId The ID of the section to scroll to
   */
  scrollToSection(sectionId: string, event?: Event): void {
    // Prevent any navigation behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
}
