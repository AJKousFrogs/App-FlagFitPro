import { formatDate as formatDateFns } from "date-fns";

export type StatusSeverity = "success" | "info" | "warning" | "danger";

export function getStaffInsightRoleSeverity(role: string): StatusSeverity {
  const roleMap: Record<string, StatusSeverity> = {
    coach: "info",
    physiotherapist: "success",
    nutritionist: "warning",
    psychologist: "danger",
  };
  return roleMap[role] || "info";
}

export function getStaffInsightTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    physio_note: "Physio Note",
    nutrition_compliance: "Nutrition Compliance",
    psychology_flag: "Psychology Flag",
    coach_note: "Coach Note",
  };
  return typeMap[type] || type;
}

export function getStaffInsightPrioritySeverity(priority: string): StatusSeverity {
  const priorityMap: Record<string, StatusSeverity> = {
    low: "info",
    medium: "warning",
    high: "danger",
  };
  return priorityMap[priority] || "info";
}

export function formatStaffInsightRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateFns(date, "P");
}

export function getStaffInsightMetadataEntries(
  metadata: Record<string, unknown>,
): { key: string; value: string }[] {
  return Object.entries(metadata).map(([key, value]) => ({
    key: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    value: String(value),
  }));
}

export function staffInsightHasMetadata(metadata: Record<string, unknown>): boolean {
  return Object.keys(metadata).length > 0;
}
