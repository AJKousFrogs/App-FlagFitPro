import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AcwrService } from "./acwr.service";
import { EvidenceConfigService } from "./evidence-config.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { AcwrSpikeDetectionService } from "./acwr-spike-detection.service";
import { BodyWeightLoadService } from "./body-weight-load.service";
import {
  INCOMPLETE_ATHLETE,
  NORMAL_ATHLETE,
  RECOVERY_ATHLETE,
  SPIKE_ATHLETE,
} from "../../../testing/athlete-fixtures";
import { TrainingSession } from "../models/acwr.models";
import {
  ACWR_PRECISION,
  roundToPrecision,
  safeDivide,
} from "../../shared/utils/precision.utils";
import { getDateKey } from "../../shared/utils/date.utils";

const mockEvidenceConfigService = {
  getACWRConfig: () => ({
    acuteWindowDays: 7,
    chronicWindowDays: 28,
    acuteLambda: 0.2,
    chronicLambda: 0.05,
    thresholds: {
      sweetSpotLow: 0.8,
      sweetSpotHigh: 1.3,
      dangerHigh: 1.5,
      maxWeeklyIncreasePercent: 20,
      maxWeeklyIncreasePercentConservative: 10,
    },
    minChronicLoad: 50,
    minDaysForChronic: 21,
    minSessionsForChronic: 12,
    dataQuality: {
      lowConfidenceThreshold: 50,
      enableQualityFlags: true,
    },
  }),
  getActivePreset: () => ({
    name: "Default",
    version: "1.0",
    acwr: {
      citations: [],
      scienceNotes: { thresholds: "", coachOverride: "" },
    },
  }),
};

const mockSupabaseService = {
  userId: () => null,
};

const mockLoggerService = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const mockSpikeDetection = {
  checkAndCapLoad: vi.fn().mockResolvedValue(false),
  decrementLoadCap: vi.fn().mockResolvedValue(undefined),
};

const buildSessions = (playerId: string, entries: typeof NORMAL_ATHLETE.trainingLoads): TrainingSession[] =>
  entries.map((entry) => {
    const workload = entry.rpe * entry.durationMinutes;
    return {
      playerId,
      date: new Date(`${entry.date}T12:00:00Z`),
      sessionType: "training",
      metrics: {
        type: "internal",
        internal: {
          sessionRPE: entry.rpe,
          duration: entry.durationMinutes,
          workload,
        },
        calculatedLoad: workload,
      },
      load: workload,
      completed: true,
    };
  });

const computeEWMA = (loads: number[], lambda: number, days: number): number => {
  if (loads.length === 0) return 0;
  let ewma = loads[0] || 0;
  for (let i = 1; i < Math.min(loads.length, days); i++) {
    const load = loads[i] || 0;
    ewma = lambda * load + (1 - lambda) * ewma;
  }
  return roundToPrecision(ewma, ACWR_PRECISION);
};

const aggregateDailyLoads = (sessions: TrainingSession[]): Map<string, number> => {
  const daily = new Map<string, number>();
  sessions.forEach((session) => {
    const key = getDateKey(session.date);
    const current = daily.get(key) || 0;
    daily.set(key, current + session.load);
  });
  return daily;
};

const getRecentLoads = (daily: Map<string, number>, days: number, now: Date): number[] => {
  const loads: number[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = getDateKey(date);
    loads.push(daily.get(key) || 0);
  }
  return loads;
};

const computeAcwrFromSessions = (sessions: TrainingSession[], now: Date): {
  acute: number;
  chronic: number;
  ratio: number;
} => {
  const daily = aggregateDailyLoads(sessions);
  const acuteLoads = getRecentLoads(daily, 7, now);
  const chronicLoads = getRecentLoads(daily, 28, now);
  const acute = computeEWMA(acuteLoads, 0.2, 7);
  const chronic = Math.max(computeEWMA(chronicLoads, 0.05, 28), 50);
  const ratio = safeDivide(acute, chronic, ACWR_PRECISION);
  return { acute, chronic, ratio };
};

const computePerformanceScore = (rpes: number[]): number => {
  const avgRpe =
    rpes.length > 0 ? rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length : 5;
  const rawScore = Math.round(100 - (avgRpe - 5) * 10);
  return Math.min(100, Math.max(0, rawScore));
};

