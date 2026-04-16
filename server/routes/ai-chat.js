const express = require('express');
const router = express.Router();
const MultiLLMService = require('../services/MultiLLMService');
const { protect } = require('../middleware/auth');

/**
 * POST /api/ai/chat
 * Multi-provider AI chat endpoint
 */
router.post('/chat', protect, async (req, res) => {
  try {
    const { prompt, context, provider, userId } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PROMPT', message: 'Prompt is required' }
      });
    }

    const db = req.app.get('db');
    const llmService = new MultiLLMService(db);

    // Generate response with automatic fallback
    const response = await llmService.generateResponse(prompt, context, provider);

    // Store conversation
    await llmService.storeConversation(userId || req.user.id, prompt, response, response.provider);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CHAT_ERROR', message: error.message }
    });
  }
});

/**
 * GET /api/ai/chat/history
 * Get conversation history
 */
router.get('/chat/history', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const db = req.app.get('db');
    const llmService = new MultiLLMService(db);

    const history = await llmService.getConversationHistory(req.user.id, parseInt(limit));

    res.json({
      success: true,
      data: { history }
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({
      success: false,
      error: { code: 'HISTORY_ERROR', message: error.message }
    });
  }
});

/**
 * GET /api/ai/providers
 * Get available AI providers
 */
router.get('/providers', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const llmService = new MultiLLMService(db);

    const stats = llmService.getProviderStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PROVIDERS_ERROR', message: error.message }
    });
  }
});

module.exports = router;