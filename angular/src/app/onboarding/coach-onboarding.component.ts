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
  selector: "app-coach-onboarding",
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
          <h1>Coach Profile</h1>
          <p class="subtitle">Complete your professional profile</p>
        </div>

        @if (loading()) {
          <div class="loading">Loading...</div>
        } @else if (error()) {
          <div class="error-message">{{ error() }}</div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <!-- Coaching License -->
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

            <!-- Coaching Role -->
            <fieldset class="form-section">
              <legend>Coaching Role</legend>

              <div class="form-group">
                <label for="coachSpecialty">Specialty</label>
                <select formControlName="coachSpecialty" class="form-input">
                  <option value="">Select coaching role</option>
                  <option value="head_coach">Head Coach</option>
                  <option value="offense_coordinator">
                    Offense Coordinator
                  </option>
                  <option value="defense_coordinator">
                    Defense Coordinator
                  </option>
                  <option value="position_coach">Position Coach</option>
                  <option value="assistant_coach">Assistant Coach</option>
                </select>
              </div>

              <div class="form-group">
                <label for="positionSpecialization"
                  >Position Specialization</label
                >
                <input
                  id="positionSpecialization"
                  type="text"
                  formControlName="positionSpecialization"
                  placeholder="e.g., QB, RB, DB (for position coaches)"
                  class="form-input"
                />
              </div>
            </fieldset>

            <!-- Experience -->
            <fieldset class="form-section">
              <legend>Experience</legend>

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
                />
              </div>

              <div class="form-group">
                <label for="educationBackground">Education Background</label>
                <textarea
                  id="educationBackground"
                  formControlName="educationBackground"
                  placeholder="Education and relevant background"
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
              <legend>Coaching Philosophy</legend>

              <div class="form-group">
                <label for="coachingPhilosophy">Your Coaching Philosophy</label>
                <textarea
                  id="coachingPhilosophy"
                  formControlName="coachingPhilosophy"
                  placeholder="Describe your coaching approach and philosophy"
                  class="form-textarea"
                  rows="4"
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
        background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
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
        color: #30cfd0;
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
        border-color: #30cfd0;
        box-shadow: 0 0 0 3px rgba(48, 207, 208, 0.1);
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
        background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(48, 207, 208, 0.3);
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
export class CoachOnboardingComponent implements OnInit {
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
    if (!CoachOnboardingComponent.ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
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

  certifications = ["USA_Football", "Level_1", "Level_2", "AFC", "Other"];

  selectedCertifications = signal<string[]>([]);

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      coachingLicenseNumber: [""],
      coachingLicenseIssuedBy: [""],
      coachSpecialty: [""],
      positionSpecialization: [""],
      yearsOfCoachingExperience: [0, Validators.min(0)],
      educationBackground: [""],
      coachingPhilosophy: [""],
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
    this.api.get("/api/staff/coach-profile").subscribe({
      next: (response: any) => {
        const profile = response?.data || response;
        if (profile) {
          this.form.patchValue({
            coachingLicenseNumber: profile.coaching_license_number || "",
            coachingLicenseIssuedBy: profile.coaching_license_issued_by || "",
            coachSpecialty: profile.coach_specialty || "",
            positionSpecialization: profile.position_specialization || "",
            yearsOfCoachingExperience:
              profile.years_of_coaching_experience || 0,
            educationBackground: profile.education_background || "",
            coachingPhilosophy: profile.coaching_philosophy || "",
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

    this.api.post("/api/staff/coach-profile", payload).subscribe({
      next: () => {
        this.logger.info("Coach profile saved");
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
