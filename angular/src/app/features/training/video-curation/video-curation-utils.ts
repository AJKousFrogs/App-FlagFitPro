/**
 * Video Curation Utilities
 *
 * Helper functions and formatters for the video curation feature.
 */

import { TrainingFocus, VideoStatus } from "./video-curation.models";

/**
 * Format training focus for display
 */
export function formatFocus(focus: TrainingFocus | string): string {
  const map: Record<string, string> = {
    speed: "Speed",
    agility: "Agility",
    strength: "Strength",
    power: "Power",
    skills: "Skills",
    throwing: "Throwing",
    catching: "Catching",
    route_running: "Routes",
    coverage: "Coverage",
    rushing: "Rushing",
    recovery: "Recovery",
    mobility: "Mobility",
    injury_prevention: "Injury Prev",
    conditioning: "Conditioning",
    mental: "Mental",
    plyometrics: "Plyo",
    isometrics: "Isometrics",
    reactive_eccentrics: "Reactive",
    deceleration: "Decel",
    acceleration: "Accel",
    twitches: "Fast Twitch",
    explosive_power: "Explosive",
  };
  return map[focus] || focus;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) {
    return `${mins} min`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

/**
 * Format suggestion date to relative time
 */
export function formatSuggestionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Get PrimeNG severity for video status
 */
export function getStatusSeverity(
  status: string
): "warn" | "success" | "danger" | undefined {
  switch (status) {
    case "pending":
      return "warn";
    case "approved":
      return "success";
    case "rejected":
      return "danger";
    default:
      return undefined;
  }
}

/**
 * Position options for dropdowns
 */
export const POSITION_OPTIONS = [
  { label: "All", value: "All" },
  { label: "Quarterback", value: "QB" },
  { label: "Wide Receiver", value: "WR" },
  { label: "Defensive Back", value: "DB" },
  { label: "Rusher", value: "Rusher" },
  { label: "Center", value: "Center" },
];

/**
 * Status options for dropdowns
 */
export const STATUS_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

/**
 * Focus options for dropdowns
 */
export const FOCUS_OPTIONS = [
  { label: "Speed", value: "speed" },
  { label: "Agility", value: "agility" },
  { label: "Plyometrics", value: "plyometrics" },
  { label: "Deceleration", value: "deceleration" },
  { label: "Acceleration", value: "acceleration" },
  { label: "Route Running", value: "route_running" },
  { label: "Coverage", value: "coverage" },
  { label: "Throwing", value: "throwing" },
  { label: "Recovery", value: "recovery" },
  { label: "Strength", value: "strength" },
];

