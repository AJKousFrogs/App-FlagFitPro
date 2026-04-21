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

import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { ToastService } from "../../core/services/toast.service";

import { Paginator } from "primeng/paginator";

import { Tooltip } from "primeng/tooltip";
import { COLORS } from "../../core/constants/app.constants";
import { ApiService } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { extractApiArray } from "../../core/utils/api-response-mapper";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { DialogFooterComponent } from "../../shared/components/dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../../shared/components/dialog-header/dialog-header.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageErrorStateComponent } from "../../shared/components/page-error-state/page-error-state.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { SearchInputComponent } from "../../shared/components/search-input/search-input.component";
import { SkeletonRepeatComponent } from "../../shared/components/skeleton-loader/skeleton-loader.component";

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    Paginator,
    Tooltip,
    AppDialogComponent,

    MainLayoutComponent,
    DialogFooterComponent,
    DialogHeaderComponent,
    SearchInputComponent,
    EmptyStateComponent,
    PageErrorStateComponent,
    PageHeaderComponent,
    SkeletonRepeatComponent,
  ],
  templateUrl: "./exercise-library.component.html",
  styleUrl: "./exercise-library.component.scss",
})
export class ExerciseLibraryComponent implements OnInit {
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);
  private trainingService = inject(UnifiedTrainingService);
  private sanitizer = inject(DomSanitizer);
  private logger = inject(LoggerService);

  // ViewChild references for scroll operations
  private readonly exercisesGrid =
    viewChild<ElementRef<HTMLElement>>("exercisesGrid");

  readonly searchControl = new FormControl("", { nonNullable: true });
  searchQuery = "";
  selectedCategory = signal<string>("all");
  showDetailsDialog = signal(false);
  selectedExercise = signal<Exercise | null>(null);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

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
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.searchQuery = query;
        this.onSearchChange();
      });
    this.loadExercises();
  }

  loadExercises(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    interface ExerciseApi {
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
    }
    this.apiService.get<ExerciseApi[]>("/api/exercises").pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        const exercises = extractApiArray<ExerciseApi>(response);
        if (exercises) {
          const mappedExercises: Exercise[] = exercises.map((ex) => {
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
          this.isLoading.set(false);
        } else {
          this.isLoading.set(false);
          this.errorMessage.set("We couldn't load the exercise library right now.");
          this.toastService.error("Failed to load exercises");
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          "We couldn't load the exercise library right now. Please try again.",
        );
        this.logger.error("Failed to load exercises", err);
        this.toastService.error("Failed to load exercises from database");
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

  closeDetailsDialog(): void {
    this.showDetailsDialog.set(false);
    this.selectedExercise.set(null);
  }

  viewExerciseDetails(exercise: Exercise): void {
    this.closeDetailsDialog();
    this.selectedExercise.set(exercise);
    this.showDetailsDialog.set(true);
  }

  addSelectedExerciseToWorkout(): void {
    const exercise = this.selectedExercise();
    if (!exercise) {
      return;
    }
    this.addToWorkout(exercise);
    this.closeDetailsDialog();
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
        this.toastService.success(
          `"${exercise.name}" has been added to your training log`,
          "Exercise Added",
        );
      })
      .catch((err) => {
        this.logger.error("Failed to add exercise", err);
        this.toastService.error(
          "Failed to add exercise to training log. Please try again.",
        );
      });
  }

  readonly resetFiltersHandler = (): void => this.resetFilters();

  resetFilters(): void {
    this.searchControl.setValue("");
    this.selectedCategory.set("all");
    this.currentPage = 0;
    this.applyFilters();
  }
}
