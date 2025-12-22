// FlagFit AI Chatbot Component
// Provides intelligent responses about sports psychology, nutrition, speed training, injuries, recovery, etc.

import { logger } from '../../logger.js';
import { setSafeContent } from '../utils/shared.js';

class FlagFitChatbot {
  constructor() {
    this.messages = [];
    this.knowledgeBase = this.initializeKnowledgeBase();
    this.modal = null;
    this.askedQuestions = {
      psychology: [],
      nutrition: [],
      speed: [],
      injury: [],
      recovery: [],
    };
    this.questionPools = this.initializeQuestionPools();
    this.storageKey = "chatbot_messages";
    this.conversationContext = []; // Store conversation context for better responses
    this.timeoutDuration = 30000; // 30 seconds timeout
    this.storageService = null; // Will be loaded lazily
    this.userContext = null; // User context for role-aware responses
    this.roleAwareGenerator = null; // Role-aware response generator
    this.personalizationService = null; // Personalization service for profile data
    this.responseCache = new Map(); // Cache responses for better performance
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.maxContextMessages = 10; // Maximum context messages to keep
    this.retryAttempts = 3; // Maximum retry attempts for failed requests
    this.retryDelay = 1000; // Initial retry delay in ms
    this.isStreaming = false; // Track if currently streaming a response
    this.currentStreamingMessage = null; // Current message being streamed
    this.debounceTimer = null; // Debounce timer for input
  }

