const { dbRun, dbGet, dbAll } = require('../utils/db');

class SustainabilityService {
  constructor(db) {
    this.db = db;
  }

  // Impact values in kg CO2 and liters of water
  IMPACT_VALUES = {
    repair: {
      shirt: { co2: 2.5, water: 700 },
      pants: { co2: 3.0, water: 900 },
      dress: { co2: 3.5, water: 1100 },
      jacket: { co2: 4.0, water: 1300 },
      skirt: { co2: 2.8, water: 800 },
      traditional_wear: { co2: 3.5, water: 1000 },
      formal_wear: { co2: 4.0, water: 1200 }
    },
    alteration: {
      shirt: { co2: 1.5, water: 400 },
      pants: { co2: 2.0, water: 500 },
      dress: { co2: 2.5, water: 600 },
      jacket: { co2: 3.0, water: 700 },
      skirt: { co2: 1.8, water: 450 },
      traditional_wear: { co2: 2.0, water: 550 },
      formal_wear: { co2: 2.5, water: 650 }
    }
  };

  /**
   * Calculate impact for a booking
   */
  async calculateImpact(bookingId) {
    try {
      const booking = await dbGet(
        this.db,
        `SELECT serviceType, garmentType FROM bookings WHERE id = ?`,
        [bookingId]
      );

      if (!booking) return null;

      const impact = this.IMPACT_VALUES[booking.serviceType]?.[booking.garmentType] || 
                     { co2: 2.0, water: 500 };

      // Update booking with impact
      await dbRun(
        this.db,
        `UPDATE bookings SET co2Saved = ?, waterSaved = ? WHERE id = ?`,
        [impact.co2, impact.water, bookingId]
      );

      return impact;
    } catch (error) {
      console.error('Error calculating impact:', error);
      throw error;
    }
  }

