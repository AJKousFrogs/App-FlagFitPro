// Chat Page JavaScript Module
import { authManager } from "../../auth-manager.js";
import { apiClient } from "../../api-config.js";
import { ErrorHandler } from "../../error-handler.js";
import { errorHandler } from "../utils/unified-error-handler.js";
import { AccessibilityUtils } from "../../accessibility-utils.js";
import { logger } from "../../logger.js";
import {
  escapeHtml,
  getInitials,
  formatTime,
  scrollToBottom,
  initializeLucideIcons,
  getMessageStatusHtml,
  getMessageActionsHtml,
  announceToScreenReader,
  setSafeContent,
} from "../utils/shared.js";
import { storageService } from "../services/storage-service-unified.js";

let currentChannel = "team-general";
let typingTimeout;
let lastMessageTime = 0;
let lastMessageAuthor = null;
const MESSAGE_GROUP_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

// Store interval IDs for cleanup
let messageInterval;
let typingInterval;

async function initChatPage() {
  if (!authManager.requireAuth()) {return;}

  // Check for channel parameter in URL (e.g., ?channel=flagfit-assistant)
  const urlParams = new URLSearchParams(window.location.search);
  const requestedChannel = urlParams.get("channel");

  if (requestedChannel) {
    // Check if channel exists, if not create it
    await ensureChannelExists(requestedChannel);
    // Select the requested channel
    selectChannelByName(requestedChannel);
  }

  setupMessageInput();
  setupChannelSwitching();
  setupCallButtons();
  setupChannelSettings();
  await loadMessages();

  // Load any stored messages for current channel
  loadMessagesFromStorage();

  // Simulate real-time updates (store IDs for cleanup)
  messageInterval = setInterval(simulateNewMessages, 15000);
  typingInterval = setInterval(simulateTyping, 30000);
}

// Ensure a channel exists, create it if it doesn't
async function ensureChannelExists(channelName) {
  const channelsList = document.getElementById("channelsList");
  if (!channelsList) {return;}

  // Check if channel already exists
  const existingChannel = channelsList.querySelector(
    `[data-channel="${channelName}"]`,
  );
  if (existingChannel) {
    return; // Channel already exists
  }

  // Special handling for AI assistant channel
  if (channelName === "flagfit-assistant") {
    createAIAssistantChannel();
    
  }

  // For other channels, they would need to be created through the normal flow
  // or we could create them here if needed
}

// Create the AI Assistant channel
function createAIAssistantChannel() {
  const channelsList = document.getElementById("channelsList");
  if (!channelsList) {return;}

  // Find where to insert (after Direct Messages category or at end)
  const dmCategory = Array.from(
    channelsList.querySelectorAll(".channel-category"),
  ).find((cat) => cat.textContent.includes("Direct Messages"));

  // Create channel item
  const channelItem = document.createElement("div");
  channelItem.className = "channel-item";
  channelItem.dataset.channel = "flagfit-assistant";
  channelItem.setAttribute("role", "button");
  channelItem.setAttribute("tabindex", "0");
  channelItem.setAttribute("aria-label", "Channel: FlagFit AI Assistant");

  const icon = document.createElement("span");
  icon.className = "channel-icon";
  icon.textContent = "🤖";
  const info = document.createElement("div");
  info.className = "channel-info";
  const name = document.createElement("div");
  name.className = "channel-name";
  name.textContent = "FlagFit AI Assistant";
  const preview = document.createElement("div");
  preview.className = "channel-preview";
  preview.textContent = "Ask me about training, nutrition, and performance";
  info.appendChild(name);
  info.appendChild(preview);
  channelItem.appendChild(icon);
  channelItem.appendChild(info);

  // Add click handler
  channelItem.addEventListener("click", function () {
    selectChannel(this);
  });

  // Add keyboard navigation
  channelItem.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectChannel(this);
    }
  });

  // Insert after DM category or at end
  if (dmCategory && dmCategory.nextSibling) {
    channelsList.insertBefore(channelItem, dmCategory.nextSibling);
  } else {
    channelsList.appendChild(channelItem);
  }

  // Add welcome message for AI assistant
  const welcomeMessage = {
    author: "system",
    authorName: "FlagFit AI Assistant",
    text: "👋 Hello! I'm your FlagFit AI Assistant. I can help you with:\n\n• Training tips and techniques\n• Nutrition and supplement advice\n• Performance tracking insights\n• Recovery strategies\n• Injury prevention\n\nWhat would you like to know?",
    timestamp: new Date().toISOString(),
  };

  // Save welcome message to storage
  saveMessageToStorage({
    channel: "flagfit-assistant",
    ...welcomeMessage,
  });
}

