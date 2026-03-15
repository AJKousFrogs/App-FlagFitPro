import { Injectable, inject, signal, computed } from "@angular/core";
import type { OnboardingStep } from "../models/onboarding.model";
import {
  createDefaultOnboardingFormData,
  type OnboardingFormData,
} from "../models/onboarding.model";
import {
  PLAYER_STEPS,
  STAFF_STEPS,
  POSITIONS,
  STAFF_ROLE_OPTIONS,
  GENDER_OPTIONS,
  THROWING_ARM_OPTIONS,
  EXPERIENCE_LEVELS,
  SCHEDULE_TYPES,
  MOBILITY_TIME_OPTIONS,
  FOAM_ROLLING_OPTIONS,
  REST_DAY_OPTIONS,
} from "../constants/onboarding-options";
import { LoggerService } from "../../../core/services/logger.service";
import { PlatformService } from "../../../core/services/platform.service";
import { OnboardingDataService } from "./onboarding-data.service";

const STORAGE_KEY = "flagfit_onboarding_draft";

const FALLBACK_TEAMS = [
  { label: "Ljubljana Frogs - International", value: "ljubljana_frogs_international" },
  { label: "Ljubljana Frogs - Domestic", value: "ljubljana_frogs_domestic" },
  { label: "American Samoa National Team - Men", value: "american_samoa_men" },
  { label: "American Samoa National Team - Women", value: "american_samoa_women" },
];

@Injectable({
  providedIn: "root",
})
export class OnboardingStateService {
  private readonly logger = inject(LoggerService);
  private readonly platform = inject(PlatformService);
  private readonly onboardingDataService = inject(OnboardingDataService);

  /** Form data - mutable object shared across components */
  readonly formData: OnboardingFormData = createDefaultOnboardingFormData();

  /** Current step index */
  readonly currentStep = signal(0);

  /** Step definitions - player has 9 steps, staff has 3 */
  readonly steps = signal<OnboardingStep[]>([...PLAYER_STEPS]);

  readonly lastSaved = signal<Date | null>(null);
  readonly isSaving = signal(false);

  readonly teams = signal<Array<{ label: string; value: string }>>(FALLBACK_TEAMS);
  readonly teamSuggestions = signal<Array<{ label: string; value: string }>>(FALLBACK_TEAMS);

  /** Computed progress percentage */
  readonly progress = computed(() => {
    const completed = this.steps().filter((s) => s.completed).length;
    return Math.round((completed / this.steps().length) * 100);
  });

