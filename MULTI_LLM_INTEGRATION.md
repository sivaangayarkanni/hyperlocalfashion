# Multi-Provider LLM Integration Guide

## Overview

ReWear platform now features a sophisticated multi-provider LLM system that automatically falls back between different AI providers to ensure reliable, intelligent responses.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Frontend Layer                      │
│  ┌────────────────────────────────────────────────┐  │
│  │          AIChatbot Component                   │  │
│  │  - User interface                              │  │
│  │  - Intent analysis                             │  │
│  │  - Provider display                            │  │
│  └────────────────┬───────────────────────────────┘  │
└───────────────────┼──────────────────────────────────┘
                    │ HTTP Request
┌───────────────────▼──────────────────────────────────┐
│                   Backend Layer                       │
│  ┌────────────────────────────────────────────────┐  │
│  │          /api/ai/chat Endpoint                 │  │
│  └────────────────┬───────────────────────────────┘  │
│                   │                                   │
│  ┌────────────────▼───────────────────────────────┐  │
│  │          MultiLLMService                       │  │
│  │  - Provider management                         │  │
│  │  - Automatic fallback                          │  │
│  │  - Context generation                          │  │
│  │  - Response formatting                         │  │
│  └────────┬───────────────────────────────────────┘  │
└───────────┼──────────────────────────────────────────┘
            │
    ┌───────┴────────┬──────────┬──────────┐
    │                │          │          │
┌───▼────┐  ┌───────▼──┐  ┌────▼────┐  ┌─▼──────┐
│ OpenAI │  │Anthropic │  │ Gemini  │  │ Cohere │
│  GPT-4 │  │  Claude  │  │   Pro   │  │Command │
└────────┘  └──────────┘  └─────────┘  └────────┘
```

## Features

### 1. Multi-Provider Support

The system supports four major AI providers:

- **OpenAI GPT-4** - Primary provider, excellent for general queries
- **Anthropic Claude** - First fallback, great for detailed analysis
- **Google Gemini** - Second fallback, strong multimodal capabilities
- **Cohere** - Third fallback, efficient for text generation

### 2. Automatic Fallback

If a provider fails or is unavailable, the system automatically tries the next provider in the fallback chain:

```
OpenAI → Anthropic → Gemini → Cohere → Mock Response
```

### 3. Contextual Responses

The system generates context-aware responses based on:
- **Damage Analysis** - Garment repair recommendations
- **Pricing** - Cost estimates and breakdowns
- **Sustainability** - Environmental impact tracking
- **Customer Support** - General platform assistance

### 4. MCP Server Integration

Three MCP servers provide modular capabilities:

#### AI Assistant Server
- Garment damage analysis
- Repair recommendations
- Sustainability calculations
- Response generation

#### Analytics Server
- User statistics
- Platform metrics
- Report generation
- Tailor analytics

#### Notifications Server
- SMS notifications (Twilio)
- Email notifications (SendGrid)
- Push notifications (FCM)
- Bulk messaging

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```env
# AI Provider API Keys
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GOOGLE_API_KEY=your_google_key
COHERE_API_KEY=your_cohere_key

# Notification Services
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
SENDGRID_API_KEY=your_sendgrid_key
```

### 2. Install MCP Server Dependencies

```bash
npm run install-mcp
```

### 3. Configure MCP Servers

MCP servers are configured in `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "rewear-ai-assistant": {
      "command": "node",
      "args": ["server/mcp/ai-assistant-server.js"],
      "env": {
        "OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "GOOGLE_API_KEY": "${GOOGLE_API_KEY}",
        "COHERE_API_KEY": "${COHERE_API_KEY}"
      },
      "disabled": false,
      "autoApprove": [
        "analyze_garment",
        "get_repair_recommendation",
        "calculate_sustainability_impact",
        "generate_response"
      ]
    }
  }
}
```

## Usage

### Frontend Integration

The AIChatbot component automatically uses the multi-LLM API:

```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    prompt: userMessage,
    context: {
      type: 'damage_analysis',
      userId: user.id
    },
    provider: 'openai' // Optional, defaults to 'openai'
  })
});

