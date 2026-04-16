const express = require('express');
const router = express.Router();
const EscrowService = require('../services/EscrowService');
const { protect } = require('../middleware/auth');

/**
 * POST /api/escrow/create
 * Create escrow payment for booking
 */
router.post('/create', protect, async (req, res) => {
  try {
    const { bookingId, amount, currency } = req.body;

    if (!bookingId || !amount) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'bookingId and amount required' }
      });
    }

    const db = req.app.get('db');
    const escrowService = new EscrowService(db);

    const escrow = await escrowService.createEscrow(bookingId, amount, currency);

    res.json({
      success: true,
      data: escrow
    });
  } catch (error) {
    console.error('Error creating escrow:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/escrow/:escrowId/authorize
 * Authorize payment (hold funds)
 */
router.post('/:escrowId/authorize', protect, async (req, res) => {
  try {
    const { escrowId } = req.params;
    const db = req.app.get('db');
    const escrowService = new EscrowService(db);

    const result = await escrowService.authorizePayment(escrowId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error authorizing payment:', error);
    res.status(500).json({
      success: false,
      error: { code: 'AUTHORIZE_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/escrow/booking/:bookingId/capture
 * Capture payment (release to tailor)
 */
router.post('/booking/:bookingId/capture', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const db = req.app.get('db');
    const escrowService = new EscrowService(db);

    const result = await escrowService.capturePayment(bookingId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error capturing payment:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CAPTURE_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/escrow/booking/:bookingId/refund
 * Refund payment
 */
router.post('/booking/:bookingId/refund', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount } = req.body;
    const db = req.app.get('db');
    const escrowService = new EscrowService(db);

    const result = await escrowService.refundPayment(bookingId, amount);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error refunding payment:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REFUND_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/escrow/booking/:bookingId/freeze
 * Freeze payment during dispute
 */
router.post('/booking/:bookingId/freeze', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const db = req.app.get('db');
    const escrowService = new EscrowService(db);

    const result = await escrowService.freezePayment(bookingId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error freezing payment:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FREEZE_ERROR', message: error.message }
    });
  }
});

/**
 * GET /api/escrow/booking/:bookingId
 * Get escrow payment details
 */
router.get('/booking/:bookingId', protect, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const db = req.app.get('db');
    const escrowService = new EscrowService(db);

    const escrow = await escrowService.getEscrow(bookingId);

    if (!escrow) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Escrow payment not found' }
      });
    }

    res.json({
      success: true,
      data: escrow
    });
  } catch (error) {
    console.error('Error getting escrow:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

module.exports = router;
