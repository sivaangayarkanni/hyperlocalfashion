const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../utils/db');
const { protect } = require('../middleware/auth');
const { calculateSustainabilityScore, checkBadges, getAllBadges, getGarmentTypes, getRepairTypes } = require('../utils/sustainability');

// @route   POST /api/sustainability/calculate
// @desc    Calculate sustainability score for a booking
// @access  Private
router.post('/calculate', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { bookingId, garmentType, serviceType } = req.body;

    if (!bookingId || !garmentType || !serviceType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Calculate score
    const scoreData = calculateSustainabilityScore(garmentType, serviceType);

    // Update booking with sustainability data
    await dbRun(db,
      `UPDATE bookings SET 
        sustainabilityScore = ?, 
        rewardPoints = ?, 
        waterSaved = ?, 
        co2Saved = ?, 
        wasteSaved = ?,
        completedAt = CURRENT_TIMESTAMP,
        updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [scoreData.score, scoreData.rewardPoints, scoreData.impact.waterSaved, scoreData.impact.co2Reduced, scoreData.impact.wasteReduced, bookingId]
    );

    // Get booking to find user
    const booking = await dbGet(db, 'SELECT userId FROM bookings WHERE id = ?', [bookingId]);
    
    let earnedBadges = [];
    if (booking) {
      // Update user sustainability stats
      const user = await dbGet(db, 'SELECT * FROM users WHERE id = ?', [booking.userId]);
      
      if (user) {
        const newTotalRepairs = (user.totalRepairs || 0) + 1;
        const newTotalWaterSaved = (user.totalWaterSaved || 0) + scoreData.impact.waterSaved;
        const newTotalCO2Reduced = (user.totalCO2Reduced || 0) + scoreData.impact.co2Reduced;
        const newTotalWasteReduced = (user.totalWasteReduced || 0) + scoreData.impact.wasteReduced;
        const newTotalPoints = (user.totalPoints || 0) + scoreData.rewardPoints;

        // Check for new badges
        const userStats = {
          totalRepairs: newTotalRepairs,
          totalWaterSaved: newTotalWaterSaved,
          totalCO2Reduced: newTotalCO2Reduced,
          totalWasteReduced: newTotalWasteReduced,
          totalPoints: newTotalPoints
        };

        earnedBadges = checkBadges(userStats);
        const earnedBadgesJson = JSON.stringify(earnedBadges);

        await dbRun(db,
          `UPDATE users SET 
            totalRepairs = ?, 
            totalWaterSaved = ?, 
            totalCO2Reduced = ?, 
            totalWasteReduced = ?, 
            totalPoints = ?,
            earnedBadges = ?,
            sustainabilityScore = ?,
            updatedAt = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [newTotalRepairs, newTotalWaterSaved, newTotalCO2Reduced, newTotalWasteReduced, newTotalPoints, earnedBadgesJson, newTotalPoints, booking.userId]
        );
      }
    }

    res.json({ 
      success: true, 
      scoreData,
      earnedBadges
    });
  } catch (error) {
    console.error('Error calculating sustainability score:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/sustainability/user-stats
// @desc    Get user sustainability statistics
// @access  Private
router.get('/user-stats', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const user = await dbGet(db, 'SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const earnedBadges = user.earnedBadges ? JSON.parse(user.earnedBadges) : [];

    res.json({
      success: true,
      stats: {
        totalRepairs: user.totalRepairs || 0,
        totalWaterSaved: user.totalWaterSaved || 0,
        totalCO2Reduced: user.totalCO2Reduced || 0,
        totalWasteReduced: user.totalWasteReduced || 0,
        totalPoints: user.totalPoints || 0,
        sustainabilityScore: user.sustainabilityScore || 0
      },
      earnedBadges
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/sustainability/badges
// @desc    Get all available badges
// @access  Public
router.get('/badges', async (req, res) => {
  try {
    const allBadges = getAllBadges();
    res.json({ success: true, badges: allBadges });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/sustainability/garment-types
// @desc    Get available garment types
// @access  Public
router.get('/garment-types', async (req, res) => {
  try {
    const { getGarmentTypes } = require('../utils/sustainability');
    const garmentTypes = getGarmentTypes();
    res.json({ success: true, garmentTypes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/sustainability/repair-types
// @desc    Get available repair types
// @access  Public
router.get('/repair-types', async (req, res) => {
  try {
    const { getRepairTypes } = require('../utils/sustainability');
    const repairTypes = getRepairTypes();
    res.json({ success: true, repairTypes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
