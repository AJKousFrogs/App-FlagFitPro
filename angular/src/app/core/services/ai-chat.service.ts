import { Injectable, inject, signal, computed } from "@angular/core";
import { Observable, of, from } from "rxjs";
import { catchError, map, tap } from "rxjs";
import { ApiService, API_ENDPOINTS } from "./api.service";
import { SupabaseService } from "./supabase.service";
import { getErrorMessage } from "../../shared/utils/error.utils";
import {
  extractApiPayload,
  isApiResponse,
  isSuccessfulApiResponse,
} from "../utils/api-response-mapper";

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
  citations?: Citation[] | null;
  risk_level?: RiskLevel | string | null;
  disclaimer?: string;
  suggested_actions?: SuggestedAction[] | null;
  chat_session_id?: string;
  session_id?: string;
  message_id?: string | null;
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
 * Provides Merlin AI coaching chat functionality with safety tiers.
 * Uses Groq LLM (FREE tier: 14,400 requests/day) on the backend.
 */
/** Maximum messages stored in local session before older ones are summarized. */
const MAX_SESSION_MESSAGES = 20;

/** Rate limit: at most this many user messages within the sliding window. */
const RATE_LIMIT_MAX = 5;
/** Rate limit window in milliseconds. */
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

@Injectable({
  providedIn: "root",
})
export class AiChatService {
  private apiService = inject(ApiService);
  private supabase = inject(SupabaseService);

  // State - All using signals for consistent reactivity
  private currentSession = signal<ChatSession | null>(null);

  loading = signal(false);
  error = signal<string | null>(null);

  // Computed signals
  messages = computed(() => this.currentSession()?.messages || []);
  sessionId = computed(() => this.currentSession()?.id || null);

  // For backward compatibility with components using Observable pattern
  readonly currentSession$ = computed(() => this.currentSession());

  /** Timestamps of recent user messages — used for client-side rate limiting. */
  private readonly recentMessageTimestamps: number[] = [];

