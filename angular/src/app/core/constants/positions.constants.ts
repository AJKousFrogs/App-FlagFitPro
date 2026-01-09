/**
 * Flag Football Positions Constants
 *
 * Centralized position definitions for the application.
 * Single source of truth for all position-related data.
 *
 * @example
 * // Import from barrel (recommended)
 * import { POSITION_SELECT_OPTIONS, FLAG_POSITIONS, getPositionDisplayName } from '@core/constants';
 *
 * @example
 * // Dropdown options
 * <p-select [options]="POSITION_SELECT_OPTIONS" />
 *
 * @example
 * // Grouped dropdown options
 * import { POSITION_SELECT_OPTIONS_GROUPED } from '@core/constants';
 * <p-select [options]="POSITION_SELECT_OPTIONS_GROUPED" />
 *
 * @example
 * // Get display name
 * const displayName = getPositionDisplayName('QB'); // "Quarterback"
 *
 * @example
 * // Get position category
 * import { getPositionCategory } from '@core/constants';
 * const category = getPositionCategory('WR'); // "offense"
 *
 * @example
 * // Validate position
 * import { FLAG_POSITION_ABBREVIATIONS } from '@core/constants';
 * const isValid = FLAG_POSITION_ABBREVIATIONS.includes(position);
 */

/**
 * Flag football specific positions
 * These are the primary positions used in 5v5/7v7 flag football
 */
export const FLAG_POSITIONS = {
  OFFENSE: [
    { name: "Quarterback", abbreviation: "QB", category: "offense" },
    { name: "Center", abbreviation: "C", category: "offense" },
    { name: "Wide Receiver", abbreviation: "WR", category: "offense" },
    { name: "Running Back", abbreviation: "RB", category: "offense" },
  ],
  DEFENSE: [
    { name: "Defensive Back", abbreviation: "DB", category: "defense" },
    { name: "Rusher", abbreviation: "Rusher", category: "defense" },
    { name: "Safety", abbreviation: "S", category: "defense" },
    { name: "Linebacker", abbreviation: "LB", category: "defense" },
  ],
  ALL: ["All"] as const,
} as const;

/**
 * Traditional football positions (for broader compatibility)
 * Includes positions used in traditional tackle football
 */
export const TRADITIONAL_POSITIONS = {
  OFFENSE: ["QB", "WR", "RB", "TE", "OL", "C", "G", "T"] as const,
  DEFENSE: ["DB", "CB", "S", "LB", "DL", "DE", "DT"] as const,
  SPECIAL_TEAMS: ["K", "P", "LS"] as const,
} as const;

/**
 * All flag football position abbreviations (flat array)
 */
export const FLAG_POSITION_ABBREVIATIONS = [
  "QB",
  "C",
  "WR",
  "RB",
  "DB",
  "Rusher",
  "S",
  "LB",
  "All",
] as const;

/**
 * All traditional position abbreviations (flat array)
 */
export const ALL_POSITIONS = [
  ...TRADITIONAL_POSITIONS.OFFENSE,
  ...TRADITIONAL_POSITIONS.DEFENSE,
  ...TRADITIONAL_POSITIONS.SPECIAL_TEAMS,
] as const;

/**
 * Position select options for dropdowns
 * Pre-formatted for PrimeNG Select component
 */
export const POSITION_SELECT_OPTIONS = [
  { label: "Quarterback (QB)", value: "QB" },
  { label: "Wide Receiver (WR)", value: "WR" },
  { label: "Running Back (RB)", value: "RB" },
  { label: "Center (C)", value: "C" },
  { label: "Defensive Back (DB)", value: "DB" },
  { label: "Rusher", value: "Rusher" },
  { label: "Safety (S)", value: "S" },
  { label: "Linebacker (LB)", value: "LB" },
] as const;

/**
 * Position select options grouped by category
 */
export const POSITION_SELECT_OPTIONS_GROUPED = [
  {
    label: "Offense",
    items: [
      { label: "Quarterback (QB)", value: "QB" },
      { label: "Wide Receiver (WR)", value: "WR" },
      { label: "Running Back (RB)", value: "RB" },
      { label: "Center (C)", value: "C" },
    ],
  },
  {
    label: "Defense",
    items: [
      { label: "Defensive Back (DB)", value: "DB" },
      { label: "Rusher", value: "Rusher" },
      { label: "Safety (S)", value: "S" },
      { label: "Linebacker (LB)", value: "LB" },
    ],
  },
] as const;

/**
 * Position display names mapping
 * Use for showing user-friendly position names
 */
export const POSITION_DISPLAY_NAMES: Record<string, string> = {
  QB: "Quarterback",
  WR: "Wide Receiver",
  RB: "Running Back",
  C: "Center",
  DB: "Defensive Back",
  Rusher: "Rusher",
  S: "Safety",
  LB: "Linebacker",
  TE: "Tight End",
  OL: "Offensive Line",
  G: "Guard",
  T: "Tackle",
  CB: "Cornerback",
  DL: "Defensive Line",
  DE: "Defensive End",
  DT: "Defensive Tackle",
  K: "Kicker",
  P: "Punter",
  LS: "Long Snapper",
  All: "All Positions",
};

/**
 * Get display name for a position
 */
export function getPositionDisplayName(position: string): string {
  return POSITION_DISPLAY_NAMES[position] || position;
}

/**
 * Position categories for filtering
 */
export type PositionCategory = "offense" | "defense" | "special_teams" | "all";

/**
 * Get position category
 */
export function getPositionCategory(position: string): PositionCategory {
  const offensePositions = ["QB", "WR", "RB", "C", "TE", "OL", "G", "T"];
  const defensePositions = ["DB", "CB", "S", "LB", "DL", "DE", "DT", "Rusher"];
  const specialTeamsPositions = ["K", "P", "LS"];

  if (offensePositions.includes(position)) return "offense";
  if (defensePositions.includes(position)) return "defense";
  if (specialTeamsPositions.includes(position)) return "special_teams";
  return "all";
}

/**
 * Type for valid flag football positions
 */
export type FlagPosition = (typeof FLAG_POSITION_ABBREVIATIONS)[number];

/**
 * Type for valid traditional positions
 */
export type TraditionalPosition = (typeof ALL_POSITIONS)[number];
