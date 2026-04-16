const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../utils/db');
const { protect } = require('../middleware/auth');

// @route   POST /api/reviews
// @desc    Create review
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { bookingId, tailorId, rating, comment, images } = req.body;
    
    const result = await dbRun(db,
      `INSERT INTO reviews (bookingId, userId, tailorId, rating, comment, images) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [bookingId, req.user.id, tailorId, rating, comment, JSON.stringify(images || [])]
    );
    
    const review = await dbGet(db, 'SELECT * FROM reviews WHERE id = ?', [result.id]);
    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reviews/tailor/:tailorId
// @desc    Get reviews for tailor
// @access  Public
router.get('/tailor/:tailorId', async (req, res) => {
  try {
    const db = req.app.get('db');
    const reviews = await dbAll(db, 'SELECT * FROM reviews WHERE tailorId = ? ORDER BY createdAt DESC', [req.params.tailorId]);
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/reviews/:id
// @desc    Get review by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    const review = await dbGet(db, 'SELECT * FROM reviews WHERE id = ?', [req.params.id]);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    
    res.json({ success: true, review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
