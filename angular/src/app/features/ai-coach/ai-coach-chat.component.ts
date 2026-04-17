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
  effect,
  inject,
  signal,
} from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { firstValueFrom } from "rxjs";
import { TIMEOUTS, UI_LIMITS } from "../../core/constants/app.constants";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import {
  LoggerService,
  toLogContext,
} from "../../core/services/logger.service";
import { MissingDataDetectionService } from "../../core/services/missing-data-detection.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { ToastService } from "../../core/services/toast.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import { extractApiPayload } from "../../core/utils/api-response-mapper";
import {
  getProtocolAcwrDisplay,
  getProtocolReadinessPresentation,
} from "../../core/utils/protocol-metrics-presentation";
import {
  AIModeStatus,
} from "../../shared/components/ai-mode-explanation/ai-mode-explanation.component";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CloseButtonComponent } from "../../shared/components/close-button/close-button.component";
import { AppDialogComponent } from "../../shared/components/dialog/dialog.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { MicroSessionComponent } from "../../shared/components/micro-session/micro-session.component";
import { SearchInputComponent } from "../../shared/components/search-input/search-input.component";
import { formatTimeOfDay } from "../../shared/utils/format.utils";

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

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  evidenceGrade: string;
  sourceUrl?: string;
}

interface NutritionPlanSummary {
  exists: boolean;
  targetCalories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
}

interface MerlinGroundingCard {
  id: string;
  title: string;
  summary: string;
  meta: string;
  icon: string;
  query: string;
}

interface CitationGroup {
  key: string;
  label: string;
  count: number;
}

interface CitationEvidenceSummary {
  label: string;
  count: number;
}

interface SessionContextItem {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone?: "default" | "warning";
}

interface SessionSummaryItem {
  id: string;
  label: string;
}

interface PersistedChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  riskLevel?: string | null;
  intent?: string | null;
  citations?: Citation[] | null;
  feedbackHelpful?: boolean | null;
  coachReviewedAt?: string | null;
  coachReviewedBy?: string | null;
  metadata?: {
    suggestedActions?: SuggestedAction[];
    evidenceGradeExplanation?: string | null;
    bookmarked?: boolean;
  } | null;
}

interface RecentChatSession {
  id: string;
  startedAt: string;
  messageCount: number;
  preview: string;
  previewRole?: "user" | "assistant" | null;
  previewIntent?: string | null;
  previewCreatedAt?: string | null;
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
  private readonly apiService = inject(ApiService);
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly missingDataService = inject(MissingDataDetectionService);
  private readonly teamMembershipService = inject(TeamMembershipService);
  private readonly sanitizer = inject(DomSanitizer);

  // Use the canonical team membership capability model instead of coarse auth roles.
  readonly isCoach = computed(
    () =>
      this.teamMembershipService.isCoach() ||
      this.teamMembershipService.isAdmin(),
  );

