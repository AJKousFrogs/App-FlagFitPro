/**
 * Roster Utility Functions
 * Shared helper functions for roster components
 */

// getInitials is imported directly from format.utils where needed
// getPositionDisplayName is imported from @core/constants/positions.constants

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
): "success" | "danger" | "secondary" | "info" | "warning" {
  switch (status) {
    case "active":
      return "success";
    case "injured":
      return "danger";
    case "limited":
      return "warning";
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

// getInitials() removed - import directly from @shared/utils/format.utils

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
}): "success" | "info" | "warning" | "danger" | "secondary" | "contrast" {
  if (invitation.isExpired) return "danger";
  if (invitation.status === "pending") return "info";
  if (invitation.status === "accepted") return "success";
  return "secondary";
}

/**
 * Country name to ISO 3166-1 alpha-2 code mapping
 */
const COUNTRY_TO_CODE: Record<string, string> = {
  "United States": "US",
  "United Kingdom": "GB",
  Mexico: "MX",
  Canada: "CA",
  Germany: "DE",
  Austria: "AT",
  Italy: "IT",
  France: "FR",
  Spain: "ES",
  Japan: "JP",
  Brazil: "BR",
  Poland: "PL",
  Slovenia: "SI",
  Croatia: "HR",
  Serbia: "RS",
  Hungary: "HU",
  "Czech Republic": "CZ",
  Slovakia: "SK",
  Denmark: "DK",
  Sweden: "SE",
  Norway: "NO",
  Finland: "FI",
  Netherlands: "NL",
  Belgium: "BE",
  Switzerland: "CH",
  Portugal: "PT",
  Greece: "GR",
  Israel: "IL",
  Australia: "AU",
  "New Zealand": "NZ",
  "South Korea": "KR",
  China: "CN",
  Philippines: "PH",
  India: "IN",
  Argentina: "AR",
  Colombia: "CO",
  Panama: "PA",
  Guatemala: "GT",
  "Costa Rica": "CR",
  "Puerto Rico": "PR",
  "American Samoa": "AS",
  Afghanistan: "AF",
  Albania: "AL",
  Algeria: "DZ",
  Andorra: "AD",
  Angola: "AO",
  Ireland: "IE",
  Russia: "RU",
  Ukraine: "UA",
  Turkey: "TR",
  Romania: "RO",
  Bulgaria: "BG",
  "Bosnia and Herzegovina": "BA",
  Montenegro: "ME",
  "North Macedonia": "MK",
  Lithuania: "LT",
  Latvia: "LV",
  Estonia: "EE",
  Cyprus: "CY",
  Malta: "MT",
  Luxembourg: "LU",
  Iceland: "IS",
  Egypt: "EG",
  "South Africa": "ZA",
  Nigeria: "NG",
  Kenya: "KE",
  Morocco: "MA",
  Tunisia: "TN",
  Ghana: "GH",
  Senegal: "SN",
  "Ivory Coast": "CI",
  Cameroon: "CM",
  Tanzania: "TZ",
  Ethiopia: "ET",
  "United Arab Emirates": "AE",
  "Saudi Arabia": "SA",
  Qatar: "QA",
  Kuwait: "KW",
  Bahrain: "BH",
  Oman: "OM",
  Jordan: "JO",
  Lebanon: "LB",
  Singapore: "SG",
  Malaysia: "MY",
  Thailand: "TH",
  Indonesia: "ID",
  Vietnam: "VN",
  Taiwan: "TW",
  "Hong Kong": "HK",
  Chile: "CL",
  Peru: "PE",
  Ecuador: "EC",
  Venezuela: "VE",
  Bolivia: "BO",
  Paraguay: "PY",
  Uruguay: "UY",
  "Dominican Republic": "DO",
  Jamaica: "JM",
  "Trinidad and Tobago": "TT",
  Bahamas: "BS",
  Barbados: "BB",
  Cuba: "CU",
  Haiti: "HT",
  Honduras: "HN",
  "El Salvador": "SV",
  Nicaragua: "NI",
  Belize: "BZ",
  Unknown: "",
};

/**
 * Get country code from country name
 */
export function getCountryCode(countryName: string): string {
  if (!countryName) return "";

  // Check if it's already a 2-letter code
  if (countryName.length === 2 && countryName === countryName.toUpperCase()) {
    return countryName;
  }

  return COUNTRY_TO_CODE[countryName] || "";
}

/**
 * Get country flag emoji from country name or code
 */
export function getCountryFlag(country: string): string {
  if (!country || country === "Unknown") return "🏳️";

  let countryCode = country;

  // If it's a full country name, convert to code
  if (country.length > 2) {
    countryCode = getCountryCode(country);
  }

  if (!countryCode || countryCode.length !== 2) return "🏳️";

  // Convert country code to flag emoji
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}
