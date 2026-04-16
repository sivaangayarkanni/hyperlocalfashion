const { dbRun, dbGet, dbAll } = require('../utils/db');

class FraudDetectionService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Calculate trust score for a user
   */
  async calculateTrustScore(userId) {
    try {
      let score = 50; // Start at 50

      // Get user's booking history
      const bookings = await dbAll(
        this.db,
        `SELECT status, createdAt FROM bookings WHERE userId = ?`,
        [userId]
      );

      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

      // Check for recent cancellations (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recentCancellations = bookings.filter(
        b => b.status === 'cancelled' && b.createdAt > sevenDaysAgo
      ).length;

      // Penalties
      if (recentCancellations >= 3) {
        score -= 15;
      }

      // Rewards
      score += completedBookings * 2;

      // Bounds
      score = Math.max(0, Math.min(100, score));

      // Store trust score
      await this.updateTrustScore(userId, score, completedBookings, cancelledBookings);

      return score;
    } catch (error) {
      console.error('Error calculating trust score:', error);
      throw error;
    }
  }

  /**
   * Update trust score in database
   */
  async updateTrustScore(userId, score, completedBookings, cancelledBookings) {
    try {
      const existing = await dbGet(
        this.db,
        `SELECT id FROM trust_scores WHERE userId = ?`,
        [userId]
      );

      if (existing) {
        await dbRun(
          this.db,
          `UPDATE trust_scores SET score = ?, completedBookings = ?, cancelledBookings = ?, lastCalculated = CURRENT_TIMESTAMP WHERE userId = ?`,
          [score, completedBookings, cancelledBookings, userId]
        );
      } else {
        await dbRun(
          this.db,
          `INSERT INTO trust_scores (userId, score, completedBookings, cancelledBookings) VALUES (?, ?, ?, ?)`,
          [userId, score, completedBookings, cancelledBookings]
        );
      }

      // Also update users table
      await dbRun(
        this.db,
        `UPDATE users SET trustScore = ? WHERE id = ?`,
        [score, userId]
      );
    } catch (error) {
      console.error('Error updating trust score:', error);
      throw error;
    }
  }

  /**
   * Get trust score for user
   */
  async getTrustScore(userId) {
    try {
      const trustScore = await dbGet(
        this.db,
        `SELECT * FROM trust_scores WHERE userId = ?`,
        [userId]
      );

      if (!trustScore) {
        // Calculate if doesn't exist
        const score = await this.calculateTrustScore(userId);
        return { userId, score, status: this.getScoreStatus(score) };
      }

      return {
        ...trustScore,
        status: this.getScoreStatus(trustScore.score)
      };
    } catch (error) {
      console.error('Error getting trust score:', error);
      throw error;
    }
  }

  /**
   * Get trust score status
   */
  getScoreStatus(score) {
    if (score >= 70) return 'good';
    if (score >= 40) return 'warning';
    return 'flagged';
  }

  /**
   * Detect fraudulent review
   */
  async detectFraudulentReview(review, booking, ipAddress) {
    const flags = [];

    // Quick review after completion (< 5 minutes)
    const timeDiff = new Date(review.createdAt) - new Date(booking.completedAt);
    if (timeDiff < 5 * 60 * 1000) {
      flags.push('QUICK_REVIEW');
    }

    // Multiple reviews from same IP
    const recentReviewsFromIP = await dbAll(
      this.db,
      `SELECT id FROM fraud_flags WHERE flagType = 'MULTIPLE_IP_REVIEWS' AND reason LIKE ? AND createdAt > datetime('now', '-24 hours')`,
      [`%${ipAddress}%`]
    );

    if (recentReviewsFromIP.length > 0) {
      flags.push('MULTIPLE_IP_REVIEWS');
    }

    // Extreme rating (1 or 5 stars only)
    if (review.rating === 1 || review.rating === 5) {
      flags.push('EXTREME_RATING');
    }

    return flags;
  }

  /**
   * Flag suspicious activity
   */
  async flagActivity(userId, tailorId, reviewId, flagType, reason) {
    try {
      const result = await dbRun(
        this.db,
        `INSERT INTO fraud_flags (userId, tailorId, reviewId, flagType, reason, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [userId, tailorId, reviewId, flagType, reason]
      );

      // If user has low trust score, flag for review
      const trustScore = await this.getTrustScore(userId);
      if (trustScore.score < 30) {
        await dbRun(
          this.db,
          `UPDATE fraud_flags SET status = 'admin_review' WHERE id = ?`,
          [result.id]
        );
      }

      return result.id;
    } catch (error) {
      console.error('Error flagging activity:', error);
      throw error;
    }
  }

  /**
   * Get flagged activities for admin review
   */
  async getFlaggedActivities(status = 'pending', limit = 50) {
    try {
      const flags = await dbAll(
        this.db,
        `SELECT * FROM fraud_flags WHERE status = ? ORDER BY createdAt DESC LIMIT ?`,
        [status, limit]
      );
      return flags;
    } catch (error) {
      console.error('Error getting flagged activities:', error);
      throw error;
    }
  }

  /**
   * Report abuse
   */
  async reportAbuse(reporterId, reportedUserId, reason, description, evidence = []) {
    try {
      const result = await dbRun(
        this.db,
        `INSERT INTO abuse_reports (reporterId, reportedUserId, reason, description, evidence, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [reporterId, reportedUserId, reason, description, JSON.stringify(evidence)]
      );
      return result.id;
    } catch (error) {
      console.error('Error reporting abuse:', error);
      throw error;
    }
  }

  /**
   * Get abuse reports for admin review
   */
  async getAbuseReports(status = 'pending', limit = 50) {
    try {
      const reports = await dbAll(
        this.db,
        `SELECT * FROM abuse_reports WHERE status = ? ORDER BY createdAt DESC LIMIT ?`,
        [status, limit]
      );
      return reports.map(r => ({
        ...r,
        evidence: JSON.parse(r.evidence || '[]')
      }));
    } catch (error) {
      console.error('Error getting abuse reports:', error);
      throw error;
    }
  }
}

module.exports = FraudDetectionService;
