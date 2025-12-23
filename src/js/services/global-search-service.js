/**
 * Global Search Service
 * Provides search functionality across the entire application
 * Searches training protocols, pages, exercises, players, and more
 */

import { MORNING_MOBILITY_ROUTINE } from "../data/shared-protocols.js";
import { logger } from "../../logger.js";

// Dynamic import for team data and API (to avoid circular dependencies)
let getAllPlayers = null;
let apiClient = null;
let API_ENDPOINTS = null;

// Lazy load dependencies
async function loadDependencies() {
  if (!getAllPlayers) {
    try {
      const teamData = await import("../../real-team-data.js");
      getAllPlayers = teamData.getAllPlayers;
    } catch (error) {
      logger.warn("Failed to load team data:", error);
      getAllPlayers = () => [];
    }
  }

  if (!apiClient || !API_ENDPOINTS) {
    try {
      const apiConfig = await import("../../api-config.js");
      apiClient = apiConfig.apiClient;
      API_ENDPOINTS = apiConfig.API_ENDPOINTS;
    } catch (error) {
      logger.warn("Failed to load API config:", error);
    }
  }
}

// Cache for players data
let playersCache = null;
let playersCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Search history management
const SEARCH_HISTORY_KEY = "flagfit_search_history";
const MAX_HISTORY_ITEMS = 10;

/**
 * Get search history from localStorage
 * @returns {Array<string>} Array of recent search queries
 */
function getSearchHistory() {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    logger.warn("Failed to load search history:", error);
    return [];
  }
}

/**
 * Save search query to history
 * @param {string} query - Search query to save
 */
function saveToHistory(query) {
  if (!query || !query.trim()) {
    return;
  }

  try {
    const history = getSearchHistory();
    const normalizedQuery = query.trim().toLowerCase();

    // Remove duplicates and add to front
    const filtered = history.filter((q) => q.toLowerCase() !== normalizedQuery);
    filtered.unshift(normalizedQuery);

    // Limit to max items
    const limited = filtered.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limited));
  } catch (error) {
    logger.warn("Failed to save search history:", error);
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (error) {
    logger.warn("Failed to clear search history:", error);
  }
}

/**
 * Get search history (exported for UI)
 * @returns {Array<string>} Recent search queries
 */
export function getRecentSearches() {
  return getSearchHistory();
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) {
    return len2;
  }
  if (len2 === 0) {
    return len1;
  }

  const matrix = Array(len2 + 1)
    .fill(null)
    .map(() => Array(len1 + 1).fill(null));

  for (let i = 0; i <= len1; i++) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= len2; j++) {
    for (let i = 1; i <= len1; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + cost, // substitution
      );
    }
  }

  return matrix[len2][len1];
}

/**
 * Calculate similarity score between two strings (0-1)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} Similarity score (higher is more similar)
 */
function calculateSimilarity(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) {
    return 1;
  }

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Check if query matches text with fuzzy matching
 * @param {string} text - Text to search in
 * @param {string} query - Search query
 * @param {number} threshold - Minimum similarity threshold (0-1)
 * @returns {Object} Match result with score and matched text
 */
function fuzzyMatch(text, query, threshold = 0.7) {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);

  // Exact match
  if (normalizedText === normalizedQuery) {
    return { match: true, score: 1.0, matchedText: text };
  }

  // Contains match
  if (normalizedText.includes(normalizedQuery)) {
    return { match: true, score: 0.9, matchedText: text };
  }

  // Word-by-word matching
  const textWords = normalizedText.split(/\s+/);
  const queryWords = normalizedQuery.split(/\s+/);
  let bestScore = 0;
  const matchedWords = [];

  for (const queryWord of queryWords) {
    for (const textWord of textWords) {
      const similarity = calculateSimilarity(textWord, queryWord);
      if (similarity >= threshold) {
        bestScore = Math.max(bestScore, similarity);
        matchedWords.push(textWord);
      }
    }
  }

  if (bestScore >= threshold) {
    return { match: true, score: bestScore, matchedText: text };
  }

  // Fuzzy substring matching
  if (normalizedText.length >= normalizedQuery.length) {
    for (let i = 0; i <= normalizedText.length - normalizedQuery.length; i++) {
      const substring = normalizedText.substring(i, i + normalizedQuery.length);
      const similarity = calculateSimilarity(substring, normalizedQuery);
      if (similarity >= threshold) {
        return { match: true, score: similarity, matchedText: text };
      }
    }
  }

  return { match: false, score: 0, matchedText: null };
}

