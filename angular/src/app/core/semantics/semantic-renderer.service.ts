/**
 * Semantic Renderer Service
 *
 * Phase 3 - Meaning-First Architecture
 *
 * This service maps semantic meanings to UI components automatically.
 *
 * Rule: Features choose meanings. This service chooses components.
 *
 * Features do NOT:
 * - Choose colors
 * - Choose badges vs banners vs tags
 * - Choose placement
 * - Choose icons
 *
 * Features DO:
 * - Define semantic meaning
 * - Provide context
 * - Let renderer decide visual representation
 */

import { Injectable, inject } from "@angular/core";
import {
  SemanticMeaning,
  RiskMeaning,
  IncompleteDataMeaning,
  ActionRequiredMeaning,
  CoachOverrideMeaning,
  MeaningMetadata,
  validateMeaning,
  MEANING_VISUAL_GRAMMAR,
} from "./semantic-meaning.types";
import { LoggerService } from "../services/logger.service";

export interface RenderDecision {
  component: string; // Component selector
  props: Record<string, unknown>; // Component inputs
  placement: "top" | "attached" | "inline-blocking" | "on-entity" | "inline";
  priority: number; // Render priority (higher = render first)
}

@Injectable({
  providedIn: "root",
})
export class SemanticRendererService {
  private logger = inject(LoggerService);

  /**
   * Render a semantic meaning into a component decision
   *
   * This is the ONLY way features should render meanings.
   * Features call this, get a render decision, and use that component.
   */
  renderMeaning(metadata: MeaningMetadata): RenderDecision {
    const { meaning, context } = metadata;

    // Validate meaning follows semantic rules
    const validation = validateMeaning(meaning);
    if (!validation.valid) {
      this.logger.warn("[SemanticRenderer] Meaning validation failed:", {
        errors: validation.errors,
      });
      // Continue rendering but log warning
    }

    // Route to appropriate renderer based on meaning type
    switch (meaning.type) {
      case "risk":
        return this.renderRisk(meaning, context);
      case "incomplete-data":
        return this.renderIncompleteData(meaning, context);
      case "action-required":
        return this.renderActionRequired(meaning, context);
      case "coach-override":
        return this.renderCoachOverride(meaning, context);
      default:
        this.logger.error("[SemanticRenderer] Unknown meaning type:", meaning);
        throw new Error(
          `Unknown meaning type: ${(meaning as SemanticMeaning).type}`,
        );
    }
  }

  /**
   * Render RISK meaning
   *
   * Visual Grammar:
   * - Color: Red ONLY
   * - Component: RiskBanner (primary)
   * - Placement: Top of container
   */
  private renderRisk(
    meaning: RiskMeaning,
    context: MeaningMetadata["context"],
  ): RenderDecision {
    // Determine component based on context
    let component: string;
    let placement: RenderDecision["placement"];

    if (context.container === "banner") {
      component = "app-risk-banner"; // Full-width banner
      placement = "top";
    } else if (context.container === "card") {
      component = "app-risk-badge";
      placement = "top"; // Top-right of card
    } else {
      component = "app-risk-badge";
      placement = "inline";
    }

    // Map severity to visual intensity (NOT color - color is always red)
    const intensity = this.getRiskIntensity(meaning.severity);

    return {
      component,
      props: {
        level: meaning.severity,
        placement: context.container === "card" ? "top-right" : "inline",
        showIcon: true,
        tooltip: meaning.message,
        intensity, // Visual intensity (opacity, size) not color
      },
      placement,
      priority: this.getRiskPriority(meaning.severity),
    };
  }

