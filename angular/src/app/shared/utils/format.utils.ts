/**
 * String formatting utility functions
 */

/**
 * Convert string to camelCase
 * @example
 * camelCase('hello world') // 'helloWorld'
 */
export function camelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

/**
 * Convert string to snake_case
 * @example
 * snakeCase('helloWorld') // 'hello_world'
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
}

/**
 * Truncate string to specified length
 * @example
 * truncate('Hello World', 5) // 'Hello...'
 */
export function truncate(str: string, length: number, suffix = "..."): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + suffix;
}

/**
 * Format number with thousands separator
 * @example
 * formatNumber(1234567) // '1,234,567'
 */
export function formatNumber(num: number, decimals = 0): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Generate initials from name
 * Handles empty/null names gracefully
 * @example
 * getInitials('John Doe') // 'JD'
 * getInitials('John') // 'J'
 * getInitials('') // ''
 */
export function getInitials(name: string, maxLength = 2): string {
  if (!name || !name.trim()) {
    return "";
  }
  return name
    .trim()
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, maxLength)
    .join("");
}

/**
 * Pad string to specific length
 * @example
 * padStart('5', 3, '0') // '005'
 */
export function padStart(str: string, length: number, char = " "): string {
  return str.padStart(length, char);
}

/**
 * Pad string end to specific length
 */
export function padEnd(str: string, length: number, char = " "): string {
  return str.padEnd(length, char);
}

/**
 * Normalize player/user name from various formats
 * Handles full_name, first_name + last_name, email fallback
 *
 * @example
 * normalizePlayerName({ full_name: 'John Doe' }) // 'John Doe'
 * normalizePlayerName({ first_name: 'John', last_name: 'Doe' }) // 'John Doe'
 * normalizePlayerName({ email: 'john@example.com' }) // 'john'
 * normalizePlayerName({}) // 'Unknown'
 */
export function normalizePlayerName(
  data: {
    full_name?: string | null;
    fullName?: string | null;
    first_name?: string | null;
    firstName?: string | null;
    last_name?: string | null;
    lastName?: string | null;
    email?: string | null;
  },
  fallback = "Unknown",
): string {
  // Try full_name first (snake_case or camelCase)
  if (data.full_name?.trim()) {
    return data.full_name.trim();
  }
  if (data.fullName?.trim()) {
    return data.fullName.trim();
  }

  // Build from first_name + last_name
  const firstName = data.first_name || data.firstName || "";
  const lastName = data.last_name || data.lastName || "";
  const combined = [firstName, lastName].filter(Boolean).join(" ").trim();

  if (combined) {
    return combined;
  }

  // Fallback to email username
  if (data.email) {
    const emailUsername = data.email.split("@")[0];
    if (emailUsername) {
      return emailUsername;
    }
  }

  return fallback;
}
