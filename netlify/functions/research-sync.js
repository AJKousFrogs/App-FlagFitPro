import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { supabaseAdmin } from "./utils/supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { authenticateRequest } from "./utils/auth-helper.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { createErrorResponse, handleValidationError } from "./utils/error-handler.js";

/**
 * Sports Science Research Sync Function
 *
 * Syncs research data from free scholarly APIs:
 * - PubMed/Entrez API (millions of biomedical studies)
 * - Europe PMC REST API (open access full-text papers)
 * - OpenAlex API (no-key scholarly graph)
 *
 * API Documentation:
 * - PubMed: https://www.ncbi.nlm.nih.gov/books/NBK25501/
 * - Europe PMC: https://europepmc.org/RestfulWebService
 * - OpenAlex: https://docs.openalex.org/
 */

// API Base URLs (all free, no API key required for basic usage)
const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const EUROPE_PMC_BASE_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest";
const OPENALEX_BASE_URL = "https://api.openalex.org";

// Use shared Supabase admin client
function getSupabaseAdmin() {
  return supabaseAdmin;
}

// =============================================================================
// PUBMED API INTEGRATION
// =============================================================================

/**
 * Search PubMed for research studies
 * Uses E-utilities API (free, rate limited to 3 requests/second without API key)
 */
