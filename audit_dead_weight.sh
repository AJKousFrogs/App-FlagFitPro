#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
OUT="audit_dead_weight_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$OUT"

echo "==> Collect file lists"
git ls-files > "$OUT/all_files.txt"

# --- 1) Find entrypoints + imports/references ---
echo "==> Index references (TS/JS/HTML/SCSS/MD/JSON/YAML)"
rg -n --hidden --no-ignore-vcs \
  -S "from\s+['\"][^'\"]+['\"]|require\(|import\(|loadChildren|loadComponent|routerLink|styleUrls|templateUrl|@use|@forward|@import|\bDOCS_INDEX\.md\b|README\.md|angular\.json|package\.json" \
  . > "$OUT/references_index.txt" || true

# --- 2) Build dependency edges for TS imports (best-effort) ---
echo "==> TS import map"
rg -n --hidden --no-ignore-vcs -S "from\s+['\"][^'\"]+['\"]" \
  --glob "!**/node_modules/**" --glob "!**/dist/**" --glob "!**/.angular/**" \
  . > "$OUT/ts_imports_raw.txt" || true

# --- 3) SCSS graph ---
echo "==> SCSS graph"
rg -n --hidden --no-ignore-vcs -S "@use|@forward|@import" \
  --glob "**/*.scss" --glob "!**/node_modules/**" --glob "!**/dist/**" \
  . > "$OUT/scss_imports_raw.txt" || true

# --- 4) Routes graph ---
echo "==> Routes (Angular)"
rg -n --hidden --no-ignore-vcs -S "path:\s*['\"][^'\"]+['\"]|loadChildren|loadComponent" \
  angular/src/app 2>/dev/null > "$OUT/routes_raw.txt" || true

# --- 5) Potentially unused files (excludes out-tsc, test-results, specs, build artifacts) ---
echo "==> Candidate unused files"
python3 audit_unused_fast.py "$OUT"

# --- 6) Largest files (excludes test-results, *.zip) ---
echo "==> Largest files"
python3 audit_largest.py "$OUT"

echo "==> Done. Report folder: $OUT"
echo "Key outputs:"
echo " - $OUT/unused_candidates.txt (all)"
echo " - $OUT/unused_source_only.txt (source-code only, actionable)"
echo " - $OUT/unused_docs.txt (orphaned .md files, if any)"
echo " - $OUT/largest_files.txt"
echo " - $OUT/routes_raw.txt"
echo " - $OUT/ts_imports_raw.txt"
echo " - $OUT/scss_imports_raw.txt"
