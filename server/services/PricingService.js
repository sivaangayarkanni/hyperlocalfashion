const { dbGet } = require('../utils/db');

class PricingService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Base prices by damage type and garment type
   */
  BASE_PRICES = {
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

  /**
   * Calculate smart price
   */
  async calculateSmartPrice(damageType, garmentType, tailorId, distance, isEmergency = false) {
    try {
      // Get base price
      const basePrice = this.BASE_PRICES[damageType]?.[garmentType] || 250;

      let finalPrice = basePrice;
      const breakdown = {
        base: basePrice,
        premiums: [],
        surcharges: []
      };

      // Express service premium (50%)
      if (isEmergency) {
        const premium = basePrice * 0.5;
        finalPrice += premium;
        breakdown.premiums.push({ type: 'express', amount: premium });
      }

      // Get tailor info
      const tailor = await dbGet(
        this.db,
        `SELECT averageRating FROM tailors WHERE id = ?`,
        [tailorId]
      );

      // High-rated tailor premium (20%)
      if (tailor && tailor.averageRating > 4.5) {
        const premium = basePrice * 0.2;
        finalPrice += premium;
        breakdown.premiums.push({ type: 'top_rated', amount: premium });
      }

      // Distance surcharge (5 per km > 10km)
      if (distance > 10) {
        const surcharge = (distance - 10) * 5;
        finalPrice += surcharge;
        breakdown.surcharges.push({ type: 'distance', amount: surcharge });
      }

      // Validate price is within 30% of base
      const minPrice = basePrice * 0.7;
      const maxPrice = basePrice * 1.3;

      if (finalPrice < minPrice || finalPrice > maxPrice) {
        console.warn(`Price ${finalPrice} outside bounds [${minPrice}, ${maxPrice}]`);
      }

      return {
        suggestedPrice: Math.round(finalPrice),
        breakdown
      };
    } catch (error) {
      console.error('Error calculating smart price:', error);
      throw error;
    }
  }

  /**
   * Calculate group booking discount
   */
  calculateGroupDiscount(garmentCount) {
    if (garmentCount >= 11) return 20;
    if (garmentCount >= 6) return 15;
    if (garmentCount >= 3) return 10;
    return 0;
  }

  /**
   * Calculate group booking total price
   */
  calculateGroupPrice(individualPrices, garmentCount, corporateDiscount = false) {
    const subtotal = individualPrices.reduce((sum, price) => sum + price, 0);
    const discountPercent = this.calculateGroupDiscount(garmentCount);
    let totalDiscount = (subtotal * discountPercent) / 100;

    // Additional corporate discount
    if (corporateDiscount) {
      totalDiscount += (subtotal * 5) / 100;
    }

    const totalPrice = subtotal - totalDiscount;

    return {
      subtotal,
      discountPercent,
      discountAmount: totalDiscount,
      totalPrice: Math.round(totalPrice)
    };
  }

  /**
   * Calculate emergency service premium
   */
  calculateEmergencyPrice(basePrice) {
    // 100% premium for emergency service
    return basePrice * 2;
  }

  /**
   * Validate price is reasonable
   */
  validatePrice(price, basePrice) {
    const minPrice = basePrice * 0.7;
    const maxPrice = basePrice * 1.3;
    return price >= minPrice && price <= maxPrice;
  }
}

module.exports = PricingService;
