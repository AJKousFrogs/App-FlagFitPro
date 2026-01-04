import { Component, signal, inject, output, input, effect, OnInit } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { FormsModule } from "@angular/forms";
import { ButtonComponent } from "../../../../shared/components/button/button.component";
import { IconButtonComponent } from "../../../../shared/components/button/icon-button.component";
import { Slider } from "primeng/slider";
import { Checkbox } from "primeng/checkbox";
import { Textarea } from "primeng/textarea";
import { DialogModule } from "primeng/dialog";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { UnifiedTrainingService } from "../../../../core/services/unified-training.service";
import { LoggerService } from "../../../../core/services/logger.service";

export interface WellnessData {
  sleepQuality: number;
  sleepHours: number;
  energyLevel: number;
  muscleSoreness: number;
  stressLevel: number;
  sorenessAreas: string[];
  notes?: string;
}

export interface ReadinessResult {
  readinessScore: number;
  sleepQuality: number;
  energyLevel: number;
  muscleSoreness: number;
  stressLevel: number;
  recommendation: string;
}

@Component({
  selector: "app-wellness-checkin",
  imports: [
    FormsModule, 
    Slider, 
    Checkbox, 
    Textarea, 
    DialogModule, 
    TagModule, 
    TooltipModule
  ,
    ButtonComponent,
    IconButtonComponent,
  ],
  template: `
    <!-- Quick Checkin Button -->
    @if (!hasCheckedIn()) {
      <div class="checkin-prompt" (click)="showDialog = true">
        <span class="prompt-icon">💚</span>
        <div class="prompt-content">
          <span class="prompt-title">Complete Wellness Check-in</span>
          <span class="prompt-subtitle">Track your readiness for today</span>
        </div>
        <i class="pi pi-chevron-right"></i>
      </div>
    } @else {
      <div class="checkin-complete" (click)="showDialog = true">
        <div class="readiness-display">
          <span class="readiness-score" [class]="getReadinessClass(readinessScore())">{{ readinessScore() }}</span>
          <span class="readiness-label">Readiness</span>
        </div>
        <div class="wellness-summary">
          <div class="summary-item" pTooltip="Sleep Quality">
            <span>😴</span>
            <span>{{ getSleepLabel(wellnessData().sleepQuality) }}</span>
          </div>
          <div class="summary-item" pTooltip="Energy Level">
            <span>⚡</span>
            <span>{{ getEnergyLabel(wellnessData().energyLevel) }}</span>
          </div>
          <div class="summary-item" pTooltip="Muscle Soreness">
            <span>💪</span>
            <span>{{ getSorenessLabel(wellnessData().muscleSoreness) }}</span>
          </div>
        </div>
        <app-icon-button icon="pi-pencil" variant="text" size="sm" ariaLabel="pencil" />
      </div>
    }

    <!-- Checkin Dialog -->
    <p-dialog
      [(visible)]="showDialog"
      header="Daily Wellness Check-in"
      [modal]="true"
      [style]="{ width: '95vw', maxWidth: '500px' }"
      [contentStyle]="{ 'padding-bottom': '1rem' }"
    >
      <div class="checkin-form">
        <!-- Sleep Quality -->
        <div class="form-section">
          <label class="section-label">
            <span class="label-icon">😴</span>
            <span>Sleep Quality</span>
            <span class="value-badge">{{ getSleepLabel(formData.sleepQuality) }}</span>
          </label>
          <div class="slider-row">
            <span class="slider-label">Poor</span>
            <p-slider [(ngModel)]="formData.sleepQuality" [min]="1" [max]="5" [step]="1" styleClass="flex-1" />
            <span class="slider-label">Excellent</span>
          </div>
        </div>

        <!-- Sleep Hours -->
        <div class="form-section">
          <label class="section-label">
            <span class="label-icon">🕐</span>
            <span>Hours of Sleep</span>
            <span class="value-badge">{{ formData.sleepHours }}h</span>
          </label>
          <div class="slider-row">
            <span class="slider-label">4h</span>
            <p-slider [(ngModel)]="formData.sleepHours" [min]="4" [max]="12" [step]="0.5" styleClass="flex-1" />
            <span class="slider-label">12h</span>
          </div>
        </div>

        <!-- Energy Level -->
        <div class="form-section">
          <label class="section-label">
            <span class="label-icon">⚡</span>
            <span>Energy Level</span>
            <span class="value-badge">{{ getEnergyLabel(formData.energyLevel) }}</span>
          </label>
          <div class="slider-row">
            <span class="slider-label">Exhausted</span>
            <p-slider [(ngModel)]="formData.energyLevel" [min]="1" [max]="5" [step]="1" styleClass="flex-1" />
            <span class="slider-label">Energized</span>
          </div>
        </div>

        <!-- Muscle Soreness -->
        <div class="form-section">
          <label class="section-label">
            <span class="label-icon">💪</span>
            <span>Muscle Soreness</span>
            <span class="value-badge">{{ getSorenessLabel(formData.muscleSoreness) }}</span>
          </label>
          <div class="slider-row">
            <span class="slider-label">Very Sore</span>
            <p-slider [(ngModel)]="formData.muscleSoreness" [min]="1" [max]="5" [step]="1" styleClass="flex-1" />
            <span class="slider-label">No Soreness</span>
          </div>
        </div>

        <!-- Soreness Areas -->
        @if (formData.muscleSoreness < 4) {
          <div class="form-section">
            <label class="section-label">
              <span class="label-icon">📍</span>
              <span>Where are you sore?</span>
            </label>
            <div class="body-area-grid">
              @for (area of bodyAreas; track area) {
                <label class="area-checkbox">
                  <p-checkbox
                    [ngModel]="formData.sorenessAreas.includes(area)"
                    (ngModelChange)="toggleArea(area, $event)"
                    [binary]="true"
                  />
                  <span>{{ area }}</span>
                </label>
              }
            </div>
          </div>
        }

        <!-- Stress Level -->
        <div class="form-section">
          <label class="section-label">
            <span class="label-icon">🧠</span>
            <span>Stress Level</span>
            <span class="value-badge">{{ getStressLabel(formData.stressLevel) }}</span>
          </label>
          <div class="slider-row">
            <span class="slider-label">Very High</span>
            <p-slider [(ngModel)]="formData.stressLevel" [min]="1" [max]="5" [step]="1" styleClass="flex-1" />
            <span class="slider-label">Very Low</span>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-section">
          <label class="section-label">
            <span class="label-icon">📝</span>
            <span>Notes (optional)</span>
          </label>
          <textarea p-textarea [(ngModel)]="formData.notes" rows="2" placeholder="Any additional notes..."></textarea>
        </div>

        <!-- Preview Score -->
        <div class="readiness-preview">
          <div class="preview-label">Estimated Readiness Score</div>
          <div class="preview-score" [class]="getReadinessClass(previewScore())">
            {{ previewScore() }}
          </div>
          <div class="preview-recommendation">{{ getRecommendation(previewScore()) }}</div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <app-button variant="text" (clicked)="showDialog = false">Cancel</app-button>
        <app-button iconLeft="pi-check" [loading]="isSaving()" (clicked)="saveCheckin()">Save Check-in</app-button>
      </ng-template>
    </p-dialog>
  `,
  styleUrl: './wellness-checkin.component.scss',
})
export class WellnessCheckinComponent implements OnInit {
  private trainingService = inject(UnifiedTrainingService);
  private logger = inject(LoggerService);

