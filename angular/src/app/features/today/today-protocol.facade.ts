import { Injectable } from "@angular/core";
import {
  formatPrescription,
  type DailyProtocol,
  type PrescribedExercise,
  type ProtocolBlock,
} from "../training/daily-protocol/daily-protocol.models";
import type { ProtocolJson, TodayViewModel } from "./resolution/today-state.resolver";
import { resolveYouTubeVideoMetadata } from "../../shared/utils/youtube-video.utils";

export interface TodayLiveMetrics {
  readinessScore: number | null;
  acwrValue: number | null;
  acwrRiskLevel?: string | null;
  hasCheckedInToday: boolean;
}

export interface TodayReadinessDisplay {
  value: string;
  logged: boolean;
}

export interface ExactTrainingSummary {
  title: string;
  focusLabel: string;
  description: string;
  startBlock: string;
  firstExercise: string | null;
  featuredVideoId: string | null;
  featuredVideoTitle: string | null;
  featuredVideos: ExactTrainingVideoItem[];
  blockCount: number;
  exerciseCount: number;
  estimatedMinutes: number;
  videoCount: number;
  readinessText: string | null;
  acwrText: string | null;
  coachContext: string | null;
}

export interface ExactTrainingVideoItem {
  exerciseId: string;
  exerciseName: string;
  blockType: string;
  blockLabel: string;
  prescriptionLabel: string;
  videoId: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
}

@Injectable({
  providedIn: "root",
})
export class TodayProtocolFacade {
  getBlockByType(
    protocol: Partial<DailyProtocol> | null | undefined,
    blockType: string,
  ): ProtocolBlock | null {
    if (!protocol) {
      return null;
    }

    const blockMap: Record<string, keyof DailyProtocol> = {
      morning_mobility: "morningMobility",
      foam_roll: "foamRoll",
      warm_up: "warmUp",
      isometrics: "isometrics",
      plyometrics: "plyometrics",
      strength: "strength",
      conditioning: "conditioning",
      skill_drills: "skillDrills",
      main_session: "mainSession",
      cool_down: "coolDown",
      recovery: "eveningRecovery",
      evening_recovery: "eveningRecovery",
    };

    const prop = blockMap[blockType];
    if (!prop) {
      return null;
    }

    const block = protocol[prop] as ProtocolBlock | undefined;
    if (!block) {
      return null;
    }

    // Include blocks even when exercises are not yet populated so Today's Practice
    // is not a blank card when the API returns block shells before exercises load.
    return block;
  }

  buildReadinessDisplay(
    protocolJson: ProtocolJson | null,
    metrics: TodayLiveMetrics,
  ): TodayReadinessDisplay {
    const score = protocolJson?.readiness_score ?? metrics.readinessScore;
    if (score === null || score === undefined) {
      return { value: "—", logged: false };
    }

    const logged =
      protocolJson?.confidence_metadata?.readiness?.daysStale === 0 ||
      metrics.hasCheckedInToday;

    return {
      value: `${score}`,
      logged,
    };
  }

