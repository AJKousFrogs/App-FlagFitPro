import {
  buildWarmupTemplate,
  selectWarmupVariant,
  WARMUP_TARGET_SECONDS,
} from "./daily-protocol-training-logic.js";

const FALLBACK_EXERCISES = {
  morning_mobility: [
    {
      name: "Morning Mobility - Day 1 (Monday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf",
      duration_seconds: 600,
    },
    {
      name: "Morning Mobility - Day 2 (Tuesday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=2",
      duration_seconds: 600,
    },
    {
      name: "Morning Mobility - Day 3 (Wednesday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=3",
      duration_seconds: 600,
    },
    {
      name: "Morning Mobility - Day 4 (Thursday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=4",
      duration_seconds: 600,
    },
    {
      name: "Morning Mobility - Day 5 (Friday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=5",
      duration_seconds: 600,
    },
    {
      name: "Morning Mobility - Day 6 (Saturday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=6",
      duration_seconds: 600,
    },
    {
      name: "Morning Mobility - Day 7 (Sunday)",
      video_url:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=7",
      duration_seconds: 600,
    },
  ],
  foam_roll: [
    { name: "IT Band Roll", sets: 1, duration_seconds: 60, note: "Foam roll outer thigh from hip to knee" },
    { name: "Quad Roll", sets: 1, duration_seconds: 60, note: "Foam roll front of thigh" },
    { name: "Glute Roll", sets: 1, duration_seconds: 60, note: "Foam roll glute muscles" },
    { name: "Hamstring Roll", sets: 1, duration_seconds: 60, note: "Foam roll back of thigh" },
    { name: "Calf Roll", sets: 1, duration_seconds: 60, note: "Foam roll calf muscles" },
    { name: "Thoracic Spine Roll", sets: 1, duration_seconds: 60, note: "Foam roll upper back" },
    { name: "Lat Roll", sets: 1, duration_seconds: 60, note: "Foam roll side of back" },
    { name: "Adductor Roll", sets: 1, duration_seconds: 60, note: "Foam roll inner thigh" },
  ],
  warm_up: [
    { name: "Jumping Jacks", sets: 2, reps: 20, note: "Full range of motion" },
    { name: "High Knees", sets: 2, duration_seconds: 30, note: "Drive knees up, pump arms" },
    { name: "Butt Kicks", sets: 2, duration_seconds: 30, note: "Heels to glutes" },
    { name: "Leg Swings (Forward/Back)", sets: 2, reps: 10, note: "Each leg, controlled swing" },
    { name: "Leg Swings (Side to Side)", sets: 2, reps: 10, note: "Each leg, open hips" },
    { name: "Walking Lunges", sets: 2, reps: 10, note: "Each leg, torso upright" },
    { name: "A-Skips", sets: 2, reps: 10, note: "Each leg, drive knee up" },
    { name: "B-Skips", sets: 2, reps: 10, note: "Each leg, extend leg forward" },
    { name: "Carioca", sets: 2, duration_seconds: 30, note: "Lateral crossover movement" },
    { name: "Inchworm", sets: 2, reps: 6, note: "Walk hands out to plank, walk feet to hands" },
  ],
  isometrics: [
    { name: "Wall Sit", sets: 3, hold_seconds: 45, note: "Back flat against wall, thighs parallel. Builds quad tendon resilience." },
    { name: "Single-Leg Wall Sit", sets: 3, hold_seconds: 30, note: "Each leg. Addresses asymmetry." },
    { name: "Isometric Lunge Hold", sets: 3, hold_seconds: 30, note: "Each leg at 90°. Hip flexor/quad." },
    { name: "Isometric Calf Raise", sets: 3, hold_seconds: 30, note: "Hold at top of calf raise. Achilles health." },
    { name: "Isometric Hip Adduction", sets: 3, hold_seconds: 20, note: "Squeeze ball between knees. Groin injury prevention." },
    { name: "Isometric Hip Abduction", sets: 3, hold_seconds: 20, note: "Press out against band. Hip stability." },
    { name: "Plank Hold", sets: 3, hold_seconds: 45, note: "Core stability. Maintain neutral spine." },
    { name: "Side Plank Hold", sets: 3, hold_seconds: 30, note: "Each side. Lateral core strength." },
    { name: "Copenhagen Adductor Hold", sets: 3, hold_seconds: 20, note: "Each side. Groin injury prevention (65% reduction)." },
  ],
  plyometrics: [
    { name: "Pogo Jumps", sets: 3, reps: 10, note: "Ankle stiffness. Minimal ground contact time." },
    { name: "Box Jumps", sets: 3, reps: 5, note: "Explosive hip extension. Step down." },
    { name: "Broad Jumps", sets: 3, reps: 5, note: "Horizontal power. Stick landing." },
    { name: "Single-Leg Bounds", sets: 3, reps: 5, note: "Each leg. Power + stability." },
    { name: "Lateral Bounds", sets: 3, reps: 5, note: "Each side. Change of direction power." },
    { name: "Depth Drops", sets: 3, reps: 3, note: "Step off box, absorb landing. Landing mechanics." },
    { name: "Hurdle Hops", sets: 3, reps: 6, note: "Continuous over mini hurdles." },
    { name: "Medicine Ball Slams", sets: 3, reps: 8, note: "Overhead to ground. Full body power." },
    { name: "Skater Jumps", sets: 3, reps: 8, note: "Lateral bound with arm drive." },
  ],
  strength: [
    { name: "Nordic Curls", sets: 3, reps: 5, note: "Eccentric hamstring. 51% injury reduction (Al Attar et al.). Control descent." },
    { name: "Copenhagen Side Plank Lifts", sets: 3, reps: 8, note: "Each side. Groin injury prevention (65% reduction)." },
    { name: "Bulgarian Split Squat", sets: 3, reps: 8, note: "Each leg. Single-leg strength + balance." },
    { name: "Single-Leg RDL", sets: 3, reps: 8, note: "Each leg. Posterior chain + balance." },
    { name: "Glute Bridge March", sets: 3, reps: 10, note: "Alternating. Hip stability + strength." },
    { name: "Single-Leg Calf Raise", sets: 3, reps: 12, note: "Each leg. Achilles/calf resilience." },
    { name: "Banded Monster Walk", sets: 3, reps: 10, note: "Each direction. Hip abductor strength." },
    { name: "Pallof Press", sets: 3, reps: 10, note: "Each side. Anti-rotation core." },
    { name: "Bird Dog", sets: 3, reps: 8, note: "Each side. Core stability + spinal health." },
  ],
  conditioning: [
    { name: "Sprint Intervals (20yd)", sets: 6, reps: 1, note: "85% effort. Walk back recovery." },
    { name: "Pro Agility Drill (5-10-5)", sets: 4, reps: 1, note: "Max effort. 90s rest between." },
    { name: "Tempo Runs (100yd)", sets: 4, reps: 1, note: "75% effort. Aerobic base." },
    { name: "Shuttle Runs", sets: 4, reps: 1, note: "10-20-30-20-10yd. Change of direction." },
    { name: "Lateral Shuffles", sets: 4, duration_seconds: 30, note: "Each direction. Defensive movement." },
    { name: "Backpedal + Sprint", sets: 4, reps: 1, note: "DB coverage simulation." },
    { name: "Cone Drills (L-Drill)", sets: 4, reps: 1, note: "Agility and change of direction." },
    { name: "Star Drill", sets: 3, reps: 1, note: "Multi-directional agility." },
  ],
  skill: [
    { name: "Route Running - Quick Outs", sets: 4, reps: 3, note: "Sharp cuts at 75% speed." },
    { name: "Route Running - Slants", sets: 4, reps: 3, note: "Burst off the line, precise angle." },
    { name: "Backpedal Breaks", sets: 4, reps: 3, note: "DB technique. React and drive." },
    { name: "Flag Pull Drills", sets: 3, reps: 6, note: "Technique practice. Track hips." },
    { name: "Catching Drills - High Point", sets: 3, reps: 5, note: "Jump and catch at highest point." },
    { name: "Reaction Ball Drills", sets: 3, duration_seconds: 60, note: "Hand-eye coordination." },
    { name: "Agility Ladder", sets: 3, reps: 2, note: "Quick feet patterns." },
  ],
  cool_down: [
    { name: "Static Hamstring Stretch", sets: 1, hold_seconds: 30, note: "Each leg. Breathe deeply." },
    { name: "Static Quad Stretch", sets: 1, hold_seconds: 30, note: "Each leg. Hold foot behind." },
    { name: "Static Hip Flexor Stretch", sets: 1, hold_seconds: 30, note: "Each leg. Kneeling lunge." },
    { name: "90/90 Hip Stretch", sets: 1, hold_seconds: 30, note: "Each side. Hip external rotation." },
    { name: "Pigeon Pose", sets: 1, hold_seconds: 30, note: "Each side. Glute/hip opener." },
    { name: "Child's Pose", sets: 1, hold_seconds: 60, note: "Breathe and relax. Back stretch." },
    { name: "Seated Spinal Twist", sets: 1, hold_seconds: 30, note: "Each side. Spine mobility." },
    { name: "Cat-Cow Stretch", sets: 1, reps: 10, note: "Slow and controlled. Spine mobility." },
  ],
  recovery: [
    { name: "Diaphragmatic Breathing", sets: 1, duration_seconds: 180, note: "4s inhale, 4s hold, 6s exhale. Parasympathetic activation." },
    { name: "Legs Up The Wall", sets: 1, duration_seconds: 300, note: "Venous return. Recovery promotion." },
    { name: "Self-Massage with Ball", sets: 1, duration_seconds: 180, note: "Target tight areas. Myofascial release." },
    { name: "Gentle Walking", sets: 1, duration_seconds: 300, note: "Light movement. Blood flow promotion." },
  ],
};