// Select channel by name (helper function)
function selectChannelByName(channelName) {
  const channelItem = document.querySelector(`[data-channel="${channelName}"]`);
  if (channelItem) {
    selectChannel(channelItem);
  } else {
    // Channel doesn't exist yet, wait a bit and try again
    setTimeout(() => {
      const retryItem = document.querySelector(
        `[data-channel="${channelName}"]`,
      );
      if (retryItem) {
        selectChannel(retryItem);
      }
    }, 100);
  }
}

// Cleanup function for chat page
function cleanupChatPage() {
  if (messageInterval) {
    clearInterval(messageInterval);
    messageInterval = null;
  }
  if (typingInterval) {
    clearInterval(typingInterval);
    typingInterval = null;
  }
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
}

// Cleanup on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", cleanupChatPage);
  window.addEventListener("pagehide", cleanupChatPage);
}

function setupMessageInput() {
  const input = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");

  input.addEventListener("input", function () {
    sendBtn.disabled = !this.value.trim();

    // Auto-resize textarea
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 100) + "px";

    // Show typing indicator to others (simulated)
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      // Stop typing indicator
    }, 1000);
  });

  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener("click", sendMessage);
}

function setupChannelSwitching() {
  const channelItems = document.querySelectorAll(".channel-item");

  channelItems.forEach((item) => {
    // Click handler
    item.addEventListener("click", function () {
      selectChannel(this);
    });

    // Keyboard navigation
    item.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectChannel(this);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = this.nextElementSibling;
        if (next && next.classList.contains("channel-item")) {
          next.focus();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = this.previousElementSibling;
        if (prev && prev.classList.contains("channel-item")) {
          prev.focus();
        }
      }
    });
  });
}

function setupCallButtons() {
  const videoCallBtn = document.getElementById("videoCallBtn");
  const voiceCallBtn = document.getElementById("voiceCallBtn");

  if (videoCallBtn) {
    videoCallBtn.addEventListener("click", startGoogleMeetCall);
  }

  if (voiceCallBtn) {
    voiceCallBtn.addEventListener("click", startGoogleMeetCall);
  }
}

function setupChannelSettings() {
  const settingsBtn = document.getElementById("channelSettingsBtn");
  if (!settingsBtn) {return;}

  const user = authManager.getCurrentUser();
  const userRole = authManager.getUserRole();

  // Check if user is a coach, moderator, or admin
  const canCreateChannels = [
    "coach",
    "moderator",
    "admin",
    "assistant_coach",
  ].includes(userRole?.toLowerCase());

  if (canCreateChannels) {
    settingsBtn.addEventListener("click", openChannelSettings);
    settingsBtn.setAttribute(
      "aria-label",
      "Channel settings - Create new channel",
    );
  } else {
    // Disable button for regular players
    settingsBtn.disabled = true;
    settingsBtn.setAttribute(
      "aria-label",
      "Channel settings - Only coaches and moderators can create channels",
    );
    settingsBtn.style.opacity = "0.5";
    settingsBtn.style.cursor = "not-allowed";
  }
}

function isModeratorOrCoach() {
  const userRole = authManager.getUserRole()?.toLowerCase();
  return ["coach", "moderator", "admin", "assistant_coach"].includes(userRole);
}

