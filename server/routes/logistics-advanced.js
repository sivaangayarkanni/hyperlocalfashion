const express = require('express');
const router = express.Router();
const LogisticsService = require('../services/LogisticsService');
const { protect } = require('../middleware/auth');

/**
 * POST /api/logistics/schedule-pickup
 * Schedule pickup and assign delivery partner
 */
router.post('/schedule-pickup', protect, async (req, res) => {
  try {
    const { bookingId, pickupDate, timeSlot, address, latitude, longitude, isEmergency } = req.body;

    // Validate input
    if (!bookingId || !pickupDate || !timeSlot || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Missing required fields' }
      });
    }

    const db = req.app.get('db');
    const io = req.app.get('io');
    const logisticsService = new LogisticsService(db);

    // Schedule pickup
    const { shipmentId, trackingNumber } = await logisticsService.schedulePickup(
      bookingId,
      pickupDate,
      timeSlot,
      address,
      latitude,
      longitude
    );

    // Assign delivery partner
    const pickupLocation = { latitude, longitude };
    const assignedPartner = await logisticsService.assignDeliveryPartner(
      shipmentId,
      pickupLocation,
      isEmergency
    );

    if (!assignedPartner) {
      return res.status(503).json({
        success: false,
        error: { code: 'NO_PARTNERS_AVAILABLE', message: 'No delivery partners available' }
      });
    }

    // Notify partner via Socket.io
    io.to(`partner_${assignedPartner.id}`).emit('new_shipment', {
      shipmentId,
      trackingNumber,
      pickupAddress: address,
      timeSlot,
      isEmergency
    });

    res.json({
      success: true,
      data: {
        shipmentId,
        trackingNumber,
        assignedPartner: {
          id: assignedPartner.id,
          name: assignedPartner.name,
          phone: assignedPartner.phone,
          estimatedArrival: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error scheduling pickup:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SCHEDULING_ERROR', message: error.message }
    });
  }
});

/**
 * GET /api/logistics/track/:trackingNumber
 * Get shipment tracking info (public endpoint)
 */
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const db = req.app.get('db');
    const logisticsService = new LogisticsService(db);

    const tracking = await logisticsService.getShipmentTracking(trackingNumber);

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Shipment not found' }
      });
    }

    res.json({
      success: true,
      data: {
        status: tracking.currentStatus,
        currentLocation: {
          latitude: tracking.latitude,
          longitude: tracking.longitude
        },
        estimatedArrival: tracking.estimatedDeliveryTime,
        history: tracking.history.map(h => ({
          status: h.status,
          location: `${h.latitude}, ${h.longitude}`,
          timestamp: h.createdAt,
          notes: h.notes
        }))
      }
    });
  } catch (error) {
    console.error('Error getting tracking:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

/**
 * GET /api/logistics/time-slots/:date
 * Get available time slots for a date
 */
router.get('/time-slots/:date', (req, res) => {
  try {
    const { date } = req.params;
    const logisticsService = new LogisticsService(null);

    const slots = logisticsService.generateTimeSlots(date);

    res.json({
      success: true,
      data: { slots }
    });
  } catch (error) {
    console.error('Error getting time slots:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/logistics/partner/location
 * Update delivery partner location
 */
router.post('/partner/location', protect, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user.id;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'latitude and longitude required' }
      });
    }

    const db = req.app.get('db');
    const io = req.app.get('io');
    const logisticsService = new LogisticsService(db);

    // Get partner ID from user
    const { dbGet } = require('../utils/db');
    const partner = await dbGet(
      db,
      `SELECT id FROM deliveryPartners WHERE userId = ?`,
      [userId]
    );

    if (!partner) {
      return res.status(403).json({
        success: false,
        error: { code: 'NOT_PARTNER', message: 'User is not a delivery partner' }
      });
    }

    // Update location
    await logisticsService.updatePartnerLocation(partner.id, latitude, longitude);

    // Get partner's active shipments and notify users
    const shipments = await logisticsService.getPartnerShipments(partner.id);
    shipments.forEach(shipment => {
      io.to(`user_${shipment.userId}`).emit('partner:location-update', {
        shipmentId: shipment.id,
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      });
    });

    res.json({
      success: true,
      data: { updated: true }
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
});

/**
 * POST /api/logistics/shipment/:shipmentId/status
 * Update shipment status
 */
router.post('/shipment/:shipmentId/status', protect, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { status, location, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_STATUS', message: 'status is required' }
      });
    }

    const db = req.app.get('db');
    const io = req.app.get('io');
    const logisticsService = new LogisticsService(db);

    // Update status
    await logisticsService.updateShipmentStatus(shipmentId, status, location, notes);

    // Get shipment to notify user
    const { dbGet } = require('../utils/db');
    const shipment = await dbGet(
      db,
      `SELECT bookingId FROM shipments WHERE id = ?`,
      [shipmentId]
    );

    const booking = await dbGet(
      db,
      `SELECT userId FROM bookings WHERE id = ?`,
      [shipment.bookingId]
    );

    // Notify user via Socket.io
    io.to(`user_${booking.userId}`).emit('shipment:status-update', {
      shipmentId,
      status,
      location,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: { updated: true }
    });
  } catch (error) {
    console.error('Error updating shipment status:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: error.message }
    });
  }
});

module.exports = router;
