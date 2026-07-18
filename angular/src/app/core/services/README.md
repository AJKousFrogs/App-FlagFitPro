# Service & form conventions

Forms live in `core/forms/`. See [Signal Forms](#signal-forms) at the bottom.
Note `core/forms/` (form schemas) is a different thing from `core/schemas/`
(runtime API-response validation) — confusingly similar names, unrelated jobs.

## Data-fetching services: use `resource()`

Angular 22. The house shape for "fetch something and expose it as signals" is
`resource()` — **not** a hand-rolled `_data` / `_loading` / `_error` signal
triad set imperatively inside a `load()` method.

Reference implementations, in order of usefulness:

- **`qb-throwing.service.ts`** — the pilot. Read + write + conditional gating,
  fully specced (`qb-throwing.service.spec.ts`). Copy this one.
- **`schedule.service.ts`** — the spine. Same shape, larger derived surface.

### The shape

```ts
@Injectable({ providedIn: "root" })
export class ThingService {
  private readonly api = inject(ApiService);
  private readonly supabase = inject(SupabaseService);

  private readonly thingResource = resource({
    // userId in the key ⇒ resets on logout, refetches for a different athlete.
    params: () => this.supabase.userId(),
    loader: async ({ params: userId }) => {
      if (!userId) return null;
      const res = await firstValueFrom(this.api.get<Thing>("/api/thing"));
      if (res.success && res.data) return res.data;
      throw new Error(res.error ?? "Could not load thing");
    },
  });

  readonly data = computed(() =>
    this.thingResource.hasValue() ? this.thingResource.value() : null,
  );
  readonly loading = this.thingResource.isLoading;
}
```

### Four rules, each of which cost us something to learn

**1. Guard `value()` with `hasValue()`. Always.**

`resource.value()` **throws** while the resource is in an error state. The
obvious-looking version is a bug:

```ts
// ✗ throws into every consumer on any failed request
readonly data = computed(() => this.thingResource.value() ?? null);

// ✓ degrades to null
readonly data = computed(() =>
  this.thingResource.hasValue() ? this.thingResource.value() : null,
);
```

This is not hypothetical. `schedule.service.ts` shipped the broken form: a
transient `/api/schedule` failure threw through `snapshot()` →
`nextEvent`/`currentPhase`/`density*` → ~10 consumers including the
periodization inputs, instead of showing an empty schedule. Fixed 2026-07-18,
locked by `schedule.service.resource.spec.ts`. Any new resource gets the guard.

**2. `resource()` is a READ primitive — keep mutations imperative.**

Writes stay `firstValueFrom` + a plain `_saving` signal, and call `.reload()`
on success. Don't try to route a POST through a resource.

```ts
async logThing(input: ThingInput): Promise<void> {
  this._saving.set(true);
  try {
    const res = await firstValueFrom(this.api.post("/api/thing", input));
    if (!res.success) throw new Error(res.error ?? "Could not save");
    this.thingResource.reload();   // refetch, don't hand-patch the value
  } finally {
    this._saving.set(false);
  }
}
```

`.reload()` is fire-and-forget — the caller awaits the _write_, not the
refetch. That's fine when the consumer reads `data()` reactively. If a caller
genuinely needs the fresh value before continuing, say so explicitly rather
than assuming (see `schedule.service.ts#refresh`, which sets
`resource.value` directly to avoid exactly that race).

**Reload, or publish the response?** Decide by what the response actually
contains:

- **Partial** (the mutation returns one row) → `.reload()`. You don't have the
  new list, only a piece of it. `event-games#create/update/remove`.
- **Authoritative** (the mutation returns the whole new state) →
  `resource.value.set(response)`. A refetch would re-request rows you were
  just handed. `event-games#bulkSet`, `schedule#refresh`.

Getting this backwards isn't a correctness bug, just a wasted round trip — but
on a game-day screen over hotel wifi that round trip is the difference between
instant and not.

**3. Merge the two error sources into one signal.**

A component wants one `error()`, not two. Fresh mutation errors win over stale
load errors:

```ts
readonly error = computed<string | null>(() => {
  const mutationError = this._mutationError();
  if (mutationError) return mutationError;
  const loadError = this.thingResource.error();
  if (!loadError) return null;
  return loadError instanceof Error ? loadError.message : String(loadError);
});
```

**4. `params: () => undefined` means idle. Use it for both "not applicable"
and "nothing selected yet".**

A resource whose `params` returns `undefined` stays **idle** — the loader never
runs. Two distinct uses, same mechanism:

- **Opt-in lane** — only applies to some athletes (QB throwing, cycle,
  position-specific work), so it costs nothing for everyone else.
- **No key chosen yet** — the resource is keyed on something the user picks,
  and nothing is picked. `event-games.service.ts` keys on a
  `competition_event` id; before one is selected, `undefined` keeps it quiet
  instead of firing a request for `undefined`.

The opt-in form:

```ts
private readonly enabled = signal(false);
private readonly thingResource = resource({
  params: () => (this.enabled() ? this.supabase.userId() : undefined),
  loader: /* … */,
});
enable(): void { this.enabled.set(true); }
```

`enable()` is idempotent, and a resource won't refetch for an unchanged
`params` identity — so consumers do **not** need a manual `loaded` boolean
latch. `qb-arm-care-card.component.ts` had one; it's gone.

Note `undefined` (idle, loader skipped) differs from `null` (loader runs with a
null param). Both appear in this codebase and they mean different things.

### Migration status

Migrated: `schedule.service.ts`, `qb-throwing.service.ts`,
`event-games.service.ts`, `athlete-events.service.ts`,
`event-travel.service.ts`, `injury.service.ts`.

Still hand-rolling the triad (migrate opportunistically, one PR each, tests
first): `body-measurement`, `privacy-settings`.

### Not everything should migrate

Cases where `resource()` is the wrong answer. Check for these before starting
— the sweep stopped here on purpose, not because it ran out of steam:

- **`readiness.service.ts` — do not migrate.** `calculateToday()` is a COMMAND
  (a POST that computes and writes the score server-side), triggered by events
  ("the athlete just logged wellness"), not by a params change. There is no
  natural key; you'd have to invent a counter, which is `reload()` with extra
  ceremony. It also carries a monotonic `calcRequestSeq` guard so a slower
  earlier request can't clobber a fresher score — a deliberate concurrency
  safeguard on a safety-critical value that a naive migration could lose.
- **`acwr.service.ts` — do not migrate.** A client-side calculation service
  (1328 lines) with a **realtime subscription**: `training_sessions` changes are
  PUSHED in. `resource()` is a pull primitive. It could be bolted on (realtime
  → `.reload()`), but the fetch is a small fraction of the file and the rest is
  safety-critical load maths, so the value/risk is poor.
- **`channel.service.ts`** — same realtime-push shape, 1384 lines, one consumer.
- **`protocol.service.ts` — do not migrate as-is.** It's a command
  (POST-to-generate), not a query, and more importantly its consumer's
  `protocolTriggered` latch is **load-bearing**: ticking an exercise on the
  Training screen is component-local state keyed by _positional_ block/exercise
  index. If the protocol re-realized mid-session those indices would point at
  different exercises, corrupting an athlete's progress mid-workout. A reactive
  resource keyed on the prescription would do exactly that. Migrating it means
  first deciding what should happen when intent changes mid-session — a product
  question, not a refactor.
- **`body-measurement.service.ts`** — migratable, but bodyweight feeds per-kg
  nutrition dosing, so pin the derivations with tests first.

`injury.service.ts` was on this list with the note that
`periodization.service.ts` wrote into its state (`injury.active.set([])` on
logout) and that a resource-derived computed can't accept an external write.
That turned out to be backwards: keying on `userId` made the write
**unnecessary** rather than impossible — sign-out drives the key to null, the
loader short-circuits, and `active` empties on its own. Migrated 2026-07-18;
the phantom-injury leak that write existed to prevent is now structurally
impossible and pinned by a test. Worth remembering when a coupling looks like a
blocker: check whether the new model deletes the reason for it.

The general shape of the trap: a manual `loaded`/`triggered` boolean latch in a
consumer is **usually** redundant (the pilot's was — `resource()` already
refuses to refetch for an unchanged key) but **sometimes** it is the only thing
protecting local state from a refetch. Read what the latch guards before
deleting it.

### Testing

`qb-throwing.service.spec.ts` is the template: `TestBed` + `{ provide: X,
useValue: mock }`, a `settle()` helper (`new Promise(r => setTimeout(r, 0))`)
to let the async loader resolve, and assertions on the _observable_ behaviour
(was `api.get` called? did `data()` degrade to null?) rather than on resource
internals. Cover the idle-gate explicitly — if a future Angular changes that
semantic, you want a red test, not a silent request per athlete.

---

## Signal Forms

Angular 22's `@angular/forms/signals` is **stable** in 22.0.6 (the only
`@experimental` marker in its typings is on an unrelated WebMCP helper). There
is no `ReactiveFormsModule`/`FormGroup`/`FormBuilder` anywhere in this repo and
there should not be.

