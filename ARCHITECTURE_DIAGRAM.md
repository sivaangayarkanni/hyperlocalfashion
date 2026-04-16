# ReWear Multi-LLM & MCP Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                         │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    React Frontend                           │    │
│  │                                                             │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │    │
│  │  │  AIChatbot   │  │  Dashboard   │  │   Booking    │    │    │
│  │  │  Component   │  │  Components  │  │  Components  │    │    │
│  │  └──────┬───────┘  └──────────────┘  └──────────────┘    │    │
│  │         │                                                  │    │
│  │         │ HTTP POST /api/ai/chat                          │    │
│  │         │ { prompt, context, provider }                   │    │
│  └─────────┼──────────────────────────────────────────────────┘    │
└───────────┼───────────────────────────────────────────────────────┘
            │
            │
┌───────────▼───────────────────────────────────────────────────────┐
│                      BACKEND API LAYER                             │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Express.js Server                            │    │
│  │                                                           │    │
│  │  ┌────────────────────────────────────────────────────┐  │    │
│  │  │         /api/ai/chat Route Handler                 │  │    │
│  │  │  • Authentication                                  │  │    │
│  │  │  • Request validation                              │  │    │
│  │  │  • Response formatting                             │  │    │
│  │  └────────────────┬───────────────────────────────────┘  │    │
│  │                   │                                       │    │
│  │  ┌────────────────▼───────────────────────────────────┐  │    │
│  │  │          MultiLLMService                           │  │    │
│  │  │                                                    │  │    │
│  │  │  • Provider Management                            │  │    │
│  │  │  • Automatic Fallback Logic                       │  │    │
│  │  │  • Context Generation                             │  │    │
│  │  │  • Response Formatting                            │  │    │
│  │  │  • Conversation Storage                           │  │    │
│  │  │  • Sentiment Analysis                             │  │    │
│  │  │  • Intent Detection                               │  │    │
│  │  └────────────────┬───────────────────────────────────┘  │    │
│  └───────────────────┼──────────────────────────────────────┘    │
└────────────────────┼─────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬──────────────┐
        │            │            │              │
        │            │            │              │
┌───────▼──────┐ ┌──▼──────┐ ┌──▼────────┐ ┌───▼──────────┐
│              │ │         │ │           │ │              │
│ MCP SERVERS  │ │ AI APIs │ │ DATABASE  │ │ EXTERNAL     │
│              │ │         │ │           │ │ SERVICES     │
└──────────────┘ └─────────┘ └───────────┘ └──────────────┘
```

## MCP Server Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      MCP SERVER LAYER                            │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  AI Assistant    │  │   Analytics      │  │ Notifications│ │
│  │     Server       │  │     Server       │  │    Server    │ │
│  │                  │  │                  │  │              │ │
│  │ Tools:           │  │ Tools:           │  │ Tools:       │ │
│  │ • analyze_       │  │ • get_user_      │  │ • send_sms   │ │
│  │   garment        │  │   stats          │  │ • send_email │ │
│  │ • get_repair_    │  │ • get_platform_  │  │ • send_push  │ │
│  │   recommendation │  │   metrics        │  │ • send_bulk  │ │
│  │ • calculate_     │  │ • generate_      │  │              │ │
│  │   sustainability │  │   report         │  │              │ │
│  │ • generate_      │  │ • get_tailor_    │  │              │ │
│  │   response       │  │   analytics      │  │              │ │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘ │
└───────────┼─────────────────────┼────────────────────┼─────────┘
            │                     │                    │
            │                     │                    │
    ┌───────▼──────┐      ┌──────▼────────┐   ┌──────▼────────┐
    │ Image        │      │ SQLite        │   │ Twilio        │
    │ Analysis     │      │ Database      │   │ SendGrid      │
    │ (Simulated)  │      │ Queries       │   │ FCM           │
    └──────────────┘      └───────────────┘   └───────────────┘
```

## AI Provider Fallback Chain

