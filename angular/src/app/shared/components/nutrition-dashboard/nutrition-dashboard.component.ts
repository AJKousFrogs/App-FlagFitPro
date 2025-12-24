import {
  Component,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ChartModule } from "primeng/chart";
import { AutoCompleteModule } from "primeng/autocomplete";
import { Select } from "primeng/select";
import { ButtonModule } from "primeng/button";
import { TagModule } from "primeng/tag";
import { DataViewModule } from "primeng/dataview";
import { ProgressBarModule } from "primeng/progressbar";
import {
  NutritionService,
  NutritionGoal,
} from "../../../core/services/nutrition.service";
import { firstValueFrom } from "rxjs";
import { LoggerService } from "../../../core/services/logger.service";

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
    ButtonModule,
    TagModule,
    DataViewModule,
    ProgressBarModule,
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

          <p-button
            icon="pi pi-plus"
            label="Add Food"
            [disabled]="!selectedFood"
            (onClick)="addFoodToMeal()"
          >
          </p-button>
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
                    <p-button
                      [label]="insight.actionLabel"
                      size="small"
                      [text]="true"
                      (onClick)="executeInsightAction(insight)"
                    >
                    </p-button>
                  }
                </div>
              </div>
            }
          </div>
        </p-card>
      }
    </div>
  `,
  styles: [
    `
      .nutrition-dashboard {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .food-search-container {
        display: flex;
        gap: 1rem;
        align-items: flex-end;
      }

      .food-autocomplete {
        flex: 1;
      }

      .food-suggestion {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
      }

      .food-info {
        display: flex;
        flex-direction: column;
      }

      .food-name {
        font-weight: 500;
        color: var(--p-text-color);
      }

      .food-category {
        color: var(--p-text-color-secondary);
      }

      .calories {
        font-weight: 600;
        color: var(--p-primary-color);
      }

      .quick-suggestions {
        margin-top: 1.5rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--p-surface-border);
      }

      .quick-suggestions h5 {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0 0 0.75rem 0;
        color: var(--p-text-color);
      }

      .suggestion-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }

      .clickable-tag {
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .clickable-tag:hover {
        transform: scale(1.05);
      }

      .goals-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
      }

      .goal-item {
        padding: 1rem;
        border: 1px solid var(--p-surface-border);
        border-radius: var(--p-border-radius);
        transition: all 0.3s ease;
      }

      .goal-item.achieved {
        border-color: var(--p-green-500);
        background: var(--p-green-50);
      }

      .goal-item.warning {
        border-color: var(--p-orange-500);
        background: var(--p-orange-50);
      }

      .goal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .nutrient-name {
        font-weight: 600;
        color: var(--p-text-color);
      }

      .goal-progress {
        margin-bottom: 0.75rem;
      }

      .progress-text {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-top: 0.5rem;
        font-size: 0.875rem;
      }

      .current {
        font-weight: 600;
        color: var(--p-primary-color);
      }

      .target {
        color: var(--p-text-color-secondary);
      }

      .nutrient-sources {
        margin-top: 0.75rem;
      }

      .nutrient-sources small {
        color: var(--p-text-color-secondary);
        font-size: 0.75rem;
      }

      .source-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-top: 0.25rem;
      }

      .meal-item {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto 1fr;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid var(--p-surface-border);
        border-radius: var(--p-border-radius);
        margin-bottom: 1rem;
      }

      .meal-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        grid-column: 1 / -1;
      }

      .meal-header h4 {
        margin: 0;
        color: var(--p-text-color);
      }

      .meal-time {
        color: var(--p-text-color-secondary);
        font-size: 0.875rem;
      }

      .meal-calories {
        margin-left: auto;
        font-weight: 600;
        color: var(--p-primary-color);
      }

      .meal-foods {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .food-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
      }

      .food-name {
        font-weight: 500;
      }

      .food-amount {
        color: var(--p-text-color-secondary);
        font-size: 0.875rem;
      }

      .meal-nutrition {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .insights-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .insight-item {
        display: flex;
        gap: 1rem;
        padding: 1rem;
        border-radius: var(--p-border-radius);
      }

      .insight-item.positive {
        background: var(--p-green-50);
        border-left: 4px solid var(--p-green-500);
      }

      .insight-item.warning {
        background: var(--p-orange-50);
        border-left: 4px solid var(--p-orange-500);
      }

      .insight-item.negative {
        background: var(--p-red-50);
        border-left: 4px solid var(--p-red-500);
      }

      .insight-icon {
        display: flex;
        align-items: center;
        font-size: 1.5rem;
      }

      .insight-content h5 {
        margin: 0 0 0.5rem 0;
        color: var(--p-text-color);
      }

      .insight-content p {
        margin: 0 0 0.75rem 0;
        color: var(--p-text-color-secondary);
      }
    `,
  ],
})
export class NutritionDashboardComponent {
  private nutritionService = inject(NutritionService);
  private logger = inject(LoggerService);

  selectedFood: any = null;
  foodSuggestions = signal<any[]>([]);
  nutritionGoals = signal<NutritionGoal[]>([]);
  todaysMeals = signal<any[]>([]);

  constructor() {
    // Angular 21: Initialize in constructor instead of OnInit
    this.loadNutritionGoals();
    this.loadTodaysMeals();
    this.loadAISuggestions();
    this.loadPerformanceInsights();
  }
  aiSuggestions = signal<any[]>([]);
  performanceInsights = signal<any[]>([]);

  doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  async searchFoods(event: any) {
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

  addSuggestedFood(suggestion: any) {
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

  getProgressStyle(goal: NutritionGoal) {
    const percentage = (goal.current / goal.target) * 100;
    let color = "#10c96b"; // Green for achieved

    if (percentage < 50)
      color = "#ef4444"; // Red for low
    else if (percentage < 80) color = "#f1c40f"; // Yellow for medium

    return { "--p-progressbar-value-bg": color } as any;
  }

  getNutrientSources(nutrient: string): string[] {
    // Get food sources rich in this nutrient from database
    return this.nutritionService.getNutrientSources(nutrient);
  }

  getMealNutritionChart(meal: any) {
    return {
      labels: ["Carbs", "Protein", "Fat"],
      datasets: [
        {
          data: [meal.carbs, meal.protein, meal.fat],
          backgroundColor: ["#f1c40f", "#10c96b", "#ef4444"],
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    };
  }

  executeInsightAction(insight: any) {
    // Handle insight actions (e.g., add recommended food, adjust meal timing)
    this.logger.debug("Executing insight action:", insight);
  }
}
