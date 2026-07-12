import { createLogger } from "./structured-logger.js";

const logger = createLogger({ service: "netlify.daily-protocol" });

// Maps the protocol's canonical block categories to the actual `category` values
// queried for each. As of 2026-07-12 the library is normalized to a SINGLE
// lowercase value per section (legacy TitleCase `Strength`/`Isometric`/`Speed`/
// `Power`/`Agility`/`Position-Specific` were merged into their lowercase
// canonicals), so these lists are lowercase-only. A block may intentionally pull
// from an adjacent section (isometrics also draws from strength; plyometrics from
// power; conditioning from speed; skill_drills from agility) as a depth fallback.
const EXERCISE_CATEGORY_ALIASES = {
  isometrics: ["isometrics", "strength"],
  plyometrics: ["plyometrics", "power"],
  strength: ["strength"],
  conditioning: ["conditioning", "speed"],
  skill_drills: ["skill_drills", "agility"],
};

function dedupeExercisesById(exercises) {
  const seen = new Set();
  return (exercises || []).filter((exercise) => {
    const key = exercise?.id;
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function includesKeyword(value, keywords) {
  const normalized = `${value || ""}`.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function prioritizeExercises(exercises, keywords, fallbackCount = 5) {
  const pool = dedupeExercisesById(exercises);
  const preferred = pool.filter((exercise) =>
    keywords.some((keyword) =>
      includesKeyword(
        `${exercise?.name || ""} ${exercise?.slug || ""} ${exercise?.movement_pattern || ""} ${exercise?.subcategory || ""}`,
        [keyword],
      ),
    ),
  );

  if (preferred.length >= fallbackCount) {
    return preferred;
  }

  const preferredIds = new Set(preferred.map((exercise) => exercise.id));
  return preferred.concat(
    pool.filter((exercise) => !preferredIds.has(exercise.id)),
  );
}

async function fetchExercisesByCategories(
  supabase,
  categories,
  limit = 20,
  log = logger,
) {
  const normalizedCategories = [...new Set(categories.filter(Boolean))];
  if (normalizedCategories.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .in("category", normalizedCategories)
    .eq("active", true)
    .limit(limit);

  if (error) {
    log.warn(
      "daily_protocol_exercise_category_fetch_failed",
      {
        categories: normalizedCategories,
        limit,
      },
      error,
    );
    return [];
  }

  return Array.isArray(data) ? data : [];
}

// Deterministic per-athlete ordering key (FNV-1a hash of `seed:id`) so exercise
// variety is stable within a day but differs across athletes/days.
function seededOrderKey(seed, ex) {
  const id = ex?.id ?? ex?.name ?? ex?.exercise_name ?? "";
  const s = `${seed}:${id}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export {
  EXERCISE_CATEGORY_ALIASES,
  prioritizeExercises,
  fetchExercisesByCategories,
  seededOrderKey,
};
