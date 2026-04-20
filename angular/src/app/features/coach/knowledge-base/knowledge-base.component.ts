/**
 * Knowledge Base Component
 *
 * Centralized repository of coaching resources, articles, drills, and flag
 * football knowledge that can be searched, organized, and shared with the team.
 *
 * Design System Compliant (DESIGN_SYSTEM_RULES.md)
 */

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { AppLoadingComponent } from "../../../shared/components/loading/loading.component";
import { PageErrorStateComponent } from "../../../shared/components/page-error-state/page-error-state.component";
import { SearchInputComponent } from "../../../shared/components/search-input/search-input.component";

import { FormInputComponent } from "../../../shared/components/form-input/form-input.component";
import { SelectComponent } from "../../../shared/components/select/select.component";
import { TextareaComponent } from "../../../shared/components/textarea/textarea.component";

import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import {
  AppDialogComponent,
  DialogFooterComponent,
  DialogHeaderComponent,
} from "../../../shared/components/ui-components";
import {
  CATEGORIES,
  KnowledgeBaseService,
  KnowledgeResource,
  PendingKnowledgeEntry,
  RESOURCE_TYPES,
  VISIBILITY_OPTIONS,
} from "./knowledge-base.service";

@Component({
  selector: "app-knowledge-base",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormInputComponent,
    SelectComponent,
    TextareaComponent,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    AppLoadingComponent,
    PageErrorStateComponent,
    SearchInputComponent,
    AppDialogComponent,
    DialogHeaderComponent,
    DialogFooterComponent,
  ],
  templateUrl: "./knowledge-base.component.html",
  styleUrl: "./knowledge-base.component.scss",
})
export class KnowledgeBaseComponent implements OnInit {
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  readonly data = inject(KnowledgeBaseService);

  // UI state
  readonly activeTab = signal<string>("all");
  readonly myStatusFilter = signal<"all" | "pending" | "approved" | "rejected">(
    "all",
  );

  searchQuery = "";

  // Dialog state
  showAddDialog = false;
  showApproveDialog = false;
  showResourceDialog = false;
  resourceForm = this.getEmptyForm();
  reviewForm = {
    notes: "",
    overrideQualityGate: false,
  };

  // Options
  readonly resourceTypes = RESOURCE_TYPES;
  readonly visibilityOptions = VISIBILITY_OPTIONS;
  readonly categoryOptions = CATEGORIES;

  // Computed
  readonly filteredResources = computed(() => {
    let result = this.data.resources();
    const tab = this.activeTab();

    if (tab === "saved") {
      result = result.filter((r) => r.isFavorite);
    } else if (tab === "drills") {
      result = result.filter((r) => r.category.toLowerCase() === "drills");
    } else if (tab === "articles") {
      result = result.filter((r) => r.type === "article");
    } else if (tab === "videos") {
      result = result.filter((r) => r.type === "video");
    } else if (tab === "rules") {
      result = result.filter((r) => r.category.toLowerCase() === "rules");
    } else if (tab === "position") {
      result = result.filter(
        (r) => r.category.toLowerCase() === "position guides",
      );
    } else if (tab !== "all") {
      result = result.filter((r) => r.category.toLowerCase() === tab);
    }

    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return result.filter((r) => !r.isTeamResource).slice(0, 10);
  });

  readonly hasMoreResources = computed(
    () => this.filteredResources().length >= 10,
  );
  readonly filteredMySubmissions = computed(() => {
    const filter = this.myStatusFilter();
    const items = this.data.mySubmissions();
    if (filter === "all") return items;
    return items.filter((entry) => entry.merlin_approval_status === filter);
  });

  ngOnInit(): void {
    void this.data.bootstrap();
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery = value;
    this.onSearch();
  }

  onResourceTypeChange(value: "article" | "video" | "link" | "pdf"): void {
    this.resourceForm = { ...this.resourceForm, type: value };
  }

  onResourceTypeOptionChange(value: string): void {
    this.onResourceTypeChange(value as "article" | "video" | "link" | "pdf");
  }

  onResourceTitleChange(value: string): void {
    this.resourceForm = { ...this.resourceForm, title: value };
  }

  onResourceCategoryChange(value: unknown): void {
    const category =
      typeof value === "object" && value !== null && "id" in value
        ? String((value as { id: string }).id)
        : String(value ?? "");
    this.resourceForm = { ...this.resourceForm, category };
  }

  onResourceUrlChange(value: string): void {
    this.resourceForm = { ...this.resourceForm, url: value };
  }

  onResourceContentChange(value: string): void {
    this.resourceForm = { ...this.resourceForm, content: value };
  }

  onResourceVisibilityChange(value: string): void {
    this.resourceForm = { ...this.resourceForm, visibility: value };
  }

  onResourceTagsChange(value: string): void {
    this.resourceForm = { ...this.resourceForm, tags: value };
  }

