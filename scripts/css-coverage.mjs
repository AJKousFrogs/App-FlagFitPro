import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.E2E_BASE_URL || "http://127.0.0.1:4200";
const EMAIL = process.env.E2E_EMAIL || "";
const PASSWORD = process.env.E2E_PASSWORD || "";

const ROUTES = [
  "/",
  "/login",
  "/player-dashboard",
  "/todays-practice",
  "/training",
  "/training/log",
  "/training/videos",
  "/analytics",
  "/acwr",
  "/wellness",
  "/profile",
  "/roster",
  "/coach/dashboard",
  "/coach/team",
  "/settings",
];

function normalizeUrl(url) {
  if (!url) return "";
  return url.split("?")[0].split("#")[0];
}

function buildUsedMask(text, ranges) {
  const used = new Uint8Array(text.length);
  for (const r of ranges) {
    const start = Math.max(0, r.start);
    const end = Math.min(text.length, r.end);
    used.fill(1, start, end);
  }
  return used;
}

function extractRuleBlocks(text) {
  const blocks = [];
  const regex = /[^{}]+\{[^}]*\}/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    blocks.push({
      start: match.index,
      end: match.index + match[0].length,
      block: match[0],
    });
  }
  return blocks;
}

function blockIsUsed(block, usedMask) {
  for (let i = block.start; i < block.end; i += 1) {
    if (usedMask[i]) return true;
  }
  return false;
}

function extractSelectors(blockText) {
  const idx = blockText.indexOf("{");
  if (idx === -1) return [];
  return blockText
    .slice(0, idx)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isGlobalSelector(selector) {
  if (!selector) return false;
  if (selector.startsWith("@")) return false;
  if (selector.includes("_ngcontent") || selector.includes("_nghost"))
    return false;
  if (selector.includes(":host")) return false;
  if (selector.includes("::ng-deep")) return false;
  return true;
}

async function tryLogin(page) {
  if (!EMAIL || !PASSWORD) return;
  const loginUrl = new URL("/login", BASE_URL).toString();
  if (page.url().startsWith(loginUrl)) {
    await page
      .fill('input[type="email"], input[name="email"], #email', EMAIL)
      .catch(() => {});
    await page
      .fill('input[type="password"], input[name="password"], #password', PASSWORD)
      .catch(() => {});
    await page
      .click('button[type="submit"], .p-button, app-button')
      .catch(() => {});
    await page.waitForTimeout(1500);
  }
}

async function triggerOverlays(page) {
  const candidates = [
    '[aria-haspopup="menu"]',
    '[aria-haspopup="dialog"]',
    ".p-dropdown",
    ".p-select",
    ".p-multiselect",
    ".p-calendar",
    ".p-datepicker",
    ".p-dialog",
    ".p-overlaypanel",
    ".p-menu",
    ".p-tieredmenu",
    ".p-contextmenu",
    ".p-toast",
    "[data-p-overlaypanel]",
  ];
  for (const sel of candidates) {
    const el = await page.$(sel);
    if (el) {
      await el.click().catch(() => {});
      await page.waitForTimeout(300);
      await page.keyboard.press("Escape").catch(() => {});
    }
  }
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.coverage.startCSSCoverage();

  for (const route of ROUTES) {
    const url = new URL(route, BASE_URL).toString();
    await page.goto(url, { waitUntil: "networkidle" }).catch(() => {});
    await tryLogin(page);
    await triggerOverlays(page);
  }

  const coverage = await page.coverage.stopCSSCoverage();
  await browser.close();

  const usedSelectorSet = new Set();
  const unusedGlobalSet = new Set();
  const report = {
    baseUrl: BASE_URL,
    routes: ROUTES,
    usedSelectors: [],
    unusedCandidatesGlobal: [],
    unusedSelectorsByUrl: [],
  };

  for (const entry of coverage) {
    const url = normalizeUrl(entry.url);
    if (!url || url.startsWith("data:")) continue;

    const text = entry.text || "";
    const usedMask = buildUsedMask(text, entry.ranges || []);
    const blocks = extractRuleBlocks(text);

    for (const block of blocks) {
      const selectors = extractSelectors(block.block);
      if (!selectors.length) continue;

      if (blockIsUsed(block, usedMask)) {
        for (const selector of selectors) {
          usedSelectorSet.add(selector);
        }
      } else {
        const globalSelectors = selectors.filter(isGlobalSelector);
        if (globalSelectors.length > 0) {
          report.unusedSelectorsByUrl.push({ url, selectors: globalSelectors });
          for (const selector of globalSelectors) {
            unusedGlobalSet.add(selector);
          }
        }
      }
    }
  }

  report.usedSelectors = [...usedSelectorSet].sort();
  report.unusedCandidatesGlobal = [...unusedGlobalSet].sort();

  const outputDir = path.resolve("reports");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "css-coverage.json"),
    JSON.stringify(report, null, 2),
    "utf8",
  );

  fs.writeFileSync(
    path.join(outputDir, "css-coverage-used-selectors.txt"),
    report.usedSelectors.join("\n"),
    "utf8",
  );
  fs.writeFileSync(
    path.join(outputDir, "css-coverage-unused-global-selectors.txt"),
    report.unusedCandidatesGlobal.join("\n"),
    "utf8",
  );

  console.log(
    "CSS coverage reports written to reports/css-coverage.json, reports/css-coverage-used-selectors.txt, reports/css-coverage-unused-global-selectors.txt",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
