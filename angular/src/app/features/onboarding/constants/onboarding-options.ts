/**
 * Option arrays shared across onboarding step components
 */
export const PLAYER_STEPS = [
  { label: "1 · Personal", icon: "pi pi-user", completed: false },
  { label: "2 · Team", icon: "pi pi-users", completed: false },
  { label: "3 · Physical", icon: "pi pi-heart", completed: false },
  { label: "4 · Health", icon: "pi pi-shield", completed: false },
  { label: "5 · Goals", icon: "pi pi-flag", completed: false },
  { label: "6 · Schedule", icon: "pi pi-calendar", completed: false },
  { label: "7 · Summary", icon: "pi pi-check", completed: false },
];

export const STAFF_STEPS = [
  { label: "1 · Personal", icon: "pi pi-user", completed: false },
  { label: "2 · Role", icon: "pi pi-briefcase", completed: false },
  { label: "3 · Summary", icon: "pi pi-check", completed: false },
];

export const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
  { label: "Prefer not to say", value: "undisclosed" },
];

export const USER_TYPE_OPTIONS = [
  {
    label: "Player",
    value: "player" as const,
    icon: "pi pi-user",
    description: "I play on the team and want to track my training",
  },
  {
    label: "Coaching Staff",
    value: "staff" as const,
    icon: "pi pi-briefcase",
    description: "I'm part of the coaching or support staff",
  },
];

export const STAFF_ROLE_OPTIONS = [
  { label: "Head Coach", value: "head_coach" },
  { label: "Assistant Coach", value: "assistant_coach" },
  { label: "Offensive Coordinator", value: "offensive_coordinator" },
  { label: "Defensive Coordinator", value: "defensive_coordinator" },
  { label: "Strength & Conditioning Coach", value: "strength_coach" },
  { label: "Athletic Trainer", value: "athletic_trainer" },
  { label: "Physiotherapist", value: "physiotherapist" },
  { label: "Nutritionist / Dietitian", value: "nutritionist" },
  { label: "Sports Psychologist", value: "sports_psychologist" },
  { label: "Team Manager", value: "team_manager" },
  { label: "Video Analyst", value: "video_analyst" },
  { label: "Equipment Manager", value: "equipment_manager" },
  { label: "Other Staff", value: "other_staff" },
];

export const STAFF_VISIBILITY_OPTIONS = [
  { label: "Team Roster", value: "roster", icon: "pi pi-users" },
  { label: "Training Programs", value: "training", icon: "pi pi-calendar" },
  { label: "Player Analytics", value: "analytics", icon: "pi pi-chart-line" },
  { label: "Injury Management", value: "injuries", icon: "pi pi-heart" },
  { label: "Nutrition Data", value: "nutrition", icon: "pi pi-apple" },
  { label: "Game Statistics", value: "game_stats", icon: "pi pi-flag" },
  { label: "Playbook", value: "playbook", icon: "pi pi-book" },
  { label: "Film Room", value: "film", icon: "pi pi-video" },
  { label: "Team Chat", value: "chat", icon: "pi pi-comments" },
  { label: "Wellness Data", value: "wellness", icon: "pi pi-sun" },
];

export const POSITIONS = [
  { label: "Quarterback (QB)", value: "QB" },
  { label: "Wide Receiver (WR)", value: "WR" },
  { label: "Center", value: "Center" },
  { label: "Defensive Back (DB)", value: "DB" },
  { label: "Rusher / Blitzer", value: "Rusher" },
  { label: "Linebacker (LB)", value: "LB" },
  { label: "Hybrid (Multiple Positions)", value: "Hybrid" },
];

export const THROWING_ARM_OPTIONS = [
  { label: "Right", value: "right" },
  { label: "Left", value: "left" },
  { label: "Ambidextrous", value: "both" },
];

export const EXPERIENCE_LEVELS = [
  { label: "Beginner (0-1 years)", value: "beginner" },
  { label: "Intermediate (1-3 years)", value: "intermediate" },
  { label: "Advanced (3-5 years)", value: "advanced" },
  { label: "Professional (5+ years)", value: "professional" },
];

export const GOALS = [
  { id: "speed", label: "Improve Speed", icon: "pi pi-bolt" },
  { id: "strength", label: "Build Strength", icon: "pi pi-chart-line" },
  { id: "agility", label: "Enhance Agility", icon: "pi pi-sync" },
  { id: "endurance", label: "Increase Endurance", icon: "pi pi-heart" },
  { id: "technique", label: "Perfect Technique", icon: "pi pi-star" },
  { id: "injury", label: "Prevent Injuries", icon: "pi pi-shield" },
];

export const SCHEDULE_TYPES = [
  { label: "Early Bird - Work starts ~6am", value: "early_bird" },
  { label: "Standard - Work starts ~9am", value: "standard" },
  { label: "Late Starter - Work starts afternoon", value: "late_starter" },
  { label: "Shift Worker - Variable shifts", value: "shift_worker" },
  { label: "Student - Flexible schedule", value: "student" },
  { label: "Remote Worker - Work from home", value: "remote_worker" },
];

