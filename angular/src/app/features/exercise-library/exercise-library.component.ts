import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { MessageService } from "primeng/api";
import { BadgeModule } from "primeng/badge";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { PaginatorModule } from "primeng/paginator";
import { RippleModule } from "primeng/ripple";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { COLORS } from "../../core/constants/app.constants";
import { ApiService } from "../../core/services/api.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { Workout } from "../../core/models/training.models";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";

interface Exercise {
  id: string;
  name: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  muscleGroups: string[];
  equipment: string[];
  description: string;
}

interface Category {
  name: string;
  icon: string;
  color: string;
}

@Component({
  selector: "app-exercise-library",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CardModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    TagModule,
    PaginatorModule,
    TooltipModule,
    RippleModule,
    BadgeModule,
    DialogModule,
    ToastModule,
    MainLayoutComponent,
  
    ButtonComponent,
  ],
  providers: [MessageService],
  template: `
    <app-main-layout>
      <div class="exercise-library-page">
        <!-- Premium Header with Stats -->
        <div class="page-hero">
          <div class="hero-content">
            <div class="hero-text">
              <h1 class="hero-title">
                <i class="pi pi-book"></i>
                Exercise Library
              </h1>
              <p class="hero-subtitle">
                Browse and discover {{ totalExercises() }} evidence-based
                exercises for your training program
              </p>
            </div>
            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-value">{{ totalExercises() }}</span>
                <span class="stat-label">Exercises</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ categories.length - 1 }}</span>
                <span class="stat-label">Categories</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Modern Search and Filters -->
        <div class="search-filters-section">
          <!-- Search Bar with Icon -->
          <p-iconfield class="search-container">
            <p-inputicon>
              <i class="pi pi-search"></i>
            </p-inputicon>
            <input
              pInputText
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
              placeholder="Search exercises by name, muscle group, or equipment..."
              class="search-input"
            />
          </p-iconfield>

          <!-- Category Filters -->
          <div class="filter-section">
            <h3 class="filter-title">
              <i class="pi pi-filter"></i>
              Filter by Category
            </h3>
            <div class="filter-chips">
              @for (category of categoryList; track category.name) {
                <button
                  class="filter-chip"
                  [class.active]="selectedCategory() === category.name"
                  (click)="filterByCategory(category.name)"
                  [pTooltip]="'Filter by ' + category.name"
                  pRipple
                >
                  <i [class]="'pi ' + category.icon"></i>
                  <span>{{ category.name }}</span>
                  @if (
                    selectedCategory() === category.name &&
                    category.name !== "all"
                  ) {
                    <i class="pi pi-times-circle close-icon"></i>
                  }
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Results Summary -->
        @if (filteredExercises().length > 0) {
          <div class="results-summary">
            <p>
              <strong>{{ filteredExercises().length }}</strong>
              {{ filteredExercises().length === 1 ? "exercise" : "exercises" }}
              found
              @if (selectedCategory() !== "all") {
                <span>
                  in <strong>{{ selectedCategory() }}</strong></span
                >
              }
            </p>
          </div>
        }

        <!-- Exercises Grid -->
        <div class="exercises-grid">
          @for (exercise of paginatedExercises(); track exercise.id) {
            <div class="exercise-card">
              <div class="card-header">
                <div class="header-left">
                  <i
                    [class]="
                      'pi ' +
                      getCategoryIcon(exercise.category) +
                      ' category-icon'
                    "
                  ></i>
                  <div class="title-group">
                    <h3 class="exercise-name">{{ exercise.name }}</h3>
                    <span class="exercise-category">{{
                      exercise.category
                    }}</span>
                  </div>
                </div>
                <span
                  class="difficulty-badge"
                  [class]="'difficulty-' + exercise.difficulty"
                  [pTooltip]="getDifficultyTooltip(exercise.difficulty)"
                >
                  {{ exercise.difficulty }}
                </span>
              </div>

              <p class="exercise-description">{{ exercise.description }}</p>

              <div class="muscle-groups">
                <span class="section-label">
                  <i class="pi pi-heart-fill"></i>
                  Target Muscles
                </span>
                <div class="muscle-tags">
                  @for (group of exercise.muscleGroups; track group) {
                    <span class="muscle-tag">{{ group }}</span>
                  }
                </div>
              </div>

              @if (
                exercise.equipment.length > 0 &&
                exercise.equipment[0] !== "None"
              ) {
                <div class="equipment-info">
                  <i class="pi pi-wrench"></i>
                  <span>{{ exercise.equipment.join(", ") }}</span>
                </div>
              }

              <div class="card-actions">
                <button
                  class="action-btn secondary"
                  (click)="viewExerciseDetails(exercise)"
                  pRipple
                  [pTooltip]="'View full exercise details'"
                >
                  <i class="pi pi-eye"></i>
                  <span>View Details</span>
                </button>
                <button
                  class="action-btn primary"
                  (click)="addToWorkout(exercise)"
                  pRipple
                  [pTooltip]="'Add to your workout plan'"
                >
                  <i class="pi pi-plus"></i>
                  <span>Add to Workout</span>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Empty State -->
        @if (filteredExercises().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <i class="pi pi-search"></i>
            </div>
            <h3>No exercises found</h3>
            <p>
              Try adjusting your search or filters to find what you're looking
              for.
            </p>
            <button class="reset-btn" (click)="resetFilters()" pRipple>
              <i class="pi pi-refresh"></i>
              Reset Filters
            </button>
          </div>
        }

        <!-- Pagination -->
        @if (filteredExercises().length > itemsPerPage) {
          <div class="pagination-container">
            <p-paginator
              [rows]="itemsPerPage"
              [totalRecords]="filteredExercises().length"
              [first]="currentPage * itemsPerPage"
              (onPageChange)="onPageChange($event)"
              [rowsPerPageOptions]="[8, 12, 24]"
            />
          </div>
        }
      </div>

      <!-- Exercise Details Dialog -->
      <p-dialog
        [(visible)]="showDetailsDialog"
        [modal]="true"
        [closable]="true"
        [closeOnEscape]="true"
        [dismissableMask]="true"
        [style]="{ width: '600px', maxWidth: '90vw' }"
        header="Exercise Details"
        styleClass="exercise-details-dialog"
      >
        @if (selectedExercise()) {
          <div class="dialog-content">
            <div class="detail-header">
              <i
                [class]="
                  'pi ' +
                  getCategoryIcon(selectedExercise()!.category) +
                  ' detail-icon'
                "
              ></i>
              <div>
                <h2 class="exercise-title">{{ selectedExercise()!.name }}</h2>
                <span class="category-label">{{
                  selectedExercise()!.category
                }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h3><i class="pi pi-info-circle"></i> Description</h3>
              <p>{{ selectedExercise()!.description }}</p>
            </div>

            <div class="detail-section">
              <h3><i class="pi pi-signal"></i> Difficulty</h3>
              <span
                class="difficulty-badge-large"
                [class]="'difficulty-' + selectedExercise()!.difficulty"
              >
                {{ selectedExercise()!.difficulty }}
              </span>
            </div>

            <div class="detail-section">
              <h3><i class="pi pi-heart-fill"></i> Target Muscle Groups</h3>
              <div class="muscle-tags-large">
                @for (group of selectedExercise()!.muscleGroups; track group) {
                  <span class="muscle-tag-large">{{ group }}</span>
                }
              </div>
            </div>

            @if (
              selectedExercise()!.equipment.length > 0 &&
              selectedExercise()!.equipment[0] !== "None"
            ) {
              <div class="detail-section">
                <h3><i class="pi pi-wrench"></i> Required Equipment</h3>
                <div class="equipment-list">
                  @for (item of selectedExercise()!.equipment; track item) {
                    <span class="equipment-item">{{ item }}</span>
                  }
                </div>
              </div>
            }
          </div>

          <ng-template pTemplate="footer">
            <app-button iconLeft="pi-plus" (clicked)="
                addToWorkout(selectedExercise()!); showDetailsDialog.set(false)
              ">Add to Workout</app-button>
            <app-button iconLeft="pi-times" (clicked)="showDetailsDialog.set(false)">Close</app-button>
          </ng-template>
        }
      </p-dialog>

      <!-- Toast for notifications -->
      <p-toast position="top-right" />
    </app-main-layout>
  `,
  styleUrl: "./exercise-library.component.scss",
})
export class ExerciseLibraryComponent implements OnInit {
  private apiService = inject(ApiService);
  private messageService = inject(MessageService);
  private trainingService = inject(UnifiedTrainingService);

