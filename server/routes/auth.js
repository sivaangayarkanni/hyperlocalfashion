const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { dbGet, dbRun, dbAll } = require('../utils/db');
const { protect } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// @route   POST /api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, role, address, city, state, pincode, shopName, experience, specializations } = req.body;
    const db = req.app.get('db');
    
    const userExists = await dbGet(db, 'SELECT * FROM users WHERE email = ?', [email]);
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await dbRun(db, 
      `INSERT INTO users (name, email, password, phone, role, address, city, state, pincode) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, phone, role || 'user', address, city, state, pincode]
    );
    
    const userId = result.id;
    
    // If tailor, create tailor profile
    if (role === 'tailor') {
      await dbRun(db,
        `INSERT INTO tailors (userId, shopName, experience, specializations) 
         VALUES (?, ?, ?, ?)`,
        [userId, shopName, experience, JSON.stringify(specializations || ['repair', 'alteration'])]
      );
    }
    
    const token = generateToken(userId);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: userId,
        name,
        email,
        role: role || 'user'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const db = req.app.get('db');
    
    const user = await dbGet(db, 'SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const user = await dbGet(db, 'SELECT id, name, email, phone, role, address, city, state, pincode, avatar, sustainabilityScore FROM users WHERE id = ?', [req.user.id]);
    
    // If tailor, include tailorId so frontend can link to their profile
    if (user && user.role === 'tailor') {
      const tailor = await dbGet(db, 'SELECT id FROM tailors WHERE userId = ?', [user.id]);
      if (tailor) user.tailorId = tailor.id;
    }
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
