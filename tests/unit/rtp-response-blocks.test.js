import { describe, it, expect } from "vitest";
import { transformProtocolResponse } from "../../netlify/functions/utils/daily-protocol-response.js";
import { BLOCK_TYPES } from "../../netlify/functions/utils/daily-protocol-periodization-config.js";

/**
 * P1b regression: the RTP generator writes block_type 'rehab_progression' and
 * 'evening_mobility' rows (allowed by the DB CHECK since 20260328), but the
 * response transformer silently DROPPED them — an injured athlete's Training
 * screen showed "No specific exercises" while the rehab session sat in the DB.
 */

const protocol = {
  id: "p1",
  user_id: "u1",
  protocol_date: "2026-07-12",
  readiness_score: 40,
  acwr_value: null,
  training_focus: "return_to_play_phase_2",
  ai_rationale: "RTP",
};

const pe = (blockType, name) => ({
  block_type: blockType,
  exercise_name: name,
  prescribed_sets: 2,
  prescribed_reps: 10,
  status: "pending",
  exercises: null,
});

describe("transformProtocolResponse: RTP block types (P1b)", () => {
  const data = transformProtocolResponse(
    protocol,
    [
      pe("morning_mobility", "Gentle Mobility"),
      pe("rehab_progression", "Isometric Calf Hold"),
      pe("conditioning", "Bike Easy"),
      pe("evening_mobility", "Evening Stretch"),
    ],
    null,
    null,
    null,
    { blockTypes: BLOCK_TYPES },
  );

  it("keeps rehab_progression rows and exposes the rehabProgression block", () => {
    expect(data.rehabProgression.exercises).toHaveLength(1);
    expect(data.rehabProgression.exercises[0].exercise.name).toBe(
      "Isometric Calf Hold",
    );
  });

  it("keeps evening_mobility rows and exposes the eveningMobility block", () => {
    expect(data.eveningMobility.exercises).toHaveLength(1);
  });

  it("lists both RTP blocks in the blocks array", () => {
    const types = data.blocks.map((b) => b.type);
    expect(types).toContain("rehab_progression");
    expect(types).toContain("evening_mobility");
  });

  it("flags the protocol as return-to-play from training_focus", () => {
    expect(data.is_return_to_play).toBe(true);
  });

  it("normal protocols are not flagged as return-to-play", () => {
    const normal = transformProtocolResponse(
      { ...protocol, training_focus: "strength" },
      [pe("strength", "Split Squat")],
      null,
      null,
      null,
      { blockTypes: BLOCK_TYPES },
    );
    expect(normal.is_return_to_play).toBe(false);
    expect(normal.strength.exercises).toHaveLength(1);
  });
});
