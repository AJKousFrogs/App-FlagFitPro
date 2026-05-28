# FlagFit Pro — Science, Data & Math Audit

**Date:** 2026-05-29 · **Scope:** evidence content, calculation correctness (ACWR especially), and Supabase persistence per athlete. Read-only. Live project: `grfjmnjpzvknmsxrwesx` (Postgres 17, eu-west-3).

## Verdict
- **Content:** genuinely evidence-based and rich (Gabbett, Haugen, ISSN, IOC, APTA citations) — but **largely inert**: it's reference data the prescription/ACWR/readiness logic does not consume.
- **Math:** mostly sound and cited, but **one headline correctness issue** (canonical ACWR is the outdated method) plus several gaps.
- **Persistence:** comprehensive schema, **RLS on every table**, reads are `auth.uid()`-scoped, sensitive writes are server-mediated — a sound security baseline. But athlete-identity keying is **inconsistent (3 conventions)**, wellness/hydration tables are **duplicated**, and the evidence corpus **isn't loaded** into the live DB.

---

## 1. HEADLINE — ACWR is not state-of-the-art where it counts

**The canonical engine uses the method the literature has moved away from.**

- **Server (canonical, drives readiness + prescriptions)** — `netlify/functions/calc-readiness.js:596–612`:
  - acute = 7-day **sum**; chronic = 28-day **sum ÷ 4** = rolling weekly average;
  - **coupled** — the 28-day chronic window *includes* the 7-day acute window.
- **Client (better, but bypassed)** — `acwr.service.ts:230–345`: true **EWMA** (λ_acute 0.2, λ_chronic 0.05), chronic-load floor (50 AU), min-days/min-sessions safeguards, weekly-increase cap. This is the good implementation — and it's **not canonical**, so it's effectively unused.

