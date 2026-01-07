/**
 * Decision Ledger Service
 * 
 * Handles all API calls for the Decision Ledger system
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import type {
  DecisionLedgerEntry,
  DecisionFilters,
  DecisionStats,
  CreateDecisionRequest,
  ReviewDecisionRequest,
  DecisionReviewReminder,
} from "../models/decision-ledger.models";

@Injectable({
  providedIn: "root",
})
export class DecisionLedgerService {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  // State signals
  readonly decisions = signal<DecisionLedgerEntry[]>([]);
  readonly stats = signal<DecisionStats | null>(null);
  readonly reminders = signal<DecisionReviewReminder[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // Computed values
  readonly activeDecisions = computed(() =>
    this.decisions().filter((d) => d.status === "active"),
  );

  readonly dueForReview = computed(() =>
    this.decisions().filter(
      (d) => d.status === "active" && new Date(d.reviewDate) <= new Date(),
    ),
  );

  readonly overdueDecisions = computed(() =>
    this.decisions().filter(
      (d) => d.status === "active" && new Date(d.reviewDate) < new Date(),
    ),
  );

  readonly lowConfidenceDecisions = computed(() =>
    this.decisions().filter(
      (d) =>
        (d.decisionBasis.confidence || d.decisionBasis.overall || 1.0) < 0.7,
    ),
  );

  /**
   * Get decisions with filters
   */
  async getDecisions(filters?: DecisionFilters): Promise<DecisionLedgerEntry[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.get<DecisionLedgerEntry[]>("/api/decisions", filters),
      );

      if (response.success && response.data) {
        const decisions = response.data.map((d) => ({
          ...d,
          createdAt: new Date(d.createdAt),
          updatedAt: new Date(d.updatedAt),
          reviewDate: new Date(d.reviewDate),
          reviewedAt: d.reviewedAt ? new Date(d.reviewedAt) : undefined,
        }));
        this.decisions.set(decisions);
        return decisions;
      }

      throw new Error(response.error || "Failed to fetch decisions");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.error.set(errorMessage);
      this.logger.error("[DecisionLedger] Error fetching decisions:", error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get decision statistics
   */
  async getStats(): Promise<DecisionStats> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.get<DecisionStats>("/api/decisions/stats"),
      );

      if (response.success && response.data) {
        this.stats.set(response.data);
        return response.data;
      }

      throw new Error(response.error || "Failed to fetch statistics");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.error.set(errorMessage);
      this.logger.error("[DecisionLedger] Error fetching stats:", error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get review reminders
   */
  async getReminders(): Promise<DecisionReviewReminder[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.get<DecisionReviewReminder[]>("/api/decisions/reminders"),
      );

      if (response.success && response.data) {
        const reminders = response.data.map((r) => ({
          ...r,
          scheduledFor: new Date(r.scheduledFor),
          notifiedAt: r.notifiedAt ? new Date(r.notifiedAt) : undefined,
          createdAt: new Date(r.createdAt),
        }));
        this.reminders.set(reminders);
        return reminders;
      }

      throw new Error(response.error || "Failed to fetch reminders");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.error.set(errorMessage);
      this.logger.error("[DecisionLedger] Error fetching reminders:", error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Get a single decision by ID
   */
  async getDecisionById(decisionId: string): Promise<DecisionLedgerEntry> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.get<DecisionLedgerEntry>(`/api/decisions/${decisionId}`),
      );

      if (response.success && response.data) {
        const decision = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          reviewDate: new Date(response.data.reviewDate),
          reviewedAt: response.data.reviewedAt
            ? new Date(response.data.reviewedAt)
            : undefined,
        };
        return decision;
      }

      throw new Error(response.error || "Decision not found");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.error.set(errorMessage);
      this.logger.error("[DecisionLedger] Error fetching decision:", error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Create a new decision
   */
  async createDecision(
    request: CreateDecisionRequest,
  ): Promise<DecisionLedgerEntry> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.post<DecisionLedgerEntry>("/api/decisions", request),
      );

      if (response.success && response.data) {
        const decision = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          reviewDate: new Date(response.data.reviewDate),
        };

        // Add to decisions list
        this.decisions.update((decisions) => [decision, ...decisions]);

        // Refresh stats
        await this.getStats();

        return decision;
      }

      throw new Error(response.error || "Failed to create decision");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.error.set(errorMessage);
      this.logger.error("[DecisionLedger] Error creating decision:", error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Review a decision
   */
  async reviewDecision(
    decisionId: string,
    request: ReviewDecisionRequest,
  ): Promise<DecisionLedgerEntry> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.post<DecisionLedgerEntry>(
          `/api/decisions/${decisionId}/review`,
          request,
        ),
      );

      if (response.success && response.data) {
        const decision = {
          ...response.data,
          createdAt: new Date(response.data.createdAt),
          updatedAt: new Date(response.data.updatedAt),
          reviewDate: new Date(response.data.reviewDate),
          reviewedAt: response.data.reviewedAt
            ? new Date(response.data.reviewedAt)
            : undefined,
        };

        // Update in decisions list
        this.decisions.update((decisions) =>
          decisions.map((d) => (d.id === decisionId ? decision : d)),
        );

        // Refresh stats
        await this.getStats();

        return decision;
      }

      throw new Error(response.error || "Failed to review decision");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.error.set(errorMessage);
      this.logger.error("[DecisionLedger] Error reviewing decision:", error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Refresh all data
   */
  async refresh(): Promise<void> {
    await Promise.all([
      this.getDecisions(),
      this.getStats(),
      this.getReminders(),
    ]);
  }
}

