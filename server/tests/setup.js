// Test setup file
const path = require('path');

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Global test utilities
global.testUtils = {
  createMockDb: () => {
    const sqlite3 = require('sqlite3').verbose();
    return new sqlite3.Database(':memory:');
  },
  
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    user: { id: 1, role: 'user' },
    app: {
      get: jest.fn().mockReturnValue(global.testUtils.createMockDb())
    },
    ...overrides
  }),
  
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
  }
};

// Setup test database schema
global.setupTestDb = (db) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create test tables
      db.run(`CREATE TABLE IF NOT EXISTS ai_predictions (
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

      db.run(`CREATE TABLE IF NOT EXISTS trust_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        score INTEGER DEFAULT 50,
        completedBookings INTEGER DEFAULT 0,
        cancelledBookings INTEGER DEFAULT 0,
        flaggedActivities INTEGER DEFAULT 0,
        lastCalculated DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        tailorId INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        totalCO2Saved REAL DEFAULT 0,
        totalWaterSaved REAL DEFAULT 0,
        trustScore INTEGER DEFAULT 50
      )`);

      resolve();
    });
  });
};