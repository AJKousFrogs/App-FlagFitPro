// Answer Generator - Intelligent answer synthesis
// Creates comprehensive, natural answers from knowledge base and articles

export class AnswerGenerator {
  constructor() {
    this.templates = {
      dosage: (data) => this.generateDosageAnswer(data),
      timing: (data) => this.generateTimingAnswer(data),
      safety: (data) => this.generateSafetyAnswer(data),
      comparison: (data) => this.generateComparisonAnswer(data),
      how_to: (data) => this.generateHowToAnswer(data),
      what_is: (data) => this.generateWhatIsAnswer(data),
      why: (data) => this.generateWhyAnswer(data),
      protocol: (data) => this.generateProtocolAnswer(data),
      general: (data) => this.generateGeneralAnswer(data),
    };
  }

  generateAnswer(parsedQuestion, knowledgeEntry, articles = []) {
    const intent = parsedQuestion.intent;
    const generator = this.templates[intent] || this.templates.general;

    return generator({
      question: parsedQuestion,
      knowledge: knowledgeEntry,
      articles: articles,
      entities: parsedQuestion.entities,
    });
  }

  generateDosageAnswer({ question, knowledge, articles, entities }) {
    const supplement = entities.supplements?.[0]?.toLowerCase();
    const bodyStats = entities.bodyStats || {};

    // If knowledge has a complete answer, use it (but enhance with body stats if available)
    if (
      knowledge &&
      knowledge.answer &&
      !bodyStats.weight &&
      !bodyStats.height
    ) {
      return knowledge.answer;
    }

    let answer = "";

    if (knowledge && knowledge.dosage_guidelines) {
      const dosage = knowledge.dosage_guidelines;

      answer += `**Recommended Dosage for ${supplement ? supplement.charAt(0).toUpperCase() + supplement.slice(1) : "this supplement"}:**\n\n`;

      if (dosage.recommended_dosage) {
        answer += `• **Standard dosage:** ${dosage.recommended_dosage}\n`;
      }

      // Personalized protein calculation
      if (bodyStats.weight && supplement && supplement.includes("protein")) {
        const proteinPerKg = 1.6;
        const dailyProtein = Math.round(bodyStats.weight * proteinPerKg);
        answer += `\n**Personalized for you (${bodyStats.weight}kg):**\n`;
        answer += `• **Daily protein:** ${dailyProtein}g (${proteinPerKg}g per kg body weight)\n`;
        answer += `• **Per meal:** ~${Math.round(dailyProtein / 4)}g (spread across 4-5 meals)\n`;
        answer += `• **Post-workout:** 20-30g within 30 minutes\n`;
      }

      // Personalized iron calculation
      if (
        bodyStats.height &&
        bodyStats.weight &&
        supplement &&
        supplement.includes("iron")
      ) {
        const baseIron = 8;
        const athleteMultiplier = 1.5;
        const recommended = Math.round(baseIron * athleteMultiplier);
        answer += `\n**Personalized for you (${bodyStats.height}cm / ${bodyStats.weight}kg):**\n`;
        answer += `• **Daily iron:** ${recommended}mg (athletes need 1.5× RDA)\n`;
      }

      // Use knowledge answer if available and no body stats
      if (knowledge.answer && !bodyStats.weight && !bodyStats.height) {
        answer = knowledge.answer;
      }

      if (dosage.timing) {
        answer += `\n**Timing:**\n${dosage.timing.map((t) => `• ${t}`).join("\n")}\n`;
      }

      if (dosage.loading_phase) {
        answer += `\n**Loading phase:** ${dosage.loading_phase}\n`;
      }

      if (dosage.maintenance) {
        answer += `**Maintenance:** ${dosage.maintenance}\n`;
      }
    } else if (articles.length > 0) {
      answer += this.synthesizeDosageFromArticles(articles, supplement);
    } else {
      answer += this.getDefaultDosageAnswer(supplement);
    }

    // Add safety warnings
    if (
      knowledge &&
      knowledge.safety_warnings &&
      knowledge.safety_warnings.length > 0
    ) {
      answer += `\n**⚠️ Safety Warnings:**\n`;
      knowledge.safety_warnings.forEach((warning) => {
        answer += `• ${warning}\n`;
      });
    }

    // Add absorption tips
    if (
      knowledge &&
      knowledge.best_practices &&
      knowledge.best_practices.length > 0
    ) {
      answer += `\n**💡 Best Practices:**\n`;
      knowledge.best_practices.forEach((tip) => {
        answer += `• ${tip}\n`;
      });
    }

    // Add evidence
    if (knowledge || articles.length > 0) {
      answer += this.addEvidenceFooter(knowledge, articles);
    }

    return answer;
  }