  searchQuery = "";
  selectedCategory = signal<string>("all");
  showDetailsDialog = signal(false);
  selectedExercise = signal<Exercise | null>(null);

  categoryList: Category[] = [
    { name: "all", icon: "pi-th-large", color: COLORS.GRAY },
    { name: "Strength", icon: "pi-bolt", color: COLORS.ERROR },
    { name: "Cardio", icon: "pi-heart", color: COLORS.AMBER },
    { name: "Flexibility", icon: "pi-arrows-alt", color: COLORS.PURPLE_LIGHT },
    { name: "Speed", icon: "pi-forward", color: COLORS.BLUE },
    { name: "Agility", icon: "pi-sync", color: COLORS.SUCCESS },
  ];

  categories = ["all", "Strength", "Cardio", "Flexibility", "Speed", "Agility"];

  exercises = signal<Exercise[]>([]);
  filteredExercises = signal<Exercise[]>([]);
  totalExercises = computed(() => this.exercises().length);

  itemsPerPage = 8;
  currentPage = 0;

  paginatedExercises = computed(() => {
    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredExercises().slice(start, end);
  });

  ngOnInit(): void {
    this.loadExercises();
  }

  loadExercises(): void {
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
      {
        id: "5",
        name: "Box Jumps",
        category: "Agility",
        difficulty: "intermediate",
        muscleGroups: ["Legs", "Core"],
        equipment: ["Plyometric Box"],
        description:
          "Jump onto elevated platform to develop explosive power and coordination.",
      },
      {
        id: "6",
        name: "Cone Drills",
        category: "Agility",
        difficulty: "beginner",
        muscleGroups: ["Legs", "Core"],
        equipment: ["Cones"],
        description:
          "Navigate around cones to improve change of direction and footwork.",
      },
      {
        id: "7",
        name: "Burpees",
        category: "Cardio",
        difficulty: "intermediate",
        muscleGroups: ["Full Body"],
        equipment: ["None"],
        description:
          "Full-body exercise combining squat, plank, and jump for conditioning.",
      },
      {
        id: "8",
        name: "Yoga Flow",
        category: "Flexibility",
        difficulty: "beginner",
        muscleGroups: ["Full Body"],
        equipment: ["Mat"],
        description:
          "Flowing sequence of poses to improve flexibility and mobility.",
      },
    ];