  messagesContainer = viewChild.required<ElementRef>("messagesContainer");
  messageInput = viewChild.required<ElementRef>("messageInput");
  searchInputElement = viewChild<SearchInputComponent>("searchInput");

  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);
  currentMessage = "";
  sessionId: string | null = null;
  returnContext = signal<MerlinReturnContext | null>(null);
  private shouldScrollToBottom = false;
  private lastMessageCount = 0;
  private restoredSessionId: string | null = null;

  // Daily readiness
  todayReadinessScore = signal<number | null>(null);
  readonly todayProtocol = this.trainingService.todayProtocol;
  readonly acwrDisplay = computed(() =>
    getProtocolAcwrDisplay(
      this.todayProtocol(),
      this.trainingService.acwrRatio(),
      this.trainingService.acwrData().dataQuality.daysWithData || null,
    ),
  );
  readonly readinessPresentation = computed(() =>
    getProtocolReadinessPresentation(
      this.todayProtocol(),
      this.trainingService.readinessScore(),
    ),
  );

  // Phase 2.3: AI Mode Status
  aiModeStatus = signal<AIModeStatus | null>(null);

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
  loadingStage = signal<"thinking" | "searching" | "generating">("thinking");
  private loadingStageRunId = 0;
  private loadingStageTimeouts: ReturnType<typeof setTimeout>[] = [];
  groundingLoading = signal(false);
  knowledgeError = signal<string | null>(null);
  trainingKnowledge = signal<KnowledgeEntry[]>([]);
  nutritionKnowledge = signal<KnowledgeEntry[]>([]);
  queryKnowledge = signal<KnowledgeEntry[]>([]);
  nutritionPlan = signal<NutritionPlanSummary | null>(null);
  recentSessions = signal<RecentChatSession[]>([]);
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
    if (!query) return this.messages();
    return this.messages().filter((m) =>
      m.content.toLowerCase().includes(query),
    );
  });

  async ngOnInit(): Promise<void> {
    await this.teamMembershipService.loadMembership();
  }

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

    if (this.searchMode() && this.searchQuery().trim()) {
      const query = this.searchQuery().toLowerCase();
      msgs = msgs.filter((m) => m.content.toLowerCase().includes(query));
    }

    return msgs;
  });

  readonly groundingCards = computed<MerlinGroundingCard[]>(() => {
    const cards: MerlinGroundingCard[] = [];
    const queryEntry = this.queryKnowledge()[0];
    const nutritionPlan = this.nutritionPlan();
    const trainingEntry = this.trainingKnowledge()[0];
    const nutritionEntry = this.nutritionKnowledge()[0];

    if (queryEntry) {
      cards.push({
        id: `query-${queryEntry.id}`,
        title: "Current evidence match",
        summary: queryEntry.title,
        meta: `${queryEntry.category} • ${queryEntry.evidenceGrade} evidence`,
        icon: "pi-book",
        query: `Use ${queryEntry.title} to answer my question with practical next steps.`,
      });
    }

    if (nutritionPlan?.exists) {
      cards.push({
        id: "nutrition-plan",
        title: "Your nutrition targets",
        summary: [
          nutritionPlan.targetCalories ? `${nutritionPlan.targetCalories} kcal` : null,
          nutritionPlan.proteinGrams ? `${nutritionPlan.proteinGrams}g protein` : null,
          nutritionPlan.carbsGrams ? `${nutritionPlan.carbsGrams}g carbs` : null,
        ]
          .filter(Boolean)
          .join(" • "),
        meta: "Saved backend nutrition profile",
        icon: "pi-heart",
        query: "Use my nutrition targets to give me today's fueling advice.",
      });
    }

    if (trainingEntry) {
      cards.push({
        id: `training-${trainingEntry.id}`,
        title: "Training evidence",
        summary: trainingEntry.title,
        meta: `${trainingEntry.category} • ${trainingEntry.evidenceGrade} evidence`,
        icon: "pi-bolt",
        query: `Show me the most useful training takeaway from ${trainingEntry.title}.`,
      });
    }

    if (nutritionEntry) {
      cards.push({
        id: `nutrition-${nutritionEntry.id}`,
        title: "Nutrition evidence",
        summary: nutritionEntry.title,
        meta: `${nutritionEntry.category} • ${nutritionEntry.evidenceGrade} evidence`,
        icon: "pi-apple",
        query: `Summarize the nutrition guidance from ${nutritionEntry.title} for flag football.`,
      });
    }

    return cards.slice(0, 3);
  });

  readonly groundingSummary = computed(() => {
    const sources = [
      this.trainingKnowledge().length > 0 ? "training evidence" : null,
      this.nutritionKnowledge().length > 0 ? "nutrition evidence" : null,
      this.nutritionPlan()?.exists ? "nutrition targets" : null,
    ].filter(Boolean);

    return sources.length > 0
      ? `Grounded by ${sources.join(", ")}.`
      : "Grounding context is loading.";
  });

  readonly sessionContextItems = computed<SessionContextItem[]>(() => {
    const items: SessionContextItem[] = [];
    const readiness = this.readinessPresentation();
    const acwr = this.acwrDisplay();
    const nutritionPlan = this.nutritionPlan();
    const aiMode = this.aiModeStatus();

    if (readiness.score !== null) {
      items.push({
        id: "readiness",
        label: "Readiness",
        value: `${readiness.score}%`,
        detail:
          readiness.severity === "danger"
            ? "Recovery should shape the next answer."
            : "Current daily state is available to Merlin.",
        icon: "pi-heart-fill",
        tone: readiness.severity === "danger" ? "warning" : "default",
      });
    }

    if (typeof acwr.value === "number") {
      items.push({
        id: "acwr",
        label: "Training load",
        value: acwr.value.toFixed(2),
        detail:
          acwr.level === "danger-zone" || acwr.level === "elevated-risk"
            ? "High load context is active."
            : "Recent load is available to Merlin.",
        icon: "pi-chart-line",
        tone:
          acwr.level === "danger-zone" || acwr.level === "elevated-risk"
            ? "warning"
            : "default",
      });
    }

    if (nutritionPlan?.exists) {
      const nutritionBits = [
        nutritionPlan.targetCalories
          ? `${nutritionPlan.targetCalories} kcal`
          : null,
        nutritionPlan.proteinGrams ? `${nutritionPlan.proteinGrams}g protein` : null,
      ].filter(Boolean);
      items.push({
        id: "nutrition-targets",
        label: "Nutrition targets",
        value: nutritionBits.join(" • ") || "Saved",
        detail: "Fueling guidance can use your backend nutrition profile.",
        icon: "pi-apple",
      });
    }

    if (aiMode?.isConservative) {
      items.push({
        id: "mode",
        label: "AI mode",
        value: `${Math.round(aiMode.confidence * 100)}% confidence`,
        detail: aiMode.reason,
        icon: "pi-shield",
        tone: "warning",
      });
    }

    return items.slice(0, 4);
  });

  readonly sessionSummaryItems = computed<SessionSummaryItem[]>(() => {
    const items: SessionSummaryItem[] = [];
    const acwr = this.acwrDisplay();
    const readiness = this.readinessPresentation();
    const nutritionPlan = this.nutritionPlan();
    const lastAssistantMessage = [...this.messages()]
      .reverse()
      .find((message) => message.role === "assistant" && !message.isLoading);

    if (readiness.score !== null) {
      items.push({ id: "readiness", label: "readiness" });
    }

    if (typeof acwr.value === "number") {
      items.push({ id: "load", label: "training load" });
    }

    if (nutritionPlan?.exists) {
      items.push({ id: "nutrition", label: "nutrition targets" });
    }

    if (lastAssistantMessage?.intent) {
      items.push({
        id: "topic",
        label: this.getIntentSummaryLabel(lastAssistantMessage.intent),
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

  // Quick suggestions for welcome state - now more dynamic
  quickSuggestions = computed<QuickSuggestion[]>(() => {
    if (this.isCoach()) {
      return [
        {
          icon: "pi-users",
          label: "Team Health Report",
          query:
            "Merlin, give me a briefing on current team injury risks and readiness.",
          category: "Roster",
        },
        {
          icon: "pi-calendar-plus",
          label: "Plan Practice",
          query:
            "Help me design a 90-minute high-intensity practice for today.",
          category: "Planning",
        },
        {
          icon: "pi-chart-line",
          label: "Performance Trends",
          query:
            "Which athletes have shown the most improvement in speed this month?",
          category: "Analytics",
        },
        {
          icon: "pi-shield",
          label: "Injury Prevention",
          query:
            "Show me the best warm-up routines to prevent hamstring strains.",
          category: "Safety",
        },
      ];
    }

    const suggestions: QuickSuggestion[] = [
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
    ];

    // Add load-based suggestion
    const acwr = this.acwrDisplay();
    if (
      typeof acwr.value === "number" &&
      (acwr.level === "elevated-risk" || acwr.level === "danger-zone")
    ) {
      suggestions.push({
        icon: "pi-exclamation-triangle",
        label: "Handle high load",
        query: `My ACWR is ${acwr.value.toFixed(2)}. How should I adjust my training?`,
        category: "Safety",
      });
    } else if (acwr.level === "under-training") {
      suggestions.push({
        icon: "pi-chart-line",
        label: "Build back up",
        query: "My training load has been low. How do I safely increase it?",
        category: "Performance",
      });
    }

    // Add position-based suggestion
    const position = this.trainingService.userPosition();
    if (position === "QB") {
      suggestions.push({
        icon: "pi-star",
        label: "QB arm care",
        query: "What are the best arm care routines for a QB?",
        category: "Position",
      });
    }

    // Add health-based suggestion
    if (this.readinessPresentation().severity === "danger") {
      suggestions.push({
        icon: "pi-info-circle",
        label: "Recover better",
        query:
          "My readiness is low today. What recovery techniques do you suggest?",
        category: "Recovery",
      });
    }

    return suggestions.slice(0, UI_LIMITS.AI_SUGGESTIONS_COUNT);
  });

  // Computed context chips based on conversation and state
  contextChips = computed(() => {
    const msgs = this.messages();
    const isCoach = this.isCoach();
    const chips: string[] = [];

    // If no messages, show some helpful starters based on current state
    if (msgs.length === 0) {
      if (isCoach) {
        chips.push(
          "Team load summary",
          "Next opponent strategy",
          "Injury report",
        );
      } else {
        const acwr = this.acwrDisplay();
        const readiness = this.readinessPresentation();
        if (
          acwr.level === "elevated-risk" ||
          acwr.level === "danger-zone"
        ) {
          chips.push("Explain my high ACWR");
        }
        if (readiness.score !== null && readiness.severity === "danger")
          chips.push("Why is my readiness low?");
      }
      return chips.slice(0, UI_LIMITS.AI_CHIPS_COUNT);
    }

    const lastAssistantMsg = [...msgs]
      .reverse()
      .find((m) => m.role === "assistant" && !m.isLoading);
    if (!lastAssistantMsg) return [];

    // Generate relevant follow-up suggestions based on intent
    const intent = lastAssistantMsg.intent;

    if (isCoach) {
      switch (intent) {
        case "team_report":
          chips.push(
            "Detailed roster view",
            "Export health PDF",
            "Message at-risk players",
          );
          break;
        case "practice_plan":
          chips.push(
            "Reduce intensity",
            "Add position drills",
            "Save to calendar",
          );
          break;
        default:
          chips.push("Compare with last week", "Specific player deep-dive");
      }
    } else {
      switch (intent) {
        case "pain_injury":
          chips.push(
            "What exercises can I still do?",
            "How long should I rest?",
          );
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
          // Fallback to state-based context
          if (
            this.acwrDisplay().level === "elevated-risk" ||
            this.acwrDisplay().level === "danger-zone"
          ) {
            chips.push("Injury prevention tips");
          }
          if (msgs.length === 2) {
            chips.push("Tell me more", "Give me a routine");
          }
      }
    }

    return chips.slice(0, UI_LIMITS.AI_CHIPS_COUNT);
  });

  // User's first name for personalized greeting
  userName = computed(() => {
    const metadata = this.supabase.currentUser()?.user_metadata as
      | { fullName?: string; firstName?: string }
      | undefined;
    const fullName = metadata?.fullName || metadata?.firstName || "";
    return fullName ? fullName.split(" ")[0] : "";
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
    return this.sessionId === session.id;
  }

  constructor() {
    effect(() => {
      const score = this.readinessPresentation().score;
      if (score !== null && score > 0) {
        this.todayReadinessScore.set(score);
      }
    });

    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.searchQuery.set(value ?? "");
        this.onSearchInput();
      });

    // Initialize on construction (Angular 21 pattern)
    this.loadTodayReadiness();
    this.loadAIModeStatus();
    this.loadTrainingOverviewContext();
    void this.loadMerlinGrounding();
    void this.loadRecentSessions();
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
          sessionParam !== this.sessionId
        ) {
          this.restoredSessionId = sessionParam;
          void this.restoreSession(sessionParam);
        }

        if (params["draft"]) {
          this.currentMessage = params["draft"];
          this.returnContext.set(returnContext);
          setTimeout(() => this.adjustComposerHeight(), 0);
          this.consumeRouteParams(["draft", "from"]);
          return;
        }

        if (params["query"]) {
          this.currentMessage = params["query"];
          this.returnContext.set(returnContext);
          setTimeout(() => this.adjustComposerHeight(), 0);
          this.consumeRouteParams(["query", "from"]);
          // Small delay to ensure initialization is complete
          setTimeout(() => this.sendMessage(), TIMEOUTS.UI_MICRO_DELAY);
          return;
        }

        if (returnContext) {
          this.returnContext.set(returnContext);
          this.consumeRouteParams(["from"]);
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
        return ["/today"];
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
          session: this.sessionId || undefined,
        });
      case "training":
        return this.buildResumeQueryParams({
          source: "merlin",
          focus: "create-session",
          view: "week",
          date: this.getTodayDateKey(),
          session: this.sessionId || undefined,
        });
      case "today":
        return this.buildResumeQueryParams({
          source: "merlin",
          focus: "protocol",
          session: this.sessionId || undefined,
        });
      case "nutrition":
        return this.buildResumeQueryParams({
          source: "merlin",
          focus: "hydration",
          session: this.sessionId || undefined,
        });
      case "coach-inbox":
        return this.buildResumeQueryParams({
          source: "merlin",
          focus: "review-needed",
          session: this.sessionId || undefined,
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

  async loadTodayReadiness(): Promise<void> {
    const score = this.readinessPresentation().score;
    if (score !== null && score > 0) {
      this.todayReadinessScore.set(score);
    }
  }

  /**
   * Phase 2.3: Load AI mode status to detect conservative mode
   */
  async loadAIModeStatus(): Promise<void> {
    try {
      const userId = this.supabase.userId();
      if (!userId) return;

      // Check data confidence
      const wellnessStatus = await this.missingDataService.checkMissingWellness(
        userId,
      );
      const trainingDays =
        (this.acwrDisplay().trainingDaysLogged ??
          this.trainingService.acwrData().dataQuality.daysWithData) ||
        0;

      // Calculate confidence similar to backend
      let confidence = 1.0;
      const missingData: string[] = [];
      const staleData: string[] = [];

      if (wellnessStatus.missing) {
        missingData.push("wellness_checkin");
        confidence *= 0.7;
      }

      if (trainingDays < 10) {
        missingData.push(`${10 - trainingDays} training_sessions`);
        confidence *= Math.min(trainingDays / 10, 1.0);
      }

      if (wellnessStatus.daysMissing > 2) {
        staleData.push("wellness");
        confidence *= 0.8;
      }

      const isConservative = confidence < 0.7;

      if (isConservative) {
        let reason = "Incomplete data reduces recommendation accuracy.";
        if (wellnessStatus.missing) {
          reason = "Missing wellness check-ins reduce recommendation accuracy.";
        } else if (trainingDays < 10) {
          reason =
            "Insufficient training data reduces recommendation accuracy.";
        } else if (staleData.length > 0) {
          reason = "Stale wellness data reduces recommendation accuracy.";
        }

        this.aiModeStatus.set({
          isConservative: true,
          confidence: Math.max(0, Math.min(1, confidence)),
          reason,
          missingData,
          staleData,
        });
      } else {
        this.aiModeStatus.set(null);
      }
    } catch (error) {
      this.logger.error("ai_chat_mode_status_load_failed", error);
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
    const metadata = this.supabase.currentUser()?.user_metadata as
      | { fullName?: string; firstName?: string }
      | undefined;
    const fullName = metadata?.fullName || metadata?.firstName;
    if (!fullName) return "U";
    const parts = fullName.split(" ");
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
    if (!message || this.isLoading()) return;
    this.returnContext.set(null);
    this.closeRecentSessionsPanel();
    void this.refreshGroundingForQuery(message);

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
    this.resetComposerHeight();

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
      }>(API_ENDPOINTS.aiChat.send, {
        message,
        session_id: this.sessionId,
        team_id: this.teamMembershipService.teamId() || undefined,
        goal: this.inferConversationGoal(message),
        time_horizon: this.inferTimeHorizon(message),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
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
            this.syncSessionQueryParam(payload.chat_session_id);

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

            this.messages.update((msgs) => {
              const filtered = msgs.filter((m) => !m.isLoading);
              return [...filtered, assistantMessage];
            });
          } else {
            this.handleError("Failed to get response from Merlin AI");
          }
          this.isLoading.set(false);
          this.shouldScrollToBottom = true;
        },
        error: (error) => {
          this.clearLoadingStageTimers();
          this.logger.error("AI Chat error:", error);
          this.handleError(error.message || "Failed to connect to Merlin AI");
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

  private async loadMerlinGrounding(): Promise<void> {
    this.groundingLoading.set(true);
    this.knowledgeError.set(null);

    try {
      const [trainingKnowledge, nutritionKnowledge, nutritionPlan] =
        await Promise.all([
          this.fetchKnowledgeCategory("training"),
          this.fetchKnowledgeCategory("nutrition"),
          this.fetchNutritionPlan(),
        ]);

      this.trainingKnowledge.set(trainingKnowledge.slice(0, 3));
      this.nutritionKnowledge.set(nutritionKnowledge.slice(0, 3));
      this.nutritionPlan.set(nutritionPlan);
    } catch (error) {
      this.logger.warn("[AI Chat] Failed to preload Merlin grounding", error);
      this.knowledgeError.set("Merlin is running without the full backend evidence snapshot.");
    } finally {
      this.groundingLoading.set(false);
    }
  }

  private async refreshGroundingForQuery(message: string): Promise<void> {
    const category = this.inferKnowledgeCategory(message);

    try {
      const response = await firstValueFrom(
        this.apiService.post<{
          results?: KnowledgeEntry[];
          total?: number;
        }>(API_ENDPOINTS.knowledge.search, {
          query: message,
          category,
          limit: 3,
        }),
      );

      const payload = extractApiPayload<{
        results?: KnowledgeEntry[];
      }>(response);

      this.queryKnowledge.set(
        Array.isArray(payload?.results) ? payload.results : [],
      );
    } catch (error) {
      this.logger.warn("[AI Chat] Query grounding search failed", error);
      this.queryKnowledge.set([]);
    }
  }

  private async fetchKnowledgeCategory(category: "training" | "nutrition"): Promise<KnowledgeEntry[]> {
    const response = await firstValueFrom(
      this.apiService.get<{
        entries?: KnowledgeEntry[];
      }>(API_ENDPOINTS.knowledge.search, { category }),
    );

    const payload = extractApiPayload<{
      entries?: KnowledgeEntry[];
    }>(response);

    return Array.isArray(payload?.entries) ? payload.entries : [];
  }

  private async fetchNutritionPlan(): Promise<NutritionPlanSummary | null> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<Record<string, unknown>>(API_ENDPOINTS.nutrition.plan),
      );
      const payload = extractApiPayload<Record<string, unknown>>(response);
      if (!payload) {
        return null;
      }

      return {
        exists: payload["exists"] === false ? false : true,
        targetCalories: this.asNumber(payload["target_calories"]),
        proteinGrams: this.asNumber(payload["protein_g"]),
        carbsGrams: this.asNumber(payload["carbs_g"]),
        fatGrams: this.asNumber(payload["fat_g"]),
      };
    } catch (error) {
      this.logger.warn("[AI Chat] Nutrition plan unavailable", error);
      return null;
    }
  }

  private inferConversationGoal(message: string): string {
    const normalized = message.toLowerCase();
    if (/(eat|meal|nutrition|hydrate|protein|carb|supplement)/.test(normalized)) {
      return "nutrition_guidance";
    }
    if (/(practice|training|session|drill|workout|plan)/.test(normalized)) {
      return "training_guidance";
    }
    if (/(pain|injury|recover|recovery|sore|sleep)/.test(normalized)) {
      return "recovery_guidance";
    }
    if (this.isCoach()) {
      return "coach_strategy";
    }
    return "performance_guidance";
  }

  private inferTimeHorizon(
    message: string,
  ): "immediate" | "weekly" | "monthly" | "seasonal" {
    const normalized = message.toLowerCase();
    if (/(season|playoffs|tournament block|offseason)/.test(normalized)) {
      return "seasonal";
    }
    if (/(month|4 weeks|six weeks|8 weeks)/.test(normalized)) {
      return "monthly";
    }
    if (/(week|this week|next week)/.test(normalized)) {
      return "weekly";
    }
    return "immediate";
  }

  private inferKnowledgeCategory(message: string): "training" | "nutrition" {
    const normalized = message.toLowerCase();
    if (/(eat|meal|nutrition|hydrate|protein|carb|supplement|food)/.test(normalized)) {
      return "nutrition";
    }
    return "training";
  }

  private asNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  hasGrounding(message: ChatMessage): boolean {
    return (
      this.getCitationGroups(message).length > 0 ||
      this.messageUsesNutritionPlan(message) ||
      Boolean(message.evidenceGradeExplanation)
    );
  }

  getCitationGroups(message: ChatMessage): CitationGroup[] {
    const citations = Array.isArray(message.citations) ? message.citations : [];
    const groups = new Map<string, CitationGroup>();

    for (const citation of citations) {
      const key = this.getCitationCategoryLabel(citation);
      const existing = groups.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        groups.set(key, {
          key,
          label: key,
          count: 1,
        });
      }
    }

    return Array.from(groups.values());
  }

  getCitationEvidenceSummary(
    message: ChatMessage,
  ): CitationEvidenceSummary | null {
    const citations = Array.isArray(message.citations) ? message.citations : [];
    if (citations.length === 0) {
      return null;
    }

    const grades = new Map<string, number>();
    for (const citation of citations) {
      const label = this.getEvidenceGradeLabel(citation.evidence_grade);
      grades.set(label, (grades.get(label) || 0) + 1);
    }

    const [label, count] =
      Array.from(grades.entries()).sort((left, right) => right[1] - left[1])[0] ||
      [];

    return label ? { label, count: count || 0 } : null;
  }

  messageUsesNutritionPlan(message: ChatMessage): boolean {
    const content = message.content.toLowerCase();
    return (
      this.nutritionPlan()?.exists === true &&
      /nutrition targets|hydration goal|protein|carbs|kcal|calories|fueling/.test(content)
    );
  }

  getCitationLink(citation: Citation): string | null {
    return citation.url || citation.source_url || null;
  }

  getCitationTypeLabel(citation: Citation): string {
    return this.getCitationCategoryLabel(citation);
  }

  getCitationSourceLabel(citation: Citation): string {
    const sourceType = citation.source_type?.toLowerCase() || "";
    if (sourceType.includes("knowledge")) {
      return "Backend knowledge base";
    }
    if (sourceType.includes("nutrition")) {
      return "Nutrition profile";
    }
    if (sourceType.includes("article")) {
      return "Evidence article";
    }
    return "Reference source";
  }

  getEvidenceGradeLabel(evidenceGrade: string | null | undefined): string {
    const normalized = (evidenceGrade || "").trim().toUpperCase();
    if (!normalized) {
      return "Ungraded";
    }
    if (/^[ABC]$/.test(normalized)) {
      return `Grade ${normalized}`;
    }
    if (normalized === "HIGH") {
      return "High confidence";
    }
    if (normalized === "MODERATE") {
      return "Moderate confidence";
    }
    if (normalized === "LOW") {
      return "Low confidence";
    }
    return normalized;
  }

  getGroundingHeading(message: ChatMessage): string {
    if (message.citations?.length && this.messageUsesNutritionPlan(message)) {
      return "Grounded by backend evidence and nutrition targets";
    }
    if (message.citations?.length) {
      return "Grounded by backend evidence";
    }
    if (this.messageUsesNutritionPlan(message)) {
      return "Grounded by nutrition targets";
    }
    return "Grounding details";
  }

  private getCitationCategoryLabel(citation: Citation): string {
    const sourceType = citation.source_type?.toLowerCase() || "";
    if (sourceType.includes("knowledge")) {
      const title = citation.title.toLowerCase();
      if (/(nutrition|hydrate|protein|carb|supplement|fuel)/.test(title)) {
        return "Nutrition evidence";
      }
      if (/(recovery|sleep|fatigue|soreness|pain)/.test(title)) {
        return "Recovery evidence";
      }
      return "Training evidence";
    }

    return "Reference";
  }

  startNewConversation(): void {
    this.clearLoadingStageTimers();
    this.returnContext.set(null);
    this.messages.set([]);
    this.sessionId = null;
    this.restoredSessionId = null;
    this.currentMessage = "";
    this.showRecentSessionsPanel.set(false);
    this.resetComposerHeight();
    this.syncSessionQueryParam(null);
  }

  async reopenRecentSession(sessionId: string): Promise<void> {
    this.returnContext.set(null);
    this.messages.set([]);
    this.currentMessage = "";
    this.restoredSessionId = sessionId;
    this.showRecentSessionsPanel.set(false);
    this.resetComposerHeight();
    this.syncSessionQueryParam(sessionId);
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
    try {
      const response = await firstValueFrom(
        this.apiService.get<{ messages?: PersistedChatMessage[] }>(
          API_ENDPOINTS.aiChat.session(sessionId),
        ),
      );

      const payload = extractApiPayload<{ messages?: PersistedChatMessage[] }>(
        response,
      );
      const messages = Array.isArray(payload?.messages) ? payload.messages : [];

      this.messages.set(messages.map((message) => this.mapPersistedMessage(message)));
      this.sessionId = sessionId;
      this.shouldScrollToBottom = true;
    } catch (error) {
      this.logger.error("[AI Chat] Failed to restore session", error);
      this.toast.error("Unable to restore the previous Merlin session.");
      this.syncSessionQueryParam(null);
    }
  }

  private async loadRecentSessions(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.apiService.get<{ sessions?: RecentChatSession[] }>(
          API_ENDPOINTS.aiChat.sessions,
        ),
      );
      const payload = extractApiPayload<{ sessions?: RecentChatSession[] }>(
        response,
      );
      this.recentSessions.set(
        Array.isArray(payload?.sessions) ? payload.sessions.slice(0, 4) : [],
      );
    } catch (error) {
      this.logger.warn("[AI Chat] Failed to load recent sessions", error);
      this.recentSessions.set([]);
    }
  }

  private mapPersistedMessage(message: PersistedChatMessage): ChatMessage {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: new Date(message.timestamp),
      riskLevel: message.riskLevel || undefined,
      intent: message.intent || undefined,
      citations: Array.isArray(message.citations) ? message.citations : undefined,
      suggestedActions: message.metadata?.suggestedActions?.slice(
        0,
        UI_LIMITS.SUGGESTED_ACTIONS_COUNT,
      ),
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

  private syncSessionQueryParam(sessionId: string | null): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { session: sessionId || null },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  private consumeRouteParams(paramNames: string[]): void {
    const consumedParams = Object.fromEntries(
      paramNames.map((paramName) => [paramName, null]),
    );

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: consumedParams,
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
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
      await firstValueFrom(
        this.apiService.post(API_ENDPOINTS.responseFeedback, {
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
        void this.router.navigate(["/coach/inbox"], {
          queryParams: {
            source: "merlin",
            focus: "review-needed",
            session: this.sessionId || undefined,
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
            session: this.sessionId || undefined,
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
            session: this.sessionId || undefined,
          },
        });
        break;
      case "log_recovery":
        void this.router.navigate(["/wellness"], {
          queryParams: {
            focus: "checkin",
            source: "merlin",
            intent: "recovery",
            session: this.sessionId || undefined,
          },
        });
        break;
      case "check_tomorrow":
        void this.router.navigate(["/today"], {
          queryParams: {
            source: "merlin",
            focus: "protocol",
            session: this.sessionId || undefined,
          },
        });
        break;
      case "review_nutrition_targets":
        void this.router.navigate(["/wellness"], {
          queryParams: {
            focus: "checkin",
            source: "merlin",
            intent: "nutrition-targets",
            session: this.sessionId || undefined,
          },
        });
        break;
      case "review_hydration_plan":
        void this.router.navigate(["/game/nutrition"], {
          queryParams: {
            source: "merlin",
            focus: "hydration",
            session: this.sessionId || undefined,
          },
        });
        break;
      case "build_fueling_day":
        void this.router.navigate(["/game/nutrition"], {
          queryParams: {
            source: "merlin",
            focus: "schedule",
            session: this.sessionId || undefined,
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
    switch (this.loadingStage()) {
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
    switch (this.loadingStage()) {
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
    const latestUserMessage = [...this.messages()]
      .reverse()
      .find((message) => message.role === "user");

    return latestUserMessage
      ? this.inferConversationGoal(latestUserMessage.content) ===
          "nutrition_guidance"
      : false;
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
        .post(API_ENDPOINTS.aiChat.bookmark, {
          messageId: message.id,
          bookmarked: isNowBookmarked,
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          error: (err) => this.logger.error("Failed to save bookmark:", err),
        });
    }
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

  // ========================================
  // LOADING STAGES
  // ========================================

  private simulateLoadingStages(): void {
    this.clearLoadingStageTimers();
    const runId = ++this.loadingStageRunId;

    // Stage 1: Thinking
    this.loadingStage.set("thinking");

    // Stage 2: Searching (after 800ms)
    const searchingTimeout = setTimeout(() => {
      if (this.isLoading() && runId === this.loadingStageRunId) {
        this.loadingStage.set("searching");
      }
    }, 800);
    this.loadingStageTimeouts.push(searchingTimeout);

    // Stage 3: Generating (after 2s)
    const generatingTimeout = setTimeout(() => {
      if (this.isLoading() && runId === this.loadingStageRunId) {
        this.loadingStage.set("generating");
      }
    }, 2000);
    this.loadingStageTimeouts.push(generatingTimeout);
  }

  private clearLoadingStageTimers(): void {
    this.loadingStageRunId++;
    for (const timeoutId of this.loadingStageTimeouts) {
      clearTimeout(timeoutId);
    }
    this.loadingStageTimeouts = [];
    this.loadingStage.set("thinking");
  }
}
