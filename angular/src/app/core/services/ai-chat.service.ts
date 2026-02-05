import { Injectable, inject, signal, computed } from "@angular/core";
import { Observable, of } from "rxjs";
import { catchError, map, tap } from "rxjs";
import { ApiService, API_ENDPOINTS } from "./api.service";

/**
 * Risk levels for AI responses
 */
export type RiskLevel = "low" | "medium" | "high";

/**
 * Suggested action from AI
 */
export interface SuggestedAction {
  type: string;
  reason: string;
  label: string;
  data?: Record<string, unknown>;
}

/**
 * Citation from knowledge base
 */
export interface Citation {
  title: string;
  url?: string;
  evidence_grade?: string;
  date?: string;
}

/**
 * AI Chat message
 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  riskLevel?: RiskLevel;
  disclaimer?: string;
  citations?: Citation[];
  suggestedActions?: SuggestedAction[];
  metadata?: {
    source?: string;
    model?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
}

/**
 * Chat session
 */
export interface ChatSession {
  id: string;
  startedAt: Date;
  messages: ChatMessage[];
}

/**
 * AI Chat request
 */
export interface ChatRequest {
  message: string;
  session_id?: string;
  team_id?: string;
  goal?: string;
  time_horizon?: "immediate" | "weekly" | "monthly" | "seasonal";
}

/**
 * AI Chat response from backend
 */
interface ChatApiResponse {
  answer_markdown: string;
  citations: Citation[];
  risk_level: RiskLevel;
  disclaimer?: string;
  suggested_actions: SuggestedAction[];
  chat_session_id: string;
  message_id: string;
  metadata?: {
    source?: string;
    model?: string;
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  };
}

/**
 * AI Chat Service
 *
 * Provides AI coaching chat functionality with safety tiers.
 * Uses Groq LLM (FREE tier: 14,400 requests/day) on the backend.
 */
@Injectable({
  providedIn: "root",
})
export class AiChatService {
  private apiService = inject(ApiService);

  // State - All using signals for consistent reactivity
  private currentSession = signal<ChatSession | null>(null);

  loading = signal(false);
  error = signal<string | null>(null);

  // Computed signals
  messages = computed(() => this.currentSession()?.messages || []);
  sessionId = computed(() => this.currentSession()?.id || null);

  // For backward compatibility with components using Observable pattern
  readonly currentSession$ = computed(() => this.currentSession());

  /**
   * Send a message to the AI coach
   */
  sendMessage(request: ChatRequest): Observable<ChatMessage> {
    this.loading.set(true);
    this.error.set(null);

    // Add user message to local state immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: request.message,
      timestamp: new Date(),
    };
    this.addMessageToSession(userMessage);

    return this.apiService
      .post<ChatApiResponse>(
        API_ENDPOINTS.aiChat?.send || "/api/ai/chat",
        request,
      )
      .pipe(
        map((response) => {
          if (!response.success || !response.data) {
            throw new Error(response.error || "Failed to get AI response");
          }

          const data = response.data;

          // Create assistant message
          const assistantMessage: ChatMessage = {
            id: data.message_id,
            role: "assistant",
            content: data.answer_markdown,
            timestamp: new Date(),
            riskLevel: data.risk_level,
            disclaimer: data.disclaimer,
            citations: data.citations,
            suggestedActions: data.suggested_actions,
            metadata: data.metadata,
          };

          // Update session
          this.addMessageToSession(assistantMessage);
          this.updateSessionId(data.chat_session_id);

          return assistantMessage;
        }),
        tap(() => this.loading.set(false)),
        catchError((err) => {
          this.loading.set(false);
          const errorMessage = err.message || "Failed to send message";
          this.error.set(errorMessage);

          // Return fallback message
          const fallbackMessage: ChatMessage = {
            id: `error-${Date.now()}`,
            role: "assistant",
            content:
              "I'm having trouble connecting right now. Please try again in a moment, or consult your coach for immediate assistance.",
            timestamp: new Date(),
            riskLevel: "low",
          };
          this.addMessageToSession(fallbackMessage);

          return of(fallbackMessage);
        }),
      );
  }

  /**
   * Start a new chat session
   */
  startNewSession(): void {
    this.currentSession.set({
      id: "",
      startedAt: new Date(),
      messages: [],
    });
    this.error.set(null);
  }

  /**
   * Load an existing session
   */
  loadSession(sessionId: string): Observable<ChatSession | null> {
    return this.apiService
      .get<{ messages: ChatMessage[] }>(`/api/ai/chat/session/${sessionId}`)
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            const session: ChatSession = {
              id: sessionId,
              startedAt: new Date(),
              messages: response.data.messages || [],
            };
            this.currentSession.set(session);
            return session;
          }
          return null;
        }),
        catchError(() => {
          // Start fresh session if load fails
          this.startNewSession();
          return of(null);
        }),
      );
  }

  /**
   * Clear current session
   */
  clearSession(): void {
    this.currentSession.set(null);
    this.error.set(null);
  }

  /**
   * Get quick suggestions based on context
   */
  getQuickSuggestions(): string[] {
    return [
      "How can I improve my speed?",
      "What's a good warm-up routine?",
      "How do I prevent hamstring injuries?",
      "What should I eat before training?",
      "How do I recover faster?",
    ];
  }

  /**
   * Add message to current session
   */
  private addMessageToSession(message: ChatMessage): void {
    const session = this.currentSession();
    if (session) {
      this.currentSession.update((current) => {
        if (!current) return current;
        return {
          ...current,
          messages: [...current.messages, message],
        };
      });
    } else {
      // Create new session with this message
      this.currentSession.set({
        id: "",
        startedAt: new Date(),
        messages: [message],
      });
    }
  }

  /**
   * Update session ID (after first message)
   */
  private updateSessionId(sessionId: string): void {
    const session = this.currentSession();
    if (session && !session.id) {
      this.currentSession.update((current) => {
        if (!current) return current;
        return {
          ...current,
          id: sessionId,
        };
      });
    }
  }
}
