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
import { FormsModule } from "@angular/forms";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { SearchInputComponent } from "../../../shared/components/search-input/search-input.component";

import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";

import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";

import { ApiService } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ApiResponse } from "../../../core/models/common.models";
import { MainLayoutComponent } from "../../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";

// ===== Interfaces =====
interface KnowledgeResource {
  id: string;
  title: string;
  type: "article" | "video" | "link" | "pdf";
  category: string;
  description: string;
  duration?: string;
  readTime?: string;
  addedDate: string;
  isStaffPick?: boolean;
  isFavorite?: boolean;
  isTeamResource?: boolean;
  createdBy?: string;
  lastUpdated?: string;
  tags?: string[];
}

interface ResourceCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

// ===== Constants =====
const CATEGORIES = [
  { id: "drills", name: "Drills", icon: "pi-bolt" },
  { id: "tactics", name: "Tactics", icon: "pi-book" },
  { id: "conditioning", name: "Conditioning", icon: "pi-heart" },
  { id: "injury", name: "Injury Prevention", icon: "pi-heart" },
  { id: "rules", name: "Rules", icon: "pi-list" },
  { id: "position", name: "Position Guides", icon: "pi-bullseye" },
  { id: "mental", name: "Mental Game", icon: "pi-lightbulb" },
  { id: "nutrition", name: "Nutrition", icon: "pi-apple" },
];

const RESOURCE_TYPES = [
  { label: "Article / Document", value: "article" },
  { label: "External Link", value: "link" },
  { label: "Video (YouTube/Vimeo)", value: "video" },
  { label: "File Upload (PDF)", value: "pdf" },
];

const VISIBILITY_OPTIONS = [
  { label: "Team only", value: "team" },
  { label: "Coaches only", value: "coaches" },
  { label: "Public (all users)", value: "public" },
];

