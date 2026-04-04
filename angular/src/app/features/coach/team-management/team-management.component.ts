/**
 * Team Settings Component (Coach View)
 *
 * Canonical settings surface for team profile and preferences.
 * Roster, depth chart, and invitations are managed in their dedicated routes.
 */
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { ToastService } from "../../../core/services/toast.service";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";

import { LoggerService } from "../../../core/services/logger.service";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import {
  TeamManagementDataService,
  type TeamManagementSettings as TeamSettings,
} from "../services/team-management-data.service";

@Component({
  selector: "app-team-management",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardShellComponent,
    FormInputComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
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

        @if (loadError()) {
          <app-page-error-state
            title="Unable to load team settings"
            [message]="loadError()!"
            (retry)="retryLoadSettings()"
          />
        } @else {
          <app-card-shell class="tab-content-card">
            <div class="settings-form">
            <!-- Team Information -->
            <div class="settings-section">
              <h4><i class="pi pi-flag"></i> Team Information</h4>

              <div class="form-field">
                <app-form-input
                  label="Team Name"
                  id="teamName"
                  [value]="teamSettings().name"
                  (valueChange)="onTeamNameChange($event)"
                  class="w-full"
                ></app-form-input>
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label>Primary Color</label>
                  <input
                    type="color"
                    class="color-input"
                    [value]="toHexColor(teamSettings().primaryColor, '#16a34a')"
                    (input)="onPrimaryColorInput($event)"
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
                    (input)="onSecondaryColorInput($event)"
                  />
                  <span class="color-code">{{
                    teamSettings().secondaryColor
                  }}</span>
                </div>
              </div>

              <div class="form-field">
                <app-form-input
                  label="League / Division"
                  id="league"
                  [value]="teamSettings().league"
                  (valueChange)="onLeagueChange($event)"
                  class="w-full"
                ></app-form-input>
              </div>

              <div class="form-field">
                <app-form-input
                  label="Home Field"
                  id="homeField"
                  [value]="teamSettings().homeField"
                  (valueChange)="onHomeFieldChange($event)"
                  class="w-full"
                ></app-form-input>
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
                  (change)="onPreferenceToggle('requireWellnessCheckin', $event)"
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
                  (change)="onPreferenceToggle('autoSendRsvpReminders', $event)"
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
                  (change)="onPreferenceToggle('allowPlayersViewAnalytics', $event)"
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
                  (change)="onPreferenceToggle('requireCoachApprovalPosts', $event)"
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
        }
      </div>
    </app-main-layout>
  `,
  styleUrl: "./team-management.component.scss",
})
export class TeamManagementComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly teamManagementDataService = inject(TeamManagementDataService);

  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
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

  onPrimaryColorInput(event: Event): void {
    this.onPrimaryColorChange(this.readInputValue(event));
  }

  onPrimaryColorChange(value: string): void {
    this.teamSettings.update((settings) => ({ ...settings, primaryColor: value }));
  }

  onSecondaryColorInput(event: Event): void {
    this.onSecondaryColorChange(this.readInputValue(event));
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

  onPreferenceToggle(
    key:
      | "requireWellnessCheckin"
      | "autoSendRsvpReminders"
      | "allowPlayersViewAnalytics"
      | "requireCoachApprovalPosts",
    event: Event,
  ): void {
    this.onPreferenceChange(key, this.readChecked(event));
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

  private readInputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return "";
  }

  private readChecked(event: Event): boolean {
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
    this.loadError.set(null);

    try {
      const { data, error } = await this.teamManagementDataService.loadSettings();
      if (error) {
        throw error;
      }
      this.teamSettings.set(data);
    } catch (err) {
      this.logger.error("Failed to load team settings", err);
      this.loadError.set(
        "We couldn't load team settings. Please try again.",
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  retryLoadSettings(): void {
    void this.loadSettings();
  }

  async saveSettings(): Promise<void> {
    const { error } = await this.teamManagementDataService.saveSettings(
      this.teamSettings(),
    );

    if (error) {
      this.logger.error("Failed to save settings", error);
      this.toastService.error(
        "We couldn't save team settings. Please try again.",
        "Save Failed",
      );
      return;
    }

    this.toastService.success(
      "Team settings have been updated",
      "Settings Saved",
    );
  }
}
