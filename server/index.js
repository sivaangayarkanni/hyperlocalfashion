const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { runMigrations } = require('./utils/migrations');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Database connection
const dbPath = path.join(__dirname, '../rewear.db');
const db = new sqlite3.Database(dbPath, async (err) => {
  if (err) {
    console.error('SQLite connection error:', err);
  } else {
    console.log('SQLite connected at', dbPath);
    initializeDatabase();
    // Run migrations after database is initialized
    await runMigrations(db);
  }
});

// Make db accessible to routes
app.set('db', db);

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      address TEXT,
      city TEXT,
      state TEXT,
      pincode TEXT,
      latitude REAL,
      longitude REAL,
      avatar TEXT,
      sustainabilityScore INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tailors table
    db.run(`CREATE TABLE IF NOT EXISTS tailors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE,
      shopName TEXT NOT NULL,
      experience INTEGER NOT NULL,
      specializations TEXT,
      workingHours TEXT,
      pricing TEXT,
      averageRating REAL DEFAULT 0,
      ratingCount INTEGER DEFAULT 0,
      completedOrders INTEGER DEFAULT 0,
      isVerified BOOLEAN DEFAULT 0,
      isAvailable BOOLEAN DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id)
    )`);

    // Bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      tailorId INTEGER NOT NULL,
      serviceType TEXT NOT NULL,
      garmentType TEXT NOT NULL,
      description TEXT NOT NULL,
      images TEXT,
      status TEXT DEFAULT 'pending',
      quotePrice REAL,
      quoteEstimatedTime TEXT,
      quoteNotes TEXT,
      quotedAt DATETIME,
      pickupDate DATETIME,
      pickupTimeSlot TEXT,
      pickupAddress TEXT,
      pickupStatus TEXT DEFAULT 'pending',
      deliveryDate DATETIME,
      deliveryTimeSlot TEXT,
      deliveryAddress TEXT,
      deliveryStatus TEXT DEFAULT 'pending',
      paymentAmount REAL,
      paymentMethod TEXT,
      paymentStatus TEXT DEFAULT 'pending',
      paidAt DATETIME,
      co2Saved REAL,
      waterSaved REAL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(tailorId) REFERENCES tailors(id)
    )`);

    // Reviews table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookingId INTEGER NOT NULL,
      userId INTEGER NOT NULL,
      tailorId INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      images TEXT,
      responseText TEXT,
      respondedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(bookingId) REFERENCES bookings(id),
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(tailorId) REFERENCES tailors(id)
    )`);

    // Delivery Partners table
    db.run(`CREATE TABLE IF NOT EXISTS deliveryPartners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      vehicleType TEXT,
      vehicleNumber TEXT,
      isAvailable BOOLEAN DEFAULT 1,
      currentLocation TEXT,
      latitude REAL,
      longitude REAL,
      totalDeliveries INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Logistics/Shipments table
    db.run(`CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookingId INTEGER NOT NULL UNIQUE,
      pickupStatus TEXT DEFAULT 'pending',
      pickupScheduledAt DATETIME,
      pickupCompletedAt DATETIME,
      pickupAddress TEXT NOT NULL,
      pickupLatitude REAL,
      pickupLongitude REAL,
      deliveryStatus TEXT DEFAULT 'pending',
      deliveryScheduledAt DATETIME,
      deliveryCompletedAt DATETIME,
      deliveryAddress TEXT NOT NULL,
      deliveryLatitude REAL,
      deliveryLongitude REAL,
      deliveryPartnerId INTEGER,
      currentStatus TEXT DEFAULT 'pending',
      estimatedPickupTime DATETIME,
      estimatedDeliveryTime DATETIME,
      trackingNumber TEXT UNIQUE,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(bookingId) REFERENCES bookings(id),
      FOREIGN KEY(deliveryPartnerId) REFERENCES deliveryPartners(id)
    )`);

    // Shipment Tracking History table
    db.run(`CREATE TABLE IF NOT EXISTS shipmentTracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipmentId INTEGER NOT NULL,
      status TEXT NOT NULL,
      location TEXT,
      latitude REAL,
      longitude REAL,
      notes TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(shipmentId) REFERENCES shipments(id)
    )`);

    console.log('Database tables initialized');
  });
}

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // User joins their personal room
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined`);
  });

  // Delivery partner joins their room
  socket.on('partner-join', (partnerId) => {
    socket.join(`partner_${partnerId}`);
    console.log(`Partner ${partnerId} joined`);
  });

  // Real-time location update from partner
  socket.on('location-update', (data) => {
    const { shipmentId, latitude, longitude } = data;
    io.emit('shipment:location-update', {
      shipmentId,
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    });
  });

  // Shipment status update
  socket.on('shipment-status', (data) => {
    const { shipmentId, status, userId } = data;
    io.to(`user_${userId}`).emit('shipment:status-update', {
      shipmentId,
      status,
      timestamp: new Date().toISOString()
    });
  });

  // Typing indicator for chat/messages
  socket.on('typing', (data) => {
    const { userId, isTyping } = data;
    io.emit('user:typing', { userId, isTyping });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/tailors', require('./routes/tailors'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/sustainability', require('./routes/sustainability'));
app.use('/api/logistics', require('./routes/logistics'));

// Advanced feature routes
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai', require('./routes/ai-chat'));
app.use('/api/logistics-advanced', require('./routes/logistics-advanced'));
app.use('/api/sustainability-advanced', require('./routes/sustainability-advanced'));
app.use('/api/fraud', require('./routes/fraud'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/escrow', require('./routes/escrow'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ReWear API is running' });
});

// 404 handler
app.use((req, res) => {
  console.log(`404 - ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Route not found', path: req.path });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
