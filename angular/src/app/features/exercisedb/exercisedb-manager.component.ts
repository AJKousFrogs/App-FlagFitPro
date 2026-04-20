import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
  DestroyRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { FormInputComponent } from "../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../shared/components/select/select.component";
import { MultiSelect, type MultiSelectChangeEvent } from "primeng/multiselect";
import { ProgressBarComponent } from "../../shared/components/progress-bar/progress-bar.component";
import { Tabs, TabList, Tab, TabPanels, TabPanel } from "primeng/tabs";
import { Chip } from "primeng/chip";
import { BadgeComponent } from "../../shared/components/badge/badge.component";

import { ToastService } from "../../core/services/toast.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { SearchInputComponent } from "../../shared/components/search-input/search-input.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { DialogHeaderComponent } from "../../shared/components/dialog-header/dialog-header.component";
import { formatDate as formatDateValue } from "../../shared/utils/date.utils";
import { getStatusSeverity } from "../../shared/utils/status.utils";
import {
  ExerciseDBService,
  ExerciseDBExercise,
  ExerciseDBFilters,
  ImportStats,
  ImportLog,
  ExerciseApprovalData,
} from "../../core/services/exercisedb.service";
import { MobileOptimizedImageDirective } from "../../shared/directives/mobile-optimized-image.directive";
import { capitalize } from "../../shared/utils/format.utils";
import { SkeletonRepeatComponent } from "../../shared/components/skeleton-loader/skeleton-loader.component";

@Component({
  selector: "app-exercisedb-manager",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormInputComponent,
    SelectComponent,
    MultiSelect,
    ProgressBarComponent,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Chip,
    BadgeComponent,
    MainLayoutComponent,
    PageHeaderComponent,
    MobileOptimizedImageDirective,
    ButtonComponent,
    EmptyStateComponent,
    StatusTagComponent,
    SearchInputComponent,
    CardShellComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    SkeletonRepeatComponent,
  ],
  templateUrl: "./exercisedb-manager.component.html",
  styleUrl: "./exercisedb-manager.component.scss",
})
export class ExerciseDBManagerComponent implements OnInit {
  private exerciseDBService = inject(ExerciseDBService);
  private destroyRef = inject(DestroyRef);
  private toastService = inject(ToastService);

  // Design system tokens
  // State
  exercises = signal<ExerciseDBExercise[]>([]);
  filteredExercises = signal<ExerciseDBExercise[]>([]);
  filters = signal<ExerciseDBFilters | null>(null);
  importLogs = signal<ImportLog[]>([]);
  selectedExercise = signal<ExerciseDBExercise | null>(null);
  exerciseToApprove = signal<ExerciseDBExercise | null>(null);
  lastImportStats = signal<ImportStats | null>(null);

  // Loading states
  loading = signal(false);
  importing = signal(false);

  // Dialogs
  showDetailDialog = false;
  showApprovalDialog = false;

  // Filters
  searchQuery = "";
  selectedBodyPart: string | null = null;
  selectedEquipment: string | null = null;
  selectedPosition: string | null = null;
  selectedCategory: string | null = null;
  selectedStatus = "all";

  // Import options
  importBodyParts: string[] = [];
  importEquipment: string | null = null;
  autoApprove = false;

  // Approval data
  approvalData: ExerciseApprovalData = {
    flag_football_relevance: 7,
    ff_category: "",
    ff_training_focus: [],
    applicable_positions: ["All"],
    difficulty_level: "Intermediate",
    recommended_sets: 3,
    recommended_reps: "8-12",
  };

  // Options
  positionOptions = [
    { label: "All Positions", value: "All" },
    { label: "Quarterback", value: "QB" },
    { label: "Wide Receiver", value: "WR" },
    { label: "Running Back", value: "RB" },
    { label: "Defensive Back", value: "DB" },
    { label: "Rusher", value: "Rusher" },
    { label: "Center", value: "Center" },
  ];

