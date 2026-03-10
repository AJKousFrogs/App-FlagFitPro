export interface TrainingPositionQuickAction {
  icon: string;
  label: string;
  route: string;
  tooltip: string;
}

export interface TrainingPositionWorkout {
  title: string;
  description: string;
  icon: string;
  priority: "high" | "medium" | "low";
}

export interface TrainingPositionUIConfig {
  label: string;
  icon: string;
  quickActions: TrainingPositionQuickAction[];
  priorityWorkouts: TrainingPositionWorkout[];
}

const QUARTERBACK_CONFIG: TrainingPositionUIConfig = {
  label: "Quarterback",
  icon: "🎯",
  quickActions: [
    {
      icon: "🎯",
      label: "Throwing",
      route: "/training/qb/throwing",
      tooltip: "Track throwing sessions & arm care",
    },
    {
      icon: "💪",
      label: "Arm Care",
      route: "/training/qb/throwing",
      tooltip: "Rotator cuff & arm health",
    },
    {
      icon: "🦵",
      label: "Hip Mobility",
      route: "/training",
      tooltip: "Hip & shoulder mobility",
    },
    {
      icon: "🏆",
      label: "Achievements",
      route: "/training",
      tooltip: "View all achievements",
    },
  ],
  priorityWorkouts: [
    {
      title: "Throwing Progression",
      description: "Structured throw count with arm care",
      icon: "🎯",
      priority: "high",
    },
    {
      title: "Hip 90/90 Mobility",
      description: "QB-specific hip rotation",
      icon: "🦵",
      priority: "high",
    },
    {
      title: "Rotator Cuff Warm-up",
      description: "Pre-throwing arm prep",
      icon: "💪",
      priority: "high",
    },
    {
      title: "Footwork Drills",
      description: "Drop-back & pocket movement",
      icon: "👟",
      priority: "medium",
    },
  ],
};

const CENTER_CONFIG: TrainingPositionUIConfig = {
  label: "Center",
  icon: "🎯",
  quickActions: [
    {
      icon: "🎯",
      label: "Snap Drills",
      route: "/training",
      tooltip: "Snap mechanics & accuracy",
    },
    {
      icon: "💪",
      label: "Core Work",
      route: "/training",
      tooltip: "Core stability for snapping",
    },
    {
      icon: "🏃",
      label: "Blocking",
      route: "/training",
      tooltip: "Pass protection drills",
    },
    {
      icon: "🏆",
      label: "Achievements",
      route: "/training",
      tooltip: "View all achievements",
    },
  ],
  priorityWorkouts: [
    {
      title: "Snap Mechanics",
      description: "Shotgun & under-center snaps",
      icon: "🎯",
      priority: "high",
    },
    {
      title: "Core Stability",
      description: "Anti-rotation & bracing",
      icon: "💪",
      priority: "high",
    },
    {
      title: "Hip Hinge Drills",
      description: "Proper snap position",
      icon: "🦵",
      priority: "high",
    },
    {
      title: "Hand-Eye Coordination",
      description: "Snap accuracy under pressure",
      icon: "👁️",
      priority: "medium",
    },
  ],
};

const RUSHER_CONFIG: TrainingPositionUIConfig = {
  label: "Blitzer",
  icon: "⚡",
  quickActions: [
    {
      icon: "⚡",
      label: "Decel Drills",
      route: "/training",
      tooltip: "Deceleration & change of direction",
    },
    {
      icon: "🏃",
      label: "Sprint Work",
      route: "/training",
      tooltip: "Acceleration & top speed",
    },
    {
      icon: "🦵",
      label: "Agility",
      route: "/training",
      tooltip: "Lateral movement & cuts",
    },
    {
      icon: "🏆",
      label: "Achievements",
      route: "/training",
      tooltip: "View all achievements",
    },
  ],
  priorityWorkouts: [
    {
      title: "3-Step Deceleration",
      description: "Controlled stopping at speed",
      icon: "⚡",
      priority: "high",
    },
    {
      title: "Change of Direction",
      description: "Quick cuts & redirects",
      icon: "↩️",
      priority: "high",
    },
    {
      title: "Sprint Mechanics",
      description: "Acceleration technique",
      icon: "🏃",
      priority: "high",
    },
    {
      title: "Reactive Agility",
      description: "Read & react drills",
      icon: "👁️",
      priority: "medium",
    },
  ],
};

