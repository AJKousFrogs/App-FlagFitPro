import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const angularRoot = join(scriptDir, "..");

function patchFile(relativePath, replacements) {
  const filePath = join(angularRoot, relativePath);
  let source = readFileSync(filePath, "utf8");
  let next = source;

  for (const [from, to] of replacements) {
    next = next.replace(from, to);
  }

  if (next !== source) {
    writeFileSync(filePath, next);
  }
}

patchFile("node_modules/primeng/fesm2022/primeng-utils.mjs", [
  [
    "str = str.normalize('NFKD').replace(/\\p{Diacritic}/gu, '');",
    "str = str.normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '');",
  ],
]);

patchFile("node_modules/html2canvas/dist/html2canvas.js", [
  ["return 22 /* HEBREW */;", "return 99 /* HEBREW */;"],
  ["case 22 /* HEBREW */:", "case 99 /* HEBREW */:"],
]);

