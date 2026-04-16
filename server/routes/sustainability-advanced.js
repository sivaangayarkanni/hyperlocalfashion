const express = require('express');
const router = express.Router();
const SustainabilityService = require('../services/SustainabilityService');
const { protect } = require('../middleware/auth');

/**
 * GET /api/sustainability/user/:userId
 * Get user sustainability metrics
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = req.app.get('db');
    const sustainabilityService = new SustainabilityService(db);

    const data = await sustainabilityService.getUserSustainability(userId);

    if (!data) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting user sustainability:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

/**
 * GET /api/sustainability/leaderboard
 * Get sustainability leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const db = req.app.get('db');
    const sustainabilityService = new SustainabilityService(db);

    const leaderboard = await sustainabilityService.getLeaderboard(parseInt(limit));

    res.json({
      success: true,
      data: {
        leaderboard,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/sustainability/stories
 * Create a repair story
 */
router.post('/stories', protect, async (req, res) => {
  try {
    const { bookingId, title, description, beforeImage, afterImage } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!bookingId || !title || !beforeImage || !afterImage) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Missing required fields' }
      });
    }

    if (title.length > 100) {
      return res.status(400).json({
        success: false,
        error: { code: 'TITLE_TOO_LONG', message: 'Title must be 100 characters or less' }
      });
    }

    if (description && description.length > 500) {
      return res.status(400).json({
        success: false,
        error: { code: 'DESCRIPTION_TOO_LONG', message: 'Description must be 500 characters or less' }
      });
    }

    const db = req.app.get('db');
    const sustainabilityService = new SustainabilityService(db);

    const storyId = await sustainabilityService.createStory(
      userId,
      bookingId,
      title,
      description,
      beforeImage,
      afterImage
    );

    res.json({
      success: true,
      data: {
        storyId,
        sustainabilityPoints: 5
      }
    });
  } catch (error) {
    console.error('Error creating story:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: error.message }
    });
  }
});

/**
 * GET /api/sustainability/feed
 * Get community feed
 */
router.get('/feed', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const db = req.app.get('db');
    const sustainabilityService = new SustainabilityService(db);

    const feed = await sustainabilityService.getCommunityFeed(parseInt(page), parseInt(limit));

    res.json({
      success: true,
      data: feed
    });
  } catch (error) {
    console.error('Error getting feed:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/sustainability/stories/:storyId/like
 * Like a story
 */
router.post('/stories/:storyId/like', protect, async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user.id;
    const db = req.app.get('db');
    const sustainabilityService = new SustainabilityService(db);

    const likes = await sustainabilityService.likeStory(storyId, userId);

    res.json({
      success: true,
      data: { likes }
    });
  } catch (error) {
    console.error('Error liking story:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
});

module.exports = router;
