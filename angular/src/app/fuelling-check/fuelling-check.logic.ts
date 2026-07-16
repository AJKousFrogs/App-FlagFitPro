/**
 * Fuelling self-check — a low-energy-availability / RED-S awareness screen.
 *
 * SAFETY CONTRACT (anti-harm — these are hard rules, tested):
 *  1. The tool NEVER suggests a caloric deficit, weight loss, or eating less.
 *     Under-fuelling is the risk it surfaces; restriction-while-training is a
 *     red flag, not a goal.
 *  2. It NEVER diagnoses. Every flagged result routes the athlete to a human
 *     (the team's nutrition / medical staff). It is educational, not clinical.
 *  3. Youth (< 18) get a fuelling-FOR-GROWTH frame — they need more fuel, not
 *     less — never a restriction message.
 *  4. Nothing is stored (see the component): this is a private self-check, so
 *     no special-category data is created at rest.
 *
 * Male-appropriate item set (this club is 16+ male; LEAF-Q's menstrual items
 * don't apply — items are the general RED-S CAT / low-EA behavioural signs).
 */

export type FuellingWeight = "high" | "general";

export interface FuellingQuestion {
  id: string;
  text: string;
  weight: FuellingWeight;
  /** True when a "yes" is the concerning answer (all items here are yes=concern). */
  concernOnYes: true;
}

export const FUELLING_QUESTIONS: readonly FuellingQuestion[] = [
  {
    id: "restrict",
    text: "I'm deliberately eating less, skipping meals, or cutting food groups to lose weight or ‘lean up’.",
    weight: "high",
    concernOnYes: true,
  },
  {
    id: "unintended_loss",
    text: "My weight has dropped recently without me trying to.",
    weight: "high",
    concernOnYes: true,
  },
  {
    id: "bone",
    text: "I’ve had a stress fracture, or I get recurring bone / shin / foot pain.",
    weight: "high",
    concernOnYes: true,
  },
  {
    id: "under_eat",
    text: "I often train or play while hungry, or I can’t eat enough to refuel after hard sessions.",
    weight: "general",
    concernOnYes: true,
  },
  {
    id: "recovery",
    text: "My recovery between sessions has been getting worse, or I feel constantly drained.",
    weight: "general",
    concernOnYes: true,
  },
  {
    id: "illness",
    text: "I’ve been getting sick (colds, infections) more often than usual.",
    weight: "general",
    concernOnYes: true,
  },
  {
    id: "cold_mood",
    text: "I often feel cold, flat in mood, or low on drive lately.",
    weight: "general",
    concernOnYes: true,
  },
];

export type FuellingLevel = "ok" | "watch" | "talk";

export interface FuellingResult {
  level: FuellingLevel;
  headline: string;
  body: string;
  /** Concise, neutral echo of what the athlete flagged (educational, not a verdict). */
  flagged: string[];
  /** Always true unless level is "ok" — the tool routes to a human for anything real. */
  routeToHuman: boolean;
}

const GROWTH_NOTE =
  "You’re still growing, which means you need MORE fuel than an adult, not less — skipping food now can set back both your development and your game.";

/**
 * Derive the educational result. Pure. `answers` maps question id → yes/no.
 * `isYouth` switches on the fuelling-for-growth frame.
 */
export function deriveFuellingResult(
  answers: Readonly<Record<string, boolean>>,
  isYouth: boolean,
): FuellingResult {
  const yes = (id: string) => answers[id] === true;
  const highFlags = FUELLING_QUESTIONS.filter(
    (q) => q.weight === "high" && yes(q.id),
  );
  const generalFlags = FUELLING_QUESTIONS.filter(
    (q) => q.weight === "general" && yes(q.id),
  );
  const flagged = [...highFlags, ...generalFlags].map((q) => q.text);

  const growth = isYouth ? " " + GROWTH_NOTE : "";

  // Deliberate restriction while training hard is the central driver of RED-S —
  // reframe it as a risk, never endorse it.
  if (yes("restrict")) {
    return {
      level: "talk",
      headline: "Let’s get you fuelled properly",
      body:
        "Cutting food while you train and play this hard is the most common way athletes end up under-fuelled (RED-S) — it quietly costs speed, strength, bone health, recovery and immunity. This isn’t a diagnosis, but please talk to the team’s nutrition or medical staff before restricting further; they can help you fuel for performance." +
        growth,
      flagged,
      routeToHuman: true,
    };
  }

  if (highFlags.length >= 1) {
    return {
      level: "talk",
      headline: "Worth a conversation with the medical team",
      body:
        "A few of your answers — unintended weight loss or bone/stress pain — can be early signs of low energy availability. This screen can’t diagnose anything; please book a chat with the team’s nutrition or medical staff so they can check it properly and help you fuel well." +
        growth,
      flagged,
      routeToHuman: true,
    };
  }

  if (generalFlags.length >= 2) {
    return {
      level: "watch",
      headline: "You may be running low on fuel",
      body:
        "Several answers point to under-fuelling — training hungry, poor recovery, getting sick, feeling cold or flat. The fix is more and better-timed food around training, not less. Add carbs on your bigger days and protein at each meal, and if it doesn’t settle, talk to the team’s nutrition staff." +
        growth,
      flagged,
      routeToHuman: true,
    };
  }

  return {
    level: "ok",
    headline: "No obvious under-fuelling signs",
    body:
      "Nothing here points to a fuelling problem right now. Keep eating enough around training — carbs to match your load and protein at every meal — and re-check if your energy, recovery or mood dip." +
      growth,
    flagged,
    routeToHuman: false,
  };
}

/**
 * Anti-harm guard used by the test suite: ADVICE phrasing that must NEVER appear
 * in the tool's headline/body. Deliberately targets suggestions to restrict —
 * NOT symptom descriptions (e.g. "unintended weight loss" as a warning sign, or
 * "cutting food… is how athletes get under-fuelled" as a reframe, are correct).
 */
export const FORBIDDEN_OUTPUT =
  /\beat(ing)? less\b|\b(calorie|caloric) deficit\b|\bcut (calories|back on food)\b|\b(lose|losing|drop|shed) (some |a bit of |a little )?weight\b|\bslim down\b|\bskip meals? to\b/i;