  generateTimingAnswer({ question, knowledge, articles }) {
    let answer = "";

    if (knowledge && knowledge.protocols && knowledge.protocols.timing) {
      answer += `**Best Timing:**\n\n`;
      answer += knowledge.protocols.timing.map((t) => `• ${t}`).join("\n");
    } else if (articles.length > 0) {
      answer += this.extractTimingFromArticles(articles);
    } else {
      answer +=
        "Timing recommendations vary based on the specific supplement or method. ";
      answer += "Generally, follow these guidelines:\n\n";
      answer += "• **Pre-workout:** 30-60 minutes before training\n";
      answer += "• **Post-workout:** Within 30 minutes after training\n";
      answer +=
        "• **With meals:** For better absorption and reduced stomach upset\n";
      answer += "• **Before bed:** For recovery-promoting supplements";
    }

    return answer;
  }

  generateSafetyAnswer({ question, knowledge, articles }) {
    let answer = "**Safety Information:**\n\n";

    if (knowledge && knowledge.safety_warnings) {
      answer += "**⚠️ Warnings:**\n";
      knowledge.safety_warnings.forEach((warning) => {
        answer += `• ${warning}\n`;
      });
      answer += "\n";
    }

    if (knowledge && knowledge.contraindications) {
      answer += "**🚫 Contraindications:**\n";
      knowledge.contraindications.forEach((contra) => {
        answer += `• ${contra}\n`;
      });
      answer += "\n";
    }

    if (knowledge && knowledge.best_practices) {
      answer += "**✅ Safe Practices:**\n";
      knowledge.best_practices.forEach((practice) => {
        answer += `• ${practice}\n`;
      });
    }

    answer +=
      "\n**Important:** Always consult with a healthcare provider or sports nutritionist before starting any new supplement, especially if you have existing health conditions or take medications.";

    return answer;
  }

  generateHowToAnswer({ question, knowledge, articles, entities }) {
    const topic =
      entities.injuries[0] ||
      entities.recovery[0] ||
      entities.training[0] ||
      "this";

    let answer = `**How to ${question.original.replace(/how\s+(?:do\s+i\s+)?/i, "").replace(/\?/g, "")}:**\n\n`;

    if (knowledge && knowledge.protocols) {
      answer += this.formatProtocol(knowledge.protocols);
    } else if (knowledge && knowledge.best_practices) {
      answer += knowledge.best_practices
        .map((step, i) => `${i + 1}. ${step}`)
        .join("\n\n");
    } else if (articles.length > 0) {
      answer += this.synthesizeStepsFromArticles(articles);
    } else {
      answer += this.getDefaultHowToAnswer(topic);
    }

    return answer;
  }

  generateProtocolAnswer({ knowledge, articles }) {
    let answer = "**Recommended Protocol:**\n\n";

    if (knowledge && knowledge.protocols) {
      answer += this.formatProtocol(knowledge.protocols);
    } else if (articles.length > 0) {
      answer += this.extractProtocolFromArticles(articles);
    } else {
      answer +=
        "Protocol recommendations vary. Consult the latest research or a qualified professional for specific protocols.";
    }

    return answer;
  }

  generateWhatIsAnswer({ knowledge, articles, entities }) {
    const topic =
      entities.supplements[0] ||
      entities.recovery[0] ||
      entities.training[0] ||
      "this";

    let answer = "";

    if (knowledge && knowledge.summary) {
      answer += knowledge.summary + "\n\n";
    }

    if (knowledge && knowledge.answer) {
      answer += knowledge.answer;
    } else if (articles.length > 0) {
      answer += this.synthesizeDefinitionFromArticles(articles, topic);
    } else {
      answer += this.getDefaultDefinition(topic);
    }

    return answer;
  }

  generateWhyAnswer({ knowledge, articles }) {
    let answer = "**Why this matters:**\n\n";

    if (knowledge && knowledge.answer) {
      const whyMatch = knowledge.answer.match(
        /because|due to|helps|improves|enhances/i,
      );
      if (whyMatch) {
        answer += knowledge.answer;
      } else {
        answer += this.extractBenefitsFromText(knowledge.answer);
      }
    } else if (articles.length > 0) {
      answer += this.extractBenefitsFromArticles(articles);
    } else {
      answer +=
        "Research shows multiple benefits. Consult recent studies for specific mechanisms and outcomes.";
    }

    return answer;
  }

