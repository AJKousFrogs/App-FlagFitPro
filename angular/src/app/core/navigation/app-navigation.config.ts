export type NavigationGroup =
  | "primary"
  | "secondary"
  | "home"
  | "athlete"
  | "team"
  | "tools"
  | "me";

export interface AppNavigationItem {
  label: string;
  route: string;
  icon: string;
  ariaLabel: string;
  group: NavigationGroup;
  mobilePrimary?: boolean;
  roles?: string[];
}

const EXACT_NAV_ROUTES = new Set([
  "/dashboard",
  "/player-dashboard",
  "/coach/dashboard",
  "/todays-practice",
]);

// ════════════════════════════════════════════════════════════════════════
// ATHLETE — 5 primary mobile verbs: Today / Train / Recover / Insights / Team
// Center FAB on the redesigned bottom nav will be "Start Today's Practice".
// More menu collects: Overview, Merlin AI, Chat, Knowledge, Tournaments,
// Reports, Cycle Tracking, Sleep Debt, ACWR, Return-to-Play, Film, Playbook,
// Profile / Notifications / Settings / Help / Achievements.
// ════════════════════════════════════════════════════════════════════════
const ATHLETE_NAV_ITEMS: readonly AppNavigationItem[] = [
  // ── BOTTOM NAV ORDER ──────────────────────────────────────────────
  // Order matters: the BottomNavComponent renders the 3rd mobilePrimary
  // item as the protruding center FAB. Today is placed at slot 3 so the
  // primary action ("Start Today's Practice") visually pops.
  // [Train] [Recover] [⏵ Today FAB] [Insights] [Team]
  // ── ATHLETE (primary slots 1, 2) ──────────────────────────────────
  {
    label: "Train",
    route: "/training",
    icon: "pi-bolt",
    ariaLabel: "Train - Schedule, library, programs, and workouts",
    group: "athlete",
    mobilePrimary: true,
  },
  {
    label: "Recover",
    route: "/wellness",
    icon: "pi-heart",
    ariaLabel: "Recover - Wellness check-in, cycle, sleep, and return-to-play",
    group: "athlete",
    mobilePrimary: true,
  },
  // ── HOME (primary slot 3 — center FAB) ────────────────────────────
  {
    label: "Today",
    route: "/todays-practice",
    icon: "pi-play",
    ariaLabel: "Today's Practice - Your training for today",
    group: "home",
    mobilePrimary: true,
  },
  {
    label: "Overview",
    route: "/player-dashboard",
    icon: "pi-home",
    ariaLabel: "Overview - Training progress, status, and trends",
    group: "home",
  },
  // ── ATHLETE (primary slot 4) ──────────────────────────────────────
  {
    label: "Insights",
    route: "/performance/insights",
    icon: "pi-chart-line",
    ariaLabel: "Insights - Performance metrics, tests, and reports",
    group: "athlete",
    mobilePrimary: true,
  },
  // ── ATHLETE — Recover sub-features (More menu) ────────────────────
  {
    label: "Cycle Tracking",
    route: "/cycle-tracking",
    icon: "pi-circle",
    ariaLabel: "Cycle Tracking - Menstrual cycle and recovery alignment",
    group: "athlete",
  },
  {
    label: "Sleep",
    route: "/sleep-debt",
    icon: "pi-moon",
    ariaLabel: "Sleep - Sleep debt and recovery metrics",
    group: "athlete",
  },
  {
    label: "Workload (ACWR)",
    route: "/acwr",
    icon: "pi-gauge",
    ariaLabel: "Workload - Acute:chronic workload ratio and load monitoring",
    group: "athlete",
  },
  {
    label: "Return to Play",
    route: "/return-to-play",
    icon: "pi-replay",
    ariaLabel: "Return to Play - Injury return timeline and milestones",
    group: "athlete",
  },
  // ── TEAM (primary slot 5) ─────────────────────────────────────────
  {
    label: "Team",
    route: "/roster",
    icon: "pi-users",
    ariaLabel: "Team - Roster, teammates, roles, and availability",
    group: "team",
    mobilePrimary: true,
  },
  {
    label: "Team Chat",
    route: "/team-chat",
    icon: "pi-comments",
    ariaLabel: "Team Chat - Communicate with your team",
    group: "team",
  },
  {
    label: "Competition",
    route: "/tournaments",
    icon: "pi-trophy",
    ariaLabel: "Competition - Games and tournaments",
    group: "team",
  },
  // ── TOOLS (More menu) ─────────────────────────────────────────────
  {
    label: "Merlin AI",
    route: "/chat",
    icon: "pi-sparkles",
    ariaLabel: "Merlin AI - Chat with your Merlin AI",
    group: "tools",
  },
  {
    label: "Film",
    route: "/film",
    icon: "pi-video",
    ariaLabel: "Film - Review film and tagged moments",
    group: "tools",
  },
  {
    label: "Playbook",
    route: "/playbook",
    icon: "pi-book",
    ariaLabel: "Playbook - Plays and assignments",
    group: "tools",
  },
  {
    label: "Knowledge",
    route: "/knowledge",
    icon: "pi-bookmark",
    ariaLabel: "Knowledge Base - Browse training guidance and team resources",
    group: "tools",
  },
  {
    label: "Reports",
    route: "/reports",
    icon: "pi-chart-bar",
    ariaLabel: "Reports - Performance, workload, and generated report workspaces",
    group: "tools",
  },
  // ── ME ────────────────────────────────────────────────────────────
  {
    label: "Profile",
    route: "/profile",
    icon: "pi-user",
    ariaLabel: "Profile - View and edit your profile",
    group: "me",
  },
  {
    label: "Notifications",
    route: "/notifications",
    icon: "pi-bell",
    ariaLabel: "Notifications - Review alerts, coach messages, and system updates",
    group: "me",
  },
  {
    label: "Settings",
    route: "/settings",
    icon: "pi-cog",
    ariaLabel: "Settings - App preferences and account settings",
    group: "me",
  },
  {
    label: "Help",
    route: "/help",
    icon: "pi-question-circle",
    ariaLabel: "Help Center - Get support and guidance",
    group: "me",
  },
  {
    label: "Achievements",
    route: "/achievements",
    icon: "pi-trophy",
    ariaLabel: "Achievements - View your progress and badges",
    group: "me",
  },
];

