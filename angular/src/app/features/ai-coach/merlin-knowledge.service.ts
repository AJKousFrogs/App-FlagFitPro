/**
 * Merlin Knowledge Service
 *
 * Manages the backend evidence grounding layer for Merlin AI chat:
 * - Knowledge base entries (training + nutrition categories)
 * - Nutrition plan summary
 * - Per-query knowledge refresh
 * - Citation presentation helpers
 */
import { computed, inject, Injectable, signal } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService, API_ENDPOINTS } from "../../core/services/api.service";
import { LoggerService } from "../../core/services/logger.service";
import { extractApiPayload } from "../../core/utils/api-response-mapper";

// ===== Exported Interfaces =====

export interface Citation {
  id: string;
  title: string;
  source_type: string;
  evidence_grade: string;
  url?: string;
  source_url?: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  evidenceGrade: string;
  sourceUrl?: string;
}

export interface NutritionPlanSummary {
  exists: boolean;
  targetCalories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
}

export interface MerlinGroundingCard {
  id: string;
  title: string;
  summary: string;
  meta: string;
  icon: string;
  query: string;
}

export interface CitationGroup {
  key: string;
  label: string;
  count: number;
}

export interface CitationEvidenceSummary {
  label: string;
  count: number;
}

// ===== Service =====

@Injectable({ providedIn: "root" })
export class MerlinKnowledgeService {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);

  // State
  readonly groundingLoading = signal(false);
  readonly knowledgeError = signal<string | null>(null);
  readonly trainingKnowledge = signal<KnowledgeEntry[]>([]);
  readonly nutritionKnowledge = signal<KnowledgeEntry[]>([]);
  readonly queryKnowledge = signal<KnowledgeEntry[]>([]);
  readonly nutritionPlan = signal<NutritionPlanSummary | null>(null);

  // Computed — grounding cards for the welcome panel
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
          nutritionPlan.targetCalories
            ? `${nutritionPlan.targetCalories} kcal`
            : null,
          nutritionPlan.proteinGrams
            ? `${nutritionPlan.proteinGrams}g protein`
            : null,
          nutritionPlan.carbsGrams
            ? `${nutritionPlan.carbsGrams}g carbs`
            : null,
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

  // ===== Grounding Load / Refresh =====

  async loadMerlinGrounding(): Promise<void> {
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
      this.logger.warn(
        "[AI Chat] Failed to preload Merlin grounding",
        error,
      );
      this.knowledgeError.set(
        "Merlin is running without the full backend evidence snapshot.",
      );
    } finally {
      this.groundingLoading.set(false);
    }
  }

  async refreshGroundingForQuery(
    message: string,
    category: "training" | "nutrition",
  ): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.api.post<{
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

  // ===== Citation Presentation Helpers =====

  hasGrounding(
    citations: Citation[] | undefined,
    evidenceGradeExplanation: string | undefined,
    content: string,
  ): boolean {
    return (
      this.getCitationGroups(citations).length > 0 ||
      this.messageUsesNutritionPlan(content) ||
      Boolean(evidenceGradeExplanation)
    );
  }

  getCitationGroups(citations?: Citation[]): CitationGroup[] {
    const list = Array.isArray(citations) ? citations : [];
    const groups = new Map<string, CitationGroup>();

    for (const citation of list) {
      const key = this.getCitationCategoryLabel(citation);
      const existing = groups.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        groups.set(key, { key, label: key, count: 1 });
      }
    }

    return Array.from(groups.values());
  }

  getCitationEvidenceSummary(
    citations?: Citation[],
  ): CitationEvidenceSummary | null {
    const list = Array.isArray(citations) ? citations : [];
    if (list.length === 0) {
      return null;
    }

    const grades = new Map<string, number>();
    for (const citation of list) {
      const label = this.getEvidenceGradeLabel(citation.evidence_grade);
      grades.set(label, (grades.get(label) || 0) + 1);
    }

    const [label, count] =
      Array.from(grades.entries()).sort(
        (left, right) => right[1] - left[1],
      )[0] || [];

    return label ? { label, count: count || 0 } : null;
  }

  messageUsesNutritionPlan(content: string): boolean {
    return (
      this.nutritionPlan()?.exists === true &&
      /nutrition targets|hydration goal|protein|carbs|kcal|calories|fueling/.test(
        content.toLowerCase(),
      )
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
    if (!normalized) return "Ungraded";
    if (/^[ABC]$/.test(normalized)) return `Grade ${normalized}`;
    if (normalized === "HIGH") return "High confidence";
    if (normalized === "MODERATE") return "Moderate confidence";
    if (normalized === "LOW") return "Low confidence";
    return normalized;
  }

  getGroundingHeading(
    citations: Citation[] | undefined,
    content: string,
  ): string {
    const hasCitations = citations?.length;
    const usesNutrition = this.messageUsesNutritionPlan(content);
    if (hasCitations && usesNutrition) {
      return "Grounded by backend evidence and nutrition targets";
    }
    if (hasCitations) {
      return "Grounded by backend evidence";
    }
    if (usesNutrition) {
      return "Grounded by nutrition targets";
    }
    return "Grounding details";
  }

  // ===== Private Helpers =====

  private async fetchKnowledgeCategory(
    category: "training" | "nutrition",
  ): Promise<KnowledgeEntry[]> {
    const response = await firstValueFrom(
      this.api.get<{
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
        this.api.get<Record<string, unknown>>(API_ENDPOINTS.nutrition.plan),
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

  private asNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }
}
