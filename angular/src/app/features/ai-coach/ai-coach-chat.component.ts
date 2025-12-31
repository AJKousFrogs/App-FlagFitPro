/**
 * AI Coach Chat Component
 *
 * Full-featured chat interface for Merlin AI Coach:
 * - Real-time conversation with AI
 * - Message history with sessions
 * - Suggested actions from AI responses
 * - Safety-aware responses based on ACWR
 * - Citations and evidence-based answers
 */

import { CommonModule } from "@angular/common";
import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { TagModule } from "primeng/tag";
import { TooltipModule } from "primeng/tooltip";
import { ApiService } from "../../core/services/api.service";
import { AuthService } from "../../core/services/auth.service";
import { LoggerService } from "../../core/services/logger.service";
import { ToastService } from "../../core/services/toast.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";

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
}

interface Citation {
  id: string;
  title: string;
  source_type: string;
  evidence_grade: string;
}

interface SuggestedAction {
  type: string;
  label: string;
  reason: string;
  data?: Record<string, unknown>;
}

@Component({
  selector: "app-ai-coach-chat",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MainLayoutComponent,
  ],
  template: `
    <app-main-layout>
      <div class="ai-coach-container">
        <!-- Header -->
        <div class="chat-header">
          <div class="header-left">
            <div class="merlin-avatar">
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvE6wGt8diMxqRhHi__HyjI-mheOoOW8m8fg&s" 
                alt="Merlin AI Coach"
              />
              <span class="status-indicator"></span>
            </div>
            <div class="header-info">
              <h1>Merlin AI Coach</h1>
              <p class="status">Always ready to help you improve</p>
            </div>
          </div>
          <div class="header-actions">
            <p-button 
              icon="pi pi-refresh" 
              [text]="true" 
              [rounded]="true"
              pTooltip="New conversation"
              (click)="startNewConversation()"
            ></p-button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="messages-container" #messagesContainer>
          @if (messages().length === 0) {
            <div class="welcome-message">
              <div class="welcome-icon">🏈</div>
              <h2>Welcome to AI Coach Chat!</h2>
              <p>I'm Merlin, your personal flag football AI coach. Ask me anything about:</p>
              <div class="topic-chips">
                <button class="topic-chip" (click)="askQuestion('How can I improve my route running?')">
                  <i class="pi pi-bolt"></i> Route Running
                </button>
                <button class="topic-chip" (click)="askQuestion('What should I eat before a game?')">
                  <i class="pi pi-heart"></i> Nutrition
                </button>
                <button class="topic-chip" (click)="askQuestion('How do I prevent injuries during training?')">
                  <i class="pi pi-shield"></i> Injury Prevention
                </button>
                <button class="topic-chip" (click)="askQuestion('Give me a warm-up routine for game day')">
                  <i class="pi pi-sun"></i> Warm-up Routines
                </button>
                <button class="topic-chip" (click)="askQuestion('How can I increase my speed?')">
                  <i class="pi pi-forward"></i> Speed Training
                </button>
                <button class="topic-chip" (click)="askQuestion('What drills should a quarterback practice?')">
                  <i class="pi pi-star"></i> Position Skills
                </button>
              </div>
            </div>
          }

          @for (message of messages(); track message.id || $index) {
            <div class="message" [class.user]="message.role === 'user'" [class.assistant]="message.role === 'assistant'">
              @if (message.role === 'assistant') {
                <div class="avatar assistant-avatar">
                  <img 
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvE6wGt8diMxqRhHi__HyjI-mheOoOW8m8fg&s" 
                    alt="Merlin"
                  />
                </div>
              }
              <div class="message-content">
                @if (message.isLoading) {
                  <div class="loading-indicator">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                } @else {
                  <!-- ACWR Safety Warning -->
                  @if (message.acwrSafety?.blocked) {
                    <div class="acwr-warning">
                      <i class="pi pi-exclamation-triangle"></i>
                      <span>Training Load Alert: {{ message.acwrSafety?.reason }}</span>
                    </div>
                  }
                  
                  <div class="message-text" [innerHTML]="formatMessage(message.content)"></div>
                  
                  <!-- Risk Level Badge -->
                  @if (message.riskLevel && message.riskLevel !== 'low') {
                    <div class="risk-badge" [class]="'risk-' + message.riskLevel">
                      <i class="pi pi-info-circle"></i>
                      {{ getRiskLabel(message.riskLevel) }}
                    </div>
                  }
                  
                  <!-- Disclaimer -->
                  @if (message.disclaimer) {
                    <div class="disclaimer">
                      <i class="pi pi-shield"></i>
                      {{ message.disclaimer }}
                    </div>
                  }
                  
                  <!-- Citations -->
                  @if (message.citations && message.citations.length > 0) {
                    <div class="citations">
                      <span class="citations-label">Sources:</span>
                      @for (citation of message.citations; track citation.id) {
                        <span class="citation-chip" [pTooltip]="citation.source_type">
                          {{ citation.title }}
                          @if (citation.evidence_grade) {
                            <span class="evidence-grade">{{ citation.evidence_grade }}</span>
                          }
                        </span>
                      }
                    </div>
                  }
                  
                  <!-- Suggested Actions -->
                  @if (message.suggestedActions && message.suggestedActions.length > 0) {
                    <div class="suggested-actions">
                      @for (action of message.suggestedActions; track action.type) {
                        <button class="action-chip" (click)="executeAction(action)" [pTooltip]="action.reason">
                          {{ action.label }}
                        </button>
                      }
                    </div>
                  }
                }
                <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
              </div>
              @if (message.role === 'user') {
                <p-avatar 
                  [label]="userInitials()" 
                  shape="circle" 
                  class="user-avatar"
                ></p-avatar>
              }
            </div>
          }
        </div>

        <!-- Input Area -->
        <div class="input-area">
          <div class="input-wrapper">
            <input
              type="text"
              pInputText
              [(ngModel)]="currentMessage"
              placeholder="Ask Merlin anything about flag football..."
              (keyup.enter)="sendMessage()"
              [disabled]="isLoading()"
              class="message-input"
            />
            <p-button
              icon="pi pi-send"
              [rounded]="true"
              (click)="sendMessage()"
              [disabled]="!currentMessage.trim() || isLoading()"
              class="send-button"
            ></p-button>
          </div>
          <p class="input-hint">
            <i class="pi pi-shield"></i>
            Your conversations are private and secure
          </p>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .ai-coach-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 120px);
      max-width: 900px;
      margin: 0 auto;
      background: var(--surface-ground, #fafafa);
    }

    /* Header */
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: var(--surface-card, #ffffff);
      border-bottom: 1px solid var(--surface-border, #e5e7eb);
      border-radius: 16px 16px 0 0;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .merlin-avatar {
      position: relative;
      width: 48px;
      height: 48px;
    }

    .merlin-avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .status-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: var(--ds-primary-green, #089949);
      border: 2px solid var(--surface-card, #ffffff);
      border-radius: 50%;
    }

    .header-info h1 {
      font-family: 'Poppins', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text-primary, #1a1a1a);
      margin: 0;
    }

    .header-info .status {
      font-size: 0.8125rem;
      color: var(--ds-primary-green, #089949);
      margin: 0;
    }

    /* Messages Container */
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      scroll-behavior: smooth;
    }

    /* Welcome Message */
    .welcome-message {
      text-align: center;
      padding: 3rem 1.5rem;
      animation: fadeIn 0.5s ease;
    }

    .welcome-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .welcome-message h2 {
      font-family: 'Poppins', sans-serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text-primary, #1a1a1a);
      margin: 0 0 0.5rem;
    }

    .welcome-message p {
      color: var(--color-text-secondary, #6b7280);
      margin: 0 0 1.5rem;
    }

    .topic-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
      max-width: 600px;
      margin: 0 auto;
    }

    .topic-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--surface-card, #ffffff);
      border: 1px solid var(--surface-border, #e5e7eb);
      border-radius: 20px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text-primary, #1a1a1a);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .topic-chip:hover {
      background: var(--ds-primary-green, #089949);
      color: white;
      border-color: var(--ds-primary-green, #089949);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(8, 153, 73, 0.2);
    }

    .topic-chip i {
      font-size: 1rem;
    }

    /* Message Styles */
    .message {
      display: flex;
      gap: 0.75rem;
      max-width: 85%;
      animation: slideIn 0.3s ease;
    }

    .message.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message.assistant {
      align-self: flex-start;
    }

    .assistant-avatar {
      width: 36px;
      height: 36px;
      flex-shrink: 0;
    }

    .assistant-avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-avatar {
      flex-shrink: 0;
    }

    .message-content {
      padding: 1rem 1.25rem;
      border-radius: 16px;
      position: relative;
    }

    .message.user .message-content {
      background: linear-gradient(135deg, #089949 0%, #0ab85a 100%);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message.assistant .message-content {
      background: var(--surface-card, #ffffff);
      color: var(--color-text-primary, #1a1a1a);
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .message-text {
      font-size: 0.9375rem;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .message-text :global(h2) {
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0.5rem 0;
    }

    .message-text :global(h3) {
      font-size: 1rem;
      font-weight: 600;
      margin: 0.5rem 0;
    }

    .message-text :global(ul),
    .message-text :global(ol) {
      margin: 0.5rem 0;
      padding-left: 1.5rem;
    }

    .message-text :global(li) {
      margin: 0.25rem 0;
    }

    .message-text :global(strong) {
      font-weight: 600;
    }

    .message-text :global(code) {
      background: rgba(0, 0, 0, 0.1);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
    }

    /* Loading Indicator */
    .loading-indicator {
      display: flex;
      gap: 0.25rem;
      padding: 0.5rem 0;
    }

    .loading-indicator .dot {
      width: 8px;
      height: 8px;
      background: var(--color-text-tertiary, #9ca3af);
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out;
    }

    .loading-indicator .dot:nth-child(1) { animation-delay: -0.32s; }
    .loading-indicator .dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* ACWR Warning */
    .acwr-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 8px;
      margin-bottom: 0.75rem;
      font-size: 0.8125rem;
      color: #b45309;
    }

    .acwr-warning i {
      color: #f59e0b;
    }

    /* Risk Badge */
    .risk-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      margin-top: 0.75rem;
    }

    .risk-badge.risk-medium {
      background: rgba(245, 158, 11, 0.1);
      color: #b45309;
    }

    .risk-badge.risk-high {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }

    /* Disclaimer */
    .disclaimer {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(8, 153, 73, 0.05);
      border-radius: 8px;
      margin-top: 0.75rem;
      font-size: 0.75rem;
      color: var(--color-text-secondary, #6b7280);
    }

    .disclaimer i {
      color: var(--ds-primary-green, #089949);
      margin-top: 0.125rem;
    }

    /* Citations */
    .citations {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--surface-border, #e5e7eb);
    }

    .citations-label {
      font-size: 0.75rem;
      color: var(--color-text-tertiary, #9ca3af);
      font-weight: 500;
    }

    .citation-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: var(--surface-ground, #f9fafb);
      border-radius: 6px;
      font-size: 0.6875rem;
      color: var(--color-text-secondary, #6b7280);
    }

    .evidence-grade {
      background: var(--ds-primary-green, #089949);
      color: white;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-weight: 600;
    }

    /* Suggested Actions */
    .suggested-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .action-chip {
      padding: 0.5rem 1rem;
      background: var(--ds-primary-green, #089949);
      color: white;
      border: none;
      border-radius: 16px;
      font-family: 'Poppins', sans-serif;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-chip:hover {
      background: #077a3a;
      transform: translateY(-1px);
    }

    /* Timestamp */
    .timestamp {
      display: block;
      font-size: 0.6875rem;
      color: var(--color-text-tertiary, #9ca3af);
      margin-top: 0.5rem;
    }

    .message.user .timestamp {
      color: rgba(255, 255, 255, 0.7);
      text-align: right;
    }

    /* Input Area */
    .input-area {
      padding: 1rem 1.5rem 1.5rem;
      background: var(--surface-card, #ffffff);
      border-top: 1px solid var(--surface-border, #e5e7eb);
      border-radius: 0 0 16px 16px;
    }

    .input-wrapper {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .message-input {
      flex: 1;
      padding: 0.875rem 1.25rem;
      border-radius: 24px;
      border: 2px solid var(--surface-border, #e5e7eb);
      font-size: 0.9375rem;
      transition: all 0.2s ease;
    }

    .message-input:focus {
      border-color: var(--ds-primary-green, #089949);
      box-shadow: 0 0 0 3px rgba(8, 153, 73, 0.1);
    }

    .send-button {
      flex-shrink: 0;
    }

    :host ::ng-deep .send-button .p-button {
      background: linear-gradient(135deg, #089949 0%, #0ab85a 100%);
      border: none;
      width: 48px;
      height: 48px;
    }

    :host ::ng-deep .send-button .p-button:hover {
      background: linear-gradient(135deg, #077a3a 0%, #089949 100%);
    }

    .input-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--color-text-tertiary, #9ca3af);
      margin: 0.75rem 0 0;
    }

    .input-hint i {
      color: var(--ds-primary-green, #089949);
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .ai-coach-container {
        height: calc(100vh - 140px);
        border-radius: 0;
      }

      .chat-header {
        border-radius: 0;
        padding: 1rem;
      }

      .messages-container {
        padding: 1rem;
      }

      .message {
        max-width: 92%;
      }

      .welcome-message {
        padding: 2rem 1rem;
      }

      .topic-chips {
        gap: 0.5rem;
      }

      .topic-chip {
        padding: 0.625rem 0.875rem;
        font-size: 0.8125rem;
      }

      .input-area {
        border-radius: 0;
        padding: 1rem;
        padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
      }
    }
  `],
})
export class AiCoachChatComponent implements OnInit, AfterViewChecked {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private logger = inject(LoggerService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  @ViewChild("messagesContainer") messagesContainer!: ElementRef;

  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);
  currentMessage = "";
  sessionId: string | null = null;
  private shouldScrollToBottom = false;

