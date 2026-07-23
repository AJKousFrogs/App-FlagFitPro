import {
  Component,
  signal,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { LucideAngularModule } from "lucide-angular";
import { ApiService } from "../core/services/api.service";
import { LoggerService } from "../core/services/logger.service";

@Component({
  selector: "app-head-coach-onboarding",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LucideAngularModule,
  ],
  template: `
    <div class="onboarding-container">
      <div class="onboarding-card">
        <div class="header">
          <h1>Head Coach Profile</h1>
          <p class="subtitle">Complete your coaching profile</p>
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
                <label for="coachingLicenseNumber"
                  >Coaching License Number</label
                >
                <input
                  id="coachingLicenseNumber"
                  type="text"
                  formControlName="coachingLicenseNumber"
                  placeholder="(optional)"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="coachingLicenseIssuedBy">Issued By</label>
                <input
                  id="coachingLicenseIssuedBy"
                  type="text"
                  formControlName="coachingLicenseIssuedBy"
                  placeholder="e.g., Coaching Federation"
                  class="form-input"
                />
              </div>
            </fieldset>

            <!-- Head Coach Info -->
            <fieldset class="form-section">
              <legend>Head Coach Information</legend>

              <div class="form-group">
                <label for="yearsOfCoachingExperience"
                  >Years of Coaching Experience</label
                >
                <input
                  id="yearsOfCoachingExperience"
                  type="number"
                  formControlName="yearsOfCoachingExperience"
                  min="0"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label for="yearsAsHeadCoach">Years as Head Coach</label>
                <input
                  id="yearsAsHeadCoach"
                  type="number"
                  formControlName="yearsAsHeadCoach"
                  min="0"
                  class="form-input"
                />
              </div>
            </fieldset>

            <!-- Education & Background -->
            <fieldset class="form-section">
              <legend>Education & Background</legend>

              <div class="form-group">
                <label for="educationBackground">Education Background</label>
                <textarea
                  id="educationBackground"
                  formControlName="educationBackground"
                  placeholder="Education and relevant background"
                  class="form-textarea"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="coachingBackground">Coaching Background</label>
                <textarea
                  id="coachingBackground"
                  formControlName="coachingBackground"
                  placeholder="Previous coaching positions and achievements"
                  class="form-textarea"
                ></textarea>
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

            <!-- Coaching Philosophy -->
            <fieldset class="form-section">
              <legend>Team Management & Philosophy</legend>

              <div class="form-group">
                <label for="coachingPhilosophy">Coaching Philosophy</label>
                <textarea
                  id="coachingPhilosophy"
                  formControlName="coachingPhilosophy"
                  placeholder="Describe your coaching approach and team philosophy"
                  class="form-textarea"
                  rows="4"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="teamDevelopmentApproach"
                  >Team Development Approach</label
                >
                <textarea
                  id="teamDevelopmentApproach"
                  formControlName="teamDevelopmentApproach"
                  placeholder="How you develop players and team dynamics"
                  class="form-textarea"
                  rows="3"
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

            <!-- Credentials Upload -->
            <fieldset class="form-section">
              <legend>Credential Verification</legend>
              <p class="help-text">
                Your credentials will be verified by an admin
              </p>

              <div class="form-group">
                <label for="credentialFile"
                  >Upload License or Certification</label
                >
                <div class="file-upload">
                  <input
                    id="credentialFile"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    (change)="onFileSelected($event)"
                    class="file-input"
                  />
                  <span class="file-help">PDF, JPG, or PNG (max 10MB)</span>
                </div>
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
        background: linear-gradient(135deg, #0093e9 0%, #80d0c7 100%);
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
        color: #0093e9;
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
        border-color: #0093e9;
        box-shadow: 0 0 0 3px rgba(0, 147, 233, 0.1);
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

      .file-upload {
        border: 2px dashed #ddd;
        border-radius: 6px;
        padding: 20px;
        text-align: center;
        transition: border-color 0.2s;
      }

      .file-upload:hover {
        border-color: #667eea;
      }

      .file-input {
        display: block;
        margin: 0 auto 8px;
      }

      .file-help {
        font-size: 12px;
        color: #666;
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
        background: linear-gradient(135deg, #0093e9 0%, #80d0c7 100%);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 147, 233, 0.3);
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
export class HeadCoachOnboardingComponent implements OnInit {
  private api = inject(ApiService);
  private logger = inject(LoggerService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  loading = signal(false);
  error = signal<string | null>(null);
  submitting = signal(false);

  private static readonly ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
  ];

  selectedFile = signal<File | null>(null);

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      this.error.set("File is too large (max 10MB)");
      return;
    }
    if (
      !HeadCoachOnboardingComponent.ALLOWED_DOCUMENT_TYPES.includes(file.type)
    ) {
      this.error.set("File must be a PDF, JPG, or PNG");
      return;
    }

    this.error.set(null);
    this.selectedFile.set(file);
    this.logger.info(`Selected credential file: ${file.name}`);
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  certifications = [
    "USA_Football",
    "Level_1",
    "Level_2",
    "AFC",
    "NFHS",
    "Other",
  ];

  selectedCertifications = signal<string[]>([]);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      coachingLicenseNumber: [""],
      coachingLicenseIssuedBy: [""],
      yearsOfCoachingExperience: [0, [Validators.required, Validators.min(0)]],
      yearsAsHeadCoach: [0, Validators.min(0)],
      educationBackground: [""],
      coachingBackground: [""],
      coachingPhilosophy: [""],
      teamDevelopmentApproach: [""],
      bio: [""],
    });
  }

  ngOnInit() {
    this.loadExistingProfile();
  }

  toggleCertification(cert: string) {
    const current = this.selectedCertifications();
    this.selectedCertifications.set(
      current.includes(cert)
        ? current.filter((c) => c !== cert)
        : [...current, cert],
    );
  }

  private loadExistingProfile() {
    this.loading.set(true);
    this.api.get("/api/staff/head-coach-profile").subscribe({
      next: (response: any) => {
        const profile = response?.data || response;
        if (profile) {
          this.form.patchValue({
            coachingLicenseNumber: profile.coaching_license_number || "",
            coachingLicenseIssuedBy: profile.coaching_license_issued_by || "",
            yearsOfCoachingExperience:
              profile.years_of_coaching_experience || 0,
            yearsAsHeadCoach: profile.years_as_head_coach || 0,
            educationBackground: profile.education_background || "",
            coachingBackground: profile.coaching_background || "",
            coachingPhilosophy: profile.coaching_philosophy || "",
            teamDevelopmentApproach: profile.team_development_approach || "",
            bio: profile.bio || "",
          });
          this.selectedCertifications.set(
            profile.coaching_certifications || [],
          );
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  async onSubmit() {
    if (!this.form.valid) return;

    this.submitting.set(true);
    this.error.set(null);

    const payload: Record<string, unknown> = {
      ...this.form.value,
      coach_specialty: "head_coach",
      coaching_certifications: this.selectedCertifications(),
    };

    const file = this.selectedFile();
    if (file) {
      try {
        payload["documentFile"] = await this.readFileAsBase64(file);
        payload["documentFileName"] = file.name;
        payload["documentFileType"] = file.type;
      } catch (err) {
        this.logger.error("Failed to read credential document", err);
        this.error.set("Could not read the selected file. Please try again.");
        this.submitting.set(false);
        return;
      }
    }

    this.api.post("/api/staff/head-coach-profile", payload).subscribe({
      next: () => {
        this.logger.info("Head coach profile saved");
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
