// Role-Aware Response Generator
// Adjusts chatbot responses based on user role (player/coach/admin) and team type (domestic/international)

class RoleAwareResponseGenerator {
  constructor(userContext) {
    this.userContext = userContext || {
      role: "player",
      teamType: "domestic",
      position: null,
      expertiseLevel: "intermediate",
    };
  }

  /**
   * Main method to adjust response based on user role and context
   * @param {string} baseResponse - The base response from answer generator
   * @param {Object} parsedQuestion - Parsed question with intent and entities
   * @returns {string} - Enhanced response with role-specific content
   */
  adjustForRole(baseResponse, parsedQuestion) {
    const { role, teamType } = this.userContext;
    const { intent, entities } = parsedQuestion;

    let response = baseResponse;

    // Apply role-specific enhancements
    switch (role) {
      case "coach":
        response = this.enhanceForCoach(response, intent, entities);
        break;
      case "admin":
        response = this.enhanceForAdmin(response, intent, entities);
        break;
      case "player":
      default:
        response = this.enhanceForAthlete(response, intent, entities);
        break;
    }

    // Apply team type adjustments
    response = this.adjustForTeamType(response, intent, entities);

    return response;
  }

  /**
   * Enhance response for coaches
   * Coaches get content about stat entry, schedule design, team management
   */
  enhanceForCoach(response, intent, entities) {
    let enhancements = "";

    // Training protocol questions
    if (
      intent === "protocol" ||
      intent === "how_to" ||
      entities.training?.length > 0
    ) {
      enhancements +=
        "\n\n**💡 Coach Tip:** Consider tracking these metrics in your training logs:\n" +
        "• Volume (sets × reps × load)\n" +
        "• RPE (Rate of Perceived Exertion) - 1-10 scale\n" +
        "• Recovery markers (sleep quality, HRV if available)\n" +
        "• Player feedback scores\n" +
        "• Completion rates and adherence";
    }

    // Supplement/nutrition questions
    if (
      entities.supplements?.length > 0 ||
      intent === "dosage" ||
      intent === "timing"
    ) {
      enhancements +=
        "\n\n**📊 For Your Team:**\n" +
        "• Monitor supplement compliance across your roster\n" +
        "• Track any side effects or individual responses\n" +
        "• Consider creating a team nutrition protocol document\n" +
        "• Document individual tolerances and preferences";
    }

    // Injury questions
    if (entities.injuries?.length > 0 || intent === "safety") {
      enhancements +=
        "\n\n**🏥 Team Management:**\n" +
        "• Document all injuries in your team injury log\n" +
        "• Track recovery timelines and return-to-play protocols\n" +
        "• Coordinate with healthcare providers\n" +
        "• Adjust training loads for injured players";
    }

    // Recovery questions
    if (entities.recovery?.length > 0 || intent === "protocol") {
      enhancements +=
        "\n\n**🔄 Schedule Design:**\n" +
        "• Plan recovery days between intense sessions\n" +
        "• Consider team-wide recovery protocols\n" +
        "• Monitor team fatigue levels\n" +
        "• Adjust periodization based on competition schedule";
    }

    // Psychology questions
    if (entities.psychology?.length > 0) {
      enhancements +=
        "\n\n**🧠 Team Psychology:**\n" +
        "• Apply these techniques in team meetings\n" +
        "• Consider individual vs. team approaches\n" +
        "• Track team cohesion metrics\n" +
        "• Adapt for different personality types";
    }

    return response + enhancements;
  }

  /**
   * Enhance response for athletes/players
   * Athletes get more self-training protocols and individual focus
   */
  enhanceForAthlete(response, intent, entities) {
    let enhancements = "";

    // Training protocol questions
    if (
      intent === "protocol" ||
      intent === "how_to" ||
      entities.training?.length > 0
    ) {
      enhancements +=
        "\n\n**📱 Track This:** Log your sessions in the FlagFit app to monitor progress over time. " +
        "Set reminders for consistency and track your improvements.";
    }

    // Recovery questions
    if (entities.recovery?.length > 0) {
      enhancements +=
        "\n\n**💪 Personal Recovery:** Focus on what works best for your body. " +
        "Track your recovery quality and adjust protocols based on how you feel.";
    }

    // Nutrition questions
    if (entities.supplements?.length > 0 || intent === "dosage") {
      enhancements +=
        "\n\n**📋 Personal Note:** Start with lower doses and gradually increase. " +
        "Track how you feel and any changes in performance. Always consult with a healthcare provider.";
    }

    // Injury questions
    if (entities.injuries?.length > 0) {
      enhancements +=
        "\n\n**⚠️ Important:** If pain persists or worsens, consult a healthcare professional immediately. " +
        "Don't push through pain - proper recovery is essential for long-term performance.";
    }

    return response + enhancements;
  }

  /**
   * Enhance response for admins
   * Admins get system-level information and governance details
   */
  enhanceForAdmin(response, intent, entities) {
    let enhancements = "";

    // Add evidence and governance information
    enhancements +=
      "\n\n**🔧 Admin Information:**\n" +
      "• This response is based on evidence-based knowledge base\n" +
      "• Review knowledge base entries for quality control\n" +
      "• Monitor chatbot usage statistics\n" +
      "• Consider updating knowledge base if new research emerges";

    // Add system metrics if available
    if (this.userContext.totalQueries !== undefined) {
      enhancements += `\n• User has made ${this.userContext.totalQueries} total queries`;
    }

    return response + enhancements;
  }

