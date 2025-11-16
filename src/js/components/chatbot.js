// FlagFit AI Chatbot Component
// Provides intelligent responses about sports psychology, nutrition, speed training, injuries, recovery, etc.

// Simple logger fallback
const logger = {
  error: (...args) => logger.error(...args),
  warn: (...args) => logger.warn(...args),
  info: (...args) => logger.info(...args),
  log: (...args) => logger.debug(...args),
};

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
      recovery: []
    };
    this.questionPools = this.initializeQuestionPools();
  }

  initializeKnowledgeBase() {
    return {
      psychology: {
        keywords: ["mental", "psychology", "mindset", "confidence", "anxiety", "stress", "focus", "motivation", "mental health"],
        responses: [
          "Mental preparation is crucial for peak performance. Try visualization techniques before games - imagine yourself executing plays perfectly.",
          "Confidence comes from preparation. Focus on what you can control: your effort, attitude, and preparation.",
          "For performance anxiety, practice deep breathing: 4 seconds in, hold 4, 4 seconds out. This activates your parasympathetic nervous system.",
          "Set process goals (like 'execute this route perfectly') rather than outcome goals (like 'score a touchdown'). Process goals are more controllable.",
          "Pre-game routines help reduce anxiety. Develop a consistent warm-up and mental preparation ritual.",
        ],
      },
      nutrition: {
        keywords: ["nutrition", "diet", "food", "eat", "meal", "protein", "carbs", "hydration", "supplement", "pre-workout", "post-workout"],
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
        keywords: ["speed", "sprint", "fast", "acceleration", "agility", "quickness", "40 yard", "speed training"],
        responses: [
          "Speed development requires a combination of strength, technique, and power. Focus on sprint mechanics: drive phase, maximum velocity, and deceleration.",
          "For acceleration: Practice 10-20 yard sprints with proper forward lean (45-degree angle) and powerful arm drive.",
          "Plyometric exercises like box jumps, broad jumps, and bounding improve power output and speed.",
          "Resistance training with squats, deadlifts, and Olympic lifts builds the strength foundation for speed.",
          "Rest is crucial for speed development. Allow 48-72 hours between intense speed sessions for recovery.",
        ],
      },
      injury: {
        keywords: ["injury", "hurt", "pain", "sprain", "strain", "achilles", "knee", "shoulder", "ankle", "hamstring"],
        responses: [
          "For acute injuries, follow RICE: Rest, Ice (15-20 min every 2-3 hours), Compression, Elevation.",
          "If you experience sharp pain, swelling, or inability to bear weight, consult a healthcare professional immediately.",
          "Common flag football injuries: ankle sprains, hamstring strains, shoulder impingement. Prevention through proper warm-up and strength training is key.",
          "For hamstring strains: Start with gentle stretching after 48 hours, then progressive strengthening. Avoid sprinting until pain-free.",
          "Ankle sprains benefit from balance training (single-leg stands) and calf strengthening to prevent recurrence.",
        ],
      },
      recovery: {
        keywords: ["recovery", "rest", "sleep", "sore", "fatigue", "regeneration", "rest day", "overtraining"],
        responses: [
          "Recovery is when adaptation happens. Aim for 7-9 hours of quality sleep per night for optimal recovery.",
          "Active recovery (light walking, stretching, yoga) can be more effective than complete rest on off days.",
          "Signs of overtraining: persistent fatigue, decreased performance, mood changes, sleep disturbances. Take a deload week if you notice these.",
          "Post-training: Use foam rolling, dynamic stretching, and contrast therapy (hot/cold) to enhance recovery.",
          "Nutrition plays a huge role in recovery. Ensure adequate protein intake and consider tart cherry juice for inflammation reduction.",
        ],
      },
      training: {
        keywords: ["training", "workout", "exercise", "drill", "practice", "session", "program"],
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

  open() {
    if (this.modal) {
      this.modal.classList.add("open");
      this.modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      this.focusInput();
      return;
    }

    this.createModal();
    this.modal.classList.add("open");
    this.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    this.focusInput();
  }

  createModal() {
    const modal = document.createElement("div");
    modal.className = "chatbot-modal-overlay";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "chatbot-title");
    modal.setAttribute("aria-hidden", "true");

    modal.innerHTML = `
      <div class="chatbot-modal-content">
        <div class="chatbot-header">
          <div class="chatbot-header-info">
            <div class="chatbot-avatar">🤖</div>
            <div>
              <h2 id="chatbot-title" class="chatbot-title">FlagFit AI Assistant</h2>
              <p class="chatbot-subtitle">Ask me about training, nutrition, psychology, injuries & more</p>
            </div>
          </div>
          <button class="chatbot-close" aria-label="Close chatbot" type="button">
            <i data-lucide="x" class="icon-20"></i>
          </button>
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
    `;

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

    // Add welcome message
    this.messages.push({
      type: "bot",
      text: "👋 Hello! I'm your FlagFit AI Assistant. I can help you with sports psychology, nutrition, speed training, injuries, recovery, and more. What would you like to know?",
      timestamp: new Date(),
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");
    const closeBtn = this.modal.querySelector(".chatbot-close");
    const quickBtns = this.modal.querySelectorAll(".chatbot-quick-btn");

    // Input handling
    input.addEventListener("input", (e) => {
      sendBtn.disabled = !e.target.value.trim();

      // Auto-resize textarea
      e.target.style.height = "auto";
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
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
        "What mental preparation routines do elite athletes use?"
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
        "How can I improve my energy levels through nutrition?"
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
        "What's the best way to train acceleration?"
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
        "What exercises strengthen injury-prone areas?"
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
        "How do I know if I'm recovering properly?"
      ]
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
    const availableQuestions = pool.filter(q => !asked.includes(q));

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

    if (!message) return;

    // Add user message
    this.addMessage("user", message);
    input.value = "";
    input.style.height = "auto";
    document.getElementById("chatbot-send").disabled = true;

    // Show typing indicator
    this.showTypingIndicator();

    // Get response (now async)
    try {
      const response = await this.getResponse(message);
      this.hideTypingIndicator();
      this.addMessage("bot", response);
    } catch (error) {
      logger.error("Error getting response:", error);
      this.hideTypingIndicator();
      this.addMessage("bot", "I apologize, but I'm having trouble processing your question right now. Please try rephrasing it.");
    }
  }

  async getResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    // Parse the question intelligently
    let parsedQuestion = null;
    let knowledgeEntry = null;
    let articles = [];

    try {
      // Import question parser and answer generator
      const { questionParser } = await import("../utils/question-parser.js");
      const { answerGenerator } = await import("../utils/answer-generator.js");

      // Parse the question
      parsedQuestion = questionParser.parse(userMessage);

      // Try knowledge base first (if available)
      try {
        const { knowledgeBaseService } = await import("../services/knowledge-base-service.js");

        // Search knowledge base
        knowledgeEntry = await knowledgeBaseService.searchKnowledgeBase(
          userMessage,
          parsedQuestion.entities.supplements[0] ? 'supplement' :
          parsedQuestion.entities.injuries[0] ? 'injury' :
          parsedQuestion.entities.recovery[0] ? 'recovery_method' :
          parsedQuestion.entities.training[0] ? 'training_method' :
          parsedQuestion.entities.psychology[0] ? 'psychology' : null
        );

        // If no knowledge entry, search articles
        if (!knowledgeEntry) {
          articles = await knowledgeBaseService.searchArticles(
            userMessage,
            [
              ...parsedQuestion.entities.supplements,
              ...parsedQuestion.entities.injuries,
              ...parsedQuestion.entities.recovery,
              ...parsedQuestion.entities.training,
              ...parsedQuestion.entities.psychology
            ]
          );
        }

        // Generate intelligent answer
        if (knowledgeEntry || articles.length > 0) {
          let answer = answerGenerator.generateAnswer(parsedQuestion, knowledgeEntry, articles);

          // Enhance the answer
          try {
            const { responseEnhancer } = await import("../utils/response-enhancer.js");
            answer = responseEnhancer.enhanceResponse(
              answer,
              userMessage,
              { isFirstMessage: this.messages.length === 0 }
            );

            // Add disclaimers if needed
            const topic = parsedQuestion.entities.supplements[0] ||
                         parsedQuestion.entities.injuries[0] ||
                         parsedQuestion.entities.recovery[0] || '';
            answer = responseEnhancer.addDisclaimers(answer, topic);
          } catch (e) {
            // Continue without enhancement if unavailable
          }

          return answer;
        }
      } catch (error) {
        logger.debug("Knowledge base service unavailable, using local knowledge:", error);
      }

      // Fallback to local knowledge with intelligent parsing
      return await this.getLocalResponse(parsedQuestion, userMessage, lowerMessage);

    } catch (error) {
      logger.error("Error in intelligent response:", error);
      // Ultimate fallback
      return await this.getLocalResponse(null, userMessage, lowerMessage);
    }
  }

  async getLocalResponse(parsedQuestion, userMessage, lowerMessage) {
    // Use parsed question if available, otherwise parse inline
    if (!parsedQuestion) {
      // Simple inline parsing for fallback
      parsedQuestion = {
        intent: this.detectSimpleIntent(lowerMessage),
        entities: this.extractSimpleEntities(lowerMessage, userMessage),
        original: userMessage
      };
    }

    // Parse specific questions with numbers/measurements
    const heightMatch = userMessage.match(/(\d+)\s*(?:cm|centimeters?|m|meters?|'|ft|feet)/i);
    const weightMatch = userMessage.match(/(\d+)\s*(?:kg|kilograms?|lbs?|pounds?)/i);
    const height = heightMatch ? this.normalizeHeight(parseInt(heightMatch[1]), heightMatch[0]) : null;
    const weight = weightMatch ? this.normalizeWeight(parseInt(weightMatch[1]), weightMatch[0]) : null;

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
      const { responseEnhancer } = await import("../utils/response-enhancer.js");

      // Create a mock knowledge entry from local knowledge base
      const localKnowledge = this.getLocalKnowledgeEntry(parsedQuestion, lowerMessage);

      if (localKnowledge) {
        let answer = answerGenerator.generateAnswer(parsedQuestion, localKnowledge, []);
        answer = responseEnhancer.enhanceResponse(answer, userMessage);
        answer = responseEnhancer.addDisclaimers(answer, parsedQuestion.entities.supplements[0] || parsedQuestion.entities.injuries[0] || '');
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

    if (lowerMessage.includes("iron") && (lowerMessage.includes("how much") || lowerMessage.includes("dose") || lowerMessage.includes("take") || lowerMessage.includes("need"))) {
      return "**Iron Requirements for Athletes:**\n\n• **Adult males:** 8mg/day (RDA), but athletes typically need 10-15mg/day\n• **Adult females:** 18mg/day (RDA), athletes may need 20-25mg/day\n• **Best sources:** Lean red meat, dark poultry, beans, lentils, spinach, fortified cereals\n• **Absorption tip:** Pair with vitamin C (citrus fruits) to enhance absorption\n• **Avoid:** Taking with coffee/tea or calcium supplements (reduces absorption)\n\n**Important:** If you're experiencing fatigue or suspect deficiency, get your ferritin levels checked. Always consult a healthcare provider before supplementing.";
    }

    if (lowerMessage.includes("protein") && weight) {
      const nutritionData = this.knowledgeBase.nutrition;
      if (nutritionData.specificAnswers && nutritionData.specificAnswers.protein) {
        return nutritionData.specificAnswers.protein(weight);
      }
    }

    if (lowerMessage.includes("protein") && (lowerMessage.includes("how much") || lowerMessage.includes("need"))) {
      return "**Protein Requirements for Flag Football Athletes:**\n\n• **General recommendation:** 1.6-2.2g per kg of body weight per day\n• **For muscle building:** Up to 2.2g/kg\n• **Distribution:** Spread across 4-5 meals\n• **Post-workout:** 20-30g within 30 minutes\n• **Pre-sleep:** 20-30g casein protein for overnight recovery\n\n**Best sources:** Chicken breast, fish, eggs, Greek yogurt, lean beef, whey protein, plant-based options.";
    }

    if (lowerMessage.includes("creatine") && (lowerMessage.includes("how much") || lowerMessage.includes("dose") || lowerMessage.includes("take"))) {
      const nutritionData = this.knowledgeBase.nutrition;
      if (nutritionData.specificAnswers && nutritionData.specificAnswers.creatine) {
        return nutritionData.specificAnswers.creatine();
      }
    }

    if (lowerMessage.includes("magnesium") && (lowerMessage.includes("how much") || lowerMessage.includes("dose") || lowerMessage.includes("take"))) {
      const nutritionData = this.knowledgeBase.nutrition;
      if (nutritionData.specificAnswers && nutritionData.specificAnswers.magnesium) {
        return nutritionData.specificAnswers.magnesium();
      }
    }

    // Check each knowledge base category for keyword matches
    let bestMatch = null;
    let bestMatchScore = 0;

    for (const [category, data] of Object.entries(this.knowledgeBase)) {
      if (!data.keywords) continue;

      const keywordMatches = data.keywords.filter((keyword) => lowerMessage.includes(keyword)).length;
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
    if (lowerMessage.match(/how much|how many|dose|dosage|take|consume/i)) return 'dosage';
    if (lowerMessage.match(/when|timing|best time/i)) return 'timing';
    if (lowerMessage.match(/safe|dangerous|risk|warning/i)) return 'safety';
    if (lowerMessage.match(/how do|how to|how can/i)) return 'how_to';
    if (lowerMessage.match(/what is|what are|explain|tell about/i)) return 'what_is';
    if (lowerMessage.match(/why|reason|benefit/i)) return 'why';
    if (lowerMessage.match(/protocol|routine|schedule/i)) return 'protocol';
    return 'general';
  }

  extractSimpleEntities(lowerMessage, originalMessage) {
    return {
      supplements: ['iron', 'creatine', 'protein', 'magnesium', 'vitamin d'].filter(s => lowerMessage.includes(s)),
      injuries: ['ankle', 'hamstring', 'acl', 'shoulder'].filter(i => lowerMessage.includes(i)),
      recovery: ['sauna', 'cold', 'massage', 'ice'].filter(r => lowerMessage.includes(r)),
      training: ['speed', 'agility', 'strength'].filter(t => lowerMessage.includes(t)),
      psychology: ['anxiety', 'confidence', 'mental'].filter(p => lowerMessage.includes(p)),
      bodyStats: {}
    };
  }

  normalizeHeight(value, unit) {
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit.includes('ft') || lowerUnit.includes('feet') || lowerUnit.includes("'")) {
      return Math.round(value * 30.48);
    }
    if (lowerUnit.includes('m') && !lowerUnit.includes('cm')) {
      return Math.round(value * 100);
    }
    return value;
  }

  normalizeWeight(value, unit) {
    const lowerUnit = unit.toLowerCase();
    if (lowerUnit.includes('lb') || lowerUnit.includes('pound')) {
      return Math.round(value * 0.453592);
    }
    return value;
  }

  getLocalKnowledgeEntry(parsedQuestion, lowerMessage) {
    // Create a knowledge entry structure from local knowledge base
    const intent = parsedQuestion.intent;
    const entities = parsedQuestion.entities;

    // Check for supplements
    if (entities.supplements.length > 0) {
      const supplement = entities.supplements[0].toLowerCase();
      const nutritionData = this.knowledgeBase.nutrition;

      if (nutritionData.specificAnswers && nutritionData.specificAnswers[supplement]) {
        const bodyStats = parsedQuestion.entities.bodyStats || {};

        if (supplement === 'iron' && (bodyStats.height || bodyStats.weight)) {
          return {
            entry_type: 'supplement',
            topic: 'iron_supplementation',
            answer: nutritionData.specificAnswers.iron(bodyStats.height || 180, bodyStats.weight || 80),
            dosage_guidelines: { recommended_dosage: '10-15mg/day for athletes' },
            safety_warnings: ['Consult healthcare provider before supplementing', 'Excess iron can be harmful'],
            best_practices: ['Pair with vitamin C', 'Avoid with coffee/tea', 'Take separately from calcium']
          };
        }

        if (supplement === 'protein' && bodyStats.weight) {
          return {
            entry_type: 'supplement',
            topic: 'protein_requirements',
            answer: nutritionData.specificAnswers.protein(bodyStats.weight),
            dosage_guidelines: { recommended_dosage: `${Math.round(bodyStats.weight * 1.6)}g/day` },
            best_practices: ['Spread across 4-5 meals', 'Post-workout: 20-30g', 'Pre-sleep: 20-30g casein']
          };
        }

        if (supplement === 'creatine') {
          return {
            entry_type: 'supplement',
            topic: 'creatine_supplementation',
            answer: nutritionData.specificAnswers.creatine(),
            dosage_guidelines: {
              loading_phase: '20g/day (5g × 4) for 5-7 days',
              maintenance: '3-5g/day'
            },
            best_practices: ['Take with carbs post-workout', 'Stay hydrated', 'No need to cycle']
          };
        }

        if (supplement === 'magnesium') {
          return {
            entry_type: 'supplement',
            topic: 'magnesium_supplementation',
            answer: nutritionData.specificAnswers.magnesium(),
            dosage_guidelines: { recommended_dosage: '500-600mg/day for athletes' },
            best_practices: ['Use citrate or glycinate form', 'Take with food']
          };
        }
      }
    }

    return null;
  }

  addMessage(type, text) {
    const messagesContainer = document.getElementById("chatbot-messages");
    if (!messagesContainer) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `chatbot-message ${type}-message`;

    if (type === "user") {
      messageDiv.innerHTML = `
        <div class="message-content">
          <div class="message-text">${this.escapeHtml(text)}</div>
        </div>
        <div class="message-avatar">You</div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
          <div class="message-text">${this.formatBotMessage(text)}</div>
        </div>
      `;
    }

    messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();

    // Store message
    this.messages.push({
      type,
      text,
      timestamp: new Date(),
    });
  }

  formatBotMessage(text) {
    // First escape HTML to prevent XSS
    let formatted = this.escapeHtml(text);

    // Convert bold text (**text**)
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Convert line breaks
    formatted = formatted.replace(/\n/g, "<br>");

    // Convert bullet points (handle both • and -)
    formatted = formatted.replace(/(?:•|\-)\s*(.+?)(?=<br>|$)/g, "<li>$1</li>");

    // Wrap consecutive list items in ul tags
    formatted = formatted.replace(/(<li>.*?<\/li>(?:<br>)?)+/g, (match) => {
      return `<ul style='margin: 8px 0; padding-left: 20px;'>${match.replace(/<br>/g, '')}</ul>`;
    });

    return formatted;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById("chatbot-messages");
    if (!messagesContainer) return;

    const typingDiv = document.createElement("div");
    typingDiv.className = "chatbot-message bot-message typing-indicator";
    typingDiv.id = "typing-indicator";
    typingDiv.innerHTML = `
      <div class="message-avatar">🤖</div>
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

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

