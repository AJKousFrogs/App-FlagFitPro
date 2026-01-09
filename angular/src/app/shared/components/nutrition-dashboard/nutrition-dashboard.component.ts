import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { AutoCompleteModule } from "primeng/autocomplete";
import { Select } from "primeng/select";
import { ButtonComponent } from "../button/button.component";
import { TagModule } from "primeng/tag";
import { DataViewModule } from "primeng/dataview";
import { ProgressBarModule } from "primeng/progressbar";
import { COLORS } from "../../../core/constants/app.constants";
import {
  NutritionService,
  NutritionGoal,
  AINutritionSuggestion,
  PerformanceInsight as ServicePerformanceInsight,
  USDAFood,
} from "../../../core/services/nutrition.service";
import { firstValueFrom } from "rxjs";
import { LoggerService } from "../../../core/services/logger.service";
import { toLogContext } from "../../../core/services/logger.service";

interface FoodItem {
  name: string;
  amount: number;
  unit: string;
}

interface Meal {
  type: string;
  timestamp: Date;
  totalCalories: number;
  foods: FoodItem[];
  carbs: number;
  protein: number;
  fat: number;
}

// Using AINutritionSuggestion and PerformanceInsight from nutrition.service.ts

@Component({
  selector: "app-nutrition-dashboard",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ChartModule,
    AutoCompleteModule,
    Select,
    TagModule,
    DataViewModule,
    ProgressBarModule,

    ButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nutrition-dashboard">
      <!-- USDA Food Search Integration -->
      <p-card header="Food Logger" class="food-search-card">
        <div class="food-search-container">
          <p-autoComplete
            [(ngModel)]="selectedFood"
            [suggestions]="foodSuggestions()"
            (completeMethod)="searchFoods($event)"
            field="description"
            [minLength]="2"
            placeholder="Search USDA food database..."
            [dropdown]="true"
            [forceSelection]="false"
            styleClass="food-autocomplete"
          >
            <ng-template let-food pTemplate="item">
              <div class="food-suggestion">
                <div class="food-info">
                  <span class="food-name">{{ food.description }}</span>
                  <small class="food-category">{{ food.foodCategory }}</small>
                </div>
                <div class="food-nutrients">
                  <span class="calories">{{ food.energy || 0 }} cal</span>
                </div>
              </div>
            </ng-template>
          </p-autoComplete>

          <app-button
            iconLeft="pi-plus"
            [disabled]="!selectedFood"
            (clicked)="addFoodToMeal()"
            >Add Food</app-button
          >
        </div>

        <!-- Quick Add Suggestions (AI-powered) -->
        @if (aiSuggestions().length > 0) {
          <div class="quick-suggestions">
            <h5>
              <i class="pi pi-sparkles"></i>
              AI Recommendations for You
            </h5>
            <div class="suggestion-chips">
              @for (suggestion of aiSuggestions(); track suggestion.name) {
                <p-tag
                  [value]="suggestion.name"
                  [severity]="
                    suggestion.priority === 'high' ? 'success' : 'info'
                  "
                  (click)="addSuggestedFood(suggestion)"
                  class="clickable-tag"
                >
                  {{ suggestion.name }} ({{ suggestion.benefit }})
                </p-tag>
              }
            </div>
          </div>
        }
      </p-card>

      <!-- Daily Nutrition Goals Progress -->
      <p-card header="Daily Nutrition Goals" class="nutrition-goals-card">
        <div class="goals-grid">
          @for (goal of nutritionGoals(); track goal.nutrient) {
            <div
              class="goal-item"
              [class.achieved]="goal.current >= goal.target"
              [class.warning]="
                goal.current < goal.target * 0.7 && goal.priority === 'high'
              "
            >
              <div class="goal-header">
                <span class="nutrient-name">{{ goal.nutrient }}</span>
                <p-tag
                  [value]="goal.priority"
                  [severity]="getPrioritySeverity(goal.priority)"
                  size="small"
                >
                </p-tag>
              </div>

              <div class="goal-progress">
                <p-progressBar
                  [value]="(goal.current / goal.target) * 100"
                  [showValue]="false"
                  [style]="getProgressStyle(goal)"
                >
                </p-progressBar>

                <div class="progress-text">
                  <span class="current">{{
                    goal.current | number: "1.1-1"
                  }}</span>
                  <span class="separator">/</span>
                  <span class="target"
                    >{{ goal.target | number: "1.1-1" }} {{ goal.unit }}</span
                  >
                </div>
              </div>

              <!-- Recommended foods for this nutrient -->
              @if (goal.current < goal.target) {
                <div class="nutrient-sources">
                  <small>Good sources:</small>
                  <div class="source-tags">
                    @for (
                      source of getNutrientSources(goal.nutrient);
                      track source
                    ) {
                      <p-tag
                        [value]="source"
                        severity="secondary"
                        size="small"
                        class="source-tag"
                      >
                      </p-tag>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </p-card>

      <!-- Meal Timeline -->
      <p-card header="Today's Meals" class="meals-timeline-card">
        <p-dataView [value]="todaysMeals()" layout="list" [paginator]="false">
          <ng-template let-meal pTemplate="listItem">
            <div class="meal-item">
              <div class="meal-header">
                <h4>{{ meal.type }}</h4>
                <span class="meal-time">{{
                  meal.timestamp | date: "shortTime"
                }}</span>
                <span class="meal-calories">{{ meal.totalCalories }} cal</span>
              </div>

              <div class="meal-foods">
                @for (food of meal.foods; track food.name) {
                  <div class="food-item">
                    <span class="food-name">{{ food.name }}</span>
                    <span class="food-amount"
                      >{{ food.amount }} {{ food.unit }}</span
                    >
                  </div>
                }
              </div>

              <!-- Nutrition breakdown chart -->
              <div class="meal-nutrition">
                <p-chart
                  type="doughnut"
                  [data]="getMealNutritionChart(meal)"
                  [options]="doughnutOptions"
                  [width]="'150px'"
                  [height]="'150px'"
                >
                </p-chart>
              </div>
            </div>
          </ng-template>
        </p-dataView>
      </p-card>

      <!-- Performance Impact Insights -->
      @if (performanceInsights().length > 0) {
        <p-card header="Performance Impact" class="performance-insights-card">
          <div class="insights-list">
            @for (insight of performanceInsights(); track insight.title) {
              <div class="insight-item" [class]="insight.type">
                <div class="insight-icon">
                  <i [class]="insight.icon"></i>
                </div>
                <div class="insight-content">
                  <h5>{{ insight.title }}</h5>
                  <p>{{ insight.description }}</p>
                  @if (insight.actionLabel) {
                    <app-button
                      variant="text"
                      size="sm"
                      (clicked)="executeInsightAction(insight)"
                    ></app-button>
                  }
                </div>
              </div>
            }
          </div>
        </p-card>
      }
    </div>
  `,
  styleUrl: "./nutrition-dashboard.component.scss",
})
export class NutritionDashboardComponent {
  private nutritionService = inject(NutritionService);
  private logger = inject(LoggerService);

  selectedFood: USDAFood | null = null;
  foodSuggestions = signal<USDAFood[]>([]);
  nutritionGoals = signal<NutritionGoal[]>([]);
  todaysMeals = signal<Meal[]>([]);

  constructor() {
    // Angular 21: Initialize in constructor instead of OnInit
    this.loadNutritionGoals();
    this.loadTodaysMeals();
    this.loadAISuggestions();
    this.loadPerformanceInsights();
  }
  aiSuggestions = signal<AINutritionSuggestion[]>([]);
  performanceInsights = signal<ServicePerformanceInsight[]>([]);

  doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  async searchFoods(event: { query: string }) {
    // Search USDA FoodData Central database
    const results = await firstValueFrom(
      this.nutritionService.searchUSDAFoods(event.query),
    );
    this.foodSuggestions.set(results);
  }

  addFoodToMeal() {
    if (this.selectedFood) {
      firstValueFrom(
        this.nutritionService.addFoodToCurrentMeal(this.selectedFood),
      ).then(() => {
        this.selectedFood = null;
        this.loadTodaysMeals(); // Refresh meals
        this.loadNutritionGoals(); // Update progress
      });
    }
  }

  addSuggestedFood(suggestion: AINutritionSuggestion) {
    if (!suggestion.food) {
      return;
    }
    firstValueFrom(
      this.nutritionService.addFoodToCurrentMeal(suggestion.food),
    ).then(() => {
      this.loadTodaysMeals();
      this.loadNutritionGoals();
    });
  }

  private async loadNutritionGoals() {
    const goals = await firstValueFrom(
      this.nutritionService.getDailyNutritionGoals(),
    );
    this.nutritionGoals.set(goals);
  }

  private async loadTodaysMeals() {
    const meals = await firstValueFrom(this.nutritionService.getTodaysMeals());
    this.todaysMeals.set(meals);
  }

  private async loadAISuggestions() {
    const suggestions = await firstValueFrom(
      this.nutritionService.getAINutritionSuggestions(),
    );
    this.aiSuggestions.set(suggestions);
  }

  private async loadPerformanceInsights() {
    const insights = await firstValueFrom(
      this.nutritionService.getPerformanceInsights(),
    );
    this.performanceInsights.set(insights);
  }

  getPrioritySeverity(priority: string): string {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warn";
      default:
        return "info";
    }
  }

  getProgressStyle(goal: NutritionGoal): Record<string, string> {
    const percentage = (goal.current / goal.target) * 100;
    let color: string = COLORS.PRIMARY_LIGHT; // Green for achieved

    if (percentage < 50) {
      color = COLORS.ERROR; // Red for low
    } else if (percentage < 80) {
      color = COLORS.WARNING; // Yellow for medium
    }

    return { "--p-progressbar-value-bg": color };
  }

  getNutrientSources(nutrient: string): string[] {
    // Get food sources rich in this nutrient from database
    return this.nutritionService.getNutrientSources(nutrient);
  }

  getMealNutritionChart(meal: Meal) {
    return {
      labels: ["Carbs", "Protein", "Fat"],
      datasets: [
        {
          data: [meal.carbs, meal.protein, meal.fat],
          backgroundColor: [COLORS.WARNING, COLORS.PRIMARY_LIGHT, COLORS.ERROR],
          borderWidth: 2,
          borderColor: "var(--surface-0)",
        },
      ],
    };
  }

  executeInsightAction(insight: ServicePerformanceInsight) {
    // Handle insight actions (e.g., add recommended food, adjust meal timing)
    this.logger.debug("Executing insight action:", toLogContext(insight));
  }
}
