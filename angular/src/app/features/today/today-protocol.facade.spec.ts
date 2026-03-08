import { describe, expect, it } from "vitest";
import type { DailyProtocol } from "../training/daily-protocol/daily-protocol.models";
import type { ProtocolJson, TodayViewModel } from "./resolution/today-state.resolver";
import { TodayProtocolFacade } from "./today-protocol.facade";

describe("TodayProtocolFacade", () => {
  const facade = new TodayProtocolFacade();

  it("prefers protocol readiness for display and marks logged state from protocol metadata", () => {
    const display = facade.buildReadinessDisplay(
      {
        readiness_score: 82,
        confidence_metadata: {
          readiness: {
            daysStale: 0,
          },
        },
      } as ProtocolJson,
      {
        readinessScore: 65,
        acwrValue: null,
        acwrRiskLevel: null,
        hasCheckedInToday: false,
      },
    );

    expect(display).toEqual({
      value: "82",
      logged: true,
    });
  });

  it("builds an exact training summary from protocol blocks and derives video coverage", () => {
    const protocol: Partial<DailyProtocol> = {
      trainingFocus: "practice_day",
      morningMobility: {
        type: "morning_mobility",
        title: "Morning Mobility",
        icon: "pi-sun",
        status: "pending",
        completedCount: 0,
        totalCount: 1,
        progressPercent: 0,
        estimatedDurationMinutes: 10,
        exercises: [
          {
            id: "pe-1",
            exerciseId: "ex-1",
            blockType: "morning_mobility",
            sequenceOrder: 1,
            prescribedSets: 1,
            status: "pending",
            loadContributionAu: 0,
            exercise: {
              id: "ex-1",
              name: "Hip Flow",
              slug: "hip-flow",
              category: "mobility",
              howText: "Move slowly",
              defaultSets: 1,
              difficultyLevel: "beginner",
              loadContributionAu: 0,
              isHighIntensity: false,
              videoUrl: "https://www.youtube.com/watch?v=IWNnTJFwi3s",
            },
          },
        ],
      },
      strength: {
        type: "strength",
        title: "Strength",
        icon: "pi-heart",
        status: "pending",
        completedCount: 0,
        totalCount: 1,
        progressPercent: 0,
        estimatedDurationMinutes: 15,
        exercises: [
          {
            id: "pe-2",
            exerciseId: "ex-2",
            blockType: "strength",
            sequenceOrder: 1,
            prescribedSets: 3,
            prescribedReps: 6,
            status: "pending",
            loadContributionAu: 24,
            exercise: {
              id: "ex-2",
              name: "Trap Bar Deadlift",
              slug: "trap-bar-deadlift",
              category: "strength",
              howText: "Drive through the floor",
              defaultSets: 3,
              defaultReps: 6,
              difficultyLevel: "intermediate",
              loadContributionAu: 24,
              isHighIntensity: true,
            },
          },
        ],
      },
    };

    const todayViewModel: TodayViewModel = {
      trainingAllowed: true,
      banners: [],
      blocksDisplayed: ["morning_mobility", "strength"],
      merlinPosture: "explanatory",
      headerContext: {
        practiceTime: "18:00",
      },
    };

    const summary = facade.buildExactTrainingSummary({
      todayViewModel,
      protocol,
      protocolJson: {
        readiness_score: 77,
        acwr_value: 1.09,
        acwr_presentation: {
          value: 1.09,
          level: "sweet-spot",
          label: "sweet spot",
          text: "ACWR 1.09 · sweet spot",
        },
      } as ProtocolJson,
      metrics: {
        readinessScore: 72,
        acwrValue: 1.42,
        acwrRiskLevel: "elevated-risk",
        hasCheckedInToday: true,
      },
    });

    expect(summary).not.toBeNull();
    expect(summary?.focusLabel).toBe("Practice-day support");
    expect(summary?.blockCount).toBe(2);
    expect(summary?.exerciseCount).toBe(2);
    expect(summary?.estimatedMinutes).toBe(25);
    expect(summary?.videoCount).toBe(1);
    expect(summary?.startBlock).toBe("Morning Mobility");
    expect(summary?.firstExercise).toBe("Hip Flow");
    expect(summary?.readinessText).toBe("77% readiness");
    expect(summary?.acwrText).toBe("ACWR 1.09 · sweet spot");
  });

  it("falls back to live acwr metrics when protocol presentation is unavailable", () => {
    const summary = facade.buildExactTrainingSummary({
      todayViewModel: {
        trainingAllowed: true,
        banners: [],
        blocksDisplayed: ["morning_mobility"],
        merlinPosture: "explanatory",
      },
      protocol: {
        morningMobility: {
          type: "morning_mobility",
          title: "Morning Mobility",
          icon: "pi-sun",
          status: "pending",
          completedCount: 0,
          totalCount: 1,
          progressPercent: 0,
          exercises: [
            {
              id: "pe-1",
              exerciseId: "ex-1",
              blockType: "morning_mobility",
              sequenceOrder: 1,
              prescribedSets: 1,
              status: "pending",
              loadContributionAu: 0,
              exercise: {
                id: "ex-1",
                name: "Hip Flow",
                slug: "hip-flow",
                category: "mobility",
                howText: "Move slowly",
                defaultSets: 1,
                difficultyLevel: "beginner",
                loadContributionAu: 0,
                isHighIntensity: false,
              },
            },
          ],
        },
      },
      protocolJson: {
        readiness_score: 75,
      } as ProtocolJson,
      metrics: {
        readinessScore: 75,
        acwrValue: 1.44,
        acwrRiskLevel: "elevated-risk",
        hasCheckedInToday: true,
      },
    });

    expect(summary?.acwrText).toBe("ACWR 1.44 · elevated");
  });
});
