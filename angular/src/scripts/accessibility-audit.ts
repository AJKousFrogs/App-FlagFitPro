#!/usr/bin/env npx tsx
/**
 * Accessibility Audit Script
 *
 * Runs axe-core accessibility checks on key application routes.
 * Requires the app to be running at BASE_URL (default: http://localhost:4200).
 *
 * Usage:
 *   pnpm run audit:a11y
 *   BASE_URL=https://staging.example.com pnpm run audit:a11y
 *
 * Ensure the app is running first: pnpm run start
 * For CI: run with webServer or start the app before this script.
 */

import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

const BASE_URL = process.env["BASE_URL"] || "http://localhost:4200";

// Routes to audit (public routes that don't require auth)
const ROUTES_TO_AUDIT = ["/", "/login", "/register"];

// Levels to report: 'critical' | 'serious' | 'moderate' | 'minor'
const MIN_LEVEL = "moderate" as const;

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

const IMPACT_ORDER: Record<string, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

function formatViolation(v: {
  id: string;
  help: string;
  impact?: string | null;
  description: string;
  nodes?: { html: string; failureSummary?: string }[];
}): string {
  const impact = (v.impact ?? "unknown") as string;
  const nodes = v.nodes?.length ?? 0;
  const summary =
    v.nodes?.[0]?.failureSummary?.replace(/^\s*Fix any of the following:\s*/i, "") ?? "";
  return [
    `  ${RED}[${impact.toUpperCase()}]${RESET} ${v.id}: ${v.help}`,
    `    ${DIM}${v.description}${RESET}`,
    nodes > 0 ? `    ${nodes} element(s). ${summary}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

async function waitForAppReady(page: import("@playwright/test").Page): Promise<void> {
  // Wait for Angular to bootstrap
  await page.waitForSelector("app-root", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  // Brief pause for dynamic content
  await new Promise((r) => setTimeout(r, 500));
}

async function main(): Promise<void> {
  console.log(`\n${DIM}Accessibility Audit — axe-core${RESET}`);
  console.log(`${DIM}Auditing ${BASE_URL}${RESET}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  let totalViolations = 0;

  try {
    const page = await context.newPage();

    for (const route of ROUTES_TO_AUDIT) {
      const url = `${BASE_URL}${route}`.replace(/([^:]\/)\/+/g, "$1");
      console.log(`\n${YELLOW}▶ ${url}${RESET}`);

      try {
        const response = await page.goto(url, {
          timeout: 30000,
          waitUntil: "domcontentloaded",
        });

        if (response && !response.ok()) {
          console.log(`  ${RED}HTTP ${response.status()}${RESET}`);
          continue;
        }

        await waitForAppReady(page);

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();

        const violations = (results.violations || []).filter((v) => {
          const level = IMPACT_ORDER[v.impact ?? ""] ?? 99;
          return level <= IMPACT_ORDER[MIN_LEVEL];
        });

        if (violations.length === 0) {
          console.log(`  ${GREEN}✓ No violations${RESET}`);
        } else {
          totalViolations += violations.length;
          violations.forEach((v) => console.log(formatViolation(v)));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("net::ERR_CONNECTION_REFUSED")) {
          console.log(
            `  ${RED}Error: App not running at ${BASE_URL}. Start with: pnpm run start${RESET}`,
          );
          process.exit(1);
        }
        console.log(`  ${RED}Error: ${msg}${RESET}`);
      }
    }

    await context.close();
    await browser.close();

    if (totalViolations > 0) {
      console.log(`\n${RED}Total: ${totalViolations} accessibility violation(s)${RESET}\n`);
      process.exit(1);
    }

    console.log(`\n${GREEN}✓ Audit passed — no accessibility violations${RESET}\n`);
  } catch (err) {
    await context?.close().catch(() => {});
    await browser.close();
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${RED}Fatal: ${msg}${RESET}`);
    process.exit(1);
  }
}

main();
