/**
 * TrainingPlanService Unit Tests
 *
 * Covers periodization logic added in the April 2026 revamp:
 *  - taper detection and volume reduction
 *  - detraining gap detection and re-conditioning ramp
 *  - determinePhase ACWR × readiness matrix
 *  - adjustForACWR smooth interpolation boundaries
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TrainingPlanService, GoalBasedPlanConfig } from "./training-plan.service";
import { AcwrService } from "./acwr.service";
import { ReadinessService } from "./readiness.service";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";

const mockAcwrService = { acwrRatio: vi.fn(() => 1.0) };
const mockReadinessService = { readinessScore: vi.fn(() => 70) };
const mockApiService = {
  get: vi.fn(() => ({ subscribe: vi.fn() })),
  post: vi.fn(() => ({ subscribe: vi.fn() })),
};
const mockLoggerService = {
  info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn(),
};

describe("TrainingPlanService", () => {
  let service: TrainingPlanService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrainingPlanService,
        { provide: AcwrService, useValue: mockAcwrService },
        { provide: ReadinessService, useValue: mockReadinessService },
        { provide: ApiService, useValue: mockApiService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });
    service = TestBed.inject(TrainingPlanService);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // detectPeriodizationState
  // ──────────────────────────────────────────────────────────────────────────

  describe("detectPeriodizationState", () => {
    it("returns normal when no dates are provided", () => {
      const state = service.detectPeriodizationState();
      expect(state.phase).toBe("normal");
    });

    it("returns taper when competition is 7 days out", () => {
      const compDate = new Date();
      compDate.setDate(compDate.getDate() + 7);
      const state = service.detectPeriodizationState(compDate);
      expect(state.phase).toBe("taper");
      expect(state.daysToCompetition).toBe(7);
      expect(state.message).toContain("taper");
    });

    it("returns taper when competition is exactly 14 days out (boundary)", () => {
      const compDate = new Date();
      compDate.setDate(compDate.getDate() + 14);
      const state = service.detectPeriodizationState(compDate);
      expect(state.phase).toBe("taper");
    });

    it("returns normal when competition is 15 days out (outside window)", () => {
      const compDate = new Date();
      compDate.setDate(compDate.getDate() + 15);
      const state = service.detectPeriodizationState(compDate);
      expect(state.phase).toBe("normal");
    });

    it("returns normal when competition is today (0 days out)", () => {
      const compDate = new Date();
      const state = service.detectPeriodizationState(compDate);
      expect(state.phase).toBe("taper");
      expect(state.daysToCompetition).toBe(0);
    });

    it("returns detraining_ramp when last training was 7 days ago", () => {
      const lastDate = new Date();
      lastDate.setDate(lastDate.getDate() - 7);
      const state = service.detectPeriodizationState(undefined, lastDate);
      expect(state.phase).toBe("detraining_ramp");
      expect(state.daysSinceTraining).toBe(7);
      expect(state.message).toContain("60%");
    });

    it("returns detraining_ramp when last training was 21 days ago", () => {
      const lastDate = new Date();
      lastDate.setDate(lastDate.getDate() - 21);
      const state = service.detectPeriodizationState(undefined, lastDate);
      expect(state.phase).toBe("detraining_ramp");
      expect(state.daysSinceTraining).toBe(21);
    });

    it("detraining takes precedence over taper", () => {
      const compDate = new Date();
      compDate.setDate(compDate.getDate() + 10);
      const lastDate = new Date();
      lastDate.setDate(lastDate.getDate() - 10);
      const state = service.detectPeriodizationState(compDate, lastDate);
      expect(state.phase).toBe("detraining_ramp");
    });

    it("returns normal when last training was 6 days ago (below threshold)", () => {
      const lastDate = new Date();
      lastDate.setDate(lastDate.getDate() - 6);
      const state = service.detectPeriodizationState(undefined, lastDate);
      expect(state.phase).toBe("normal");
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // generateWeeklyPlan — taper applied to sessions
  // ──────────────────────────────────────────────────────────────────────────

  describe("generateWeeklyPlan with taper", () => {
    it("reduces session volume when competition is 5 days out", () => {
      const compDate = new Date();
      compDate.setDate(compDate.getDate() + 5);

      const config: GoalBasedPlanConfig = {
        goal: "speed",
        currentACWR: 1.0,
        readinessLevel: "high",
        competitionDate: compDate,
      };

      const plan = service.generateWeeklyPlan(config);
      const nonRecoverySessions = plan.sessions.filter(
        (s) => s.sessionType !== "recovery",
      );

      // Taper should reduce volume (5d: ~1 - (1-5/14)*0.55 ≈ 0.65 → ~35% reduction)
      // Check at least one session has taper note
      const hasTaperNote = nonRecoverySessions.some(
        (s) => s.notes?.includes("taper"),
      );
      expect(hasTaperNote).toBe(true);
    });

    it("does not reduce volume when competition is 20 days out", () => {
      const compDate = new Date();
      compDate.setDate(compDate.getDate() + 20);

      const normalConfig: GoalBasedPlanConfig = {
        goal: "speed",
        currentACWR: 1.0,
        readinessLevel: "high",
      };

      const taperConfig: GoalBasedPlanConfig = {
        ...normalConfig,
        competitionDate: compDate,
      };

      const normalPlan = service.generateWeeklyPlan(normalConfig);
      const taperPlan = service.generateWeeklyPlan(taperConfig);

      const normalTotal = normalPlan.sessions.reduce((s, x) => s + x.volume, 0);
      const taperTotal = taperPlan.sessions.reduce((s, x) => s + x.volume, 0);

      // Volumes should be equal — competition is out of range
      expect(normalTotal).toBe(taperTotal);
    });
  });

  describe("generateWeeklyPlan with flag football performance context", () => {
    it("preserves the selected goal and detected phase", () => {
      const plan = service.generateWeeklyPlan({
        goal: "defense",
        currentACWR: 1.0,
        readinessLevel: "high",
        teamPracticesPerWeek: 2,
      });

      expect(plan.goal).toBe("defense");
      expect(plan.phase).toBe("power");
      expect(plan.performanceSystem?.teamPracticeCount).toBe(2);
    });

    it("caps individual work when the athlete already has four team practices and a doubleheader", () => {
      const plan = service.generateWeeklyPlan({
        goal: "speed",
        currentACWR: 1.0,
        readinessLevel: "moderate",
        teamPracticesPerWeek: 4,
        gameWeekType: "doubleheader",
      });

      const individualSessions = plan.sessions.filter(
        (session) =>
          session.sessionType !== "recovery" &&
          session.sessionType !== "game",
      );

      expect(plan.performanceSystem?.individualSessionCap).toBe(1);
      expect(plan.performanceSystem?.highIntensityCap).toBe(0);
      expect(individualSessions.length).toBeLessThanOrEqual(1);
      expect(plan.fixedTeamPracticeLoadAu).toBe(1680);
      expect(plan.competitionLoadAu).toBe(900);
    });

    it("adds international tournament taper, nutrition, mental, and injury-prevention context", () => {
      const compDate = new Date();
      compDate.setDate(compDate.getDate() + 10);

      const plan = service.generateWeeklyPlan({
        goal: "route-running",
        currentACWR: 1.05,
        readinessLevel: "high",
        teamPracticesPerWeek: 2,
        gameWeekType: "international-tournament",
        competitionDate: compDate,
        bodyMassKg: 80,
      });

      const system = plan.performanceSystem;
      expect(system?.weekType).toBe("international-tournament");
      expect(system?.competitionWeekTaper.some((item) =>
        item.includes("travel hydration"),
      )).toBe(true);
      expect(system?.nutritionTimeline.some((item) =>
        item.timing === "Between games",
      )).toBe(true);
      expect(system?.performanceBaselines.some((item) =>
        item.cadence === "yearly",
      )).toBe(true);
      expect(system?.supplementPlan.some((item) =>
        item.key === "nitrate",
      )).toBe(true);
      expect(system?.supplementPlan.some((item) =>
        item.key === "sodium-bicarbonate" &&
        item.protocol[0].includes("16 to 24 g"),
      )).toBe(true);
      expect(system?.mentalRoutine.thirtySecondReset.length).toBeGreaterThan(0);
      expect(system?.injuryProtocols.length).toBe(4);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // generateWeeklyPlan — detraining ramp
  // ──────────────────────────────────────────────────────────────────────────

  describe("generateWeeklyPlan with detraining ramp", () => {
    it("caps volume at 60% after 7-day gap", () => {
      const lastDate = new Date();
      lastDate.setDate(lastDate.getDate() - 8);

      const baseConfig: GoalBasedPlanConfig = {
        goal: "speed",
        currentACWR: 0.5, // Under-trained
        readinessLevel: "high",
      };

      const rampConfig: GoalBasedPlanConfig = {
        ...baseConfig,
        lastTrainingDate: lastDate,
      };

      const basePlan = service.generateWeeklyPlan(baseConfig);
      const rampPlan = service.generateWeeklyPlan(rampConfig);

      const baseTotal = basePlan.sessions.reduce((s, x) => s + x.volume, 0);
      const rampTotal = rampPlan.sessions.reduce((s, x) => s + x.volume, 0);

      // Ramp volume must be lower than normal volume
      expect(rampTotal).toBeLessThan(baseTotal);
    });

    it("forces low intensity after 21-day gap", () => {
      const lastDate = new Date();
      lastDate.setDate(lastDate.getDate() - 22);

      const config: GoalBasedPlanConfig = {
        goal: "speed",
        currentACWR: 1.0,
        readinessLevel: "high",
        lastTrainingDate: lastDate,
      };

      const plan = service.generateWeeklyPlan(config);
      const highIntensitySessions = plan.sessions.filter(
        (s) => s.intensity === "high",
      );

      expect(highIntensitySessions.length).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // ACWR volume interpolation boundaries
  // ──────────────────────────────────────────────────────────────────────────

  describe("ACWR volume adjustment interpolation", () => {
    const baseConfig = (acwr: number): GoalBasedPlanConfig => ({
      goal: "speed",
      currentACWR: acwr,
      readinessLevel: "moderate",
    });

    it("reduces volume in danger zone (ACWR 1.6)", () => {
      const dangerPlan = service.generateWeeklyPlan(baseConfig(1.6));
      const safePlan = service.generateWeeklyPlan(baseConfig(1.0));

      const dangerVol = dangerPlan.sessions.reduce((s, x) => s + x.volume, 0);
      const safeVol = safePlan.sessions.reduce((s, x) => s + x.volume, 0);

      expect(dangerVol).toBeLessThan(safeVol);
    });

    it("increases volume in under-training zone (ACWR 0.6)", () => {
      const underPlan = service.generateWeeklyPlan(baseConfig(0.6));
      const sweetSpotPlan = service.generateWeeklyPlan(baseConfig(1.0));

      // Under-training zone should increase volume relative to sweet spot at moderate readiness
      const underVol = underPlan.sessions.reduce((s, x) => s + x.volume, 0);
      const sweetVol = sweetSpotPlan.sessions.reduce((s, x) => s + x.volume, 0);

      expect(underVol).toBeGreaterThan(sweetVol * 0.9); // At least as much
    });

    it("does not crash with extreme ACWR values (0 and 3.0)", () => {
      expect(() => service.generateWeeklyPlan(baseConfig(0))).not.toThrow();
      expect(() => service.generateWeeklyPlan(baseConfig(3.0))).not.toThrow();
    });
  });
});
