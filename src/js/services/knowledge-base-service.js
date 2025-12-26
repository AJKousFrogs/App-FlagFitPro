// Knowledge Base Service
// Queries the evidence-based knowledge database for chatbot responses

// apiClient available for future use
// import { apiClient } from "../../api-config.js";
import { logger } from "../../logger.js";

class KnowledgeBaseService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 1000 * 60 * 60; // 1 hour cache
  }

  /**
   * Search knowledge base for relevant entries
   * @param {string} query - User's question
   * @param {string} category - Optional category filter
   * @param {Object} options - Search options
   * @param {boolean} options.requireApproval - Only return approved entries (default: true)
   * @param {boolean} options.includeExperimental - Include experimental entries (default: false)
   * @param {number} options.minQualityScore - Minimum source quality score (0.0-1.0, default: 0.0)
   * @returns {Promise<Object>} Knowledge base entry with answer
   */
  async searchKnowledgeBase(query, category = null, options = {}) {
    const {
      requireApproval = true,
      includeExperimental = false,
      minQualityScore = 0.0,
    } = options;

    // Check cache first (include options in cache key)
    const cacheKey = `${query}_${category || "all"}_${requireApproval}_${includeExperimental}_${minQualityScore}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const { knowledge } = await import("../../api-config.js");
      // Pass options to search API
      const response = await knowledge.search(query, category, 5, {
        requireApproval,
        includeExperimental,
        minQualityScore,
      });

      if (response.success && response.data && response.data.length > 0) {
        // Cache the result
        this.cache.set(cacheKey, {
          data: response.data[0],
          timestamp: Date.now(),
        });

        return response.data[0];
      }

      return null;
    } catch (error) {
      logger.warn("Knowledge base search failed, using fallback:", error);
      return null;
    }
  }

  /**
   * Get specific knowledge entry by topic
   * @param {string} topic - Topic identifier (e.g., 'iron_supplementation')
   * @returns {Promise<Object>} Knowledge base entry
   */
  async getKnowledgeEntry(topic) {
    try {
      const { knowledge } = await import("../../api-config.js");
      const response = await knowledge.getEntry(topic);

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      logger.warn("Failed to get knowledge entry:", error);
      return null;
    }
  }

  /**
   * Search research articles
   * @param {string} query - Search query
   * @param {string[]} categories - Categories to filter
   * @returns {Promise<Array>} Array of research articles
   */
  async searchArticles(query, categories = []) {
    try {
      const { knowledge } = await import("../../api-config.js");
      const response = await knowledge.searchArticles(query, categories, 10);

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      logger.warn("Article search failed:", error);
      return [];
    }
  }

  /**
   * Get evidence-based answer with citations
   * @param {string} question - User's question
   * @returns {Promise<Object>} Answer with supporting evidence
   */
  async getEvidenceBasedAnswer(question) {
    // First try knowledge base entries
    const kbEntry = await this.searchKnowledgeBase(question);

    if (kbEntry) {
      return {
        answer: kbEntry.answer,
        summary: kbEntry.summary,
        evidenceStrength: kbEntry.evidence_strength,
        supportingArticles: kbEntry.supporting_articles?.length || 0,
        citations: kbEntry.supporting_articles || [],
        source: "knowledge_base",
      };
    }

    // Fallback to article search
    const articles = await this.searchArticles(question);

    if (articles.length > 0) {
      // Synthesize answer from articles
      const answer = this.synthesizeAnswerFromArticles(articles, question);
      return {
        answer,
        summary: articles[0].abstract?.substring(0, 200) || "",
        evidenceStrength: articles[0].evidence_level || "C",
        supportingArticles: articles.length,
        citations: articles.map((a) => ({
          title: a.title,
          authors: a.authors,
          year: a.publication_year,
          journal: a.journal,
          doi: a.doi,
        })),
        source: "articles",
      };
    }

    return null;
  }

  /**
   * Synthesize answer from multiple articles
   */
  synthesizeAnswerFromArticles(articles, _question) {
    // Simple synthesis - can be improved with NLP
    const keyFindings = articles
      .slice(0, 3)
      .map((a) => a.key_findings || a.abstract?.substring(0, 300))
      .filter((f) => f)
      .join("\n\n");

    return `Based on ${articles.length} research articles:\n\n${keyFindings}\n\n*For more details, consult the original research articles.*`;
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
