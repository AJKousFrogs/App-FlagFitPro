import {
  computed,
  effect,
  signal,
  type ResourceRef,
  type Signal,
} from "@angular/core";

/**
 * Read a `resource()`'s value, keeping the last SUCCESSFULLY-loaded value when
 * a reload fails — but never carrying a value across a change of key.
 *
 * ── Why this exists ────────────────────────────────────────────────────────
 * Angular's `resource()` DISCARDS its previous value when a reload fails:
 * `hasValue()` goes false, `value()` throws, `status()` becomes "error", even
 * though good data was there a moment earlier. Verified empirically, 2026-07-18.
 *
 * So the obvious read — `computed(() => res.hasValue() ? res.value() : [])` —
 * silently means "one flaky refetch and the data is gone". For most screens
 * that is a flicker. For the services that feed the training engine it is not:
 *
 *   - `injury.service` — restrictions vanish ⇒ the injury guard stops firing
 *     ⇒ an injured athlete can be prescribed a full session.
 *   - `event-travel.service` — arrival hours vanish ⇒ the arrival-day load cap
 *     stops firing after a long flight.
 *
 * The pre-resource versions of those services only ever assigned on SUCCESS, so
 * a failed refetch left the previous data standing. This helper restores that.
 *
 * ── Why it is keyed ────────────────────────────────────────────────────────
 * "Keep the last good value" on its own reintroduces a worse bug: sign in as a
 * second athlete, have the load fail, and you would show them the FIRST
 * athlete's injuries. That is precisely the phantom-injury leak
 * `periodization.service` used to hand-guard against. So the retained value is
 * scoped to the key it was loaded for, and is dropped the moment the key
 * changes.
 *
 * Behaviour (all four pinned in resource-last-good.spec.ts):
 *   load ok               → the loaded value
 *   reload fails          → the previous value, KEPT
 *   key changes + fails   → `emptyValue`, never the old key's value
 *   key changes + ok      → the new value
 *
 * ── Why an effect and not linkedSignal ─────────────────────────────────────
 * The first version of this used `linkedSignal`, carrying the previous value
 * through its `computation(source, previous)`. It passed a hand-driven probe
 * and FAILED its own spec, for a good reason: signals are lazy. `previous` is
 * only whatever the computation last produced *when something read it*, so a
 * resolved→error transition that nobody observed in between never captured the
 * good value — the helper would silently fall back to empty exactly when a
 * consumer wasn't looking. In a template that mostly works, because change
 * detection reads constantly; "mostly works" is not a property to hand the
 * injury guard.
 *
 * The effect captures every resolved state eagerly, whether or not anyone is
 * reading.
 *
 * MUST be called in an injection context (a service field initializer or
 * constructor), because of that effect.
 *
 * @param resourceRef the resource to read
 * @param key         the same key the resource is keyed on. Compared with
 *                    `!==`, so use a primitive (a userId string, an id) — an
 *                    object literal would compare by reference and never match.
 * @param emptyValue  what to show when there is nothing valid to show
 */
export function lastGoodByKey<TKey, TValue>(
  resourceRef: ResourceRef<TValue | undefined>,
  key: () => TKey,
  emptyValue: TValue,
): Signal<TValue> {
  const lastGood = signal<{ key: TKey; value: TValue } | null>(null);

  effect(() => {
    if (resourceRef.hasValue()) {
      lastGood.set({ key: key(), value: resourceRef.value() as TValue });
    }
  });

  return computed(() => {
    if (resourceRef.hasValue()) return resourceRef.value() as TValue;
    const held = lastGood();
    // Nothing valid loaded for THIS key — never show another key's data.
    if (!held || held.key !== key()) return emptyValue;
    return held.value;
  });
}
