/**
 * Menstrual Cycle Tracking Component
 *
 * Enables female athletes to track their menstrual cycles with
 * personalized training, nutrition, and recovery recommendations.
 *
 * PRIVACY: This data is private by default. Coaches only see "recovery day recommended".
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardModule } from "primeng/card";
import { Checkbox } from "primeng/checkbox";
import { DatePicker } from "primeng/datepicker";
import { DialogModule } from "primeng/dialog";
import { MessageModule } from "primeng/message";
import { ProgressBarModule } from "primeng/progressbar";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { firstValueFrom } from "rxjs";

import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";

// ===== Interfaces =====
interface CyclePhase {
  name: string;
  shortName: string;
  days: string;
  dayRange: [number, number];
  intensityModifier: number;
  calorieModifier: number;
  hydrationModifier: number;
  recoveryModifier: number;
  color: string;
  icon: string;
  focusAreas: string[];
  keyInsights: string[];
  injuryRisk?: {
    area: string;
    risk: string;
    reason: string;
    precautions: string[];
  };
  priorityNutrients: { name: string; icon: string; benefit: string }[];
}

interface CycleStatus {
  currentDay: number;
  currentPhase: string;
  nextPeriodDate: string;
  cycleLength: number;
  cyclesTracked: number;
}

interface CycleEntry {
  id: string;
  startDate: string;
  endDate?: string;
  length?: number;
  flowIntensity: string;
  symptoms: string[];
  notes?: string;
}

// SymptomLog interface reserved for future use
// interface SymptomLog {
//   date: string;
//   symptoms: string[];
//   severity: string;
// }

// ===== Design Token Imports =====
import { CYCLE_PHASE_COLORS } from "../../core/utils/design-tokens.util";

// ===== Constants =====
const CYCLE_PHASES: CyclePhase[] = [
  {
    name: "Menstrual",
    shortName: "Menstrual",
    days: "Days 1-5",
    dayRange: [1, 5],
    intensityModifier: 70,
    calorieModifier: 100,
    hydrationModifier: 110,
    recoveryModifier: 130,
    color: CYCLE_PHASE_COLORS.menstrual, // --primitive-error-500 (red)
    icon: "🌸",
    focusAreas: [
      "Recovery",
      "Mobility work",
      "Light cardio",
      "Gentle stretching",
    ],
    keyInsights: [
      "🛋️ Your body is working hard - prioritize rest",
      "🏊 Pool workouts can help with cramps",
      "💧 Increase iron-rich foods to replace losses",
      "😴 Extra sleep supports recovery",
    ],
    priorityNutrients: [
      { name: "Iron", icon: "🥩", benefit: "Replaces losses" },
      { name: "Vitamin C", icon: "🍊", benefit: "Iron absorption" },
      { name: "Magnesium", icon: "🥬", benefit: "Reduces cramps" },
    ],
  },
  {
    name: "Follicular",
    shortName: "Follicular",
    days: "Days 6-13",
    dayRange: [6, 13],
    intensityModifier: 100,
    calorieModifier: 95,
    hydrationModifier: 100,
    recoveryModifier: 90,
    color: CYCLE_PHASE_COLORS.follicular, // --color-status-success (green)
    icon: "🌱",
    focusAreas: [
      "Strength training",
      "Skill work",
      "Endurance building",
      "New techniques",
    ],
    keyInsights: [
      "💪 Energy rising - great time for challenging workouts",
      "🎯 Higher insulin sensitivity - carbs are fuel",
      "📈 Perfect phase for learning new skills",
      "🏋️ Strength gains are optimized",
    ],
    priorityNutrients: [
      { name: "Protein", icon: "🥩", benefit: "Muscle building" },
      { name: "Complex Carbs", icon: "🍚", benefit: "Energy fuel" },
      { name: "B Vitamins", icon: "🥑", benefit: "Energy metabolism" },
    ],
  },
  {
    name: "Ovulation",
    shortName: "Ovulation",
    days: "Days 14-16",
    dayRange: [14, 16],
    intensityModifier: 110,
    calorieModifier: 100,
    hydrationModifier: 105,
    recoveryModifier: 85,
    color: CYCLE_PHASE_COLORS.ovulation, // --primitive-warning-500 (amber)
    icon: "🔥",
    focusAreas: [
      "Power & explosive movements",
      "Speed work & sprints",
      "Max strength training",
      "Competition / game day",
      "Personal record attempts",
    ],
    keyInsights: [
      "🔥 Peak performance window - best time for PRs!",
      "🎯 Schedule competitions here if possible",
      "💪 High pain tolerance - be careful not to overdo it",
      "⚠️ Slightly higher ACL injury risk - extended warm-up essential",
    ],
    injuryRisk: {
      area: "ACL",
      risk: "ELEVATED (3-6x higher)",
      reason: "Estrogen peak affects ligament laxity",
      precautions: [
        "Extended warm-up (15+ minutes)",
        "Neuromuscular activation exercises",
        "Avoid cold starts",
        "Extra focus on landing mechanics",
      ],
    },
    priorityNutrients: [
      { name: "Omega-3", icon: "🐟", benefit: "Anti-inflammatory" },
      { name: "Protein", icon: "🥩", benefit: "Performance" },
      { name: "Antioxidants", icon: "🫐", benefit: "Recovery" },
    ],
  },
  {
    name: "Luteal Early",
    shortName: "Luteal Early",
    days: "Days 17-22",
    dayRange: [17, 22],
    intensityModifier: 95,
    calorieModifier: 105,
    hydrationModifier: 115,
    recoveryModifier: 100,
    color: CYCLE_PHASE_COLORS.luteal, // --color-status-help (purple)
    icon: "🌿",
    focusAreas: [
      "Endurance work",
      "Moderate strength",
      "Tempo runs",
      "Sustained efforts",
    ],
    keyInsights: [
      "📊 Body temperature rises - may feel warmer",
      "💧 Increased hydration needs",
      "🍽️ Metabolism increasing - honor hunger cues",
      "🚫 Avoid extreme heat training",
    ],
    priorityNutrients: [
      { name: "Complex Carbs", icon: "🍚", benefit: "Sustain energy" },
      { name: "Magnesium", icon: "🥬", benefit: "Reduces PMS" },
      { name: "B Vitamins", icon: "🥑", benefit: "Mood support" },
    ],
  },
  {
    name: "Luteal Late",
    shortName: "Luteal Late",
    days: "Days 23-28",
    dayRange: [23, 28],
    intensityModifier: 80,
    calorieModifier: 110,
    hydrationModifier: 110,
    recoveryModifier: 120,
    color: CYCLE_PHASE_COLORS.late_luteal, // --color-staff-coaching (indigo)
    icon: "🌙",
    focusAreas: [
      "Technique refinement",
      "Flexibility",
      "Light conditioning",
      "Recovery focus",
    ],
    keyInsights: [
      "🌙 Energy may dip - listen to your body",
      "🍫 Cravings are normal - metabolism is at peak",
      "😌 Focus on technique over intensity",
      "🧘 Great time for yoga and mobility",
    ],
    priorityNutrients: [
      { name: "Magnesium", icon: "🥬", benefit: "Cramp relief" },
      { name: "Calcium", icon: "🥛", benefit: "PMS symptoms" },
      { name: "Omega-3", icon: "🐟", benefit: "Mood balance" },
      { name: "Vitamin B6", icon: "🍌", benefit: "Water retention" },
    ],
  },
];

const SYMPTOM_OPTIONS = [
  { label: "Cramps", value: "cramps" },
  { label: "Fatigue", value: "fatigue" },
  { label: "Bloating", value: "bloating" },
  { label: "Headache", value: "headache" },
  { label: "Mood Changes", value: "mood_changes" },
  { label: "Back Pain", value: "back_pain" },
  { label: "Nausea", value: "nausea" },
  { label: "Breast Tenderness", value: "breast_tenderness" },
  { label: "Other", value: "other" },
];

const FLOW_INTENSITY_OPTIONS = [
  { label: "Light", value: "light" },
  { label: "Moderate", value: "moderate" },
  { label: "Heavy", value: "heavy" },
];

const SEVERITY_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Mild", value: "mild" },
  { label: "Moderate", value: "moderate" },
  { label: "Severe", value: "severe" },
];

const PRIVACY_OPTIONS = [
  { label: "Only me (default)", value: "private" },
  { label: "Me + Athletic Trainer", value: "trainer" },
  { label: 'Me + Coach (anonymized as "recovery day")', value: "coach_anon" },
];

const RETENTION_OPTIONS = [
  { label: "6 months", value: "6" },
  { label: "12 months", value: "12" },
  { label: "24 months", value: "24" },
];

@Component({
  selector: "app-cycle-tracking",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    Checkbox,
    DatePicker,
    DialogModule,
    MessageModule,
    ProgressBarModule,
    RadioButton,
    Select,
    TableModule,
    TagModule,
    TextareaModule,
    ToastModule,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
      <p-toast></p-toast>

      <div class="cycle-tracking-page">
        <app-page-header
          title="Cycle Tracking"
          subtitle="Personalized training based on your cycle"
          icon="pi-heart"
        ></app-page-header>

        <!-- Privacy Notice -->
        <p-message severity="info" styleClass="privacy-notice">
          <ng-template pTemplate>
            <div class="privacy-content">
              <i class="pi pi-lock"></i>
              <div>
                <strong>Privacy First:</strong> This data is private by default.
                Coaches only see "recovery day recommended" - never cycle
                details.
                <a routerLink="/settings/privacy" class="privacy-link"
                  >Manage settings</a
                >
              </div>
            </div>
          </ng-template>
        </p-message>

        <!-- Current Cycle Status -->
        <p-card styleClass="cycle-status-card">
          <div class="cycle-status-content">
            <div class="cycle-day-display">
              <div
                class="day-circle"
                [style.borderColor]="getCurrentPhase().color"
              >
                <span class="day-number">{{ cycleStatus().currentDay }}</span>
                <span class="day-label">CYCLE DAY</span>
              </div>
            </div>

            <div class="phase-display">
              <div
                class="phase-badge"
                [style.backgroundColor]="getCurrentPhase().color"
              >
                <span class="phase-icon">{{ getCurrentPhase().icon }}</span>
                <span class="phase-name">{{ getCurrentPhase().name }}</span>
              </div>
              <div class="phase-performance">
                @if (getCurrentPhase().intensityModifier >= 100) {
                  <span class="performance-label">🔥 Peak Performance</span>
                } @else if (getCurrentPhase().intensityModifier >= 90) {
                  <span class="performance-label">💪 Good Energy</span>
                } @else {
                  <span class="performance-label">🛋️ Recovery Focus</span>
                }
              </div>
            </div>

            <div class="cycle-phases-timeline">
              @for (phase of cyclePhases; track phase.name) {
                <div
                  class="phase-segment"
                  [class.active]="phase.name === getCurrentPhase().name"
                  [style.backgroundColor]="
                    phase.name === getCurrentPhase().name
                      ? phase.color
                      : 'var(--surface-secondary)'
                  "
                  [title]="phase.name + ' - ' + phase.days"
                >
                  <span class="segment-label">{{ phase.shortName }}</span>
                  <span class="segment-days">{{ phase.days }}</span>
                </div>
              }
            </div>

            <div class="cycle-predictions">
              <div class="prediction">
                <span class="prediction-label">Next Period</span>
                <span class="prediction-value"
                  >{{ cycleStatus().nextPeriodDate | date: "MMM d" }} (±2
                  days)</span
                >
              </div>
              <div class="prediction">
                <span class="prediction-label">Cycle Length</span>
                <span class="prediction-value"
                  >{{ cycleStatus().cycleLength }} days (avg
                  {{ cycleStatus().cyclesTracked }} cycles)</span
                >
              </div>
            </div>
          </div>
        </p-card>

        <!-- Today's Recommendations -->
        <div class="recommendations-grid">
          <!-- Training Recommendations -->
          <p-card styleClass="recommendation-card training-card">
            <ng-template pTemplate="header">
              <div class="rec-header">
                <i class="pi pi-bolt"></i>
                <span
                  >Training Recommendations ({{
                    getCurrentPhase().name
                  }}
                  Phase)</span
                >
              </div>
            </ng-template>

            <div class="intensity-modifier">
              <span class="modifier-label">Intensity Modifier:</span>
              <span
                class="modifier-value"
                [class.boost]="getCurrentPhase().intensityModifier > 100"
                [class.reduce]="getCurrentPhase().intensityModifier < 100"
              >
                {{ getCurrentPhase().intensityModifier }}%
                @if (getCurrentPhase().intensityModifier > 100) {
                  (Can push {{ getCurrentPhase().intensityModifier - 100 }}%
                  harder!)
                } @else if (getCurrentPhase().intensityModifier < 100) {
                  (Reduce intensity by
                  {{ 100 - getCurrentPhase().intensityModifier }}%)
                }
              </span>
            </div>

            <div class="focus-areas">
              <h4><i class="pi pi-check-circle"></i> FOCUS AREAS</h4>
              <div class="focus-list">
                @for (area of getCurrentPhase().focusAreas; track area) {
                  <div class="focus-item">• {{ area }}</div>
                }
              </div>
            </div>

            <div class="key-insights">
              <h4><i class="pi pi-lightbulb"></i> KEY INSIGHTS</h4>
              <div class="insights-list">
                @for (insight of getCurrentPhase().keyInsights; track insight) {
                  <div class="insight-item">{{ insight }}</div>
                }
              </div>
            </div>

            @if (getCurrentPhase().injuryRisk) {
              <div class="injury-warning">
                <h4>
                  <i class="pi pi-exclamation-triangle"></i> INJURY AWARENESS
                </h4>
                <div class="injury-content">
                  <div class="injury-risk">
                    <strong
                      >{{ getCurrentPhase().injuryRisk!.area }} Risk:</strong
                    >
                    <span class="risk-level">{{
                      getCurrentPhase().injuryRisk!.risk
                    }}</span>
                  </div>
                  <div class="injury-reason">
                    <strong>Reason:</strong>
                    {{ getCurrentPhase().injuryRisk!.reason }}
                  </div>
                  <div class="injury-precautions">
                    <strong>Precautions:</strong>
                    <ul>
                      @for (
                        precaution of getCurrentPhase().injuryRisk!.precautions;
                        track precaution
                      ) {
                        <li>{{ precaution }}</li>
                      }
                    </ul>
                  </div>
                </div>
              </div>
            }
          </p-card>

          <!-- Nutrition Recommendations -->
          <p-card styleClass="recommendation-card nutrition-card">
            <ng-template pTemplate="header">
              <div class="rec-header">
                <i class="pi pi-apple"></i>
                <span
                  >Nutrition Recommendations ({{
                    getCurrentPhase().name
                  }}
                  Phase)</span
                >
              </div>
            </ng-template>

            <div class="nutrition-modifiers">
              <div class="modifier-item">
                <span class="modifier-name">Calorie Modifier:</span>
                <span class="modifier-val"
                  >{{ getCurrentPhase().calorieModifier }}%</span
                >
              </div>
              <div class="modifier-item">
                <span class="modifier-name">Hydration:</span>
                <span class="modifier-val"
                  >+{{ getCurrentPhase().hydrationModifier - 100 }}%</span
                >
              </div>
            </div>

            <div class="priority-nutrients">
              <h4>Priority Nutrients:</h4>
              <div class="nutrients-grid">
                @for (
                  nutrient of getCurrentPhase().priorityNutrients;
                  track nutrient.name
                ) {
                  <div class="nutrient-card">
                    <span class="nutrient-icon">{{ nutrient.icon }}</span>
                    <span class="nutrient-name">{{ nutrient.name }}</span>
                    <span class="nutrient-benefit">{{ nutrient.benefit }}</span>
                  </div>
                }
              </div>
            </div>

            <p-message severity="info" styleClass="nutrition-tip">
              <ng-template pTemplate>
                <span>💡 {{ getNutritionTip() }}</span>
              </ng-template>
            </p-message>
          </p-card>
        </div>

        <!-- ACWR Adjustment -->
        <p-card header="ACWR Adjustment" styleClass="acwr-card">
          <div class="acwr-content">
            <div class="acwr-values">
              <div class="acwr-item">
                <span class="acwr-label">Your Base ACWR</span>
                <span class="acwr-value">{{ baseAcwr() }}</span>
              </div>
              <div class="acwr-item">
                <span class="acwr-label">Phase-Adjusted ACWR</span>
                <span class="acwr-value adjusted">{{ adjustedAcwr() }}</span>
              </div>
            </div>

            <div class="sweet-spot-display">
              <span class="sweet-spot-label">Adjusted Sweet Spot Range:</span>
              <span class="sweet-spot-value"
                >{{ getAcwrSweetSpot().min }} -
                {{ getAcwrSweetSpot().max }}</span
              >
              <span class="vs-standard">(vs standard 0.8 - 1.3)</span>
            </div>

            <p-message
              [severity]="getAcwrStatus().severity"
              styleClass="acwr-status"
            >
              <ng-template pTemplate>
                <span>{{ getAcwrStatus().message }}</span>
              </ng-template>
            </p-message>
          </div>
        </p-card>

        <!-- Symptom Tracking -->
        <p-card styleClass="symptom-card">
          <ng-template pTemplate="header">
            <div class="symptom-header">
              <div class="symptom-title">
                <i class="pi pi-pencil"></i>
                <span>Today's Symptoms</span>
              </div>
              <app-button
                size="sm"
                iconLeft="pi-check"
                [loading]="isSavingSymptoms()"
                (clicked)="saveSymptoms()"
                >Log Symptoms</app-button
              >
            </div>
          </ng-template>

          <div class="symptoms-form">
            <div class="symptoms-grid">
              @for (symptom of symptomOptions; track symptom.value) {
                <div class="symptom-option">
                  <p-checkbox
                    [value]="symptom.value"
                    [(ngModel)]="todaySymptoms.symptoms"
                    [inputId]="'symptom-' + symptom.value"
                  ></p-checkbox>
                  <label [for]="'symptom-' + symptom.value">{{
                    symptom.label
                  }}</label>
                </div>
              }
            </div>

            <div class="severity-section">
              <label>Symptom Severity:</label>
              <div class="severity-options">
                @for (sev of severityOptions; track sev.value) {
                  <div class="severity-option">
                    <p-radioButton
                      [value]="sev.value"
                      [(ngModel)]="todaySymptoms.severity"
                      [inputId]="'severity-' + sev.value"
                    ></p-radioButton>
                    <label [for]="'severity-' + sev.value">{{
                      sev.label
                    }}</label>
                  </div>
                }
              </div>
            </div>
          </div>
        </p-card>

        <!-- Cycle History -->
        <p-card header="Recent Cycles" styleClass="history-card">
          @if (cycleHistory().length === 0) {
            <div class="empty-state">
              <i class="pi pi-calendar"></i>
              <p>
                No cycles logged yet. Log your first period to start tracking.
              </p>
            </div>
          } @else {
            <p-table
              [value]="cycleHistory()"
              [rows]="5"
              styleClass="p-datatable-sm"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>Cycle</th>
                  <th>Start Date</th>
                  <th>Length</th>
                  <th>Flow</th>
                  <th>Symptoms</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-cycle let-i="rowIndex">
                <tr>
                  <td>
                    {{ i === 0 ? "Current" : getMonthName(cycle.startDate) }}
                  </td>
                  <td>{{ cycle.startDate | date: "MMM d, y" }}</td>
                  <td>{{ cycle.length ? cycle.length + " days" : "--" }}</td>
                  <td>
                    <p-tag
                      [value]="formatFlow(cycle.flowIntensity)"
                      [severity]="getFlowSeverity(cycle.flowIntensity)"
                    ></p-tag>
                  </td>
                  <td class="symptoms-cell">
                    {{ formatSymptoms(cycle.symptoms) }}
                  </td>
                </tr>
              </ng-template>
            </p-table>

            <div class="cycle-stats">
              <span
                >Average Cycle Length:
                <strong>{{ averageCycleLength() }} days</strong></span
              >
              <span
                >Cycle Regularity:
                <strong>{{ cycleRegularity() }}</strong></span
              >
            </div>
          }
        </p-card>

        <!-- Privacy Settings -->
        <p-card header="Privacy Controls" styleClass="privacy-card">
          <div class="privacy-settings">
            <div class="privacy-option">
              <label>Who can see your cycle data?</label>
              <div class="privacy-radios">
                @for (option of privacyOptions; track option.value) {
                  <div class="privacy-radio">
                    <p-radioButton
                      [value]="option.value"
                      [(ngModel)]="privacySettings.visibility"
                      [inputId]="'privacy-' + option.value"
                    ></p-radioButton>
                    <label [for]="'privacy-' + option.value">{{
                      option.label
                    }}</label>
                  </div>
                }
              </div>
            </div>

            <div class="privacy-option">
              <label for="retention">Data Retention</label>
              <p-select
                id="retention"
                [options]="retentionOptions"
                [(ngModel)]="privacySettings.retention"
                optionLabel="label"
                optionValue="value"
                placeholder="Auto-delete data older than..."
                [style]="{ width: '300px' }"
              ></p-select>
            </div>

            <div class="privacy-actions">
              <app-button
                variant="outlined"
                iconLeft="pi-download"
                (clicked)="exportData()"
                >Export My Data</app-button
              >
              <app-button
                variant="outlined"
                iconLeft="pi-trash"
                (clicked)="confirmDeleteData()"
                >Delete All Data</app-button
              >
            </div>
          </div>
        </p-card>
      </div>

      <!-- Log Period Dialog -->
      <p-dialog
        header="Log Period"
        [modal]="true"
        [visible]="showLogDialog()"
        (visibleChange)="showLogDialog.set($event)"
        [style]="{ width: '500px' }"
        [breakpoints]="{ '640px': '95vw' }"
        [draggable]="false"
      >
        <div class="log-form">
          <!-- Dates -->
          <div class="form-row">
            <div class="form-field">
              <label for="start-date">Period Start Date *</label>
              <p-datepicker
                id="start-date"
                [(ngModel)]="newPeriod.startDate"
                [maxDate]="today"
                dateFormat="M dd, yy"
                [showIcon]="true"
                [style]="{ width: '100%' }"
              ></p-datepicker>
            </div>
            <div class="form-field">
              <label for="end-date">Period End Date (optional)</label>
              <p-datepicker
                id="end-date"
                [(ngModel)]="newPeriod.endDate"
                [minDate]="newPeriod.startDate"
                [maxDate]="today"
                dateFormat="M dd, yy"
                [showIcon]="true"
                [style]="{ width: '100%' }"
                placeholder="Select date"
              ></p-datepicker>
            </div>
          </div>

          <!-- Flow Intensity -->
          <div class="form-field">
            <label>Flow Intensity</label>
            <div class="flow-options">
              @for (flow of flowIntensityOptions; track flow.value) {
                <div class="flow-option">
                  <p-radioButton
                    [value]="flow.value"
                    [(ngModel)]="newPeriod.flowIntensity"
                    [inputId]="'flow-' + flow.value"
                  ></p-radioButton>
                  <label [for]="'flow-' + flow.value">{{ flow.label }}</label>
                </div>
              }
            </div>
          </div>

          <!-- Symptoms -->
          <div class="form-field">
            <label>Symptoms (select all that apply)</label>
            <div class="symptoms-checkboxes">
              @for (symptom of symptomOptions; track symptom.value) {
                <div class="symptom-checkbox">
                  <p-checkbox
                    [value]="symptom.value"
                    [(ngModel)]="newPeriod.symptoms"
                    [inputId]="'log-symptom-' + symptom.value"
                  ></p-checkbox>
                  <label [for]="'log-symptom-' + symptom.value">{{
                    symptom.label
                  }}</label>
                </div>
              }
            </div>
          </div>

          <!-- Notes -->
          <div class="form-field">
            <label for="period-notes">Notes (optional)</label>
            <textarea
              pInputTextarea
              id="period-notes"
              [(ngModel)]="newPeriod.notes"
              rows="2"
              placeholder="Any additional notes..."
            ></textarea>
          </div>
        </div>

        <ng-template pTemplate="footer">
          <app-button variant="outlined" (clicked)="closeLogDialog()"
            >Cancel</app-button
          >
          <app-button
            iconLeft="pi-check"
            [loading]="isSavingPeriod()"
            [disabled]="!newPeriod.startDate"
            (clicked)="savePeriod()"
            >Save</app-button
          >
        </ng-template>
      </p-dialog>

      <!-- Delete Confirmation Dialog -->
      <p-dialog
        header="Delete All Cycle Data"
        [modal]="true"
        [visible]="showDeleteDialog()"
        (visibleChange)="showDeleteDialog.set($event)"
        [style]="{ width: '400px' }"
        [draggable]="false"
      >
        <div class="delete-warning">
          <i class="pi pi-exclamation-triangle"></i>
          <p>
            Are you sure you want to delete all your cycle tracking data? This
            action cannot be undone.
          </p>
        </div>

        <ng-template pTemplate="footer">
          <app-button variant="outlined" (clicked)="showDeleteDialog.set(false)"
            >Cancel</app-button
          >
          <app-button
            variant="danger"
            iconLeft="pi-trash"
            (clicked)="deleteAllData()"
            >Delete All Data</app-button
          >
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./cycle-tracking.component.scss",
})
export class CycleTrackingComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly messageService = inject(MessageService);

  // State
  readonly cycleStatus = signal<CycleStatus>({
    currentDay: 14,
    currentPhase: "Ovulation",
    nextPeriodDate: "2026-01-17",
    cycleLength: 28,
    cyclesTracked: 6,
  });
  readonly cycleHistory = signal<CycleEntry[]>([]);
  readonly baseAcwr = signal(1.15);
  readonly showLogDialog = signal(false);
  readonly showDeleteDialog = signal(false);
  readonly isSavingPeriod = signal(false);
  readonly isSavingSymptoms = signal(false);

  // Constants
  readonly cyclePhases = CYCLE_PHASES;
  readonly symptomOptions = SYMPTOM_OPTIONS;
  readonly flowIntensityOptions = FLOW_INTENSITY_OPTIONS;
  readonly severityOptions = SEVERITY_OPTIONS;
  readonly privacyOptions = PRIVACY_OPTIONS;
  readonly retentionOptions = RETENTION_OPTIONS;
  readonly today = new Date();

  // Form data
  newPeriod = this.getEmptyPeriodForm();
  todaySymptoms = { symptoms: [] as string[], severity: "none" };
  privacySettings = { visibility: "private", retention: "12" };

  // Computed values
  readonly adjustedAcwr = computed(() => {
    const phase = this.getCurrentPhase();
    const base = this.baseAcwr();
    const adjustment = (phase.intensityModifier - 100) / 100;
    return Math.round((base - base * adjustment * 0.1) * 100) / 100;
  });

  readonly averageCycleLength = computed(() => {
    const history = this.cycleHistory();
    if (history.length < 2) return 28;
    const lengths = history
      .filter((c): c is typeof c & { length: number } => c.length !== undefined)
      .map((c) => c.length);
    return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  });

  readonly cycleRegularity = computed(() => {
    const history = this.cycleHistory();
    if (history.length < 3) return "Insufficient data";
    const lengths = history
      .filter((c): c is typeof c & { length: number } => c.length !== undefined)
      .map((c) => c.length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance =
      lengths.reduce((sum, l) => sum + Math.abs(l - avg), 0) / lengths.length;
    if (variance <= 1) return "Very Regular (±1 day)";
    if (variance <= 3) return "Regular (±3 days)";
    return "Irregular";
  });

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await firstValueFrom(
        this.api.get("/api/cycle-tracking"),
      );
      if (response?.success && response.data) {
        if (response.data.status) {
          this.cycleStatus.set(response.data.status);
        }
        if (response.data.history) {
          this.cycleHistory.set(response.data.history);
        }
        if (response.data.acwr) {
          this.baseAcwr.set(response.data.acwr);
        }
      }
    } catch (err) {
      this.logger.error("Failed to load cycle tracking data", err);
      // No cycle data - user hasn't logged any cycles yet
      this.cycleHistory.set([]);
    }
  }

  getCurrentPhase(): CyclePhase {
    const day = this.cycleStatus().currentDay;
    return (
      CYCLE_PHASES.find((p) => day >= p.dayRange[0] && day <= p.dayRange[1]) ||
      CYCLE_PHASES[0]
    );
  }

  getAcwrSweetSpot(): { min: number; max: number } {
    const phase = this.getCurrentPhase().name.toLowerCase().replace(" ", "_");
    const sweetSpots: Record<string, { min: number; max: number }> = {
      menstrual: { min: 0.6, max: 1.0 },
      follicular: { min: 0.8, max: 1.3 },
      ovulation: { min: 0.9, max: 1.5 },
      luteal_early: { min: 0.75, max: 1.2 },
      "luteal early": { min: 0.75, max: 1.2 },
      luteal_late: { min: 0.65, max: 1.1 },
      "luteal late": { min: 0.65, max: 1.1 },
    };
    return sweetSpots[phase] || { min: 0.8, max: 1.3 };
  }

  getAcwrStatus(): {
    severity: "success" | "warn" | "error" | "info";
    message: string;
  } {
    const adjusted = this.adjustedAcwr();
    const sweetSpot = this.getAcwrSweetSpot();

    if (adjusted >= sweetSpot.min && adjusted <= sweetSpot.max) {
      return {
        severity: "success",
        message:
          "You're in the optimal zone! Good to train at recommended intensity.",
      };
    } else if (adjusted < sweetSpot.min) {
      return {
        severity: "info",
        message: "You can increase training load if you feel ready.",
      };
    } else {
      return {
        severity: "warn",
        message: "Consider reducing intensity during this phase.",
      };
    }
  }

  getNutritionTip(): string {
    const phase = this.getCurrentPhase().name;
    const tips: Record<string, string> = {
      Menstrual:
        "Focus on iron-rich foods like lean red meat, spinach, and beans to replace losses.",
      Follicular:
        "Your body uses carbs efficiently now - fuel your workouts with quality starches.",
      Ovulation:
        "Support peak performance with quality protein and anti-inflammatory foods.",
      "Luteal Early":
        "Metabolism is increasing - honor your hunger with nutrient-dense meals.",
      "Luteal Late":
        "Cravings are normal! Choose dark chocolate and magnesium-rich snacks.",
    };
    return tips[phase] || "Stay hydrated and eat balanced meals.";
  }

  openLogDialog(): void {
    this.newPeriod = this.getEmptyPeriodForm();
    this.showLogDialog.set(true);
  }

  closeLogDialog(): void {
    this.showLogDialog.set(false);
  }

  async savePeriod(): Promise<void> {
    if (!this.newPeriod.startDate) return;

    this.isSavingPeriod.set(true);

    try {
      await firstValueFrom(
        this.api.post("/api/cycle-tracking/period", this.newPeriod),
      );

      // Add to local history
      const newEntry: CycleEntry = {
        id: Date.now().toString(),
        startDate: this.newPeriod.startDate.toISOString().split("T")[0],
        endDate: this.newPeriod.endDate?.toISOString().split("T")[0],
        flowIntensity: this.newPeriod.flowIntensity,
        symptoms: this.newPeriod.symptoms,
        notes: this.newPeriod.notes,
      };
      this.cycleHistory.update((history) => [newEntry, ...history]);

      // Update cycle status
      this.cycleStatus.update((status) => ({
        ...status,
        currentDay: 1,
        currentPhase: "Menstrual",
      }));

      this.closeLogDialog();

      this.messageService.add({
        severity: "success",
        summary: "Period Logged",
        detail: "Your cycle has been updated.",
        life: 3000,
      });
    } catch (err) {
      this.logger.error("Failed to save period", err);
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to save period. Please try again.",
      });
    } finally {
      this.isSavingPeriod.set(false);
    }
  }

  async saveSymptoms(): Promise<void> {
    this.isSavingSymptoms.set(true);

    try {
      await firstValueFrom(
        this.api.post("/api/cycle-tracking/symptoms", {
          date: new Date().toISOString().split("T")[0],
          ...this.todaySymptoms,
        }),
      );

      this.messageService.add({
        severity: "success",
        summary: "Symptoms Logged",
        detail: "Your symptoms have been recorded.",
        life: 3000,
      });

      // Reset form
      this.todaySymptoms = { symptoms: [], severity: "none" };
    } catch (err) {
      this.logger.error("Failed to save symptoms", err);
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to save symptoms. Please try again.",
      });
    } finally {
      this.isSavingSymptoms.set(false);
    }
  }

  exportData(): void {
    this.messageService.add({
      severity: "info",
      summary: "Export Started",
      detail: "Your data will be downloaded shortly.",
      life: 3000,
    });
    // TODO: Implement actual export
  }

  confirmDeleteData(): void {
    this.showDeleteDialog.set(true);
  }

  async deleteAllData(): Promise<void> {
    try {
      await firstValueFrom(this.api.delete("/api/cycle-tracking/all"));

      this.cycleHistory.set([]);
      this.showDeleteDialog.set(false);

      this.messageService.add({
        severity: "success",
        summary: "Data Deleted",
        detail: "All your cycle tracking data has been deleted.",
        life: 3000,
      });
    } catch (err) {
      this.logger.error("Failed to delete data", err);
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to delete data. Please try again.",
      });
    }
  }

  // Helper methods
  formatFlow(flow: string): string {
    return flow.charAt(0).toUpperCase() + flow.slice(1);
  }

  getFlowSeverity(
    flow: string,
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    const severities: Record<string, "success" | "warn" | "danger"> = {
      light: "success",
      moderate: "warn",
      heavy: "danger",
    };
    return severities[flow] || "info";
  }

  formatSymptoms(symptoms: string[]): string {
    if (!symptoms || symptoms.length === 0) return "None";
    return symptoms
      .map((s) =>
        s
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      )
      .join(", ");
  }

  getMonthName(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "long" });
  }

  private getEmptyPeriodForm() {
    return {
      startDate: new Date() as Date | null,
      endDate: null as Date | null,
      flowIntensity: "moderate",
      symptoms: [] as string[],
      notes: "",
    };
  }
}
