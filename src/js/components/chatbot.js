import { logger } from '../../logger.js';
import { setSafeContent } from '../utils/shared.js';
import { knowledgeBase, questionPools } from './chatbot-knowledge.js';


// FlagFit AI Chatbot Component
// Provides intelligent responses about sports psychology, nutrition, speed training, injuries, recovery, etc.

class FlagFitChatbot {
  constructor() {
    this.messages = [];
    this.knowledgeBase = knowledgeBase;
    this.modal = null;
    this.askedQuestions = {
      psychology: [],
      nutrition: [],
      speed: [],
      injury: [],
      recovery: [],
    };
    this.questionPools = questionPools;
    this.storageKey = "chatbot_messages";
    this.conversationContext = []; // Store conversation context for better responses
    this.timeoutDuration = 30000; // 30 seconds timeout
    this.storageService = null; // Will be loaded lazily
    this.userContext = null; // User context for role-aware responses
    this.roleAwareGenerator = null; // Role-aware response generator
    this.personalizationService = null; // Personalization service for profile data
  }

  async open() {
    // Load user context for role-aware responses
    if (!this.userContext) {
      await this.loadUserContext();
    }

    if (this.modal) {
      this.modal.classList.add("open");
      this.modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      await this.loadConversationHistory();
      this.focusInput();
      return;
    }

    this.createModal();
    this.modal.classList.add("open");
    this.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    await this.loadConversationHistory();
    this.focusInput();
  }

  async createModal() {
    const modal = document.createElement("div");
    modal.className = "chatbot-modal-overlay";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "chatbot-title");
    modal.setAttribute("aria-hidden", "true");

    setSafeContent(modal, `
      <div class="chatbot-modal-content">
        <div class="chatbot-header">
          <div class="chatbot-header-info">
            <div class="chatbot-avatar">🤖</div>
            <div>
              <h2 id="chatbot-title" class="chatbot-title">FlagFit AI Assistant</h2>
              <p class="chatbot-subtitle">Ask me about training, nutrition, psychology, injuries & more</p>
            </div>
          </div>
          <div class="chatbot-header-actions">
            <button 
              class="chatbot-clear-history" 
              aria-label="Clear conversation history" 
              type="button"
              title="Clear conversation history"
            >
              <i data-lucide="trash-2" class="icon-18"></i>
            </button>
            <button class="chatbot-close" aria-label="Close chatbot" type="button">
              <i data-lucide="x" class="icon-20"></i>
            </button>
          </div>
        </div>

        <div class="chatbot-messages" id="chatbot-messages" role="log" aria-live="polite">
          <div class="chatbot-message bot-message">
            <div class="message-avatar">🤖</div>
            <div class="message-content">
              <div class="message-text">
                👋 Hello! I'm your FlagFit AI Assistant. I can help you with:
                <ul style="margin: 8px 0 0 20px; padding-left: 0;">
                  <li>Sports psychology & mental training</li>
                  <li>Nutrition & supplements</li>
                  <li>Speed & agility development</li>
                  <li>Injury prevention & treatment</li>
                  <li>Recovery strategies</li>
                  <li>Training programs</li>
                </ul>
                <br>
                What would you like to know?
              </div>
            </div>
          </div>
        </div>

        <div class="chatbot-input-container">
          <div class="chatbot-input-wrapper">
            <textarea
              id="chatbot-input"
              class="chatbot-input"
              placeholder="Ask me anything about training, nutrition, psychology..."
              rows="1"
              aria-label="Chatbot input"
            ></textarea>
            <button
              id="chatbot-send"
              class="chatbot-send-btn"
              type="button"
              aria-label="Send message"
              disabled
            >
              <i data-lucide="send" class="icon-18"></i>
            </button>
          </div>
          <div class="chatbot-quick-actions">
            <button class="chatbot-quick-btn" data-topic="psychology">🧠 Psychology</button>
            <button class="chatbot-quick-btn" data-topic="nutrition">🍎 Nutrition</button>
            <button class="chatbot-quick-btn" data-topic="speed">⚡ Speed</button>
            <button class="chatbot-quick-btn" data-topic="injury">🩹 Injuries</button>
            <button class="chatbot-quick-btn" data-topic="recovery">💤 Recovery</button>
          </div>
        </div>
      </div>
    `, true, true);

    document.body.appendChild(modal);
    this.modal = modal;

    // Initialize Lucide icons (wait a bit for them to be available)
    setTimeout(() => {
      if (typeof lucide !== "undefined" && lucide.createIcons) {
        lucide.createIcons(modal);
      } else if (window.lucide && window.lucide.createIcons) {
        window.lucide.createIcons(modal);
      }
    }, 100);

    // Initialize storage service
    await this.initStorageService();

    // Add welcome message only if no messages exist
    const hasHistory = await this.loadConversationHistory();
    if (!hasHistory) {
      this.messages.push({
        type: "bot",
        text: "👋 Hello! I'm your FlagFit AI Assistant. I can help you with sports psychology, nutrition, speed training, injuries, recovery, and more. What would you like to know?",
        timestamp: new Date(),
      });
      this.saveMessages();
    }

