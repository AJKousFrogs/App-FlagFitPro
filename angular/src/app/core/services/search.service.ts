/**
 * Global Search Service
 *
 * Provides unified search functionality across the application
 * Searches exercises, training programs, players, and content
 *
 * Features:
 * - Real-time search with debouncing
 * - Multi-entity search (exercises, programs, users, etc.)
 * - Parallel API calls for faster results
 * - Search result caching with TTL
 * - Request cancellation to prevent race conditions
 * - Recent searches history
 * - Search suggestions
 */

import { computed, inject, Injectable, OnDestroy, signal } from "@angular/core";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { TIMEOUTS, UI_LIMITS } from "../constants/app.constants";

export interface SearchResult {
  id: string;
  type: "exercise" | "program" | "player" | "team" | "video" | "article";
  title: string;
  subtitle?: string;
  description?: string;
  icon: string;
  route: string;
  relevance: number;
  /** Highlighted title with <mark> tags around matched text */
  highlightedTitle?: string;
  /** Highlighted subtitle with <mark> tags around matched text */
  highlightedSubtitle?: string;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  totalResults: number;
}

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

const CACHE_TTL_MS = TIMEOUTS.CACHE_TTL_DEFAULT;
const MAX_CACHE_SIZE = 50; // Maximum number of cached queries

