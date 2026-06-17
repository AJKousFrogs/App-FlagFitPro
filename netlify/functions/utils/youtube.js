const YOUTUBE_ID_PATTERN =
  /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i;

// Fallback video IDs for exercises that have no video_url/video_id in the DB.
// Keys are normalized exercise names (lowercase, parens stripped, non-alphanum → space).
// These IDs match the exercises table video_id values where available,
// so the client always sees a video even for inline/fallback exercise pushes.
const CURATED_DRILL_VIDEO_IDS = {
  // ── Morning Mobility (day-specific, Mon–Sun) ──────────────────────────────
  "morning mobility": "IWNnTJFwi3s",
  "morning mobility monday": "IWNnTJFwi3s",
  "morning mobility day 1": "IWNnTJFwi3s",   // Monday  — full body activation
  "morning mobility tuesday": "eFgqVbDe5Ps",
  "morning mobility day 2": "eFgqVbDe5Ps",   // Tuesday — hip & groin (pre-speed)
  "morning mobility wednesday": "FGIGlBUFbKc",
  "morning mobility day 3": "FGIGlBUFbKc",   // Wednesday — thoracic & shoulder
  "morning mobility thursday": "ghwdVE4xn-U",
  "morning mobility day 4": "ghwdVE4xn-U",   // Thursday — ankle & calf (pre-practice)
  "morning mobility friday": "v_ZnFMgCiAg",
  "morning mobility day 5": "v_ZnFMgCiAg",   // Friday — hip 90/90 active recovery
  "morning mobility saturday": "8dIHS_UVfQ4",
  "morning mobility day 6": "8dIHS_UVfQ4",   // Saturday — dynamic sprint prep
  "morning mobility sunday": "qZ_KgFnRlhI",
  "morning mobility day 7": "qZ_KgFnRlhI",   // Sunday — restorative parasympathetic

  // ── Warm-up drills ────────────────────────────────────────────────────────
  "a skips": "pWe7vofsMaU",
  "a-skips": "pWe7vofsMaU",
  "b skips": "pWe7vofsMaU",
  "leg swings front to back": "u4-FjJHALlQ",
  "leg swings front back": "u4-FjJHALlQ",
  "leg swings": "u4-FjJHALlQ",
  "lateral shuffles": "FBOzDnSCOCQ",
  "lateral shuffle": "FBOzDnSCOCQ",
  "arm circles": "ZwKYdXQvk6U",
  "high knees": "pWe7vofsMaU",
  "butt kicks": "pWe7vofsMaU",
  "inchworm": "8dIHS_UVfQ4",
  "walking lunge": "8dIHS_UVfQ4",
  "ramp protocol": "7-NzseCtyAo",
  "dynamic warm up": "X_OS_EtOHZ4",
  "dynamic warmup": "X_OS_EtOHZ4",
  "wr db dynamic warm up": "LaxlMu8YQUY",
  "wr db dynamic warmup": "LaxlMu8YQUY",

  // ── Foam rolling ─────────────────────────────────────────────────────────
  "calf foam roll": "gfMZBbxLlyw",
  "hamstring foam roll": "LB2V2jVHudc",
  "quad foam roll": "TCM4rPa9pgs",
  "upper back foam roll": "k8nBhaSJIhE",
  "it band foam roll": "TCM4rPa9pgs",
  "glute foam roll": "LB2V2jVHudc",
  "post massage active recovery": "bsK2mCYocSw",

  // ── Cool-down ─────────────────────────────────────────────────────────────
  "walking cool down": "paqAzWbLIUw",
  "standing calf stretch": "9PjqDtVwXwU",
  "hip flexor stretch": "v_ZnFMgCiAg",
  "quad stretch": "9PjqDtVwXwU",
  "hamstring stretch": "LB2V2jVHudc",
  "child s pose": "qZ_KgFnRlhI",
  "childs pose": "qZ_KgFnRlhI",

  // ── Flexibility / mobility ────────────────────────────────────────────────
  "hip mobility sequence": "eFgqVbDe5Ps",
  "hip flow": "eFgqVbDe5Ps",
  "hip mobility flow": "eFgqVbDe5Ps",
  "hip 90 90 stretch sequence": "v_ZnFMgCiAg",
  "hip 90 90": "v_ZnFMgCiAg",
  "thoracic rotation drills": "FGIGlBUFbKc",
  "thoracic spine mobility": "FGIGlBUFbKc",
  "ankle mobility sequence": "ghwdVE4xn-U",
  "ankle mobility": "ghwdVE4xn-U",

  // ── Strength ──────────────────────────────────────────────────────────────
  "nordic hamstring curl": "GUg_MHqxFZ8",
  "nordic curl": "GUg_MHqxFZ8",
  "nordic": "GUg_MHqxFZ8",
  "bulgarian split squat": "2C-uNgKwPLE",
  "split squat": "2C-uNgKwPLE",
  "copenhagen plank": "Pk6P-q1UYYI",
  "copenhagen": "Pk6P-q1UYYI",
  "front squat": "jWMzLJzYqUE",
  "glute activation circuit": "eIcIJ5oq_9U",
  "glute bridge": "eIcIJ5oq_9U",
  "hip thrust": "eIcIJ5oq_9U",
  "goblet squat": "MeIiIdhvXT4",
  "half kneeling pallof press": "AThVe2U51E8",
  "pallof press": "AThVe2U51E8",
  "landmine press": "VJPvjuXVlKA",
  "lateral lunge": "Ic9fFCHOtmk",
  "scapular activation": "zJiNB0cFyuI",
  "single leg romanian deadlift": "G9GTnSmBpC8",
  "single leg rdl": "G9GTnSmBpC8",
  "rdl": "G9GTnSmBpC8",
  "trap bar deadlift": "JtNQYfOGLYo",
  "deadlift": "JtNQYfOGLYo",

  // ── Plyometrics / power ───────────────────────────────────────────────────
  "lateral bound": "XFEjeiQfhOs",
  "lateral bounds": "XFEjeiQfhOs",
  "skater jumps": "oVhPRHlwuDI",
  "skater jump": "oVhPRHlwuDI",
  "single leg hop forward": "bG9TIW87bqg",
  "single leg hop": "bG9TIW87bqg",
  "unilateral jump series": "bG9TIW87bqg",
  "box jump": "bG9TIW87bqg",
  "broad jump": "XFEjeiQfhOs",
  "power skip": "pWe7vofsMaU",
  "medicine ball throws": "VNHEuCjuaAI",
  "medicine ball throw": "VNHEuCjuaAI",
  "medicine ball": "VNHEuCjuaAI",

  // ── Speed / sprint ────────────────────────────────────────────────────────
  "10 yard burst": "ZBqaHBDyF2k",
  "10 yard dash": "ZBqaHBDyF2k",
  "3 step acceleration drill": "vJRLJbLiRdo",
  "acceleration drill": "vJRLJbLiRdo",
  "deceleration drill": "uOvmzs6FGMM",
  "flying 20m sprint": "I8O4YULZ0ls",
  "flying 30m sprint": "I8O4YULZ0ls",
  "flying sprint": "I8O4YULZ0ls",
  "hill sprint short": "O7ZRKuuvYdU",
  "hill sprint": "O7ZRKuuvYdU",
  "resisted sprint band": "wR4hn-uT5eM",
  "resisted sprint": "wR4hn-uT5eM",

  // ── Agility ───────────────────────────────────────────────────────────────
  "l drill 3 cone": "kJuHdC68U0Y",
  "l drill": "kJuHdC68U0Y",
  "3 cone drill": "kJuHdC68U0Y",
  "pro agility 5 10 5": "wAn7kH6f_rw",
  "pro agility": "wAn7kH6f_rw",
  "5 10 5": "wAn7kH6f_rw",
  "reactive mirror drill": "UXdJV5pMy0A",
  "mirror drill": "UXdJV5pMy0A",
  "cone drills": "swPWW_WmhCU",

  // ── Position-specific ─────────────────────────────────────────────────────
  "backpedal technique drill": "JnCFxNrK4OA",
  "backpedal": "JnCFxNrK4OA",
  "progressive throwing sequence": "k5E-L8CLQLQ",
  "throwing volume session": "k5E-L8CLQLQ",
  "throwing volume": "k5E-L8CLQLQ",
  "qb arm care routine": "RWPOU9RCTCY",
  "qb arm care": "RWPOU9RCTCY",
  "arm care": "RWPOU9RCTCY",
  "route tree practice slant in": "tYVHjFzqA3s",
  "route tree": "tYVHjFzqA3s",
  "slant route": "tYVHjFzqA3s",
  "wr route running": "3KYlmfGrh5A",
  "route running": "UQBexmumJQo",
  "db coverage drills": "pdD-YeROIUQ",
  "db drills": "saXz9Gi5AVI",
  "wide receiver drills": "3KYlmfGrh5A",
  "wr drills": "3KYlmfGrh5A",

  // ── Conditioning ──────────────────────────────────────────────────────────
  "shuttle run": "gc-Zrp6SyNc",
  "400m repeats": "KlLpde1qcLs",
  "tempo run": "KlLpde1qcLs",
  "conditioning circuit": "763pUAkLfWU",
  "nfl flag conditioning": "763pUAkLfWU",
};

