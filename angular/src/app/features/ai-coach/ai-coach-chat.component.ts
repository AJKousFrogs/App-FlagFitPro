/**
 * AI Coach Chat Component - Premium UX Edition
 *
 * Best-in-class chat interface for Merlin AI Coach:
 * - Modern, fluid animations and micro-interactions
 * - Accessibility-first with ARIA labels and keyboard navigation
 * - Smart suggestions and context-aware features
 * - Feedback collection (thumbs up/down)
 * - Voice input support
 * - Message copy and share functionality
 * - Progressive loading states
 */

import { animate, style, transition, trigger } from "@angular/animations";
import { CommonModule } from "@angular/common";
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { RippleModule } from "primeng/ripple";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { ToastService } from "../../core/services/toast.service";
import { DailyReadinessComponent } from "../../shared/components/daily-readiness/daily-readiness.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { MicroSessionComponent } from "../../shared/components/micro-session/micro-session.component";

interface ChatMessage {
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
  // UI state
  feedbackGiven?: "helpful" | "not_helpful" | null;
  isExpanded?: boolean;
  showActions?: boolean;
  // New UX features
  isBookmarked?: boolean;
  loadingStage?: "thinking" | "searching" | "generating";
}

interface Citation {
  id: string;
  title: string;
  source_type: string;
  evidence_grade: string;
  url?: string;
  source_url?: string;
}

interface SuggestedAction {
  type: string;
  label: string;
  reason: string;
  data?: Record<string, unknown>;
  isMicroSession?: boolean;
  microSession?: MicroSessionData;
}