/**
 * Parse search query for operators
 * @param {string} query - Raw search query
 * @returns {Object} Parsed query with operators
 */
function parseQuery(query) {
  const trimmed = query.trim();
  const result = {
    original: query,
    terms: [],
    exactPhrases: [],
    excludedTerms: [],
    hasOperators: false,
  };

  // Extract exact phrases (quoted strings)
  const exactPhraseRegex = /"([^"]+)"/g;
  let match;
  while ((match = exactPhraseRegex.exec(trimmed)) !== null) {
    result.exactPhrases.push(match[1].trim());
    result.hasOperators = true;
  }

  // Remove exact phrases from query for further processing
  const processedQuery = trimmed.replace(exactPhraseRegex, "");

  // Extract excluded terms (prefixed with -)
  const words = processedQuery.split(/\s+/);
  for (const word of words) {
    if (word.startsWith("-") && word.length > 1) {
      result.excludedTerms.push(word.substring(1).trim());
      result.hasOperators = true;
    } else if (word.trim()) {
      result.terms.push(word.trim());
    }
  }

  return result;
}

/**
 * Highlight matched terms in text
 * @param {string} text - Text to highlight
 * @param {string|Array<string>} query - Search query or array of terms
 * @returns {string} HTML with highlighted terms
 */
export function highlightMatches(text, query) {
  if (!text || !query) {
    return text;
  }

  const terms = Array.isArray(query) ? query : [query];
  let highlighted = text;

  for (const term of terms) {
    if (!term || !term.trim()) {
      continue;
    }

    const normalizedTerm = normalizeText(term);
    const regex = new RegExp(
      `(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );

    // Find matches and highlight them
    highlighted = highlighted.replace(regex, (match) => {
      // Check if already inside a highlight tag
      if (highlighted.indexOf(`<mark>${match}</mark>`) !== -1) {
        return match;
      }
      return `<mark class="search-highlight">${match}</mark>`;
    });
  }

  return highlighted;
}

// Searchable content database
const SEARCHABLE_CONTENT = [
  // Training Protocols
  {
    label: "Morning Mobility Routine",
    keywords: [
      "morning routine",
      "morning mobility",
      "mobility routine",
      "daily mobility",
      "morning",
      "mobility",
    ],
    type: "protocol",
    url: "training.html#schedule",
    description: "15-minute daily mobility routine with day-specific videos",
    category: "Training Protocol",
  },
  {
    label: "Universal Warm-Up",
    keywords: [
      "warm up",
      "warmup",
      "pre-workout",
      "activation",
      "universal warm",
    ],
    type: "protocol",
    url: "training.html#schedule",
    description: "15-20 minute comprehensive warm-up protocol",
    category: "Training Protocol",
  },
  {
    label: "Sunday Recovery Protocol",
    keywords: ["recovery", "sunday recovery", "rest day", "recovery day"],
    type: "protocol",
    url: "training.html#schedule",
    description: "Complete weekly recovery routine",
    category: "Training Protocol",
  },

  // Pages
  {
    label: "Training Schedule",
    keywords: [
      "training schedule",
      "schedule",
      "workout schedule",
      "training plan",
    ],
    type: "page",
    url: "training.html#schedule",
    description: "View and manage your training schedule",
    category: "Page",
  },
  {
    label: "Training",
    keywords: ["training", "workouts", "exercises", "workout"],
    type: "page",
    url: "training.html",
    description: "Training hub with workouts, schedule, programs, and videos",
    category: "Page",
  },
  {
    label: "Exercise Library",
    keywords: ["exercise library", "exercises", "exercise database", "library"],
    type: "page",
    url: "exercise-library.html",
    description: "Browse exercise library",
    category: "Page",
  },
  {
    label: "Dashboard",
    keywords: ["dashboard", "home", "main"],
    type: "page",
    url: "dashboard.html",
    description: "Main dashboard",
    category: "Page",
  },
  {
    label: "Performance Tracking",
    keywords: ["performance", "tracking", "stats", "statistics", "metrics"],
    type: "page",
    url: "performance-tracking.html",
    description: "Track your performance metrics",
    category: "Page",
  },
  {
    label: "Roster",
    keywords: ["roster", "players", "team", "team roster"],
    type: "page",
    url: "roster.html",
    description: "Manage team roster",
    category: "Page",
  },
  {
    label: "Analytics",
    keywords: ["analytics", "data", "insights", "reports"],
    type: "page",
    url: "analytics.html",
    description: "View analytics and insights",
    category: "Page",
  },
  {
    label: "Community",
    keywords: ["community", "social", "discussion"],
    type: "page",
    url: "community.html",
    description: "Community features",
    category: "Page",
  },
  {
    label: "AI Training Scheduler",
    keywords: ["ai scheduler", "ai training", "scheduler", "ai"],
    type: "page",
    url: "ai-training-scheduler.html",
    description: "AI-powered training schedule generator",
    category: "Page",
  },
];

/**
 * Load players data from API or fallback to local data
 * @returns {Promise<Array>} Array of players
 */
async function loadPlayers() {
  const now = Date.now();

  // Return cached data if still valid
  if (playersCache && now - playersCacheTime < CACHE_DURATION) {
    return playersCache;
  }

  // Load dependencies if needed
  await loadDependencies();

  // Try to fetch from API first (if available)
  if (apiClient) {
    // Try multiple possible roster endpoints
    const possibleEndpoints = [
      "/api/roster/players",
      "/api/coach/team",
      "/roster",
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        const response = await apiClient.get(endpoint);
        const players =
          response?.data?.players ||
          response?.data ||
          response?.players ||
          response ||
          [];

        if (Array.isArray(players) && players.length > 0) {
          playersCache = players;
          playersCacheTime = now;
          return players;
        }
      } catch (error) {
        // Try next endpoint
        continue;
      }
    }
  }

  // Fallback to local team data
  if (getAllPlayers) {
    try {
      const localPlayers = getAllPlayers();
      if (localPlayers && localPlayers.length > 0) {
        playersCache = localPlayers;
        playersCacheTime = now;
        return localPlayers;
      }
    } catch (error) {
      logger.warn("Failed to load local players data:", error);
    }
  }

  return [];
}

/**
 * Normalize text by removing diacritics for better search matching
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeText(text) {
  if (!text) {
    return "";
  }
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .trim();
}

/**
 * Search players by name, jersey, position, etc. with fuzzy matching
 * @param {string} query - Search query
 * @param {Array} players - Array of player objects
 * @param {Object} parsedQuery - Parsed query object with operators
 * @returns {Array} Array of search results
 */
function searchPlayers(query, players, parsedQuery = null) {
  if (!players || players.length === 0) {
    return [];
  }

  if (!parsedQuery) {
    parsedQuery = parseQuery(query);
  }

  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 0);
  const results = [];
  const fuzzyThreshold = 0.75; // Threshold for fuzzy matching

  for (const player of players) {
    let score = 0;
    const matchedFields = [];
    const matchedTexts = [];

    // Get player name (handle different formats)
    const playerNameRaw =
      player.name ||
      `${player.firstName || ""} ${player.lastName || ""}`.trim();
    const playerName = normalizeText(playerNameRaw);
    const fullName = playerName;
    const firstName = normalizeText(player.firstName || "");
    const lastName = normalizeText(player.lastName || "");

    // Check excluded terms first
    let shouldExclude = false;
    for (const excludedTerm of parsedQuery.excludedTerms) {
      const normalizedExcluded = normalizeText(excludedTerm);
      if (
        playerName.includes(normalizedExcluded) ||
        firstName.includes(normalizedExcluded) ||
        lastName.includes(normalizedExcluded)
      ) {
        shouldExclude = true;
        break;
      }
    }
    if (shouldExclude) {
      continue;
    }

    // Check exact phrases
    let exactPhraseMatch = false;
    for (const phrase of parsedQuery.exactPhrases) {
      const normalizedPhrase = normalizeText(phrase);
      if (playerName.includes(normalizedPhrase)) {
        score += 110; // Higher than exact match
        matchedFields.push("name");
        matchedTexts.push(phrase);
        exactPhraseMatch = true;
        break;
      }
    }

    if (!exactPhraseMatch) {
      // Exact name match (highest priority)
      if (playerName === normalizedQuery || fullName === normalizedQuery) {
        score += 100;
        matchedFields.push("name");
        matchedTexts.push(query);
      }
      // Name contains query
      else if (
        playerName.includes(normalizedQuery) ||
        fullName.includes(normalizedQuery)
      ) {
        score += 80;
        matchedFields.push("name");
        matchedTexts.push(query);
      }
      // First or last name match
      else if (firstName === normalizedQuery || lastName === normalizedQuery) {
        score += 70;
        matchedFields.push("name");
        matchedTexts.push(query);
      }
      // Fuzzy matching for names
      else {
        const nameMatch = fuzzyMatch(playerNameRaw, query, fuzzyThreshold);
        if (nameMatch.match) {
          score += Math.round(nameMatch.score * 60); // Scale fuzzy score
          matchedFields.push("name");
          matchedTexts.push(query);
        }
        // Word-by-word matching for names
        else {
          for (const word of queryWords) {
            const wordMatch = fuzzyMatch(playerNameRaw, word, fuzzyThreshold);
            if (wordMatch.match) {
              score += Math.round(wordMatch.score * 30);
              if (!matchedFields.includes("name")) {
                matchedFields.push("name");
              }
              matchedTexts.push(word);
            }
          }
        }
      }
    }

    // Jersey number match
    const jersey = String(
      player.jersey || player.jerseyNumber || "",
    ).toLowerCase();
    if (jersey === normalizedQuery) {
      score += 60;
      matchedFields.push("jersey");
      matchedTexts.push(query);
    } else if (jersey.includes(normalizedQuery)) {
      score += 40;
      matchedFields.push("jersey");
      matchedTexts.push(query);
    } else if (normalizedQuery.length >= 2) {
      // Fuzzy match for jersey if query is numeric
      if (/^\d+$/.test(normalizedQuery) && jersey) {
        const jerseyMatch = fuzzyMatch(jersey, normalizedQuery, 0.8);
        if (jerseyMatch.match) {
          score += Math.round(jerseyMatch.score * 40);
          matchedFields.push("jersey");
          matchedTexts.push(query);
        }
      }
    }

    // Position match with fuzzy matching
    const position = (player.position || "").toLowerCase();
    if (position === normalizedQuery) {
      score += 50;
      matchedFields.push("position");
      matchedTexts.push(query);
    } else if (position.includes(normalizedQuery)) {
      score += 30;
      matchedFields.push("position");
      matchedTexts.push(query);
    } else {
      const positionMatch = fuzzyMatch(
        player.position || "",
        query,
        fuzzyThreshold,
      );
      if (positionMatch.match) {
        score += Math.round(positionMatch.score * 30);
        matchedFields.push("position");
        matchedTexts.push(query);
      }
    }

    // Country match with fuzzy matching
    const country = (player.country || "").toLowerCase();
    if (country.includes(normalizedQuery)) {
      score += 20;
      matchedFields.push("country");
      matchedTexts.push(query);
    } else {
      const countryMatch = fuzzyMatch(
        player.country || "",
        query,
        fuzzyThreshold,
      );
      if (countryMatch.match) {
        score += Math.round(countryMatch.score * 15);
        matchedFields.push("country");
        matchedTexts.push(query);
      }
    }

    // If we have a match, add to results
    if (score > 0) {
      results.push({
        label:
          player.name ||
          `${player.firstName || ""} ${player.lastName || ""}`.trim() ||
          `Player #${player.jersey || player.jerseyNumber}`,
        value:
          player.name ||
          `${player.firstName || ""} ${player.lastName || ""}`.trim(),
        type: "player",
        url: `/roster.html#player-${player.id || player.jersey || player.jerseyNumber}`,
        description: `${player.position || "Player"}${player.jersey ? ` • #${player.jersey}` : ""}${player.country ? ` • ${player.country}` : ""}`,
        category: "Player",
        score: score,
        matchedFields: matchedFields,
        matchedTexts: matchedTexts,
        player: player,
      });
    }
  }

  return results;
}

