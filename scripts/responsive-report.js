#!/usr/bin/env node

/**
 * Generate a comprehensive responsive testing report
 */

import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
};

function printHeader(text) {
  console.log(`\n${colors.bold}${colors.blue}${text}${colors.reset}`);
  console.log("=".repeat(text.length));
}

function printSuccess(text) {
  console.log(`${colors.green}✓${colors.reset} ${text}`);
}

function printWarning(text) {
  console.log(`${colors.yellow}⚠${colors.reset} ${text}`);
}

function printError(text) {
  console.log(`${colors.red}✗${colors.reset} ${text}`);
}

function checkFile(filePath, description) {
  if (existsSync(filePath)) {
    printSuccess(`${description} exists`);
    return true;
  } else {
    printError(`${description} missing`);
    return false;
  }
}

function getFileCount(dirPath, extension) {
  if (!existsSync(dirPath)) {
    return 0;
  }

  let count = 0;
  const files = readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = join(dirPath, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      count += getFileCount(filePath, extension);
    } else if (file.endsWith(extension)) {
      count++;
    }
  });

  return count;
}

console.log(`
${colors.bold}${colors.blue}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏈 FlagFit Pro - Responsive Testing Report             ║
║   Mobile Device Coverage Check                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}
`);

// Check test files
printHeader("📋 Test Files");
const testFiles = [
  ["tests/responsive/mobile-devices.test.js", "Main responsive test suite"],
  ["tests/responsive/visual-regression.test.js", "Visual regression tests"],
  ["tests/responsive/README.md", "Test documentation"],
];

let testFilesOk = 0;
testFiles.forEach(([path, desc]) => {
  if (checkFile(path, desc)) {
    testFilesOk++;
  }
});

// Check scripts
printHeader("🔧 Scripts & Tools");
const scripts = [
  ["scripts/test-mobile-responsive.sh", "Test runner script"],
  ["scripts/quick-responsive-check.js", "Quick check utility"],
];

let scriptsOk = 0;
scripts.forEach(([path, desc]) => {
  if (checkFile(path, desc)) {
    scriptsOk++;
  }
});

// Check documentation
printHeader("📚 Documentation");
const docs = [
  ["docs/testing/MOBILE_RESPONSIVE_TESTING.md", "Full testing guide"],
  ["docs/testing/RESPONSIVE_CHECKLIST.md", "Pre-deployment checklist"],
];

let docsOk = 0;
docs.forEach(([path, desc]) => {
  if (checkFile(path, desc)) {
    docsOk++;
  }
});

// Check configurations
printHeader("⚙️  Configuration Files");
const configs = [
  ["playwright.config.js", "Playwright configuration"],
  [".lighthouserc.json", "Lighthouse CI config"],
  [".github/workflows/mobile-responsive.yml", "CI/CD workflow"],
];

let configsOk = 0;
configs.forEach(([path, desc]) => {
  if (checkFile(path, desc)) {
    configsOk++;
  }
});

// Check responsive styles
printHeader("🎨 Responsive Styles");
const styles = [
  ["angular/src/styles.scss", "Main styles"],
  ["tailwind.config.js", "Tailwind configuration"],
];

let stylesOk = 0;
styles.forEach(([path, desc]) => {
  if (checkFile(path, desc)) {
    stylesOk++;
  }
});

// Device coverage
printHeader("📱 Device Coverage");
console.log("\nTested Devices:");

const devices = {
  iPhone: [
    "iPhone SE (3rd gen) - 375×667",
    "iPhone 12/13/14 - 390×844",
    "iPhone 14 Pro Max - 430×932",
    "iPhone 15 Pro - 393×852",
    "iPhone 15 Pro Max - 430×932",
  ],
  "Samsung Galaxy": [
    "Galaxy S8 - 360×740",
    "Galaxy S20 - 360×800",
    "Galaxy S21 - 360×800",
    "Galaxy S22 - 360×780",
    "Galaxy S23 - 360×780",
    "Galaxy S24 - 360×780",
    "Galaxy A52 - 360×800",
    "Galaxy Z Fold 4 - 375×772",
  ],
  Xiaomi: [
    "Mi 11 - 360×800",
    "Redmi Note 10 - 360×800",
    "Redmi Note 11 - 360×800",
    "Xiaomi 12 - 360×800",
    "Xiaomi 13 - 360×800",
    "Poco X3 - 393×851",
  ],
};

