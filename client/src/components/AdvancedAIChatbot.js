import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import '../styles/AdvancedAIChatbot.css';

/**
 * Advanced AI Chatbot - Next-Gen Intelligence
 * Features: Semantic Search, Recommendations, Predictions, Emotion Detection
 */
const AdvancedAIChatbot = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Welcome with AI innovations
    const welcomeMessage = `🤖 **Advanced AI Assistant** - Powered by Next-Gen Intelligence

**What makes me INNOVATIVE:**
🧠 **Semantic Understanding** - I understand context, not just keywords
🎯 **Predictive Analytics** - I predict what you need before you ask
💡 **Personalized Recommendations** - Tailored suggestions based on your history
😊 **Emotion Detection** - I understand your feelings and adjust my tone
🔍 **Semantic Search** - I find similar past conversations for better answers
📊 **Smart Ranking** - I rank responses by relevance to you
🎓 **Continuous Learning** - I improve from your feedback

**Advanced Features:**
• Predict your next repair needs
• Recommend tailors based on your preferences
• Detect emotional tone and respond empathetically
• Extract key information automatically
• Generate follow-up questions
• Learn from your feedback

**Try asking:**
• "What should I repair next?"
• "Find me the best tailor for my needs"
• "Show me my sustainability impact"
• "I'm frustrated with my last repair"

How can I help you today? 🚀`;

    setMessages([{
      id: 1,
      text: welcomeMessage,
      sender: 'bot',
      timestamp: new Date(),
      type: 'welcome',
      innovations: ['semantic', 'predictive', 'emotion', 'learning']
    }]);

    // Load suggestions
    loadSuggestions();

    return () => newSocket.disconnect();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSuggestions = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/ai/suggestions`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput('');
    setIsTyping(true);
    setShowSuggestions(false);

    try {
      // Call advanced AI endpoint
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/ai/advanced-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            prompt: userInput,
            userId: user?.id,
            userName: user?.name
          })
        }
      );

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        text: data.response || data.data?.response,
        sender: 'bot',
        timestamp: new Date(),
        provider: data.provider,
        confidence: data.confidence,
        intent: data.intent,
        emotion: data.emotion,
        keyPhrases: data.keyPhrases,
        followUpQuestions: data.followUpQuestions,
        recommendations: data.recommendations,
        predictions: data.predictions,
        innovations: data.innovations
      };

      setMessages(prev => [...prev, botMessage]);

      // Emit analytics
      if (socket) {
        socket.emit('advanced-ai-interaction', {
          userId: user?.id,
          intent: data.intent,
          emotion: data.emotion,
          confidence: data.confidence,
          innovations: data.innovations
        });
      }
    } catch (error) {
      console.error('AI Chat Error:', error);

      const errorMessage = {
        id: Date.now() + 1,
        text: '😊 I encountered an issue, but I\'m learning! Please try again or ask something else.',
        sender: 'bot',
        timestamp: new Date(),
        type: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion.query || suggestion.title);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderInnovationBadges = (innovations) => {
    if (!innovations) return null;

    const badges = {
      semantic: { icon: '🧠', label: 'Semantic' },
      predictive: { icon: '🎯', label: 'Predictive' },
      emotion: { icon: '😊', label: 'Emotion' },
      learning: { icon: '🎓', label: 'Learning' },
      recommendation: { icon: '💡', label: 'Recommendation' }
    };

    return (
      <div className="innovation-badges">
        {innovations.map(innovation => (
          <span key={innovation} className="innovation-badge" title={badges[innovation]?.label}>
            {badges[innovation]?.icon}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div 
        className="advanced-chatbot-button"
        onClick={() => setIsOpen(!isOpen)}
        title="Advanced AI Assistant"
      >
        {isOpen ? '✕' : '🤖'}
        {!isOpen && <span className="pulse-ring"></span>}
        <span className="ai-badge">AI</span>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="advanced-chatbot-window">
          <div className="chatbot-header">
            <div className="header-content">
              <div className="bot-avatar">🤖</div>
              <div className="bot-info">
                <h3>Advanced AI Assistant</h3>
                <span className="status">
                  <span className="status-dot"></span>
                  Online & Learning
                </span>
              </div>
            </div>
            <button className="minimize-btn" onClick={() => setIsOpen(false)}>−</button>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !showSuggestions && messages.length <= 1 && (
            <div className="suggestions-section">
              <div className="suggestions-header">
                <span>💡 Smart Suggestions</span>
                <button 
                  className="toggle-suggestions"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  {showSuggestions ? '−' : '+'}
                </button>
              </div>
              {showSuggestions && (
                <div className="suggestions-list">
                  {suggestions.slice(0, 3).map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="suggestion-item"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <span className="suggestion-icon">{suggestion.icon || '✨'}</span>
                      <span className="suggestion-text">{suggestion.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                {msg.sender === 'bot' && <div className="message-avatar">🤖</div>}
                
                <div className="message-content">
                  <div className="message-text">{msg.text}</div>

                  {/* Innovation Badges */}
                  {msg.innovations && msg.sender === 'bot' && (
                    renderInnovationBadges(msg.innovations)
                  )}

                  {/* Metadata */}
                  {msg.sender === 'bot' && (
                    <div className="message-meta">
                      {msg.provider && (
                        <span className="provider-badge">
                          {msg.provider === 'openai' ? '🤖 GPT-4' :
                           msg.provider === 'anthropic' ? '🧠 Claude' :
                           msg.provider === 'gemini' ? '✨ Gemini' :
                           msg.provider === 'cohere' ? '🔮 Cohere' :
                           msg.provider}
                        </span>
                      )}
                      {msg.confidence && (
                        <span className={`confidence-badge ${
                          msg.confidence >= 0.9 ? 'high' : 
                          msg.confidence >= 0.75 ? 'medium' : 'low'
                        }`}>
                          {(msg.confidence * 100).toFixed(0)}% confident
                        </span>
                      )}
                      {msg.emotion && (
                        <span className={`emotion-badge ${msg.emotion.emotion}`}>
                          {msg.emotion.emotion === 'happy' ? '😊' :
                           msg.emotion.emotion === 'angry' ? '😠' :
                           msg.emotion.emotion === 'sad' ? '😢' :
                           msg.emotion.emotion === 'anxious' ? '😰' : '😐'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Key Phrases */}
                  {msg.keyPhrases && msg.keyPhrases.length > 0 && (
                    <div className="key-phrases">
                      {msg.keyPhrases.slice(0, 3).map((phrase, idx) => (
                        <span key={idx} className="phrase-tag">{phrase}</span>
                      ))}
                    </div>
                  )}

                  {/* Recommendations */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="recommendations">
                      <div className="rec-title">💡 Recommendations:</div>
                      {msg.recommendations.map((rec, idx) => (
                        <div key={idx} className="rec-item">
                          <strong>{rec.title}</strong>
                          <p>{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Predictions */}
                  {msg.predictions && (
                    <div className="predictions">
                      <div className="pred-title">🎯 Predictions:</div>
                      <ul>
                        {msg.predictions.nextServiceType && (
                          <li>Next service: <strong>{msg.predictions.nextServiceType}</strong></li>
                        )}
                        {msg.predictions.estimatedNextBookingDays && (
                          <li>Next booking in: <strong>{msg.predictions.estimatedNextBookingDays} days</strong></li>
                        )}
                        {msg.predictions.predictedBudget && (
                          <li>Predicted budget: <strong>₹{msg.predictions.predictedBudget}</strong></li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Follow-up Questions */}
                  {msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                    <div className="follow-up-questions">
                      <div className="followup-title">❓ Follow-up:</div>
                      {msg.followUpQuestions.map((question, idx) => (
                        <button
                          key={idx}
                          className="followup-btn"
                          onClick={() => setInput(question)}
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="message-time">
                    {msg.timestamp.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>

                {msg.sender === 'user' && <div className="message-avatar">👤</div>}
              </div>
            ))}

            {isTyping && (
              <div className="message bot">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything... I'm learning! 🧠"
            />
            <button onClick={handleSend} disabled={!input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AdvancedAIChatbot;
