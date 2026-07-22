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
  selector: "app-athlete-onboarding",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="onboarding-container">
      <div class="onboarding-card">
        <div class="header">
          <h1>Athlete Profile</h1>
          <p class="subtitle">Complete your athletic profile</p>
        </div>

        @if (loading()) {
          <div class="loading">Loading...</div>
        } @else if (error()) {
          <div class="error-message">{{ error() }}</div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <!-- Basic Information -->
            <fieldset class="form-section">
              <legend>Basic Information</legend>

              <div class="form-group">
                <label for="athleteName">Full Name</label>
                <input
                  id="athleteName"
                  type="text"
                  formControlName="athleteName"
                  placeholder="Your full name"
                  class="form-input"
                  required
                />
              </div>

              <div class="form-group">
                <label for="dateOfBirth">Date of Birth</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  formControlName="dateOfBirth"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="position">Playing Position</label>
                <input
                  id="position"
                  type="text"
                  formControlName="position"
                  placeholder="e.g., QB, RB, WR, LB"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="height">Height (cm)</label>
                <input
                  id="height"
                  type="number"
                  formControlName="height"
                  min="0"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="weight">Weight (kg)</label>
                <input
                  id="weight"
                  type="number"
                  formControlName="weight"
                  min="0"
                  class="form-input"
                />
              </div>
            </fieldset>

            <!-- Sports Info -->
            <fieldset class="form-section">
              <legend>Athletic Information</legend>

              <div class="form-group">
                <label for="sport">Primary Sport</label>
                <select formControlName="sport" class="form-input" required>
                  <option value="">Select sport</option>
                  <option value="football">American Football</option>
                  <option value="soccer">Soccer</option>
                  <option value="basketball">Basketball</option>
                  <option value="baseball">Baseball</option>
                  <option value="track">Track & Field</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div class="form-group">
                <label for="yearsExperience">Years of Athletic Experience</label>
                <input
                  id="yearsExperience"
                  type="number"
                  formControlName="yearsExperience"
                  min="0"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="medicalHistory">Medical/Injury History</label>
                <textarea
                  id="medicalHistory"
                  formControlName="medicalHistory"
                  placeholder="Previous injuries or medical conditions relevant to training"
                  class="form-textarea"
                  rows="4"
                ></textarea>
              </div>
            </fieldset>

            <!-- Emergency Contact -->
            <fieldset class="form-section">
              <legend>Emergency Contact</legend>

              <div class="form-group">
                <label for="emergencyContactName">Emergency Contact Name</label>
                <input
                  id="emergencyContactName"
                  type="text"
                  formControlName="emergencyContactName"
                  placeholder="Name"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label for="emergencyContactPhone">Emergency Contact Phone</label>
                <input
                  id="emergencyContactPhone"
                  type="tel"
                  formControlName="emergencyContactPhone"
                  placeholder="Phone number"
                  class="form-input"
                />
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
        color: #667eea;
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
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .btn-primary:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
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
export class AthleteOnboardingComponent implements OnInit {
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
      athleteName: ["", Validators.required],
      dateOfBirth: [""],
      position: [""],
      height: [0, Validators.min(0)],
      weight: [0, Validators.min(0)],
      sport: ["", Validators.required],
      yearsExperience: [0, Validators.min(0)],
      medicalHistory: [""],
      emergencyContactName: [""],
      emergencyContactPhone: [""],
    });
  }

  ngOnInit() {
    this.loadExistingProfile();
  }

  private loadExistingProfile() {
    this.loading.set(true);
    this.api.get("/api/athlete/profile").subscribe({
      next: (response: any) => {
        const profile = response?.data || response;
        if (profile) {
          this.form.patchValue({
            athleteName: profile.athlete_name || "",
            dateOfBirth: profile.date_of_birth || "",
            position: profile.position || "",
            height: profile.height || 0,
            weight: profile.weight || 0,
            sport: profile.sport || "",
            yearsExperience: profile.years_experience || 0,
            medicalHistory: profile.medical_history || "",
            emergencyContactName: profile.emergency_contact_name || "",
            emergencyContactPhone: profile.emergency_contact_phone || "",
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

    this.api.post("/api/athlete/profile", payload).subscribe({
      next: () => {
        this.logger.info("Athlete profile saved");
        this.submitting.set(false);
        this.router.navigate(["/athlete/dashboard"]);
      },
      error: (err: any) => {
        this.logger.error("Failed to save profile", err);
        this.error.set("Failed to save profile. Please try again.");
        this.submitting.set(false);
      },
    });
  }

  onCancel() {
    this.router.navigate(["/athlete/dashboard"]);
  }
}
