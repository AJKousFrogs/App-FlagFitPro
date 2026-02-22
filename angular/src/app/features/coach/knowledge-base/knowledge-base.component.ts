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
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";
import { ButtonComponent } from "../../../shared/components/button/button.component";
import { EmptyStateComponent } from "../../../shared/components/empty-state/empty-state.component";
import { SearchInputComponent } from "../../../shared/components/search-input/search-input.component";

import { Dialog } from "primeng/dialog";
import { InputText } from "primeng/inputtext";
import { Select } from "primeng/select";

import { Textarea } from "primeng/textarea";
import { firstValueFrom } from "rxjs";

import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";
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

interface PendingKnowledgeEntry {
  id: string;
  entry_type: string;
  topic: string;
  question: string;
  answer: string;
  summary: string;
  evidence_strength: string;
  consensus_level: string;
  merlin_submitted_by_role?: string;
  merlin_submitted_at?: string;
}

interface MyKnowledgeSubmission {
  id: string;
  entry_type: string;
  topic: string;
  question: string;
  summary: string;
  evidence_strength: string;
  consensus_level: string;
  merlin_approval_status: "pending" | "approved" | "rejected";
  merlin_approval_notes?: string | null;
  merlin_submitted_at?: string;
  merlin_approved_at?: string | null;
  updated_at?: string;
}

interface KnowledgeReviewEvent {
  id: number;
  action: "approve" | "reject";
  reviewed_by_role: string;
  notes?: string | null;
  quality_gate_override: boolean;
  quality_issues?: string[];
  created_at: string;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    Dialog,
    
    InputText,
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
          (valueChange)="onSearchQueryChange($event)"
          placeholder="Search knowledge base..."
          ariaLabel="Search knowledge base"
        />

        @if (activeTab() === "all") {
          <div class="section">
            <div class="section-header">
              <h3 class="section-title">My Submissions</h3>
              <app-button
                variant="text"
                size="sm"
                iconLeft="pi-refresh"
                (clicked)="loadMySubmissions()"
                >Refresh</app-button
              >
            </div>
            <p class="section-description">
              Track approval status before Merlin AI can use your entries.
            </p>
            <div class="submission-filters">
              <button
                class="filter-btn"
                [class.active]="myStatusFilter() === 'all'"
                (click)="setMyStatusFilter('all')"
              >
                All
              </button>
              <button
                class="filter-btn"
                [class.active]="myStatusFilter() === 'pending'"
                (click)="setMyStatusFilter('pending')"
              >
                Pending
              </button>
              <button
                class="filter-btn"
                [class.active]="myStatusFilter() === 'approved'"
                (click)="setMyStatusFilter('approved')"
              >
                Approved
              </button>
              <button
                class="filter-btn"
                [class.active]="myStatusFilter() === 'rejected'"
                (click)="setMyStatusFilter('rejected')"
              >
                Rejected
              </button>
            </div>
            <div class="resources-list">
              @if (isLoadingMySubmissions()) {
                <app-empty-state
                  icon="pi-spin pi-spinner"
                  heading="Loading your submissions..."
                />
              } @else {
                @for (entry of filteredMySubmissions(); track entry.id) {
                  <div class="resource-row team-resource">
                    <div class="resource-icon-small"><i class="pi pi-file-edit" aria-hidden="true"></i></div>
                    <div class="resource-info">
                      <h4>{{ entry.question }}</h4>
                      <p class="resource-meta">
                        {{ entry.entry_type }} •
                        <span
                          class="status-pill"
                          [class.pending]="entry.merlin_approval_status === 'pending'"
                          [class.approved]="entry.merlin_approval_status === 'approved'"
                          [class.rejected]="entry.merlin_approval_status === 'rejected'"
                        >
                          {{ entry.merlin_approval_status }}
                        </span>
                        @if (entry.merlin_submitted_at) {
                          • Submitted {{ entry.merlin_submitted_at | date: "short" }}
                        }
                        @if (entry.merlin_approved_at) {
                          • Reviewed {{ entry.merlin_approved_at | date: "short" }}
                        }
                      </p>
                      <p class="resource-desc">{{ entry.summary }}</p>
                      @if (entry.merlin_approval_notes) {
                        <p class="resource-meta">
                          Reviewer notes: {{ entry.merlin_approval_notes }}
                        </p>
                      }
                      <div class="audit-actions">
                        <app-button
                          variant="text"
                          size="sm"
                          iconLeft="pi-history"
                          (clicked)="toggleAuditTimeline(entry.id)"
                        >
                          {{
                            auditTimelineByEntry()[entry.id]
                              ? "Hide Audit Timeline"
                              : "View Audit Timeline"
                          }}
                        </app-button>
                      </div>
                      @if (auditLoadingByEntry()[entry.id]) {
                        <p class="resource-meta">Loading audit timeline...</p>
                      }
                      @if (auditTimelineByEntry()[entry.id]) {
                        <div class="audit-timeline">
                          @for (
                            event of auditTimelineByEntry()[entry.id];
                            track event.id
                          ) {
                            <div class="audit-event">
                              <p class="resource-meta">
                                {{ event.action }} by {{ event.reviewed_by_role }}
                                • {{ event.created_at | date: "short" }}
                                @if (event.quality_gate_override) {
                                  • override applied
                                }
                              </p>
                              @if (event.notes) {
                                <p class="resource-desc">{{ event.notes }}</p>
                              }
                            </div>
                          } @empty {
                            <p class="resource-meta">No review actions yet.</p>
                          }
                        </div>
                      }
                    </div>
                  </div>
                } @empty {
                  <app-empty-state
                    icon="pi-inbox"
                    heading="No submissions yet"
                  />
                }
              }
            </div>
          </div>
        }

