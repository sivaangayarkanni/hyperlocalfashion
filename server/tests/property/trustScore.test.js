const FraudDetectionService = require('../../services/FraudDetectionService');

// Simple property-based testing without external library
const generateRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateTestCase = () => ({
  completedBookings: generateRandomInt(0, 100),
  cancelledBookings: generateRandomInt(0, 20),
  recentCancellations: generateRandomInt(0, 5)
});

describe('Trust Score Properties', () => {
  let fraudService;
  let mockDb;

  beforeEach(() => {
    mockDb = {
      run: jest.fn(),
      get: jest.fn(),
      all: jest.fn()
    };
    fraudService = new FraudDetectionService(mockDb);
  });

  describe('Trust Score Calculation Properties', () => {
    test('trust score should always be between 0 and 100', async () => {
      // Test with 100 random cases
      for (let i = 0; i < 100; i++) {
        const testCase = generateTestCase();
        
        // Mock database responses
        const mockBookings = [
          ...Array(testCase.completedBookings).fill({ status: 'completed', createdAt: '2024-01-01' }),
          ...Array(testCase.cancelledBookings).fill({ status: 'cancelled', createdAt: '2024-01-01' }),
          ...Array(testCase.recentCancellations).fill({ 
            status: 'cancelled', 
            createdAt: new Date().toISOString() 
          })
        ];

        mockDb.all.mockResolvedValue(mockBookings);
        mockDb.get.mockResolvedValue(null); // No existing trust score
        mockDb.run.mockResolvedValue({ id: 1 });

        const score = await fraudService.calculateTrustScore(1);

        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        expect(Number.isInteger(score)).toBe(true);
      }
    });

    test('more completed bookings should increase trust score', async () => {
      const testCases = [
        { completed: 0, cancelled: 0, recent: 0 },
        { completed: 10, cancelled: 0, recent: 0 },
        { completed: 20, cancelled: 0, recent: 0 }
      ];

      const scores = [];

      for (const testCase of testCases) {
        const mockBookings = [
          ...Array(testCase.completed).fill({ status: 'completed', createdAt: '2024-01-01' }),
          ...Array(testCase.cancelled).fill({ status: 'cancelled', createdAt: '2024-01-01' })
        ];

        mockDb.all.mockResolvedValue(mockBookings);
        mockDb.get.mockResolvedValue(null);
        mockDb.run.mockResolvedValue({ id: 1 });

        const score = await fraudService.calculateTrustScore(1);
        scores.push(score);
      }

      // Each subsequent score should be higher (more completed bookings = higher score)
      expect(scores[1]).toBeGreaterThan(scores[0]);
      expect(scores[2]).toBeGreaterThan(scores[1]);
    });

    test('recent cancellations should decrease trust score', async () => {
      const baseCase = {
        completed: 10,
        cancelled: 0,
        recent: 0
      };

      const penaltyCase = {
        completed: 10,
        cancelled: 3,
        recent: 3 // 3 recent cancellations should trigger penalty
      };

      // Test base case
      let mockBookings = Array(baseCase.completed).fill({ 
        status: 'completed', 
        createdAt: '2024-01-01' 
      });

      mockDb.all.mockResolvedValue(mockBookings);
      mockDb.get.mockResolvedValue(null);
      mockDb.run.mockResolvedValue({ id: 1 });

      const baseScore = await fraudService.calculateTrustScore(1);

      // Test penalty case
      mockBookings = [
        ...Array(penaltyCase.completed).fill({ status: 'completed', createdAt: '2024-01-01' }),
        ...Array(penaltyCase.recent).fill({ 
          status: 'cancelled', 
          createdAt: new Date().toISOString() // Recent cancellations
        })
      ];

      mockDb.all.mockResolvedValue(mockBookings);
      const penaltyScore = await fraudService.calculateTrustScore(1);

      expect(penaltyScore).toBeLessThan(baseScore);
      expect(baseScore - penaltyScore).toBeGreaterThanOrEqual(15); // Penalty should be at least 15
    });

    test('trust score should be deterministic for same input', async () => {
      const testCase = {
        completed: 15,
        cancelled: 2,
        recent: 1
      };

      const mockBookings = [
        ...Array(testCase.completed).fill({ status: 'completed', createdAt: '2024-01-01' }),
        ...Array(testCase.cancelled).fill({ status: 'cancelled', createdAt: '2024-01-01' }),
        ...Array(testCase.recent).fill({ 
          status: 'cancelled', 
          createdAt: new Date().toISOString() 
        })
      ];

      mockDb.all.mockResolvedValue(mockBookings);
      mockDb.get.mockResolvedValue(null);
      mockDb.run.mockResolvedValue({ id: 1 });

      // Calculate score multiple times
      const scores = [];
      for (let i = 0; i < 5; i++) {
        const score = await fraudService.calculateTrustScore(1);
        scores.push(score);
      }

      // All scores should be identical
      const firstScore = scores[0];
      scores.forEach(score => {
        expect(score).toBe(firstScore);
      });
    });

    test('trust score status should be consistent with score value', () => {
      const testCases = [
        { score: 80, expectedStatus: 'good' },
        { score: 70, expectedStatus: 'good' },
        { score: 69, expectedStatus: 'warning' },
        { score: 40, expectedStatus: 'warning' },
        { score: 39, expectedStatus: 'flagged' },
        { score: 0, expectedStatus: 'flagged' }
      ];

      testCases.forEach(({ score, expectedStatus }) => {
        const status = fraudService.getScoreStatus(score);
        expect(status).toBe(expectedStatus);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle extreme values gracefully', async () => {
      const extremeCases = [
        { completed: 0, cancelled: 0, recent: 0 }, // No activity
        { completed: 1000, cancelled: 0, recent: 0 }, // Very high activity
        { completed: 0, cancelled: 100, recent: 10 }, // All negative activity
        { completed: 50, cancelled: 50, recent: 5 } // Mixed activity
      ];

      for (const testCase of extremeCases) {
        const mockBookings = [
          ...Array(testCase.completed).fill({ status: 'completed', createdAt: '2024-01-01' }),
          ...Array(testCase.cancelled).fill({ status: 'cancelled', createdAt: '2024-01-01' }),
          ...Array(testCase.recent).fill({ 
            status: 'cancelled', 
            createdAt: new Date().toISOString() 
          })
        ];

        mockDb.all.mockResolvedValue(mockBookings);
        mockDb.get.mockResolvedValue(null);
        mockDb.run.mockResolvedValue({ id: 1 });

        const score = await fraudService.calculateTrustScore(1);

        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        expect(Number.isFinite(score)).toBe(true);
      }
    });
  });
});