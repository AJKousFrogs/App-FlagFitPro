#!/usr/bin/env python3
"""List largest source files; excludes build artifacts and test output."""
import pathlib
import sys

out_name = "audit_dead_weight_OUT"
if len(sys.argv) > 1:
    out_name = sys.argv[1]
out = pathlib.Path(out_name)

IGNORE_PARTS = [
    "node_modules", "dist", ".angular", ".git", "test-results",
    ".playwright", "playwright-report", "out-tsc", "coverage",
    ".venv", "__snapshots__",
]
IGNORE_SUFFIXES = {".zip", ".tar", ".gz"}

def should_skip(p):
    if any(part in IGNORE_PARTS for part in p.parts):
        return True
    if "audit_dead_weight" in str(p):
        return True
    return False

paths = []
for p in pathlib.Path(".").rglob("*"):
    if not p.is_file():
        continue
    if should_skip(p):
        continue
    if p.suffix.lower() in IGNORE_SUFFIXES:
        continue
    paths.append((p.stat().st_size, str(p)))
paths.sort(reverse=True)

out.mkdir(parents=True, exist_ok=True)
(out / "largest_files.txt").write_text("\n".join([f"{s:>10}  {p}" for s, p in paths[:80]]))
