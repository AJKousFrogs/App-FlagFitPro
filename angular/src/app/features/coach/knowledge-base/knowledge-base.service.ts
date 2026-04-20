/**
 * Knowledge Base Service
 *
 * Data access layer for the knowledge base: loading resources, pending
 * review entries, user submissions, audit timelines, and review actions.
 */
import { computed, inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService, API_ENDPOINTS } from "../../../core/services/api.service";
import { LoggerService } from "../../../core/services/logger.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { TeamMembershipService } from "../../../core/services/team-membership.service";
import { ToastService } from "../../../core/services/toast.service";
import {
  extractApiPayload,
  isSuccessfulApiResponse,
} from "../../../core/utils/api-response-mapper";

// ===== Interfaces =====

export interface KnowledgeResource {
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

export interface ResourceCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface PendingKnowledgeEntry {
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

export interface MyKnowledgeSubmission {
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

export interface KnowledgeReviewEvent {
  id: number;
  action: "approve" | "reject";
  reviewed_by_role: string;
  notes?: string | null;
  quality_gate_override: boolean;
  quality_issues?: string[];
  created_at: string;
}

export interface ResourceFormData {
  type: "article" | "video" | "link" | "pdf";
  title: string;
  category: string;
  url: string;
  content: string;
  visibility: string;
  tags: string;
}

// ===== Constants =====

export const CATEGORIES = [
  { id: "drills", name: "Drills", icon: "pi-bolt" },
  { id: "tactics", name: "Tactics", icon: "pi-book" },
  { id: "conditioning", name: "Conditioning", icon: "pi-heart" },
  { id: "injury", name: "Injury Prevention", icon: "pi-heart" },
  { id: "rules", name: "Rules", icon: "pi-list" },
  { id: "position", name: "Position Guides", icon: "pi-bullseye" },
  { id: "mental", name: "Mental Game", icon: "pi-lightbulb" },
  { id: "nutrition", name: "Nutrition", icon: "pi-apple" },
];

export const RESOURCE_TYPES = [
  { label: "Article / Document", value: "article" },
  { label: "External Link", value: "link" },
  { label: "Video (YouTube/Vimeo)", value: "video" },
  { label: "File Upload (PDF)", value: "pdf" },
];

export const VISIBILITY_OPTIONS = [
  { label: "Team only", value: "team" },
  { label: "Coaches only", value: "coaches" },
  { label: "Public (all users)", value: "public" },
];

// ===== Service =====

@Injectable({ providedIn: "root" })
export class KnowledgeBaseService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly toastService = inject(ToastService);
  private readonly supabase = inject(SupabaseService);
  private readonly teamMembershipService = inject(TeamMembershipService);