@Injectable({
  providedIn: "root",
})
export class SearchService implements OnDestroy {
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);

  // State signals
  private readonly _query = signal<string>("");
  private readonly _results = signal<SearchResult[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _recentSearches = signal<string[]>([]);
  private readonly _isOpen = signal<boolean>(false);
  private readonly _suggestions = signal<string[]>([]);

  // Public readonly signals
  readonly query = this._query.asReadonly();
  readonly results = this._results.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly recentSearches = this._recentSearches.asReadonly();
  readonly isOpen = this._isOpen.asReadonly();
  readonly suggestions = this._suggestions.asReadonly();

  // Computed
  readonly hasResults = computed(() => this._results().length > 0);
  readonly totalResults = computed(() => this._results().length);

  readonly state = computed<SearchState>(() => ({
    query: this._query(),
    results: this._results(),
    loading: this._loading(),
    error: this._error(),
    totalResults: this._results().length,
  }));

  // Cache for search results
  private searchCache = new Map<string, CacheEntry>();

  // AbortController for cancelling in-flight requests
  private currentAbortController: AbortController | null = null;

  // Track current search version to handle race conditions
  private searchVersion = 0;

  constructor() {
    this.loadRecentSearches();
  }

  ngOnDestroy(): void {
    this.cancelCurrentSearch();
  }

  /**
   * Open search panel
   */
  open(): void {
    this._isOpen.set(true);
  }

  /**
   * Close search panel
   */
  close(): void {
    this._isOpen.set(false);
    this.cancelCurrentSearch();
  }

  /**
   * Toggle search panel
   */
  toggle(): void {
    this._isOpen.update((v) => !v);
    if (!this._isOpen()) {
      this.cancelCurrentSearch();
    }
  }

  /**
   * Cancel any in-flight search request
   */
  private cancelCurrentSearch(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
    }
  }

  /**
   * Perform global search with caching and parallel requests
   */
  async search(query: string): Promise<SearchResult[]> {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery || trimmedQuery.length < 2) {
      this._results.set([]);
      this._query.set("");
      this._suggestions.set([]);
      return [];
    }

    // Check cache first
    const cached = this.getCachedResults(trimmedQuery);
    if (cached) {
      this._query.set(trimmedQuery);
      this._results.set(cached);
      this.addToRecentSearches(query.trim());
      return cached;
    }

    // Cancel any previous search
    this.cancelCurrentSearch();

    // Create new abort controller for this search
    this.currentAbortController = new AbortController();
    const searchId = ++this.searchVersion;

    this._query.set(trimmedQuery);
    this._loading.set(true);
    this._error.set(null);

    try {
      // Execute all searches in parallel for better performance
      const [exerciseResults, programResults, playerResults, videoResults] =
        await Promise.all([
          this.searchExercises(trimmedQuery),
          this.searchPrograms(trimmedQuery),
          this.searchPlayers(trimmedQuery),
          this.searchVideos(trimmedQuery),
        ]);

      // Check if this search is still the current one (handles race conditions)
      if (searchId !== this.searchVersion) {
        return [];
      }

      // Combine all results
      const results: SearchResult[] = [
        ...exerciseResults,
        ...programResults,
        ...playerResults,
        ...videoResults,
      ];

      // Sort by relevance
      results.sort((a, b) => b.relevance - a.relevance);

      // Limit to top results
      const limitedResults = results.slice(0, UI_LIMITS.SEARCH_RESULTS_MAX);

      // Add highlighting to results
      const highlightedResults = limitedResults.map((result) =>
        this.addHighlighting(result, trimmedQuery),
      );

      // Cache the results
      this.cacheResults(trimmedQuery, highlightedResults);

      this._results.set(highlightedResults);
      this._loading.set(false);

      // Save to recent searches
      this.addToRecentSearches(query.trim());

      return highlightedResults;
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === "AbortError") {
        return [];
      }

      // Check if still current search
      if (searchId !== this.searchVersion) {
        return [];
      }

      const errorMessage =
        error instanceof Error ? error.message : "Search failed";
      this._error.set(errorMessage);
      this._loading.set(false);
      this.logger.error("Search error:", error);
      return [];
    }
  }

  /**
   * Get instant suggestions based on partial input
   */
  async getInstantSuggestions(partial: string): Promise<string[]> {
    const trimmed = partial.trim().toLowerCase();
    if (trimmed.length < 2) {
      this._suggestions.set([]);
      return [];
    }

    const suggestions: string[] = [];

    // Add from recent searches that match
    const matchingRecent = this._recentSearches().filter((s) =>
      s.toLowerCase().includes(trimmed),
    );
    suggestions.push(...matchingRecent);

    // Add common search terms
    const commonTerms = [
      "sprint training",
      "agility drills",
      "quarterback exercises",
      "receiver routes",
      "defensive back",
      "strength training",
      "recovery protocol",
      "warm up",
      "cool down",
      "flag pulling",
      "speed drills",
      "conditioning",
      "footwork",
      "catching drills",
    ];

    const matchingCommon = commonTerms.filter((t) =>
      t.toLowerCase().includes(trimmed),
    );
    suggestions.push(...matchingCommon);

    // Return unique suggestions, limited
    const uniqueSuggestions = [...new Set(suggestions)].slice(
      0,
      UI_LIMITS.SEARCH_SUGGESTIONS_MAX,
    );
    this._suggestions.set(uniqueSuggestions);
    return uniqueSuggestions;
  }

  /**
   * Add highlight markers to search results
   */
  private addHighlighting(result: SearchResult, query: string): SearchResult {
    return {
      ...result,
      highlightedTitle: this.highlightText(result.title, query),
      highlightedSubtitle: result.subtitle
        ? this.highlightText(result.subtitle, query)
        : undefined,
    };
  }

  /**
   * Highlight matching text with <mark> tags
   */
  private highlightText(text: string, query: string): string {
    if (!query) return text;

    // Escape special regex characters in query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  }

  /**
   * Get cached results if valid
   */
  private getCachedResults(query: string): SearchResult[] | null {
    const cached = this.searchCache.get(query);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      this.searchCache.delete(query);
      return null;
    }

    return cached.results;
  }

  /**
   * Cache search results
   */
  private cacheResults(query: string, results: SearchResult[]): void {
    // Evict oldest entries if cache is full
    if (this.searchCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.searchCache.keys().next().value;
      if (oldestKey) {
        this.searchCache.delete(oldestKey);
      }
    }

    this.searchCache.set(query, {
      results,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear the search cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }

  /**
   * Search exercises
   */
  private async searchExercises(query: string): Promise<SearchResult[]> {
    try {
      const { data, error } = await this.supabase.client
        .from("exercises")
        .select("id, name, category, description, difficulty_level")
        .or(
          `name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`,
        )
        .limit(10);

      if (error) {
        this.logger.warn("Exercise search error:", error);
        return [];
      }

      return (data || []).map((exercise) => ({
        id: exercise.id,
        type: "exercise" as const,
        title: exercise.name,
        subtitle: exercise.category,
        description: exercise.description?.substring(0, 100),
        icon: "pi pi-bolt",
        route: `/exercise-library?exercise=${exercise.id}`,
        relevance: this.calculateRelevance(query, exercise.name),
      }));
    } catch (error) {
      this.logger.warn("Exercise search failed:", error);
      return [];
    }
  }

  /**
   * Search training programs
   */
  private async searchPrograms(query: string): Promise<SearchResult[]> {
    try {
      const { data, error } = await this.supabase.client
        .from("training_programs")
        .select("id, name, description, program_type, difficulty_level")
        .or(
          `name.ilike.%${query}%,description.ilike.%${query}%,program_type.ilike.%${query}%`,
        )
        .limit(10);

      if (error) {
        this.logger.warn("Program search error:", error);
        return [];
      }

      return (data || []).map((program) => ({
        id: program.id,
        type: "program" as const,
        title: program.name,
        subtitle: `${program.program_type} • ${program.difficulty_level}`,
        description: program.description?.substring(0, 100),
        icon: "pi pi-calendar",
        route: `/training?program=${program.id}`,
        relevance: this.calculateRelevance(query, program.name),
      }));
    } catch (error) {
      this.logger.warn("Program search failed:", error);
      return [];
    }
  }

  /**
   * Search players/users
   */
  private async searchPlayers(query: string): Promise<SearchResult[]> {
    try {
      const { data, error } = await this.supabase.client
        .from("users")
        .select("id, full_name, first_name, last_name, position, team")
        .or(
          `full_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`,
        )
        .limit(10);

      if (error) {
        this.logger.warn("Player search error:", error);
        return [];
      }

      return (data || []).map((player) => {
        const name =
          player.full_name || `${player.first_name} ${player.last_name}`;
        return {
          id: player.id,
          type: "player" as const,
          title: name,
          subtitle: player.position || "Player",
          description: player.team || undefined,
          icon: "pi pi-user",
          route: `/roster?player=${player.id}`,
          relevance: this.calculateRelevance(query, name),
        };
      });
    } catch (error) {
      this.logger.warn("Player search failed:", error);
      return [];
    }
  }

  /**
   * Search training videos
   */
  private async searchVideos(query: string): Promise<SearchResult[]> {
    try {
      const { data, error } = await this.supabase.client
        .from("training_videos")
        .select("id, title, description, category")
        .or(
          `title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`,
        )
        .eq("visibility_type", "public")
        .limit(10);

      if (error) {
        this.logger.warn("Video search error:", error);
        return [];
      }

      return (data || []).map((video) => ({
        id: video.id,
        type: "video" as const,
        title: video.title,
        subtitle: video.category,
        description: video.description?.substring(0, 100),
        icon: "pi pi-video",
        route: `/training/videos?video=${video.id}`,
        relevance: this.calculateRelevance(query, video.title),
      }));
    } catch (error) {
      this.logger.warn("Video search failed:", error);
      return [];
    }
  }

  /**
   * Calculate search relevance score
   */
  private calculateRelevance(query: string, text: string): number {
    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();

    // Exact match
    if (lowerText === lowerQuery) return 100;

    // Starts with query
    if (lowerText.startsWith(lowerQuery)) return 90;

    // Contains query as whole word
    if (new RegExp(`\\b${this.escapeRegex(lowerQuery)}\\b`).test(lowerText)) {
      return 80;
    }

    // Contains query
    if (lowerText.includes(lowerQuery)) return 70;

    // Partial match
    return 50;
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Add to recent searches
   */
  private addToRecentSearches(query: string): void {
    const recent = this._recentSearches();
    const filtered = recent.filter(
      (s) => s.toLowerCase() !== query.toLowerCase(),
    );
    const updated = [query, ...filtered].slice(0, UI_LIMITS.SEARCH_HISTORY_MAX);
    this._recentSearches.set(updated);
    this.saveRecentSearches();
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches(): void {
    this._recentSearches.set([]);
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("recentSearches");
    }
  }

  /**
   * Load recent searches from localStorage
   */
  private loadRecentSearches(): void {
    if (typeof localStorage !== "undefined") {
      try {
        const saved = localStorage.getItem("recentSearches");
        if (saved) {
          this._recentSearches.set(JSON.parse(saved));
        }
      } catch {
        // Ignore parse errors
      }
    }
  }

  /**
   * Save recent searches to localStorage
   */
  private saveRecentSearches(): void {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        "recentSearches",
        JSON.stringify(this._recentSearches()),
      );
    }
  }

  /**
   * Clear search results
   */
  clearResults(): void {
    this._results.set([]);
    this._query.set("");
    this._error.set(null);
    this._suggestions.set([]);
  }

  /**
   * Get suggestions based on partial input (legacy method - use getInstantSuggestions)
   */
  async getSuggestions(partial: string): Promise<string[]> {
    return this.getInstantSuggestions(partial);
  }
}
