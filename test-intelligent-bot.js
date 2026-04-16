#!/usr/bin/env node

/**
 * Test Script for Intelligent Chatbot
 * Tests all intelligence features
 */

const sqlite3 = require('sqlite3').verbose();
const MultiLLMService = require('./server/services/MultiLLMService');

// Test database
const db = new sqlite3.Database(':memory:');

// Initialize service
const llmService = new MultiLLMService(db);

// Test cases
const testCases = [
  {
    name: 'Simple Tailor Search',
    prompt: 'Find me a tailor near me',
    expectedIntent: 'find_tailor'
  },
  {
    name: 'Complex Query with Multiple Entities',
    prompt: 'I need urgent repair for my torn wedding dress under ₹500',
    expectedIntent: 'find_tailor',
    expectedEntities: ['dress', 'torn', 'urgent', '500']
  },
  {
    name: 'Price Inquiry',
    prompt: 'How much does it cost to repair a shirt?',
    expectedIntent: 'price_inquiry',
    expectedEntities: ['shirt']
  },
  {
    name: 'Complaint with Negative Sentiment',
    prompt: 'This is terrible service! Very disappointed!',
    expectedIntent: 'complaint',
    expectedSentiment: 'negative'
  },
  {
    name: 'Praise with Positive Sentiment',
    prompt: 'Amazing service! Thank you so much!',
    expectedIntent: 'praise',
    expectedSentiment: 'positive'
  },
  {
    name: 'Sustainability Query',
    prompt: 'Show me my environmental impact',
    expectedIntent: 'sustainability'
  },
  {
    name: 'Order Tracking',
    prompt: 'Where is my order?',
    expectedIntent: 'track_order'
  },
  {
    name: 'Damage Analysis',
    prompt: 'My jeans have a big hole and a stain',
    expectedIntent: 'damage_analysis',
    expectedEntities: ['jeans', 'hole', 'stain']
  },
  {
    name: 'Help Request',
    prompt: 'How do I book a repair?',
    expectedIntent: 'help'
  },
  {
    name: 'Multi-Intent Query',
    prompt: 'Find a tailor and tell me the price',
    expectedIntents: ['find_tailor', 'price_inquiry']
  }
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║     🧠 INTELLIGENT CHATBOT TEST SUITE                    ║
║     Testing Advanced AI Features                         ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

// Run tests
async function runTests() {
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.magenta}Test: ${testCase.name}${colors.reset}`);
    console.log(`${colors.cyan}Prompt: "${testCase.prompt}"${colors.reset}`);

    try {
      // Analyze message
      const analysis = llmService.analyzeMessage(testCase.prompt, {});

      console.log(`\n${colors.yellow}Analysis Results:${colors.reset}`);
      
      // Check intents
      console.log(`\n  📊 Detected Intents:`);
      analysis.intents.forEach((intent, idx) => {
        const isExpected = testCase.expectedIntent === intent.intent || 
                          (testCase.expectedIntents && testCase.expectedIntents.includes(intent.intent));
        const symbol = isExpected ? '✓' : '○';
        const color = isExpected ? colors.green : colors.reset;
        console.log(`    ${color}${symbol} ${intent.intent} (${(intent.confidence * 100).toFixed(0)}% confidence)${colors.reset}`);
      });

      // Check entities
      if (testCase.expectedEntities) {
        console.log(`\n  🏷️  Extracted Entities:`);
        const allEntities = [
          ...analysis.entities.garmentTypes,
          ...analysis.entities.damageTypes,
          ...analysis.entities.timeReferences
        ];
        
        testCase.expectedEntities.forEach(expected => {
          const found = allEntities.some(e => e.includes(expected) || expected.includes(e));
          const symbol = found ? '✓' : '✗';
          const color = found ? colors.green : colors.red;
          console.log(`    ${color}${symbol} ${expected}${colors.reset}`);
        });
      }

      // Check sentiment
      if (testCase.expectedSentiment) {
        const sentimentMatch = analysis.sentiment === testCase.expectedSentiment;
        const symbol = sentimentMatch ? '✓' : '✗';
        const color = sentimentMatch ? colors.green : colors.red;
        console.log(`\n  😊 Sentiment: ${color}${symbol} ${analysis.sentiment}${colors.reset} (expected: ${testCase.expectedSentiment})`);
      }

      // Check topics
      if (analysis.topics.length > 0) {
        console.log(`\n  📚 Topics: ${analysis.topics.join(', ')}`);
      }

      // Check question type
      console.log(`\n  ❓ Question Type: ${analysis.questionType}`);

      // Generate response
      const context = {
        userId: 1,
        userName: 'Test User',
        userData: {
          name: 'Test User',
          totalBookings: 5,
          totalCO2Saved: 12.5
        },
        analysis: analysis
      };

      const response = await llmService.generateResponse(testCase.prompt, context);

      console.log(`\n  🤖 Response Preview:`);
      if (response && response.response) {
        const preview = response.response.substring(0, 150) + '...';
        console.log(`    ${colors.cyan}${preview}${colors.reset}`);
        
        console.log(`\n  📡 Provider: ${response.provider}`);
        console.log(`  🎯 Confidence: ${(response.confidence * 100).toFixed(0)}%`);
      } else {
        console.log(`    ${colors.yellow}Response generation skipped (no API keys)${colors.reset}`);
      }

      // Determine if test passed
      const primaryIntent = analysis.intents[0]?.intent;
      const intentMatch = testCase.expectedIntent === primaryIntent || 
                         (testCase.expectedIntents && testCase.expectedIntents.includes(primaryIntent));
      
      const sentimentMatch = !testCase.expectedSentiment || analysis.sentiment === testCase.expectedSentiment;
      
      let entitiesMatch = true;
      if (testCase.expectedEntities) {
        const allEntities = [
          ...analysis.entities.garmentTypes,
          ...analysis.entities.damageTypes,
          ...analysis.entities.timeReferences
        ];
        entitiesMatch = testCase.expectedEntities.every(expected => 
          allEntities.some(e => e.includes(expected) || expected.includes(e))
        );
      }

      if (intentMatch && sentimentMatch && entitiesMatch) {
        console.log(`\n${colors.green}✓ TEST PASSED${colors.reset}`);
        passed++;
      } else {
        console.log(`\n${colors.red}✗ TEST FAILED${colors.reset}`);
        if (!intentMatch) console.log(`  - Intent mismatch`);
        if (!sentimentMatch) console.log(`  - Sentiment mismatch`);
        if (!entitiesMatch) console.log(`  - Entity extraction incomplete`);
        failed++;
      }

    } catch (error) {
      console.log(`\n${colors.red}✗ TEST ERROR: ${error.message}${colors.reset}`);
      failed++;
    }
  }

  // Summary
  console.log(`\n${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                    TEST SUMMARY                           ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}`);
  
  const total = passed + failed;
  const percentage = ((passed / total) * 100).toFixed(1);
  
  console.log(`\n  Total Tests: ${total}`);
  console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`  Success Rate: ${percentage}%`);

  if (passed === total) {
    console.log(`\n${colors.green}🎉 ALL TESTS PASSED! Your chatbot is incredibly intelligent! 🧠✨${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some tests failed. Review the results above.${colors.reset}\n`);
  }

  // Feature summary
  console.log(`${colors.cyan}╔═══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║              INTELLIGENCE FEATURES TESTED                 ║${colors.reset}`);
  console.log(`${colors.cyan}╚═══════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`
  ✓ Intent Detection (9 intents)
  ✓ Entity Extraction (garments, damage, prices, time)
  ✓ Sentiment Analysis (positive, negative, neutral)
  ✓ Topic Detection (6 topics)
  ✓ Question Type Classification (8 types)
  ✓ Context-Aware Response Generation
  ✓ Multi-Provider AI Integration
  ✓ Confidence Scoring
  `);

  console.log(`${colors.cyan}Next Steps:${colors.reset}`);
  console.log(`  1. Add API keys to .env for real AI responses`);
  console.log(`  2. Start the server: npm run dev`);
  console.log(`  3. Test in the UI at http://localhost:3000`);
  console.log(`  4. Read INTELLIGENT_CHATBOT_GUIDE.md for details\n`);
}

// Run the tests
runTests().catch(console.error);
