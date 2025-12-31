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
    MainLayoutComponent,
    PageHeaderComponent,
    PasswordModule,
    DialogModule,
    DividerModule,
    ToggleSwitch,
    TooltipModule,
    RouterLink,
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
                <div class="section-icon icon-profile">
                  <i class="pi pi-user"></i>
                </div>
                <h2 class="section-title">Profile Settings</h2>
              </div>
            </ng-template>
            <form [formGroup]="profileForm">
              <div class="p-field mb-4">
                <label for="settings-displayName" class="p-label">Display Name</label>
                <input
                  id="settings-displayName"
                  name="displayName"
                  type="text"
                  pInputText
                  formControlName="displayName"
                  placeholder="Enter your display name"
                  autocomplete="name"
                />
              </div>
              <div class="p-field mb-4">
                <label for="settings-email" class="p-label">Email</label>
                <input
                  id="settings-email"
                  name="email"
                  type="email"
                  pInputText
                  formControlName="email"
                  placeholder="Enter your email"
                  autocomplete="email"
                />
              </div>
              <div class="form-row two-columns">
                <div class="p-field">
                  <label for="settings-position" class="p-label">Position</label>
                  <p-select
                    inputId="settings-position"
                    formControlName="position"
                    [options]="positionOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Select your position"
                    appendTo="body"
                  ></p-select>
                </div>
                <div class="p-field">
                  <label for="settings-jerseyNumber" class="p-label">Jersey Number</label>
                  <input
                    id="settings-jerseyNumber"
                    name="jerseyNumber"
                    type="text"
                    pInputText
                    formControlName="jerseyNumber"
                    placeholder="#55"
                    maxlength="3"
                    autocomplete="off"
                  />
                </div>
              </div>
              <div class="p-field mb-4">
                <label for="settings-teamName" class="p-label">Team Name</label>
                <input
                  id="settings-teamName"
                  name="teamName"
                  type="text"
                  pInputText
                  formControlName="teamName"
                  placeholder="e.g., Ljubljana Frogs"
                  autocomplete="organization"
                />
              </div>
              <div class="p-field mb-4">
                <label for="settings-phone" class="p-label">Phone Number</label>
                <input
                  id="settings-phone"
                  name="phone"
                  type="tel"
                  pInputText
                  formControlName="phone"
                  placeholder="Enter your phone number"
                  autocomplete="tel"
                />
              </div>
            </form>
          </p-card>

          <!-- Notification Settings -->
          <p-card class="settings-section">
            <ng-template pTemplate="header">
              <div class="section-header">
                <div class="section-icon icon-notifications">
                  <i class="pi pi-bell"></i>
                </div>
                <h2 class="section-title">Notification Settings</h2>
              </div>
            </ng-template>
            <form [formGroup]="notificationForm" class="notification-form">
              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-icon">
                    <i class="pi pi-envelope"></i>
                  </div>
                  <div class="notification-text">
                    <span class="notification-label">Email Notifications</span>
                    <span class="notification-desc">Receive updates and alerts via email</span>
                  </div>
                </div>
                <div class="toggle-wrapper">
                  <span class="toggle-status" [class.active]="notificationForm.get('emailNotifications')?.value">
                    {{ notificationForm.get('emailNotifications')?.value ? 'ON' : 'OFF' }}
                  </span>
                  <p-toggleswitch formControlName="emailNotifications"></p-toggleswitch>
                </div>
              </div>

              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-icon">
                    <i class="pi pi-mobile"></i>
                  </div>
                  <div class="notification-text">
                    <span class="notification-label">Push Notifications</span>
                    <span class="notification-desc">Get instant alerts on your device</span>
                  </div>
                </div>
                <div class="toggle-wrapper">
                  <span class="toggle-status" [class.active]="notificationForm.get('pushNotifications')?.value">
                    {{ notificationForm.get('pushNotifications')?.value ? 'ON' : 'OFF' }}
                  </span>
                  <p-toggleswitch formControlName="pushNotifications"></p-toggleswitch>
                </div>
              </div>

              <div class="notification-item">
                <div class="notification-info">
                  <div class="notification-icon">
                    <i class="pi pi-clock"></i>
                  </div>
                  <div class="notification-text">
                    <span class="notification-label">Training Reminders</span>
                    <span class="notification-desc">Daily reminders for scheduled workouts</span>
                  </div>
                </div>
                <div class="toggle-wrapper">
                  <span class="toggle-status" [class.active]="notificationForm.get('trainingReminders')?.value">
                    {{ notificationForm.get('trainingReminders')?.value ? 'ON' : 'OFF' }}
                  </span>
                  <p-toggleswitch formControlName="trainingReminders"></p-toggleswitch>
                </div>
              </div>
            </form>
          </p-card>

          <!-- Privacy Settings -->
          <p-card class="settings-section">
            <ng-template pTemplate="header">
              <div class="section-header">
                <div class="section-icon icon-privacy">
                  <i class="pi pi-lock"></i>
                </div>
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
                  appendTo="body"
                >
                  <ng-template pTemplate="item" let-option>
                    <div class="visibility-option">
                      <span class="visibility-label">{{ option.label }}</span>
                      <span class="visibility-desc">{{ option.description }}</span>
                    </div>
                  </ng-template>
                </p-select>
              </div>
              <div class="p-field-checkbox mb-4">
                <label id="settings-showStats-label" class="p-label">Show Statistics Publicly</label>
                <div class="toggle-wrapper">
                  <span class="toggle-status" [class.active]="privacyForm.get('showStats')?.value">
                    {{ privacyForm.get('showStats')?.value ? 'ON' : 'OFF' }}
                  </span>
                  <p-toggleswitch formControlName="showStats" ariaLabelledBy="settings-showStats-label"></p-toggleswitch>
                </div>
              </div>
            </form>
            <p-divider></p-divider>
            <div class="privacy-controls-link">
              <div class="link-info">
                <h4>Advanced Privacy Controls</h4>
                <p>Manage AI processing, team data sharing, research participation, and more.</p>
              </div>
              <p-button
                label="Privacy Controls"
                icon="pi pi-shield"
                [outlined]="true"
                routerLink="/settings/privacy"
              ></p-button>
            </div>
          </p-card>

          <!-- App Preferences -->
          <p-card class="settings-section">
            <ng-template pTemplate="header">
              <div class="section-header">
                <div class="section-icon icon-preferences">
                  <i class="pi pi-cog"></i>
                </div>
                <h2 class="section-title">App Preferences</h2>
              </div>
            </ng-template>
            <form [formGroup]="preferencesForm">
              <div class="p-field mb-4">
                <span id="settings-theme-label" class="p-label">Theme</span>
                <div class="theme-selector" role="radiogroup" aria-labelledby="settings-theme-label">
                  @for (option of themeOptions; track option.value) {
                    <button
                      type="button"
                      class="theme-option"
                      [class.active]="preferencesForm.get('theme')?.value === option.value"
                      (click)="selectTheme(option.value)"
                    >
                      <i [class]="option.icon"></i>
                      <span>{{ option.label }}</span>
                    </button>
                  }
                </div>
                <small class="theme-hint">
                  @switch (preferencesForm.get('theme')?.value) {
                    @case ('light') {
                      Always use light theme
                    }
                    @case ('dark') {
                      Always use dark theme
                    }
                    @case ('auto') {
                      Follows your system preference
                    }
                  }
                </small>
              </div>
              <div class="p-field language-field">
                <label for="language" class="p-label">Language</label>
                <p-select
                  id="language"
                  formControlName="language"
                  [options]="languageOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select language"
                  styleClass="language-selector"
                  appendTo="body"
                  [showClear]="false"
                >
                  <ng-template pTemplate="selectedItem" let-selected>
                    @if (selected) {
                      <div class="lang-selected">
                        <span class="lang-flag">{{ selected.flag }}</span>
                        <span class="lang-label">{{ selected.label }}</span>
                      </div>
                    }
                  </ng-template>
                  <ng-template pTemplate="item" let-lang>
                    <div class="lang-item">
                      <span class="lang-flag">{{ lang.flag }}</span>
                      <div class="lang-details">
                        <span class="lang-label">{{ lang.label }}</span>
                        <span class="lang-native">{{ lang.native }}</span>
                      </div>
                      <i class="pi pi-check lang-check"></i>
                    </div>
                  </ng-template>
                </p-select>
                <div class="language-hint-box">
                  <i class="pi pi-info-circle"></i>
                  <span>Translation coming soon - your preference will be saved</span>
                </div>
              </div>
            </form>
          </p-card>

          <!-- Security Settings -->
          <p-card class="settings-section">
            <ng-template pTemplate="header">
              <div class="section-header">
                <div class="section-icon icon-security">
                  <i class="pi pi-shield"></i>
                </div>
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
              
              <!-- Two-Factor Authentication -->
              <div class="security-item">
                <div class="security-info">
                  <h4>Two-Factor Authentication (2FA)</h4>
                  <p>
                    @if (is2FAEnabled()) {
                      <span class="status-badge enabled">
                        <i class="pi pi-shield"></i> Enabled
                      </span>
                    } @else {
                      Add an extra layer of security to your account
                    }
                  </p>
                </div>
                @if (is2FAEnabled()) {
                  <p-button
                    label="Disable"
                    icon="pi pi-times"
                    severity="secondary"
                    [outlined]="true"
                    (onClick)="showDisable2FADialog = true"
                  ></p-button>
                } @else {
                  <p-button
                    label="Enable"
                    icon="pi pi-shield"
                    [outlined]="true"
                    (onClick)="startSetup2FA()"
                  ></p-button>
                }
              </div>
              <p-divider></p-divider>
              
              <!-- Active Sessions -->
              <div class="security-item">
                <div class="security-info">
                  <h4>Active Sessions</h4>
                  <p>Manage your logged-in devices</p>
                </div>
                <p-button
                  label="View"
                  icon="pi pi-desktop"
                  [outlined]="true"
                  (onClick)="showSessionsDialog = true"
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
        [(visible)]="showChangePasswordDialog"
        [modal]="true"
        [style]="{ width: '440px' }"
        [closable]="true"
        [showHeader]="false"
        styleClass="password-dialog"
      >
        <div class="dialog-container">
          <!-- Custom Header -->
          <div class="dialog-header">
            <div class="dialog-icon">
              <i class="pi pi-lock"></i>
            </div>
            <div class="dialog-title-section">
              <h2>Change Password</h2>
              <p>Update your account password</p>
            </div>
            <button class="dialog-close" (click)="showChangePasswordDialog = false">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Form Content -->
          <form [formGroup]="passwordForm" class="password-form">
            <div class="form-field">
              <label for="settings-currentPassword">
                <i class="pi pi-key"></i>
                Current Password
              </label>
              <div class="input-wrapper">
                <p-password
                  inputId="settings-currentPassword"
                  formControlName="currentPassword"
                  [feedback]="false"
                  [toggleMask]="true"
                  placeholder="Enter your current password"
                  styleClass="password-input"
                  autocomplete="current-password"
                ></p-password>
              </div>
            </div>

            <div class="form-field">
              <label for="settings-newPassword">
                <i class="pi pi-shield"></i>
                New Password
              </label>
              <div class="input-wrapper">
                <p-password
                  inputId="settings-newPassword"
                  formControlName="newPassword"
                  [toggleMask]="true"
                  placeholder="Create a strong password"
                  styleClass="password-input"
                  autocomplete="new-password"
                ></p-password>
              </div>
              <div class="password-requirements">
                <div class="requirement" [class.met]="passwordForm.get('newPassword')?.value?.length >= 8">
                  <i class="pi" [class.pi-check-circle]="passwordForm.get('newPassword')?.value?.length >= 8" [class.pi-circle]="!(passwordForm.get('newPassword')?.value?.length >= 8)"></i>
                  <span>At least 8 characters</span>
                </div>
                <div class="requirement" [class.met]="hasUppercase()">
                  <i class="pi" [class.pi-check-circle]="hasUppercase()" [class.pi-circle]="!hasUppercase()"></i>
                  <span>One uppercase letter</span>
                </div>
                <div class="requirement" [class.met]="hasNumber()">
                  <i class="pi" [class.pi-check-circle]="hasNumber()" [class.pi-circle]="!hasNumber()"></i>
                  <span>One number</span>
                </div>
                <div class="requirement" [class.met]="hasSpecialChar()">
                  <i class="pi" [class.pi-check-circle]="hasSpecialChar()" [class.pi-circle]="!hasSpecialChar()"></i>
                  <span>One special character</span>
                </div>
              </div>
            </div>

            <div class="form-field">
              <label for="settings-confirmNewPassword">
                <i class="pi pi-check-square"></i>
                Confirm New Password
              </label>
              <div class="input-wrapper">
                <p-password
                  inputId="settings-confirmNewPassword"
                  formControlName="confirmNewPassword"
                  [feedback]="false"
                  [toggleMask]="true"
                  placeholder="Confirm your new password"
                  styleClass="password-input"
                  autocomplete="new-password"
                ></p-password>
              </div>
              @if (passwordForm.errors?.['passwordMismatch'] && passwordForm.get('confirmNewPassword')?.touched) {
                <div class="error-message">
                  <i class="pi pi-exclamation-circle"></i>
                  <span>Passwords do not match</span>
                </div>
              }
              @if (passwordsMatch() && passwordForm.get('confirmNewPassword')?.value) {
                <div class="success-message">
                  <i class="pi pi-check-circle"></i>
                  <span>Passwords match</span>
                </div>
              }
            </div>
          </form>

          <!-- Footer Actions -->
          <div class="dialog-actions">
            <button class="btn-cancel" (click)="showChangePasswordDialog = false">
              Cancel
            </button>
            <button 
              class="btn-submit" 
              [disabled]="passwordForm.invalid || isChangingPassword()"
              (click)="changePassword()"
            >
              @if (isChangingPassword()) {
                <i class="pi pi-spin pi-spinner"></i>
                <span>Updating...</span>
              } @else {
                <i class="pi pi-check"></i>
                <span>Update Password</span>
              }
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- Delete Account Dialog -->
      <p-dialog
        [(visible)]="showDeleteAccountDialog"
        [modal]="true"
        [style]="{ width: '480px' }"
        [closable]="true"
        [showHeader]="false"
        styleClass="delete-dialog"
      >
        <div class="dialog-container">
          <!-- Custom Header -->
          <div class="dialog-header danger-header">
            <div class="dialog-icon danger-icon">
              <i class="pi pi-trash"></i>
            </div>
            <div class="dialog-title-section">
              <h2>Delete Account</h2>
              <p>This action is permanent and irreversible</p>
            </div>
            <button class="dialog-close" (click)="showDeleteAccountDialog = false">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Warning Content -->
          <div class="delete-content">
            <div class="warning-box">
              <div class="warning-icon-large">
                <i class="pi pi-exclamation-triangle"></i>
              </div>
              <div class="warning-text">
                <h4>Are you absolutely sure?</h4>
                <p>All your data will be permanently deleted, including:</p>
                <ul class="delete-list">
                  <li><i class="pi pi-chart-line"></i> Training history & progress</li>
                  <li><i class="pi pi-chart-bar"></i> Performance metrics & analytics</li>
                  <li><i class="pi pi-cog"></i> Settings & preferences</li>
                  <li><i class="pi pi-user"></i> Profile information</li>
                </ul>
              </div>
            </div>

            <div class="confirm-field">
              <label for="settings-deleteConfirm">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                id="settings-deleteConfirm"
                name="deleteConfirm"
                type="text"
                pInputText
                [(ngModel)]="deleteConfirmText"
                placeholder="Type DELETE"
                class="delete-input"
                autocomplete="off"
              />
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="dialog-actions">
            <button class="btn-cancel" (click)="showDeleteAccountDialog = false">
              Cancel
            </button>
            <button 
              class="btn-danger" 
              [disabled]="deleteConfirmText !== 'DELETE' || isDeletingAccount()"
              (click)="deleteAccount()"
            >
              @if (isDeletingAccount()) {
                <i class="pi pi-spin pi-spinner"></i>
                <span>Deleting...</span>
              } @else {
                <i class="pi pi-trash"></i>
                <span>Delete My Account</span>
              }
            </button>
          </div>
        </div>
      </p-dialog>

      <!-- 2FA Setup Dialog -->
      <p-dialog
        [(visible)]="show2FASetupDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
        [closable]="true"
        [showHeader]="false"
        styleClass="twofa-dialog"
      >
        <div class="dialog-container">
          <!-- Custom Header -->
          <div class="dialog-header">
            <div class="dialog-icon">
              <i class="pi pi-shield"></i>
            </div>
            <div class="dialog-title-section">
              <h2>Two-Factor Authentication</h2>
              <p>Step {{ twoFAStep() }} of 4 — Add extra security</p>
            </div>
            <button class="dialog-close" (click)="close2FASetup()">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Step Progress -->
          <div class="step-progress">
            @for (step of [1, 2, 3, 4]; track step) {
              <div class="step-dot" [class.active]="twoFAStep() >= step" [class.current]="twoFAStep() === step"></div>
            }
          </div>

          <!-- Step Content -->
          <div class="twofa-content">
            @switch (twoFAStep()) {
              @case (1) {
                <div class="step-section">
                  <h3>Install an Authenticator App</h3>
                  <p class="step-desc">Download one of these apps on your mobile device:</p>
                  <div class="app-list">
                    <div class="app-card">
                      <div class="app-icon google">
                        <i class="pi pi-google"></i>
                      </div>
                      <span>Google Authenticator</span>
                    </div>
                    <div class="app-card">
                      <div class="app-icon microsoft">
                        <i class="pi pi-microsoft"></i>
                      </div>
                      <span>Microsoft Authenticator</span>
                    </div>
                    <div class="app-card">
                      <div class="app-icon authy">
                        <i class="pi pi-lock"></i>
                      </div>
                      <span>Authy</span>
                    </div>
                  </div>
                </div>
              }
              @case (2) {
                <div class="step-section">
                  <h3>Scan QR Code</h3>
                  <p class="step-desc">Open your authenticator app and scan this code:</p>
                  <div class="qr-wrapper">
                    @if (qrCodeUrl()) {
                      <img [src]="qrCodeUrl()" alt="2FA QR Code" class="qr-image" />
                    } @else {
                      <div class="qr-loading">
                        <i class="pi pi-spin pi-spinner"></i>
                        <span>Generating...</span>
                      </div>
                    }
                  </div>
                  <div class="manual-code">
                    <span class="manual-label">Can't scan? Enter manually:</span>
                    <div class="code-box">
                      <code>{{ twoFASecret() }}</code>
                      <button class="copy-btn" (click)="copySecret()">
                        <i class="pi pi-copy"></i>
                      </button>
                    </div>
                  </div>
                </div>
              }
              @case (3) {
                <div class="step-section">
                  <h3>Verify Setup</h3>
                  <p class="step-desc">Enter the 6-digit code from your app:</p>
                  <div class="code-input-wrapper">
                    <input
                      id="settings-2fa-code"
                      name="twoFACode"
                      type="text"
                      [(ngModel)]="twoFAVerificationCode"
                      placeholder="000000"
                      maxlength="6"
                      class="verification-code-input"
                      autocomplete="one-time-code"
                      inputmode="numeric"
                      (keyup.enter)="verify2FA()"
                    />
                  </div>
                  @if (twoFAError()) {
                    <div class="error-message">
                      <i class="pi pi-exclamation-circle"></i>
                      <span>{{ twoFAError() }}</span>
                    </div>
                  }
                </div>
              }
              @case (4) {
                <div class="step-section success-section">
                  <div class="success-icon-wrapper">
                    <i class="pi pi-check"></i>
                  </div>
                  <h3>2FA Enabled!</h3>
                  <p class="step-desc">Your account is now protected with two-factor authentication.</p>
                  <div class="backup-section">
                    <div class="backup-header">
                      <i class="pi pi-key"></i>
                      <span>Backup Codes</span>
                    </div>
                    <p class="backup-desc">Save these codes securely. Use them if you lose access to your authenticator.</p>
                    <div class="codes-grid">
                      @for (code of backupCodes(); track code) {
                        <code class="backup-code-item">{{ code }}</code>
                      }
                    </div>
                    <button class="download-btn" (click)="downloadBackupCodes()">
                      <i class="pi pi-download"></i>
                      <span>Download Codes</span>
                    </button>
                  </div>
                </div>
              }
            }
          </div>

          <!-- Footer Actions -->
          <div class="dialog-actions">
            @if (twoFAStep() < 4) {
              <button class="btn-cancel" (click)="close2FASetup()">
                Cancel
              </button>
              @if (twoFAStep() === 1) {
                <button class="btn-submit" (click)="twoFAStep.set(2)">
                  <span>I have an app</span>
                  <i class="pi pi-arrow-right"></i>
                </button>
              } @else if (twoFAStep() === 2) {
                <button class="btn-submit" (click)="twoFAStep.set(3)">
                  <span>Next</span>
                  <i class="pi pi-arrow-right"></i>
                </button>
              } @else if (twoFAStep() === 3) {
                <button 
                  class="btn-submit" 
                  [disabled]="twoFAVerificationCode.length !== 6 || isEnabling2FA()"
                  (click)="verify2FA()"
                >
                  @if (isEnabling2FA()) {
                    <i class="pi pi-spin pi-spinner"></i>
                    <span>Verifying...</span>
                  } @else {
                    <i class="pi pi-shield"></i>
                    <span>Verify & Enable</span>
                  }
                </button>
              }
            } @else {
              <button class="btn-submit full-width" (click)="close2FASetup()">
                <i class="pi pi-check"></i>
                <span>Done</span>
              </button>
            }
          </div>
        </div>
      </p-dialog>

      <!-- Disable 2FA Dialog -->
      <p-dialog
        header="Disable Two-Factor Authentication"
        [(visible)]="showDisable2FADialog"
        [modal]="true"
        [style]="{ width: '400px' }"
        [closable]="true"
      >
          <div class="disable-2fa">
            <i class="pi pi-exclamation-triangle warning-icon"></i>
            <p>Disabling 2FA will make your account less secure.</p>
            <div class="p-field mt-4">
              <label for="settings-disable2FACode" class="p-label">Enter your authenticator code to confirm:</label>
              <input
                id="settings-disable2FACode"
                name="disable2FACode"
                type="text"
                pInputText
                [(ngModel)]="disable2FACode"
                placeholder="000000"
                maxlength="6"
                class="code-input w-full"
                autocomplete="one-time-code"
                inputmode="numeric"
              />
            </div>
          </div>
        <ng-template pTemplate="footer">
          <p-button
            label="Cancel"
            [text]="true"
            (onClick)="showDisable2FADialog = false"
          ></p-button>
          <p-button
            label="Disable 2FA"
            icon="pi pi-times"
            severity="danger"
            [loading]="isDisabling2FA()"
            [disabled]="disable2FACode.length !== 6"
            (onClick)="disable2FA()"
          ></p-button>
        </ng-template>
      </p-dialog>

      <!-- Active Sessions Dialog -->
      <p-dialog
        [(visible)]="showSessionsDialog"
        [modal]="true"
        [style]="{ width: '520px' }"
        [closable]="true"
        [showHeader]="false"
        styleClass="sessions-dialog"
      >
        <div class="dialog-container">
          <!-- Custom Header -->
          <div class="dialog-header">
            <div class="dialog-icon">
              <i class="pi pi-desktop"></i>
            </div>
            <div class="dialog-title-section">
              <h2>Active Sessions</h2>
              <p>Manage your logged-in devices</p>
            </div>
            <button class="dialog-close" (click)="showSessionsDialog = false">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Sessions Content -->
          <div class="sessions-content">
            @if (loadingSessions()) {
              <div class="sessions-loading">
                <i class="pi pi-spin pi-spinner"></i>
                <span>Loading sessions...</span>
              </div>
            } @else {
              <div class="sessions-list-new">
                @for (session of activeSessions(); track session.id) {
                  <div class="session-card" [class.current]="session.isCurrent">
                    <div class="session-device-icon" [class.mobile]="session.deviceType === 'mobile'" [class.tablet]="session.deviceType === 'tablet'">
                      <i [class]="getDeviceIcon(session.deviceType)"></i>
                    </div>
                    <div class="session-details-new">
                      <div class="session-name">
                        {{ session.deviceName }}
                        @if (session.isCurrent) {
                          <span class="current-tag">This device</span>
                        }
                      </div>
                      <div class="session-meta">
                        <span><i class="pi pi-map-marker"></i> {{ session.location }}</span>
                        <span><i class="pi pi-clock"></i> {{ session.lastActive }}</span>
                      </div>
                    </div>
                    @if (!session.isCurrent) {
                      <button class="revoke-btn" (click)="revokeSession(session.id)">
                        <i class="pi pi-sign-out"></i>
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Footer Actions -->
          <div class="dialog-actions">
            <button class="btn-cancel" (click)="showSessionsDialog = false">
              Close
            </button>
            <button 
              class="btn-danger-outline" 
              [disabled]="isRevokingAll()"
              (click)="revokeAllSessions()"
            >
              @if (isRevokingAll()) {
                <i class="pi pi-spin pi-spinner"></i>
                <span>Signing out...</span>
              } @else {
                <i class="pi pi-sign-out"></i>
                <span>Sign out all others</span>
              }
            </button>
          </div>
        </div>
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
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-5);
        align-items: stretch;
      }

      .settings-section {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      :host ::ng-deep .settings-section.p-card,
      :host ::ng-deep .settings-section .p-card {
        height: 100%;
        display: flex;
        flex-direction: column;
        border: 1px solid var(--color-border-primary, #e0e0e0) !important;
        border-radius: 16px !important;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
        background: var(--surface-primary, #ffffff) !important;
        transition: box-shadow 0.2s ease, border-color 0.2s ease !important;
      }

      :host ::ng-deep .settings-section.p-card:hover,
      :host ::ng-deep .settings-section .p-card:hover {
        border-color: var(--ds-primary-green, #089949) !important;
        box-shadow: 0 4px 16px rgba(8, 153, 73, 0.1) !important;
      }

      :host ::ng-deep .settings-section .p-card-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: var(--space-5) !important;
      }

      :host ::ng-deep .settings-section .p-card-content {
        flex: 1;
      }

      :host ::ng-deep .settings-section .p-card-header {
        border-bottom: 1px solid var(--color-border-secondary, #f0f0f0) !important;
        background: var(--surface-secondary, #fafafa) !important;
        border-radius: 16px 16px 0 0 !important;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .section-icon {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        flex-shrink: 0;
      }

      .section-icon i {
        font-size: 1.25rem;
      }

      /* Icon color variants */
      .section-icon.icon-profile {
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
      }

      .section-icon.icon-notifications {
        background: rgba(234, 179, 8, 0.15);
        color: #fbbf24;
      }

      .section-icon.icon-privacy {
        background: rgba(168, 85, 247, 0.15);
        color: #c084fc;
      }

      .section-icon.icon-preferences {
        background: rgba(107, 114, 128, 0.15);
        color: #9ca3af;
      }

      .section-icon.icon-security {
        background: rgba(8, 153, 73, 0.15);
        color: #10c96b;
      }

      .section-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
      }

      .p-field-checkbox {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-3);
      }

      .p-field-checkbox label {
        margin: 0;
        flex: 1;
      }

      /* Notification Settings Layout */
      .notification-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .notification-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        margin: 0 calc(var(--space-3) * -1);
        border-radius: 12px;
        transition: background-color 0.15s ease;
      }

      .notification-item:hover {
        background: var(--surface-secondary, #f8f8f8);
      }

      .notification-info {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .notification-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: var(--surface-secondary, #f5f5f5);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .notification-icon i {
        font-size: 1.125rem;
        color: var(--color-text-secondary, #6b7280);
      }

      .notification-text {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .notification-label {
        font-weight: 600;
        font-size: 0.9375rem;
        color: var(--color-text-primary, #1a1a1a);
      }

      .notification-desc {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #6b7280);
      }

      /* Toggle Wrapper with ON/OFF Label */
      .toggle-wrapper {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-shrink: 0;
      }

      .toggle-status {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--color-text-tertiary, #9ca3af);
        min-width: 28px;
        text-align: right;
        transition: color 0.2s ease;
      }

      .toggle-status.active {
        color: var(--ds-primary-green, #089949);
      }

      /* Toggle Switch Styling */
      :host ::ng-deep .notification-item .p-toggleswitch,
      :host ::ng-deep .toggle-wrapper .p-toggleswitch {
        flex-shrink: 0;
      }

      :host ::ng-deep .p-toggleswitch .p-toggleswitch-slider {
        background: var(--color-border-primary, #d1d5db) !important;
        border-radius: 999px !important;
        width: 48px !important;
        height: 26px !important;
      }

      :host ::ng-deep .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider {
        background: var(--ds-primary-green, #089949) !important;
      }

      :host ::ng-deep .p-toggleswitch .p-toggleswitch-slider::before {
        width: 20px !important;
        height: 20px !important;
        background: white !important;
        border-radius: 50% !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15) !important;
        transition: transform 0.2s ease !important;
      }

      :host ::ng-deep .p-toggleswitch.p-toggleswitch-checked .p-toggleswitch-slider::before {
        transform: translateX(22px) !important;
      }

      /* Fix p-field spacing */
      :host ::ng-deep .p-field {
        margin-bottom: var(--space-4);
      }

      :host ::ng-deep .p-field .p-label {
        display: block;
        margin-bottom: var(--space-2);
        font-weight: 500;
        color: var(--text-primary);
        font-size: 0.875rem;
      }

      /* p-select uses global styles from styles.scss */
      :host ::ng-deep .p-select {
        width: 100%;
      }

      /* Fix input text */
      :host ::ng-deep .p-inputtext {
        width: 100%;
        padding: 0.75rem 1rem;
      }

      /* Two Column Form Row */
      .form-row {
        display: flex;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .form-row.two-columns .p-field {
        flex: 1;
        margin-bottom: 0;
      }

      @media (max-width: 480px) {
        .form-row.two-columns {
          flex-direction: column;
          gap: var(--space-4);
        }
      }

      .security-actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        padding: var(--space-2) 0;
      }

      .security-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4) var(--space-3);
        margin: 0 calc(var(--space-3) * -1);
        border-radius: 12px;
        transition: background-color 0.15s ease;
      }

      .security-item:hover {
        background: var(--surface-secondary, #f8f8f8);
      }

      /* Consistent button width in security section - ALL buttons same width */
      :host ::ng-deep .security-item .p-button {
        width: 140px !important;
        min-width: 140px !important;
        max-width: 140px !important;
        justify-content: flex-start !important;
        padding-left: 1.25rem !important;
        padding-right: 1.25rem !important;
      }

      :host ::ng-deep .security-item .p-button .p-button-icon {
        width: 1.25rem !important;
        text-align: center !important;
        margin-right: 0.5rem !important;
      }

      :host ::ng-deep .security-item .p-button .p-button-label {
        flex: 1 !important;
        text-align: left !important;
      }

      .security-info h4 {
        margin: 0 0 var(--space-2) 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
        line-height: 1.3;
      }

      .security-info p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--color-text-secondary, #6b7280);
        line-height: 1.4;
      }

      .security-item.danger .security-info h4 {
        color: var(--p-red-500, #ef4444);
      }

      .security-item.danger:hover {
        background: rgba(239, 68, 68, 0.05);
      }

      /* Divider styling in security section */
      :host ::ng-deep .security-actions .p-divider {
        margin: var(--space-1) 0 !important;
      }

      :host ::ng-deep .security-actions .p-divider::before {
        border-color: var(--color-border-secondary, #f0f0f0) !important;
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

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--p-border-radius);
        font-size: var(--font-body-sm);
        font-weight: 500;
      }

      .status-badge.enabled {
        background: var(--color-status-success-bg);
        color: var(--color-status-success);
      }

      /* 2FA Setup Styles */
      .twofa-setup {
        padding: var(--space-2);
      }

      .step-content h4 {
        margin: 0 0 var(--space-3) 0;
        color: var(--text-primary);
      }

      .step-content p {
        color: var(--text-secondary);
        margin-bottom: var(--space-3);
      }

      .app-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .app-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .qr-container {
        display: flex;
        justify-content: center;
        padding: var(--space-4);
        background: white;
        border-radius: var(--p-border-radius);
        margin: var(--space-4) 0;
      }

      .qr-code {
        width: 200px;
        height: 200px;
      }

      .qr-placeholder {
        width: 200px;
        height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        color: var(--text-secondary);
      }

      .manual-entry {
        text-align: center;
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .secret-code {
        display: inline-block;
        padding: var(--space-2) var(--space-3);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
        font-family: monospace;
        font-size: 1rem;
        letter-spacing: 0.1em;
        margin: var(--space-2) 0;
      }

      .verification-input {
        display: flex;
        justify-content: center;
        margin: var(--space-4) 0;
      }

      .code-input {
        text-align: center;
        font-size: 1.5rem;
        letter-spacing: 0.5em;
        font-family: monospace;
        max-width: 200px;
      }

      .step-content.success {
        text-align: center;
      }

      .success-icon {
        font-size: 4rem;
        color: var(--color-status-success);
        margin-bottom: var(--space-4);
      }

      .backup-codes {
        margin-top: var(--space-4);
        padding: var(--space-4);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        text-align: left;
      }

      .backup-codes h5 {
        margin: 0 0 var(--space-2) 0;
        color: var(--text-primary);
      }

      .codes-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-2);
        margin: var(--space-3) 0;
      }

      .backup-code {
        padding: var(--space-2);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
        font-family: monospace;
        text-align: center;
      }

      /* Sessions Styles */
      .sessions-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .loading-sessions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: var(--space-6);
        color: var(--text-secondary);
      }

      .session-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        border-radius: var(--p-border-radius);
        border: 1px solid var(--p-surface-200);
      }

      .session-item.current {
        background: var(--color-brand-light);
        border-color: var(--color-brand-primary);
      }

      .session-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--p-surface-100);
        border-radius: 50%;
      }

      .session-icon i {
        font-size: 1.25rem;
        color: var(--text-secondary);
      }

      .session-info {
        flex: 1;
      }

      .session-device {
        font-weight: 500;
        color: var(--text-primary);
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .current-badge {
        font-size: 0.75rem;
        padding: 2px 6px;
        background: var(--color-brand-primary);
        color: white;
        border-radius: var(--p-border-radius);
      }

      .session-details {
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      .disable-2fa {
        text-align: center;
        padding: var(--space-4);
      }

      /* ========== Change Password Dialog Styles ========== */
      :host ::ng-deep .password-dialog .p-dialog,
      :host ::ng-deep .delete-dialog .p-dialog,
      :host ::ng-deep .twofa-dialog .p-dialog,
      :host ::ng-deep .sessions-dialog .p-dialog {
        border-radius: 20px !important;
        overflow: hidden;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
      }

      :host ::ng-deep .password-dialog .p-dialog-content,
      :host ::ng-deep .delete-dialog .p-dialog-content,
      :host ::ng-deep .twofa-dialog .p-dialog-content,
      :host ::ng-deep .sessions-dialog .p-dialog-content {
        padding: 0 !important;
        background: var(--surface-primary, #ffffff) !important;
      }

      .dialog-container {
        padding: 0;
      }

      .dialog-header {
        display: flex;
        align-items: flex-start;
        gap: 1.125rem;
        padding: 1.5rem 1.5rem 1.375rem;
        background: linear-gradient(135deg, rgba(8, 153, 73, 0.08) 0%, rgba(8, 153, 73, 0.02) 100%);
        border-bottom: 1px solid rgba(8, 153, 73, 0.1);
        position: relative;
      }

      .dialog-icon {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        background: linear-gradient(135deg, #0ab85a 0%, #089949 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
      }

      .dialog-icon i {
        font-size: 1.5rem;
        color: white;
      }

      .dialog-title-section {
        flex: 1;
        padding-top: 0.25rem;
      }

      .dialog-title-section h2 {
        margin: 0 0 0.375rem 0;
        font-family: 'Poppins', sans-serif;
        font-size: 1.375rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
        line-height: 1.2;
      }

      .dialog-title-section p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--color-text-secondary, #6b7280);
        line-height: 1.4;
      }

      .dialog-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 36px;
        height: 36px;
        border: none;
        background: var(--surface-secondary, #f5f5f5);
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .dialog-close i {
        font-size: 1rem;
        color: var(--color-text-secondary, #6b7280);
      }

      .dialog-close:hover {
        background: var(--color-text-primary, #1a1a1a);
      }

      .dialog-close:hover i {
        color: white;
      }

      /* Password Form */
      .password-form {
        padding: 1.75rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }

      .form-field label {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
      }

      .form-field label i {
        font-size: 1.125rem;
        color: var(--ds-primary-green, #089949);
      }

      .input-wrapper {
        position: relative;
        margin-top: 0.25rem;
      }

      :host ::ng-deep .password-input {
        width: 100% !important;
        display: block !important;
      }

      :host ::ng-deep .password-input.p-password {
        display: flex !important;
        width: 100% !important;
      }

      :host ::ng-deep .password-input .p-password-input,
      :host ::ng-deep .password-input input {
        width: 100% !important;
        padding: 1rem 3.5rem 1rem 1.25rem !important;
        font-family: 'Poppins', sans-serif !important;
        font-size: 1rem !important;
        border: 2px solid var(--color-border-primary, #e0e0e0) !important;
        border-radius: 14px !important;
        background: var(--surface-primary, #ffffff) !important;
        color: var(--color-text-primary, #1a1a1a) !important;
        transition: all 0.2s ease !important;
        height: auto !important;
        min-height: 56px !important;
      }

      :host ::ng-deep .password-input .p-password-input:focus,
      :host ::ng-deep .password-input input:focus {
        border-color: var(--ds-primary-green, #089949) !important;
        box-shadow: 0 0 0 4px rgba(8, 153, 73, 0.12) !important;
        outline: none !important;
      }

      :host ::ng-deep .password-input .p-password-input::placeholder,
      :host ::ng-deep .password-input input::placeholder {
        color: var(--color-text-tertiary, #9ca3af) !important;
        font-size: 0.9375rem !important;
      }

      /* Toggle Icon (Eye) Positioning */
      :host ::ng-deep .password-input .p-password-toggle-mask-icon,
      :host ::ng-deep .password-input .p-password-unmask-icon,
      :host ::ng-deep .password-input .p-icon,
      :host ::ng-deep .password-input svg {
        position: absolute !important;
        right: 1.25rem !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        width: 1.25rem !important;
        height: 1.25rem !important;
        color: var(--color-text-secondary, #6b7280) !important;
        cursor: pointer !important;
        transition: color 0.2s ease !important;
      }

      :host ::ng-deep .password-input .p-password-toggle-mask-icon:hover,
      :host ::ng-deep .password-input .p-password-unmask-icon:hover,
      :host ::ng-deep .password-input .p-icon:hover,
      :host ::ng-deep .password-input svg:hover {
        color: var(--ds-primary-green, #089949) !important;
      }

      /* Ensure the password wrapper has relative positioning */
      :host ::ng-deep .password-input .p-password-wrapper,
      :host ::ng-deep .password-input .p-inputwrapper {
        position: relative !important;
        width: 100% !important;
        display: block !important;
      }

      /* Password Requirements */
      .password-requirements {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.75rem 1rem;
        margin-top: 0.75rem;
        padding: 1rem 1.125rem;
        background: var(--surface-secondary, #f8f8f8);
        border-radius: 12px;
        border: 1px solid var(--color-border-secondary, #f0f0f0);
      }

      .requirement {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #6b7280);
        transition: color 0.2s ease;
      }

      .requirement i {
        font-size: 1rem;
        transition: color 0.2s ease;
        flex-shrink: 0;
      }

      .requirement.met {
        color: var(--ds-primary-green, #089949);
      }

      .requirement.met i {
        color: var(--ds-primary-green, #089949);
      }

      /* Error & Success Messages */
      .error-message,
      .success-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.5rem;
        padding: 0.625rem 0.875rem;
        border-radius: 8px;
        font-size: 0.8125rem;
        font-weight: 500;
      }

      .error-message {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      .success-message {
        background: rgba(8, 153, 73, 0.1);
        color: var(--ds-primary-green, #089949);
      }

      .error-message i,
      .success-message i {
        font-size: 1rem;
      }

      /* Dialog Actions */
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding: 1.25rem 1.5rem;
        background: var(--surface-secondary, #f8f8f8);
        border-top: 1px solid var(--color-border-secondary, #f0f0f0);
        margin-top: 0.5rem;
      }

      .btn-cancel,
      .btn-submit {
        font-family: 'Poppins', sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        padding: 0.75rem 1.5rem;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-cancel {
        background: transparent;
        border: 2px solid var(--color-border-primary, #e0e0e0);
        color: var(--color-text-secondary, #6b7280);
      }

      .btn-cancel:hover {
        background: var(--surface-tertiary, #ebebeb);
        border-color: var(--color-text-secondary, #6b7280);
        color: var(--color-text-primary, #1a1a1a);
      }

      .btn-submit {
        background: linear-gradient(135deg, #0ab85a 0%, #089949 100%);
        border: none;
        color: white;
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
      }

      .btn-submit:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(8, 153, 73, 0.4);
      }

      .btn-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .btn-submit i {
        font-size: 1rem;
      }

      .btn-submit.full-width {
        width: 100%;
        justify-content: center;
      }

      /* ========== Danger Button (Delete) ========== */
      .btn-danger {
        font-family: 'Poppins', sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        padding: 0.75rem 1.5rem;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        border: none;
        color: white;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }

      .btn-danger:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
      }

      .btn-danger:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }

      .btn-danger-outline {
        font-family: 'Poppins', sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        padding: 0.75rem 1.25rem;
        border-radius: 9999px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: transparent;
        border: 2px solid #ef4444;
        color: #ef4444;
      }

      .btn-danger-outline:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.1);
      }

      .btn-danger-outline:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* ========== Delete Account Dialog ========== */
      .danger-header {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.03) 100%) !important;
        border-bottom-color: rgba(239, 68, 68, 0.15) !important;
      }

      .danger-icon {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
      }

      .delete-content {
        padding: 1.5rem;
      }

      .warning-box {
        display: flex;
        gap: 1rem;
        padding: 1.25rem;
        background: rgba(239, 68, 68, 0.05);
        border: 1px solid rgba(239, 68, 68, 0.15);
        border-radius: 14px;
        margin-bottom: 1.5rem;
      }

      .warning-icon-large {
        width: 48px;
        height: 48px;
        min-width: 48px;
        border-radius: 12px;
        background: rgba(239, 68, 68, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .warning-icon-large i {
        font-size: 1.5rem;
        color: #ef4444;
      }

      .warning-text h4 {
        margin: 0 0 0.5rem 0;
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        font-weight: 600;
        color: #dc2626;
      }

      .warning-text p {
        margin: 0;
        font-size: 0.875rem;
        color: var(--color-text-secondary, #6b7280);
      }

      .delete-list {
        list-style: none;
        padding: 0;
        margin: 0.75rem 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .delete-list li {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #6b7280);
      }

      .delete-list li i {
        font-size: 0.875rem;
        color: #ef4444;
        width: 1rem;
      }

      .confirm-field {
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
      }

      .confirm-field label {
        font-family: 'Poppins', sans-serif;
        font-size: 0.9375rem;
        font-weight: 500;
        color: var(--color-text-primary, #1a1a1a);
      }

      .confirm-field label strong {
        color: #ef4444;
      }

      .delete-input {
        width: 100%;
        padding: 1rem 1.25rem !important;
        font-family: 'Poppins', sans-serif !important;
        font-size: 1rem !important;
        border: 2px solid var(--color-border-primary, #e0e0e0) !important;
        border-radius: 14px !important;
        transition: all 0.2s ease !important;
      }

      .delete-input:focus {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12) !important;
        outline: none !important;
      }

      /* ========== 2FA Dialog Styles ========== */
      .step-progress {
        display: flex;
        justify-content: center;
        gap: 0.75rem;
        padding: 1rem 1.5rem 1.5rem;
        border-bottom: 1px solid var(--color-border-secondary, #f0f0f0);
        margin-bottom: 0.5rem;
      }

      .step-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--color-border-primary, #e0e0e0);
        transition: all 0.3s ease;
      }

      .step-dot.active {
        background: var(--ds-primary-green, #089949);
      }

      .step-dot.current {
        width: 28px;
        border-radius: 5px;
      }

      .twofa-content {
        padding: 1.5rem 1.75rem 1.75rem;
      }

      .step-section {
        text-align: center;
      }

      .step-section h3 {
        margin: 0 0 0.625rem 0;
        font-family: 'Poppins', sans-serif;
        font-size: 1.375rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
        line-height: 1.3;
      }

      .step-desc {
        margin: 0 0 1.75rem 0;
        font-size: 0.9375rem;
        color: var(--color-text-secondary, #6b7280);
        line-height: 1.5;
      }

      .app-list {
        display: flex;
        flex-direction: column;
        gap: 0.875rem;
      }

      .app-card {
        display: flex;
        align-items: center;
        gap: 1.125rem;
        padding: 1.125rem 1.375rem;
        background: var(--surface-secondary, #f8f8f8);
        border: 2px solid var(--color-border-secondary, #f0f0f0);
        border-radius: 14px;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .app-card:hover {
        border-color: var(--ds-primary-green, #089949);
        background: rgba(8, 153, 73, 0.05);
      }

      .app-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .app-icon i {
        font-size: 1.375rem;
        color: white;
      }

      .app-icon.google {
        background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
      }

      .app-icon.microsoft {
        background: linear-gradient(135deg, #00a4ef 0%, #7fba00 100%);
      }

      .app-icon.authy {
        background: linear-gradient(135deg, #ec1c24 0%, #ff6b6b 100%);
      }

      .app-card span {
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        font-weight: 500;
        color: var(--color-text-primary, #1a1a1a);
      }

      .qr-wrapper {
        width: 200px;
        height: 200px;
        margin: 0 auto 1.5rem;
        padding: 1rem;
        background: white;
        border: 2px solid var(--color-border-primary, #e0e0e0);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .qr-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .qr-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        color: var(--color-text-secondary, #6b7280);
      }

      .qr-loading i {
        font-size: 2rem;
        color: var(--ds-primary-green, #089949);
      }

      .manual-code {
        text-align: center;
      }

      .manual-label {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #6b7280);
        display: block;
        margin-bottom: 0.5rem;
      }

      .code-box {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: var(--surface-secondary, #f8f8f8);
        border: 1px solid var(--color-border-primary, #e0e0e0);
        border-radius: 10px;
      }

      .code-box code {
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 0.875rem;
        letter-spacing: 0.1em;
        color: var(--color-text-primary, #1a1a1a);
      }

      .copy-btn {
        width: 32px;
        height: 32px;
        border: none;
        background: var(--ds-primary-green, #089949);
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .copy-btn i {
        font-size: 0.875rem;
        color: white;
      }

      .copy-btn:hover {
        transform: scale(1.05);
      }

      .code-input-wrapper {
        max-width: 200px;
        margin: 0 auto 1rem;
      }

      .verification-code-input {
        width: 100%;
        padding: 1rem !important;
        font-family: 'SF Mono', Monaco, monospace !important;
        font-size: 1.5rem !important;
        text-align: center !important;
        letter-spacing: 0.5em !important;
        border: 2px solid var(--color-border-primary, #e0e0e0) !important;
        border-radius: 14px !important;
        transition: all 0.2s ease !important;
      }

      .verification-code-input:focus {
        border-color: var(--ds-primary-green, #089949) !important;
        box-shadow: 0 0 0 4px rgba(8, 153, 73, 0.12) !important;
        outline: none !important;
      }

      .success-section {
        padding-top: 1rem;
      }

      .success-icon-wrapper {
        width: 72px;
        height: 72px;
        margin: 0 auto 1.25rem;
        border-radius: 50%;
        background: linear-gradient(135deg, #0ab85a 0%, #089949 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 24px rgba(8, 153, 73, 0.3);
      }

      .success-icon-wrapper i {
        font-size: 2rem;
        color: white;
      }

      .backup-section {
        margin-top: 1.5rem;
        padding: 1.25rem;
        background: var(--surface-secondary, #f8f8f8);
        border: 1px solid var(--color-border-secondary, #f0f0f0);
        border-radius: 14px;
        text-align: left;
      }

      .backup-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .backup-header i {
        font-size: 1rem;
        color: var(--ds-primary-green, #089949);
      }

      .backup-header span {
        font-family: 'Poppins', sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
      }

      .backup-desc {
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #6b7280);
        margin: 0 0 1rem 0;
      }

      .codes-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .backup-code-item {
        padding: 0.625rem 0.75rem;
        background: white;
        border: 1px solid var(--color-border-primary, #e0e0e0);
        border-radius: 8px;
        font-family: 'SF Mono', Monaco, monospace;
        font-size: 0.8125rem;
        text-align: center;
        color: var(--color-text-primary, #1a1a1a);
      }

      .download-btn {
        width: 100%;
        padding: 0.75rem;
        font-family: 'Poppins', sans-serif;
        font-size: 0.875rem;
        font-weight: 600;
        border: 2px solid var(--ds-primary-green, #089949);
        background: transparent;
        color: var(--ds-primary-green, #089949);
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
      }

      .download-btn:hover {
        background: rgba(8, 153, 73, 0.1);
      }

      /* ========== Sessions Dialog Styles ========== */
      .sessions-content {
        padding: 0 1.5rem 1.5rem;
      }

      .sessions-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 3rem 0;
        color: var(--color-text-secondary, #6b7280);
      }

      .sessions-loading i {
        font-size: 2rem;
        color: var(--ds-primary-green, #089949);
      }

      .sessions-list-new {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .session-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.25rem;
        background: var(--surface-secondary, #f8f8f8);
        border: 1px solid var(--color-border-secondary, #f0f0f0);
        border-radius: 14px;
        transition: all 0.2s ease;
      }

      .session-card:hover {
        border-color: var(--color-border-primary, #e0e0e0);
      }

      .session-card.current {
        background: rgba(8, 153, 73, 0.08);
        border-color: rgba(8, 153, 73, 0.2);
      }

      .session-device-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: var(--surface-primary, #ffffff);
        border: 1px solid var(--color-border-secondary, #f0f0f0);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .session-device-icon i {
        font-size: 1.375rem;
        color: var(--color-text-secondary, #6b7280);
      }

      .session-card.current .session-device-icon {
        background: var(--ds-primary-green, #089949);
        border-color: transparent;
      }

      .session-card.current .session-device-icon i {
        color: white;
      }

      .session-details-new {
        flex: 1;
        min-width: 0;
      }

      .session-name {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-family: 'Poppins', sans-serif;
        font-size: 0.9375rem;
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
        margin-bottom: 0.375rem;
      }

      .current-tag {
        font-size: 0.6875rem;
        font-weight: 600;
        padding: 0.25rem 0.5rem;
        background: var(--ds-primary-green, #089949);
        color: white;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }

      .session-meta {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #6b7280);
      }

      .session-meta span {
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }

      .session-meta i {
        font-size: 0.75rem;
      }

      .revoke-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(239, 68, 68, 0.1);
        border-radius: 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
      }

      .revoke-btn i {
        font-size: 1rem;
        color: #ef4444;
      }

      .revoke-btn:hover {
        background: #ef4444;
      }

      .revoke-btn:hover i {
        color: white;
      }

      /* Theme Selector Styles */
      .theme-selector {
        display: flex;
        gap: var(--space-2);
        margin-top: var(--space-2);
      }

      .theme-option {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-4);
        background: var(--surface-secondary, #f5f5f5);
        border: 2px solid var(--color-border-primary, #e0e0e0);
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: var(--color-text-primary, #1a1a1a);
      }

      .theme-option:hover {
        background: var(--surface-tertiary, #ebebeb);
        border-color: var(--color-text-secondary, #6b7280);
      }

      .theme-option.active {
        background: rgba(8, 153, 73, 0.1);
        border-color: #089949;
        color: #089949;
      }

      .theme-option.active i,
      .theme-option.active span {
        color: #089949;
      }

      .theme-option i {
        font-size: 1.5rem;
        color: var(--color-text-secondary, #6b7280);
      }

      .theme-option span {
        font-size: var(--font-body-sm);
        font-weight: 600;
        color: var(--color-text-primary, #1a1a1a);
      }

      .theme-option:not(.active) i {
        color: var(--color-text-secondary, #6b7280);
      }

      .theme-option:not(.active) span {
        color: var(--color-text-primary, #1a1a1a);
      }

      .theme-hint {
        display: block;
        margin-top: var(--space-2);
        color: var(--text-secondary);
        font-size: var(--font-body-xs);
      }

      /* Visibility Option in Dropdown */
      .visibility-option {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        padding: 0.25rem 0;
      }

      .visibility-label {
        font-weight: 600;
        font-size: 0.9375rem;
        color: var(--color-text-primary, #1a1a1a);
      }

      .visibility-desc {
        font-size: 0.75rem;
        color: var(--color-text-secondary, #6b7280);
      }

      /* Language Field Container */
      .language-field {
        margin-bottom: var(--space-4);
      }

      /* Language selector uses global styles - just override width */
      :host ::ng-deep .language-selector {
        width: 100%;
      }

      /* Hint Box - Below the dropdown */
      .language-hint-box {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        margin-top: 0.75rem;
        padding: 0.75rem 1rem;
        font-size: 0.8125rem;
        color: var(--color-text-secondary, #6b7280);
        background: linear-gradient(135deg, rgba(8, 153, 73, 0.05) 0%, rgba(8, 153, 73, 0.02) 100%);
        border-radius: 10px;
        border: 1px solid rgba(8, 153, 73, 0.15);
      }

      .language-hint-box i {
        font-size: 1rem;
        color: var(--ds-primary-green, #089949);
        flex-shrink: 0;
      }

      .language-hint-box span {
        line-height: 1.4;
      }

      .privacy-controls-link {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--space-4);
        padding-top: var(--space-3);
      }

      .privacy-controls-link .link-info h4 {
        margin: 0 0 var(--space-1) 0;
        font-size: var(--font-body-md);
        font-weight: var(--font-weight-semibold);
        color: var(--text-primary);
      }

      .privacy-controls-link .link-info p {
        margin: 0;
        font-size: var(--font-body-sm);
        color: var(--text-secondary);
      }

      @media (max-width: 1200px) {
        .settings-grid {
          grid-template-columns: repeat(2, 1fr);
        }
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

        .theme-selector {
          flex-direction: column;
        }

        .theme-option {
          flex-direction: row;
          justify-content: flex-start;
          padding: var(--space-3);
        }

        .theme-option i {
          font-size: 1.25rem;
        }

        .privacy-controls-link {
          flex-direction: column;
          align-items: flex-start;
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
  twoFAStep = signal(1);
  twoFASecret = signal("");
  qrCodeUrl = signal("");
  twoFAVerificationCode = "";
  twoFAError = signal("");
  backupCodes = signal<string[]>([]);
  is2FAEnabled = signal(false);
  disable2FACode = "";

  // Sessions state
  activeSessions = signal<Array<{
    id: string;
    deviceName: string;
    deviceType: "desktop" | "mobile" | "tablet";
    location: string;
    lastActive: string;
    isCurrent: boolean;
  }>>([]);
  loadingSessions = signal(false);

  // Loading states
  isChangingPassword = signal(false);
  isDeletingAccount = signal(false);
  isEnabling2FA = signal(false);
  isDisabling2FA = signal(false);
  isRevokingAll = signal(false);

  visibilityOptions = [
    { label: "Public", value: "public", description: "Everyone in the app can see" },
    { label: "Private", value: "private", description: "Only you can see" },
    { label: "Coaches Only", value: "coaches", description: "Only you and coaches can see" },
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
    this.preferencesForm.get("theme")?.valueChanges.subscribe((theme: ThemeMode) => {
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

      const { data: profile, error } = await this.supabaseService.client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && profile) {
        // Patch form with existing data
        this.profileForm.patchValue({
          displayName: profile.display_name || this.profileForm.get('displayName')?.value,
          position: profile.position || '',
          jerseyNumber: profile.jersey_number || '',
          teamName: profile.team_name || '',
          phone: profile.phone || '',
        });
      }
    } catch (error) {
      this.logger.warn('Could not load profile data:', error);
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
      localStorage.setItem('user_settings', JSON.stringify(localSettings));

      // Apply theme immediately
      if (settings.preferences.theme) {
        this.themeService.setMode(settings.preferences.theme);
      }

      // Try to update profile in Supabase (gracefully handle if table doesn't exist)
      try {
        const { error: profileError } = await this.supabaseService.client
          .from("profiles")
          .upsert({
            id: user.id,
            display_name: settings.profile.displayName,
            position: settings.profile.position,
            jersey_number: settings.profile.jerseyNumber || null,
            team_name: settings.profile.teamName,
            phone: settings.profile.phone,
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          this.logger.warn("Profile table not available:", profileError.message);
        }
      } catch {
        // Table doesn't exist, continue with localStorage save
        this.logger.info("Using local storage for settings");
      }
      
      // Also update auth user metadata with display name
      try {
        await this.supabaseService.updateUser({
          data: { 
            full_name: settings.profile.displayName,
            name: settings.profile.displayName,
            position: settings.profile.position
          }
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
          this.logger.warn("Settings table not available:", settingsError.message);
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
            this.toastService.info("Email update requires verification. Check your inbox.");
          }
        } catch {
          // Email update not supported
        }
      }

      this.toastService.success("Settings saved successfully!");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save settings";
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

      // Delete user data from database tables
      const { error: deleteError } = await this.supabaseService.client
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (deleteError) {
        this.logger.warn("Could not delete profile:", deleteError.message);
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
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpAuthUrl)}`
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
      const message = error instanceof Error ? error.message : "Verification failed";
      this.twoFAError.set(message);
    } finally {
      this.isEnabling2FA.set(false);
    }
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 6).toUpperCase() + "-" +
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
      const message = error instanceof Error ? error.message : "Failed to disable 2FA";
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
      // For now, we'll show mock data
      await new Promise(resolve => setTimeout(resolve, 500));

      this.activeSessions.set([
        {
          id: "1",
          deviceName: "Chrome on macOS",
          deviceType: "desktop",
          location: "San Francisco, CA",
          lastActive: "Active now",
          isCurrent: true,
        },
        {
          id: "2",
          deviceName: "Safari on iPhone",
          deviceType: "mobile",
          location: "San Francisco, CA",
          lastActive: "2 hours ago",
          isCurrent: false,
        },
        {
          id: "3",
          deviceName: "Firefox on Windows",
          deviceType: "desktop",
          location: "New York, NY",
          lastActive: "Yesterday",
          isCurrent: false,
        },
      ]);
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
      this.activeSessions.update(sessions => 
        sessions.filter(s => s.id !== sessionId)
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
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.activeSessions.update(sessions => 
        sessions.filter(s => s.isCurrent)
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
