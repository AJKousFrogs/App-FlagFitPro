import { TestBed } from "@angular/core/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrainingStatsService } from "./training-stats.service";
import { SupabaseService } from "./supabase.service";
import { AuthService } from "./auth.service";
import { LoggerService } from "./logger.service";

const mockSupabaseService = {
  client: {},
};

const mockAuthService = {
  currentUser: () => null,
};

const mockLoggerService = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  debug: () => undefined,
  success: () => undefined,
};

describe("TrainingStatsService", () => {
  let service: TrainingStatsService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-05T12:00:00Z"));

    TestBed.configureTestingModule({
      providers: [
        TrainingStatsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(TrainingStatsService);
  });

  it("computes weekly and monthly stats with Sunday week start", () => {
    const sessions = [
      {
        session_date: "2026-02-05",
        duration_minutes: 60,
        workload: 300,
        intensity_level: 5,
        status: "completed",
      },
      {
        session_date: "2026-02-04",
        duration_minutes: 45,
        workload: 225,
        intensity_level: 5,
        status: "completed",
      },
      {
        session_date: "2026-02-02",
        duration_minutes: 30,
        workload: 150,
        intensity_level: 5,
        status: "completed",
      },
      {
        session_date: "2026-01-31",
        duration_minutes: 50,
        workload: 250,
        intensity_level: 5,
        status: "completed",
      },
    ];

    const stats = (service as any).computeStats(sessions);

    expect(stats.totalSessions).toBe(4);
    expect(stats.totalDuration).toBe(185);
    expect(stats.totalLoad).toBe(925);
    expect(stats.avgDuration).toBe(46);
    expect(stats.avgLoad).toBe(231);
    expect(stats.sessionsThisWeek).toBe(3);
    expect(stats.sessionsThisMonth).toBe(3);
    expect(stats.weeklyVolume).toBe(675);
    expect(stats.weeklyDuration).toBe(135);
    expect(stats.weeklyAvgIntensity).toBe(5);
    expect(stats.currentStreak).toBe(2);
  });

  it("calculates longest streak from dates list", () => {
    const dates = [
      "2026-02-05",
      "2026-02-04",
      "2026-02-03",
      "2026-01-31",
      "2026-01-30",
    ];

    const streakInfo = (service as any).calculateStreakInfo(dates);

    expect(streakInfo.current).toBe(3);
    expect(streakInfo.longest).toBe(3);
    expect(streakInfo.lastTrainingDate).toBe("2026-02-05");
  });
});
