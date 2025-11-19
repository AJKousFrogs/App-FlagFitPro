/**
 * Global Search Service
 * Provides search functionality across the entire application
 * Searches training protocols, pages, exercises, and more
 */

import { MORNING_MOBILITY_ROUTINE } from "../data/shared-protocols.js";

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

  // Score each item based on relevance
  for (const item of SEARCHABLE_CONTENT) {
    let score = 0;
    let matchedKeywords = [];

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

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  // Format results for display
  return results.map((result) => ({
    label: result.label,
    value: result.value,
    type: result.type,
    url: result.url,
    description: result.description,
    category: result.category,
  }));
}

// Export default function for compatibility
export default performGlobalSearch;

