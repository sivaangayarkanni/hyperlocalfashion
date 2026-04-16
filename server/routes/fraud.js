const express = require('express');
const router = express.Router();
const FraudDetectionService = require('../services/FraudDetectionService');
const { protect } = require('../middleware/auth');

/**
 * GET /api/fraud/trust-score/:userId
 * Get trust score for a user
 */
router.get('/trust-score/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = req.app.get('db');
    const fraudService = new FraudDetectionService(db);

    const trustScore = await fraudService.getTrustScore(userId);

    res.json({
      success: true,
      data: trustScore
    });
  } catch (error) {
    console.error('Error getting trust score:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/fraud/calculate-trust/:userId
 * Recalculate trust score for a user
 */
router.post('/calculate-trust/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const db = req.app.get('db');
    const fraudService = new FraudDetectionService(db);

    const score = await fraudService.calculateTrustScore(userId);

    res.json({
      success: true,
      data: { score, status: fraudService.getScoreStatus(score) }
    });
  } catch (error) {
    console.error('Error calculating trust score:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CALCULATION_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/fraud/report-abuse
 * Report abusive behavior
 */
router.post('/report-abuse', protect, async (req, res) => {
  try {
    const { reportedUserId, reason, description, evidence } = req.body;
    const reporterId = req.user.id;

    if (!reportedUserId || !reason || !description) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Missing required fields' }
      });
    }

    const db = req.app.get('db');
    const fraudService = new FraudDetectionService(db);

    const reportId = await fraudService.reportAbuse(
      reporterId,
      reportedUserId,
      reason,
      description,
      evidence || []
    );

    res.json({
      success: true,
      data: { reportId, status: 'submitted' }
    });
  } catch (error) {
    console.error('Error reporting abuse:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REPORT_ERROR', message: error.message }
    });
  }
});

/**
 * GET /api/fraud/flagged-activities
 * Get flagged activities for admin review
 */
router.get('/flagged-activities', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' }
      });
    }

    const { status = 'pending', limit = 50 } = req.query;
    const db = req.app.get('db');
    const fraudService = new FraudDetectionService(db);

    const flags = await fraudService.getFlaggedActivities(status, parseInt(limit));

    res.json({
      success: true,
      data: { flags }
    });
  } catch (error) {
    console.error('Error getting flagged activities:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

/**
 * GET /api/fraud/abuse-reports
 * Get abuse reports for admin review
 */
router.get('/abuse-reports', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' }
      });
    }

    const { status = 'pending', limit = 50 } = req.query;
    const db = req.app.get('db');
    const fraudService = new FraudDetectionService(db);

    const reports = await fraudService.getAbuseReports(status, parseInt(limit));

    res.json({
      success: true,
      data: { reports }
    });
  } catch (error) {
    console.error('Error getting abuse reports:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

module.exports = router;
