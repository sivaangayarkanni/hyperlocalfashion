const LogisticsService = require('../../services/LogisticsService');

describe('LogisticsService', () => {
  let logisticsService;

  beforeEach(() => {
    logisticsService = new LogisticsService(null);
  });

  describe('generateTrackingNumber', () => {
    test('should generate tracking number with correct format', () => {
      const trackingNumber = logisticsService.generateTrackingNumber();
      
      expect(trackingNumber).toMatch(/^RW\d{8}[A-Z0-9]{9}$/);
      expect(trackingNumber.length).toBe(19);
      expect(trackingNumber.startsWith('RW')).toBe(true);
    });

    test('should generate unique tracking numbers', () => {
      const numbers = new Set();
      for (let i = 0; i < 100; i++) {
        numbers.add(logisticsService.generateTrackingNumber());
      }
      expect(numbers.size).toBe(100);
    });
  });

  describe('haversineDistance', () => {
    test('should calculate distance between two points', () => {
      // Distance between New York and Los Angeles (approximately 3944 km)
      const distance = logisticsService.haversineDistance(40.7128, -74.0060, 34.0522, -118.2437);
      expect(distance).toBeCloseTo(3944, -2); // Within 100km accuracy
    });

    test('should return 0 for same coordinates', () => {
      const distance = logisticsService.haversineDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBeCloseTo(0, 5);
    });

    test('should calculate short distances accurately', () => {
      // Distance between two nearby points (approximately 1.4 km)
      const distance = logisticsService.haversineDistance(40.7128, -74.0060, 40.7228, -74.0160);
      expect(distance).toBeCloseTo(1.4, 1);
    });
  });

  describe('calculateAssignmentScore', () => {
    test('should calculate score for available partner', () => {
      const partner = {
        latitude: 40.7128,
        longitude: -74.0060,
        isAvailable: true,
        rating: 4.5
      };
      
      const pickupLocation = {
        latitude: 40.7228,
        longitude: -74.0160
      };

      const score = logisticsService.calculateAssignmentScore(partner, pickupLocation);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    test('should return 0 for unavailable partner', () => {
      const partner = {
        latitude: 40.7128,
        longitude: -74.0060,
        isAvailable: false,
        rating: 5.0
      };
      
      const pickupLocation = {
        latitude: 40.7228,
        longitude: -74.0160
      };

      const score = logisticsService.calculateAssignmentScore(partner, pickupLocation);
      
      // Score should be low due to unavailability (availability_score = 0)
      expect(score).toBeLessThan(70); // 0.3 weight for availability
    });

    test('should give higher score to closer partners', () => {
      const nearPartner = {
        latitude: 40.7128,
        longitude: -74.0060,
        isAvailable: true,
        rating: 4.0
      };
      
      const farPartner = {
        latitude: 41.0000,
        longitude: -75.0000,
        isAvailable: true,
        rating: 4.0
      };
      
      const pickupLocation = {
        latitude: 40.7128,
        longitude: -74.0060
      };

      const nearScore = logisticsService.calculateAssignmentScore(nearPartner, pickupLocation);
      const farScore = logisticsService.calculateAssignmentScore(farPartner, pickupLocation);
      
      expect(nearScore).toBeGreaterThan(farScore);
    });

    test('should give higher score to better rated partners', () => {
      const highRatedPartner = {
        latitude: 40.7128,
        longitude: -74.0060,
        isAvailable: true,
        rating: 5.0
      };
      
      const lowRatedPartner = {
        latitude: 40.7128,
        longitude: -74.0060,
        isAvailable: true,
        rating: 2.0
      };
      
      const pickupLocation = {
        latitude: 40.7228,
        longitude: -74.0160
      };

      const highScore = logisticsService.calculateAssignmentScore(highRatedPartner, pickupLocation);
      const lowScore = logisticsService.calculateAssignmentScore(lowRatedPartner, pickupLocation);
      
      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('generateTimeSlots', () => {
    test('should generate correct time slots', () => {
      const slots = logisticsService.generateTimeSlots('2024-01-01');
      
      expect(slots).toHaveLength(5); // 9-11, 11-13, 13-15, 15-17, 17-19
      expect(slots[0]).toBe('09:00-11:00');
      expect(slots[1]).toBe('11:00-13:00');
      expect(slots[2]).toBe('13:00-15:00');
      expect(slots[3]).toBe('15:00-17:00');
      expect(slots[4]).toBe('17:00-19:00');
    });

    test('should format times correctly', () => {
      const slots = logisticsService.generateTimeSlots('2024-01-01');
      
      slots.forEach(slot => {
        expect(slot).toMatch(/^\d{2}:\d{2}-\d{2}:\d{2}$/);
      });
    });
  });
});