  onReviewOverrideQualityGateChange(value: boolean): void {
    this.reviewForm = { ...this.reviewForm, overrideQualityGate: value };
  }

  onReviewOverrideQualityGateToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    this.onReviewOverrideQualityGateChange(checked);
  }

  onReviewNotesChange(value: string): void {
    this.reviewForm = { ...this.reviewForm, notes: value };
  }

  retryLoadData(): void {
    void this.data.bootstrap();
  }

  private getEmptyForm() {
    return {
      type: "article" as "article" | "video" | "link" | "pdf",
      title: "",
      category: "",
      url: "",
      content: "",
      visibility: "coaches",
      tags: "",
    };
  }

  private resetReviewForm(): void {
    this.reviewForm = {
      notes: "",
      overrideQualityGate: false,
    };
  }

  private applyResourceToForm(resource: KnowledgeResource): void {
    this.resourceForm = {
      type: resource.type,
      title: resource.title,
      category: resource.category,
      url: "",
      content: resource.description,
      visibility: resource.isTeamResource ? "team" : "coaches",
      tags: resource.tags?.join(", ") || "",
    };
  }

  closeAddDialog(): void {
    this.showAddDialog = false;
    this.resourceForm = this.getEmptyForm();
  }

  closeApproveDialog(): void {
    this.showApproveDialog = false;
    this.data.selectedPendingEntry.set(null);
    this.resetReviewForm();
  }

  closeResourceDialog(): void {
    this.showResourceDialog = false;
    this.data.selectedResource.set(null);
  }

  // Actions
  openAddDialog(isTeam = false): void {
    this.closeAddDialog();
    if (isTeam) {
      this.resourceForm.visibility = "team";
    }
    this.showAddDialog = true;
  }

  async saveResource(): Promise<void> {
    const success = await this.data.saveResource(this.resourceForm);
    if (success) {
      this.closeAddDialog();
    }
  }

  openApproveDialog(entry: PendingKnowledgeEntry): void {
    this.closeApproveDialog();
    this.data.selectedPendingEntry.set(entry);
    this.showApproveDialog = true;
  }

  setMyStatusFilter(
    filter: "all" | "pending" | "approved" | "rejected",
  ): void {
    this.myStatusFilter.set(filter);
  }

  async confirmApprove(): Promise<void> {
    const success = await this.data.confirmApprove(
      this.reviewForm.notes,
      this.reviewForm.overrideQualityGate,
    );
    if (success) {
      this.closeApproveDialog();
    }
  }

  openResource(resource: KnowledgeResource): void {
    this.closeResourceDialog();
    this.data.selectedResource.set(resource);
    this.showResourceDialog = true;
  }

  editResource(resource: KnowledgeResource): void {
    this.applyResourceToForm(resource);
    this.closeResourceDialog();
    this.showAddDialog = true;
  }

  toggleFavorite(resource: KnowledgeResource): void {
    resource.isFavorite = !resource.isFavorite;
    this.toastService.success(
      resource.title,
      resource.isFavorite ? "Added to Saved" : "Removed from Saved",
    );
  }

  async shareResource(resource: KnowledgeResource): Promise<void> {
    const shareText = this.buildShareText(resource);
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        this.toastService.success(
          `${resource.title} details copied to clipboard`,
          "Share Ready",
        );
        return;
      }
    } catch (error) {
      this.logger.warn("Clipboard copy failed, falling back to dialog", error);
    }

    this.openResource(resource);
    this.toastService.info(
      "Clipboard is unavailable, so the resource is open for manual sharing.",
      "Share Resource",
    );
  }

  shareToTeam(resource: KnowledgeResource): void {
    this.toastService.success(
      `${resource.title} has been shared with the team`,
      "Shared to Team",
    );
  }

  filterByCategory(categoryId: string): void {
    this.activeTab.set(categoryId);
  }

  onSearch(): void {
    // Filtering happens via computed
  }

  loadMore(): void {
    this.toastService.info("Loading more resources...", "Loading More");
  }

  shareSelectedResource(): void {
    const resource = this.data.selectedResource();
    if (!resource) {
      return;
    }
    void this.shareResource(resource);
  }

  private buildShareText(resource: KnowledgeResource): string {
    const tags =
      resource.tags && resource.tags.length > 0
        ? `\nTags: ${resource.tags.join(", ")}`
        : "";
    return `${resource.title}\nCategory: ${resource.category}\nType: ${resource.type}\n${resource.description}${tags}`;
  }

  // Helpers
  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      article: "📖",
      video: "🎥",
      link: "🔗",
      pdf: "📄",
    };
    return icons[type] || "📄";
  }

  getCategoryLabel(tab: string): string {
    const labels: Record<string, string> = {
      drills: "Drills",
      articles: "Articles",
      videos: "Videos",
      rules: "Rules",
      position: "Position Guides",
      saved: "Saved Resources",
    };
    return labels[tab] || tab;
  }
}