  /** Computed age from DOB */
  readonly calculatedAge = computed(() => {
    if (!this.formData.dateOfBirth) return null;
    const today = new Date();
    const birth = new Date(this.formData.dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  });

  isPlayer(): boolean {
    return this.formData.userType === "player";
  }

  isStaff(): boolean {
    return this.formData.userType === "staff";
  }

  isQBSelected(): boolean {
    return (
      this.formData.position === "QB" ||
      this.formData.secondaryPosition === "QB"
    );
  }

  getAgeGroup(): string {
    const age = this.calculatedAge();
    if (!age) return "Unknown";
    if (age < 18) return "Youth";
    if (age < 35) return "Adult";
    if (age < 50) return "Masters";
    return "Senior";
  }

  getTeamLabel(value: string | { label: string; value: string } | null): string {
    if (!value) return "Not selected";

    if (typeof value === 'object' && value.label) {
      return value.label;
    }

    const teamValue = typeof value === 'string' ? value : value.value;
    const team = this.teams().find((t) => t.value === teamValue);
    return team ? team.label : String(teamValue);
  }

  getPositionLabel(value: string | null): string {
    return POSITIONS.find((p) => p.value === value)?.label || "Not selected";
  }

  getStaffRoleLabel(value: string | null): string {
    return STAFF_ROLE_OPTIONS.find((r) => r.value === value)?.label || "Not selected";
  }

  getGenderLabel(value: string | null): string {
    return GENDER_OPTIONS.find((g) => g.value === value)?.label || value || "Not selected";
  }

  getThrowingArmLabel(value: string | null): string {
    return THROWING_ARM_OPTIONS.find((a) => a.value === value)?.label || "Not selected";
  }

  getExperienceLabel(value: string | null): string {
    return EXPERIENCE_LEVELS.find((e) => e.value === value)?.label || "Not selected";
  }

  getScheduleLabel(value: string | null): string {
    return SCHEDULE_TYPES.find((s) => s.value === value)?.label || "Not selected";
  }

  getMobilityLabel(value: string): string {
    return MOBILITY_TIME_OPTIONS.find((o) => o.value === value)?.label || value;
  }

  getFoamRollingLabel(value: string): string {
    return FOAM_ROLLING_OPTIONS.find((o) => o.value === value)?.label || value;
  }

  getRestDayOptionLabel(value: string): string {
    return REST_DAY_OPTIONS.find((o) => o.value === value)?.label || value;
  }

  getHeightDisplay(): string {
    if (this.formData.unitSystem === "metric") {
      return this.formData.heightCm ? `${this.formData.heightCm} cm` : "?";
    }
    if (this.formData.heightFt || this.formData.heightIn) {
      return `${this.formData.heightFt || 0}'${this.formData.heightIn || 0}"`;
    }
    return "?";
  }

  getWeightDisplay(): string {
    if (this.formData.unitSystem === "metric") {
      return this.formData.weightKg ? `${this.formData.weightKg} kg` : "?";
    }
    return this.formData.weightLbs ? `${this.formData.weightLbs} lbs` : "?";
  }

  selectUserType(type: "player" | "staff"): void {
    const previousType = this.formData.userType;
    this.formData.userType = type;

    if (type === "player") {
      this.formData.staffRole = null;
      this.formData.staffVisibility = [];
    }
    if (type === "staff") {
      this.formData.staffVisibility = ["roster", "chat"];
    }

    if (previousType !== type) {
      this.updateStepsForUserType(type);
    }
  }

  updateStepsForUserType(userType: "player" | "staff"): void {
    if (userType === "staff") {
      const currentPersonalCompleted = this.steps()[0]?.completed || false;
      const copy = STAFF_STEPS.map((s) => ({ ...s }));
      copy[0].completed = currentPersonalCompleted;
      copy[1].completed = false;
      copy[2].completed = false;
      this.steps.set(copy);
    } else {
      const currentPersonalCompleted = this.steps()[0]?.completed || false;
      const copy = PLAYER_STEPS.map((s) => ({ ...s }));
      copy[0].completed = currentPersonalCompleted;
      for (let i = 1; i < copy.length; i++) {
        copy[i].completed = false;
      }
      this.steps.set(copy);
    }
  }

  toggleStaffVisibility(option: string): void {
    const index = this.formData.staffVisibility.indexOf(option);
    if (index > -1) {
      this.formData.staffVisibility.splice(index, 1);
    } else {
      this.formData.staffVisibility.push(option);
    }
  }

  toggleGoal(goalId: string): void {
    const index = this.formData.goals.indexOf(goalId);
    if (index > -1) {
      this.formData.goals.splice(index, 1);
    } else {
      this.formData.goals.push(goalId);
    }
  }

  togglePracticeDay(day: string): void {
    const index = this.formData.practiceDays.indexOf(day);
    if (index > -1) {
      this.formData.practiceDays.splice(index, 1);
    } else {
      this.formData.practiceDays.push(day);
    }
  }

  toggleEquipment(equipment: string): void {
    const index = this.formData.equipmentAvailable.indexOf(equipment);
    if (index > -1) {
      this.formData.equipmentAvailable.splice(index, 1);
    } else {
      if (equipment === "none") {
        this.formData.equipmentAvailable = ["none"];
      } else {
        this.formData.equipmentAvailable = this.formData.equipmentAvailable.filter(
          (e) => e !== "none",
        );
        this.formData.equipmentAvailable.push(equipment);
      }
    }
  }

  toggleInjuryHistory(value: string): void {
    const index = this.formData.injuryHistory.indexOf(value);
    if (index > -1) {
      this.formData.injuryHistory.splice(index, 1);
    } else {
      if (value === "none") {
        this.formData.injuryHistory = ["none"];
      } else {
        const noneIdx = this.formData.injuryHistory.indexOf("none");
        if (noneIdx > -1) this.formData.injuryHistory.splice(noneIdx, 1);
        this.formData.injuryHistory.push(value);
      }
    }
  }

  saveDraft(): void {
    try {
      this.isSaving.set(true);
      const draft = {
        currentStep: this.currentStep(),
        data: this.formData,
        savedAt: new Date().toISOString(),
      };
      this.platform.setLocalStorage(STORAGE_KEY, JSON.stringify(draft));
      this.lastSaved.set(new Date());
      this.isSaving.set(false);
    } catch (error) {
      this.logger.error("[OnboardingState] Failed to save draft:", error);
      this.isSaving.set(false);
    }
  }

  loadDraft(): boolean {
    try {
      const saved = this.platform.getLocalStorage(STORAGE_KEY);
      if (!saved) return false;

      const draft = JSON.parse(saved);
      Object.assign(this.formData, draft.data);

      if (draft.currentStep !== undefined) {
        this.currentStep.set(draft.currentStep);
        const stepList = this.steps().map((s) => ({ ...s }));
        for (let i = 0; i < draft.currentStep; i++) {
          stepList[i].completed = true;
        }
        this.steps.set(stepList);
      }

      if (this.formData.dateOfBirth) {
        this.formData.dateOfBirth = new Date(this.formData.dateOfBirth);
      }

      if (draft.savedAt) {
        this.lastSaved.set(new Date(draft.savedAt));
      }

      return true;
    } catch (error) {
      this.logger.error("[OnboardingState] Failed to load draft:", error);
      return false;
    }
  }

  clearDraft(): void {
    this.platform.removeLocalStorage(STORAGE_KEY);
  }

  nextStep(): void {
    const steps = this.steps().map((s) => ({ ...s }));
    if (this.currentStep() >= steps.length - 1) return;
    steps[this.currentStep()].completed = true;
    this.steps.set(steps);
    this.currentStep.update((n) => n + 1);
    this.saveDraft();
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update((n) => n - 1);
      this.saveDraft();
    }
  }

