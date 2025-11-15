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
      relatedTopics.slice(0, 3).forEach(topic => {
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
      'could be more specific',
      'consult',
      'speak with',
      'for more details'
    ];

    return incompleteIndicators.some(indicator =>
      response.toLowerCase().includes(indicator)
    );
  }

  generateFollowUpSuggestions(question) {
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('iron')) {
      return '\n\n**Want to know more?**\n• "What foods are high in iron?"\n• "How do I know if I'm iron deficient?"\n• "What are the signs of iron deficiency?"';
    }

    if (lowerQuestion.includes('protein')) {
      return '\n\n**Want to know more?**\n• "What are the best protein sources?"\n• "When should I take protein?"\n• "How much protein per meal?"';
    }

    if (lowerQuestion.includes('recovery') || lowerQuestion.includes('sauna') || lowerQuestion.includes('cold')) {
      return '\n\n**Want to know more?**\n• "What's the best recovery protocol?"\n• "How often should I use recovery methods?"\n• "What are the benefits of each recovery method?"';
    }

    return '';
  }

  getRelatedTopics(question) {
    const lowerQuestion = question.toLowerCase();
    const topics = [];

    if (lowerQuestion.includes('iron')) {
      topics.push('Iron-rich foods', 'Iron absorption', 'Anemia in athletes');
    }

    if (lowerQuestion.includes('protein')) {
      topics.push('Protein timing', 'BCAA supplements', 'Post-workout nutrition');
    }

    if (lowerQuestion.includes('recovery')) {
      topics.push('Sleep optimization', 'Active recovery', 'Recovery nutrition');
    }

    if (lowerQuestion.includes('injury')) {
      topics.push('Injury prevention', 'Rehabilitation exercises', 'Return to play protocols');
    }

    return topics;
  }

  formatLists(text) {
    // Ensure bullet points are properly formatted
    return text.replace(/(\n)([•·-])\s+/g, '\n• ');
  }

  addEmphasis(text) {
    // Add emphasis to important warnings
    text = text.replace(/\*\*⚠️\s*([^*]+)\*\*/g, '**⚠️ $1**');
    text = text.replace(/\*\*Important:\*\*/g, '**⚠️ Important:**');
    text = text.replace(/\*\*Warning:\*\*/g, '**⚠️ Warning:**');

    return text;
  }

  /**
   * Add context-aware disclaimers
   */
  addDisclaimers(response, topic) {
    const lowerTopic = topic.toLowerCase();

    if (lowerTopic.includes('supplement') || lowerTopic.includes('dosage')) {
      return response + '\n\n**⚠️ Disclaimer:** Always consult with a healthcare provider or sports nutritionist before starting any new supplement, especially if you have existing health conditions or take medications.';
    }

    if (lowerTopic.includes('injury') || lowerTopic.includes('treatment')) {
      return response + '\n\n**⚠️ Disclaimer:** This information is for educational purposes only and is not a substitute for professional medical advice. If you have a serious injury, consult a healthcare professional immediately.';
    }

    return response;
  }

  /**
   * Personalize response based on user context
   */
  personalizeResponse(response, userContext) {
    if (!userContext) return response;

    let personalized = response;

    // Add personalized recommendations if body stats available
    if (userContext.height && userContext.weight) {
      // Already handled in answer generation, but can add more context here
    }

    // Add training phase context if available
    if (userContext.trainingPhase) {
      personalized = personalized.replace(
        /recommended/g,
        `recommended for ${userContext.trainingPhase} phase`
      );
    }

    return personalized;
  }
}

export const responseEnhancer = new ResponseEnhancer();