  ngOnInit(): void {
    // Session will be created on first message
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  userInitials(): string {
    const user = this.authService.getUser();
    if (!user?.name) return "U";
    const parts = user.name.split(" ");
    return parts.map((p) => p[0]).join("").substring(0, 2).toUpperCase();
  }

  askQuestion(question: string): void {
    this.currentMessage = question;
    this.sendMessage();
  }

  sendMessage(): void {
    const message = this.currentMessage.trim();
    if (!message || this.isLoading()) return;

    // Add user message
    const userMessage: ChatMessage = {
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    this.messages.update((msgs) => [...msgs, userMessage]);
    this.currentMessage = "";
    this.shouldScrollToBottom = true;

    // Add loading message
    const loadingMessage: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isLoading: true,
    };
    this.messages.update((msgs) => [...msgs, loadingMessage]);
    this.isLoading.set(true);

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
      }>("/api/ai-chat", {
        message,
        session_id: this.sessionId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Store session ID for future messages
            this.sessionId = response.data.chat_session_id;

            // Replace loading message with actual response
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
    // Remove loading message
    this.messages.update((msgs) => msgs.filter((m) => !m.isLoading));

    // Add error message
    const errorMessage: ChatMessage = {
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

  executeAction(action: SuggestedAction): void {
    // Handle different action types
    switch (action.type) {
      case "ask_coach":
        this.toast.info(
          "Please consult with your coach or healthcare provider for personalized guidance.",
          "Professional Advice"
        );
        break;
      case "add_exercise":
        this.askQuestion(
          `Show me recovery exercises for ${action.data?.["injuryType"] || "general recovery"}`
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
      default:
        this.logger.info("Action executed:", action);
    }
  }

  formatMessage(content: string): string {
    if (!content) return "";

    // Convert markdown-like formatting to HTML
    let html = content
      // Headers
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Lists
      .replace(/^- (.*$)/gm, "<li>$1</li>")
      // Code
      .replace(/`(.*?)`/g, "<code>$1</code>")
      // Line breaks
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    // Wrap lists in <ul>
    html = html.replace(/(<li>.*<\/li>)+/g, "<ul>$&</ul>");

    return `<p>${html}</p>`;
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
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

  private scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
}
