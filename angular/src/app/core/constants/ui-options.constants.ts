/**
 * UI Options Constants
 *
 * Centralized UI option definitions for dropdowns, radio buttons, and toggles.
 * Single source of truth for privacy, theme, language, and other UI options.
 *
 * @example
 * // Import from barrel (recommended)
 * import { VISIBILITY_OPTIONS, THEME_OPTIONS, LANGUAGE_OPTIONS } from '@core/constants';
 *
 * @example
 * // Visibility dropdown
 * <p-select [options]="VISIBILITY_OPTIONS" />
 *
 * @example
 * // Theme selector (select button)
 * <p-selectbutton [options]="THEME_OPTIONS" />
 *
 * @example
 * // Language selector
 * <p-select [options]="LANGUAGE_OPTIONS" />
 *
 * @example
 * // Unit preferences
 * import { WEIGHT_UNIT_OPTIONS, HEIGHT_UNIT_OPTIONS } from '@core/constants';
 * <p-select [options]="WEIGHT_UNIT_OPTIONS" />
 *
 * @example
 * // Notification preferences
 * import { NOTIFICATION_FREQUENCY_OPTIONS } from '@core/constants';
 * <p-select [options]="NOTIFICATION_FREQUENCY_OPTIONS" />
 */

// =============================================================================
// VISIBILITY & PRIVACY OPTIONS
// =============================================================================

/**
 * Profile visibility options
 * Controls who can see a user's profile
 */
export const VISIBILITY_OPTIONS = [
  {
    label: "Public",
    value: "public",
    icon: "pi pi-globe",
    description: "Anyone can see your profile",
  },
  {
    label: "Team Only",
    value: "team",
    icon: "pi pi-users",
    description: "Only your team can see your profile",
  },
  {
    label: "Private",
    value: "private",
    icon: "pi pi-lock",
    description: "Only you can see your profile",
  },
] as const;

/**
 * Resource visibility options (for knowledge base, playbooks, etc.)
 */
export const RESOURCE_VISIBILITY_OPTIONS = [
  { label: "Team only", value: "team" },
  { label: "Coaches only", value: "coaches" },
  { label: "Private", value: "private" },
] as const;

/**
 * Staff visibility options - what parts of the app staff can access
 */
export const STAFF_VISIBILITY_OPTIONS = [
  { label: "Team Roster", value: "roster", icon: "pi pi-users" },
  { label: "Training Data", value: "training", icon: "pi pi-chart-line" },
  { label: "Wellness Data", value: "wellness", icon: "pi pi-heart" },
  { label: "Analytics", value: "analytics", icon: "pi pi-chart-bar" },
  { label: "Chat & Messages", value: "chat", icon: "pi pi-comments" },
] as const;

/**
 * Type for visibility values
 */
export type VisibilityLevel = "public" | "team" | "coaches" | "private";

// =============================================================================
// THEME OPTIONS
// =============================================================================

/**
 * Theme mode options for appearance settings
 */
export const THEME_OPTIONS = [
  { label: "Light", value: "light", icon: "pi pi-sun" },
  { label: "Dark", value: "dark", icon: "pi pi-moon" },
  { label: "System", value: "auto", icon: "pi pi-desktop" },
] as const;

/**
 * Theme mode type
 */
export type ThemeMode = "light" | "dark" | "auto";

// =============================================================================
// LANGUAGE OPTIONS
// =============================================================================

/**
 * Language options for internationalization
 */
export const LANGUAGE_OPTIONS = [
  { label: "English", value: "en", flag: "🇺🇸" },
  { label: "Spanish", value: "es", flag: "🇪🇸" },
  { label: "French", value: "fr", flag: "🇫🇷" },
  { label: "German", value: "de", flag: "🇩🇪" },
  { label: "Portuguese", value: "pt", flag: "🇧🇷" },
] as const;

/**
 * Language code type
 */
export type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["value"];

// =============================================================================
// NOTIFICATION PREFERENCES
// =============================================================================

/**
 * Notification frequency options
 */
