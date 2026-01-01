/**
 * Nutrition Service Unit Tests
 *
 * Comprehensive test coverage for nutrition tracking service.
 * Tests food logging, macro calculations, and meal management.
 *
 * @version 1.0.0
 */

import { TestBed } from "@angular/core/testing";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { of, firstValueFrom } from "rxjs";
import {
  NutritionService,
  NutritionGoal,
  USDAFood,
  Meal,
} from "./nutrition.service";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { RealtimeService } from "./realtime.service";

// Mock data
const MOCK_USDA_FOOD: USDAFood = {
  fdcId: 12345,
  description: "Chicken Breast, Grilled",
  foodCategory: "Poultry",
  energy: 165,
  protein: 31,
  carbohydrates: 0,
  fat: 3.6,
  fiber: 0,
  sugars: 0,
  sodium: 74,
};

const MOCK_NUTRITION_LOG = {
  id: 1,
  user_id: "user-123",
  food_name: "Chicken Breast",
  food_id: 12345,
  calories: 165,
  protein: 31,
  carbohydrates: 0,
  fat: 3.6,
  fiber: 0,
  logged_at: new Date().toISOString(),
  meal_type: "lunch",
};

const MOCK_NUTRITION_GOALS = {
  id: 1,
  user_id: "user-123",
  calories_target: 2500,
  protein_target: 150,
  carbs_target: 300,
  fat_target: 80,
};

// Mock services - use 'as any' to avoid strict type checking issues with mock implementations
const mockSupabaseService = {
  userId: vi.fn(() => "user-123"),
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
          gte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: MOCK_NUTRITION_LOG, error: null }),
          ),
        })),
      })),
    })) as ReturnType<typeof vi.fn>,
    functions: {
      invoke: vi.fn(),
    },
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

