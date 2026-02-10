export interface TrainingLoadEntry {
  date: string; // YYYY-MM-DD
  rpe: number;
  durationMinutes: number;
  sessionType?: string;
}

export interface WeightEntryFixture {
  date: string; // YYYY-MM-DD
  weight: number;
  bodyFatPercentage?: number;
}

export interface WellnessEntryFixture {
  date: string; // YYYY-MM-DD
  sleep?: number | null;
  energy?: number | null;
  stress?: number | null;
  soreness?: number | null;
  motivation?: number | null;
  mood?: number | null;
  hydration?: number | null;
}

export interface AthleteFixture {
  id: string;
  name: string;
  trainingLoads: TrainingLoadEntry[];
  weights: WeightEntryFixture[];
  wellness: WellnessEntryFixture[];
}

const toDateString = (baseDate: string, offsetDays: number): string => {
  const base = new Date(`${baseDate}T12:00:00Z`);
  base.setDate(base.getDate() + offsetDays);
  return base.toISOString().split("T")[0];
};

const buildTrainingLoads = (
  baseDate: string,
  loads: Array<{ rpe: number; durationMinutes: number }>,
): TrainingLoadEntry[] =>
  loads.map((entry, index) => ({
    date: toDateString(baseDate, index),
    rpe: entry.rpe,
    durationMinutes: entry.durationMinutes,
    sessionType: "training",
  }));

const buildWeights = (
  baseDate: string,
  weights: number[],
): WeightEntryFixture[] =>
  weights.map((weight, index) => ({
    date: toDateString(baseDate, index),
    weight,
  }));

const buildWellness = (
  baseDate: string,
  entries: Omit<WellnessEntryFixture, "date">[],
): WellnessEntryFixture[] =>
  entries.map((entry, index) => ({
    ...entry,
    date: toDateString(baseDate, index),
  }));

// Fixture A — Normal Athlete (stable loads, minor variation)
const NORMAL_TRAINING_LOADS = buildTrainingLoads("2026-01-01", [
  { rpe: 5, durationMinutes: 60 },
  { rpe: 5, durationMinutes: 65 },
  { rpe: 6, durationMinutes: 55 },
  { rpe: 5, durationMinutes: 60 },
  { rpe: 6, durationMinutes: 60 },
  { rpe: 5, durationMinutes: 70 },
  { rpe: 5, durationMinutes: 60 },
  { rpe: 6, durationMinutes: 60 },
  { rpe: 5, durationMinutes: 65 },
  { rpe: 5, durationMinutes: 60 },
  { rpe: 6, durationMinutes: 55 },
  { rpe: 5, durationMinutes: 60 },
  { rpe: 6, durationMinutes: 60 },
  { rpe: 5, durationMinutes: 65 },
  { rpe: 5, durationMinutes: 60 },
  { rpe: 6, durationMinutes: 60 },
  { rpe: 5, durationMinutes: 60 },
  { rpe: 5, durationMinutes: 70 },
  { rpe: 6, durationMinutes: 55 },
  { rpe: 5, durationMinutes: 60 },
  { rpe: 5, durationMinutes: 60 },
  { rpe: 6, durationMinutes: 60 },
  { rpe: 5, durationMinutes: 65 },
  { rpe: 5, durationMinutes: 60 },
  { rpe: 6, durationMinutes: 60 },
  { rpe: 5, durationMinutes: 55 },
  { rpe: 5, durationMinutes: 60 },
  { rpe: 6, durationMinutes: 60 },
]);

const NORMAL_WEIGHTS = buildWeights("2026-01-15", [
  80.0, 80.1, 80.0, 80.2, 80.1, 80.2, 80.1,
  80.2, 80.3, 80.2, 80.3, 80.4, 80.3, 80.4,
]);

