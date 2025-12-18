/**
 * Enhanced Training AI Assistant
 * 
 * Features:
 * - Training-specific context awareness
 * - Schedule integration
 * - Real-time training data access
 * - Personalized recommendations
 * - Exercise form analysis
 * - Periodization guidance
 * - Recovery recommendations
 */

import { flagFitChatbot } from './chatbot.js';

class EnhancedTrainingAssistant {
  constructor() {
    this.chatbot = null;
    this.trainingContext = {
      currentSchedule: [],
      recentWorkouts: [],
      upcomingSessions: [],
      performanceMetrics: {},
      goals: [],
      injuries: []
    };
    this.isInitialized = false;
  }

  /**
   * Initialize the enhanced training assistant
   */
  async init() {
    if (this.isInitialized) return;

    // Load training context
    await this.loadTrainingContext();

    // Enhance chatbot with training-specific knowledge
    await this.enhanceChatbot();

    // Setup training-specific handlers
    this.setupTrainingHandlers();

    this.isInitialized = true;
    console.log('[TrainingAssistant] Enhanced training assistant initialized');
  }

  /**
   * Load training context from various sources
   */
  async loadTrainingContext() {
    try {
      // Load current schedule
      if (window.enhancedTrainingSchedule) {
        const state = window.enhancedTrainingSchedule.getState?.();
        if (state) {
          this.trainingContext.currentSchedule = state.schedule || [];
        }
      }

      // Load recent workouts
      if (window.trainingPageState) {
        const state = window.trainingPageState.getState();
        this.trainingContext.recentWorkouts = state.recentWorkouts || [];
      }

      // Load from API
      if (window.apiClient && window.API_ENDPOINTS) {
        try {
          const [scheduleRes, workoutsRes, metricsRes] = await Promise.all([
            window.apiClient.get(window.API_ENDPOINTS.training?.schedule || '/api/training/schedule'),
            window.apiClient.get(window.API_ENDPOINTS.training?.sessions || '/api/training/sessions'),
            window.apiClient.get(window.API_ENDPOINTS.training?.metrics || '/api/training/metrics')
          ]);

          if (scheduleRes?.data) {
            this.trainingContext.currentSchedule = scheduleRes.data.schedule || [];
            this.trainingContext.upcomingSessions = scheduleRes.data.upcoming || [];
          }

          if (workoutsRes?.data) {
            this.trainingContext.recentWorkouts = workoutsRes.data.sessions || [];
          }

          if (metricsRes?.data) {
            this.trainingContext.performanceMetrics = metricsRes.data;
          }
        } catch (error) {
          console.warn('[TrainingAssistant] Failed to load from API:', error);
        }
      }

      // Load user goals
      if (window.storageService) {
        this.trainingContext.goals = window.storageService.get('trainingGoals', [], { usePrefix: false });
        this.trainingContext.injuries = window.storageService.get('injuries', [], { usePrefix: false });
      }
    } catch (error) {
      console.warn('[TrainingAssistant] Failed to load training context:', error);
    }
  }

  /**
   * Enhance chatbot with training-specific knowledge
   */
  async enhanceChatbot() {
    // Get chatbot instance
    if (window.flagFitChatbot) {
      this.chatbot = window.flagFitChatbot;
    } else {
      // Import chatbot if not available
      try {
        const chatbotModule = await import('./chatbot.js');
        this.chatbot = chatbotModule.flagFitChatbot;
      } catch (error) {
        console.error('[TrainingAssistant] Failed to load chatbot:', error);
        return;
      }
    }

    // Add training-specific knowledge base
    this.addTrainingKnowledgeBase();

    // Enhance question parser with training intents
    this.enhanceQuestionParser();

    // Enhance answer generator with training context
    this.enhanceAnswerGenerator();
  }

  /**
   * Add training-specific knowledge base
   */
  addTrainingKnowledgeBase() {
    if (!this.chatbot || !this.chatbot.knowledgeBase) return;

    // Extend knowledge base with training-specific content
    this.chatbot.knowledgeBase.training_schedule = {
      keywords: ['schedule', 'calendar', 'plan', 'program', 'periodization', 'taper'],
      responses: [
        'I can help you optimize your training schedule based on your goals and upcoming events.',
        'Your current schedule includes ' + this.trainingContext.currentSchedule.length + ' planned sessions.',
        'I can analyze your schedule for conflicts and suggest improvements.'
      ]
    };

    this.chatbot.knowledgeBase.exercise_form = {
      keywords: ['form', 'technique', 'posture', 'movement', 'execution'],
      responses: [
        'Proper form is crucial for preventing injuries and maximizing performance.',
        'I can analyze your exercise form based on your training videos or descriptions.',
        'Common form issues include: improper alignment, excessive momentum, and incomplete range of motion.'
      ]
    };

    this.chatbot.knowledgeBase.periodization = {
      keywords: ['periodization', 'taper', 'peak', 'overload', 'recovery', 'deload'],
      responses: [
        'Periodization involves structuring training into phases: base, strength, power, and peak.',
        'Tapering typically involves 7-14 days of reduced volume (40-60%) while maintaining intensity (80-90%).',
        'I can help you plan periodization based on your competition schedule.'
      ]
    };
  }

