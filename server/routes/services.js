const express = require('express');
const router = express.Router();

// @route   GET /api/services
// @desc    Get all services
// @access  Public
router.get('/', (req, res) => {
  const services = [
    { id: 1, name: 'Repair', description: 'General garment repair' },
    { id: 2, name: 'Alteration', description: 'Fit and size adjustments' },
    { id: 3, name: 'Stitching', description: 'Custom stitching services' },
    { id: 4, name: 'Embroidery', description: 'Embroidery and decoration' },
    { id: 5, name: 'Custom', description: 'Custom tailoring' }
  ];
  
  res.json({ success: true, services });
});

module.exports = router;
