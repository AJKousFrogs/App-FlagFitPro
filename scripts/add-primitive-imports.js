#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const srcPath = path.join(process.cwd(), 'angular/src');
const files = await glob('scss/components/primitives/*.scss', { cwd: srcPath, absolute: true });

let modified = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');

  if (!content.includes('@use "styles/mixins"')) {
    content = '@use "styles/mixins" as *;\n\n' + content;
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`✓ Added import to ${path.basename(file)}`);
    modified++;
  }
}

console.log(`\n✅ Modified ${modified} files\n`);
process.exit(0);