@Component({
  selector: "app-knowledge-base",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    Dialog,
    
    InputText,
    RadioButton,
    Select,
    Textarea,

    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    EmptyStateComponent,
    SearchInputComponent,
  ],
  template: `
    <app-main-layout>
<div class="knowledge-base-page">
        <app-page-header
          title="Knowledge Base"
          subtitle="Coaching resources and team knowledge"
          icon="pi-book"
        >
          <app-button iconLeft="pi-plus" (clicked)="openAddDialog()"
            >Add Resource</app-button
          >
        </app-page-header>

        <!-- Search -->
        <app-search-input
          class="search-bar"
          [(ngModel)]="searchQuery"
          (ngModelChange)="onSearch()"
          placeholder="Search knowledge base..."
          ariaLabel="Search knowledge base"
        />

        <!-- Tab Navigation -->
        <div class="tab-navigation">
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'all'"
            (click)="activeTab.set('all')"
          >
            All
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'drills'"
            (click)="activeTab.set('drills')"
          >
            Drills
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'articles'"
            (click)="activeTab.set('articles')"
          >
            Articles
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'videos'"
            (click)="activeTab.set('videos')"
          >
            Videos
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'rules'"
            (click)="activeTab.set('rules')"
          >
            Rules
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'position'"
            (click)="activeTab.set('position')"
          >
            Position Guides
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab() === 'saved'"
            (click)="activeTab.set('saved')"
          >
            Saved
          </button>
        </div>

        <!-- Featured Resources -->
        @if (activeTab() === "all" && featuredResources().length > 0) {
          <div class="section">
            <h3 class="section-title">Featured Resources</h3>
            <div class="featured-grid">
              @for (resource of featuredResources(); track resource.id) {
                <div class="resource-card featured">
                  <div class="resource-icon">
                    {{ getTypeIcon(resource.type) }}
                  </div>
                  <div class="resource-content">
                    <h4>{{ resource.title }}</h4>
                    <p class="resource-meta">
                      Category: {{ resource.category }}
                      @if (resource.isStaffPick) {
                        <span class="staff-pick">⭐ Staff Pick</span>
                      }
                    </p>
                    @if (resource.duration) {
                      <p class="resource-duration">
                        📺 {{ resource.duration }}
                      </p>
                    }
                    <p class="resource-desc">{{ resource.description }}</p>
                  </div>
                  <div class="resource-actions">
                    <app-button
                      size="sm"
                      (clicked)="openResource(resource)"
                    ></app-button>
                    <app-button
                      variant="text"
                      size="sm"
                      iconLeft="pi-star"
                      (clicked)="toggleFavorite(resource)"
                      >Favorite</app-button
                    >
                    <app-button
                      variant="text"
                      size="sm"
                      iconLeft="pi-share-alt"
                      (clicked)="shareResource(resource)"
                      >Share</app-button
                    >
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Categories Grid -->
        @if (activeTab() === "all") {
          <div class="section">
            <h3 class="section-title">Categories</h3>
            <div class="categories-grid">
              @for (category of categories(); track category.id) {
                <div
                  class="category-card"
                  (click)="filterByCategory(category.id)"
                >
                  <span class="category-icon"><i [class]="'pi ' + category.icon" aria-hidden="true"></i></span>
                  <div class="category-info">
                    <span class="category-name">{{ category.name }}</span>
                    <span class="category-count"
                      >{{ category.count }} resources</span
                    >
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Recent Additions -->
        <div class="section">
          <h3 class="section-title">
            @if (activeTab() === "all") {
              Recent Additions
            } @else if (activeTab() === "saved") {
              Saved Resources
            } @else {
              {{ getCategoryLabel(activeTab()) }}
            }
          </h3>
          <div class="resources-list">
            @for (resource of filteredResources(); track resource.id) {
              <div
                class="resource-row"
                [class.team-resource]="resource.isTeamResource"
              >
                <div class="resource-icon-small">
                  {{ getTypeIcon(resource.type) }}
                </div>
                <div class="resource-info">
                  <h4>{{ resource.title }}</h4>
                  <p class="resource-meta">
                    Added {{ resource.addedDate }} • Category:
                    {{ resource.category }}
                    @if (resource.readTime) {
                      • {{ resource.readTime }} read
                    }
                    @if (resource.duration) {
                      • {{ resource.duration }}
                    }
                    @if (resource.isTeamResource) {
                      <span class="team-badge">Coach-created</span>
                    }
                  </p>
                  <p class="resource-desc">{{ resource.description }}</p>
                </div>
                <div class="resource-actions">
                  <app-button
                    variant="secondary"
                    size="sm"
                    (clicked)="openResource(resource)"
                  ></app-button>
                  <app-button
                    variant="text"
                    size="sm"
                    iconLeft="pi-star"
                    (clicked)="toggleFavorite(resource)"
                    >Favorite</app-button
                  >
                  <app-button
                    variant="text"
                    size="sm"
                    iconLeft="pi-share-alt"
                    (clicked)="shareResource(resource)"
                    >Share</app-button
                  >
                </div>
              </div>
            } @empty {
              <app-empty-state
                icon="pi-book"
                heading="No resources found"
              />
            }
          </div>
          @if (hasMoreResources()) {
            <div class="load-more">
              <app-button variant="text" (clicked)="loadMore()"
                >View All →</app-button
              >
            </div>
          }
        </div>

        <!-- Team Resources -->
        @if (activeTab() === "all" && teamResources().length > 0) {
          <div class="section team-section">
            <div class="section-header">
              <h3 class="section-title">Team Resources</h3>
              <app-button
                size="sm"
                iconLeft="pi-plus"
                (clicked)="openAddDialog(true)"
                >Add Team Resource</app-button
              >
            </div>
            <p class="section-description">Created by your team</p>
            <div class="resources-list">
              @for (resource of teamResources(); track resource.id) {
                <div class="resource-row team-resource">
                  <div class="resource-icon-small"><i class="pi pi-pencil" aria-hidden="true"></i></div>
                  <div class="resource-info">
                    <h4>{{ resource.title }}</h4>
                    <p class="resource-desc">{{ resource.description }}</p>
                    <p class="resource-meta">
                      Created by: {{ resource.createdBy }} • Last updated:
                      {{ resource.lastUpdated }}
                    </p>
                  </div>
                  <div class="resource-actions">
                    <app-button
                      variant="secondary"
                      size="sm"
                      (clicked)="openResource(resource)"
                      >View</app-button
                    >
                    <app-button
                      variant="text"
                      size="sm"
                      (clicked)="editResource(resource)"
                      >Edit</app-button
                    >
                    <app-button
                      variant="text"
                      size="sm"
                      (clicked)="shareToTeam(resource)"
                      >Share to Team</app-button
                    >
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Add Resource Dialog -->
      <p-dialog
        [(visible)]="showAddDialog"
        header="Add Resource"
        [modal]="true"
        class="knowledge-base-add-dialog"
      >
        <div class="add-form">
          <div class="form-field">
            <label>Resource Type</label>
            <div class="radio-group">
              @for (type of resourceTypes; track type.value) {
                <div class="radio-option">
                  <p-radioButton
                    name="resourceType"
                    [value]="type.value"
                    [(ngModel)]="resourceForm.type"
                    [inputId]="'type-' + type.value"
                  ></p-radioButton>
                  <label [for]="'type-' + type.value">{{ type.label }}</label>
                </div>
              }
            </div>
          </div>

          <div class="form-field">
            <label>Title</label>
            <input
              type="text"
              pInputText
              [(ngModel)]="resourceForm.title"
              placeholder="Resource title"
            />
          </div>

          <div class="form-field">
            <label>Category</label>
            <p-select
              [options]="categoryOptions"
              [(ngModel)]="resourceForm.category"
              optionLabel="name"
              optionValue="id"
              placeholder="Select category"
              class="w-full"
            ></p-select>
          </div>

          @if (resourceForm.type === "link" || resourceForm.type === "video") {
            <div class="form-field">
              <label>URL</label>
              <input
                type="text"
                pInputText
                [(ngModel)]="resourceForm.url"
                placeholder="https://..."
              />
            </div>
          }

          <div class="form-field">
            <label>Content / Description</label>
            <textarea
              pTextarea
              [(ngModel)]="resourceForm.content"
              rows="6"
              placeholder="Describe the resource or enter content (Markdown supported)..."
            ></textarea>
          </div>

          <div class="form-field">
            <label>Visibility</label>
            <div class="radio-group">
              @for (opt of visibilityOptions; track opt.value) {
                <div class="radio-option">
                  <p-radioButton
                    name="visibility"
                    [value]="opt.value"
                    [(ngModel)]="resourceForm.visibility"
                    [inputId]="'vis-' + opt.value"
                  ></p-radioButton>
                  <label [for]="'vis-' + opt.value">{{ opt.label }}</label>
                </div>
              }
            </div>
          </div>

          <div class="form-field">
            <label>Tags (comma separated)</label>
            <input
              type="text"
              pInputText
              [(ngModel)]="resourceForm.tags"
              placeholder="playbook, strategy, defense"
            />
          </div>
        </div>

        <ng-template #footer>
          <app-button variant="secondary" (clicked)="showAddDialog = false"
            >Cancel</app-button
          >
          <app-button iconLeft="pi-check" (clicked)="saveResource()"
            >Save Resource</app-button
          >
        </ng-template>
      </p-dialog>
    </app-main-layout>
  `,
  styleUrl: "./knowledge-base.component.scss",
})
export class KnowledgeBaseComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);

  // State
  readonly resources = signal<KnowledgeResource[]>([]);
  readonly categories = signal<ResourceCategory[]>([]);
  readonly activeTab = signal<string>("all");
  readonly isLoading = signal(true);

  searchQuery = "";

  // Dialog state
  showAddDialog = false;
  resourceForm = this.getEmptyForm();

  // Options
  readonly resourceTypes = RESOURCE_TYPES;
  readonly visibilityOptions = VISIBILITY_OPTIONS;
  readonly categoryOptions = CATEGORIES;

  // Computed
  readonly featuredResources = computed(() =>
    this.resources()
      .filter((r) => r.isStaffPick)
      .slice(0, 2),
  );

  readonly teamResources = computed(() =>
    this.resources().filter((r) => r.isTeamResource),
  );

  readonly filteredResources = computed(() => {
    let result = this.resources();
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

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response: ApiResponse<{
        resources?: KnowledgeResource[];
        categories?: ResourceCategory[];
      }> = await firstValueFrom(
        this.api.get("/api/knowledge"),
      );
      if (response?.success && response.data) {
        this.resources.set(response.data.resources || []);
        this.categories.set(response.data.categories || []);
      }
    } catch (err) {
      this.logger.error("Failed to load knowledge base", err);
      this.categories.set([]);
      this.resources.set([]);
    } finally {
      this.isLoading.set(false);
    }
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

  // Actions
  openAddDialog(isTeam = false): void {
    this.resourceForm = this.getEmptyForm();
    if (isTeam) {
      this.resourceForm.visibility = "team";
    }
    this.showAddDialog = true;
  }

  saveResource(): void {
    if (!this.resourceForm.title) return;
    this.toastService.success(
      "Resource has been added to the knowledge base",
      "Resource Saved",
    );
    this.showAddDialog = false;
  }

  openResource(resource: KnowledgeResource): void {
    this.toastService.info(`Opening ${resource.title}`, "Opening Resource");
  }

  editResource(resource: KnowledgeResource): void {
    this.toastService.info(`Editing ${resource.title}`, "Edit Resource");
  }

  toggleFavorite(resource: KnowledgeResource): void {
    resource.isFavorite = !resource.isFavorite;
    this.toastService.success(
      resource.title,
      resource.isFavorite ? "Added to Saved" : "Removed from Saved",
    );
  }

  shareResource(resource: KnowledgeResource): void {
    this.toastService.info(`Sharing ${resource.title}`, "Share Resource");
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