        @if (isNutritionistReviewer() && activeTab() === "all") {
          <div class="section">
            <div class="section-header">
              <h3 class="section-title">Merlin Approval Queue</h3>
              <app-button
                variant="text"
                size="sm"
                iconLeft="pi-refresh"
                (clicked)="loadPendingEntries()"
                >Refresh</app-button
              >
            </div>
            <p class="section-description">
              Entries stay pending until a nutritionist approves them for Merlin.
            </p>
            <div class="resources-list">
              @if (isLoadingPending()) {
                <app-empty-state
                  icon="pi-spin pi-spinner"
                  heading="Loading pending entries..."
                />
              } @else {
                @for (entry of pendingEntries(); track entry.id) {
                  <div class="resource-row team-resource">
                    <div class="resource-icon-small"><i class="pi pi-clock" aria-hidden="true"></i></div>
                    <div class="resource-info">
                      <h4>{{ entry.question }}</h4>
                      <p class="resource-meta">
                        {{ entry.entry_type }} • Submitted by
                        {{ entry.merlin_submitted_by_role || "user" }}
                        @if (entry.merlin_submitted_at) {
                          • {{ entry.merlin_submitted_at | date: "short" }}
                        }
                      </p>
                      <p class="resource-desc">{{ entry.summary }}</p>
                    </div>
                    <div class="resource-actions">
                      <app-button
                        size="sm"
                        iconLeft="pi-check"
                        (clicked)="openApproveDialog(entry)"
                        >Approve</app-button
                      >
                      <app-button
                        variant="secondary"
                        size="sm"
                        iconLeft="pi-times"
                        (clicked)="reviewPendingEntry(entry.id, 'reject')"
                        >Reject</app-button
                      >
                    </div>
                  </div>
                } @empty {
                  <app-empty-state
                    icon="pi-check-circle"
                    heading="No pending knowledge entries"
                  />
                }
              }
            </div>
          </div>
        }

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
            <p class="resource-meta">
              This submission will be pending until a nutritionist approves it
              for Merlin AI consumption.
            </p>
          </div>
          <div class="form-field">
            <label>Resource Type</label>
            <div class="radio-group">
              @for (type of resourceTypes; track type.value) {
                <div class="radio-option">
                  <input
                    type="radio"
                    name="resourceType"
                    [value]="type.value"
                    [id]="'type-' + type.value"
                    [checked]="resourceForm.type === type.value"
                    (change)="onResourceTypeOptionChange(type.value)"
                  />
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
              [value]="resourceForm.title"
              (input)="onResourceTitleChange(getInputValue($event))"
              placeholder="Resource title"
            />
          </div>

          <div class="form-field">
            <label>Category</label>
            <p-select
              [options]="categoryOptions"
              (onChange)="onResourceCategoryChange($event.value)"
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
                [value]="resourceForm.url"
                (input)="onResourceUrlChange(getInputValue($event))"
                placeholder="https://..."
              />
            </div>
          }

          <div class="form-field">
            <label>Content / Description</label>
            <textarea
              pTextarea
              [value]="resourceForm.content"
              (input)="onResourceContentChange(getInputValue($event))"
              rows="6"
              placeholder="Describe the resource or enter content (Markdown supported)..."
            ></textarea>
          </div>

