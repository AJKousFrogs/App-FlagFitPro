# Knowledge Base JSON Quality Audit

**Audit Date:** February 2026  
**Scope:** All `practitioners_guide_*_knowledge.json` files in `/database`  
**Focus:** Quality assessment and improvement roadmap for body-region coverage

---

## Executive Summary

| File | Quality | Entries | Critical Issues |
|------|---------|---------|-----------------|
| **hamstrings** | ⭐ Excellent | 5 | None |
| **hip_groin** | ⭐ Excellent | 5 | None |
| **isometrics** | ⭐ Excellent | 5 | None |
| **speed_testing** | ✅ Good | 3 | Sparse plyometrics mention |
| **preseason** | ✅ Good | 3 | None |
| **calf_achilles** | ⚠️ Needs work | 6 | **Corrupted answer text** (PDF extraction artifacts) |
| **shoulders** | ⚠️ Needs work | 5 | **Corrupted answer text** (author bios, layout) |

**Missing/Underrepresented Topics:** Plyometrics, quadriceps, soleus-specific, tibialis anterior, ankle (sprains, dorsiflexion), muscle fiber types (twitches).

---

## 1. Critical Quality Issues

### 1.1 Calf & Achilles — Corrupted Answer Content

The `answer` fields in `practitioners_guide_calf_achilles_knowledge.json` contain **raw PDF extraction** instead of distilled practitioner content:

- Page numbers, headers ("2 | Practitioner's Guide...")
- Expert quotes and author bios (Sue Mayes, Craig Purdam, Colin Griffin)
- Table fragments ("Days lost to injury", "Total days lost...")
- Layout artifacts (newlines, bullets, image placeholders)

**Example (current):**
```
"answer": "2 | Practitioner's Guide to the Calf & Achilles Complex\nSome Words from the Calf and Achilles Experts \nSue Mayes \nDirector of Artistic Health..."
```

**Correct approach:** Use the clean content from `seed-calf-achilles-knowledge.sql`, which has proper distilled answers.

**Recommendation:** Replace all 6 `answer` fields in the JSON with the content from the corresponding seed SQL inserts. The SQL file has the correct practitioner-ready text.

---

### 1.2 Shoulders — Corrupted Answer Content

The first entry (`shoulder_anatomy_biomechanics`) contains:

- Full author bios (Jo Clubb, Ben Ashworth)
- PDF layout text ("2 | Practitioner's Guide to Shoulders")
- About-the-authors sections

**Recommendation:** Replace corrupted answer with distilled anatomy/biomechanics content. Extract clean summary from the PDF or cross-reference with other VALD guides' anatomy entry structure.

---

## 2. Body Region Coverage Gaps

### 2.1 Plyometrics

**Current state:**

- Speed testing mentions "plyometric work" in `speed_development_training` but no protocol detail
- Database has `plyometrics_exercises` table with 70+ exercises in migrations
- No dedicated practitioner's guide JSON for plyometrics

**Needed:**

- **New JSON:** `practitioners_guide_plyometrics_knowledge.json` OR add entries to an existing guide
- Topics: plyometric progression (low → high), stretch-shortening cycle, landing mechanics, ankle stiffness (pogos, hurdles), single-leg vs bilateral, contraindications (ACL <12mo, ankle instability)
- Cross-link: Calf/achilles mentions plyometric progression in rehab; speed development references plyometrics

---

### 2.2 Quadriceps

**Current state:**

- Hamstrings guide references **hamstring:quadriceps ratio** (H:Q eccentric >0.8, conventional >0.6)
- No dedicated quadriceps anatomy, assessment, or injury content

**Needed:**

- Add `quadriceps_assessment` and `quadriceps_injury_prevention` entries (e.g., to hip_groin or new lower-limb guide)
- Knee-extension strength, patellofemoral considerations, ACL/MCL context
- H:Q ratio protocol detail

---

### 2.3 Soleus (vs Gastrocnemius)

**Current state:**

- Calf/achilles mentions both muscles; protocols specify knee-straight (gastroc) vs knee-bent (soleus)
- Soleus-specific content is minimal (recurrence: 25.1 days vs gastroc 7.7 days)

**Needed:**

- Dedicated entry: `soleus_gastrocnemius_differentiation`
- Content: when to emphasize soleus (running endurance, Achilles loading), testing each independently, soleus strain rehab specifics

---

### 2.4 Tibialis Anterior

**Current state:**

- Exercise registry mentions tibialis for "Ankle Mobility" and "shin splint prevention"
- No knowledge-base entries for tibialis, anterior tibial pain, or MTSS (medial tibial stress syndrome)

**Needed:**

- Add `tibialis_anterior_assessment` and `shin_splints_MTSS` (or ankle-stability) entries
- Likely in a new `practitioners_guide_lower_leg_ankle_knowledge.json` or expansion of calf_achilles

---

### 2.5 Ankle (Lateral Sprains, Dorsiflexion)

**Current state:**

- Calf/achilles covers plantar flexion and Achilles
- No coverage of: lateral ankle sprains, dorsiflexion mobility, ankle instability, peroneals

**Needed:**

- Entries: `ankle_sprain_rehabilitation`, `ankle_dorsiflexion_mobility`, `ankle_instability_screening`
- Cross-link: Plyometrics mentions "ankle stiffness" and "ankle instability" as contraindication

---

### 2.6 Muscle Fiber Types (Twitches)

**Current state:**

- No coverage of Type I (slow-twitch) vs Type II (fast-twitch) in knowledge base
- Relevant for: sprint vs endurance programming, position-specific training

**Needed:**

- Consider adding to speed testing or a general "training science" guide
- Topics: fiber type distribution by sport, training adaptations, testing implications

---

