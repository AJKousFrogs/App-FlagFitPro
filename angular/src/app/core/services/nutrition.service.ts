import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { Observable, forkJoin, from, of } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { LoggerService } from "./logger.service";
import { RealtimeService } from "./realtime.service";
import { SupabaseService } from "./supabase.service";

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
  id?: string;
  type?: string;
  name?: string;
  title?: string;
  benefit?: string;
  description?: string;
  priority: "high" | "medium" | "low";
  food?: USDAFood;
  reason?: string;
  confidence?: number;
  actionItems?: string[];
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
  log_date?: string;
  [key: string]: unknown; // Allow additional properties for Record<string, unknown> compatibility
}

// RealtimePayload is imported from realtime.service.ts as RealtimeEvent
// Using type alias for clarity
type RealtimePayload<T extends Record<string, unknown>> = {
  new: T;
  old: T;
};

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
    this.realtimeService.subscribe<DatabaseNutritionLog>(
      "nutrition_logs",
      `user_id=eq.${userId}`,
      {
        onInsert: (payload) => {
          const logData = payload.new;
          const logDate =
            logData.log_date ||
            new Date(logData.logged_at).toISOString().split("T")[0];
          if (logDate === today) {
            this.logger.info("[Nutrition] New food logged via realtime");
            this.refreshTodaysMeals();
          }
        },
        onUpdate: (payload) => {
          const logData = payload.new;
          const logDate =
            logData.log_date ||
            new Date(logData.logged_at).toISOString().split("T")[0];
          if (logDate === today) {
            this.logger.info("[Nutrition] Food log updated via realtime");
            this.refreshTodaysMeals();
          }
        },
        onDelete: () => {
          this.logger.info("[Nutrition] Food log deleted via realtime");
          this.refreshTodaysMeals();
        },
      },
    );

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
  addFoodToCurrentMeal(
    food:
      | USDAFood
      | {
          name?: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          fiber?: number;
          [key: string]: unknown;
        },
  ): Observable<boolean> {
    const userId = this.userId();

    if (!userId) {
      this.logger.error("[Nutrition] Cannot add food: No user logged in");
      return of(false);
    }

    // Type-safe property access for both USDAFood and custom food objects
    const isUSDAFood = "fdcId" in food;
    const foodName = isUSDAFood
      ? (food as USDAFood).description
      : (food as { name?: string }).name;
    const foodId = isUSDAFood ? (food as USDAFood).fdcId : null;
    const calories = isUSDAFood
      ? ((food as USDAFood).energy ?? 0)
      : ((food as { calories?: number }).calories ?? 0);
    const carbs = isUSDAFood
      ? ((food as USDAFood).carbohydrates ?? 0)
      : ((food as { carbs?: number }).carbs ?? 0);

    return from(
      this.supabaseService.client
        .from("nutrition_logs")
        .insert({
          user_id: userId,
          food_name: foodName,
          food_id: foodId,
          calories: calories,
          protein: food.protein ?? 0,
          carbohydrates: carbs,
          fat: food.fat ?? 0,
          fiber: food.fiber ?? 0,
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

    // Get both goals and today's logs
    return forkJoin({
      goals: from(
        this.supabaseService.client
          .from("nutrition_goals")
          .select("*")
          .eq("user_id", userId)
          .single(),
      ),
      todayLogs: this.getTodaysNutritionTotals(userId),
    }).pipe(
      map(({ goals, todayLogs }) => {
        const goalsData = goals.data;

        // Convert database format to NutritionGoal[] with current values
        return [
          {
            nutrient: "Calories",
            current: todayLogs.calories,
            target: goalsData?.calories_target || 2500,
            unit: "kcal",
            priority: "high" as "high" | "low" | "medium",
          },
          {
            nutrient: "Protein",
            current: todayLogs.protein,
            target: goalsData?.protein_target || 150,
            unit: "g",
            priority: "high" as "high" | "low" | "medium",
          },
          {
            nutrient: "Carbs",
            current: todayLogs.carbs,
            target: goalsData?.carbs_target || 300,
            unit: "g",
            priority: "medium" as "high" | "low" | "medium",
          },
          {
            nutrient: "Fat",
            current: todayLogs.fat,
            target: goalsData?.fat_target || 80,
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
   * Get today's nutrition totals from logs
   */
  private getTodaysNutritionTotals(userId: string): Observable<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split("T")[0];

    return from(
      this.supabaseService.client
        .from("nutrition_logs")
        .select("calories, protein, carbohydrates, fat")
        .eq("user_id", userId)
        .gte("logged_at", `${todayStr}T00:00:00`)
        .lte("logged_at", `${todayStr}T23:59:59`),
    ).pipe(
      map(({ data, error }) => {
        if (error || !data || data.length === 0) {
          return { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }

        // Sum up all entries for today (use carbohydrates from DB, map to carbs for UI)
        return data.reduce(
          (totals, log) => ({
            calories: totals.calories + (log.calories || 0),
            protein: totals.protein + (log.protein || 0),
            carbs:
              totals.carbs + (log.carbohydrates || (log as any).carbs || 0),
            fat: totals.fat + (log.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 },
        );
      }),
      catchError(() => {
        // Return zeros on error
        return of({ calories: 0, protein: 0, carbs: 0, fat: 0 });
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
        const mealsByType: Record<string, DatabaseNutritionLog[]> = data.reduce(
          (
            acc: Record<string, DatabaseNutritionLog[]>,
            log: DatabaseNutritionLog,
          ) => {
            const type = log.meal_type || "other";
            if (!acc[type]) {
              acc[type] = [];
            }
            acc[type].push(log);
            return acc;
          },
          {} as Record<string, DatabaseNutritionLog[]>,
        );

        // Convert to Meal[] format
        return (
          Object.entries(mealsByType) as [string, DatabaseNutritionLog[]][]
        ).map(([type, logs]) => ({
          id: type,
          type,
          timestamp: new Date(logs[0].logged_at),
          totalCalories: logs.reduce(
            (sum: number, log: DatabaseNutritionLog) =>
              sum + (log.calories || 0),
            0,
          ),
          carbs: logs.reduce(
            (sum: number, log: DatabaseNutritionLog) =>
              sum + (log.carbohydrates || 0),
            0,
          ),
          protein: logs.reduce(
            (sum: number, log: DatabaseNutritionLog) =>
              sum + (log.protein || 0),
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
   * Calls Supabase Edge Function for AI-powered recommendations
   */
  getAINutritionSuggestions(): Observable<AINutritionSuggestion[]> {
    return from(this.fetchAINutritionSuggestions());
  }

  private async fetchAINutritionSuggestions(): Promise<
    AINutritionSuggestion[]
  > {
    const userId = this.userId();
    if (!userId) {
      return [];
    }

    try {
      // Try to call the AI nutrition edge function
      const { data, error } =
        await this.supabaseService.client.functions.invoke(
          "ai-nutrition-suggestions",
          {
            body: { userId },
          },
        );

      if (error) {
        this.logger.debug(
          "[Nutrition] AI edge function not available, using rule-based suggestions",
        );
        return this.generateRuleBasedSuggestions();
      }

      return data?.suggestions || [];
    } catch {
      // Fall back to rule-based suggestions
      return this.generateRuleBasedSuggestions();
    }
  }

  private async generateRuleBasedSuggestions(): Promise<
    AINutritionSuggestion[]
  > {
    const userId = this.userId();
    if (!userId) return [];

    const suggestions: AINutritionSuggestion[] = [];

    // Get recent nutrition data
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: logs } = await this.supabaseService.client
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("logged_at", weekAgo.toISOString());

    if (!logs || logs.length === 0) {
      suggestions.push({
        id: "start-tracking",
        type: "general",
        title: "Start Tracking Your Nutrition",
        description:
          "Log your meals to get personalized nutrition recommendations.",
        priority: "high",
        confidence: 1.0,
      });
      return suggestions;
    }

    // Analyze protein intake
    const avgProtein =
      logs.reduce((sum, l) => sum + (l.protein || 0), 0) / logs.length;
    if (avgProtein < 100) {
      suggestions.push({
        id: "increase-protein",
        type: "macro",
        title: "Increase Protein Intake",
        description: `Your average protein intake is ${Math.round(avgProtein)}g/day. Athletes typically need 1.6-2.2g/kg body weight.`,
        priority: "high",
        confidence: 0.85,
        actionItems: [
          "Add lean protein to each meal",
          "Consider protein-rich snacks",
          "Include eggs, chicken, fish, or legumes",
        ],
      });
    }

    // Check hydration
    const avgWater =
      logs.reduce((sum, l) => sum + (l.water_ml || 0), 0) / logs.length;
    if (avgWater < 2000) {
      suggestions.push({
        id: "hydration",
        type: "hydration",
        title: "Improve Hydration",
        description: `Average water intake: ${Math.round(avgWater)}ml/day. Aim for 2-3L daily.`,
        priority: "medium",
        confidence: 0.9,
        actionItems: [
          "Drink water before, during, and after training",
          "Carry a water bottle throughout the day",
          "Monitor urine color for hydration status",
        ],
      });
    }

    // Check meal timing consistency
    if (logs.length < 14) {
      suggestions.push({
        id: "consistency",
        type: "timing",
        title: "Maintain Consistent Meal Timing",
        description:
          "Regular meal timing supports stable energy levels and recovery.",
        priority: "low",
        confidence: 0.7,
      });
    }

    return suggestions;
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
          data.reduce(
            (sum, log: DatabaseNutritionLog) => sum + (log.calories || 0),
            0,
          ) / data.length;
        const avgProtein =
          data.reduce(
            (sum, log: DatabaseNutritionLog) => sum + (log.protein || 0),
            0,
          ) / data.length;

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
      "vitamin c": [
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
