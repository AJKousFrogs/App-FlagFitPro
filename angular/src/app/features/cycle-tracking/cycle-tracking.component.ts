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
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { ToastService } from "../../core/services/toast.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { Card } from "primeng/card";
import { DatePicker } from "primeng/datepicker";
import { Dialog } from "primeng/dialog";
import { Message } from "primeng/message";

import { Select } from "primeng/select";
import { TableModule } from "primeng/table";
import { Textarea } from "primeng/textarea";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { firstValueFrom } from "rxjs";

import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { ApiResponse } from "../../core/models/common.models";
import { DIALOG_WIDTHS } from "../../core/utils/design-tokens.util";
import { DesignTokens } from "../../shared/models/design-tokens";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    Card,
    DatePicker,
    Dialog,
    
    Message,
    Select,
    TableModule,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    StatusTagComponent,
    EmptyStateComponent,
  ],
  templateUrl: "./cycle-tracking.component.html",
  styleUrl: "./cycle-tracking.component.scss",
})
export class CycleTrackingComponent implements OnInit {
  readonly dialogBreakpoints = {
    [DesignTokens.breakpoints.mobile]: DIALOG_WIDTHS.full,
  };
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // State
  readonly cycleStatus = signal<CycleStatus>({
    currentDay: 14,
    currentPhase: "Ovulation",
    nextPeriodDate: "2026-01-17",
    cycleLength: 28,
    cyclesTracked: 6,
  });
  readonly cycleHistory = signal<CycleEntry[]>([]);
  readonly baseAcwr = signal<number | null>(null); // No default - must load from API
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
  readonly adjustedAcwr = computed<number | null>(() => {
    const phase = this.getCurrentPhase();
    const base = this.baseAcwr();
    // CRITICAL: Only calculate if we have real ACWR data
    if (base === null) {
      return null; // No calculations without real data
    }
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
      const response: ApiResponse<{
        status?: CycleStatus;
        history?: CycleEntry[];
        acwr?: number;
      }> = await firstValueFrom(
        this.api.get(API_ENDPOINTS.cycleTracking.base),
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
      // CRITICAL: Do NOT set default ACWR - calculations require real data
      this.baseAcwr.set(null);
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
    // CRITICAL: No status without real ACWR data
    if (adjusted === null) {
      return {
        severity: "info",
        message:
          "ACWR data not available. Log training sessions to see phase-adjusted recommendations.",
      };
    }

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

  onTodaySymptomsChange(value: string[] | null): void {
    this.todaySymptoms = { ...this.todaySymptoms, symptoms: value ?? [] };
  }

  onTodaySymptomToggle(value: string, checked: boolean): void {
    if (checked) {
      if (this.todaySymptoms.symptoms.includes(value)) return;
      this.todaySymptoms = {
        ...this.todaySymptoms,
        symptoms: [...this.todaySymptoms.symptoms, value],
      };
      return;
    }
    this.todaySymptoms = {
      ...this.todaySymptoms,
      symptoms: this.todaySymptoms.symptoms.filter((s) => s !== value),
    };
  }

  onTodaySeverityChange(value: string): void {
    this.todaySymptoms = { ...this.todaySymptoms, severity: value };
  }

  onPrivacyVisibilityChange(value: string): void {
    this.privacySettings = { ...this.privacySettings, visibility: value };
  }

  onPrivacyRetentionChange(value: string | null): void {
    this.privacySettings = {
      ...this.privacySettings,
      retention: value ?? this.privacySettings.retention,
    };
  }

  onNewPeriodStartDateChange(value: Date | null): void {
    this.newPeriod = { ...this.newPeriod, startDate: value };
  }

  onNewPeriodEndDateChange(value: Date | null): void {
    this.newPeriod = { ...this.newPeriod, endDate: value };
  }

  onNewPeriodFlowIntensityChange(value: string): void {
    this.newPeriod = { ...this.newPeriod, flowIntensity: value };
  }

  onNewPeriodSymptomsChange(value: string[] | null): void {
    this.newPeriod = { ...this.newPeriod, symptoms: value ?? [] };
  }

  onNewPeriodSymptomToggle(value: string, checked: boolean): void {
    if (checked) {
      if (this.newPeriod.symptoms.includes(value)) return;
      this.newPeriod = {
        ...this.newPeriod,
        symptoms: [...this.newPeriod.symptoms, value],
      };
      return;
    }
    this.newPeriod = {
      ...this.newPeriod,
      symptoms: this.newPeriod.symptoms.filter((s) => s !== value),
    };
  }

  onNewPeriodNotesChange(value: string): void {
    this.newPeriod = { ...this.newPeriod, notes: value };
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
        this.api.post(API_ENDPOINTS.cycleTracking.period, this.newPeriod),
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

      this.toastService.success("Your cycle has been updated.", "Period Logged");
    } catch (err) {
      this.logger.error("Failed to save period", err);
      this.toastService.error("Failed to save period. Please try again.");
    } finally {
      this.isSavingPeriod.set(false);
    }
  }

  async saveSymptoms(): Promise<void> {
    this.isSavingSymptoms.set(true);

    try {
      await firstValueFrom(
        this.api.post(API_ENDPOINTS.cycleTracking.symptoms, {
          date: new Date().toISOString().split("T")[0],
          ...this.todaySymptoms,
        }),
      );

      this.toastService.success("Your symptoms have been recorded.", "Symptoms Logged");

      // Reset form
      this.todaySymptoms = { symptoms: [], severity: "none" };
    } catch (err) {
      this.logger.error("Failed to save symptoms", err);
      this.toastService.error("Failed to save symptoms. Please try again.");
    } finally {
      this.isSavingSymptoms.set(false);
    }
  }

  exportData(): void {
    const history = this.cycleHistory();
    if (history.length === 0) {
      this.toastService.info("You have no cycle data to export.", "No Data");
      return;
    }
    const headers = ["Start Date", "End Date", "Length (days)"];
    const rows = history.map((e) => [
      e.startDate,
      e.endDate ?? "",
      String(e.length ?? ""),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cycle-tracking-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toastService.success("Your cycle data has been downloaded.", "Export Complete");
  }

  confirmDeleteData(): void {
    this.showDeleteDialog.set(true);
  }

  async deleteAllData(): Promise<void> {
    try {
      await firstValueFrom(this.api.delete(API_ENDPOINTS.cycleTracking.clearAll));

      this.cycleHistory.set([]);
      this.showDeleteDialog.set(false);

      this.toastService.success("All your cycle tracking data has been deleted.", "Data Deleted");
    } catch (err) {
      this.logger.error("Failed to delete data", err);
      this.toastService.error("Failed to delete data. Please try again.");
    }
  }

  // Helper methods
  formatFlow(flow: string): string {
    return flow.charAt(0).toUpperCase() + flow.slice(1);
  }

  getFlowSeverity(
    flow: string,
  ): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
    const severities: Record<string, "success" | "warning" | "danger"> = {
      light: "success",
      moderate: "warning",
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

  getInputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return "";
  }

  isChecked(event: Event): boolean {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      return target.checked;
    }
    return false;
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
