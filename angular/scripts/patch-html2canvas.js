/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const targets = [
  "node_modules/html2canvas/dist/html2canvas.js",
  "node_modules/html2canvas/dist/html2canvas.esm.js",
];

const pattern = /^\s*case 22 \/\* HEBREW \*\/:\s*$/m;

let patched = 0;

for (const relativePath of targets) {
  const filePath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(filePath)) {
    continue;
  }

  const source = fs.readFileSync(filePath, "utf8");
  if (!pattern.test(source)) {
    continue;
  }

  const updated = source.replace(pattern, "");
  fs.writeFileSync(filePath, updated, "utf8");
  patched += 1;
}

if (patched > 0) {
  console.log(
    `[postinstall] patched html2canvas duplicate case in ${patched} file(s)`,
  );
}