  generateComparisonAnswer({ question, knowledge, articles }) {
    let answer = "**Comparison:**\n\n";

    // Extract what's being compared from question
    const comparisonMatch = question.original.match(
      /(\w+)\s+(?:vs|versus|or)\s+(\w+)/i,
    );

    if (comparisonMatch) {
      answer += `**${comparisonMatch[1]} vs ${comparisonMatch[2]}:**\n\n`;
    }

    if (articles.length > 0) {
      answer += this.synthesizeComparisonFromArticles(articles);
    } else {
      answer +=
        "Both have their benefits. The best choice depends on your specific goals, body composition, and training schedule. ";
      answer +=
        "Consult with a sports nutritionist for personalized recommendations.";
    }

    return answer;
  }

  generateGeneralAnswer({ knowledge, articles, question }) {
    let answer = "";

    // Prioritize knowledge base answer
    if (knowledge && knowledge.answer) {
      answer = knowledge.answer;

      // Enhance with summary if available
      if (knowledge.summary && !answer.includes(knowledge.summary)) {
        answer = `${knowledge.summary}\n\n${answer}`;
      }
    } else if (articles.length > 0) {
      answer = this.synthesizeGeneralAnswerFromArticles(
        articles,
        question.original,
      );
    } else {
      answer = this.getDefaultAnswer(question.original);
    }

    return answer;
  }

  // Helper methods
  formatProtocol(protocol) {
    let formatted = "";

    if (protocol.temperature) {
      formatted += `**Temperature:** ${protocol.temperature}\n`;
    }
    if (protocol.duration) {
      formatted += `**Duration:** ${protocol.duration}\n`;
    }
    if (protocol.frequency) {
      formatted += `**Frequency:** ${protocol.frequency}\n`;
    }
    if (protocol.method) {
      formatted += `**Method:** ${protocol.method}\n`;
    }
    if (protocol.steps) {
      formatted += `\n**Steps:**\n`;
      formatted += protocol.steps
        .map((step, i) => `${i + 1}. ${step}`)
        .join("\n");
    }

    return formatted;
  }

  synthesizeDosageFromArticles(articles, supplement) {
    const dosages = [];
    articles.forEach((article) => {
      const text = `${article.abstract || ""} ${article.key_findings || ""}`;
      const dosageMatch = text.match(
        /(\d+(?:\.\d+)?)\s*(?:mg|g|mcg)\s*(?:per\s*day|daily|\/day)/i,
      );
      if (dosageMatch) {
        dosages.push(dosageMatch[0]);
      }
    });

    if (dosages.length > 0) {
      return (
        `Based on research, recommended dosage ranges from ${dosages[0]} to ${dosages[dosages.length - 1]}. ` +
        `Consult with a sports nutritionist for personalized recommendations.`
      );
    }

    return this.getDefaultDosageAnswer(supplement);
  }

  extractTimingFromArticles(articles) {
    const timings = [];
    articles.forEach((article) => {
      const text = `${article.abstract || ""} ${article.key_findings || ""}`;
      if (text.includes("pre-workout") || text.includes("before training")) {
        timings.push("Pre-workout: 30-60 minutes before training");
      }
      if (text.includes("post-workout") || text.includes("after training")) {
        timings.push("Post-workout: Within 30 minutes after training");
      }
    });

    return timings.length > 0
      ? timings.map((t) => `• ${t}`).join("\n")
      : "Timing recommendations vary. Consult recent research for specific protocols.";
  }

  synthesizeStepsFromArticles(articles) {
    const steps = [];
    articles.forEach((article) => {
      if (article.practical_applications) {
        steps.push(...article.practical_applications);
      }
    });

    return steps
      .slice(0, 5)
      .map((step, i) => `${i + 1}. ${step}`)
      .join("\n\n");
  }

  extractProtocolFromArticles(articles) {
    const protocols = [];
    articles.forEach((article) => {
      if (article.practical_applications) {
        protocols.push(...article.practical_applications);
      }
    });

    return protocols
      .slice(0, 5)
      .map((p) => `• ${p}`)
      .join("\n");
  }

  synthesizeDefinitionFromArticles(articles, topic) {
    const firstArticle = articles[0];
    if (firstArticle.abstract) {
      return firstArticle.abstract.substring(0, 400) + "...";
    }
    return (
      `Based on research, ${topic} is an important aspect of athletic performance. ` +
      `Consult the latest research articles for detailed information.`
    );
  }

