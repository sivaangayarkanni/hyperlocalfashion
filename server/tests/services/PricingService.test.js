const PricingService = require('../../services/PricingService');

describe('PricingService', () => {
  let pricingService;

  beforeEach(() => {
    pricingService = new PricingService(null);
  });

  describe('calculateGroupDiscount', () => {
    test('should return 0% discount for less than 3 garments', () => {
      expect(pricingService.calculateGroupDiscount(1)).toBe(0);
      expect(pricingService.calculateGroupDiscount(2)).toBe(0);
    });

    test('should return 10% discount for 3-5 garments', () => {
      expect(pricingService.calculateGroupDiscount(3)).toBe(10);
      expect(pricingService.calculateGroupDiscount(4)).toBe(10);
      expect(pricingService.calculateGroupDiscount(5)).toBe(10);
    });

    test('should return 15% discount for 6-10 garments', () => {
      expect(pricingService.calculateGroupDiscount(6)).toBe(15);
      expect(pricingService.calculateGroupDiscount(8)).toBe(15);
      expect(pricingService.calculateGroupDiscount(10)).toBe(15);
    });

    test('should return 20% discount for 11+ garments', () => {
      expect(pricingService.calculateGroupDiscount(11)).toBe(20);
      expect(pricingService.calculateGroupDiscount(15)).toBe(20);
      expect(pricingService.calculateGroupDiscount(20)).toBe(20);
    });
  });

  describe('calculateGroupPrice', () => {
    test('should calculate correct group price with discount', () => {
      const individualPrices = [100, 150, 200]; // Total: 450
      const result = pricingService.calculateGroupPrice(individualPrices, 3, false);
      
      expect(result.subtotal).toBe(450);
      expect(result.discountPercent).toBe(10);
      expect(result.discountAmount).toBe(45);
      expect(result.totalPrice).toBe(405);
    });

    test('should apply corporate discount', () => {
      const individualPrices = [100, 150, 200]; // Total: 450
      const result = pricingService.calculateGroupPrice(individualPrices, 3, true);
      
      expect(result.subtotal).toBe(450);
      expect(result.discountAmount).toBe(67.5); // 10% + 5% = 15% of 450
      expect(result.totalPrice).toBe(383);
    });

    test('should handle larger groups with higher discount', () => {
      const individualPrices = [100, 100, 100, 100, 100, 100]; // Total: 600
      const result = pricingService.calculateGroupPrice(individualPrices, 6, false);
      
      expect(result.discountPercent).toBe(15);
      expect(result.discountAmount).toBe(90);
      expect(result.totalPrice).toBe(510);
    });
  });

  describe('calculateEmergencyPrice', () => {
    test('should double the base price for emergency service', () => {
      expect(pricingService.calculateEmergencyPrice(100)).toBe(200);
      expect(pricingService.calculateEmergencyPrice(250)).toBe(500);
      expect(pricingService.calculateEmergencyPrice(75)).toBe(150);
    });
  });

  describe('validatePrice', () => {
    test('should validate price within 30% bounds', () => {
      const basePrice = 100;
      
      // Valid prices (70-130)
      expect(pricingService.validatePrice(70, basePrice)).toBe(true);
      expect(pricingService.validatePrice(100, basePrice)).toBe(true);
      expect(pricingService.validatePrice(130, basePrice)).toBe(true);
      
      // Invalid prices
      expect(pricingService.validatePrice(69, basePrice)).toBe(false);
      expect(pricingService.validatePrice(131, basePrice)).toBe(false);
    });

    test('should handle edge cases', () => {
      const basePrice = 200;
      
      expect(pricingService.validatePrice(140, basePrice)).toBe(true); // Exactly 70%
      expect(pricingService.validatePrice(260, basePrice)).toBe(true); // Exactly 130%
      expect(pricingService.validatePrice(139.99, basePrice)).toBe(false);
      expect(pricingService.validatePrice(260.01, basePrice)).toBe(false);
    });
  });

  describe('BASE_PRICES', () => {
    test('should have prices for all damage types', () => {
      const damageTypes = ['tear', 'loose_seam', 'missing_button', 'fitting_issue', 
                          'stain', 'zipper_problem', 'hole', 'fraying', 'discoloration'];
      
      damageTypes.forEach(damageType => {
        expect(pricingService.BASE_PRICES).toHaveProperty(damageType);
      });
    });

    test('should have prices for all garment types', () => {
      const garmentTypes = ['shirt', 'pants', 'dress', 'jacket'];
      
      Object.values(pricingService.BASE_PRICES).forEach(priceObj => {
        garmentTypes.forEach(garmentType => {
          expect(priceObj).toHaveProperty(garmentType);
          expect(typeof priceObj[garmentType]).toBe('number');
          expect(priceObj[garmentType]).toBeGreaterThan(0);
        });
      });
    });
  });
});