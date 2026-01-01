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
  styles: [
    `
      /* ========================================
       PREMIUM CHAT UI - DESIGN SYSTEM
       ======================================== */

      :host {
        --chat-bg: #f8fafc;
        --chat-surface: #ffffff;
        --chat-border: #e2e8f0;
        --chat-primary: #089949;
        --chat-primary-light: rgba(8, 153, 73, 0.08);
        --chat-primary-dark: #067a3a;
        --chat-text: #0f172a;
        --chat-text-secondary: #64748b;
        --chat-text-muted: #94a3b8;
        --chat-user-bubble: linear-gradient(135deg, #089949 0%, #0caf58 100%);
        --chat-assistant-bubble: #ffffff;
        --chat-radius: 20px;
        --chat-radius-sm: 12px;
        --chat-shadow:
          0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
        --chat-shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.08);
        --chat-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      /* ========================================
       CONTAINER
       ======================================== */

      .chat-container {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 80px);
        max-width: 900px;
        margin: 0 auto;
        background: var(--chat-bg);
        position: relative;
      }

      /* ========================================
       HEADER
       ======================================== */

      .chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        background: var(--chat-surface);
        border-bottom: 1px solid var(--chat-border);
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .header-brand {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .avatar-container {
        position: relative;
        width: 48px;
        height: 48px;
      }

      .avatar-glow {
        position: absolute;
        inset: -4px;
        background: var(--chat-primary-light);
        border-radius: 50%;
        animation: pulse-glow 3s ease-in-out infinite;
      }

      @keyframes pulse-glow {
        0%,
        100% {
          transform: scale(1);
          opacity: 0.5;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.3;
        }
      }

      .coach-avatar {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
        position: relative;
        z-index: 1;
        border: 2px solid var(--chat-surface);
      }

      .online-indicator {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        background: var(--chat-primary);
        border: 2px solid var(--chat-surface);
        border-radius: 50%;
        z-index: 2;
      }

      .brand-info h1 {
        font-family: "Poppins", system-ui, sans-serif;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--chat-text);
        margin: 0;
        letter-spacing: -0.01em;
      }

      .status-line {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.8125rem;
        color: var(--chat-text-secondary);
        margin-top: 2px;
      }

      .status-dot {
        width: 6px;
        height: 6px;
        background: var(--chat-primary);
        border-radius: 50%;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .readiness-pill {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        background: var(--chat-primary-light);
        border: none;
        border-radius: 20px;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--chat-primary);
        cursor: pointer;
        transition: var(--chat-transition);
      }

      .readiness-pill:hover {
        background: rgba(8, 153, 73, 0.12);
      }

      .readiness-pill i {
        font-size: 0.875rem;
      }

      .icon-btn {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: 1px solid var(--chat-border);
        border-radius: 12px;
        color: var(--chat-text-secondary);
        cursor: pointer;
        transition: var(--chat-transition);
      }

      .icon-btn:hover {
        background: var(--chat-primary-light);
        border-color: var(--chat-primary);
        color: var(--chat-primary);
      }

      /* ========================================
       MESSAGES AREA
       ======================================== */

      .messages-area {
        flex: 1;
        overflow-y: auto;
        padding: 24px 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        scroll-behavior: smooth;
      }

      /* ========================================
       WELCOME STATE
       ======================================== */

      .welcome-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px 16px;
        animation: fadeInUp 0.6s ease-out;
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .welcome-hero {
        text-align: center;
        margin-bottom: 40px;
      }

      .hero-icon {
        position: relative;
        width: 80px;
        height: 80px;
        margin: 0 auto 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .hero-icon .emoji {
        font-size: 48px;
        position: relative;
        z-index: 1;
      }

      .icon-rings {
        position: absolute;
        inset: 0;
      }

      .ring {
        position: absolute;
        inset: 0;
        border: 2px solid var(--chat-primary);
        border-radius: 50%;
        opacity: 0.2;
        animation: ring-expand 3s ease-out infinite;
      }

      .ring-2 {
        animation-delay: 1s;
      }
      .ring-3 {
        animation-delay: 2s;
      }

      @keyframes ring-expand {
        0% {
          transform: scale(0.8);
          opacity: 0.3;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }

      .welcome-hero h2 {
        font-family: "Poppins", system-ui, sans-serif;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--chat-text);
        margin: 0 0 8px;
      }

      .welcome-hero p {
        font-size: 1rem;
        color: var(--chat-text-secondary);
        margin: 0;
        max-width: 320px;
      }

      .suggestions-section {
        width: 100%;
        max-width: 560px;
      }

      .suggestions-section h3 {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--chat-text-muted);
        margin: 0 0 12px 4px;
      }

      .suggestion-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .suggestion-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        background: var(--chat-surface);
        border: 1px solid var(--chat-border);
        border-radius: var(--chat-radius-sm);
        cursor: pointer;
        transition: var(--chat-transition);
        text-align: left;
        width: 100%;
      }

      .suggestion-card:hover {
        border-color: var(--chat-primary);
        box-shadow: var(--chat-shadow);
        transform: translateX(4px);
      }

      .suggestion-card:hover .suggestion-arrow {
        opacity: 1;
        transform: translateX(0);
      }

      .suggestion-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--chat-primary-light);
        border-radius: 10px;
        color: var(--chat-primary);
        flex-shrink: 0;
      }

      .suggestion-icon i {
        font-size: 1.125rem;
      }

      .suggestion-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .suggestion-label {
        font-size: 0.9375rem;
        font-weight: 500;
        color: var(--chat-text);
      }

      .suggestion-category {
        font-size: 0.75rem;
        color: var(--chat-text-muted);
      }

      .suggestion-arrow {
        font-size: 0.875rem;
        color: var(--chat-primary);
        opacity: 0;
        transform: translateX(-8px);
        transition: var(--chat-transition);
      }

      .capabilities-section {
        margin-top: 32px;
      }

      .capability-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
      }

      .capability-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--chat-surface);
        border: 1px solid var(--chat-border);
        border-radius: 20px;
        font-size: 0.75rem;
        color: var(--chat-text-secondary);
      }

      .capability-chip i {
        font-size: 0.75rem;
        color: var(--chat-primary);
      }

      /* ========================================
       MESSAGE BUBBLES
       ======================================== */

      .message-wrapper {
        display: flex;
        gap: 12px;
        max-width: 85%;
        animation: messageIn 0.3s ease-out;
      }

      .message-wrapper.entering {
        animation: messageIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes messageIn {
        from {
          opacity: 0;
          transform: translateY(12px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .message-wrapper.user {
        align-self: flex-end;
        flex-direction: row-reverse;
      }

      .message-wrapper.assistant {
        align-self: flex-start;
      }

      .message-avatar {
        width: 36px;
        height: 36px;
        flex-shrink: 0;
      }

      .message-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .message-avatar.user {
        background: var(--chat-user-bubble);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .user-initials {
        font-size: 0.8125rem;
        font-weight: 600;
        color: white;
      }

      .message-bubble {
        padding: 14px 18px;
        border-radius: var(--chat-radius);
        position: relative;
        min-width: 60px;
      }

      .message-wrapper.user .message-bubble {
        background: var(--chat-user-bubble);
        border-bottom-right-radius: 6px;
      }

      /* 🚨 CRITICAL: WHITE TEXT ON GREEN - Override everything */
      .message-wrapper.user .message-bubble,
      .message-wrapper.user .message-bubble *,
      .message-wrapper.user .message-bubble p,
      .message-wrapper.user .message-bubble span,
      .message-wrapper.user .message-bubble div,
      .message-wrapper.user .message-content,
      .message-wrapper.user .message-content *,
      .message-wrapper.user .message-content p,
      .message-wrapper.user .message-content span,
      .message-wrapper.user .message-content strong,
      .message-wrapper.user .message-content em,
      .message-wrapper.user .message-content li,
      .message-wrapper.user .message-content h2,
      .message-wrapper.user .message-content h3 {
        color: #ffffff !important;
      }

      .message-wrapper.assistant .message-bubble {
        background: var(--chat-assistant-bubble);
        color: var(--chat-text);
        border-bottom-left-radius: 6px;
        box-shadow: var(--chat-shadow);
      }

      .message-wrapper.swap-plan .message-bubble {
        background: linear-gradient(
          135deg,
          rgba(251, 191, 36, 0.05) 0%,
          rgba(8, 153, 73, 0.05) 100%
        );
        border: 1px solid rgba(251, 191, 36, 0.2);
      }

      /* Message content */
      .message-content {
        font-size: 0.9375rem;
        line-height: 1.6;
      }

      .message-content :global(h2) {
        font-size: 1.0625rem;
        font-weight: 600;
        margin: 12px 0 8px;
      }

      .message-content :global(h3) {
        font-size: 0.9375rem;
        font-weight: 600;
        margin: 10px 0 6px;
      }

      .message-content :global(ul),
      .message-content :global(ol) {
        margin: 8px 0;
        padding-left: 20px;
      }

      .message-content :global(li) {
        margin: 4px 0;
      }

      .message-content :global(strong) {
        font-weight: 600;
      }

      .message-content :global(code) {
        background: rgba(0, 0, 0, 0.05);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: "JetBrains Mono", monospace;
        font-size: 0.875rem;
      }

      /* Typing indicator */
      .typing-indicator {
        display: flex;
        gap: 4px;
        padding: 4px 0;
      }

      .typing-dot {
        width: 8px;
        height: 8px;
        background: var(--chat-text-muted);
        border-radius: 50%;
        animation: typing 1.4s ease-in-out infinite;
      }

      .typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      .typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typing {
        0%,
        60%,
        100% {
          transform: translateY(0);
          opacity: 0.4;
        }
        30% {
          transform: translateY(-6px);
          opacity: 1;
        }
      }

      /* Safety banner */
      .safety-banner {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 14px;
        background: rgba(251, 191, 36, 0.1);
        border: 1px solid rgba(251, 191, 36, 0.3);
        border-radius: var(--chat-radius-sm);
        margin-bottom: 12px;
      }

      .safety-banner i {
        color: #d97706;
        font-size: 1rem;
        margin-top: 2px;
      }

      .banner-content {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .banner-content strong {
        font-size: 0.8125rem;
        color: #92400e;
      }

      .banner-content span {
        font-size: 0.8125rem;
        color: #b45309;
      }

      /* Risk indicator */
      .risk-indicator {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 500;
        margin-top: 12px;
      }

      .risk-indicator.risk-medium {
        background: rgba(251, 191, 36, 0.1);
        color: #b45309;
      }

      .risk-indicator.risk-high {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }

      /* Disclaimer */
      .disclaimer-box {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 10px 12px;
        background: var(--chat-primary-light);
        border-radius: var(--chat-radius-sm);
        margin-top: 12px;
        font-size: 0.75rem;
        color: var(--chat-text-secondary);
      }

      .disclaimer-box i {
        color: var(--chat-primary);
        margin-top: 1px;
      }

      /* Verified badge */
      .verified-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: linear-gradient(
          135deg,
          var(--chat-primary-light) 0%,
          rgba(8, 153, 73, 0.06) 100%
        );
        border: 1px solid rgba(8, 153, 73, 0.2);
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--chat-primary);
        margin-top: 12px;
      }

      .verified-badge i {
        font-size: 0.875rem;
      }

      .verified-time {
        font-weight: 400;
        opacity: 0.8;
      }

      /* Citations */
      .citations-section {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--chat-border);
      }

      .citations-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        background: transparent;
        border: 1px solid var(--chat-border);
        border-radius: 8px;
        font-size: 0.75rem;
        color: var(--chat-text-secondary);
        cursor: pointer;
        transition: var(--chat-transition);
      }

      .citations-toggle:hover {
        border-color: var(--chat-primary);
        color: var(--chat-primary);
      }

      .citations-toggle i.rotated {
        transform: rotate(180deg);
      }

      .citations-list {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .citation-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        background: var(--chat-bg);
        border-radius: 8px;
        font-size: 0.8125rem;
        text-decoration: none;
        transition: var(--chat-transition);
      }

      .citation-item.clickable {
        cursor: pointer;
        border: 1px solid transparent;
      }

      .citation-item.clickable:hover {
        background: var(--chat-primary-light);
        border-color: var(--chat-primary);
      }

      .citation-item.clickable:hover .citation-title {
        color: var(--chat-primary);
      }

      .citation-item.clickable:hover .citation-link-hint {
        opacity: 1;
      }

      .citation-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
      }

      .citation-title {
        color: var(--chat-text-secondary);
        transition: var(--chat-transition);
      }

      .citation-link-hint {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.6875rem;
        color: var(--chat-primary);
        opacity: 0.7;
        transition: var(--chat-transition);
      }

      .citation-link-hint i {
        font-size: 0.625rem;
      }

      .citation-grade {
        padding: 3px 10px;
        background: var(--chat-primary);
        color: white;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.6875rem;
        flex-shrink: 0;
      }

      .evidence-note {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        margin-top: 8px;
        font-size: 0.6875rem;
        color: var(--chat-text-muted);
      }

      .evidence-note i {
        margin-top: 1px;
      }

      /* Actions */
      .actions-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
      }

      .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border-radius: 20px;
        font-family: "Poppins", system-ui, sans-serif;
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        transition: var(--chat-transition);
        border: none;
      }

      .action-btn.primary {
        background: var(--chat-user-bubble);
        color: white;
      }

      .action-btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
      }

      .action-btn.secondary {
        background: var(--chat-primary-light);
        color: var(--chat-primary);
        border: 1px solid transparent;
      }

      .action-btn.secondary:hover {
        border-color: var(--chat-primary);
      }

      .action-btn.micro-session .duration-badge {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 0.6875rem;
      }

      /* Message footer */
      .message-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px solid var(--chat-border);
      }

      .timestamp,
      .user-timestamp {
        font-size: 0.6875rem;
        color: var(--chat-text-muted);
      }

      .user-timestamp {
        display: block;
        margin-top: 8px;
        text-align: right;
        color: rgba(255, 255, 255, 0.7);
      }

      .message-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .mini-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        border-radius: 8px;
        color: var(--chat-text-muted);
        cursor: pointer;
        transition: var(--chat-transition);
      }

      .mini-btn:hover {
        background: var(--chat-bg);
        color: var(--chat-text-secondary);
      }

      .mini-btn.feedback.active {
        color: var(--chat-primary);
      }

      .feedback-group {
        display: flex;
        background: var(--chat-bg);
        border-radius: 8px;
        padding: 2px;
      }

      /* Scroll to bottom */
      .scroll-to-bottom {
        position: absolute;
        bottom: 160px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--chat-surface);
        border: 1px solid var(--chat-border);
        border-radius: 50%;
        box-shadow: var(--chat-shadow-lg);
        cursor: pointer;
        transition: var(--chat-transition);
        z-index: 5;
      }

      .scroll-to-bottom:hover {
        background: var(--chat-primary);
        border-color: var(--chat-primary);
        color: white;
      }

      /* ========================================
       INPUT SECTION
       ======================================== */

      .input-section {
        padding: 16px 20px 24px;
        background: var(--chat-surface);
        border-top: 1px solid var(--chat-border);
      }

      .context-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--chat-border);
      }

      .context-chip {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--chat-bg);
        border: 1px dashed var(--chat-border);
        border-radius: 20px;
        font-size: 0.75rem;
        color: var(--chat-text-secondary);
        cursor: pointer;
        transition: var(--chat-transition);
      }

      .context-chip:hover {
        border-style: solid;
        border-color: var(--chat-primary);
        color: var(--chat-primary);
        background: var(--chat-primary-light);
      }

      .context-chip i {
        font-size: 0.75rem;
      }

      .input-row {
        display: flex;
        gap: 12px;
        align-items: flex-end;
      }

      .input-container {
        flex: 1;
        display: flex;
        align-items: flex-end;
        background: var(--chat-bg);
        border: 2px solid var(--chat-border);
        border-radius: 24px;
        padding: 4px 4px 4px 16px;
        transition: var(--chat-transition);
      }

      .input-container:focus-within {
        border-color: var(--chat-primary);
        box-shadow: 0 0 0 3px var(--chat-primary-light);
      }

      .message-textarea {
        flex: 1;
        border: none;
        background: transparent;
        font-family: inherit;
        font-size: 0.9375rem;
        color: var(--chat-text);
        resize: none;
        padding: 10px 0;
        min-height: 24px;
        max-height: 120px;
        line-height: 1.5;
      }

      .message-textarea::placeholder {
        color: var(--chat-text-muted);
      }

      .message-textarea:focus {
        outline: none;
      }

      .input-actions {
        display: flex;
        align-items: center;
      }

      .input-icon-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        border-radius: 50%;
        color: var(--chat-text-muted);
        cursor: pointer;
        transition: var(--chat-transition);
      }

      .input-icon-btn:hover:not(:disabled) {
        background: var(--chat-border);
        color: var(--chat-text-secondary);
      }

      .input-icon-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .send-btn {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--chat-border);
        border: none;
        border-radius: 50%;
        color: var(--chat-text-muted);
        cursor: not-allowed;
        transition: var(--chat-transition);
        flex-shrink: 0;
      }

      .send-btn.ready {
        background: var(--chat-user-bubble);
        color: white;
        cursor: pointer;
      }

      .send-btn.ready:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);
      }

      .send-btn i {
        font-size: 1.125rem;
      }

      .input-disclaimer {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        margin-top: 12px;
        font-size: 0.6875rem;
        color: var(--chat-text-muted);
      }

      .input-disclaimer i {
        font-size: 0.75rem;
        color: var(--chat-primary);
      }

      /* ========================================
       RESPONSIVE
       ======================================== */

      @media (max-width: 768px) {
        .chat-container {
          height: calc(100vh - 60px);
        }

        .chat-header {
          padding: 12px 16px;
        }

        .avatar-container {
          width: 40px;
          height: 40px;
        }

        .brand-info h1 {
          font-size: 1rem;
        }

        .messages-area {
          padding: 16px;
        }

        .message-wrapper {
          max-width: 92%;
        }

        .welcome-hero h2 {
          font-size: 1.5rem;
        }

        .suggestion-card {
          padding: 12px 14px;
        }

        .input-section {
          padding: 12px 16px 20px;
          padding-bottom: calc(20px + env(safe-area-inset-bottom, 0px));
        }

        .send-btn {
          width: 44px;
          height: 44px;
        }
      }

      /* ========================================
       SEARCH BAR
       ======================================== */

      .search-bar {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        background: var(--chat-surface);
        border-bottom: 1px solid var(--chat-border);
      }

      .search-bar i {
        color: var(--chat-text-muted);
      }

      .search-input {
        flex: 1;
        border: none;
        background: transparent;
        font-size: 0.9375rem;
        color: var(--chat-text);
        outline: none;
      }

      .search-input::placeholder {
        color: var(--chat-text-muted);
      }

      .search-count {
        font-size: 0.75rem;
        color: var(--chat-text-secondary);
        background: var(--chat-primary-light);
        padding: 4px 8px;
        border-radius: 12px;
      }

      /* ========================================
       AUTOCOMPLETE
       ======================================== */

      .autocomplete-dropdown {
        position: absolute;
        bottom: 100%;
        left: 0;
        right: 0;
        background: var(--chat-surface);
        border: 1px solid var(--chat-border);
        border-radius: var(--chat-radius-sm);
        box-shadow: var(--chat-shadow-lg);
        margin-bottom: 8px;
        max-height: 200px;
        overflow-y: auto;
        z-index: 100;
      }

      .autocomplete-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 12px 16px;
        border: none;
        background: transparent;
        cursor: pointer;
        text-align: left;
        transition: var(--chat-transition);
      }

      .autocomplete-item:hover {
        background: var(--chat-primary-light);
      }

      .autocomplete-text {
        font-size: 0.875rem;
        color: var(--chat-text);
      }

      .autocomplete-category {
        font-size: 0.6875rem;
        color: var(--chat-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      /* ========================================
       VOICE INPUT
       ======================================== */

      .voice-btn {
        position: relative;
      }

      .voice-btn.recording {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
      }

      .recording-pulse {
        position: absolute;
        inset: -4px;
        border: 2px solid #ef4444;
        border-radius: 50%;
        animation: recording-pulse 1.5s ease-out infinite;
      }

      @keyframes recording-pulse {
        0% {
          transform: scale(1);
          opacity: 0.8;
        }
        100% {
          transform: scale(1.4);
          opacity: 0;
        }
      }

      /* ========================================
       LOADING STAGES
       ======================================== */

      .loading-stage {
        margin-bottom: 8px;
      }

      .stage-text {
        font-size: 0.8125rem;
        color: var(--chat-text-secondary);
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .typing-dots {
        display: flex;
        gap: 4px;
      }

      /* ========================================
       BOOKMARK & SHARE
       ======================================== */

      .mini-btn.bookmark.active {
        color: #f59e0b;
      }

      .mini-btn.bookmark.active i {
        color: #f59e0b;
      }

      .icon-btn.active {
        background: var(--chat-primary-light);
        border-color: var(--chat-primary);
        color: var(--chat-primary);
      }

      .badge-dot {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 8px;
        height: 8px;
        background: var(--chat-primary);
        border-radius: 50%;
        border: 2px solid var(--chat-surface);
      }

      .icon-btn {
        position: relative;
      }

      /* ========================================
       SEPARATOR & NOTES
       ======================================== */

      .separator {
        margin: 0 6px;
        color: var(--chat-text-muted);
      }

      .voice-note {
        font-size: 0.625rem;
        opacity: 0.7;
      }

      /* ========================================
       HIGHLIGHT SEARCH RESULTS
       ======================================== */

      .highlight {
        background: rgba(251, 191, 36, 0.3);
        padding: 1px 2px;
        border-radius: 2px;
      }

      /* ========================================
       DARK MODE SUPPORT
       ======================================== */

      @media (prefers-color-scheme: dark) {
        :host {
          --chat-bg: #0f172a;
          --chat-surface: #1e293b;
          --chat-border: #334155;
          --chat-text: #f1f5f9;
          --chat-text-secondary: #94a3b8;
          --chat-text-muted: #64748b;
          --chat-assistant-bubble: #1e293b;
        }
      }
    `,
  ],
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
