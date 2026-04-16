const express = require('express');
const router = express.Router();
const PricingService = require('../services/PricingService');
const { protect } = require('../middleware/auth');

/**
 * POST /api/pricing/calculate
 * Calculate smart price for a booking
 */
router.post('/calculate', protect, async (req, res) => {
  try {
    const { damageType, garmentType, tailorId, distance, isEmergency } = req.body;

    if (!damageType || !garmentType || !tailorId || distance === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Missing required fields' }
      });
    }

    const db = req.app.get('db');
    const pricingService = new PricingService(db);

    const pricing = await pricingService.calculateSmartPrice(
      damageType,
      garmentType,
      tailorId,
      distance,
      isEmergency || false
    );

    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CALCULATION_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/pricing/group-discount
 * Calculate group booking discount
 */
router.post('/group-discount', protect, async (req, res) => {
  try {
    const { individualPrices, garmentCount, corporateDiscount } = req.body;

    if (!individualPrices || !Array.isArray(individualPrices) || !garmentCount) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Invalid input data' }
      });
    }

    if (garmentCount < 3 || garmentCount > 20) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COUNT', message: 'Garment count must be between 3 and 20' }
      });
    }

    const pricingService = new PricingService(null);

    const pricing = pricingService.calculateGroupPrice(
      individualPrices,
      garmentCount,
      corporateDiscount || false
    );

    res.json({
      success: true,
      data: pricing
    });
  } catch (error) {
    console.error('Error calculating group discount:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CALCULATION_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/pricing/emergency
 * Calculate emergency service price
 */
router.post('/emergency', protect, async (req, res) => {
  try {
    const { basePrice } = req.body;

    if (!basePrice || basePrice <= 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PRICE', message: 'Valid base price required' }
      });
    }

    const pricingService = new PricingService(null);
    const emergencyPrice = pricingService.calculateEmergencyPrice(basePrice);

    res.json({
      success: true,
      data: {
        basePrice,
        emergencyPrice,
        premium: emergencyPrice - basePrice,
        premiumPercentage: 100
      }
    });
  } catch (error) {
    console.error('Error calculating emergency price:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CALCULATION_ERROR', message: error.message }
    });
  }
});

module.exports = router;