/**
 * Perform global search across all searchable content
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @param {boolean} options.saveToHistory - Whether to save query to history (default: true)
 * @returns {Promise<Array>} Array of search results
 */
export async function performGlobalSearch(query, options = {}) {
  const { saveToHistory: shouldSaveToHistory = true } = options;

  if (!query || !query.trim()) {
    return [];
  }

  // Save to history
  if (shouldSaveToHistory) {
    saveToHistory(query);
  }

  // Parse query for operators
  const parsedQuery = parseQuery(query);
  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 0);
  const fuzzyThreshold = 0.75;

  const results = [];
  const seen = new Set(); // Prevent duplicates

  // Search static content (pages, protocols, etc.)
  for (const item of SEARCHABLE_CONTENT) {
    let score = 0;
    const matchedKeywords = [];
    const matchedTexts = [];

    // Check excluded terms
    let shouldExclude = false;
    for (const excludedTerm of parsedQuery.excludedTerms) {
      const normalizedExcluded = normalizeText(excludedTerm);
      if (
        normalizeText(item.label).includes(normalizedExcluded) ||
        item.keywords.some((k) =>
          normalizeText(k).includes(normalizedExcluded),
        ) ||
        (item.description &&
          normalizeText(item.description).includes(normalizedExcluded))
      ) {
        shouldExclude = true;
        break;
      }
    }
    if (shouldExclude) {
      continue;
    }

    // Check exact phrases
    let exactPhraseMatch = false;
    for (const phrase of parsedQuery.exactPhrases) {
      const normalizedPhrase = normalizeText(phrase);
      if (normalizeText(item.label).includes(normalizedPhrase)) {
        score += 110;
        matchedKeywords.push("label");
        matchedTexts.push(phrase);
        exactPhraseMatch = true;
        break;
      }
    }

    if (!exactPhraseMatch) {
      // Check if query matches label exactly (highest priority)
      const labelMatch = fuzzyMatch(item.label, query, fuzzyThreshold);
      if (labelMatch.match) {
        score += Math.round(labelMatch.score * 100);
        matchedKeywords.push("label");
        matchedTexts.push(query);
      }

      // Check keyword matches with fuzzy matching
      for (const keyword of item.keywords) {
        const keywordLower = keyword.toLowerCase();

        // Exact keyword match
        if (keywordLower === normalizedQuery) {
          score += 50;
          matchedKeywords.push(keyword);
          matchedTexts.push(query);
        }
        // Keyword contains query
        else if (keywordLower.includes(normalizedQuery)) {
          score += 30;
          matchedKeywords.push(keyword);
          matchedTexts.push(query);
        }
        // Query contains keyword
        else if (normalizedQuery.includes(keywordLower)) {
          score += 20;
          matchedKeywords.push(keyword);
          matchedTexts.push(keyword);
        }
        // Fuzzy matching
        else {
          const keywordMatch = fuzzyMatch(keyword, query, fuzzyThreshold);
          if (keywordMatch.match) {
            score += Math.round(keywordMatch.score * 20);
            if (!matchedKeywords.includes(keyword)) {
              matchedKeywords.push(keyword);
            }
            matchedTexts.push(query);
          }
          // Word-by-word matching
          else {
            for (const word of queryWords) {
              const wordMatch = fuzzyMatch(keyword, word, fuzzyThreshold);
              if (wordMatch.match) {
                score += Math.round(wordMatch.score * 10);
                if (!matchedKeywords.includes(keyword)) {
                  matchedKeywords.push(keyword);
                }
                matchedTexts.push(word);
              }
            }
          }
        }
      }

      // Check description match with fuzzy matching
      if (item.description) {
        const descMatch = fuzzyMatch(item.description, query, fuzzyThreshold);
        if (descMatch.match) {
          score += Math.round(descMatch.score * 15);
          matchedTexts.push(query);
        }
      }
    }

    // If we have a match, add to results
    if (score > 0) {
      const resultKey = `${item.type}-${item.url}`;
      if (!seen.has(resultKey)) {
        seen.add(resultKey);
        results.push({
          label: item.label,
          value: item.label,
          type: item.type,
          url: item.url,
          description: item.description,
          category: item.category,
          score: score,
          matchedKeywords: matchedKeywords,
          matchedTexts: matchedTexts,
        });
      }
    }
  }

  // Search players (async)
  try {
    const players = await loadPlayers();
    const playerResults = searchPlayers(query, players, parsedQuery);
    results.push(...playerResults);
  } catch (error) {
    logger.warn("Error searching players:", error);
  }

  // Search knowledge base (async)
  try {
    const knowledgeResults = await searchKnowledgeBase(query);
    results.push(...knowledgeResults);
  } catch (error) {
    logger.warn("Error searching knowledge base:", error);
  }

  // Search tournaments (async)
  try {
    const tournamentResults = await searchTournaments(query, parsedQuery);
    results.push(...tournamentResults);
  } catch (error) {
    logger.warn("Error searching tournaments:", error);
  }

  // Search games (async)
  try {
    const gameResults = await searchGames(query, parsedQuery);
    results.push(...gameResults);
  } catch (error) {
    logger.warn("Error searching games:", error);
  }

  // Search community posts (async)
  try {
    const communityResults = await searchCommunityPosts(query, parsedQuery);
    results.push(...communityResults);
  } catch (error) {
    logger.warn("Error searching community posts:", error);
  }

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  // Limit results to top 20 for performance
  const limitedResults = results.slice(0, 20);

  // Format results for display with matched texts for highlighting
  return limitedResults.map((result) => ({
    label: result.label,
    value: result.value,
    type: result.type,
    url: result.url,
    description: result.description,
    category: result.category,
    player: result.player, // Include player data for potential use
    matchedTexts: result.matchedTexts || [query], // For highlighting
  }));
}