  /**
   * Update user sustainability metrics
   */
  async updateUserMetrics(userId) {
    try {
      // Get all completed bookings for user
      const bookings = await dbAll(
        this.db,
        `SELECT co2Saved, waterSaved FROM bookings WHERE userId = ? AND status = 'completed'`,
        [userId]
      );

      const totalCO2 = bookings.reduce((sum, b) => sum + (b.co2Saved || 0), 0);
      const totalWater = bookings.reduce((sum, b) => sum + (b.waterSaved || 0), 0);
      const score = totalCO2 + (totalWater / 10);

      // Update user
      await dbRun(
        this.db,
        `UPDATE users SET totalCO2Saved = ?, totalWaterSaved = ? WHERE id = ?`,
        [totalCO2, totalWater, userId]
      );

      // Check for badge eligibility
      await this.awardBadges(userId, score);

      return { totalCO2, totalWater, score };
    } catch (error) {
      console.error('Error updating user metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate sustainability score
   */
  calculateSustainabilityScore(totalCO2, totalWater) {
    return totalCO2 + (totalWater / 10);
  }

  /**
   * Determine badge based on score
   */
  determineBadge(score) {
    if (score >= 1000) return 'gold';
    if (score >= 500) return 'silver';
    if (score >= 100) return 'bronze';
    return null;
  }

  /**
   * Award badges to user
   */
  async awardBadges(userId, score) {
    try {
      const badge = this.determineBadge(score);
      if (!badge) return;

      // Check if badge already awarded
      const existing = await dbGet(
        this.db,
        `SELECT id FROM sustainability_badges WHERE userId = ? AND badgeType = ?`,
        [userId, badge]
      );

      if (!existing) {
        await dbRun(
          this.db,
          `INSERT INTO sustainability_badges (userId, badgeType) VALUES (?, ?)`,
          [userId, badge]
        );
      }
    } catch (error) {
      console.error('Error awarding badges:', error);
      throw error;
    }
  }

  /**
   * Get user sustainability info
   */
  async getUserSustainability(userId) {
    try {
      const user = await dbGet(
        this.db,
        `SELECT totalCO2Saved, totalWaterSaved FROM users WHERE id = ?`,
        [userId]
      );

      if (!user) return null;

      const score = this.calculateSustainabilityScore(user.totalCO2Saved, user.totalWaterSaved);
      const badge = this.determineBadge(score);

      // Get rank
      const allUsers = await dbAll(
        this.db,
        `SELECT id, totalCO2Saved, totalWaterSaved FROM users ORDER BY (totalCO2Saved + totalWaterSaved/10) DESC`,
        []
      );

      const rank = allUsers.findIndex(u => u.id === userId) + 1;

      return {
        totalCO2Saved: user.totalCO2Saved,
        totalWaterSaved: user.totalWaterSaved,
        sustainabilityScore: score,
        badge,
        rank,
        totalUsers: allUsers.length
      };
    } catch (error) {
      console.error('Error getting user sustainability:', error);
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit = 50) {
    try {
      const users = await dbAll(
        this.db,
        `SELECT id, name, avatar, totalCO2Saved, totalWaterSaved
         FROM users
         ORDER BY (totalCO2Saved + totalWaterSaved/10) DESC
         LIMIT ?`,
        [limit]
      );

      return users.map((user, index) => ({
        userId: user.id,
        name: user.name,
        avatar: user.avatar,
        sustainabilityScore: this.calculateSustainabilityScore(user.totalCO2Saved, user.totalWaterSaved),
        badge: this.determineBadge(this.calculateSustainabilityScore(user.totalCO2Saved, user.totalWaterSaved)),
        rank: index + 1
      }));
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  /**
   * Create community story
   */
  async createStory(userId, bookingId, title, description, beforeImage, afterImage) {
    try {
      const result = await dbRun(
        this.db,
        `INSERT INTO community_stories (userId, bookingId, title, description, beforeImage, afterImage)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, bookingId, title, description, beforeImage, afterImage]
      );

      // Award sustainability points
      await dbRun(
        this.db,
        `UPDATE users SET totalPoints = totalPoints + 5 WHERE id = ?`,
        [userId]
      );

      return result.id;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  /**
   * Get community feed
   */
  async getCommunityFeed(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      const stories = await dbAll(
        this.db,
        `SELECT cs.*, u.name, u.avatar, COUNT(sl.id) as likes
         FROM community_stories cs
         JOIN users u ON cs.userId = u.id
         LEFT JOIN story_likes sl ON cs.id = sl.storyId
         GROUP BY cs.id
         ORDER BY cs.featured DESC, cs.createdAt DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      const total = await dbGet(
        this.db,
        `SELECT COUNT(*) as count FROM community_stories`,
        []
      );

      return {
        stories,
        hasMore: offset + limit < total.count,
        total: total.count
      };
    } catch (error) {
      console.error('Error getting community feed:', error);
      throw error;
    }
  }

  /**
   * Like a story
   */
  async likeStory(storyId, userId) {
    try {
      // Check if already liked
      const existing = await dbGet(
        this.db,
        `SELECT id FROM story_likes WHERE storyId = ? AND userId = ?`,
        [storyId, userId]
      );

      if (existing) {
        // Unlike
        await dbRun(
          this.db,
          `DELETE FROM story_likes WHERE storyId = ? AND userId = ?`,
          [storyId, userId]
        );
      } else {
        // Like
        await dbRun(
          this.db,
          `INSERT INTO story_likes (storyId, userId) VALUES (?, ?)`,
          [storyId, userId]
        );
      }

      // Update like count
      const likes = await dbGet(
        this.db,
        `SELECT COUNT(*) as count FROM story_likes WHERE storyId = ?`,
        [storyId]
      );

      await dbRun(
        this.db,
        `UPDATE community_stories SET likes = ? WHERE id = ?`,
        [likes.count, storyId]
      );

      // Feature story if 50+ likes
      if (likes.count >= 50) {
        await dbRun(
          this.db,
          `UPDATE community_stories SET featured = 1 WHERE id = ?`,
          [storyId]
        );
      }

      return likes.count;
    } catch (error) {
      console.error('Error liking story:', error);
      throw error;
    }
  }
}

module.exports = SustainabilityService;
