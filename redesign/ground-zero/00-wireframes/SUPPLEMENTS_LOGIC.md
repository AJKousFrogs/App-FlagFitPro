# Evidence-based supplements — daily log + engine context

**Principle:** the evidence-based ergogenics (caffeine, creatine, beta-alanine,
nitrate, bicarbonate) genuinely affect training — but they touch **RPE and ACWR
very differently**, so the app **tracks them as context the engine reads**, it
does NOT silently fudge the ACWR number. We make the inputs honest and explain
them.

## Where it lives

- **Daily log → inside the Wellness check-in.** Supplements are a *daily* log just
  like sleep/soreness, so they're a section of the daily check-in (quick toggles +
  caffeine dose/timing). One tap per supplement.
- **Stack + history + recommendations → a Supplements screen** (`supplements.html`,
  reached from Wellness and More → Recovery & health). Set your regimen once, see
  adherence, per-supplement evidence/dosing, and the engine's recommendations.

## What's logged (per day)

`supplement_logs` already exists: `{ user_id, supplement_name, dosage, taken,
date, time_of_day, notes }`. One row per supplement per day:
- **Creatine** — taken ✓/✗, dose (default 5 g), daily.
- **Caffeine** — dose (mg), `time_of_day` (pre-session / morning / …) — timing
  matters for the RPE confound + sleep.
- **Beta-alanine** — taken ✓/✗, dose, daily.
- (extensible: nitrate/beetroot, bicarbonate, protein, vit-D, omega-3.)

⚠ **Write path to build:** `supplement_logs` is currently read-only in code (no
insert endpoint). Add `POST /api/supplements` (upsert a day's rows) + GET
(today + history). Health-adjacent → consent-gated for coach visibility like
wellness.

## How the engine uses it (context layer — NOT an ACWR input)

1. **Recommend proportionally to load (from the schedule spine).** The engine
   already knows your sprint/power density. So:
   - Sprint/power-dense week → "Creatine 3–5 g/day is well-evidenced for your
     repeated-sprint load." Beta-alanine similarly for repeated high-intensity.
   - A key session / game day → optional "Caffeine 3–6 mg/kg ~45 min pre" (with a
     sleep caution if it's late).
   - Taper/rest week → no push. **Recommend in proportion to actual load, never a
     blanket "take creatine."**
2. **Flag the caffeine → RPE confound.** Session-RPE load = RPE × duration. Caffeine
   *lowers* perceived effort, so a caffeinated session's logged sRPE load
   **under-reports** true tissue load. If caffeine is logged pre-session, mark that
   session's load **lower-confidence** and note it ("caffeine likely lowered
   today's RPE — true load may be a touch higher"). **Do NOT silently rewrite
   ACWR.** (Optional, behind a flag: a small upward load estimate; default = flag
   only.)
3. **Creatine ↔ bodyweight & real load.** Creatine adds ~1–2 kg water weight —
   the bodyweight-trend view must label this as expected (not fat gain), and
   per-kg nutrition targets use the new weight. Creatine doesn't fake ACWR; it lets
   you do **more real work**, which legitimately raises logged load.

## Athlete-facing copy (examples)

- Recommend: *"You ran 3 sprint sessions + a game this week. Creatine (5 g/day)
  supports repeated-sprint power and recovery — worth it for your load."*
- Caffeine flag on Today: *"Caffeine before today's session — your RPE will read a
  bit lower than the work deserves; we've marked the load lower-confidence."*
- Adherence: *"Creatine 6/7 days — saturation on track."*

## Evidence / dosing / cautions (for Knowledge + Merlin)

| Supplement | Use | Dose | Caution |
|---|---|---|---|
| Caffeine | ↓RPE, ↑power/alertness (acute) | 3–6 mg/kg, 45–60 min pre | sleep if late; habituation |
| Creatine | repeated-sprint/power + recovery (chronic) | 3–5 g/day, saturates ~3–4 wk | +1–2 kg water |
| Beta-alanine | buffer repeated/1–4 min efforts (chronic) | 3–6 g/day | paresthesia (tingling) |
| Nitrate/beetroot | endurance/efficiency | 5–9 mmol ~2–3 h pre | — |
| Bicarbonate | high-intensity buffering | 0.2–0.3 g/kg pre | GI distress |

Sources: IOC consensus (2018) A-list ergogenics; ISSN positions on creatine &
caffeine. Fold into `docs/PRESCRIPTION_SPEC.md` at engine-build time.

## Precedence

Supplements **inform** (recommendations + an RPE/load confidence flag); they do
**not** override the prescription and are **not** a term in the ACWR formula. They
sit alongside the data-state contract as a *confidence modifier* on logged load.
