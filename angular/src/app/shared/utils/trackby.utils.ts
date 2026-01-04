/**
 * TrackBy Utility Functions
 *
 * Reusable track functions for Angular @for blocks to improve performance.
 * Track functions help Angular identify which items have changed, been added, or removed.
 *
 * @example
 * ```typescript
 * import { trackById, trackByIndex, trackByKey } from '@shared/utils/trackby.utils';
 *
 * // In template:
 * // @for (item of items; track trackById($index, item)) {
 * //   <div>{{ item.name }}</div>
 * // }
 *
 * // Or more commonly with built-in track:
 * // @for (item of items; track item.id) {
 * //   <div>{{ item.name }}</div>
 * // }
 *
 * // In component (if needed for complex scenarios):
 * readonly trackById = trackById;
 * readonly trackByIndex = trackByIndex;
 * readonly trackByName = trackByKey('name');
 * ```
 */

/**
 * Track items by their 'id' property
 * Works with any object that has an id property (string or number)
 */
export const trackById = <T extends { id: string | number }>(
  index: number,
  item: T,
): string | number => item.id;

/**
 * Track items by their array index
 * Use when items don't have a unique identifier
 */
export const trackByIndex = (index: number): number => index;

/**
 * Track items by a specific property key
 * Returns a trackBy function for the specified property
 *
 * @example
 * ```typescript
 * readonly trackByName = trackByKey('name');
 * readonly trackByEmail = trackByKey('email');
 * ```
 */
export const trackByKey =
  <T extends Record<string, unknown>>(key: keyof T) =>
  (index: number, item: T): unknown =>
    item[key];

/**
 * Track items by a combination of properties
 * Useful when you need a composite key
 *
 * @example
 * ```typescript
 * readonly trackByComposite = trackByKeys(['userId', 'timestamp']);
 * ```
 */
export const trackByKeys =
  <T extends Record<string, unknown>>(keys: Array<keyof T>) =>
  (index: number, item: T): string =>
    keys.map((key) => item[key]).join("-");

/**
 * Track items by a custom function
 * For complex tracking scenarios
 *
 * @example
 * ```typescript
 * readonly trackByFullName = trackByFn((item) => `${item.firstName}-${item.lastName}`);
 * ```
 */
export const trackByFn =
  <T>(fn: (item: T) => string | number) =>
  (index: number, item: T): string | number =>
    fn(item);
