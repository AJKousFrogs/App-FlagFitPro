// Response Enhancer - Enhances chatbot responses with better formatting and context

export class ResponseEnhancer {
  /**
   * Enhance a response with better formatting, context, and follow-up suggestions
   */
  enhanceResponse(response, question, context = {}) {
    let enhanced = response;

    // Add personalized greeting if first interaction
    if (context.isFirstMessage) {
      enhanced = `👋 Great question! ${enhanced}`;
    }

    // Add follow-up suggestions for incomplete answers
    if (this.isIncompleteAnswer(response)) {
      enhanced += this.generateFollowUpSuggestions(question);
    }

    // Add related topics if relevant
    const relatedTopics = this.getRelatedTopics(question);
    if (relatedTopics.length > 0 && response.length < 500) {
      enhanced += `\n\n**Related topics you might find helpful:**\n`;
      relatedTopics.slice(0, 3).forEach((topic) => {
        enhanced += `• ${topic}\n`;
      });
    }

    // Format lists better
    enhanced = this.formatLists(enhanced);

    // Add emphasis to key points
    enhanced = this.addEmphasis(enhanced);

    return enhanced;
  }

  isIncompleteAnswer(response) {
    const incompleteIndicators = [
      "could be more specific",
      "consult",
      "speak with",
      "for more details",
    ];

    return incompleteIndicators.some((indicator) =>
      response.toLowerCase().includes(indicator),
    );
  }

  generateFollowUpSuggestions(question) {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes("iron")) {
      return '\n\n**Want to know more?**\n• "What foods are high in iron?"\n• "How do I know if I\'m iron deficient?"\n• "What are the signs of iron deficiency?"';
    }

    if (lowerQuestion.includes("protein")) {
      return '\n\n**Want to know more?**\n• "What are the best protein sources?"\n• "When should I take protein?"\n• "How much protein per meal?"';
    }

    if (
      lowerQuestion.includes("recovery") ||
      lowerQuestion.includes("sauna") ||
      lowerQuestion.includes("cold")
    ) {
      return '\n\n**Want to know more?**\n• "What\'s the best recovery protocol?"\n• "How often should I use recovery methods?"\n• "What are the benefits of each recovery method?"';
    }