**Why it matters (web-grounded):**
- **EWMA > rolling average** — places weight on recent load and models fitness decay; more sensitive to injury risk ([Williams 2017](https://www.researchgate.net/publication/311860780)).
- **Coupled ACWR causes spurious correlation** via mathematical coupling (acute is inside chronic) ([Lolli 2017](https://pubmed.ncbi.nlm.nih.gov/29101104/)). Prefer **uncoupled** (chronic = the 21 days *before* the acute week).
- **ACWR is not a magic number** — it adds noise and shouldn't be a sole gate ([Impellizzeri 2020](https://pubmed.ncbi.nlm.nih.gov/32502973/)). Best practice: use EWMA + uncoupled, treat it as **one weighted input** alongside wellness/sleep (the readiness composite already does this — good), and don't over-trust thresholds.

**Recommended fix (state-of-the-art ACWR):** make the **server** the single source using **EWMA + uncoupled**, port the client's safeguards (chronic floor, min-history), keep ACWR as one input of the readiness composite, and retire the client's parallel computation (read-through). Add regression tests. *This changes athlete-facing numbers and lives in a Netlify function + reads `training_sessions` — flag before merge.*

---

## 2. Other math findings (formulas verified, file:line)
- **Readiness composite** (`calc-readiness.js:745–794`): workload 35% / wellness 30% / sleep 20% / proximity 15%; cut-points <55 deload, 55–75 maintain, >75 push; reduced-data mode boosts sleep ×1.5. Weights are reasonable and cite Halson 2014 / Saw 2016. **OK**, but cut-points are uncalibrated starting points.
- **Prescription** (`periodization.service.ts`): ACWR>1.5 → full rest; readiness<55 → recovery; taper ≤24h. Spec-perfect, 30/30 tests. **Note:** deload is **binary** (full rest), not graduated (50→75% progression). [DEFER]
- **Load** (`load-monitoring.service.ts`): internal = RPE×min (sRPE ✓). External-load normalization (10km=100, 500m=100) and wellness-factor multipliers (0.8–1.3) are **uncited magic numbers**. [DEFER]
- **Nutrition** (`nutrition.js`): Mifflin-St Jeor BMR, protein 1.8 g/kg, carbs 3–8 g/kg by intent, hydration 33 ml/kg + activity — all within consensus ranges. **OK.**
- **No "inflamed muscle" / soreness-escalation logic**, **sleep logged but weakly fed back**, **hydration not tournament-density-scaled**. [DEFER — UX-driven]

---

## 3. Content findings — rich, evidence-based, but inert
- **Strong & cited:** strength, sprint (Haugen, Al Attar Nordic 51%↓), plyometrics, isometrics (VALD), periodization (8-phase annual), nutrition/supplements (ISSN/IOC/AIS), injury & return-to-play protocols (APTA 2024) — in the `*.data.ts` encyclopedia files + `netlify/functions/recovery.js` (foam rolling, massage gun, compression, contrast, cryo/heat, manual therapy).
- **Gaps vs your list:** **TENS, Venom Go, Thai massage** not represented; compression **boots vs leggings** not differentiated; sweat-rate input not captured.
- **Critical:** the content is **not wired into logic** — `prescribeFor`/ACWR/readiness don't consume the evidence, injury protocols aren't machine-gated, recovery isn't escalated by soreness/ACWR. The app "knows the right answer but doesn't act on it." [DEFER — the biggest UX-driven opportunity]
- **Evidence corpus not loaded:** `research_articles`, `knowledge_base_entries`, `load_management_research` are **empty** in the live DB despite seed SQL existing. [NEEDS-DECISION — load the seeds]

---

## 4. Persistence findings (live DB)
- ✅ **RLS enabled on all ~190 tables**; SELECT/UPDATE/DELETE policies are `auth.uid()`-scoped → real per-athlete read protection.
- ✅ **Server-mediated writes** for sensitive data (`daily_wellness_checkin`, `injuries`, `workout_logs` are service-role-only writes) — good pattern.
- ⚠️ **Three athlete-identity conventions:** `user_id` (most), `athlete_id` (athlete_daily_state, recovery_sessions, wellness_entries, readiness_scores), `player_id` (injuries, load_daily, load_metrics, workout_logs). Inconsistent keying complicates joins/RLS. [NEEDS-DECISION — standardize]
- ⚠️ **Wellness table sprawl:** `daily_wellness_checkin` (data, server-written) + `wellness_entries` (data, athlete_id) + `wellness_logs` + `wellness_data` (empty). Pick one canonical. [NEEDS-DECISION]
- ⚠️ **Hydration:** code writes `hydration_logs`, but the purpose-built `athlete_hydration_logs` (5 policies, "feeds push-notification adherence") is **empty/unused**. Wire code to the intended table. [NEEDS-DECISION — resolves the earlier hydration-persistence item]
- ℹ️ Live DB is **pre-launch**: 8 users, 2 wellness check-ins, 9 competition events, 65 exercises, 2 daily protocols. Plumbing works; little data yet.
- ℹ️ Not verified: INSERT-policy `with_check` expressions (only `USING` quals were checked); full `get_advisors` security report saved but not yet read.

---

## Triage
**FIX-NOW (high-value, verifiable; changes engine numbers → confirm before merge):**
1. ✅ **DONE (2026-05-29) — State-of-the-art ACWR.** Found **four** implementations (calc-readiness inline rolling-avg, compute-acwr JS rolling-avg, a `compute_acwr` Postgres stored proc, and the client's recency-inverted EWMA). Replaced with one canonical EWMA + uncoupled util `netlify/functions/utils/acwr.js`; both server endpoints now use it; `compute-acwr` no longer depends on the rolling-avg stored proc. New unit tests (8) + periodization 30/30 still pass. Client `acwr.service.ts` flagged for port-time reconciliation (recency bug + coupled window). **New deferred item:** drop the superseded `compute_acwr` Postgres function (migration → data decision).

**NEEDS-DECISION (Supabase schema/data):**
2. Standardize athlete identity column across tables (`user_id` vs `athlete_id` vs `player_id`).
3. Consolidate 4 wellness tables → 1 canonical; 2 hydration tables → 1 (`athlete_hydration_logs`), and point the code at it.
4. Load the evidence-corpus seeds (`research_articles`, `knowledge_base_entries`) into the live DB.

**DEFER (UX-driven, verify on real screens):**
5. Wire evidence content into `prescribeFor` / recovery-escalation / RTS gating (the big opportunity).
6. Add missing modalities (TENS, Venom Go, Thai massage), graduated deload, soreness/"inflamed-muscle" escalation, sleep→load feedback, tournament-density hydration scaling.

## Sources
- Williams et al. 2017 — EWMA vs rolling ACWR — https://www.researchgate.net/publication/311860780
- Lolli et al. 2017 — mathematical coupling / spurious correlation — https://pubmed.ncbi.nlm.nih.gov/29101104/
- Impellizzeri et al. 2020 — ACWR conceptual pitfalls — https://pubmed.ncbi.nlm.nih.gov/32502973/
- Science for Sport — ACWR overview — https://www.scienceforsport.com/acutechronic-workload-ratio/