  extractBenefitsFromArticles(articles) {
    const benefits = [];
    articles.forEach((article) => {
      const text = `${article.abstract || ""} ${article.key_findings || ""}`;
      if (
        text.includes("improves") ||
        text.includes("enhances") ||
        text.includes("benefits")
      ) {
        const benefitMatch = text.match(
          /(?:improves|enhances|benefits)\s+([^\.]+)/i,
        );
        if (benefitMatch) {
          benefits.push(benefitMatch[1].trim());
        }
      }
    });

    return benefits
      .slice(0, 5)
      .map((b) => `• ${b}`)
      .join("\n");
  }

  extractBenefitsFromText(text) {
    const benefits = [];
    const benefitMatches = text.matchAll(
      /(?:improves|enhances|helps|benefits)\s+([^\.]+)/gi,
    );
    for (const match of benefitMatches) {
      benefits.push(match[1].trim());
    }
    return benefits
      .slice(0, 5)
      .map((b) => `• ${b}`)
      .join("\n");
  }

  synthesizeComparisonFromArticles(articles) {
    return articles
      .slice(0, 3)
      .map((article) => {
        return `• **${article.title}:** ${article.key_findings || article.abstract?.substring(0, 150) || ""}`;
      })
      .join("\n\n");
  }

  synthesizeGeneralAnswerFromArticles(articles, question) {
    const topArticles = articles.slice(0, 3);
    let answer = `Based on ${articles.length} research article${articles.length !== 1 ? "s" : ""}:\n\n`;

    topArticles.forEach((article, i) => {
      answer += `**${i + 1}. ${article.title}**\n`;
      answer += `${article.key_findings || article.abstract?.substring(0, 200) || ""}\n\n`;
    });

    return answer;
  }

  addEvidenceFooter(knowledge, articles) {
    let footer = "\n---\n";

    if (knowledge) {
      footer += `**Evidence Level:** ${knowledge.evidence_strength || "B"} `;
      footer += `| **Consensus:** ${knowledge.consensus_level || "moderate"}`;

      if (
        knowledge.supporting_articles &&
        knowledge.supporting_articles.length > 0
      ) {
        footer += ` | **Sources:** ${knowledge.supporting_articles.length} research article${knowledge.supporting_articles.length !== 1 ? "s" : ""}`;
      }
    } else if (articles.length > 0) {
      footer += `**Sources:** ${articles.length} research article${articles.length !== 1 ? "s" : ""}`;
      if (articles[0].evidence_level) {
        footer += ` | **Evidence Level:** ${articles[0].evidence_level}`;
      }
    }

    return footer;
  }

  // Default answers
  getDefaultDosageAnswer(supplement) {
    const defaults = {
      iron: "**Iron Dosage:**\n• Adult males: 8mg/day (RDA)\n• Athletes: 10-15mg/day\n• Best from food sources first",
      creatine:
        "**Creatine Dosage:**\n• Loading: 20g/day (5g × 4) for 5-7 days\n• Maintenance: 3-5g/day\n• Take with carbs post-workout",
      protein:
        "**Protein Dosage:**\n• Athletes: 1.6-2.2g per kg body weight\n• Spread across 4-5 meals\n• Post-workout: 20-30g",
      magnesium:
        "**Magnesium Dosage:**\n• Men: 400-420mg/day\n• Women: 310-320mg/day\n• Athletes: 500-600mg/day",
    };

    return (
      defaults[supplement?.toLowerCase()] ||
      "Dosage recommendations vary. Consult with a sports nutritionist for personalized advice."
    );
  }

  getDefaultHowToAnswer(topic) {
    return `Here's a general approach to ${topic}:\n\n1. Start with proper assessment\n2. Follow evidence-based protocols\n3. Monitor progress\n4. Adjust as needed\n\nFor specific protocols, consult recent research or a qualified professional.`;
  }

  getDefaultDefinition(topic) {
    return (
      `${topic} is an important aspect of athletic performance and recovery. ` +
      `Research shows multiple benefits for athletes. For detailed information, ` +
      `consult the latest research articles or speak with a sports science professional.`
    );
  }

  getDefaultAnswer(question) {
    return (
      `I understand you're asking about "${question}". ` +
      `I can help with evidence-based information about:\n\n` +
      `• Nutrition & supplements\n` +
      `• Injury prevention & treatment\n` +
      `• Recovery methods\n` +
      `• Training protocols\n` +
      `• Sports psychology\n\n` +
      `Could you be more specific about what you'd like to know?`
    );
  }
}

export const answerGenerator = new AnswerGenerator();