  buildExactTrainingSummary({
    todayViewModel,
    protocol,
    protocolJson,
    metrics,
  }: {
    todayViewModel: TodayViewModel | null;
    protocol: Partial<DailyProtocol> | null;
    protocolJson: ProtocolJson | null;
    metrics: TodayLiveMetrics;
  }): ExactTrainingSummary | null {
    if (!todayViewModel || !protocol || !todayViewModel.trainingAllowed) {
      return null;
    }

    const blocks = todayViewModel.blocksDisplayed
      .map((blockType) => this.getBlockByType(protocol, blockType))
      .filter((block): block is ProtocolBlock => block !== null);

    const substantiveBlocks = blocks.filter((block) => block.totalCount > 0);

    if (substantiveBlocks.length === 0) {
      return null;
    }

    const exerciseCount = substantiveBlocks.reduce(
      (total, block) => total + block.totalCount,
      0,
    );
    const estimatedMinutes = substantiveBlocks.reduce(
      (total, block) => total + (block.estimatedDurationMinutes ?? 0),
      0,
    );
    const featuredVideos: ExactTrainingVideoItem[] = [];
    const seenExerciseIds = new Set<string>();
    for (const block of substantiveBlocks) {
      for (const exercise of block.exercises) {
        const exerciseId = exercise.exerciseId;
        if (!exerciseId || seenExerciseIds.has(exerciseId)) {
          continue;
        }

        const metadata = resolveYouTubeVideoMetadata({
          videoId: exercise.exercise.videoId,
          videoUrl: exercise.exercise.videoUrl,
          exerciseName: exercise.exercise.name,
        });

        if (!metadata.videoId) {
          continue;
        }

        seenExerciseIds.add(exerciseId);
        featuredVideos.push({
          exerciseId,
          exerciseName: exercise.exercise.name,
          blockType: exercise.blockType,
          blockLabel: block.title,
          prescriptionLabel: formatPrescription(exercise as PrescribedExercise),
          videoId: metadata.videoId,
          videoUrl: metadata.videoUrl,
          thumbnailUrl: metadata.thumbnailUrl,
        });
      }
    }

    const featuredVideo = featuredVideos[0] ?? null;
    const featuredVideoId: string | null = featuredVideo?.videoId ?? null;
    const featuredVideoTitle: string | null =
      featuredVideo?.exerciseName ?? null;
    const videoCount = featuredVideos.length;

    const firstBlock = substantiveBlocks[0];
    const firstExercise = firstBlock.exercises[0]?.exercise.name ?? null;
    const practiceTime = todayViewModel.headerContext?.practiceTime;
    const filmRoomTime = todayViewModel.headerContext?.filmRoomTime;
    const focusLabel = this.getTrainingFocusLabel(protocol.trainingFocus);
    const descriptionParts = [
      practiceTime ? `Team practice at ${practiceTime}` : null,
      filmRoomTime ? `Film room at ${filmRoomTime}` : null,
      protocolJson?.coach_modified ? "Coach-adjusted plan" : null,
      estimatedMinutes > 0 ? `~${estimatedMinutes} minutes total` : null,
      videoCount > 0 ? `${videoCount} video-guided drills` : null,
    ].filter((value): value is string => Boolean(value));

    return {
      title: `${focusLabel} session`,
      focusLabel,
      description:
        descriptionParts.join(" • ") ||
        "Your exact individual session is ready to execute.",
      startBlock: firstBlock.title,
      firstExercise,
      featuredVideoId,
      featuredVideoTitle,
      featuredVideos,
      blockCount: substantiveBlocks.length,
      exerciseCount,
      estimatedMinutes,
      videoCount,
      readinessText: this.getProtocolReadinessText(protocolJson, metrics),
      acwrText: this.getProtocolAcwrText(protocolJson, metrics),
      coachContext: todayViewModel.headerContext?.coachAttribution ?? null,
    };
  }

  private getProtocolReadinessText(
    protocolJson: ProtocolJson | null,
    metrics: TodayLiveMetrics,
  ): string | null {
    const score = protocolJson?.readiness_score ?? metrics.readinessScore;
    if (score === null || score === undefined) {
      return null;
    }

    return `${score}% readiness`;
  }

  private getProtocolAcwrText(
    protocolJson: ProtocolJson | null,
    metrics: TodayLiveMetrics,
  ): string | null {
    const protocolPresentation = protocolJson?.acwr_presentation;
    if (protocolPresentation) {
      return protocolPresentation.text ?? null;
    }

    const protocolValue = protocolJson?.acwr_value;
    const liveValue = metrics.acwrValue;
    const value = protocolValue ?? liveValue;

    if (
      value === null ||
      value === undefined ||
      ((protocolValue === null || protocolValue === undefined) &&
        (metrics.acwrRiskLevel === "no-data" || value <= 0))
    ) {
      return null;
    }

    return `ACWR ${value.toFixed(2)} · ${this.getFallbackAcwrLabel(
      metrics.acwrRiskLevel,
      value,
    )}`;
  }

  private getFallbackAcwrLabel(
    level: string | null | undefined,
    value: number,
  ): string {
    const levelMap: Record<string, string> = {
      "under-training": "under target",
      "sweet-spot": "sweet spot",
      "elevated-risk": "elevated",
      "danger-zone": "high risk",
    };

    if (level && levelMap[level]) {
      return levelMap[level];
    }

    if (value < 0.8) {
      return "under target";
    }

    if (value <= 1.3) {
      return "sweet spot";
    }

    if (value <= 1.5) {
      return "elevated";
    }

    return "high risk";
  }

  private getTrainingFocusLabel(trainingFocus?: string): string {
    if (!trainingFocus) {
      return "Personalized";
    }

    const focusMap: Record<string, string> = {
      practice_day: "Practice-day support",
      practice_day_qb: "QB practice-day support",
      film_room: "Film-room support",
      recovery: "Recovery",
      skill: "Skill development",
      taper_early: "Early taper",
      taper_week: "Taper week",
      taper_final: "Final taper",
      strength: "Strength",
      power: "Power",
      speed: "Speed",
      conditioning: "Conditioning",
    };

    return (
      focusMap[trainingFocus] ||
      trainingFocus
        .replace(/_/g, " ")
        .replace(/\b\w/g, (value) => value.toUpperCase())
    );
  }
}
