#!/usr/bin/env node

/**
 * Prepend a generated-file banner to src/css outputs.
 * Keeps generated CSS clearly marked and discourages manual edits.
 */

const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const cssRoot = path.join(projectRoot, "src", "css");
const banner =
  "/* GENERATED FILE - DO NOT EDIT.\\n" +
  "   Source: angular/src/**/*.scss\\n" +
  "   Regenerate: npm run sass:compile */\\n\\n";

const walk = (dir, files = []) => {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.isFile() && entry.name.endsWith(".css")) files.push(full);
  }
  return files;
};

const files = walk(cssRoot);

files.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  if (content.startsWith(banner)) return;
  const next = banner + content.replace(/^\uFEFF/, "");
  fs.writeFileSync(file, next, "utf8");
});

if (files.length === 0) {
  console.log("No generated CSS files found in src/css");
}
