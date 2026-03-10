function computeOverride({
  rehabActive,
  injuries,
  coachAlertActive,
  weatherOverride,
  teamActivity,
  taperActive,
  taperContext,
}) {
  if (rehabActive) {
    return {
      type: "rehab_protocol",
      reason:
        injuries && injuries.length > 0
          ? `Active injury protocol: ${injuries.join(", ")}`
          : "Return-to-Play protocol active",
      replaceSession: true,
    };
  }

  if (coachAlertActive) {
    return {
      type: "coach_alert",
      reason: "Coach alert active - check coach notes",
      replaceSession: false,
    };
  }

  if (weatherOverride) {
    return {
      type: "weather_override",
      reason: "Weather conditions prevent normal training",
      replaceSession: true,
    };
  }

  if (teamActivity && teamActivity.participation !== "excluded") {
    if (teamActivity.type === "practice") {
      return {
        type: "flag_practice",
        reason: `Team practice scheduled at ${teamActivity.startTimeLocal || "18:00"}`,
        replaceSession: teamActivity.replacesSession !== false,
      };
    }
    if (teamActivity.type === "film_room") {
      return {
        type: "film_room",
        reason: `Film room scheduled at ${teamActivity.startTimeLocal || "10:00"}`,
        replaceSession: teamActivity.replacesSession !== false,
      };
    }
  }

  if (taperActive && taperContext) {
    return {
      type: "taper",
      reason: `Taper for ${taperContext.tournament?.name || "upcoming tournament"} (${taperContext.daysUntil} days)`,
      replaceSession: false,
    };
  }

  return null;
}

function calculateAge(birthDate) {
  if (!birthDate) {
    return null;
  }

  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const POSITION_TO_MODIFIER_KEY = {
  QB: "quarterback",
  WR: "wr_db",
  DB: "wr_db",
  Center: "center",
  Rusher: "rusher",
  Blitzer: "blitzer",
  LB: "linebacker",
  Hybrid: "hybrid",
  Quarterback: "quarterback",
  "Wide Receiver": "wr_db",
  "Defensive Back": "wr_db",
  Safety: "wr_db",
  Cornerback: "wr_db",
  Linebacker: "linebacker",
  quarterback: "quarterback",
  wr_db: "wr_db",
  center: "center",
  rusher: "rusher",
  blitzer: "blitzer",
  linebacker: "linebacker",
  hybrid: "hybrid",
  "wide receiver": "wr_db",
  "defensive back": "wr_db",
  safety: "wr_db",
  cornerback: "wr_db",
};

function normalizePosition(position) {
  if (!position) {
    return "wr_db";
  }
  return POSITION_TO_MODIFIER_KEY[position] || "wr_db";
}

export { calculateAge, computeOverride, normalizePosition };
