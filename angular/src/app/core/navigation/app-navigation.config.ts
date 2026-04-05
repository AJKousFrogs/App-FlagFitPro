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

const ATHLETE_NAV_ITEMS: readonly AppNavigationItem[] = [
  // ── HOME ──────────────────────────────────────────────────────────
  {
    label: "Dashboard",
    route: "/player-dashboard",
    icon: "pi-home",
    ariaLabel: "Dashboard - Overview of your training and progress",
    group: "home",
    mobilePrimary: true,
  },
  {
    label: "Today",
    route: "/todays-practice",
    icon: "pi-calendar",
    ariaLabel: "Today's Practice - Your training for today",
    group: "home",
    mobilePrimary: true,
  },
  // ── ATHLETE ───────────────────────────────────────────────────────
  {
    label: "Training",
    route: "/training",
    icon: "pi-bolt",
    ariaLabel: "Training Schedule - View and manage your training calendar",
    group: "athlete",
    mobilePrimary: true,
  },
  {
    label: "Wellness",
    route: "/wellness",
    icon: "pi-heart",
    ariaLabel: "Wellness & Recovery - Daily check-in and recovery metrics",
    group: "athlete",
    mobilePrimary: true,
  },
  {
    label: "Stats",
    route: "/performance/insights",
    icon: "pi-chart-line",
    ariaLabel: "Performance Stats - Metrics, tests, and performance insights",
    group: "athlete",
    mobilePrimary: true,
  },
  // ── TEAM ──────────────────────────────────────────────────────────
  {
    label: "Team",
    route: "/roster",
    icon: "pi-users",
    ariaLabel: "Roster - Teammates, roles, and availability",
    group: "team",
  },
  {
    label: "Chat",
    route: "/team-chat",
    icon: "pi-comments",
    ariaLabel: "Team Chat - Communicate with your team",
    group: "team",
  },
  {
    label: "Competition",
    route: "/tournaments",
    icon: "pi-trophy",
    ariaLabel: "Tournaments - Games and competitions",
    group: "team",
  },
  // ── TOOLS ─────────────────────────────────────────────────────────
  {
    label: "Merlin AI",
    route: "/chat",
    icon: "pi-sparkles",
    ariaLabel: "Merlin AI - Chat with your Merlin AI",
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
    label: "Profile",
    route: "/profile",
    icon: "pi-user",
    ariaLabel: "Profile - View and edit your profile",
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

const COACH_NAV_ITEMS: readonly AppNavigationItem[] = [
  {
    label: "Dashboard",
    route: "/coach/dashboard",
    icon: "pi-home",
    ariaLabel: "Coach Dashboard - Team overview and insights",
    group: "primary",
    mobilePrimary: true,
  },
  {
    label: "Roster",
    route: "/roster",
    icon: "pi-users",
    ariaLabel: "Roster - Player management and monitoring",
    group: "primary",
    mobilePrimary: true,
  },
  {
    label: "Planning",
    route: "/coach/planning",
    icon: "pi-calendar",
    ariaLabel: "Planning - Programs, practice planner, and calendar",
    group: "primary",
    mobilePrimary: true,
  },
  {
    label: "Performance",
    route: "/coach/analytics",
    icon: "pi-chart-line",
    ariaLabel: "Performance - Team metrics, readiness, and performance insights",
    group: "primary",
    mobilePrimary: true,
  },
  {
    label: "Team",
    route: "/team/workspace",
    icon: "pi-briefcase",
    ariaLabel: "Team Workspace - Team operations and collaboration",
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
    label: "Profile",
    route: "/profile",
    icon: "pi-user",
    ariaLabel: "Profile - View and edit your profile",
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
