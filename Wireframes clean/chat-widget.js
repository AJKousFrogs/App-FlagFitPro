/* Chat Widget JavaScript for FlagFit Pro Wireframes */

class ChatWidget {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isTyping = false;
        this.init();
    }

    init() {
        this.createChatWidget();
        this.setupEventListeners();
        this.addWelcomeMessage();
    }

    createChatWidget() {
        const chatWidget = document.createElement('div');
        chatWidget.className = 'chat-widget';
        chatWidget.innerHTML = `
            <button class="chat-toggle" aria-label="Open chat support" aria-expanded="false">
                💬
                <div class="chat-notification" style="display: none;">3</div>
            </button>
            <div class="chat-window" role="dialog" aria-label="Chat Support">
                <div class="chat-header">
                    <div class="chat-title">
                        <span>💬</span>
                        <span>FlagFit Pro Support</span>
                    </div>
                    <div class="chat-status">
                        <div class="status-indicator"></div>
                        <span>Online</span>
                    </div>
                    <button class="chat-close" aria-label="Close chat">×</button>
                </div>
                <div class="chat-messages" role="log" aria-label="Chat messages">
                    <!-- Messages will be added here -->
                </div>
                <div class="typing-indicator">
                    <span>AI Coach is typing</span>
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
                <div class="chat-quick-actions">
                    <button class="quick-action" data-action="training">Training Help</button>
                    <button class="quick-action" data-action="nutrition">Nutrition</button>
                    <button class="quick-action" data-action="recovery">Recovery</button>
                    <button class="quick-action" data-action="schedule">Schedule</button>
                </div>
                <div class="chat-input">
                    <input type="text" placeholder="Type your message..." aria-label="Chat message input">
                    <button class="chat-send" aria-label="Send message">
                        <span>Send</span>
                        <span aria-hidden="true">📤</span>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(chatWidget);
        this.chatWidget = chatWidget;
        this.chatToggle = chatWidget.querySelector('.chat-toggle');
        this.chatWindow = chatWidget.querySelector('.chat-window');
        this.chatMessages = chatWidget.querySelector('.chat-messages');
        this.chatInput = chatWidget.querySelector('.chat-input input');
        this.chatSend = chatWidget.querySelector('.chat-send');
        this.typingIndicator = chatWidget.querySelector('.typing-indicator');
        this.notification = chatWidget.querySelector('.chat-notification');
    }

    setupEventListeners() {
        // Toggle chat
        this.chatToggle.addEventListener('click', () => this.toggleChat());
        
        // Close chat
        this.chatWidget.querySelector('.chat-close').addEventListener('click', () => this.closeChat());
        
        // Send message
        this.chatSend.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        // Quick actions
        this.chatWidget.querySelectorAll('.quick-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                this.handleQuickAction(action);
            });
        });
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeChat();
            }
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.chatWidget.contains(e.target)) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.isOpen = true;
        this.chatWindow.classList.add('active');
        this.chatToggle.setAttribute('aria-expanded', 'true');
        this.chatInput.focus();
        this.hideNotification();
        
        // Announce to screen reader
        this.announceToScreenReader('Chat support opened');
    }

    closeChat() {
        this.isOpen = false;
        this.chatWindow.classList.remove('active');
        this.chatToggle.setAttribute('aria-expanded', 'false');
        this.hideTypingIndicator();
        
        // Announce to screen reader
        this.announceToScreenReader('Chat support closed');
    }

    sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;
        
        // Add user message
        this.addMessage(message, 'user');
        this.chatInput.value = '';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        // Simulate AI response
        setTimeout(() => {
            this.hideTypingIndicator();
            this.generateAIResponse(message);
        }, 1500 + Math.random() * 1000);
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-avatar ${sender}">
                ${sender === 'user' ? '👤' : '🤖'}
            </div>
            <div class="message-content">
                <p class="message-text">${this.escapeHtml(text)}</p>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Store message
        this.messages.push({ text, sender, time });
        
        // Announce to screen reader
        this.announceToScreenReader(`${sender === 'user' ? 'You said' : 'AI Coach said'}: ${text}`);
    }

    generateAIResponse(userMessage) {
        const responses = this.getAIResponses(userMessage.toLowerCase());
        const response = responses[Math.floor(Math.random() * responses.length)];
        this.addMessage(response, 'assistant');
    }

    getAIResponses(userMessage) {
        const responses = {
            training: [
                "Great question about training! I'd recommend focusing on your specific position drills today. Want me to show you some WR route running exercises?",
                "For training, consistency is key! I suggest starting with dynamic warm-ups, then moving to position-specific drills. Need a personalized workout plan?",
                "Your training progress looks great! Let's work on speed and agility today. I can create a custom session for you."
            ],
            nutrition: [
                "Nutrition is crucial for peak performance! Make sure you're getting enough protein and staying hydrated. Want me to suggest some pre-game meals?",
                "For optimal performance, focus on lean proteins, complex carbs, and plenty of water. I can help you plan your meals for the week!",
                "Your nutrition tracking shows you're doing well! Consider adding more protein-rich snacks between meals for better recovery."
            ],
            recovery: [
                "Recovery is just as important as training! Make sure you're getting 7-9 hours of sleep and doing proper cool-downs. Need some recovery exercises?",
                "Great recovery question! Focus on stretching, hydration, and rest. I can suggest some recovery techniques for your specific needs.",
                "Your recovery metrics look good! Consider adding some foam rolling to your routine for better muscle recovery."
            ],
            schedule: [
                "I can help you optimize your training schedule! Let's look at your current commitments and create a balanced plan.",
                "Your schedule looks busy! I can help you find the best times for training and recovery. Want me to suggest some adjustments?",
                "Great question about scheduling! I can help you create a weekly plan that balances training, recovery, and other commitments."
            ],
            default: [
                "Thanks for reaching out! I'm here to help with training, nutrition, recovery, or any other questions about your flag football journey.",
                "Great question! I can help you with training plans, nutrition advice, recovery techniques, or scheduling. What would you like to focus on?",
                "I'm here to support your flag football goals! Whether it's training, nutrition, recovery, or scheduling, I've got you covered."
            ]
        };
        
        if (userMessage.includes('training') || userMessage.includes('workout') || userMessage.includes('exercise')) {
            return responses.training;
        } else if (userMessage.includes('nutrition') || userMessage.includes('food') || userMessage.includes('diet')) {
            return responses.nutrition;
        } else if (userMessage.includes('recovery') || userMessage.includes('rest') || userMessage.includes('sleep')) {
            return responses.recovery;
        } else if (userMessage.includes('schedule') || userMessage.includes('time') || userMessage.includes('plan')) {
            return responses.schedule;
        } else {
            return responses.default;
        }
    }

    handleQuickAction(action) {
        const actionMessages = {
            training: "I need help with my training routine",
            nutrition: "Can you help me with nutrition advice?",
            recovery: "What recovery techniques do you recommend?",
            schedule: "I need help scheduling my workouts"
        };
        
        const message = actionMessages[action] || "I need help";
        this.chatInput.value = message;
        this.sendMessage();
    }

    showTypingIndicator() {
        this.isTyping = true;
        this.typingIndicator.classList.add('active');
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        this.typingIndicator.classList.remove('active');
    }

    showNotification(count = 1) {
        this.notification.textContent = count;
        this.notification.style.display = 'flex';
    }

    hideNotification() {
        this.notification.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    addWelcomeMessage() {
        setTimeout(() => {
            this.addMessage("Hey there! I'm your AI Coach. I'm here to help with training, nutrition, recovery, and anything else you need. How can I assist you today?", 'assistant');
        }, 1000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    announceToScreenReader(message) {
        // Create or find existing live region
        let liveRegion = document.getElementById('chat-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'chat-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }
        
        liveRegion.textContent = message;
    }

    // Public methods for external use
    open() {
        this.openChat();
    }

    close() {
        this.closeChat();
    }

    send(message) {
        this.chatInput.value = message;
        this.sendMessage();
    }
}

// Initialize chat widget when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.chatWidget = new ChatWidget();
    });
} else {
    window.chatWidget = new ChatWidget();
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatWidget;
} 