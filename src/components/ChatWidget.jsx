import React, { useState, useRef, useEffect } from 'react';
import './ChatWidget.css';

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      text: 'Welcome to FlagFit Pro! How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Ref to track timeout for cleanup
  const responseTimeoutRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Clear any existing timeout
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }

    // Simulate AI response with cleanup
    responseTimeoutRef.current = setTimeout(() => {
      const responses = [
        "Great question! Let me help you with that training insight.",
        "Based on your performance data, I recommend focusing on these areas.",
        "Your progress has been excellent! Here's what to work on next.",
        "I can help you optimize your flag football training routine.",
        "That's a smart approach. Here are some additional tips."
      ];

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
      responseTimeoutRef.current = null;
    }, 1000);
  };

  const handleQuickAction = (action) => {
    const quickActions = {
      'training-tip': 'Give me a training tip for today',
      'nutrition-advice': 'What should I eat before training?',
      'recovery-help': 'How can I improve my recovery?',
      'schedule-help': 'Help me plan my training schedule'
    };

    setInputValue(quickActions[action] || action);
    inputRef.current?.focus();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-widget">
      <div
        className="chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle AI Coach Chat"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsOpen(!isOpen);
          }
        }}
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && messages.length > 1 && (
          <div className="chat-notification" aria-label="New messages">
            {messages.length - 1}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="chat-window active">
          <div className="chat-header">
            <div className="chat-title">
              🏈 AI Coach
              <div className="chat-status">
                <div className="status-indicator" aria-label="Online"></div>
                <span>Online</span>
              </div>
            </div>
            <button
              className="chat-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.type}`}>
                <div className={`message-avatar ${message.type}`}>
                  {message.type === 'user' ? '👤' : '🏈'}
                </div>
                <div className={`message-content ${message.type}`}>
                  <div className="message-text">{message.text}</div>
                  <div className={`message-time ${message.type}`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="typing-indicator active">
                <span>AI Coach is typing</span>
                <div className="typing-dots">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-quick-actions">
            <button
              className="quick-action"
              onClick={() => handleQuickAction('training-tip')}
            >
              💪 Training Tip
            </button>
            <button
              className="quick-action"
              onClick={() => handleQuickAction('nutrition-advice')}
            >
              🥗 Nutrition
            </button>
            <button
              className="quick-action"
              onClick={() => handleQuickAction('recovery-help')}
            >
              😴 Recovery
            </button>
          </div>

          <form className="chat-input" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask your AI coach anything..."
              disabled={isTyping}
              maxLength={500}
            />
            <button
              type="submit"
              className="chat-send"
              disabled={!inputValue.trim() || isTyping}
              aria-label="Send message"
            >
              {isTyping ? '⏳' : '➤'}
              <span className="sr-only">Send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;