/**
 * Search knowledge base articles and entries
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of search results
 */
async function searchKnowledgeBase(query) {
  if (!apiClient || !API_ENDPOINTS) {
    await loadDependencies();
  }

  if (!apiClient || !API_ENDPOINTS?.knowledge) {
    return [];
  }

  try {
    const response = await apiClient.post(API_ENDPOINTS.knowledge.search, {
      query: query,
      limit: 5,
    });

    const entries = response?.data || [];
    return entries.map((entry) => ({
      label: entry.question || entry.topic || "Knowledge Entry",
      value: entry.question || entry.topic,
      type: "knowledge",
      url: `/knowledge.html?topic=${encodeURIComponent(entry.topic || "")}`,
      description: entry.answer?.substring(0, 100) || entry.description || "",
      category: "Knowledge Base",
      score: 40, // Medium priority
    }));
  } catch (error) {
    logger.debug("Knowledge base search failed:", error);
    return [];
  }
}

/**
 * Search tournaments
 * @param {string} query - Search query
 * @param {Object} parsedQuery - Parsed query object with operators
 * @returns {Promise<Array>} Array of search results
 */
async function searchTournaments(query, parsedQuery = null) {
  if (!apiClient || !API_ENDPOINTS) {
    await loadDependencies();
  }

  if (!apiClient || !API_ENDPOINTS?.tournaments) {
    return [];
  }

  if (!parsedQuery) {
    parsedQuery = parseQuery(query);
  }

  try {
    const response = await apiClient.get(API_ENDPOINTS.tournaments.list);
    const tournaments = response?.data || response || [];

    const normalizedQuery = normalizeText(query);
    const results = [];
    const fuzzyThreshold = 0.75;

    for (const tournament of tournaments) {
      const name = normalizeText(tournament.name || "");
      const location = normalizeText(tournament.location || "");
      const description = normalizeText(tournament.description || "");

      // Check excluded terms
      let shouldExclude = false;
      for (const excludedTerm of parsedQuery.excludedTerms) {
        const normalizedExcluded = normalizeText(excludedTerm);
        if (
          name.includes(normalizedExcluded) ||
          location.includes(normalizedExcluded) ||
          description.includes(normalizedExcluded)
        ) {
          shouldExclude = true;
          break;
        }
      }
      if (shouldExclude) {
        continue;
      }

      let score = 0;
      const matchedTexts = [];

      // Check exact phrases
      for (const phrase of parsedQuery.exactPhrases) {
        const normalizedPhrase = normalizeText(phrase);
        if (name.includes(normalizedPhrase)) {
          score += 70;
          matchedTexts.push(phrase);
          break;
        }
      }

      // Name matching with fuzzy
      const nameMatch = fuzzyMatch(
        tournament.name || "",
        query,
        fuzzyThreshold,
      );
      if (nameMatch.match) {
        score += Math.round(nameMatch.score * 60);
        matchedTexts.push(query);
      } else if (name.includes(normalizedQuery)) {
        score += 60;
        matchedTexts.push(query);
      } else if (name.includes(normalizedQuery.split(" ")[0])) {
        score += 40;
        matchedTexts.push(query);
      }

      // Location matching
      const locationMatch = fuzzyMatch(
        tournament.location || "",
        query,
        fuzzyThreshold,
      );
      if (locationMatch.match) {
        score += Math.round(locationMatch.score * 30);
        matchedTexts.push(query);
      } else if (location.includes(normalizedQuery)) {
        score += 30;
        matchedTexts.push(query);
      }

      // Description matching
      const descMatch = fuzzyMatch(
        tournament.description || "",
        query,
        fuzzyThreshold,
      );
      if (descMatch.match) {
        score += Math.round(descMatch.score * 20);
        matchedTexts.push(query);
      } else if (description.includes(normalizedQuery)) {
        score += 20;
        matchedTexts.push(query);
      }

      if (score > 0) {
        results.push({
          label: tournament.name || "Tournament",
          value: tournament.name,
          type: "tournament",
          url: `/tournaments.html?id=${tournament.id || ""}`,
          description: `${tournament.location || ""}${tournament.startDate ? ` • ${tournament.startDate}` : ""}`,
          category: "Tournament",
          score: score,
          matchedTexts: matchedTexts,
        });
      }
    }

    return results;
  } catch (error) {
    logger.debug("Tournament search failed:", error);
    return [];
  }
}

/**
 * Search games
 * @param {string} query - Search query
 * @param {Object} parsedQuery - Parsed query object with operators
 * @returns {Promise<Array>} Array of search results
 */
async function searchGames(query, parsedQuery = null) {
  if (!apiClient || !API_ENDPOINTS) {
    await loadDependencies();
  }

  if (!apiClient || !API_ENDPOINTS?.games) {
    return [];
  }

  if (!parsedQuery) {
    parsedQuery = parseQuery(query);
  }

  try {
    const response = await apiClient.get(API_ENDPOINTS.games.list);
    const games = response?.data || response || [];

    const normalizedQuery = normalizeText(query);
    const results = [];
    const fuzzyThreshold = 0.75;

    for (const game of games) {
      const opponent = normalizeText(
        game.opponent || game.awayTeam?.name || game.homeTeam?.name || "",
      );
      const location = normalizeText(game.location || "");
      const date = game.gameDate || game.date || "";

      // Check excluded terms
      let shouldExclude = false;
      for (const excludedTerm of parsedQuery.excludedTerms) {
        const normalizedExcluded = normalizeText(excludedTerm);
        if (
          opponent.includes(normalizedExcluded) ||
          location.includes(normalizedExcluded) ||
          (date && date.includes(normalizedExcluded))
        ) {
          shouldExclude = true;
          break;
        }
      }
      if (shouldExclude) {
        continue;
      }

      let score = 0;
      const matchedTexts = [];

      // Opponent matching with fuzzy
      const opponentMatch = fuzzyMatch(
        game.opponent || game.awayTeam?.name || game.homeTeam?.name || "",
        query,
        fuzzyThreshold,
      );
      if (opponentMatch.match) {
        score += Math.round(opponentMatch.score * 50);
        matchedTexts.push(query);
      } else if (opponent.includes(normalizedQuery)) {
        score += 50;
        matchedTexts.push(query);
      }

      // Location matching
      const locationMatch = fuzzyMatch(
        game.location || "",
        query,
        fuzzyThreshold,
      );
      if (locationMatch.match) {
        score += Math.round(locationMatch.score * 30);
        matchedTexts.push(query);
      } else if (location.includes(normalizedQuery)) {
        score += 30;
        matchedTexts.push(query);
      }

      // Date matching
      if (date) {
        if (date.includes(normalizedQuery)) {
          score += 20;
          matchedTexts.push(query);
        }
      }

      if (score > 0) {
        results.push({
          label: `Game vs ${game.opponent || game.awayTeam?.name || "Opponent"}`,
          value: game.opponent || game.awayTeam?.name || "Game",
          type: "game",
          url: `/game-tracker.html?gameId=${game.id || ""}`,
          description: `${date || ""}${location ? ` • ${location}` : ""}`,
          category: "Game",
          score: score,
          matchedTexts: matchedTexts,
        });
      }
    }

    return results;
  } catch (error) {
    logger.debug("Game search failed:", error);
    return [];
  }
}

