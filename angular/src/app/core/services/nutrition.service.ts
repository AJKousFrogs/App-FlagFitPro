import { Injectable, inject, computed } from "@angular/core";
import { Observable, of, from } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

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
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);
  
  // Get current user ID reactively
  private userId = computed(() => this.supabaseService.userId());

  /**
   * Search USDA FoodData Central database
   * Note: This still needs to go through a backend API for USDA API key security
   * TODO: Create Supabase Edge Function for USDA API calls
   */
  searchUSDAFoods(query: string): Observable<USDAFood[]> {
    this.logger.warn("[Nutrition] USDA search requires backend API - not yet migrated");
    // For now, return empty array
    // This should be implemented as a Supabase Edge Function
    return of([]);
  }

  /**
   * Add food to current meal
   * Logs food intake to nutrition_logs table
   */
  addFoodToCurrentMeal(food: USDAFood | any): Observable<boolean> {
    const userId = this.userId();
    
    if (!userId) {
      this.logger.error("[Nutrition] Cannot add food: No user logged in");
      return of(false);
    }

    return from(
      this.supabaseService.client
        .from("nutrition_logs")
        .insert({
          user_id: userId,
          food_name: food.description || food.name,
          food_id: food.fdcId || null,
          calories: food.energy || food.calories || 0,
          protein: food.protein || 0,
          carbohydrates: food.carbohydrates || food.carbs || 0,
          fat: food.fat || 0,
          fiber: food.fiber || 0,
          logged_at: new Date().toISOString(),
          meal_type: this.getMealTypeFromTime(),
        })
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error("[Nutrition] Error adding food:", error);
          return false;
        }
        this.logger.success("[Nutrition] Food logged:", data.id);
        return true;
      }),
      catchError((error) => {
        this.logger.error("[Nutrition] Failed to add food:", error);
        return of(false);
      }),
    );
  }

  /**
   * Determine meal type based on current time
   */
  private getMealTypeFromTime(): string {
    const hour = new Date().getHours();
    if (hour < 11) return "breakfast";
    if (hour < 15) return "lunch";
    if (hour < 18) return "snack";
    return "dinner";
  }

  /**
   * Get daily nutrition goals from database or defaults
   */
  getDailyNutritionGoals(): Observable<NutritionGoal[]> {
    const userId = this.userId();
    
    if (!userId) {
      this.logger.warn("[Nutrition] No user logged in, using defaults");
      return of(this.getDefaultGoals());
    }

    return from(
      this.supabaseService.client
        .from("nutrition_goals")
        .select("*")
        .eq("user_id", userId)
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) {
          return this.getDefaultGoals();
        }

        // Convert database format to NutritionGoal[]
        return [
          {
            nutrient: "Calories",
            current: 0, // TODO: Calculate from today's logs
            target: data.calories_target || 2500,
            unit: "kcal",
            priority: "high",
          },
          {
            nutrient: "Protein",
            current: 0,
            target: data.protein_target || 150,
            unit: "g",
            priority: "high",
          },
          {
            nutrient: "Carbs",
            current: 0,
            target: data.carbs_target || 300,
            unit: "g",
            priority: "medium",
          },
          {
            nutrient: "Fat",
            current: 0,
            target: data.fat_target || 80,
            unit: "g",
            priority: "medium",
          },
        ];
      }),
      catchError((error) => {
        this.logger.error("[Nutrition] Error fetching goals:", error);
        return of(this.getDefaultGoals());
      }),
    );
  }

  /**
   * Get default nutrition goals
   */
  private getDefaultGoals(): NutritionGoal[] {
    return [
      { nutrient: "Calories", current: 0, target: 2500, unit: "kcal", priority: "high" },
      { nutrient: "Protein", current: 0, target: 150, unit: "g", priority: "high" },
      { nutrient: "Carbs", current: 0, target: 300, unit: "g", priority: "medium" },
      { nutrient: "Fat", current: 0, target: 80, unit: "g", priority: "medium" },
    ];
  }

  /**
   * Get today's meals from nutrition_logs
   */
  getTodaysMeals(): Observable<Meal[]> {
    const userId = this.userId();
    
    if (!userId) {
      this.logger.warn("[Nutrition] No user logged in");
      return of([]);
    }

    const today = new Date().toISOString().split("T")[0];

    return from(
      this.supabaseService.client
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", `${today}T00:00:00`)
        .lte("logged_at", `${today}T23:59:59`)
        .order("logged_at", { ascending: true }),
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) {
          this.logger.error("[Nutrition] Error fetching meals:", error);
          return [];
        }

        // Group by meal type
        const mealsByType = data.reduce((acc: any, log: any) => {
          const type = log.meal_type || "other";
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(log);
          return {};
        }, {});

        // Convert to Meal[] format
        return Object.entries(mealsByType).map(([type, logs]: [string, any]) => ({
          id: type,
          type,
          timestamp: new Date(logs[0].logged_at),
          totalCalories: logs.reduce((sum: number, log: any) => sum + (log.calories || 0), 0),
          carbs: logs.reduce((sum: number, log: any) => sum + (log.carbohydrates || 0), 0),
          protein: logs.reduce((sum: number, log: any) => sum + (log.protein || 0), 0),
          fat: logs.reduce((sum: number, log: any) => sum + (log.fat || 0), 0),
          foods: logs.map((log: any) => ({
            name: log.food_name,
            amount: 1,
            unit: "serving",
            calories: log.calories || 0,
            nutrients: {
              protein: log.protein || 0,
              carbohydrates: log.carbohydrates || 0,
              fat: log.fat || 0,
            },
          })),
        }));
      }),
      catchError((error) => {
        this.logger.error("[Nutrition] Failed to fetch meals:", error);
        return of([]);
      }),
    );
  }

  /**
   * Get AI-powered nutrition suggestions
   * Note: This requires AI API integration
   * TODO: Implement via Supabase Edge Function with OpenAI
   */
  getAINutritionSuggestions(): Observable<AINutritionSuggestion[]> {
    this.logger.warn("[Nutrition] AI suggestions require backend - not yet implemented");
    return of([]);
  }

  /**
   * Get performance insights based on nutrition data
   * Analyzes recent nutrition logs for insights
   */
  getPerformanceInsights(): Observable<PerformanceInsight[]> {
    const userId = this.userId();
    
    if (!userId) {
      return of([]);
    }

    // Get last 7 days of nutrition logs
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return from(
      this.supabaseService.client
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", userId)
        .gte("logged_at", weekAgo.toISOString()),
    ).pipe(
      map(({ data, error }) => {
        if (error || !data || data.length === 0) {
          return [];
        }

        const insights: PerformanceInsight[] = [];

        // Calculate averages
        const avgCalories = data.reduce((sum, log: any) => sum + (log.calories || 0), 0) / data.length;
        const avgProtein = data.reduce((sum, log: any) => sum + (log.protein || 0), 0) / data.length;

        // Generate insights
        if (avgCalories < 2000) {
          insights.push({
            type: "warning",
            icon: "pi pi-exclamation-triangle",
            title: "Low Calorie Intake",
            description: `Your average daily intake (${Math.round(avgCalories)} kcal) is below recommended levels for athletes.`,
            actionLabel: "Adjust Goals",
          });
        }

        if (avgProtein < 100) {
          insights.push({
            type: "warning",
            icon: "pi pi-exclamation-triangle",
            title: "Low Protein Intake",
            description: `Aim for 1.6-2.2g protein per kg body weight for optimal recovery.`,
            actionLabel: "View Protein Sources",
          });
        }

        if (insights.length === 0) {
          insights.push({
            type: "positive",
            icon: "pi pi-check-circle",
            title: "Good Nutrition Balance",
            description: "Your nutrition is well-balanced. Keep up the great work!",
          });
        }

        return insights;
      }),
      catchError((error) => {
        this.logger.error("[Nutrition] Error generating insights:", error);
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
