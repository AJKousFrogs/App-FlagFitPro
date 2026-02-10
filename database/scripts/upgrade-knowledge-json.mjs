#!/usr/bin/env node
/**
 * Upgrade knowledge base JSON files per deep-research-report recommendations:
 * - schema_version, content_version (SemVer)
 * - document_id (URN UUID), entry_id per entry
 * - generated_at (RFC 3339)
 * - rights block (source_url, licence_expression, permitted_use, attribution)
 * - quantitative_claims where applicable
 * - evidence_framework where applicable
 */
import { readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dirname, '..');
const GENERATED_AT = new Date().toISOString();
const SCHEMA_VERSION = '1.0.0';
const CONTENT_VERSION = '1.0.0';

// Deterministic UUID v5-style from string (namespace + name hash)
function uuidFromString(str) {
  const hash = createHash('sha256').update(str).digest('hex');
  return `urn:uuid:${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-${'89ab'[parseInt(hash[16], 16) % 4]}${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

// Source URLs and rights by document
const DOC_RIGHTS = {
  'practitioners_guide_calf_achilles': {
    source_url: 'https://resources.valdperformance.com/practitioners-guide-to-the-calf-achilles-complex',
    licence_expression: 'LicenseRef-Proprietary',
    permitted_use: 'internal_only',
  },
  'practitioners_guide_hamstrings': {
    source_url: 'https://resources.valdperformance.com/practitioners-guide-to-hamstrings',
    licence_expression: 'LicenseRef-Proprietary',
    permitted_use: 'internal_only',
  },
  'practitioners_guide_shoulders': {
    source_url: 'https://resources.valdperformance.com/practitioners-guide-to-shoulders',
    licence_expression: 'LicenseRef-Proprietary',
    permitted_use: 'internal_only',
  },
  'practitioners_guide_hip_groin': {
    source_url: 'https://resources.valdperformance.com/practitioners-guide-to-hip-groin',
    licence_expression: 'LicenseRef-Proprietary',
    permitted_use: 'internal_only',
  },
  'practitioners_guide_isometrics': {
    source_url: 'https://resources.valdperformance.com',
    licence_expression: 'LicenseRef-Proprietary',
    permitted_use: 'internal_only',
  },
  'practitioners_guide_plyometrics_quadriceps': {
    source_url: 'https://resources.valdperformance.com',
    licence_expression: 'LicenseRef-Proprietary',
    permitted_use: 'internal_only',
  },
  'practitioners_guide_preseason': {
    source_url: 'https://resources.valdperformance.com',
    licence_expression: 'LicenseRef-Proprietary',
    permitted_use: 'internal_only',
  },
  'practitioners_guide_speed_testing': {
    source_url: 'https://resources.valdperformance.com',
    licence_expression: 'LicenseRef-Proprietary',
    permitted_use: 'internal_only',
  },
  'flag_football_athlete_monitoring': {
    source_url: null,
    licence_expression: 'CC-BY-4.0',
    permitted_use: 'attribution_required',
  },
};

// Quantitative claims by topic (extracted from prose)
const QUANTITATIVE_CLAIMS = {
  calf_achilles_assessment_protocols: [
    { metric: 'bilateral_asymmetry', operator: '>=', value_range: { min: 10, max: 15 }, unit: 'percent', population_context: 'athletes', interpretation: 'flag_for_investigation' },
  ],
  calf_achilles_rehabilitation: [
    { metric: 'strength_restoration', operator: '>=', value_range: { value: 90 }, unit: 'percent', population_context: 'return_to_sport', interpretation: 'minimum_for_rts' },
  ],
  calf_achilles_injury_prevention: [
    { metric: 'weekly_load_increase', operator: '<=', value_range: { value: 10 }, unit: 'percent', population_context: 'load_management', interpretation: 'guideline' },
    { metric: 'bilateral_asymmetry', operator: '>=', value_range: { min: 10, max: 15 }, unit: 'percent', population_context: 'athletes', interpretation: 'flag_for_investigation' },
  ],
  soleus_gastrocnemius_differentiation: [
    { metric: 'soleus_recurrence_days', operator: '=', value_range: { value: 25.1 }, unit: 'days', population_context: 'soleus_strain', interpretation: 'typical_rehab_window' },
    { metric: 'gastrocnemius_recurrence_days', operator: '=', value_range: { value: 7.7 }, unit: 'days', population_context: 'gastrocnemius_strain', interpretation: 'typical_rehab_window' },
  ],
  calf_achilles_injuries_pathologies: [
    { metric: 'soleus_recurrence_days', operator: '=', value_range: { value: 25 }, unit: 'days', population_context: 'soleus_strain', interpretation: 'typical_rehab_window' },
    { metric: 'gastrocnemius_recurrence_days', operator: '=', value_range: { value: 7.7 }, unit: 'days', population_context: 'gastrocnemius_strain', interpretation: 'typical_rehab_window' },
  ],
  hamstring_injuries_pathologies: [
    { metric: 'reinjury_rate', operator: '>=', value_range: { min: 12, max: 30 }, unit: 'percent', population_context: 'hamstring_strain', interpretation: 'reported_range' },
    { metric: 'bilateral_asymmetry', operator: '>=', value_range: { value: 15 }, unit: 'percent', population_context: 'risk_factor', interpretation: 'flag_for_investigation' },
  ],
  hamstring_injury_prevention: [
    { metric: 'nordic_curl_risk_reduction', operator: '>=', value_range: { min: 50, max: 70 }, unit: 'percent', population_context: 'injury_prevention', interpretation: 'reported_benefit' },
    { metric: 'bilateral_asymmetry', operator: '>=', value_range: { value: 10 }, unit: 'percent', population_context: 'screening', interpretation: 'flag_threshold' },
  ],
  flag_football_training_load_monitoring: [
    { metric: 'load_spike_threshold', operator: '>=', value_range: { min: 10, max: 15 }, unit: 'percent', population_context: 'week_to_week', interpretation: 'injury_risk_increase' },
  ],
  flag_football_acwr_interpretation: [
    { metric: 'acwr_sweet_spot', operator: '>=', value_range: { min: 0.8, max: 1.3 }, unit: 'ratio', population_context: 'load_management', interpretation: 'optimal_range' },
    { metric: 'acwr_high_risk', operator: '>', value_range: { value: 1.5 }, unit: 'ratio', population_context: 'load_management', interpretation: 'high_risk_threshold' },
  ],
};

function buildRights(doc, ra) {
  const key = Object.keys(DOC_RIGHTS).find(k => doc.includes(k)) || 'practitioners_guide_calf_achilles';
  const r = DOC_RIGHTS[key];
  return {
    is_open_access: ra.is_open_access ?? false,
    licence_expression: r.licence_expression,
    permitted_use: r.permitted_use,
    attribution: {
      title: ra.title,
      publisher: ra.publisher,
      source_url: r.source_url || undefined,
      authors: ra.authors,
    },
  };
}

function upgradeEntry(entry, idx, docId) {
  const entryId = entry.entry_id || uuidFromString(`${docId}:${entry.topic}:${entry.question}`);
  const upgraded = { ...entry, entry_id: entryId };

  const claims = QUANTITATIVE_CLAIMS[entry.topic];
  if (claims) {
    upgraded.quantitative_claims = claims;
  }

  if (!upgraded.evidence_framework && (upgraded.evidence_strength || upgraded.consensus_level)) {
    upgraded.evidence_framework = 'GRADE';
  }

  return upgraded;
}

function upgradeFile(filename) {
  const path = join(DB_DIR, filename);
  const content = JSON.parse(readFileSync(path, 'utf8'));

  if (content.schema_version && content.document_id) {
    console.log(`  Skip (already upgraded): ${filename}`);
    return;
  }

  const docKey = filename.replace('.json', '');
  const documentId = uuidFromString(`flagfit:knowledge:${docKey}`);

  const ra = content.research_article || {};
  const upgraded = {
    $schema: 'https://flagfit.pro/schemas/knowledge_base/v1.0.0',
    schema_version: SCHEMA_VERSION,
    content_version: CONTENT_VERSION,
    document_id: documentId,
    generated_at: GENERATED_AT,
    reviewed_at: null,
    rights: buildRights(docKey, ra),
    metadata: content.metadata,
    research_article: ra,
    knowledge_base_entries: (content.knowledge_base_entries || []).map((e, i) => upgradeEntry(e, i, documentId)),
  };

  writeFileSync(path, JSON.stringify(upgraded, null, 2), 'utf8');
  console.log(`  Upgraded: ${filename} (${upgraded.knowledge_base_entries.length} entries)`);
}

const FILES = [
  'practitioners_guide_calf_achilles_knowledge.json',
  'practitioners_guide_hamstrings_knowledge.json',
  'practitioners_guide_shoulders_knowledge.json',
  'practitioners_guide_hip_groin_knowledge.json',
  'practitioners_guide_isometrics_knowledge.json',
  'practitioners_guide_plyometrics_quadriceps_knowledge.json',
  'practitioners_guide_preseason_knowledge.json',
  'practitioners_guide_speed_testing_knowledge.json',
  'flag_football_athlete_monitoring_knowledge.json',
];

console.log('Upgrading knowledge base JSON files...');
FILES.forEach(upgradeFile);
console.log('Done.');
