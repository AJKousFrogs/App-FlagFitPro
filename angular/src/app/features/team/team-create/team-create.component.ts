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
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { ToastModule } from "primeng/toast";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { ToastService } from "../../../core/services/toast.service";

@Component({
  selector: "app-team-create",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <p-toast></p-toast>
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

            <div class="form-actions">
              <p-button
                label="Cancel"
                [outlined]="true"
                severity="secondary"
                [routerLink]="['/roster']"
              ></p-button>
              <p-button
                type="submit"
                label="Create Team"
                icon="pi pi-check"
                [loading]="isSubmitting()"
                [disabled]="teamForm.invalid"
              ></p-button>
            </div>
          </form>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .team-create-page {
        padding: var(--space-6);
      }

      .team-create-card {
        margin-top: var(--space-6);
        max-width: 600px;
      }

      .form-group {
        margin-bottom: var(--space-4);
      }

      .form-group label {
        display: block;
        margin-bottom: var(--space-2);
        font-weight: 500;
        color: var(--text-primary);
      }

      .form-group label.required::after {
        content: " *";
        color: var(--p-red-500);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-3);
        margin-top: var(--space-6);
        padding-top: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
      }
    `,
  ],
})
export class TeamCreateComponent {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  isSubmitting = signal(false);

  teamForm: FormGroup = this.fb.group({
    name: ["", [Validators.required, Validators.minLength(3)]],
    description: [""],
    location: [""],
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

      // See issue #3 - Implement team creation API
      // const response = await this.apiService.createTeam(formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.toastService.success(`${formData.name} has been created successfully!`);

      // Redirect to roster page
      setTimeout(() => {
        this.router.navigate(["/roster"]);
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create team. Please try again.";
      this.toastService.error(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
