import { firstValueFrom } from "rxjs";

import { API_ENDPOINTS, type ApiService } from "../services/api.service";
import type { LoggerService } from "../services/logger.service";
import type { SupabaseService } from "../services/supabase.service";
import type {
  SmartRecommendationsResponse,
  TrainingRecommendation,
} from "../models/api.models";
import {
  normalizeProtocolMetricsSnapshot,
  type ProtocolMetricsSnapshot,
} from "./protocol-metrics-presentation";
import { isBenignSupabaseQueryError } from "../../shared/utils/error.utils";

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
}

function logWarn(logger: LoggerService, message: string, context?: unknown) {
  logger.warn(message, context);
}

export async function loadDailyProtocolSnapshot({
  userId,
  date,
  api,
  supabase,
  logger,
  isExpectedApiClientError,
}: {
  userId: string;
  date: string;
  api: ApiService;
  supabase: SupabaseService;
  logger: LoggerService;
  isExpectedApiClientError: (error: unknown) => boolean;
}): Promise<{ data: ProtocolMetricsSnapshot | null }> {
  try {
    const response = await firstValueFrom(
      api.get<ApiResponse<unknown>>(API_ENDPOINTS.dailyProtocol.byDate(date)),
    );

    if (response?.success && response.data) {
      return {
        data: normalizeProtocolMetricsSnapshot(response.data),
      };
    }
  } catch (err) {
    if (!isExpectedApiClientError(err)) {
      logWarn(
        logger,
        "[UnifiedTraining] API protocol load failed, falling back to direct query",
        err,
      );
    }
  }

  try {
    const { data, error } = await supabase.client
      .from("daily_protocols")
      .select(
        `
          *,
          protocol_exercises (*)
        `,
      )
      .eq("user_id", userId)
      .eq("protocol_date", date)
      .maybeSingle();

    if (error) {
      if (!isBenignSupabaseQueryError(error)) {
        logWarn(logger, "[UnifiedTraining] Error loading daily protocol:", error);
      }
      return { data: null };
    }

    return {
      data: normalizeProtocolMetricsSnapshot(data),
    };
  } catch (err) {
    if (!isBenignSupabaseQueryError(err)) {
      logWarn(logger, "[UnifiedTraining] Failed to load daily protocol:", err);
    }
    return { data: null };
  }
}

export async function loadTrainingRecommendationsSnapshot({
  userId,
  supabase,
  logger,
}: {
  userId: string;
  supabase: SupabaseService;
  logger: LoggerService;
}): Promise<{ data: SmartRecommendationsResponse | null }> {
  try {
    const { data, error } = await supabase.client
      .from("ai_training_suggestions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      if (!isBenignSupabaseQueryError(error)) {
        logWarn(logger, "[UnifiedTraining] Error loading recommendations:", error);
      }
      return { data: null };
    }

    const recommendations: SmartRecommendationsResponse = {
      athleteId: userId,
      date: new Date().toISOString().split("T")[0],
      overallStatus: "optimal",
      recommendations:
        data?.map((s) => ({
          type: (s.suggestion_type as TrainingRecommendation["type"]) || "focus",
          priority:
            (s.priority as TrainingRecommendation["priority"]) || "medium",
          message: s.description || s.title || "Training suggestion",
          action: undefined,
          reasoning: undefined,
        })) || [],
      warnings: [],
      suggestions:
        (data
          ?.map((s) => s.title || s.description)
          .filter(Boolean) as string[]) || [],
      metrics: {
        acwr: 1.0,
        readiness: 75,
        fatigue: 3,
        injuryRisk: 0.1,
      },
    };

    return { data: recommendations };
  } catch (err) {
    if (!isBenignSupabaseQueryError(err)) {
      logWarn(logger, "[UnifiedTraining] Failed to load recommendations:", err);
    }
    return { data: null };
  }
}
