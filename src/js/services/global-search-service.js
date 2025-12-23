/**
 * Global Search Service
 * Provides search functionality across the entire application
 * Searches training protocols, pages, exercises, players, and more
 */

import { MORNING_MOBILITY_ROUTINE } from "../data/shared-protocols.js";

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
      console.warn("Failed to load team data:", error);
      getAllPlayers = () => [];
    }
  }

  if (!apiClient || !API_ENDPOINTS) {
    try {
      const apiConfig = await import("../../api-config.js");
      apiClient = apiConfig.apiClient;
      API_ENDPOINTS = apiConfig.API_ENDPOINTS;
    } catch (error) {
      console.warn("Failed to load API config:", error);
    }
  }
}

// Cache for players data
let playersCache = null;
let playersCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Searchable content database
const SEARCHABLE_CONTENT = [
  // Training Protocols
  {
    label: "Morning Mobility Routine",
    keywords: ["morning routine", "morning mobility", "mobility routine", "daily mobility", "morning", "mobility"],
    type: "protocol",
    url: "training.html#schedule",
    description: "15-minute daily mobility routine with day-specific videos",
    category: "Training Protocol",
  },
  {
    label: "Universal Warm-Up",
    keywords: ["warm up", "warmup", "pre-workout", "activation", "universal warm"],
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
    keywords: ["training schedule", "schedule", "workout schedule", "training plan"],
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
  if (playersCache && (now - playersCacheTime) < CACHE_DURATION) {
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
        const players = response?.data?.players || response?.data || response?.players || response || [];

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
      console.warn("Failed to load local players data:", error);
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
  if (!text) {return "";}
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .trim();
}

/**
 * Search players by name, jersey, position, etc.
 * @param {string} query - Search query
 * @param {Array} players - Array of player objects
 * @returns {Array} Array of search results
 */
function searchPlayers(query, players) {
  if (!players || players.length === 0) {return [];}

  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
  const results = [];

  for (const player of players) {
    let score = 0;
    const matchedFields = [];

    // Get player name (handle different formats)
    const playerNameRaw = player.name || `${player.firstName || ""} ${player.lastName || ""}`.trim();
    const playerName = normalizeText(playerNameRaw);
    const fullName = playerName;
    const firstName = normalizeText(player.firstName || "");
    const lastName = normalizeText(player.lastName || "");

    // Exact name match (highest priority)
    if (playerName === normalizedQuery || fullName === normalizedQuery) {
      score += 100;
      matchedFields.push("name");
    }
    // Name contains query
    else if (playerName.includes(normalizedQuery) || fullName.includes(normalizedQuery)) {
      score += 80;
      matchedFields.push("name");
    }
    // First or last name match
    else if (firstName === normalizedQuery || lastName === normalizedQuery) {
      score += 70;
      matchedFields.push("name");
    }
    // Word-by-word matching for names
    else {
      for (const word of queryWords) {
        if (firstName.includes(word) || lastName.includes(word) || playerName.includes(word)) {
          score += 30;
          if (!matchedFields.includes("name")) {
            matchedFields.push("name");
          }
        }
      }
    }

    // Jersey number match
    const jersey = String(player.jersey || player.jerseyNumber || "").toLowerCase();
    if (jersey === normalizedQuery) {
      score += 60;
      matchedFields.push("jersey");
    } else if (jersey.includes(normalizedQuery)) {
      score += 40;
      matchedFields.push("jersey");
    }

    // Position match
    const position = (player.position || "").toLowerCase();
    if (position === normalizedQuery) {
      score += 50;
      matchedFields.push("position");
    } else if (position.includes(normalizedQuery)) {
      score += 30;
      matchedFields.push("position");
    }

    // Country match
    const country = (player.country || "").toLowerCase();
    if (country.includes(normalizedQuery)) {
      score += 20;
      matchedFields.push("country");
    }

    // If we have a match, add to results
    if (score > 0) {
      results.push({
        label: player.name || `${player.firstName || ""} ${player.lastName || ""}`.trim() || `Player #${player.jersey || player.jerseyNumber}`,
        value: player.name || `${player.firstName || ""} ${player.lastName || ""}`.trim(),
        type: "player",
        url: `/roster.html#player-${player.id || player.jersey || player.jerseyNumber}`,
        description: `${player.position || "Player"}${player.jersey ? ` • #${player.jersey}` : ""}${player.country ? ` • ${player.country}` : ""}`,
        category: "Player",
        score: score,
        matchedFields: matchedFields,
        player: player,
      });
    }
  }

  return results;
}

/**
 * Perform global search across all searchable content
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of search results
 */
export async function performGlobalSearch(query) {
  if (!query || !query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const queryWords = normalizedQuery.split(/\s+/);

  const results = [];
  const seen = new Set(); // Prevent duplicates

  // Search static content (pages, protocols, etc.)
  for (const item of SEARCHABLE_CONTENT) {
    let score = 0;
    const matchedKeywords = [];

    // Check if query matches label exactly (highest priority)
    if (item.label.toLowerCase().includes(normalizedQuery)) {
      score += 100;
      matchedKeywords.push("label");
    }

    // Check keyword matches
    for (const keyword of item.keywords) {
      const keywordLower = keyword.toLowerCase();

      // Exact keyword match
      if (keywordLower === normalizedQuery) {
        score += 50;
        matchedKeywords.push(keyword);
      }
      // Keyword contains query
      else if (keywordLower.includes(normalizedQuery)) {
        score += 30;
        matchedKeywords.push(keyword);
      }
      // Query contains keyword
      else if (normalizedQuery.includes(keywordLower)) {
        score += 20;
        matchedKeywords.push(keyword);
      }
      // Word-by-word matching
      else {
        for (const word of queryWords) {
          if (keywordLower.includes(word) || word.includes(keywordLower)) {
            score += 10;
            if (!matchedKeywords.includes(keyword)) {
              matchedKeywords.push(keyword);
            }
          }
        }
      }
    }

    // Check description match
    if (item.description && item.description.toLowerCase().includes(normalizedQuery)) {
      score += 15;
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
        });
      }
    }
  }

  // Search players (async)
  try {
    const players = await loadPlayers();
    const playerResults = searchPlayers(query, players);
    results.push(...playerResults);
  } catch (error) {
    console.warn("Error searching players:", error);
  }

  // Search knowledge base (async)
  try {
    const knowledgeResults = await searchKnowledgeBase(query);
    results.push(...knowledgeResults);
  } catch (error) {
    console.warn("Error searching knowledge base:", error);
  }

  // Search tournaments (async)
  try {
    const tournamentResults = await searchTournaments(query);
    results.push(...tournamentResults);
  } catch (error) {
    console.warn("Error searching tournaments:", error);
  }

  // Search games (async)
  try {
    const gameResults = await searchGames(query);
    results.push(...gameResults);
  } catch (error) {
    console.warn("Error searching games:", error);
  }

  // Search community posts (async)
  try {
    const communityResults = await searchCommunityPosts(query);
    results.push(...communityResults);
  } catch (error) {
    console.warn("Error searching community posts:", error);
  }

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  // Limit results to top 20 for performance
  const limitedResults = results.slice(0, 20);

  // Format results for display
  return limitedResults.map((result) => ({
    label: result.label,
    value: result.value,
    type: result.type,
    url: result.url,
    description: result.description,
    category: result.category,
    player: result.player, // Include player data for potential use
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
    console.debug("Knowledge base search failed:", error);
    return [];
  }
}

/**
 * Search tournaments
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of search results
 */
async function searchTournaments(query) {
  if (!apiClient || !API_ENDPOINTS) {
    await loadDependencies();
  }

  if (!apiClient || !API_ENDPOINTS?.tournaments) {
    return [];
  }

  try {
    const response = await apiClient.get(API_ENDPOINTS.tournaments.list);
    const tournaments = response?.data || response || [];

    const normalizedQuery = normalizeText(query);
    const results = [];

    for (const tournament of tournaments) {
      const name = normalizeText(tournament.name || "");
      const location = normalizeText(tournament.location || "");
      const description = normalizeText(tournament.description || "");

      let score = 0;
      if (name.includes(normalizedQuery)) {
        score += 60;
      } else if (name.includes(normalizedQuery.split(" ")[0])) {
        score += 40;
      }
      if (location.includes(normalizedQuery)) {
        score += 30;
      }
      if (description.includes(normalizedQuery)) {
        score += 20;
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
        });
      }
    }

    return results;
  } catch (error) {
    console.debug("Tournament search failed:", error);
    return [];
  }
}