function openChannelSettings() {
  if (!isModeratorOrCoach()) {
    AccessibilityUtils.announce(
      "Only coaches and moderators can create channels.",
      "polite",
    );
    return;
  }

  // Create modal for channel creation
  const modal = document.createElement("div");
  modal.className = "channel-create-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "channel-modal-title");
  modal.setAttribute("aria-modal", "true");

  // Build modal HTML (static content, safe)
  const modalHtml = `
    <div class="channel-modal-overlay"></div>
    <div class="channel-modal-content">
      <div class="channel-modal-header">
        <h2 id="channel-modal-title">Create New Channel</h2>
        <button class="channel-modal-close" aria-label="Close dialog">
          <i data-lucide="x" class="icon-18"></i>
        </button>
      </div>
      <form id="channelCreateForm" class="channel-modal-form">
        <div class="form-group">
          <label for="channelName">Channel Name</label>
          <input
            type="text"
            id="channelName"
            name="channelName"
            placeholder="e.g., strategy, training, announcements"
            required
            pattern="[a-z0-9-]+"
            title="Channel name must be lowercase letters, numbers, and hyphens only"
            aria-describedby="channelNameHelp"
          />
          <small id="channelNameHelp" class="form-help">
            Use lowercase letters, numbers, and hyphens only. Channel names cannot be changed.
          </small>
        </div>
        <div class="form-group">
          <label for="channelDescription">Description (Optional)</label>
          <textarea
            id="channelDescription"
            name="channelDescription"
            rows="3"
            placeholder="What is this channel for?"
          ></textarea>
        </div>
        <div class="form-group">
          <label for="channelType">Channel Type</label>
          <select id="channelType" name="channelType" required>
            <option value="public">Public - All team members can join</option>
            <option value="private">Private - Invite only</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-secondary channel-modal-cancel">Cancel</button>
          <button type="submit" class="btn-primary">Create Channel</button>
        </div>
      </form>
    </div>
  `;

  // Use setSafeContent to sanitize HTML before insertion
  setSafeContent(modal, modalHtml, true, true);
  
  // Replace onclick with addEventListener
  const overlay = modal.querySelector('.channel-modal-overlay');
  const closeBtn = modal.querySelector('.channel-modal-close');
  const cancelBtn = modal.querySelector('.channel-modal-cancel');
  
  if (overlay) {
    overlay.addEventListener('click', () => closeChannelModal());
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeChannelModal());
  }
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => closeChannelModal());
  }

  document.body.appendChild(modal);

  // Initialize Lucide icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons(modal);
  }

  // Focus on channel name input
  setTimeout(() => {
    const channelNameInput = document.getElementById("channelName");
    if (channelNameInput) {
      channelNameInput.focus();
    }
  }, 100);

  // Handle form submission
  const form = document.getElementById("channelCreateForm");
  form.addEventListener("submit", handleChannelCreation);

  // Close on Escape key
  modal.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeChannelModal();
    }
  });
}

function closeChannelModal() {
  const modal = document.querySelector(".channel-create-modal");
  if (modal) {
    modal.remove();
  }
}

// Make function globally accessible for onclick handlers
window.closeChannelModal = closeChannelModal;

