import { Injectable, inject } from "@angular/core";
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ValidationErrors,
  Validators,
} from "@angular/forms";

interface AuthUserLike {
  name?: string | null;
  email?: string | null;
  position?: string | null;
}

type ProfileForm = FormGroup<{
  displayName: FormControl<string>;
  email: FormControl<string>;
  dateOfBirth: FormControl<Date | null>;
  position: FormControl<string>;
  jerseyNumber: FormControl<string>;
  heightCm: FormControl<number | null>;
  weightKg: FormControl<number | null>;
  teamId: FormControl<string | null>;
  phone: FormControl<string>;
  country: FormControl<string>;
}>;

type NotificationForm = FormGroup<{
  emailNotifications: FormControl<boolean>;
  pushNotifications: FormControl<boolean>;
  inAppNotifications: FormControl<boolean>;
  trainingReminders: FormControl<boolean>;
  wellnessReminders: FormControl<boolean>;
  gameAlerts: FormControl<boolean>;
  teamAnnouncements: FormControl<boolean>;
  coachMessages: FormControl<boolean>;
  achievementAlerts: FormControl<boolean>;
  tournamentAlerts: FormControl<boolean>;
  injuryRiskAlerts: FormControl<boolean>;
  digestFrequency: FormControl<string>;
  quietHoursEnabled: FormControl<boolean>;
  quietHoursStart: FormControl<string>;
  quietHoursEnd: FormControl<string>;
}>;

type PrivacyForm = FormGroup<{
  profileVisibility: FormControl<string>;
  showStats: FormControl<boolean>;
}>;

type PreferencesForm = FormGroup<{
  theme: FormControl<string>;
  language: FormControl<string>;
}>;

type PasswordForm = FormGroup<{
  currentPassword: FormControl<string>;
  newPassword: FormControl<string>;
  confirmNewPassword: FormControl<string>;
}>;

@Injectable({
  providedIn: "root",
})
export class SettingsFormFactoryService {
  private readonly fb = inject(NonNullableFormBuilder);

  createProfileForm(user: AuthUserLike | null | undefined): ProfileForm {
    return this.fb.group({
      displayName: [user?.name || "", Validators.required],
      email: [user?.email || "", [Validators.required, Validators.email]],
      dateOfBirth: new FormControl<Date | null>(null),
      position: [user?.position || ""],
      jerseyNumber: [""],
      heightCm: new FormControl<number | null>(null),
      weightKg: new FormControl<number | null>(null),
      teamId: new FormControl<string | null>(null),
      phone: [""],
      country: [""],
    });
  }

  createNotificationForm(): NotificationForm {
    return this.fb.group({
      emailNotifications: [true],
      pushNotifications: [true],
      inAppNotifications: [true],
      trainingReminders: [true],
      wellnessReminders: [true],
      gameAlerts: [true],
      teamAnnouncements: [true],
      coachMessages: [true],
      achievementAlerts: [true],
      tournamentAlerts: [true],
      injuryRiskAlerts: [true],
      digestFrequency: ["realtime"],
      quietHoursEnabled: [true],
      quietHoursStart: ["22:00"],
      quietHoursEnd: ["07:00"],
    });
  }

  createPrivacyForm(): PrivacyForm {
    return this.fb.group({
      profileVisibility: ["public"],
      showStats: [true],
    });
  }

  createPreferencesForm(themeMode: string): PreferencesForm {
    return this.fb.group({
      theme: [themeMode],
      language: ["en"],
    });
  }

  createPasswordForm(): PasswordForm {
    return this.fb.group(
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

  private passwordMatchValidator(
    form: AbstractControl,
  ): ValidationErrors | null {
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
}