export const NOTIFICATION_FREQUENCY_OPTIONS = [
  { label: "Immediately", value: "immediate" },
  { label: "Daily digest", value: "daily" },
  { label: "Weekly digest", value: "weekly" },
  { label: "Never", value: "never" },
] as const;

/**
 * Notification type options for filtering
 */
export const NOTIFICATION_TYPE_OPTIONS = [
  { label: "Training", value: "training", icon: "pi pi-calendar" },
  { label: "Team Updates", value: "team", icon: "pi pi-users" },
  { label: "Messages", value: "messages", icon: "pi pi-envelope" },
  { label: "Alerts", value: "alerts", icon: "pi pi-exclamation-triangle" },
  { label: "Achievements", value: "achievements", icon: "pi pi-star" },
] as const;

// =============================================================================
// UNIT PREFERENCES
// =============================================================================

/**
 * Weight unit options
 */
export const WEIGHT_UNIT_OPTIONS = [
  { label: "Kilograms (kg)", value: "kg" },
  { label: "Pounds (lb)", value: "lb" },
] as const;

/**
 * Height unit options
 */
export const HEIGHT_UNIT_OPTIONS = [
  { label: "Centimeters (cm)", value: "cm" },
  { label: "Feet/Inches", value: "ft" },
] as const;

/**
 * Distance unit options
 */
export const DISTANCE_UNIT_OPTIONS = [
  { label: "Kilometers", value: "km" },
  { label: "Miles", value: "mi" },
  { label: "Yards", value: "yd" },
] as const;

/**
 * Unit preference type
 */
export type UnitSystem = "metric" | "imperial";

// =============================================================================
// TIME & DATE PREFERENCES
// =============================================================================

/**
 * Time format options
 */
export const TIME_FORMAT_OPTIONS = [
  { label: "12-hour (1:00 PM)", value: "12h" },
  { label: "24-hour (13:00)", value: "24h" },
] as const;

/**
 * Date format options
 */
export const DATE_FORMAT_OPTIONS = [
  { label: "MM/DD/YYYY", value: "MM/dd/yyyy" },
  { label: "DD/MM/YYYY", value: "dd/MM/yyyy" },
  { label: "YYYY-MM-DD", value: "yyyy-MM-dd" },
] as const;

/**
 * Week start options
 */
export const WEEK_START_OPTIONS = [
  { label: "Sunday", value: 0 },
  { label: "Monday", value: 1 },
] as const;

// =============================================================================
// SKILL LEVEL OPTIONS
// =============================================================================

/**
 * Skill level options for training and content
 */
export const SKILL_LEVEL_OPTIONS = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
  { label: "All Levels", value: "all" },
] as const;

/**
 * Skill level type
 */
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "all";

// =============================================================================
// GENDER OPTIONS
// =============================================================================

/**
 * Gender options for profile
 */
export const GENDER_OPTIONS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
  { label: "Prefer not to say", value: "unspecified" },
] as const;

// =============================================================================
// COMBINED EXPORTS
// =============================================================================

/**
 * All UI options in one export
 */
export const UI_OPTIONS = {
  VISIBILITY: VISIBILITY_OPTIONS,
  RESOURCE_VISIBILITY: RESOURCE_VISIBILITY_OPTIONS,
  STAFF_VISIBILITY: STAFF_VISIBILITY_OPTIONS,
  THEME: THEME_OPTIONS,
  LANGUAGE: LANGUAGE_OPTIONS,
  NOTIFICATION_FREQUENCY: NOTIFICATION_FREQUENCY_OPTIONS,
  NOTIFICATION_TYPE: NOTIFICATION_TYPE_OPTIONS,
  WEIGHT_UNIT: WEIGHT_UNIT_OPTIONS,
  HEIGHT_UNIT: HEIGHT_UNIT_OPTIONS,
  DISTANCE_UNIT: DISTANCE_UNIT_OPTIONS,
  TIME_FORMAT: TIME_FORMAT_OPTIONS,
  DATE_FORMAT: DATE_FORMAT_OPTIONS,
  WEEK_START: WEEK_START_OPTIONS,
  SKILL_LEVEL: SKILL_LEVEL_OPTIONS,
  GENDER: GENDER_OPTIONS,
} as const;
