import type { TeamSharingSettings } from "../../../core/services/privacy-settings.service";
import { METRIC_CATEGORIES } from "../../../core/services/privacy-settings.service";
import type { ProfileCompletionStatus } from "../../../core/services/profile-completion.service";

export function getDashboardGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getDashboardMerlinInsight(
  readiness: number | null,
  acwrValue: number | null,
): string {
  if (readiness === null && acwrValue === null) {
    return "Complete a wellness check-in and log training sessions to get personalized insights.";
  }

  if (readiness !== null && readiness < 50) {
    return "Your readiness is low today. Consider a lighter session focused on recovery and mobility.";
  }

  if (acwrValue !== null && acwrValue > 1.3) {
    return "Your training load is elevated. Take it easy today to avoid overtraining and reduce injury risk.";
  }

  if (readiness !== null && readiness >= 80 && acwrValue !== null && acwrValue <= 1.0) {
    return "You're in great shape! Today is perfect for a high-intensity session. Let's push it!";
  }

  return "Solid day ahead! Stick to your plan and focus on quality over quantity in today's session.";
}

export function getWeeklyProgress(completed: number, planned: number): number {
  return planned > 0 ? Math.round((completed / planned) * 100) : 0;
}

export function getDashboardPrivacySharingStatus(
  teamSettings: TeamSharingSettings[],
): {
  sharedMetrics: number;
  totalMetrics: number;
  sharingEnabled: boolean;
} {
  const totalMetrics = METRIC_CATEGORIES.length;

  if (teamSettings.length === 0) {
    return {
      sharedMetrics: 0,
      totalMetrics,
      sharingEnabled: false,
    };
  }

  const sharedCategories = new Set<string>();

  teamSettings.forEach((teamSetting) => {
    if (
      !teamSetting.performanceSharingEnabled &&
      !teamSetting.healthSharingEnabled
    ) {
      return;
    }

    teamSetting.allowedMetricCategories?.forEach((category) => {
      sharedCategories.add(category);
    });

    if (teamSetting.performanceSharingEnabled) {
      sharedCategories.add("performance");
      sharedCategories.add("training_load");
    }

    if (teamSetting.healthSharingEnabled) {
      sharedCategories.add("wellness");
      sharedCategories.add("readiness");
      sharedCategories.add("injury_history");
    }
  });

  return {
    sharedMetrics: sharedCategories.size,
    totalMetrics,
    sharingEnabled: sharedCategories.size > 0,
  };
}

export function hasCompletedDashboardOnboarding(
  status: ProfileCompletionStatus,
): boolean {
  return status.missingRequired.length === 0 || status.percentage >= 80;
}

/** Consecutive calendar days with wellness check-ins, ordered from most recent. */
export function computeWellnessCheckinStreak(
  entries: { date: string }[],
): number {
  if (!entries.length) return 0;
  const sorted = [...new Set(entries.map((e) => e.date).filter(Boolean))].sort(
    (a, b) => b.localeCompare(a),
  );
  if (sorted.length === 0) return 0;

  const parseYmd = (ymd: string): Date => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  };

  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseYmd(sorted[i - 1]);
    const curr = parseYmd(sorted[i]);
    const diff =
      (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/** PrimeIcons class suffix (e.g. `pi-flag` → `class="pi pi-flag"` in the template). */
export function getDashboardEventIcon(type: string): string {
  const icons: Record<string, string> = {
    recovery_protocol: "pi-flag",
    load_cap: "pi-exclamation-triangle",
    travel_recovery: "pi-send",
    rtp_protocol: "pi-plus-circle",
    wellness_focus: "pi-heart",
  };

  return icons[type] || "pi-clipboard";
}

export function getDashboardEventSeverity(
  type: string,
): "success" | "warning" | "danger" | "info" | "secondary" | "primary" {
  switch (type) {
    case "game":
      return "danger";
    case "tournament":
      return "warning";
    default:
      return "success";
  }
}

export interface DashboardUpcomingEventDisplay {
  id: string;
  day: string;
  month: string;
  title: string;
  type: string;
  typeLabel: string;
  severity: ReturnType<typeof getDashboardEventSeverity>;
}

/** Maps Supabase `team_events` rows to dashboard “Coming up” cards. */
export function mapTeamEventToDashboardDisplay(
  e: { event_date: string; title?: string | null; event_type?: string | null },
  index: number,
): DashboardUpcomingEventDisplay {
  const safeDate = e.event_date.includes("T")
    ? e.event_date
    : `${e.event_date}T12:00:00`;
  const d = new Date(safeDate);
  const day = Number.isNaN(d.getTime()) ? "—" : String(d.getDate());
  const month = Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-US", { month: "short" });
  const rawType = (e.event_type || "event").toLowerCase();
  const title = (e.title && e.title.trim()) || "Team event";
  return {
    id: `${e.event_date}-${index}-${title}`,
    day,
    month,
    title,
    type: rawType,
    typeLabel: formatTeamEventTypeLabel(rawType),
    severity: getDashboardEventSeverity(rawType),
  };
}

function formatTeamEventTypeLabel(type: string): string {
  const t = type.toLowerCase();
  if (t === "game" || t === "match") return "Game";
  if (t === "tournament") return "Tournament";
  if (t === "practice" || t === "team_practice") return "Practice";
  return t
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
