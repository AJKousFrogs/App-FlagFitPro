/** PrimeIcons class suffix (e.g. `pi-flag` → render as `class="pi pi-flag"`). */
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
  icon: "pi-bullseye",
  quickActions: [
    {
      icon: "pi-bullseye",
      label: "Throwing",
      route: "/training/qb",
      tooltip: "Track throwing sessions & arm care",
    },
    {
      icon: "pi-heart",
      label: "Arm Care",
      route: "/training/qb",
      tooltip: "Rotator cuff & arm health",
    },
    {
      icon: "pi-arrows-h",
      label: "Hip Mobility",
      route: "/training",
      tooltip: "Hip & shoulder mobility",
    },
    {
      icon: "pi-star",
      label: "Achievements",
      route: "/training",
      tooltip: "View all achievements",
    },
  ],
  priorityWorkouts: [
    {
      title: "Throwing Progression",
      description: "Structured throw count with arm care",
      icon: "pi-bullseye",
      priority: "high",
    },
    {
      title: "Hip 90/90 Mobility",
      description: "QB-specific hip rotation",
      icon: "pi-arrows-h",
      priority: "high",
    },
    {
      title: "Rotator Cuff Warm-up",
      description: "Pre-throwing arm prep",
      icon: "pi-heart",
      priority: "high",
    },
    {
      title: "Footwork Drills",
      description: "Drop-back & pocket movement",
      icon: "pi-arrow-right",
      priority: "medium",
    },
  ],
};

const CENTER_CONFIG: TrainingPositionUIConfig = {
  label: "Center",
  icon: "pi-bullseye",
  quickActions: [
    {
      icon: "pi-bullseye",
      label: "Snap Drills",
      route: "/training",
      tooltip: "Snap mechanics & accuracy",
    },
    {
      icon: "pi-heart",
      label: "Core Work",
      route: "/training",
      tooltip: "Core stability for snapping",
    },
    {
      icon: "pi-forward",
      label: "Blocking",
      route: "/training",
      tooltip: "Pass protection drills",
    },
    {
      icon: "pi-star",
      label: "Achievements",
      route: "/training",
      tooltip: "View all achievements",
    },
  ],
  priorityWorkouts: [
    {
      title: "Snap Mechanics",
      description: "Shotgun & under-center snaps",
      icon: "pi-bullseye",
      priority: "high",
    },
    {
      title: "Core Stability",
      description: "Anti-rotation & bracing",
      icon: "pi-heart",
      priority: "high",
    },
    {
      title: "Hip Hinge Drills",
      description: "Proper snap position",
      icon: "pi-arrows-h",
      priority: "high",
    },
    {
      title: "Hand-Eye Coordination",
      description: "Snap accuracy under pressure",
      icon: "pi-eye",
      priority: "medium",
    },
  ],
};

const RUSHER_CONFIG: TrainingPositionUIConfig = {
  label: "Blitzer",
  icon: "pi-bolt",
  quickActions: [
    {
      icon: "pi-bolt",
      label: "Decel Drills",
      route: "/training",
      tooltip: "Deceleration & change of direction",
    },
    {
      icon: "pi-forward",
      label: "Sprint Work",
      route: "/training",
      tooltip: "Acceleration & top speed",
    },
    {
      icon: "pi-arrows-h",
      label: "Agility",
      route: "/training",
      tooltip: "Lateral movement & cuts",
    },
    {
      icon: "pi-star",
      label: "Achievements",
      route: "/training",
      tooltip: "View all achievements",
    },
  ],
  priorityWorkouts: [
    {
      title: "3-Step Deceleration",
      description: "Controlled stopping at speed",
      icon: "pi-bolt",
      priority: "high",
    },
    {
      title: "Change of Direction",
      description: "Quick cuts & redirects",
      icon: "pi-replay",
      priority: "high",
    },
    {
      title: "Sprint Mechanics",
      description: "Acceleration technique",
      icon: "pi-forward",
      priority: "high",
    },
    {
      title: "Reactive Agility",
      description: "Read & react drills",
      icon: "pi-eye",
      priority: "medium",
    },
  ],
};

