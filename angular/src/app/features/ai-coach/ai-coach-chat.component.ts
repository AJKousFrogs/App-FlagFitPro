/** Merlin AI chat UI. */

import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  viewChild,
  computed,
  inject,
  signal,
} from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { TIMEOUTS, UI_LIMITS } from "../../core/constants/app.constants";
import {
  LoggerService,
  toLogContext,
} from "../../core/services/logger.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { ToastService } from "../../core/services/toast.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { ChatSessionService, type RecentChatSession } from "./chat-session.service";
import { MerlinKnowledgeService, type Citation } from "./merlin-knowledge.service";
import {
  ChatMessagesService,
  type ChatMessage,
  type MicroSessionData,
  type SuggestedAction,
} from "./chat-messages.service";
import { ChatSuggestionsService } from "./chat-suggestions.service";

import { ButtonComponent } from "../../shared/components/button/button.component";
import { CloseButtonComponent } from "../../shared/components/close-button/close-button.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { MicroSessionComponent } from "../../shared/components/micro-session/micro-session.component";
import { SearchInputComponent } from "../../shared/components/search-input/search-input.component";
import { formatTimeOfDay } from "../../shared/utils/format.utils";



interface MerlinReturnContext {
  sourceKey: "wellness" | "training" | "today" | "nutrition" | "coach-inbox";
  sourceLabel: string;
  message: string;
  resumeLabel: string;
}

interface AutocompleteSuggestion {
  text: string;
  category: string;
}





@Component({
  selector: "app-ai-coach-chat",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    AppDialogComponent,
    MainLayoutComponent,
    ButtonComponent,
    IconButtonComponent,
    CloseButtonComponent,
    MicroSessionComponent,
  ],
  templateUrl: "./ai-coach-chat.component.html",

  styleUrl: "./ai-coach-chat.component.scss",
  host: {
    "(window:keydown)": "handleKeyboardShortcut($event)",
  },
})
export class AiCoachChatComponent implements OnInit, AfterViewChecked {
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly sanitizer = inject(DomSanitizer);

  // Extracted services
  readonly knowledge = inject(MerlinKnowledgeService);
  readonly session = inject(ChatSessionService);
  readonly msgs = inject(ChatMessagesService);
  readonly suggestions = inject(ChatSuggestionsService);

  // Template-facing delegates to msgs service (keeps template bindings stable)
  readonly isLoading = this.msgs.isLoading;
  readonly sessionSummaryText = this.msgs.sessionSummaryText;
  // Template-facing delegates to suggestions service
  readonly acwrDisplay = this.suggestions.acwrDisplay;
  readonly readinessPresentation = this.suggestions.readinessPresentation;
  readonly aiModeStatus = this.suggestions.aiModeStatus;
  readonly todayReadinessScore = this.suggestions.todayReadinessScore;
  readonly isCoach = this.suggestions.isCoach;
  readonly userName = this.suggestions.userName;
  readonly sessionContextItems = this.suggestions.sessionContextItems;
  readonly quickSuggestions = this.suggestions.quickSuggestions;
  readonly contextChips = this.suggestions.contextChips;

  messagesContainer = viewChild.required<ElementRef>("messagesContainer");
  messageInput = viewChild.required<ElementRef>("messageInput");
  searchInputElement = viewChild<SearchInputComponent>("searchInput");

  currentMessage = "";
  returnContext = signal<MerlinReturnContext | null>(null);
  private shouldScrollToBottom = false;
  private lastMessageCount = 0;
  private restoredSessionId: string | null = null;



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
  searchQuery = signal("");
  searchControl = new FormControl("", { nonNullable: true });
  showBookmarks = signal(false);
  showRecentSessionsPanel = signal(false);