export async function generateFallbackProtocolExercises(
  protocolId,
  dayOfYear,
  weekNumber,
  trainingFocus,
  context,
  isPracticeDay,
  isFilmRoomDay,
  readinessForLogic,
) {
  const exercises = [];
  let sequenceOrder = 0;

  const seededShuffle = (arr, seed) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor((Math.sin(seed + i) * 10000 + 0.5) % (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const seed = dayOfYear + weekNumber * 7;
  const dayOfWeek = context?.dayOfWeek ?? new Date().getDay();
  const mobilityIdx = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mobilityExercise =
    FALLBACK_EXERCISES.morning_mobility[mobilityIdx] ||
    FALLBACK_EXERCISES.morning_mobility[0];

  sequenceOrder++;
  exercises.push({
    protocol_id: protocolId,
    exercise_id: null,
    exercise_name: mobilityExercise.name,
    block_type: "morning_mobility",
    sequence_order: sequenceOrder,
    prescribed_sets: 1,
    prescribed_duration_seconds: mobilityExercise.duration_seconds,
    video_url: mobilityExercise.video_url,
    ai_note: `📱 ${mobilityExercise.name} - Follow along with the YouTube video`,
  });

  seededShuffle(FALLBACK_EXERCISES.foam_roll, seed)
    .slice(0, 5)
    .filter(Boolean)
    .forEach((ex) => {
      sequenceOrder++;
      exercises.push({
        protocol_id: protocolId,
        exercise_id: null,
        exercise_name: ex.name,
        block_type: "foam_roll",
        sequence_order: sequenceOrder,
        prescribed_sets: ex.sets || 1,
        prescribed_duration_seconds: ex.duration_seconds,
        ai_note: ex.note,
      });
    });

  const isSprintSession =
    context?.dayOfWeek === 6 ||
    trainingFocus?.toLowerCase().includes("speed") ||
    trainingFocus?.toLowerCase().includes("sprint");
  const isFitnessDay =
    !isPracticeDay &&
    !isFilmRoomDay &&
    ["strength", "power", "conditioning", "gym", "fitness", "weights"].includes(
      trainingFocus?.toLowerCase() || "",
    );

  const warmupVariant = selectWarmupVariant({
    isFitnessDay,
    isSprintSession,
    isPracticeDay,
    trainingFocus,
  });

  const warmupPlan = buildWarmupTemplate({
    variant: warmupVariant,
    isQB: context.isQB,
    isCenter: context.isCenter,
    warmupFocus: context.warmupFocus,
  });

  const warmupTotalSeconds = warmupPlan.reduce(
    (sum, item) => sum + (item.durationSeconds || 0),
    0,
  );

  if (warmupTotalSeconds !== WARMUP_TARGET_SECONDS) {
    console.warn(
      `[daily-protocol] Warm-up plan totals ${warmupTotalSeconds}s (target ${WARMUP_TARGET_SECONDS}s)`,
    );
  }

  warmupPlan.forEach((item) => {
    sequenceOrder++;
    exercises.push({
      protocol_id: protocolId,
      exercise_id: null,
      exercise_name: item.name,
      block_type: "warm_up",
      sequence_order: sequenceOrder,
      prescribed_sets: item.sets || 1,
      prescribed_reps: item.reps || null,
      prescribed_duration_seconds: item.durationSeconds || null,
      ai_note: item.note,
    });
  });

  const isGymTrainingDay =
    !isPracticeDay && !isFilmRoomDay && trainingFocus !== "recovery";

  if (isGymTrainingDay) {
    seededShuffle(FALLBACK_EXERCISES.isometrics, seed + 2)
      .slice(0, 5)
      .filter(Boolean)
      .forEach((ex) => {
        sequenceOrder++;
        exercises.push({
          protocol_id: protocolId,
          exercise_id: null,
          exercise_name: ex.name,
          block_type: "isometrics",
          sequence_order: sequenceOrder,
          prescribed_sets: ex.sets || 3,
          prescribed_hold_seconds: ex.hold_seconds,
          ai_note: `📊 ${ex.note}`,
        });
      });

    const plyoCount = readinessForLogic >= 70 ? 4 : 3;
    seededShuffle(FALLBACK_EXERCISES.plyometrics, seed + 3)
      .slice(0, plyoCount)
      .filter(Boolean)
      .forEach((ex) => {
        sequenceOrder++;
        exercises.push({
          protocol_id: protocolId,
          exercise_id: null,
          exercise_name: ex.name,
          block_type: "plyometrics",
          sequence_order: sequenceOrder,
          prescribed_sets: ex.sets || 3,
          prescribed_reps: ex.reps,
          ai_note: `⚡ ${ex.note}`,
        });
      });

    seededShuffle(FALLBACK_EXERCISES.strength, seed + 4)
      .slice(0, 5)
      .filter(Boolean)
      .forEach((ex) => {
        sequenceOrder++;
        exercises.push({
          protocol_id: protocolId,
          exercise_id: null,
          exercise_name: ex.name,
          block_type: "strength",
          sequence_order: sequenceOrder,
          prescribed_sets: ex.sets || 3,
          prescribed_reps: ex.reps,
          ai_note: `💪 ${ex.note}`,
        });
      });

    seededShuffle(FALLBACK_EXERCISES.conditioning, seed + 5)
      .slice(0, 4)
      .filter(Boolean)
      .forEach((ex) => {
        sequenceOrder++;
        exercises.push({
          protocol_id: protocolId,
          exercise_id: null,
          exercise_name: ex.name,
          block_type: "conditioning",
          sequence_order: sequenceOrder,
          prescribed_sets: ex.sets || 4,
          prescribed_reps: ex.reps,
          prescribed_duration_seconds: ex.duration_seconds,
          ai_note: `🏃 ${ex.note}`,
        });
      });

    seededShuffle(FALLBACK_EXERCISES.skill, seed + 6)
      .slice(0, 3)
      .filter(Boolean)
      .forEach((ex) => {
        sequenceOrder++;
        exercises.push({
          protocol_id: protocolId,
          exercise_id: null,
          exercise_name: ex.name,
          block_type: "skill_drills",
          sequence_order: sequenceOrder,
          prescribed_sets: ex.sets || 3,
          prescribed_reps: ex.reps,
          prescribed_duration_seconds: ex.duration_seconds,
          ai_note: `🎯 ${ex.note}`,
        });
      });
  }

  seededShuffle(FALLBACK_EXERCISES.cool_down, seed + 7)
    .slice(0, 5)
    .filter(Boolean)
    .forEach((ex) => {
      sequenceOrder++;
      exercises.push({
        protocol_id: protocolId,
        exercise_id: null,
        exercise_name: ex.name,
        block_type: "cool_down",
        sequence_order: sequenceOrder,
        prescribed_sets: ex.sets || 1,
        prescribed_reps: ex.reps,
        prescribed_hold_seconds: ex.hold_seconds,
        ai_note: `🧘 ${ex.note}`,
      });
    });

  const recoveryCount = trainingFocus === "recovery" ? 4 : 2;
  seededShuffle(FALLBACK_EXERCISES.recovery, seed + 8)
    .slice(0, recoveryCount)
    .filter(Boolean)
    .forEach((ex) => {
      sequenceOrder++;
      exercises.push({
        protocol_id: protocolId,
        exercise_id: null,
        exercise_name: ex.name,
        block_type: "evening_recovery",
        sequence_order: sequenceOrder,
        prescribed_sets: ex.sets || 1,
        prescribed_duration_seconds: ex.duration_seconds,
        ai_note: `😴 ${ex.note}`,
      });
    });

  console.log(
    `[daily-protocol] Generated ${exercises.length} fallback exercises for day ${dayOfYear} (week ${weekNumber})`,
  );

  return exercises;
}