const data = await response.json();
// data.response - AI response text
// data.provider - Which provider was used
// data.confidence - Confidence score (0-1)
// data.tokens - Token usage statistics
```

### Backend API

#### POST /api/ai/chat

**Request:**
```json
{
  "prompt": "How much will it cost to repair a torn shirt?",
  "context": {
    "type": "pricing",
    "garmentType": "shirt",
    "damageType": "tear"
  },
  "provider": "openai"
}
```

**Response:**
```json
{
  "response": "Let me break down the pricing for you...",
  "provider": "openai",
  "model": "gpt-4-turbo-preview",
  "confidence": 0.95,
  "tokens": {
    "prompt": 150,
    "completion": 200,
    "total": 350
  },
  "intent": "pricing",
  "sentiment": "neutral"
}
```

### MCP Server Tools

#### Analyze Garment

```javascript
{
  "tool": "analyze_garment",
  "arguments": {
    "imageUrl": "https://example.com/garment.jpg",
    "garmentType": "shirt"
  }
}
```

**Response:**
```json
{
  "garmentType": "shirt",
  "damageTypes": ["tear", "loose_seam"],
  "severity": "moderate",
  "confidence": 0.92,
  "recommendations": [
    {
      "type": "Fabric stitching and reinforcement",
      "estimatedCost": { "min": 200, "max": 350 },
      "estimatedTime": "2-3 days",
      "difficulty": "medium"
    }
  ],
  "sustainabilityImpact": {
    "co2Saved": 2.5,
    "waterSaved": 700,
    "wasteSaved": 0.3
  }
}
```

## Context Types

The system supports different context types for specialized responses:

### 1. Damage Analysis
```javascript
context: {
  type: 'damage_analysis',
  damageType: 'tear',
  severity: 'moderate',
  garmentType: 'shirt'
}
```

### 2. Pricing
```javascript
context: {
  type: 'pricing',
  basePrice: 200,
  isEmergency: false,
  distance: 5,
  topRated: true
}
```

### 3. Sustainability
```javascript
context: {
  type: 'sustainability',
  co2Saved: 12.5,
  waterSaved: 3500,
  sustainabilityScore: 85,
  rank: 5,
  totalUsers: 100
}
```

### 4. Customer Support
```javascript
context: {
  type: 'customer_support',
  userId: 123,
  userName: 'John Doe'
}
```

## Provider Selection

### Automatic Selection
By default, the system tries providers in this order:
1. OpenAI (if API key available)
2. Anthropic (if OpenAI fails)
3. Gemini (if Anthropic fails)
4. Cohere (if Gemini fails)
5. Mock response (if all fail)

### Manual Selection
Specify a preferred provider:

```javascript
{
  "prompt": "Your question",
  "provider": "anthropic" // or "openai", "gemini", "cohere"
}
```

## Database Schema

### ai_conversations Table

Stores all AI conversations for analytics:

```sql
CREATE TABLE ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  provider TEXT NOT NULL,
  sentiment TEXT,
  intent TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(userId) REFERENCES users(id)
);
```

## Monitoring & Analytics

### Provider Statistics

Get provider availability and usage:

```javascript
const stats = multiLLMService.getProviderStats();
// {
//   available: ['openai', 'anthropic'],
//   total: 4,
//   providers: [...]
// }
```

### Conversation History

Retrieve user conversation history:

```javascript
const history = await multiLLMService.getConversationHistory(userId, 10);
```

### Sentiment Analysis

Automatic sentiment detection:
- **Positive** - Happy, satisfied users
- **Negative** - Frustrated, unhappy users
- **Neutral** - General inquiries

## Best Practices

### 1. API Key Management
- Store API keys in `.env` file
- Never commit API keys to version control
- Rotate keys regularly
- Use separate keys for development and production

### 2. Error Handling
- Always implement fallback responses
- Log provider failures for monitoring
- Display user-friendly error messages
- Retry failed requests with exponential backoff

### 3. Cost Optimization
- Use mock responses in development
- Cache common responses
- Implement rate limiting
- Monitor token usage

### 4. Context Optimization
- Provide relevant context only
- Keep prompts concise
- Use appropriate context types
- Include user preferences

## Troubleshooting

### Provider Not Available
**Issue:** Provider shows as unavailable
**Solution:** Check that API key is set in `.env` file

### All Providers Failing
**Issue:** System falls back to mock responses
**Solution:** 
1. Verify API keys are valid
2. Check network connectivity
3. Review provider status pages
4. Check rate limits

### Low Confidence Scores
**Issue:** Responses have low confidence
**Solution:**
1. Provide more context
2. Use more specific prompts
3. Try different providers
4. Review prompt engineering

### MCP Server Connection Issues
**Issue:** MCP servers not connecting
**Solution:**
1. Verify Node.js >= 18 is installed
2. Run `npm run install-mcp`
3. Check `.kiro/settings/mcp.json` configuration
4. Review server logs in Kiro output panel

## Future Enhancements

- [ ] Add more AI providers (Mistral, LLaMA)
- [ ] Implement response caching
- [ ] Add A/B testing for providers
- [ ] Implement cost tracking per provider
- [ ] Add custom fine-tuned models
- [ ] Implement streaming responses
- [ ] Add voice input/output
- [ ] Multi-language support

## Support

For issues or questions:
1. Check this documentation
2. Review MCP server logs
3. Check provider status pages
4. Contact platform support

## License

MIT