// ════════════════════════════════════════════════════════════════════════
// COACH — 5 primary mobile verbs: Today / Roster / Plan / Insights / Team
// Center FAB on the redesigned bottom nav will be "New Session".
// More menu collects: Competition, Merlin AI, Knowledge, Reports, Inbox,
// Activity, Programs, Injuries, Film Room, Staff Hub, Team Chat,
// Team Settings, Payments, Profile / Notifications / Settings / Help /
// Achievements.
// ════════════════════════════════════════════════════════════════════════
const COACH_NAV_ITEMS: readonly AppNavigationItem[] = [
  // ── BOTTOM NAV ORDER ──────────────────────────────────────────────
  // Order matters: BottomNavComponent renders the 3rd mobilePrimary item
  // as the protruding center FAB. Today is placed at slot 3 so the
  // dashboard ("daily go-to") visually pops.
  // [Roster] [Plan] [⏵ Today FAB] [Insights] [Team]
  {
    label: "Roster",
    route: "/roster",
    icon: "pi-users",
    ariaLabel: "Roster - Player management and monitoring",
    group: "primary",
    mobilePrimary: true,
  },
  {
    label: "Plan",
    route: "/coach/planning",
    icon: "pi-calendar",
    ariaLabel: "Plan - Programs, practice planner, and calendar",
    group: "primary",
    mobilePrimary: true,
  },
  {
    label: "Today",
    route: "/coach/dashboard",
    icon: "pi-play",
    ariaLabel: "Today - Coach dashboard, team overview, and insights",
    group: "primary",
    mobilePrimary: true,
  },
  {
    label: "Insights",
    route: "/coach/analytics",
    icon: "pi-chart-line",
    ariaLabel: "Insights - Team metrics, readiness, performance, and reports",
    group: "primary",
    mobilePrimary: true,
  },
  {
    label: "Team",
    route: "/team/workspace",
    icon: "pi-briefcase",
    ariaLabel: "Team - Team workspace, operations, and collaboration",
    group: "primary",
    mobilePrimary: true,
    roles: [
      "owner",
      "admin",
      "head_coach",
      "coach",
      "offense_coordinator",
      "defense_coordinator",
      "assistant_coach",
      "manager",
    ],
  },
  {
    label: "Competition",
    route: "/tournaments",
    icon: "pi-trophy",
    ariaLabel: "Competition - Games and tournaments",
    group: "secondary",
  },
  {
    label: "Merlin AI",
    route: "/chat",
    icon: "pi-sparkles",
    ariaLabel: "Merlin AI - Chat with your Merlin AI",
    group: "secondary",
  },
  {
    label: "Knowledge Base",
    route: "/knowledge",
    icon: "pi-bookmark",
    ariaLabel: "Knowledge Base - Training resources, guides, and shared knowledge",
    group: "secondary",
  },
  {
    label: "Reports",
    route: "/reports",
    icon: "pi-chart-bar",
    ariaLabel: "Reports - Performance, scouting, and specialist reporting surfaces",
    group: "secondary",
  },
  {
    label: "Inbox",
    route: "/coach/inbox",
    icon: "pi-inbox",
    ariaLabel: "Coach Inbox - Review alerts, requests, and team wins",
    group: "secondary",
  },
  {
    label: "Activity",
    route: "/coach/activity",
    icon: "pi-bell",
    ariaLabel: "Coach Activity - Review recent player activity and updates",
    group: "secondary",
  },
  {
    label: "Programs",
    route: "/coach/program-builder",
    icon: "pi-sitemap",
    ariaLabel: "Program Builder - Create and manage team training programs",
    group: "secondary",
  },
  {
    label: "Injuries",
    route: "/coach/injuries",
    icon: "pi-heart",
    ariaLabel: "Injury Management - Track recovery and return-to-play progress",
    group: "secondary",
  },
  {
    label: "Film Room",
    route: "/coach/film",
    icon: "pi-video",
    ariaLabel: "Film Room - Review film, tagging, and coaching assignments",
    group: "secondary",
  },
  {
    label: "Staff Hub",
    route: "/staff",
    icon: "pi-building",
    ariaLabel:
      "Staff Hub - Access nutritionist, physio, and psychology dashboards",
    group: "secondary",
    roles: [
      "physiotherapist",
      "nutritionist",
      "psychologist",
      "strength_conditioning_coach",
    ],
  },
  {
    label: "Team Chat",
    route: "/team-chat",
    icon: "pi-comments",
    ariaLabel: "Team Chat - Communicate with your team",
    group: "secondary",
  },
  {
    label: "Team Settings",
    route: "/coach/team",
    icon: "pi-sitemap",
    ariaLabel: "Team Settings - Manage team profile, preferences, and access",
    group: "secondary",
    roles: [
      "owner",
      "admin",
      "head_coach",
      "coach",
      "offense_coordinator",
      "defense_coordinator",
      "assistant_coach",
      "manager",
    ],
  },
  {
    label: "Payments",
    route: "/coach/payments",
    icon: "pi-credit-card",
    ariaLabel: "Payments - Manage dues, fees, and payment follow-up",
    group: "secondary",
    roles: [
      "owner",
      "admin",
      "head_coach",
      "coach",
      "offense_coordinator",
      "defense_coordinator",
      "assistant_coach",
      "manager",
    ],
  },
  {
    label: "Profile",
    route: "/profile",
    icon: "pi-user",
    ariaLabel: "Profile - View and edit your profile",
    group: "me",
  },
  {
    label: "Notifications",
    route: "/notifications",
    icon: "pi-bell",
    ariaLabel: "Notifications - Review alerts, coach messages, and system updates",
    group: "me",
  },
  {
    label: "Settings",
    route: "/settings",
    icon: "pi-cog",
    ariaLabel: "Settings - App preferences and account settings",
    group: "me",
  },
  {
    label: "Help",
    route: "/help",
    icon: "pi-question-circle",
    ariaLabel: "Help Center - Get support and guidance",
    group: "me",
  },
  {
    label: "Achievements",
    route: "/achievements",
    icon: "pi-trophy",
    ariaLabel: "Achievements - View your progress and badges",
    group: "me",
  },
];

