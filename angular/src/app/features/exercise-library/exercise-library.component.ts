import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  signal,
  DestroyRef,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { FormsModule } from "@angular/forms";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { MessageService, PrimeTemplate } from "primeng/api";

import { Dialog } from "primeng/dialog";
import { Paginator } from "primeng/paginator";

import { Tooltip } from "primeng/tooltip";
import { COLORS } from "../../core/constants/app.constants";
import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { SearchInputComponent } from "../../shared/components/search-input/search-input.component";

interface Exercise {
  id: string;
  name: string;
  slug?: string;
  category: string;
  subcategory?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  muscleGroups: string[];
  equipment: string[];
  description: string;
  video_url?: string;
  video_id?: string;
  how_text?: string;
  feel_text?: string;
  compensation_text?: string;
  default_sets?: number;
  default_reps?: number;
  default_hold_seconds?: number;
  default_duration_seconds?: number;
  position_specific?: string[];
  load_contribution_au?: number;
  is_high_intensity?: boolean;
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
    Paginator,
    Tooltip,
    Dialog,
    PrimeTemplate,

    MainLayoutComponent,
    ButtonComponent,
    SearchInputComponent,
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
              <div class="stat-block stat-block--large">
                <div class="stat-block__content">
                  <span class="stat-block__value">{{ totalExercises() }}</span>
                  <span class="stat-block__label">Exercises</span>
                </div>
              </div>
              <div class="stat-block stat-block--large">
                <div class="stat-block__content">
                  <span class="stat-block__value">{{
                    categories.length - 1
                  }}</span>
                  <span class="stat-block__label">Categories</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modern Search and Filters -->
        <div class="search-filters-section">
          <!-- Search Bar with Icon -->
          <app-search-input
            class="search-container"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearchChange()"
            placeholder="Search exercises by name, muscle group, or equipment..."
            ariaLabel="Search exercises by name, muscle group, or equipment"
          />

          <!-- Category Filters -->
          <div class="filter-section ds-card-surface">
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
        <div class="exercises-grid" #exercisesGrid>
          @for (exercise of paginatedExercises(); track exercise.id) {
            <div class="exercise-card ds-card-surface">
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
                  [pTooltip]="'View full exercise details'"
                >
                  <i class="pi pi-eye"></i>
                  <span>View Details</span>
                </button>
                <button
                  class="action-btn primary"
                  (click)="addToWorkout(exercise)"
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
            <button class="reset-btn" (click)="resetFilters()">
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
                @if (selectedExercise()!.subcategory) {
                  <span class="subcategory-label">
                    - {{ selectedExercise()!.subcategory }}</span
                  >
                }
              </div>
            </div>

            @if (selectedExercise()!.video_url) {
              <div class="detail-section video-section">
                <h3><i class="pi pi-video"></i> Video Tutorial</h3>
                @if (selectedExercise()!.video_id) {
                  <div class="video-container">
                    <iframe
                      [src]="videoEmbedUrl()"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                  </div>
                } @else {
                  <a
                    [href]="selectedExercise()!.video_url"
                    target="_blank"
                    class="video-link"
                  >
                    <i class="pi pi-external-link"></i> Watch Video
                  </a>
                }
              </div>
            }

            @if (selectedExercise()!.how_text) {
              <div class="detail-section">
                <h3><i class="pi pi-info-circle"></i> How to Perform</h3>
                <p>{{ selectedExercise()!.how_text }}</p>
              </div>
            } @else {
              <div class="detail-section">
                <h3><i class="pi pi-info-circle"></i> Description</h3>
                <p>{{ selectedExercise()!.description }}</p>
              </div>
            }

            @if (selectedExercise()!.feel_text) {
              <div class="detail-section">
                <h3><i class="pi pi-heart"></i> What You Should Feel</h3>
                <p>{{ selectedExercise()!.feel_text }}</p>
              </div>
            }

            @if (selectedExercise()!.compensation_text) {
              <div class="detail-section warning-section">
                <h3>
                  <i class="pi pi-exclamation-triangle"></i> Common Mistakes to
                  Avoid
                </h3>
                <p>{{ selectedExercise()!.compensation_text }}</p>
              </div>
            }

            <div class="detail-section">
              <h3><i class="pi pi-signal"></i> Difficulty</h3>
              <span
                class="difficulty-badge-large"
                [class]="'difficulty-' + selectedExercise()!.difficulty"
              >
                {{ selectedExercise()!.difficulty }}
              </span>
            </div>

            @if (
              selectedExercise()!.muscleGroups &&
              selectedExercise()!.muscleGroups.length > 0
            ) {
              <div class="detail-section">
                <h3><i class="pi pi-heart-fill"></i> Target Muscle Groups</h3>
                <div class="muscle-tags-large">
                  @for (
                    group of selectedExercise()!.muscleGroups;
                    track group
                  ) {
                    <span class="muscle-tag-large">{{ group }}</span>
                  }
                </div>
              </div>
            }

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

            @if (
              selectedExercise()!.default_sets ||
              selectedExercise()!.default_reps ||
              selectedExercise()!.default_hold_seconds ||
              selectedExercise()!.default_duration_seconds
            ) {
              <div class="detail-section">
                <h3><i class="pi pi-list"></i> Recommended Prescription</h3>
                <div class="prescription-info">
                  @if (selectedExercise()!.default_sets) {
                    <p>
                      <strong>Sets:</strong>
                      {{ selectedExercise()!.default_sets }}
                    </p>
                  }
                  @if (selectedExercise()!.default_reps) {
                    <p>
                      <strong>Reps:</strong>
                      {{ selectedExercise()!.default_reps }}
                    </p>
                  }
                  @if (selectedExercise()!.default_hold_seconds) {
                    <p>
                      <strong>Hold Time:</strong>
                      {{ selectedExercise()!.default_hold_seconds }}s
                    </p>
                  }
                  @if (selectedExercise()!.default_duration_seconds) {
                    <p>
                      <strong>Duration:</strong>
                      {{ selectedExercise()!.default_duration_seconds }}s
                    </p>
                  }
                </div>
              </div>
            }

            @if (selectedExercise()!.position_specific?.length) {
              <div class="detail-section">
                <h3><i class="pi pi-users"></i> Position Specific</h3>
                <div class="position-tags">
                  @for (
                    position of selectedExercise()!.position_specific;
                    track position
                  ) {
                    <span class="position-tag">{{ position }}</span>
                  }
                </div>
              </div>
            }
          </div>

          <ng-template pTemplate="footer">
            <app-button
              iconLeft="pi-plus"
              (clicked)="
                addToWorkout(selectedExercise()!); showDetailsDialog.set(false)
              "
              >Add to Workout</app-button
            >
            <app-button
              iconLeft="pi-times"
              (clicked)="showDetailsDialog.set(false)"
              >Close</app-button
            >
          </ng-template>
        }
      </p-dialog>