async function handleChannelCreation(e) {
  e.preventDefault();

  const form = e.target;
  const channelName = document
    .getElementById("channelName")
    .value.trim()
    .toLowerCase();
  const channelDescription = document
    .getElementById("channelDescription")
    .value.trim();
  const channelType = document.getElementById("channelType").value;

  if (!channelName) {
    AccessibilityUtils.announce("Channel name is required.", "polite");
    return;
  }

  // Validate channel name format
  if (!/^[a-z0-9-]+$/.test(channelName)) {
    AccessibilityUtils.announce(
      "Channel name can only contain lowercase letters, numbers, and hyphens.",
      "polite",
    );
    return;
  }

  // Check if channel already exists
  const existingChannels = document.querySelectorAll(".channel-item");
  const channelExists = Array.from(existingChannels).some(
    (item) => item.dataset.channel === channelName,
  );

  if (channelExists) {
    AccessibilityUtils.announce(
      `Channel "${channelName}" already exists.`,
      "polite",
    );
    return;
  }

  try {
    const user = authManager.getCurrentUser();

    // Create channel via API (if available) or localStorage
    const newChannel = {
      name: channelName,
      description: channelDescription,
      type: channelType,
      createdBy: user?.email || "unknown",
      createdAt: new Date().toISOString(),
      members: [user?.email || "unknown"],
    };

    // Save to localStorage
    const channels = JSON.parse(localStorage.getItem("chat_channels") || "[]");
    channels.push(newChannel);
    localStorage.setItem("chat_channels", JSON.stringify(channels));

    // Add channel to UI
    addChannelToSidebar(newChannel);

    // Announce success
    AccessibilityUtils.announce(
      `Channel "${channelName}" created successfully.`,
      "polite",
    );

    // Close modal
    closeChannelModal();

    // Switch to new channel
    setTimeout(() => {
      const newChannelItem = document.querySelector(
        `[data-channel="${channelName}"]`,
      );
      if (newChannelItem) {
        selectChannel(newChannelItem);
      }
    }, 100);
  } catch (error) {
    logger.error("Failed to create channel:", error);
    ErrorHandler.handleError(error, "Failed to create channel");
  }
}

function addChannelToSidebar(channel) {
  const channelsList = document.getElementById("channelsList");
  if (!channelsList) {return;}

  // Find where to insert (after Team Channels category)
  const teamChannelsCategory = channelsList.querySelector(".channel-category");
  let insertAfter = teamChannelsCategory;

  // Find the last team channel item
  const teamChannels = Array.from(
    channelsList.querySelectorAll(".channel-item"),
  );
  const lastTeamChannel = teamChannels.find((item) => {
    const nextSibling = item.nextElementSibling;
    return nextSibling && nextSibling.classList.contains("channel-category");
  });

  if (lastTeamChannel) {
    insertAfter = lastTeamChannel;
  }

  // Create channel item
  const channelItem = document.createElement("div");
  channelItem.className = "channel-item";
  channelItem.dataset.channel = channel.name;
  channelItem.setAttribute("role", "button");
  channelItem.setAttribute("tabindex", "0");
  channelItem.setAttribute("aria-label", `Channel: ${channel.name}`);

  const icon = document.createElement("span");
  icon.className = "channel-icon";
  icon.textContent = "#";
  const info = document.createElement("div");
  info.className = "channel-info";
  const name = document.createElement("div");
  name.className = "channel-name";
  name.textContent = channel.name;
  info.appendChild(name);
  if (channel.description) {
    const preview = document.createElement("div");
    preview.className = "channel-preview";
    preview.textContent = channel.description;
    info.appendChild(preview);
  }
  channelItem.appendChild(icon);
  channelItem.appendChild(info);

  // Add click handler
  channelItem.addEventListener("click", function () {
    selectChannel(this);
  });

  // Add keyboard navigation
  channelItem.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectChannel(this);
    }
  });

  // Insert after the last team channel
  if (insertAfter && insertAfter.nextSibling) {
    channelsList.insertBefore(channelItem, insertAfter.nextSibling);
  } else {
    channelsList.appendChild(channelItem);
  }
}

async function startGoogleMeetCall() {
  try {
    const user = authManager.getCurrentUser();
    const channelName = currentChannel;

    // Use Google Meet's instant meeting creation URL
    const meetUrl = "https://meet.google.com/new";

    // Create a meeting name based on channel
    const meetingName = `${channelName.replace(/-/g, " ")} - ${new Date().toLocaleDateString()}`;

    // Post meeting info to chat
    const meetingMessage = `🎥 Starting Google Meet call for ${meetingName}\n\nClick the link to join: ${meetUrl}`;

    // Add meeting message to UI
    addMessageToUI(
      {
        author: user?.email || "system",
        authorName: user?.name || "System",
        text: meetingMessage,
        timestamp: new Date().toISOString(),
      },
      false,
    );

    // Save to storage
    saveMessageToStorage({
      channel: currentChannel,
      author: user?.email || "system",
      authorName: user?.name || "System",
      text: meetingMessage,
      timestamp: new Date().toISOString(),
    });

    // Open Google Meet in new window/tab
    const meetWindow = window.open(
      meetUrl,
      "_blank",
      "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no",
    );

    if (!meetWindow) {
      // If popup blocked, try direct navigation
      AccessibilityUtils.announce(
        "Popup blocked. Opening Google Meet in new tab.",
        "polite",
      );
      window.open(meetUrl, "_blank");
    }

    // Announce to screen readers
    announceToScreenReader(
      `Google Meet call started. Meeting link posted to chat.`,
      "polite",
    );

    scrollToBottom("messagesContainer");
  } catch (error) {
    logger.error("Failed to start Google Meet call:", error);
    ErrorHandler.handleError(error, "Failed to start video call");

    // Fallback: Open Google Meet directly
    window.open("https://meet.google.com/new", "_blank");
  }
}

