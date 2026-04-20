/**
 * Chat Session Service
 *
 * Manages Merlin AI chat session persistence: loading recent sessions,
 * fetching full session message history, and URL query-param sync.
 */
import { inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { extractApiPayload } from "../../core/utils/api-response-mapper";

// ===== Exported Interfaces =====

export interface RecentChatSession {
  id: string;
  startedAt: string;
  messageCount: number;
  preview: string;
  previewRole?: "user" | "assistant" | null;
  previewIntent?: string | null;
  previewCreatedAt?: string | null;
}

export interface PersistedChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  riskLevel?: string | null;
  intent?: string | null;
  citations?: unknown[] | null;
  feedbackHelpful?: boolean | null;
  coachReviewedAt?: string | null;
  coachReviewedBy?: string | null;
  metadata?: {
    suggestedActions?: unknown[];
    evidenceGradeExplanation?: string | null;
    bookmarked?: boolean;
  } | null;
}

// ===== Service =====

@Injectable({ providedIn: "root" })
export class ChatSessionService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  readonly recentSessions = signal<RecentChatSession[]>([]);

  async loadRecentSessions(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.api.get<{ sessions?: RecentChatSession[] }>(
          API_ENDPOINTS.aiChat.sessions,
        ),
      );
      const payload = extractApiPayload<{
        sessions?: RecentChatSession[];
      }>(response);
      this.recentSessions.set(
        Array.isArray(payload?.sessions)
          ? payload.sessions.slice(0, 4)
          : [],
      );
    } catch (error) {
      this.logger.warn("[AI Chat] Failed to load recent sessions", error);
      this.recentSessions.set([]);
    }
  }

  async fetchSessionMessages(
    sessionId: string,
  ): Promise<PersistedChatMessage[]> {
    const response = await firstValueFrom(
      this.api.get<{ messages?: PersistedChatMessage[] }>(
        API_ENDPOINTS.aiChat.session(sessionId),
      ),
    );

    const payload = extractApiPayload<{
      messages?: PersistedChatMessage[];
    }>(response);

    return Array.isArray(payload?.messages) ? payload.messages : [];
  }

  syncSessionQueryParam(sessionId: string | null): void {
    const currentPath = this.router.url.split("?")[0];
    void this.router.navigate([currentPath], {
      queryParams: { session: sessionId || null },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  consumeRouteParams(paramNames: string[]): void {
    const consumedParams = Object.fromEntries(
      paramNames.map((paramName) => [paramName, null]),
    );
    const currentPath = this.router.url.split("?")[0];
    void this.router.navigate([currentPath], {
      queryParams: consumedParams,
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }
}
