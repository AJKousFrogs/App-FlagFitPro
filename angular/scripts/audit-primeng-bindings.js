#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src", "app");
const TARGET_EXT = new Set([".ts", ".html"]);

const RULES = [
  {
    id: "primeng-onValueChange",
    description: "Legacy (onValueChange) event binding",
    regex: /\(onValueChange\)\s*=/g,
  },
  {
    id: "primeng-modelValue",
    description: "Legacy [modelValue] binding",
    regex: /\[modelValue\]\s*=/g,
  },
  {
    id: "primeng-p-select-value",
    description: "Use ngModel/formControl with p-select instead of [value]",
    regex: /<p-select\b[^>]*\[value\]\s*=/g,
  },
  {
    id: "primeng-p-datepicker-value",
    description: "Use ngModel/formControl with p-datepicker instead of [value]",
    regex: /<p-datepicker\b[^>]*\[value\]\s*=/g,
  },
  {
    id: "primeng-p-inputnumber-value",
    description: "Use ngModel/formControl with p-inputNumber instead of [value]",
    regex: /<p-input(?:N|n)umber\b[^>]*\[value\]\s*=/g,
  },
  {
    id: "primeng-p-slider-value",
    description: "Use ngModel/formControl with p-slider instead of [value]",
    regex: /<p-slider\b[^>]*\[value\]\s*=/g,
  },
  {
    id: "primeng-p-checkbox-checked",
    description: "Use ngModel/formControl with p-checkbox instead of [checked]",
    regex: /<p-checkbox\b[^>]*\[checked\]\s*=/g,
  },
  {
    id: "primeng-p-toggleswitch-checked",
    description: "Use ngModel/formControl with p-toggleswitch instead of [checked]",
    regex: /<p-toggleswitch\b[^>]*\[checked\]\s*=/g,
  },
  {
    id: "primeng-p-toggleswitch-value",
    description: "Use ngModel/formControl with p-toggleswitch instead of [value]",
    regex: /<p-toggleswitch\b[^>]*\[value\]\s*=/g,
  },
];

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
      continue;
    }
    if (TARGET_EXT.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function lineNumberAt(content, index) {
  return content.slice(0, index).split("\n").length;
}

function relative(filePath) {
  return path.relative(ROOT, filePath).replaceAll(path.sep, "/");
}

async function main() {
  const files = await listFiles(SRC_DIR);
  const violations = [];

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    for (const rule of RULES) {
      rule.regex.lastIndex = 0;
      let match = rule.regex.exec(content);
      while (match) {
        violations.push({
          file: relative(file),
          line: lineNumberAt(content, match.index),
          rule: rule.id,
          description: rule.description,
        });
        match = rule.regex.exec(content);
      }
    }
  }

  if (violations.length === 0) {
    console.log("PrimeNG binding audit passed: no legacy bindings found.");
    return;
  }

  console.error(`PrimeNG binding audit found ${violations.length} violation(s):`);
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} [${v.rule}] ${v.description}`);
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error("PrimeNG binding audit failed:", error);
  process.exitCode = 1;
});
