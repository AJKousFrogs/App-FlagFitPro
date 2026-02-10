#!/usr/bin/env node
/**
 * Scan knowledge JSON for secret patterns (API keys, tokens, passwords).
 * Per OWASP: use placeholders, not literals. Fail CI on high-confidence matches.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dirname, '..');

const PATTERNS = [
  { regex: /["']?[a-zA-Z0-9_-]{32,}["']?\s*:\s*["'][^"']+["']/g, name: 'long_token' },
  { regex: /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi, name: 'api_key_literal' },
  { regex: /secret\s*[:=]\s*["'][^"']+["']/gi, name: 'secret_literal' },
  { regex: /password\s*[:=]\s*["'][^"']+["']/gi, name: 'password_literal' },
  { regex: /sk-[a-zA-Z0-9]{48,}/g, name: 'openai_key' },
  { regex: /ghp_[a-zA-Z0-9]{36}/g, name: 'github_token' },
];

async function main() {
  const files = await glob(join(DB_DIR, '*_knowledge.json'));
  let found = 0;
  for (const path of files) {
    const content = readFileSync(path, 'utf8');
    const name = path.split('/').pop();
    for (const { regex, name: pname } of PATTERNS) {
      const m = content.match(regex);
      if (m) {
        console.error(`SECRET_SCAN: ${name} matches ${pname}`);
        found++;
      }
    }
  }
  if (found > 0) process.exit(1);
  console.log('✓ No secret patterns detected in knowledge JSON files');
}

main();