function normalizeDrillName(name) {
  if (!name || typeof name !== "string") {
    return null;
  }

  const normalized = name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  return normalized || null;
}

export function resolveCuratedDrillVideoId(exerciseName) {
  const normalized = normalizeDrillName(exerciseName);
  if (!normalized) {
    return null;
  }

  return CURATED_DRILL_VIDEO_IDS[normalized] || null;
}

export function extractYouTubeVideoId(url) {
  if (!url || typeof url !== "string") {
    return null;
  }

  const match = url.match(YOUTUBE_ID_PATTERN);
  return match ? match[1] : null;
}

export function buildYouTubeWatchUrl(videoId) {
  if (!videoId) {
    return null;
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function buildYouTubeThumbnailUrl(videoId) {
  if (!videoId) {
    return null;
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function resolveYouTubeVideoMetadata({
  videoId = null,
  videoUrl = null,
  thumbnailUrl = null,
  exerciseName = null,
} = {}) {
  const resolvedVideoId =
    videoId || extractYouTubeVideoId(videoUrl) || resolveCuratedDrillVideoId(exerciseName);
  const resolvedVideoUrl = videoUrl || buildYouTubeWatchUrl(resolvedVideoId);
  const resolvedThumbnailUrl =
    thumbnailUrl || buildYouTubeThumbnailUrl(resolvedVideoId);

  return {
    videoId: resolvedVideoId,
    videoUrl: resolvedVideoUrl,
    thumbnailUrl: resolvedThumbnailUrl,
  };
}