## 3. Schema Consistency

### 3.1 Protocols Format

| File | Protocols format |
|------|------------------|
| hamstrings | Object `{sets_reps, frequency, progression}` |
| hip_groin | Nested object with detailed phase structure |
| isometrics | Object `{equipment, trials, key_metrics}` |
| calf_achilles | Object (when not corrupted) |

**Recommendation:** Standardize on object format. Include: `equipment`, `key_metrics`, `frequency`, `progression` where applicable.

---

### 3.2 Safety Fields

| File | contraindications | safety_warnings |
|------|-------------------|-----------------|
| hamstrings | ✓ | ✓ |
| hip_groin | ✓ (in one entry) | ✗ |
| calf_achilles | ✓ | ✓ |
| isometrics | ✗ | ✗ |
| shoulders | ✗ | ✗ |

**Recommendation:** Add `contraindications` and `safety_warnings` to injury-type entries across all guides.

---

## 4. Improvement Roadmap

### Phase 1: Fix Corrupted Content (High Priority)

1. **calf_achilles JSON:** Replace all 6 `answer` fields with content from `seed-calf-achilles-knowledge.sql`
2. **shoulders JSON:** Replace corrupted anatomy entry; audit remaining 4 entries for similar issues

### Phase 2: Expand Calf/Lower Leg Coverage (Medium Priority)

3. Add **soleus-specific** entry to calf_achilles (or new lower-leg guide)
4. Add **tibialis / shin splints / ankle** entries — either new `ankle_lower_leg_knowledge.json` or extend calf_achilles
5. Add **ankle sprain rehab** and **dorsiflexion mobility** entries

### Phase 3: Add Missing Guides/Entries (Medium Priority)

6. Create **plyometrics** knowledge: new JSON or expand speed_testing
7. Add **quadriceps** entries (assessment, H:Q protocol) to hamstrings or new guide
8. Add **muscle fiber types** to speed or preseason guide (optional)

### Phase 4: Schema & Cross-Linking (Lower Priority)

9. Standardize protocols format across all files
10. Add contraindications/safety_warnings where missing
11. Cross-reference entries (e.g., isometrics ↔ hamstring/hip testing; plyometrics ↔ ankle stiffness)

---

## 5. Content Quality Checklist (Per Entry)

When creating or revising entries, ensure:

- [ ] `answer`: 2–4 concise paragraphs, no PDF artifacts
- [ ] `summary`: 1–2 sentences
- [ ] `protocols`: Structured object with equipment, metrics, frequency
- [ ] `best_practices`: 5–8 actionable items
- [ ] `applicable_to`: Specific athlete populations
- [ ] `tags`: Searchable keywords
- [ ] Injury entries: Include `contraindications` and `safety_warnings`

---

## 6. File-by-File Summary

### practitioners_guide_hamstrings_knowledge.json — ⭐ Keep as Reference Standard

- 5 entries: injuries, assessment, rehab, prevention, Nordic programming
- Clean, evidence-based, well-structured
- Use as template for other guides

### practitioners_guide_hip_groin_knowledge.json — ⭐ Keep as Reference

- 5 entries: anatomy, pathologies, assessment, rehab, prevention
- Doha Agreement, add:abd ratio, COD criteria
- Well-structured protocols

### practitioners_guide_isometrics_knowledge.json — ⭐ Keep

- 5 entries: testing protocols, strength development, interpretation, rehab, screening
- Could add muscle-group-specific protocols (hamstring, hip, calf) as sub-entries

### practitioners_guide_calf_achilles_knowledge.json — ⚠️ Fix Then Keep

- 6 entries with good structure; **answers need full rewrite** from seed SQL
- Expand with soleus, tibialis, ankle content

### practitioners_guide_shoulders_knowledge.json — ⚠️ Fix Then Keep

- 5 entries; first entry corrupted
- Audit all entries for PDF artifacts

### practitioners_guide_speed_testing_knowledge.json — ✅ Good

- 3 entries; add plyometrics link/protocol if expanding

### practitioners_guide_preseason_knowledge.json — ✅ Good

- 3 entries; consider adding muscle-fiber/periodization context if desired

---

## 7. Sync with Seed SQL

The **seed SQL files** are the source of truth for what gets inserted into Supabase. Ensure:

1. JSON content matches or informs seed SQL `answer` values
2. New JSON entries have corresponding `INSERT` statements in seed scripts
3. Run `seed-*.sql` after JSON changes to update the database

---

---

## 8. Completed Improvements (Feb 2026)

### Phase 1: Fixed Corrupted Content ✓
- **calf_achilles**: All 6 entries rewritten with clean practitioner content; added soleus and ankle/tibialis entries
- **shoulders**: All 5 entries rewritten; removed author bios and PDF artifacts

### Phase 2: Lower Leg Expansion ✓
- Added `soleus_gastrocnemius_differentiation` to calf_achilles
- Added `ankle_dorsiflexion_tibialis_assessment` to calf_achilles

### Phase 3: Plyometrics & Quadriceps ✓
- Created `practitioners_guide_plyometrics_quadriceps_knowledge.json` with 4 entries:
  - plyometric_progression_protocol
  - ankle_stiffness_plyometric_foundation
  - quadriceps_assessment_hamstring_ratio
  - single_leg_plyometrics_sport_specificity

### Phase 4: Flag Football Monitoring ✓
- Created `flag_football_athlete_monitoring_knowledge.json` from "Evaluation of Flag Football Athlete Monitoring Metrics" PDF
- 7 entries covering: training load, ACWR, readiness, wellness, body composition, QB throwing, composite score caveats
- Evidence-based with Gabbett, Malone, Saw, Impellizzeri, Roe, Catapult, NSCA references
