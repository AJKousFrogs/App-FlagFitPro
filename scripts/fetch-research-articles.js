#!/usr/bin/env node
 
/**
 * Fetch Research Articles from Open Sources
 *
 * Fetches evidence-based articles from:
 * - Europe PMC (PubMed + open access)
 * - arXiv (preprints)
 * - Semantic Scholar API
 * - Crossref API
 *
 * Target: 100-1000+ articles covering:
 * - Injuries & injury prevention
 * - Nutrition & supplements
 * - Recovery methods (sauna, cold therapy, massage)
 * - Training protocols
 * - Sports psychology
 */

import pg from "pg";
// Using native fetch (available in Node.js 18+)
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "..", ".env") });

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
  ssl: process.env.DATABASE_URL?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});

// Search queries for different topics
const SEARCH_QUERIES = {
  injuries: [
    "ankle sprain treatment athletes",
    "hamstring strain prevention",
    "ACL injury prevention team sports",
    "shoulder impingement athletes",
    "injury prevention football",
    "sports injury rehabilitation",
    "overuse injuries prevention",
    "concussion management athletes",
  ],
  nutrition: [
    "iron supplementation athletes",
    "protein requirements athletes",
    "creatine supplementation performance",
    "magnesium athletes performance",
    "vitamin D athletes",
    "pre-workout nutrition",
    "post-workout nutrition recovery",
    "hydration strategies athletes",
    "carbohydrate loading athletes",
    "sports nutrition guidelines",
  ],
  recovery: [
    "sauna therapy athletes recovery",
    "cold water immersion recovery",
    "cryotherapy athletes",
    "massage therapy athletes",
    "compression therapy recovery",
    "sleep recovery athletes",
    "active recovery methods",
    "foam rolling recovery",
  ],
  training: [
    "speed training athletes",
    "agility training team sports",
    "strength training periodization",
    "plyometric training",
    "interval training performance",
    "training load monitoring",
    "overtraining prevention",
    "training adaptation athletes",
  ],
  psychology: [
    "sports psychology performance",
    "anxiety management athletes",
    "visualization techniques athletes",
    "confidence building athletes",
    "mental toughness training",
    "goal setting athletes",
    "pre-competition routines",
    "stress management athletes",
  ],
};

// Europe PMC API
async function fetchEuropePMC(query, category, maxResults = 100) {
  const baseUrl = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";
  const params = new URLSearchParams({
    query: query,
    format: "json",
    pageSize: maxResults,
    resultType: "core",
    sort: "CITED desc", // Most cited first
    openAccessOnly: "true", // Only open access articles
  });

  try {
    const response = await fetch(`${baseUrl}?${params}`);
    const data = await response.json();

    if (data.resultList && data.resultList.result) {
      return data.resultList.result.map((article) => ({
        title: article.title,
        authors: article.authorString ? article.authorString.split(", ") : [],
        publication_year: article.pubYear ? parseInt(article.pubYear) : null,
        journal: article.journalTitle,
        doi: article.doi,
        pmc_id: article.pmcId,
        pubmed_id: article.pmid,
        abstract: article.abstractText,
        full_text_url: article.fullTextUrlList?.fullTextUrl?.[0]?.url,
        pdf_url: article.fullTextUrlList?.fullTextUrl?.find(
          (url) => url.availability === "Open access",
        )?.url,
        source_type: "europe_pmc",
        is_open_access: true,
        primary_category: category,
        categories: [category],
        tags: extractTags(article, category),
      }));
    }
    return [];
  } catch (error) {
    console.error(
      `Error fetching from Europe PMC for query "${query}":`,
      error.message,
    );
    return [];
  }
}

// Semantic Scholar API
async function fetchSemanticScholar(query, category, maxResults = 50) {
  const baseUrl = "https://api.semanticscholar.org/graph/v1/paper/search";
  const params = new URLSearchParams({
    query: query,
    limit: maxResults.toString(),
    fields: "title,authors,year,venue,abstract,doi,citationCount,openAccessPdf",
  });

  try {
    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        "User-Agent": "FlagFit-Pro/1.0 (mailto:support@flagfit.pro)",
      },
    });
    const data = await response.json();

    if (data.data) {
      return data.data
        .filter((paper) => paper.openAccessPdf) // Only open access
        .map((paper) => ({
          title: paper.title,
          authors: paper.authors?.map((a) => a.name) || [],
          publication_year: paper.year,
          journal: paper.venue,
          doi: paper.doi,
          semantic_scholar_id: paper.paperId,
          abstract: paper.abstract,
          pdf_url: paper.openAccessPdf?.url,
          citation_count: paper.citationCount || 0,
          source_type: "semantic_scholar",
          is_open_access: true,
          primary_category: category,
          categories: [category],
          tags: extractTagsFromAbstract(paper.abstract || "", category),
        }));
    }
    return [];
  } catch (error) {
    console.error(
      `Error fetching from Semantic Scholar for query "${query}":`,
      error.message,
    );
    return [];
  }
}

