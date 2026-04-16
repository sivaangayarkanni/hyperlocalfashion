# ReWear MCP Servers

Model Context Protocol (MCP) servers for the ReWear sustainable fashion platform.

## Overview

These MCP servers provide modular, intelligent capabilities for the ReWear platform:

1. **AI Assistant Server** - Garment analysis, repair recommendations, and customer support
2. **Analytics Server** - Platform metrics, user statistics, and reporting
3. **Notifications Server** - Multi-channel notifications (SMS, email, push)

## Installation

```bash
cd server/mcp
npm install
```

## Configuration

MCP servers are configured in `.kiro/settings/mcp.json`. Each server requires specific environment variables:

### AI Assistant Server
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GOOGLE_API_KEY` - Google Gemini API key
- `COHERE_API_KEY` - Cohere API key

### Analytics Server
- `DATABASE_PATH` - Path to SQLite database (default: `./rewear.db`)

### Notifications Server
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `SENDGRID_API_KEY` - SendGrid API key

## Usage

### AI Assistant Server

**Tools:**
- `analyze_garment` - Analyze garment damage from images
- `get_repair_recommendation` - Get detailed repair recommendations
- `calculate_sustainability_impact` - Calculate environmental impact
- `generate_response` - Generate contextual AI responses

**Example:**
```javascript
{
  "tool": "analyze_garment",
  "arguments": {
    "imageUrl": "https://example.com/garment.jpg",
    "garmentType": "shirt"
  }
}
```

### Analytics Server

**Tools:**
- `get_user_stats` - Get user statistics
- `get_platform_metrics` - Get platform-wide metrics
- `generate_report` - Generate analytics reports
- `get_tailor_analytics` - Get tailor performance analytics

**Example:**
```javascript
{
  "tool": "get_platform_metrics",
  "arguments": {
    "timeRange": "month"
  }
}
```

### Notifications Server

**Tools:**
- `send_sms` - Send SMS notifications
- `send_email` - Send email notifications
- `send_push_notification` - Send push notifications
- `send_bulk_notification` - Send bulk notifications

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

## Running Servers

Servers are automatically started by Kiro when configured in `mcp.json`. To run manually:

```bash
# AI Assistant
npm run start:ai

# Analytics
npm run start:analytics

# Notifications
npm run start:notifications
```

## Integration with Multi-LLM Service

The AI Assistant Server integrates with the MultiLLMService to provide:
- Automatic provider fallback (OpenAI → Anthropic → Gemini → Cohere)
- Contextual response generation
- Sentiment analysis
- Intent detection

## Architecture

```
┌─────────────────┐
│  Kiro IDE       │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
┌────────▼────────┐ ┌─────▼──────────┐
│ MCP Client      │ │ Multi-LLM API  │
└────────┬────────┘ └─────┬──────────┘
         │                 │
    ┌────┴────┬────────────┴────┬──────────┐
    │         │                  │          │
┌───▼───┐ ┌──▼──────┐ ┌────────▼───┐ ┌────▼─────┐
│  AI   │ │Analytics│ │Notifications│ │ OpenAI   │
│Server │ │ Server  │ │   Server    │ │Anthropic │
└───────┘ └─────────┘ └─────────────┘ │ Gemini   │
                                       │ Cohere   │
                                       └──────────┘
```

## Development

### Adding New Tools

1. Add tool definition in `ListToolsRequestSchema` handler
2. Implement tool logic in `CallToolRequestSchema` handler
3. Update documentation

### Testing

Test MCP servers using the Kiro IDE:
1. Open command palette
2. Search for "MCP"
3. Use "Test MCP Tool" command

## Troubleshooting

**Server not connecting:**
- Check that Node.js >= 18 is installed
- Verify environment variables are set
- Check server logs in Kiro output panel

**Tool execution fails:**
- Verify API keys are valid
- Check database path is correct
- Review tool input schema

**Performance issues:**
- Enable auto-approve for frequently used tools
- Use bulk operations when possible
- Monitor database query performance

## License

MIT
