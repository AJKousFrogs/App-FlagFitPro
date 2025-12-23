import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { ApiService, API_ENDPOINTS } from "./api.service";

export interface NutritionGoal {
  nutrient: string;
  current: number;
  target: number;
  unit: string;
  priority: "high" | "medium" | "low";
}

export interface USDAFood {
  fdcId: number;
  description: string;
  foodCategory?: string;
  energy?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sugars?: number;
  sodium?: number;
  calcium?: number;
  iron?: number;
  vitaminC?: number;
  [key: string]: any;
}

export interface Meal {
  id: string;
  type: string;
  timestamp: Date;
  totalCalories: number;
  carbs: number;
  protein: number;
  fat: number;
  foods: MealFood[];
}

export interface MealFood {
  name: string;
  amount: number;
  unit: string;
  calories: number;
  nutrients: Record<string, number>;
}

export interface AINutritionSuggestion {
  name: string;
  benefit: string;
  priority: "high" | "medium" | "low";
  food: USDAFood;
  reason: string;
}

export interface PerformanceInsight {
  type: "positive" | "warning" | "negative";
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  action?: () => void;
}

@Injectable({
  providedIn: "root",
})
export class NutritionService {
  private apiService = inject(ApiService);

  /**
   * Search USDA FoodData Central database
   */
  searchUSDAFoods(query: string): Observable<USDAFood[]> {
    return this.apiService
      .get<USDAFood[]>(API_ENDPOINTS.nutrition.searchFoods, { query })
      .pipe(
        map((response) => response.data || []),
        catchError(() => {
          // Mock data for development
          return of(this.getMockUSDAFoods(query));
        }),
      );
  }

  /**
   * Add food to current meal
   */
  addFoodToCurrentMeal(food: USDAFood | any): Observable<boolean> {
    return this.apiService
      .post<boolean>(API_ENDPOINTS.nutrition.addFood, { food })
      .pipe(
        map((response) => response.success || false),
        catchError(() => of(false)),
      );
  }

  /**
   * Get daily nutrition goals
   */
  getDailyNutritionGoals(): Observable<NutritionGoal[]> {
    return this.apiService
      .get<NutritionGoal[]>(API_ENDPOINTS.nutrition.goals)
      .pipe(
        map((response) => response.data || []),
        catchError(() => {
          // Mock data for development
          return of(this.getMockNutritionGoals());
        }),
      );
  }

  /**
   * Get today's meals
   */
  getTodaysMeals(): Observable<Meal[]> {
    return this.apiService.get<Meal[]>(API_ENDPOINTS.nutrition.meals).pipe(
      map((response) => {
        const meals = response.data || [];
        // Convert timestamp strings to Date objects
        return meals.map((meal) => ({
          ...meal,
          timestamp: new Date(meal.timestamp),
        }));
      }),
      catchError(() => {
        // Mock data for development
        return of(this.getMockMeals());
      }),
    );
  }

  /**
   * Get AI-powered nutrition suggestions
   */
  getAINutritionSuggestions(): Observable<AINutritionSuggestion[]> {
    return this.apiService
      .get<AINutritionSuggestion[]>(API_ENDPOINTS.nutrition.aiSuggestions)
      .pipe(
        map((response) => response.data || []),
        catchError(() => {
          // Mock data for development
          return of(this.getMockAISuggestions());
        }),
      );
  }

  /**
   * Get performance insights based on nutrition data
   */
  getPerformanceInsights(): Observable<PerformanceInsight[]> {
    return this.apiService
      .get<PerformanceInsight[]>(API_ENDPOINTS.nutrition.performanceInsights)
      .pipe(
        map((response) => response.data || []),
        catchError(() => {
          // Mock data for development
          return of(this.getMockPerformanceInsights());
        }),
      );
  }

  /**
   * Get food sources rich in a specific nutrient
   */
  getNutrientSources(nutrient: string): string[] {
    const sources: Record<string, string[]> = {
      protein: ["Chicken Breast", "Greek Yogurt", "Eggs", "Salmon", "Lentils"],
      "vitamin C": [
        "Oranges",
        "Strawberries",
        "Bell Peppers",
        "Broccoli",
        "Kiwi",
      ],
      calcium: ["Milk", "Cheese", "Yogurt", "Sardines", "Almonds"],
      iron: ["Spinach", "Red Meat", "Lentils", "Quinoa", "Dark Chocolate"],
      fiber: ["Oats", "Apples", "Beans", "Whole Grains", "Avocado"],
      omega3: ["Salmon", "Walnuts", "Flaxseeds", "Chia Seeds", "Sardines"],
    };

    return sources[nutrient.toLowerCase()] || ["Various foods"];
  }

