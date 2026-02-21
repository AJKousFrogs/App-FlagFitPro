import { Injectable, inject } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

interface AuthUserLike {
  name?: string | null;
  email?: string | null;
  position?: string | null;
}

@Injectable({
  providedIn: "root",
})
export class SettingsFormFactoryService {
  private readonly fb = inject(FormBuilder);

  createProfileForm(user: AuthUserLike | null | undefined): FormGroup {
    return this.fb.group({
      displayName: [user?.name || "", Validators.required],
      email: [user?.email || "", [Validators.required, Validators.email]],
      dateOfBirth: [null as Date | null],
      position: [user?.position || ""],
      jerseyNumber: [""],
      heightCm: [null as number | null],
      weightKg: [null as number | null],
      teamId: [null as string | null],
      phone: [""],
      country: [""],
    });
  }

  createNotificationForm(): FormGroup {
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

  createPrivacyForm(): FormGroup {
    return this.fb.group({
      profileVisibility: ["public"],
      showStats: [true],
    });
  }

  createPreferencesForm(themeMode: string): FormGroup {
    return this.fb.group({
      theme: [themeMode],
      language: ["en"],
    });
  }

  createPasswordForm(): FormGroup {
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
}