const COACH_NAV_ROLES = [
  "owner",
  "admin",
  "head_coach",
  "coach",
  "offense_coordinator",
  "defense_coordinator",
  "assistant_coach",
  "manager",
  "physiotherapist",
  "nutritionist",
  "psychologist",
  "strength_conditioning_coach",
] as const;

export function isCoachNavigationRole(role: string | undefined): boolean {
  return COACH_NAV_ROLES.includes((role ?? "") as (typeof COACH_NAV_ROLES)[number]);
}

function filterByRole(
  items: readonly AppNavigationItem[],
  role: string | undefined,
): AppNavigationItem[] {
  return items.filter((item) => !item.roles || item.roles.includes(role ?? ""));
}

export function getRoleNavigationItems(role: string | undefined): AppNavigationItem[] {
  const items = isCoachNavigationRole(role) ? COACH_NAV_ITEMS : ATHLETE_NAV_ITEMS;
  return filterByRole(items, role);
}

export function getPrimaryNavigationItems(
  role: string | undefined,
): AppNavigationItem[] {
  // Coaches use legacy "primary" group; athletes use semantic groups.
  if (isCoachNavigationRole(role)) {
    return getRoleNavigationItems(role).filter((item) => item.group === "primary");
  }
  return getRoleNavigationItems(role).filter((item) =>
    (["home", "athlete", "team", "tools"] as NavigationGroup[]).includes(item.group),
  );
}