  goToStep(targetIndex: number | undefined): boolean {
    if (targetIndex === undefined) return false;
    const current = this.currentStep();
    if (targetIndex <= current + 1) {
      this.currentStep.set(targetIndex);
      this.saveDraft();
      return true;
    }
    return false;
  }

  async loadTeams(): Promise<void> {
    try {
      const { teams: teamsData, error } =
        await this.onboardingDataService.fetchApprovedTeams();

      if (!error && teamsData && teamsData.length > 0) {
        const teamOptions = teamsData.map((team) => ({
          label: team.name,
          value: team.id,
        }));
        this.teams.set(teamOptions);
        this.teamSuggestions.set(teamOptions);
      } else {
        this.teamSuggestions.set(this.teams());
      }
    } catch (error) {
      this.logger.warn("[OnboardingState] Failed to load teams:", error);
      this.teamSuggestions.set(this.teams());
    }
  }

  searchTeams(query: string): void {
    const q = query.toLowerCase();
    const all = this.teams();
    if (!q) {
      this.teamSuggestions.set(all);
      return;
    }
    const filtered = all.filter((t) => t.label.toLowerCase().includes(q));
    this.teamSuggestions.set(filtered);
  }

  onTeamSelect(value: string | { value: string; label?: string } | null): void {
    if (!value) return;
    if (typeof value === "string") {
      this.formData.team = value;
    } else if (typeof value === "object" && "value" in value) {
      this.formData.team = typeof value.value === "string" ? value.value : String(value.value);
    }
  }
}