async function searchPubMed(query, maxResults = 20) {
  try {
    // Step 1: Search for PMIDs
    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=relevance`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    const pmids = searchData.esearchresult?.idlist || [];
    if (pmids.length === 0) {
      return [];
    }

    // Step 2: Fetch article details
    const fetchUrl = `${PUBMED_BASE_URL}/efetch.fcgi?db=pubmed&id=${pmids.join(",")}&retmode=xml`;
    const fetchResponse = await fetch(fetchUrl);
    const xmlText = await fetchResponse.text();

    // Parse XML response (simplified parsing)
    const articles = parsePubMedXML(xmlText);

    return articles;
  } catch (error) {
    console.error("PubMed search error:", error);
    return [];
  }
}

/**
 * Parse PubMed XML response
 * Extracts key fields from PubMed article XML
 */
function parsePubMedXML(xmlText) {
  const articles = [];

  // Simple regex-based parsing for key fields
  const articleMatches =
    xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

  for (const articleXml of articleMatches) {
    try {
      const pmid = extractXmlValue(articleXml, "PMID");
      const title = extractXmlValue(articleXml, "ArticleTitle");
      const abstractText =
        extractXmlValue(articleXml, "AbstractText") ||
        extractAllAbstractText(articleXml);
      const journal = extractXmlValue(articleXml, "Title");
      const year = extractXmlValue(articleXml, "Year");
      const doi = extractDOI(articleXml);

      // Extract authors
      const authors = extractAuthors(articleXml);

      // Extract MeSH terms
      const meshTerms = extractMeshTerms(articleXml);

      // Extract keywords
      const keywords = extractKeywords(articleXml);

      if (pmid && title) {
        articles.push({
          source: "pubmed",
          external_id: pmid,
          doi,
          title: cleanText(title),
          abstract: cleanText(abstractText),
          authors,
          journal,
          publication_year: year ? parseInt(year) : null,
          publication_date: year ? `${year}-01-01` : null,
          mesh_terms: meshTerms,
          keywords,
          full_text_url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          is_open_access:
            articleXml.includes("pmc") || articleXml.includes("PMC"),
        });
      }
    } catch (e) {
      console.error("Error parsing article:", e);
    }
  }

  return articles;
}

function extractXmlValue(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function extractAllAbstractText(xml) {
  const matches =
    xml.match(/<AbstractText[^>]*>[\s\S]*?<\/AbstractText>/g) || [];
  return matches
    .map((m) => {
      const text = m.replace(/<[^>]+>/g, "").trim();
      return text;
    })
    .join(" ");
}

function extractDOI(xml) {
  const doiMatch = xml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/);
  return doiMatch ? doiMatch[1] : null;
}

function extractAuthors(xml) {
  const authors = [];
  const authorMatches = xml.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];

  for (const authorXml of authorMatches.slice(0, 10)) {
    // Limit to first 10 authors
    const lastName = extractXmlValue(authorXml, "LastName");
    const foreName = extractXmlValue(authorXml, "ForeName");
    const affiliation = extractXmlValue(authorXml, "Affiliation");

    if (lastName) {
      authors.push({
        name: foreName ? `${foreName} ${lastName}` : lastName,
        affiliation,
      });
    }
  }

  return authors;
}

function extractMeshTerms(xml) {
  const terms = [];
  const meshMatches =
    xml.match(/<DescriptorName[^>]*>([^<]+)<\/DescriptorName>/g) || [];

  for (const match of meshMatches) {
    const term = match.replace(/<[^>]+>/g, "").trim();
    if (term && !terms.includes(term)) {
      terms.push(term);
    }
  }

  return terms;
}

function extractKeywords(xml) {
  const keywords = [];
  const keywordMatches = xml.match(/<Keyword[^>]*>([^<]+)<\/Keyword>/g) || [];

  for (const match of keywordMatches) {
    const keyword = match.replace(/<[^>]+>/g, "").trim();
    if (keyword && !keywords.includes(keyword)) {
      keywords.push(keyword);
    }
  }

  return keywords;
}

function cleanText(text) {
  if (!text) {
    return null;
  }
  return text
    .replace(/<[^>]+>/g, "") // Remove XML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

// =============================================================================
// EUROPE PMC API INTEGRATION
// =============================================================================

/**
 * Search Europe PMC for open access research
 * Provides full-text access to open papers
 */
async function searchEuropePMC(query, maxResults = 20) {
  try {
    const searchUrl = `${EUROPE_PMC_BASE_URL}/search?query=${encodeURIComponent(query)}&resultType=core&pageSize=${maxResults}&format=json`;
    const response = await fetch(searchUrl);
    const data = await response.json();

    const results = data.resultList?.result || [];

    return results.map((article) => ({
      source: "europe_pmc",
      external_id: article.pmid || article.id,
      doi: article.doi,
      title: article.title,
      abstract: article.abstractText,
      authors: (article.authorList?.author || []).map((a) => ({
        name: a.fullName,
        affiliation: a.affiliation,
      })),
      journal: article.journalTitle,
      publication_year: article.pubYear ? parseInt(article.pubYear) : null,
      publication_date: article.firstPublicationDate,
      keywords: article.keywordList?.keyword || [],
      full_text_url: article.fullTextUrlList?.fullTextUrl?.[0]?.url,
      pdf_url: article.fullTextUrlList?.fullTextUrl?.find(
        (u) => u.documentStyle === "pdf",
      )?.url,
      is_open_access: article.isOpenAccess === "Y",
    }));
  } catch (error) {
    console.error("Europe PMC search error:", error);
    return [];
  }
}

// =============================================================================
// OPENALEX API INTEGRATION
// =============================================================================

/**
 * Search OpenAlex for scholarly works
 * No API key required, generous rate limits
 */
async function searchOpenAlex(query, maxResults = 20) {
  try {
    const searchUrl = `${OPENALEX_BASE_URL}/works?search=${encodeURIComponent(query)}&per_page=${maxResults}&sort=relevance_score:desc`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "FrogsApp/1.0 (mailto:contact@frogsapp.com)", // Polite pool
      },
    });
    const data = await response.json();

    const results = data.results || [];

    return results.map((work) => ({
      source: "openAlex",
      external_id: work.id?.replace("https://openalex.org/", ""),
      doi: work.doi?.replace("https://doi.org/", ""),
      title: work.title,
      abstract: work.abstract_inverted_index
        ? reconstructAbstract(work.abstract_inverted_index)
        : null,
      authors: (work.authorships || []).slice(0, 10).map((a) => ({
        name: a.author?.display_name,
        affiliation: a.institutions?.[0]?.display_name,
      })),
      journal: work.primary_location?.source?.display_name,
      publication_year: work.publication_year,
      publication_date: work.publication_date,
      keywords: work.concepts?.slice(0, 10).map((c) => c.display_name) || [],
      full_text_url: work.primary_location?.landing_page_url,
      pdf_url: work.primary_location?.pdf_url || work.open_access?.oa_url,
      is_open_access: work.open_access?.is_oa || false,
      study_type: work.type,
    }));
  } catch (error) {
    console.error("OpenAlex search error:", error);
    return [];
  }
}

/**
 * Search OpenAlex by institution (e.g., Australian Institute of Sport)
 * Useful for finding research from specific sports science institutions
 */
async function searchOpenAlexByInstitution(
  institutionQuery,
  topicQuery = null,
  maxResults = 20,
) {
  try {
    // First, find the institution ID
    const instSearchUrl = `${OPENALEX_BASE_URL}/institutions?search=${encodeURIComponent(institutionQuery)}&per_page=1`;
    const instResponse = await fetch(instSearchUrl, {
      headers: {
        "User-Agent": "FrogsApp/1.0 (mailto:contact@frogsapp.com)",
      },
    });
    const instData = await instResponse.json();

    const institution = instData.results?.[0];
    if (!institution) {
      console.log(`Institution not found: ${institutionQuery}`);
      return [];
    }

    // Search for works from this institution
    let worksUrl = `${OPENALEX_BASE_URL}/works?filter=institutions.id:${institution.id}`;
    if (topicQuery) {
      worksUrl += `&search=${encodeURIComponent(topicQuery)}`;
    }
    worksUrl += `&per_page=${maxResults}&sort=publication_date:desc`;

    const worksResponse = await fetch(worksUrl, {
      headers: {
        "User-Agent": "FrogsApp/1.0 (mailto:contact@frogsapp.com)",
      },
    });
    const worksData = await worksResponse.json();

    const results = worksData.results || [];

    return results.map((work) => ({
      source: "openAlex",
      external_id: work.id?.replace("https://openalex.org/", ""),
      doi: work.doi?.replace("https://doi.org/", ""),
      title: work.title,
      abstract: work.abstract_inverted_index
        ? reconstructAbstract(work.abstract_inverted_index)
        : null,
      authors: (work.authorships || []).slice(0, 10).map((a) => ({
        name: a.author?.display_name,
        affiliation: a.institutions?.[0]?.display_name,
      })),
      journal: work.primary_location?.source?.display_name,
      publication_year: work.publication_year,
      publication_date: work.publication_date,
      keywords: work.concepts?.slice(0, 10).map((c) => c.display_name) || [],
      full_text_url: work.primary_location?.landing_page_url,
      pdf_url: work.primary_location?.pdf_url || work.open_access?.oa_url,
      is_open_access: work.open_access?.is_oa || false,
      study_type: work.type,
      institution: institution.display_name,
    }));
  } catch (error) {
    console.error("OpenAlex institution search error:", error);
    return [];
  }
}

// Key sports science institutions for research (Shanghai Ranking 2024 + AIS)
const SPORTS_SCIENCE_INSTITUTIONS = [
  // Top 10 Shanghai Ranking
  {
    name: "Deakin University",
    country: "Australia",
    focus: "Nutrition, sprint protocols, recovery",
    rank: 1,
  },
  {
    name: "University of Southern Denmark",
    country: "Denmark",
    focus: "Plyometrics, isometrics, twitch research",
    rank: 2,
  },
  {
    name: "Norwegian School of Sport Sciences",
    country: "Norway",
    focus: "Elite performance, psychology",
    rank: 3,
  },
  {
    name: "University of Verona",
    country: "Italy",
    focus: "High-altitude training, endurance",
    rank: 4,
  },
  {
    name: "University of Copenhagen",
    country: "Denmark",
    focus: "Sports nutrition, supplements",
    rank: 5,
  },
  {
    name: "Victoria University Melbourne",
    country: "Australia",
    focus: "Flag football conditioning",
    rank: 6,
  },
  {
    name: "Vrije Universiteit Amsterdam",
    country: "Netherlands",
    focus: "Motor control, mental training",
    rank: 7,
  },
  {
    name: "Norwegian University of Science and Technology",
    country: "Norway",
    focus: "Sprint mechanics",
    rank: 8,
  },
  {
    name: "KU Leuven",
    country: "Belgium",
    focus: "Kinesiology, injury prevention",
    rank: 9,
  },
  {
    name: "University of Bath",
    country: "UK",
    focus: "Plyometrics, recovery protocols",
    rank: 10,
  },
  // Additional key institutions
  {
    name: "Australian Institute of Sport",
    country: "Australia",
    focus: "High performance, ABCD framework",
    rank: null,
  },
  {
    name: "United States Olympic Committee",
    country: "USA",
    focus: "Olympic athlete development",
    rank: null,
  },
  {
    name: "English Institute of Sport",
    country: "UK",
    focus: "Elite athlete support",
    rank: null,
  },
  {
    name: "National Strength and Conditioning Association",
    country: "USA",
    focus: "Strength & conditioning",
    rank: null,
  },
  {
    name: "American College of Sports Medicine",
    country: "USA",
    focus: "Sports medicine research",
    rank: null,
  },
];

/**
 * Reconstruct abstract from OpenAlex inverted index format
 */
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) {
    return null;
  }

  const words = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words[pos] = word;
    }
  }

  return words.filter((w) => w).join(" ");
}

// =============================================================================
// RELEVANCE SCORING
// =============================================================================

/**
 * Calculate relevance score for flag football application
 */
function calculateRelevanceScore(article) {
  let score = 0.5; // Base score

  const relevantTerms = [
    "flag football",
    "football",
    "sprint",
    "agility",
    "plyometric",
    "recovery",
    "nutrition",
    "athlete",
    "training",
    "performance",
    "speed",
    "power",
    "strength",
    "conditioning",
    "muscle",
    "acceleration",
    "change of direction",
    "reactive",
    "explosive",
  ];

  const highRelevanceTerms = [
    "flag football",
    "sprint training",
    "agility training",
    "plyometric training",
    "athlete performance",
    "sports nutrition",
    "recovery protocol",
  ];

  const textToSearch =
    `${article.title || ""} ${article.abstract || ""} ${(article.keywords || []).join(" ")}`.toLowerCase();

  // Check for relevant terms
  for (const term of relevantTerms) {
    if (textToSearch.includes(term.toLowerCase())) {
      score += 0.03;
    }
  }

  // Bonus for high relevance terms
  for (const term of highRelevanceTerms) {
    if (textToSearch.includes(term.toLowerCase())) {
      score += 0.08;
    }
  }

  // Bonus for open access
  if (article.is_open_access) {
    score += 0.05;
  }

  // Bonus for recent publications (last 5 years)
  const currentYear = new Date().getFullYear();
  if (article.publication_year && article.publication_year >= currentYear - 5) {
    score += 0.05;
  }

  // Cap at 1.0
  return Math.min(score, 1.0);
}

/**
 * Determine topics based on article content
 */
function determineTopics(article) {
  const topics = [];
  const textToSearch =
    `${article.title || ""} ${article.abstract || ""} ${(article.keywords || []).join(" ")}`.toLowerCase();

  const topicKeywords = {
    sprinting: ["sprint", "sprinting", "acceleration", "velocity", "speed"],
    plyometrics: [
      "plyometric",
      "jump",
      "reactive strength",
      "ssc",
      "stretch-shortening",
    ],
    isometrics: ["isometric", "static contraction", "rfd", "rate of force"],
    agility: ["agility", "change of direction", "cod", "cutting"],
    recovery: ["recovery", "regeneration", "fatigue", "overtraining"],
    sleep: ["sleep", "circadian", "rest", "sleep quality"],
    muscle_fiber: [
      "muscle fiber",
      "fiber type",
      "fast twitch",
      "slow twitch",
      "type ii",
    ],
    sports_psychology: [
      "psychology",
      "mental",
      "motivation",
      "anxiety",
      "confidence",
    ],
    sports_nutrition: [
      "nutrition",
      "diet",
      "protein",
      "carbohydrate",
      "hydration",
    ],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    for (const keyword of keywords) {
      if (textToSearch.includes(keyword)) {
        if (!topics.includes(topic)) {
          topics.push(topic);
        }
        break;
      }
    }
  }

  return topics;
}

/**
 * Determine sports relevance
 */
function determineSports(article) {
  const sports = [];
  const textToSearch =
    `${article.title || ""} ${article.abstract || ""} ${(article.keywords || []).join(" ")}`.toLowerCase();

  const sportKeywords = {
    flag_football: ["flag football", "non-contact football"],
    football: ["football", "american football", "gridiron"],
    track: ["track", "athletics", "sprinter"],
    basketball: ["basketball"],
    soccer: ["soccer", "football players"],
    general: ["athlete", "sport", "training"],
  };

  for (const [sport, keywords] of Object.entries(sportKeywords)) {
    for (const keyword of keywords) {
      if (textToSearch.includes(keyword)) {
        if (!sports.includes(sport)) {
          sports.push(sport);
        }
        break;
      }
    }
  }

  // Default to general if no specific sport found
  if (sports.length === 0) {
    sports.push("general");
  }

  return sports;
}

// =============================================================================
// MAIN SYNC FUNCTION
// =============================================================================

/**
 * Sync research from all sources for a given topic
 */
async function syncResearchForTopic(topic, _supabase) {
  console.log(`Syncing research for topic: ${topic.topic_name}`);

  const allArticles = [];

  // Search PubMed
  if (topic.pubmed_query) {
    const pubmedResults = await searchPubMed(topic.pubmed_query, 10);
    allArticles.push(...pubmedResults);
    // Rate limiting - wait 400ms between API calls
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  // Search Europe PMC
  if (topic.europe_pmc_query) {
    const europePmcResults = await searchEuropePMC(topic.europe_pmc_query, 10);
    allArticles.push(...europePmcResults);
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  // Search OpenAlex
  const openAlexQuery = topic.keywords?.join(" ") || topic.topic_name;
  const openAlexResults = await searchOpenAlex(openAlexQuery, 10);
  allArticles.push(...openAlexResults);

  // For AIS-related topics, also search by institution
  if (
    topic.keywords?.includes("AIS") ||
    topic.keywords?.includes("Australian Institute of Sport")
  ) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const aisResults = await searchOpenAlexByInstitution(
      "Australian Institute of Sport",
      topic.topic_name.replace("_", " "),
      5,
    );
    allArticles.push(...aisResults);
  }

  // Process and enrich articles
  const processedArticles = allArticles.map((article) => ({
    ...article,
    topics: determineTopics(article),
    sports: determineSports(article),
    relevance_score: calculateRelevanceScore(article),
  }));

  return processedArticles;
}

/**
 * Sync research from top-ranked institutions
 */
async function syncFromTopInstitutions(topic = null) {
  const startTime = Date.now();
  const supabase = getSupabaseAdmin();

  console.log("Syncing research from top institutions...");

  // Get top institutions from database
  const { data: institutions, error: instError } = await supabase
    .from("research_institutions")
    .select("*")
    .eq("is_active", true)
    .order("priority_score", { ascending: false })
    .limit(10);

  if (instError || !institutions) {
    throw new Error(`Failed to fetch institutions: ${instError?.message}`);
  }

  let totalAdded = 0;
  let totalFailed = 0;
  const errors = [];

  for (const institution of institutions) {
    try {
      const searchName =
        institution.openalex_search_name || institution.institution_name;
      const searchTopic =
        topic || institution.focus_areas?.[0]?.replace("_", " ") || "training";

      console.log(`Searching ${searchName} for: ${searchTopic}`);

      const articles = await searchOpenAlexByInstitution(
        searchName,
        searchTopic,
        5,
      );

      for (const article of articles) {
        try {
          const enrichedArticle = {
            ...article,
            topics: determineTopics(article),
            sports: determineSports(article),
            relevance_score: calculateRelevanceScore(article),
          };

          const { error } = await supabase
            .from("research_studies")
            .upsert(enrichedArticle, {
              onConflict: "source,external_id",
              ignoreDuplicates: false,
            });

          if (error) {
            console.error(`Error upserting article: ${error.message}`);
            totalFailed++;
          } else {
            totalAdded++;
          }
        } catch (_e) {
          totalFailed++;
        }
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (e) {
      console.error(
        `Error syncing from ${institution.institution_name}: ${e.message}`,
      );
      errors.push({
        institution: institution.institution_name,
        error: e.message,
      });
    }
  }

  const duration = Date.now() - startTime;

  // Log sync result
  await supabase.from("sync_logs").insert({
    source: "top_institutions",
    result: totalFailed === 0 ? "success" : "partial",
    severity: totalFailed === 0 ? "info" : "warning",
    records_added: totalAdded,
    records_failed: totalFailed,
    duration_ms: duration,
    metadata: {
      institutions_synced: institutions.length,
      topic,
      errors,
    },
  });

  return {
    success: true,
    message: `Synced research from ${institutions.length} top institutions`,
    stats: {
      institutions_synced: institutions.length,
      articles_added: totalAdded,
      articles_failed: totalFailed,
      duration_ms: duration,
    },
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Get research from top institutions for a specific topic
 */
async function getTopInstitutionResearch(topic, limitPerInstitution = 5) {
  const supabase = getSupabaseAdmin();

  // Get top institutions
  const { data: institutions, error: instError } = await supabase
    .from("research_institutions")
    .select(
      "institution_name, short_name, openalex_search_name, country, focus_areas, shanghai_rank",
    )
    .eq("is_active", true)
    .order("priority_score", { ascending: false })
    .limit(5);

  if (instError || !institutions) {
    throw new Error(`Failed to fetch institutions: ${instError?.message}`);
  }

  const results = [];

  for (const institution of institutions) {
    const searchName =
      institution.openalex_search_name || institution.institution_name;
    const articles = await searchOpenAlexByInstitution(
      searchName,
      topic,
      limitPerInstitution,
    );

    results.push({
      institution: {
        name: institution.institution_name,
        shortName: institution.short_name,
        country: institution.country,
        rank: institution.shanghai_rank,
      },
      articles: articles.map((a) => ({
        ...a,
        relevance_score: calculateRelevanceScore(a),
      })),
    });

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return {
    topic,
    institutions: results,
    total_articles: results.reduce((sum, r) => sum + r.articles.length, 0),
  };
}

/**
 * Main sync function - syncs all research topics
 */
async function syncAllResearch() {
  const startTime = Date.now();
  const supabase = getSupabaseAdmin();

  console.log("Starting research sync...");

  // Get all active research topics
  const { data: topics, error: topicsError } = await supabase
    .from("research_topics")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (topicsError) {
    throw new Error(`Failed to fetch topics: ${topicsError.message}`);
  }

  let totalAdded = 0;
  const totalUpdated = 0;
  let totalFailed = 0;
  const errors = [];

  for (const topic of topics) {
    try {
      const articles = await syncResearchForTopic(topic, supabase);

      for (const article of articles) {
        try {
          // Upsert article
          const { error } = await supabase
            .from("research_studies")
            .upsert(article, {
              onConflict: "source,external_id",
              ignoreDuplicates: false,
            });

          if (error) {
            console.error(`Error upserting article: ${error.message}`);
            totalFailed++;
          } else {
            totalAdded++;
          }
        } catch (e) {
          console.error(`Error processing article: ${e.message}`);
          totalFailed++;
        }
      }

      // Rate limiting between topics
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (e) {
      console.error(`Error syncing topic ${topic.topic_name}: ${e.message}`);
      errors.push({ topic: topic.topic_name, error: e.message });
    }
  }

  const duration = Date.now() - startTime;

  // Log sync result
  await supabase.from("sync_logs").insert({
    source: "research_apis",
    result: totalFailed === 0 ? "success" : "partial",
    severity: totalFailed === 0 ? "info" : "warning",
    records_added: totalAdded,
    records_updated: totalUpdated,
    records_failed: totalFailed,
    duration_ms: duration,
    metadata: {
      topics_synced: topics.length,
      errors,
    },
  });

  return {
    success: true,
    message: `Research sync completed`,
    stats: {
      topics_synced: topics.length,
      articles_added: totalAdded,
      articles_failed: totalFailed,
      duration_ms: duration,
    },
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Search research by query
 */
async function searchResearch(query, options = {}) {
  const supabase = getSupabaseAdmin();

  const {
    topics = [],
    sports = [],
    source = null,
    limit = 20,
    offset = 0,
    openAccessOnly = false,
  } = options;

  let queryBuilder = supabase
    .from("research_studies")
    .select("*")
    .eq("is_active", true)
    .order("relevance_score", { ascending: false })
    .order("publication_date", { ascending: false })
    .range(offset, offset + limit - 1);

  // Text search in title and abstract
  if (query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query}%,abstract.ilike.%${query}%`,
    );
  }

  // Filter by topics
  if (topics.length > 0) {
    queryBuilder = queryBuilder.overlaps("topics", topics);
  }

  // Filter by sports
  if (sports.length > 0) {
    queryBuilder = queryBuilder.overlaps("sports", sports);
  }

  // Filter by source
  if (source) {
    queryBuilder = queryBuilder.eq("source", source);
  }

  // Filter open access only
  if (openAccessOnly) {
    queryBuilder = queryBuilder.eq("is_open_access", true);
  }

  const { data, error, count } = await queryBuilder;

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return {
    results: data,
    total: count,
    query,
    filters: { topics, sports, source, openAccessOnly },
  };
}

