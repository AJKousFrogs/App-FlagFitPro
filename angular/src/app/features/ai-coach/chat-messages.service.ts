/**
 * Chat Messages Service
 *
 * Owns the Merlin AI message list, loading state, session ID, and all
 * operations that read or write those signals: sending messages, handling
 * errors, toggling bookmarks/citations, giving feedback, and restoring
 * persisted sessions.
 *
 * Loading-stage simulation (thinking → searching → generating) is also
 * managed here so the component template can bind to a single service.
 */

import { Injectable, computed, inject, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { UI_LIMITS } from "../../core/constants/app.constants";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { ToastService } from "../../core/services/toast.service";
import { extractApiPayload } from "../../core/utils/api-response-mapper";
import { ChatSessionService, type PersistedChatMessage } from "./chat-session.service";
import { ConversationClassifierService } from "./conversation-classifier.service";
import { MerlinKnowledgeService, type Citation } from "./merlin-knowledge.service";

// ============================================================================
// INTERFACES (exported so component can use them)
// ============================================================================

export interface SuggestedAction {
  type: string;
  label: string;
  reason: string;
  data?: Record<string, unknown>;
  isMicroSession?: boolean;
  microSession?: MicroSessionData;
}

export interface MicroSessionData {
  title: string;
  description?: string;
  session_type: string;
  estimated_duration_minutes: number;
  equipment_needed: string[];
  intensity_level: string;
  position_relevance: string[];
  steps: { order: number; instruction: string; duration_seconds: number }[];
  coaching_cues: string[];
  safety_notes?: string | null;
  follow_up_prompt: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  riskLevel?: string;
  citations?: Citation[];
  suggestedActions?: SuggestedAction[];
  disclaimer?: string;
  isLoading?: boolean;
  acwrSafety?: {
    blocked: boolean;
    reason: string;
    currentAcwr: number;
    riskZone: string;
  };
  isSwapPlan?: boolean;
  evidenceGradeExplanation?: string;
  coachReviewedAt?: string;
  coachReviewedBy?: string;
  intent?: string;
  feedbackGiven?: "helpful" | "not_helpful" | null;
  isExpanded?: boolean;
  showActions?: boolean;
  isBookmarked?: boolean;
  loadingStage?: "thinking" | "searching" | "generating";
}

export interface SessionSummaryItem {
  id: string;
  label: string;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({ providedIn: "root" })
export class ChatMessagesService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);
  private readonly teamMembership = inject(TeamMembershipService);
  private readonly knowledge = inject(MerlinKnowledgeService);
  private readonly chatSession = inject(ChatSessionService);
  private readonly classifier = inject(ConversationClassifierService);

  // ====== Messages state ======
  private readonly _messages = signal<ChatMessage[]>([]);
  readonly messages = this._messages.asReadonly();

  private readonly _isLoading = signal(false);
  readonly isLoading = this._isLoading.asReadonly();

  // Current session persisted to URL / API
  sessionId: string | null = null;

  // ====== Loading stage simulation ======
  private readonly _loadingStage = signal<"thinking" | "searching" | "generating">("thinking");
  readonly loadingStage = this._loadingStage.asReadonly();
  private loadingStageRunId = 0;
  private loadingStageTimeouts: ReturnType<typeof setTimeout>[] = [];

  // ============================================================================
  // MESSAGE MANIPULATION
  // ============================================================================

  clearMessages(): void {
    this._messages.set([]);
  }

  addMessage(msg: ChatMessage): void {
    this._messages.update((msgs) => [...msgs, msg]);
  }

  updateMessage(id: string, updater: (m: ChatMessage) => ChatMessage): void {
    this._messages.update((msgs) =>
      msgs.map((m) => (m.id === id ? updater(m) : m)),
    );
  }

  // ============================================================================
  // SEND MESSAGE (API)
  // ============================================================================

  /**
   * Add user message, fire the AI chat API, and resolve the response into
   * the messages list.  Component keeps all UI-only side-effects (haptics,
   * composer reset, closing panels).
   */
  sendMessageApi(message: string, isCoach: boolean): void {
    void this.knowledge.refreshGroundingForQuery(
      message,
      this.classifier.inferKnowledgeCategory(message),
    );

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    this._messages.update((msgs) => [...msgs, userMessage]);

    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };
    this._messages.update((msgs) => [...msgs, loadingMessage]);
    this._isLoading.set(true);
    this.simulateLoadingStages();

    this.api
      .post<{
        answer_markdown: string;
        citations: Citation[];
        risk_level: string;
        disclaimer: string;
        suggested_actions: SuggestedAction[];
        chat_session_id: string;
        message_id: string;
        acwr_safety: {
          blocked: boolean;
          reason: string;
          current_acwr: number;
          risk_zone: string;
        } | null;
        evidence_grade_explanation: string | null;
        intent: string | null;
        is_swap_plan: boolean;
      }>(API_ENDPOINTS.aiChat.send, {
        message,
        session_id: this.sessionId,
        team_id: this.teamMembership.teamId() || undefined,
        goal: this.classifier.inferConversationGoal(message, isCoach),
        time_horizon: this.classifier.inferTimeHorizon(message),
      })
      .subscribe({
        next: (response) => {
          this.clearLoadingStageTimers();
          const payload = extractApiPayload<{
            chat_session_id: string;
            message_id: string;
            answer_markdown: string;
            risk_level?: string;
            citations?: Citation[];
            suggested_actions?: SuggestedAction[];
            disclaimer?: string;
            acwr_safety?: {
              blocked: boolean;
              reason: string;
              current_acwr: number;
              risk_zone: string;
            } | null;
            is_swap_plan: boolean;
            evidence_grade_explanation?: string | null;
            intent?: string | null;
          }>(response);

          if (payload) {
            this.sessionId = payload.chat_session_id;
            this.chatSession.syncSessionQueryParam(payload.chat_session_id);

            const assistantMessage: ChatMessage = {
              id: payload.message_id,
              role: "assistant",
              content: payload.answer_markdown,
              timestamp: new Date(),
              riskLevel: payload.risk_level,
              citations: payload.citations,
              suggestedActions: payload.suggested_actions?.slice(
                0,
                UI_LIMITS.SUGGESTED_ACTIONS_COUNT,
              ),
              disclaimer: payload.disclaimer,
              acwrSafety: payload.acwr_safety
                ? {
                    blocked: payload.acwr_safety.blocked,
                    reason: payload.acwr_safety.reason,
                    currentAcwr: payload.acwr_safety.current_acwr,
                    riskZone: payload.acwr_safety.risk_zone,
                  }
                : undefined,
              isSwapPlan: payload.is_swap_plan,
              evidenceGradeExplanation:
                payload.evidence_grade_explanation || undefined,
              intent: payload.intent || undefined,
              feedbackGiven: null,
              isExpanded: false,
            };

            this._messages.update((msgs) => {
              const filtered = msgs.filter((m) => !m.isLoading);
              return [...filtered, assistantMessage];
            });
          } else {
            this.handleError("Failed to get response from Merlin AI");
          }
          this._isLoading.set(false);
        },
        error: (error) => {
          this.clearLoadingStageTimers();
          this.logger.error("AI Chat error:", error);
          this.handleError((error as Error).message || "Failed to connect to Merlin AI");
          this._isLoading.set(false);
        },
      });
  }

  handleError(message: string): void {
    this._messages.update((msgs) => msgs.filter((m) => !m.isLoading));
    this._messages.update((msgs) => [
      ...msgs,
      {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      } satisfies ChatMessage,
    ]);
    this.logger.error("AI Chat error displayed:", message);
  }

  // ============================================================================
  // SESSION RESTORE
  // ============================================================================

  async restoreSessionMessages(sessionId: string): Promise<boolean> {
    try {
      const messages = await this.chatSession.fetchSessionMessages(sessionId);
      this._messages.set(messages.map((m) => this.mapPersistedMessage(m)));
      this.sessionId = sessionId;
      return true;
    } catch (error) {
      this.logger.error("[AI Chat] Failed to restore session", error);
      this.toast.error("Unable to restore the previous Merlin session.");
      this.chatSession.syncSessionQueryParam(null);
      return false;
    }
  }

  mapPersistedMessage(message: PersistedChatMessage): ChatMessage {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: new Date(message.timestamp),
      riskLevel: message.riskLevel || undefined,
      intent: message.intent || undefined,
      citations: Array.isArray(message.citations)
        ? (message.citations as Citation[])
        : undefined,
      suggestedActions: (
        message.metadata?.suggestedActions as SuggestedAction[] | undefined
      )?.slice(0, UI_LIMITS.SUGGESTED_ACTIONS_COUNT),
      evidenceGradeExplanation:
        message.metadata?.evidenceGradeExplanation || undefined,
      isBookmarked: message.metadata?.bookmarked === true,
      feedbackGiven:
        message.feedbackHelpful === true
          ? "helpful"
          : message.feedbackHelpful === false
            ? "not_helpful"
            : null,
      coachReviewedAt: message.coachReviewedAt || undefined,
      coachReviewedBy: message.coachReviewedBy || undefined,
      isExpanded: false,
    };
  }

  // ============================================================================
  // MESSAGE ACTIONS
  // ============================================================================

  async giveFeedback(message: ChatMessage, helpful: boolean): Promise<void> {
    if (!message.id || message.feedbackGiven) return;

    const feedbackType = helpful ? "helpful" : "not_helpful";
    this._messages.update((msgs) =>
      msgs.map((m) =>
        m.id === message.id ? { ...m, feedbackGiven: feedbackType } : m,
      ),
    );

    try {
      await firstValueFrom(
        this.api.post(API_ENDPOINTS.responseFeedback, {
          messageId: message.id,
          wasHelpful: helpful,
        }),
      );
      this.toast.success(
        helpful ? "Thanks for the feedback!" : "Thanks, we'll improve!",
        "Feedback Received",
      );
    } catch (error) {
      this.logger.error("Error submitting feedback:", error);
      this._messages.update((msgs) =>
        msgs.map((m) =>
          m.id === message.id ? { ...m, feedbackGiven: null } : m,
        ),
      );
    }
  }

  toggleCitations(message: ChatMessage): void {
    this._messages.update((msgs) =>
      msgs.map((m) =>
        m.id === message.id ? { ...m, isExpanded: !m.isExpanded } : m,
      ),
    );
  }

  toggleBookmark(message: ChatMessage): void {
    const isNowBookmarked = !message.isBookmarked;
    this._messages.update((msgs) =>
      msgs.map((m) =>
        m.id === message.id ? { ...m, isBookmarked: isNowBookmarked } : m,
      ),
    );
    this.toast.success(isNowBookmarked ? "Message bookmarked!" : "Bookmark removed");

    if (message.id) {
      void firstValueFrom(
        this.api.post(API_ENDPOINTS.aiChat.bookmark, {
          messageId: message.id,
          bookmarked: isNowBookmarked,
        }),
      ).catch((err) => this.logger.error("Failed to save bookmark:", err));
    }
  }

  // ============================================================================
  // LOADING STAGES
  // ============================================================================

  simulateLoadingStages(): void {
    this.clearLoadingStageTimers();
    const runId = ++this.loadingStageRunId;

    this._loadingStage.set("thinking");

    const searchingTimeout = setTimeout(() => {
      if (this._isLoading() && runId === this.loadingStageRunId) {
        this._loadingStage.set("searching");
      }
    }, 800);
    this.loadingStageTimeouts.push(searchingTimeout);

    const generatingTimeout = setTimeout(() => {
      if (this._isLoading() && runId === this.loadingStageRunId) {
        this._loadingStage.set("generating");
      }
    }, 2000);
    this.loadingStageTimeouts.push(generatingTimeout);
  }

  clearLoadingStageTimers(): void {
    this.loadingStageRunId++;
    for (const timeoutId of this.loadingStageTimeouts) {
      clearTimeout(timeoutId);
    }
    this.loadingStageTimeouts = [];
    this._loadingStage.set("thinking");
  }

  getLoadingStageTitle(): string {
    switch (this._loadingStage()) {
      case "searching":
        return this.isNutritionLoadingContext()
          ? "Checking evidence and nutrition targets"
          : "Checking evidence and recent context";
      case "generating":
        return this.isNutritionLoadingContext()
          ? "Building your fueling guidance"
          : "Building your coaching answer";
      case "thinking":
      default:
        return "Understanding your question";
    }
  }

  getLoadingStageDescription(): string {
    switch (this._loadingStage()) {
      case "searching":
        return this.isNutritionLoadingContext()
          ? "Merlin is matching backend nutrition targets with approved evidence."
          : "Merlin is pulling the most relevant training and recovery evidence.";
      case "generating":
        return this.isNutritionLoadingContext()
          ? "Merlin is turning that evidence into a practical fueling and hydration plan."
          : "Merlin is turning that evidence into a practical next-step answer.";
      case "thinking":
      default:
        return "Merlin is classifying the request and deciding what context matters most.";
    }
  }

  private isNutritionLoadingContext(): boolean {
    const latestUserMessage = [...this._messages()]
      .reverse()
      .find((m) => m.role === "user");
    return latestUserMessage
      ? this.classifier.inferConversationGoal(latestUserMessage.content, false) ===
          "nutrition_guidance"
      : false;
  }

  // ============================================================================
  // SESSION SUMMARY (computed from messages + training signals via knowledge)
  // ============================================================================

  readonly sessionSummaryItems = computed<SessionSummaryItem[]>(() => {
    const items: SessionSummaryItem[] = [];
    const nutritionPlan = this.knowledge.nutritionPlan();
    const lastAssistantMessage = [...this._messages()]
      .reverse()
      .find((m) => m.role === "assistant" && !m.isLoading);

    if (nutritionPlan?.exists) {
      items.push({ id: "nutrition", label: "nutrition targets" });
    }

    if (lastAssistantMessage?.intent) {
      items.push({
        id: "topic",
        label: lastAssistantMessage.intent.replace(/_/g, " "),
      });
    }

    return items.slice(0, 4);
  });

  readonly sessionSummaryText = computed(() => {
    const items = this.sessionSummaryItems().map((item) => item.label);
    if (items.length === 0) {
      return "Merlin is ready to ground the next answer.";
    }
    return `Using ${items.join(", ")}.`;
  });
}