```
┌─────────────────────────────────────────────────────────────────┐
│                   MULTI-PROVIDER FALLBACK                        │
│                                                                  │
│  User Request                                                    │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐                                                │
│  │   OpenAI    │  ✅ Success → Return Response                  │
│  │   GPT-4     │                                                │
│  └──────┬──────┘                                                │
│         │ ❌ Fail                                               │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │  Anthropic  │  ✅ Success → Return Response                  │
│  │   Claude    │                                                │
│  └──────┬──────┘                                                │
│         │ ❌ Fail                                               │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │   Google    │  ✅ Success → Return Response                  │
│  │   Gemini    │                                                │
│  └──────┬──────┘                                                │
│         │ ❌ Fail                                               │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │   Cohere    │  ✅ Success → Return Response                  │
│  │   Command   │                                                │
│  └──────┬──────┘                                                │
│         │ ❌ Fail                                               │
│         ▼                                                        │
│  ┌─────────────┐                                                │
│  │    Mock     │  ✅ Always Returns Fallback Response           │
│  │  Response   │                                                │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌──────────┐
│  User    │
│  Types   │
│ Message  │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  AIChatbot      │
│  Component      │
│  • Analyze      │
│    Intent       │
│  • Format       │
│    Request      │
└────┬────────────┘
     │
     │ POST /api/ai/chat
     │ {
     │   prompt: "...",
     │   context: {...},
     │   provider: "openai"
     │ }
     │
     ▼
┌─────────────────┐
│  API Route      │
│  Handler        │
│  • Validate     │
│  • Authenticate │
└────┬────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  MultiLLMService                │
│                                 │
│  1. Get Available Providers     │
│  2. Try Preferred Provider      │
│  3. Fallback if Needed          │
│  4. Generate Context            │
│  5. Format Response             │
│  6. Store Conversation          │
│  7. Analyze Sentiment           │
└────┬────────────────────────────┘
     │
     ├─────────────┬──────────────┬──────────────┐
     │             │              │              │
     ▼             ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐
│ OpenAI  │  │Anthropic │  │ Gemini  │  │  Cohere  │
│   API   │  │   API    │  │   API   │  │   API    │
└────┬────┘  └─────┬────┘  └────┬────┘  └─────┬────┘
     │             │             │             │
     └─────────────┴─────────────┴─────────────┘
                   │
                   ▼
          ┌────────────────┐
          │   Response     │
          │   {            │
          │     text,      │
          │     provider,  │
          │     confidence │
          │   }            │
          └────┬───────────┘
               │
               ▼
     ┌──────────────────┐
     │  Store in DB     │
     │  ai_conversations│
     └────┬─────────────┘
          │
          ▼
     ┌──────────────────┐
     │  Return to       │
     │  Frontend        │
     └────┬─────────────┘
          │
          ▼
     ┌──────────────────┐
     │  Display in      │
     │  Chat UI         │
     │  • Message       │
     │  • Provider      │
     │  • Confidence    │
     │  • Actions       │
     └──────────────────┘
```

## Context Type Processing