const NORMAL_WELLNESS = buildWellness("2026-01-15", [
  { sleep: 8, energy: 7, stress: 3, soreness: 3, mood: 7, hydration: 8 },
  { sleep: 7, energy: 7, stress: 4, soreness: 4, mood: 7, hydration: 7 },
  { sleep: 8, energy: 8, stress: 3, soreness: 3, mood: 8, hydration: 8 },
  { sleep: 7, energy: 6, stress: 5, soreness: 4, mood: 6, hydration: 7 },
  { sleep: 8, energy: 7, stress: 3, soreness: 3, mood: 7, hydration: 8 },
  { sleep: 7, energy: 7, stress: 4, soreness: 4, mood: 7, hydration: 7 },
  { sleep: 8, energy: 8, stress: 3, soreness: 3, mood: 8, hydration: 8 },
  { sleep: 7, energy: 6, stress: 5, soreness: 4, mood: 6, hydration: 7 },
  { sleep: 8, energy: 7, stress: 3, soreness: 3, mood: 7, hydration: 8 },
  { sleep: 7, energy: 7, stress: 4, soreness: 4, mood: 7, hydration: 7 },
  { sleep: 8, energy: 8, stress: 3, soreness: 3, mood: 8, hydration: 8 },
  { sleep: 7, energy: 6, stress: 5, soreness: 4, mood: 6, hydration: 7 },
  { sleep: 8, energy: 7, stress: 3, soreness: 3, mood: 7, hydration: 8 },
  { sleep: 7, energy: 7, stress: 4, soreness: 4, mood: 7, hydration: 7 },
]);

// Fixture B — Spike Athlete (sudden acute spike)
const SPIKE_TRAINING_LOADS = buildTrainingLoads("2026-01-01", [
  ...Array.from({ length: 21 }, () => ({ rpe: 5, durationMinutes: 60 })), // 300
  ...Array.from({ length: 7 }, () => ({ rpe: 8, durationMinutes: 75 })), // 600
]);

const SPIKE_WEIGHTS = buildWeights("2026-01-15", [
  82.0, 82.1, 82.0, 82.2, 82.1, 82.3, 82.2,
  82.4, 82.6, 82.7, 82.8, 82.9, 83.0, 83.1,
]);

const SPIKE_WELLNESS = buildWellness("2026-01-15", [
  { sleep: 7, energy: 6, stress: 5, soreness: 5, mood: 6, hydration: 7 },
  { sleep: 6, energy: 5, stress: 6, soreness: 6, mood: 5, hydration: 6 },
  { sleep: 6, energy: 5, stress: 6, soreness: 6, mood: 5, hydration: 6 },
  { sleep: 7, energy: 6, stress: 5, soreness: 5, mood: 6, hydration: 7 },
  { sleep: 6, energy: 5, stress: 6, soreness: 6, mood: 5, hydration: 6 },
  { sleep: 6, energy: 5, stress: 6, soreness: 6, mood: 5, hydration: 6 },
  { sleep: 7, energy: 6, stress: 5, soreness: 5, mood: 6, hydration: 7 },
  { sleep: 6, energy: 5, stress: 6, soreness: 6, mood: 5, hydration: 6 },
  { sleep: 6, energy: 5, stress: 6, soreness: 6, mood: 5, hydration: 6 },
  { sleep: 7, energy: 6, stress: 5, soreness: 5, mood: 6, hydration: 7 },
  { sleep: 6, energy: 5, stress: 6, soreness: 6, mood: 5, hydration: 6 },
  { sleep: 6, energy: 5, stress: 6, soreness: 6, mood: 5, hydration: 6 },
  { sleep: 7, energy: 6, stress: 5, soreness: 5, mood: 6, hydration: 7 },
  { sleep: 6, energy: 5, stress: 6, soreness: 6, mood: 5, hydration: 6 },
]);

// Fixture C — Recovery Athlete (load drops near zero)
const RECOVERY_TRAINING_LOADS = buildTrainingLoads("2026-01-01", [
  ...Array.from({ length: 14 }, () => ({ rpe: 5, durationMinutes: 60 })), // 300
  ...Array.from({ length: 14 }, () => ({ rpe: 2, durationMinutes: 25 })), // 50
]);