          <div class="form-field">
            <label>Visibility</label>
            <div class="radio-group">
              @for (opt of visibilityOptions; track opt.value) {
                <div class="radio-option">
                  <input
                    type="radio"
                    name="visibility"
                    [value]="opt.value"
                    [id]="'vis-' + opt.value"
                    [checked]="resourceForm.visibility === opt.value"
                    (change)="onResourceVisibilityChange(opt.value)"
                  />
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
              [value]="resourceForm.tags"
              (input)="onResourceTagsChange(getInputValue($event))"
              placeholder="playbook, strategy, defense"
            />
          </div>
        </div>

        <ng-template #footer>
          <app-button variant="secondary" (clicked)="showAddDialog = false"
            >Cancel</app-button
          >
          <app-button
            iconLeft="pi-check"
            [disabled]="isSubmitting()"
            (clicked)="saveResource()"
            >Submit for Review</app-button
          >
        </ng-template>
      </p-dialog>

      <p-dialog
        [(visible)]="showApproveDialog"
        header="Approve Knowledge Entry"
        [modal]="true"
        class="knowledge-base-add-dialog"
      >
        @if (selectedPendingEntry()) {
          <div class="add-form">
            <div class="form-field">
              <label>Entry</label>
              <p class="resource-meta">
                {{ selectedPendingEntry()?.question }}
              </p>
            </div>
            <div class="form-field">
              <label>Quality Checklist</label>
              @if (reviewQualityIssues().length > 0) {
                <ul class="quality-list">
                  @for (issue of reviewQualityIssues(); track issue) {
                    <li>{{ issue }}</li>
                  }
                </ul>
                <label class="override-row">
                  <input
                    type="checkbox"
                    [checked]="reviewForm.overrideQualityGate"
                    (change)="onReviewOverrideQualityGateChange(isChecked($event))"
                  />
                  Override quality gate (requires notes)
                </label>
              } @else {
                <p class="resource-meta">All quality checks passed.</p>
              }
            </div>
            <div class="form-field">
              <label>Reviewer Notes</label>
              <textarea
                pTextarea
                rows="4"
                [value]="reviewForm.notes"
                (input)="onReviewNotesChange(getInputValue($event))"
                placeholder="Optional notes (required for override)"
              ></textarea>
            </div>
          </div>
        }
        <ng-template #footer>
          <app-button variant="secondary" (clicked)="showApproveDialog = false"
            >Cancel</app-button
          >
          <app-button
            iconLeft="pi-check"
            [disabled]="isReviewSubmitting()"
            (clicked)="confirmApprove()"
            >Approve Entry</app-button
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
  private readonly authService = inject(AuthService);
  private readonly teamMembershipService = inject(TeamMembershipService);

  // State
  readonly resources = signal<KnowledgeResource[]>([]);
  readonly categories = signal<ResourceCategory[]>([]);
  readonly pendingEntries = signal<PendingKnowledgeEntry[]>([]);
  readonly mySubmissions = signal<MyKnowledgeSubmission[]>([]);
  readonly activeTab = signal<string>("all");
  readonly isLoading = signal(true);
  readonly isLoadingPending = signal(false);
  readonly isLoadingMySubmissions = signal(false);
  readonly isSubmitting = signal(false);
  readonly isReviewSubmitting = signal(false);
  readonly selectedPendingEntry = signal<PendingKnowledgeEntry | null>(null);
  readonly myStatusFilter = signal<"all" | "pending" | "approved" | "rejected">(
    "all",
  );
  readonly auditTimelineByEntry = signal<Record<string, KnowledgeReviewEvent[]>>(
    {},
  );
  readonly auditLoadingByEntry = signal<Record<string, boolean>>({});

  searchQuery = "";

  // Dialog state
  showAddDialog = false;
  showApproveDialog = false;
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
  readonly filteredMySubmissions = computed(() => {
    const filter = this.myStatusFilter();
    const items = this.mySubmissions();
    if (filter === "all") {
      return items;
    }
    return items.filter((entry) => entry.merlin_approval_status === filter);
  });

  ngOnInit(): void {
    void this.bootstrap();
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

  onResourceCategoryChange(value: string | null): void {
    this.resourceForm = { ...this.resourceForm, category: value ?? "" };
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

  onReviewNotesChange(value: string): void {
    this.reviewForm = { ...this.reviewForm, notes: value };
  }

  getInputValue(event: Event): string {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return target.value;
    }
    return "";
  }

  isChecked(event: Event): boolean {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      return target.checked;
    }
    return false;
  }

  private async bootstrap(): Promise<void> {
    await Promise.all([
      this.loadData(),
      this.loadMySubmissions(),
      this.teamMembershipService.loadMembership().catch((error) => {
        this.logger.warn("Failed to load team membership", error);
        return null;
      }),
    ]);

    if (this.isNutritionistReviewer()) {
      await this.loadPendingEntries();
    }
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const response: ApiResponse<{
        resources?: KnowledgeResource[];
        categories?: ResourceCategory[];
      }> = await firstValueFrom(
        this.api.get(API_ENDPOINTS.knowledge.base),
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

  private getEffectiveRole(): string {
    const user = this.authService.getUser();
    const metadata = user?.user_metadata || {};
    const roleFromMeta = String(
      metadata["staff_role"] || metadata["role"] || user?.role || "",
    )
      .trim()
      .toLowerCase();
    const roleFromTeam = (this.teamMembershipService.role() || "")
      .toString()
      .trim()
      .toLowerCase();
    return roleFromMeta || roleFromTeam || "player";
  }

  isNutritionistReviewer(): boolean {
    return this.getEffectiveRole() === "nutritionist";
  }

  private mapEntryType(category: string): string {
    const value = category.trim().toLowerCase();
    if (value === "nutrition") return "nutrition";
    if (value === "injury") return "injury";
    if (value === "mental") return "psychology";
    return "training_method";
  }

  async saveResource(): Promise<void> {
    const title = this.resourceForm.title.trim();
    const content = this.resourceForm.content.trim();
    const url = this.resourceForm.url.trim();

    if (!title) {
      this.toastService.warn("Please enter a title", "Validation");
      return;
    }
    if (!content && !url) {
      this.toastService.warn(
        "Add content or a URL before submitting",
        "Validation",
      );
      return;
    }

    const payload = {
      topic: title.toLowerCase(),
      question: title,
      answer: content || url,
      summary: content ? content.slice(0, 240) : `External resource: ${url}`,
      entry_type: this.mapEntryType(this.resourceForm.category || ""),
      evidence_strength: "limited",
      consensus_level: "low",
    };

    this.isSubmitting.set(true);
    try {
      const response = await firstValueFrom(
        this.api.post<{ entry?: { id: string } }>(
          API_ENDPOINTS.knowledgeGovernance.submit,
          payload,
        ),
      );

      if (!response?.success) {
        throw new Error("Failed to submit knowledge entry");
      }

      this.toastService.success(
        "Knowledge submitted for nutritionist review",
        "Submitted",
      );
      this.showAddDialog = false;
      this.resourceForm = this.getEmptyForm();
      await this.loadMySubmissions();

      if (this.isNutritionistReviewer()) {
        await this.loadPendingEntries();
      }
    } catch (error) {
      this.logger.error("Failed to submit knowledge entry", error);
      this.toastService.error(
        "Failed to submit knowledge entry",
        "Submission Error",
      );
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async loadPendingEntries(): Promise<void> {
    if (!this.isNutritionistReviewer()) {
      return;
    }

    this.isLoadingPending.set(true);
    try {
      const response = await firstValueFrom(
        this.api.get<{ entries?: PendingKnowledgeEntry[] }>(
          API_ENDPOINTS.knowledgeGovernance.pending,
          { limit: 100 },
        ),
      );
      if (!response?.success) {
        throw new Error("Failed to load pending entries");
      }
      this.pendingEntries.set(response.data?.entries || []);
    } catch (error) {
      this.logger.error("Failed to load pending knowledge entries", error);
      this.pendingEntries.set([]);
      this.toastService.error(
        "Could not load pending entries",
        "Review Queue Error",
      );
    } finally {
      this.isLoadingPending.set(false);
    }
  }

  async loadMySubmissions(): Promise<void> {
    this.isLoadingMySubmissions.set(true);
    try {
      const response = await firstValueFrom(
        this.api.get<{ entries?: MyKnowledgeSubmission[] }>(
          API_ENDPOINTS.knowledgeGovernance.my,
          { limit: 100 },
        ),
      );
      if (!response?.success) {
        throw new Error("Failed to load my submissions");
      }
      this.mySubmissions.set(response.data?.entries || []);
    } catch (error) {
      this.logger.error("Failed to load my knowledge submissions", error);
      this.mySubmissions.set([]);
      this.toastService.error(
        "Could not load your submissions",
        "Submission History Error",
      );
    } finally {
      this.isLoadingMySubmissions.set(false);
    }
  }

  async reviewPendingEntry(
    entryId: string,
    action: "approve" | "reject",
  ): Promise<void> {
    if (!this.isNutritionistReviewer()) {
      this.toastService.warn(
        "Only nutritionists can review entries",
        "Not Authorized",
      );
      return;
    }

    try {
      const response = await firstValueFrom(
        this.api.patch<{ entry?: { id: string } }>(
          API_ENDPOINTS.knowledgeGovernance.review(entryId),
          { action },
        ),
      );
      if (!response?.success) {
        throw new Error("Review failed");
      }
      this.toastService.success(
        `Entry ${action}d successfully`,
        "Review Complete",
      );
      await this.loadPendingEntries();
    } catch (error) {
      this.logger.error("Failed to review pending entry", error);
      this.toastService.error(
        "Failed to process review action",
        "Review Error",
      );
    }
  }

  openApproveDialog(entry: PendingKnowledgeEntry): void {
    this.selectedPendingEntry.set(entry);
    this.reviewForm = {
      notes: "",
      overrideQualityGate: false,
    };
    this.showApproveDialog = true;
  }

  setMyStatusFilter(
    filter: "all" | "pending" | "approved" | "rejected",
  ): void {
    this.myStatusFilter.set(filter);
  }

  async toggleAuditTimeline(entryId: string): Promise<void> {
    const current = this.auditTimelineByEntry();
    if (current[entryId]) {
      const next = { ...current };
      delete next[entryId];
      this.auditTimelineByEntry.set(next);
      return;
    }
    await this.loadAuditTimelineForEntry(entryId);
  }

  private async loadAuditTimelineForEntry(entryId: string): Promise<void> {
    this.auditLoadingByEntry.update((state) => ({ ...state, [entryId]: true }));
    try {
      const response = await firstValueFrom(
        this.api.get<{ events?: KnowledgeReviewEvent[] }>(
          API_ENDPOINTS.knowledgeGovernance.audit(entryId),
        ),
      );
      if (!response?.success) {
        throw new Error("Failed to load audit timeline");
      }
      this.auditTimelineByEntry.update((state) => ({
        ...state,
        [entryId]: response.data?.events || [],
      }));
    } catch (error) {
      this.logger.error("Failed to load audit timeline", error);
      this.toastService.error("Could not load audit timeline", "Audit Error");
    } finally {
      this.auditLoadingByEntry.update((state) => ({ ...state, [entryId]: false }));
    }
  }

  reviewQualityIssues(): string[] {
    const entry = this.selectedPendingEntry();
    if (!entry) {
      return [];
    }
    return this.getQualityIssuesForEntry(entry);
  }

  private getQualityIssuesForEntry(entry: PendingKnowledgeEntry): string[] {
    const issues: string[] = [];
    const answer = (entry.answer || "").trim().toLowerCase();
    const summary = (entry.summary || "").trim();
    const entryType = (entry.entry_type || "").trim().toLowerCase();

    if (answer.length < 80) {
      issues.push("Answer should be at least 80 characters.");
    }
    if (summary.length < 30) {
      issues.push("Summary should be at least 30 characters.");
    }

    if (entryType === "nutrition" || entryType === "supplement") {
      const hasDoseSignal = /\b(\d+\s?(mg|g|mcg|iu)|dose|dosing|serving|daily|per day)\b/.test(
        answer,
      );
      const hasSafetySignal =
        /\b(side effect|contraindication|safety|warning|avoid|risk|interaction|upper limit)\b/.test(
          answer,
        );
      if (!hasDoseSignal) {
        issues.push("Include dosing guidance for nutrition/supplement entries.");
      }
      if (!hasSafetySignal) {
        issues.push(
          "Include safety considerations for nutrition/supplement entries.",
        );
      }
    }

    return issues;
  }

  async confirmApprove(): Promise<void> {
    const entry = this.selectedPendingEntry();
    if (!entry) {
      return;
    }

    const issues = this.getQualityIssuesForEntry(entry);
    const notes = this.reviewForm.notes.trim();
    if (issues.length > 0 && this.reviewForm.overrideQualityGate && notes.length < 15) {
      this.toastService.warn(
        "Override approval requires notes with at least 15 characters",
        "Validation",
      );
      return;
    }

    this.isReviewSubmitting.set(true);
    try {
      const response = await firstValueFrom(
        this.api.patch<{ entry?: { id: string } }>(
          API_ENDPOINTS.knowledgeGovernance.review(entry.id),
          {
            action: "approve",
            notes: notes || null,
            override_quality_gate: this.reviewForm.overrideQualityGate,
          },
        ),
      );
      if (!response?.success) {
        throw new Error("Review failed");
      }
      this.toastService.success("Entry approved successfully", "Review Complete");
      this.showApproveDialog = false;
      this.selectedPendingEntry.set(null);
      await Promise.all([this.loadPendingEntries(), this.loadMySubmissions()]);
    } catch (error) {
      this.logger.error("Failed to approve pending entry", error);
      this.toastService.error(
        "Failed to process approval action",
        "Review Error",
      );
    } finally {
      this.isReviewSubmitting.set(false);
    }
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
