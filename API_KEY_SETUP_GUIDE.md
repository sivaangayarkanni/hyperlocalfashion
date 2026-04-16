# 🔑 API Key Setup Guide - Using MCP

## Overview

The ReWear platform now includes an **API Key Manager MCP Server** that helps you easily fetch, validate, and manage API keys for all required services.

## 🚀 Quick Start

### Option 1: Use MCP Tools in Kiro IDE

1. **Open Kiro IDE**
2. **Open Command Palette** (Ctrl+Shift+P / Cmd+Shift+P)
3. **Search:** "Test MCP Tool"
4. **Select Server:** rewear-api-key-manager
5. **Choose a tool** and follow the instructions

### Option 2: Follow This Guide

## 📋 Available MCP Tools

### 1. `list_all_providers`
**Purpose:** See all available API providers

**Usage in Kiro:**
- Server: rewear-api-key-manager
- Tool: list_all_providers
- Arguments: (none)

**Returns:** List of all providers with signup URLs and features

### 2. `get_api_key_info`
**Purpose:** Get detailed instructions for a specific provider

**Usage in Kiro:**
- Server: rewear-api-key-manager
- Tool: get_api_key_info
- Arguments:
  ```json
  {
    "provider": "openai"
  }
  ```

**Providers:** openai, anthropic, google, cohere, twilio, sendgrid, cloudinary

### 3. `get_setup_instructions`
**Purpose:** Get step-by-step setup instructions

**Usage in Kiro:**
- Server: rewear-api-key-manager
- Tool: get_setup_instructions
- Arguments:
  ```json
  {
    "provider": "openai"
  }
  ```
  Or leave empty for general instructions

### 4. `validate_api_key_format`
**Purpose:** Check if your API key format is correct

**Usage in Kiro:**
- Server: rewear-api-key-manager
- Tool: validate_api_key_format
- Arguments:
  ```json
  {
    "provider": "openai",
    "apiKey": "sk-your-key-here"
  }
  ```

### 5. `generate_env_template`
**Purpose:** Generate a complete .env template

**Usage in Kiro:**
- Server: rewear-api-key-manager
- Tool: generate_env_template
- Arguments:
  ```json
  {
    "includeComments": true
  }
  ```

## 🎯 Step-by-Step: Getting API Keys

### For OpenAI (Recommended)

1. **Use MCP Tool:**
   ```
   Server: rewear-api-key-manager
   Tool: get_api_key_info
   Arguments: {"provider": "openai"}
   ```

2. **Follow the returned instructions:**
   - Visit: https://platform.openai.com/signup
   - Create account
   - Go to: https://platform.openai.com/api-keys
   - Generate new key
   - Copy it (starts with `sk-`)

3. **Add to .env:**
   ```env
   OPENAI_API_KEY=sk-your-actual-key-here
   ```

4. **Restart server:**
   ```bash
   npm run dev
   ```

### For Anthropic Claude

1. **Use MCP Tool:**
   ```
   Tool: get_api_key_info
   Arguments: {"provider": "anthropic"}
   ```

2. **Visit:** https://console.anthropic.com/signup
3. **Generate key** (starts with `sk-ant-`)
4. **Add to .env:**
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

### For Google Gemini (Free Tier!)

1. **Use MCP Tool:**
   ```
   Tool: get_api_key_info
   Arguments: {"provider": "google"}
   ```

2. **Visit:** https://makersuite.google.com/app/apikey
3. **Generate key** (starts with `AIza`)
4. **Add to .env:**
   ```env
   GOOGLE_API_KEY=AIza-your-key-here
   ```

## 📊 Recommended Setup

### Minimum (Free)
```env
# Just one AI provider
GOOGLE_API_KEY=your_key_here
```

### Recommended (Best Experience)
```env
# Primary AI provider
OPENAI_API_KEY=your_key_here

# Email notifications
SENDGRID_API_KEY=your_key_here
```

