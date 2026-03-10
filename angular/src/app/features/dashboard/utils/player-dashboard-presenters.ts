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

export function getDashboardEventIcon(type: string): string {
  const icons: Record<string, string> = {
    recovery_protocol: "🏈",
    load_cap: "⚠️",
    travel_recovery: "🛫",
    rtp_protocol: "🏥",
    wellness_focus: "💚",
  };

  return icons[type] || "📋";
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
