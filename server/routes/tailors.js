const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../utils/db');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/tailors
// @desc    Get all tailors
// @access  Public
router.get('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    const tailors = await dbAll(db, `
      SELECT t.*, u.name, u.email, u.phone, u.address, u.city, u.state, u.pincode 
      FROM tailors t 
      JOIN users u ON t.userId = u.id 
      WHERE t.isAvailable = 1
    `);
    
    res.json({ success: true, tailors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/tailors/nearby
// @desc    Get nearby tailors
// @access  Public
router.get('/nearby', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { lat, lng } = req.query;
    
    // For now, return all available tailors
    // In production, you'd use geospatial queries
    const tailors = await dbAll(db, `
      SELECT t.*, u.name, u.email, u.phone, u.address, u.city, u.state, u.pincode 
      FROM tailors t 
      JOIN users u ON t.userId = u.id 
      WHERE t.isAvailable = 1
    `);
    
    res.json({ success: true, tailors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/tailors/:id
// @desc    Get tailor by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    const tailor = await dbGet(db, `
      SELECT t.*, u.name, u.email, u.phone, u.address, u.city, u.state, u.pincode 
      FROM tailors t 
      JOIN users u ON t.userId = u.id 
      WHERE t.id = ?
    `, [req.params.id]);
    
    if (!tailor) {
      return res.status(404).json({ message: 'Tailor not found' });
    }
    
    res.json({ success: true, tailor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/tailors/:id
// @desc    Update tailor profile
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { shopName, experience, specializations, workingHours, pricing, isAvailable } = req.body;
    
    await dbRun(db,
      `UPDATE tailors SET shopName = ?, experience = ?, specializations = ?, workingHours = ?, pricing = ?, isAvailable = ?, updatedAt = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [shopName, experience, JSON.stringify(specializations), JSON.stringify(workingHours), JSON.stringify(pricing), isAvailable, req.params.id]
    );
    
    const tailor = await dbGet(db, `
      SELECT t.*, u.name, u.email, u.phone, u.address, u.city, u.state, u.pincode 
      FROM tailors t 
      JOIN users u ON t.userId = u.id 
      WHERE t.id = ?
    `, [req.params.id]);
    
    res.json({ success: true, tailor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