    this.setupEventListeners();
  }

  async initStorageService() {
    try {
      const { storageService } =
        await import("../services/storage-service-unified.js");
      this.storageService = storageService;
    } catch (error) {
      logger.warn(
        "Storage service unavailable, using localStorage directly:",
        error,
      );
      // Fallback to direct localStorage
      this.storageService = {
        get: (key, defaultValue) => {
          try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
          } catch {
            return defaultValue;
          }
        },
        set: (key, data) => {
          try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
          } catch {
            return false;
          }
        },
        remove: (key) => {
          try {
            localStorage.removeItem(key);
            return true;
          } catch {
            return false;
          }
        },
      };
    }
  }

  /**
   * Load user context for role-aware responses
   */
  async loadUserContext() {
    try {
      // Get auth token from storage or session
      const authToken = this.getAuthToken();

      if (!authToken) {
        // No auth token - use default context
        this.userContext = {
          role: "player",
          teamType: "domestic",
          position: null,
          expertiseLevel: "intermediate",
        };
        await this.initializeRoleAwareGenerator();
        return this.userContext;
      }

      // Fetch user context from API
      const response = await fetch("/.netlify/functions/user-context", {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          this.userContext = {
            userId: result.data.userId, // Store userId for personalization service
            role: result.data.role || "player",
            teamType: result.data.teamType || "domestic",
            position: result.data.position || null,
            expertiseLevel: result.data.expertiseLevel || "intermediate",
            totalQueries: result.data.totalQueries || 0,
            preferredTopics: result.data.preferredTopics || [],
            heightCm: result.data.heightCm,
            weightKg: result.data.weightKg,
            experienceLevel: result.data.experienceLevel,
          };
          await this.initializeRoleAwareGenerator();
          await this.initializePersonalizationService();
          return this.userContext;
        }
      }
    } catch (error) {
      logger.warn("Failed to load user context:", error);
    }

    // Fallback: use default context
    this.userContext = {
      role: "player",
      teamType: "domestic",
      position: null,
      expertiseLevel: "intermediate",
    };
    await this.initializeRoleAwareGenerator();

    // Initialize personalization service
    await this.initializePersonalizationService();

    return this.userContext;
  }

  /**
   * Initialize personalization service
   */
  async initializePersonalizationService() {
    try {
      // Get userId from userContext or auth
      let userId = null;

      if (this.userContext && this.userContext.userId) {
        userId = this.userContext.userId;
      } else {
        // Try to get from auth token
        const authToken = this.getAuthToken();
        if (authToken) {
          // Extract userId from token or fetch from API
          // For now, we'll get it from user-context API
          try {
            const response = await fetch("/.netlify/functions/user-context", {
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            });
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data && result.data.userId) {
                userId = result.data.userId;
              }
            }
          } catch (error) {
            logger.debug("Could not get userId for personalization:", error);
          }
        }
      }

      if (userId) {
        const { PersonalizationService } =
          await import("../services/personalization-service.js");
        this.personalizationService = new PersonalizationService(userId);
      }
    } catch (error) {
      logger.warn("Failed to initialize personalization service:", error);
      this.personalizationService = null;
    }
  }

  /**
   * Initialize role-aware response generator
   */
  async initializeRoleAwareGenerator() {
    try {
      // Dynamically import role-aware generator
      const module = await import("../utils/role-aware-response-generator.js");
      const { RoleAwareResponseGenerator } = module;
      this.roleAwareGenerator = new RoleAwareResponseGenerator(
        this.userContext,
      );
    } catch (error) {
      logger.warn("Role-aware generator unavailable:", error);
      this.roleAwareGenerator = null;
    }
  }

  /**
   * Get auth token from storage
   */
  getAuthToken() {
    try {
      // Try to get from localStorage
      const authData = localStorage.getItem("auth");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.token || parsed.access_token || null;
      }

      // Try to get from sessionStorage
      const sessionAuth = sessionStorage.getItem("auth");
      if (sessionAuth) {
        const parsed = JSON.parse(sessionAuth);
        return parsed.token || parsed.access_token || null;
      }

      // Try to get from window if available
      if (window.auth && window.auth.token) {
        return window.auth.token;
      }

      return null;
    } catch (error) {
      logger.debug("Error getting auth token:", error);
      return null;
    }
  }

  /**
   * Update chatbot query statistics
   */
  async updateQueryStats(topic) {
    if (!this.userContext || !this.getAuthToken()) {
      return; // Skip if no user context or auth
    }

    try {
      const authToken = this.getAuthToken();
      await fetch("/.netlify/functions/update-chatbot-stats", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      });
    } catch (error) {
      logger.debug("Failed to update query stats:", error);
      // Non-critical, continue silently
    }
  }

  async loadConversationHistory() {
    if (!this.storageService) {
      await this.initStorageService();
    }

    try {
      const storedMessages = this.storageService.get(this.storageKey, []);
      if (storedMessages && storedMessages.length > 0) {
        // Filter out welcome message if it exists
        const filteredMessages = storedMessages.filter(
          (msg) => !msg.isWelcomeMessage,
        );

        if (filteredMessages.length > 0) {
          this.messages = filteredMessages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));

          // Render messages to UI
          const messagesContainer = document.getElementById("chatbot-messages");
          if (messagesContainer) {
            // Clear existing messages except welcome
            const existingMessages =
              messagesContainer.querySelectorAll(".chatbot-message");
            existingMessages.forEach((msg, index) => {
              if (index > 0) {msg.remove();} // Keep welcome message
            });

            // Render stored messages
            this.messages.forEach((msg) => {
              if (!msg.isWelcomeMessage) {
                this.renderMessage(msg.type, msg.text, false);
              }
            });
          }

          return true;
        }
      }
    } catch (error) {
      logger.error("Failed to load conversation history:", error);
    }

    return false;
  }

  saveMessages() {
    if (!this.storageService) {
      return;
    }

    try {
      // Keep only last 100 messages to prevent storage bloat
      const messagesToSave = this.messages.slice(-100).map((msg) => ({
        type: msg.type,
        text: msg.text,
        timestamp:
          msg.timestamp instanceof Date
            ? msg.timestamp.toISOString()
            : msg.timestamp,
        isWelcomeMessage: msg.isWelcomeMessage || false,
      }));

      this.storageService.set(this.storageKey, messagesToSave);
    } catch (error) {
      logger.error("Failed to save messages:", error);
    }
  }

  clearConversationHistory() {
    this.messages = [];
    if (this.storageService) {
      this.storageService.remove(this.storageKey);
    }

    // Clear UI
    const messagesContainer = document.getElementById("chatbot-messages");
    if (messagesContainer) {
      setSafeContent(messagesContainer, `
        <div class="chatbot-message bot-message">
          <div class="message-avatar">🤖</div>
          <div class="message-content">
            <div class="message-text">
              👋 Hello! I'm your FlagFit AI Assistant. I can help you with:
              <ul style="margin: 8px 0 0 20px; padding-left: 0;">
                <li>Sports psychology & mental training</li>
                <li>Nutrition & supplements</li>
                <li>Speed & agility development</li>
                <li>Injury prevention & treatment</li>
                <li>Recovery strategies</li>
                <li>Training programs</li>
              </ul>
              <br>
              What would you like to know?
            </div>
          </div>
        </div>
      `, true, true);
    }

    // Reset conversation context
    this.conversationContext = [];
  }

  setupEventListeners() {
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");
    const closeBtn = this.modal.querySelector(".chatbot-close");
    const clearHistoryBtn = this.modal.querySelector(".chatbot-clear-history");
    const quickBtns = this.modal.querySelectorAll(".chatbot-quick-btn");

    // Input handling
    input.addEventListener("input", (e) => {
      sendBtn.disabled = !e.target.value.trim();

      // Auto-resize textarea
      e.target.style.height = "auto";
      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)  }px`;
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!sendBtn.disabled) {
          this.sendMessage();
        }
      }
    });

    // Send button
    sendBtn.addEventListener("click", () => this.sendMessage());

    // Close button
    closeBtn.addEventListener("click", () => this.close());

    // Clear history button
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener("click", () => {
        // Use a non-blocking confirmation approach if possible, but keep simple for legacy
        if (
          window.confirm(
            "Are you sure you want to clear the conversation history? This cannot be undone.",
          )
        ) {
          this.clearConversationHistory();
        }
      });
    }

    // Overlay click to close
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Escape key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("open")) {
        this.close();
      }
    });

    // Quick action buttons
    quickBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const {topic} = btn.dataset;
        this.handleQuickAction(topic);
      });
    });
  }

  handleQuickAction(topic) {
    const pool = this.questionPools[topic] || [];
    const asked = this.askedQuestions[topic] || [];

    // If all questions have been asked, reset the pool
    if (asked.length >= pool.length) {
      this.askedQuestions[topic] = [];
    }

    // Get questions that haven't been asked yet
    const availableQuestions = pool.filter((q) => !asked.includes(q));

    // Select a random question from available ones
    let selectedQuestion;
    if (availableQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      selectedQuestion = availableQuestions[randomIndex];
    } else {
      // Fallback: select random from all questions
      const randomIndex = Math.floor(Math.random() * pool.length);
      selectedQuestion = pool[randomIndex];
      this.askedQuestions[topic] = []; // Reset if we've exhausted all
    }

    // Mark this question as asked
    if (!this.askedQuestions[topic].includes(selectedQuestion)) {
      this.askedQuestions[topic].push(selectedQuestion);
    }

    const input = document.getElementById("chatbot-input");
    input.value = selectedQuestion || `Tell me about ${topic}`;
    input.dispatchEvent(new Event("input"));
    this.sendMessage();
  }

  async sendMessage() {
    const input = document.getElementById("chatbot-input");
    const message = input.value.trim();

    if (!message) {
      return;
    }

    // Add user message
    this.addMessage("user", message);

    // Add to conversation context
    this.conversationContext.push({ role: "user", content: message });

    // Keep context to last 10 messages to prevent bloat
    if (this.conversationContext.length > 20) {
      this.conversationContext = this.conversationContext.slice(-20);
    }

    input.value = "";
    input.style.height = "auto";
    const sendBtn = document.getElementById("chatbot-send");
    if (sendBtn) {
      sendBtn.disabled = true;
    }

    // Show typing indicator with progress
    this.showTypingIndicator();
    const progressInterval = this.showProgressIndicator();

    // Get response (now async) - ensure we always get a response
    try {
      const response = await Promise.race([
        this.getResponse(message),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout")), this.timeoutDuration);
        }),
      ]);

      clearInterval(progressInterval);
      this.hideTypingIndicator();

      if (response && typeof response === "string" && response.trim()) {
        this.addMessage("bot", response);
        this.conversationContext.push({ role: "assistant", content: response });
      } else {
        // Fallback if response is empty
        const fallbackResponse = await this.getLocalResponse(
          null,
          message,
          message.toLowerCase(),
        );
        this.addMessage("bot", fallbackResponse);
        this.conversationContext.push({
          role: "assistant",
          content: fallbackResponse,
        });
      }
    } catch (error) {
      clearInterval(progressInterval);
      logger.error("Error getting response:", error);
      this.hideTypingIndicator();

      // Show user-friendly error message
      let errorMessage = "";
      if (error.message === "Timeout") {
        errorMessage =
          "⏱️ This question is taking longer than expected. Let me try a simpler approach...";
        this.showErrorMessage(errorMessage);

        // Try fallback with shorter timeout
        try {
          const fallbackResponse = await Promise.race([
            this.getLocalResponse(null, message, message.toLowerCase()),
            new Promise((_, reject) => {
              setTimeout(() => reject(new Error("Timeout")), 5000);
            }),
          ]);
          this.hideErrorMessage();
          this.addMessage("bot", fallbackResponse);
          this.conversationContext.push({
            role: "assistant",
            content: fallbackResponse,
          });
        } catch (_fallbackError) {
          this.hideErrorMessage();
          this.showErrorMessage(
            "I'm having trouble processing your question. Please try rephrasing it or ask about a different topic.",
          );
        }
      } else {
        errorMessage =
          "⚠️ I encountered an issue processing your question. Let me try again...";
        this.showErrorMessage(errorMessage);

        // Always provide a helpful fallback response
        try {
          const fallbackResponse = await this.getLocalResponse(
            null,
            message,
            message.toLowerCase(),
          );
          this.hideErrorMessage();
          this.addMessage("bot", fallbackResponse);
          this.conversationContext.push({
            role: "assistant",
            content: fallbackResponse,
          });
        } catch (fallbackError) {
          logger.error("Fallback also failed:", fallbackError);
          this.hideErrorMessage();
          this.addMessage(
            "bot",
            "I apologize, but I'm having trouble processing your question right now. I can help with:\n• Sports psychology & mental training\n• Nutrition & supplements\n• Speed & agility development\n• Injury prevention & treatment\n• Recovery strategies\n• Training programs\n\nCould you try rephrasing your question?",
          );
        }
      }
    } finally {
      if (sendBtn) {
        sendBtn.disabled = false;
      }
    }
  }

  showProgressIndicator() {
    const messagesContainer = document.getElementById("chatbot-messages");
    if (!messagesContainer) {return null;}

    const progressBar = document.createElement("div");
    progressBar.className = "chatbot-progress-bar";
    progressBar.id = "chatbot-progress";
    setSafeContent(progressBar, '<div class="chatbot-progress-fill"></div>', true, true);

    const typingIndicator = document.getElementById("typing-indicator");
    if (typingIndicator) {
      typingIndicator.appendChild(progressBar);
    }

    // Animate progress bar
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2; // Increase by 2% every ~600ms (30s total)
      if (progress > 95) {progress = 95;} // Cap at 95%

      const fill = progressBar.querySelector(".chatbot-progress-fill");
      if (fill) {
        fill.style.width = `${progress}%`;
      }
    }, 600);

    return interval;
  }

  showErrorMessage(message) {
    const messagesContainer = document.getElementById("chatbot-messages");
    if (!messagesContainer) {return;}

    // Remove existing error message if any
    const existingError = document.getElementById("chatbot-error-message");
    if (existingError) {
      existingError.remove();
    }

    const errorDiv = document.createElement("div");
    errorDiv.id = "chatbot-error-message";
    errorDiv.className = "chatbot-error-message";
    errorDiv.setAttribute("role", "alert");
    setSafeContent(errorDiv, `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-text">${this.escapeHtml(message)}</span>
      </div>
    `, true, true);

    messagesContainer.appendChild(errorDiv);
    this.scrollToBottom();
  }

  hideErrorMessage() {
    const errorMessage = document.getElementById("chatbot-error-message");
    if (errorMessage) {
      errorMessage.remove();
    }
  }

  async getResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    // Parse the question intelligently
    let parsedQuestion = null;
    let knowledgeEntry = null;
    let articles = [];

    // Note: Conversation context is available via this.conversationContext.slice(-4)
    // for future use in context-aware parsing

    try {
      // Import question parser and answer generator
      let questionParser, answerGenerator;
      try {
        const parserModule = await import("../utils/question-parser.js");
        questionParser =
          parserModule.questionParser || new parserModule.QuestionParser();

        const generatorModule = await import("../utils/answer-generator.js");
        answerGenerator =
          generatorModule.answerGenerator ||
          new generatorModule.AnswerGenerator();

        // Parse the question
        parsedQuestion = questionParser.parse(userMessage);

        // Enrich question with user profile data (body metrics, injuries, training schedule)
        if (this.personalizationService) {
          parsedQuestion =
            await this.personalizationService.enrichQuestion(parsedQuestion);
        }
      } catch (parseError) {
        logger.debug(
          "Question parser unavailable, using simple parsing:",
          parseError,
        );
        // Create simple parsed question
        parsedQuestion = {
          intent: this.detectSimpleIntent(lowerMessage),
          entities: this.extractSimpleEntities(lowerMessage, userMessage),
          original: userMessage,
        };
        questionParser = null;
        answerGenerator = null;
      }

      // Try knowledge base first (if available)
      try {
        const { knowledgeBaseService } =
          await import("../services/knowledge-base-service.js");

        // Search knowledge base with governance filters
        // By default, only show approved entries with quality scores
        knowledgeEntry = await knowledgeBaseService.searchKnowledgeBase(
          userMessage,
          parsedQuestion.entities?.supplements?.[0]
            ? "supplement"
            : parsedQuestion.entities?.injuries?.[0]
              ? "injury"
              : parsedQuestion.entities?.recovery?.[0]
                ? "recovery_method"
                : parsedQuestion.entities?.training?.[0]
                  ? "training_method"
                  : parsedQuestion.entities?.psychology?.[0]
                    ? "psychology"
                    : null,
          {
            requireApproval: true, // Only approved entries
            includeExperimental: false, // Exclude experimental
            minQualityScore: 0.3, // Minimum quality score (30%)
          },
        );

        // If no knowledge entry, search articles
        if (!knowledgeEntry) {
          articles = await knowledgeBaseService.searchArticles(userMessage, [
            ...(parsedQuestion.entities?.supplements || []),
            ...(parsedQuestion.entities?.injuries || []),
            ...(parsedQuestion.entities?.recovery || []),
            ...(parsedQuestion.entities?.training || []),
            ...(parsedQuestion.entities?.psychology || []),
          ]);
        }

        // Generate intelligent answer if we have parser and generator
        if (answerGenerator && (knowledgeEntry || articles.length > 0)) {
          let answer = answerGenerator.generateAnswer(
            parsedQuestion,
            knowledgeEntry,
            articles,
          );

          // Enhance the answer
          try {
            const { responseEnhancer } =
              await import("../utils/response-enhancer.js");
            answer = responseEnhancer.enhanceResponse(answer, userMessage, {
              isFirstMessage: this.messages.length === 0,
            });

            // Add disclaimers if needed
            const topic =
              parsedQuestion.entities?.supplements?.[0] ||
              parsedQuestion.entities?.injuries?.[0] ||
              parsedQuestion.entities?.recovery?.[0] ||
              "";
            answer = responseEnhancer.addDisclaimers(answer, topic);

            // Add evidence indicators if knowledge entry available
            if (knowledgeEntry) {
              answer = responseEnhancer.addEvidenceIndicators(
                answer,
                knowledgeEntry,
              );
            }
          } catch {
            // Continue without enhancement if unavailable
          }

          // Apply role-aware adjustments
          if (this.roleAwareGenerator) {
            answer = this.roleAwareGenerator.adjustForRole(
              answer,
              parsedQuestion,
            );

            // Add position-specific advice if available
            if (this.userContext?.position) {
              const positionAdvice =
                this.roleAwareGenerator.getPositionSpecificAdvice(
                  this.userContext.position,
                  parsedQuestion.intent,
                  parsedQuestion.entities,
                );
              if (positionAdvice) {
                answer += positionAdvice;
              }
            }
          }

          // Apply personalized recommendations (injury-aware, schedule-aware, body metrics)
          if (this.personalizationService) {
            answer =
              this.personalizationService.generatePersonalizedRecommendations(
                parsedQuestion,
                answer,
              );
          }

          // Update query statistics (async, non-blocking)
          const detectedTopic =
            parsedQuestion.entities?.supplements?.[0] ||
            parsedQuestion.entities?.injuries?.[0] ||
            parsedQuestion.entities?.recovery?.[0] ||
            parsedQuestion.entities?.training?.[0] ||
            parsedQuestion.entities?.psychology?.[0] ||
            "general";
          this.updateQueryStats(detectedTopic).catch((error) => {
            logger.warn("[Chatbot] Failed to update query stats (non-critical):", error);
          });

          return answer;
        }
      } catch (error) {
        logger.debug(
          "Knowledge base service unavailable, using local knowledge:",
          error,
        );
      }

      // Fallback to local knowledge with intelligent parsing
      let localResponse = await this.getLocalResponse(
        parsedQuestion,
        userMessage,
        lowerMessage,
      );

      // Apply role-aware adjustments to local response
      if (this.roleAwareGenerator && parsedQuestion) {
        localResponse = this.roleAwareGenerator.adjustForRole(
          localResponse,
          parsedQuestion,
        );

        // Add position-specific advice if available
        if (this.userContext?.position) {
          const positionAdvice =
            this.roleAwareGenerator.getPositionSpecificAdvice(
              this.userContext.position,
              parsedQuestion.intent,
              parsedQuestion.entities,
            );
          if (positionAdvice) {
            localResponse += positionAdvice;
          }
        }
      }

      // Apply personalized recommendations to local response
      if (this.personalizationService && parsedQuestion) {
        localResponse =
          this.personalizationService.generatePersonalizedRecommendations(
            parsedQuestion,
            localResponse,
          );
      }

      // Update query statistics (async, non-blocking)
      const detectedTopic =
        parsedQuestion?.entities?.supplements?.[0] ||
        parsedQuestion?.entities?.injuries?.[0] ||
        parsedQuestion?.entities?.recovery?.[0] ||
        parsedQuestion?.entities?.training?.[0] ||
        parsedQuestion?.entities?.psychology?.[0] ||
        "general";
      this.updateQueryStats(detectedTopic).catch((error) => {
        logger.warn("[Chatbot] Failed to update query stats (non-critical):", error);
      });

      return localResponse;
    } catch (error) {
      logger.error("Error in intelligent response:", error);
      // Ultimate fallback - always return a helpful response
      try {
        return await this.getLocalResponse(null, userMessage, lowerMessage);
      } catch (fallbackError) {
        logger.error("Even fallback failed:", fallbackError);
        // Last resort - return a generic helpful message
        return "I understand you're asking about flag football training. I can help with:\n• Sports psychology & mental training\n• Nutrition & supplements\n• Speed & agility development\n• Injury prevention & treatment\n• Recovery strategies\n• Training programs\n\nCould you rephrase your question?";
      }
    }
  }

  async getLocalResponse(parsedQuestion, userMessage, lowerMessage) {
    // Use parsed question if available, otherwise parse inline
    if (!parsedQuestion) {
      // Simple inline parsing for fallback
      parsedQuestion = {
        intent: this.detectSimpleIntent(lowerMessage),
        entities: this.extractSimpleEntities(lowerMessage, userMessage),
        original: userMessage,
      };

      // Enrich question with user profile data if available
      if (this.personalizationService) {
        parsedQuestion =
          await this.personalizationService.enrichQuestion(parsedQuestion);
      }
    }

    // Parse specific questions with numbers/measurements
    const heightMatch = userMessage.match(
      /(\d+)\s*(?:cm|centimeters?|m|meters?|'|ft|feet)/i,
    );
    const weightMatch = userMessage.match(
      /(\d+)\s*(?:kg|kilograms?|lbs?|pounds?)/i,
    );
    const height = heightMatch
      ? this.normalizeHeight(parseInt(heightMatch[1]), heightMatch[0])
      : null;
    const weight = weightMatch
      ? this.normalizeWeight(parseInt(weightMatch[1]), weightMatch[0])
      : null;

    // Update parsed question with extracted body stats if not already present
    if (!parsedQuestion.entities.bodyStats) {
      parsedQuestion.entities.bodyStats = {};
    }
    if (height && !parsedQuestion.entities.bodyStats.height) {
      parsedQuestion.entities.bodyStats.height = height;
    }
    if (weight && !parsedQuestion.entities.bodyStats.weight) {
      parsedQuestion.entities.bodyStats.weight = weight;
    }

    // Try to use answer generator for better structured responses
    try {
      const { answerGenerator } = await import("../utils/answer-generator.js");
      const { responseEnhancer } =
        await import("../utils/response-enhancer.js");

      // Create a mock knowledge entry from local knowledge base
      const localKnowledge = this.getLocalKnowledgeEntry(
        parsedQuestion,
        lowerMessage,
      );

      if (localKnowledge) {
        let answer = answerGenerator.generateAnswer(
          parsedQuestion,
          localKnowledge,
          [],
        );
        answer = responseEnhancer.enhanceResponse(answer, userMessage);
        answer = responseEnhancer.addDisclaimers(
          answer,
          parsedQuestion.entities.supplements[0] ||
            parsedQuestion.entities.injuries[0] ||
            "",
        );
        return answer;
      }
    } catch (e) {
      // Continue with direct local responses
      logger.debug("Answer generator unavailable, using direct responses:", e);
    }

    // Check for specific supplement questions
    if (lowerMessage.includes("iron") && (height || weight)) {
      const nutritionData = this.knowledgeBase.nutrition;
      if (nutritionData.specificAnswers && nutritionData.specificAnswers.iron) {
        return nutritionData.specificAnswers.iron(height || 180, weight || 80);
      }
    }

    if (
      lowerMessage.includes("iron") &&
      (lowerMessage.includes("how much") ||
        lowerMessage.includes("dose") ||
        lowerMessage.includes("take") ||
        lowerMessage.includes("need"))
    ) {
      return "**Iron Requirements for Athletes:**\n\n• **Adult males:** 8mg/day (RDA), but athletes typically need 10-15mg/day\n• **Adult females:** 18mg/day (RDA), athletes may need 20-25mg/day\n• **Best sources:** Lean red meat, dark poultry, beans, lentils, spinach, fortified cereals\n• **Absorption tip:** Pair with vitamin C (citrus fruits) to enhance absorption\n• **Avoid:** Taking with coffee/tea or calcium supplements (reduces absorption)\n\n**Important:** If you're experiencing fatigue or suspect deficiency, get your ferritin levels checked. Always consult a healthcare provider before supplementing.";
    }

    if (lowerMessage.includes("protein") && weight) {
      const nutritionData = this.knowledgeBase.nutrition;
      if (
        nutritionData.specificAnswers &&
        nutritionData.specificAnswers.protein
      ) {
        return nutritionData.specificAnswers.protein(weight);
      }
    }

    if (
      lowerMessage.includes("protein") &&
      (lowerMessage.includes("how much") || lowerMessage.includes("need"))
    ) {
      return "**Protein Requirements for Flag Football Athletes:**\n\n• **General recommendation:** 1.6-2.2g per kg of body weight per day\n• **For muscle building:** Up to 2.2g/kg\n• **Distribution:** Spread across 4-5 meals\n• **Post-workout:** 20-30g within 30 minutes\n• **Pre-sleep:** 20-30g casein protein for overnight recovery\n\n**Best sources:** Chicken breast, fish, eggs, Greek yogurt, lean beef, whey protein, plant-based options.";
    }

    if (
      lowerMessage.includes("creatine") &&
      (lowerMessage.includes("how much") ||
        lowerMessage.includes("dose") ||
        lowerMessage.includes("take"))
    ) {
      const nutritionData = this.knowledgeBase.nutrition;
      if (
        nutritionData.specificAnswers &&
        nutritionData.specificAnswers.creatine
      ) {
        return nutritionData.specificAnswers.creatine();
      }
    }

    if (
      lowerMessage.includes("magnesium") &&
      (lowerMessage.includes("how much") ||
        lowerMessage.includes("dose") ||
        lowerMessage.includes("take"))
    ) {
      const nutritionData = this.knowledgeBase.nutrition;
      if (
        nutritionData.specificAnswers &&
        nutritionData.specificAnswers.magnesium
      ) {
        return nutritionData.specificAnswers.magnesium();
      }
    }

    // Check each knowledge base category for keyword matches
    let bestMatch = null;
    let bestMatchScore = 0;

    for (const [category, data] of Object.entries(this.knowledgeBase)) {
      if (!data.keywords) {
        continue;
      }

      const keywordMatches = data.keywords.filter((keyword) =>
        lowerMessage.includes(keyword),
      ).length;
      const matchScore = keywordMatches / data.keywords.length;

      if (matchScore > bestMatchScore) {
        bestMatchScore = matchScore;
        bestMatch = category;
      }
    }

    if (bestMatch && bestMatchScore > 0) {
      const {responses} = this.knowledgeBase[bestMatch];
      if (responses && responses.length > 0) {
        // Return a random response from the best matching category
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }

    // Default response if no category matches
    return "I understand you're asking about flag football training. Could you be more specific? I can help with:\n• Sports psychology & mental training\n• Nutrition & supplements (including specific dosages)\n• Speed & agility development\n• Injury prevention & treatment\n• Recovery strategies\n• Training programs\n\n**Tip:** For nutrition questions, include your height and weight for personalized recommendations!";
  }

  detectSimpleIntent(lowerMessage) {
    if (lowerMessage.match(/how much|how many|dose|dosage|take|consume/i)) {
      return "dosage";
    }
    if (lowerMessage.match(/when|timing|best time/i)) {
      return "timing";
    }
    if (lowerMessage.match(/safe|dangerous|risk|warning/i)) {
      return "safety";
    }
    if (lowerMessage.match(/how do|how to|how can/i)) {
      return "how_to";
    }
    if (lowerMessage.match(/what is|what are|explain|tell about/i)) {
      return "what_is";
    }
    if (lowerMessage.match(/why|reason|benefit/i)) {
      return "why";
    }
    if (lowerMessage.match(/protocol|routine|schedule/i)) {
      return "protocol";
    }
    return "general";
  }

  extractSimpleEntities(lowerMessage, _originalMessage) {
    return {
      supplements: [
        "iron",
        "creatine",
        "protein",
        "magnesium",
        "vitamin d",
      ].filter((s) => lowerMessage.includes(s)),
      injuries: ["ankle", "hamstring", "acl", "shoulder"].filter((i) =>
        lowerMessage.includes(i),
      ),
      recovery: ["sauna", "cold", "massage", "ice"].filter((r) =>
        lowerMessage.includes(r),
      ),
      training: ["speed", "agility", "strength"].filter((t) =>
        lowerMessage.includes(t),
      ),
      psychology: ["anxiety", "confidence", "mental"].filter((p) =>
        lowerMessage.includes(p),
      ),
      bodyStats: {},
    };
  }

  normalizeHeight(value, unit) {
    const lowerUnit = unit.toLowerCase();
    if (
      lowerUnit.includes("ft") ||
      lowerUnit.includes("feet") ||
      lowerUnit.includes("'")
    ) {
      return Math.round(value * 30.48);
    }
    if (lowerUnit.includes("m") && !lowerUnit.includes("cm")) {
      return Math.round(value * 100);
    }
    return value;
  }

  normalizeWeight(value, unit) {
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit.includes("lb") || lowerUnit.includes("pound")) {
      return Math.round(value * 0.453592);
    }
    return value;
  }

  getLocalKnowledgeEntry(parsedQuestion, _lowerMessage) {
    // Create a knowledge entry structure from local knowledge base
    const {entities} = parsedQuestion;

    // Check for supplements
    if (entities.supplements.length > 0) {
      const supplement = entities.supplements[0].toLowerCase();
      const nutritionData = this.knowledgeBase.nutrition;

      if (
        nutritionData.specificAnswers &&
        nutritionData.specificAnswers[supplement]
      ) {
        const bodyStats = parsedQuestion.entities.bodyStats || {};

        if (supplement === "iron" && (bodyStats.height || bodyStats.weight)) {
          return {
            entry_type: "supplement",
            topic: "iron_supplementation",
            answer: nutritionData.specificAnswers.iron(
              bodyStats.height || 180,
              bodyStats.weight || 80,
            ),
            dosage_guidelines: {
              recommended_dosage: "10-15mg/day for athletes",
            },
            safety_warnings: [
              "Consult healthcare provider before supplementing",
              "Excess iron can be harmful",
            ],
            best_practices: [
              "Pair with vitamin C",
              "Avoid with coffee/tea",
              "Take separately from calcium",
            ],
          };
        }

        if (supplement === "protein" && bodyStats.weight) {
          return {
            entry_type: "supplement",
            topic: "protein_requirements",
            answer: nutritionData.specificAnswers.protein(bodyStats.weight),
            dosage_guidelines: {
              recommended_dosage: `${Math.round(bodyStats.weight * 1.6)}g/day`,
            },
            best_practices: [
              "Spread across 4-5 meals",
              "Post-workout: 20-30g",
              "Pre-sleep: 20-30g casein",
            ],
          };
        }

        if (supplement === "creatine") {
          return {
            entry_type: "supplement",
            topic: "creatine_supplementation",
            answer: nutritionData.specificAnswers.creatine(),
            dosage_guidelines: {
              loading_phase: "20g/day (5g × 4) for 5-7 days",
              maintenance: "3-5g/day",
            },
            best_practices: [
              "Take with carbs post-workout",
              "Stay hydrated",
              "No need to cycle",
            ],
          };
        }

        if (supplement === "magnesium") {
          return {
            entry_type: "supplement",
            topic: "magnesium_supplementation",
            answer: nutritionData.specificAnswers.magnesium(),
            dosage_guidelines: {
              recommended_dosage: "500-600mg/day for athletes",
            },
            best_practices: ["Use citrate or glycinate form", "Take with food"],
          };
        }
      }
    }

    return null;
  }

  addMessage(type, text, skipSave = false) {
    this.renderMessage(type, text, skipSave);

    // Store message
    if (!skipSave) {
      this.messages.push({
        type,
        text,
        timestamp: new Date(),
      });

      // Save to storage
      this.saveMessages();
    }
  }

  renderMessage(type, text, _skipSave = false) {
    const messagesContainer = document.getElementById("chatbot-messages");
    if (!messagesContainer) {
      return;
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `chatbot-message ${type}-message`;

    if (type === "user") {
      setSafeContent(messageDiv, `
        <div class="message-content">
          <div class="message-text">${this.escapeHtml(text)}</div>
        </div>
        <div class="message-avatar">You</div>
      `, true, true);
    } else {
      setSafeContent(messageDiv, `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="message-text">${this.formatBotMessage(text)}</div>
        </div>
      `, true, true);
    }

    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  formatBotMessage(text) {
    // First escape HTML to prevent XSS
    let formatted = this.escapeHtml(text);

    // Convert bold text (**text**)
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Convert line breaks
    formatted = formatted.replace(/\n/g, "<br>");

    // Convert bullet points (handle both • and -)
    formatted = formatted.replace(/(?:•|-)\s*(.+?)(?=<br>|$)/g, "<li>$1</li>");

    // Wrap consecutive list items in ul tags
    formatted = formatted.replace(/(<li>.*?<\/li>(?:<br>)?)+/g, (match) => {
      return `<ul style='margin: 8px 0; padding-left: 20px;'>${match.replace(/<br>/g, "")}</ul>`;
    });

    return formatted;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    // eslint-disable-next-line no-restricted-syntax
    return div.innerHTML;
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById("chatbot-messages");
    if (!messagesContainer) {
      return;
    }

    const typingDiv = document.createElement("div");
    typingDiv.className = "chatbot-message bot-message typing-indicator";
    typingDiv.id = "typing-indicator";
    setSafeContent(typingDiv, `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `, true, true);

    messagesContainer.appendChild(typingDiv);
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
      indicator.remove();
    }
  }

  scrollToBottom() {
    const messagesContainer = document.getElementById("chatbot-messages");
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  focusInput() {
    setTimeout(() => {
      const input = document.getElementById("chatbot-input");
      if (input) {
        input.focus();
      }
    }, 100);
  }

  close() {
    if (this.modal) {
      this.modal.classList.remove("open");
      this.modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  }
}

// Create singleton instance
export const flagFitChatbot = new FlagFitChatbot();

// Make it globally available
window.flagFitChatbot = flagFitChatbot;