  initializeKnowledgeBase() {
    return {
      psychology: {
        keywords: [
          "mental",
          "psychology",
          "mindset",
          "confidence",
          "anxiety",
          "stress",
          "focus",
          "motivation",
          "mental health",
        ],
        responses: [
          "Mental preparation is crucial for peak performance. Try visualization techniques before games - imagine yourself executing plays perfectly.",
          "Confidence comes from preparation. Focus on what you can control: your effort, attitude, and preparation.",
          "For performance anxiety, practice deep breathing: 4 seconds in, hold 4, 4 seconds out. This activates your parasympathetic nervous system.",
          "Set process goals (like 'execute this route perfectly') rather than outcome goals (like 'score a touchdown'). Process goals are more controllable.",
          "Pre-game routines help reduce anxiety. Develop a consistent warm-up and mental preparation ritual.",
        ],
      },
      nutrition: {
        keywords: [
          "nutrition",
          "diet",
          "food",
          "eat",
          "meal",
          "protein",
          "carbs",
          "hydration",
          "supplement",
          "pre-workout",
          "post-workout",
        ],
        responses: [
          "For flag football, prioritize lean proteins (chicken, fish, eggs), complex carbs (sweet potatoes, quinoa), and healthy fats (avocado, nuts).",
          "Pre-workout: Eat 2-3 hours before training. Include carbs for energy and a small amount of protein.",
          "Post-workout: Consume protein (20-30g) within 30 minutes after training to support muscle recovery.",
          "Stay hydrated! Drink 16-20oz of water 2-3 hours before training, and 8-10oz every 15-20 minutes during activity.",
          "For supplements: Creatine (3-5g daily) can improve power output. Beta-alanine helps with endurance. Always consult a sports nutritionist first.",
        ],
        specificAnswers: {
          iron: (height, weight) => {
            // Calculate iron needs based on body stats
            // RDA for adult males: 8mg/day, athletes may need 10-15mg/day
            // For someone 190cm (6'3") and 89kg (196lbs), they're likely an active male athlete
            const baseIron = 8; // Base RDA for adult males
            const athleteMultiplier = 1.5; // Athletes need more
            const recommended = Math.round(baseIron * athleteMultiplier);

            return `Based on your stats (${height}cm / ${weight}kg), as an active flag football athlete, you should aim for **${recommended}mg of iron per day**.\n\n**Important considerations:**\n• Get iron from food sources first: lean red meat, dark poultry, beans, lentils, spinach, fortified cereals\n• If supplementing, take iron supplements separately from calcium supplements (they compete for absorption)\n• Vitamin C enhances iron absorption - pair iron-rich foods with citrus fruits or bell peppers\n• Avoid taking iron with coffee or tea (tannins reduce absorption)\n• If you're experiencing fatigue, get your ferritin levels checked - athletes are prone to iron deficiency\n\n**Note:** Always consult with a sports nutritionist or doctor before starting iron supplementation, as excess iron can be harmful.`;
          },
          protein: (weight) => {
            const proteinPerKg = 1.6; // g/kg for athletes
            const dailyProtein = Math.round(weight * proteinPerKg);
            return `For your weight (${weight}kg), aim for **${dailyProtein}g of protein per day** as an active flag football athlete.\n\n**Distribution:**\n• Spread across 4-5 meals: ~${Math.round(dailyProtein / 4)}g per meal\n• Post-workout: 20-30g within 30 minutes\n• Pre-sleep: 20-30g casein protein for overnight recovery\n\n**Best sources:** Chicken breast, fish, eggs, Greek yogurt, lean beef, whey protein, plant-based options (tofu, tempeh, legumes).`;
          },
          creatine: () => {
            return "**Creatine Dosage:**\n• Loading phase (optional): 20g/day split into 4 doses of 5g for 5-7 days\n• Maintenance: 3-5g daily\n• Best taken post-workout with carbs (helps uptake)\n• Can also take pre-workout\n• Stay hydrated - creatine increases water retention in muscles\n• No need to cycle on/off\n\n**Benefits for flag football:** Improved power output, sprint performance, and recovery between high-intensity efforts.";
          },
          magnesium: () => {
            return "**Magnesium for Athletes:**\n• RDA: 400-420mg/day for men, 310-320mg/day for women\n• Athletes may need 500-600mg/day due to sweat loss\n• Best sources: Dark leafy greens, nuts, seeds, whole grains, dark chocolate\n• If supplementing: Magnesium citrate or glycinate (better absorption than oxide)\n• Take with food to reduce stomach upset\n• Magnesium helps with muscle function, sleep quality, and recovery";
          },
        },
      },
      speed: {
        keywords: [
          "speed",
          "sprint",
          "fast",
          "acceleration",
          "agility",
          "quickness",
          "40 yard",
          "speed training",
        ],
        responses: [
          "Speed development requires a combination of strength, technique, and power. Focus on sprint mechanics: drive phase, maximum velocity, and deceleration.",
          "For acceleration: Practice 10-20 yard sprints with proper forward lean (45-degree angle) and powerful arm drive.",
          "Plyometric exercises like box jumps, broad jumps, and bounding improve power output and speed.",
          "Resistance training with squats, deadlifts, and Olympic lifts builds the strength foundation for speed.",
          "Rest is crucial for speed development. Allow 48-72 hours between intense speed sessions for recovery.",
        ],
      },
      injury: {
        keywords: [
          "injury",
          "hurt",
          "pain",
          "sprain",
          "strain",
          "achilles",
          "knee",
          "shoulder",
          "ankle",
          "hamstring",
        ],
        responses: [
          "For acute injuries, follow RICE: Rest, Ice (15-20 min every 2-3 hours), Compression, Elevation.",
          "If you experience sharp pain, swelling, or inability to bear weight, consult a healthcare professional immediately.",
          "Common flag football injuries: ankle sprains, hamstring strains, shoulder impingement. Prevention through proper warm-up and strength training is key.",
          "For hamstring strains: Start with gentle stretching after 48 hours, then progressive strengthening. Avoid sprinting until pain-free.",
          "Ankle sprains benefit from balance training (single-leg stands) and calf strengthening to prevent recurrence.",
        ],
      },
      recovery: {
        keywords: [
          "recovery",
          "rest",
          "sleep",
          "sore",
          "fatigue",
          "regeneration",
          "rest day",
          "overtraining",
        ],
        responses: [
          "Recovery is when adaptation happens. Aim for 7-9 hours of quality sleep per night for optimal recovery.",
          "Active recovery (light walking, stretching, yoga) can be more effective than complete rest on off days.",
          "Signs of overtraining: persistent fatigue, decreased performance, mood changes, sleep disturbances. Take a deload week if you notice these.",
          "Post-training: Use foam rolling, dynamic stretching, and contrast therapy (hot/cold) to enhance recovery.",
          "Nutrition plays a huge role in recovery. Ensure adequate protein intake and consider tart cherry juice for inflammation reduction.",
        ],
      },
      training: {
        keywords: [
          "training",
          "workout",
          "exercise",
          "drill",
          "practice",
          "session",
          "program",
        ],
        responses: [
          "Effective training follows periodization: base building, strength phase, power phase, and maintenance.",
          "For flag football, focus on: speed/agility (40%), strength (30%), skill work (20%), and recovery (10%).",
          "Training frequency: 3-4 days per week allows for adequate recovery while maintaining progress.",
          "Always include a proper warm-up (10-15 min) and cool-down (5-10 min) in every session.",
          "Track your training load (volume × intensity) to prevent overtraining and optimize performance.",
        ],
      },
      general: {
        keywords: ["hello", "hi", "help", "what", "how", "tell me"],
        responses: [
          "Hello! I'm your FlagFit AI Assistant. I can help with:\n• Sports psychology & mental training\n• Nutrition & supplements\n• Speed & agility development\n• Injury prevention & treatment\n• Recovery strategies\n• Training programs\n\nWhat would you like to know?",
          "Hi there! I'm here to help with your flag football training questions. Ask me about psychology, nutrition, speed, injuries, recovery, or training!",
        ],
      },
    };
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

    // Create modal content using DOM manipulation
    const modalContent = document.createElement("div");
    modalContent.className = "chatbot-modal-content";
    
    const header = document.createElement("div");
    header.className = "chatbot-header";
    
    const headerInfo = document.createElement("div");
    headerInfo.className = "chatbot-header-info";
    const avatar = document.createElement("div");
    avatar.className = "chatbot-avatar";
    avatar.textContent = "🤖";
    const infoDiv = document.createElement("div");
    const title = document.createElement("h2");
    title.id = "chatbot-title";
    title.className = "chatbot-title";
    title.textContent = "FlagFit AI Assistant";
    const subtitle = document.createElement("p");
    subtitle.className = "chatbot-subtitle";
    subtitle.textContent = "Ask me about training, nutrition, psychology, injuries & more";
    infoDiv.appendChild(title);
    infoDiv.appendChild(subtitle);
    headerInfo.appendChild(avatar);
    headerInfo.appendChild(infoDiv);
    
    const headerActions = document.createElement("div");
    headerActions.className = "chatbot-header-actions";
    const clearBtn = document.createElement("button");
    clearBtn.className = "chatbot-clear-history";
    clearBtn.setAttribute("aria-label", "Clear conversation history");
    clearBtn.type = "button";
    clearBtn.title = "Clear conversation history";
    const clearIcon = document.createElement("i");
    clearIcon.setAttribute("data-lucide", "trash-2");
    clearIcon.className = "icon-18";
    clearBtn.appendChild(clearIcon);
    const closeBtn = document.createElement("button");
    closeBtn.className = "chatbot-close";
    closeBtn.setAttribute("aria-label", "Close chatbot");
    closeBtn.type = "button";
    const closeIcon = document.createElement("i");
    closeIcon.setAttribute("data-lucide", "x");
    closeIcon.className = "icon-20";
    closeBtn.appendChild(closeIcon);
    headerActions.appendChild(clearBtn);
    headerActions.appendChild(closeBtn);
    
    header.appendChild(headerInfo);
    header.appendChild(headerActions);
    
    const messagesContainer = document.createElement("div");
    messagesContainer.className = "chatbot-messages";
    messagesContainer.id = "chatbot-messages";
    messagesContainer.setAttribute("role", "log");
    messagesContainer.setAttribute("aria-live", "polite");
    
    const welcomeMessage = document.createElement("div");
    welcomeMessage.className = "chatbot-message bot-message";
    const welcomeAvatar = document.createElement("div");
    welcomeAvatar.className = "message-avatar";
    welcomeAvatar.textContent = "🤖";
    const welcomeContent = document.createElement("div");
    welcomeContent.className = "message-content";
    const welcomeText = document.createElement("div");
    welcomeText.className = "message-text";
    
    // Create welcome message using DOM methods instead of innerHTML
    const welcomeGreeting = document.createTextNode("👋 Hello! I'm your FlagFit AI Assistant. I can help you with:");
    welcomeText.appendChild(welcomeGreeting);
    
    const welcomeList = document.createElement("ul");
    welcomeList.style.margin = "8px 0 0 20px";
    welcomeList.style.paddingLeft = "0";
    
    const topics = [
      "Sports psychology & mental training",
      "Nutrition & supplements",
      "Speed & agility development",
      "Injury prevention & treatment",
      "Recovery strategies",
      "Training programs"
    ];
    
    topics.forEach(topic => {
      const listItem = document.createElement("li");
      listItem.textContent = topic;
      welcomeList.appendChild(listItem);
    });
    
    welcomeText.appendChild(welcomeList);
    
    const br = document.createElement("br");
    welcomeText.appendChild(br);
    
    const questionText = document.createTextNode("What would you like to know?");
    welcomeText.appendChild(questionText);
    
    welcomeContent.appendChild(welcomeText);
    welcomeMessage.appendChild(welcomeAvatar);
    welcomeMessage.appendChild(welcomeContent);
    messagesContainer.appendChild(welcomeMessage);
    
    modalContent.appendChild(header);
    modalContent.appendChild(messagesContainer);
    
    // Create input container
    const inputContainer = document.createElement("div");
    inputContainer.className = "chatbot-input-container";
    
    const inputWrapper = document.createElement("div");
    inputWrapper.className = "chatbot-input-wrapper";
    
    const textarea = document.createElement("textarea");
    textarea.id = "chatbot-input";
    textarea.className = "chatbot-input";
    textarea.placeholder = "Ask me anything about training, nutrition, psychology...";
    textarea.rows = 1;
    textarea.setAttribute("aria-label", "Chatbot input");
    
    const sendBtn = document.createElement("button");
    sendBtn.id = "chatbot-send";
    sendBtn.className = "chatbot-send-btn";
    sendBtn.type = "button";
    sendBtn.setAttribute("aria-label", "Send message");
    sendBtn.disabled = true;
    
    const sendIcon = document.createElement("i");
    sendIcon.setAttribute("data-lucide", "send");
    sendIcon.className = "icon-18";
    sendBtn.appendChild(sendIcon);
    
    inputWrapper.appendChild(textarea);
    inputWrapper.appendChild(sendBtn);
    
    const quickActions = document.createElement("div");
    quickActions.className = "chatbot-quick-actions";
    
    const quickTopics = [
      { topic: "psychology", label: "🧠 Psychology" },
      { topic: "nutrition", label: "🍎 Nutrition" },
      { topic: "speed", label: "⚡ Speed" },
      { topic: "injury", label: "🩹 Injuries" },
      { topic: "recovery", label: "💤 Recovery" }
    ];
    
    quickTopics.forEach(({ topic, label }) => {
      const quickBtn = document.createElement("button");
      quickBtn.className = "chatbot-quick-btn";
      quickBtn.setAttribute("data-topic", topic);
      quickBtn.textContent = label;
      quickActions.appendChild(quickBtn);
    });
    
    inputContainer.appendChild(inputWrapper);
    inputContainer.appendChild(quickActions);
    modalContent.appendChild(inputContainer);
    modal.appendChild(modalContent);

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
      const { storageService } = await import("../services/storage-service-unified.js");
      this.storageService = storageService;
    } catch (error) {
      logger.warn("Storage service unavailable, using localStorage directly:", error);
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
      const authToken = await this.getAuthToken();
      
      if (!authToken) {
        // No auth token - use default context
        this.userContext = {
          role: 'player',
          teamType: 'domestic',
          position: null,
          expertiseLevel: 'intermediate'
        };
        await this.initializeRoleAwareGenerator();
        return this.userContext;
      }

      // Fetch user context from API
      const response = await fetch('/.netlify/functions/user-context', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          this.userContext = {
            userId: result.data.userId, // Store userId for personalization service
            role: result.data.role || 'player',
            teamType: result.data.teamType || 'domestic',
            position: result.data.position || null,
            expertiseLevel: result.data.expertiseLevel || 'intermediate',
            totalQueries: result.data.totalQueries || 0,
            preferredTopics: result.data.preferredTopics || [],
            heightCm: result.data.heightCm,
            weightKg: result.data.weightKg,
            experienceLevel: result.data.experienceLevel
          };
          await this.initializeRoleAwareGenerator();
          await this.initializePersonalizationService();
          return this.userContext;
        }
      }
    } catch (error) {
      logger.warn('Failed to load user context:', error);
    }

    // Fallback: use default context
    this.userContext = {
      role: 'player',
      teamType: 'domestic',
      position: null,
      expertiseLevel: 'intermediate'
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
        const authToken = await this.getAuthToken();
        if (authToken) {
          // Extract userId from token or fetch from API
          // For now, we'll get it from user-context API
          try {
            const response = await fetch('/.netlify/functions/user-context', {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            });
            if (response.ok) {
              const result = await response.json();
              if (result.success && result.data && result.data.userId) {
                userId = result.data.userId;
              }
            }
          } catch (error) {
            logger.debug('Could not get userId for personalization:', error);
          }
        }
      }

      if (userId) {
        const { PersonalizationService } = await import("../services/personalization-service.js");
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
      this.roleAwareGenerator = new RoleAwareResponseGenerator(this.userContext);
    } catch (error) {
      logger.warn("Role-aware generator unavailable:", error);
      this.roleAwareGenerator = null;
    }
  }

  /**
   * Get auth token from secure storage
   * Upgraded to use secureStorage API with AES-GCM encryption
   */
  async getAuthToken() {
    try {
      // First, try to use secureStorage API (preferred method)
      if (window.secureStorage && typeof window.secureStorage.getAuthToken === 'function') {
        try {
          const token = await window.secureStorage.getAuthToken();
          if (token) {
            return token;
          }
        } catch (error) {
          logger.debug("Secure storage getAuthToken failed, trying fallback:", error);
        }
      }

      // Fallback: Try to get from localStorage (legacy support)
      const authData = localStorage.getItem('auth');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.token || parsed.access_token || null;
      }

      // Fallback: Try to get from sessionStorage (legacy support)
      const sessionAuth = sessionStorage.getItem('auth');
      if (sessionAuth) {
        const parsed = JSON.parse(sessionAuth);
        return parsed.token || parsed.access_token || null;
      }

      // Fallback: Try to get from window if available
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
    const authToken = await this.getAuthToken();
    if (!this.userContext || !authToken) {
      return; // Skip if no user context or auth
    }

    try {
      await fetch('/.netlify/functions/update-chatbot-stats', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ topic })
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
          (msg) => !msg.isWelcomeMessage
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
            const existingMessages = messagesContainer.querySelectorAll(".chatbot-message");
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
        timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
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
    
    // Clear cache as well
    this.clearCache();
    
    // Clear UI
    const messagesContainer = document.getElementById("chatbot-messages");
    if (messagesContainer) {
      messagesContainer.textContent = '';
      
      const welcomeMessage = document.createElement("div");
      welcomeMessage.className = "chatbot-message bot-message";
      const welcomeAvatar = document.createElement("div");
      welcomeAvatar.className = "message-avatar";
      welcomeAvatar.textContent = "🤖";
      const welcomeContent = document.createElement("div");
      welcomeContent.className = "message-content";
      const welcomeText = document.createElement("div");
      welcomeText.className = "message-text";
      
      // Create welcome message using DOM methods instead of innerHTML
      const welcomeGreeting = document.createTextNode("👋 Hello! I'm your FlagFit AI Assistant. I can help you with:");
      welcomeText.appendChild(welcomeGreeting);
      
      const welcomeList = document.createElement("ul");
      welcomeList.style.margin = "8px 0 0 20px";
      welcomeList.style.paddingLeft = "0";
      
      const topics = [
        "Sports psychology & mental training",
        "Nutrition & supplements",
        "Speed & agility development",
        "Injury prevention & treatment",
        "Recovery strategies",
        "Training programs"
      ];
      
      topics.forEach(topic => {
        const listItem = document.createElement("li");
        listItem.textContent = topic;
        welcomeList.appendChild(listItem);
      });
      
      welcomeText.appendChild(welcomeList);
      
      const br = document.createElement("br");
      welcomeText.appendChild(br);
      
      const questionText = document.createTextNode("What would you like to know?");
      welcomeText.appendChild(questionText);
      
      welcomeContent.appendChild(welcomeText);
      welcomeMessage.appendChild(welcomeAvatar);
      welcomeMessage.appendChild(welcomeContent);
      messagesContainer.appendChild(welcomeMessage);
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

    // Input handling with debouncing
    input.addEventListener("input", (e) => {
      sendBtn.disabled = !e.target.value.trim();

      // Auto-resize textarea
      e.target.style.height = "auto";
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
      
      // Debounce for potential future features (autocomplete, suggestions, etc.)
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        // Future: Could add autocomplete or suggestions here
      }, 300);
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
        if (confirm("Are you sure you want to clear the conversation history? This cannot be undone.")) {
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
        const topic = btn.dataset.topic;
        this.handleQuickAction(topic);
      });
    });
  }

  initializeQuestionPools() {
    return {
      psychology: [
        "How can I improve my mental game and confidence?",
        "What techniques help with performance anxiety?",
        "How do I build mental toughness for competition?",
        "What's the best way to visualize success before games?",
        "How can I stay focused during high-pressure situations?",
        "What mental strategies help with pre-game nerves?",
        "How do I develop a winning mindset?",
        "What are effective goal-setting techniques for athletes?",
        "How can I overcome self-doubt and build confidence?",
        "What mental preparation routines do elite athletes use?",
      ],
      nutrition: [
        "What should I eat before and after training?",
        "How much protein do I need as an athlete?",
        "What are the best pre-workout meals?",
        "How do I optimize my nutrition for recovery?",
        "What supplements should I consider taking?",
        "How much water should I drink during training?",
        "What foods help with muscle recovery?",
        "How do I plan meals around my training schedule?",
        "What's the best post-workout nutrition?",
        "How can I improve my energy levels through nutrition?",
      ],
      speed: [
        "How can I improve my speed and acceleration?",
        "What exercises increase sprint speed?",
        "How do I improve my 40-yard dash time?",
        "What's the best speed training program?",
        "How can plyometrics improve my speed?",
        "What's the difference between speed and agility training?",
        "How often should I do speed training?",
        "What techniques improve running form?",
        "How do I increase my top speed?",
        "What's the best way to train acceleration?",
      ],
      injury: [
        "How do I prevent and treat common flag football injuries?",
        "What's the best way to treat an ankle sprain?",
        "How can I prevent hamstring strains?",
        "What exercises prevent ACL injuries?",
        "How do I recover from a shoulder injury?",
        "What are the most common flag football injuries?",
        "How can I prevent overuse injuries?",
        "What's the RICE method for injuries?",
        "How do I know if I need to see a doctor?",
        "What exercises strengthen injury-prone areas?",
      ],
      recovery: [
        "What are the best recovery strategies after training?",
        "How does sauna therapy help with recovery?",
        "What's the best cold therapy protocol?",
        "How much sleep do I need for optimal recovery?",
        "What's the difference between active and passive recovery?",
        "How do I use a massage gun for recovery?",
        "What recovery methods work best together?",
        "How can I speed up muscle recovery?",
        "What's the best post-training recovery routine?",
        "How do I know if I'm recovering properly?",
      ],
    };
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

    if (!message) {return;}
    
    // Prevent multiple simultaneous requests
    if (this.isStreaming) {
      logger.warn("Already processing a message, please wait...");
      return;
    }

    // Check cache first
    const cacheKey = this.getCacheKey(message);
    const cachedResponse = this.responseCache.get(cacheKey);
    if (cachedResponse && Date.now() - cachedResponse.timestamp < this.cacheTimeout) {
      this.addMessage("user", message);
      this.addMessage("bot", cachedResponse.response);
      this.conversationContext.push({ role: "user", content: message });
      this.conversationContext.push({ role: "assistant", content: cachedResponse.response });
      this.optimizeContext();
      input.value = "";
      input.style.height = "auto";
      return;
    }

    // Add user message
    this.addMessage("user", message);
    
    // Add to conversation context
    this.conversationContext.push({ role: "user", content: message });
    this.optimizeContext();
    
    input.value = "";
    input.style.height = "auto";
    const sendBtn = document.getElementById("chatbot-send");
    if (sendBtn) {sendBtn.disabled = true;}
    
    this.isStreaming = true;

    // Show typing indicator with progress
    this.showTypingIndicator();
    const progressInterval = this.showProgressIndicator();

    // Get response with retry logic
    let response = null;
    let lastError = null;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        response = await Promise.race([
          this.getResponse(message),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Timeout")), this.timeoutDuration);
          })
        ]);
        
        // Success - break retry loop
        break;
      } catch (error) {
        lastError = error;
        logger.warn(`Attempt ${attempt} failed:`, error);
        
        // Don't retry on timeout if it's the last attempt
        if (attempt < this.retryAttempts && error.message !== "Timeout") {
          await new Promise(resolve => {
            setTimeout(resolve, this.retryDelay * attempt);
          });
          continue;
        }
      }
    }
    
    clearInterval(progressInterval);
    this.hideTypingIndicator();
    this.isStreaming = false;
    
    if (response && typeof response === 'string' && response.trim()) {
      // Cache the response
      this.responseCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      });
      
      // Stream the response for better UX
      await this.streamMessage("bot", response);
      this.conversationContext.push({ role: "assistant", content: response });
    } else {
      // Fallback response
      try {
        const fallbackResponse = await this.getLocalResponse(null, message, message.toLowerCase());
        await this.streamMessage("bot", fallbackResponse);
        this.conversationContext.push({ role: "assistant", content: fallbackResponse });
      } catch (fallbackError) {
        logger.error("Fallback failed:", fallbackError);
        this.showErrorMessage("I'm having trouble processing your question. Please try rephrasing it or ask about a different topic.");
        this.addMessage(
          "bot",
          "I apologize, but I'm having trouble processing your question right now. I can help with:\n• Sports psychology & mental training\n• Nutrition & supplements\n• Speed & agility development\n• Injury prevention & treatment\n• Recovery strategies\n• Training programs\n\nCould you try rephrasing your question?",
        );
      }
    }
    
    if (sendBtn) {sendBtn.disabled = false;}
  }
  
  /**
   * Optimize conversation context to prevent bloat
   */
  optimizeContext() {
    if (this.conversationContext.length > this.maxContextMessages * 2) {
      // Keep only the most recent messages
      this.conversationContext = this.conversationContext.slice(-this.maxContextMessages);
    }
  }
  
  /**
   * Get cache key for a message
   */
  getCacheKey(message) {
    return message.toLowerCase().trim().replace(/\s+/g, ' ');
  }
  
  /**
   * Stream a message character by character for better UX
   */
  async streamMessage(type, text) {
    // Create message element
    const messagesContainer = document.getElementById("chatbot-messages");
    if (!messagesContainer) {
      // Fallback to regular rendering if container not found
      this.addMessage(type, text);
      return;
    }
    
    // For user messages, render immediately without streaming
    if (type === "user") {
      this.addMessage(type, text);
      return;
    }
    
    // Bot message with streaming
    const messageDiv = document.createElement("div");
    messageDiv.className = `chatbot-message ${type}-message streaming`;
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "🤖";
    const content = document.createElement("div");
    content.className = "message-content";
    const textElement = document.createElement("div");
    textElement.className = "message-text";
    content.appendChild(textElement);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    messagesContainer.appendChild(messageDiv);
    this.currentStreamingMessage = messageDiv;
    
    let currentText = "";
    const words = text.split(/(\s+)/);
    let wordIndex = 0;
    
    return new Promise((resolve) => {
      const streamInterval = setInterval(() => {
        if (wordIndex < words.length) {
          // Add next word
          currentText += words[wordIndex];
          wordIndex++;
          
          // Format and update - formatBotMessage returns HTML for formatting
          // formatBotMessage already escapes HTML and sanitizes URLs, so content is safe
          // Use a temporary container to safely insert formatted HTML
          const temp = document.createElement('div');
          const formattedHtml = this.formatBotMessage(currentText);
          // Use setSafeContent for consistency - formatBotMessage already escaped HTML, but we sanitize for extra safety
          setSafeContent(temp, formattedHtml, true, true);
          textElement.textContent = '';
          while (temp.firstChild) {
            textElement.appendChild(temp.firstChild);
          }
          this.scrollToBottom();
        } else {
          clearInterval(streamInterval);
          messageDiv.classList.remove("streaming");
          this.currentStreamingMessage = null;
          
          // Save to messages array
          this.messages.push({
            type,
            text,
            timestamp: new Date(),
          });
          this.saveMessages();
          resolve();
        }
      }, 30); // 30ms per word for smooth streaming
    });
  }
  
  /**
   * Clear response cache
   */
  clearCache() {
    this.responseCache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.responseCache.size,
      maxAge: this.cacheTimeout,
    };
  }

  showProgressIndicator() {
    const messagesContainer = document.getElementById("chatbot-messages");
    if (!messagesContainer) {return null;}

    const progressBar = document.createElement("div");
    progressBar.className = "chatbot-progress-bar";
    progressBar.id = "chatbot-progress";
    const fill = document.createElement("div");
    fill.className = "chatbot-progress-fill";
    progressBar.appendChild(fill);
    
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
    const errorContent = document.createElement("div");
    errorContent.className = "error-content";
    const errorIcon = document.createElement("span");
    errorIcon.className = "error-icon";
    errorIcon.textContent = "⚠️";
    const errorText = document.createElement("span");
    errorText.className = "error-text";
    errorText.textContent = message;
    errorContent.appendChild(errorIcon);
    errorContent.appendChild(errorText);
    errorDiv.appendChild(errorContent);

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

      // Include conversation context in parsing if available
      // Use optimized context (last N messages)
      const contextMessages = this.conversationContext.slice(-this.maxContextMessages);

    try {
      // Import question parser and answer generator
      let questionParser, answerGenerator;
      try {
        const parserModule = await import("../utils/question-parser.js");
        questionParser = parserModule.questionParser || new parserModule.QuestionParser();
        
        const generatorModule = await import("../utils/answer-generator.js");
        answerGenerator = generatorModule.answerGenerator || new generatorModule.AnswerGenerator();

        // Parse the question
        parsedQuestion = questionParser.parse(userMessage);
        
        // Enrich question with user profile data (body metrics, injuries, training schedule)
        if (this.personalizationService) {
          parsedQuestion = await this.personalizationService.enrichQuestion(parsedQuestion);
        }
      } catch (parseError) {
        logger.debug("Question parser unavailable, using simple parsing:", parseError);
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
        const { knowledgeBaseService } = await import(
          "../services/knowledge-base-service.js"
        );

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
            minQualityScore: 0.3 // Minimum quality score (30%)
          }
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
            const { responseEnhancer } = await import(
              "../utils/response-enhancer.js"
            );
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
              answer = responseEnhancer.addEvidenceIndicators(answer, knowledgeEntry);
            }
          } catch {
            // Continue without enhancement if unavailable
          }

          // Apply role-aware adjustments
          if (this.roleAwareGenerator) {
            answer = this.roleAwareGenerator.adjustForRole(answer, parsedQuestion);
            
            // Add position-specific advice if available
            if (this.userContext?.position) {
              const positionAdvice = this.roleAwareGenerator.getPositionSpecificAdvice(
                this.userContext.position,
                parsedQuestion.intent,
                parsedQuestion.entities
              );
              if (positionAdvice) {
                answer += positionAdvice;
              }
            }
          }

          // Apply personalized recommendations (injury-aware, schedule-aware, body metrics)
          if (this.personalizationService) {
            answer = this.personalizationService.generatePersonalizedRecommendations(
              parsedQuestion,
              answer
            );
          }

          // Update query statistics (async, non-blocking)
          const detectedTopic = parsedQuestion.entities?.supplements?.[0] ||
            parsedQuestion.entities?.injuries?.[0] ||
            parsedQuestion.entities?.recovery?.[0] ||
            parsedQuestion.entities?.training?.[0] ||
            parsedQuestion.entities?.psychology?.[0] ||
            'general';
          this.updateQueryStats(detectedTopic).catch(() => {});

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
        localResponse = this.roleAwareGenerator.adjustForRole(localResponse, parsedQuestion);
        
        // Add position-specific advice if available
        if (this.userContext?.position) {
          const positionAdvice = this.roleAwareGenerator.getPositionSpecificAdvice(
            this.userContext.position,
            parsedQuestion.intent,
            parsedQuestion.entities
          );
          if (positionAdvice) {
            localResponse += positionAdvice;
          }
        }
      }

      // Apply personalized recommendations to local response
      if (this.personalizationService && parsedQuestion) {
        localResponse = this.personalizationService.generatePersonalizedRecommendations(
          parsedQuestion,
          localResponse
        );
      }

      // Update query statistics (async, non-blocking)
      const detectedTopic = parsedQuestion?.entities?.supplements?.[0] ||
        parsedQuestion?.entities?.injuries?.[0] ||
        parsedQuestion?.entities?.recovery?.[0] ||
        parsedQuestion?.entities?.training?.[0] ||
        parsedQuestion?.entities?.psychology?.[0] ||
        'general';
      this.updateQueryStats(detectedTopic).catch(() => {});

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
          parsedQuestion = await this.personalizationService.enrichQuestion(parsedQuestion);
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
      const { responseEnhancer } = await import(
        "../utils/response-enhancer.js"
      );

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
      if (!data.keywords) {continue;}

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
      const responses = this.knowledgeBase[bestMatch].responses;
      if (responses && responses.length > 0) {
        // Return a random response from the best matching category
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }

    // Default response if no category matches
    return "I understand you're asking about flag football training. Could you be more specific? I can help with:\n• Sports psychology & mental training\n• Nutrition & supplements (including specific dosages)\n• Speed & agility development\n• Injury prevention & treatment\n• Recovery strategies\n• Training programs\n\n**Tip:** For nutrition questions, include your height and weight for personalized recommendations!";
  }

  detectSimpleIntent(lowerMessage) {
    if (lowerMessage.match(/how much|how many|dose|dosage|take|consume/i)) {return "dosage";}
    if (lowerMessage.match(/when|timing|best time/i)) {return "timing";}
    if (lowerMessage.match(/safe|dangerous|risk|warning/i)) {return "safety";}
    if (lowerMessage.match(/how do|how to|how can/i)) {return "how_to";}
    if (lowerMessage.match(/what is|what are|explain|tell about/i)) {return "what_is";}
    if (lowerMessage.match(/why|reason|benefit/i)) {return "why";}
    if (lowerMessage.match(/protocol|routine|schedule/i)) {return "protocol";}
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
    // const _intent = parsedQuestion.intent; // Reserved for future use
    const entities = parsedQuestion.entities;

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
    // If streaming, don't add duplicate
    if (this.isStreaming && type === "bot") {
      return;
    }
    
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

  renderMessage(type, text, skipSave = false) {
    const messagesContainer = document.getElementById("chatbot-messages");
    if (!messagesContainer) {return;}

    const messageDiv = document.createElement("div");
    messageDiv.className = `chatbot-message ${type}-message`;

    if (type === "user") {
      const content = document.createElement("div");
      content.className = "message-content";
      const textEl = document.createElement("div");
      textEl.className = "message-text";
      textEl.textContent = text;
      content.appendChild(textEl);
      const avatar = document.createElement("div");
      avatar.className = "message-avatar";
      avatar.textContent = "You";
      messageDiv.appendChild(content);
      messageDiv.appendChild(avatar);
    } else {
      const avatar = document.createElement("div");
      avatar.className = "message-avatar";
      avatar.textContent = "🤖";
      const content = document.createElement("div");
      content.className = "message-content";
      const textEl = document.createElement("div");
      textEl.className = "message-text";
      // formatBotMessage returns HTML for formatting - use setSafeContent for consistency
      // formatBotMessage already escapes HTML and sanitizes URLs, but we sanitize for extra safety
      const temp = document.createElement('div');
      const formattedHtml = this.formatBotMessage(text);
      // Use setSafeContent for safe HTML insertion
      setSafeContent(temp, formattedHtml, true, true);
      while (temp.firstChild) {
        textEl.appendChild(temp.firstChild);
      }
      content.appendChild(textEl);
      messageDiv.appendChild(avatar);
      messageDiv.appendChild(content);
    }

    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  formatBotMessage(text) {
    // First escape HTML to prevent XSS
    let formatted = this.escapeHtml(text);

    // Convert code blocks (```code```)
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Convert inline code (`code`)
    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert bold text (**text**)
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Convert italic text (*text*)
    formatted = formatted.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Convert headers (# Header)
    formatted = formatted.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
    formatted = formatted.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
    formatted = formatted.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

    // Convert links [text](url) with URL sanitization
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      // Sanitize URL to prevent javascript: and data: protocols
      const sanitizedUrl = this.sanitizeUrl(url);
      return `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    });

    // Convert blockquotes (> text)
    formatted = formatted.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");

    // Convert horizontal rules (---)
    formatted = formatted.replace(/^---$/gm, "<hr>");

    // Convert line breaks
    formatted = formatted.replace(/\n/g, "<br>");

    // Convert bullet points (handle both • and -)
    formatted = formatted.replace(/(?:•|\-)\s*(.+?)(?=<br>|$)/g, "<li>$1</li>");

    // Wrap consecutive list items in ul tags
    formatted = formatted.replace(/(<li>.*?<\/li>(?:<br>)?)+/g, (match) => {
      return `<ul style='margin: 8px 0; padding-left: 20px;'>${match.replace(/<br>/g, "")}</ul>`;
    });

    // Convert numbered lists
    formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");
    formatted = formatted.replace(/(<li>.*?<\/li>(?:<br>)?)+/g, (match) => {
      if (match.includes('<ul')) {return match;} // Already wrapped
      return `<ol style='margin: 8px 0; padding-left: 20px;'>${match.replace(/<br>/g, "")}</ol>`;
    });

    return formatted;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    // Safe: Using textContent then reading innerHTML for escaping purposes only
    // eslint-disable-next-line no-restricted-syntax
    return div.innerHTML;
  }

  /**
   * Sanitize URL to prevent XSS via href attributes
   * @param {string} url - URL to sanitize
   * @returns {string} Sanitized URL or empty string if dangerous
   */
  sanitizeUrl(url) {
    if (!url) {
      return '';
    }

    const str = String(url).trim();

    // Allow only safe protocols
    const safeProtocols = /^(https?|mailto|tel|sms):/i;
    const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(str);

    if (hasProtocol && !safeProtocols.test(str)) {
      logger.warn('[Chatbot] Blocked unsafe URL protocol:', str.substring(0, 50));
      return '';
    }

    // Block javascript: and data: URLs
    if (/^(javascript|data|vbscript):/i.test(str)) {
      logger.warn('[Chatbot] Blocked XSS URL attempt');
      return '';
    }

    return str;
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById("chatbot-messages");
    if (!messagesContainer) {return;}

    const typingDiv = document.createElement("div");
    typingDiv.className = "chatbot-message bot-message typing-indicator";
    typingDiv.id = "typing-indicator";
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "🤖";
    const content = document.createElement("div");
    content.className = "message-content";
    const dots = document.createElement("div");
    dots.className = "typing-dots";
    for (let i = 0; i < 3; i++) {
      const span = document.createElement("span");
      dots.appendChild(span);
    }
    content.appendChild(dots);
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(content);

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