  // Input/Output
  date = input<string>(); // YYYY-MM-DD format
  checkinComplete = output<ReadinessResult>();

  // State from Unified Service
  hasCheckedIn = this.trainingService.hasCheckedInToday;
  readinessScore = this.trainingService.readinessScore;
  
  isSaving = signal(false);
  wellnessData = signal<WellnessData>({
    sleepQuality: 3,
    sleepHours: 7,
    energyLevel: 3,
    muscleSoreness: 3,
    stressLevel: 3,
    sorenessAreas: [],
  });

  showDialog = false;

  formData: WellnessData = {
    sleepQuality: 3,
    sleepHours: 7,
    energyLevel: 3,
    muscleSoreness: 3,
    stressLevel: 3,
    sorenessAreas: [],
    notes: "",
  };

  bodyAreas = [
    "Legs",
    "Lower Back",
    "Upper Back",
    "Shoulders",
    "Arms",
    "Chest",
    "Glutes",
    "Calves",
    "Core",
  ];

  previewScore = signal(50);

  ngOnInit(): void {
    this.loadExistingCheckin();
    this.updatePreviewScore();
  }

  async loadExistingCheckin(): Promise<void> {
    try {
      const targetDate = this.date() || new Date().toISOString().split("T")[0];
      const response: any = await firstValueFrom(this.trainingService.getWellnessForDay(targetDate));

      if (response?.success && response.data) {
        this.wellnessData.set(response.data);
        this.formData = { ...response.data };
      }
    } catch (err) {
      // No existing checkin - that's ok
    }
  }

