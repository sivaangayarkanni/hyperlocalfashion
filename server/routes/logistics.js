const express = require('express');
const router = express.Router();
const { dbGet, dbAll, dbRun } = require('../utils/db');
const { protect } = require('../middleware/auth');

// Generate tracking number
function generateTrackingNumber() {
  return 'RW' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// @route   POST /api/logistics/shipments
// @desc    Create shipment for a booking
// @access  Private
router.post('/shipments', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { bookingId, pickupAddress, deliveryAddress, pickupLatitude, pickupLongitude, deliveryLatitude, deliveryLongitude } = req.body;

    if (!bookingId || !pickupAddress || !deliveryAddress) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if shipment already exists
    const existingShipment = await dbGet(db, 'SELECT id FROM shipments WHERE bookingId = ?', [bookingId]);
    if (existingShipment) {
      return res.status(400).json({ message: 'Shipment already exists for this booking' });
    }

    const trackingNumber = generateTrackingNumber();

    const result = await dbRun(db,
      `INSERT INTO shipments (bookingId, pickupAddress, deliveryAddress, pickupLatitude, pickupLongitude, deliveryLatitude, deliveryLongitude, trackingNumber)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookingId, pickupAddress, deliveryAddress, pickupLatitude, pickupLongitude, deliveryLatitude, deliveryLongitude, trackingNumber]
    );

    const shipment = await dbGet(db, 'SELECT * FROM shipments WHERE id = ?', [result.id]);
    res.status(201).json({ success: true, shipment });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/logistics/shipments/:bookingId
// @desc    Get shipment by booking ID
// @access  Private
router.get('/shipments/:bookingId', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const shipment = await dbGet(db, 'SELECT * FROM shipments WHERE bookingId = ?', [req.params.bookingId]);

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    res.json({ success: true, shipment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/logistics/shipments/tracking/:trackingNumber
// @desc    Get shipment by tracking number
// @access  Public
router.get('/shipments/tracking/:trackingNumber', async (req, res) => {
  try {
    const db = req.app.get('db');
    const shipment = await dbGet(db, 'SELECT * FROM shipments WHERE trackingNumber = ?', [req.params.trackingNumber]);

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Get tracking history
    const history = await dbAll(db, 'SELECT * FROM shipmentTracking WHERE shipmentId = ? ORDER BY createdAt DESC', [shipment.id]);

    res.json({ success: true, shipment, history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/logistics/schedule-pickup
// @desc    Schedule pickup for a shipment
// @access  Private
router.post('/schedule-pickup', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { shipmentId, pickupScheduledAt, estimatedPickupTime } = req.body;

    if (!shipmentId || !pickupScheduledAt) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await dbRun(db,
      `UPDATE shipments SET pickupScheduledAt = ?, estimatedPickupTime = ?, pickupStatus = 'scheduled', updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [pickupScheduledAt, estimatedPickupTime, shipmentId]
    );

    // Add tracking history
    await dbRun(db,
      `INSERT INTO shipmentTracking (shipmentId, status, notes) VALUES (?, ?, ?)`,
      ['scheduled', 'Pickup scheduled']
    );

    const shipment = await dbGet(db, 'SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    res.json({ success: true, shipment });
  } catch (error) {
    console.error('Error scheduling pickup:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/logistics/assign-partner
// @desc    Assign delivery partner to shipment
// @access  Private
router.post('/assign-partner', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { shipmentId, deliveryPartnerId } = req.body;

    if (!shipmentId || !deliveryPartnerId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if partner exists and is available
    const partner = await dbGet(db, 'SELECT * FROM deliveryPartners WHERE id = ?', [deliveryPartnerId]);
    if (!partner) {
      return res.status(404).json({ message: 'Delivery partner not found' });
    }

    if (!partner.isAvailable) {
      return res.status(400).json({ message: 'Delivery partner is not available' });
    }

    await dbRun(db,
      `UPDATE shipments SET deliveryPartnerId = ?, currentStatus = 'assigned', updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [deliveryPartnerId, shipmentId]
    );

    // Add tracking history
    await dbRun(db,
      `INSERT INTO shipmentTracking (shipmentId, status, notes) VALUES (?, ?, ?)`,
      [shipmentId, 'assigned', `Assigned to ${partner.name}`]
    );

    const shipment = await dbGet(db, `
      SELECT s.*, dp.name as partnerName, dp.phone as partnerPhone, dp.vehicleType, dp.vehicleNumber
      FROM shipments s
      LEFT JOIN deliveryPartners dp ON s.deliveryPartnerId = dp.id
      WHERE s.id = ?
    `, [shipmentId]);

    res.json({ success: true, shipment });
  } catch (error) {
    console.error('Error assigning partner:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/logistics/shipments/:id/status
// @desc    Update shipment status
// @access  Private
router.put('/shipments/:id/status', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { status, location, latitude, longitude, notes } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['pending', 'scheduled', 'picked', 'in-progress', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    let updateQuery = `UPDATE shipments SET currentStatus = ?, updatedAt = CURRENT_TIMESTAMP`;
    let params = [status, req.params.id];

    if (status === 'picked') {
      updateQuery += `, pickupStatus = 'picked', pickupCompletedAt = CURRENT_TIMESTAMP`;
    } else if (status === 'delivered') {
      updateQuery += `, deliveryStatus = 'delivered', deliveryCompletedAt = CURRENT_TIMESTAMP`;
    }

    updateQuery += ` WHERE id = ?`;

    await dbRun(db, updateQuery, params);

    // Add tracking history
    await dbRun(db,
      `INSERT INTO shipmentTracking (shipmentId, status, location, latitude, longitude, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.id, status, location, latitude, longitude, notes]
    );

    const shipment = await dbGet(db, 'SELECT * FROM shipments WHERE id = ?', [req.params.id]);
    res.json({ success: true, shipment });
  } catch (error) {
    console.error('Error updating shipment status:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/logistics/shipments/:id/history
// @desc    Get shipment tracking history
// @access  Private
router.get('/shipments/:id/history', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const history = await dbAll(db, 'SELECT * FROM shipmentTracking WHERE shipmentId = ? ORDER BY createdAt DESC', [req.params.id]);

    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/logistics/delivery-partners
// @desc    Get all available delivery partners
// @access  Private
router.get('/delivery-partners', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const partners = await dbAll(db, 'SELECT * FROM deliveryPartners WHERE isAvailable = 1 ORDER BY rating DESC');

    res.json({ success: true, partners });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/logistics/delivery-partners
// @desc    Create delivery partner
// @access  Private (Admin only)
router.post('/delivery-partners', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { name, phone, email, vehicleType, vehicleNumber } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    const result = await dbRun(db,
      `INSERT INTO deliveryPartners (name, phone, email, vehicleType, vehicleNumber) VALUES (?, ?, ?, ?, ?)`,
      [name, phone, email, vehicleType, vehicleNumber]
    );

    const partner = await dbGet(db, 'SELECT * FROM deliveryPartners WHERE id = ?', [result.id]);
    res.status(201).json({ success: true, partner });
  } catch (error) {
    console.error('Error creating delivery partner:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/logistics/delivery-partners/:id
// @desc    Update delivery partner
// @access  Private (Admin only)
router.put('/delivery-partners/:id', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { name, phone, email, vehicleType, vehicleNumber, isAvailable, currentLocation, latitude, longitude } = req.body;

    let updateQuery = 'UPDATE deliveryPartners SET updatedAt = CURRENT_TIMESTAMP';
    const params = [];

    if (name) {
      updateQuery += ', name = ?';
      params.push(name);
    }
    if (phone) {
      updateQuery += ', phone = ?';
      params.push(phone);
    }
    if (email) {
      updateQuery += ', email = ?';
      params.push(email);
    }
    if (vehicleType) {
      updateQuery += ', vehicleType = ?';
      params.push(vehicleType);
    }
    if (vehicleNumber) {
      updateQuery += ', vehicleNumber = ?';
      params.push(vehicleNumber);
    }
    if (isAvailable !== undefined) {
      updateQuery += ', isAvailable = ?';
      params.push(isAvailable);
    }
    if (currentLocation) {
      updateQuery += ', currentLocation = ?';
      params.push(currentLocation);
    }
    if (latitude) {
      updateQuery += ', latitude = ?';
      params.push(latitude);
    }
    if (longitude) {
      updateQuery += ', longitude = ?';
      params.push(longitude);
    }

    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);

    await dbRun(db, updateQuery, params);

    const partner = await dbGet(db, 'SELECT * FROM deliveryPartners WHERE id = ?', [req.params.id]);
    res.json({ success: true, partner });
  } catch (error) {
    console.error('Error updating delivery partner:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/logistics/shipments
// @desc    Get all shipments (with filters)
// @access  Private
router.get('/shipments', protect, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { status, deliveryPartnerId } = req.query;

    let query = `
      SELECT s.*, dp.name as partnerName, dp.phone as partnerPhone
      FROM shipments s
      LEFT JOIN deliveryPartners dp ON s.deliveryPartnerId = dp.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND s.currentStatus = ?';
      params.push(status);
    }

    if (deliveryPartnerId) {
      query += ' AND s.deliveryPartnerId = ?';
      params.push(deliveryPartnerId);
    }

    query += ' ORDER BY s.createdAt DESC';

    const shipments = await dbAll(db, query, params);
    res.json({ success: true, shipments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