Reference implementation: `core/forms/device-session.schema.ts` +
`device-data.component.ts` (migrated 2026-07-18, 19 tests).

### The shape

```ts
// core/forms/thing.schema.ts
export interface ThingForm {
  name: string;
  count: number | null;
}

export const thingSchema = schema<ThingForm>((path) => {
  required(path.name, { message: "Give it a name." });
  min(path.count, 0, { message: "Can't be negative." });
  validate(path, ({ value }) => /* cross-field rule */ null);
});
```

```ts
// component
readonly model = signal<ThingForm>(emptyThing());
readonly f = form(this.model, thingSchema);
readonly canSave = computed(() => this.f().valid());
```

```html
<input [formField]="f.name" />
```

### Four things that will bite you

**1. The directive is `[formField]`, not `[field]`.** Import `FormField` from
`@angular/forms/signals`. (`form[formRoot]` exists too, for the `<form>`
element.)

**2. You may NOT set `min`/`max`/`minlength`/`maxlength`/`required`/`disabled`/
`readonly` as template attributes on a `[formField]` node.** It's a compile
error:

```
NG8022: Setting the 'min' attribute is not allowed on nodes using
the '[formField]' directive
```

This is the framework enforcing single-sourcing, and it's the good kind of
strict: the directive PROJECTS the schema's constraints onto the DOM, so
declaring `min(path.count, 0)` in the schema is what puts `min="0"` on the
rendered input. Two sources of truth is precisely what it refuses to allow.
Move the attribute into the schema; don't work around it.

