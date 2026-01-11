#!/usr/bin/env node

/**
 * Mobile Responsive Quick Check
 * Runs a fast check of responsive issues without full test suite
 */

import { chromium } from "@playwright/test";

const DEVICES_TO_CHECK = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 14 Pro", width: 390, height: 844 },
  { name: "Samsung S23", width: 360, height: 780 },
  { name: "Xiaomi 13", width: 360, height: 800 },
];

const PAGES_TO_CHECK = ["/", "/dashboard", "/training", "/profile"];

async function checkResponsive() {
  console.log("🏈 FlagFit Pro - Quick Responsive Check");
  console.log("==========================================\n");

  const browser = await chromium.launch({ headless: true });
  const results = { passed: 0, failed: 0, warnings: 0, issues: [] };

  for (const device of DEVICES_TO_CHECK) {
    console.log(`📱 Testing ${device.name} (${device.width}x${device.height})`);

    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      isMobile: true,
      hasTouch: true,
    });

    const page = await context.newPage();

    for (const url of PAGES_TO_CHECK) {
      try {
        await page.goto(`http://localhost:4200${url}`, {
          waitUntil: "networkidle",
          timeout: 10000,
        });

        // Check 1: Horizontal scroll
        const hasHorizontalScroll = await page.evaluate(() => {
          return (
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth
          );
        });

        if (hasHorizontalScroll) {
          results.failed++;
          results.issues.push({
            device: device.name,
            page: url,
            issue: "Horizontal scroll detected",
            severity: "error",
          });
          console.log(`  ❌ ${url} - Horizontal scroll`);
        } else {
          results.passed++;
          console.log(`  ✅ ${url} - No horizontal scroll`);
        }

        // Check 2: Viewport meta tag
        const viewportMeta = await page.evaluate(() => {
          const meta = document.querySelector('meta[name="viewport"]');
          return meta ? meta.getAttribute("content") : null;
        });

        if (!viewportMeta || !viewportMeta.includes("width=device-width")) {
          results.warnings++;
          results.issues.push({
            device: device.name,
            page: url,
            issue: "Missing or incorrect viewport meta tag",
            severity: "warning",
          });
          console.log(`  ⚠️  ${url} - Viewport meta issue`);
        }

        // Check 3: Font size
        const bodyFontSize = await page.evaluate(() => {
          return parseFloat(window.getComputedStyle(document.body).fontSize);
        });

        if (bodyFontSize < 16) {
          results.warnings++;
          results.issues.push({
            device: device.name,
            page: url,
            issue: `Body font size too small: ${bodyFontSize}px`,
            severity: "warning",
          });
          console.log(`  ⚠️  ${url} - Font size: ${bodyFontSize}px`);
        }

        // Check 4: Touch targets
        const smallButtons = await page.evaluate(() => {
          const buttons = Array.from(
            document.querySelectorAll("button, a.p-button, .btn"),
          );
          return buttons.filter((btn) => {
            const rect = btn.getBoundingClientRect();
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              (rect.width < 40 || rect.height < 40)
            );
          }).length;
        });

        if (smallButtons > 0) {
          results.warnings++;
          results.issues.push({
            device: device.name,
            page: url,
            issue: `${smallButtons} buttons smaller than 40x40px`,
            severity: "warning",
          });
          console.log(`  ⚠️  ${url} - ${smallButtons} small touch targets`);
        }
      } catch (error) {
        console.log(`  ⏭️  ${url} - Skipped (${error.message})`);
      }
    }

    await context.close();
    console.log("");
  }

  await browser.close();

  // Print summary
  console.log("\n📊 Summary");
  console.log("==========");
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);

  if (results.issues.length > 0) {
    console.log("\n📋 Issues Found:");
    console.log("================");

    const errors = results.issues.filter((i) => i.severity === "error");
    const warnings = results.issues.filter((i) => i.severity === "warning");

    if (errors.length > 0) {
      console.log("\n🚨 Critical Issues:");
      errors.forEach((issue) => {
        console.log(`  • ${issue.device} - ${issue.page}: ${issue.issue}`);
      });
    }

    if (warnings.length > 0) {
      console.log("\n⚠️  Warnings:");
      warnings.forEach((issue) => {
        console.log(`  • ${issue.device} - ${issue.page}: ${issue.issue}`);
      });
    }
  }

  console.log("\n");

  if (results.failed > 0) {
    console.log("❌ Some responsive issues found. Run full test suite with:");
    console.log("   npm run test:responsive");
    process.exit(1);
  } else if (results.warnings > 0) {
    console.log("⚠️  Some warnings found. Consider fixing them.");
    process.exit(0);
  } else {
    console.log("✅ All responsive checks passed!");
    process.exit(0);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch("http://localhost:4200");
    return response.ok;
  } catch {
    return false;
  }
}

// Main
(async () => {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.error("❌ Development server not running!");
    console.error("   Start it with: npm run dev");
    process.exit(1);
  }

  await checkResponsive();
})();
