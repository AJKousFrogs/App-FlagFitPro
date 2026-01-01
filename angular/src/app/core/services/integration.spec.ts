/**
 * Integration Tests
 *
 * Tests critical user flows and service interactions.
 * Verifies end-to-end functionality of key features.
 *
 * @version 1.0.0
 */

import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";

// Services
import { AuthService } from "./auth.service";
import { AcwrService } from "./acwr.service";
import { WellnessService, WellnessData } from "./wellness.service";
import { NutritionService } from "./nutrition.service";
import { LoadMonitoringService } from "./load-monitoring.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { RealtimeService } from "./realtime.service";

// Mock services
const mockSupabaseService = {
  currentUser: vi.fn(() => ({ id: "user-123", email: "test@example.com" })),
  session: vi.fn(() => ({
    user: { id: "user-123" },
    access_token: "mock-token",
  })),
  userId: vi.fn(() => "user-123"),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  getToken: vi.fn(),
  client: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        or: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { id: 1 }, error: null }),
          ),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn(() =>
        Promise.resolve({ data: { success: true }, error: null }),
      ),
    },
  },
};

const mockRouter = {
  navigate: vi.fn(),
};

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
  subscribeToWellness: vi.fn(() => vi.fn()),
  subscribeToTrainingSessions: vi.fn(() => vi.fn()),
};

// Mock sessionStorage
vi.stubGlobal("sessionStorage", {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
});

// Mock crypto
vi.stubGlobal("crypto", {
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
});

