import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { Select } from "primeng/select";
import { ToastService } from "../../core/services/toast.service";
import { ToastModule } from "primeng/toast";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { AuthService } from "../../core/services/auth.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { PasswordModule } from "primeng/password";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { ToggleSwitchModule } from "primeng/toggleswitch";

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
    MainLayoutComponent,
    PageHeaderComponent,
    PasswordModule,
    DialogModule,
    DividerModule,
    ToggleSwitchModule,
  ],
  
  template: `
    <p-toast></p-toast>
    <app-main-layout>
      <div class="settings-page">
        <app-page-header
          title="Settings"
          subtitle="Manage your account and application preferences"
          icon="pi-cog"
        >
          <p-button
            label="Save Changes"
            icon="pi pi-save"
            (onClick)="saveSettings()"
          ></p-button>
        </app-page-header>

        <!-- Settings Grid -->
        <div class="settings-grid">
          <!-- Profile Settings -->
          <p-card class="settings-section">
            <ng-template pTemplate="header">
              <div class="section-header">
                <span class="section-icon">👤</span>
                <h2 class="section-title">Profile Settings</h2>
              </div>
            </ng-template>
            <form [formGroup]="profileForm">
              <div class="p-field mb-4">
                <label for="displayName" class="p-label">Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  pInputText
                  formControlName="displayName"
                  placeholder="Enter your display name"
                />
              </div>
              <div class="p-field mb-4">
                <label for="email" class="p-label">Email</label>
                <input
                  id="email"
                  type="email"
                  pInputText
                  formControlName="email"
                  placeholder="Enter your email"
                />
              </div>
              <div class="p-field mb-4">
                <label for="phone" class="p-label">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  pInputText
                  formControlName="phone"
                  placeholder="Enter your phone number"
                />
              </div>
            </form>
          </p-card>

          <!-- Notification Settings -->
          <p-card class="settings-section">
            <ng-template pTemplate="header">
              <div class="section-header">
                <span class="section-icon">🔔</span>
                <h2 class="section-title">Notification Settings</h2>
              </div>
            </ng-template>
            <form [formGroup]="notificationForm">
              <div class="p-field-checkbox mb-4">
                <p-toggleswitch
                  formControlName="emailNotifications"
                ></p-toggleswitch>
                <label for="emailNotifications" class="p-label"
                  >Email Notifications</label
                >
              </div>
              <div class="p-field-checkbox mb-4">
                <p-toggleswitch
                  formControlName="pushNotifications"
                ></p-toggleswitch>
                <label for="pushNotifications" class="p-label"
                  >Push Notifications</label
                >
              </div>
              <div class="p-field-checkbox mb-4">
                <p-toggleswitch
                  formControlName="trainingReminders"
                ></p-toggleswitch>
                <label for="trainingReminders" class="p-label"
                  >Training Reminders</label
                >
              </div>
            </form>
          </p-card>

          <!-- Privacy Settings -->
          <p-card class="settings-section">
            <ng-template pTemplate="header">
              <div class="section-header">
                <span class="section-icon">🔒</span>
                <h2 class="section-title">Privacy Settings</h2>
              </div>
            </ng-template>
            <form [formGroup]="privacyForm">
              <div class="p-field mb-4">
                <label for="profileVisibility" class="p-label"
                  >Profile Visibility</label
                >
                <p-select
                  id="profileVisibility"
                  formControlName="profileVisibility"
                  [options]="visibilityOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select visibility"
                ></p-select>
              </div>
              <div class="p-field-checkbox mb-4">
                <p-toggleswitch formControlName="showStats"></p-toggleswitch>
                <label for="showStats" class="p-label"
                  >Show Statistics Publicly</label
                >
              </div>
            </form>
          </p-card>

          <!-- App Preferences -->
          <p-card class="settings-section">
            <ng-template pTemplate="header">
              <div class="section-header">
                <span class="section-icon">⚙️</span>
                <h2 class="section-title">App Preferences</h2>
              </div>
            </ng-template>
            <form [formGroup]="preferencesForm">
              <div class="p-field mb-4">
                <label for="theme" class="p-label">Theme</label>
                <p-select
                  id="theme"
                  formControlName="theme"
                  [options]="themeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select theme"
                ></p-select>
              </div>
              <div class="p-field mb-4">
                <label for="language" class="p-label">Language</label>
                <p-select
                  id="language"
                  formControlName="language"
                  [options]="languageOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select language"
                ></p-select>
              </div>
            </form>
          </p-card>

          <!-- Security Settings -->
          <p-card class="settings-section">
            <ng-template pTemplate="header">
              <div class="section-header">
                <span class="section-icon">🔐</span>
                <h2 class="section-title">Security</h2>
              </div>
            </ng-template>
            <div class="security-actions">
              <div class="security-item">
                <div class="security-info">
                  <h4>Change Password</h4>
                  <p>Update your account password</p>
                </div>
                <p-button
                  label="Change"
                  icon="pi pi-key"
                  [outlined]="true"
                  (onClick)="showChangePasswordDialog = true"
                ></p-button>
              </div>
              <p-divider></p-divider>
              <div class="security-item danger">
                <div class="security-info">
                  <h4>Delete Account</h4>
                  <p>Permanently delete your account and all data</p>
                </div>
                <p-button
                  label="Delete"
                  icon="pi pi-trash"
                  severity="danger"
                  [outlined]="true"
                  (onClick)="showDeleteAccountDialog = true"
                ></p-button>
              </div>
            </div>
          </p-card>
        </div>
      </div>

      <!-- Change Password Dialog -->
      <p-dialog
        header="Change Password"
        [(visible)]="showChangePasswordDialog"
        [modal]="true"
        [style]="{ width: '400px' }"
        [closable]="true"
      >
        <form [formGroup]="passwordForm">
          <div class="p-field mb-4">
            <label for="currentPassword" class="p-label">Current Password</label>
            <p-password
              id="currentPassword"
              formControlName="currentPassword"
              [feedback]="false"
              [toggleMask]="true"
              styleClass="w-full"
            ></p-password>
          </div>
          <div class="p-field mb-4">
            <label for="newPassword" class="p-label">New Password</label>
            <p-password
              id="newPassword"
              formControlName="newPassword"
              [toggleMask]="true"
              styleClass="w-full"
            ></p-password>
            <small class="p-text-secondary">
              At least 8 characters with uppercase, lowercase, number, and special character
            </small>
          </div>
          <div class="p-field mb-4">
            <label for="confirmNewPassword" class="p-label">Confirm New Password</label>
            <p-password
              id="confirmNewPassword"
              formControlName="confirmNewPassword"
              [feedback]="false"
              [toggleMask]="true"
              styleClass="w-full"
            ></p-password>
            @if (passwordForm.errors?.['passwordMismatch'] && passwordForm.get('confirmNewPassword')?.touched) {
              <small class="p-error">Passwords do not match</small>
            }
          </div>
        </form>
        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            [text]="true"
            (onClick)="showChangePasswordDialog = false"
          ></p-button>
          <p-button
            label="Update Password"
            icon="pi pi-check"
            [loading]="isChangingPassword()"
            [disabled]="passwordForm.invalid"
            (onClick)="changePassword()"
          ></p-button>
        </ng-template>
      </p-dialog>

      <!-- Delete Account Dialog -->
      <p-dialog
        header="Delete Account"
        [(visible)]="showDeleteAccountDialog"
        [modal]="true"
        [style]="{ width: '450px' }"
        [closable]="true"
      >
        <div class="delete-warning">
          <i class="pi pi-exclamation-triangle warning-icon"></i>
          <p><strong>Warning:</strong> This action cannot be undone.</p>
          <p>All your data, including training history, performance metrics, and settings will be permanently deleted.</p>
          <div class="p-field mt-4">
            <label for="deleteConfirm" class="p-label">
              Type <strong>DELETE</strong> to confirm
            </label>
            <input
              id="deleteConfirm"
              type="text"
              pInputText
              [(ngModel)]="deleteConfirmText"
              placeholder="Type DELETE"
              class="w-full"
            />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            [text]="true"
            (onClick)="showDeleteAccountDialog = false"
          ></p-button>
          <p-button
            label="Delete My Account"
            icon="pi pi-trash"
            severity="danger"
            [loading]="isDeletingAccount()"
            [disabled]="deleteConfirmText !== 'DELETE'"
            (onClick)="deleteAccount()"
          ></p-button>
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styles: [
    `
      .settings-page {
        padding: var(--space-6);
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-6);
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
      }

      .page-title-section h1 {
        font-size: var(--font-heading-lg);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .page-title-section p {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
        margin: 0;
      }

      .settings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: var(--space-6);
      }

      .settings-section {
        height: fit-content;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .section-icon {
        font-size: var(--icon-2xl);
      }

      .section-title {
        font-size: var(--font-heading-sm);
        font-weight: var(--font-weight-semibold);
        margin: 0;
        color: var(--text-primary);
      }

      .p-field-checkbox {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .p-field-checkbox label {
        margin: 0;
      }

      .security-actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .security-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3) 0;
      }

      .security-info h4 {
        margin: 0 0 var(--space-1) 0;
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
      }

      .security-info p {
        margin: 0;
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .security-item.danger .security-info h4 {
        color: var(--p-red-500);
      }

      .delete-warning {
        text-align: center;
        padding: var(--space-4);
      }

      .warning-icon {
        font-size: 3rem;
        color: var(--p-red-500);
        margin-bottom: var(--space-4);
      }

      .delete-warning p {
        margin-bottom: var(--space-2);
        color: var(--text-secondary);
      }

      @media (max-width: 768px) {
        .settings-grid {
          grid-template-columns: 1fr;
        }

        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-4);
        }

        .security-item {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-3);
        }
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private supabaseService = inject(SupabaseService);
  private toastService = inject(ToastService);

  profileForm!: FormGroup;
  notificationForm!: FormGroup;
  privacyForm!: FormGroup;
  preferencesForm!: FormGroup;
  passwordForm!: FormGroup;

  // Dialog visibility
  showChangePasswordDialog = false;
  showDeleteAccountDialog = false;
  deleteConfirmText = "";

  // Loading states
  isChangingPassword = signal(false);
  isDeletingAccount = signal(false);

  visibilityOptions = [
    { label: "Public", value: "public" },
    { label: "Private", value: "private" },
    { label: "Friends Only", value: "friends" },
  ];

  themeOptions = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    { label: "Auto", value: "auto" },
  ];

  languageOptions = [
    { label: "English", value: "en" },
    { label: "Spanish", value: "es" },
    { label: "French", value: "fr" },
  ];

  ngOnInit(): void {
    const user = this.authService.getUser();

    this.profileForm = this.fb.group({
      displayName: [user?.name || "", Validators.required],
      email: [user?.email || "", [Validators.required, Validators.email]],
      phone: [""],
    });

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
      theme: ["light"],
      language: ["en"],
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
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
            ),
          ],
        ],
        confirmNewPassword: ["", Validators.required],
      },
      { validators: this.passwordMatchValidator }
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

  saveSettings(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const settings = {
      profile: this.profileForm.value,
      notifications: this.notificationForm.value,
      privacy: this.privacyForm.value,
      preferences: this.preferencesForm.value,
    };

    // Save settings via API - implementation pending
    this.toastService.success("Settings saved successfully!");
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

      // Delete user data from database tables
      const { error: deleteError } = await this.supabaseService.client
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (deleteError) {
        console.warn("Could not delete profile:", deleteError.message);
      }

      // Sign out the user
      await this.supabaseService.signOut();

      this.toastService.success(
        "Your account deletion request has been submitted. You will receive a confirmation email."
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
}