function selectChannel(item) {
  const channelItems = document.querySelectorAll(".channel-item");

  // Remove active class from all items
  channelItems.forEach((i) => i.classList.remove("active"));

  // Add active class to selected item
  item.classList.add("active");

  // Update current channel
  currentChannel = item.dataset.channel;
  document.getElementById("currentChannelName").textContent = currentChannel;

  // Remove unread count
  const unreadCount = item.querySelector(".unread-count");
  if (unreadCount) {
    unreadCount.remove();
  }

  // Reset grouping state
  lastMessageAuthor = null;
  lastMessageTime = 0;

  // Load messages for new channel
  loadMessages();
}

async function loadMessages() {
  try {
    const response = await apiClient.get(
      `/api/chat/messages/${currentChannel}`,
    );

    if (response.success && response.data.messages) {
      updateMessagesContainer(response.data.messages);
    } else {
      // Load from localStorage if API fails
      loadMessagesFromStorage();
    }
  } catch (error) {
    logger.error("Failed to load messages:", error);
    // Load from localStorage as fallback
    loadMessagesFromStorage();
    scrollToBottom();
  }
}

function updateMessagesContainer(messages) {
  const container = document.getElementById("messagesContainer");
  if (!container) {return;}

  const currentUser = authManager.getCurrentUser();

  // Reset grouping state
  lastMessageAuthor = null;
  lastMessageTime = 0;

  // Use DocumentFragment for batch DOM operations (prevents reflows)
  const fragment = document.createDocumentFragment();

  messages.forEach((msg, index) => {
    const isOwn = msg.author === currentUser?.email;
    const msgTime = new Date(msg.timestamp).getTime();
    const msgAuthor = msg.author || msg.authorName;

    // Check if message should be grouped
    const shouldGroup =
      lastMessageAuthor === msgAuthor &&
      msgTime - lastMessageTime < MESSAGE_GROUP_THRESHOLD;

    // Update tracking variables
    lastMessageAuthor = msgAuthor;
    lastMessageTime = msgTime;

    const groupedClass = shouldGroup ? "grouped" : "";
    const statusHtml = isOwn ? getMessageStatusHtml(msg.status || "read") : "";
    const actionsHtml = getMessageActionsHtml(isOwn);

    // Create message element
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isOwn ? "own" : ""} ${groupedClass}`;
    messageDiv.setAttribute("role", "article");
    messageDiv.setAttribute(
      "aria-label",
      `Message from ${isOwn ? "You" : msg.authorName} at ${formatTime(msg.timestamp)}`,
    );

    // SECURITY: Sanitize author name to prevent XSS
    const safeAuthorName = escapeHtml(msg.authorName || msg.author || 'Unknown');

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = getInitials(safeAuthorName);
    
    const content = document.createElement("div");
    content.className = "message-content";
    
    const header = document.createElement("div");
    header.className = "message-header";
    const author = document.createElement("span");
    author.className = "message-author";
    author.textContent = isOwn ? "You" : safeAuthorName;
    const time = document.createElement("span");
    time.className = "message-time";
    time.setAttribute("aria-label", formatTime(msg.timestamp));
    time.textContent = formatTime(msg.timestamp);
    header.appendChild(author);
    header.appendChild(time);
    
    const text = document.createElement("div");
    text.className = "message-text";
    text.textContent = msg.text;
    
    content.appendChild(header);
    content.appendChild(text);
    
    // Add status and actions HTML using setSafeContent
    if (statusHtml) {
      const tempStatus = document.createElement("div");
      setSafeContent(tempStatus, statusHtml, true, true);
      while (tempStatus.firstChild) {
        content.appendChild(tempStatus.firstChild);
      }
    }
    if (actionsHtml) {
      const tempActions = document.createElement("div");
      setSafeContent(tempActions, actionsHtml, true, true);
      while (tempActions.firstChild) {
        content.appendChild(tempActions.firstChild);
      }
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);

    fragment.appendChild(messageDiv);
  });

  // Single DOM update - clear and append fragment
  container.textContent = "";
  container.appendChild(fragment);

  // Initialize Lucide icons for new messages
  initializeLucideIcons();

  scrollToBottom("messagesContainer");
}

async function sendMessage() {
  const input = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const message = input.value.trim();

  if (!message) {return;}

  const user = authManager.getCurrentUser();

  // Show loading state with accessibility
  // Store original button content safely using temp container pattern
  const tempContainer = document.createElement('div');
  tempContainer.appendChild(sendBtn.cloneNode(true));
  // eslint-disable-next-line no-restricted-syntax -- Safe extraction of existing button HTML for restoration (temp container pattern)
  const originalBtnText = tempContainer.innerHTML;
  sendBtn.textContent = "";
  const loadingSpan = document.createElement("span");
  loadingSpan.setAttribute("aria-hidden", "true");
  loadingSpan.textContent = "⏳";
  sendBtn.appendChild(loadingSpan);
  sendBtn.disabled = true;
  sendBtn.setAttribute("aria-label", "Sending message...");

  try {
    const response = await apiClient.post("/api/chat/send", {
      channel: currentChannel,
      message: message,
    });

    if (response.success) {
      // Add message to UI immediately with "sent" status
      addMessageToUI(
        {
          author: user.email,
          authorName: user.name || "You",
          text: message,
          timestamp: new Date().toISOString(),
          status: "sent",
        },
        true,
      );

      // Simulate status progression
      setTimeout(() => {
        updateMessageStatus("delivered");
      }, 500);

      setTimeout(() => {
        updateMessageStatus("read");
      }, 1500);

      // Save to localStorage for persistence
      saveMessageToStorage({
        channel: currentChannel,
        author: user.email,
        authorName: user.name || "You",
        text: message,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    logger.error("Failed to send message:", error);

    // Still add to UI for demo purposes with graceful fallback
    addMessageToUI(
      {
        author: user.email,
        authorName: user.name || "You",
        text: message,
        timestamp: new Date().toISOString(),
        status: "sent",
      },
      true,
    );

    // Save to localStorage for offline functionality
    saveMessageToStorage({
      channel: currentChannel,
      author: user.email,
      authorName: user.name || "You",
      text: message,
      timestamp: new Date().toISOString(),
    });

    // Simulate team response for better demo experience
    setTimeout(
      () => {
        simulateTeamResponse(message);
      },
      Math.random() * 3000 + 1000,
    ); // Random delay 1-4 seconds
  }

  // Reset form state
  input.value = "";
  input.style.height = "auto";
  // Restore original button content - use temp container to safely restore HTML
  const temp = document.createElement("div");
  setSafeContent(temp, originalBtnText, true, true);
  sendBtn.textContent = "";
  while (temp.firstChild) {
    sendBtn.appendChild(temp.firstChild);
  }
  sendBtn.disabled = true;
  sendBtn.setAttribute("aria-label", "Send message");

  // Re-initialize Lucide icons for send button
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // Focus back to input for better UX
  input.focus();

  // Announce message sent to screen readers
  AccessibilityUtils.announce("Message sent", "polite");

  scrollToBottom();
}

function saveMessageToStorage(message) {
  const storageKey = `chat_messages_${currentChannel}`;
  const existingMessages = storageService.get(storageKey, []);
  existingMessages.push(message);

  // Keep only last 50 messages per channel to prevent storage bloat
  if (existingMessages.length > 50) {
    existingMessages.splice(0, existingMessages.length - 50);
  }

  storageService.set(storageKey, existingMessages);
}

function loadMessagesFromStorage() {
  const storageKey = `chat_messages_${currentChannel}`;
  const storedMessages = storageService.get(storageKey, []);

  if (storedMessages.length > 0) {
    // Clear existing demo messages and load stored ones
    const container = document.getElementById("messagesContainer");
    container.textContent = "";

    storedMessages.forEach((msg) => {
      addMessageToUI(msg, msg.author === authManager.getCurrentUser()?.email);
    });

    scrollToBottom("messagesContainer");
  }
}

function simulateTeamResponse(originalMessage) {
  const responses = [
    {
      author: "Coach Mike",
      text: "Good point! Let's discuss this more at practice.",
    },
    {
      author: "Sarah (Captain)",
      text: "I agree! This will definitely help our game strategy.",
    },
    { author: "Jake Davis", text: "Thanks for sharing! Very helpful." },
    {
      author: "Alex Lopez",
      text: "Absolutely! Can't wait to try this out.",
    },
    {
      author: "Riley Johnson",
      text: "Great idea! This could be a game changer.",
    },
  ];

  // Select random response that makes sense
  const randomResponse =
    responses[Math.floor(Math.random() * responses.length)];

  // Add typing indicator first
  const typingIndicator = document.getElementById("typingIndicator");
  typingIndicator.querySelector("span").textContent =
    `${randomResponse.author} is typing`;
  typingIndicator.classList.add("visible");

  setTimeout(() => {
    typingIndicator.classList.remove("visible");

    addMessageToUI({
      authorName: randomResponse.author,
      text: randomResponse.text,
      timestamp: new Date().toISOString(),
    });

    // Save simulated response to storage
    saveMessageToStorage({
      channel: currentChannel,
      author: randomResponse.author.toLowerCase().replace(/\s+/g, "."),
      authorName: randomResponse.author,
      text: randomResponse.text,
      timestamp: new Date().toISOString(),
    });

    scrollToBottom("messagesContainer");
  }, 2000); // Show typing for 2 seconds
}

function addMessageToUI(message, isOwn = false) {
  const container = document.getElementById("messagesContainer");
  const msgTime = new Date(message.timestamp).getTime();
  const msgAuthor = message.author || message.authorName;

  // Check if message should be grouped with previous message
  const shouldGroup =
    lastMessageAuthor === msgAuthor &&
    msgTime - lastMessageTime < MESSAGE_GROUP_THRESHOLD;

  // Update tracking variables
  lastMessageAuthor = msgAuthor;
  lastMessageTime = msgTime;

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isOwn ? "own" : ""} ${shouldGroup ? "grouped" : ""}`;
  messageDiv.setAttribute("role", "article");
  messageDiv.setAttribute(
    "aria-label",
    `Message from ${isOwn ? "You" : message.authorName} at ${formatTime(message.timestamp)}`,
  );

  const statusHtml = isOwn
    ? getMessageStatusHtml(message.status || "sent")
    : "";
  const actionsHtml = getMessageActionsHtml(isOwn);

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = getInitials(message.authorName);
  
  const content = document.createElement("div");
  content.className = "message-content";
  
  const header = document.createElement("div");
  header.className = "message-header";
  const author = document.createElement("span");
  author.className = "message-author";
  author.textContent = message.authorName;
  const time = document.createElement("span");
  time.className = "message-time";
  time.setAttribute("aria-label", formatTime(message.timestamp));
  time.textContent = formatTime(message.timestamp);
  header.appendChild(author);
  header.appendChild(time);
  
  const text = document.createElement("div");
  text.className = "message-text";
  text.textContent = message.text;
  
  content.appendChild(header);
  content.appendChild(text);
  
  // Add status and actions HTML using temp containers
  if (statusHtml) {
    const tempStatus = document.createElement("div");
    setSafeContent(tempStatus, statusHtml, true, true);
    while (tempStatus.firstChild) {
      content.appendChild(tempStatus.firstChild);
    }
  }
  if (actionsHtml) {
    const tempActions = document.createElement("div");
    setSafeContent(tempActions, actionsHtml, true, true);
    while (tempActions.firstChild) {
      content.appendChild(tempActions.firstChild);
    }
  }
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);

  container.appendChild(messageDiv);

  // Initialize Lucide icons
  initializeLucideIcons(messageDiv);
}

