# Weather as a training constraint (engine + UX)

**Principle:** weather doesn't change your *fitness* (ACWR is load history), but it
**constrains which session is safe to do outdoors today** — wet grass makes
sprints/cuts an ACL risk; heat makes outdoor plyometrics/sprints dangerous;
lightning stops everything outdoors. So weather is a **constraint layer on the
prescribed intent**, which in turn changes the target RPE/load. It sits in the
engine precedence and is surfaced on Today and Game-day.

## Where it sits (precedence)

```
1. Physio injury / RTP        — ABSOLUTE block (unchanged)
2. Coach override             — "we train/play regardless" can override weather
3. WEATHER GUARD  ← NEW       — relocate / substitute / scale the engine's intent
4. Nutritionist plan          — nutrition/hydration only
5. Auto-engine (prescribeFor) — chooses the base intent
```

The engine picks a base intent (sprint / plyo-ish mixed / strength / mobility …);
the **weather guard** then checks whether that intent is safe **outdoors** given
conditions + venue, and may **relocate** (move indoors), **substitute** (swap to a
weather-safe intent), **scale** (reduce volume / raise effective load), or pass
through unchanged. A coach override bypasses it.

## Data source (already exists)

`GET /api/weather` → Open-Meteo (free, no key). Returns temp, **apparent/feels-like
temp**, humidity, wind, precipitation, weather_code, condition, and a `suitability`
level. Location = the event venue lat/lon (`competition_events`) when there's an
event, else the athlete's city/location.

> ⚠ **Unit fix required:** `weather.js` currently requests Fahrenheit + mph. This
> is a metric club (Ljubljana; `users.preferred_units = metric`) — switch the
> Open-Meteo call to `temperature_unit=celsius`, `wind_speed_unit=kmh`,
> `precipitation_unit=mm` (and reconcile `ai-chat.js`'s bare `temperature > 30`
> check, which is unit-ambiguous). All thresholds below are **°C**.

## Constraint matrix (PROPOSED DEFAULTS — confirm/tune these)

Affected outdoor intents = **sprint, plyometric/explosive, agility/cutting,
conditioning, max-velocity**. Strength (indoor), mobility, technical/skills, and
recovery are generally weather-agnostic.

| Condition | Trigger | Action on intense outdoor intents |
|---|---|---|
| **Wet / rain** | weather_code ≥ 61, or precipitation > 0.5 mm, or rained < ~3h ago | Wet grass → slip/ACL risk on sprints/cuts/plyo → **relocate indoors**; if no indoor → **substitute** (sprint→tempo/strength indoors · plyo→gym lower-body · agility→technical/film). Drizzle (51–55) = caution only. |
| **Thunderstorm** | weather_code 95–99 (lightning) | **HARD STOP outdoors** → indoor only or rest. No exceptions (even coach override warns). |
| **Heat — caution** | apparent ≥ 28 °C | Proceed + hydration emphasis + breaks. |
| **Heat — reduce** | apparent ≥ 32 °C | Cut intense-outdoor volume ~20%, shift to cooler hour, add cooling. **Heat load-scaling applies** (below). |
| **Heat — avoid** | apparent ≥ 35 °C | No intense outdoor (sprint/plyo/conditioning) → **relocate** indoors or **substitute** mobility/skills/recovery. |
| **Heat — stop** | apparent ≥ 38 °C | Outdoor training not advised → indoor or rest. |
| **Cold — caution** | apparent ≤ 4 °C | Extended warm-up; trim max-velocity sprint/plyo (cold-muscle strain). |
| **Cold — avoid** | apparent ≤ −5 °C (or windchill) | No outdoor max-effort → indoor / low-intensity. |
| **Wind** | ≥ 40 km/h | Throwing accuracy + sprint timing unreliable → deprioritise QB throwing tests & speed testing (not a safety stop). |

*(These are sports-science-aligned starting points — WBGT would be ideal but
apparent-temp + humidity is the available proxy. **Tell me the exact numbers you
want** and I'll lock them; they're easy to make team-configurable later, like the
ACWR/readiness thresholds.)*

## The ACWR / RPE connection (heat load-scaling)

In heat, the **same external work costs more physiologically** — so:
- **Effective internal load** of a session is scaled by a heat factor so ACWR
  reflects true strain: ×1.1 at apparent ≥ 32 °C, ×1.2 at ≥ 35 °C (mirrors the
  existing wellness load-scaling factor). This feeds `training_sessions.workload`.
- **Perceived RPE** runs ~1 point higher in heat — the UI warns "expect RPE to
  feel ~1 higher today; log what you actually felt." We store the *actual* RPE
  the athlete reports (don't fake it); the heat factor adjusts the load model, not
  the logged RPE.

Cold/rain do **not** scale load — they relocate/substitute the session, which
changes intent → which changes the planned RPE/volume via the normal prescription.

## Engine change (`prescribeFor`)

- **Input:** add `weather` `{ tempC, apparentC, condition, weatherCode, precipMm,
  windKmh, suitability }` (null = unknown → fail safe: warn "check conditions",
  don't silently allow intense outdoor in unknown weather near an event).
- **Output:** add `weatherAdjustment { applied: bool, action: 'relocate' |
  'substitute' | 'scale' | 'stop' | 'none', originalIntent, adjustedIntent,
  reason }`, and prepend the reason to `reasoning` when applied
  (e.g. *"Rain on grass — sprints moved indoors to a tempo + strength session."*).
- Implement after thresholds are confirmed; add regression cases to
  `periodization.service.spec.ts` (rain→substitute, ≥35 °C→relocate,
  thunderstorm→stop, heat→load-scale, coach-override→bypass). Fold this section
  into `docs/PRESCRIPTION_SPEC.md` at implementation time.