  statusOptions = [
    { label: "All", value: "all" },
    { label: "Approved", value: "approved" },
    { label: "Pending", value: "pending" },
    { label: "Curated", value: "curated" },
  ];

  importBodyPartOptions = [
    { label: "Back", value: "back" },
    { label: "Cardio", value: "cardio" },
    { label: "Chest", value: "chest" },
    { label: "Lower Arms", value: "lower arms" },
    { label: "Lower Legs", value: "lower legs" },
    { label: "Neck", value: "neck" },
    { label: "Shoulders", value: "shoulders" },
    { label: "Upper Arms", value: "upper arms" },
    { label: "Upper Legs", value: "upper legs" },
    { label: "Waist", value: "waist" },
  ];

  importEquipmentOptions = [
    { label: "Body Weight", value: "body weight" },
    { label: "Barbell", value: "barbell" },
    { label: "Dumbbell", value: "dumbbell" },
    { label: "Kettlebell", value: "kettlebell" },
    { label: "Cable", value: "cable" },
    { label: "Band", value: "band" },
    { label: "Medicine Ball", value: "medicine ball" },
  ];

  ffCategoryOptions = this.exerciseDBService.FF_CATEGORIES.map((c) => ({
    label: c,
    value: c,
  }));

  trainingFocusOptions = this.exerciseDBService.TRAINING_FOCUSES.map((f) => ({
    label: f,
    value: f,
  }));

  difficultyOptions = [
    { label: "Beginner", value: "Beginner" },
    { label: "Intermediate", value: "Intermediate" },
    { label: "Advanced", value: "Advanced" },
    { label: "Elite", value: "Elite" },
  ];

  // Computed values
  totalExercises = computed(() => this.exercises().length);
  approvedCount = computed(
    () => this.exercises().filter((e) => e.is_approved).length,
  );
  pendingCount = computed(
    () => this.exercises().filter((e) => !e.is_approved && e.is_curated).length,
  );
  curatedCount = computed(
    () => this.exercises().filter((e) => e.is_curated).length,
  );
  pendingExercises = computed(() =>
    this.exercises()
      .filter((e) => !e.is_approved && e.is_curated)
      .sort(
        (a, b) =>
          (b.flag_football_relevance || 0) - (a.flag_football_relevance || 0),
      ),
  );

  bodyPartOptions = computed(() => {
    const parts = this.filters()?.bodyParts || [];
    return [
      { label: "All Body Parts", value: null },
      ...parts.map((p) => ({ label: capitalize(p), value: p })),
    ];
  });

  equipmentOptions = computed(() => {
    const equipment = this.filters()?.equipment || [];
    return [
      { label: "All Equipment", value: null },
      ...equipment.map((e) => ({ label: capitalize(e), value: e })),
    ];
  });

  categoryOptions = computed(() => {
    const categories = this.filters()?.categories || [];
    return [
      { label: "All Categories", value: null },
      ...categories.map((c) => ({ label: c, value: c })),
    ];
  });

  ngOnInit(): void {
    this.loadExercises();
    this.loadFilters();
    this.loadImportLogs();

    // Subscribe to loading states using effect
    effect(() => {
      this.loading.set(this.exerciseDBService.isLoading());
    });

    effect(() => {
      this.importing.set(this.exerciseDBService.isImporting());
    });
  }

  loadExercises(): void {
    this.exerciseDBService.getCuratedExercises().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((exercises) => {
      this.exercises.set(exercises);
      this.applyFilters();
    });
  }

  loadFilters(): void {
    this.exerciseDBService.getFilterOptions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((filters) => {
      this.filters.set(filters);
    });
  }

