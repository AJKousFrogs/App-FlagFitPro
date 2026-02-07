const fs = require("node:fs");
const path = require("node:path");

const targetPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "primeng",
  "fesm2022",
  "primeng-utils.mjs",
);

const search = "/\\p{Diacritic}/gu";
const replacement = "new RegExp(\"\\\\p{Diacritic}\", \"gu\")";

if (!fs.existsSync(targetPath)) {
  console.warn("[patch-primeng-regexp] primeng-utils.mjs not found, skipping.");
  process.exit(0);
}

const source = fs.readFileSync(targetPath, "utf8");
if (!source.includes(search)) {
  console.log(
    "[patch-primeng-regexp] Pattern not found or already patched, skipping.",
  );
  process.exit(0);
}

const updated = source.replace(search, replacement);
fs.writeFileSync(targetPath, updated, "utf8");
console.log("[patch-primeng-regexp] Patched unicode regex in PrimeNG utils.");
