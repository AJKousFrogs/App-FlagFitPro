/**
 * Chat Suggestions Service
 *
 * Owns all context-aware computed signals for the Merlin AI chat UI:
 * quick suggestions (welcome state), context chips (follow-up chips),
 * session context items (header data pills), and user display data.
 * Also manages AI mode status (conservative mode detection).
 */

import { Injectable, computed, inject, signal } from "@angular/core";
import { UI_LIMITS } from "../../core/constants/app.constants";
import { LoggerService } from "../../core/services/logger.service";
import { MissingDataDetectionService } from "../../core/services/missing-data-detection.service";
import { SupabaseService } from "../../core/services/supabase.service";
import { TeamMembershipService } from "../../core/services/team-membership.service";
import { UnifiedTrainingService } from "../../core/services/unified-training.service";
import {
  getProtocolAcwrDisplay,
  getProtocolReadinessPresentation,
} from "../../core/utils/protocol-metrics-presentation";
import type { AIModeStatus } from "../../shared/components/ai-mode-explanation/ai-mode-explanation.component";
import { ChatMessagesService } from "./chat-messages.service";
import { MerlinKnowledgeService, type NutritionPlanSummary } from "./merlin-knowledge.service";

// ============================================================================
// INTERFACES (exported for template use)
// ============================================================================

export interface QuickSuggestion {
  icon: string;
  label: string;
  query: string;
  category: string;
}

export interface SessionContextItem {
  id: string;
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone?: "default" | "warning";
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({ providedIn: "root" })
export class ChatSuggestionsService {
  private readonly trainingService = inject(UnifiedTrainingService);
  private readonly teamMembership = inject(TeamMembershipService);
  private readonly msgs = inject(ChatMessagesService);
  private readonly knowledge = inject(MerlinKnowledgeService);
  private readonly supabase = inject(SupabaseService);
  private readonly missingDataService = inject(MissingDataDetectionService);
  private readonly logger = inject(LoggerService);

  // ====== AI mode status ======
  private readonly _aiModeStatus = signal<AIModeStatus | null>(null);
  readonly aiModeStatus = this._aiModeStatus.asReadonly();

  // ====== Readiness / ACWR derivations (kept here to avoid re-injection in component) ======
  private readonly todayProtocol = this.trainingService.todayProtocol;

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

  readonly todayReadinessScore = computed(() => {
    const score = this.readinessPresentation().score;
    return score !== null && score > 0 ? score : null;
  });

  readonly isCoach = computed(
    () =>
      this.teamMembership.isCoach() || this.teamMembership.isAdmin(),
  );

  // ====== User display ======
  readonly userName = computed(() => {
    const metadata = this.supabase.currentUser()?.user_metadata as
      | { fullName?: string; firstName?: string }
      | undefined;
    const fullName = metadata?.fullName || metadata?.firstName || "";
    return fullName ? fullName.split(" ")[0] : "";
  });

  // ====== Session context items (header data pills) ======
  readonly sessionContextItems = computed<SessionContextItem[]>(() => {
    const items: SessionContextItem[] = [];
    const readiness = this.readinessPresentation();
    const acwr = this.acwrDisplay();
    const nutritionPlan = this.knowledge.nutritionPlan();
    const aiMode = this._aiModeStatus();

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

    if ((nutritionPlan as NutritionPlanSummary | null)?.exists) {
      const plan = nutritionPlan as NutritionPlanSummary;
      const nutritionBits = [
        plan.targetCalories ? `${plan.targetCalories} kcal` : null,
        plan.proteinGrams ? `${plan.proteinGrams}g protein` : null,
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

  // ====== Quick suggestions (welcome state) ======
  readonly quickSuggestions = computed<QuickSuggestion[]>(() => {
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

    const position = this.trainingService.userPosition();
    if (position === "QB") {
      suggestions.push({
        icon: "pi-star",
        label: "QB arm care",
        query: "What are the best arm care routines for a QB?",
        category: "Position",
      });
    }

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

  // ====== Context chips (follow-up chips after messages) ======
  readonly contextChips = computed(() => {
    const messages = this.msgs.messages();
    const isCoach = this.isCoach();
    const chips: string[] = [];

    if (messages.length === 0) {
      if (isCoach) {
        chips.push("Team load summary", "Next opponent strategy", "Injury report");
      } else {
        const acwr = this.acwrDisplay();
        const readiness = this.readinessPresentation();
        if (acwr.level === "elevated-risk" || acwr.level === "danger-zone") {
          chips.push("Explain my high ACWR");
        }
        if (readiness.score !== null && readiness.severity === "danger") {
          chips.push("Why is my readiness low?");
        }
      }
      return chips.slice(0, UI_LIMITS.AI_CHIPS_COUNT);
    }

    const lastAssistantMsg = [...messages]
      .reverse()
      .find((m) => m.role === "assistant" && !m.isLoading);
    if (!lastAssistantMsg) return [];

    const intent = lastAssistantMsg.intent;

    if (isCoach) {
      switch (intent) {
        case "team_report":
          chips.push("Detailed roster view", "Export health PDF", "Message at-risk players");
          break;
        case "practice_plan":
          chips.push("Reduce intensity", "Add position drills", "Save to calendar");
          break;
        default:
          chips.push("Compare with last week", "Specific player deep-dive");
      }
    } else {
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
          if (
            this.acwrDisplay().level === "elevated-risk" ||
            this.acwrDisplay().level === "danger-zone"
          ) {
            chips.push("Injury prevention tips");
          }
          if (messages.length === 2) {
            chips.push("Tell me more", "Give me a routine");
          }
      }
    }

    return chips.slice(0, UI_LIMITS.AI_CHIPS_COUNT);
  });

  // ============================================================================
  // AI MODE STATUS
  // ============================================================================

  async loadAIModeStatus(): Promise<void> {
    try {
      const userId = this.supabase.userId();
      if (!userId) return;

      const wellnessStatus = await this.missingDataService.checkMissingWellness(userId);
      const trainingDays =
        (this.acwrDisplay().trainingDaysLogged ??
          this.trainingService.acwrData().dataQuality.daysWithData) || 0;

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
          reason = "Insufficient training data reduces recommendation accuracy.";
        } else if (staleData.length > 0) {
          reason = "Stale wellness data reduces recommendation accuracy.";
        }

        this._aiModeStatus.set({
          isConservative: true,
          confidence: Math.max(0, Math.min(1, confidence)),
          reason,
          missingData,
          staleData,
        });
      } else {
        this._aiModeStatus.set(null);
      }
    } catch (error) {
      this.logger.error("ai_chat_mode_status_load_failed", error);
    }
  }
}