**3. `errors()` is field-local; use `errorSummary()` for a form-level message.**
A field rule (`min`, `required` on a child) does NOT appear in the root's
`errors()`. Bind a "why can't I submit" message to `f().errorSummary()` or the
form sits invalid with nothing explaining why.

**4. A custom error is just an object.** No helper needed — `ValidationError`
is `{ kind: string; message?: string }`, so a tree validator returns
`{ kind: "noMetrics", message: "…" }` or `null`.

### Why bother

Not for its own sake. The concrete wins on the pilot:

- The safety rule ("never write an all-null objective-load row", Law #7) moved
  from a `canSave` computed enforced only by a disabled button into a declared
  validator on the model — it now holds wherever the form is used.
- It became testable **without TestBed, without a fixture, without mounting
  anything** (`core/forms/device-session.schema.spec.ts`).
- A hardcoded template hint that duplicated the rule's wording is gone; the UI
  renders the schema's own message.
- Eight `[ngModel]` + `(ngModelChange)` pairs became eight `[formField]`
  bindings, which removed the last legitimate `FormsModule` usage in the app.

### Where NOT to use it

Forms that are mostly **chip rows / custom buttons** rather than native inputs
(`schedule-event-form.component.ts`, `staff/events/events.component.ts`) get
much less out of this: `[formField]` binds native form controls, so a chip row
still means `f.category().value.set(x)` by hand. The validation-schema half is
still worth it if such a form grows real cross-field rules — the binding half
is not. Judge per form; migrating one just to be consistent is not a reason.

---

## Never mutate a signal's value in place

Every component here is `OnPush` under `provideZonelessChangeDetection()`. A
signal notifies consumers when its **reference** changes. Mutating the held
array/object/Set in place changes no reference, so nothing re-renders — the
data is right and the screen is wrong, with no error anywhere. On a
load-management screen that's an athlete reading a stale prescription.

```ts
// ✗ silent staleness
this.items().push(x);
const arr = this.items();
arr.push(x);
this.chosen().add(x);

// ✓ replace the value
this.items.update((v) => [...v, x]);
this.chosen.update((s) => new Set(s).add(x));
```

Watch `.sort()` and `.reverse()` — they mutate the receiver. Fine on a fresh
array (`[...xs].sort()`, `xs.filter(…).sort()`), a bug on a signal's own array.

Audited clean 2026-07-18 (0 violations, 183 files) and enforced from then on by
`npm run check:signals` (`scripts/check-signal-mutation.mjs`), which runs in CI.
The checker **self-tests against planted positives and negatives before it
reports** — a "clean" result from a silently-broken detector is worse than no
check, because it buys false confidence.

### A failed RELOAD discards the value — use `lastGoodByKey` where that matters

`resource()` throws away its previously-loaded value when a **reload** fails:
`hasValue()` goes false, `value()` throws, `status()` is `"error"` — even
though good data was there a moment ago. Verified empirically 2026-07-18.

So the plain read means "one flaky refetch and the data is gone":

```ts
// fine for a screen where an empty state is honest
readonly data = computed(() =>
  this.res.hasValue() ? this.res.value() : [],
);

// required where losing the data changes what an athlete is told to do
readonly data = lastGoodByKey(this.res, () => this.supabase.userId(), []);
```

`lastGoodByKey` (`resource-last-good.ts`) keeps the last SUCCESSFULLY-loaded
value across a failed reload, and **drops it the moment the key changes** so a
second athlete can never inherit the first one's data.

Use it when an empty value is not merely a blank screen but a changed
decision. The two that forced it into existence:

- `injury.service` — restrictions vanish ⇒ the injury guard stops firing ⇒ an
  injured athlete gets a full session.
- `event-travel.service` — arrival hours vanish ⇒ no arrival-day cap after a
  long flight.

`event-games` deliberately does NOT use it: its pre-resource version cleared on
error too, and an empty game-day timeline is honest rather than dangerous.

> Two things this cost, both worth remembering. First, the naive
> `hasValue() ? value() : []` shipped in three migrations before anyone asked
> what a failed _reload_ does — the answer was assumed, not checked. Second,
> the first implementation used `linkedSignal`'s `previous`, passed a
> hand-driven probe, and failed its own spec: signals are lazy, so a
> resolved→error transition nobody observed never captured the good value. It
> uses an `effect` now. A probe you drive by hand reads every intermediate
> state; real consumers don't.
