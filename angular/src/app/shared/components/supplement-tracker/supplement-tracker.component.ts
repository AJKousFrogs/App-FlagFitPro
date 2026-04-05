/**
 * Supplement Tracker Component
 *
 * Tracks daily supplement intake for athletes.
 * Supports common athletic supplements: Creatine, Vitamin D, Omega-3,
 * Magnesium, Beta Alanine, Iron, Calcium, Protein, BCAAs, etc.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  Renderer2,
  computed,
  effect,
  inject,
  ElementRef,
  signal,
  viewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { CheckboxComponent } from "../checkbox/checkbox.component";
import { FormInputComponent } from "../form-input/form-input.component";
import { SelectComponent } from "../select/select.component";
import { SkeletonLoaderComponent } from "../skeleton-loader/skeleton-loader.component";
import { StatusTagComponent } from "../status-tag/status-tag.component";

import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";
import { EmptyStateComponent } from "../ui-components";
import { AppDialogComponent } from "../dialog/dialog.component";
import { DialogFooterComponent } from "../dialog-footer/dialog-footer.component";
import { DialogHeaderComponent } from "../dialog-header/dialog-header.component";

import { TOAST } from "../../../core/constants/toast-messages.constants";
import { API_ENDPOINTS, ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { SupplementDisplay } from "../../../core/models/supplement.models";
import { extractApiPayload } from "../../../core/utils/api-response-mapper";

// Use SupplementDisplay for component display logic
type Supplement = SupplementDisplay;
type SupplementFormGroup = FormGroup<{
  name: FormControl<string>;
  dosage: FormControl<string>;
  timing: FormControl<Supplement["timing"]>;
  category: FormControl<Supplement["category"]>;
}>;

// Default supplements for athletes
const DEFAULT_SUPPLEMENTS: Supplement[] = [
  {
    id: "creatine",
    name: "Creatine",
    dosage: "5g",
    timing: "anytime",
    category: "performance",
    taken: false,
  },
  {
    id: "vitamin-d",
    name: "Vitamin D",
    dosage: "2000 IU",
    timing: "morning",
    category: "vitamin",
    taken: false,
  },
  {
    id: "omega-3",
    name: "Omega-3 Fish Oil",
    dosage: "1000mg",
    timing: "morning",
    category: "recovery",
    taken: false,
  },
  {
    id: "magnesium",
    name: "Magnesium",
    dosage: "400mg",
    timing: "evening",
    category: "mineral",
    taken: false,
  },
  {
    id: "beta-alanine",
    name: "Beta Alanine",
    dosage: "3.2g",
    timing: "pre-workout",
    category: "performance",
    taken: false,
  },
  {
    id: "iron",
    name: "Iron",
    dosage: "18mg",
    timing: "morning",
    category: "mineral",
    taken: false,
  },
  {
    id: "calcium",
    name: "Calcium",
    dosage: "1000mg",
    timing: "morning",
    category: "mineral",
    taken: false,
  },
  {
    id: "vitamin-c",
    name: "Vitamin C",
    dosage: "500mg",
    timing: "morning",
    category: "vitamin",
    taken: false,
  },
  {
    id: "zinc",
    name: "Zinc",
    dosage: "15mg",
    timing: "evening",
    category: "mineral",
    taken: false,
  },
  {
    id: "protein",
    name: "Protein Powder",
    dosage: "25g",
    timing: "post-workout",
    category: "recovery",
    taken: false,
  },
  {
    id: "bcaa",
    name: "BCAAs",
    dosage: "5g",
    timing: "pre-workout",
    category: "amino",
    taken: false,
  },
  {
    id: "glutamine",
    name: "L-Glutamine",
    dosage: "5g",
    timing: "post-workout",
    category: "amino",
    taken: false,
  },
  {
    id: "caffeine",
    name: "Caffeine",
    dosage: "200mg",
    timing: "pre-workout",
    category: "performance",
    taken: false,
  },
  {
    id: "electrolytes",
    name: "Electrolytes",
    dosage: "1 serving",
    timing: "pre-workout",
    category: "recovery",
    taken: false,
  },
  {
    id: "multivitamin",
    name: "Multivitamin",
    dosage: "1 tablet",
    timing: "morning",
    category: "vitamin",
    taken: false,
  },
];

@Component({
  selector: "app-supplement-tracker",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CheckboxComponent,
    StatusTagComponent,
    SkeletonLoaderComponent,
    FormInputComponent,
    SelectComponent,
    ButtonComponent,
    IconButtonComponent,
    EmptyStateComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  templateUrl: "./supplement-tracker.component.html",
  styleUrl: "./supplement-tracker.component.scss",
})
export class SupplementTrackerComponent implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);
  private renderer = inject(Renderer2);

  progressFill = viewChild<ElementRef<HTMLDivElement>>("progressFill");

  // State
  isLoading = signal(true);
  supplements = signal<Supplement[]>([]);
  showAddDialog = signal(false);
  isSaving = signal(false);

  // New supplement form
  readonly newSupplementFormGroup: SupplementFormGroup =
    this.createSupplementForm();

  // Dropdown options
  timingOptions = [
    { label: "Morning", value: "morning" },
    { label: "Pre-Workout", value: "pre-workout" },
    { label: "Post-Workout", value: "post-workout" },
    { label: "Evening", value: "evening" },
    { label: "Anytime", value: "anytime" },
  ];

  categoryOptions = [
    { label: "Vitamin", value: "vitamin" },
    { label: "Mineral", value: "mineral" },
    { label: "Amino Acid", value: "amino" },
    { label: "Performance", value: "performance" },
    { label: "Recovery", value: "recovery" },
    { label: "Other", value: "other" },
  ];

  // Computed
  takenCount = computed(() => this.supplements().filter((s) => s.taken).length);
  totalCount = computed(() => this.supplements().length);
  progressPercent = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.takenCount() / total) * 100);
  });

  // Timing group configuration for template
  readonly timingGroupsConfig = [
    { key: "morning", label: "Morning", icon: "pi-sun" },
    { key: "pre-workout", label: "Pre-Workout", icon: "pi-bolt" },
    { key: "post-workout", label: "Post-Workout", icon: "pi-heart" },
    { key: "evening", label: "Evening", icon: "pi-moon" },
    { key: "anytime", label: "Anytime", icon: "pi-clock" },
  ] as const;

  // Group supplements by timing - single computed for all groups
  timingGroups = computed(() =>
    this.timingGroupsConfig
      .map((config) => ({
        ...config,
        supplements: this.supplements().filter((s) => s.timing === config.key),
      }))
      .filter((group) => group.supplements.length > 0),
  );

  constructor() {
    effect(() => {
      const fill = this.progressFill()?.nativeElement;
      if (!fill) return;
      this.renderer.setStyle(fill, "width", `${this.progressPercent()}%`);
    });
  }

  ngOnInit(): void {
    this.loadSupplements();
  }

  private loadSupplements(): void {
    this.isLoading.set(true);

    interface SupplementResponse {
      id?: string;
      supplement_id?: string;
      name?: string;
      supplement_name?: string;
      dosage?: string;
      dose?: string;
      timing?: string;
      category?: string;
      taken_today?: boolean;
      taken?: boolean;
      taken_at?: string;
      notes?: string;
    }
    // Try to fetch user's supplement list from API
    this.apiService
      .get<{ supplements: SupplementResponse[] }>("/api/supplements")
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const payload = extractApiPayload<{ supplements?: SupplementResponse[] }>(
            response,
          );
          if (payload?.supplements && payload.supplements.length > 0) {
            // Map API response to our interface
            const mapped: Supplement[] = payload.supplements.map((s) => ({
              id: s.id || s.supplement_id || this.generateId(s.name || ""),
              name: s.name || s.supplement_name || "Unknown",
              dosage: s.dosage || s.dose,
              timing: (s.timing as Supplement["timing"]) || "anytime",
              category: (s.category as Supplement["category"]) || "other",
              taken: s.taken_today || s.taken || false,
              takenAt: s.taken_at ? new Date(s.taken_at) : undefined,
              notes: s.notes,
            }));
            this.supplements.set(mapped);
          } else {
            // Use default supplements
            this.supplements.set([...DEFAULT_SUPPLEMENTS]);
          }
          this.isLoading.set(false);
        },
        error: (err) => {
          this.logger.error("Error loading supplements:", err);
          // Fall back to defaults
          this.supplements.set([...DEFAULT_SUPPLEMENTS]);
          this.isLoading.set(false);
        },
      });
  }

  toggleSupplement(supplement: Supplement): void {
    this.logger.info(
      `[Supplement] Toggling: ${supplement.name}, current: ${supplement.taken}`,
    );
    const updatedSupplements = this.supplements().map((s) => {
      if (s.id === supplement.id) {
        const taken = !s.taken;
        return {
          ...s,
          taken,
          takenAt: taken ? new Date() : undefined,
        };
      }
      return s;
    });
    this.supplements.set(updatedSupplements);

    // Log to API - only log when marking as taken (not when unmarking)
    const nowTaken = !supplement.taken;
    if (nowTaken) {
      this.apiService
        .post(API_ENDPOINTS.supplements.log, {
          supplement: supplement.name,
          dose: supplement.dosage
            ? parseFloat(supplement.dosage) || null
            : null,
          takenAt: new Date().toISOString(),
          notes: `Dosage: ${supplement.dosage || "standard"}`,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastService.success(`${supplement.name} logged ✓`);
          },
          error: (err) => {
            this.logger.error("Error logging supplement:", err);
            this.toastService.error(`Failed to log ${supplement.name}`);
            // Revert the change
            this.supplements.set(
              this.supplements().map((s) => {
                if (s.id === supplement.id) {
                  return { ...s, taken: false, takenAt: undefined };
                }
                return s;
              }),
            );
          },
        });
    } else {
      // Just show toast when unmarking (no API call needed for unmarking)
      this.toastService.info(`${supplement.name} unmarked`);
    }
  }

  openAddDialog(): void {
    this.newSupplementFormGroup.reset(this.emptySupplementFormValue());
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  addSupplement(): void {
    if (this.newSupplementFormGroup.invalid) {
      this.newSupplementFormGroup.markAllAsTouched();
      this.toastService.warn(TOAST.WARN.MISSING_SUPPLEMENT_NAME);
      return;
    }
    const newSupp = this.newSupplementFormGroup.getRawValue();

    const supplement: Supplement = {
      id: this.generateId(newSupp.name),
      name: newSupp.name,
      dosage: newSupp.dosage,
      timing: newSupp.timing,
      category: newSupp.category,
      taken: false,
    };

    this.supplements.set([...this.supplements(), supplement]);
    this.closeAddDialog();
    this.toastService.success(`${supplement.name} added to your tracker`);
  }

  removeSupplement(supplement: Supplement): void {
    this.supplements.set(
      this.supplements().filter((s) => s.id !== supplement.id),
    );
    this.toastService.info(`${supplement.name} removed`);
  }

  private generateId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
  }

  /** Category to severity - map avoids template method calls */
  readonly categorySeverityMap: Record<
    string,
    "success" | "info" | "warn" | "danger" | "secondary" | "contrast"
  > = {
    performance: "secondary",
    vitamin: "secondary",
    recovery: "secondary",
    mineral: "secondary",
    amino: "secondary",
    other: "secondary",
  };

  getTimingIcon(timing: Supplement["timing"]): string {
    const icons: Record<string, string> = {
      morning: "pi-sun",
      "pre-workout": "pi-bolt",
      "post-workout": "pi-heart",
      evening: "pi-moon",
      anytime: "pi-clock",
    };
    return icons[timing] || "pi-clock";
  }

  private createSupplementForm(): SupplementFormGroup {
    const defaults = this.emptySupplementFormValue();
    return new FormGroup({
      name: new FormControl(defaults.name, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      dosage: new FormControl(defaults.dosage, { nonNullable: true }),
      timing: new FormControl(defaults.timing, { nonNullable: true }),
      category: new FormControl(defaults.category, { nonNullable: true }),
    });
  }

  private emptySupplementFormValue(): {
    name: string;
    dosage: string;
    timing: Supplement["timing"];
    category: Supplement["category"];
  } {
    return {
      name: "",
      dosage: "",
      timing: "anytime",
      category: "other",
    };
  }

  /** Template bindings to satisfy no-call-expression */
  get takenCountDisplay(): number {
    return this.takenCount();
  }

  get totalCountDisplay(): number {
    return this.totalCount();
  }

  get progressPercentDisplay(): number {
    return this.progressPercent();
  }

  get isLoadingDisplay(): boolean {
    return this.isLoading();
  }

  get timingGroupsDisplay(): ReturnType<typeof this.timingGroups> {
    return this.timingGroups();
  }
}
