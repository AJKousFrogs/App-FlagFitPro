/**
 * Shared models for onboarding flow
 */
export interface OnboardingStep {
  label: string;
  icon: string;
  completed: boolean;
}

export interface InjuryEntry {
  area: string;
  severity: "minor" | "moderate" | "severe";
  notes: string;
}

export interface OnboardingFormData {
  name: string;
  dateOfBirth: Date | null;
  gender: string | null;
  country: string | null;
  phone: string;
  profilePhotoUrl: string | null;
  userType: "player" | "staff";
  staffRole: string | null;
  staffVisibility: string[];
  jerseyNumber: number | null;
  team: string | null;
  position: string | null;
  secondaryPosition: string | null;
  throwingArm: string | null;
  experience: string | null;
  unitSystem: "metric" | "imperial";
  heightCm: number | null;
  weightKg: number | null;
  heightFt: number | null;
  heightIn: number | null;
  weightLbs: number | null;
  currentInjuries: InjuryEntry[];
  injuryHistory: string[];
  medicalNotes: string;
  equipmentAvailable: string[];
  goals: string[];
  scheduleType: string | null;
  practicesPerWeek: number | null;
  practiceDays: string[];
  morningMobility: string;
  eveningMobility: string;
  foamRollingTime: string;
  restDayPreference: string;
  enableReminders: boolean;
  reminderTime: string;
  notificationPreferences: string[];
  consentTermsOfService: boolean;
  consentPrivacyPolicy: boolean;
  consentDataUsage: boolean;
  consentAICoach: boolean;
  consentEmailUpdates: boolean;
}

export function createDefaultOnboardingFormData(): OnboardingFormData {
  return {
    name: "",
    dateOfBirth: null,
    gender: null,
    country: null,
    phone: "",
    profilePhotoUrl: null,
    userType: "player",
    staffRole: null,
    staffVisibility: [],
    jerseyNumber: null,
    team: null,
    position: null,
    secondaryPosition: null,
    throwingArm: null,
    experience: null,
    unitSystem: "metric",
    heightCm: null,
    weightKg: null,
    heightFt: null,
    heightIn: null,
    weightLbs: null,
    currentInjuries: [],
    injuryHistory: [],
    medicalNotes: "",
    equipmentAvailable: [],
    goals: [],
    scheduleType: null,
    practicesPerWeek: null,
    practiceDays: [],
    morningMobility: "daily",
    eveningMobility: "daily",
    foamRollingTime: "after_practice",
    restDayPreference: "full",
    enableReminders: true,
    reminderTime: "08:00",
    notificationPreferences: ["training", "recovery"],
    consentTermsOfService: false,
    consentPrivacyPolicy: false,
    consentDataUsage: false,
    consentAICoach: false,
    consentEmailUpdates: false,
  };
}
