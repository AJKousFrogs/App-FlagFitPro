#!/usr/bin/env python3
"""Fast unused-file detection: build mention set once, then check membership.
   Excludes build artifacts, test output, and treats specs/docs as intentional."""
import pathlib
import re
import sys

# OUT dir: from env/arg or default
out_name = "audit_dead_weight_OUT"
if len(sys.argv) > 1:
    out_name = sys.argv[1]
out = pathlib.Path(out_name)

# Paths to exclude from analysis entirely (build artifacts, test output)
IGNORE_PARTS = [
    "node_modules", "dist", ".angular", ".git", ".cache", ".turbo", "coverage",
    "out-tsc", "test-results", ".playwright", "playwright-report",
]
IGNORE_SUFFIXES = {".zip"}  # deployment/build artifacts

files = [p for p in pathlib.Path(".").rglob("*") if p.is_file()]
files = [p for p in files if not any(part in IGNORE_PARTS for part in p.parts)]
files = [p for p in files if p.suffix.lower() not in IGNORE_SUFFIXES]

text_suffixes = [".ts", ".js", ".mjs", ".cjs", ".html", ".scss", ".css", ".md", ".json", ".yaml", ".yml"]
text_files = [p for p in files if p.suffix.lower() in text_suffixes]

# Build corpus
corpus = []
for p in text_files:
    try:
        corpus.append(p.read_text(errors="ignore"))
    except Exception:
        pass
blob = "\n".join(corpus)
print("Corpus size:", len(blob), "chars")

mention_pattern = re.compile(r"\b([A-Za-z][A-Za-z0-9_-]*)\b")
mentions = set(mention_pattern.findall(blob))
print("Unique mentions:", len(mentions))

def mentioned(p):
    return p.stem in mentions or p.name in mentions

# Files to never report as "unused" (intentional even if not imported)
def skip_as_candidate(p):
    if ".spec." in p.name or p.name.endswith(".spec.ts") or p.name.endswith(".spec.js"):
        return True
    if p.suffix.lower() == ".md" and p.name in ("README.md", "CHANGELOG.md", "CALCULATION_MAP.md", "ROUTE_MAP.md"):
        return True
    return False

candidate_extensions = [".ts", ".js", ".mjs", ".cjs", ".html", ".scss", ".css", ".md"]
candidates = [
    str(p) for p in files
    if p.suffix.lower() in candidate_extensions
    and not skip_as_candidate(p)
    and not mentioned(p)
]

# Separate: source-code candidates (actionable) vs docs (informational)
source_ext = [".ts", ".js", ".mjs", ".cjs", ".html", ".scss", ".css"]
source_candidates = [c for c in candidates if pathlib.Path(c).suffix.lower() in source_ext]
doc_candidates = [c for c in candidates if pathlib.Path(c).suffix.lower() == ".md"]

out.mkdir(parents=True, exist_ok=True)
(out / "unused_candidates.txt").write_text("\n".join(sorted(candidates)))
(out / "unused_source_only.txt").write_text("\n".join(sorted(source_candidates)))
if doc_candidates:
    (out / "unused_docs.txt").write_text("\n".join(sorted(doc_candidates)))

print(f"Wrote {len(candidates)} candidates (source: {len(source_candidates)}, docs: {len(doc_candidates)})")