  loadImportLogs(): void {
    this.exerciseDBService.getImportLogs().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((logs) => {
      this.importLogs.set(logs);
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  updateSearchQuery(value: string | null | undefined): void {
    this.searchQuery = value ?? "";
    this.onSearchChange();
  }

  updateSelectedBodyPart(value: string | null | undefined): void {
    this.selectedBodyPart = value ?? null;
    this.applyFilters();
  }

  updateSelectedEquipment(value: string | null | undefined): void {
    this.selectedEquipment = value ?? null;
    this.applyFilters();
  }

  updateSelectedPosition(value: string | null | undefined): void {
    this.selectedPosition = value ?? null;
    this.applyFilters();
  }

  updateSelectedCategory(value: string | null | undefined): void {
    this.selectedCategory = value ?? null;
    this.applyFilters();
  }

  updateSelectedStatus(value: string | null | undefined): void {
    this.selectedStatus = value ?? "all";
    this.applyFilters();
  }

  updateImportBodyParts(value: string[] | null | undefined): void {
    this.importBodyParts = value ?? [];
  }

  onImportBodyPartsSelect(event: MultiSelectChangeEvent): void {
    this.updateImportBodyParts(
      (event.value as string[] | null | undefined) ?? null,
    );
  }

  updateImportEquipment(value: string | null | undefined): void {
    this.importEquipment = value ?? null;
  }

  updateAutoApprove(value: boolean | null | undefined): void {
    this.autoApprove = value ?? false;
  }

  onAutoApproveToggle(event: Event): void {
    this.updateAutoApprove(this.readChecked(event));
  }

  updateApprovalRelevance(value: number | null | undefined): void {
    this.approvalData = {
      ...this.approvalData,
      flag_football_relevance: value ?? 1,
    };
  }

  onApprovalRelevanceInput(event: Event): void {
    this.updateApprovalRelevance(this.readInputNumberValue(event));
  }

  updateApprovalCategory(value: string | null | undefined): void {
    this.approvalData = { ...this.approvalData, ff_category: value ?? "" };
  }

  updateApprovalTrainingFocus(value: string[] | null | undefined): void {
    this.approvalData = {
      ...this.approvalData,
      ff_training_focus: value ?? [],
    };
  }

  onApprovalTrainingFocusSelect(event: MultiSelectChangeEvent): void {
    this.updateApprovalTrainingFocus(
      (event.value as string[] | null | undefined) ?? null,
    );
  }

  updateApprovalApplicablePositions(
    value: string[] | null | undefined,
  ): void {
    this.approvalData = {
      ...this.approvalData,
      applicable_positions: value ?? [],
    };
  }

  onApprovalApplicablePositionsSelect(event: MultiSelectChangeEvent): void {
    this.updateApprovalApplicablePositions(
      (event.value as string[] | null | undefined) ?? null,
    );
  }

  updateApprovalDifficulty(value: string | null | undefined): void {
    this.approvalData = {
      ...this.approvalData,
      difficulty_level: value ?? "Intermediate",
    };
  }

  updateApprovalRecommendedSets(value: string | null | undefined): void {
    const parsed = Number(value);
    this.approvalData = {
      ...this.approvalData,
      recommended_sets: Number.isFinite(parsed) ? parsed : 3,
    };
  }

  onApprovalRecommendedSetsInput(event: Event): void {
    this.updateApprovalRecommendedSets(this.readInputValue(event));
  }

  updateApprovalRecommendedReps(value: string | null | undefined): void {
    this.approvalData = {
      ...this.approvalData,
      recommended_reps: value ?? "",
    };
  }

  onApprovalRecommendedRepsInput(event: Event): void {
    this.updateApprovalRecommendedReps(this.readInputValue(event));
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | null)?.value ?? "";
  }

  private readInputNumberValue(event: Event): number | null {
    const value = Number(this.readInputValue(event));
    return Number.isFinite(value) ? value : null;
  }

  private readChecked(event: Event): boolean {
    return (event.target as HTMLInputElement | null)?.checked ?? false;
  }

  applyFilters(): void {
    let filtered = [...this.exercises()];

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.body_part?.toLowerCase().includes(query) ||
          e.target_muscle?.toLowerCase().includes(query) ||
          e.equipment?.toLowerCase().includes(query),
      );
    }

    // Body part filter
    if (this.selectedBodyPart) {
      filtered = filtered.filter((e) => e.body_part === this.selectedBodyPart);
    }

    // Equipment filter
    if (this.selectedEquipment) {
      filtered = filtered.filter((e) => e.equipment === this.selectedEquipment);
    }

    // Position filter
    if (this.selectedPosition) {
      const position = this.selectedPosition;
      filtered = filtered.filter(
        (e) =>
          e.applicable_positions?.includes(position) ||
          e.applicable_positions?.includes("All"),
      );
    }

    // Category filter
    if (this.selectedCategory) {
      filtered = filtered.filter(
        (e) => e.ff_category === this.selectedCategory,
      );
    }

    // Status filter
    if (this.selectedStatus !== "all") {
      switch (this.selectedStatus) {
        case "approved":
          filtered = filtered.filter((e) => e.is_approved);
          break;
        case "pending":
          filtered = filtered.filter((e) => !e.is_approved && e.is_curated);
          break;
        case "curated":
          filtered = filtered.filter((e) => e.is_curated);
          break;
      }
    }

    this.filteredExercises.set(filtered);
  }

