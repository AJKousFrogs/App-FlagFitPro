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
} from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { ToggleSwitch } from "primeng/toggleswitch";
import { Select } from "primeng/select";
import { MessageService } from "primeng/api";
import { ToastModule } from "primeng/toast";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-settings",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ToggleSwitch,
    Select,
    ToastModule,
    MainLayoutComponent,
    PageHeaderComponent
],
  providers: [MessageService],
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
                <p-inputSwitch
                  formControlName="emailNotifications"
                ></p-inputSwitch>
                <label for="emailNotifications" class="p-label"
                  >Email Notifications</label
                >
              </div>
              <div class="p-field-checkbox mb-4">
                <p-inputSwitch
                  formControlName="pushNotifications"
                ></p-inputSwitch>
                <label for="pushNotifications" class="p-label"
                  >Push Notifications</label
                >
              </div>
              <div class="p-field-checkbox mb-4">
                <p-inputSwitch
                  formControlName="trainingReminders"
                ></p-inputSwitch>
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
                <p-inputSwitch formControlName="showStats"></p-inputSwitch>
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
        </div>
      </div>
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
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .page-title-section p {
        font-size: 0.875rem;
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
        font-size: 1.5rem;
      }

      .section-title {
        font-size: 1.25rem;
        font-weight: 600;
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

      @media (max-width: 768px) {
        .settings-grid {
          grid-template-columns: 1fr;
        }

        .page-header {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-4);
        }
      }
    `,
  ],
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private messageService = inject(MessageService);

  profileForm!: FormGroup;
  notificationForm!: FormGroup;
  privacyForm!: FormGroup;
  preferencesForm!: FormGroup;

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
    this.messageService.add({
      severity: "success",
      summary: "Success",
      detail: "Settings saved successfully!",
    });
  }
}