describe("NutritionService", () => {
  let service: NutritionService;

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        NutritionService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: RealtimeService, useValue: mockRealtimeService },
      ],
    });

    service = TestBed.inject(NutritionService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  describe("Initial State", () => {
    it("should initialize with empty meals", () => {
      expect(service.todaysMeals()).toEqual([]);
    });

    it("should initialize with empty nutrition goals", () => {
      expect(service.nutritionGoals()).toEqual([]);
    });

    it("should have computed totals at zero", () => {
      expect(service.totalCaloriesToday()).toBe(0);
      expect(service.totalProteinToday()).toBe(0);
      expect(service.totalCarbsToday()).toBe(0);
      expect(service.totalFatToday()).toBe(0);
    });
  });

  // ============================================================================
  // Food Search Tests
  // ============================================================================

  describe("Food Search (USDA/Edamam)", () => {
    it("should search foods successfully", async () => {
      const mockFoods = [
        {
          fdcId: 1,
          description: "Chicken Breast",
          nutrients: { calories: 165, protein: 31, carbohydrates: 0, fat: 3.6 },
        },
        {
          fdcId: 2,
          description: "Chicken Thigh",
          nutrients: {
            calories: 209,
            protein: 26,
            carbohydrates: 0,
            fat: 10.9,
          },
        },
      ];

      (mockSupabaseService as any).client.functions.invoke.mockResolvedValue({
        data: { success: true, data: mockFoods },
        error: null,
      });

      const results = await firstValueFrom(service.searchUSDAFoods("chicken"));

      expect(results.length).toBe(2);
      expect(results[0].description).toBe("Chicken Breast");
      expect(results[0].protein).toBe(31);
    });

    it("should return empty array for empty query", async () => {
      const results = await firstValueFrom(service.searchUSDAFoods(""));
      expect(results).toEqual([]);
    });

    it("should return empty array for whitespace query", async () => {
      const results = await firstValueFrom(service.searchUSDAFoods("   "));
      expect(results).toEqual([]);
    });

    it("should handle search error gracefully", async () => {
      (mockSupabaseService as any).client.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: "API error" },
      });

      const results = await firstValueFrom(service.searchUSDAFoods("chicken"));
      expect(results).toEqual([]);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it("should handle empty search results", async () => {
      (mockSupabaseService as any).client.functions.invoke.mockResolvedValue({
        data: { success: true, data: [] },
        error: null,
      });

      const results = await firstValueFrom(
        service.searchUSDAFoods("xyznonexistent"),
      );
      expect(results).toEqual([]);
    });

    it("should paginate search results", async () => {
      (mockSupabaseService as any).client.functions.invoke.mockResolvedValue({
        data: { success: true, data: [] },
        error: null,
      });

      await firstValueFrom(service.searchUSDAFoods("chicken", 50, 2));

      expect(
        (mockSupabaseService as any).client.functions.invoke,
      ).toHaveBeenCalledWith("search-foods-edamam", {
        body: {
          query: "chicken",
          pageSize: 50,
          pageNumber: 2,
        },
      });
    });
  });

  // ============================================================================
  // Add Food Tests
  // ============================================================================

  describe("Add Food to Meal", () => {
    it("should add USDA food to current meal", async () => {
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { id: 1 }, error: null }),
          ),
        })),
      }));

      (mockSupabaseService as any).client.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await firstValueFrom(
        service.addFoodToCurrentMeal(MOCK_USDA_FOOD),
      );

      expect(result).toBe(true);
      expect(mockLoggerService.success).toHaveBeenCalled();
    });

    it("should add custom food to current meal", async () => {
      const customFood = {
        name: "Homemade Smoothie",
        calories: 250,
        protein: 15,
        carbs: 30,
        fat: 8,
      };

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { id: 2 }, error: null }),
          ),
        })),
      }));

      (mockSupabaseService as any).client.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await firstValueFrom(
        service.addFoodToCurrentMeal(customFood),
      );

      expect(result).toBe(true);
    });

    it("should return false when not logged in", async () => {
      (mockSupabaseService as any).userId.mockReturnValue(null);

      const result = await firstValueFrom(
        service.addFoodToCurrentMeal(MOCK_USDA_FOOD),
      );

      expect(result).toBe(false);
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it("should handle database error when adding food", async () => {
      (mockSupabaseService as any).client.from.mockReturnValue({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: null, error: { message: "DB error" } }),
            ),
          })),
        })),
      });

      const result = await firstValueFrom(
        service.addFoodToCurrentMeal(MOCK_USDA_FOOD),
      );

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // Meal Type Detection Tests
  // ============================================================================

  describe("Meal Type Detection", () => {
    it("should detect breakfast before 11am", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T09:00:00"));

      // Access private method via any cast
      const mealType = (service as any).getMealTypeFromTime();
      expect(mealType).toBe("breakfast");

      vi.useRealTimers();
    });

    it("should detect lunch between 11am and 3pm", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T13:00:00"));

      const mealType = (service as any).getMealTypeFromTime();
      expect(mealType).toBe("lunch");

      vi.useRealTimers();
    });

    it("should detect snack between 3pm and 6pm", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T16:00:00"));

      const mealType = (service as any).getMealTypeFromTime();
      expect(mealType).toBe("snack");

      vi.useRealTimers();
    });

    it("should detect dinner after 6pm", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-01-15T19:00:00"));

      const mealType = (service as any).getMealTypeFromTime();
      expect(mealType).toBe("dinner");

      vi.useRealTimers();
    });
  });

  // ============================================================================
  // Nutrition Goals Tests
  // ============================================================================

  describe("Nutrition Goals", () => {
    it("should return default goals when not logged in", async () => {
      (mockSupabaseService as any).userId.mockReturnValue(null);

      const goals = await firstValueFrom(service.getDailyNutritionGoals());

      expect(goals.length).toBe(4);
      expect(goals[0].nutrient).toBe("Calories");
      expect(goals[0].target).toBe(2500);
    });

    it("should have correct default values", async () => {
      (mockSupabaseService as any).userId.mockReturnValue(null);

      const goals = await firstValueFrom(service.getDailyNutritionGoals());

      const caloriesGoal = goals.find((g) => g.nutrient === "Calories");
      const proteinGoal = goals.find((g) => g.nutrient === "Protein");
      const carbsGoal = goals.find((g) => g.nutrient === "Carbs");
      const fatGoal = goals.find((g) => g.nutrient === "Fat");

      expect(caloriesGoal?.target).toBe(2500);
      expect(proteinGoal?.target).toBe(150);
      expect(carbsGoal?.target).toBe(300);
      expect(fatGoal?.target).toBe(80);
    });

    it("should set correct priorities", async () => {
      (mockSupabaseService as any).userId.mockReturnValue(null);

      const goals = await firstValueFrom(service.getDailyNutritionGoals());

      const caloriesGoal = goals.find((g) => g.nutrient === "Calories");
      const proteinGoal = goals.find((g) => g.nutrient === "Protein");
      const carbsGoal = goals.find((g) => g.nutrient === "Carbs");

      expect(caloriesGoal?.priority).toBe("high");
      expect(proteinGoal?.priority).toBe("high");
      expect(carbsGoal?.priority).toBe("medium");
    });
  });

  // ============================================================================
  // Nutrient Sources Tests
  // ============================================================================

  describe("Nutrient Sources", () => {
    it("should return protein sources", () => {
      const sources = service.getNutrientSources("protein");

      expect(sources).toContain("Chicken Breast");
      expect(sources).toContain("Greek Yogurt");
      expect(sources).toContain("Eggs");
    });

    it("should return vitamin C sources", () => {
      const sources = service.getNutrientSources("vitamin C");

      expect(sources).toContain("Oranges");
      expect(sources).toContain("Bell Peppers");
    });

    it("should return calcium sources", () => {
      const sources = service.getNutrientSources("calcium");

      expect(sources).toContain("Milk");
      expect(sources).toContain("Cheese");
    });

    it("should return iron sources", () => {
      const sources = service.getNutrientSources("iron");

      expect(sources).toContain("Spinach");
      expect(sources).toContain("Red Meat");
    });

    it("should return fiber sources", () => {
      const sources = service.getNutrientSources("fiber");

      expect(sources).toContain("Oats");
      expect(sources).toContain("Beans");
    });

    it("should return omega3 sources", () => {
      const sources = service.getNutrientSources("omega3");

      expect(sources).toContain("Salmon");
      expect(sources).toContain("Walnuts");
    });

    it("should return default for unknown nutrient", () => {
      const sources = service.getNutrientSources("unknownnutrient");

      expect(sources).toEqual(["Various foods"]);
    });

    it("should be case insensitive", () => {
      const sources1 = service.getNutrientSources("PROTEIN");
      const sources2 = service.getNutrientSources("Protein");
      const sources3 = service.getNutrientSources("protein");

      expect(sources1).toEqual(sources2);
      expect(sources2).toEqual(sources3);
    });
  });

  // ============================================================================
  // Computed Totals Tests
  // ============================================================================

  describe("Computed Totals", () => {
    it("should calculate total calories correctly", () => {
      // Manually set meals via internal signal
      const meals: Meal[] = [
        {
          id: "1",
          type: "breakfast",
          timestamp: new Date(),
          totalCalories: 400,
          carbs: 50,
          protein: 20,
          fat: 15,
          foods: [],
        },
        {
          id: "2",
          type: "lunch",
          timestamp: new Date(),
          totalCalories: 600,
          carbs: 70,
          protein: 35,
          fat: 20,
          foods: [],
        },
      ];

      // Access private signal
      (service as any)._todaysMeals.set(meals);

      expect(service.totalCaloriesToday()).toBe(1000);
    });

    it("should calculate total protein correctly", () => {
      const meals: Meal[] = [
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
      ];

      (service as any)._todaysMeals.set(meals);

      expect(service.totalProteinToday()).toBe(65);
    });

    it("should calculate total carbs correctly", () => {
      const meals: Meal[] = [
        {
          id: "1",
          type: "breakfast",
          timestamp: new Date(),
          totalCalories: 400,
          carbs: 60,
          protein: 20,
          fat: 15,
          foods: [],
        },
        {
          id: "2",
          type: "lunch",
          timestamp: new Date(),
          totalCalories: 600,
          carbs: 80,
          protein: 35,
          fat: 20,
          foods: [],
        },
      ];

      (service as any)._todaysMeals.set(meals);

      expect(service.totalCarbsToday()).toBe(140);
    });

    it("should calculate total fat correctly", () => {
      const meals: Meal[] = [
        {
          id: "1",
          type: "breakfast",
          timestamp: new Date(),
          totalCalories: 400,
          carbs: 50,
          protein: 20,
          fat: 18,
          foods: [],
        },
        {
          id: "2",
          type: "lunch",
          timestamp: new Date(),
          totalCalories: 600,
          carbs: 70,
          protein: 35,
          fat: 22,
          foods: [],
        },
      ];

      (service as any)._todaysMeals.set(meals);

      expect(service.totalFatToday()).toBe(40);
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle food with missing nutrients", async () => {
      // Reset userId mock to return valid user
      (mockSupabaseService as any).userId.mockReturnValue("user-123");

      const incompleteFood: Partial<USDAFood> = {
        fdcId: 99999,
        description: "Unknown Food",
        // Missing all nutrient values
      };

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({ data: { id: 1 }, error: null }),
          ),
        })),
      }));

      (mockSupabaseService as any).client.from.mockReturnValue({
        insert: mockInsert,
      });

      const result = await firstValueFrom(
        service.addFoodToCurrentMeal(incompleteFood as USDAFood),
      );

      expect(result).toBe(true);
    });

    it("should handle empty meals array for totals", () => {
      (service as any)._todaysMeals.set([]);

      expect(service.totalCaloriesToday()).toBe(0);
      expect(service.totalProteinToday()).toBe(0);
      expect(service.totalCarbsToday()).toBe(0);
      expect(service.totalFatToday()).toBe(0);
    });
  });
});