  openExerciseDetail(exercise: ExerciseDBExercise): void {
    this.selectedExercise.set(exercise);
    this.showDetailDialog = true;
  }

  openApprovalDialog(exercise: ExerciseDBExercise): void {
    this.exerciseToApprove.set(exercise);
    this.approvalData = {
      flag_football_relevance: exercise.flag_football_relevance || 7,
      ff_category: exercise.ff_category || "",
      ff_training_focus: exercise.ff_training_focus || [],
      applicable_positions: exercise.applicable_positions || ["All"],
      difficulty_level: exercise.difficulty_level || "Intermediate",
      recommended_sets: exercise.recommended_sets || 3,
      recommended_reps: exercise.recommended_reps || "8-12",
    };
    this.showDetailDialog = false;
    this.showApprovalDialog = true;
  }

  approveExercise(): void {
    const exercise = this.exerciseToApprove();
    if (!exercise) return;

    this.exerciseDBService
      .approveExercise(exercise.id, this.approvalData)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
        if (result.success) {
          this.toastService.success(
            `${exercise.name} has been approved`,
            "Success",
          );
          this.showApprovalDialog = false;
          this.loadExercises();
        } else {
          this.toastService.error(
            result.error || "Failed to approve exercise",
          );
        }
      });
  }

  skipExercise(exercise: ExerciseDBExercise): void {
    // Just remove from pending view for now
    this.toastService.info(`${exercise.name} skipped`, "Skipped");
  }

  startImport(): void {
    this.exerciseDBService
      .importExercises({
        body_parts:
          this.importBodyParts.length > 0 ? this.importBodyParts : undefined,
        equipment_filter: this.importEquipment || undefined,
        auto_approve: this.autoApprove,
      })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
        if (result.success) {
          this.lastImportStats.set(result.stats || null);
          this.toastService.success(
            `Successfully imported ${result.stats?.imported || 0} exercises`,
            "Import Complete",
          );
          this.loadExercises();
          this.loadFilters();
          this.loadImportLogs();
        } else {
          this.toastService.error(
            result.error || "Failed to import exercises",
            "Import Failed",
          );
        }
      });
  }

  getRelevanceSeverity(
    relevance: number,
  ): "success" | "info" | "warning" | "danger" | "secondary" {
    if (relevance >= 8) return "success";
    if (relevance >= 6) return "info";
    if (relevance >= 4) return "warning";
    return "secondary";
  }

  getStatusSeverity = (status: string) =>
    getStatusSeverity(status, "secondary");

  formatDate(dateString: string): string {
    return formatDateValue(dateString, "MMM d, yyyy, p");
  }
}