  /**
   * Enhance question parser with training intents
   */
  enhanceQuestionParser() {
    if (!this.chatbot || !this.chatbot.parseQuestion) return;

    const originalParse = this.chatbot.parseQuestion.bind(this.chatbot);

    this.chatbot.parseQuestion = (question) => {
      const parsed = originalParse(question);

      // Add training-specific intents
      if (this.isScheduleQuestion(question)) {
        parsed.intent = 'schedule_query';
        parsed.context = 'training_schedule';
      } else if (this.isFormQuestion(question)) {
        parsed.intent = 'form_analysis';
        parsed.context = 'exercise_form';
      } else if (this.isPeriodizationQuestion(question)) {
        parsed.intent = 'periodization_guidance';
        parsed.context = 'periodization';
      } else if (this.isRecoveryQuestion(question)) {
        parsed.intent = 'recovery_recommendation';
        parsed.context = 'recovery';
      }

      return parsed;
    };
  }

  /**
   * Enhance answer generator with training context
   */
  enhanceAnswerGenerator() {
    if (!this.chatbot || !this.chatbot.generateAnswer) return;

    const originalGenerate = this.chatbot.generateAnswer.bind(this.chatbot);

    this.chatbot.generateAnswer = async (question, parsed) => {
      // Add training context to parsed question
      parsed.trainingContext = this.trainingContext;

      // Generate base answer
      let answer = await originalGenerate(question, parsed);

      // Enhance with training-specific information
      if (parsed.intent === 'schedule_query') {
        answer = this.enhanceScheduleAnswer(answer, parsed);
      } else if (parsed.intent === 'form_analysis') {
        answer = this.enhanceFormAnswer(answer, parsed);
      } else if (parsed.intent === 'periodization_guidance') {
        answer = this.enhancePeriodizationAnswer(answer, parsed);
      } else if (parsed.intent === 'recovery_recommendation') {
        answer = this.enhanceRecoveryAnswer(answer, parsed);
      }

      return answer;
    };
  }

