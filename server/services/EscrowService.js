const { dbRun, dbGet } = require('../utils/db');

class EscrowService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Create escrow payment (hold funds)
   */
  async createEscrow(bookingId, amount, currency = 'INR') {
    try {
      // In production, this would create a Stripe Payment Intent with manual capture
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const result = await dbRun(
        this.db,
        `INSERT INTO escrow_payments (bookingId, stripePaymentIntentId, amount, currency, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [bookingId, paymentIntentId, amount, currency]
      );

      return {
        escrowId: result.id,
        paymentIntentId,
        status: 'pending'
      };
    } catch (error) {
      console.error('Error creating escrow:', error);
      throw error;
    }
  }

  /**
   * Authorize payment (hold funds)
   */
  async authorizePayment(escrowId) {
    try {
      // In production, this would authorize the Stripe Payment Intent
      await dbRun(
        this.db,
        `UPDATE escrow_payments SET status = 'authorized', authorizedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [escrowId]
      );

      // Update booking payment status
      const escrow = await dbGet(
        this.db,
        `SELECT bookingId FROM escrow_payments WHERE id = ?`,
        [escrowId]
      );

      await dbRun(
        this.db,
        `UPDATE bookings SET paymentStatus = 'held' WHERE id = ?`,
        [escrow.bookingId]
      );

      return { status: 'authorized' };
    } catch (error) {
      console.error('Error authorizing payment:', error);
      throw error;
    }
  }

  /**
   * Capture payment (release to tailor)
   */
  async capturePayment(bookingId) {
    try {
      const escrow = await dbGet(
        this.db,
        `SELECT * FROM escrow_payments WHERE bookingId = ?`,
        [bookingId]
      );

      if (!escrow) {
        throw new Error('Escrow payment not found');
      }

      if (escrow.status !== 'authorized') {
        throw new Error('Payment must be authorized before capture');
      }

      // In production, this would capture the Stripe Payment Intent
      await dbRun(
        this.db,
        `UPDATE escrow_payments SET status = 'captured', capturedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [escrow.id]
      );

      // Update booking payment status
      await dbRun(
        this.db,
        `UPDATE bookings SET paymentStatus = 'released', paidAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [bookingId]
      );

      return {
        status: 'captured',
        transferId: `tr_${Date.now()}`,
        releasedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error capturing payment:', error);
      throw error;
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(bookingId, amount = null) {
    try {
      const escrow = await dbGet(
        this.db,
        `SELECT * FROM escrow_payments WHERE bookingId = ?`,
        [bookingId]
      );

      if (!escrow) {
        throw new Error('Escrow payment not found');
      }

      const refundAmount = amount || escrow.amount;

      // In production, this would create a Stripe refund
      await dbRun(
        this.db,
        `UPDATE escrow_payments SET status = 'refunded', refundedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [escrow.id]
      );

      // Update booking payment status
      await dbRun(
        this.db,
        `UPDATE bookings SET paymentStatus = 'refunded' WHERE id = ?`,
        [bookingId]
      );

      return {
        status: 'refunded',
        refundAmount,
        refundId: `re_${Date.now()}`
      };
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  }

  /**
   * Freeze payment (during dispute)
   */
  async freezePayment(bookingId) {
    try {
      await dbRun(
        this.db,
        `UPDATE escrow_payments SET status = 'frozen' WHERE bookingId = ?`,
        [bookingId]
      );

      await dbRun(
        this.db,
        `UPDATE bookings SET paymentStatus = 'frozen' WHERE id = ?`,
        [bookingId]
      );

      return { status: 'frozen' };
    } catch (error) {
      console.error('Error freezing payment:', error);
      throw error;
    }
  }

  /**
   * Get escrow payment details
   */
  async getEscrow(bookingId) {
    try {
      const escrow = await dbGet(
        this.db,
        `SELECT * FROM escrow_payments WHERE bookingId = ?`,
        [bookingId]
      );
      return escrow;
    } catch (error) {
      console.error('Error getting escrow:', error);
      throw error;
    }
  }

  /**
   * Validate payment state transition
   */
  canTransition(currentStatus, newStatus) {
    const validTransitions = {
      pending: ['authorized'],
      authorized: ['captured', 'frozen', 'refunded'],
      frozen: ['captured', 'refunded'],
      captured: [],
      refunded: []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}

module.exports = EscrowService;