  // Mock data methods for development
  private getMockUSDAFoods(query: string): USDAFood[] {
    const mockFoods: USDAFood[] = [
      {
        fdcId: 1,
        description: "Grilled Chicken Breast",
        foodCategory: "Poultry",
        energy: 165,
        protein: 31,
        carbohydrates: 0,
        fat: 3.6,
      },
      {
        fdcId: 2,
        description: "Salmon, Atlantic, cooked",
        foodCategory: "Fish",
        energy: 206,
        protein: 22,
        carbohydrates: 0,
        fat: 12,
      },
      {
        fdcId: 3,
        description: "Greek Yogurt, plain",
        foodCategory: "Dairy",
        energy: 59,
        protein: 10,
        carbohydrates: 3.6,
        fat: 0.4,
      },
    ];

    return mockFoods.filter((food) =>
      food.description.toLowerCase().includes(query.toLowerCase()),
    );
  }

  private getMockNutritionGoals(): NutritionGoal[] {
    return [
      {
        nutrient: "Protein",
        current: 120,
        target: 150,
        unit: "g",
        priority: "high",
      },
      {
        nutrient: "Carbohydrates",
        current: 180,
        target: 250,
        unit: "g",
        priority: "medium",
      },
      {
        nutrient: "Fat",
        current: 45,
        target: 65,
        unit: "g",
        priority: "medium",
      },
      {
        nutrient: "Fiber",
        current: 18,
        target: 30,
        unit: "g",
        priority: "high",
      },
      {
        nutrient: "Vitamin C",
        current: 60,
        target: 90,
        unit: "mg",
        priority: "low",
      },
      {
        nutrient: "Calcium",
        current: 800,
        target: 1000,
        unit: "mg",
        priority: "high",
      },
    ];
  }

  private getMockMeals(): Meal[] {
    return [
      {
        id: "1",
        type: "Breakfast",
        timestamp: new Date("2024-01-15T08:00:00"),
        totalCalories: 450,
        carbs: 45,
        protein: 25,
        fat: 15,
        foods: [
          {
            name: "Greek Yogurt",
            amount: 200,
            unit: "g",
            calories: 118,
            nutrients: { protein: 20, carbs: 7.2 },
          },
          {
            name: "Berries",
            amount: 150,
            unit: "g",
            calories: 85,
            nutrients: { carbs: 20, fiber: 5 },
          },
        ],
      },
      {
        id: "2",
        type: "Lunch",
        timestamp: new Date("2024-01-15T13:00:00"),
        totalCalories: 650,
        carbs: 60,
        protein: 45,
        fat: 20,
        foods: [
          {
            name: "Grilled Chicken Breast",
            amount: 150,
            unit: "g",
            calories: 248,
            nutrients: { protein: 46.5 },
          },
          {
            name: "Brown Rice",
            amount: 100,
            unit: "g",
            calories: 111,
            nutrients: { carbs: 23, fiber: 1.8 },
          },
        ],
      },
    ];
  }

  private getMockAISuggestions(): AINutritionSuggestion[] {
    return [
      {
        name: "Salmon",
        benefit: "High Omega-3 for recovery",
        priority: "high",
        food: {
          fdcId: 2,
          description: "Salmon, Atlantic, cooked",
          energy: 206,
          protein: 22,
        },
        reason: "Your recovery metrics suggest increased omega-3 intake",
      },
      {
        name: "Spinach",
        benefit: "Iron for energy",
        priority: "medium",
        food: {
          fdcId: 4,
          description: "Spinach, raw",
          energy: 23,
          iron: 2.7,
        },
        reason: "Your iron levels are below optimal",
      },
    ];
  }

  private getMockPerformanceInsights(): PerformanceInsight[] {
    return [
      {
        type: "positive",
        icon: "pi pi-check-circle",
        title: "Excellent Protein Intake",
        description:
          "Your protein consumption today supports optimal muscle recovery and growth.",
      },
      {
        type: "warning",
        icon: "pi pi-exclamation-triangle",
        title: "Low Fiber Intake",
        description:
          "Consider adding more fiber-rich foods to improve digestion and satiety.",
        actionLabel: "View High-Fiber Foods",
      },
    ];
  }
}
