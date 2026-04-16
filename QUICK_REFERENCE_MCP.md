# Multi-LLM & MCP Quick Reference Guide

## 🚀 Quick Start

### Installation
```bash
npm run install-all
```

### Environment Setup
```bash
# Add to .env file
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
COHERE_API_KEY=your_key_here
```

### Start Server
```bash
npm run dev
```

## 📡 API Endpoint

### POST /api/ai/chat

**Request:**
```javascript
{
  "prompt": "How much to repair a shirt?",
  "context": {
    "type": "pricing",  // or "damage_analysis", "sustainability", "customer_support"
    "userId": 123
  },
  "provider": "openai"  // optional: "anthropic", "gemini", "cohere"
}
```

**Response:**
```javascript
{
  "response": "AI response text...",
  "provider": "openai",
  "confidence": 0.95,
  "tokens": { "prompt": 150, "completion": 200, "total": 350 }
}
```

## 🛠️ MCP Servers

### AI Assistant Server
**Location:** `server/mcp/ai-assistant-server.js`

**Tools:**
- `analyze_garment` - Analyze damage from images
- `get_repair_recommendation` - Get repair suggestions
- `calculate_sustainability_impact` - Calculate environmental impact
- `generate_response` - Generate contextual responses

**Example:**
```javascript
{
  "tool": "analyze_garment",
  "arguments": {
    "imageUrl": "https://example.com/image.jpg",
    "garmentType": "shirt"
  }
}
```

### Analytics Server
**Location:** `server/mcp/analytics-server.js`

**Tools:**
- `get_user_stats` - User statistics
- `get_platform_metrics` - Platform KPIs
- `generate_report` - Analytics reports
- `get_tailor_analytics` - Tailor performance

**Example:**
```javascript
{
  "tool": "get_platform_metrics",
  "arguments": {
    "timeRange": "month"  // "day", "week", "month", "year", "all"
  }
}
```

### Notifications Server
**Location:** `server/mcp/notifications-server.js`

**Tools:**
- `send_sms` - Send SMS via Twilio
- `send_email` - Send email via SendGrid
- `send_push_notification` - Send push notification
- `send_bulk_notification` - Bulk messaging

**Example:**
```javascript
{
  "tool": "send_email",
  "arguments": {
    "to": "user@example.com",
    "subject": "Order Update",
    "body": "Your order is ready!",
    "template": "order_update"
  }
}
```

## 🎯 Context Types

### Damage Analysis
```javascript
context: {
  type: 'damage_analysis',
  damageType: 'tear',
  severity: 'moderate',
  garmentType: 'shirt'
}
```

### Pricing
```javascript
context: {
  type: 'pricing',
  basePrice: 200,
  isEmergency: false,
  distance: 5
}
```

### Sustainability
```javascript
context: {
  type: 'sustainability',
  co2Saved: 12.5,
  waterSaved: 3500,
  rank: 5
}
```

### Customer Support
```javascript
context: {
  type: 'customer_support',
  userId: 123
}
```

## 🔄 Provider Fallback Chain

```
OpenAI → Anthropic → Gemini → Cohere → Mock Response
```

## 📊 Database

### ai_conversations Table
```sql
CREATE TABLE ai_conversations (
  id INTEGER PRIMARY KEY,
  userId INTEGER,
  prompt TEXT,
  response TEXT,
  provider TEXT,
  sentiment TEXT,
  intent TEXT,
  createdAt DATETIME
);
```

## 🧪 Testing

### Test Chat API
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "prompt": "How much to repair a shirt?",
    "context": {"type": "pricing"}
  }'
```

### Test MCP Tools (in Kiro IDE)
1. Open Command Palette
2. Search "MCP"
3. Select "Test MCP Tool"
4. Choose server and tool
5. Provide arguments

## 🎨 Frontend Usage

### AIChatbot Component
```javascript
import AIChatbot from './components/AIChatbot';

// Component automatically:
// - Calls /api/ai/chat endpoint
// - Displays provider badges
// - Shows confidence scores
// - Handles fallbacks
```

### Provider Display
- **Provider Badge:** Shows which AI answered (OpenAI, Anthropic, etc.)
- **Confidence Badge:** Shows confidence percentage (e.g., "95% confident")

## 🔧 Configuration

### MCP Config Location
`.kiro/settings/mcp.json`

### Enable/Disable Servers
```json
{
  "mcpServers": {
    "rewear-ai-assistant": {
      "disabled": false  // Set to true to disable
    }
  }
}
```

### Auto-Approve Tools
```json
{
  "autoApprove": [
    "analyze_garment",
    "get_repair_recommendation"
  ]
}
```

## 🐛 Troubleshooting

### MCP Servers Not Connecting
```bash
# 1. Check Node.js version
node --version  # Should be >= 18

# 2. Install MCP dependencies
npm run install-mcp

# 3. Check configuration
cat .kiro/settings/mcp.json

# 4. View logs in Kiro output panel
```

### All Providers Failing
```bash
# 1. Check API keys
cat .env | grep API_KEY

# 2. Test connectivity
curl https://api.openai.com/v1/models

# 3. Check rate limits
# Review provider dashboards
```

### Low Confidence Scores
- Provide more context in request
- Use more specific prompts
- Try different providers
- Review prompt engineering

## 📈 Monitoring

### Get Provider Stats
```javascript
const stats = multiLLMService.getProviderStats();
// Returns: { available: [...], total: 4, providers: [...] }
```

### Get Conversation History
```javascript
const history = await multiLLMService.getConversationHistory(userId, 10);
```

## 🔐 Security Checklist

- ✅ API keys in `.env` (not committed)
- ✅ JWT authentication on endpoints
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ CORS configuration
- ⚠️ Add rate limiting (recommended)
- ⚠️ Implement API key rotation (recommended)

## 📚 Documentation Files

- `MULTI_LLM_INTEGRATION.md` - Comprehensive guide
- `MCP_IMPLEMENTATION_COMPLETE.md` - Implementation summary
- `server/mcp/README.md` - MCP server documentation
- `QUICK_REFERENCE_MCP.md` - This file

## 🎯 Key Features

✅ 4 AI providers with automatic fallback
✅ 3 MCP servers with 12 specialized tools
✅ Context-aware responses
✅ Provider transparency
✅ Confidence scoring
✅ Conversation storage
✅ Sentiment analysis
✅ Intent detection

## 💡 Tips

1. **Start with OpenAI** - Most reliable for general queries
2. **Use Context Types** - Get better, specialized responses
3. **Monitor Confidence** - Low scores may need better prompts
4. **Enable Auto-Approve** - Faster tool execution
5. **Cache Responses** - Reduce API costs (future enhancement)

## 🚦 Status Indicators

### Provider Status
- 🟢 **Available** - API key configured and working
- 🟡 **Fallback** - Using backup provider
- 🔴 **Unavailable** - No API key or failing
- ⚪ **Mock** - Using simulated responses

### MCP Server Status
- 🟢 **Connected** - Server running and responsive
- 🟡 **Starting** - Server initializing
- 🔴 **Disconnected** - Server not running
- ⚪ **Disabled** - Server disabled in config

## 📞 Support

**Documentation:** Check all `.md` files in project root
**Logs:** Kiro IDE → Output Panel → MCP Servers
**Testing:** Command Palette → "Test MCP Tool"
**Issues:** Review troubleshooting section above

---

**Quick Reference Version:** 1.0
**Last Updated:** April 16, 2026
**Status:** ✅ Production Ready