function simulateNewMessages() {
  if (Math.random() < 0.3) {
    // 30% chance of new message
    const messages = [
      {
        author: "Coach Mike",
        text: "Don't forget tomorrow's game starts at 10 AM sharp!",
      },
      {
        author: "Sarah (Captain)",
        text: "Great hustle in practice today everyone!",
      },
      {
        author: "Jake Davis",
        text: "Who's bringing the team snacks this week?",
      },
      {
        author: "Alex Lopez",
        text: "Just finished reviewing the game film. We're looking good!",
      },
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    addMessageToUI({
      authorName: randomMessage.author,
      text: randomMessage.text,
      timestamp: new Date().toISOString(),
    });

    scrollToBottom();
  }
}

function simulateTyping() {
  if (Math.random() < 0.2) {
    // 20% chance of typing indicator
    const typingIndicator = document.getElementById("typingIndicator");
    typingIndicator.classList.add("visible");

    setTimeout(() => {
      typingIndicator.classList.remove("visible");
    }, 3000);
  }
}

function updateMessageStatus(status) {
  const messages = document.querySelectorAll(".message.own");
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    const statusDiv = lastMessage.querySelector(".message-status");
    if (statusDiv) {
      const statusIcons = {
        sent: "check",
        delivered: "check-check",
        read: "check-check",
      };

      const statusClasses = {
        sent: "status-sent",
        delivered: "status-delivered",
        read: "status-read",
      };

      const icon = statusIcons[status] || "check";
      const statusClass = statusClasses[status] || "status-sent";

      statusDiv.textContent = "";
      const statusIcon = document.createElement("i");
      statusIcon.setAttribute("data-lucide", icon);
      statusIcon.className = `${statusClass} icon-14`;
      statusDiv.appendChild(statusIcon);

      // Re-initialize Lucide icons
      if (typeof lucide !== "undefined") {
        lucide.createIcons(statusDiv);
      }
    }
  }
}