      <!--for notifications -->
</app-main-layout>
  `,
  styleUrl: "./exercise-library.component.scss",
})
export class ExerciseLibraryComponent implements OnInit {
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private messageService = inject(MessageService);
  private trainingService = inject(UnifiedTrainingService);
  private sanitizer = inject(DomSanitizer);
  private logger = inject(LoggerService);

  // ViewChild references for scroll operations
  private readonly exercisesGrid =
    viewChild<ElementRef<HTMLElement>>("exercisesGrid");

  searchQuery = "";
  selectedCategory = signal<string>("all");
  showDetailsDialog = signal(false);
  selectedExercise = signal<Exercise | null>(null);

  categoryList: Category[] = [
    { name: "all", icon: "pi-th-large", color: COLORS.GRAY },
    { name: "mobility", icon: "pi-arrows-alt", color: COLORS.PURPLE_LIGHT },
    { name: "foam_roll", icon: "pi-circle", color: COLORS.BLUE },
    { name: "warm_up", icon: "pi-sun", color: COLORS.AMBER },
    { name: "strength", icon: "pi-bolt", color: COLORS.ERROR },
    { name: "isometric", icon: "pi-pause", color: COLORS.AMBER },
    { name: "skill", icon: "pi-star", color: COLORS.SUCCESS },
    { name: "conditioning", icon: "pi-heart", color: COLORS.ERROR },
    { name: "plyometric", icon: "pi-forward", color: COLORS.BLUE },
    { name: "recovery", icon: "pi-refresh", color: COLORS.SUCCESS },
    { name: "cool_down", icon: "pi-moon", color: COLORS.PURPLE_LIGHT },
  ];

  categories = [
    "all",
    "mobility",
    "foam_roll",
    "warm_up",
    "strength",
    "isometric",
    "skill",
    "conditioning",
    "plyometric",
    "recovery",
    "cool_down",
  ];

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

  videoEmbedUrl = computed((): SafeResourceUrl | null => {
    const exercise = this.selectedExercise();
    if (!exercise?.video_id) return null;
    const url = `https://www.youtube.com/embed/${exercise.video_id}?rel=0&modestbranding=1`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

