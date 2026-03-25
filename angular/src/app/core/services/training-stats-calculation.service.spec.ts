import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach } from "vitest";
import { TrainingStatsCalculationService } from "./training-stats-calculation.service";
import { TrainingDataService, TrainingSession } from "./training-data.service";
import { LoggerService } from "./logger.service";
import { AcwrService } from "./acwr.service";
import { SupabaseService } from "./supabase.service";
import { AuthService } from "./auth.service";
import { NORMAL_ATHLETE } from "../../../testing/athlete-fixtures";

const mockTrainingDataService = {};
const mockLoggerService = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  success: () => undefined,
};
const mockAcwrService = { acwrData: () => ({}) };
const mockSupabaseService = { client: {} };
const mockAuthService = { getUser: () => null };

const buildSessionsFromFixture = (): TrainingSession[] =>
  NORMAL_ATHLETE.trainingLoads.map((entry, index) => ({
    user_id: "fixture-normal",
    session_date: entry.date,
    duration_minutes: entry.durationMinutes,
    rpe: entry.rpe,
    session_type: "training",
    id: `fixture-${index}`,
  }));

describe("TrainingStatsCalculationService", () => {
  let service: TrainingStatsCalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrainingStatsCalculationService,
        { provide: TrainingDataService, useValue: mockTrainingDataService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: AcwrService, useValue: mockAcwrService },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(TrainingStatsCalculationService);
  });

  it("calculates weekly volume using ISO week boundaries", () => {
    const sessions = buildSessionsFromFixture();
    const referenceDate = new Date("2026-01-28T12:00:00Z");

    const weekly = service.calculateWeeklyVolume(sessions, referenceDate);

    expect(weekly.weekStart).toBe("2026-01-26");
    expect(weekly.weekEnd).toBe("2026-02-01");
    expect(weekly.sessionCount).toBe(3);
    expect(weekly.totalDuration).toBe(175);
    expect(weekly.totalLoad).toBe(935);
    expect(weekly.avgIntensity).toBe(5.3);
  });

  it("calculates training streak with <=2 day gaps", () => {
    const sessions: TrainingSession[] = [
      { user_id: "a", session_date: "2026-01-28" },
      { user_id: "a", session_date: "2026-01-27" },
      { user_id: "a", session_date: "2026-01-25" },
      { user_id: "a", session_date: "2026-01-22" },
    ];
    const referenceDate = new Date("2026-01-28T12:00:00Z");

    const streak = service.calculateStreak(sessions, referenceDate);

    expect(streak).toBe(3);
  });
});
