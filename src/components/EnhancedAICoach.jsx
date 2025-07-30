import React, { useState, useEffect, useRef } from 'react';
import { mcpService } from '../services/MCPService';
import { sequentialThoughtService } from '../services/SequentialThoughtService';
import { AICoachService } from '../services/AICoachService';

const EnhancedAICoach = ({ 
  userId, 
  context = {}, 
  onConversationUpdate = () => {},
  showInterface = true 
}) => {
  const [conversation, setConversation] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [coachPersonality, setCoachPersonality] = useState('supportive');
  const [researchMode, setResearchMode] = useState(true);
  const [reasoningDepth, setReasoningDepth] = useState('medium');
  const [mcpStatus, setMcpStatus] = useState({ connected: false });
  const [conversationHistory, setConversationHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const coachPersonalities = {
    'supportive': {
      name: 'Supportive Coach Sam',
      icon: '🤗',
      description: 'Encouraging and patient, focuses on positive reinforcement',
      style: 'warm and encouraging'
    },
    'analytical': {
      name: 'Analytical Coach Alex',
      icon: '🧠',
      description: 'Data-driven and methodical, loves breaking down performance',
      style: 'detailed and scientific'
    },
    'motivational': {
      name: 'Motivational Coach Mike',
      icon: '🔥',
      description: 'High-energy and inspiring, pushes you to excel',
      style: 'energetic and challenging'
    },
    'technical': {
      name: 'Technical Coach Taylor',
      icon: '⚙️',
      description: 'Focuses on technique refinement and skill development',
      style: 'precise and instructional'
    }
  };

  useEffect(() => {
    initializeMCPServices();
    loadConversationHistory();
    sendWelcomeMessage();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const initializeMCPServices = async () => {
    try {
      const status = await mcpService.initialize();
      setMcpStatus(status);
      console.log('🤖 Enhanced AI Coach MCP services initialized:', status);
    } catch (error) {
      console.warn('MCP services initialization failed:', error.message);
    }
  };

  const loadConversationHistory = async () => {
    try {
      // In a real app, this would load from database
      const mockHistory = [
        {
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          topic: 'Training Planning',
          summary: 'Discussed weekly training schedule optimization'
        },
        {
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          topic: 'Nutrition Strategy',
          summary: 'Analyzed pre-game meal timing and hydration'
        }
      ];
      setConversationHistory(mockHistory);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const sendWelcomeMessage = () => {
    const personality = coachPersonalities[coachPersonality];
    const welcomeMessage = {
      id: Date.now(),
      type: 'coach',
      content: `Hello! I'm ${personality.name} ${personality.icon}, your enhanced AI coach powered by the latest sports science research. I'm here to provide evidence-based guidance tailored specifically to your flag football journey. What would you like to work on today?`,
      timestamp: new Date().toISOString(),
      metadata: {
        personality: coachPersonality,
        enhanced: true,
        researchBacked: mcpStatus.connected
      }
    };
    
    setConversation([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setLoading(true);

    try {
      const response = await generateEnhancedResponse(currentMessage, conversation, context);
      
      const coachResponse = {
        id: Date.now() + 1,
        type: 'coach',
        content: response.content,
        timestamp: new Date().toISOString(),
        metadata: {
          ...response.metadata,
          personality: coachPersonality,
          researchBacked: response.researchBacked,
          confidenceLevel: response.confidence,
          reasoningUsed: response.reasoningUsed
        }
      };

      setConversation(prev => [...prev, coachResponse]);
      onConversationUpdate([...conversation, userMessage, coachResponse]);

    } catch (error) {
      console.error('Error generating coach response:', error);
      
      const errorResponse = {
        id: Date.now() + 1,
        type: 'coach',
        content: `I apologize, but I'm having some technical difficulties right now. Let me give you some general guidance: ${await getFallbackResponse(currentMessage)}`,
        timestamp: new Date().toISOString(),
        metadata: {
          error: true,
          fallback: true
        }
      };
      
      setConversation(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const generateEnhancedResponse = async (userInput, conversationHistory, userContext) => {
    const personality = coachPersonalities[coachPersonality];
    
    // Step 1: Analyze user intent and extract topics
    const intent = await analyzeUserIntent(userInput);
    
    // Step 2: Get relevant research if Context7 is available
    let researchData = null;
    if (researchMode && mcpStatus.servers?.context7) {
      try {
        researchData = await mcpService.searchSportsScience(intent.topics.join(' '), intent.category);
        console.log('📚 Retrieved research data for coaching response');
      } catch (error) {
        console.warn('Research retrieval failed:', error.message);
      }
    }

    // Step 3: Use Sequential Thought reasoning for complex questions
    let reasoning = null;
    if (intent.complexity === 'high' && mcpStatus.servers?.sequentialThought) {
      try {
        const reasoningType = mapIntentToReasoningType(intent);
        if (reasoningType) {
          reasoning = await sequentialThoughtService.performReasoning(
            reasoningType,
            { 
              userInput, 
              context: userContext, 
              conversationHistory: conversationHistory.slice(-5) // Last 5 messages for context
            },
            { depth: reasoningDepth === 'high' ? 3 : 2 }
          );
          console.log('🧠 Applied sequential reasoning to coaching response');
        }
      } catch (error) {
        console.warn('Sequential reasoning failed:', error.message);
      }
    }

    // Step 4: Generate personalized response
    const response = await generatePersonalizedResponse(
      userInput,
      intent,
      personality,
      researchData,
      reasoning,
      userContext
    );

    return response;
  };

  const analyzeUserIntent = async (userInput) => {
    const input = userInput.toLowerCase();
    
    // Simple intent classification
    let category = 'general';
    let topics = [];
    let complexity = 'low';

    // Categorize input
    if (input.includes('nutrition') || input.includes('eat') || input.includes('meal') || input.includes('diet')) {
      category = 'nutrition';
      topics = ['nutrition', 'diet', 'meal-planning'];
    } else if (input.includes('train') || input.includes('workout') || input.includes('exercise') || input.includes('drill')) {
      category = 'training';
      topics = ['training', 'exercise', 'skill-development'];
    } else if (input.includes('recover') || input.includes('rest') || input.includes('sleep') || input.includes('sore')) {
      category = 'recovery';
      topics = ['recovery', 'rest', 'sleep'];
    } else if (input.includes('injur') || input.includes('pain') || input.includes('hurt')) {
      category = 'injury-prevention';
      topics = ['injury-prevention', 'pain-management'];
      complexity = 'high';
    } else if (input.includes('strategy') || input.includes('tactic') || input.includes('play')) {
      category = 'strategy';
      topics = ['flag-football', 'strategy', 'tactics'];
    }

    // Determine complexity
    if (input.includes('why') || input.includes('how') || input.includes('what should') || input.includes('plan')) {
      complexity = 'high';
    } else if (input.includes('best') || input.includes('recommend') || input.includes('advice')) {
      complexity = 'medium';
    }

    // Extract specific topics
    const flagFootballTerms = ['route', 'quarterback', 'receiver', 'defense', 'offense', 'flag', 'touchdown'];
    flagFootballTerms.forEach(term => {
      if (input.includes(term)) {
        topics.push('flag-football');
      }
    });

    return { category, topics, complexity, originalInput: userInput };
  };

  const mapIntentToReasoningType = (intent) => {
    const mappings = {
      'nutrition': 'nutrition-planning',
      'training': 'training-optimization',
      'recovery': 'recovery-optimization',
      'injury-prevention': 'injury-risk',
      'strategy': 'performance-analysis'
    };
    
    return mappings[intent.category];
  };

  const generatePersonalizedResponse = async (userInput, intent, personality, researchData, reasoning, userContext) => {
    let content = '';
    let confidence = 0.8;
    let researchBacked = false;

    // Start with personality-based greeting
    const greetings = {
      'supportive': ['Great question!', 'I love your curiosity!', 'That\s a smart thing to focus on!'],
      'analytical': ['Let me break this down for you.', 'Here\s what the data shows:', 'From a scientific perspective:'],
      'motivational': ['You\re asking the RIGHT questions!', 'This is where champions separate themselves!', 'Now we\re talking!'],
      'technical': ['Let\s get technical about this.', 'Here\s the precise approach:', 'The mechanics of this are:']
    };

    const greeting = greetings[personality.name.split(' ')[1].toLowerCase()] || greetings['supportive'];
    content += greeting[Math.floor(Math.random() * greeting.length)] + '\n\n';

    // Add research-backed information if available
    if (researchData && !researchData.error && researchData.recommendations?.length > 0) {
      content += '📚 **Based on current sports science research:**\n';
      researchData.recommendations.slice(0, 3).forEach((rec, index) => {
        content += `${index + 1}. ${rec}\n`;
      });
      content += '\n';
      researchBacked = true;
      confidence = 0.95;
    }

    // Add reasoning-based insights if available
    if (reasoning && !reasoning.error) {
      content += '🧠 **Here\s my reasoning process:**\n';
      content += `${reasoning.reasoning?.reasoning || 'I\ve analyzed multiple factors to give you the best advice.'}\n\n`;
      
      if (reasoning.recommendations?.length > 0) {
        content += '**My specific recommendations for you:**\n';
        reasoning.recommendations.slice(0, 4).forEach((rec, index) => {
          content += `• ${rec}\n`;
        });
        content += '\n';
      }
      confidence = Math.max(confidence, reasoning.confidence || 0.8);
    }

    // Add personality-specific advice
    content += await getPersonalitySpecificAdvice(intent, personality, userContext);

    // Add flag football specific insights if relevant
    if (intent.topics.includes('flag-football')) {
      content += await getFlagFootballSpecificAdvice(intent, userContext);
    }

    // Add encouraging closing based on personality
    const closings = {
      'supportive': ['You\ve got this! 💪', 'I believe in your progress!', 'Keep up the great work!'],
      'analytical': ['Track your progress and adjust as needed.', 'Let the data guide your decisions.', 'Measure, analyze, improve.'],
      'motivational': ['Now go dominate! 🔥', 'Champions are made in moments like this!', 'Your potential is unlimited!'],
      'technical': ['Execute with precision.', 'Focus on perfect technique.', 'Master the fundamentals first.']
    };

    const closing = closings[personality.name.split(' ')[1].toLowerCase()] || closings['supportive'];
    content += '\n' + closing[Math.floor(Math.random() * closing.length)];

    return {
      content,
      confidence,
      researchBacked,
      reasoningUsed: !!reasoning,
      metadata: {
        intent: intent.category,
        complexity: intent.complexity,
        sources: researchData?.sources || [],
        personalityUsed: personality.name
      }
    };
  };

  const getPersonalitySpecificAdvice = async (intent, personality, userContext) => {
    const adviceMap = {
      'supportive': {
        'nutrition': 'Remember, small consistent changes in your nutrition will lead to big improvements over time. Start with one meal at a time!',
        'training': 'Every rep you do is building towards your goals. Focus on progress, not perfection.',
        'recovery': 'Your body is working hard to get stronger during rest. Be patient with the process.',
        'general': 'Trust in your ability to improve. Every day is a new opportunity to get better.'
      },
      'analytical': {
        'nutrition': 'Your nutrition should be precisely timed around your training schedule for optimal adaptation.',
        'training': 'Track your volume, intensity, and progressive overload to ensure systematic improvement.',
        'recovery': 'Monitor your sleep quality and stress levels as key performance indicators.',
        'general': 'Use objective metrics to guide your decision-making process.'
      },
      'motivational': {
        'nutrition': 'Elite athletes fuel like champions! Your nutrition is your competitive advantage!',
        'training': 'This is where legends are forged! Push beyond your comfort zone!',
        'recovery': 'Recovery is when you get stronger! Embrace the process!',
        'general': 'You have everything it takes to be exceptional! Show the world what you\'re made of!'
      },
      'technical': {
        'nutrition': 'Focus on nutrient timing, macronutrient ratios, and hydration protocols.',
        'training': 'Master movement patterns before increasing intensity or complexity.',
        'recovery': 'Implement systematic recovery protocols including sleep hygiene and stress management.',
        'general': 'Precision in execution leads to consistent results.'
      }
    };

    const personalityKey = personality.name.split(' ')[1].toLowerCase();
    const advice = adviceMap[personalityKey]?.[intent.category] || adviceMap[personalityKey]?.['general'] || '';
    
    return advice ? `\n**${personality.name}'s perspective:** ${advice}\n` : '';
  };

  const getFlagFootballSpecificAdvice = async (intent, userContext) => {
    const flagFootballAdvice = {
      'nutrition': 'For flag football, focus on quick energy sources before games and complete recovery nutrition after. Your agility depends on optimal fueling!',
      'training': 'Flag football requires explosive starts, quick cuts, and hand-eye coordination. Prioritize agility ladders, cone drills, and reaction training.',
      'recovery': 'The cutting and direction changes in flag football stress your ankles and knees. Focus on mobility work and adequate sleep.',
      'strategy': 'Flag football is all about deception and speed. Study your opponents, vary your routes, and always protect your flags!',
      'general': 'Flag football combines athleticism with strategy. Train your body and your mind!'
    };

    const advice = flagFootballAdvice[intent.category] || flagFootballAdvice['general'];
    return `\n🏈 **Flag Football Focus:** ${advice}\n`;
  };

  const getFallbackResponse = async (userInput) => {
    const fallbackResponses = [
      "Focus on the fundamentals and practice consistently.",
      "Listen to your body and adjust your training accordingly.",
      "Consistency is key - small improvements add up over time.",
      "Make sure you're getting adequate rest and nutrition.",
      "Consider working with a qualified coach for personalized guidance."
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (message) => {
    const isCoach = message.type === 'coach';
    const personality = coachPersonalities[coachPersonality];

    return (
      <div key={message.id} className={`message ${isCoach ? 'coach-message' : 'user-message'}`}>
        <div className="message-header">
          {isCoach && (
            <div className="coach-avatar">
              <span className="coach-icon">{personality.icon}</span>
            </div>
          )}
          <div className="message-info">
            <span className="sender">{isCoach ? personality.name : 'You'}</span>
            <span className="timestamp">{new Date(message.timestamp).toLocaleTimeString()}</span>
          </div>
          {message.metadata?.researchBacked && (
            <div className="research-badge" title="Backed by sports science research">
              📚
            </div>
          )}
          {message.metadata?.reasoningUsed && (
            <div className="reasoning-badge" title="Used chain-of-thought reasoning">
              🧠
            </div>
          )}
        </div>
        <div className="message-content">
          {message.content.split('\n').map((line, index) => (
            <React.Fragment key={index}>
              {line.startsWith('**') && line.endsWith('**') ? (
                <strong>{line.slice(2, -2)}</strong>
              ) : (
                line
              )}
              {index < message.content.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </div>
        {message.metadata?.confidenceLevel && (
          <div className="message-metadata">
            <span className={`confidence confidence-${message.metadata.confidenceLevel > 0.9 ? 'high' : message.metadata.confidenceLevel > 0.7 ? 'medium' : 'low'}`}>
              Confidence: {Math.round(message.metadata.confidenceLevel * 100)}%
            </span>
          </div>
        )}
      </div>
    );
  };

  if (!showInterface) {
    return null;
  }

  return (
    <div className="enhanced-ai-coach">
      <div className="coach-header">
        <div className="coach-title">
          <h2>🤖 Enhanced AI Coach</h2>
          <div className="mcp-status">
            {mcpStatus.connected ? (
              <span className="status-connected">
                📚 Research Mode • 🧠 Reasoning Active
              </span>
            ) : (
              <span className="status-offline">
                💾 Offline Mode
              </span>
            )}
          </div>
        </div>
        
        <div className="coach-settings">
          <div className="setting-group">
            <label>Coach Personality:</label>
            <select 
              value={coachPersonality} 
              onChange={(e) => setCoachPersonality(e.target.value)}
              className="personality-select"
            >
              {Object.entries(coachPersonalities).map(([key, personality]) => (
                <option key={key} value={key}>
                  {personality.icon} {personality.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="setting-group">
            <label>
              <input
                type="checkbox"
                checked={researchMode}
                onChange={(e) => setResearchMode(e.target.checked)}
                disabled={!mcpStatus.servers?.context7}
              />
              Research Mode
            </label>
          </div>
          
          <div className="setting-group">
            <label>Reasoning Depth:</label>
            <select 
              value={reasoningDepth} 
              onChange={(e) => setReasoningDepth(e.target.value)}
              className="depth-select"
              disabled={!mcpStatus.servers?.sequentialThought}
            >
              <option value="low">Quick</option>
              <option value="medium">Balanced</option>
              <option value="high">Deep</option>
            </select>
          </div>
        </div>
      </div>

      <div className="conversation-container">
        <div className="messages-area">
          {conversation.map(renderMessage)}
          {loading && (
            <div className="message coach-message loading">
              <div className="message-header">
                <div className="coach-avatar">
                  <span className="coach-icon">{coachPersonalities[coachPersonality].icon}</span>
                </div>
                <div className="message-info">
                  <span className="sender">{coachPersonalities[coachPersonality].name}</span>
                  <span className="timestamp">Thinking...</span>
                </div>
              </div>
              <div className="message-content">
                <div className="thinking-indicator">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
                <p>Analyzing your question with sports science research...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-container">
            <textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about training, nutrition, recovery, or flag football strategy..."
              className="message-input"
              rows="2"
              disabled={loading}
            />
            <button 
              onClick={sendMessage}
              disabled={loading || !currentMessage.trim()}
              className="send-button"
            >
              {loading ? '⏳' : '🚀'}
            </button>
          </div>
          
          <div className="quick-questions">
            <span>Quick questions:</span>
            {[
              "How should I fuel before a game?",
              "What drills improve my cutting ability?",
              "How can I recover faster between games?",
              "What's the best strategy for defense?"
            ].map((question, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentMessage(question);
                  setTimeout(sendMessage, 100);
                }}
                className="quick-question-btn"
                disabled={loading}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      </div>

      {conversationHistory.length > 0 && (
        <div className="conversation-history">
          <h3>Recent Conversations</h3>
          <div className="history-items">
            {conversationHistory.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-topic">{item.topic}</div>
                <div className="history-summary">{item.summary}</div>
                <div className="history-time">{new Date(item.timestamp).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .enhanced-ai-coach {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .coach-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
        }

        .coach-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .coach-title h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .mcp-status {
          font-size: 0.9rem;
          opacity: 0.9;
        }

        .status-connected {
          color: #a7f3d0;
        }

        .status-offline {
          color: #fbbf24;
        }

        .coach-settings {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }

        .setting-group {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
        }

        .setting-group label {
          white-space: nowrap;
        }

        .personality-select,
        .depth-select {
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 6px;
          padding: 4px 8px;
          font-size: 0.8rem;
        }

        .personality-select option,
        .depth-select option {
          background: #374151;
          color: white;
        }

        .conversation-container {
          height: 600px;
          display: flex;
          flex-direction: column;
        }

        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .message {
          max-width: 80%;
          background: #f8fafc;
          border-radius: 12px;
          padding: 16px;
          border: 1px solid #e2e8f0;
        }

        .user-message {
          align-self: flex-end;
          background: #3b82f6;
          color: white;
          border-color: #2563eb;
        }

        .coach-message {
          align-self: flex-start;
        }

        .message-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .coach-avatar {
          width: 32px;
          height: 32px;
          background: #667eea;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .coach-icon {
          font-size: 16px;
        }

        .message-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sender {
          font-weight: 600;
          font-size: 0.9rem;
          color: #374151;
        }

        .user-message .sender {
          color: rgba(255,255,255,0.9);
        }

        .timestamp {
          font-size: 0.7rem;
          color: #6b7280;
        }

        .user-message .timestamp {
          color: rgba(255,255,255,0.7);
        }

        .research-badge,
        .reasoning-badge {
          background: #10b981;
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.7rem;
          margin-left: auto;
        }

        .reasoning-badge {
          background: #8b5cf6;
        }

        .message-content {
          color: #374151;
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .user-message .message-content {
          color: white;
        }

        .message-metadata {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }

        .confidence {
          font-size: 0.8rem;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .confidence-high {
          background: #d1fae5;
          color: #065f46;
        }

        .confidence-medium {
          background: #fef3c7;
          color: #92400e;
        }

        .confidence-low {
          background: #fee2e2;
          color: #991b1b;
        }

        .loading .message-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .thinking-indicator {
          display: flex;
          gap: 4px;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border-radius: 50%;
          animation: thinking 1.4s ease-in-out infinite both;
        }

        .dot:nth-child(1) { animation-delay: -0.32s; }
        .dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes thinking {
          0%, 80%, 100% {
            transform: scale(0);
          } 40% {
            transform: scale(1);
          }
        }

        .input-area {
          border-top: 1px solid #e5e7eb;
          padding: 20px;
          background: #f9fafb;
        }

        .input-container {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .message-input {
          flex: 1;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.95rem;
          resize: none;
          font-family: inherit;
        }

        .message-input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .send-button {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 20px;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quick-questions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          font-size: 0.85rem;
          color: #6b7280;
        }

        .quick-question-btn {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 16px;
          padding: 6px 12px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          color: #374151;
        }

        .quick-question-btn:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .quick-question-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .conversation-history {
          border-top: 1px solid #e5e7eb;
          padding: 20px;
          background: #f9fafb;
        }

        .conversation-history h3 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 1rem;
        }

        .history-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .history-topic {
          font-weight: 500;
          color: #374151;
          font-size: 0.9rem;
        }

        .history-summary {
          flex: 1;
          margin: 0 12px;
          color: #6b7280;
          font-size: 0.8rem;
        }

        .history-time {
          color: #9ca3af;
          font-size: 0.75rem;
        }

        @media (max-width: 768px) {
          .enhanced-ai-coach {
            margin: 0;
            border-radius: 0;
            height: 100vh;
          }

          .coach-settings {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .message {
            max-width: 90%;
          }

          .quick-questions {
            flex-direction: column;
            align-items: flex-start;
          }

          .conversation-container {
            height: calc(100vh - 200px);
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedAICoach;