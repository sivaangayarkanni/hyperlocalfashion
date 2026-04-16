#!/usr/bin/env node

/**
 * ReWear Multi-LLM & MCP Setup Verification Script
 * Checks that all components are properly installed and configured
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

console.log('🔍 ReWear Multi-LLM & MCP Setup Verification\n');
console.log('=' .repeat(60));

let allChecksPass = true;

// Check 1: Node.js version
console.log('\n📦 Checking Node.js version...');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
if (majorVersion >= 18) {
  console.log(`✅ Node.js ${nodeVersion} (>= 18 required)`);
} else {
  console.log(`❌ Node.js ${nodeVersion} (>= 18 required)`);
  allChecksPass = false;
}

// Check 2: MCP server files exist
console.log('\n📁 Checking MCP server files...');
const mcpFiles = [
  'server/mcp/ai-assistant-server.js',
  'server/mcp/analytics-server.js',
  'server/mcp/notifications-server.js',
  'server/mcp/package.json'
];

mcpFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - NOT FOUND`);
    allChecksPass = false;
  }
});

// Check 3: MCP dependencies installed
console.log('\n📚 Checking MCP dependencies...');
const mcpNodeModules = 'server/mcp/node_modules';
if (fs.existsSync(mcpNodeModules)) {
  console.log(`✅ MCP dependencies installed`);
  
  // Check for specific packages
  const requiredPackages = [
    '@modelcontextprotocol/sdk',
    'sqlite3'
  ];
  
  requiredPackages.forEach(pkg => {
    const pkgPath = path.join(mcpNodeModules, pkg);
    if (fs.existsSync(pkgPath)) {
      console.log(`   ✅ ${pkg}`);
    } else {
      console.log(`   ❌ ${pkg} - NOT FOUND`);
      allChecksPass = false;
    }
  });
} else {
  console.log(`❌ MCP dependencies not installed`);
  console.log(`   Run: npm run install-mcp`);
  allChecksPass = false;
}

// Check 4: Database and migrations
console.log('\n🗄️  Checking database...');
if (fs.existsSync('rewear.db')) {
  console.log(`✅ Database file exists`);
  
  // Check for ai_conversations table
  const db = new sqlite3.Database('rewear.db');
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='ai_conversations'", (err, row) => {
    if (err) {
      console.log(`❌ Error checking database: ${err.message}`);
      allChecksPass = false;
    } else if (row) {
      console.log(`✅ ai_conversations table exists`);
    } else {
      console.log(`❌ ai_conversations table not found`);
      console.log(`   Run migrations: node -e "const db = require('sqlite3').verbose(); const dbInstance = new db.Database('./rewear.db'); const { runMigrations } = require('./server/utils/migrations'); runMigrations(dbInstance);"`);
      allChecksPass = false;
    }
    db.close();
    
    // Continue with remaining checks
    continueChecks();
  });
} else {
  console.log(`❌ Database file not found`);
  console.log(`   Database will be created on first server start`);
  continueChecks();
}

function continueChecks() {
  // Check 5: Environment variables
  console.log('\n🔑 Checking environment variables...');
  if (fs.existsSync('.env')) {
    console.log(`✅ .env file exists`);
    
    const envContent = fs.readFileSync('.env', 'utf8');
    const aiProviders = [
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'GOOGLE_API_KEY',
      'COHERE_API_KEY'
    ];
    
    let hasAtLeastOne = false;
    aiProviders.forEach(provider => {
      if (envContent.includes(provider)) {
        const match = envContent.match(new RegExp(`${provider}=(.+)`));
        if (match && match[1] && match[1].trim() !== '') {
          console.log(`   ✅ ${provider} configured`);
          hasAtLeastOne = true;
        } else {
          console.log(`   ⚠️  ${provider} present but empty`);
        }
      } else {
        console.log(`   ❌ ${provider} not found in .env`);
      }
    });
    
    if (!hasAtLeastOne) {
      console.log(`\n   ⚠️  No AI provider API keys configured`);
      console.log(`   The system will use mock responses until you add at least one API key`);
      console.log(`   Add your API keys to the .env file`);
    }
  } else {
    console.log(`❌ .env file not found`);
    console.log(`   Copy .env.example to .env and configure your API keys`);
    allChecksPass = false;
  }

  // Check 6: MCP configuration
  console.log('\n⚙️  Checking MCP configuration...');
  const mcpConfigPath = '.kiro/settings/mcp.json';
  if (fs.existsSync(mcpConfigPath)) {
    console.log(`✅ MCP configuration exists`);
    
    try {
      const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
      const servers = ['rewear-ai-assistant', 'rewear-analytics', 'rewear-notifications'];
      
      servers.forEach(server => {
        if (mcpConfig.mcpServers && mcpConfig.mcpServers[server]) {
          const serverConfig = mcpConfig.mcpServers[server];
          const disabled = serverConfig.disabled || false;
          console.log(`   ${disabled ? '⚠️' : '✅'} ${server} ${disabled ? '(disabled)' : '(enabled)'}`);
        } else {
          console.log(`   ❌ ${server} not configured`);
          allChecksPass = false;
        }
      });
    } catch (err) {
      console.log(`❌ Error parsing MCP configuration: ${err.message}`);
      allChecksPass = false;
    }
  } else {
    console.log(`❌ MCP configuration not found`);
    console.log(`   Expected at: ${mcpConfigPath}`);
    allChecksPass = false;
  }

  // Check 7: Frontend integration
  console.log('\n🎨 Checking frontend integration...');
  const chatbotPath = 'client/src/components/AIChatbot.js';
  if (fs.existsSync(chatbotPath)) {
    console.log(`✅ AIChatbot component exists`);
    
    const chatbotContent = fs.readFileSync(chatbotPath, 'utf8');
    if (chatbotContent.includes('/api/ai/chat')) {
      console.log(`   ✅ Multi-LLM API integration present`);
    } else {
      console.log(`   ❌ Multi-LLM API integration not found`);
      allChecksPass = false;
    }
    
    if (chatbotContent.includes('provider') && chatbotContent.includes('confidence')) {
      console.log(`   ✅ Provider and confidence display implemented`);
    } else {
      console.log(`   ⚠️  Provider/confidence display may be missing`);
    }
  } else {
    console.log(`❌ AIChatbot component not found`);
    allChecksPass = false;
  }

  // Check 8: Backend services
  console.log('\n🔧 Checking backend services...');
  const servicesPath = 'server/services/MultiLLMService.js';
  if (fs.existsSync(servicesPath)) {
    console.log(`✅ MultiLLMService exists`);
  } else {
    console.log(`❌ MultiLLMService not found`);
    allChecksPass = false;
  }

  const routePath = 'server/routes/ai-chat.js';
  if (fs.existsSync(routePath)) {
    console.log(`✅ AI chat route exists`);
  } else {
    console.log(`❌ AI chat route not found`);
    allChecksPass = false;
  }

  // Final summary
  console.log('\n' + '='.repeat(60));
  if (allChecksPass) {
    console.log('\n✅ All checks passed! Your setup is ready.');
    console.log('\n📝 Next steps:');
    console.log('   1. Add at least one AI provider API key to .env');
    console.log('   2. Start the server: npm run dev');
    console.log('   3. Test the chatbot in the UI');
    console.log('   4. Check MCP servers in Kiro IDE');
    console.log('\n📚 Documentation:');
    console.log('   - MULTI_LLM_INTEGRATION.md - Comprehensive guide');
    console.log('   - QUICK_REFERENCE_MCP.md - Quick reference');
    console.log('   - ARCHITECTURE_DIAGRAM.md - Architecture overview');
  } else {
    console.log('\n⚠️  Some checks failed. Please review the issues above.');
    console.log('\n📝 Common fixes:');
    console.log('   - Install MCP dependencies: npm run install-mcp');
    console.log('   - Copy .env.example to .env and configure API keys');
    console.log('   - Run database migrations (happens automatically on server start)');
    console.log('   - Ensure Node.js >= 18 is installed');
  }
  console.log('\n' + '='.repeat(60) + '\n');
}
