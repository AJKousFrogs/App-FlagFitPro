/**
 * String formatting utility functions
 */

/**
 * Capitalize first letter of string
 * @example
 * capitalize('hello') // 'Hello'
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalize first letter of each word
 * @example
 * titleCase('hello world') // 'Hello World'
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
}

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
 * Convert string to kebab-case
 * @example
 * kebabCase('helloWorld') // 'hello-world'
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
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
export function truncate(
  str: string,
  length: number,
  suffix: string = "...",
): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + suffix;
}

/**
 * Truncate to word boundary
 * @example
 * truncateWords('Hello world foo bar', 2) // 'Hello world...'
 */
export function truncateWords(
  str: string,
  count: number,
  suffix: string = "...",
): string {
  const words = str.split(" ");
  if (words.length <= count) return str;
  return words.slice(0, count).join(" ") + suffix;
}

/**
 * Remove HTML tags from string
 * @example
 * stripHtml('<p>Hello</p>') // 'Hello'
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/**
 * Format number with thousands separator
 * @example
 * formatNumber(1234567) // '1,234,567'
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency
 * @example
 * formatCurrency(1234.56) // '$1,234.56'
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format percentage
 * @example
 * formatPercent(0.1234) // '12.34%'
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format percentage (alias for formatPercent)
 * @example
 * formatPercentage(0.1234) // '12.34%'
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return formatPercent(value, decimals);
}

/**
 * Format average value
 * @example
 * formatAverage(12.345) // '12.3'
 */
export function formatAverage(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

/**
 * Format stat value with appropriate formatting
 * @example
 * formatStat(1234) // '1,234'
 * formatStat(0.756) // '75.6%'
 */
export function formatStat(
  value: number,
  type: "number" | "percent" | "average" = "number",
): string {
  if (type === "percent") {
    return formatPercent(value);
  }
  if (type === "average") {
    return formatAverage(value);
  }
  return formatNumber(value);
}

/**
 * Format file size
 * @example
 * formatFileSize(1536) // '1.5 KB'
 */
export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Format phone number (US)
 * @example
 * formatPhone('5551234567') // '(555) 123-4567'
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  return phone;
}

/**
 * Pluralize word based on count
 * @example
 * pluralize('item', 1) // 'item'
 * pluralize('item', 2) // 'items'
 */
export function pluralize(
  word: string,
  count: number,
  plural?: string,
): string {
  if (count === 1) return word;
  return plural || `${word}s`;
}

/**
 * Generate initials from name
 * @example
 * getInitials('John Doe') // 'JD'
 */
export function getInitials(name: string, maxLength: number = 2): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, maxLength)
    .join("");
}

/**
 * Pad string to specific length
 * @example
 * padStart('5', 3, '0') // '005'
 */
export function padStart(
  str: string,
  length: number,
  char: string = " ",
): string {
  return str.padStart(length, char);
}

/**
 * Pad string end to specific length
 */
export function padEnd(
  str: string,
  length: number,
  char: string = " ",
): string {
  return str.padEnd(length, char);
}

/**
 * Remove extra whitespace
 * @example
 * trimWhitespace('  hello   world  ') // 'hello world'
 */
export function trimWhitespace(str: string): string {
  return str.replace(/\s+/g, " ").trim();
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Unescape HTML entities
 */
export function unescapeHtml(str: string): string {
  const div = document.createElement("div");
  div.innerHTML = str;
  return div.textContent || "";
}

/**
 * Generate random string
 * @example
 * randomString(8) // 'a7x4m9k2'
 */
export function randomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if string contains substring (case-insensitive)
 */
export function containsIgnoreCase(str: string, search: string): boolean {
  return str.toLowerCase().includes(search.toLowerCase());
}

/**
 * Reverse string
 */
export function reverse(str: string): string {
  return str.split("").reverse().join("");
}

/**
 * Count words in string
 */
export function wordCount(str: string): number {
  return str.trim().split(/\s+/).length;
}

/**
 * Mask string (e.g., credit card, email)
 * @example
 * mask('1234567890', 6, '*') // '123456****'
 */
export function mask(
  str: string,
  visibleChars: number,
  maskChar: string = "*",
): string {
  if (str.length <= visibleChars) return str;
  return (
    str.slice(0, visibleChars) + maskChar.repeat(str.length - visibleChars)
  );
}

/**
 * Format seconds as MM:SS for display
 * @example
 * formatTimeMMSS(90) // '1:30'
 * formatTimeMMSS(null) // '--'
 */
export function formatTimeMMSS(
  seconds: number | null | undefined,
): string {
  if (seconds === null || seconds === undefined) return "--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format date/timestamp as time of day
 * @example
 * formatTimeOfDay('2025-01-11T14:30:00Z') // '2:30 PM'
 */
export function formatTimeOfDay(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(dateObj);
}
