import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { Router, RouterModule } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { Card } from "primeng/card";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { AuthService } from "../../../core/services/auth.service";
import { TeamCreateDataService } from "../services/team-create-data.service";

@Component({
  selector: "app-team-create",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    Card,
    InputText,

    Select,
    MainLayoutComponent,
    PageHeaderComponent,

    ButtonComponent,
  ],
  template: `
<app-main-layout>
      <div class="team-create-page">
        <app-page-header
          title="Create New Team"
          subtitle="Start a new team and invite players"
          icon="pi-users"
        ></app-page-header>

        <p-card class="team-create-card">
          <form [formGroup]="teamForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label for="name" class="required">Team Name</label>
              <input
                id="name"
                type="text"
                pInputText
                formControlName="name"
                placeholder="Enter team name"
                [class.ng-invalid]="isFieldInvalid('name')"
                class="w-full"
              />
              @if (isFieldInvalid("name")) {
                <small class="p-error">
                  {{ getFieldError("name") }}
                </small>
              }
            </div>

            <div class="form-group">
              <label for="description">Description (Optional)</label>
              <textarea
                id="description"
                formControlName="description"
                placeholder="Tell us about your team..."
                rows="4"
                class="w-full p-inputtextarea"
              ></textarea>
            </div>

            <div class="form-group">
              <label for="location">Location (Optional)</label>
              <input
                id="location"
                type="text"
                pInputText
                formControlName="location"
                placeholder="City, State"
                class="w-full"
              />
            </div>

            <div class="form-group">
              <label for="sport">Sport</label>
              <p-select
                id="sport"
                formControlName="sport"
                [options]="sportOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select sport"
                class="w-full"
              ></p-select>
            </div>

            <div class="form-group">
              <label for="visibility">Team Visibility</label>
              <p-select
                id="visibility"
                formControlName="visibility"
                [options]="visibilityOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select visibility"
                class="w-full"
              ></p-select>
            </div>

            <div class="form-actions">
              <app-button variant="outlined" routerLink="/roster"
                >Cancel</app-button
              >
              <app-button
                iconLeft="pi-check"
                [loading]="isSubmitting()"
                [disabled]="teamForm.invalid"
                >Create Team</app-button
              >
            </div>
          </form>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./team-create.component.scss",
})
export class TeamCreateComponent {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private teamCreateDataService = inject(TeamCreateDataService);

  isSubmitting = signal(false);

  sportOptions = [
    { label: "Flag Football", value: "flag_football" },
    { label: "Football", value: "football" },
    { label: "Soccer", value: "soccer" },
    { label: "Basketball", value: "basketball" },
    { label: "Volleyball", value: "volleyball" },
    { label: "Other", value: "other" },
  ];

  visibilityOptions = [
    { label: "Public - Anyone can find and request to join", value: "public" },
    { label: "Private - Invite only", value: "private" },
  ];

  teamForm: FormGroup = this.fb.group({
    name: ["", [Validators.required, Validators.minLength(3)]],
    description: [""],
    location: [""],
    sport: ["flag_football"],
    visibility: ["public"],
  });

  isFieldInvalid(fieldName: string): boolean {
    const field = this.teamForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.teamForm.get(fieldName);
    if (field?.hasError("required")) {
      return `${fieldName} is required`;
    }
    if (field?.hasError("minlength")) {
      return `${fieldName} must be at least ${field.errors?.["minlength"].requiredLength} characters`;
    }
    return "";
  }

  async onSubmit(): Promise<void> {
    if (this.teamForm.invalid) {
      this.teamForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    try {
      const formData = this.teamForm.value;
      const currentUser = this.authService.getUser();

      if (!currentUser?.id) {
        this.toastService.error(TOAST.ERROR.MUST_BE_LOGGED_IN);
        return;
      }

      // Create team in Supabase
      const { team, error: teamError } =
        await this.teamCreateDataService.createTeam({
          name: formData.name,
          description: formData.description || null,
          location: formData.location || null,
          sport: formData.sport,
          visibility: formData.visibility,
          ownerId: currentUser.id,
        });

      if (teamError) {
        throw new Error(teamError.message);
      }
      if (!team) {
        throw new Error("Failed to create team");
      }

      // Add creator as team member with owner role
      const { error: memberError } =
        await this.teamCreateDataService.createOwnerMembership({
          teamId: team.id,
          userId: currentUser.id,
        });

      if (memberError) {
        // Rollback team creation if member insert fails
        await this.teamCreateDataService.rollbackTeam(team.id);
        throw new Error("Failed to add you as team owner. Please try again.");
      }

      this.toastService.success(
        `${formData.name} has been created successfully!`,
      );

      // Redirect to roster page with the new team
      setTimeout(() => {
        this.router.navigate(["/roster"], { queryParams: { team: team.id } });
      }, 1000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create team. Please try again.";
      this.toastService.error(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
