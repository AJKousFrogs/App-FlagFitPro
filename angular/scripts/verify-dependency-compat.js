/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, "utf8");
}

const checks = [
  {
    name: "PrimeNG unicode diacritic regex",
    file: path.join(
      __dirname,
      "..",
      "node_modules",
      "primeng",
      "fesm2022",
      "primeng-utils.mjs",
    ),
    note: "If this ever breaks, pin PrimeNG to a fixed release instead of patching node_modules.",
  },
  {
    name: "html2canvas parser switch block",
    file: path.join(
      __dirname,
      "..",
      "node_modules",
      "html2canvas",
      "dist",
      "html2canvas.esm.js",
    ),
    note: "If this ever breaks, pin html2canvas to a fixed release instead of patching node_modules.",
  },
];

let missing = 0;
for (const check of checks) {
  const content = readIfExists(check.file);
  if (!content) {
    missing += 1;
    console.warn(`[postinstall][warn] ${check.name}: file not found.`);
    console.warn(`[postinstall][warn] ${check.note}`);
  }
}

if (missing === 0) {
  console.log("[postinstall] Dependency compatibility check passed.");
}