interface MicroSessionData {
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

interface QuickSuggestion {
  icon: string;
  label: string;
  query: string;
  category: string;
}

interface AutocompleteSuggestion {
  text: string;
  category: string;
}

@Component({
  selector: "app-ai-coach-chat",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("slideDown", [
      transition(":enter", [
        style({ opacity: 0, height: 0 }),
        animate("200ms ease-out", style({ opacity: 1, height: "*" })),
      ]),
      transition(":leave", [
        animate("150ms ease-in", style({ opacity: 0, height: 0 })),
      ]),
    ]),
  ],
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    TagModule,
    TooltipModule,
    ProgressSpinnerModule,
    DialogModule,
    RippleModule,
    BadgeModule,
    MainLayoutComponent,
    DailyReadinessComponent,
    MicroSessionComponent,
  ],
  template: `
    <app-main-layout>
      <div class="chat-container" [class.has-messages]="messages().length > 0">
        <!-- Daily Readiness Component (Modal) -->
        <app-daily-readiness
          [showOnInit]="true"
          (completed)="onReadinessCompleted($event)"
          (skipped)="onReadinessSkipped()"
        ></app-daily-readiness>

        <!-- Premium Header -->
        <header class="chat-header" role="banner">
          <div class="header-brand">
            <div class="avatar-container">
              <div class="avatar-glow"></div>
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvE6wGt8diMxqRhHi__HyjI-mheOoOW8m8fg&s"
                alt="Merlin AI Coach"
                class="coach-avatar"
              />
              <span class="online-indicator" aria-label="Online"></span>
            </div>
            <div class="brand-info">
              <h1>Merlin</h1>
              <div class="status-line">
                <span class="status-dot"></span>
                <span>AI Coach • Always here to help</span>
              </div>
            </div>
          </div>

          <div class="header-actions">
            @if (todayReadinessScore()) {
              <button
                class="readiness-pill"
                [pTooltip]="'Your readiness score today'"
                aria-label="Readiness score"
              >
                <i class="pi pi-heart-fill"></i>
                <span>{{ todayReadinessScore() }}%</span>
              </button>
            }

            <!-- Search conversations -->
            <button
              class="icon-btn"
              (click)="toggleSearchMode()"
              [pTooltip]="searchMode() ? 'Close search' : 'Search messages'"
              aria-label="Search conversations"
              pRipple
              [class.active]="searchMode()"
            >
              <i
                class="pi"
                [class.pi-search]="!searchMode()"
                [class.pi-times]="searchMode()"
              ></i>
            </button>

            <!-- Bookmarks -->
            <button
              class="icon-btn"
              (click)="toggleBookmarksView()"
              [pTooltip]="showBookmarks() ? 'Show all' : 'View bookmarks'"
              aria-label="View bookmarked messages"
              pRipple
              [class.active]="showBookmarks()"
            >
              <i
                class="pi pi-bookmark"
                [class.pi-bookmark-fill]="showBookmarks()"
              ></i>
              @if (bookmarkedCount() > 0) {
                <span class="badge-dot"></span>
              }
            </button>

            <button
              class="icon-btn"
              (click)="startNewConversation()"
              pTooltip="New chat"
              aria-label="Start new conversation"
              pRipple
            >
              <i class="pi pi-plus"></i>
            </button>
          </div>
        </header>

        <!-- Search Bar (conditionally shown) -->
        @if (searchMode()) {
          <div class="search-bar" @slideDown>
            <i class="pi pi-search"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search in conversation..."
              (input)="onSearchInput()"
              class="search-input"
              #searchInput
            />
            @if (searchQuery) {
              <span class="search-count"
                >{{ filteredMessages().length }} found</span
              >
            }
          </div>
        }

        <!-- Messages Area -->
        <main
          class="messages-area"
          #messagesContainer
          role="log"
          aria-label="Chat messages"
          aria-live="polite"
        >
          <!-- Welcome State -->
          @if (messages().length === 0) {
            <div class="welcome-state" role="region" aria-label="Welcome">
              <div class="welcome-hero">
                <div class="hero-icon">
                  <span class="emoji">🏈</span>
                  <div class="icon-rings">
                    <span class="ring ring-1"></span>
                    <span class="ring ring-2"></span>
                    <span class="ring ring-3"></span>
                  </div>
                </div>
                <h2>Hey{{ userName() ? ", " + userName() : "" }}! 👋</h2>
                <p>
                  I'm Merlin, your AI-powered flag football coach. Ask me
                  anything!
                </p>
              </div>

              <div class="suggestions-section">
                <h3>Quick Start</h3>
                <div class="suggestion-grid">
                  @for (
                    suggestion of quickSuggestions;
                    track suggestion.query
                  ) {
                    <button
                      class="suggestion-card"
                      (click)="askQuestion(suggestion.query)"
                      pRipple
                      [attr.aria-label]="'Ask about ' + suggestion.label"
                    >
                      <div class="suggestion-icon">
                        <i [class]="'pi ' + suggestion.icon"></i>
                      </div>
                      <div class="suggestion-content">
                        <span class="suggestion-label">{{
                          suggestion.label
                        }}</span>
                        <span class="suggestion-category">{{
                          suggestion.category
                        }}</span>
                      </div>
                      <i class="pi pi-arrow-right suggestion-arrow"></i>
                    </button>
                  }
                </div>
              </div>

              <div class="capabilities-section">
                <div class="capability-chips">
                  <span class="capability-chip">
                    <i class="pi pi-shield"></i> Evidence-based
                  </span>
                  <span class="capability-chip">
                    <i class="pi pi-lock"></i> Private & secure
                  </span>
                  <span class="capability-chip">
                    <i class="pi pi-clock"></i> 24/7 available
                  </span>
                </div>
              </div>
            </div>
          }

          <!-- Chat Messages -->
          @for (
            message of messages();
            track message.id || $index;
            let i = $index
          ) {
            <article
              class="message-wrapper"
              [class.user]="message.role === 'user'"
              [class.assistant]="message.role === 'assistant'"
              [class.swap-plan]="message.isSwapPlan"
              [class.entering]="isRecentMessage(i)"
              role="article"
              [attr.aria-label]="
                message.role === 'user' ? 'Your message' : 'Merlin response'
              "
            >
              <!-- Assistant Avatar -->
              @if (message.role === "assistant") {
                <div class="message-avatar">
                  <img
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvE6wGt8diMxqRhHi__HyjI-mheOoOW8m8fg&s"
                    alt="Merlin"
                  />
                </div>
              }

              <div class="message-bubble">
                <!-- Loading State with Progress Stages -->
                @if (message.isLoading) {
                  <div class="typing-indicator" aria-label="Merlin is typing">
                    <div class="loading-stage">
                      @switch (loadingStage()) {
                        @case ("thinking") {
                          <span class="stage-text"
                            >🧠 Understanding your question...</span
                          >
                        }
                        @case ("searching") {
                          <span class="stage-text"
                            >🔍 Searching knowledge base...</span
                          >
                        }
                        @case ("generating") {
                          <span class="stage-text"
                            >✍️ Crafting personalized response...</span
                          >
                        }
                        @default {
                          <span class="stage-text">💭 Thinking...</span>
                        }
                      }
                    </div>
                    <div class="typing-dots">
                      <span class="typing-dot"></span>
                      <span class="typing-dot"></span>
                      <span class="typing-dot"></span>
                    </div>
                  </div>
                } @else {
                  <!-- ACWR Warning Banner -->
                  @if (message.acwrSafety?.blocked) {
                    <div class="safety-banner" role="alert">
                      <i class="pi pi-exclamation-triangle"></i>
                      <div class="banner-content">
                        <strong>Training Load Alert</strong>
                        <span>{{ message.acwrSafety?.reason }}</span>
                      </div>
                    </div>
                  }

                  <!-- Message Content -->
                  <div
                    class="message-content"
                    [innerHTML]="formatMessage(message.content)"
                  ></div>

                  <!-- Risk Badge -->
                  @if (message.riskLevel && message.riskLevel !== "low") {
                    <div
                      class="risk-indicator"
                      [class]="'risk-' + message.riskLevel"
                    >
                      <i class="pi pi-info-circle"></i>
                      <span>{{ getRiskLabel(message.riskLevel) }}</span>
                    </div>
                  }

                  <!-- Disclaimer -->
                  @if (message.disclaimer) {
                    <div class="disclaimer-box">
                      <i class="pi pi-shield"></i>
                      <span>{{ message.disclaimer }}</span>
                    </div>
                  }

                  <!-- Coach Verified Badge -->
                  @if (message.coachReviewedAt) {
                    <div class="verified-badge">
                      <i class="pi pi-verified"></i>
                      <span>Coach Verified</span>
                      <span class="verified-time">{{
                        formatTime(message.coachReviewedAt)
                      }}</span>
                    </div>
                  }

                  <!-- Citations / Sources -->
                  @if (message.citations && message.citations.length > 0) {
                    <div class="citations-section">
                      <button
                        class="citations-toggle"
                        (click)="toggleCitations(message)"
                        [attr.aria-expanded]="message.isExpanded"
                      >
                        <i class="pi pi-book"></i>
                        <span
                          >{{ message.citations.length }} source{{
                            message.citations.length > 1 ? "s" : ""
                          }}</span
                        >
                        <i
                          class="pi pi-chevron-down"
                          [class.rotated]="message.isExpanded"
                        ></i>
                      </button>

                      @if (message.isExpanded) {
                        <div class="citations-list">
                          @for (
                            citation of message.citations;
                            track citation.id
                          ) {
                            @if (getCitationUrl(citation)) {
                              <a
                                class="citation-item clickable"
                                [href]="getCitationUrl(citation)"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <div class="citation-info">
                                  <span class="citation-title">{{
                                    citation.title
                                  }}</span>
                                  <span class="citation-link-hint">
                                    <i class="pi pi-external-link"></i>
                                    Read more
                                  </span>
                                </div>
                                @if (citation.evidence_grade) {
                                  <span class="citation-grade">{{
                                    citation.evidence_grade
                                  }}</span>
                                }
                              </a>
                            } @else {
                              <div class="citation-item">
                                <span class="citation-title">{{
                                  citation.title
                                }}</span>
                                @if (citation.evidence_grade) {
                                  <span class="citation-grade">{{
                                    citation.evidence_grade
                                  }}</span>
                                }
                              </div>
                            }
                          }
                          @if (message.evidenceGradeExplanation) {
                            <p class="evidence-note">
                              <i class="pi pi-info-circle"></i>
                              {{ message.evidenceGradeExplanation }}
                            </p>
                          }
                        </div>
                      }
                    </div>
                  }

                  <!-- Suggested Actions -->
                  @if (
                    message.suggestedActions &&
                    message.suggestedActions.length > 0
                  ) {
                    <div class="actions-row">
                      @for (
                        action of message.suggestedActions;
                        track action.type
                      ) {
                        @if (action.isMicroSession && action.microSession) {
                          <button
                            class="action-btn primary micro-session"
                            (click)="startMicroSession(action, message.id)"
                            [pTooltip]="action.reason"
                            pRipple
                          >
                            <i class="pi pi-play-circle"></i>
                            <span>{{ action.label }}</span>
                            <span class="duration-badge"
                              >{{
                                action.microSession.estimated_duration_minutes
                              }}m</span
                            >
                          </button>
                        } @else {
                          <button
                            class="action-btn secondary"
                            (click)="executeAction(action)"
                            [pTooltip]="action.reason"
                            pRipple
                          >
                            {{ action.label }}
                          </button>
                        }
                      }
                    </div>
                  }

                  <!-- Message Footer (Assistant only) -->
                  @if (message.role === "assistant" && message.id) {
                    <div class="message-footer">
                      <span class="timestamp">{{
                        formatTime(message.timestamp)
                      }}</span>

                      <div class="message-actions">
                        <button
                          class="mini-btn"
                          (click)="copyMessage(message)"
                          pTooltip="Copy"
                          aria-label="Copy message"
                        >
                          <i class="pi pi-copy"></i>
                        </button>

                        <!-- Bookmark button -->
                        <button
                          class="mini-btn bookmark"
                          [class.active]="message.isBookmarked"
                          (click)="toggleBookmark(message)"
                          [pTooltip]="
                            message.isBookmarked
                              ? 'Remove bookmark'
                              : 'Bookmark'
                          "
                          aria-label="Bookmark message"
                        >
                          <i
                            class="pi"
                            [class.pi-bookmark-fill]="message.isBookmarked"
                            [class.pi-bookmark]="!message.isBookmarked"
                          ></i>
                        </button>

                        <!-- Share button -->
                        <button
                          class="mini-btn"
                          (click)="shareMessage(message)"
                          pTooltip="Share"
                          aria-label="Share message"
                        >
                          <i class="pi pi-share-alt"></i>
                        </button>

                        <div
                          class="feedback-group"
                          role="group"
                          aria-label="Rate this response"
                        >
                          <button
                            class="mini-btn feedback"
                            [class.active]="message.feedbackGiven === 'helpful'"
                            (click)="giveFeedback(message, true)"
                            pTooltip="Helpful"
                            aria-label="Mark as helpful"
                          >
                            <i class="pi pi-thumbs-up"></i>
                          </button>
                          <button
                            class="mini-btn feedback"
                            [class.active]="
                              message.feedbackGiven === 'not_helpful'
                            "
                            (click)="giveFeedback(message, false)"
                            pTooltip="Not helpful"
                            aria-label="Mark as not helpful"
                          >
                            <i class="pi pi-thumbs-down"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                }

                <!-- User message timestamp -->
                @if (message.role === "user") {
                  <span class="user-timestamp">{{
                    formatTime(message.timestamp)
                  }}</span>
                }
              </div>

              <!-- User Avatar -->
              @if (message.role === "user") {
                <div class="message-avatar user">
                  <span class="user-initials">{{ userInitials() }}</span>
                </div>
              }
            </article>
          }

          <!-- Scroll to bottom button -->
          @if (showScrollButton()) {
            <button
              class="scroll-to-bottom"
              (click)="scrollToBottom()"
              aria-label="Scroll to latest message"
            >
              <i class="pi pi-chevron-down"></i>
            </button>
          }
        </main>

        <!-- Input Area -->
        <footer class="input-section" role="form" aria-label="Message input">
          <!-- Context chips when relevant -->
          @if (contextChips().length > 0 && messages().length > 0) {
            <div class="context-chips">
              @for (chip of contextChips(); track chip) {
                <button
                  class="context-chip"
                  (click)="askQuestion(chip)"
                  pRipple
                >
                  <i class="pi pi-plus-circle"></i>
                  {{ chip }}
                </button>
              }
            </div>
          }

          <!-- Autocomplete suggestions -->
          @if (
            autocompleteSuggestions().length > 0 &&
            currentMessage.trim().length >= 2
          ) {
            <div class="autocomplete-dropdown">
              @for (
                suggestion of autocompleteSuggestions();
                track suggestion.text
              ) {
                <button
                  class="autocomplete-item"
                  (click)="selectAutocomplete(suggestion)"
                  pRipple
                >
                  <span class="autocomplete-text">{{ suggestion.text }}</span>
                  <span class="autocomplete-category">{{
                    suggestion.category
                  }}</span>
                </button>
              }
            </div>
          }

          <div class="input-row">
            <div class="input-container">
              <textarea
                #messageInput
                [(ngModel)]="currentMessage"
                placeholder="Ask Merlin anything..."
                (keydown)="onKeyDown($event)"
                (input)="onInputChange()"
                [disabled]="isLoading() || isRecording()"
                rows="1"
                class="message-textarea"
                aria-label="Type your message"
                [attr.aria-disabled]="isLoading()"
              ></textarea>

              <div class="input-actions">
                @if (!currentMessage.trim()) {
                  <!-- Voice input button -->
                  <button
                    class="input-icon-btn voice-btn"
                    [class.recording]="isRecording()"
                    (click)="toggleVoiceInput()"
                    [pTooltip]="
                      isRecording() ? 'Stop recording' : 'Voice input'
                    "
                    aria-label="Voice input"
                    [disabled]="!speechSupported()"
                  >
                    <i
                      class="pi"
                      [class.pi-microphone]="!isRecording()"
                      [class.pi-stop-circle]="isRecording()"
                    ></i>
                    @if (isRecording()) {
                      <span class="recording-pulse"></span>
                    }
                  </button>
                }
              </div>
            </div>

            <button
              class="send-btn"
              (click)="sendMessage()"
              [disabled]="!currentMessage.trim() || isLoading()"
              [class.ready]="currentMessage.trim() && !isLoading()"
              aria-label="Send message"
              pRipple
            >
              @if (isLoading()) {
                <i class="pi pi-spin pi-spinner"></i>
              } @else {
                <i class="pi pi-send"></i>
              }
            </button>
          </div>

          <p class="input-disclaimer">
            <i class="pi pi-lock"></i>
            <span>Your conversations are private and encrypted</span>
            @if (!speechSupported()) {
              <span class="separator">•</span>
              <span class="voice-note"
                >Voice input not supported in this browser</span
              >
            }
          </p>
        </footer>

        <!-- Micro-Session Modal -->
        @if (activeMicroSession()) {
          <p-dialog
            [header]="activeMicroSession()?.title || 'Session'"
            [(visible)]="microSessionDialogVisible"
            [modal]="true"
            [closable]="!microSessionInProgress()"
            [dismissableMask]="!microSessionInProgress()"
            [style]="{ width: '500px', maxWidth: '95vw' }"
            styleClass="micro-session-dialog"
            (onHide)="onMicroSessionDialogHide()"
          >
            <app-micro-session
              [session]="activeMicroSessionSignal"
              [mode]="microSessionDisplayMode"
              (sessionCompleted)="onMicroSessionCompleted($event)"
              (sessionSkipped)="onMicroSessionSkipped()"
              (closed)="onMicroSessionClosed()"
            ></app-micro-session>
          </p-dialog>
        }
      </div>
    </app-main-layout>
  `,
  styleUrl: "./ai-coach-chat.component.scss",
})
export class AiCoachChatComponent implements OnInit, AfterViewChecked {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private toast = inject(ToastService);
  private supabaseService = inject(SupabaseService);
  private destroyRef = inject(DestroyRef);