/**
 * Search games
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of search results
 */
async function searchGames(query) {
  if (!apiClient || !API_ENDPOINTS) {
    await loadDependencies();
  }

  if (!apiClient || !API_ENDPOINTS?.games) {
    return [];
  }

  try {
    const response = await apiClient.get(API_ENDPOINTS.games.list);
    const games = response?.data || response || [];

    const normalizedQuery = normalizeText(query);
    const results = [];

    for (const game of games) {
      const opponent = normalizeText(game.opponent || game.awayTeam?.name || game.homeTeam?.name || "");
      const location = normalizeText(game.location || "");
      const date = game.gameDate || game.date || "";

      let score = 0;
      if (opponent.includes(normalizedQuery)) {
        score += 50;
      }
      if (location.includes(normalizedQuery)) {
        score += 30;
      }
      if (date && date.includes(normalizedQuery)) {
        score += 20;
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
        });
      }
    }

    return results;
  } catch (error) {
    console.debug("Game search failed:", error);
    return [];
  }
}

/**
 * Search community posts
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of search results
 */
async function searchCommunityPosts(query) {
  if (!apiClient || !API_ENDPOINTS) {
    await loadDependencies();
  }

  if (!apiClient || !API_ENDPOINTS?.community) {
    return [];
  }

  try {
    const response = await apiClient.get(API_ENDPOINTS.community.feed, { limit: 50 });
    const posts = response?.data || response || [];

    const normalizedQuery = normalizeText(query);
    const results = [];

    for (const post of posts) {
      const title = normalizeText(post.title || "");
      const content = normalizeText(post.content || "");

      let score = 0;
      if (title.includes(normalizedQuery)) {
        score += 50;
      } else if (title.includes(normalizedQuery.split(" ")[0])) {
        score += 30;
      }
      if (content.includes(normalizedQuery)) {
        score += 20;
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
        });
      }
    }

    return results;
  } catch (error) {
    console.debug("Community search failed:", error);
    return [];
  }
}

// Export default function for compatibility
export default performGlobalSearch;

