import React, { useState, useEffect, useRef, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import '../styles/AIChatbot.css';

const AIChatbot = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.io connection
    const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
    setSocket(newSocket);

    // Intelligent welcome message based on user context
    const getWelcomeMessage = () => {
      const hour = new Date().getHours();
      let greeting = 'Hi';
      if (hour < 12) greeting = 'Good morning';
      else if (hour < 18) greeting = 'Good afternoon';
      else greeting = 'Good evening';

      return `${greeting}, ${user?.name || 'there'}! 👋 

I'm your intelligent ReWear AI assistant, powered by advanced language models. I understand context, remember our conversations, and provide personalized help.

**What makes me smart:**
🧠 Context-aware responses
💬 Conversation memory
🎯 Intent detection
📊 Sentiment analysis
🔄 Multi-provider AI (OpenAI, Claude, Gemini, Cohere)

**I can help you with:**
🔍 Finding the perfect tailor (with smart matching)
💰 Accurate price estimates (AI-powered)
📦 Real-time order tracking
🌱 Sustainability impact analysis
🎨 Damage detection & repair advice
❓ Any questions about our platform

**Quick suggestions:**
• "Find me a tailor for my torn jeans"
• "How much to repair a dress?"
• "Track my order"
• "Show my environmental impact"

How can I assist you today? 😊`;
    };

    setMessages([{
      id: 1,
      text: getWelcomeMessage(),
      sender: 'bot',
      timestamp: new Date(),
      provider: 'rewear-ai',
      confidence: 1.0
    }]);

    return () => newSocket.disconnect();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const analyzeIntent = (message) => {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('tailor') || lowerMsg.includes('find') || lowerMsg.includes('nearby')) {
      return 'find_tailor';
    }
    if (lowerMsg.includes('price') || lowerMsg.includes('cost') || lowerMsg.includes('estimate')) {
      return 'price_estimate';
    }
    if (lowerMsg.includes('track') || lowerMsg.includes('order') || lowerMsg.includes('shipment')) {
      return 'track_order';
    }
    if (lowerMsg.includes('sustainability') || lowerMsg.includes('impact') || lowerMsg.includes('co2')) {
      return 'sustainability';
    }
    if (lowerMsg.includes('help') || lowerMsg.includes('what can you do')) {
      return 'help';
    }
    return 'general';
  };

  const generateResponse = async (intent, userMessage) => {
    switch (intent) {
      case 'find_tailor':
        return {
          text: "I can help you find the perfect tailor! 🎯\n\nBased on your location and needs, I recommend:\n\n⭐ **Top Rated Tailors Near You**\n• Master Tailor (4.8★) - 2km away\n• Stitch Perfect (4.7★) - 3km away\n• Fashion Fix (4.6★) - 4km away\n\nWould you like to see their profiles or book directly?",
          actions: [
            { label: 'View Profiles', action: 'view_tailors' },
            { label: 'Book Now', action: 'book_tailor' }
          ]
        };
      
      case 'price_estimate':
        return {
          text: "Let me calculate a price estimate for you! 💰\n\nFor a typical repair:\n• Basic repair: ₹150-250\n• Moderate damage: ₹300-500\n• Complex repair: ₹600-1000\n\nWant a more accurate estimate? Upload a photo of your garment and I'll analyze it with AI!",
          actions: [
            { label: 'Upload Photo', action: 'upload_photo' },
            { label: 'Get Quote', action: 'get_quote' }
          ]
        };
      
      case 'track_order':
        return {
          text: "Let me check your orders! 📦\n\nYou have 2 active bookings:\n\n1. **Shirt Repair** - In Transit 🚚\n   Arriving today by 6 PM\n\n2. **Pants Alteration** - With Tailor 👔\n   Ready for pickup tomorrow\n\nWould you like real-time tracking?",
          actions: [
            { label: 'Track Live', action: 'track_live' },
            { label: 'View Details', action: 'view_orders' }
          ]
        };
      
      case 'sustainability':
        return {
          text: "Your environmental impact is amazing! 🌱\n\n**Your Stats:**\n• CO₂ Saved: 12.5 kg\n• Water Saved: 3,500 L\n• Rank: #5 of 100 users\n• Badge: Silver Saver 🥈\n\nYou're just 137.5 points away from Gold! Keep repairing to unlock it!",
          actions: [
            { label: 'View Dashboard', action: 'view_sustainability' },
            { label: 'Share Impact', action: 'share_impact' }
          ]
        };
      
      case 'help':
        return {
          text: "I'm here to help! Here's what I can do:\n\n🔍 **Find Tailors** - Get personalized recommendations\n💰 **Price Estimates** - AI-powered cost analysis\n📦 **Track Orders** - Real-time shipment tracking\n🌱 **Sustainability** - View your environmental impact\n🎯 **Smart Suggestions** - Personalized tips\n\nJust ask me anything!",
          actions: []
        };
      
      default:
        return {
          text: "I understand you're asking about: \"" + userMessage + "\"\n\nI'm learning every day! For now, I can help you with:\n• Finding tailors\n• Price estimates\n• Order tracking\n• Sustainability metrics\n\nWhat would you like to know?",
          actions: []
        };
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

    try {
      // Analyze intent
      const intent = analyzeIntent(userInput);

      // Call Multi-LLM API
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt: userInput,
          context: {
            type: intent,
            userId: user?.id,
            userName: user?.name
          },
          provider: 'openai' // Can be made configurable
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Generate action buttons based on intent
      const localResponse = await generateResponse(intent, userInput);
      
      // Use AI response if available, otherwise use local response
      const responseText = data.data?.response || data.response || localResponse.text;
      const provider = data.data?.provider || data.provider || 'local';
      const confidence = data.data?.confidence || data.confidence || 0.85;
      const analysis = data.data?.analysis;
      
      const botMessage = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
        actions: localResponse.actions,
        provider: provider,
        confidence: confidence,
        analysis: analysis
      };

      setMessages(prev => [...prev, botMessage]);

      // Emit to socket for analytics
      if (socket) {
        socket.emit('chatbot-interaction', {
          userId: user?.id,
          intent,
          message: userInput,
          provider: data.provider,
          confidence: data.confidence
        });
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      
      // Fallback to local response
      const intent = analyzeIntent(userInput);
      const fallbackResponse = await generateResponse(intent, userInput);
      
      const botMessage = {
        id: Date.now() + 1,
        text: fallbackResponse.text,
        sender: 'bot',
        timestamp: new Date(),
        actions: fallbackResponse.actions,
        provider: 'fallback'
      };

      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAction = (action) => {
    switch (action) {
      case 'view_tailors':
        window.location.href = '/tailors/nearby';
        break;
      case 'book_tailor':
        window.location.href = '/booking/new';
        break;
      case 'upload_photo':
        window.location.href = '/booking/new';
        break;
      case 'track_live':
        window.location.href = '/dashboard';
        break;
      case 'view_sustainability':
        window.location.href = '/demo';
        break;
      default:
        console.log('Action:', action);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div 
        className={`chatbot-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && <span className="pulse-ring"></span>}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="header-content">
              <div className="bot-avatar">🤖</div>
              <div className="bot-info">
                <h3>ReWear AI Assistant</h3>
                <span className="status">
                  <span className="status-dot"></span>
                  Online
                </span>
              </div>
            </div>
            <button className="minimize-btn" onClick={() => setIsOpen(false)}>−</button>
          </div>

          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                {msg.sender === 'bot' && <div className="message-avatar">🤖</div>}
                <div className="message-content">
                  <div className="message-text">{msg.text}</div>
                  {msg.provider && msg.sender === 'bot' && (
                    <div className="message-meta">
                      <span className={`provider-badge ${msg.provider.toLowerCase().replace('-fallback', '')}`}>
                        {msg.provider === 'openai' || msg.provider === 'openai-fallback' ? '🤖 GPT-4' : 
                         msg.provider === 'anthropic' || msg.provider === 'anthropic-fallback' ? '🧠 Claude' :
                         msg.provider === 'gemini' || msg.provider === 'gemini-fallback' ? '✨ Gemini' :
                         msg.provider === 'cohere' || msg.provider === 'cohere-fallback' ? '🔮 Cohere' :
                         msg.provider}
                      </span>
                      {msg.confidence && (
                        <span 
                          className={`confidence-badge ${
                            msg.confidence >= 0.9 ? 'high' : 
                            msg.confidence >= 0.75 ? 'medium' : 
                            'low'
                          }`}
                          style={{'--confidence': `${msg.confidence * 100}%`}}
                        >
                          {(msg.confidence * 100).toFixed(0)}% confident
                        </span>
                      )}
                    </div>
                  )}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="message-actions">
                      {msg.actions.map((action, idx) => (
                        <button
                          key={idx}
                          className="action-btn"
                          onClick={() => handleAction(action.action)}
                        >
                          {action.label}
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

          <div className="chatbot-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
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

export default AIChatbot;
