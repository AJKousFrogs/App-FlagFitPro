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
        catchError((error) => {
          this.logger.error("[NutritionService] Error searching foods:", error);
          return of([]); // Return empty array on error instead of mock data
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
        catchError((error) => {
          this.logger.error("[NutritionService] Error adding food:", error);
          return of(false);
        }),
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
        catchError((error) => {
          this.logger.error("[NutritionService] Error fetching goals:", error);
          return of([]);
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
      catchError((error) => {
        this.logger.error("[NutritionService] Error fetching today's meals:", error);
        return of([]);
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
        catchError((error) => {
          this.logger.error("[NutritionService] Error fetching AI suggestions:", error);
          return of([]);
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
        catchError((error) => {
          this.logger.error("[NutritionService] Error fetching performance insights:", error);
          return of([]);
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
}
