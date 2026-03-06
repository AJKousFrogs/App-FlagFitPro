import {
  Component,
  signal,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { Card } from "primeng/card";
import { UIChart } from "primeng/chart";
import { AutoComplete } from "primeng/autocomplete";
import { Select } from "primeng/select";
import { ButtonComponent } from "../button/button.component";
import { Tag } from "primeng/tag";
import { StatusTagComponent } from "../status-tag/status-tag.component";
import { DataView } from "primeng/dataview";
import { ProgressBar } from "primeng/progressbar";
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
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Card,
    UIChart,
    AutoComplete,
    Select,
    Tag,
    StatusTagComponent,
    DataView,
    ProgressBar,

    ButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="nutrition-dashboard">
      <!-- USDA Food Search Integration -->
      <p-card header="Food Logger" class="food-search-card">
        <div class="food-search-container">
          <p-autoComplete
            [formControl]="selectedFoodControl"
            [suggestions]="foodSuggestions()"
            (completeMethod)="searchFoods($event)"
            field="description"
            [minQueryLength]="2"
            placeholder="Search USDA food database..."
            [dropdown]="true"
            [forceSelection]="false"
            class="food-autocomplete"
          >
            <ng-template let-food #item>
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
            [disabled]="!selectedFoodControl.value"
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
                <app-status-tag
                  [value]="suggestion.name + ' (' + suggestion.benefit + ')'"
                  [severity]="
                    suggestion.priority === 'high' ? 'success' : 'info'
                  "
                  size="sm"
                  (click)="addSuggestedFood(suggestion)"
                  class="clickable-tag"
                />
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
                <app-status-tag
                  [value]="goal.priority"
                  [severity]="getPrioritySeverity(goal.priority)"
                  size="sm"
                />
              </div>

              <div class="goal-progress">
                <p-progressBar
                  [value]="(goal.current / goal.target) * 100"
                  [showValue]="false"
                  [class]="getProgressClass(goal)"
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
                      <app-status-tag
                        [value]="source"
                        severity="secondary"
                        size="sm"
                        class="source-tag"
                      />
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
          <ng-template let-meal #listItem>
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
                @if (meal.carbs || meal.protein || meal.fat) {
                  <p-chart
                    type="doughnut"
                    [data]="getMealNutritionChart(meal)"
                    [options]="doughnutOptions"
                    [width]="'var(--size-150)'"
                    [height]="'var(--size-150)'"
                  >
                  </p-chart>
                }
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
              <div class="nutrition-insight-card" [class]="insight.type">
                <div class="nutrition-insight-icon">
                  <i [class]="insight.icon"></i>
                </div>
                <div class="nutrition-insight-content">
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

  readonly selectedFoodControl = new FormControl<USDAFood | string | null>(null);
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
    const selectedFood = this.selectedFoodControl.value;
    if (selectedFood && typeof selectedFood === "object") {
      firstValueFrom(
        this.nutritionService.addFoodToCurrentMeal(selectedFood as USDAFood),
      ).then(() => {
        this.selectedFoodControl.setValue(null);
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
        return "warning";
      default:
        return "info";
    }
  }

  getProgressClass(goal: NutritionGoal): string {
    const percentage = (goal.current / goal.target) * 100;
    if (percentage < 50) return "progress-low";
    if (percentage < 80) return "progress-medium";
    return "progress-high";
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
