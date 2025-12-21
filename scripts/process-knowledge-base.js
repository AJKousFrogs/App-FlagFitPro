#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Process Research Articles into Knowledge Base Entries
 *
 * Extracts structured knowledge from research articles and creates
 * knowledge base entries for the chatbot.
 */

import pg from "pg";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "..", ".env") });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

// Extract knowledge from articles
async function processArticlesIntoKnowledge() {
  console.log("🔍 Processing articles into knowledge base...\n");

  // Process supplements
  await processSupplements();

  // Process injuries
  await processInjuries();

  // Process recovery methods
  await processRecoveryMethods();

  // Process training methods
  await processTrainingMethods();

  // Process psychology
  await processPsychology();

  console.log("\n✅ Knowledge base processing complete!");
}

async function processSupplements() {
  console.log("💊 Processing supplement articles...");

  const supplements = [
    "iron",
    "creatine",
    "protein",
    "magnesium",
    "vitamin d",
    "beta-alanine",
  ];

  for (const supplement of supplements) {
    const articles = await pool.query(
      `
      SELECT id, title, abstract, key_findings, conclusions, supplement_guidance, safety_warnings
      FROM research_articles
      WHERE LOWER(abstract) LIKE $1 
         OR LOWER(title) LIKE $1
         OR $2 = ANY(LOWER(supplement_types::text)::text[])
      AND evidence_level IN ('A', 'B')
      ORDER BY citation_count DESC
      LIMIT 10
    `,
      [`%${supplement}%`, supplement],
    );

    if (articles.rows.length === 0) {continue;}

    // Extract dosage information
    const dosageInfo = extractDosageInfo(articles.rows, supplement);
    const safetyInfo = extractSafetyInfo(articles.rows);
    const absorptionInfo = extractAbsorptionInfo(articles.rows);

    // Create knowledge base entry
    await pool.query(
      `
      INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary,
        supporting_articles, evidence_strength, consensus_level,
        dosage_guidelines, safety_warnings, best_practices
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT DO NOTHING
    `,
      [
        "supplement",
        `${supplement}_supplementation`,
        `How much ${supplement} should I take?`,
        generateSupplementAnswer(
          supplement,
          dosageInfo,
          safetyInfo,
          absorptionInfo,
        ),
        `Evidence-based ${supplement} supplementation guidelines for athletes`,
        articles.rows.map((a) => a.id),
        determineConsensusLevel(articles.rows),
        "high",
        dosageInfo,
        safetyInfo,
        absorptionInfo,
      ],
    );

    console.log(
      `  ✓ Processed ${supplement}: ${articles.rows.length} articles`,
    );
  }
}

async function processInjuries() {
  console.log("🩹 Processing injury articles...");

  const injuries = [
    "ankle_sprain",
    "hamstring_strain",
    "shoulder_impingement",
    "acl_injury",
  ];

  for (const injury of injuries) {
    const articles = await pool.query(
      `
      SELECT id, title, abstract, key_findings, conclusions, practical_applications
      FROM research_articles
      WHERE $1 = ANY(LOWER(injury_types::text)::text[])
         OR LOWER(abstract) LIKE $2
      AND evidence_level IN ('A', 'B')
      ORDER BY citation_count DESC
      LIMIT 10
    `,
      [injury, `%${injury.replace("_", " ")}%`],
    );

    if (articles.rows.length === 0) {continue;}

    const treatmentInfo = extractTreatmentInfo(articles.rows);
    const preventionInfo = extractPreventionInfo(articles.rows);

    await pool.query(
      `
      INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary,
        supporting_articles, evidence_strength, consensus_level,
        protocols, best_practices
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT DO NOTHING
    `,
      [
        "injury",
        `${injury}_treatment`,
        `How do I treat and prevent ${injury.replace("_", " ")}?`,
        generateInjuryAnswer(injury, treatmentInfo, preventionInfo),
        `Evidence-based treatment and prevention for ${injury.replace("_", " ")}`,
        articles.rows.map((a) => a.id),
        determineConsensusLevel(articles.rows),
        "high",
        { treatment: treatmentInfo, prevention: preventionInfo },
        [...treatmentInfo, ...preventionInfo],
      ],
    );

    console.log(`  ✓ Processed ${injury}: ${articles.rows.length} articles`);
  }
}