  updatePreviewScore(): void {
    const score = this.calculateScore(this.formData);
    this.previewScore.set(score);
  }

  calculateScore(data: WellnessData): number {
    const sleepQualityScore = (data.sleepQuality / 5) * 100;
    const sleepHoursScore = Math.min(100, ((data.sleepHours - 4) / 4) * 100);
    const energyScore = (data.energyLevel / 5) * 100;
    const sorenessScore = (data.muscleSoreness / 5) * 100;
    const stressScore = (data.stressLevel / 5) * 100;

    const weighted =
      sleepQualityScore * 0.3 +
      sleepHoursScore * 0.15 +
      energyScore * 0.25 +
      sorenessScore * 0.15 +
      stressScore * 0.15;

    return Math.round(weighted);
  }

  async saveCheckin(): Promise<void> {
    this.isSaving.set(true);

    try {
      const targetDate = this.date() || new Date().toISOString().split("T")[0];
      const readiness = this.calculateScore(this.formData);

      const response: any = await this.trainingService.submitWellness({
        date: targetDate,
        ...this.formData,
        readinessScore: readiness,
      });

      if (response?.success) {
        this.wellnessData.set(this.formData);
        this.showDialog = false;

        this.checkinComplete.emit({
          readinessScore: readiness,
          sleepQuality: this.formData.sleepQuality,
          energyLevel: this.formData.energyLevel,
          muscleSoreness: this.formData.muscleSoreness,
          stressLevel: this.formData.stressLevel,
          recommendation: this.getRecommendation(readiness),
        });
      }
    } catch (err: any) {
      this.logger.error("Failed to save wellness checkin", err);
    } finally {
      this.isSaving.set(false);
    }
  }

  toggleArea(area: string, checked: boolean): void {
    if (checked) {
      this.formData.sorenessAreas = [...this.formData.sorenessAreas, area];
    } else {
      this.formData.sorenessAreas = this.formData.sorenessAreas.filter((a) => a !== area);
    }
  }

  getSleepLabel(value: number): string {
    const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
    return labels[value] || "";
  }

  getEnergyLabel(value: number): string {
    const labels = ["", "Exhausted", "Tired", "Normal", "Good", "Energized"];
    return labels[value] || "";
  }

  getSorenessLabel(value: number): string {
    const labels = ["", "Very Sore", "Sore", "Moderate", "Mild", "None"];
    return labels[value] || "";
  }

  getStressLabel(value: number): string {
    const labels = ["", "Very High", "High", "Moderate", "Low", "Very Low"];
    return labels[value] || "";
  }

  getReadinessClass(score: number): string {
    if (score >= 70) return "high";
    if (score >= 50) return "moderate";
    return "low";
  }

  getRecommendation(score: number): string {
    if (score >= 80) return "Ready for high-intensity training";
    if (score >= 70) return "Good for moderate training";
    if (score >= 60) return "Consider lighter training today";
    if (score >= 50) return "Focus on recovery activities";
    return "Rest day recommended";
  }
}
