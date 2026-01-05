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
    OnInit,
    computed,
    inject,
    signal,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CheckboxModule } from "primeng/checkbox";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { ButtonComponent } from "../button/button.component";
import { IconButtonComponent } from "../button/icon-button.component";

import { API_ENDPOINTS, ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";

export interface Supplement {
  id: string;
  name: string;
  dosage?: string;
  timing: "morning" | "pre-workout" | "post-workout" | "evening" | "anytime";
  category: "vitamin" | "mineral" | "amino" | "performance" | "recovery" | "other";
  taken: boolean;
  takenAt?: Date;
  notes?: string;
}

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
imports: [
    CommonModule,
    FormsModule,
    CheckboxModule,
    TooltipModule,
    TagModule,
    SkeletonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ButtonComponent,
    IconButtonComponent,
  ],
  templateUrl: "./supplement-tracker.component.html",
  styleUrls: ["./supplement-tracker.component.scss"],
})
export class SupplementTrackerComponent implements OnInit {
  private apiService = inject(ApiService);
  private toastService = inject(ToastService);
  private logger = inject(LoggerService);

  // State
  isLoading = signal(true);
  supplements = signal<Supplement[]>([]);
  showAddDialog = signal(false);
  isSaving = signal(false);

  // New supplement form
  newSupplement = signal<Partial<Supplement>>({
    name: "",
    dosage: "",
    timing: "anytime",
    category: "other",
  });

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
  takenCount = computed(
    () => this.supplements().filter((s) => s.taken).length
  );
  totalCount = computed(() => this.supplements().length);
  progressPercent = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.takenCount() / total) * 100);
  });

  // Group by timing
  morningSupplements = computed(() =>
    this.supplements().filter((s) => s.timing === "morning")
  );
  preWorkoutSupplements = computed(() =>
    this.supplements().filter((s) => s.timing === "pre-workout")
  );
  postWorkoutSupplements = computed(() =>
    this.supplements().filter((s) => s.timing === "post-workout")
  );
  eveningSupplements = computed(() =>
    this.supplements().filter((s) => s.timing === "evening")
  );
  anytimeSupplements = computed(() =>
    this.supplements().filter((s) => s.timing === "anytime")
  );

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
    this.apiService.get<{ supplements: SupplementResponse[] }>("/api/supplements").subscribe({
      next: (response) => {
        if (response?.data?.supplements && response.data.supplements.length > 0) {
          // Map API response to our interface
          const mapped = response.data.supplements.map((s) => ({
            id: s.id || s.supplement_id || this.generateId(s.name),
            name: s.name || s.supplement_name,
            dosage: s.dosage || s.dose,
            timing: s.timing || "anytime",
            category: s.category || "other",
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

    // Log to API
    this.apiService
      .post(API_ENDPOINTS.supplements.log, {
        supplement: supplement.name,
        taken: !supplement.taken,
        date: new Date().toISOString().split("T")[0],
        dosage: supplement.dosage,
      })
      .subscribe({
        next: () => {
          const action = !supplement.taken ? "logged" : "unmarked";
          this.toastService.success(`${supplement.name} ${action}`);
        },
        error: (err) => {
          this.logger.error("Error logging supplement:", err);
          // Revert the change
          this.supplements.set(
            this.supplements().map((s) => {
              if (s.id === supplement.id) {
                return { ...s, taken: supplement.taken };
              }
              return s;
            })
          );
        },
      });
  }

  openAddDialog(): void {
    this.newSupplement.set({
      name: "",
      dosage: "",
      timing: "anytime",
      category: "other",
    });
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  addSupplement(): void {
    const newSupp = this.newSupplement();
    if (!newSupp.name) {
      this.toastService.warn("Please enter a supplement name");
      return;
    }

    const supplement: Supplement = {
      id: this.generateId(newSupp.name!),
      name: newSupp.name!,
      dosage: newSupp.dosage,
      timing: newSupp.timing as Supplement["timing"],
      category: newSupp.category as Supplement["category"],
      taken: false,
    };

    this.supplements.set([...this.supplements(), supplement]);
    this.closeAddDialog();
    this.toastService.success(`${supplement.name} added to your tracker`);
  }

  removeSupplement(supplement: Supplement): void {
    this.supplements.set(
      this.supplements().filter((s) => s.id !== supplement.id)
    );
    this.toastService.info(`${supplement.name} removed`);
  }

  private generateId(name: string): string {
    return name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
  }

  getCategoryColor(
    category: Supplement["category"]
  ): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    // All categories use the same neutral color for visual consistency
    return "secondary";
  }

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

  // Form update methods (Angular templates don't support spread operator)
  updateName(value: string): void {
    this.newSupplement.update((s) => ({ ...s, name: value }));
  }

  updateDosage(value: string): void {
    this.newSupplement.update((s) => ({ ...s, dosage: value }));
  }

  updateTiming(value: Supplement["timing"]): void {
    this.newSupplement.update((s) => ({ ...s, timing: value }));
  }

  updateCategory(value: Supplement["category"]): void {
    this.newSupplement.update((s) => ({ ...s, category: value }));
  }
}
