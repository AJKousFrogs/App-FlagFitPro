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
  selector: "app-psychologist-onboarding",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="onboarding-container">
      <div class="onboarding-card">
        <div class="header">
          <h1>Psychologist Profile</h1>
          <p class="subtitle">Complete your professional profile</p>
        </div>

        @if (loading()) {
          <div class="loading">Loading...</div>
        } @else if (error()) {
          <div class="error-message">{{ error() }}</div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <!-- License Section -->
            <fieldset class="form-section">
              <legend>License Information</legend>

              <div class="form-group">
                <label for="licenseNumber">License Number</label>
                <input
                  id="licenseNumber"
                  type="text"
                  formControlName="licenseNumber"
                  placeholder="e.g., PSY-123456"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="licenseIssuedBy">License Issued By</label>
                <input
                  id="licenseIssuedBy"
                  type="text"
                  formControlName="licenseIssuedBy"
                  placeholder="e.g., State Board of Psychology"
                  class="form-input"
                />
              </div>
            </fieldset>

            <!-- Degree Section -->
            <fieldset class="form-section">
              <legend>Degree & Education</legend>

              <div class="form-group">
                <label for="degreeType">Degree Type</label>
                <select formControlName="degreeType" class="form-input">
                  <option value="">Select degree type</option>
                  <option value="PhD">PhD Psychology</option>
                  <option value="PsyD">PsyD</option>
                  <option value="MS">MS Psychology</option>
                </select>
              </div>

              <div class="form-group">
                <label for="degreeField">Degree Field</label>
                <input
                  id="degreeField"
                  type="text"
                  formControlName="degreeField"
                  placeholder="e.g., Sport Psychology, Clinical Psychology"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="educationBackground">Education Background</label>
                <textarea
                  id="educationBackground"
                  formControlName="educationBackground"
                  placeholder="Additional education details"
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

            <!-- Certifications -->
            <fieldset class="form-section">
              <legend>Certifications</legend>
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
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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
        color: #00f2fe;
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
        border-color: #00f2fe;
        box-shadow: 0 0 0 3px rgba(0, 242, 254, 0.1);
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
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 242, 254, 0.3);
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
export class PsychologistOnboardingComponent implements OnInit {
  private api = inject(ApiService);
  private logger = inject(LoggerService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loading = signal(false);
  error = signal<string | null>(null);
  submitting = signal(false);

  specializations = [
    "sport_psychology",
    "mental_health",
    "performance",
    "team_dynamics",
    "injury_psychology",
  ];

  certifications = ["AAPA", "USOC", "AASP", "Other"];

  selectedSpecializations = signal<string[]>([]);
  selectedCertifications = signal<string[]>([]);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      licenseNumber: [""],
      licenseIssuedBy: [""],
      degreeType: [""],
      degreeField: [""],
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
    this.api.get("/api/staff/psychologist-profile").subscribe({
      next: (response: any) => {
        const profile = response?.data || response;
        if (profile) {
          this.form.patchValue({
            licenseNumber: profile.license_number || "",
            licenseIssuedBy: profile.license_issued_by || "",
            degreeType: profile.degree_type || "",
            degreeField: profile.degree_field || "",
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

    this.api.post("/api/staff/psychologist-profile", payload).subscribe({
      next: () => {
        this.logger.info("Psychologist profile saved");
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
