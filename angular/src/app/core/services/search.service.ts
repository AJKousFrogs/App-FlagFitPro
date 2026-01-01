/**
 * Global Search Service
 *
 * Provides unified search functionality across the application
 * Searches exercises, training programs, players, and content
 *
 * Features:
 * - Real-time search with debouncing
 * - Multi-entity search (exercises, programs, users, etc.)
 * - Recent searches history
 * - Search suggestions
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

export interface SearchResult {
  id: string;
  type: "exercise" | "program" | "player" | "team" | "video" | "article";
  title: string;
  subtitle?: string;
  description?: string;
  icon: string;
  route: string;
  relevance: number;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  totalResults: number;
}

@Injectable({
  providedIn: "root",
})
export class SearchService {
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);

  // State signals
  private readonly _query = signal<string>("");
  private readonly _results = signal<SearchResult[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _recentSearches = signal<string[]>([]);
  private readonly _isOpen = signal<boolean>(false);

  // Public readonly signals
  readonly query = this._query.asReadonly();
  readonly results = this._results.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly recentSearches = this._recentSearches.asReadonly();
  readonly isOpen = this._isOpen.asReadonly();

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

  constructor() {
    this.loadRecentSearches();
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
  }

  /**
   * Toggle search panel
   */
  toggle(): void {
    this._isOpen.update((v) => !v);
  }

  /**
   * Perform global search
   */
  async search(query: string): Promise<SearchResult[]> {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || trimmedQuery.length < 2) {
      this._results.set([]);
      this._query.set("");
      return [];
    }

    this._query.set(trimmedQuery);
    this._loading.set(true);
    this._error.set(null);

    try {
      const results: SearchResult[] = [];

      // Search exercises
      const exerciseResults = await this.searchExercises(trimmedQuery);
      results.push(...exerciseResults);

      // Search training programs
      const programResults = await this.searchPrograms(trimmedQuery);
      results.push(...programResults);

      // Search players (team members)
      const playerResults = await this.searchPlayers(trimmedQuery);
      results.push(...playerResults);

      // Search training videos
      const videoResults = await this.searchVideos(trimmedQuery);
      results.push(...videoResults);

      // Sort by relevance
      results.sort((a, b) => b.relevance - a.relevance);

      // Limit to top 20 results
      const limitedResults = results.slice(0, 20);

      this._results.set(limitedResults);
      this._loading.set(false);

      // Save to recent searches
      this.addToRecentSearches(trimmedQuery);

      return limitedResults;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Search failed";
      this._error.set(errorMessage);
      this._loading.set(false);
      this.logger.error("Search error:", error);
      return [];
    }
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
    if (new RegExp(`\\b${lowerQuery}\\b`).test(lowerText)) return 80;

    // Contains query
    if (lowerText.includes(lowerQuery)) return 70;

    // Partial match
    return 50;
  }

  /**
   * Add to recent searches
   */
  private addToRecentSearches(query: string): void {
    const recent = this._recentSearches();
    const filtered = recent.filter(
      (s) => s.toLowerCase() !== query.toLowerCase(),
    );
    const updated = [query, ...filtered].slice(0, 10);
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
  }

  /**
   * Get suggestions based on partial input
   */
  async getSuggestions(partial: string): Promise<string[]> {
    if (partial.length < 2) return [];

    const suggestions: string[] = [];

    // Add from recent searches that match
    const matchingRecent = this._recentSearches().filter((s) =>
      s.toLowerCase().includes(partial.toLowerCase()),
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
    ];

    const matchingCommon = commonTerms.filter((t) =>
      t.toLowerCase().includes(partial.toLowerCase()),
    );
    suggestions.push(...matchingCommon);

    // Return unique suggestions
    return [...new Set(suggestions)].slice(0, 8);
  }
}
