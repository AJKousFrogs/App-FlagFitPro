/**
 * Wellness Service Unit Tests
 *
 * Comprehensive test coverage for wellness tracking service.
 * Tests wellness logging, score calculations, and recommendations.
 *
 * @version 1.0.0
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { firstValueFrom } from "rxjs";
import { WellnessService, WellnessData } from "./wellness.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { RealtimeService } from "./realtime.service";
import { NORMAL_ATHLETE } from "../../../testing/athlete-fixtures";

// Mock data
const MOCK_WELLNESS_ENTRY: WellnessData = {
  id: 1,
  userId: "user-123",
  date: "2024-01-15",
  sleep: 8,
  energy: 7,
  stress: 3,
  soreness: 2,
  motivation: 8,
  mood: 7,
  hydration: 8,
  notes: "Feeling good today",
};

const MOCK_WELLNESS_ENTRIES: WellnessData[] = [
  MOCK_WELLNESS_ENTRY,
  {
    id: 2,
    userId: "user-123",
    date: "2024-01-14",
    sleep: 7,
    energy: 6,
    stress: 4,
    soreness: 3,
    motivation: 7,
    mood: 6,
    hydration: 7,
  },
  {
    id: 3,
    userId: "user-123",
    date: "2024-01-13",
    sleep: 6,
    energy: 5,
    stress: 5,
    soreness: 4,
    motivation: 6,
    mood: 5,
    hydration: 6,
  },
];

// Mock services - use 'as unknown as SupabaseService' to avoid strict type checking
const mockSupabaseService = {
  userId: vi.fn(() => "user-123"),
  waitForInit: vi.fn(() => Promise.resolve()),
  client: {
    rpc: vi.fn(() =>
      Promise.resolve({
        data: [{ checkin_id: "c1", legacy_entry_id: null, checkin_date: "2024-01-15" }],
        error: null,
      }),
    ),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({ data: MOCK_WELLNESS_ENTRIES, error: null }),
            ),
          })),
        })),
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() =>
              Promise.resolve({ data: MOCK_WELLNESS_ENTRIES, error: null }),
            ),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: MOCK_WELLNESS_ENTRY, error: null }),
          ),
        })),
      })),
    })) as ReturnType<typeof vi.fn>,
  },
} as unknown as SupabaseService;

const mockLoggerService = {
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  success: vi.fn(),
};

const mockRealtimeService = {
  subscribe: vi.fn(() => vi.fn()),
  unsubscribe: vi.fn(),
};

describe("WellnessService", () => {
  let service: WellnessService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        WellnessService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: RealtimeService, useValue: mockRealtimeService },
      ],
    });

    service = TestBed.inject(WellnessService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  describe("Initial State", () => {
    it("should initialize with empty wellness data", () => {
      expect(service.wellnessData()).toEqual([]);
    });

    it("should initialize with null averages", () => {
      expect(service.averages()).toBeNull();
    });

    it("should have hasWellnessData as false initially", () => {
      expect(service.hasWellnessData()).toBe(false);
    });

    it("should have latestWellnessEntry as null initially", () => {
      expect(service.latestWellnessEntry()).toBeNull();
    });
  });

  // ============================================================================
  // Wellness Score Calculation Tests
  // ============================================================================

  describe("Wellness Score Calculation", () => {
    it("should calculate wellness score correctly", () => {
      const score = service.getWellnessScore(MOCK_WELLNESS_ENTRY);

      // Expected: (8 + 7 + (10-3) + (10-2) + 8 + 7 + 8) / 7 = 7.57
      expect(score).toBeGreaterThan(7);
      expect(score).toBeLessThan(8);
    });

    it("should invert stress in score calculation", () => {
      const highStressEntry: WellnessData = {
        ...MOCK_WELLNESS_ENTRY,
        stress: 9, // High stress
      };

      const lowStressEntry: WellnessData = {
        ...MOCK_WELLNESS_ENTRY,
        stress: 1, // Low stress
      };

      const highStressScore = service.getWellnessScore(highStressEntry);
      const lowStressScore = service.getWellnessScore(lowStressEntry);

      // Low stress should result in higher score
      expect(lowStressScore).toBeGreaterThan(highStressScore);
    });

    it("should invert soreness in score calculation", () => {
      const highSorenessEntry: WellnessData = {
        ...MOCK_WELLNESS_ENTRY,
        soreness: 9, // High soreness
      };

      const lowSorenessEntry: WellnessData = {
        ...MOCK_WELLNESS_ENTRY,
        soreness: 1, // Low soreness
      };

      const highSorenessScore = service.getWellnessScore(highSorenessEntry);
      const lowSorenessScore = service.getWellnessScore(lowSorenessEntry);

      // Low soreness should result in higher score
      expect(lowSorenessScore).toBeGreaterThan(highSorenessScore);
    });

    it("should handle missing metrics", () => {
      const partialEntry: WellnessData = {
        date: "2024-01-15",
        sleep: 8,
        energy: 7,
        // Other metrics undefined
      };

      const score = service.getWellnessScore(partialEntry);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(10);
    });

    it("should return 0 for entry with no metrics", () => {
      const emptyEntry: WellnessData = {
        date: "2024-01-15",
      };

      const score = service.getWellnessScore(emptyEntry);
      expect(score).toBe(0);
    });

    it("should match fixture A wellness score example", () => {
      const fixtureEntry = NORMAL_ATHLETE.wellness[0];
      const data: WellnessData = {
        date: fixtureEntry.date,
        sleep: fixtureEntry.sleep ?? undefined,
        energy: fixtureEntry.energy ?? undefined,
        stress: fixtureEntry.stress ?? undefined,
        soreness: fixtureEntry.soreness ?? undefined,
        mood: fixtureEntry.mood ?? undefined,
        hydration: fixtureEntry.hydration ?? undefined,
      };

      const score = service.getWellnessScore(data);

      // Example in CALCULATION_SPEC.md → 7.3
      expect(score).toBe(7.3);
    });
  });

  // ============================================================================
  // Wellness Status Tests
  // ============================================================================

  describe("Wellness Status", () => {
    it("should return excellent status for score >= 8", () => {
      const status = service.getWellnessStatus(8.5);

      expect(status.status).toBe("excellent");
      expect(status.color).toBe("var(--p-highlight-text-color)"); // design token
      expect(status.message).toContain("excellent");
    });

    it("should return good status for score 6-8", () => {
      const status = service.getWellnessStatus(7);

      expect(status.status).toBe("good");
      expect(status.color).toBe("var(--color-chart-tertiary)"); // design token
    });

    it("should return fair status for score 4-6", () => {
      const status = service.getWellnessStatus(5);

      expect(status.status).toBe("fair");
      expect(status.color).toBe("var(--color-chart-quaternary)"); // design token
      expect(status.message).toContain("attention");
    });

    it("should return poor status for score < 4", () => {
      const status = service.getWellnessStatus(2);

      expect(status.status).toBe("poor");
      expect(status.color).toBe("var(--color-chart-quinary)"); // design token
      expect(status.message).toContain("concerning");
    });

    it("should handle boundary values", () => {
      expect(service.getWellnessStatus(8).status).toBe("excellent");
      expect(service.getWellnessStatus(6).status).toBe("good");
      expect(service.getWellnessStatus(4).status).toBe("fair");
      expect(service.getWellnessStatus(3.9).status).toBe("poor");
    });
  });

  // ============================================================================
  // Wellness Averages Tests
  // ============================================================================

  describe("Wellness Averages", () => {
    it("should calculate averages from fixture data", () => {
      const fixtureData: WellnessData[] = NORMAL_ATHLETE.wellness.map(
        (entry) => ({
          date: entry.date,
          sleep: entry.sleep ?? undefined,
          energy: entry.energy ?? undefined,
          stress: entry.stress ?? undefined,
          soreness: entry.soreness ?? undefined,
          mood: entry.mood ?? undefined,
          hydration: entry.hydration ?? undefined,
        }),
      );

      const averages = (service as any).calculateAverages(fixtureData);

      expect(averages.sleep).toBe(7.5);
      expect(averages.energy).toBe(7.0);
      expect(averages.stress).toBe(3.7);
      expect(averages.soreness).toBe(3.5);
      expect(averages.mood).toBe(7.0);
      expect(averages.hydration).toBe(7.5);
    });
  });

  // ============================================================================
  // Recommendations Tests
  // ============================================================================

  describe("Recommendations", () => {
    it("should recommend sleep improvement for low sleep", () => {
      const entry: WellnessData = {
        date: "2024-01-15",
        sleep: 4,
      };

      const recommendations = service.getRecommendations(entry);

      expect(
        recommendations.some((r) => r.toLowerCase().includes("sleep")),
      ).toBe(true);
    });

    it("should recommend rest for low energy", () => {
      const entry: WellnessData = {
        date: "2024-01-15",
        energy: 3,
      };

      const recommendations = service.getRecommendations(entry);

      expect(
        recommendations.some((r) => r.toLowerCase().includes("rest")),
      ).toBe(true);
    });

    it("should recommend stress management for high stress", () => {
      const entry: WellnessData = {
        date: "2024-01-15",
        stress: 9,
      };

      const recommendations = service.getRecommendations(entry);

      expect(
        recommendations.some((r) => r.toLowerCase().includes("stress")),
      ).toBe(true);
    });

    it("should recommend recovery for high soreness", () => {
      const entry: WellnessData = {
        date: "2024-01-15",
        soreness: 9,
      };

      const recommendations = service.getRecommendations(entry);

      expect(
        recommendations.some((r) => r.toLowerCase().includes("recovery")),
      ).toBe(true);
    });

    it("should recommend hydration for low hydration", () => {
      const entry: WellnessData = {
        date: "2024-01-15",
        hydration: 4,
      };

      const recommendations = service.getRecommendations(entry);

      expect(
        recommendations.some((r) => r.toLowerCase().includes("water")),
      ).toBe(true);
    });

    it("should recommend training variation for low motivation", () => {
      const entry: WellnessData = {
        date: "2024-01-15",
        motivation: 3,
      };

      const recommendations = service.getRecommendations(entry);

      expect(
        recommendations.some((r) => r.toLowerCase().includes("training")),
      ).toBe(true);
    });

    it("should return positive message for good wellness", () => {
      const entry: WellnessData = {
        date: "2024-01-15",
        sleep: 9,
        energy: 9,
        stress: 2,
        soreness: 1,
        motivation: 9,
        mood: 9,
        hydration: 9,
      };

      const recommendations = service.getRecommendations(entry);

      expect(
        recommendations.some((r) => r.toLowerCase().includes("keep up")),
      ).toBe(true);
    });
  });

  // ============================================================================
  // Wellness Trends Tests
  // ============================================================================

  describe("Wellness Trends", () => {
    it("should return empty trends for insufficient data", () => {
      const trends = service.getWellnessTrends([MOCK_WELLNESS_ENTRY]);
      expect(trends).toEqual([]);
    });

    it("should calculate improving trend", () => {
      const improvingData: WellnessData[] = [
        { date: "2024-01-15", sleep: 9 },
        { date: "2024-01-14", sleep: 8 },
        { date: "2024-01-13", sleep: 7 },
        { date: "2024-01-12", sleep: 6 },
        { date: "2024-01-11", sleep: 5 },
        { date: "2024-01-10", sleep: 4 },
      ];

      const trends = service.getWellnessTrends(improvingData);
      const sleepTrend = trends.find((t) => t.metric === "sleep");

      expect(sleepTrend?.trend).toBe("improving");
    });

    it("should calculate declining trend", () => {
      const decliningData: WellnessData[] = [
        { date: "2024-01-15", energy: 4 },
        { date: "2024-01-14", energy: 5 },
        { date: "2024-01-13", energy: 6 },
        { date: "2024-01-12", energy: 7 },
        { date: "2024-01-11", energy: 8 },
        { date: "2024-01-10", energy: 9 },
      ];

      const trends = service.getWellnessTrends(decliningData);
      const energyTrend = trends.find((t) => t.metric === "energy");

      expect(energyTrend?.trend).toBe("declining");
    });

    it("should calculate stable trend", () => {
      const stableData: WellnessData[] = [
        { date: "2024-01-15", mood: 7 },
        { date: "2024-01-14", mood: 7 },
        { date: "2024-01-13", mood: 7 },
        { date: "2024-01-12", mood: 7 },
        { date: "2024-01-11", mood: 7 },
        { date: "2024-01-10", mood: 7 },
      ];

      const trends = service.getWellnessTrends(stableData);
      const moodTrend = trends.find((t) => t.metric === "mood");

      expect(moodTrend?.trend).toBe("stable");
    });

    it("should invert stress trend (lower is better)", () => {
      // Stress going down = improving
      const improvingStressData: WellnessData[] = [
        { date: "2024-01-15", stress: 2 },
        { date: "2024-01-14", stress: 3 },
        { date: "2024-01-13", stress: 4 },
        { date: "2024-01-12", stress: 5 },
        { date: "2024-01-11", stress: 6 },
        { date: "2024-01-10", stress: 7 },
      ];

      const trends = service.getWellnessTrends(improvingStressData);
      const stressTrend = trends.find((t) => t.metric === "stress");

      expect(stressTrend?.trend).toBe("improving");
    });
  });

  // ============================================================================
  // Timeframe Parsing Tests
  // ============================================================================

  describe("Timeframe Parsing", () => {
    it("should parse days correctly", () => {
      const days = (service as any).parseTimeframe("7d");
      expect(days).toBe(7);
    });

    it("should parse weeks correctly", () => {
      const days = (service as any).parseTimeframe("2w");
      expect(days).toBe(14);
    });

    it("should parse months correctly", () => {
      const days = (service as any).parseTimeframe("3m");
      expect(days).toBe(90);
    });

    it("should parse years correctly", () => {
      const days = (service as any).parseTimeframe("1y");
      expect(days).toBe(365);
    });

    it("should default to 30 days for invalid format", () => {
      const days = (service as any).parseTimeframe("invalid");
      expect(days).toBe(30);
    });

    it("should default to 30 days for empty string", () => {
      const days = (service as any).parseTimeframe("");
      expect(days).toBe(30);
    });
  });

  // ============================================================================
  // Log Wellness Tests
  // ============================================================================

  describe("Log Wellness", () => {
    it("should log wellness entry successfully", async () => {
      const result = await firstValueFrom(
        service.logWellness({
          sleep: 8,
          energy: 7,
          stress: 3,
        }),
      );

      expect(result.success).toBe(true);
      expect(mockSupabaseService.client.rpc).toHaveBeenCalled();
    });

    it("should return error when not logged in", async () => {
      (mockSupabaseService as any).userId.mockReturnValue(null);

      const result = await firstValueFrom(
        service.logWellness({
          sleep: 8,
        }),
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not authenticated");
    });

    it("should use today's date by default", async () => {
      const today = new Date().toISOString().split("T")[0];

      // Reset userId to valid user
      (mockSupabaseService as any).userId.mockReturnValue("user-123");

      await firstValueFrom(service.logWellness({ sleep: 8 }));

      expect(mockSupabaseService.client.rpc).toHaveBeenCalled();
      const call = (mockSupabaseService.client.rpc as ReturnType<typeof vi.fn>).mock
        .calls[0];
      expect(call[1]).toMatchObject({
        p_checkin_date: today,
      });
    });

    it("should forward motivation, mood, hydration, and readiness fields", async () => {
      await firstValueFrom(
        service.logWellness({
          sleep: 8,
          sleepHours: 7.5,
          energy: 7,
          stress: 3,
          soreness: 2,
          motivation: 9,
          mood: 8,
          hydration: 6,
          readinessScore: 82,
        }),
      );

      const call = (mockSupabaseService.client.rpc as ReturnType<typeof vi.fn>).mock
        .calls[0];
      expect(call[1]).toMatchObject({
        p_sleep_quality: 8,
        p_sleep_hours: 7.5,
        p_energy_level: 7,
        p_stress_level: 3,
        p_muscle_soreness: 2,
        p_motivation_level: 9,
        p_mood: 8,
        p_hydration_level: 6,
        p_calculated_readiness: 82,
      });
    });

    it("calculateAcwr returns ratio from RPC", async () => {
      const rpc = mockSupabaseService.client.rpc as ReturnType<typeof vi.fn>;
      const defaultImpl = () =>
        Promise.resolve({
          data: [{ checkin_id: "c1", legacy_entry_id: null, checkin_date: "2024-01-15" }],
          error: null,
        });
      rpc.mockImplementation((name: string) => {
        if (name === "calculate_acwr") {
          return Promise.resolve({
            data: {
              acute_load: 100,
              chronic_load: 100,
              ratio: 1.0,
              sufficient: true,
              days_with_data: 22,
              sessions_in_window: 14,
              computed_at: "2026-01-01T00:00:00.000Z",
            },
            error: null,
          });
        }
        return defaultImpl();
      });

      const result = await firstValueFrom(service.calculateAcwr());
      expect(result.success).toBe(true);
      expect(result.data?.ratio).toBe(1.0);
      expect(mockSupabaseService.client.rpc).toHaveBeenCalledWith(
        "calculate_acwr",
        { p_user_id: "user-123" },
      );
      rpc.mockImplementation(defaultImpl);
    });
  });

  describe("Wellness Data Loading", () => {
    it("maps extended daily_wellness_checkin fields from the database", async () => {
      mockSupabaseService.client.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({
                  data: [
                    {
                      id: 10,
                      user_id: "user-123",
                      checkin_date: "2024-01-15",
                      sleep_quality: 8,
                      sleep_hours: 7.5,
                      energy_level: 7,
                      stress_level: 3,
                      muscle_soreness: 2,
                      motivation_level: 9,
                      mood: 8,
                      hydration_level: 6,
                      calculated_readiness: 82,
                      notes: "Ready to train",
                      created_at: "2024-01-15T06:00:00.000Z",
                    },
                  ],
                  error: null,
                }),
              ),
            })),
          })),
        })),
      });

      const response = await firstValueFrom(service.getWellnessData("7d"));

      expect(response.success).toBe(true);
      expect(response.data[0]).toMatchObject({
        sleep: 8,
        sleepHours: 7.5,
        energy: 7,
        stress: 3,
        soreness: 2,
        motivation: 9,
        mood: 8,
        hydration: 6,
        readinessScore: 82,
      });
    });
  });

  // ============================================================================
  // Averages Calculation Tests
  // ============================================================================

  describe("Averages Calculation", () => {
    it("should calculate averages correctly", () => {
      const averages = (service as any).calculateAverages(
        MOCK_WELLNESS_ENTRIES,
      );

      expect(averages.sleep).toBeDefined();
      expect(averages.energy).toBeDefined();
      expect(averages.stress).toBeDefined();
    });

    it("should return empty object for empty data", () => {
      const averages = (service as any).calculateAverages([]);
      expect(averages).toEqual({});
    });

    it("should handle partial data", () => {
      const partialData: WellnessData[] = [
        { date: "2024-01-15", sleep: 8 },
        { date: "2024-01-14", sleep: 6 },
      ];

      const averages = (service as any).calculateAverages(partialData);

      expect(averages.sleep).toBe(7);
      expect(averages.energy).toBeUndefined();
    });

    it("should round averages to one decimal place", () => {
      const data: WellnessData[] = [
        { date: "2024-01-15", sleep: 7 },
        { date: "2024-01-14", sleep: 8 },
        { date: "2024-01-13", sleep: 7 },
      ];

      const averages = (service as any).calculateAverages(data);

      // 22/3 = 7.333... should round to 7.3
      expect(averages.sleep).toBe(7.3);
    });
  });

  // ============================================================================
  // Cache Management Tests
  // ============================================================================

  describe("Cache Management", () => {
    it("should clear cache", () => {
      // Set some data first
      (service as any)._wellnessData.set(MOCK_WELLNESS_ENTRIES);
      (service as any)._averages.set({ sleep: 7 });

      service.clearCache();

      expect(service.wellnessData()).toEqual([]);
      expect(service.averages()).toBeNull();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle all metrics at maximum", () => {
      const maxEntry: WellnessData = {
        date: "2024-01-15",
        sleep: 10,
        energy: 10,
        stress: 1,
        soreness: 1,
        motivation: 10,
        mood: 10,
        hydration: 10,
      };

      const score = service.getWellnessScore(maxEntry);
      const status = service.getWellnessStatus(score);

      expect(status.status).toBe("excellent");
    });

    it("should handle all metrics at minimum", () => {
      const minEntry: WellnessData = {
        date: "2024-01-15",
        sleep: 1,
        energy: 1,
        stress: 10,
        soreness: 10,
        motivation: 1,
        mood: 1,
        hydration: 1,
      };

      const score = service.getWellnessScore(minEntry);
      const status = service.getWellnessStatus(score);

      expect(status.status).toBe("poor");
    });

    it("should handle zero values", () => {
      const zeroEntry: WellnessData = {
        date: "2024-01-15",
        sleep: 0,
        energy: 0,
      };

      const score = service.getWellnessScore(zeroEntry);
      expect(score).toBe(0);
    });
  });
});