const WIDE_RECEIVER_CONFIG: TrainingPositionUIConfig = {
  label: "Wide Receiver",
  icon: "🏃",
  quickActions: [
    {
      icon: "🏃",
      label: "Route Running",
      route: "/training",
      tooltip: "Route technique & timing",
    },
    {
      icon: "⚡",
      label: "Speed Work",
      route: "/training",
      tooltip: "Sprint & acceleration",
    },
    {
      icon: "🤲",
      label: "Catching",
      route: "/training",
      tooltip: "Hand-eye coordination",
    },
    {
      icon: "🏆",
      label: "Achievements",
      route: "/training",
      tooltip: "View all achievements",
    },
  ],
  priorityWorkouts: [
    {
      title: "Route Trees",
      description: "Full route combinations",
      icon: "🗺️",
      priority: "high",
    },
    {
      title: "Release Moves",
      description: "Off the line techniques",
      icon: "💨",
      priority: "high",
    },
    {
      title: "Sprint Training",
      description: "Top-end speed development",
      icon: "🏃",
      priority: "high",
    },
    {
      title: "Catching Drills",
      description: "Contested & over-shoulder",
      icon: "🤲",
      priority: "medium",
    },
  ],
};

const DEFENSIVE_BACK_CONFIG: TrainingPositionUIConfig = {
  label: "Defensive Back",
  icon: "🛡️",
  quickActions: [
    {
      icon: "🛡️",
      label: "Coverage",
      route: "/training",
      tooltip: "Man & zone techniques",
    },
    {
      icon: "🏃",
      label: "Backpedal",
      route: "/training",
      tooltip: "Backpedal & transition",
    },
    {
      icon: "👁️",
      label: "Ball Drills",
      route: "/training",
      tooltip: "Interception technique",
    },
    {
      icon: "🏆",
      label: "Achievements",
      route: "/training",
      tooltip: "View all achievements",
    },
  ],
  priorityWorkouts: [
    {
      title: "Backpedal & Break",
      description: "Hip turn & transition",
      icon: "↩️",
      priority: "high",
    },
    {
      title: "Mirror Drills",
      description: "Shadowing receivers",
      icon: "🪞",
      priority: "high",
    },
    {
      title: "Sprint Training",
      description: "Recovery speed",
      icon: "🏃",
      priority: "high",
    },
    {
      title: "Ball Skills",
      description: "High-point & intercept",
      icon: "🏈",
      priority: "medium",
    },
  ],
};

const ATHLETE_CONFIG: TrainingPositionUIConfig = {
  label: "Athlete",
  icon: "🏈",
  quickActions: [
    {
      icon: "🏃",
      label: "Speed",
      route: "/training",
      tooltip: "Sprint & acceleration",
    },
    {
      icon: "📊",
      label: "Periodization",
      route: "/training/periodization",
      tooltip: "View your training plan",
    },
    {
      icon: "💚",
      label: "Recovery",
      route: "/travel/recovery",
      tooltip: "Recovery protocols",
    },
    {
      icon: "🏆",
      label: "Achievements",
      route: "/training",
      tooltip: "View all achievements",
    },
  ],
  priorityWorkouts: [
    {
      title: "Sprint Training",
      description: "Speed development",
      icon: "🏃",
      priority: "high",
    },
    {
      title: "Agility Drills",
      description: "Change of direction",
      icon: "↩️",
      priority: "high",
    },
    {
      title: "Core Stability",
      description: "Athletic foundation",
      icon: "💪",
      priority: "medium",
    },
    {
      title: "Mobility Work",
      description: "Flexibility & range",
      icon: "🧘",
      priority: "medium",
    },
  ],
};

const POSITION_CONFIGS: Record<string, TrainingPositionUIConfig> = {
  qb: QUARTERBACK_CONFIG,
  quarterback: QUARTERBACK_CONFIG,
  center: CENTER_CONFIG,
  blitzer: RUSHER_CONFIG,
  rusher: RUSHER_CONFIG,
  wr: WIDE_RECEIVER_CONFIG,
  "wide receiver": WIDE_RECEIVER_CONFIG,
  db: DEFENSIVE_BACK_CONFIG,
  "defensive back": DEFENSIVE_BACK_CONFIG,
  athlete: ATHLETE_CONFIG,
};

export function resolveTrainingPositionUI(
  position: string | null | undefined,
): TrainingPositionUIConfig {
  const normalizedPosition = position?.toLowerCase().trim() || "athlete";
  return POSITION_CONFIGS[normalizedPosition] || ATHLETE_CONFIG;
}
