import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { Router, RouterModule } from "@angular/router";
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  Validators,
  ReactiveFormsModule,
} from "@angular/forms";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";
import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { ToastService } from "../../../core/services/toast.service";
import { TOAST } from "../../../core/constants/toast-messages.constants";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TeamCreateDataService } from "../services/team-create-data.service";

type TeamCreateForm = FormGroup<{
  name: FormControl<string>;
  description: FormControl<string>;
  location: FormControl<string>;
  sport: FormControl<string>;
  visibility: FormControl<string>;
}>;

@Component({
  selector: "app-team-create",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    FormInputComponent,
    SelectComponent,
    TextareaComponent,
    CardShellComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
  ],
  template: `
<app-main-layout>
      <div class="team-create-page ui-page-shell ui-page-shell--content-lg ui-page-stack">
        <app-page-header
          title="Create New Team"
          subtitle="Start a new team and invite players"
          icon="pi-users"
        ></app-page-header>

        <app-card-shell class="team-create-card">
          <form [formGroup]="teamForm" (ngSubmit)="onSubmit()">
            <div class="form-group">
              <app-form-input
                label="Team Name *"
                formControlName="name"
                placeholder="Enter team name"
                styleClass="w-full"
              />
              @if (isFieldInvalid("name")) {
                <small class="p-error">
                  {{ getFieldError("name") }}
                </small>
              }
            </div>

            <div class="form-group">
              <app-textarea
                label="Description (Optional)"
                formControlName="description"
                placeholder="Tell us about your team..."
                [rows]="4"
                styleClass="w-full"
              />
            </div>

            <div class="form-group">
              <app-form-input
                label="Location (Optional)"
                formControlName="location"
                placeholder="City, State"
                styleClass="w-full"
              />
            </div>

            <div class="form-group">
              <app-select
                label="Sport"
                formControlName="sport"
                [options]="sportOptions"
                placeholder="Select sport"
                styleClass="w-full"
              />
            </div>

            <div class="form-group">
              <app-select
                label="Team Visibility"
                formControlName="visibility"
                [options]="visibilityOptions"
                placeholder="Select visibility"
                styleClass="w-full"
              />
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
        </app-card-shell>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./team-create.component.scss",
})
export class TeamCreateComponent {
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);
  private toastService = inject(ToastService);
  private supabase = inject(SupabaseService);
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

  teamForm: TeamCreateForm = this.fb.group({
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
      const formData = this.teamForm.getRawValue();
      const currentUser = this.supabase.currentUser();

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

      void this.router.navigate(["/roster"]);
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
