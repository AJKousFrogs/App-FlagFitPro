import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

// Guard against the missing-functionName 502 class (2026-07-10): baseHandler
// throws "functionName is required" BEFORE its try/catch, so any function that
// calls baseHandler without `functionName:` crashes with a 502 on every request
// (weekend-games + auth-reset-password did). This is runtime-only — invisible to
// build/tsc. Scan every function file and assert the config is present.

const FN_DIR = join(process.cwd(), "netlify/functions");

describe("baseHandler config", () => {
  it("every function calling baseHandler passes functionName", () => {
    const offenders = [];
    for (const name of readdirSync(FN_DIR)) {
      if (!name.endsWith(".js")) {
        continue;
      }
      const src = readFileSync(join(FN_DIR, name), "utf8");
      if (/\bbaseHandler\s*\(/.test(src) && !/functionName\s*:/.test(src)) {
        offenders.push(name);
      }
    }
    expect(
      offenders,
      `Functions calling baseHandler without functionName (→ 502):\n${offenders.join("\n")}`,
    ).toEqual([]);
  });
});
