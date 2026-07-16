import { describe, it, expect } from "vitest";
import { fuelBucket, fuelBucketLabel, fuelIdeas } from "./nutrition.util";
import type { NutritionTargets } from "../core/models/prescription.models";

const targets = (over: Partial<NutritionTargets> = {}): NutritionTargets => ({
  carbsG: 400,
  proteinG: 130,
  hydrationL: 2.5,
  rationale: "test",
  ...over,
});

describe("nutrition.util", () => {
  it("maps intents to the right fuel bucket", () => {
    expect(fuelBucket("competition")).toBe("game");
    expect(fuelBucket("rest")).toBe("steady");
    expect(fuelBucket("recovery")).toBe("steady");
    expect(fuelBucket("mobility")).toBe("steady");
    expect(fuelBucket("travel")).toBe("steady");
    expect(fuelBucket("strength")).toBe("load");
    expect(fuelBucket("sprint")).toBe("load");
    expect(fuelBucket("mixed")).toBe("load");
    expect(fuelBucket("technical")).toBe("load");
    expect(fuelBucket("taper-prime")).toBe("load");
  });

  it("labels every bucket", () => {
    expect(fuelBucketLabel(fuelBucket("competition"))).toBe("Game fuel");
    expect(fuelBucketLabel(fuelBucket("strength"))).toBe("Training fuel");
    expect(fuelBucketLabel(fuelBucket("rest"))).toBe("Steady day");
  });

  it("gives game-day fuelling for a game", () => {
    const ideas = fuelIdeas("competition", targets());
    expect(ideas.some((s) => /kickoff/i.test(s))).toBe(true);
  });

  it("gives training-day fuelling for a load day", () => {
    const ideas = fuelIdeas("strength", targets());
    expect(ideas.some((s) => /rice, pasta or potato/i.test(s))).toBe(true);
  });

  it("goes lighter on starch for a steady day", () => {
    const ideas = fuelIdeas("rest", targets());
    expect(ideas.some((s) => /vegetables/i.test(s))).toBe(true);
  });

  it("adds the salt/sip line only when hydration target is high", () => {
    expect(
      fuelIdeas("strength", targets({ hydrationL: 2 })).some((s) =>
        /pinch of salt/i.test(s),
      ),
    ).toBe(false);
    expect(
      fuelIdeas("strength", targets({ hydrationL: 3.4 })).some((s) =>
        /pinch of salt/i.test(s),
      ),
    ).toBe(true);
  });

  it("never invents grams — it only reframes the engine's targets", () => {
    // The helper takes targets in and returns only prose; it must not echo a
    // fabricated macro number that wasn't given.
    const ideas = fuelIdeas("strength", targets({ carbsG: 999 }));
    expect(ideas.join(" ")).not.toContain("999");
  });
});
