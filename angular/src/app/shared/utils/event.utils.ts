/**
 * Typed accessors for DOM input events. This codebase has no two-way `ngModel`
 * (signals + explicit `(input)`/`(change)` handlers), so components repeatedly
 * reached into `$event.target` — previously via `$any($event.target).value`
 * (untyped) or a `val(e: Event)` helper copy-pasted into several components.
 * These are the single typed source for that.
 */

/** Value of the input/select/textarea that fired the event. */
export function eventValue(e: Event): string {
  return (e.target as HTMLInputElement).value;
}

/** Integer value of a numeric input (0 when not a finite number). */
export function eventNumber(e: Event): number {
  const n = Number.parseInt((e.target as HTMLInputElement).value, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Checked state of a checkbox/radio/switch input. */
export function eventChecked(e: Event): boolean {
  return (e.target as HTMLInputElement).checked;
}