    this.exercises.set(allExercises);
    this.applyFilters();
  }

  filterByCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage = 0;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.currentPage = 0;
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
          ex.muscleGroups.some((g) => g.toLowerCase().includes(query)) ||
          ex.equipment.some((e) => e.toLowerCase().includes(query)),
      );
    }

    this.filteredExercises.set(filtered);
  }

  onPageChange(event: { page?: number; rows?: number; first?: number }): void {
    this.currentPage = event.page ?? 0;
    this.itemsPerPage = event.rows ?? 8;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      Strength: "pi-bolt",
      Cardio: "pi-heart",
      Flexibility: "pi-arrows-alt",
      Speed: "pi-forward",
      Agility: "pi-sync",
    };
    return icons[category] || "pi-circle";
  }

  getDifficultyTooltip(difficulty: string): string {
    const tooltips: Record<string, string> = {
      beginner: "Suitable for beginners - No experience required",
      intermediate: "Intermediate level - Some experience recommended",
      advanced: "Advanced level - Significant experience required",
    };
    return tooltips[difficulty] || "";
  }

  viewExerciseDetails(exercise: Exercise): void {
    this.selectedExercise.set(exercise);
    this.showDetailsDialog.set(true);
  }

  addToWorkout(exercise: Exercise): void {
    // Convert Exercise to a Workout object for the service
    const workout: Workout = {
      type: exercise.category.toLowerCase(),
      title: exercise.name,
      description: exercise.description,
      duration: "30 min", // Default duration
      intensity: exercise.difficulty === "advanced" ? "high" : exercise.difficulty === "intermediate" ? "medium" : "low",
      location: "Gym",
      icon: this.getCategoryIcon(exercise.category),
      iconBg: COLORS.PRIMARY
    };

    this.trainingService.logTrainingSession({
      session_type: workout.type,
      title: workout.title,
      duration: 30,
      intensity: exercise.difficulty === "advanced" ? 9 : exercise.difficulty === "intermediate" ? 6 : 3,
      completed: true,
      notes: `Added from Exercise Library: ${exercise.description}`
    }).then(() => {
      this.messageService.add({
        severity: "success",
        summary: "Added to Workout",
        detail: `"${exercise.name}" has been logged to your daily protocol`,
        life: 3000,
      });
    }).catch(_err => {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "Failed to add exercise to workout",
        life: 3000,
      });
    });
  }

  resetFilters(): void {
    this.searchQuery = "";
    this.selectedCategory.set("all");
    this.currentPage = 0;
    this.applyFilters();
  }
}
