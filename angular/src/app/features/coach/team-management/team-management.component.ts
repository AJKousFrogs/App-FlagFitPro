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
import { FormsModule } from "@angular/forms";
import { ToastService } from "../../../core/services/toast.service";
import { Card } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { ColorPicker } from "primeng/colorpicker";
import { InputText } from "primeng/inputtext";
import { firstValueFrom } from "rxjs";

import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ApiResponse } from "../../../core/models/common.models";
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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Card,
    Checkbox,
    ColorPicker,
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

      <div class="team-management-page">
        <app-page-header
          title="Team Settings"
          subtitle="Manage team profile and coaching preferences"
          icon="pi-cog"
        ></app-page-header>

        <p-card class="tab-content-card">
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
                  [(ngModel)]="teamSettings().name"
                  class="w-full"
                />
              </div>

              <div class="form-row">
                <div class="form-field">
                  <label>Primary Color</label>
                  <p-colorPicker
                    [(ngModel)]="teamSettings().primaryColor"
                  ></p-colorPicker>
                  <span class="color-code">{{
                    teamSettings().primaryColor
                  }}</span>
                </div>
                <div class="form-field">
                  <label>Secondary Color</label>
                  <p-colorPicker
                    [(ngModel)]="teamSettings().secondaryColor"
                  ></p-colorPicker>
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
                  [(ngModel)]="teamSettings().league"
                  class="w-full"
                />
              </div>

              <div class="form-field">
                <label for="homeField">Home Field</label>
                <input
                  id="homeField"
                  type="text"
                  pInputText
                  [(ngModel)]="teamSettings().homeField"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Team Preferences -->
            <div class="settings-section">
              <h4><i class="pi pi-cog"></i> Team Preferences</h4>

              <div class="preference-item">
                <p-checkbox
                  [(ngModel)]="teamSettings().preferences.requireWellnessCheckin"
                  [binary]="true"
                  variant="filled"
                  inputId="reqWellness"
                ></p-checkbox>
                <label for="reqWellness"
                  >Require wellness check-in before practice</label
                >
              </div>

              <div class="preference-item">
                <p-checkbox
                  [(ngModel)]="teamSettings().preferences.autoSendRsvpReminders"
                  [binary]="true"
                  variant="filled"
                  inputId="autoRsvp"
                ></p-checkbox>
                <label for="autoRsvp"
                  >Auto-send RSVP reminders 24 hours before events</label
                >
              </div>

              <div class="preference-item">
                <p-checkbox
                  [(ngModel)]="teamSettings().preferences.allowPlayersViewAnalytics"
                  [binary]="true"
                  variant="filled"
                  inputId="allowAnalytics"
                ></p-checkbox>
                <label for="allowAnalytics"
                  >Allow players to see team analytics</label
                >
              </div>

              <div class="preference-item">
                <p-checkbox
                  [(ngModel)]="teamSettings().preferences.requireCoachApprovalPosts"
                  [binary]="true"
                  variant="filled"
                  inputId="reqApproval"
                ></p-checkbox>
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
        </p-card>
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

  async loadSettings(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response: ApiResponse<{ settings?: TeamSettings }> =
        await firstValueFrom(this.api.get("/api/team-management"));
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
      .put("/api/team/settings", this.teamSettings())
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
