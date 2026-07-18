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
`event-games.service.ts`.

Still hand-rolling the triad (migrate opportunistically, one PR each, tests
first): `acwr`, `athlete-events`, `body-measurement`, `channel`,
`event-travel`, `injury`, `privacy-settings`, `readiness`.

### Not everything should migrate

Three cases found so far where `resource()` is the wrong answer. Check for
these before starting:

- **`protocol.service.ts` — do not migrate as-is.** It's a command
  (POST-to-generate), not a query, and more importantly its consumer's
  `protocolTriggered` latch is **load-bearing**: ticking an exercise on the
  Training screen is component-local state keyed by _positional_ block/exercise
  index. If the protocol re-realized mid-session those indices would point at
  different exercises, corrupting an athlete's progress mid-workout. A reactive
  resource keyed on the prescription would do exactly that. Migrating it means
  first deciding what should happen when intent changes mid-session — a product
  question, not a refactor.
- **`injury.service.ts`** — `periodization.service.ts` writes into its state
  (`this.injury.active.set([])` on logout), which a resource-derived computed
  can't accept. That coupling has to move in the same change, and the service
  feeds the engine's injury guard.
- **`body-measurement.service.ts`** — bodyweight feeds per-kg nutrition dosing.

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
