/**
 * Decision Ledger Service
 *
 * Handles all API calls for the Decision Ledger system
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "./api.service";
import { LoggerService } from "./logger.service";
import { getErrorMessage } from "../../shared/utils/error.utils";
import type { ApiResponse } from "../models/common.models";
import {
  extractApiArray,
  extractApiPayload,
  isApiResponse,
  isSuccessfulApiResponse,
} from "../utils/api-response-mapper";
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

  private normalizeDecision(
    decision: DecisionLedgerEntry,
  ): DecisionLedgerEntry {
    return {
      ...decision,
      createdAt: new Date(decision.createdAt),
      updatedAt: new Date(decision.updatedAt),
      reviewDate: new Date(decision.reviewDate),
      reviewedAt: decision.reviewedAt
        ? new Date(decision.reviewedAt)
        : undefined,
    };
  }

  private normalizeReminder(
    reminder: DecisionReviewReminder,
  ): DecisionReviewReminder {
    return {
      ...reminder,
      scheduledFor: new Date(reminder.scheduledFor),
      notifiedAt: reminder.notifiedAt
        ? new Date(reminder.notifiedAt)
        : undefined,
      createdAt: new Date(reminder.createdAt),
    };
  }

  private unwrapApiPayload<T>(
    response: ApiResponse<T> | T | null | undefined,
    fallbackMessage: string,
  ): T {
    const payload = extractApiPayload<T>(response);
    const wrappedFailure =
      isApiResponse(response) && !isSuccessfulApiResponse(response);
    if (wrappedFailure || payload == null) {
      const errorMessage =
        isApiResponse(response) && typeof response.error === "string"
          ? response.error
          : fallbackMessage;
      throw new Error(errorMessage);
    }
    return payload;
  }

  private handleRequestError(error: unknown, context: string): never {
    const errorMessage = getErrorMessage(error, "Unknown error");
    this.error.set(errorMessage);
    this.logger.error(`[DecisionLedger] Error ${context}:`, error);
    throw error;
  }

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
    this.decisions().filter((d) => (d.decisionBasis.confidence || 1.0) < 0.7),
  );

  /**
   * Get decisions with filters
   */
  async getDecisions(
    filters?: DecisionFilters,
  ): Promise<DecisionLedgerEntry[]> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.get<DecisionLedgerEntry[]>(
          "/api/decisions",
          filters as Record<string, unknown> | undefined,
        ),
      );
      const decisions = extractApiArray<DecisionLedgerEntry>(response).map((d) =>
        this.normalizeDecision(d),
      );
      if (
        decisions.length === 0 &&
        isApiResponse(response) &&
        !isSuccessfulApiResponse(response)
      ) {
        this.unwrapApiPayload<DecisionLedgerEntry[]>(
          response,
          "Failed to fetch decisions",
        );
      }
      this.decisions.set(decisions);
      return decisions;
    } catch (error) {
      return this.handleRequestError(error, "fetching decisions");
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
      const stats = this.unwrapApiPayload<DecisionStats>(
        response,
        "Failed to fetch statistics",
      );
      this.stats.set(stats);
      return stats;
    } catch (error) {
      return this.handleRequestError(error, "fetching stats");
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
        this.apiService.get<DecisionReviewReminder[]>(
          "/api/decisions/reminders",
        ),
      );
      const reminders = extractApiArray<DecisionReviewReminder>(response).map(
        (r) => this.normalizeReminder(r),
      );
      if (
        reminders.length === 0 &&
        isApiResponse(response) &&
        !isSuccessfulApiResponse(response)
      ) {
        this.unwrapApiPayload<DecisionReviewReminder[]>(
          response,
          "Failed to fetch reminders",
        );
      }
      this.reminders.set(reminders);
      return reminders;
    } catch (error) {
      return this.handleRequestError(error, "fetching reminders");
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
        this.apiService.get<DecisionLedgerEntry>(
          `/api/decisions/${decisionId}`,
        ),
      );
      return this.normalizeDecision(
        this.unwrapApiPayload<DecisionLedgerEntry>(response, "Decision not found"),
      );
    } catch (error) {
      return this.handleRequestError(error, "fetching decision");
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
      const decision = this.normalizeDecision(
        this.unwrapApiPayload<DecisionLedgerEntry>(
          response,
          "Failed to create decision",
        ),
      );

      // Add to decisions list
      this.decisions.update((decisions) => [decision, ...decisions]);

      // Refresh stats
      await this.getStats();

      return decision;
    } catch (error) {
      return this.handleRequestError(error, "creating decision");
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
      const decision = this.normalizeDecision(
        this.unwrapApiPayload<DecisionLedgerEntry>(
          response,
          "Failed to review decision",
        ),
      );

      // Update in decisions list
      this.decisions.update((decisions) =>
        decisions.map((d) => (d.id === decisionId ? decision : d)),
      );

      // Refresh stats
      await this.getStats();

      return decision;
    } catch (error) {
      return this.handleRequestError(error, "reviewing decision");
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