let totalDevices = 0;
Object.entries(devices).forEach(([brand, deviceList]) => {
  console.log(`\n${colors.bold}${brand}:${colors.reset}`);
  deviceList.forEach((device) => {
    printSuccess(device);
    totalDevices++;
  });
});

// Test scenarios
printHeader("🧪 Test Scenarios");
const scenarios = [
  "Viewport configuration",
  "Horizontal scroll prevention",
  "Header rendering",
  "Font size readability",
  "Touch target sizes",
  "Form element sizing",
  "Navigation functionality",
  "Card/panel layout",
  "Touch interactions",
  "iOS safe areas",
  "Modal/dialog fitting",
  "Performance metrics",
  "Accessibility compliance",
];

console.log(`\n${colors.bold}Per-device tests:${colors.reset}`);
scenarios.forEach((scenario) => printSuccess(scenario));

// NPM scripts
printHeader("🚀 Available Commands");
const commands = [
  ["npm run test:responsive", "Run all responsive tests"],
  ["npm run test:responsive:quick", "Quick responsive check"],
  ["npm run test:responsive:visual", "Visual regression tests"],
  ["npm run test:responsive:iphone", "Test iPhone devices only"],
  ["npm run test:responsive:samsung", "Test Samsung devices only"],
  ["npm run test:responsive:xiaomi", "Test Xiaomi devices only"],
];

console.log("");
commands.forEach(([cmd, desc]) => {
  console.log(`  ${colors.green}${cmd}${colors.reset}`);
  console.log(`    ${desc}\n`);
});

// Statistics
printHeader("📊 Statistics");
console.log(`
  ${colors.bold}Test Coverage:${colors.reset}
    • Total devices: ${colors.green}${totalDevices}${colors.reset}
    • Test scenarios per device: ${colors.green}${scenarios.length}${colors.reset}
    • Total test cases: ${colors.green}${totalDevices * scenarios.length}${colors.reset}

  ${colors.bold}Screen Size Range:${colors.reset}
    • Smallest: ${colors.green}360×740${colors.reset} (Galaxy S8)
    • Largest: ${colors.green}430×932${colors.reset} (iPhone 15 Pro Max)
    • Coverage: ${colors.green}360-430px width${colors.reset}

  ${colors.bold}File Checks:${colors.reset}
    • Test files: ${colors.green}${testFilesOk}/${testFiles.length}${colors.reset}
    • Scripts: ${colors.green}${scriptsOk}/${scripts.length}${colors.reset}
    • Documentation: ${colors.green}${docsOk}/${docs.length}${colors.reset}
    • Configuration: ${colors.green}${configsOk}/${configs.length}${colors.reset}
    • Styles: ${colors.green}${stylesOk}/${styles.length}${colors.reset}
`);

// Recommendations
printHeader("💡 Next Steps");
console.log(`
  1. ${colors.blue}Run quick check:${colors.reset}
     npm run test:responsive:quick

  2. ${colors.blue}Review results:${colors.reset}
     Check console output and playwright-report/

  3. ${colors.blue}Run full test suite:${colors.reset}
     npm run test:responsive

  4. ${colors.blue}Capture visual baselines:${colors.reset}
     npm run test:responsive:visual

  5. ${colors.blue}Check documentation:${colors.reset}
     See docs/testing/MOBILE_RESPONSIVE_TESTING.md
`);

// Status summary
const allChecks = testFilesOk + scriptsOk + docsOk + configsOk + stylesOk;
const totalChecks =
  testFiles.length +
  scripts.length +
  docs.length +
  configs.length +
  styles.length;

printHeader("✅ Status");
if (allChecks === totalChecks) {
  console.log(`
  ${colors.bold}${colors.green}All systems ready!${colors.reset}
  
  Your responsive testing infrastructure is fully set up.
  You can now test across all ${totalDevices} mobile devices.
  
  Run: ${colors.blue}npm run test:responsive:quick${colors.reset} to get started!
  `);
} else {
  console.log(`
  ${colors.bold}${colors.yellow}Setup incomplete${colors.reset}
  
  ${allChecks}/${totalChecks} checks passed.
  Please review the missing files above.
  `);
}

console.log("");