/**
 * Search community posts
 * @param {string} query - Search query
 * @param {Object} parsedQuery - Parsed query object with operators
 * @returns {Promise<Array>} Array of search results
 */
async function searchCommunityPosts(query, parsedQuery = null) {
  if (!apiClient || !API_ENDPOINTS) {
    await loadDependencies();
  }

  if (!apiClient || !API_ENDPOINTS?.community) {
    return [];
  }

  if (!parsedQuery) {
    parsedQuery = parseQuery(query);
  }

  try {
    const response = await apiClient.get(API_ENDPOINTS.community.feed, {
      limit: 50,
    });
    const posts = response?.data || response || [];

    const normalizedQuery = normalizeText(query);
    const results = [];
    const fuzzyThreshold = 0.75;

    for (const post of posts) {
      const title = normalizeText(post.title || "");
      const content = normalizeText(post.content || "");

      // Check excluded terms
      let shouldExclude = false;
      for (const excludedTerm of parsedQuery.excludedTerms) {
        const normalizedExcluded = normalizeText(excludedTerm);
        if (
          title.includes(normalizedExcluded) ||
          content.includes(normalizedExcluded)
        ) {
          shouldExclude = true;
          break;
        }
      }
      if (shouldExclude) {
        continue;
      }

      let score = 0;
      const matchedTexts = [];

      // Check exact phrases
      for (const phrase of parsedQuery.exactPhrases) {
        const normalizedPhrase = normalizeText(phrase);
        if (title.includes(normalizedPhrase)) {
          score += 60;
          matchedTexts.push(phrase);
          break;
        }
      }

      // Title matching with fuzzy
      const titleMatch = fuzzyMatch(post.title || "", query, fuzzyThreshold);
      if (titleMatch.match) {
        score += Math.round(titleMatch.score * 50);
        matchedTexts.push(query);
      } else if (title.includes(normalizedQuery)) {
        score += 50;
        matchedTexts.push(query);
      } else if (title.includes(normalizedQuery.split(" ")[0])) {
        score += 30;
        matchedTexts.push(query);
      }

      // Content matching
      const contentMatch = fuzzyMatch(
        post.content || "",
        query,
        fuzzyThreshold,
      );
      if (contentMatch.match) {
        score += Math.round(contentMatch.score * 20);
        matchedTexts.push(query);
      } else if (content.includes(normalizedQuery)) {
        score += 20;
        matchedTexts.push(query);
      }

      if (score > 0) {
        results.push({
          label: post.title || "Community Post",
          value: post.title,
          type: "community",
          url: `/community.html?postId=${post.id || ""}`,
          description: `${post.author?.name || "User"} • ${content.substring(0, 60)}...`,
          category: "Community",
          score: score,
          matchedTexts: matchedTexts,
        });
      }
    }

    return results;
  } catch (error) {
    logger.debug("Community search failed:", error);
    return [];
  }
}

// Export default function for compatibility
export default performGlobalSearch;
