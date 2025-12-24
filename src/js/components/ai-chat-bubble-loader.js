import { logger } from '../../logger.js';
import { setSafeContent } from '../utils/shared.js';

// AI Chat Bubble Loader - FlagFit Pro
// Dynamically loads the AI chat bubble component into pages that need it

const AI_CHAT_BUBBLE_HTML = `
<div class="ai-chat-bubble">
  <button class="ai-chat-button">💬 "Ask FlagFit Assistant"</button>
</div>
`;

/**
 * Initialize AI Chat Button functionality
 */
function initializeAIChatButton() {
  const aiChatBtn = document.querySelector(".ai-chat-button");
  if (!aiChatBtn) {
    return;
  }

  aiChatBtn.addEventListener("click", handleAIChat);
}

/**
 * Handle AI Chat Button Click
 */
async function handleAIChat(e) {
  e.preventDefault();

  const chatButton = e.target.closest(".ai-chat-button") || e.target;

  // Add visual feedback
  chatButton.style.transform = "scale(0.95)";
  setTimeout(() => {
    chatButton.style.transform = "scale(1)";
  }, 150);

  // Open the chatbot modal
  try {
    // Import and open chatbot
    const chatbotModule = await import("./chatbot.js");
    const { flagFitChatbot } = chatbotModule;

    if (flagFitChatbot && typeof flagFitChatbot.open === "function") {
      flagFitChatbot.open();
    } else {
      throw new Error("Chatbot module not properly initialized");
    }
  } catch (error) {
    logger.error("Failed to load chatbot:", error);

    // Try to use global chatbot if available
    if (
      window.flagFitChatbot &&
      typeof window.flagFitChatbot.open === "function"
    ) {
      window.flagFitChatbot.open();
    } else {
      // Last resort: show alert
      alert(
        "AI Assistant Chat\n\nAsk me about:\n• Sports psychology & mental training\n• Nutrition & supplements\n• Speed & agility development\n• Injury prevention & treatment\n• Recovery strategies\n• Training programs",
      );
    }
  }
}

/**
 * Load AI chat bubble into the page
 * Looks for data-ai-chat-container attribute
 */
export function loadAIChatBubble() {
  const container = document.querySelector("[data-ai-chat-container]");
  if (!container) {
    return; // No container found, skip loading
  }

  // Check if already loaded
  if (container.querySelector(".ai-chat-bubble")) {
    return; // Already loaded
  }

  // Insert AI chat bubble HTML
  setSafeContent(container, AI_CHAT_BUBBLE_HTML, true, true);

  // Initialize chat button functionality
  initializeAIChatButton();
}

// Auto-load on DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadAIChatBubble);
} else {
  loadAIChatBubble();
}
