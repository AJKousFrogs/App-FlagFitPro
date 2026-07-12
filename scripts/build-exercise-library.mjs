#!/usr/bin/env node
// Tissue Load Engine — exercise library builder.
//
// Expands the curated movement families (database/library/families.mjs) into
// distinct, fully-attributed exercise rows, validates them against the schema's
// controlled vocabularies + the tissue registry, and emits an IDEMPOTENT seed
// (INSERT … ON CONFLICT (slug) DO UPDATE) plus a JSON manifest and stats.
//
//   node scripts/build-exercise-library.mjs            # write seed + manifest, print stats
//   node scripts/build-exercise-library.mjs --print-sql  # emit SQL to stdout (for MCP apply)
//
// tissue_targets are DERIVED from each exercise's movement tag via the registry,
// so the safety filter never depends on name keywords.

import {
  writeFileSync,
  readFileSync as _readFileSync,
  existsSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  TISSUES,
  MOVEMENT_TO_TISSUES,
} from "../database/library/tissue-registry.mjs";
import { FAMILIES as FAMILIES_REHAB } from "../database/library/families.mjs";
import { FAMILIES_GENERAL } from "../database/library/families-general.mjs";

const FAMILIES = [...FAMILIES_REHAB, ...FAMILIES_GENERAL];

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const ENUMS = {
  contraction_type: [
    "isometric",
    "concentric",
    "eccentric",
    "isotonic",
    "plyometric",
    "stretch",
    "mixed",
  ],
  joint_emphasis: ["knee_bent", "knee_straight", "neutral", "n/a"],
  loading_rate_band: ["none", "low", "moderate", "high", "very_high"],
  evidence_tier: [
    "META",
    "RCT",
    "COHORT",
    "CONSENSUS",
    "HEURISTIC",
    "CONTESTED",
  ],
  category: [
    "rehab",
    "isometrics",
    "mobility",
    "warm_up",
    "cool_down",
    "recovery",
    "foam_roll",
    "strength",
    "plyometrics",
    "conditioning",
    "skill_drills",
    "speed",
    "agility",
    "power",
  ],
};

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[°'"()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function expand() {
  const rows = [];
  const errors = [];
  const seen = new Set();

  for (const fam of FAMILIES) {
    for (const v of fam.variants) {
      const ov = v.ov ?? {};
      const movement = ov.movement ?? fam.movement;
      const tissues = MOVEMENT_TO_TISSUES[movement];
      if (!tissues) {
        errors.push(`${v.name}: unknown movement '${movement}'`);
        continue;
      }
      const defaults = { ...fam.defaults, ...(ov.defaults ?? {}) };
      const row = {
        name: v.name,
        slug: ov.slug ?? slugify(v.name),
        category: ov.category ?? fam.category,
        subcategory: ov.subcategory ?? null,
        description: ov.how ?? fam.how,
        how_text: ov.how ?? fam.how,
        coaching_cues: ov.cues ?? fam.cues,
        muscle_groups: ov.muscleGroups ?? fam.muscleGroups,
        target_muscles: ov.targetMuscles ?? fam.targetMuscles,
        movement_pattern: ov.movementPattern ?? fam.movementPattern,
        applicable_positions: ov.positions ?? fam.positions ?? [],
        is_high_intensity: ["high", "very_high"].includes(
          ov.loadingRateBand ?? fam.loadingRateBand,
        ),
        load_contribution_au: defaults.loadAu ?? 10,
        default_sets: defaults.sets ?? null,
        default_reps: defaults.reps ?? null,
        default_hold_seconds: defaults.hold ?? null,
        default_duration_seconds: defaults.duration ?? null,
        difficulty_level:
          defaults.difficulty ?? fam.defaults.difficulty ?? "intermediate",
        equipment_needed: ov.equipment ?? fam.equipment ?? [],
        active: true,
        tissue_targets: [...new Set([...(ov.tissueTargets ?? tissues)])],
        contraction_type: ov.contractionType ?? fam.contractionType,
        joint_emphasis: ov.jointEmphasis ?? fam.jointEmphasis,
        loading_rate_band: ov.loadingRateBand ?? fam.loadingRateBand,
        peak_load_bw: ov.peakLoadBw ?? fam.peakLoadBw ?? null,
        evidence_tier: ov.evidenceTier ?? fam.evidenceTier,
        rehab_stage: ov.rehabStage ?? fam.rehabStage ?? null,
        _family: fam.key,
      };

      // Validate controlled vocabularies + tissue ids.
      for (const [col, allowed] of Object.entries(ENUMS)) {
        if (row[col] != null && !allowed.includes(row[col])) {
          errors.push(`${row.slug}: invalid ${col}='${row[col]}'`);
        }
      }
      for (const t of row.tissue_targets) {
        if (!TISSUES[t]) errors.push(`${row.slug}: unknown tissue '${t}'`);
      }
      if (seen.has(row.slug)) errors.push(`duplicate slug '${row.slug}'`);
      seen.add(row.slug);

      rows.push(row);
    }
  }
  return { rows, errors };
}

