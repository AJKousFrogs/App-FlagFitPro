import fs from "node:fs";
import path from "node:path";

const root = path.resolve("angular/src/app");

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {walk(full, acc);}
    else {acc.push(full);}
  }
  return acc;
}

function extractScssClasses(scss) {
  const classSet = new Set();
  const re = /\.[a-zA-Z0-9_-]+/g;
  let m;
  while ((m = re.exec(scss)) !== null) {
    const cls = m[0].slice(1);
    // Ignore common utility/prime/host selectors
    if (
      cls.startsWith("p-") ||
      cls.startsWith("cdk-") ||
      cls.startsWith("ng-") ||
      cls.startsWith("prime") ||
      cls.startsWith("pi-")
    )
      {continue;}
    classSet.add(cls);
  }
  return classSet;
}

function extractTemplateClasses(template) {
  const classSet = new Set();
  // class="a b"
  const classAttr = /class\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = classAttr.exec(template)) !== null) {
    m[1]
      .split(/\s+/)
      .filter(Boolean)
      .forEach((c) => classSet.add(c.trim()));
  }
  // [class.foo] or [class.foo]="..."
  const boundClass = /\[class\.([a-zA-Z0-9_-]+)\]/g;
  while ((m = boundClass.exec(template)) !== null) {
    classSet.add(m[1]);
  }
  // class="{{...}}" not parsed, treat as dynamic
  if (template.includes("[ngClass]") || template.includes("ngClass")) {
    classSet.add("__HAS_NGCLASS__");
  }
  return classSet;
}

function extractTsClassRefs(ts) {
  const classSet = new Set();
  // strings that look like class names
  const strRe = /['"]([a-zA-Z0-9_-]+)['"]/g;
  let m;
  while ((m = strRe.exec(ts)) !== null) {
    const val = m[1];
    if (val.includes("-")) {classSet.add(val);}
  }
  if (ts.includes("ngClass")) {classSet.add("__HAS_NGCLASS__");}
  return classSet;
}

const files = walk(root).filter((f) => f.endsWith(".component.scss"));
const report = [];

for (const scssFile of files) {
  const tsFile = scssFile.replace(/\.component\.scss$/, ".component.ts");
  const htmlFile = scssFile.replace(/\.component\.scss$/, ".component.html");
  const scss = read(scssFile);
  const ts = read(tsFile);
  const html = read(htmlFile);
  const template = html || ts;

  const scssClasses = extractScssClasses(scss);
  if (!scssClasses.size) {continue;}
  const templateClasses = extractTemplateClasses(template);
  const tsClasses = extractTsClassRefs(ts);

  // If ngClass is present, we cannot safely determine
  if (templateClasses.has("__HAS_NGCLASS__") || tsClasses.has("__HAS_NGCLASS__")) {
    continue;
  }

  const used = new Set([...templateClasses, ...tsClasses]);
  const unused = [...scssClasses].filter((c) => !used.has(c));

  if (unused.length) {
    report.push({
      file: scssFile,
      unused,
    });
  }
}

console.log(JSON.stringify(report, null, 2));