export const PRACTICE_FREQUENCIES = [
  { label: "1 practice per week", value: 1 },
  { label: "2 practices per week", value: 2 },
  { label: "3 practices per week", value: 3 },
  { label: "4+ practices per week", value: 4 },
];

export const WEEK_DAYS = [
  { label: "Mon", value: "Monday" },
  { label: "Tue", value: "Tuesday" },
  { label: "Wed", value: "Wednesday" },
  { label: "Thu", value: "Thursday" },
  { label: "Fri", value: "Friday" },
  { label: "Sat", value: "Saturday" },
  { label: "Sun", value: "Sunday" },
];

export const MOBILITY_TIME_OPTIONS = [
  { label: "Every Day", value: "daily", icon: "pi pi-check-circle", description: "Recommended for best results" },
  { label: "Most Days", value: "most_days", icon: "pi pi-clock", description: "5-6 days per week" },
  { label: "When I Can", value: "flexible", icon: "pi pi-calendar", description: "Flexible schedule" },
  { label: "Skip This", value: "skip", icon: "pi pi-times", description: "Not for me right now" },
];

export const FOAM_ROLLING_OPTIONS = [
  { label: "After Practice", value: "after_practice", icon: "pi pi-flag", description: "Best for recovery" },
  { label: "Before Bed", value: "before_bed", icon: "pi pi-moon", description: "Helps with sleep" },
  { label: "Both", value: "both", icon: "pi pi-check-circle", description: "Maximum recovery" },
  { label: "When Sore", value: "when_needed", icon: "pi pi-exclamation-circle", description: "As needed basis" },
];

export const REST_DAY_OPTIONS = [
  { label: "Full Recovery", value: "full", icon: "pi pi-heart", description: "Stretching + Foam Rolling (35 min)" },
  { label: "Light Stretching", value: "light", icon: "pi pi-minus", description: "Just stretching (20 min)" },
  { label: "Active Recovery", value: "active", icon: "pi pi-refresh", description: "Morning + Stretching + Evening (45 min)" },
  { label: "Complete Rest", value: "none", icon: "pi pi-stop", description: "No structured routine" },
];

export const INJURY_AREAS = [
  { label: "Hamstring", value: "hamstring" },
  { label: "Quadriceps", value: "quadriceps" },
  { label: "Knee", value: "knee" },
  { label: "Ankle", value: "ankle" },
  { label: "Calf / Achilles", value: "calf_achilles" },
  { label: "Hip Flexor", value: "hip_flexor" },
  { label: "Groin", value: "groin" },
  { label: "Lower Back", value: "lower_back" },
  { label: "Shoulder", value: "shoulder" },
  { label: "Elbow", value: "elbow" },
  { label: "Wrist / Hand", value: "wrist_hand" },
  { label: "Neck", value: "neck" },
  { label: "Other", value: "other" },
];

export const INJURY_HISTORY_OPTIONS = [
  { label: "ACL Tear", value: "acl", icon: "pi pi-exclamation-triangle" },
  { label: "Hamstring Strain", value: "hamstring_strain", icon: "pi pi-exclamation-circle" },
  { label: "Ankle Sprain", value: "ankle_sprain", icon: "pi pi-exclamation-circle" },
  { label: "Shoulder Injury", value: "shoulder", icon: "pi pi-exclamation-circle" },
  { label: "Concussion", value: "concussion", icon: "pi pi-exclamation-triangle" },
  { label: "Back Injury", value: "back", icon: "pi pi-exclamation-circle" },
  { label: "Knee Injury (other)", value: "knee_other", icon: "pi pi-exclamation-circle" },
  { label: "Muscle Tear", value: "muscle_tear", icon: "pi pi-exclamation-triangle" },
  { label: "Stress Fracture", value: "stress_fracture", icon: "pi pi-exclamation-triangle" },
  { label: "None", value: "none", icon: "pi pi-check-circle" },
];

export const EQUIPMENT_OPTIONS = [
  { label: "Foam Roller", value: "foam_roller", icon: "pi pi-circle" },
  { label: "Resistance Bands", value: "bands", icon: "pi pi-link" },
  { label: "Dumbbells", value: "dumbbells", icon: "pi pi-box" },
  { label: "Kettlebell", value: "kettlebell", icon: "pi pi-box" },
  { label: "Pull-up Bar", value: "pullup_bar", icon: "pi pi-minus" },
  { label: "Jump Rope", value: "jump_rope", icon: "pi pi-sync" },
  { label: "Yoga Mat", value: "yoga_mat", icon: "pi pi-stop" },
  { label: "Agility Ladder", value: "agility_ladder", icon: "pi pi-th-large" },
  { label: "Cones / Markers", value: "cones", icon: "pi pi-map-marker" },
  { label: "Medicine Ball", value: "medicine_ball", icon: "pi pi-circle-fill" },
  { label: "Football", value: "football", icon: "pi pi-star" },
  { label: "Gym Access", value: "gym", icon: "pi pi-building" },
  { label: "None / Bodyweight Only", value: "none", icon: "pi pi-user" },
];