  @ViewChild("messagesContainer") messagesContainer!: ElementRef;
  @ViewChild("messageInput") messageInput!: ElementRef;

  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);
  currentMessage = "";
  sessionId: string | null = null;
  private shouldScrollToBottom = false;
  private lastMessageCount = 0;

  // Daily readiness
  todayReadinessScore = signal<number | null>(null);

  // Micro-session state
  microSessionDialogVisible = false;
  microSessionInProgress = signal(false);
  activeMicroSession = signal<MicroSessionData | null>(null);
  activeMicroSessionMessageId: string | null = null;
  microSessionDisplayMode = signal<"modal" | "card">("card");

  // UI state
  showScrollButton = signal(false);

  // New UX features
  searchMode = signal(false);
  searchQuery = "";
  showBookmarks = signal(false);
  loadingStage = signal<"thinking" | "searching" | "generating">("thinking");

  // Voice input
  isRecording = signal(false);
  speechSupported = signal(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;

  // Autocomplete
  autocompleteSuggestions = signal<AutocompleteSuggestion[]>([]);
  private autocompleteDatabase: AutocompleteSuggestion[] = [
    { text: "How can I improve my route running?", category: "Skills" },
    { text: "How do I prevent hamstring injuries?", category: "Health" },
    { text: "What should I eat before a game?", category: "Nutrition" },
    { text: "How can I increase my speed?", category: "Performance" },
    { text: "Give me a warm-up routine", category: "Training" },
    { text: "What drills should a QB practice?", category: "Position" },
    { text: "How to recover after a hard practice?", category: "Recovery" },
    { text: "Best stretches for flag football", category: "Flexibility" },
    { text: "How to improve catching?", category: "Skills" },
    { text: "What are the best pre-game snacks?", category: "Nutrition" },
    { text: "How to stay hydrated during games?", category: "Nutrition" },
    { text: "Tips for better flag pulling", category: "Skills" },
    { text: "Mental preparation for game day", category: "Psychology" },
    { text: "How to build confidence?", category: "Psychology" },
    { text: "Strength exercises for football", category: "Training" },
  ];

  // Computed: filtered messages for search
  filteredMessages = computed(() => {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) return this.messages();
    return this.messages().filter((m) =>
      m.content.toLowerCase().includes(query),
    );
  });

  // Computed: bookmarked messages count
  bookmarkedCount = computed(() => {
    return this.messages().filter((m) => m.isBookmarked).length;
  });

  // Computed: visible messages (respects search and bookmarks filters)
  visibleMessages = computed(() => {
    let msgs = this.messages();

    if (this.showBookmarks()) {
      msgs = msgs.filter((m) => m.isBookmarked);
    }

    if (this.searchMode() && this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      msgs = msgs.filter((m) => m.content.toLowerCase().includes(query));
    }

    return msgs;
  });

  // Quick suggestions for welcome state
  quickSuggestions: QuickSuggestion[] = [
    {
      icon: "pi-bolt",
      label: "Improve route running",
      query: "How can I improve my route running?",
      category: "Skills",
    },
    {
      icon: "pi-heart",
      label: "Pre-game nutrition",
      query: "What should I eat before a game?",
      category: "Nutrition",
    },
    {
      icon: "pi-shield",
      label: "Prevent injuries",
      query: "How do I prevent injuries during training?",
      category: "Health",
    },
    {
      icon: "pi-sun",
      label: "Warm-up routine",
      query: "Give me a warm-up routine for game day",
      category: "Training",
    },
    {
      icon: "pi-forward",
      label: "Speed training",
      query: "How can I increase my speed?",
      category: "Performance",
    },
    {
      icon: "pi-star",
      label: "QB drills",
      query: "What drills should a quarterback practice?",
      category: "Position",
    },
  ];

  // Computed context chips based on conversation
  contextChips = computed(() => {
    const msgs = this.messages();
    if (msgs.length === 0) return [];

    const lastAssistantMsg = [...msgs]
      .reverse()
      .find((m) => m.role === "assistant" && !m.isLoading);
    if (!lastAssistantMsg) return [];

    // Generate relevant follow-up suggestions based on intent
    const intent = lastAssistantMsg.intent;
    const chips: string[] = [];

    switch (intent) {
      case "pain_injury":
        chips.push("What exercises can I still do?", "How long should I rest?");
        break;
      case "technique_correction":
        chips.push("Show me video examples", "Create a drill plan");
        break;
      case "plan_request":
        chips.push("Adjust for my schedule", "Add recovery days");
        break;
      case "recovery_readiness":
        chips.push("Low-intensity alternatives", "When can I return?");
        break;
      default:
        if (msgs.length === 2) {
          chips.push("Tell me more", "Give me a routine");
        }
    }

    return chips.slice(0, 3);
  });

  // User's first name for personalized greeting
  userName = computed(() => {
    const user = this.authService.getUser();
    if (!user?.name) return "";
    return user.name.split(" ")[0];
  });

  // Micro-session signal wrapper
  get activeMicroSessionSignal() {
    return signal(
      this.activeMicroSession() || {
        title: "",
        session_type: "recovery",
        estimated_duration_minutes: 5,
        equipment_needed: [],
        intensity_level: "low",
        position_relevance: ["ALL"],
        steps: [],
        coaching_cues: [],
        follow_up_prompt: "How do you feel? (0-10)",
      },
    );
  }

  ngOnInit(): void {
    this.loadTodayReadiness();
    this.initializeSpeechRecognition();
  }

  /**
   * Initialize Web Speech API for voice input
   */
  private initializeSpeechRecognition(): void {
    // Check for browser support - use any type for cross-browser compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowWithSpeech = window as any;
    const SpeechRecognitionAPI =
      windowWithSpeech.SpeechRecognition ||
      windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      this.speechSupported.set(false);
      return;
    }

    this.speechSupported.set(true);
    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onresult = (event: any) => {
      const results = event.results;
      let transcript = "";

      for (let i = 0; i < results.length; i++) {
        transcript += results[i][0].transcript;
      }

      this.currentMessage = transcript;

      // If final result, stop recording
      if (results[results.length - 1].isFinal) {
        this.stopRecording();
        // Haptic feedback on mobile
        this.triggerHaptic("success");
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onerror = (event: any) => {
      this.logger.error("Speech recognition error:", event.error);
      this.stopRecording();
      if (event.error !== "aborted") {
        this.toast.error("Could not recognize speech. Please try again.");
      }
    };

    this.recognition.onend = () => {
      this.isRecording.set(false);
    };
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }

    // Check if we need to show scroll button
    this.checkScrollPosition();
  }

  @HostListener("window:keydown", ["$event"])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Cmd/Ctrl + Enter to send
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      this.sendMessage();
    }
  }

  async loadTodayReadiness(): Promise<void> {
    const user = this.authService.getUser();
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await this.supabaseService.client
        .from("athlete_daily_state")
        .select("readiness_score")
        .eq("user_id", user.id)
        .eq("state_date", today)
        .single();

      if (data?.readiness_score) {
        this.todayReadinessScore.set(Math.round(data.readiness_score * 100));
      }
    } catch {
      // No state for today yet
    }
  }

  onReadinessCompleted(state: {
    pain_level: number;
    fatigue_level: number;
    sleep_quality: number;
    motivation_level: number;
  }): void {
    const score =
      ((10 - state.pain_level) * 0.3 +
        (10 - state.fatigue_level) * 0.25 +
        state.sleep_quality * 0.25 +
        state.motivation_level * 0.2) *
      10;
    this.todayReadinessScore.set(Math.round(Math.max(0, Math.min(100, score))));
    this.toast.success(
      "Thanks for checking in! Your readiness has been recorded.",
    );
  }

  onReadinessSkipped(): void {
    // User skipped, that's okay
  }

  userInitials(): string {
    const user = this.authService.getUser();
    if (!user?.name) return "U";
    const parts = user.name.split(" ");
    return parts
      .map((p) => p[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }

  isRecentMessage(index: number): boolean {
    return index >= this.messages().length - 2;
  }

  askQuestion(question: string): void {
    this.currentMessage = question;
    this.sendMessage();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const message = this.currentMessage.trim();
    if (!message || this.isLoading()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    this.messages.update((msgs) => [...msgs, userMessage]);
    this.currentMessage = "";
    this.shouldScrollToBottom = true;

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };
    this.messages.update((msgs) => [...msgs, loadingMessage]);
    this.isLoading.set(true);

    // Start loading stage simulation
    this.simulateLoadingStages();

    // Haptic feedback on send
    this.triggerHaptic("light");

    // Clear autocomplete
    this.autocompleteSuggestions.set([]);

    // Reset textarea height
    if (this.messageInput?.nativeElement) {
      this.messageInput.nativeElement.style.height = "auto";
    }

    // Call AI Chat API
    this.apiService
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
        state_gate_escalation: {
          escalated: boolean;
          original_risk: string;
          escalated_risk: string;
          reasons: string[];
        } | null;
      }>("/api/ai-chat", {
        message,
        session_id: this.sessionId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.sessionId = response.data.chat_session_id;

            const assistantMessage: ChatMessage = {
              id: response.data.message_id,
              role: "assistant",
              content: response.data.answer_markdown,
              timestamp: new Date(),
              riskLevel: response.data.risk_level,
              citations: response.data.citations,
              suggestedActions: response.data.suggested_actions?.slice(0, 3),
              disclaimer: response.data.disclaimer,
              acwrSafety: response.data.acwr_safety
                ? {
                    blocked: response.data.acwr_safety.blocked,
                    reason: response.data.acwr_safety.reason,
                    currentAcwr: response.data.acwr_safety.current_acwr,
                    riskZone: response.data.acwr_safety.risk_zone,
                  }
                : undefined,
              isSwapPlan: response.data.is_swap_plan,
              evidenceGradeExplanation:
                response.data.evidence_grade_explanation || undefined,
              intent: response.data.intent || undefined,
              feedbackGiven: null,
              isExpanded: false,
            };

            this.messages.update((msgs) => {
              const filtered = msgs.filter((m) => !m.isLoading);
              return [...filtered, assistantMessage];
            });
          } else {
            this.handleError("Failed to get response from AI Coach");
          }
          this.isLoading.set(false);
          this.shouldScrollToBottom = true;
        },
        error: (error) => {
          this.logger.error("AI Chat error:", error);
          this.handleError(error.message || "Failed to connect to AI Coach");
          this.isLoading.set(false);
        },
      });
  }

  private handleError(message: string): void {
    this.messages.update((msgs) => msgs.filter((m) => !m.isLoading));

    const errorMessage: ChatMessage = {
      id: `error-${Date.now()}`,
      role: "assistant",
      content:
        "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
      timestamp: new Date(),
    };
    this.messages.update((msgs) => [...msgs, errorMessage]);

    this.toast.error(message, "Error");
  }

  startNewConversation(): void {
    this.messages.set([]);
    this.sessionId = null;
    this.currentMessage = "";
  }

  // Feedback handling
  async giveFeedback(message: ChatMessage, helpful: boolean): Promise<void> {
    if (!message.id || message.feedbackGiven) return;

    const feedbackType = helpful ? "helpful" : "not_helpful";

    // Optimistic update
    this.messages.update((msgs) =>
      msgs.map((m) =>
        m.id === message.id ? { ...m, feedbackGiven: feedbackType } : m,
      ),
    );

    try {
      await this.apiService
        .post("/api/response-feedback", {
          messageId: message.id,
          wasHelpful: helpful,
        })
        .toPromise();

      this.toast.success(
        helpful ? "Thanks for the feedback!" : "Thanks, we'll improve!",
        "Feedback Received",
      );
    } catch (error) {
      this.logger.error("Error submitting feedback:", error);
      // Revert on error
      this.messages.update((msgs) =>
        msgs.map((m) =>
          m.id === message.id ? { ...m, feedbackGiven: null } : m,
        ),
      );
    }
  }

  // Copy message
  async copyMessage(message: ChatMessage): Promise<void> {
    try {
      await navigator.clipboard.writeText(message.content);
      this.toast.success("Copied to clipboard");
    } catch {
      this.toast.error("Failed to copy");
    }
  }

  // Toggle citations
  toggleCitations(message: ChatMessage): void {
    this.messages.update((msgs) =>
      msgs.map((m) =>
        m.id === message.id ? { ...m, isExpanded: !m.isExpanded } : m,
      ),
    );
  }

  executeAction(action: SuggestedAction): void {
    switch (action.type) {
      case "ask_coach":
        this.toast.info(
          "Please consult with your coach or healthcare provider for personalized guidance.",
          "Professional Advice",
        );
        break;
      case "add_exercise":
        this.askQuestion(
          `Show me recovery exercises for ${action.data?.["injuryType"] || "general recovery"}`,
        );
        break;
      case "create_session":
        this.askQuestion("Create a recovery session plan for me");
        break;
      case "read_article":
        this.toast.info("Opening related articles...", "Articles");
        break;
      case "reduce_load":
        this.askQuestion("What low-intensity activities can I do today?");
        break;
      case "micro_session":
        if (action.microSession) {
          this.startMicroSession(action);
        }
        break;
      default:
        this.logger.info("Action executed:", action);
    }
  }

  startMicroSession(action: SuggestedAction, messageId?: string): void {
    if (!action.microSession) {
      this.logger.error("No micro-session data in action");
      return;
    }

    this.activeMicroSession.set({
      ...action.microSession,
    } as MicroSessionData);
    this.activeMicroSessionMessageId = messageId || null;
    this.microSessionDialogVisible = true;
    this.microSessionInProgress.set(false);
  }

  onMicroSessionCompleted(result: {
    duration_minutes: number;
    follow_up_response?: { rating: number; notes: string };
  }): void {
    this.microSessionInProgress.set(false);
    this.toast.success(
      `Great work! Session completed in ${result.duration_minutes} minutes.`,
    );

    const followUpMessage: ChatMessage = {
      id: `followup-${Date.now()}`,
      role: "assistant",
      content:
        `🎉 **Session Complete!**\n\nYou completed the ${this.activeMicroSession()?.title || "session"} in ${result.duration_minutes} minutes.` +
        (result.follow_up_response
          ? `\n\nYour feedback: ${result.follow_up_response.rating}/10${result.follow_up_response.notes ? ` - "${result.follow_up_response.notes}"` : ""}`
          : ""),
      timestamp: new Date(),
    };
    this.messages.update((msgs) => [...msgs, followUpMessage]);
    this.shouldScrollToBottom = true;

    this.closeMicroSessionDialog();
  }

  onMicroSessionSkipped(): void {
    this.microSessionInProgress.set(false);
    this.closeMicroSessionDialog();
  }

  onMicroSessionClosed(): void {
    this.closeMicroSessionDialog();
  }

  onMicroSessionDialogHide(): void {
    if (!this.microSessionInProgress()) {
      this.closeMicroSessionDialog();
    }
  }

  private closeMicroSessionDialog(): void {
    this.microSessionDialogVisible = false;
    this.activeMicroSession.set(null);
    this.activeMicroSessionMessageId = null;
    this.microSessionInProgress.set(false);
  }

  formatMessage(content: string): string {
    if (!content) return "";

    let html = content
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^- (.*$)/gm, "<li>$1</li>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    html = html.replace(/(<li>.*<\/li>)+/g, "<ul>$&</ul>");

    return `<p>${html}</p>`;
  }

  formatTime(date: Date | string): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(dateObj);
  }

  getRiskLabel(riskLevel: string): string {
    switch (riskLevel) {
      case "medium":
        return "Consult your coach";
      case "high":
        return "Professional advice recommended";
      default:
        return "";
    }
  }

  /**
   * Get the URL for a citation (if available)
   * Returns the url or source_url field from the citation
   */
  getCitationUrl(citation: Citation): string | null {
    return citation.url || citation.source_url || null;
  }

  scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  private checkScrollPosition(): void {
    if (this.messagesContainer?.nativeElement) {
      const element = this.messagesContainer.nativeElement;
      const isAtBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight < 100;
      this.showScrollButton.set(!isAtBottom && this.messages().length > 2);
    }
  }

  // ========================================
  // VOICE INPUT
  // ========================================

  toggleVoiceInput(): void {
    if (this.isRecording()) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  private startRecording(): void {
    if (!this.recognition || !this.speechSupported()) {
      this.toast.error("Voice input is not supported in this browser");
      return;
    }

    this.isRecording.set(true);
    this.triggerHaptic("light");

    try {
      this.recognition.start();
      this.toast.info("Listening... Speak now", "Voice Input");
    } catch (error) {
      this.logger.error("Failed to start recording:", error);
      this.isRecording.set(false);
    }
  }

  private stopRecording(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
    this.isRecording.set(false);
  }

  // ========================================
  // AUTOCOMPLETE
  // ========================================

  onInputChange(): void {
    const query = this.currentMessage.toLowerCase().trim();

    if (query.length < 2) {
      this.autocompleteSuggestions.set([]);
      return;
    }

    // Filter suggestions based on input
    const matches = this.autocompleteDatabase
      .filter((s) => s.text.toLowerCase().includes(query))
      .slice(0, 5);

    this.autocompleteSuggestions.set(matches);
  }

  selectAutocomplete(suggestion: AutocompleteSuggestion): void {
    this.currentMessage = suggestion.text;
    this.autocompleteSuggestions.set([]);
    this.triggerHaptic("selection");

    // Focus back on input
    if (this.messageInput?.nativeElement) {
      this.messageInput.nativeElement.focus();
    }
  }

  // ========================================
  // SEARCH & BOOKMARKS
  // ========================================

  toggleSearchMode(): void {
    this.searchMode.update((v) => !v);
    this.searchQuery = "";

    if (this.searchMode()) {
      // Focus search input after render
      setTimeout(() => {
        const searchInput = document.querySelector(
          ".search-input",
        ) as HTMLInputElement;
        searchInput?.focus();
      }, 100);
    }
  }

  onSearchInput(): void {
    // Search is computed, nothing needed here
    // Could add debounce for performance with large histories
  }

  toggleBookmarksView(): void {
    this.showBookmarks.update((v) => !v);
    this.triggerHaptic("selection");
  }

  toggleBookmark(message: ChatMessage): void {
    this.messages.update((msgs) =>
      msgs.map((m) =>
        m.id === message.id ? { ...m, isBookmarked: !m.isBookmarked } : m,
      ),
    );

    const isNowBookmarked = !message.isBookmarked;
    this.toast.success(
      isNowBookmarked ? "Message bookmarked!" : "Bookmark removed",
    );
    this.triggerHaptic("selection");

    // Persist bookmark to backend (optional)
    if (message.id) {
      this.apiService
        .post("/api/ai-chat/bookmark", {
          messageId: message.id,
          bookmarked: isNowBookmarked,
        })
        .subscribe({
          error: (err) => this.logger.error("Failed to save bookmark:", err),
        });
    }
  }

  // ========================================
  // SHARE
  // ========================================

  async shareMessage(message: ChatMessage): Promise<void> {
    const shareText = `💬 From Merlin AI Coach:\n\n${message.content}`;

    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Merlin AI Coach",
          text: shareText,
        });
        this.triggerHaptic("success");
        return;
      } catch (err) {
        // User cancelled or share failed, fall back to copy
        if ((err as Error).name !== "AbortError") {
          this.logger.error("Share failed:", err);
        }
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      this.toast.success("Copied to clipboard - ready to share!");
    } catch {
      this.toast.error("Failed to copy");
    }
  }

  // ========================================
  // HAPTIC FEEDBACK (Mobile)
  // ========================================

  private triggerHaptic(
    type: "light" | "medium" | "heavy" | "selection" | "success" | "error",
  ): void {
    // Check if vibration API is available
    if (!navigator.vibrate) return;

    const patterns: Record<string, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 30,
      selection: 5,
      success: [10, 50, 10],
      error: [30, 50, 30],
    };

    navigator.vibrate(patterns[type] || 10);
  }

  // ========================================
  // LOADING STAGES
  // ========================================

  private simulateLoadingStages(): void {
    // Stage 1: Thinking
    this.loadingStage.set("thinking");

    // Stage 2: Searching (after 800ms)
    setTimeout(() => {
      if (this.isLoading()) {
        this.loadingStage.set("searching");
      }
    }, 800);

    // Stage 3: Generating (after 2s)
    setTimeout(() => {
      if (this.isLoading()) {
        this.loadingStage.set("generating");
      }
    }, 2000);
  }
}
