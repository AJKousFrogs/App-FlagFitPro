#!/usr/bin/env node
/**
 * Validate knowledge base JSON files against the schema.
 * Uses dynamic import of ajv; run `npm install ajv` if needed.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dirname, '..');
const SCHEMA_PATH = join(DB_DIR, 'schemas', 'knowledge_base.schema.json');

const FILES = [
  ...(await glob(join(DB_DIR, 'practitioners_guide_*_knowledge.json'))),
  join(DB_DIR, 'flag_football_athlete_monitoring_knowledge.json'),
];

async function main() {
  let Ajv;
  try {
    const mod = await import('ajv');
    Ajv = mod.default;
  } catch (e) {
    console.error('Run: npm install ajv');
    process.exit(1);
  }

  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);

  let failed = 0;
  for (const path of FILES) {
    try {
      const data = JSON.parse(readFileSync(path, 'utf8'));
      const ok = validate(data);
      const name = path.split('/').pop();
      if (ok) {
        console.log(`✓ ${name}`);
      } else {
        console.error(`✗ ${name}`);
        console.error(validate.errors.map(e => `  ${e.instancePath}: ${e.message}`).join('\n'));
        failed++;
      }
    } catch (e) {
      console.error(`✗ ${path.split('/').pop()}: ${e.message}`);
      failed++;
    }
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