  /**
   * Check if question is about schedule
   */
  isScheduleQuestion(question) {
    const scheduleKeywords = ['schedule', 'calendar', 'plan', 'when', 'what day', 'upcoming'];
    return scheduleKeywords.some(keyword => 
      question.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if question is about form
   */
  isFormQuestion(question) {
    const formKeywords = ['form', 'technique', 'posture', 'how to', 'proper', 'correct'];
    return formKeywords.some(keyword => 
      question.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if question is about periodization
   */
  isPeriodizationQuestion(question) {
    const periodizationKeywords = ['periodization', 'taper', 'peak', 'overload', 'deload'];
    return periodizationKeywords.some(keyword => 
      question.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if question is about recovery
   */
  isRecoveryQuestion(question) {
    const recoveryKeywords = ['recovery', 'rest', 'rest day', 'recover', 'fatigue'];
    return recoveryKeywords.some(keyword => 
      question.toLowerCase().includes(keyword)
    );
  }

  /**
   * Enhance schedule-related answers
   */
  enhanceScheduleAnswer(baseAnswer, parsed) {
    const upcomingCount = this.trainingContext.upcomingSessions.length;
    const scheduleCount = this.trainingContext.currentSchedule.length;

    let enhanced = baseAnswer;

    if (upcomingCount > 0) {
      enhanced += `\n\n**Your Upcoming Sessions:**\n`;
      this.trainingContext.upcomingSessions.slice(0, 5).forEach(session => {
        const date = new Date(session.date);
        enhanced += `- ${date.toLocaleDateString()}: ${session.title || session.name}\n`;
      });
    }

    if (scheduleCount > 0) {
      enhanced += `\n\nYou have ${scheduleCount} sessions planned. `;
      enhanced += `I can help you optimize your schedule or resolve any conflicts.`;
    }

    return enhanced;
  }

  /**
   * Enhance form-related answers
   */
  enhanceFormAnswer(baseAnswer, parsed) {
    let enhanced = baseAnswer;

    // Add form tips based on recent workouts
    if (this.trainingContext.recentWorkouts.length > 0) {
      enhanced += `\n\n**Based on your recent training:**\n`;
      enhanced += `I can analyze your exercise form if you share videos or describe your technique. `;
      enhanced += `Common areas to focus on: proper alignment, controlled movement, and full range of motion.`;
    }

    return enhanced;
  }

  /**
   * Enhance periodization answers
   */
  enhancePeriodizationAnswer(baseAnswer, parsed) {
    let enhanced = baseAnswer;

    // Add periodization recommendations based on schedule
    if (this.trainingContext.upcomingSessions.length > 0) {
      const nextEvent = this.trainingContext.upcomingSessions[0];
      const daysUntil = Math.ceil(
        (new Date(nextEvent.date) - new Date()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntil <= 14 && daysUntil > 0) {
        enhanced += `\n\n**Tapering Recommendation:**\n`;
        enhanced += `You have ${daysUntil} days until your next event. `;
        enhanced += `Consider reducing training volume by 40-60% while maintaining intensity at 80-90%. `;
        enhanced += `Focus on skill work and light activation sessions.`;
      }
    }

    return enhanced;
  }

  /**
   * Enhance recovery answers
   */
  enhanceRecoveryAnswer(baseAnswer, parsed) {
    let enhanced = baseAnswer;

    // Analyze recent training load
    const recentLoad = this.calculateRecentTrainingLoad();
    if (recentLoad > 0) {
      enhanced += `\n\n**Your Recent Training Load:**\n`;
      enhanced += `Based on your recent workouts, your training load is ${recentLoad.toFixed(1)}. `;
      
      if (recentLoad > 0.7) {
        enhanced += `Consider a recovery day or light session to prevent overtraining.`;
      } else if (recentLoad < 0.3) {
        enhanced += `You have room to increase training intensity if you're feeling recovered.`;
      } else {
        enhanced += `Your training load looks balanced. Continue monitoring recovery.`;
      }
    }

    return enhanced;
  }

  /**
   * Calculate recent training load
   */
  calculateRecentTrainingLoad() {
    if (this.trainingContext.recentWorkouts.length === 0) return 0;

    const last7Days = this.trainingContext.recentWorkouts.filter(workout => {
      const workoutDate = new Date(workout.date || workout.created_at);
      const daysAgo = (new Date() - workoutDate) / (1000 * 60 * 60 * 24);
      return daysAgo <= 7;
    });

    // Simple load calculation (can be enhanced)
    const totalDuration = last7Days.reduce((sum, workout) => {
      return sum + (workout.duration || 60);
    }, 0);

    // Normalize to 0-1 scale (assuming max 10 hours/week = 600 min)
    return Math.min(totalDuration / 600, 1);
  }

  /**
   * Setup training-specific handlers
   */
  setupTrainingHandlers() {
    // Add custom commands
    this.addCustomCommands();
  }

  /**
   * Add custom commands
   */
  addCustomCommands() {
    if (!this.chatbot) return;

    // Add "show schedule" command
    this.chatbot.addCommand?.('show schedule', () => {
      return this.getScheduleSummary();
    });

    // Add "analyze form" command
    this.chatbot.addCommand?.('analyze form', (exercise) => {
      return this.analyzeExerciseForm(exercise);
    });

    // Add "recovery status" command
    this.chatbot.addCommand?.('recovery status', () => {
      return this.getRecoveryStatus();
    });
  }

  /**
   * Get schedule summary
   */
  getScheduleSummary() {
    const schedule = this.trainingContext.currentSchedule;
    const upcoming = this.trainingContext.upcomingSessions;

    let summary = `**Your Training Schedule:**\n\n`;
    summary += `- Total planned sessions: ${schedule.length}\n`;
    summary += `- Upcoming sessions: ${upcoming.length}\n`;

    if (upcoming.length > 0) {
      summary += `\n**Next 3 Sessions:**\n`;
      upcoming.slice(0, 3).forEach(session => {
        const date = new Date(session.date);
        summary += `- ${date.toLocaleDateString()}: ${session.title || session.name}\n`;
      });
    }

    return summary;
  }

  /**
   * Analyze exercise form
   */
  analyzeExerciseForm(exercise) {
    // Placeholder for form analysis
    return `**Form Analysis for ${exercise}:**\n\nI can help analyze your form. ` +
           `Please describe your current technique or share a video for detailed feedback.`;
  }

  /**
   * Get recovery status
   */
  getRecoveryStatus() {
    const load = this.calculateRecentTrainingLoad();
    const recentWorkouts = this.trainingContext.recentWorkouts.filter(w => {
      const date = new Date(w.date || w.created_at);
      return (new Date() - date) / (1000 * 60 * 60 * 24) <= 7;
    });

    let status = `**Recovery Status:**\n\n`;
    status += `- Training load (last 7 days): ${(load * 100).toFixed(0)}%\n`;
    status += `- Sessions completed: ${recentWorkouts.length}\n`;

    if (load > 0.7) {
      status += `\n⚠️ **High training load detected.** Consider a recovery day.`;
    } else if (load < 0.3) {
      status += `\n✅ **Low training load.** You're well-recovered.`;
    } else {
      status += `\n✅ **Moderate training load.** Continue monitoring.`;
    }

    return status;
  }

  /**
   * Open assistant with training context
   */
  async open() {
    // Refresh training context
    await this.loadTrainingContext();

    // Open chatbot
    if (this.chatbot && this.chatbot.open) {
      this.chatbot.open();
    } else if (window.flagFitChatbot && window.flagFitChatbot.open) {
      window.flagFitChatbot.open();
    }
  }

  /**
   * Update training context
   */
  updateContext(updates) {
    this.trainingContext = { ...this.trainingContext, ...updates };
  }
}

// Create singleton instance
const enhancedTrainingAssistant = new EnhancedTrainingAssistant();

// Make available globally
window.enhancedTrainingAssistant = enhancedTrainingAssistant;

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    enhancedTrainingAssistant.init();
  });
} else {
  enhancedTrainingAssistant.init();
}

export default enhancedTrainingAssistant;