### Full Featured
```env
# Multiple AI providers (automatic fallback)
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here

# Notifications
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
SENDGRID_API_KEY=your_key_here

# Image uploads
CLOUDINARY_CLOUD_NAME=your_name_here
CLOUDINARY_API_KEY=your_key_here
CLOUDINARY_API_SECRET=your_secret_here
```

## 💰 Cost Estimates

### AI Providers
| Provider | Free Tier | Paid Pricing |
|----------|-----------|--------------|
| Google Gemini | ✅ Yes | ~$0.001/1K tokens |
| Cohere | ✅ Limited | ~$0.002/1K tokens |
| OpenAI | ❌ No | ~$0.03/1K tokens |
| Anthropic | ❌ No | ~$0.015/1K tokens |

### Notifications
| Service | Free Tier | Paid Pricing |
|---------|-----------|--------------|
| SendGrid | ✅ 100 emails/day | $15/month for 40K |
| Twilio | ❌ No | ~$0.0075 per SMS |

### Storage
| Service | Free Tier | Paid Pricing |
|---------|-----------|--------------|
| Cloudinary | ✅ 25 credits/month | Pay-as-you-go |

## 🔒 Security Best Practices

1. **Never commit .env to git**
   - Already in .gitignore
   - Double-check before pushing

2. **Use different keys for dev/production**
   - Create separate API keys
   - Label them clearly

3. **Rotate keys regularly**
   - Every 3-6 months
   - Immediately if compromised

4. **Set up billing alerts**
   - Prevent unexpected charges
   - Monitor usage

5. **Use minimum permissions**
   - Only grant necessary access
   - Revoke unused keys

## 🧪 Testing Your Setup

### 1. Validate Key Format
Use MCP tool:
```json
{
  "provider": "openai",
  "apiKey": "sk-your-key-here"
}
```

### 2. Run Verification Script
```bash
npm run verify-setup
```

### 3. Test in Application
```bash
npm run dev
```
Then test the chatbot with a message.

## 🐛 Troubleshooting

### "API key not found"
- Check .env file exists
- Verify key name matches exactly
- Restart server after adding key

### "Invalid API key format"
- Use MCP validate tool
- Check for extra spaces
- Verify key starts with correct prefix

### "Rate limit exceeded"
- Check provider dashboard
- Upgrade plan if needed
- Implement caching

### "Server not starting"
- Check all required env vars
- Look for syntax errors in .env
- Verify no duplicate keys

## 📚 Additional Resources

### Provider Documentation
- **OpenAI:** https://platform.openai.com/docs
- **Anthropic:** https://docs.anthropic.com
- **Google AI:** https://ai.google.dev/docs
- **Cohere:** https://docs.cohere.com
- **Twilio:** https://www.twilio.com/docs
- **SendGrid:** https://docs.sendgrid.com
- **Cloudinary:** https://cloudinary.com/documentation

### MCP Server Documentation
- See: `server/mcp/README.md`
- See: `MULTI_LLM_INTEGRATION.md`

## 🎯 Quick Commands

```bash
# Install MCP dependencies
npm run install-mcp

# Verify setup
npm run verify-setup

# Start development server
npm run dev

# Test MCP servers
# Use Kiro IDE Command Palette → "Test MCP Tool"
```

## ✅ Checklist

Before starting development:

- [ ] Created accounts on chosen providers
- [ ] Generated API keys
- [ ] Added keys to .env file
- [ ] Verified key formats using MCP tool
- [ ] Restarted server
- [ ] Tested chatbot functionality
- [ ] Set up billing alerts
- [ ] Documented which keys are for dev/prod

## 🆘 Need Help?

1. **Use MCP Tools:**
   - `get_setup_instructions` for detailed guides
   - `list_all_providers` to see all options
   - `validate_api_key_format` to check keys

2. **Check Documentation:**
   - `MULTI_LLM_INTEGRATION.md`
   - `SETUP_COMPLETE.md`
   - Provider documentation links above

3. **Run Verification:**
   ```bash
   npm run verify-setup
   ```

---

**Last Updated:** April 16, 2026
**MCP Server:** rewear-api-key-manager v1.0.0
**Status:** ✅ Ready to Use