// Global function exports for onclick handlers
window.toggleSidebar = function () {
  // Use the universal mobile nav instance if available
  if (window.universalMobileNav) {
    window.universalMobileNav.toggleSidebar();
  } else if (window.FlagFitApp?.components?.mobileNav) {
    window.FlagFitApp.components.mobileNav.toggleSidebar();
  } else {
    // Fallback implementation
    const sidebar = document.getElementById("sidebar");
    const overlay = document.querySelector(".menu-scrim");
    const toggle = document.getElementById("mobile-menu-toggle");
    
    if (sidebar) {
      const isOpen = sidebar.classList.contains("is-open");
      if (isOpen) {
        sidebar.classList.remove("is-open");
        overlay?.classList.remove("is-visible");
        toggle?.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      } else {
        sidebar.classList.add("is-open");
        overlay?.classList.add("is-visible");
        toggle?.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
      }
    }
  }
};

window.closeMenu = function () {
  // Alias for toggleSidebar to close menu
  if (window.universalMobileNav) {
    window.universalMobileNav.closeSidebar();
  } else if (window.FlagFitApp?.components?.mobileNav) {
    window.FlagFitApp.components.mobileNav.closeSidebar();
  } else {
    // Fallback implementation
    const sidebar = document.getElementById("sidebar");
    const overlay = document.querySelector(".menu-scrim");
    const toggle = document.getElementById("mobile-menu-toggle");
    
    if (sidebar) {
      sidebar.classList.remove("is-open");
      overlay?.classList.remove("is-visible");
      toggle?.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }
  }
};

// Initialize when page loads
document.addEventListener("DOMContentLoaded", initChatPage);