export function getSecondaryNavigationItems(
  role: string | undefined,
): AppNavigationItem[] {
  return getRoleNavigationItems(role).filter(
    (item) => item.group === "secondary",
  );
}

export function getMeNavigationItems(role: string | undefined): AppNavigationItem[] {
  return getRoleNavigationItems(role).filter((item) => item.group === "me");
}

export function getMobilePrimaryNavigationItems(
  role: string | undefined,
): AppNavigationItem[] {
  return getRoleNavigationItems(role).filter((item) => item.mobilePrimary);
}

export function getMobileMoreNavigationItems(
  role: string | undefined,
): AppNavigationItem[] {
  return getRoleNavigationItems(role).filter((item) => !item.mobilePrimary);
}

/** Returns ordered nav groups for the sidebar — 4 semantic groups for athletes, 2 for coaches. */
export function getNavGroupsForRole(
  role: string | undefined,
): { id: string; label: string; items: AppNavigationItem[] }[] {
  const all = getRoleNavigationItems(role);
  if (isCoachNavigationRole(role)) {
    return [
      { id: "primary", label: "Main", items: all.filter((i) => i.group === "primary") },
      { id: "secondary", label: "Tools", items: all.filter((i) => i.group === "secondary") },
    ].filter((g) => g.items.length > 0);
  }
  return [
    { id: "home",    label: "Home",    items: all.filter((i) => i.group === "home") },
    { id: "athlete", label: "Athlete", items: all.filter((i) => i.group === "athlete") },
    { id: "team",    label: "Team",    items: all.filter((i) => i.group === "team") },
    { id: "tools",   label: "Tools",   items: all.filter((i) => i.group === "tools") },
  ].filter((g) => g.items.length > 0);
}

export function isExactNavigationRoute(route: string): boolean {
  return EXACT_NAV_ROUTES.has(route);
}