  /**
   * Send a message to Merlin AI using server-sent events streaming.
   *
   * Enforces two guards before hitting the API:
   *  1. Client-side rate limit (RATE_LIMIT_MAX messages / RATE_LIMIT_WINDOW_MS)
   *  2. Context window management (trims old messages when session grows large)
   *
   * The backend streams tokens via SSE. A placeholder assistant message is
   * added immediately and its `content` is updated live as tokens arrive.
   * The Observable emits the finalised ChatMessage when streaming completes.
   */
  sendMessage(request: ChatRequest): Observable<ChatMessage> {
    // ── Rate limit check ─────────────────────────────────────────────────────
    const now = Date.now();
    while (
      this.recentMessageTimestamps.length > 0 &&
      this.recentMessageTimestamps[0] < now - RATE_LIMIT_WINDOW_MS
    ) {
      this.recentMessageTimestamps.shift();
    }

    if (this.recentMessageTimestamps.length >= RATE_LIMIT_MAX) {
      const oldestMs = this.recentMessageTimestamps[0];
      const retryInSec = Math.ceil((oldestMs + RATE_LIMIT_WINDOW_MS - now) / 1000);
      const rateLimitMsg: ChatMessage = {
        id: `rate-limit-${now}`,
        role: "assistant",
        content: `You're sending messages too fast. Please wait ${retryInSec} second${retryInSec !== 1 ? "s" : ""} before trying again.`,
        timestamp: new Date(),
        riskLevel: "low",
      };
      return of(rateLimitMsg);
    }

    this.recentMessageTimestamps.push(now);
    this.loading.set(true);
    this.error.set(null);

    // ── Context window management ─────────────────────────────────────────────
    this.trimSessionContext();

    // Add user message to local state immediately
    const userMessage: ChatMessage = {
      id: `user-${now}`,
      role: "user",
      content: request.message,
      timestamp: new Date(),
    };
    this.addMessageToSession(userMessage);

    // ── Streaming via SSE ─────────────────────────────────────────────────────
    return from(this.streamMessage(request)).pipe(
      tap(() => this.loading.set(false)),
      catchError((err) => {
        this.loading.set(false);
        const errorMessage = getErrorMessage(err, "Failed to send message");
        this.error.set(errorMessage);

        const fallbackMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again in a moment, or consult your coach for immediate assistance.",
          timestamp: new Date(),
          riskLevel: "low",
        };
        this.addMessageToSession(fallbackMessage);
        return of(fallbackMessage);
      }),
    );
  }

  /**
   * Core SSE streaming implementation.
   * Creates a placeholder message, streams tokens into it, finalises metadata.
   */
  private async streamMessage(request: ChatRequest): Promise<ChatMessage> {
    const token = await this.supabase.waitForInit().then(() => this.supabase.getToken());

    const placeholderId = `assistant-${Date.now()}`;
    const placeholder: ChatMessage = {
      id: placeholderId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      riskLevel: "low",
    };
    this.addMessageToSession(placeholder);

    const response = await fetch(this.apiService.buildUrl(API_ENDPOINTS.aiChat.send), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok || !response.body) {
      throw new Error(`AI service returned ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulatedContent = "";
    let finalMessage: ChatMessage = placeholder;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;

          let event: { type: string; token?: string; payload?: ChatApiResponse; message?: string };
          try {
            event = JSON.parse(trimmed.slice(6));
          } catch {
            continue;
          }

          if (event.type === "token" && event.token) {
            accumulatedContent += event.token;
            // Update the placeholder message in-place so the UI updates reactively
            this.updateMessageContent(placeholderId, accumulatedContent);

          } else if (event.type === "done" && event.payload) {
            const p = event.payload;
            const riskLevel = this.normalizeRiskLevel(p.risk_level);
            finalMessage = {
              id: p.message_id || placeholderId,
              role: "assistant",
              content: p.answer_markdown || accumulatedContent,
              timestamp: new Date(),
              riskLevel,
              disclaimer: p.disclaimer,
              citations: Array.isArray(p.citations) ? p.citations : [],
              suggestedActions: Array.isArray(p.suggested_actions) ? p.suggested_actions : [],
              metadata: p.metadata,
            };
            // Replace the placeholder with the final message
            this.replaceMessage(placeholderId, finalMessage);
            if (p.chat_session_id) this.updateSessionId(p.chat_session_id);

          } else if (event.type === "error") {
            throw new Error(event.message ?? "Stream error");
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return finalMessage;
  }

  /**
   * Update the `content` field of an existing message in the session.
   * Used to stream tokens into the placeholder message.
   */
  private updateMessageContent(id: string, content: string): void {
    this.currentSession.update((session) => {
      if (!session) return session;
      return {
        ...session,
        messages: session.messages.map((m) =>
          m.id === id ? { ...m, content } : m,
        ),
      };
    });
  }

  /**
   * Replace the placeholder message with the fully-resolved ChatMessage.
   */
  private replaceMessage(placeholderId: string, replacement: ChatMessage): void {
    this.currentSession.update((session) => {
      if (!session) return session;
      return {
        ...session,
        messages: session.messages.map((m) =>
          m.id === placeholderId ? replacement : m,
        ),
      };
    });
  }

  /**
   * Trim session context when it exceeds MAX_SESSION_MESSAGES.
   *
   * Strategy: keep the system context summary marker + the most recent half
   * of messages. Older messages are collapsed into a single "[Earlier context
   * omitted — N messages]" placeholder so the user can see history was trimmed.
   */
  private trimSessionContext(): void {
    const session = this.currentSession();
    if (!session || session.messages.length < MAX_SESSION_MESSAGES) return;

    const keepCount = Math.floor(MAX_SESSION_MESSAGES / 2);
    const dropped = session.messages.length - keepCount;

    const contextMarker: ChatMessage = {
      id: `context-trim-${Date.now()}`,
      role: "assistant",
      content:
        `_[${dropped} earlier message${dropped !== 1 ? "s" : ""} omitted to stay within context limits. Start a new session to reset.]_`,
      timestamp: new Date(),
      riskLevel: "low",
    };

    const recentMessages = session.messages.slice(-keepCount);

    this.currentSession.update((current) => {
      if (!current) return current;
      return { ...current, messages: [contextMarker, ...recentMessages] };
    });
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
    this.recentMessageTimestamps.length = 0; // Reset rate limit window on new session
    this.error.set(null);
  }

  /**
   * Load an existing session
   */
  loadSession(sessionId: string): Observable<ChatSession | null> {
    return this.apiService
      .get<{ messages: ChatMessage[] }>(API_ENDPOINTS.aiChat.session(sessionId))
      .pipe(
        map((response) => {
          const data = extractApiPayload<{ messages: ChatMessage[] }>(response);
          const wrappedFailure =
            isApiResponse(response) && !isSuccessfulApiResponse(response);
          if (wrappedFailure || !data) {
            return null;
          }

          const session: ChatSession = {
            id: sessionId,
            startedAt: new Date(),
            messages: data.messages || [],
          };
          this.currentSession.set(session);
          return session;
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
    if (!sessionId) return;
    const session = this.currentSession();
    if (session && session.id !== sessionId) {
      this.currentSession.update((current) => {
        if (!current) return current;
        return {
          ...current,
          id: sessionId,
        };
      });
    }
  }

  private normalizeRiskLevel(value: string | null | undefined): RiskLevel {
    if (value === "high" || value === "medium" || value === "low") {
      return value;
    }
    return "low";
  }
}