const sqlLit = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
  if (Array.isArray(v)) {
    if (v.length === 0) return "'{}'";
    return (
      "ARRAY[" +
      v.map((x) => `'${String(x).replace(/'/g, "''")}'`).join(",") +
      "]"
    );
  }
  return `'${String(v).replace(/'/g, "''")}'`;
};

function toSql(rows) {
  const cols = [
    "name",
    "slug",
    "category",
    "subcategory",
    "description",
    "how_text",
    "coaching_cues",
    "muscle_groups",
    "target_muscles",
    "movement_pattern",
    "applicable_positions",
    "is_high_intensity",
    "load_contribution_au",
    "default_sets",
    "default_reps",
    "default_hold_seconds",
    "default_duration_seconds",
    "difficulty_level",
    "equipment_needed",
    "active",
    "tissue_targets",
    "contraction_type",
    "joint_emphasis",
    "loading_rate_band",
    "peak_load_bw",
    "evidence_tier",
    "rehab_stage",
  ];
  const values = rows
    .map((r) => "  (" + cols.map((c) => sqlLit(r[c])).join(", ") + ")")
    .join(",\n");
  // On conflict, ENRICH ONLY the new tissue-load attributes — never overwrite an
  // existing curated row's name/category/description/cues (e.g. the live Nordic
  // Curl stays category 'Strength' but gains correct tissue_targets). New slugs
  // are fully inserted; colliding slugs are non-destructively upgraded.
  const enrichCols = [
    "tissue_targets",
    "contraction_type",
    "joint_emphasis",
    "loading_rate_band",
    "peak_load_bw",
    "evidence_tier",
    "rehab_stage",
  ];
  const updates = enrichCols.map((c) => `${c} = EXCLUDED.${c}`).join(", ");
  return (
    `-- GENERATED by scripts/build-exercise-library.mjs — do not edit by hand.\n` +
    `-- Idempotent per slug. ${rows.length} exercises from the curated tissue-load families.\n` +
    `-- On conflict only the tissue-load attributes are enriched (curated fields preserved).\n\n` +
    `INSERT INTO public.exercises (\n  ${cols.join(", ")}\n) VALUES\n${values}\n` +
    // uq_exercises_slug is a PARTIAL unique index (WHERE slug IS NOT NULL) — the
    // ON CONFLICT arbiter must repeat that predicate to be inferred.
    `ON CONFLICT (slug) WHERE slug IS NOT NULL DO UPDATE SET ${updates}, updated_at = now();\n`
  );
}

function stats(rows) {
  const by = (k) =>
    rows.reduce((m, r) => ((m[r[k]] = (m[r[k]] || 0) + 1), m), {});
  return {
    total: rows.length,
    byCategory: by("category"),
    byTissue: rows
      .flatMap((r) => r.tissue_targets)
      .reduce((m, t) => ((m[t] = (m[t] || 0) + 1), m), {}),
    byEvidence: by("evidence_tier"),
  };
}

const { rows, errors } = expand();
if (errors.length) {
  console.error("VALIDATION ERRORS:\n" + errors.join("\n"));
  process.exit(1);
}

// Optional: emit ONLY net-new rows (exclude slugs already live) to keep a live
// apply payload small. EXCLUDE_SLUGS_FILE = comma-separated slugs to skip.
let emitRows = rows;
const exclFile = process.env.EXCLUDE_SLUGS_FILE;
if (exclFile && existsSync(exclFile)) {
  const excl = new Set(
    _readFileSync(exclFile, "utf8")
      .split(/[\s,]+/)
      .filter(Boolean),
  );
  emitRows = rows.filter((r) => !excl.has(r.slug));
}

if (process.argv.includes("--print-net-new")) {
  process.stdout.write(toSql(emitRows));
} else if (process.argv.includes("--print-sql")) {
  process.stdout.write(toSql(rows));
} else {
  writeFileSync(
    resolve(root, "database/seed-exercise-library.generated.sql"),
    toSql(rows),
  );
  writeFileSync(
    resolve(root, "database/library/manifest.generated.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        ...stats(rows),
        slugs: rows.map((r) => r.slug),
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(stats(rows), null, 2));
}

export { expand, toSql };
