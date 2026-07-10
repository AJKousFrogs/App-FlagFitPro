import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

/**
 * Guard against the missing-icon class of bug (2026-07-10 E2E audit): lucide's
 * strict provider throws AT RUNTIME — not at build/tsc time — when a template
 * uses `<lucide-icon name="x">` for a glyph not in app.config's `pick({...})`.
 * (`log-out` shipped live and threw on every user's profile.) This scans every
 * template's STATIC `name="…"` icon usages and asserts each is registered.
 * Dynamic `[name]="method()"` returns aren't covered — keep those in sync by hand.
 */

const APP_DIR = join(process.cwd(), "src/app");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p, out);
    } else if (entry.name.endsWith(".html")) {
      out.push(p);
    }
  }
  return out;
}

function pascalToKebab(name: string): string {
  return name.replace(/(?<!^)(?=[A-Z0-9])/g, "-").toLowerCase();
}

function registeredIcons(): Set<string> {
  const cfg = readFileSync(join(APP_DIR, "app.config.ts"), "utf8");
  const pick = /\.pick\(\{([\s\S]*?)\}\)/.exec(cfg);
  if (!pick) {
    throw new Error("Could not find LucideAngularModule.pick({...})");
  }
  const names = pick[1].match(/\b[A-Z][A-Za-z0-9]*\b/g) ?? [];
  return new Set(names.map(pascalToKebab));
}

function usedStaticIcons(): Map<string, string> {
  // icon name → first file using it (for a helpful failure message)
  const used = new Map<string, string>();
  for (const file of walk(APP_DIR)) {
    const html = readFileSync(file, "utf8");
    const re = /<lucide-icon\b[^>]*?\bname="([a-z0-9-]+)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
      if (!used.has(m[1])) {
        used.set(m[1], file.replace(process.cwd() + "/", ""));
      }
    }
  }
  return used;
}

describe("lucide icon registration", () => {
  it("every static <lucide-icon name> is registered in app.config pick()", () => {
    const registered = registeredIcons();
    const missing: string[] = [];
    for (const [icon, file] of usedStaticIcons()) {
      if (!registered.has(icon)) {
        missing.push(`"${icon}" (used in ${file})`);
      }
    }
    expect(
      missing,
      `Unregistered lucide icons:\n${missing.join("\n")}`,
    ).toEqual([]);
  });
});
