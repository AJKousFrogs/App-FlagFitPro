/**
 * Roster Utility Functions
 * Shared helper functions for roster components
 */

/**
 * Get full position name from abbreviation
 */
export function getPositionFullName(position: string): string {
  const positionNames: Record<string, string> = {
    QB: "Quarterback",
    WR: "Wide Receiver",
    RB: "Running Back",
    DB: "Defensive Back",
    C: "Center",
    LB: "Linebacker",
    Rusher: "Rusher",
  };
  return positionNames[position] || position;
}

/**
 * Get position icon class
 */
export function getPositionIcon(position: string): string {
  const icons: Record<string, string> = {
    Quarterback: "pi pi-user",
    "Wide Receiver": "pi pi-users",
    "Running Back": "pi pi-bolt",
    "Defensive Back": "pi pi-shield",
    Rusher: "pi pi-forward",
    Center: "pi pi-circle",
    Linebacker: "pi pi-shield",
  };
  return icons[position] || "pi pi-user";
}

/**
 * Get jersey color gradient based on position
 * Uses CSS custom properties from design system for consistency
 */
export function getJerseyColor(position: string): string {
  // These map to --color-position-* tokens in design-system-tokens.scss
  const colors: Record<string, string> = {
    QB: "var(--color-position-qb)",
    WR: "var(--color-position-wr)",
    RB: "var(--color-position-rb)",
    DB: "var(--color-position-db)",
    Rusher: "var(--color-position-rusher)",
    C: "var(--color-position-center)",
    LB: "var(--color-position-lb)",
  };
  return colors[position] || "var(--color-position-qb)";
}

/**
 * Get status severity for PrimeNG tags
 */
export function getStatusSeverity(
  status: string,
): "success" | "danger" | "secondary" | "info" | "warn" {
  switch (status) {
    case "active":
      return "success";
    case "injured":
      return "danger";
    case "limited":
      return "warn";
    case "returning":
      return "info";
    default:
      return "secondary";
  }
}

/**
 * Convert lbs to kg
 */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10;
}

/**
 * Convert kg to lbs
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

/**
 * Format weight - ensures kg is shown (converts from lbs if needed)
 * Accepts: "185 lbs", "185lbs", "84 kg", "84kg", or just "185"
 */
export function formatWeight(weight: string): string {
  if (!weight) return "-";

  const normalized = weight.toLowerCase().trim();

  // Already in kg
  if (normalized.includes("kg")) {
    return weight.trim();
  }

  // In lbs - convert to kg
  if (normalized.includes("lb")) {
    const numMatch = normalized.match(/[\d.]+/);
    if (numMatch) {
      const lbs = parseFloat(numMatch[0]);
      const kg = lbsToKg(lbs);
      return `${kg} kg`;
    }
  }

  // Just a number - assume it might be lbs if > 100, kg if <= 100
  const numMatch = normalized.match(/[\d.]+/);
  if (numMatch) {
    const num = parseFloat(numMatch[0]);
    if (num > 100) {
      // Likely lbs
      const kg = lbsToKg(num);
      return `${kg} kg`;
    }
    return `${num} kg`;
  }

  return weight;
}

/**
 * Format height - ensures cm is shown (converts from feet/inches if needed)
 * Accepts: "6'2\"", "6-2", "6ft 2in", "188 cm", "188cm", or just "188"
 */
export function formatHeight(height: string): string {
  if (!height) return "-";

  const normalized = height.toLowerCase().trim();

  // Already in cm
  if (normalized.includes("cm")) {
    return height.trim();
  }

  // Feet and inches format (6'2", 6-2, 6ft 2in, etc.)
  const feetInchesMatch = normalized.match(/(\d+)['\-ft\s]+(\d+)/);
  if (feetInchesMatch) {
    const feet = parseInt(feetInchesMatch[1], 10);
    const inches = parseInt(feetInchesMatch[2], 10);
    const cm = Math.round(feet * 30.48 + inches * 2.54);
    return `${cm} cm`;
  }

  // Just feet (6')
  const feetOnlyMatch = normalized.match(/(\d+)['\-ft]/);
  if (feetOnlyMatch) {
    const feet = parseInt(feetOnlyMatch[1], 10);
    const cm = Math.round(feet * 30.48);
    return `${cm} cm`;
  }

  // Just a number - assume cm if > 100, otherwise might be feet
  const numMatch = normalized.match(/[\d.]+/);
  if (numMatch) {
    const num = parseFloat(numMatch[0]);
    if (num > 100) {
      return `${Math.round(num)} cm`;
    }
    // Likely feet - convert
    const cm = Math.round(num * 30.48);
    return `${cm} cm`;
  }

  return height;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

/**
 * Extract years from experience string (e.g., "5 years" -> "5")
 */
export function getYears(experience: string): string {
  return experience.split(" ")[0];
}

/**
 * Get player stats as array for display
 */
export function getPlayerStats(player: {
  stats?: Record<string, number | string>;
}): Array<{ label: string; value: string | number; key: string }> {
  if (!player.stats) return [];
  return Object.entries(player.stats).map(([key, value]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: value,
    key: key,
  }));
}

/**
 * Get invitation status severity
 */
export function getInvitationStatusSeverity(invitation: {
  isExpired: boolean;
  status: string;
}): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
  if (invitation.isExpired) return "danger";
  if (invitation.status === "pending") return "info";
  if (invitation.status === "accepted") return "success";
  return "secondary";
}
