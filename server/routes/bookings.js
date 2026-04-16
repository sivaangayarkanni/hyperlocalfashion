const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../utils/db');
const { protect } = require('../middleware/auth');

// @route   POST /api/bookings
// @desc    Create booking
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { tailorId, serviceType, garmentType, description, images, pickupAddress, deliveryAddress } = req.body;
    
    console.log('Creating booking:', { tailorId, serviceType, garmentType, userId: req.user.id });
    
    const result = await dbRun(db,
      `INSERT INTO bookings (userId, tailorId, serviceType, garmentType, description, images, pickupAddress, deliveryAddress) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, tailorId, serviceType, garmentType, description, JSON.stringify(images || []), pickupAddress, deliveryAddress]
    );
    
    console.log('Booking created with ID:', result.id);
    
    const booking = await dbGet(db, 'SELECT * FROM bookings WHERE id = ?', [result.id]);
    res.status(201).json({ success: true, booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/bookings
// @desc    Get user bookings or tailor's assigned bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    
    // Check if user is a tailor
    const tailor = await dbGet(db, 'SELECT id FROM tailors WHERE userId = ?', [req.user.id]);
    
    let bookings;
    if (tailor) {
      // If tailor, get bookings assigned to them
      bookings = await dbAll(db, `
        SELECT b.*, u.name as userName, u.email as userEmail, u.phone as userPhone, u.address as userAddress
        FROM bookings b
        LEFT JOIN users u ON b.userId = u.id
        WHERE b.tailorId = ? 
        ORDER BY b.createdAt DESC
      `, [tailor.id]);
    } else {
      // If regular user, get their bookings
      bookings = await dbAll(db, `
        SELECT b.*, t.shopName, t.averageRating
        FROM bookings b
        LEFT JOIN tailors t ON b.tailorId = t.id
        WHERE b.userId = ? 
        ORDER BY b.createdAt DESC
      `, [req.user.id]);
    }
    
    // Parse JSON fields
    bookings.forEach(booking => {
      if (booking.images) booking.images = JSON.parse(booking.images);
    });
    
    res.json({ success: true, bookings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const booking = await dbGet(db, `
      SELECT b.*, 
             u.name as userName, u.email as userEmail, u.phone as userPhone, u.address as userAddress,
             t.shopName, t.averageRating, t.completedOrders
      FROM bookings b
      LEFT JOIN users u ON b.userId = u.id
      LEFT JOIN tailors t ON b.tailorId = t.id
      WHERE b.id = ?
    `, [req.params.id]);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    // Parse JSON fields
    if (booking.images) booking.images = JSON.parse(booking.images);
    
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { status, quotePrice, quoteEstimatedTime, quoteNotes } = req.body;
    
    await dbRun(db,
      `UPDATE bookings SET status = ?, quotePrice = ?, quoteEstimatedTime = ?, quoteNotes = ?, quotedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, quotePrice, quoteEstimatedTime, quoteNotes, req.params.id]
    );
    
    const booking = await dbGet(db, 'SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/bookings/:id/quote
// @desc    Send quote for booking
// @access  Private
router.put('/:id/quote', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { price, estimatedTime, notes } = req.body;
    
    await dbRun(db,
      `UPDATE bookings SET status = 'quoted', quotePrice = ?, quoteEstimatedTime = ?, quoteNotes = ?, quotedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [price, estimatedTime, notes, req.params.id]
    );
    
    const booking = await dbGet(db, 'SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { status } = req.body;
    
    await dbRun(db,
      `UPDATE bookings SET status = ?, updatedAt = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [status, req.params.id]
    );
    
    const booking = await dbGet(db, 'SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