  // State
  readonly resources = signal<KnowledgeResource[]>([]);
  readonly categories = signal<ResourceCategory[]>([]);
  readonly pendingEntries = signal<PendingKnowledgeEntry[]>([]);
  readonly mySubmissions = signal<MyKnowledgeSubmission[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly isLoadingPending = signal(false);
  readonly isLoadingMySubmissions = signal(false);
  readonly isSubmitting = signal(false);
  readonly isReviewSubmitting = signal(false);
  readonly selectedPendingEntry = signal<PendingKnowledgeEntry | null>(null);
  readonly selectedResource = signal<KnowledgeResource | null>(null);
  readonly auditTimelineByEntry = signal<Record<string, KnowledgeReviewEvent[]>>(
    {},
  );
  readonly auditLoadingByEntry = signal<Record<string, boolean>>({});

  // Computed
  readonly featuredResources = computed(() =>
    this.resources()
      .filter((r) => r.isStaffPick)
      .slice(0, 2),
  );

  readonly teamResources = computed(() =>
    this.resources().filter((r) => r.isTeamResource),
  );

  // ===== Bootstrap =====

  async bootstrap(): Promise<void> {
    await Promise.all([
      this.loadData(),
      this.loadMySubmissions(),
      this.teamMembershipService.loadMembership().catch((error: unknown) => {
        this.logger.warn("Failed to load team membership", error);
        return null;
      }),
    ]);

    if (this.isNutritionistReviewer()) {
      await this.loadPendingEntries();
    }
  }

  // ===== Data Loaders =====

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(null);

    try {
      const response = await firstValueFrom(
        this.api.get<{
          resources?: KnowledgeResource[];
          categories?: ResourceCategory[];
        }>(API_ENDPOINTS.knowledge.base),
      );
      const payload = extractApiPayload<{
        resources?: KnowledgeResource[];
        categories?: ResourceCategory[];
      }>(response);
      if (payload) {
        this.resources.set(payload.resources || []);
        this.categories.set(payload.categories || []);
      } else {
        throw new Error("Knowledge base payload missing");
      }
    } catch (err) {
      this.logger.error("Failed to load knowledge base", err);
      this.categories.set([]);
      this.resources.set([]);
      this.loadError.set(
        "We couldn't load the knowledge base. Please try again.",
      );
    } finally {
      this.isLoading.set(false);
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
      const payload = extractApiPayload<{ entries?: PendingKnowledgeEntry[] }>(
        response,
      );
      if (!payload) {
        throw new Error("Failed to load pending entries");
      }
      this.pendingEntries.set(payload.entries || []);
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
      const payload = extractApiPayload<{ entries?: MyKnowledgeSubmission[] }>(
        response,
      );
      if (!payload) {
        throw new Error("Failed to load my submissions");
      }
      this.mySubmissions.set(payload.entries || []);
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

  // ===== Actions =====

  async saveResource(form: ResourceFormData): Promise<boolean> {
    const title = form.title.trim();
    const content = form.content.trim();
    const url = form.url.trim();

    if (!title) {
      this.toastService.warn("Please enter a title", "Validation");
      return false;
    }
    if (!content && !url) {
      this.toastService.warn(
        "Add content or a URL before submitting",
        "Validation",
      );
      return false;
    }

    const payload = {
      topic: title.toLowerCase(),
      question: title,
      answer: content || url,
      summary: content ? content.slice(0, 240) : `External resource: ${url}`,
      entry_type: this.mapEntryType(form.category || ""),
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

      if (!isSuccessfulApiResponse(response)) {
        throw new Error("Failed to submit knowledge entry");
      }

      this.toastService.success(
        "Knowledge submitted for nutritionist review",
        "Submitted",
      );
      await this.refreshReviewQueues();
      return true;
    } catch (error) {
      this.logger.error("Failed to submit knowledge entry", error);
      this.toastService.error(
        "Failed to submit knowledge entry",
        "Submission Error",
      );
      return false;
    } finally {
      this.isSubmitting.set(false);
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
      if (!isSuccessfulApiResponse(response)) {
        throw new Error("Review failed");
      }
      this.toastService.success(
        `Entry ${action}d successfully`,
        "Review Complete",
      );
      await this.refreshReviewQueues();
    } catch (error) {
      this.logger.error("Failed to review pending entry", error);
      this.toastService.error(
        "Failed to process review action",
        "Review Error",
      );
    }
  }

  async confirmApprove(notes: string, overrideQualityGate: boolean): Promise<boolean> {
    const entry = this.selectedPendingEntry();
    if (!entry) {
      return false;
    }

    const issues = this.getQualityIssuesForEntry(entry);
    if (issues.length > 0 && overrideQualityGate && notes.trim().length < 15) {
      this.toastService.warn(
        "Override approval requires notes with at least 15 characters",
        "Validation",
      );
      return false;
    }

    this.isReviewSubmitting.set(true);
    try {
      const response = await firstValueFrom(
        this.api.patch<{ entry?: { id: string } }>(
          API_ENDPOINTS.knowledgeGovernance.review(entry.id),
          {
            action: "approve",
            notes: notes.trim() || null,
            override_quality_gate: overrideQualityGate,
          },
        ),
      );
      if (!isSuccessfulApiResponse(response)) {
        throw new Error("Review failed");
      }
      this.toastService.success(
        "Entry approved successfully",
        "Review Complete",
      );
      await this.refreshReviewQueues();
      return true;
    } catch (error) {
      this.logger.error("Failed to approve pending entry", error);
      this.toastService.error(
        "Failed to process approval action",
        "Review Error",
      );
      return false;
    } finally {
      this.isReviewSubmitting.set(false);
    }
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

  reviewQualityIssues(): string[] {
    const entry = this.selectedPendingEntry();
    if (!entry) return [];
    return this.getQualityIssuesForEntry(entry);
  }

  isNutritionistReviewer(): boolean {
    return this.getEffectiveRole() === "nutritionist";
  }

  async refreshReviewQueues(): Promise<void> {
    const refreshTasks: Promise<unknown>[] = [this.loadMySubmissions()];
    if (this.isNutritionistReviewer()) {
      refreshTasks.push(this.loadPendingEntries());
    }
    await Promise.all(refreshTasks);
  }

  // ===== Private Helpers =====

  private async loadAuditTimelineForEntry(entryId: string): Promise<void> {
    this.auditLoadingByEntry.update((state) => ({
      ...state,
      [entryId]: true,
    }));
    try {
      const response = await firstValueFrom(
        this.api.get<{ events?: KnowledgeReviewEvent[] }>(
          API_ENDPOINTS.knowledgeGovernance.audit(entryId),
        ),
      );
      const payload = extractApiPayload<{ events?: KnowledgeReviewEvent[] }>(
        response,
      );
      if (!payload) {
        throw new Error("Failed to load audit timeline");
      }
      this.auditTimelineByEntry.update((state) => ({
        ...state,
        [entryId]: payload.events || [],
      }));
    } catch (error) {
      this.logger.error("Failed to load audit timeline", error);
      this.toastService.error("Could not load audit timeline", "Audit Error");
    } finally {
      this.auditLoadingByEntry.update((state) => ({
        ...state,
        [entryId]: false,
      }));
    }
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
      const hasDoseSignal =
        /\b(\d+\s?(mg|g|mcg|iu)|dose|dosing|serving|daily|per day)\b/.test(
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

  private getEffectiveRole(): string {
    const user = this.supabase.currentUser();
    const metadata = user?.user_metadata ?? {};
    const roleFromMeta = String(
      metadata["staff_role"] || metadata["role"] || "",
    )
      .trim()
      .toLowerCase();
    const roleFromTeam = (this.teamMembershipService.role() || "")
      .toString()
      .trim()
      .toLowerCase();
    return roleFromMeta || roleFromTeam || "player";
  }

  private mapEntryType(category: string): string {
    const value = category.trim().toLowerCase();
    if (value === "nutrition") return "nutrition";
    if (value === "injury") return "injury";
    if (value === "mental") return "psychology";
    return "training_method";
  }
}
