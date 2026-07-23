import {
  Component,
  signal,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";

@Component({
  selector: "app-manager-onboarding",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="onboarding-container">
      <div class="onboarding-card">
        <div class="header">
          <h1>Team Manager Profile</h1>
          <p class="subtitle">Complete your professional profile</p>
        </div>

        @if (loading()) {
          <div class="loading">Loading...</div>
        } @else if (error()) {
          <div class="error-message">{{ error() }}</div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <!-- Management Specialization -->
            <fieldset class="form-section">
              <legend>Management Specialization</legend>

              <div class="form-group">
                <label for="managementSpecialization">Your Specialization</label>
                <select formControlName="managementSpecialization" class="form-input">
                  <option value="">Select specialization</option>
                  <option value="operations">Operations</option>
                  <option value="administrative">Administrative</option>
                  <option value="logistics">Logistics</option>
                  <option value="budget">Budget & Finance</option>
                  <option value="compliance">Compliance & Regulations</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </fieldset>

            <!-- Experience -->
            <fieldset class="form-section">
              <legend>Experience</legend>

              <div class="form-group">
                <label for="yearsOfExperience">Years of Management Experience</label>
                <input
                  id="yearsOfExperience"
                  type="number"
                  formControlName="yearsOfExperience"
                  min="0"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="educationBackground">Education Background</label>
                <textarea
                  id="educationBackground"
                  formControlName="educationBackground"
                  placeholder="e.g., Business Administration, Sports Management"
                  class="form-textarea"
                ></textarea>
              </div>
            </fieldset>

            <!-- Bio -->
            <fieldset class="form-section">
              <legend>About You</legend>

              <div class="form-group">
                <label for="bio">Professional Bio</label>
                <textarea
                  id="bio"
                  formControlName="bio"
                  placeholder="Brief professional biography"
                  class="form-textarea"
                  rows="4"
                ></textarea>
              </div>
            </fieldset>

            <div class="form-actions">
              <button
                type="submit"
                [disabled]="!form.valid || submitting()"
                class="btn-primary"
              >
                @if (submitting()) {
                  <span>Saving...</span>
                } @else {
                  <span>Complete Profile</span>
                }
              </button>
              <button type="button" (click)="onCancel()" class="btn-secondary">
                Skip for Now
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .onboarding-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
      }

      .onboarding-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
        max-width: 600px;
        width: 100%;
        padding: 40px;
      }

      .header {
        margin-bottom: 30px;
        text-align: center;
      }

      .header h1 {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 8px 0;
        color: #333;
      }

      .subtitle {
        font-size: 14px;
        color: #666;
        margin: 0;
      }

      .form-section {
        margin-bottom: 28px;
        padding-bottom: 28px;
        border-bottom: 1px solid #f0f0f0;
      }

      .form-section:last-of-type {
        border-bottom: none;
      }

      legend {
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        color: #a8edea;
        margin-bottom: 16px;
        display: block;
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 6px;
        color: #333;
      }

      .form-input,
      .form-textarea {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        font-family: inherit;
      }

      .form-input:focus,
      .form-textarea:focus {
        outline: none;
        border-color: #a8edea;
        box-shadow: 0 0 0 3px rgba(168, 237, 234, 0.1);
      }

      .form-textarea {
        resize: vertical;
        min-height: 80px;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        margin-top: 28px;
      }

      .btn-primary,
      .btn-secondary {
        flex: 1;
        padding: 12px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-primary {
        background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(168, 237, 234, 0.3);
      }

      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn-secondary {
        background: #f5f5f5;
        color: #333;
      }

      .btn-secondary:hover {
        background: #e0e0e0;
      }

      .loading,
      .error-message {
        padding: 20px;
        text-align: center;
      }

      .error-message {
        background: #fee;
        color: #c33;
        border-radius: 6px;
      }
    `,
  ],
})
export class ManagerOnboardingComponent implements OnInit {
  private api = inject(ApiService);
  private logger = inject(LoggerService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loading = signal(false);
  error = signal<string | null>(null);
  submitting = signal(false);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      managementSpecialization: [""],
      yearsOfExperience: [0, Validators.min(0)],
      educationBackground: [""],
      bio: [""],
    });
  }

  ngOnInit() {
    this.loadExistingProfile();
  }

  private loadExistingProfile() {
    this.loading.set(true);
    this.api.get("/api/staff/manager-profile").subscribe({
      next: (response: any) => {
        const profile = response?.data || response;
        if (profile) {
          this.form.patchValue({
            managementSpecialization: profile.management_specialization || "",
            yearsOfExperience: profile.years_of_experience || 0,
            educationBackground: profile.education_background || "",
            bio: profile.bio || "",
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  onSubmit() {
    if (!this.form.valid) return;

    this.submitting.set(true);
    this.error.set(null);

    const payload = this.form.value;

    this.api.post("/api/staff/manager-profile", payload).subscribe({
      next: () => {
        this.logger.info("Manager profile saved");
        this.submitting.set(false);
        this.router.navigate(["/staff/more"]);
      },
      error: (err: any) => {
        this.logger.error("Failed to save profile", err);
        this.error.set("Failed to save profile. Please try again.");
        this.submitting.set(false);
      },
    });
  }

  onCancel() {
    this.router.navigate(["/staff/more"]);
  }
}
