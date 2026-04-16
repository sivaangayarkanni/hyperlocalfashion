#!/usr/bin/env node

/**
 * ReWear API Key Manager MCP Server
 * Helps fetch, validate, and manage API keys for various services
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

// Initialize MCP Server
const server = new Server(
  {
    name: 'rewear-api-key-manager',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// API Provider Information
const API_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    signupUrl: 'https://platform.openai.com/signup',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    docsUrl: 'https://platform.openai.com/docs',
    keyFormat: 'sk-...',
    envVar: 'OPENAI_API_KEY',
    pricing: 'Pay-as-you-go, ~$0.03 per 1K tokens for GPT-4',
    features: ['GPT-4', 'GPT-3.5', 'DALL-E', 'Whisper', 'Embeddings']
  },
  anthropic: {
    name: 'Anthropic Claude',
    signupUrl: 'https://console.anthropic.com/signup',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    docsUrl: 'https://docs.anthropic.com',
    keyFormat: 'sk-ant-...',
    envVar: 'ANTHROPIC_API_KEY',
    pricing: 'Pay-as-you-go, ~$0.015 per 1K tokens for Claude',
    features: ['Claude 3 Opus', 'Claude 3 Sonnet', 'Claude 3 Haiku']
  },
  google: {
    name: 'Google AI (Gemini)',
    signupUrl: 'https://makersuite.google.com/app/apikey',
    apiKeyUrl: 'https://makersuite.google.com/app/apikey',
    docsUrl: 'https://ai.google.dev/docs',
    keyFormat: 'AIza...',
    envVar: 'GOOGLE_API_KEY',
    pricing: 'Free tier available, then pay-as-you-go',
    features: ['Gemini Pro', 'Gemini Pro Vision', 'PaLM 2']
  },
  cohere: {
    name: 'Cohere',
    signupUrl: 'https://dashboard.cohere.com/welcome/register',
    apiKeyUrl: 'https://dashboard.cohere.com/api-keys',
    docsUrl: 'https://docs.cohere.com',
    keyFormat: '...',
    envVar: 'COHERE_API_KEY',
    pricing: 'Free tier available, then pay-as-you-go',
    features: ['Command', 'Embed', 'Rerank', 'Generate']
  },
  twilio: {
    name: 'Twilio',
    signupUrl: 'https://www.twilio.com/try-twilio',
    apiKeyUrl: 'https://www.twilio.com/console',
    docsUrl: 'https://www.twilio.com/docs',
    keyFormat: 'AC...',
    envVar: 'TWILIO_ACCOUNT_SID',
    pricing: 'Pay-as-you-go, ~$0.0075 per SMS',
    features: ['SMS', 'Voice', 'Video', 'WhatsApp']
  },
  sendgrid: {
    name: 'SendGrid',
    signupUrl: 'https://signup.sendgrid.com',
    apiKeyUrl: 'https://app.sendgrid.com/settings/api_keys',
    docsUrl: 'https://docs.sendgrid.com',
    keyFormat: 'SG...',
    envVar: 'SENDGRID_API_KEY',
    pricing: 'Free tier: 100 emails/day, then pay-as-you-go',
    features: ['Email API', 'Marketing Campaigns', 'Email Validation']
  },
  cloudinary: {
    name: 'Cloudinary',
    signupUrl: 'https://cloudinary.com/users/register/free',
    apiKeyUrl: 'https://cloudinary.com/console',
    docsUrl: 'https://cloudinary.com/documentation',
    keyFormat: '...',
    envVar: 'CLOUDINARY_API_KEY',
    pricing: 'Free tier: 25 credits/month, then pay-as-you-go',
    features: ['Image Upload', 'Video Processing', 'CDN', 'Transformations']
  }
};

// Tool Definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_api_key_info',
        description: 'Get information about how to obtain an API key for a specific service',
        inputSchema: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              enum: Object.keys(API_PROVIDERS),
              description: 'The API provider (openai, anthropic, google, cohere, twilio, sendgrid, cloudinary)',
            },
          },
          required: ['provider'],
        },
      },
      {
        name: 'list_all_providers',
        description: 'List all available API providers with their information',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'validate_api_key_format',
        description: 'Validate if an API key matches the expected format for a provider',
        inputSchema: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              enum: Object.keys(API_PROVIDERS),
              description: 'The API provider',
            },
            apiKey: {
              type: 'string',
              description: 'The API key to validate (format only, not actual validation)',
            },
          },
          required: ['provider', 'apiKey'],
        },
      },
      {
        name: 'generate_env_template',
        description: 'Generate a .env file template with all required API keys',
        inputSchema: {
          type: 'object',
          properties: {
            includeComments: {
              type: 'boolean',
              description: 'Include helpful comments in the template',
              default: true,
            },
          },
        },
      },
      {
        name: 'get_setup_instructions',
        description: 'Get step-by-step instructions for setting up API keys',
        inputSchema: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              enum: Object.keys(API_PROVIDERS),
              description: 'The API provider (optional, if not provided returns general instructions)',
            },
          },
        },
      },
    ],
  };
});

// Tool Handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_api_key_info': {
        const { provider } = args;
        const info = API_PROVIDERS[provider];

        if (!info) {
          throw new Error(`Unknown provider: ${provider}`);
        }

        const response = {
          provider: provider,
          name: info.name,
          howToGetKey: {
            step1: `Visit ${info.signupUrl} to create an account`,
            step2: `Go to ${info.apiKeyUrl} to generate your API key`,
            step3: `Copy the key (format: ${info.keyFormat})`,
            step4: `Add to .env file as ${info.envVar}=your_key_here`,
          },
          documentation: info.docsUrl,
          pricing: info.pricing,
          features: info.features,
          envVariable: info.envVar,
          keyFormat: info.keyFormat,
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }

      case 'list_all_providers': {
        const providers = Object.entries(API_PROVIDERS).map(([key, info]) => ({
          id: key,
          name: info.name,
          signupUrl: info.signupUrl,
          apiKeyUrl: info.apiKeyUrl,
          envVar: info.envVar,
          pricing: info.pricing,
          features: info.features.slice(0, 3), // Top 3 features
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                totalProviders: providers.length,
                providers: providers,
                note: 'Use get_api_key_info for detailed instructions on any provider',
              }, null, 2),
            },
          ],
        };
      }

      case 'validate_api_key_format': {
        const { provider, apiKey } = args;
        const info = API_PROVIDERS[provider];

        if (!info) {
          throw new Error(`Unknown provider: ${provider}`);
        }

        let isValid = false;
        let message = '';

        // Basic format validation
        switch (provider) {
          case 'openai':
            isValid = apiKey.startsWith('sk-') && apiKey.length > 20;
            message = isValid ? 'Format looks correct' : 'Should start with "sk-" and be longer';
            break;
          case 'anthropic':
            isValid = apiKey.startsWith('sk-ant-') && apiKey.length > 20;
            message = isValid ? 'Format looks correct' : 'Should start with "sk-ant-"';
            break;
          case 'google':
            isValid = apiKey.startsWith('AIza') && apiKey.length > 20;
            message = isValid ? 'Format looks correct' : 'Should start with "AIza"';
            break;
          case 'sendgrid':
            isValid = apiKey.startsWith('SG.') && apiKey.length > 20;
            message = isValid ? 'Format looks correct' : 'Should start with "SG."';
            break;
          case 'twilio':
            isValid = apiKey.startsWith('AC') && apiKey.length === 34;
            message = isValid ? 'Format looks correct' : 'Should start with "AC" and be 34 characters';
            break;
          default:
            isValid = apiKey.length > 10;
            message = isValid ? 'Length seems reasonable' : 'Key seems too short';
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                provider: info.name,
                isValidFormat: isValid,
                message: message,
                expectedFormat: info.keyFormat,
                note: 'This only validates format, not if the key actually works',
              }, null, 2),
            },
          ],
        };
      }

      case 'generate_env_template': {
        const { includeComments = true } = args;

        let template = '';

        if (includeComments) {
          template += '# ReWear Platform - Environment Variables\n';
          template += '# Copy this file to .env and fill in your actual API keys\n\n';
        }

        // Server Configuration
        template += '# Server Configuration\n';
        template += 'PORT=5000\n';
        template += 'NODE_ENV=development\n';
        template += 'CLIENT_URL=http://localhost:3000\n\n';

        // JWT
        template += '# Authentication\n';
        template += 'JWT_SECRET=your_jwt_secret_key_here\n';
        template += 'JWT_EXPIRE=7d\n\n';

        // AI Providers
        template += '# AI Provider API Keys (Multi-LLM Integration)\n';
        if (includeComments) {
          template += '# Get keys from:\n';
          template += '# - OpenAI: https://platform.openai.com/api-keys\n';
          template += '# - Anthropic: https://console.anthropic.com/settings/keys\n';
          template += '# - Google: https://makersuite.google.com/app/apikey\n';
          template += '# - Cohere: https://dashboard.cohere.com/api-keys\n';
        }
        template += 'OPENAI_API_KEY=\n';
        template += 'ANTHROPIC_API_KEY=\n';
        template += 'GOOGLE_API_KEY=\n';
        template += 'COHERE_API_KEY=\n\n';

        // Notification Services
        template += '# Notification Services (Optional)\n';
        if (includeComments) {
          template += '# Twilio: https://www.twilio.com/console\n';
          template += '# SendGrid: https://app.sendgrid.com/settings/api_keys\n';
        }
        template += 'TWILIO_ACCOUNT_SID=\n';
        template += 'TWILIO_AUTH_TOKEN=\n';
        template += 'SENDGRID_API_KEY=\n\n';

        // Cloudinary
        template += '# Image Upload Service\n';
        if (includeComments) {
          template += '# Cloudinary: https://cloudinary.com/console\n';
        }
        template += 'CLOUDINARY_CLOUD_NAME=\n';
        template += 'CLOUDINARY_API_KEY=\n';
        template += 'CLOUDINARY_API_SECRET=\n';

        return {
          content: [
            {
              type: 'text',
              text: template,
            },
          ],
        };
      }

      case 'get_setup_instructions': {
        const { provider } = args;

        if (provider) {
          const info = API_PROVIDERS[provider];
          if (!info) {
            throw new Error(`Unknown provider: ${provider}`);
          }

          const instructions = `
# ${info.name} API Key Setup Instructions

## Step 1: Create Account
Visit: ${info.signupUrl}
- Sign up for a new account (or log in if you have one)
- Verify your email address

## Step 2: Generate API Key
Visit: ${info.apiKeyUrl}
- Navigate to API Keys section
- Click "Create new API key" or similar button
- Give it a name (e.g., "ReWear Platform")
- Copy the generated key immediately (you may not see it again!)

## Step 3: Add to Environment
1. Open your .env file in the project root
2. Add this line:
   ${info.envVar}=your_actual_key_here
3. Replace "your_actual_key_here" with the key you copied
4. Save the file

## Step 4: Verify
- Key format should look like: ${info.keyFormat}
- Restart your server to load the new environment variable
- Test the integration

## Pricing
${info.pricing}

## Features Available
${info.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## Documentation
For more details: ${info.docsUrl}

## Troubleshooting
- Make sure there are no spaces around the = sign
- Don't use quotes around the key value
- Restart your server after adding the key
- Check that .env is in your .gitignore file
`;

          return {
            content: [
              {
                type: 'text',
                text: instructions,
              },
            ],
          };
        } else {
          // General instructions
          const instructions = `
# General API Key Setup Instructions

## Quick Start Guide

### 1. Choose Your Providers
You need at least ONE AI provider for the multi-LLM system to work:
- OpenAI (recommended for best results)
- Anthropic Claude (great alternative)
- Google Gemini (free tier available)
- Cohere (good for embeddings)

Optional services:
- Twilio (for SMS notifications)
- SendGrid (for email notifications)
- Cloudinary (for image uploads)

### 2. Get Your API Keys
For each provider you want to use:
1. Visit their signup page
2. Create an account
3. Navigate to API keys section
4. Generate a new key
5. Copy it immediately

### 3. Add to .env File
1. Copy .env.example to .env
2. Add your keys:
   OPENAI_API_KEY=your_key_here
   ANTHROPIC_API_KEY=your_key_here
   etc.

### 4. Restart Server
npm run dev

## Recommended Setup for ReWear

### Minimum (Free/Low Cost)
- Google Gemini (free tier)
- No notification services (use mock)

### Recommended (Best Experience)
- OpenAI GPT-4 (~$10-50/month)
- SendGrid (free tier: 100 emails/day)
- Cloudinary (free tier)

### Full Featured
- OpenAI + Anthropic (fallback)
- Twilio (SMS)
- SendGrid (Email)
- Cloudinary (Images)

## Cost Estimates

### AI Providers (per 1000 requests)
- OpenAI GPT-4: ~$30
- Anthropic Claude: ~$15
- Google Gemini: Free tier, then ~$1
- Cohere: ~$2

### Notifications
- Twilio SMS: ~$7.50 (1000 messages)
- SendGrid: Free for 100/day, then ~$15/month

### Storage
- Cloudinary: Free for 25 credits/month

## Security Best Practices

1. Never commit .env to git
2. Use different keys for dev/production
3. Rotate keys regularly
4. Set up billing alerts
5. Use environment-specific keys

## Need Help?

Use these MCP tools:
- get_api_key_info: Detailed info for specific provider
- list_all_providers: See all available providers
- validate_api_key_format: Check if your key format is correct
- generate_env_template: Create a template .env file
`;

          return {
            content: [
              {
                type: 'text',
                text: instructions,
              },
            ],
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ReWear API Key Manager MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