/**
 * Get featured/recommended research
 */
async function getFeaturedResearch(limit = 10) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("research_studies")
    .select("*")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("relevance_score", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch featured research: ${error.message}`);
  }

  return data;
}

/**
 * Get research topics with counts
 */
async function getResearchTopics() {
  const supabase = getSupabaseAdmin();

  const { data: topics, error } = await supabase
    .from("research_topics")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) {
    throw new Error(`Failed to fetch topics: ${error.message}`);
  }

  // Get counts for each topic
  const topicsWithCounts = await Promise.all(
    topics.map(async (topic) => {
      const { count } = await supabase
        .from("research_studies")
        .select("*", { count: "exact", head: true })
        .contains("topics", [topic.topic_name])
        .eq("is_active", true);

      return {
        ...topic,
        study_count: count || 0,
      };
    }),
  );

  return topicsWithCounts;
}

/**
 * Get training protocols
 */
async function getTrainingProtocols(category = null, athleteLevel = null) {
  const supabase = getSupabaseAdmin();

  let queryBuilder = supabase
    .from("training_protocols")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false });

  if (category) {
    queryBuilder = queryBuilder.eq("category", category);
  }

  if (athleteLevel) {
    queryBuilder = queryBuilder.or(
      `athlete_level.eq.${athleteLevel},athlete_level.eq.all`,
    );
  }

  const { data, error } = await queryBuilder;

  if (error) {
    throw new Error(`Failed to fetch protocols: ${error.message}`);
  }

  return data;
}

// =============================================================================
// NETLIFY HANDLER
// =============================================================================

const handler = async (event, context) =>
  event.httpMethod === "POST"
    ? baseHandler(event, context, {
        functionName: "research-sync",
        allowedMethods: ["GET", "POST"],
        rateLimitType: "UPDATE",
        requireAuth: true,
        handler: async (evt, _ctx, { requestId }) => {
          try {
            const path = evt.path
              .replace(/^\/api\/research\/?/, "")
              .replace(/^\.netlify\/functions\/research-sync\/?/, "");
            const segments = path.split("/").filter(Boolean);
            const endpoint = segments[0] || "search";

            if (endpoint === "sync" || endpoint === "sync-institutions") {
              const role = await getUserRole((await authenticateRequest(evt)).user.id);
              if (role !== "admin") {
                return createErrorResponse(
                  "Admin role required",
                  403,
                  "authorization_error",
                );
              }
            }

            return handleResearchRequest(evt);
          } catch (error) {
            console.error("Research sync error:", error);
            return createErrorResponse(
              "Internal server error",
              500,
              "server_error",
              requestId,
            );
          }
        },
      })
    : baseHandler(event, context, {
        functionName: "research-sync",
        allowedMethods: ["GET", "POST"],
        rateLimitType: "READ",
        requireAuth: false,
        handler: async (evt, _ctx, { requestId }) => {
          try {
            return handleResearchRequest(evt);
          } catch (error) {
            console.error("Research sync error:", error);
            return createErrorResponse(
              "Internal server error",
              500,
              "server_error",
              requestId,
            );
          }
        },
      });

async function handleResearchRequest(evt) {
      try {
        const path = evt.path
          .replace(/^\/api\/research\/?/, "")
          .replace(/^\.netlify\/functions\/research-sync\/?/, "");
    const segments = path.split("/").filter(Boolean);
    const endpoint = segments[0] || "search";

    const params = evt.queryStringParameters || {};
    let body = {};
    try {
      body = evt.body ? JSON.parse(evt.body) : {};
    } catch (_parseError) {
      return handleValidationError("Invalid JSON in request body");
    }

    let result;

    switch (endpoint) {
      case "sync":
        // Trigger full research sync (admin only)
        {
          const auth = await authenticateRequest(evt);
          if (!auth.success) {
            return auth.error;
          }
          const role = await getUserRole(auth.user.id);
          if (role !== "admin") {
            return createErrorResponse(
              "Admin role required",
              403,
              "authorization_error",
            );
          }
        }
        result = await syncAllResearch();
        break;

      case "search":
        // Search research studies
        result = await searchResearch(params.q || body.query, {
          topics: params.topics?.split(",") || body.topics,
          sports: params.sports?.split(",") || body.sports,
          source: params.source || body.source,
          limit: parseInt(params.limit) || 20,
          offset: parseInt(params.offset) || 0,
          openAccessOnly: params.openAccess === "true" || body.openAccessOnly,
        });
        break;

      case "featured":
        // Get featured research
        result = await getFeaturedResearch(parseInt(params.limit) || 10);
        break;

      case "topics":
        // Get research topics with counts
        result = await getResearchTopics();
        break;

      case "protocols":
        // Get training protocols
        result = await getTrainingProtocols(
          params.category || body.category,
          params.level || body.athleteLevel,
        );
        break;

      case "pubmed":
        // Direct PubMed search (for testing)
        result = await searchPubMed(
          params.q || body.query,
          parseInt(params.limit) || 10,
        );
        break;

      case "europepmc":
        // Direct Europe PMC search (for testing)
        result = await searchEuropePMC(
          params.q || body.query,
          parseInt(params.limit) || 10,
        );
        break;

      case "openalex":
        // Direct OpenAlex search (for testing)
        result = await searchOpenAlex(
          params.q || body.query,
          parseInt(params.limit) || 10,
        );
        break;

      case "institution": {
        // Search by institution (e.g., AIS, USOC, EIS)
        const institution =
          params.institution ||
          body.institution ||
          "Australian Institute of Sport";
        const topic = params.topic || body.topic || null;
        result = await searchOpenAlexByInstitution(
          institution,
          topic,
          parseInt(params.limit) || 20,
        );
        break;
      }

      case "ais": {
        // Shortcut for Australian Institute of Sport research
        const aisTopic = params.topic || body.topic || "training performance";
        result = await searchOpenAlexByInstitution(
          "Australian Institute of Sport",
          aisTopic,
          parseInt(params.limit) || 20,
        );
        break;
      }

      case "sync-institutions":
        // Sync research from top institutions (admin only)
        {
          const auth = await authenticateRequest(evt);
          if (!auth.success) {
            return auth.error;
          }
          const role = await getUserRole(auth.user.id);
          if (role !== "admin") {
            return createErrorResponse(
              "Admin role required",
              403,
              "authorization_error",
            );
          }
        }
        result = await syncFromTopInstitutions(params.topic || body.topic);
        break;

      case "top-research": {
        // Get research from top-ranked institutions by topic
        const topTopic = params.topic || body.topic || "sprint training";
        const topLimit = parseInt(params.limit) || 5;
        result = await getTopInstitutionResearch(topTopic, topLimit);
        break;
      }

      case "institutions": {
        // List available sports science institutions from database
        const supabaseInst = getSupabaseAdmin();
        const { data: dbInstitutions, error: instError } = await supabaseInst
          .from("research_institutions")
          .select("*")
          .eq("is_active", true)
          .order("shanghai_rank", { ascending: true, nullsFirst: false })
          .order("priority_score", { ascending: false });

        if (instError || !dbInstitutions || dbInstitutions.length === 0) {
          // Fallback to hardcoded list
          result = {
            institutions: SPORTS_SCIENCE_INSTITUTIONS,
            description:
              "Top sports science institutions (Shanghai Ranking 2024)",
            example:
              "/api/research/institution?institution=Deakin University&topic=sprint",
          };
        } else {
          result = {
            institutions: dbInstitutions.map((inst) => ({
              name: inst.institution_name,
              shortName: inst.short_name,
              department: inst.department,
              country: inst.country,
              city: inst.city,
              focusAreas: inst.focus_areas,
              specializations: inst.specializations,
              shanghaiRank: inst.shanghai_rank,
              relevance: inst.relevance_to_flag_football,
              searchName: inst.openalex_search_name,
            })),
            total: dbInstitutions.length,
            description:
              "Top sports science institutions (Shanghai Ranking 2024 + key research centers)",
            example:
              "/api/research/institution?institution=Deakin University&topic=sprint",
          };
        }
        break;
      }

      default:
        return createErrorResponse(`Unknown endpoint: ${endpoint}`, 404, "not_found");
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
      } catch (error) {
        console.error("Research sync error:", error);
        return createErrorResponse("Internal server error", 500, "server_error");
      }
}

// ESM exports for use in admin.js and other modules
export { syncAllResearch, searchResearch, getResearchTopics, getTrainingProtocols };

export const testHandler = handler;
export default createRuntimeV2Handler(handler);
