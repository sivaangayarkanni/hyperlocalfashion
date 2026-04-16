const express = require('express');
const router = express.Router();
const SustainabilityService = require('../services/SustainabilityService');
const { protect } = require('../middleware/auth');
const { dbGet, dbAll } = require('../utils/db');

/**
 * GET /api/sustainability-advanced/user/:userId
 * Get user sustainability metrics with real-time data
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = req.app.get('db');
    
    // Get user data
    const user = await dbGet(
      db,
      `SELECT id, name, totalCO2Saved, totalWaterSaved, sustainabilityScore FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    // Calculate real-time metrics from completed bookings
    const bookings = await dbAll(
      db,
      `SELECT co2Saved, waterSaved FROM bookings WHERE userId = ? AND status = 'completed'`,
      [userId]
    );

    const totalCO2Saved = bookings.reduce((sum, b) => sum + (b.co2Saved || 0), 0);
    const totalWaterSaved = bookings.reduce((sum, b) => sum + (b.waterSaved || 0), 0);
    const sustainabilityScore = totalCO2Saved + (totalWaterSaved / 10);

    // Determine badge
    let badge = null;
    if (sustainabilityScore >= 1000) badge = 'gold';
    else if (sustainabilityScore >= 500) badge = 'silver';
    else if (sustainabilityScore >= 100) badge = 'bronze';

    // Get user rank
    const allUsers = await dbAll(
      db,
      `SELECT id, (SELECT SUM(co2Saved) FROM bookings WHERE userId = users.id AND status = 'completed') as totalCO2,
              (SELECT SUM(waterSaved) FROM bookings WHERE userId = users.id AND status = 'completed') as totalWater
       FROM users
       ORDER BY (COALESCE(totalCO2, 0) + COALESCE(totalWater, 0)/10) DESC`,
      []
    );

    const rank = allUsers.findIndex(u => u.id === parseInt(userId)) + 1;

    const data = {
      totalCO2Saved,
      totalWaterSaved,
      sustainabilityScore,
      badge,
      rank,
      totalUsers: allUsers.length,
      bookingCount: bookings.length,
      updatedAt: new Date().toISOString()
    };

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
 * GET /api/sustainability-advanced/leaderboard
 * Get sustainability leaderboard with real-time data
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const db = req.app.get('db');

    // Get all users with their sustainability metrics
    const users = await dbAll(
      db,
      `SELECT u.id, u.name, u.avatar,
              (SELECT SUM(co2Saved) FROM bookings WHERE userId = u.id AND status = 'completed') as totalCO2,
              (SELECT SUM(waterSaved) FROM bookings WHERE userId = u.id AND status = 'completed') as totalWater
       FROM users u
       ORDER BY (COALESCE(totalCO2, 0) + COALESCE(totalWater, 0)/10) DESC
       LIMIT ?`,
      [parseInt(limit)]
    );

    const leaderboard = users.map((user, index) => {
      const totalCO2 = user.totalCO2 || 0;
      const totalWater = user.totalWater || 0;
      const score = totalCO2 + (totalWater / 10);
      
      let badge = null;
      if (score >= 1000) badge = 'gold';
      else if (score >= 500) badge = 'silver';
      else if (score >= 100) badge = 'bronze';

      return {
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        sustainabilityScore: score,
        badge,
        rank: index + 1,
        totalCO2Saved: totalCO2,
        totalWaterSaved: totalWater
      };
    });

    res.json({
      success: true,
      data: leaderboard,
      updatedAt: new Date().toISOString()
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