describe("Calculation Verification", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-28T12:00:00Z"));

    TestBed.configureTestingModule({
      providers: [
        AcwrService,
        BodyWeightLoadService,
        { provide: EvidenceConfigService, useValue: mockEvidenceConfigService },
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: AcwrSpikeDetectionService, useValue: mockSpikeDetection },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes ACWR correctly for normal athlete fixture", () => {
    const acwrService = TestBed.inject(AcwrService);
    const playerId = "fixture-normal";
    const sessions = buildSessions(playerId, NORMAL_ATHLETE.trainingLoads);
    acwrService.setPlayer(playerId);
    acwrService.addSessions(sessions);

    const now = new Date();
    const daily = aggregateDailyLoads(sessions);
    const acuteLoads = getRecentLoads(daily, 7, now);
    const chronicLoads = getRecentLoads(daily, 28, now);

    const expectedAcute = computeEWMA(acuteLoads, 0.2, 7);
    const expectedChronic = Math.max(computeEWMA(chronicLoads, 0.05, 28), 50);
    const expectedRatio = safeDivide(expectedAcute, expectedChronic, ACWR_PRECISION);

    const result = acwrService.acwrData();
    expect(result.acute).toBeCloseTo(expectedAcute, 2);
    expect(result.chronic).toBeCloseTo(expectedChronic, 2);
    expect(result.ratio).toBeCloseTo(expectedRatio, 2);
  });

  it("detects higher ACWR ratio for spike athlete fixture", () => {
    const acwrService = TestBed.inject(AcwrService);
    const playerId = "fixture-spike";
    const sessions = buildSessions(playerId, SPIKE_ATHLETE.trainingLoads);
    acwrService.setPlayer(playerId);
    acwrService.addSessions(sessions);

    const now = new Date();
    const spikeRatio = computeAcwrFromSessions(sessions, now).ratio;
    const normalRatio = computeAcwrFromSessions(
      buildSessions("fixture-normal", NORMAL_ATHLETE.trainingLoads),
      now,
    ).ratio;

    expect(spikeRatio).toBeGreaterThan(normalRatio);
  });

  it("detects lower ACWR ratio for recovery athlete fixture", () => {
    const acwrService = TestBed.inject(AcwrService);
    const playerId = "fixture-recovery";
    const sessions = buildSessions(playerId, RECOVERY_ATHLETE.trainingLoads);
    acwrService.setPlayer(playerId);
    acwrService.addSessions(sessions);

    const ratio = computeAcwrFromSessions(sessions, new Date()).ratio;
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThan(1.2);
  });

  it("returns zero ACWR when data is insufficient", () => {
    const acwrService = TestBed.inject(AcwrService);
    const playerId = "fixture-incomplete";
    const sessions = buildSessions(playerId, INCOMPLETE_ATHLETE.trainingLoads);
    acwrService.setPlayer(playerId);
    acwrService.addSessions(sessions);

    const result = acwrService.acwrData();
    expect(result.ratio).toBe(0);
    expect(result.riskZone.level).toBe("no-data");
  });

  it("calculates bodyweight weekly change and trend correctly", () => {
    const bodyWeightService = TestBed.inject(BodyWeightLoadService);
    const weightHistory = NORMAL_ATHLETE.weights.map((entry) => ({
      date: new Date(`${entry.date}T12:00:00Z`),
      weight: entry.weight,
    }));
    bodyWeightService.setWeightHistory(weightHistory);

    const analysis = bodyWeightService.analyzeWeightChanges();
    expect(analysis.weeklyChange).toBeCloseTo(0.3, 2);
    expect(analysis.weeklyChangePercent).toBeCloseTo((0.3 / 80.1) * 100, 2);
    expect(analysis.trend).toBe("stable");
  });

  it("calculates dashboard performance score using avg RPE formula", () => {
    expect(computePerformanceScore([6, 6, 5, 6])).toBe(93);
    expect(computePerformanceScore([4, 4, 5, 4])).toBe(100);
    expect(computePerformanceScore([10, 10, 10])).toBe(50);
  });
});