const WIDE_RECEIVER_CONFIG: TrainingPositionUIConfig = {
  label: "Wide Receiver",
  icon: "pi-forward",
  quickActions: [
    {
      icon: "pi-forward",
      label: "Route Running",
      route: "/training",
      tooltip: "Route technique & timing",
    },
    {
      icon: "pi-bolt",
      label: "Speed Work",
      route: "/training",
      tooltip: "Sprint & acceleration",
    },
    {
      icon: "pi-circle",
      label: "Catching",
      route: "/training",
      tooltip: "Hand-eye coordination",
    },
    {
      icon: "pi-star",
      label: "Achievements",
      route: "/training",
      tooltip: "View all achievements",
    },
  ],
  priorityWorkouts: [
    {
      title: "Route Trees",
      description: "Full route combinations",
      icon: "pi-map",
      priority: "high",
    },
    {
      title: "Release Moves",
      description: "Off the line techniques",
      icon: "pi-cloud",
      priority: "high",
    },
    {
      title: "Sprint Training",
      description: "Top-end speed development",
      icon: "pi-forward",
      priority: "high",
    },
    {
      title: "Catching Drills",
      description: "Contested & over-shoulder",
      icon: "pi-circle",
      priority: "medium",
    },
  ],
};

const DEFENSIVE_BACK_CONFIG: TrainingPositionUIConfig = {
  label: "Defensive Back",
  icon: "pi-shield",
  quickActions: [
    {
      icon: "pi-shield",
      label: "Coverage",
      route: "/training",
      tooltip: "Man & zone techniques",
    },
    {
      icon: "pi-forward",
      label: "Backpedal",
      route: "/training",
      tooltip: "Backpedal & transition",
    },
    {
      icon: "pi-eye",
      label: "Ball Drills",
      route: "/training",
      tooltip: "Interception technique",
    },
    {
      icon: "pi-star",
      label: "Achievements",
      route: "/training",
      tooltip: "View all achievements",
    },
  ],
  priorityWorkouts: [
    {
      title: "Backpedal & Break",
      description: "Hip turn & transition",
      icon: "pi-replay",
      priority: "high",
    },
    {
      title: "Mirror Drills",
      description: "Shadowing receivers",
      icon: "pi-sync",
      priority: "high",
    },
    {
      title: "Sprint Training",
      description: "Recovery speed",
      icon: "pi-forward",
      priority: "high",
    },
    {
      title: "Ball Skills",
      description: "High-point & intercept",
      icon: "pi-flag",
      priority: "medium",
    },
  ],
};

const ATHLETE_CONFIG: TrainingPositionUIConfig = {
  label: "Athlete",
  icon: "pi-flag",
  quickActions: [
    {
      icon: "pi-forward",
      label: "Speed",
      route: "/training",
      tooltip: "Sprint & acceleration",
    },
    {
      icon: "pi-chart-bar",
      label: "Periodization",
      route: "/training/periodization",
      tooltip: "View your training plan",
    },
    {
      icon: "pi-heart",
      label: "Recovery",
      route: "/wellness",
      tooltip: "Recovery protocols",
    },
    {
      icon: "pi-star",
      label: "Achievements",
      route: "/training",
      tooltip: "View all achievements",
    },
  ],
  priorityWorkouts: [
    {
      title: "Sprint Training",
      description: "Speed development",
      icon: "pi-forward",
      priority: "high",
    },
    {
      title: "Agility Drills",
      description: "Change of direction",
      icon: "pi-replay",
      priority: "high",
    },
    {
      title: "Core Stability",
      description: "Athletic foundation",
      icon: "pi-heart",
      priority: "medium",
    },
    {
      title: "Mobility Work",
      description: "Flexibility & range",
      icon: "pi-sun",
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