const RECOVERY_WEIGHTS = buildWeights("2026-01-15", [
  78.5, 78.4, 78.4, 78.3, 78.3, 78.2, 78.2,
  78.2, 78.1, 78.1, 78.1, 78.0, 78.0, 78.0,
]);

const RECOVERY_WELLNESS = buildWellness("2026-01-15", [
  { sleep: 8, energy: 7, stress: 3, soreness: 4, mood: 7, hydration: 8 },
  { sleep: 8, energy: 7, stress: 3, soreness: 4, mood: 7, hydration: 8 },
  { sleep: 9, energy: 8, stress: 2, soreness: 3, mood: 8, hydration: 9 },
  { sleep: 9, energy: 8, stress: 2, soreness: 3, mood: 8, hydration: 9 },
  { sleep: 8, energy: 7, stress: 3, soreness: 4, mood: 7, hydration: 8 },
  { sleep: 8, energy: 7, stress: 3, soreness: 4, mood: 7, hydration: 8 },
  { sleep: 9, energy: 8, stress: 2, soreness: 3, mood: 8, hydration: 9 },
  { sleep: 9, energy: 8, stress: 2, soreness: 3, mood: 8, hydration: 9 },
  { sleep: 8, energy: 7, stress: 3, soreness: 4, mood: 7, hydration: 8 },
  { sleep: 8, energy: 7, stress: 3, soreness: 4, mood: 7, hydration: 8 },
  { sleep: 9, energy: 8, stress: 2, soreness: 3, mood: 8, hydration: 9 },
  { sleep: 9, energy: 8, stress: 2, soreness: 3, mood: 8, hydration: 9 },
  { sleep: 8, energy: 7, stress: 3, soreness: 4, mood: 7, hydration: 8 },
  { sleep: 8, energy: 7, stress: 3, soreness: 4, mood: 7, hydration: 8 },
]);

// Fixture D — Incomplete Data Athlete (missing days and null wellness)
const INCOMPLETE_TRAINING_LOADS = buildTrainingLoads("2026-01-01", [
  { rpe: 6, durationMinutes: 60 },
  { rpe: 5, durationMinutes: 45 },
  { rpe: 7, durationMinutes: 50 },
  { rpe: 4, durationMinutes: 40 },
  { rpe: 6, durationMinutes: 55 },
]);

const INCOMPLETE_WEIGHTS = buildWeights("2026-01-15", [81.0, 80.7, 80.9, 80.8]);

const INCOMPLETE_WELLNESS = buildWellness("2026-01-15", [
  { sleep: 7, energy: null, stress: null, soreness: 4, mood: 6 },
  { sleep: null, energy: 6, stress: 5, soreness: null, mood: 6 },
  { sleep: 8, energy: 7, stress: null, soreness: 3, mood: null },
  { sleep: null, energy: null, stress: null, soreness: null, mood: null },
]);

export const NORMAL_ATHLETE: AthleteFixture = {
  id: "fixture-normal",
  name: "Normal Athlete",
  trainingLoads: NORMAL_TRAINING_LOADS,
  weights: NORMAL_WEIGHTS,
  wellness: NORMAL_WELLNESS,
};

export const SPIKE_ATHLETE: AthleteFixture = {
  id: "fixture-spike",
  name: "Spike Athlete",
  trainingLoads: SPIKE_TRAINING_LOADS,
  weights: SPIKE_WEIGHTS,
  wellness: SPIKE_WELLNESS,
};

export const RECOVERY_ATHLETE: AthleteFixture = {
  id: "fixture-recovery",
  name: "Recovery Athlete",
  trainingLoads: RECOVERY_TRAINING_LOADS,
  weights: RECOVERY_WEIGHTS,
  wellness: RECOVERY_WELLNESS,
};

export const INCOMPLETE_ATHLETE: AthleteFixture = {
  id: "fixture-incomplete",
  name: "Incomplete Data Athlete",
  trainingLoads: INCOMPLETE_TRAINING_LOADS,
  weights: INCOMPLETE_WEIGHTS,
  wellness: INCOMPLETE_WELLNESS,
};
