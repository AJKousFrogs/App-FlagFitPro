/**
 * Protocol API Mapper Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
  mapToDailyProtocol,
  type ApiExercise,
  type ApiProtocolBlock,
  type ProtocolApiResponse,
} from "./protocol-api-mapper";

describe("protocol-api-mapper", () => {
  it("should return minimal protocol for empty data", () => {
    const result = mapToDailyProtocol({});
    expect(result.id).toBeUndefined();
    expect(result.morningMobility).toBeDefined();
    expect(result.morningMobility?.exercises).toEqual([]);
    expect(result.morningMobility?.totalCount).toBe(0);
  });

  it("should map block with exercises to ProtocolBlock", () => {
    const block: ApiProtocolBlock = {
      type: "morning_mobility",
      title: "Morning Mobility",
      icon: "pi-sun",
      exercises: [
        {
          id: "ex-1",
          name: "Hip Circles",
          slug: "hip-circles",
          prescribedSets: 2,
          prescribedReps: 10,
          status: "pending",
        } as ApiExercise,
      ],
    };

    const data: ProtocolApiResponse = {
      id: "proto-1",
      date: "2025-01-15",
      morningMobility: block,
    };

    const result = mapToDailyProtocol(data);
    expect(result.id).toBe("proto-1");
    expect(result.protocolDate).toBe("2025-01-15");
    expect(result.morningMobility?.exercises).toHaveLength(1);
    expect(result.morningMobility?.exercises[0].exercise.name).toBe("Hip Circles");
    expect(result.morningMobility?.totalCount).toBe(1);
  });

  it("should prefer exact drill names from exercise_name fields", () => {
    const block: ApiProtocolBlock = {
      exercises: [
        {
          id: "ex-exact",
          exercise_name: "Lateral Bounds",
          prescribedSets: 2,
          prescribedReps: 6,
          status: "pending",
        } as ApiExercise,
      ],
    };

    const result = mapToDailyProtocol({ warmUp: block });

    expect(result.warmUp?.exercises[0].exercise.name).toBe("Lateral Bounds");
    expect(result.warmUp?.exercises[0].exerciseId).toBe("ex-exact");
  });

  it("should prefer nested exact drill names over generic top-level names", () => {
    const block: ApiProtocolBlock = {
      exercises: [
        {
          id: "ex-nested",
          name: "Legacy Warm-Up Placeholder",
          exercise: {
            id: "nested-exact",
            exercise_name: "A-Skips",
            slug: "a-skips",
            category: "skill",
            howText: "Stay tall",
            defaultSets: 1,
            difficultyLevel: "intermediate",
            loadContributionAu: 0,
            isHighIntensity: false,
          },
          prescribedSets: 2,
          status: "pending",
        } as ApiExercise,
      ],
    };

    const result = mapToDailyProtocol({ skillDrills: block });

    expect(result.skillDrills?.exercises[0].exercise.name).toBe("A-Skips");
  });

  it("should handle nested exercise object", () => {
    const block: ApiProtocolBlock = {
      exercises: [
        {
          exercise: {
            id: "nested-1",
            name: "Foam Roll IT Band",
            slug: "foam-roll-it-band",
            category: "foam_roll",
            howText: "Roll slowly",
            defaultSets: 1,
            difficultyLevel: "intermediate",
            loadContributionAu: 5,
            isHighIntensity: false,
          },
          prescribedSets: 2,
          status: "complete",
        } as ApiExercise,
      ],
    };

    const data: ProtocolApiResponse = { foamRoll: block };
    const result = mapToDailyProtocol(data);

    expect(result.foamRoll?.exercises[0].exercise.name).toBe("Foam Roll IT Band");
    expect(result.foamRoll?.exercises[0].status).toBe("complete");
    expect(result.foamRoll?.completedCount).toBe(1);
  });

  it("should compute overall progress from all blocks", () => {
    const createBlock = (completed: number, total: number): ApiProtocolBlock => ({
      exercises: Array.from({ length: total }, (_, i) =>
        i < completed
          ? ({ status: "complete" } as ApiExercise)
          : ({ status: "pending" } as ApiExercise),
      ),
    });

    const data: ProtocolApiResponse = {
      morningMobility: createBlock(2, 3),
      foamRoll: createBlock(1, 2),
    };

    const result = mapToDailyProtocol(data);
    expect(result.completedExercises).toBe(3);
    expect(result.totalExercises).toBe(5);
    expect(result.overallProgress).toBe(60); // 3/5 = 60%
  });

  it("should preserve snake_case protocol metrics from backend responses", () => {
    const result = mapToDailyProtocol({
      id: "proto-snake",
      protocol_date: "2026-03-07",
      readiness_score: 78,
      acwr_value: 1.12,
      training_focus: "practice_day",
    });

    expect(result.protocolDate).toBe("2026-03-07");
    expect(result.readinessScore).toBe(78);
    expect(result.acwrValue).toBe(1.12);
    expect(result.trainingFocus).toBe("practice_day");
  });

  it("derives youtube metadata when only a video URL is present", () => {
    const block: ApiProtocolBlock = {
      exercises: [
        {
          id: "ex-video",
          name: "Hip Mobility Flow",
          slug: "hip-mobility-flow",
          videoUrl: "https://www.youtube.com/watch?v=IWNnTJFwi3s",
          prescribedSets: 1,
          prescribedDurationSeconds: 600,
        } as ApiExercise,
      ],
    };

    const result = mapToDailyProtocol({ morningMobility: block });
    const exercise = result.morningMobility?.exercises[0].exercise;

    expect(exercise?.videoId).toBe("IWNnTJFwi3s");
    expect(exercise?.videoUrl).toBe(
      "https://www.youtube.com/watch?v=IWNnTJFwi3s",
    );
    expect(exercise?.thumbnailUrl).toBe(
      "https://img.youtube.com/vi/IWNnTJFwi3s/hqdefault.jpg",
    );
  });

  it("uses curated drill videos when backend exercise rows have no video metadata", () => {
    const block: ApiProtocolBlock = {
      exercises: [
        {
          id: "ex-curated-video",
          exercise_name: "Morning Mobility - Day 1 (Monday)",
          prescribedSets: 1,
          prescribedDurationSeconds: 600,
        } as ApiExercise,
      ],
    };

    const result = mapToDailyProtocol({ morningMobility: block });
    const exercise = result.morningMobility?.exercises[0].exercise;

    expect(exercise?.name).toBe("Morning Mobility - Day 1 (Monday)");
    expect(exercise?.videoId).toBe("IWNnTJFwi3s");
    expect(exercise?.videoUrl).toBe(
      "https://www.youtube.com/watch?v=IWNnTJFwi3s",
    );
    expect(exercise?.thumbnailUrl).toBe(
      "https://img.youtube.com/vi/IWNnTJFwi3s/hqdefault.jpg",
    );
  });
});
