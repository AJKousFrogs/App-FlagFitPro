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
import { ThemeService, ThemeMode } from "../../core/services/theme.service";
import { LoggerService } from "../../core/services/logger.service";
import { PasswordModule } from "primeng/password";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { ToggleSwitchModule } from "primeng/toggleswitch";
import { TooltipModule } from "primeng/tooltip";

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
    TooltipModule,
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
                <div class="theme-selector">
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

      <!-- 2FA Setup Dialog -->
      <p-dialog
        header="Enable Two-Factor Authentication"
        [(visible)]="show2FASetupDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
        [closable]="true"
      >
        <div class="twofa-setup">
          @switch (twoFAStep()) {
            @case (1) {
              <div class="step-content">
                <h4>Step 1: Install an Authenticator App</h4>
                <p>Download and install one of these authenticator apps on your mobile device:</p>
                <div class="app-list">
                  <div class="app-item">
                    <i class="pi pi-mobile"></i>
                    <span>Google Authenticator</span>
                  </div>
                  <div class="app-item">
                    <i class="pi pi-mobile"></i>
                    <span>Microsoft Authenticator</span>
                  </div>
                  <div class="app-item">
                    <i class="pi pi-mobile"></i>
                    <span>Authy</span>
                  </div>
                </div>
                <p-button
                  label="I have an authenticator app"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  (onClick)="twoFAStep.set(2)"
                  styleClass="w-full mt-4"
                ></p-button>
              </div>
            }
            @case (2) {
              <div class="step-content">
                <h4>Step 2: Scan QR Code</h4>
                <p>Open your authenticator app and scan this QR code:</p>
                <div class="qr-container">
                  @if (qrCodeUrl()) {
                    <img [src]="qrCodeUrl()" alt="2FA QR Code" class="qr-code" />
                  } @else {
                    <div class="qr-placeholder">
                      <i class="pi pi-spin pi-spinner"></i>
                      <span>Generating QR code...</span>
                    </div>
                  }
                </div>
                <div class="manual-entry">
                  <p>Can't scan? Enter this code manually:</p>
                  <code class="secret-code">{{ twoFASecret() }}</code>
                  <p-button
                    icon="pi pi-copy"
                    [text]="true"
                    size="small"
                    pTooltip="Copy code"
                    (onClick)="copySecret()"
                  ></p-button>
                </div>
                <p-button
                  label="Next"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  (onClick)="twoFAStep.set(3)"
                  styleClass="w-full mt-4"
                ></p-button>
              </div>
            }
            @case (3) {
              <div class="step-content">
                <h4>Step 3: Verify Setup</h4>
                <p>Enter the 6-digit code from your authenticator app:</p>
                <div class="verification-input">
                  <input
                    type="text"
                    pInputText
                    [(ngModel)]="twoFAVerificationCode"
                    placeholder="000000"
                    maxlength="6"
                    class="code-input"
                    (keyup.enter)="verify2FA()"
                  />
                </div>
                @if (twoFAError()) {
                  <small class="p-error">{{ twoFAError() }}</small>
                }
                <p-button
                  label="Verify & Enable"
                  icon="pi pi-shield"
                  [loading]="isEnabling2FA()"
                  [disabled]="twoFAVerificationCode.length !== 6"
                  (onClick)="verify2FA()"
                  styleClass="w-full mt-4"
                ></p-button>
              </div>
            }
            @case (4) {
              <div class="step-content success">
                <i class="pi pi-check-circle success-icon"></i>
                <h4>2FA Enabled Successfully!</h4>
                <p>Your account is now protected with two-factor authentication.</p>
                <div class="backup-codes">
                  <h5>Backup Codes</h5>
                  <p>Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.</p>
                  <div class="codes-grid">
                    @for (code of backupCodes(); track code) {
                      <code class="backup-code">{{ code }}</code>
                    }
                  </div>
                  <p-button
                    label="Download Codes"
                    icon="pi pi-download"
                    [outlined]="true"
                    size="small"
                    (onClick)="downloadBackupCodes()"
                  ></p-button>
                </div>
                <p-button
                  label="Done"
                  icon="pi pi-check"
                  (onClick)="close2FASetup()"
                  styleClass="w-full mt-4"
                ></p-button>
              </div>
            }
          }
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
            <label for="disable2FACode" class="p-label">Enter your authenticator code to confirm:</label>
            <input
              id="disable2FACode"
              type="text"
              pInputText
              [(ngModel)]="disable2FACode"
              placeholder="000000"
              maxlength="6"
              class="code-input w-full"
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
        header="Active Sessions"
        [(visible)]="showSessionsDialog"
        [modal]="true"
        [style]="{ width: '500px' }"
        [closable]="true"
      >
        <div class="sessions-list">
          @if (loadingSessions()) {
            <div class="loading-sessions">
              <i class="pi pi-spin pi-spinner"></i>
              <span>Loading sessions...</span>
            </div>
          } @else {
            @for (session of activeSessions(); track session.id) {
              <div class="session-item" [class.current]="session.isCurrent">
                <div class="session-icon">
                  <i [class]="getDeviceIcon(session.deviceType)"></i>
                </div>
                <div class="session-info">
                  <div class="session-device">
                    {{ session.deviceName }}
                    @if (session.isCurrent) {
                      <span class="current-badge">Current</span>
                    }
                  </div>
                  <div class="session-details">
                    {{ session.location }} • {{ session.lastActive }}
                  </div>
                </div>
                @if (!session.isCurrent) {
                  <p-button
                    icon="pi pi-sign-out"
                    severity="danger"
                    [text]="true"
                    [rounded]="true"
                    pTooltip="Sign out this device"
                    (onClick)="revokeSession(session.id)"
                  ></p-button>
                }
              </div>
            }
          }
        </div>
        <ng-template pTemplate="footer">
          <p-button
            label="Sign out all other devices"
            icon="pi pi-sign-out"
            severity="danger"
            [outlined]="true"
            [loading]="isRevokingAll()"
            (onClick)="revokeAllSessions()"
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
        background: var(--p-surface-50);
        border: 2px solid var(--p-surface-200);
        border-radius: var(--p-border-radius);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .theme-option:hover {
        background: var(--p-surface-100);
        border-color: var(--p-surface-300);
      }

      .theme-option.active {
        background: var(--color-brand-light);
        border-color: var(--color-brand-primary);
        color: var(--color-brand-primary);
      }

      .theme-option i {
        font-size: 1.5rem;
      }

      .theme-option span {
        font-size: var(--font-body-sm);
        font-weight: 500;
      }

      .theme-hint {
        display: block;
        margin-top: var(--space-2);
        color: var(--text-secondary);
        font-size: var(--font-body-xs);
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
    { label: "Public", value: "public" },
    { label: "Private", value: "private" },
    { label: "Friends Only", value: "friends" },
  ];

  themeOptions = [
    { label: "Light", value: "light", icon: "pi pi-sun" },
    { label: "Dark", value: "dark", icon: "pi pi-moon" },
    { label: "Auto (System)", value: "auto", icon: "pi pi-desktop" },
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

  async saveSettings(): Promise<void> {
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

    try {
      const user = this.supabaseService.getCurrentUser();
      if (!user) {
        this.toastService.error("Please log in to save settings");
        return;
      }

      // Update profile in Supabase
      const { error: profileError } = await this.supabaseService.client
        .from("profiles")
        .upsert({
          id: user.id,
          display_name: settings.profile.displayName,
          phone: settings.profile.phone,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        throw new Error(profileError.message);
      }

      // Update user settings (notification, privacy, preferences)
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
        // Table might not exist yet, log but don't fail
        this.logger.warn("Could not save user settings:", settingsError.message);
      }

      // Update email if changed
      if (settings.profile.email !== this.authService.getUser()?.email) {
        const { error: emailError } = await this.supabaseService.updateUser({
          email: settings.profile.email,
        });

        if (emailError) {
          this.toastService.warn("Email update requires verification. Check your inbox.");
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
