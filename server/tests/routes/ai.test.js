const request = require('supertest');
const express = require('express');
const aiRoutes = require('../../routes/ai');
const AIService = require('../../services/AIService');

// Mock the AIService
jest.mock('../../services/AIService');

// Mock auth middleware
const mockAuth = (req, res, next) => {
  req.user = { id: 1, role: 'user' };
  next();
};

describe('AI Routes', () => {
  let app;
  let mockDb;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockDb = global.testUtils.createMockDb();
    app.set('db', mockDb);
    
    // Replace protect middleware with mock
    jest.doMock('../../middleware/auth', () => ({
      protect: mockAuth
    }));
    
    app.use('/api/ai', aiRoutes);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/ai/analyze-damage', () => {
    test('should analyze damage successfully', async () => {
      const mockRecommendations = {
        repairType: 'tear',
        estimatedCost: { min: 160, max: 240 },
        estimatedTime: '2-3 days',
        tailorSpecialization: 'repairs'
      };

      AIService.mockImplementation(() => ({
        generateRecommendations: jest.fn().mockReturnValue(mockRecommendations),
        storePrediction: jest.fn().mockResolvedValue(1),
        isLowConfidence: jest.fn().mockReturnValue(false)
      }));

      const requestBody = {
        damageTypes: ['tear'],
        severity: 'moderate',
        garmentType: 'shirt',
        confidence: 0.85,
        imageUrl: 'http://example.com/image.jpg',
        bookingId: 1
      };

      const response = await request(app)
        .post('/api/ai/analyze-damage')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('predictionId', 1);
      expect(response.body.data).toHaveProperty('damageTypes', ['tear']);
      expect(response.body.data).toHaveProperty('severity', 'moderate');
      expect(response.body.data).toHaveProperty('garmentType', 'shirt');
      expect(response.body.data).toHaveProperty('confidence', 0.85);
      expect(response.body.data).toHaveProperty('recommendations', mockRecommendations);
      expect(response.body.data).toHaveProperty('lowConfidenceWarning', false);
    });

    test('should return low confidence warning', async () => {
      AIService.mockImplementation(() => ({
        generateRecommendations: jest.fn().mockReturnValue({}),
        storePrediction: jest.fn().mockResolvedValue(1),
        isLowConfidence: jest.fn().mockReturnValue(true)
      }));

      const requestBody = {
        damageTypes: ['tear'],
        severity: 'moderate',
        garmentType: 'shirt',
        confidence: 0.5,
        imageUrl: 'http://example.com/image.jpg',
        bookingId: 1
      };

      const response = await request(app)
        .post('/api/ai/analyze-damage')
        .send(requestBody)
        .expect(200);

      expect(response.body.data.lowConfidenceWarning).toBe(true);
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-damage')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DAMAGE_TYPES');
    });

    test('should validate damage types array', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-damage')
        .send({
          damageTypes: 'not-an-array',
          severity: 'moderate',
          garmentType: 'shirt',
          confidence: 0.8
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_DAMAGE_TYPES');
    });

    test('should validate severity values', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-damage')
        .send({
          damageTypes: ['tear'],
          severity: 'invalid',
          garmentType: 'shirt',
          confidence: 0.8
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_SEVERITY');
    });

    test('should validate confidence range', async () => {
      const response = await request(app)
        .post('/api/ai/analyze-damage')
        .send({
          damageTypes: ['tear'],
          severity: 'moderate',
          garmentType: 'shirt',
          confidence: 1.5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CONFIDENCE');
    });
  });

  describe('GET /api/ai/prediction/:predictionId', () => {
    test('should get prediction successfully', async () => {
      const mockPrediction = {
        id: 1,
        damageTypes: ['tear'],
        severity: 'moderate',
        garmentType: 'shirt',
        confidence: 0.85
      };

      AIService.mockImplementation(() => ({
        getPrediction: jest.fn().mockResolvedValue(mockPrediction)
      }));

      const response = await request(app)
        .get('/api/ai/prediction/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPrediction);
    });

    test('should return 404 for non-existent prediction', async () => {
      AIService.mockImplementation(() => ({
        getPrediction: jest.fn().mockResolvedValue(null)
      }));

      const response = await request(app)
        .get('/api/ai/prediction/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/ai/booking/:bookingId/predictions', () => {
    test('should get predictions for booking', async () => {
      const mockPredictions = [
        { id: 1, damageTypes: ['tear'], severity: 'moderate' },
        { id: 2, damageTypes: ['stain'], severity: 'minor' }
      ];

      AIService.mockImplementation(() => ({
        getPredictionsByBooking: jest.fn().mockResolvedValue(mockPredictions)
      }));

      const response = await request(app)
        .get('/api/ai/booking/1/predictions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPredictions);
      expect(response.body.data).toHaveLength(2);
    });

    test('should return empty array for booking with no predictions', async () => {
      AIService.mockImplementation(() => ({
        getPredictionsByBooking: jest.fn().mockResolvedValue([])
      }));

      const response = await request(app)
        .get('/api/ai/booking/1/predictions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });
});