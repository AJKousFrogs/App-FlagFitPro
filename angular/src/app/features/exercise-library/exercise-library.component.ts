import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { TagModule } from "primeng/tag";
import { PaginatorModule } from "primeng/paginator";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";

interface Exercise {
  id: string;
  name: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  muscleGroups: string[];
  equipment: string[];
  description: string;
}

@Component({
  selector: "app-exercise-library",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    PaginatorModule,
    MainLayoutComponent,
    PageHeaderComponent,
  ],
  template: `
    <app-main-layout>
      <div class="exercise-library-page">
        <app-page-header
          title="Exercise Library"
          subtitle="Browse and discover exercises for your training program"
          icon="pi-book"
        ></app-page-header>

        <!-- Search and Filters -->
        <p-card class="filters-card">
          <div class="filters-content">
            <input
              pInputText
              [(ngModel)]="searchQuery"
              placeholder="Search exercises..."
              class="search-input"
            />
            <div class="filter-tags">
              @for (
                category of categories;
                track trackByCategory($index, category)
              ) {
                <p-tag
                  [value]="category"
                  [styleClass]="
                    selectedCategory() === category ? 'selected' : ''
                  "
                  (click)="filterByCategory(category)"
                  [style]="{ cursor: 'pointer' }"
                >
                </p-tag>
              }
            </div>
          </div>
        </p-card>

        <!-- Exercises Grid -->
        <div class="exercises-grid">
          @for (
            exercise of filteredExercises();
            track trackByExerciseId($index, exercise)
          ) {
            <p-card class="exercise-card">
              <div class="exercise-header">
                <h3 class="exercise-name">{{ exercise.name }}</h3>
                <p-tag
                  [value]="exercise.difficulty"
                  [severity]="getDifficultySeverity(exercise.difficulty)"
                >
                </p-tag>
              </div>
              <p class="exercise-category">{{ exercise.category }}</p>
              <p class="exercise-description">{{ exercise.description }}</p>
              <div class="exercise-tags">
                @for (
                  group of exercise.muscleGroups;
                  track trackByMuscleGroup($index, group)
                ) {
                  <p-tag [value]="group" severity="info" styleClass="mr-2">
                  </p-tag>
                }
              </div>
              <div class="exercise-actions">
                <p-button
                  label="View Details"
                  [outlined]="true"
                  size="small"
                ></p-button>
                <p-button
                  label="Add to Workout"
                  icon="pi pi-plus"
                  size="small"
                ></p-button>
              </div>
            </p-card>
          }
        </div>

        <!-- Pagination -->
        <p-paginator
          [rows]="itemsPerPage"
          [totalRecords]="totalExercises()"
          (onPageChange)="onPageChange($event)"
          [rowsPerPageOptions]="[12, 24, 48]"
        >
        </p-paginator>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .exercise-library-page {
        padding: var(--space-6);
      }

      .page-header {
        margin-bottom: var(--space-6);
        padding: var(--space-5);
        background: var(--surface-primary);
        border-radius: var(--p-border-radius);
      }

      .page-title {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--text-primary);
      }

      .page-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .filters-card {
        margin-bottom: var(--space-6);
      }

      .filters-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .search-input {
        width: 100%;
      }

      .filter-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .filter-tags .p-tag.selected {
        background: var(--color-brand-primary);
        color: white;
      }

      .exercises-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .exercise-card {
        transition: transform 0.2s;
      }

      .exercise-card:hover {
        transform: translateY(-4px);
      }

      .exercise-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--space-2);
      }

      .exercise-name {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
      }

      .exercise-category {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin-bottom: var(--space-2);
      }

      .exercise-description {
        font-size: 0.875rem;
        color: var(--text-primary);
        line-height: 1.6;
        margin-bottom: var(--space-3);
      }

      .exercise-tags {
        margin-bottom: var(--space-3);
      }

      .exercise-actions {
        display: flex;
        gap: var(--space-2);
      }

      @media (max-width: 768px) {
        .exercises-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ExerciseLibraryComponent implements OnInit {
  private apiService = inject(ApiService);

  searchQuery = "";
  selectedCategory = signal<string>("all");
  categories = ["all", "Strength", "Cardio", "Flexibility", "Speed", "Agility"];
  exercises = signal<Exercise[]>([]);
  filteredExercises = signal<Exercise[]>([]);
  totalExercises = signal(0);
  itemsPerPage = 12;
  currentPage = 0;

  ngOnInit(): void {
    this.loadExercises();
  }

  loadExercises(): void {
    // Load exercises
    const allExercises: Exercise[] = [
      {
        id: "1",
        name: "40-Yard Dash",
        category: "Speed",
        difficulty: "beginner",
        muscleGroups: ["Legs", "Core"],
        equipment: ["None"],
        description:
          "Sprint 40 yards as fast as possible to measure speed and acceleration.",
      },
      {
        id: "2",
        name: "Vertical Jump",
        category: "Strength",
        difficulty: "intermediate",
        muscleGroups: ["Legs", "Glutes"],
        equipment: ["None"],
        description:
          "Jump vertically as high as possible to measure explosive leg power.",
      },
      {
        id: "3",
        name: "Broad Jump",
        category: "Speed",
        difficulty: "beginner",
        muscleGroups: ["Legs", "Core"],
        equipment: ["None"],
        description:
          "Jump horizontally as far as possible to measure lower body power.",
      },
      {
        id: "4",
        name: "Bench Press",
        category: "Strength",
        difficulty: "advanced",
        muscleGroups: ["Chest", "Shoulders", "Triceps"],
        equipment: ["Barbell", "Bench"],
        description:
          "Press weight upward from chest to measure upper body strength.",
      },
    ];

    this.exercises.set(allExercises);
    this.totalExercises.set(allExercises.length);
    this.applyFilters();
  }

  filterByCategory(category: string): void {
    this.selectedCategory.set(category);
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.exercises()];

    // Filter by category
    if (this.selectedCategory() !== "all") {
      filtered = filtered.filter(
        (ex) => ex.category === this.selectedCategory(),
      );
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ex) =>
          ex.name.toLowerCase().includes(query) ||
          ex.description.toLowerCase().includes(query) ||
          ex.muscleGroups.some((g) => g.toLowerCase().includes(query)),
      );
    }

    this.filteredExercises.set(filtered);
    this.totalExercises.set(filtered.length);
  }

  onPageChange(event: { page: number; rows: number }): void {
    this.currentPage = event.page;
    this.itemsPerPage = event.rows;
  }

  getDifficultySeverity(difficulty: string): "success" | "info" | "warn" {
    const severities: Record<string, "success" | "info" | "warn"> = {
      beginner: "success",
      intermediate: "info",
      advanced: "warn",
    };
    return severities[difficulty] || "info";
  }

  trackByCategory(index: number, category: string): string {
    return category;
  }

  trackByExerciseId(index: number, exercise: Exercise): string {
    return exercise.id;
  }

  trackByMuscleGroup(index: number, group: string): string {
    return group;
  }
}
