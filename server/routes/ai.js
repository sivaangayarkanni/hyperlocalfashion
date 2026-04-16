const express = require('express');
const router = express.Router();
const AIService = require('../services/AIService');
const { protect } = require('../middleware/auth');

/**
 * POST /api/ai/analyze-damage
 * Analyze garment damage from image
 */
router.post('/analyze-damage', protect, async (req, res) => {
  try {
    const { damageTypes, severity, garmentType, confidence, imageUrl, bookingId } = req.body;

    // Validate input
    if (!damageTypes || !Array.isArray(damageTypes) || damageTypes.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_DAMAGE_TYPES', message: 'damageTypes must be a non-empty array' }
      });
    }

    if (!['minor', 'moderate', 'severe'].includes(severity)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SEVERITY', message: 'severity must be minor, moderate, or severe' }
      });
    }

    if (confidence < 0 || confidence > 1) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CONFIDENCE', message: 'confidence must be between 0 and 1' }
      });
    }

    const db = req.app.get('db');
    const aiService = new AIService(db);

    // Generate recommendations
    const recommendations = aiService.generateRecommendations(damageTypes, severity, garmentType);

    // Store prediction
    const predictionId = await aiService.storePrediction(
      bookingId,
      imageUrl,
      damageTypes,
      severity,
      garmentType,
      confidence,
      recommendations
    );

    // Check for low confidence
    const lowConfidenceWarning = aiService.isLowConfidence(confidence);

    res.json({
      success: true,
      data: {
        predictionId,
        damageTypes,
        severity,
        garmentType,
        confidence,
        recommendations,
        lowConfidenceWarning
      }
    });
  } catch (error) {
    console.error('Error analyzing damage:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYSIS_ERROR', message: error.message }
    });
  }
});

/**
 * GET /api/ai/prediction/:predictionId
 * Get AI prediction details
 */
router.get('/prediction/:predictionId', protect, async (req, res) => {
  try {
    const { predictionId } = req.params;
    const db = req.app.get('db');
    const aiService = new AIService(db);

    const prediction = await aiService.getPrediction(predictionId);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Prediction not found' }
      });
    }

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Error getting prediction:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

/**
 * GET /api/ai/booking/:bookingId/predictions
 * Get all predictions for a booking
 */
router.get('/booking/:bookingId/predictions', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const db = req.app.get('db');
    const aiService = new AIService(db);

    const predictions = await aiService.getPredictionsByBooking(bookingId);

    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Error getting predictions:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

module.exports = router;