    return "";
  }

  getRelatedTopics(question) {
    const lowerQuestion = question.toLowerCase();
    const topics = [];

    if (lowerQuestion.includes("iron")) {
      topics.push("Iron-rich foods", "Iron absorption", "Anemia in athletes");
    }

    if (lowerQuestion.includes("protein")) {
      topics.push(
        "Protein timing",
        "BCAA supplements",
        "Post-workout nutrition",
      );
    }

    if (lowerQuestion.includes("recovery")) {
      topics.push(
        "Sleep optimization",
        "Active recovery",
        "Recovery nutrition",
      );
    }

    if (lowerQuestion.includes("injury")) {
      topics.push(
        "Injury prevention",
        "Rehabilitation exercises",
        "Return to play protocols",
      );
    }

    return topics;
  }

  formatLists(text) {
    // Ensure bullet points are properly formatted
    return text.replace(/(\n)([•·-])\s+/g, "\n• ");
  }

  addEmphasis(text) {
    // Add emphasis to important warnings
    text = text.replace(/\*\*⚠️\s*([^*]+)\*\*/g, "**⚠️ $1**");
    text = text.replace(/\*\*Important:\*\*/g, "**⚠️ Important:**");
    text = text.replace(/\*\*Warning:\*\*/g, "**⚠️ Warning:**");

    return text;
  }

  /**
   * Add context-aware disclaimers
   */
  addDisclaimers(response, topic) {
    const lowerTopic = topic.toLowerCase();

    if (lowerTopic.includes("supplement") || lowerTopic.includes("dosage")) {
      return (
        response +
        "\n\n**⚠️ Disclaimer:** Always consult with a healthcare provider or sports nutritionist before starting any new supplement, especially if you have existing health conditions or take medications."
      );
    }

    if (lowerTopic.includes("injury") || lowerTopic.includes("treatment")) {
      return (
        response +
        "\n\n**⚠️ Disclaimer:** This information is for educational purposes only and is not a substitute for professional medical advice. If you have a serious injury, consult a healthcare professional immediately."
      );
    }

    return response;
  }

  /**
   * Add evidence indicators to response based on knowledge entry
   * @param {string} response - The response text
   * @param {Object} knowledgeEntry - Knowledge base entry with governance fields
   * @returns {string} Response with evidence indicators
   */
  addEvidenceIndicators(response, knowledgeEntry) {
    if (!knowledgeEntry) {
      return response;
    }

    const {
      approval_status,
      approval_level,
      evidence_strength,
      source_quality_score,
      consensus_level,
    } = knowledgeEntry;

    let indicators = "\n\n---\n**📚 Evidence Information:**\n";

    // Approval status
    if (approval_status === "approved") {
      indicators +=
        "✅ **League-Approved** - This information has been reviewed and approved.\n";
    } else if (approval_status === "experimental") {
      indicators +=
        "🔬 **Experimental** - This is emerging research, use with caution.\n";
    } else if (approval_status === "pending") {
      indicators +=
        "⏳ **Pending Review** - This information is awaiting approval.\n";
    } else if (approval_status === "rejected") {
      // Don't show rejected entries, but if somehow shown, indicate it
      indicators +=
        "❌ **Not Approved** - This information has been rejected.\n";
    }

    // Evidence strength
    if (evidence_strength) {
      const strengthEmoji = {
        strong: "🟢",
        moderate: "🟡",
        limited: "🟠",
      };
      const strengthLabel = {
        strong: "Strong Evidence",
        moderate: "Moderate Evidence",
        limited: "Limited Evidence",
      };
      indicators += `${strengthEmoji[evidence_strength] || "⚪"} **Evidence Level:** ${strengthLabel[evidence_strength] || evidence_strength}\n`;
    }

    // Consensus level
    if (consensus_level) {
      const consensusEmoji = {
        high: "🟢",
        moderate: "🟡",
        low: "🟠",
      };
      indicators += `${consensusEmoji[consensus_level] || "⚪"} **Consensus:** ${consensus_level.charAt(0).toUpperCase() + consensus_level.slice(1)}\n`;
    }

    // Source quality score
    if (source_quality_score !== null && source_quality_score !== undefined) {
      const qualityPercent = Math.round(source_quality_score * 100);
      let qualityEmoji = "⚪";
      if (qualityPercent >= 80) qualityEmoji = "🟢";
      else if (qualityPercent >= 60) qualityEmoji = "🟡";
      else if (qualityPercent >= 40) qualityEmoji = "🟠";
      else qualityEmoji = "🔴";

      indicators += `${qualityEmoji} **Source Quality:** ${qualityPercent}%\n`;
    }

    // Approval level
    if (approval_level) {
      const levelLabels = {
        league: "Official League Guidelines",
        coach: "Coach-Reviewed Protocol",
        research: "Research-Based",
        experimental: "Experimental Protocol",
      };
      indicators += `📋 **Source:** ${levelLabels[approval_level] || approval_level}\n`;
    }

    indicators +=
      "\n**⚠️ Disclaimer:** Always consult with healthcare professionals before making significant changes to your training or nutrition.";

    return response + indicators;
  }

  /**
   * Personalize response based on user context
   */
  personalizeResponse(response, userContext) {
    if (!userContext) {
      return response;
    }

    let personalized = response;

    // Add personalized recommendations if body stats available
    if (userContext.height && userContext.weight) {
      // Already handled in answer generation, but can add more context here
    }

    // Add training phase context if available
    if (userContext.trainingPhase) {
      personalized = personalized.replace(
        /recommended/g,
        `recommended for ${userContext.trainingPhase} phase`,
      );
    }

    return personalized;
  }
}

export const responseEnhancer = new ResponseEnhancer();