  /**
   * Render INCOMPLETE DATA meaning
   *
   * Visual Grammar:
   * - Color: Orange/Amber ONLY
   * - Component: DataConfidenceIndicator
   * - Placement: Attached to affected metric
   */
  private renderIncompleteData(
    meaning: IncompleteDataMeaning,
    context: MeaningMetadata["context"],
  ): RenderDecision {
    const _grammar = MEANING_VISUAL_GRAMMAR["incomplete-data"];

    return {
      component: "app-incomplete-data-badge",
      props: {
        severity: meaning.severity,
        dataType: meaning.dataType,
        daysMissing: meaning.daysMissing || 0,
        placement: context.container === "card" ? "top-right" : "inline",
        showIcon: true,
        tooltip: meaning.message,
        confidenceImpact: meaning.confidenceImpact,
      },
      placement: "attached", // Attached to affected metric
      priority: meaning.severity === "critical" ? 3 : 2,
    };
  }

  /**
   * Render ACTION REQUIRED meaning
   *
   * Visual Grammar:
   * - Color: White surface + strong border
   * - Component: ActionPanel
   * - Placement: Inline, blocking if critical/high
   */
  private renderActionRequired(
    meaning: ActionRequiredMeaning,
    _context: MeaningMetadata["context"],
  ): RenderDecision {
    const _grammar = MEANING_VISUAL_GRAMMAR["action-required"];

    // If blocking, use ActionPanel component
    const component = meaning.blocking
      ? "app-action-panel"
      : "app-action-required-badge";

    return {
      component,
      props: {
        actionType: meaning.actionType,
        urgency: meaning.urgency,
        placement: meaning.blocking ? "top" : "inline",
        actionRoute: meaning.actionRoute,
        actionLabel: meaning.actionLabel,
        message: meaning.message,
        blocking: meaning.blocking,
      },
      placement: meaning.blocking ? "inline-blocking" : "inline",
      priority: this.getActionPriority(meaning.urgency),
    };
  }

  /**
   * Render COACH OVERRIDE meaning
   *
   * Visual Grammar:
   * - Color: Blue (informational, authoritative)
   * - Component: OverrideNotice
   * - Placement: Directly on modified entity
   */
  private renderCoachOverride(
    meaning: CoachOverrideMeaning,
    context: MeaningMetadata["context"],
  ): RenderDecision {
    const _grammar = MEANING_VISUAL_GRAMMAR["coach-override"];

    return {
      component: "app-coach-override-badge",
      props: {
        overrideType: meaning.overrideType,
        placement: context.container === "card" ? "top-right" : "inline",
        showIcon: true,
        showTimestamp: true,
        timestamp: meaning.timestamp,
        aiRecommendation: meaning.aiRecommendation,
        coachDecision: meaning.coachDecision,
        coachName: meaning.coachName,
        reason: meaning.reason,
      },
      placement: "on-entity", // Directly on modified entity
      priority: 2, // Coach overrides are important but not urgent
    };
  }

  /**
   * Helper: Get risk visual intensity (NOT color - color is always red)
   */
  private getRiskIntensity(
    severity: RiskMeaning["severity"],
  ): "subtle" | "normal" | "strong" | "critical" {
    switch (severity) {
      case "low":
        return "subtle";
      case "moderate":
        return "normal";
      case "high":
        return "strong";
      case "critical":
        return "critical";
    }
  }

  /**
   * Helper: Get risk render priority
   */
  private getRiskPriority(severity: RiskMeaning["severity"]): number {
    switch (severity) {
      case "critical":
        return 5; // Highest priority
      case "high":
        return 4;
      case "moderate":
        return 3;
      case "low":
        return 2;
    }
  }

  /**
   * Helper: Get action render priority
   */
  private getActionPriority(urgency: ActionRequiredMeaning["urgency"]): number {
    switch (urgency) {
      case "critical":
        return 5;
      case "high":
        return 4;
      case "medium":
        return 3;
      case "low":
        return 2;
    }
  }

  /**
   * Batch render multiple meanings (for dashboards with multiple signals)
   * Returns sorted by priority (highest first)
   */
  renderMeanings(metadataList: MeaningMetadata[]): RenderDecision[] {
    const decisions = metadataList.map((m) => this.renderMeaning(m));
    return decisions.sort((a, b) => b.priority - a.priority);
  }
}
