const AIService = require('../../services/AIService');
const sqlite3 = require('sqlite3').verbose();

describe('AIService', () => {
  let db;
  let aiService;

  beforeEach(() => {
    db = new sqlite3.Database(':memory:');
    aiService = new AIService(db);
    
    // Create test table
    db.run(`CREATE TABLE ai_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookingId INTEGER,
      imageUrl TEXT NOT NULL,
      damageTypes TEXT NOT NULL,
      severity TEXT NOT NULL,
      garmentType TEXT NOT NULL,
      confidence REAL NOT NULL,
      recommendations TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });

  afterEach(() => {
    db.close();
  });

  describe('generateRecommendations', () => {
    test('should generate recommendations for tear damage', () => {
      const result = aiService.generateRecommendations(['tear'], 'moderate', 'shirt');
      
      expect(result).toHaveProperty('repairType', 'tear');
      expect(result).toHaveProperty('estimatedCost');
      expect(result.estimatedCost).toHaveProperty('min');
      expect(result.estimatedCost).toHaveProperty('max');
      expect(result).toHaveProperty('estimatedTime');
      expect(result).toHaveProperty('tailorSpecialization', 'repairs');
    });

    test('should generate recommendations for fitting issues', () => {
      const result = aiService.generateRecommendations(['fitting_issue'], 'severe', 'pants');
      
      expect(result.tailorSpecialization).toBe('alterations');
      expect(result.estimatedCost.min).toBeGreaterThan(0);
      expect(result.estimatedCost.max).toBeGreaterThan(result.estimatedCost.min);
    });
  });

  describe('getBasePrice', () => {
    test('should return correct base price for shirt tear', () => {
      const price = aiService.getBasePrice('shirt', 'tear');
      expect(price).toBe(200);
    });

    test('should return correct base price for jacket zipper problem', () => {
      const price = aiService.getBasePrice('jacket', 'zipper_problem');
      expect(price).toBe(400);
    });

    test('should return default price for unknown combination', () => {
      const price = aiService.getBasePrice('unknown', 'unknown');
      expect(price).toBe(250);
    });
  });

  describe('getEstimatedTime', () => {
    test('should return correct time for minor severity', () => {
      const time = aiService.getEstimatedTime('minor');
      expect(time).toBe('1-2 days');
    });

    test('should return correct time for severe severity', () => {
      const time = aiService.getEstimatedTime('severe');
      expect(time).toBe('3-5 days');
    });

    test('should return default time for unknown severity', () => {
      const time = aiService.getEstimatedTime('unknown');
      expect(time).toBe('2-3 days');
    });
  });

  describe('isLowConfidence', () => {
    test('should return true for confidence below 0.6', () => {
      expect(aiService.isLowConfidence(0.5)).toBe(true);
      expect(aiService.isLowConfidence(0.59)).toBe(true);
    });

    test('should return false for confidence 0.6 or above', () => {
      expect(aiService.isLowConfidence(0.6)).toBe(false);
      expect(aiService.isLowConfidence(0.8)).toBe(false);
      expect(aiService.isLowConfidence(1.0)).toBe(false);
    });
  });

  describe('getSpecialization', () => {
    test('should return repairs for damage types', () => {
      expect(aiService.getSpecialization('tear')).toBe('repairs');
      expect(aiService.getSpecialization('hole')).toBe('repairs');
      expect(aiService.getSpecialization('loose_seam')).toBe('repairs');
    });

    test('should return alterations for fitting issues', () => {
      expect(aiService.getSpecialization('fitting_issue')).toBe('alterations');
    });

    test('should return cleaning for stains', () => {
      expect(aiService.getSpecialization('stain')).toBe('cleaning');
      expect(aiService.getSpecialization('discoloration')).toBe('cleaning');
    });

    test('should return default for unknown damage type', () => {
      expect(aiService.getSpecialization('unknown')).toBe('repairs');
    });
  });
});