  /**
   * Adjust response based on team type (domestic vs international)
   */
  adjustForTeamType(response, intent, entities) {
    const { teamType } = this.userContext;

    if (teamType !== "international") {
      return response; // No adjustments needed for domestic teams
    }

    let adjustments = "";

    // Recovery protocols for international teams
    if (entities.recovery?.length > 0 || intent === "protocol") {
      adjustments +=
        "\n\n**🌍 International Consideration:**\n" +
        "• When traveling across time zones, adjust recovery protocols\n" +
        "• Consider jet lag management strategies:\n" +
        "  - Gradually shift sleep schedule before travel\n" +
        "  - Use light therapy to reset circadian rhythm\n" +
        "  - Stay hydrated during flights\n" +
        "  - Allow 1 day per time zone crossed for full adaptation\n" +
        "• Plan recovery days after long flights\n" +
        "• Monitor sleep quality and adjust training intensity accordingly";
    }

    // Training protocols for international teams
    if (entities.training?.length > 0 || intent === "protocol") {
      adjustments +=
        "\n\n**🌍 International Competition Note:**\n" +
        "• Be aware of different competition calendars\n" +
        "• Adjust periodization for international tournaments\n" +
        "• Consider travel fatigue in training load calculations\n" +
        "• Plan tapering around travel dates\n" +
        "• Account for different climates and altitudes";
    }

    // Nutrition considerations for international travel
    if (entities.supplements?.length > 0 || entities.nutrition?.length > 0) {
      adjustments +=
        "\n\n**🌍 Travel Nutrition:**\n" +
        "• Research supplement regulations in destination countries\n" +
        "• Pack supplements in original containers with labels\n" +
        "• Be cautious with local food to avoid gastrointestinal issues\n" +
        "• Maintain hydration during flights\n" +
        "• Plan meal timing around competition schedule";
    }

    // Injury management for international teams
    if (entities.injuries?.length > 0) {
      adjustments +=
        "\n\n**🌍 International Medical:**\n" +
        "• Have medical records accessible digitally\n" +
        "• Know local emergency numbers and healthcare facilities\n" +
        "• Bring adequate supplies of any prescribed medications\n" +
        "• Consider travel insurance that covers sports injuries";
    }

    return response + adjustments;
  }

  /**
   * Get position-specific advice based on user's position
   */
  getPositionSpecificAdvice(position, intent, entities) {
    if (!position) {return "";}

    const positionAdvice = {
      QB: {
        protocol:
          "\n\n**🏈 QB-Specific:** Focus on throwing mechanics, lower body power development, and core stability.",
        recovery:
          "\n\n**🏈 QB-Specific:** Pay special attention to shoulder, elbow, and core recovery. Rotator cuff health is critical.",
        training:
          "\n\n**🏈 QB-Specific:** Include rotational power, accuracy drills, and footwork patterns in your training.",
        injury:
          "\n\n**🏈 QB-Specific:** Common QB injuries include shoulder impingement, elbow tendinitis, and lower back strain. Focus on prevention.",
      },
      WR: {
        protocol:
          "\n\n**🏈 WR-Specific:** Emphasize speed, agility, route-running precision, and hand-eye coordination.",
        recovery:
          "\n\n**🏈 WR-Specific:** Focus on hamstring, hip flexor, and calf recovery. These areas are prone to strain.",
        training:
          "\n\n**🏈 WR-Specific:** Include sprint mechanics, change-of-direction work, and catching drills.",
        injury:
          "\n\n**🏈 WR-Specific:** Common WR injuries include hamstring strains, ankle sprains, and shoulder separations.",
      },
      RB: {
        protocol:
          "\n\n**🏈 RB-Specific:** Focus on acceleration, power, balance, and contact preparation.",
        recovery:
          "\n\n**🏈 RB-Specific:** Prioritize lower body recovery - quads, hamstrings, and glutes.",
        training:
          "\n\n**🏈 RB-Specific:** Include power development, agility ladder work, and ball security drills.",
        injury:
          "\n\n**🏈 RB-Specific:** Common RB injuries include knee injuries, ankle sprains, and concussions.",
      },
      DB: {
        protocol:
          "\n\n**🏈 DB-Specific:** Emphasize speed, agility, backpedaling technique, and reaction time.",
        recovery:
          "\n\n**🏈 DB-Specific:** Focus on hip mobility, groin, and lower back recovery.",
        training:
          "\n\n**🏈 DB-Specific:** Include backpedal drills, change-of-direction work, and reaction training.",
        injury:
          "\n\n**🏈 DB-Specific:** Common DB injuries include groin strains, hamstring pulls, and shoulder injuries.",
      },
      LB: {
        protocol:
          "\n\n**🏈 LB-Specific:** Focus on strength, power, agility, and tackling technique.",
        recovery:
          "\n\n**🏈 LB-Specific:** Prioritize full-body recovery with emphasis on lower body and core.",
        training:
          "\n\n**🏈 LB-Specific:** Include strength training, agility work, and tackling form drills.",
        injury:
          "\n\n**🏈 LB-Specific:** Common LB injuries include knee injuries, shoulder injuries, and concussions.",
      },
    };

    const advice = positionAdvice[position];
    if (!advice) {return "";}

    // Return advice based on intent
    if (advice[intent]) {
      return advice[intent];
    }

    // Return general position advice if intent-specific not available
    return advice.protocol || "";
  }

  /**
   * Update user context (for dynamic updates)
   */
  updateContext(newContext) {
    this.userContext = { ...this.userContext, ...newContext };
  }
}

export { RoleAwareResponseGenerator };
