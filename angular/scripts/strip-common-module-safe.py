#!/usr/bin/env python3
"""
Strip CommonModule from standalone components when templates only need
built-in control flow (@if/@for) or when pipes/directives are imported explicitly.

Run from repo:  python3 angular/scripts/strip-common-module-safe.py

Safety patterns (if any match, file is skipped):
  *ngIf / *ngFor / *ngSwitch / *ngTemplateOutlet
  [ngTemplateOutlet] property binding
  ngClass / ngStyle
  Common pipes: | async | date | number | decimal | ...
"""

from __future__ import annotations

import re
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1] / "src"


def template_needs_common(html: str) -> bool:
    if re.search(r"\*\s*ng(If|For|Switch|TemplateOutlet)", html):
        return True
    if re.search(r"\[\s*ngTemplateOutlet\s*\]", html):
        return True
    if re.search(
        r"\[\s*ngClass\s*\]|\[\s*ngStyle\s*\]|ngClass\s*=|ngStyle\s*=",
        html,
    ):
        return True
    pipe_pat = r"\|\s*(async|date|number|decimal|percent|currency|json|slice|keyvalue|titlecase|uppercase|lowercase)\b"
    if re.search(pipe_pat, html):
        return True
    return False


def extract_inline_template(ts: str) -> str | None:
    m = re.search(r"template\s*:\s*`", ts)
    if m:
        start = m.end()
        i = start
        while i < len(ts):
            if ts[i] == "\\" and i + 1 < len(ts):
                i += 2
                continue
            if ts[i] == "`":
                return ts[start:i]
            i += 1
        return None
    m = re.search(r"template\s*:\s*'([^']*)'", ts, re.DOTALL)
    if m:
        return m.group(1)
    m = re.search(r'template\s*:\s*"([^"]*)"', ts, re.DOTALL)
    if m:
        return m.group(1)
    return None


def get_template_text(ts_path: pathlib.Path, ts: str) -> tuple[str, str] | None:
    m = re.search(r'templateUrl:\s*["\']([^"\']+)["\']', ts)
    if m:
        html_path = ts_path.parent / m.group(1)
        if html_path.exists():
            return ("templateUrl", html_path.read_text(encoding="utf-8", errors="replace"))
        return None
    inline = extract_inline_template(ts)
    if inline is not None:
        return ("inline", inline)
    return None


def remove_common_module(text: str) -> str:
    text = re.sub(
        r"^\s*import\s*\{\s*CommonModule\s*\}\s*from\s*[\"']@angular/common[\"'];\s*\n",
        "",
        text,
        flags=re.M,
    )

    def fix_import(m: re.Match) -> str:
        inner = m.group(1)
        parts = [p.strip() for p in inner.split(",") if p.strip()]
        parts = [p for p in parts if p != "CommonModule"]
        if not parts:
            return ""
        return f'import {{ {", ".join(parts)} }} from "@angular/common";'

    text = re.sub(
        r'import\s*\{([^}]+)\}\s*from\s*["\']@angular/common["\'];',
        lambda m: fix_import(m) or "",
        text,
    )
    text = re.sub(r"\n\n\n+", "\n\n", text)
    text = re.sub(r"\bCommonModule\s*,\s*", "", text)
    text = re.sub(r",\s*CommonModule\b", "", text)
    text = re.sub(r"\[\s*CommonModule\s*\]", "[]", text)
    return text


def main() -> int:
    changed = []
    for ts_path in sorted(ROOT.rglob("*.component.ts")):
        text = ts_path.read_text(encoding="utf-8", errors="replace")
        if "CommonModule" not in text:
            continue
        tpl = get_template_text(ts_path, text)
        if tpl is None:
            continue
        _, content = tpl
        if template_needs_common(content):
            continue
        new_text = remove_common_module(text)
        if new_text == text:
            continue
        ts_path.write_text(new_text, encoding="utf-8")
        changed.append(str(ts_path.relative_to(ROOT.parent.parent)))

    print(f"Updated {len(changed)} files")
    for p in changed[:50]:
        print(" ", p)
    if len(changed) > 50:
        print(f"  ... and {len(changed) - 50} more")
    return 0


if __name__ == "__main__":
    sys.exit(main())
