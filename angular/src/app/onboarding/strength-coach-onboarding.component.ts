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
  selector: "app-strength-coach-onboarding",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="onboarding-container">
      <div class="onboarding-card">
        <div class="header">
          <h1>Strength & Conditioning Coach Profile</h1>
          <p class="subtitle">Complete your professional profile</p>
        </div>

        @if (loading()) {
          <div class="loading">Loading...</div>
        } @else if (error()) {
          <div class="error-message">{{ error() }}</div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <!-- Primary Certification -->
            <fieldset class="form-section">
              <legend>Primary Certification</legend>

              <div class="form-group">
                <label for="primaryCertification">Primary Certification</label>
                <select formControlName="primaryCertification" class="form-input">
                  <option value="">Select primary certification</option>
                  <option value="CSCS">CSCS (NSCA)</option>
                  <option value="NSCA-CPT">NSCA-CPT</option>
                  <option value="CF-L1">CrossFit Level 1</option>
                  <option value="ISSN-SNS">ISSN Sports Nutrition</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label for="certificationIssuedBy">Issued By</label>
                <input
                  id="certificationIssuedBy"
                  type="text"
                  formControlName="certificationIssuedBy"
                  placeholder="e.g., NSCA"
                  class="form-input"
                />
              </div>
            </fieldset>

            <!-- Additional Certifications -->
            <fieldset class="form-section">
              <legend>Additional Certifications</legend>
              <p class="help-text">Select all that apply</p>

              <div class="checkbox-group">
                @for (cert of certifications; track cert) {
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      [value]="cert"
                      (change)="toggleCertification(cert)"
                    />
                    {{ cert }}
                  </label>
                }
              </div>
            </fieldset>

            <!-- Education & Experience -->
            <fieldset class="form-section">
              <legend>Education & Experience</legend>

              <div class="form-group">
                <label for="educationBackground">Education Background</label>
                <textarea
                  id="educationBackground"
                  formControlName="educationBackground"
                  placeholder="e.g., BS Kinesiology, Exercise Science"
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="yearsOfExperience">Years of Experience</label>
                <input
                  id="yearsOfExperience"
                  type="number"
                  formControlName="yearsOfExperience"
                  min="0"
                  class="form-input"
                />
              </div>
            </fieldset>

            <!-- Specializations -->
            <fieldset class="form-section">
              <legend>Specializations</legend>
              <p class="help-text">Select all that apply</p>

              <div class="checkbox-group">
                @for (spec of specializations; track spec) {
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      [value]="spec"
                      (change)="toggleSpecialization(spec)"
                    />
                    {{ spec }}
                  </label>
                }
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
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
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
        color: #fa709a;
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
        border-color: #fa709a;
        box-shadow: 0 0 0 3px rgba(250, 112, 154, 0.1);
      }

      .form-textarea {
        resize: vertical;
        min-height: 80px;
      }

      .help-text {
        font-size: 12px;
        color: #666;
        margin: 0 0 12px 0;
      }

      .checkbox-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        font-size: 14px;
        cursor: pointer;
      }

      .checkbox-label input {
        margin-right: 8px;
        cursor: pointer;
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
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(250, 112, 154, 0.3);
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
export class StrengthCoachOnboardingComponent implements OnInit {
  private api = inject(ApiService);
  private logger = inject(LoggerService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loading = signal(false);
  error = signal<string | null>(null);
  submitting = signal(false);

  specializations = [
    "powerlifting",
    "olympic_lifting",
    "football",
    "basketball",
    "track_field",
    "baseball",
  ];

  certifications = ["CSCS", "NSCA-CPT", "CF-L1", "ISSN-SNS", "Other"];

  selectedSpecializations = signal<string[]>([]);
  selectedCertifications = signal<string[]>([]);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      primaryCertification: [""],
      certificationIssuedBy: [""],
      educationBackground: [""],
      yearsOfExperience: [0, Validators.min(0)],
      bio: [""],
    });
  }

  ngOnInit() {
    this.loadExistingProfile();
  }

  toggleSpecialization(spec: string) {
    const current = this.selectedSpecializations();
    this.selectedSpecializations.set(
      current.includes(spec)
        ? current.filter((s) => s !== spec)
        : [...current, spec]
    );
  }

  toggleCertification(cert: string) {
    const current = this.selectedCertifications();
    this.selectedCertifications.set(
      current.includes(cert)
        ? current.filter((c) => c !== cert)
        : [...current, cert]
    );
  }

  private loadExistingProfile() {
    this.loading.set(true);
    this.api.get("/api/staff/strength-coach-profile").subscribe({
      next: (response: any) => {
        const profile = response?.data || response;
        if (profile) {
          this.form.patchValue({
            primaryCertification: profile.primary_certification || "",
            certificationIssuedBy: profile.certification_issued_by || "",
            educationBackground: profile.education_background || "",
            yearsOfExperience: profile.years_of_experience || 0,
            bio: profile.bio || "",
          });
          this.selectedSpecializations.set(profile.specializations || []);
          this.selectedCertifications.set(profile.certifications || []);
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

    const payload = {
      ...this.form.value,
      specializations: this.selectedSpecializations(),
      certifications: this.selectedCertifications(),
    };

    this.api.post("/api/staff/strength-coach-profile", payload).subscribe({
      next: () => {
        this.logger.info("Strength coach profile saved");
        this.submitting.set(false);
        this.router.navigate(["/staff/dashboard"]);
      },
      error: (err: any) => {
        this.logger.error("Failed to save profile", err);
        this.error.set("Failed to save profile. Please try again.");
        this.submitting.set(false);
      },
    });
  }

  onCancel() {
    this.router.navigate(["/staff/dashboard"]);
  }
}