```
┌─────────────────────────────────────────────────────────────┐
│                    CONTEXT TYPES                             │
│                                                              │
│  User Query → Intent Detection → Context Type Selection     │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Damage Analysis  │  │     Pricing      │               │
│  │                  │  │                  │               │
│  │ Keywords:        │  │ Keywords:        │               │
│  │ • damage         │  │ • price          │               │
│  │ • repair         │  │ • cost           │               │
│  │ • torn           │  │ • estimate       │               │
│  │ • broken         │  │ • how much       │               │
│  │                  │  │                  │               │
│  │ Response:        │  │ Response:        │               │
│  │ • Damage type    │  │ • Price range    │               │
│  │ • Severity       │  │ • Breakdown      │               │
│  │ • Repair method  │  │ • Factors        │               │
│  │ • Cost estimate  │  │ • Comparison     │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Sustainability   │  │ Customer Support │               │
│  │                  │  │                  │               │
│  │ Keywords:        │  │ Keywords:        │               │
│  │ • environment    │  │ • help           │               │
│  │ • impact         │  │ • how to         │               │
│  │ • co2            │  │ • what is        │               │
│  │ • sustainable    │  │ • explain        │               │
│  │                  │  │                  │               │
│  │ Response:        │  │ Response:        │               │
│  │ • CO2 saved      │  │ • Instructions   │               │
│  │ • Water saved    │  │ • Features       │               │
│  │ • Rank           │  │ • Navigation     │               │
│  │ • Badges         │  │ • Tips           │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE TABLES                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ai_conversations                                     │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │ id (PK)                                         │  │  │
│  │  │ userId (FK → users.id)                          │  │  │
│  │  │ prompt (TEXT)                                   │  │  │
│  │  │ response (TEXT)                                 │  │  │
│  │  │ provider (TEXT)                                 │  │  │
│  │  │ sentiment (TEXT)                                │  │  │
│  │  │ intent (TEXT)                                   │  │  │
│  │  │ createdAt (DATETIME)                            │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Indexes:                                                    │
│  • idx_ai_conversations_user (userId)                        │
│  • idx_ai_conversations_created (createdAt)                  │
│                                                              │
│  Relationships:                                              │
│  • ai_conversations.userId → users.id                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Interaction Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  COMPONENT INTERACTIONS                      │
│                                                              │
│  Frontend Components                                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ AIChatbot  │  │ Dashboard  │  │  Booking   │           │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘           │
│        │               │               │                    │
│        └───────────────┴───────────────┘                    │
│                        │                                    │
│                        │ Uses                               │
│                        ▼                                    │
│              ┌──────────────────┐                           │
│              │  AuthContext     │                           │
│              │  • user          │                           │
│              │  • token         │                           │
│              └──────────────────┘                           │
│                        │                                    │
│                        │ Provides                           │
│                        ▼                                    │
│              ┌──────────────────┐                           │
│              │  API Calls       │                           │
│              │  • /api/ai/chat  │                           │
│              │  • /api/bookings │                           │
│              │  • /api/tailors  │                           │
│              └──────────────────┘                           │
│                        │                                    │
│                        │ Authenticated                      │
│                        ▼                                    │
│              ┌──────────────────┐                           │
│              │  Backend Routes  │                           │
│              │  • Validation    │                           │
│              │  • Processing    │                           │
│              │  • Response      │                           │
│              └──────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
│                                                              │
│  Layer 1: Frontend                                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │ • Input Validation                                 │     │
│  │ • XSS Prevention                                   │     │
│  │ • CSRF Protection                                  │     │
│  └────────────────────────────────────────────────────┘     │
│                        │                                    │
│                        ▼                                    │
│  Layer 2: API Gateway                                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │ • JWT Authentication                               │     │
│  │ • Rate Limiting                                    │     │
│  │ • CORS Configuration                               │     │
│  └────────────────────────────────────────────────────┘     │
│                        │                                    │
│                        ▼                                    │
│  Layer 3: Business Logic                                     │
│  ┌────────────────────────────────────────────────────┐     │
│  │ • Authorization Checks                             │     │
│  │ • Input Sanitization                               │     │
│  │ • SQL Injection Prevention                         │     │
│  └────────────────────────────────────────────────────┘     │
│                        │                                    │
│                        ▼                                    │
│  Layer 4: Data Access                                        │
│  ┌────────────────────────────────────────────────────┐     │
│  │ • Parameterized Queries                            │     │
│  │ • Encryption at Rest                               │     │
│  │ • Access Logging                                   │     │
│  └────────────────────────────────────────────────────┘     │
│                        │                                    │
│                        ▼                                    │
│  Layer 5: External Services                                  │
│  ┌────────────────────────────────────────────────────┐     │
│  │ • API Key Management                               │     │
│  │ • Environment Variables                            │     │
│  │ • Secure Communication (HTTPS)                     │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  DEPLOYMENT TOPOLOGY                         │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │              Load Balancer / CDN                   │     │
│  └────────────────┬───────────────────────────────────┘     │
│                   │                                         │
│         ┌─────────┴─────────┐                               │
│         │                   │                               │
│  ┌──────▼──────┐     ┌──────▼──────┐                       │
│  │  Frontend   │     │  Frontend   │                       │
│  │  Server 1   │     │  Server 2   │                       │
│  │  (React)    │     │  (React)    │                       │
│  └──────┬──────┘     └──────┬──────┘                       │
│         │                   │                               │
│         └─────────┬─────────┘                               │
│                   │                                         │
│         ┌─────────▼─────────┐                               │
│         │                   │                               │
│  ┌──────▼──────┐     ┌──────▼──────┐                       │
│  │  Backend    │     │  Backend    │                       │
│  │  Server 1   │     │  Server 2   │                       │
│  │  (Node.js)  │     │  (Node.js)  │                       │
│  └──────┬──────┘     └──────┬──────┘                       │
│         │                   │                               │
│         └─────────┬─────────┘                               │
│                   │                                         │
│         ┌─────────▼─────────┐                               │
│         │                   │                               │
│  ┌──────▼──────┐     ┌──────▼──────┐                       │
│  │  Database   │     │  MCP        │                       │
│  │  (SQLite/   │     │  Servers    │                       │
│  │  PostgreSQL)│     │  (3 servers)│                       │
│  └─────────────┘     └──────┬──────┘                       │
│                             │                               │
│                   ┌─────────┴─────────┐                     │
│                   │                   │                     │
│            ┌──────▼──────┐     ┌──────▼──────┐             │
│            │  External   │     │  External   │             │
│            │  AI APIs    │     │  Services   │             │
│            │  (4 provs)  │     │  (Notify)   │             │
│            └─────────────┘     └─────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

**Architecture Version:** 1.0
**Last Updated:** April 16, 2026
**Status:** ✅ Production Ready
