/**
 * Conversation Classifier Service
 *
 * Pure classification helpers: infer conversation goal, time horizon,
 * and knowledge category from free-text user messages. No state, no API calls.
 */
import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ConversationClassifierService {
  inferConversationGoal(message: string, isCoach = false): string {
    const normalized = message.toLowerCase();
    if (
      /(eat|meal|nutrition|hydrate|protein|carb|supplement)/.test(normalized)
    ) {
      return "nutrition_guidance";
    }
    if (/(practice|training|session|drill|workout|plan)/.test(normalized)) {
      return "training_guidance";
    }
    if (/(pain|injury|recover|recovery|sore|sleep)/.test(normalized)) {
      return "recovery_guidance";
    }
    if (isCoach) {
      return "coach_strategy";
    }
    return "performance_guidance";
  }

  inferTimeHorizon(
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

  inferKnowledgeCategory(message: string): "training" | "nutrition" {
    const normalized = message.toLowerCase();
    if (
      /(eat|meal|nutrition|hydrate|protein|carb|supplement|food)/.test(
        normalized,
      )
    ) {
      return "nutrition";
    }
    return "training";
  }
}
