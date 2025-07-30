import OpenAI from 'openai';
import { mcpService } from './MCPService';
import { searchLibraryIds } from '../config/context7-mappings';

class AICoachService {
  constructor(database) {
    this.db = database;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  // Start a new conversation with the AI coach
  static async startConversation(userId, trigger, context = {}) {
    try {
      // Get user's AI coach profile and preferences
      const userPrefs = await this.getUserCoachPreferences(userId);
      const coachProfile = await this.getCoachProfile(userPrefs.ai_coach_profile_id);

      // Create conversation record
      const conversationQuery = `
        INSERT INTO ai_chat_conversations (
          user_id, ai_coach_profile_id, initiated_by, conversation_trigger,
          related_training_session_id, related_nutrition_day, related_recovery_session_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const conversationResult = await this.db.query(conversationQuery, [
        userId, coachProfile.id, 'user', trigger,
        context.trainingSessionId, context.nutritionDate, context.recoverySessionId
      ]);

      const conversation = conversationResult.rows[0];

      // Generate initial AI response based on trigger
      const initialMessage = await this.generateInitialMessage(userId, trigger, context, coachProfile);
      
      // Save AI message
      await this.saveMessage(conversation.id, 'ai', initialMessage.content, {
        confidence: initialMessage.confidence,
        reasoning: initialMessage.reasoning,
        knowledge_sources: initialMessage.sources
      });

      return {
        conversation,
        initialMessage: initialMessage.content
      };
    } catch (error) {
      console.error('Error starting AI conversation:', error);
      throw error;
    }
  }

  // Send a message to the AI coach and get response
  static async sendMessage(conversationId, userMessage) {
    try {
      // Get conversation context
      const conversation = await this.getConversationContext(conversationId);
      const userId = conversation.user_id;
      
      // Save user message
      await this.saveMessage(conversationId, 'user', userMessage);

      // Build conversation history for AI
      const conversationHistory = await this.buildConversationHistory(conversationId);
      
      // Get user context and data
      const userContext = await this.getUserContext(userId);
      
      // Generate AI response
      const aiResponse = await this.generateAIResponse(
        userMessage, 
        conversationHistory, 
        userContext, 
        conversation.coach_profile
      );

      // Save AI response
      await this.saveMessage(conversationId, 'ai', aiResponse.content, {
        confidence: aiResponse.confidence,
        reasoning: aiResponse.reasoning,
        knowledge_sources: aiResponse.sources,
        tokens_used: aiResponse.tokensUsed,
        processing_time_ms: aiResponse.processingTime
      });

      // Update conversation stats
      await this.updateConversationStats(conversationId);

      return aiResponse.content;
    } catch (error) {
      console.error('Error sending message to AI coach:', error);
      throw error;
    }
  }

  static async getUserCoachPreferences(userId) {
    const query = `
      SELECT uacp.*, acp.*
      FROM user_ai_coach_preferences uacp
      JOIN ai_coach_profiles acp ON acp.id = uacp.ai_coach_profile_id
      WHERE uacp.user_id = $1
      ORDER BY uacp.created_at DESC
      LIMIT 1
    `;

    const result = await this.db.query(query, [userId]);
    
    if (result.rows.length === 0) {
      // Create default preferences with default coach
      return await this.createDefaultCoachPreferences(userId);
    }

    return result.rows[0];
  }

  static async getCoachProfile(profileId) {
    const query = `SELECT * FROM ai_coach_profiles WHERE id = $1`;
    const result = await this.db.query(query, [profileId]);
    return result.rows[0];
  }

  static async generateInitialMessage(userId, trigger, context, coachProfile) {
    try {
      const userContext = await this.getUserContext(userId);
      
      // Build prompt based on trigger
      const prompt = AICoachService.buildInitialPrompt(trigger, context, userContext, coachProfile);

      const response = await this.openai.chat.completions.create({
        model: coachProfile.model_version || 'gpt-4',
        temperature: coachProfile.temperature || 0.7,
        max_tokens: coachProfile.max_response_length || 500,
        messages: [
          {
            role: 'system',
            content: this.buildSystemPrompt(coachProfile, userContext)
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return {
        content: response.choices[0].message.content,
        confidence: 0.85,
        reasoning: `Initial ${trigger} message`,
        sources: ['coach_profile', 'user_context'],
        tokensUsed: response.usage.total_tokens
      };
    } catch (error) {
      console.error('Error generating initial AI message:', error);
      throw error;
    }
  }

  static buildSystemPrompt(coachProfile, userContext) {
    return `You are ${coachProfile.coach_name}, a ${coachProfile.personality_type} flag football coach with expertise in ${coachProfile.specializations.join(', ')}.

Your coaching style is ${coachProfile.coaching_style} and you communicate in a ${coachProfile.formality_level} manner.

Key coaching principles:
${coachProfile.key_principles?.join('\n') || 'Focus on improvement and positive reinforcement'}

Player context:
- Name: ${userContext.preferred_name || userContext.first_name}
- Position: ${userContext.position}
- Experience Level: ${userContext.experience_level}
- Current Goals: ${userContext.current_goals?.join(', ') || 'General improvement'}

Communication style:
- Formality: ${coachProfile.formality_level}
- Encouragement: ${coachProfile.encouragement_frequency}
- Humor: ${coachProfile.humor_level}

Keep responses under ${coachProfile.max_response_length || 500} characters and always be encouraging while providing actionable advice.`;
  }

  static buildInitialPrompt(trigger, context) {
    const prompts = {
      'post_training': `The player just completed a training session. Their performance was ${context.performanceRating || 'good'}. Start a conversation to review the session and provide encouragement.`,
      
      'pre_game': `There's an upcoming game/competition. Help motivate the player and provide last-minute strategic advice.`,
      
      'weekly_checkin': `It's time for a weekly check-in. Ask about their progress, challenges, and goals for the upcoming week.`,
      
      'performance_concern': `The player's recent performance shows ${context.concern || 'some areas for improvement'}. Provide supportive guidance.`,
      
      'nutrition_guidance': `The player needs nutrition advice. Their current goal is ${context.nutritionGoal || 'general health'}.`,
      
      'recovery_support': `The player's recovery metrics show ${context.recoveryStatus || 'room for improvement'}. Provide recovery guidance.`,
      
      'manual_question': `The player initiated this conversation. Greet them warmly and ask how you can help with their training today.`
    };

    return prompts[trigger] || prompts['manual_question'];
  }

  static async generateAIResponse(userMessage, conversationHistory, userContext, coachProfile) {
    try {
      const startTime = Date.now();

      // Build enhanced context with recent performance data
      const enhancedContext = await this.buildEnhancedContext(userContext.user_id);

      const messages = [
        {
          role: 'system',
          content: this.buildSystemPrompt(coachProfile, userContext)
        },
        ...conversationHistory.slice(-10), // Last 10 messages for context
        {
          role: 'user',
          content: userMessage
        }
      ];

      // Add context about recent training/nutrition/recovery if relevant
      if (this.isPerformanceRelated(userMessage)) {
        messages.splice(-1, 0, {
          role: 'system',
          content: `Recent player data: ${JSON.stringify(enhancedContext)}`
        });
      }

      const response = await this.openai.chat.completions.create({
        model: coachProfile.model_version || 'gpt-4',
        temperature: coachProfile.temperature || 0.7,
        max_tokens: coachProfile.max_response_length || 500,
        messages
      });

      const processingTime = Date.now() - startTime;

      return {
        content: response.choices[0].message.content,
        confidence: 0.88,
        reasoning: 'Generated response based on conversation context and user data',
        sources: ['conversation_history', 'user_performance_data', 'coach_knowledge'],
        tokensUsed: response.usage.total_tokens,
        processingTime
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  static async getUserContext(userId) {
    const query = `
      SELECT 
        u.id, u.first_name, u.last_name, u.position, u.experience_level,
        uacp.preferred_name, uacp.communication_style, uacp.focus_areas,
        array_agg(DISTINCT g.goal_description) as current_goals
      FROM users u
      LEFT JOIN user_ai_coach_preferences uacp ON uacp.user_id = u.id
      LEFT JOIN user_goals g ON g.user_id = u.id AND g.status = 'active'
      WHERE u.id = $1
      GROUP BY u.id, u.first_name, u.last_name, u.position, u.experience_level,
               uacp.preferred_name, uacp.communication_style, uacp.focus_areas
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows[0];
  }

  static async buildEnhancedContext(userId) {
    try {
      // Get recent training performance
      const recentTraining = await this.db.query(`
        SELECT session_date, drill_type, performance_score, notes
        FROM training_sessions 
        WHERE user_id = $1 
        ORDER BY session_date DESC 
        LIMIT 3
      `, [userId]);

      // Get recent wellness data
      const recentWellness = await this.db.query(`
        SELECT metric_date, overall_wellness, energy_level, readiness_to_train
        FROM daily_wellness_metrics 
        WHERE user_id = $1 
        ORDER BY metric_date DESC 
        LIMIT 3
      `, [userId]);

      // Get nutrition compliance
      const nutritionCompliance = await this.db.query(`
        SELECT 
          date,
          (total_calories / targets.daily_calories_target * 100) as calorie_compliance
        FROM user_meals um
        LEFT JOIN user_nutrition_targets targets ON targets.user_id = um.user_id
        WHERE um.user_id = $1 AND um.date >= CURRENT_DATE - INTERVAL '7 days'
      `, [userId]);

      return {
        recent_training: recentTraining.rows,
        recent_wellness: recentWellness.rows,
        nutrition_compliance: nutritionCompliance.rows
      };
    } catch (error) {
      console.error('Error building enhanced context:', error);
      return {};
    }
  }

  static isPerformanceRelated(message) {
    const performanceKeywords = [
      'training', 'performance', 'drill', 'practice', 'game', 'nutrition',
      'recovery', 'sleep', 'tired', 'sore', 'improve', 'better', 'stats'
    ];

    return performanceKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  static async saveMessage(conversationId, senderType, messageText, metadata = {}) {
    try {
      // Get current message count for this conversation
      const countResult = await this.db.query(
        'SELECT COUNT(*) as count FROM ai_chat_messages WHERE conversation_id = $1',
        [conversationId]
      );

      const messageIndex = parseInt(countResult.rows[0].count);

      const query = `
        INSERT INTO ai_chat_messages (
          conversation_id, message_index, sender_type, message_text,
          ai_confidence, ai_reasoning, knowledge_sources, tokens_used, processing_time_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await this.db.query(query, [
        conversationId, messageIndex, senderType, messageText,
        metadata.confidence, metadata.reasoning, metadata.knowledge_sources,
        metadata.tokens_used, metadata.processing_time_ms
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  static async buildConversationHistory(conversationId) {
    const query = `
      SELECT sender_type, message_text
      FROM ai_chat_messages
      WHERE conversation_id = $1
      ORDER BY message_index ASC
    `;

    const result = await this.db.query(query, [conversationId]);

    return result.rows.map(row => ({
      role: row.sender_type === 'user' ? 'user' : 'assistant',
      content: row.message_text
    }));
  }

  static async getConversationContext(conversationId) {
    const query = `
      SELECT 
        c.*,
        acp.personality_type, acp.coaching_style, acp.specializations,
        acp.formality_level, acp.encouragement_frequency, acp.humor_level,
        acp.model_version, acp.temperature, acp.max_response_length
      FROM ai_chat_conversations c
      JOIN ai_coach_profiles acp ON acp.id = c.ai_coach_profile_id
      WHERE c.id = $1
    `;

    const result = await this.db.query(query, [conversationId]);
    return result.rows[0];
  }

  static async updateConversationStats(conversationId) {
    const query = `
      UPDATE ai_chat_conversations SET
        total_messages = (
          SELECT COUNT(*) FROM ai_chat_messages 
          WHERE conversation_id = $1
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.db.query(query, [conversationId]);
  }

  // Generate proactive coaching messages
  static async generateProactiveMessages(userId) {
    try {
      const userPrefs = await this.getUserCoachPreferences(userId);

      if (!userPrefs.proactive_messages) return [];

      const triggers = await this.identifyProactiveOpportunities(userId);
      const messages = [];

      for (const trigger of triggers) {
        const scheduledInteraction = await this.scheduleProactiveInteraction(
          userId, trigger.type, trigger.context, trigger.scheduledFor
        );
        messages.push(scheduledInteraction);
      }

      return messages;
    } catch (error) {
      console.error('Error generating proactive messages:', error);
      throw error;
    }
  }

  static async identifyProactiveOpportunities(userId) {
    const opportunities = [];

    // Check for missing wellness check-ins
    const missedWellnessQuery = `
      SELECT COUNT(*) as count
      FROM daily_wellness_metrics
      WHERE user_id = $1 AND metric_date >= CURRENT_DATE - INTERVAL '3 days'
    `;
    const missedWellness = await this.db.query(missedWellnessQuery, [userId]);
    
    if (parseInt(missedWellness.rows[0].count) === 0) {
      opportunities.push({
        type: 'wellness_checkin',
        context: { reason: 'missed_logging' },
        scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      });
    }

    // Check for upcoming games/competitions
    const upcomingGameQuery = `
      SELECT * FROM team_games 
      WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = $1)
        AND game_date BETWEEN CURRENT_DATE + INTERVAL '1 day' AND CURRENT_DATE + INTERVAL '3 days'
    `;
    const upcomingGames = await this.db.query(upcomingGameQuery, [userId]);
    
    if (upcomingGames.rows.length > 0) {
      opportunities.push({
        type: 'pre_game_motivation',
        context: { game: upcomingGames.rows[0] },
        scheduledFor: new Date(upcomingGames.rows[0].game_date.getTime() - 24 * 60 * 60 * 1000)
      });
    }

    return opportunities;
  }

  static async scheduleProactiveInteraction(userId, interactionType, context, scheduledFor) {
    const query = `
      INSERT INTO ai_coach_scheduled_interactions (
        user_id, ai_coach_profile_id, interaction_type, scheduled_for,
        trigger_conditions, personalization_data
      ) VALUES ($1, (
        SELECT ai_coach_profile_id FROM user_ai_coach_preferences 
        WHERE user_id = $1 LIMIT 1
      ), $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await this.db.query(query, [
      userId, interactionType, scheduledFor,
      JSON.stringify(context), JSON.stringify(context)
    ]);

    return result.rows[0];
  }

  static async createDefaultCoachPreferences(userId) {
    // Create default coach profile if it doesn't exist
    const defaultCoachQuery = `
      INSERT INTO ai_coach_profiles (
        coach_name, personality_type, coaching_style, specializations,
        formality_level, encouragement_frequency, humor_level
      ) VALUES (
        'Coach AI', 'supportive', 'mentor', ARRAY['general_training', 'motivation'],
        'casual', 'moderate', 'moderate'
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    let coachResult = await this.db.query(defaultCoachQuery);
    
    if (coachResult.rows.length === 0) {
      // Get existing default coach
      const existingCoachQuery = `
        SELECT id FROM ai_coach_profiles 
        WHERE coach_name = 'Coach AI' 
        LIMIT 1
      `;
      coachResult = await this.db.query(existingCoachQuery);
    }

    const coachId = coachResult.rows[0].id;

    // Create user preferences
    const prefsQuery = `
      INSERT INTO user_ai_coach_preferences (
        user_id, ai_coach_profile_id, communication_style, 
        proactive_messages, correction_style, praise_frequency
      ) VALUES ($1, $2, 'conversational', true, 'constructive', 'balanced')
      RETURNING *
    `;

    const prefsResult = await this.db.query(prefsQuery, [userId, coachId]);
    return prefsResult.rows[0];
  }

  // MCP-Enhanced AI Coach Methods

  /**
   * Get evidence-based coaching advice using Context7 documentation
   * @param {string} topic - Coaching topic (nutrition, training, recovery, etc.)
   * @param {Object} context - User context (performance data, goals, etc.)
   * @returns {Promise<Object>} Enhanced coaching advice with research backing
   */
  static async getEvidenceBasedAdvice(topic, context = {}) {
    try {
      // Initialize MCP service if not already done
      await mcpService.initialize();

      // Get relevant documentation from Context7
      let documentation = null;
      if (mcpService.getConnectionStatus().servers.context7) {
        try {
          documentation = await mcpService.searchSportsScience(topic, context.category);
        } catch (error) {
          console.warn('Context7 lookup failed, using fallback:', error.message);
        }
      }

      // Generate coaching advice
      const advice = {
        topic,
        timestamp: new Date().toISOString(),
        evidenceBased: !!documentation,
        recommendations: [],
        techniques: [],
        researchBacking: [],
        sources: []
      };

      if (documentation && !documentation.error) {
        // Use Context7 documentation
        advice.recommendations = documentation.recommendations || [];
        advice.techniques = documentation.techniques || [];
        advice.researchBacking = documentation.research || [];
        advice.sources = documentation.sources || [];
        advice.summary = documentation.summary;
      } else {
        // Use fallback coaching knowledge
        advice.recommendations = await this.getFallbackRecommendations(topic, context);
        advice.summary = `Coaching advice for ${topic} based on established best practices.`;
      }

      return advice;
    } catch (error) {
      console.error('Error getting evidence-based advice:', error);
      return {
        topic,
        error: error.message,
        fallback: true,
        recommendations: await this.getFallbackRecommendations(topic, context)
      };
    }
  }

  /**
   * Generate personalized training recommendations with research backing
   * @param {number} userId - User ID
   * @param {string} trainingType - Type of training (strength, endurance, agility, etc.)
   * @returns {Promise<Object>} Personalized training plan with documentation
   */
  static async generateTrainingRecommendations(userId, trainingType) {
    try {
      // Get user profile and performance data
      const userProfile = await this.getUserProfile(userId);
      const performanceData = await this.getRecentPerformanceData(userId);

      // Search for relevant training research
      const libraryIds = searchLibraryIds(trainingType);
      let researchData = [];

      if (mcpService.getConnectionStatus().servers.context7) {
        try {
          const researchPromises = libraryIds.slice(0, 3).map(id => 
            mcpService.getLibraryDocs(id)
          );
          const results = await Promise.allSettled(researchPromises);
          researchData = results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);
        } catch (error) {
          console.warn('Research lookup failed:', error.message);
        }
      }

      // Generate personalized recommendations
      const recommendations = {
        userId,
        trainingType,
        timestamp: new Date().toISOString(),
        personalized: true,
        evidenceBased: researchData.length > 0,
        userContext: {
          experience: userProfile?.experience_level,
          goals: userProfile?.goals,
          recentPerformance: performanceData
        },
        trainingPlan: this.generateTrainingPlan(trainingType, userProfile, researchData),
        progressionGuidelines: this.generateProgressionGuidelines(trainingType, researchData),
        safetyConsiderations: this.generateSafetyGuidelines(trainingType, userProfile, researchData),
        researchSources: researchData.map(data => data.sources || []).flat()
      };

      return recommendations;
    } catch (error) {
      console.error('Error generating training recommendations:', error);
      return { error: error.message, fallback: true };
    }
  }

  /**
   * Analyze injury risk with evidence-based assessment
   * @param {number} userId - User ID
   * @param {Object} assessmentData - Current assessment data
   * @returns {Promise<Object>} Risk analysis with prevention recommendations
   */
  static async analyzeInjuryRisk(userId, assessmentData) {
    try {
      // Get injury prevention research
      let preventionResearch = null;
      if (mcpService.getConnectionStatus().servers.context7) {
        try {
          preventionResearch = await mcpService.searchSportsScience(
            'injury prevention', 
            'injury-prevention'
          );
        } catch (error) {
          console.warn('Prevention research lookup failed:', error.message);
        }
      }

      // Analyze risk factors
      const riskAnalysis = {
        userId,
        timestamp: new Date().toISOString(),
        evidenceBased: !!preventionResearch,
        riskFactors: this.identifyRiskFactors(assessmentData),
        riskLevel: this.calculateRiskLevel(assessmentData),
        preventionStrategies: [],
        recommendedScreenings: [],
        researchBacking: []
      };

      if (preventionResearch && !preventionResearch.error) {
        riskAnalysis.preventionStrategies = preventionResearch.recommendations || [];
        riskAnalysis.recommendedScreenings = preventionResearch.techniques || [];
        riskAnalysis.researchBacking = preventionResearch.research || [];
      } else {
        // Use fallback prevention knowledge
        riskAnalysis.preventionStrategies = this.getFallbackPreventionStrategies(assessmentData);
      }

      return riskAnalysis;
    } catch (error) {
      console.error('Error analyzing injury risk:', error);
      return { error: error.message, fallback: true };
    }
  }

  // Helper methods for fallback functionality

  static async getFallbackRecommendations(topic, context) {
    const fallbackMap = {
      'nutrition': [
        'Maintain balanced macronutrient intake',
        'Time carbohydrate intake around training',
        'Ensure adequate protein for recovery',
        'Stay properly hydrated throughout the day'
      ],
      'training': [
        'Follow progressive overload principles',
        'Include adequate rest between sessions',
        'Focus on movement quality over quantity',
        'Incorporate sport-specific movements'
      ],
      'recovery': [
        'Prioritize 7-9 hours of quality sleep',
        'Use active recovery between intense sessions',
        'Consider massage or self-massage techniques',
        'Monitor training load and adjust as needed'
      ]
    };

    return fallbackMap[topic] || [
      'Consult with qualified professionals',
      'Start with basic fundamentals',
      'Progress gradually and consistently',
      'Listen to your body and adjust accordingly'
    ];
  }

  static generateTrainingPlan(trainingType, userProfile, researchData) {
    // Basic training plan structure
    return {
      duration: '4-6 weeks',
      frequency: '3-4 sessions per week',
      phases: ['preparation', 'development', 'peak', 'recovery'],
      exercises: this.getExercisesForType(trainingType),
      progressionNotes: 'Increase intensity by 5-10% weekly'
    };
  }

  static generateProgressionGuidelines(trainingType, researchData) {
    return [
      'Start with bodyweight or light resistance',
      'Master movement patterns before adding load',
      'Increase volume before intensity',
      'Allow 48-72 hours recovery between similar sessions'
    ];
  }

  static generateSafetyGuidelines(trainingType, userProfile, researchData) {
    return [
      'Always warm up thoroughly before training',
      'Use proper form and technique',
      'Stop if experiencing pain or discomfort',
      'Stay hydrated during training sessions'
    ];
  }

  static getExercisesForType(trainingType) {
    const exerciseMap = {
      'strength': ['Squats', 'Push-ups', 'Planks', 'Lunges'],
      'endurance': ['Running intervals', 'Cycling', 'Swimming', 'Circuit training'],
      'agility': ['Cone drills', 'Ladder work', 'Direction changes', 'Reactive movements'],
      'flag-football': ['Flag pulling', 'Route running', 'Cutting drills', 'Ball handling']
    };

    return exerciseMap[trainingType] || exerciseMap['strength'];
  }

  static identifyRiskFactors(assessmentData) {
    const riskFactors = [];
    
    if (assessmentData.previousInjuries) {
      riskFactors.push('History of previous injuries');
    }
    if (assessmentData.movementScreenScore < 14) {
      riskFactors.push('Movement dysfunction identified');
    }
    if (assessmentData.trainingLoad > assessmentData.fitnessLevel * 1.5) {
      riskFactors.push('Training load exceeds current fitness level');
    }
    
    return riskFactors;
  }

  static calculateRiskLevel(assessmentData) {
    let riskScore = 0;
    
    if (assessmentData.previousInjuries) riskScore += 2;
    if (assessmentData.movementScreenScore < 14) riskScore += 3;
    if (assessmentData.trainingLoad > assessmentData.fitnessLevel * 1.5) riskScore += 2;
    if (assessmentData.age > 35) riskScore += 1;
    
    if (riskScore >= 5) return 'High';
    if (riskScore >= 3) return 'Moderate';
    return 'Low';
  }

  static getFallbackPreventionStrategies(assessmentData) {
    return [
      'Implement proper warm-up and cool-down routines',
      'Focus on movement quality and technique',
      'Gradually progress training intensity and volume',
      'Include strength and flexibility training',
      'Monitor and manage training load'
    ];
  }

  // Utility methods for user data
  static async getUserProfile(userId) {
    // This would normally query the database
    return {
      experience_level: 'intermediate',
      goals: ['improve performance', 'stay healthy'],
      age: 25,
      sport: 'flag football'
    };
  }

  static async getRecentPerformanceData(userId) {
    // This would normally query performance metrics
    return {
      averageScore: 85,
      improvementTrend: 'positive',
      lastTrainingDate: new Date().toISOString()
    };
  }
}

module.exports = AICoachService;