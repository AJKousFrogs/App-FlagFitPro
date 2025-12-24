import { Injectable, inject, computed, signal, effect } from "@angular/core";
import { Observable, of, from } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";
import { RealtimeService } from "./realtime.service";

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
  image?: string;
  brandOwner?: string;
  ingredients?: string;
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

interface DatabaseNutritionLog {
  id: number;
  user_id: string;
  food_name: string;
  food_id?: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  logged_at: string;
  meal_type?: string;
}

interface RealtimePayload<T> {
  new: T;
  old: T;
}

interface EdamamFood {
  fdcId: number;
  description: string;
  dataType?: string;
  nutrients?: {
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  image?: string;
  brandOwner?: string;
  foodContentsLabel?: string;
}

@Injectable({
  providedIn: "root",
})
export class NutritionService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);
  private realtimeService = inject(RealtimeService);

  // Get current user ID reactively
  private userId = computed(() => this.supabaseService.userId());

  // State signals
  private readonly _todaysMeals = signal<Meal[]>([]);
  private readonly _nutritionGoals = signal<NutritionGoal[]>([]);
  readonly todaysMeals = this._todaysMeals.asReadonly();
  readonly nutritionGoals = this._nutritionGoals.asReadonly();

  // Computed signals
  readonly totalCaloriesToday = computed(() =>
    this._todaysMeals().reduce((sum, meal) => sum + meal.totalCalories, 0),
  );
  readonly totalProteinToday = computed(() =>
    this._todaysMeals().reduce((sum, meal) => sum + meal.protein, 0),
  );
  readonly totalCarbsToday = computed(() =>
    this._todaysMeals().reduce((sum, meal) => sum + meal.carbs, 0),
  );
  readonly totalFatToday = computed(() =>
    this._todaysMeals().reduce((sum, meal) => sum + meal.fat, 0),
  );

  constructor() {
    // Set up realtime subscription when user logs in/out
    effect(() => {
      const userId = this.userId();

      if (userId) {
        this.logger.info(
          "[Nutrition] User logged in, setting up realtime subscriptions",
        );
        this.loadTodaysNutrition();
        this.subscribeToNutritionUpdates(userId);
      } else {
        this.logger.info("[Nutrition] User logged out, cleaning up");
        this._todaysMeals.set([]);
        this._nutritionGoals.set([]);
        this.realtimeService.unsubscribe("nutrition_logs");
        this.realtimeService.unsubscribe("nutrition_goals");
      }
    });
  }

  /**
   * Load today's nutrition data
   */
  private loadTodaysNutrition(): void {
    this.getTodaysMeals().subscribe({
      next: (meals) => {
        this._todaysMeals.set(meals);
        this.logger.success("[Nutrition] Loaded today's meals");
      },
      error: (error) => {
        this.logger.error("[Nutrition] Failed to load meals:", error);
      },
    });

    this.getDailyNutritionGoals().subscribe({
      next: (goals) => {
        this._nutritionGoals.set(goals);
        this.logger.success("[Nutrition] Loaded nutrition goals");
      },
      error: (error) => {
        this.logger.error("[Nutrition] Failed to load goals:", error);
      },
    });
  }

  /**
   * Subscribe to realtime nutrition updates
   */
  private subscribeToNutritionUpdates(userId: string): void {
    const today = new Date().toISOString().split("T")[0];

    // Subscribe to nutrition logs
    this.realtimeService.subscribe("nutrition_logs", `user_id=eq.${userId}`, {
      onInsert: (payload: RealtimePayload<DatabaseNutritionLog>) => {
        const logDate =
          payload.new.log_date ||
          new Date(payload.new.logged_at).toISOString().split("T")[0];
        if (logDate === today) {
          this.logger.info("[Nutrition] New food logged via realtime");
          this.refreshTodaysMeals();
        }
      },
      onUpdate: (payload: RealtimePayload<DatabaseNutritionLog>) => {
        const logDate =
          payload.new.log_date ||
          new Date(payload.new.logged_at).toISOString().split("T")[0];
        if (logDate === today) {
          this.logger.info("[Nutrition] Food log updated via realtime");
          this.refreshTodaysMeals();
        }
      },
      onDelete: (payload: RealtimePayload<DatabaseNutritionLog>) => {
        this.logger.info("[Nutrition] Food log deleted via realtime");
        this.refreshTodaysMeals();
      },
    });

    // Subscribe to nutrition goals
    this.realtimeService.subscribe("nutrition_goals", `user_id=eq.${userId}`, {
      onInsert: () => {
        this.logger.info("[Nutrition] New goal added via realtime");
        this.refreshGoals();
      },
      onUpdate: () => {
        this.logger.info("[Nutrition] Goal updated via realtime");
        this.refreshGoals();
      },
      onDelete: () => {
        this.logger.info("[Nutrition] Goal deleted via realtime");
        this.refreshGoals();
      },
    });
  }

  /**
   * Refresh today's meals
   */
  private refreshTodaysMeals(): void {
    this.getTodaysMeals().subscribe({
      next: (meals) => this._todaysMeals.set(meals),
      error: (error) =>
        this.logger.error("[Nutrition] Error refreshing meals:", error),
    });
  }

  /**
   * Refresh nutrition goals
   */
  private refreshGoals(): void {
    this.getDailyNutritionGoals().subscribe({
      next: (goals) => this._nutritionGoals.set(goals),
      error: (error) =>
        this.logger.error("[Nutrition] Error refreshing goals:", error),
    });
  }

  /**
   * Search food database using Edamam API (900K+ foods, FREE)
   * Includes USDA data + branded foods (McDonald's, Starbucks, etc.)
   * Uses Supabase Edge Function to proxy requests to Edamam API
   */
  searchUSDAFoods(
    query: string,
    pageSize: number = 25,
    pageNumber: number = 1,
  ): Observable<USDAFood[]> {
    if (!query || query.trim().length === 0) {
      return of([]);
    }

    return from(
      this.supabaseService.client.functions.invoke("search-foods-edamam", {
        body: {
          query: query.trim(),
          pageSize,
          pageNumber,
        },
      }),
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error("[Nutrition] Food search error:", error);
          return [];
        }

        if (!data || !data.success) {
          this.logger.warn("[Nutrition] Food search returned no results");
          return [];
        }

        this.logger.info(
          `[Nutrition] Found ${data.data.length} foods for "${query}" (via Edamam)`,
        );
        return this.transformEdamamResults(data.data);
      }),
      catchError((error) => {
        this.logger.error("[Nutrition] Food search failed:", error);
        return of([]);
      }),
    );
  }

  /**
   * Transform Edamam results to USDAFood format
   */
  private transformEdamamResults(foods: EdamamFood[]): USDAFood[] {
    return foods.map((food) => ({
      fdcId: food.fdcId,
      description: food.description,
      foodCategory: food.dataType,
      energy: food.nutrients?.calories || 0,
      protein: food.nutrients?.protein || 0,
      carbohydrates: food.nutrients?.carbohydrates || 0,
      fat: food.nutrients?.fat || 0,
      fiber: food.nutrients?.fiber || 0,
      sugars: food.nutrients?.sugar || 0,
      sodium: food.nutrients?.sodium || 0,
      // Additional Edamam data
      image: food.image,
      brandOwner: food.brandOwner,
      ingredients: food.foodContentsLabel,
    }));
  }

  /**
   * Add food to current meal
   * Logs food intake to nutrition_logs table
   */
  addFoodToCurrentMeal(food: USDAFood | { name?: string; calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number; [key: string]: unknown }): Observable<boolean> {
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
            priority: "high" as "high" | "low" | "medium",
          },
          {
            nutrient: "Protein",
            current: 0,
            target: data.protein_target || 150,
            unit: "g",
            priority: "high" as "high" | "low" | "medium",
          },
          {
            nutrient: "Carbs",
            current: 0,
            target: data.carbs_target || 300,
            unit: "g",
            priority: "medium" as "high" | "low" | "medium",
          },
          {
            nutrient: "Fat",
            current: 0,
            target: data.fat_target || 80,
            unit: "g",
            priority: "medium" as "high" | "low" | "medium",
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
      {
        nutrient: "Calories",
        current: 0,
        target: 2500,
        unit: "kcal",
        priority: "high",
      },
      {
        nutrient: "Protein",
        current: 0,
        target: 150,
        unit: "g",
        priority: "high",
      },
      {
        nutrient: "Carbs",
        current: 0,
        target: 300,
        unit: "g",
        priority: "medium",
      },
      {
        nutrient: "Fat",
        current: 0,
        target: 80,
        unit: "g",
        priority: "medium",
      },
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
        const mealsByType = data.reduce((acc: Record<string, DatabaseNutritionLog[]>, log: DatabaseNutritionLog) => {
          const type = log.meal_type || "other";
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(log);
          return acc;
        }, {});

        // Convert to Meal[] format
        return Object.entries(mealsByType).map(
          ([type, logs]: [string, DatabaseNutritionLog[]]) => ({
            id: type,
            type,
            timestamp: new Date(logs[0].logged_at),
            totalCalories: logs.reduce(
              (sum: number, log: DatabaseNutritionLog) => sum + (log.calories || 0),
              0,
            ),
            carbs: logs.reduce(
              (sum: number, log: DatabaseNutritionLog) => sum + (log.carbohydrates || 0),
              0,
            ),
            protein: logs.reduce(
              (sum: number, log: DatabaseNutritionLog) => sum + (log.protein || 0),
              0,
            ),
            fat: logs.reduce(
              (sum: number, log: DatabaseNutritionLog) => sum + (log.fat || 0),
              0,
            ),
            foods: logs.map((log: DatabaseNutritionLog) => ({
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
          }),
        );
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
    this.logger.warn(
      "[Nutrition] AI suggestions require backend - not yet implemented",
    );
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
        const avgCalories =
          data.reduce((sum, log: DatabaseNutritionLog) => sum + (log.calories || 0), 0) /
          data.length;
        const avgProtein =
          data.reduce((sum, log: DatabaseNutritionLog) => sum + (log.protein || 0), 0) /
          data.length;

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
            description:
              "Your nutrition is well-balanced. Keep up the great work!",
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
