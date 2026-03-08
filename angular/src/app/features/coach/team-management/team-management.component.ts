/**
 * Team Settings Component (Coach View)
 *
 * Canonical settings surface for team profile and preferences.
 * Roster, depth chart, and invitations are managed in their dedicated routes.
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ToastService } from "../../../core/services/toast.service";
import { InputText } from "primeng/inputtext";
import { firstValueFrom } from "rxjs";

import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ApiResponse } from "../../../core/models/common.models";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";

interface TeamSettings {
  name: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  league: string;
  homeField: string;
  preferences: {
    requireWellnessCheckin: boolean;
    autoSendRsvpReminders: boolean;
    allowPlayersViewAnalytics: boolean;
    requireCoachApprovalPosts: boolean;
  };
}

@Component({
  selector: "app-team-management",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CardShellComponent,
    InputText,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    AppLoadingComponent,
  ],
  template: `
    <app-main-layout>
      <app-loading
        [visible]="isLoading()"
        variant="skeleton"
        message="Loading team settings..."
      ></app-loading>

      <div class="team-management-page ui-page-shell ui-page-shell--wide ui-page-stack">
        <app-page-header
          title="Team Settings"
          subtitle="Manage team profile and coaching preferences"
          icon="pi-cog"
        ></app-page-header>

        <app-card-shell class="tab-content-card">
          <div class="settings-form">
            <!-- Team Information -->
            <div class="settings-section">
              <h4><i class="pi pi-flag"></i> Team Information</h4>

              <div class="form-field">
                <label for="teamName">Team Name</label>
                <input
                  id="teamName"
                  type="text"
                  pInputText
                  [value]="teamSettings().name"
                  (input)="onTeamNameChange(getInputValue($event))"
                  class="w-full"
                />
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label>Primary Color</label>
                  <input
                    type="color"
                    class="color-input"
                    [value]="toHexColor(teamSettings().primaryColor, '#16a34a')"
                    (input)="onPrimaryColorChange(getInputValue($event))"
                  />
                  <span class="color-code">{{
                    teamSettings().primaryColor
                  }}</span>
                </div>
                <div class="form-field">
                  <label>Secondary Color</label>
                  <input
                    type="color"
                    class="color-input"
                    [value]="toHexColor(teamSettings().secondaryColor, '#0f172a')"
                    (input)="onSecondaryColorChange(getInputValue($event))"
                  />
                  <span class="color-code">{{
                    teamSettings().secondaryColor
                  }}</span>
                </div>
              </div>

              <div class="form-field">
                <label for="league">League / Division</label>
                <input
                  id="league"
                  type="text"
                  pInputText
                  [value]="teamSettings().league"
                  (input)="onLeagueChange(getInputValue($event))"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="homeField">Home Field</label>
                <input
                  id="homeField"
                  type="text"
                  pInputText
                  [value]="teamSettings().homeField"
                  (input)="onHomeFieldChange(getInputValue($event))"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Team Preferences -->
            <div class="settings-section">
              <h4><i class="pi pi-cog"></i> Team Preferences</h4>

              <div class="preference-item">
                <input
                  type="checkbox"
                  id="reqWellness"
                  [checked]="teamSettings().preferences.requireWellnessCheckin"
                  (change)="onPreferenceChange('requireWellnessCheckin', isChecked($event))"
                />
                <label for="reqWellness"
                  >Require wellness check-in before practice</label
                >
              </div>

              <div class="preference-item">
                <input
                  type="checkbox"
                  id="autoRsvp"
                  [checked]="teamSettings().preferences.autoSendRsvpReminders"
                  (change)="onPreferenceChange('autoSendRsvpReminders', isChecked($event))"
                />
                <label for="autoRsvp"
                  >Auto-send RSVP reminders 24 hours before events</label
                >
              </div>

              <div class="preference-item">
                <input
                  type="checkbox"
                  id="allowAnalytics"
                  [checked]="teamSettings().preferences.allowPlayersViewAnalytics"
                  (change)="onPreferenceChange('allowPlayersViewAnalytics', isChecked($event))"
                />
                <label for="allowAnalytics"
                  >Allow players to see team analytics</label
                >
              </div>

              <div class="preference-item">
                <input
                  type="checkbox"
                  id="reqApproval"
                  [checked]="teamSettings().preferences.requireCoachApprovalPosts"
                  (change)="onPreferenceChange('requireCoachApprovalPosts', isChecked($event))"
                />
                <label for="reqApproval"
                  >Require coach approval for community posts</label
                >
              </div>
            </div>

            <div class="settings-actions">
              <app-button iconLeft="pi-check" (clicked)="saveSettings()"
                >Save Changes</app-button
              >
            </div>
          </div>
        </app-card-shell>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./team-management.component.scss",
})
export class TeamManagementComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(true);
  readonly teamSettings = signal<TeamSettings>({
    name: "",
    primaryColor: "var(--color-info-text-accessible)",
    secondaryColor: "var(--surface-primary)",
    league: "",
    homeField: "",
    preferences: {
      requireWellnessCheckin: true,
      autoSendRsvpReminders: true,
      allowPlayersViewAnalytics: true,
      requireCoachApprovalPosts: false,
    },
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  onTeamNameChange(value: string): void {
    this.teamSettings.update((settings) => ({ ...settings, name: value }));
  }

  onPrimaryColorChange(value: string): void {
    this.teamSettings.update((settings) => ({ ...settings, primaryColor: value }));
  }

  onSecondaryColorChange(value: string): void {
    this.teamSettings.update((settings) => ({ ...settings, secondaryColor: value }));
  }

  onLeagueChange(value: string): void {
    this.teamSettings.update((settings) => ({ ...settings, league: value }));
  }

  onHomeFieldChange(value: string): void {
    this.teamSettings.update((settings) => ({ ...settings, homeField: value }));
  }

  onPreferenceChange(
    key:
      | "requireWellnessCheckin"
      | "autoSendRsvpReminders"
      | "allowPlayersViewAnalytics"
      | "requireCoachApprovalPosts",
    value: boolean,
  ): void {
    this.teamSettings.update((settings) => ({
      ...settings,
      preferences: {
        ...settings.preferences,
        [key]: value,
      },
    }));
  }

  getInputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return "";
  }

  isChecked(event: Event): boolean {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      return target.checked;
    }
    return false;
  }

  toHexColor(value: string, fallback: string): string {
    const color = (value ?? "").trim();
    return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
  }

  async loadSettings(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response: ApiResponse<{ settings?: TeamSettings }> =
        await firstValueFrom(this.api.get(API_ENDPOINTS.teamManagement));
      if (response?.success && response.data?.settings) {
        this.teamSettings.set(response.data.settings);
      }
    } catch (err) {
      this.logger.error("Failed to load team settings", err);
    } finally {
      this.isLoading.set(false);
    }
  }

  saveSettings(): void {
    this.api
      .put(API_ENDPOINTS.teamSettings, this.teamSettings())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastService.success(
            "Team settings have been updated",
            "Settings Saved",
          );
        },
        error: (err) => this.logger.error("Failed to save settings", err),
      });
  }
}