async function processRecoveryMethods() {
  console.log("💤 Processing recovery method articles...");

  const methods = [
    { name: "sauna", protocol: "sauna_protocols" },
    { name: "cold_therapy", protocol: "cold_therapy_protocols" },
    { name: "massage", protocol: "massage_gun_protocols" },
  ];

  for (const method of methods) {
    const articles = await pool.query(
      `
      SELECT id, title, abstract, key_findings, conclusions, ${method.protocol}
      FROM research_articles
      WHERE $1 = ANY(LOWER(recovery_methods::text)::text[])
         OR LOWER(abstract) LIKE $2
      AND evidence_level IN ('A', 'B')
      ORDER BY citation_count DESC
      LIMIT 10
    `,
      [method.name, `%${method.name.replace("_", " ")}%`],
    );

    if (articles.rows.length === 0) {continue;}

    const protocols = extractProtocols(articles.rows, method.protocol);

    await pool.query(
      `
      INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary,
        supporting_articles, evidence_strength, consensus_level,
        protocols, best_practices
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT DO NOTHING
    `,
      [
        "recovery_method",
        `${method.name}_protocol`,
        `What is the best ${method.name.replace("_", " ")} protocol for recovery?`,
        generateRecoveryAnswer(method.name, protocols),
        `Evidence-based ${method.name.replace("_", " ")} protocols for athletes`,
        articles.rows.map((a) => a.id),
        determineConsensusLevel(articles.rows),
        "high",
        protocols,
        extractBestPractices(articles.rows),
      ],
    );

    console.log(
      `  ✓ Processed ${method.name}: ${articles.rows.length} articles`,
    );
  }
}

async function processTrainingMethods() {
  console.log("🏃 Processing training method articles...");
  // Similar structure to above
}

async function processPsychology() {
  console.log("🧠 Processing psychology articles...");
  // Similar structure to above
}

// Helper functions
function extractDosageInfo(articles, _supplement) {
  // Extract dosage information from articles
  const dosages = [];
  for (const article of articles) {
    const text =
      `${article.abstract || ""} ${article.key_findings || ""}`.toLowerCase();
    // Simple extraction - can be improved with NLP
    const dosageMatch = text.match(
      /(\d+)\s*(?:mg|g|mcg)\s*(?:per\s*day|daily)/i,
    );
    if (dosageMatch) {
      dosages.push(dosageMatch[0]);
    }
  }
  return { recommended_dosage: dosages[0] || "See research", sources: dosages };
}

function extractSafetyInfo(articles) {
  const warnings = [];
  for (const article of articles) {
    if (article.safety_warnings) {
      warnings.push(...article.safety_warnings);
    }
  }
  return [...new Set(warnings)];
}

function extractAbsorptionInfo(articles) {
  const tips = [];
  for (const article of articles) {
    const text =
      `${article.abstract || ""} ${article.key_findings || ""}`.toLowerCase();
    if (text.includes("vitamin c") || text.includes("absorption")) {
      tips.push("Take with vitamin C to enhance absorption");
    }
  }
  return tips;
}

function extractTreatmentInfo(articles) {
  // Extract treatment protocols
  return articles.map((a) => a.practical_applications || []).flat();
}

function extractPreventionInfo(articles) {
  // Extract prevention strategies
  return articles.map((a) => a.practical_applications || []).flat();
}

function extractProtocols(articles, protocolField) {
  return articles
    .map((a) => a[protocolField])
    .filter((p) => p)
    .reduce((acc, p) => ({ ...acc, ...p }), {});
}

function extractBestPractices(articles) {
  return articles
    .map((a) => a.practical_applications || [])
    .flat()
    .filter((v, i, a) => a.indexOf(v) === i); // Unique
}

function determineConsensusLevel(articles) {
  if (articles.length >= 5) {return "high";}
  if (articles.length >= 3) {return "moderate";}
  return "low";
}

function generateSupplementAnswer(supplement, dosage, safety, absorption) {
  return `**${supplement.toUpperCase()} Supplementation Guidelines**

**Recommended Dosage:** ${dosage.recommended_dosage}

**Absorption Tips:**
${absorption.map((tip) => `• ${tip}`).join("\n")}

**Safety Warnings:**
${safety.map((warning) => `• ${warning}`).join("\n")}

*Based on ${dosage.sources.length} evidence-based research articles.*`;
}

function generateInjuryAnswer(injury, treatment, prevention) {
  return `**${injury.replace("_", " ").toUpperCase()} Treatment & Prevention**

**Treatment:**
${treatment.map((t) => `• ${t}`).join("\n")}

**Prevention:**
${prevention.map((p) => `• ${p}`).join("\n")}`;
}

function generateRecoveryAnswer(method, protocols) {
  return `**${method.replace("_", " ").toUpperCase()} Protocol**

**Recommended Protocol:**
${JSON.stringify(protocols, null, 2)}`;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processArticlesIntoKnowledge()
    .then(() => {
      console.log("\n✨ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { processArticlesIntoKnowledge };
