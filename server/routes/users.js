const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../utils/db');
const { protect } = require('../middleware/auth');

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const db = req.app.get('db');
    const user = await dbGet(db, 'SELECT id, name, email, phone, role, address, city, state, pincode, avatar, sustainabilityScore FROM users WHERE id = ?', [req.params.id]);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { name, phone, address, city, state, pincode, avatar } = req.body;
    
    await dbRun(db,
      `UPDATE users SET name = ?, phone = ?, address = ?, city = ?, state = ?, pincode = ?, avatar = ?, updatedAt = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, phone, address, city, state, pincode, avatar, req.params.id]
    );
    
    const user = await dbGet(db, 'SELECT id, name, email, phone, role, address, city, state, pincode, avatar, sustainabilityScore FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