  ngOnInit(): void {
    this.loadExercises();
  }

  loadExercises(): void {
    type ExerciseApi = {
      id: string;
      name: string;
      slug: string;
      category?: string;
      subcategory?: string;
      difficulty_level?: string;
      target_muscles?: string[];
      equipment_required?: string[];
      description?: string;
      video_url?: string;
      video_id?: string;
      how_text?: string;
      feel_text?: string;
      compensation_text?: string;
      default_sets?: number;
      default_reps?: number;
      default_hold_seconds?: number;
      default_duration_seconds?: number;
      calories_burned?: number;
      intensity?: string;
      movement_pattern?: string;
      position_specific?: string | string[];
      load_contribution_au?: number;
      is_high_intensity?: boolean;
      requires_timer?: boolean;
      is_featured?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    this.apiService.get<ExerciseApi[]>("/api/exercises").pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const mappedExercises: Exercise[] = response.data.map((ex) => {
            const positionSpecific = Array.isArray(ex.position_specific)
              ? ex.position_specific
              : ex.position_specific
                ? ex.position_specific
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean)
                : undefined;
            return {
            id: ex.id,
            name: ex.name,
            slug: ex.slug,
            category: ex.category || "strength",
            subcategory: ex.subcategory,
            difficulty: (ex.difficulty_level || "beginner") as
              | "beginner"
              | "intermediate"
              | "advanced",
            muscleGroups: ex.target_muscles || [],
            equipment: ex.equipment_required || ["None"],
            description:
              ex.how_text || ex.description || "No description available",
            video_url: ex.video_url,
            video_id: ex.video_id,
            how_text: ex.how_text,
            feel_text: ex.feel_text,
            compensation_text: ex.compensation_text,
            default_sets: ex.default_sets,
            default_reps: ex.default_reps,
            default_hold_seconds: ex.default_hold_seconds,
            default_duration_seconds: ex.default_duration_seconds,
            position_specific: positionSpecific,
            load_contribution_au: ex.load_contribution_au,
            is_high_intensity: ex.is_high_intensity,
          };
        });

          this.exercises.set(mappedExercises);
          this.applyFilters();
        } else {
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: "Failed to load exercises",
            life: 3000,
          });
        }
      },
      error: (err) => {
        this.logger.error("Failed to load exercises", err);
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Failed to load exercises from database",
          life: 3000,
        });
      },
    });
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

    // Filter by category (case-insensitive)
    if (this.selectedCategory() !== "all") {
      const selectedCat = this.selectedCategory().toLowerCase();
      filtered = filtered.filter(
        (ex) => ex.category.toLowerCase() === selectedCat,
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
    // Scroll to the exercises grid, not the top of the page
    const gridEl = this.exercisesGrid();
    if (gridEl) {
      gridEl.nativeElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      mobility: "pi-arrows-alt",
      foam_roll: "pi-circle",
      warm_up: "pi-sun",
      strength: "pi-bolt",
      isometric: "pi-pause",
      skill: "pi-star",
      conditioning: "pi-heart",
      plyometric: "pi-forward",
      recovery: "pi-refresh",
      cool_down: "pi-moon",
      // Legacy support
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
    // Create a proper training session from the exercise
    const sessionData = {
      session_type: exercise.category,
      title: exercise.name,
      duration: exercise.default_duration_seconds
        ? Math.ceil(exercise.default_duration_seconds / 60)
        : exercise.default_sets
          ? exercise.default_sets * (exercise.default_reps || 1)
          : 30, // Default 30 minutes
      intensity:
        exercise.difficulty === "advanced"
          ? 8
          : exercise.difficulty === "intermediate"
            ? 6
            : 4,
      completed: true,
      notes: `Exercise from library: ${exercise.description || exercise.how_text || ""}`,
      exercise_details: {
        exercise_id: exercise.id,
        sets: exercise.default_sets,
        reps: exercise.default_reps,
        hold_seconds: exercise.default_hold_seconds,
        duration_seconds: exercise.default_duration_seconds,
        equipment: exercise.equipment,
        target_muscles: exercise.muscleGroups,
      },
    };

    this.trainingService
      .logTrainingSession(sessionData)
      .then(() => {
        this.messageService.add({
          severity: "success",
          summary: "Exercise Added",
          detail: `"${exercise.name}" has been added to your training log`,
          life: 3000,
        });
      })
      .catch((err) => {
        this.logger.error("Failed to add exercise", err);
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Failed to add exercise to training log. Please try again.",
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
