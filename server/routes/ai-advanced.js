const express = require('express');
const router = express.Router();
const MultiLLMService = require('../services/MultiLLMService');
const AdvancedAIService = require('../services/AdvancedAIService');
const { protect } = require('../middleware/auth');

/**
 * POST /api/ai/advanced-chat
 * Advanced AI chat with semantic search, predictions, recommendations
 */
router.post('/advanced-chat', protect, async (req, res) => {
  try {
    const { prompt, userId } = req.body;
    const db = req.app.get('db');
    const actualUserId = userId || req.user.id;

    const multiLLMService = new MultiLLMService(db);
    const advancedAIService = new AdvancedAIService(db);

    // Enrich context with advanced features
    const enrichedContext = await advancedAIService.enrichContext(actualUserId, prompt);
    
    // Get semantic search results
    const similarQueries = await advancedAIService.semanticSearch(prompt, actualUserId);
    
    // Get predictions
    const predictions = await advancedAIService.predictUserNeeds(actualUserId);
    
    // Get recommendations
    const recommendations = await advancedAIService.getPersonalizedRecommendations(actualUserId);
    
    // Generate follow-up questions
    const emotion = enrichedContext.emotion;
    const keyPhrases = enrichedContext.keyPhrases;
    
    // Call multi-LLM service
    const aiResponse = await multiLLMService.generateResponse(
      prompt,
      enrichedContext,
      'openai'
    );

    // Extract intent and generate follow-ups
    const analysis = aiResponse.analysis || {};
    const primaryIntent = analysis.intents?.[0]?.intent || 'general';
    const followUpQuestions = advancedAIService.generateFollowUpQuestions(
      primaryIntent,
      enrichedContext
    );

    // Determine innovations used
    const innovations = [];
    if (similarQueries.length > 0) innovations.push('semantic');
    if (predictions) innovations.push('predictive');
    if (recommendations.length > 0) innovations.push('recommendation');
    if (emotion.emotion !== 'neutral') innovations.push('emotion');
    innovations.push('learning');

    // Store interaction for learning
    await advancedAIService.storeInteraction(
      actualUserId,
      prompt,
      aiResponse.response,
      primaryIntent,
      aiResponse.confidence
    );

    res.json({
      success: true,
      response: aiResponse.response,
      provider: aiResponse.provider,
      confidence: aiResponse.confidence,
      intent: primaryIntent,
      emotion: emotion,
      keyPhrases: keyPhrases,
      followUpQuestions: followUpQuestions.slice(0, 2),
      recommendations: recommendations.slice(0, 2),
      predictions: predictions,
      innovations: innovations,
      similarQueries: similarQueries
    });
  } catch (error) {
    console.error('Advanced AI chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/suggestions
 * Get personalized AI suggestions
 */
router.get('/suggestions', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const advancedAIService = new AdvancedAIService(db);

    const suggestions = await advancedAIService.generateSuggestions(req.user.id);

    res.json({
      success: true,
      suggestions: suggestions
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai/feedback
 * Store user feedback for AI learning
 */
router.post('/feedback', protect, async (req, res) => {
  try {
    const { interactionId, feedback, rating } = req.body;
    const db = req.app.get('db');
    const advancedAIService = new AdvancedAIService(db);

    await advancedAIService.learnFromFeedback(interactionId, feedback, rating);

    res.json({
      success: true,
      message: 'Thank you for your feedback! I\'m learning from it.'
    });
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/predictions/:userId
 * Get AI predictions for a user
 */
router.get('/predictions/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = req.app.get('db');
    const advancedAIService = new AdvancedAIService(db);

    const predictions = await advancedAIService.predictUserNeeds(userId);

    res.json({
      success: true,
      predictions: predictions
    });
  } catch (error) {
    console.error('Predictions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai/recommendations/:userId
 * Get personalized recommendations
 */
router.get('/recommendations/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = req.app.get('db');
    const advancedAIService = new AdvancedAIService(db);

    const recommendations = await advancedAIService.getPersonalizedRecommendations(userId);

    res.json({
      success: true,
      recommendations: recommendations
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
