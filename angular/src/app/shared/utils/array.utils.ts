/**
 * Array utility functions for common operations
 * These utilities promote code reusability and consistency
 */

/**
 * Group array items by a specific key
 * @example
 * const players = [{name: 'John', team: 'A'}, {name: 'Jane', team: 'A'}];
 * groupBy(players, 'team') // { A: [{...}, {...}] }
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) {
        acc[groupKey] = [];
      }
      acc[groupKey].push(item);
      return acc;
    },
    {} as Record<string, T[]>,
  );
}

/**
 * Get unique items from array
 * @example
 * unique([1, 2, 2, 3]) // [1, 2, 3]
 * unique(players, 'id') // unique players by id
 */
export function unique<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return [...new Set(array)];
  }

  const seen = new Set();
  return array.filter((item) => {
    const k = item[key];
    if (seen.has(k)) {
      return false;
    }
    seen.add(k);
    return true;
  });
}

/**
 * Sort array by key
 * @example
 * sortBy(players, 'name', 'asc')
 */
export function sortBy<T>(
  array: T[],
  key: keyof T,
  order: "asc" | "desc" = "asc",
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });
}

/**
 * Chunk array into smaller arrays
 * @example
 * chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Get sum of numeric property
 * @example
 * sumBy(sessions, 'duration') // total duration
 */
export function sumBy<T>(array: T[], key: keyof T): number {
  return array.reduce((sum, item) => {
    const value = item[key];
    return sum + (typeof value === "number" ? value : 0);
  }, 0);
}

/**
 * Get average of numeric property
 * @example
 * averageBy(sessions, 'intensity') // average intensity
 */
export function averageBy<T>(array: T[], key: keyof T): number {
  if (array.length === 0) return 0;
  return sumBy(array, key) / array.length;
}

/**
 * Find item by property value
 * @example
 * findBy(players, 'id', '123')
 */
export function findBy<T>(
  array: T[],
  key: keyof T,
  value: unknown,
): T | undefined {
  return array.find((item) => item[key] === value);
}

/**
 * Check if array is empty
 */
export function isEmpty<T>(array: T[] | null | undefined): boolean {
  return !array || array.length === 0;
}

/**
 * Safely get first item
 */
export function first<T>(array: T[]): T | undefined {
  return array[0];
}

/**
 * Safely get last item
 */
export function last<T>(array: T[]): T | undefined {
  return array[array.length - 1];
}

/**
 * Remove duplicates and null/undefined values
 */
export function compact<T>(array: (T | null | undefined)[]): T[] {
  return array.filter((item): item is T => item != null);
}