  // Voice input
  isRecording = signal(false);
  speechSupported = signal(false);
  private recognition: SpeechRecognition | null = null;

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
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.msgs.messages();
    return this.msgs.messages().filter((m) =>
      m.content.toLowerCase().includes(query),
    );
  });

  async ngOnInit(): Promise<void> {
    await this.teamMembershipService.loadMembership();
  }

  // Computed: bookmarked messages count
  bookmarkedCount = computed(() => {
    return this.msgs.messages().filter((m) => m.isBookmarked).length;
  });

  // Computed: visible messages (respects search and bookmarks filters)
  visibleMessages = computed(() => {
    let msgs = this.msgs.messages();

    if (this.showBookmarks()) {
      msgs = msgs.filter((m) => m.isBookmarked);
    }

    if (this.searchMode() && this.searchQuery().trim()) {
      const query = this.searchQuery().toLowerCase();
      msgs = msgs.filter((m) => m.content.toLowerCase().includes(query));
    }

    return msgs;
  });

  getIntentSummaryLabel(intent: string): string {
    switch (intent) {
      case "plan_request":
        return "last plan";
      case "recovery_readiness":
        return "recovery context";
      case "technique_correction":
        return "technique topic";
      case "pain_injury":
        return "injury context";
      case "team_report":
        return "team report";
      case "practice_plan":
        return "practice plan";
      default:
        return "last answer topic";
    }
  }

  getRecentSessionTopicLabel(session: RecentChatSession): string {
    if (!session.previewIntent) {
      return session.previewRole === "assistant"
        ? "General Merlin answer"
        : "Open conversation";
    }

    switch (session.previewIntent) {
      case "plan_request":
        return "Practice plan";
      case "recovery_readiness":
        return "Recovery";
      case "technique_correction":
        return "Technique";
      case "pain_injury":
        return "Injury support";
      case "team_report":
        return "Team report";
      case "practice_plan":
        return "Practice planning";
      case "nutrition_guidance":
        return "Fueling";
      default:
        return this.getIntentSummaryLabel(session.previewIntent);
    }
  }

  isActiveRecentSession(session: RecentChatSession): boolean {
    return this.msgs.sessionId === session.id;
  }

  constructor() {

    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.searchQuery.set(value ?? "");
        this.onSearchInput();
      });

    // Initialize on construction (Angular 21 pattern)
    this.loadAIModeStatus();
    this.loadTrainingOverviewContext();
    void this.knowledge.loadMerlinGrounding();
    void this.session.loadRecentSessions();
    this.initializeSpeechRecognition();
    this.handleRouteParams();
  }

  private loadTrainingOverviewContext(): void {
    this.trainingService
      .getTodayOverview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) =>
          this.logger.warn(
            "[AI Chat] Failed to load protocol overview, using live metric fallback",
            error,
          ),
      });
  }

  private handleRouteParams(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params: Record<string, string | undefined>) => {
        const sessionParam = params["session"];
        const returnContext = this.buildReturnContext(params["from"]);
        if (
          sessionParam &&
          sessionParam !== this.restoredSessionId &&
          sessionParam !== this.msgs.sessionId
        ) {
          this.restoredSessionId = sessionParam;
          void this.restoreSession(sessionParam);
        }

        if (params["draft"]) {
          this.currentMessage = params["draft"];
          this.returnContext.set(returnContext);
          setTimeout(() => this.adjustComposerHeight(), 0);
          this.session.consumeRouteParams(["draft", "from"]);
          return;
        }

        if (params["query"]) {
          this.currentMessage = params["query"];
          this.returnContext.set(returnContext);
          setTimeout(() => this.adjustComposerHeight(), 0);
          this.session.consumeRouteParams(["query", "from"]);
          // Small delay to ensure initialization is complete
          setTimeout(() => this.sendMessage(), TIMEOUTS.UI_MICRO_DELAY);
          return;
        }

        if (returnContext) {
          this.returnContext.set(returnContext);
          this.session.consumeRouteParams(["from"]);
        }
      });
  }

  private buildReturnContext(source: string | undefined): MerlinReturnContext | null {
    switch (source) {
      case "wellness":
        return {
          sourceKey: "wellness",
          sourceLabel: "Wellness",
          message:
            "You returned from Wellness. Your draft is ready so Merlin can reassess recovery and readiness.",
          resumeLabel: "Open Wellness",
        };
      case "training":
        return {
          sourceKey: "training",
          sourceLabel: "Training",
          message:
            "You returned from Training. Your draft is ready so Merlin can help shape the next session or schedule adjustment.",
          resumeLabel: "Open Training",
        };
      case "today":
        return {
          sourceKey: "today",
          sourceLabel: "Today",
          message:
            "You returned from Today. Your draft is ready so Merlin can react to the current plan and readiness state.",
          resumeLabel: "Open Today",
        };
      case "nutrition":
        return {
          sourceKey: "nutrition",
          sourceLabel: "Tournament Nutrition",
          message:
            "You returned from Tournament Nutrition. Your draft is ready so Merlin can refine fueling and hydration guidance.",
          resumeLabel: "Open Tournament Nutrition",
        };
      case "coach-inbox":
        return {
          sourceKey: "coach-inbox",
          sourceLabel: "Coach Inbox",
          message:
            "You returned from Coach Inbox. Your draft is ready so Merlin can help with the next coaching decision.",
          resumeLabel: "Open Coach Inbox",
        };
      default:
        return null;
    }
  }

  getReturnContextCommands(
    context: MerlinReturnContext,
  ): string[] {
    switch (context.sourceKey) {
      case "wellness":
        return ["/wellness"];
      case "training":
        return ["/training"];
      case "today":
        return ["/todays-practice"];
      case "nutrition":
        return ["/game/nutrition"];
      case "coach-inbox":
        return ["/coach/inbox"];
    }
  }

  getReturnContextQueryParams(
    context: MerlinReturnContext,
  ): Record<string, string | undefined> {
    switch (context.sourceKey) {
      case "wellness":
        return this.buildResumeQueryParams({
          source: "merlin",
          focus: "checkin",
          intent: "recovery",
          session: this.msgs.sessionId || undefined,
        });
      case "training":
        return this.buildResumeQueryParams({
          source: "merlin",
          focus: "create-session",
          view: "week",
          date: this.getTodayDateKey(),
          session: this.msgs.sessionId || undefined,
        });
      case "today":
        return this.buildResumeQueryParams({
          source: "merlin",
          focus: "protocol",
          session: this.msgs.sessionId || undefined,
        });
      case "nutrition":
        return this.buildResumeQueryParams({
          source: "merlin",
          focus: "hydration",
          session: this.msgs.sessionId || undefined,
        });
      case "coach-inbox":
        return this.buildResumeQueryParams({
          source: "merlin",
          focus: "review-needed",
          session: this.msgs.sessionId || undefined,
        });
    }
  }

  private buildResumeQueryParams(
    params: Record<string, string | undefined>,
  ): Record<string, string | undefined> {
    return Object.fromEntries(
      Object.entries(params).filter(([, value]) => !!value),
    );
  }

  /**
   * Initialize Web Speech API for voice input
   */
  private initializeSpeechRecognition(): void {
    // Check for browser support - use any type for cross-browser compatibility
    const windowWithSpeech = window as Window &
      typeof globalThis & {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
      };
    const SpeechRecognitionAPI =
      windowWithSpeech.SpeechRecognition ||
      windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      this.speechSupported.set(false);
      return;
    }

    this.speechSupported.set(true);
    const recognition = new SpeechRecognitionAPI();
    this.recognition = recognition as SpeechRecognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: { results: { length: number; [i: number]: { [j: number]: { transcript: string }; isFinal: boolean } } }) => {
      const results = event.results;
      let transcript = "";

      for (const result of Array.from({ length: results.length }, (_, i) => results[i])) {
        transcript += result[0].transcript;
      }

      this.currentMessage = transcript;

      // If final result, stop recording
      if (results[results.length - 1].isFinal) {
        this.stopRecording();
        // Haptic feedback on mobile
        this.triggerHaptic("success");
      }
    };

    recognition.onerror = (event: { error: string }) => {
      this.logger.error("Speech recognition error:", event.error);
      this.stopRecording();
      if (event.error !== "aborted") {
        this.toast.error("Could not recognize speech. Please try again.");
      }
    };

    recognition.onend = () => {
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

  handleKeyboardShortcut(event: KeyboardEvent): void {
    // Cmd/Ctrl + Enter to send
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      this.sendMessage();
    }
  }


  async loadAIModeStatus(): Promise<void> {
    await this.suggestions.loadAIModeStatus();
  }

  userInitials(): string {
    const name = this.suggestions.userName();
    if (!name) return "U";
    return name.substring(0, 2).toUpperCase();
  }

  isRecentMessage(index: number): boolean {
    return index >= this.msgs.messages().length - 2;
  }

  askQuestion(question: string): void {
    this.currentMessage = question;
    this.adjustComposerHeight();
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
    if (!message || this.msgs.isLoading()) return;
    this.returnContext.set(null);
    this.closeRecentSessionsPanel();

    // Hand off to message service - it adds messages, fires API, updates isLoading
    this.currentMessage = "";
    this.shouldScrollToBottom = true;
    this.triggerHaptic("light");
    this.autocompleteSuggestions.set([]);
    this.resetComposerHeight();
    this.msgs.sendMessageApi(message, this.isCoach());
  }


  startNewConversation(): void {
    this.msgs.clearLoadingStageTimers();
    this.msgs.clearMessages();
    this.msgs.sessionId = null;
    this.returnContext.set(null);
    this.restoredSessionId = null;
    this.currentMessage = "";
    this.showRecentSessionsPanel.set(false);
    this.resetComposerHeight();
    this.session.syncSessionQueryParam(null);
  }

  async reopenRecentSession(sessionId: string): Promise<void> {
    this.returnContext.set(null);
    this.msgs.clearMessages();
    this.currentMessage = "";
    this.restoredSessionId = sessionId;
    this.showRecentSessionsPanel.set(false);
    this.resetComposerHeight();
    this.session.syncSessionQueryParam(sessionId);
    await this.restoreSession(sessionId);
  }

  dismissReturnContext(): void {
    this.returnContext.set(null);
  }

  editDraft(): void {
    this.dismissReturnContext();
    this.shouldScrollToBottom = true;

    setTimeout(() => {
      this.adjustComposerHeight();
      this.focusComposerAtEnd();
    }, 0);
  }

  toggleRecentSessionsPanel(): void {
    this.showRecentSessionsPanel.update((value) => !value);
  }

  closeRecentSessionsPanel(): void {
    this.showRecentSessionsPanel.set(false);
  }

  private async restoreSession(sessionId: string): Promise<void> {
    const ok = await this.msgs.restoreSessionMessages(sessionId);
    if (ok) this.shouldScrollToBottom = true;
  }


  async giveFeedback(message: ChatMessage, helpful: boolean): Promise<void> {
    await this.msgs.giveFeedback(message, helpful);
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

  toggleCitations(message: ChatMessage): void {
    this.msgs.toggleCitations(message);
  }

  executeAction(action: SuggestedAction): void {
    switch (action.type) {
      case "ask_coach":
        void this.router.navigate(["/coach/inbox"], {
          queryParams: {
            source: "merlin",
            focus: "review-needed",
            session: this.msgs.sessionId || undefined,
          },
        });
        break;
      case "add_exercise":
        this.askQuestion(
          `Show me recovery exercises for ${action.data?.["injuryType"] || "general recovery"}`,
        );
        break;
      case "create_session":
        void this.router.navigate(["/training"], {
          queryParams: {
            focus: "create-session",
            view: "week",
            date: this.getTodayDateKey(),
            source: "merlin",
            session: this.msgs.sessionId || undefined,
          },
        });
        break;
      case "read_article":
        this.askQuestion("Show me the best evidence-backed article summary for this topic.");
        break;
      case "reduce_load":
        void this.router.navigate(["/wellness"], {
          queryParams: {
            focus: "checkin",
            source: "merlin",
            intent: "recovery",
            session: this.msgs.sessionId || undefined,
          },
        });
        break;
      case "log_recovery":
        void this.router.navigate(["/wellness"], {
          queryParams: {
            focus: "checkin",
            source: "merlin",
            intent: "recovery",
            session: this.msgs.sessionId || undefined,
          },
        });
        break;
      case "check_tomorrow":
        void this.router.navigate(["/todays-practice"], {
          queryParams: {
            source: "merlin",
            focus: "protocol",
            session: this.msgs.sessionId || undefined,
          },
        });
        break;
      case "review_nutrition_targets":
        void this.router.navigate(["/wellness"], {
          queryParams: {
            focus: "checkin",
            source: "merlin",
            intent: "nutrition-targets",
            session: this.msgs.sessionId || undefined,
          },
        });
        break;
      case "review_hydration_plan":
        void this.router.navigate(["/game/nutrition"], {
          queryParams: {
            source: "merlin",
            focus: "hydration",
            session: this.msgs.sessionId || undefined,
          },
        });
        break;
      case "build_fueling_day":
        void this.router.navigate(["/game/nutrition"], {
          queryParams: {
            source: "merlin",
            focus: "schedule",
            session: this.msgs.sessionId || undefined,
          },
        });
        break;
      case "micro_session":
        if (action.microSession) {
          this.startMicroSession(action);
        }
        break;
      default:
        this.logger.info("Action executed:", toLogContext(action));
    }
  }

  getActionButtonIcon(action: SuggestedAction): string {
    switch (action.type) {
      case "micro_session":
        return "pi pi-bolt";
      case "reduce_load":
      case "log_recovery":
        return "pi pi-heart";
      case "check_tomorrow":
        return "pi pi-calendar";
      case "review_nutrition_targets":
        return "pi pi-apple";
      case "review_hydration_plan":
        return "pi pi-heart-fill";
      case "build_fueling_day":
        return "pi pi-sparkles";
      case "create_session":
        return "pi pi-calendar-plus";
      case "ask_coach":
        return "pi pi-send";
      case "read_article":
        return "pi pi-book";
      default:
        return "pi pi-arrow-right";
    }
  }

  getActionButtonTone(action: SuggestedAction): "primary" | "secondary" {
    return action.type === "micro_session" ||
      action.type === "create_session" ||
      action.type === "build_fueling_day"
      ? "primary"
      : "secondary";
  }

  getActionDestinationLabel(action: SuggestedAction): string {
    switch (action.type) {
      case "ask_coach":
        return "Opens Coach Inbox";
      case "create_session":
        return "Opens Training Schedule";
      case "reduce_load":
      case "log_recovery":
        return "Opens Wellness Check-in";
      case "review_nutrition_targets":
        return "Opens Wellness Check-in";
      case "review_hydration_plan":
        return "Opens Tournament Nutrition";
      case "build_fueling_day":
        return "Opens Tournament Nutrition Setup";
      case "read_article":
      case "add_exercise":
        return "Continues in Merlin";
      case "check_tomorrow":
        return "Opens Today";
      case "micro_session":
        return "Starts in Merlin";
      default:
        return "Next workflow";
    }
  }

  private getTodayDateKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  getLoadingStageTitle(): string {
    return this.msgs.getLoadingStageTitle();
  }

  getLoadingStageDescription(): string {
    return this.msgs.getLoadingStageDescription();
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
        `**Session Complete!**\n\nYou completed the ${this.activeMicroSession()?.title || "session"} in ${result.duration_minutes} minutes.` +
        (result.follow_up_response
          ? `\n\nYour feedback: ${result.follow_up_response.rating}/10${result.follow_up_response.notes ? ` - "${result.follow_up_response.notes}"` : ""}`
          : ""),
      timestamp: new Date(),
    };
    this.msgs.addMessage(followUpMessage);
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

  formatMessage(content: string): SafeHtml {
    if (!content) return this.sanitizer.bypassSecurityTrustHtml("");

    // Step 1: Escape all HTML entities in the raw content BEFORE any substitution.
    // This prevents XSS from injected tags in AI responses or user-forwarded content.
    const escaped = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");

    // Step 2: Apply markdown-to-HTML on the already-escaped string.
    // All substitution tags below are our own controlled markup — safe to inject.
    let html = escaped
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/^- (.*$)/gm, "<li>$1</li>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    html = html.replace(/(<li>.*<\/li>)+/g, "<ul>$&</ul>");

    // Step 3: Mark the result as trusted — we built the HTML ourselves from escaped input.
    return this.sanitizer.bypassSecurityTrustHtml(`<p>${html}</p>`);
  }

  formatTime = formatTimeOfDay;

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
    const container = this.messagesContainer();
    if (container?.nativeElement) {
      const element = container.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  private checkScrollPosition(): void {
    const container = this.messagesContainer();
    if (container?.nativeElement) {
      const element = container.nativeElement;
      const isAtBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight < 100;
      this.showScrollButton.set(!isAtBottom && this.msgs.messages().length > 2);
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
      .slice(0, UI_LIMITS.UPCOMING_SESSIONS_COUNT);

    this.autocompleteSuggestions.set(matches);
  }

  selectAutocomplete(suggestion: AutocompleteSuggestion): void {
    this.currentMessage = suggestion.text;
    this.autocompleteSuggestions.set([]);
    this.triggerHaptic("selection");
    this.adjustComposerHeight();
    this.focusComposerAtEnd();
  }

  private focusComposerAtEnd(): void {
    const input = this.messageInput()?.nativeElement as
      | HTMLTextAreaElement
      | HTMLInputElement
      | undefined;
    if (!input) {
      return;
    }

    input.focus();

    if ("setSelectionRange" in input) {
      const caretPosition = input.value?.length ?? 0;
      input.setSelectionRange(caretPosition, caretPosition);
    }
  }

  private adjustComposerHeight(
    inputElement?: HTMLTextAreaElement | null,
  ): void {
    const input =
      inputElement ?? (this.messageInput()?.nativeElement as HTMLTextAreaElement | undefined);
    if (!input) {
      return;
    }

    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }

  private resetComposerHeight(): void {
    const input = this.messageInput()?.nativeElement as
      | HTMLTextAreaElement
      | undefined;
    if (!input) {
      return;
    }

    input.style.height = "auto";
  }

  // ========================================
  // SEARCH & BOOKMARKS
  // ========================================

  toggleSearchMode(): void {
    this.searchMode.update((v) => !v);
    this.searchControl.setValue("");
    this.searchQuery.set("");

    if (this.searchMode()) {
      // Focus search input after render using viewChild reference
      setTimeout(() => {
        this.searchInputElement()?.focus();
      }, 100);
    }
  }

  onSearchInput(): void {
    // Search is computed, nothing needed here
    // Could add debounce for performance with large histories
  }

  onCurrentMessageInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement | null;
    this.currentMessage = target?.value ?? "";
    if (this.returnContext()) {
      this.returnContext.set(null);
    }
    this.adjustComposerHeight(target);
    this.onInputChange();
  }

  toggleBookmarksView(): void {
    this.showBookmarks.update((v) => !v);
    this.triggerHaptic("selection");
  }

  toggleBookmark(message: ChatMessage): void {
    this.msgs.toggleBookmark(message);
    this.triggerHaptic("selection");
  }

  // ========================================
  // SHARE
  // ========================================

  async shareMessage(message: ChatMessage): Promise<void> {
    const shareText = `From Merlin AI:\n\n${message.content}`;

    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Merlin Merlin AI",
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


}