// Extract tags from article data
function extractTags(article, category) {
  const tags = [category];

  // Extract from title and abstract
  const text =
    `${article.title || ""} ${article.abstractText || ""}`.toLowerCase();

  // Common supplement tags
  if (text.includes("iron")) {tags.push("iron");}
  if (text.includes("creatine")) {tags.push("creatine");}
  if (text.includes("protein")) {tags.push("protein");}
  if (text.includes("magnesium")) {tags.push("magnesium");}
  if (text.includes("vitamin d")) {tags.push("vitamin_d");}

  // Recovery methods
  if (text.includes("sauna")) {tags.push("sauna");}
  if (
    text.includes("cold") ||
    text.includes("cryotherapy") ||
    text.includes("ice")
  ) {tags.push("cold_therapy");}
  if (text.includes("massage")) {tags.push("massage");}
  if (text.includes("compression")) {tags.push("compression");}

  // Injury types
  if (text.includes("ankle")) {tags.push("ankle_sprain");}
  if (text.includes("hamstring")) {tags.push("hamstring_strain");}
  if (text.includes("acl")) {tags.push("acl_injury");}
  if (text.includes("shoulder")) {tags.push("shoulder_injury");}

  return tags;
}

function extractTagsFromAbstract(abstract, category) {
  return extractTags({ abstractText: abstract }, category);
}

// Determine study type from abstract
function determineStudyType(abstract) {
  if (!abstract) {return null;}
  const lower = abstract.toLowerCase();

  if (lower.includes("meta-analysis") || lower.includes("meta analysis")) {return "meta_analysis";}
  if (lower.includes("systematic review")) {return "systematic_review";}
  if (lower.includes("randomized controlled trial") || lower.includes("rct")) {return "rct";}
  if (lower.includes("cohort study")) {return "cohort";}
  if (lower.includes("case-control")) {return "case_control";}
  if (lower.includes("case study")) {return "case_study";}
  if (lower.includes("review")) {return "review";}

  return null;
}

// Determine evidence level
function determineEvidenceLevel(studyType, _citationCount) {
  if (studyType === "meta_analysis" || studyType === "systematic_review") {return "A";}
  if (studyType === "rct") {return "A";}
  if (studyType === "cohort") {return "B";}
  if (studyType === "case_control") {return "B";}
  if (studyType === "case_study") {return "C";}
  if (studyType === "review") {return "C";}
  return "C";
}

// Insert article into database
async function insertArticle(article) {
  const studyType = determineStudyType(article.abstract);
  const evidenceLevel = determineEvidenceLevel(
    studyType,
    article.citation_count || 0,
  );

  const query = `
    INSERT INTO research_articles (
      title, authors, publication_year, journal, doi, pubmed_id, pmc_id,
      semantic_scholar_id, abstract, full_text_url, pdf_url,
      primary_category, categories, tags, study_type, evidence_level,
      citation_count, source_type, is_open_access, keywords
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    ON CONFLICT (doi) DO UPDATE SET
      citation_count = EXCLUDED.citation_count,
      updated_at = NOW()
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [
      article.title,
      article.authors,
      article.publication_year,
      article.journal,
      article.doi,
      article.pubmed_id,
      article.pmc_id,
      article.semantic_scholar_id,
      article.abstract,
      article.full_text_url,
      article.pdf_url,
      article.primary_category,
      article.categories,
      article.tags,
      studyType,
      evidenceLevel,
      article.citation_count || 0,
      article.source_type,
      article.is_open_access,
      article.tags, // Use tags as keywords for now
    ]);

    return result.rows[0]?.id;
  } catch (error) {
    if (error.code === "23505") {
      // Unique violation
      console.log(`Article already exists: ${article.doi || article.title}`);
      return null;
    }
    console.error("Error inserting article:", error.message);
    return null;
  }
}

// Main fetch function
async function fetchAllArticles() {
  console.log("🚀 Starting research article fetch...\n");

  let totalFetched = 0;
  let totalInserted = 0;

  for (const [category, queries] of Object.entries(SEARCH_QUERIES)) {
    console.log(`\n📚 Fetching ${category} articles...`);

    for (const query of queries) {
      console.log(`  Searching: "${query}"`);

      // Fetch from Europe PMC
      const epmcArticles = await fetchEuropePMC(query, category, 50);
      console.log(`    Europe PMC: ${epmcArticles.length} articles found`);

      for (const article of epmcArticles) {
        totalFetched++;
        const id = await insertArticle(article);
        if (id) {totalInserted++;}
      }

      // Fetch from Semantic Scholar
      const ssArticles = await fetchSemanticScholar(query, category, 25);
      console.log(`    Semantic Scholar: ${ssArticles.length} articles found`);

      for (const article of ssArticles) {
        totalFetched++;
        const id = await insertArticle(article);
        if (id) {totalInserted++;}
      }

      // Rate limiting - be respectful
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n✅ Fetch complete!`);
  console.log(`   Total fetched: ${totalFetched}`);
  console.log(`   Total inserted: ${totalInserted}`);
  console.log(`   Duplicates skipped: ${totalFetched - totalInserted}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAllArticles()
    .then(() => {
      console.log("\n✨ Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { fetchAllArticles, fetchEuropePMC, fetchSemanticScholar };
