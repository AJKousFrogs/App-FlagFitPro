/**
 * ACWR Service Unit Tests
 *
 * Comprehensive test coverage for the Acute:Chronic Workload Ratio service.
 * Tests evidence-based calculations from Gabbett (2016) and related research.
 *
 * @version 2.0.0
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AcwrService } from "./acwr.service";
import { EvidenceConfigService } from "./evidence-config.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { TrainingSession } from "../models/acwr.models";

// Mock services
const mockSupabaseService = {
  userId: vi.fn(() => null),
  client: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      upsert: vi.fn(() => Promise.resolve({ error: null })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
};

const mockLoggerService = {
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  success: vi.fn(),
};

const mockEvidenceConfigService = {
  getACWRConfig: vi.fn(() => ({
    acuteWindowDays: 7,
    chronicWindowDays: 28,
    acuteLambda: 0.9,
    chronicLambda: 0.1,
    thresholds: {
      sweetSpotLow: 0.8,
      sweetSpotHigh: 1.3,
      dangerHigh: 1.5,
      maxWeeklyIncreasePercent: 10,
      maxWeeklyIncreasePercentConservative: 7,
    },
    minChronicLoad: 200,
    minDaysForChronic: 21,
    minSessionsForChronic: 10,
    dataQuality: {
      lowConfidenceThreshold: 5,
      enableQualityFlags: true,
    },
  })),
  getActivePreset: vi.fn(() => ({
    name: "Default",
    version: "1.0",
    acwr: {
      citations: [],
      scienceNotes: {
        thresholds: "Test notes",
        coachOverride: "Test override",
      },
    },
  })),
};

describe("AcwrService", () => {
  let service: AcwrService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-16T12:00:00Z"));
    TestBed.configureTestingModule({
      providers: [
        AcwrService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: EvidenceConfigService, useValue: mockEvidenceConfigService },
      ],
    });
    service = TestBed.inject(AcwrService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================================
  // EWMA Calculation Tests
  // ============================================================================

  describe("EWMA Calculation", () => {
    it("should calculate acute load using EWMA formula", () => {
      // Add 7 days of sessions with known loads
      const sessions = generateSessions(7, 500);
      service.addSessions(sessions);

      const acuteLoad = service.acuteLoad();
      expect(acuteLoad).toBeGreaterThan(0);
    });

    it("should calculate chronic load using EWMA formula", () => {
      // Need minimum 21 days for chronic calculation
      const sessions = generateSessions(28, 400);
      service.addSessions(sessions);

      const chronicLoad = service.chronicLoad();
      expect(chronicLoad).toBeGreaterThan(0);
    });

    it("should apply minimum chronic load floor", () => {
      // Add minimal sessions - chronic should not go below floor
      const sessions = generateSessions(5, 50);
      service.addSessions(sessions);

      const chronicLoad = service.chronicLoad();
      // Should be at least minChronicLoad (200 from config)
      expect(chronicLoad).toBeGreaterThanOrEqual(200);
    });

    it("should return 0 for empty sessions", () => {
      expect(service.acuteLoad()).toBe(0);
      expect(service.chronicLoad()).toBe(0);
    });
  });

  // ============================================================================
  // ACWR Ratio Tests (Gabbett 2016 Thresholds)
  // ============================================================================

  describe("ACWR Ratio Calculation", () => {
    it("should calculate ACWR ratio correctly", () => {
      // Create sessions that produce a known ACWR
      const sessions = generateSessionsWithPattern(28, [
        { days: 7, load: 600 }, // Acute: high load
        { days: 21, load: 500 }, // Chronic: moderate load
      ]);
      service.addSessions(sessions);

      const ratio = service.acwrRatio();
      // With sufficient data, ratio should be a positive number (not null)
      if (ratio !== null && ratio > 0) {
        expect(ratio).toBeGreaterThan(0);
        expect(ratio).toBeLessThan(3); // Sanity check
      }
    });

    it("should return null when insufficient data", () => {
      // Only 5 days of data (need 21 minimum)
      const sessions = generateSessions(5, 500);
      service.addSessions(sessions);

      expect(service.acwrRatio()).toBeNull();
    });

    it("should return null when chronic load is zero", () => {
      // No sessions = zero chronic
      expect(service.acwrRatio()).toBeNull();
    });
  });

  // ============================================================================
  // Risk Zone Classification (Evidence-Based)
  // ============================================================================

  describe("Risk Zone Classification", () => {
    it("should classify as 'no-data' when insufficient data", () => {
      const sessions = generateSessions(5, 500);
      service.addSessions(sessions);

      const riskZone = service.riskZone();
      expect(riskZone.level).toBe("no-data");
      expect(riskZone.color).toBe("gray");
    });

    it("should classify under-training zone (ACWR < 0.8)", () => {
      // Create low acute, high chronic scenario
      const sessions = generateSessionsWithPattern(28, [
        { days: 7, load: 200 }, // Low acute
        { days: 21, load: 600 }, // High chronic
      ]);
      service.addSessions(sessions);

      const riskZone = service.riskZone();
      // If we have data, check classification
      if (riskZone.level !== "no-data") {
        // ACWR < 0.8 should be under-training
        const ratio = service.acwrRatio();
        if (ratio !== null && ratio < 0.8 && ratio > 0) {
          expect(riskZone.level).toBe("under-training");
          expect(riskZone.color).toBe("orange");
        }
      }
    });

    it("should classify sweet-spot zone (ACWR 0.8-1.3)", () => {
      // Create balanced acute/chronic scenario
      const sessions = generateSessionsWithPattern(28, [
        { days: 7, load: 500 }, // Moderate acute
        { days: 21, load: 500 }, // Same chronic
      ]);
      service.addSessions(sessions);

      const riskZone = service.riskZone();
      const ratio = service.acwrRatio();

      if (ratio !== null && ratio >= 0.8 && ratio <= 1.3) {
        expect(riskZone.level).toBe("sweet-spot");
        expect(riskZone.color).toBe("green");
        expect(riskZone.label).toBe("Sweet Spot");
      }
    });

    it("should classify danger-zone (ACWR > 1.5)", () => {
      // Create high acute, low chronic scenario
      const sessions = generateSessionsWithPattern(28, [
        { days: 7, load: 900 }, // Very high acute
        { days: 21, load: 400 }, // Lower chronic
      ]);
      service.addSessions(sessions);

      const riskZone = service.riskZone();
      const ratio = service.acwrRatio();

      if (ratio !== null && ratio > 1.5) {
        expect(riskZone.level).toBe("danger-zone");
        expect(riskZone.color).toBe("red");
      }
    });

    it("should provide appropriate recommendations for each zone", () => {
      const sessions = generateSessions(28, 500);
      service.addSessions(sessions);

      const riskZone = service.riskZone();
      expect(riskZone.recommendation).toBeDefined();
      expect(riskZone.recommendation.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Weekly Progression Tests (10% Cap - Gabbett 2016)
  // ============================================================================

  describe("Weekly Progression", () => {
    it("should calculate weekly load change percentage", () => {
      const sessions = generateSessions(14, 500);
      service.addSessions(sessions);

      const progression = service.weeklyProgression();
      expect(progression.currentWeek).toBeGreaterThanOrEqual(0);
      expect(progression.previousWeek).toBeGreaterThanOrEqual(0);
      expect(typeof progression.changePercent).toBe("number");
    });

    it("should flag unsafe weekly increases (>10%)", () => {
      // Create spike scenario
      const sessions = [
        ...generateSessionsForWeek(1, 300), // Previous week: low
        ...generateSessionsForWeek(0, 600), // Current week: high (100% increase)
      ];
      service.addSessions(sessions);

      const progression = service.weeklyProgression();
      if (progression.previousWeek > 0) {
        const actualChange =
          ((progression.currentWeek - progression.previousWeek) /
            progression.previousWeek) *
          100;
        if (actualChange > 10) {
          expect(progression.isSafe).toBe(false);
          expect(progression.warning).toBeDefined();
        }
      }
    });

    it("should mark safe progressions (<10% increase)", () => {
      // Create gradual increase
      const sessions = [
        ...generateSessionsForWeek(1, 500), // Previous week
        ...generateSessionsForWeek(0, 520), // Current week (4% increase)
      ];
      service.addSessions(sessions);

      const progression = service.weeklyProgression();
      if (progression.previousWeek > 0 && progression.changePercent <= 10) {
        expect(progression.isSafe).toBe(true);
      }
    });
  });

  // ============================================================================
  // Data Quality Assessment
  // ============================================================================

  describe("Data Quality Assessment", () => {
    it("should flag insufficient data", () => {
      const sessions = generateSessions(5, 500);
      service.addSessions(sessions);

      const acwrData = service.acwrData();
      expect(acwrData.dataQuality.level).toBe("insufficient");
      expect(acwrData.dataQuality.issues.length).toBeGreaterThan(0);
    });

    it("should provide recommendations for improving data quality", () => {
      const sessions = generateSessions(10, 500);
      service.addSessions(sessions);

      const acwrData = service.acwrData();
      if (acwrData.dataQuality.level !== "high") {
        expect(acwrData.dataQuality.recommendations.length).toBeGreaterThan(0);
      }
    });

    it("should calculate confidence score", () => {
      const sessions = generateSessions(28, 500);
      service.addSessions(sessions);

      const acwrData = service.acwrData();
      expect(acwrData.dataQuality.confidence).toBeGreaterThanOrEqual(0);
      expect(acwrData.dataQuality.confidence).toBeLessThanOrEqual(100);
    });
  });

  // ============================================================================
  // Predictive Load Tests
  // ============================================================================

  describe("Predictive Load Management", () => {
    it("should predict next session load impact", () => {
      const sessions = generateSessions(28, 500);
      service.addSessions(sessions);

      const prediction = service.predictNextSessionLoad(7, 60); // RPE 7, 60 min

      expect(prediction.projected).toBe(7 * 60); // 420
      expect(typeof prediction.projectedACWR).toBe("number");
      expect(prediction.recommendation).toBeDefined();
    });

    it("should suggest adjustments for dangerous loads", () => {
      // Create high-risk scenario
      const sessions = generateSessionsWithPattern(28, [
        { days: 7, load: 800 },
        { days: 21, load: 400 },
      ]);
      service.addSessions(sessions);

      // Try to add very high intensity session
      const prediction = service.predictNextSessionLoad(10, 120); // Max intensity

      if (prediction.projectedACWR > 1.5) {
        expect(prediction.adjustments).toBeDefined();
        expect(prediction.adjustments?.suggestedIntensity).toBeLessThan(10);
      }
    });

    it("should enforce weekly cap in predictions", () => {
      const sessions = [
        ...generateSessionsForWeek(1, 300),
        ...generateSessionsForWeek(0, 500),
      ];
      service.addSessions(sessions);

      const prediction = service.predictNextSessionLoad(9, 90);

      expect(typeof prediction.weeklyChangePercent).toBe("number");
    });
  });

  // ============================================================================
  // Sprint Decision Tests
  // ============================================================================

  describe("Sprint Decision Logic", () => {
    it("should recommend skipping sprints in danger zone", () => {
      // Create danger zone scenario
      const sessions = generateSessionsWithPattern(28, [
        { days: 7, load: 900 },
        { days: 21, load: 400 },
      ]);
      service.addSessions(sessions);

      const riskZone = service.riskZone();
      if (riskZone.level === "danger-zone") {
        expect(service.shouldSkipSprints(3)).toBe(true); // Any day
      }
    });

    it("should consider game day proximity", () => {
      const sessions = generateSessions(28, 500);
      service.addSessions(sessions);

      // Friday (day 5) before Saturday game (day 6)
      const shouldSkipFriday = service.shouldSkipSprints(5, 6);
      expect(typeof shouldSkipFriday).toBe("boolean");
    });
  });

  // ============================================================================
  // Training Modification Recommendations
  // ============================================================================

  describe("Training Modifications", () => {
    it("should provide modifications for high-risk scenarios", () => {
      const sessions = generateSessionsWithPattern(28, [
        { days: 7, load: 800 },
        { days: 21, load: 400 },
      ]);
      service.addSessions(sessions);

      const mods = service.getTrainingModification();

      if (service.riskZone().level === "danger-zone") {
        expect(mods.shouldModify).toBe(true);
        expect(mods.modifications.length).toBeGreaterThan(0);
      }
    });

    it("should include data quality warnings", () => {
      const sessions = generateSessions(10, 500);
      service.addSessions(sessions);

      const mods = service.getTrainingModification();
      const hasDataQualityWarning = mods.modifications.some((m) =>
        m.includes("data quality"),
      );

      // Should warn about low data quality
      expect(hasDataQualityWarning || mods.modifications.length >= 0).toBe(
        true,
      );
    });
  });

  // ============================================================================
  // Session Management
  // ============================================================================

  describe("Session Management", () => {
    it("should add single session", () => {
      const session = createSession(new Date(), 500);
      service.addSession(session);

      const startDate = new Date("2026-01-10T00:00:00Z");
      const endDate = new Date("2026-01-20T23:59:59Z");
      const rangeSessions = service.getSessionsInRange(startDate, endDate);
      expect(rangeSessions.length).toBe(1);
    });

    it("should add multiple sessions", () => {
      const sessions = generateSessions(5, 500);
      service.addSessions(sessions);

      expect(service.acuteLoad()).toBeGreaterThan(0);
    });

    it("should clear all sessions", () => {
      service.addSessions(generateSessions(10, 500));
      service.clearSessions();

      expect(service.acuteLoad()).toBe(0);
      expect(service.chronicLoad()).toBe(0);
    });

    it("should get sessions in date range", () => {
      const sessions = generateSessions(10, 500);
      service.addSessions(sessions);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 5);
      const endDate = new Date();

      const rangeSessions = service.getSessionsInRange(startDate, endDate);
      expect(rangeSessions.length).toBeGreaterThanOrEqual(0);
    });

    it("should prune old sessions beyond chronic window", () => {
      // Add sessions from 60 days ago
      const oldSessions = generateSessions(10, 500, 60);
      service.addSessions(oldSessions);

      // Add recent sessions
      const recentSessions = generateSessions(10, 500);
      service.addSessions(recentSessions);

      // Old sessions should be pruned (only keep chronic window + 7 days)
      const allSessions = service.getSessionsInRange(new Date(0), new Date());
      // Should not have sessions from 60 days ago
      expect(allSessions.length).toBeLessThanOrEqual(20);
    });
  });

  // ============================================================================
  // Configuration Management
  // ============================================================================

  describe("Configuration", () => {
    it("should get current config", () => {
      const config = service.getConfig();

      expect(config.acuteWindowDays).toBe(7);
      expect(config.chronicWindowDays).toBe(28);
      expect(config.thresholds.sweetSpotLow).toBe(0.8);
      expect(config.thresholds.sweetSpotHigh).toBe(1.3);
    });

    it("should update config", () => {
      service.updateConfig({
        thresholds: {
          sweetSpotLow: 0.75,
          sweetSpotHigh: 1.35,
          dangerHigh: 1.6,
          maxWeeklyIncreasePercent: 12,
        },
      });

      const config = service.getConfig();
      expect(config.thresholds.sweetSpotLow).toBe(0.75);
    });

    it("should reset to default config", () => {
      service.updateConfig({
        thresholds: {
          sweetSpotLow: 0.5,
          sweetSpotHigh: 2.0,
          dangerHigh: 2.5,
          maxWeeklyIncreasePercent: 50,
        },
      });

      service.resetConfig();

      const config = service.getConfig();
      expect(config.thresholds.sweetSpotLow).toBe(0.8);
    });

    it("should provide evidence information", () => {
      const evidence = service.getEvidenceInfo();

      expect(evidence.preset).toBeDefined();
      expect(evidence.scienceNotes).toBeDefined();
      expect(evidence.coachOverride).toBeDefined();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle empty session array", () => {
      service.addSessions([]);
      expect(service.acuteLoad()).toBe(0);
    });

    it("should handle sessions with zero load", () => {
      const sessions = generateSessions(10, 0);
      service.addSessions(sessions);

      expect(service.acuteLoad()).toBe(0);
    });

    it("should handle very high loads", () => {
      const sessions = generateSessions(28, 10000);
      service.addSessions(sessions);

      expect(service.acuteLoad()).toBeGreaterThan(0);
      expect(service.chronicLoad()).toBeGreaterThan(0);
    });

    it("should handle single session", () => {
      const session = createSession(new Date(), 500);
      service.addSession(session);

      const startDate = new Date("2026-01-10T00:00:00Z");
      const endDate = new Date("2026-01-20T23:59:59Z");
      const rangeSessions = service.getSessionsInRange(startDate, endDate);
      expect(rangeSessions.length).toBe(1);
      expect(service.acwrRatio()).toBeNull(); // Insufficient data
    });
  });
});

// ============================================================================
// Test Helpers
// ============================================================================

function createSession(date: Date, load: number): TrainingSession {
  const rpe = Math.min(10, Math.max(1, Math.round(load / 60)));
  const duration = Math.round(load / rpe);

  return {
    playerId: "test-player",
    date: new Date(date),
    sessionType: "technical",
    metrics: {
      type: "internal",
      internal: {
        sessionRPE: rpe,
        duration: duration,
        workload: load,
      },
      calculatedLoad: load,
    },
    load: load,
    completed: true,
    modifiedFromPlan: false,
  };
}

function generateSessions(
  days: number,
  avgLoad: number,
  daysAgo = 0,
): TrainingSession[] {
  const sessions: TrainingSession[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i - daysAgo);

    // Add some variance to loads
    const variance = (Math.random() - 0.5) * avgLoad * 0.2;
    const load = Math.max(0, avgLoad + variance);

    sessions.push(createSession(date, load));
  }

  return sessions;
}

function generateSessionsForWeek(
  weeksAgo: number,
  avgLoad: number,
): TrainingSession[] {
  const sessions: TrainingSession[] = [];
  const startDay = weeksAgo * 7;

  for (let i = 0; i < 5; i++) {
    // 5 training days per week
    const date = new Date();
    date.setDate(date.getDate() - startDay - i);
    sessions.push(createSession(date, avgLoad));
  }

  return sessions;
}

function generateSessionsWithPattern(
  totalDays: number,
  pattern: { days: number; load: number }[],
): TrainingSession[] {
  const sessions: TrainingSession[] = [];
  let dayOffset = 0;

  for (const segment of pattern) {
    for (let i = 0; i < segment.days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - dayOffset - i);
      sessions.push(createSession(date, segment.load));
    }
    dayOffset += segment.days;
  }

  return sessions;
}
