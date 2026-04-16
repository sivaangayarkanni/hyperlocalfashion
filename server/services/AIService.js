const { dbRun, dbGet, dbAll } = require('../utils/db');

class AIService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Store AI prediction in database
   */
  async storePrediction(bookingId, imageUrl, damageTypes, severity, garmentType, confidence, recommendations) {
    try {
      const result = await dbRun(
        this.db,
        `INSERT INTO ai_predictions (bookingId, imageUrl, damageTypes, severity, garmentType, confidence, recommendations)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [bookingId, imageUrl, JSON.stringify(damageTypes), severity, garmentType, confidence, JSON.stringify(recommendations)]
      );
      return result.id;
    } catch (error) {
      console.error('Error storing AI prediction:', error);
      throw error;
    }
  }

  /**
   * Get prediction by ID
   */
  async getPrediction(predictionId) {
    try {
      const prediction = await dbGet(
        this.db,
        `SELECT * FROM ai_predictions WHERE id = ?`,
        [predictionId]
      );
      if (prediction) {
        prediction.damageTypes = JSON.parse(prediction.damageTypes);
        prediction.recommendations = JSON.parse(prediction.recommendations);
      }
      return prediction;
    } catch (error) {
      console.error('Error getting prediction:', error);
      throw error;
    }
  }

  /**
   * Get predictions by booking ID
   */
  async getPredictionsByBooking(bookingId) {
    try {
      const predictions = await dbAll(
        this.db,
        `SELECT * FROM ai_predictions WHERE bookingId = ? ORDER BY createdAt DESC`,
        [bookingId]
      );
      return predictions.map(p => ({
        ...p,
        damageTypes: JSON.parse(p.damageTypes),
        recommendations: JSON.parse(p.recommendations)
      }));
    } catch (error) {
      console.error('Error getting predictions by booking:', error);
      throw error;
    }
  }

  /**
   * Calculate confidence-based warning
   */
  isLowConfidence(confidence) {
    return confidence < 0.6;
  }

  /**
   * Generate recommendations based on damage
   */
  generateRecommendations(damageTypes, severity, garmentType) {
    const basePrice = this.getBasePrice(garmentType, damageTypes[0]);
    const estimatedTime = this.getEstimatedTime(severity);
    const specialization = this.getSpecialization(damageTypes[0]);

    return {
      repairType: damageTypes[0],
      estimatedCost: {
        min: Math.round(basePrice * 0.8),
        max: Math.round(basePrice * 1.2)
      },
      estimatedTime,
      tailorSpecialization: specialization
    };
  }

  /**
   * Get base price for damage type and garment
   */
  getBasePrice(garmentType, damageType) {
    const prices = {
      tear: { shirt: 200, pants: 250, dress: 300, jacket: 400 },
      loose_seam: { shirt: 150, pants: 200, dress: 250, jacket: 300 },
      missing_button: { shirt: 100, pants: 100, dress: 150, jacket: 150 },
      fitting_issue: { shirt: 300, pants: 350, dress: 400, jacket: 450 },
      stain: { shirt: 200, pants: 250, dress: 300, jacket: 350 },
      zipper_problem: { shirt: 250, pants: 300, dress: 350, jacket: 400 },
      hole: { shirt: 300, pants: 350, dress: 400, jacket: 500 },
      fraying: { shirt: 150, pants: 200, dress: 250, jacket: 300 },
      discoloration: { shirt: 200, pants: 250, dress: 300, jacket: 350 }
    };

    return prices[damageType]?.[garmentType] || 250;
  }

  /**
   * Get estimated repair time
   */
  getEstimatedTime(severity) {
    const times = {
      minor: '1-2 days',
      moderate: '2-3 days',
      severe: '3-5 days'
    };
    return times[severity] || '2-3 days';
  }

  /**
   * Get tailor specialization recommendation
   */
  getSpecialization(damageType) {
    const specs = {
      tear: 'repairs',
      loose_seam: 'repairs',
      missing_button: 'repairs',
      fitting_issue: 'alterations',
      stain: 'cleaning',
      zipper_problem: 'repairs',
      hole: 'repairs',
      fraying: 'repairs',
      discoloration: 'cleaning'
    };
    return specs[damageType] || 'repairs';
  }

  /**
   * Log prediction for accuracy tracking
   */
  async logPredictionAccuracy(predictionId, actualResult) {
    try {
      // Store accuracy data for future model improvement
      console.log(`Logged prediction ${predictionId} accuracy: ${actualResult}`);
    } catch (error) {
      console.error('Error logging prediction accuracy:', error);
    }
  }
}

module.exports = AIService;