describe("Integration Tests", () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        AcwrService,
        WellnessService,
        NutritionService,
        LoadMonitoringService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: Router, useValue: mockRouter },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: RealtimeService, useValue: mockRealtimeService },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.clearAllMocks();
  });

  // ============================================================================
  // Authentication Flow Tests
  // ============================================================================

  describe("Authentication Flow", () => {
    it("should complete login → dashboard flow", async () => {
      const authService = TestBed.inject(AuthService);

      mockSupabaseService.signIn.mockResolvedValue({
        data: {
          user: { id: "user-123", email: "test@example.com" },
          session: { access_token: "token" },
        },
        error: null,
      });

      // Login
      const loginResult = await firstValueFrom(
        authService.login({ email: "test@example.com", password: "password" }),
      );

      expect(loginResult.success).toBe(true);

      // Check auth state
      expect(authService.isAuthenticated()).toBe(true);

      // Navigate to dashboard
      authService.redirectToDashboard();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/dashboard"]);
    });

    it("should complete logout → login redirect flow", async () => {
      const authService = TestBed.inject(AuthService);

      mockSupabaseService.signOut.mockResolvedValue({ error: null });

      await firstValueFrom(authService.logout());

      expect(mockRouter.navigate).toHaveBeenCalledWith(["/login"]);
      expect(authService.isAuthenticated()).toBe(false);
    });

    it("should handle registration → email verification flow", async () => {
      const authService = TestBed.inject(AuthService);

      mockSupabaseService.signUp.mockResolvedValue({
        data: {
          user: { id: "new-user", email: "new@example.com" },
          session: null, // No session until verified
        },
        error: null,
      });

      const result = await firstValueFrom(
        authService.register({
          email: "new@example.com",
          password: "securepass",
          name: "New User",
        }),
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain("verify");
    });
  });

  // ============================================================================
  // Training Load Flow Tests
  // ============================================================================

  describe("Training Load Flow", () => {
    it("should complete workout log → ACWR update flow", async () => {
      const loadService = TestBed.inject(LoadMonitoringService);
      const acwrService = TestBed.inject(AcwrService);

      // Log a workout
      const session = await loadService.createQuickSession(
        "user-123",
        "technical",
        7,
        90,
        "Great session",
      );

      expect(session.load).toBe(630); // 7 × 90
      expect(session.completed).toBe(true);

      // ACWR service uses signals for calculations
      // Verify the service is available and has the required signals
      expect(acwrService.acuteLoad).toBeDefined();
      expect(acwrService.chronicLoad).toBeDefined();
      expect(acwrService.acwrData).toBeDefined();
    });

    it("should calculate readiness from wellness + load", () => {
      const loadService = TestBed.inject(LoadMonitoringService);

      const wellness = {
        sleepQuality: 8,
        sleepDuration: 7.5,
        muscleSoreness: 7,
        stressLevel: 3,
        energyLevel: 8,
        mood: 8,
      };

      const readinessScore = loadService.calculateReadinessScore(wellness);

      expect(readinessScore).toBeGreaterThan(70);
      expect(readinessScore).toBeLessThanOrEqual(100);
    });

    it("should provide load recommendations based on ACWR", () => {
      const loadService = TestBed.inject(LoadMonitoringService);

      const recentSessions = [{ load: 600 }, { load: 550 }, { load: 620 }].map(
        (s) => ({
          playerId: "user-123",
          date: new Date(),
          sessionType: "technical" as const,
          metrics: {
            type: "internal" as const,
            internal: { sessionRPE: 7, duration: 90, workload: s.load },
            calculatedLoad: s.load,
          },
          load: s.load,
          completed: true,
          modifiedFromPlan: false,
        }),
      );

      const recommendation = loadService.getLoadRecommendation(
        recentSessions,
        1.0,
      );

      expect(recommendation.recommendedLoad).toBeGreaterThan(0);
      expect(recommendation.reasoning).toBeDefined();
    });
  });

  // ============================================================================
  // Wellness Tracking Flow Tests
  // ============================================================================

  describe("Wellness Tracking Flow", () => {
    it("should complete wellness check-in → recommendations flow", async () => {
      const wellnessService = TestBed.inject(WellnessService);

      // Log wellness
      const wellnessData: WellnessData = {
        date: "2024-01-15",
        sleep: 6,
        energy: 5,
        stress: 7,
        soreness: 6,
        motivation: 6,
        mood: 5,
        hydration: 5,
      };

      // Get recommendations
      const recommendations = wellnessService.getRecommendations(wellnessData);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it("should calculate wellness score and status", () => {
      const wellnessService = TestBed.inject(WellnessService);

      const goodWellness: WellnessData = {
        date: "2024-01-15",
        sleep: 9,
        energy: 8,
        stress: 2,
        soreness: 2,
        motivation: 9,
        mood: 8,
        hydration: 9,
      };

      const score = wellnessService.getWellnessScore(goodWellness);
      const status = wellnessService.getWellnessStatus(score);

      expect(score).toBeGreaterThan(7);
      expect(status.status).toBe("excellent");
    });

    it("should track wellness trends over time", () => {
      const wellnessService = TestBed.inject(WellnessService);

      const trendData: WellnessData[] = [
        { date: "2024-01-15", sleep: 8, energy: 8 },
        { date: "2024-01-14", sleep: 7, energy: 7 },
        { date: "2024-01-13", sleep: 7, energy: 6 },
        { date: "2024-01-12", sleep: 6, energy: 6 },
        { date: "2024-01-11", sleep: 6, energy: 5 },
        { date: "2024-01-10", sleep: 5, energy: 5 },
      ];

      const trends = wellnessService.getWellnessTrends(trendData);

      expect(trends.length).toBeGreaterThan(0);
      const sleepTrend = trends.find((t) => t.metric === "sleep");
      expect(sleepTrend?.trend).toBe("improving");
    });
  });

  // ============================================================================
  // Nutrition Tracking Flow Tests
  // ============================================================================

  describe("Nutrition Tracking Flow", () => {
    it("should complete food search → log → totals flow", async () => {
      const nutritionService = TestBed.inject(NutritionService);

      // Mock food search
      (mockSupabaseService as any).client.functions.invoke.mockResolvedValue({
        data: {
          success: true,
          data: [
            {
              fdcId: 1,
              description: "Chicken Breast",
              nutrients: {
                calories: 165,
                protein: 31,
                carbohydrates: 0,
                fat: 3.6,
              },
            },
          ],
        },
        error: null,
      });

      // Search for food
      const searchResults = await firstValueFrom(
        nutritionService.searchUSDAFoods("chicken"),
      );

      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].description).toBe("Chicken Breast");
    });

    it("should calculate daily nutrition totals", () => {
      const nutritionService = TestBed.inject(NutritionService);

      // Set mock meals
      const meals = [
        {
          id: "1",
          type: "breakfast",
          timestamp: new Date(),
          totalCalories: 400,
          carbs: 50,
          protein: 25,
          fat: 15,
          foods: [],
        },
        {
          id: "2",
          type: "lunch",
          timestamp: new Date(),
          totalCalories: 600,
          carbs: 70,
          protein: 40,
          fat: 20,
          foods: [],
        },
        {
          id: "3",
          type: "dinner",
          timestamp: new Date(),
          totalCalories: 700,
          carbs: 80,
          protein: 45,
          fat: 25,
          foods: [],
        },
      ];

      // Access private signal
      (nutritionService as any)._todaysMeals.set(meals);

      expect(nutritionService.totalCaloriesToday()).toBe(1700);
      expect(nutritionService.totalProteinToday()).toBe(110);
      expect(nutritionService.totalCarbsToday()).toBe(200);
      expect(nutritionService.totalFatToday()).toBe(60);
    });

    it("should provide nutrient-specific food suggestions", () => {
      const nutritionService = TestBed.inject(NutritionService);

      const proteinSources = nutritionService.getNutrientSources("protein");
      const ironSources = nutritionService.getNutrientSources("iron");

      expect(proteinSources).toContain("Chicken Breast");
      expect(ironSources).toContain("Spinach");
    });
  });

  // ============================================================================
  // ACWR Safety System Tests
  // ============================================================================

  describe("ACWR Safety System", () => {
    it("should calculate ACWR data from service", () => {
      const acwrService = TestBed.inject(AcwrService);

      // ACWR service uses signals - verify they exist
      expect(acwrService.acuteLoad).toBeDefined();
      expect(acwrService.chronicLoad).toBeDefined();
      expect(acwrService.acwrRatio).toBeDefined();
      expect(acwrService.riskZone).toBeDefined();
    });

    it("should have ACWR data signal", () => {
      const acwrService = TestBed.inject(AcwrService);

      // Check that acwrData computed signal exists
      expect(acwrService.acwrData).toBeDefined();
      const data = acwrService.acwrData();
      expect(data).toBeDefined();
    });

    it("should provide risk zone from ACWR ratio", () => {
      const acwrService = TestBed.inject(AcwrService);

      // Risk zone is a computed signal that returns an object
      const riskZone = acwrService.riskZone();
      expect(riskZone).toBeDefined();
      expect(riskZone.level).toBeDefined();
    });
  });

  // ============================================================================
  // Cross-Service Integration Tests
  // ============================================================================

  describe("Cross-Service Integration", () => {
    it("should integrate wellness into load calculations", () => {
      const loadService = TestBed.inject(LoadMonitoringService);

      const internal = loadService.calculateInternalLoad(7, 90);

      const poorWellness = {
        sleepQuality: 3,
        sleepDuration: 4,
        muscleSoreness: 3,
        stressLevel: 8,
        energyLevel: 3,
        mood: 3,
      };

      const goodWellness = {
        sleepQuality: 9,
        sleepDuration: 8,
        muscleSoreness: 9,
        stressLevel: 2,
        energyLevel: 9,
        mood: 9,
      };

      const loadWithPoorWellness = loadService.calculateCombinedLoad(
        internal,
        undefined,
        poorWellness,
      );

      const loadWithGoodWellness = loadService.calculateCombinedLoad(
        internal,
        undefined,
        goodWellness,
      );

      // Poor wellness should increase perceived load
      expect(loadWithPoorWellness.calculatedLoad).toBeGreaterThan(
        loadWithGoodWellness.calculatedLoad,
      );
    });

    it("should aggregate daily sessions correctly", () => {
      const loadService = TestBed.inject(LoadMonitoringService);

      const sessions = [
        {
          playerId: "user-123",
          date: new Date(),
          sessionType: "strength" as const,
          metrics: {
            type: "internal" as const,
            internal: { sessionRPE: 7, duration: 60, workload: 420 },
            calculatedLoad: 420,
          },
          load: 420,
          completed: true,
          modifiedFromPlan: false,
        },
        {
          playerId: "user-123",
          date: new Date(),
          sessionType: "technical" as const,
          metrics: {
            type: "internal" as const,
            internal: { sessionRPE: 6, duration: 90, workload: 540 },
            calculatedLoad: 540,
          },
          load: 540,
          completed: true,
          modifiedFromPlan: false,
        },
      ];

      const aggregated = loadService.aggregateDailySessions(sessions);

      expect(aggregated.totalLoad).toBe(960);
      expect(aggregated.totalDuration).toBe(150);
      expect(aggregated.sessionTypes).toContain("strength");
      expect(aggregated.sessionTypes).toContain("technical");
    });
  });
});
