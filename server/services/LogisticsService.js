const { dbRun, dbGet, dbAll } = require('../utils/db');

class LogisticsService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Generate tracking number
   */
  generateTrackingNumber() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 11).toUpperCase();
    return `RW${timestamp}${random}`;
  }

  /**
   * Calculate haversine distance between two coordinates
   */
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate assignment score for a delivery partner
   */
  calculateAssignmentScore(partner, pickupLocation) {
    // Proximity score (0-100)
    const distance = this.haversineDistance(
      partner.latitude,
      partner.longitude,
      pickupLocation.latitude,
      pickupLocation.longitude
    );
    const proximityScore = Math.max(0, 100 - (distance * 10));

    // Availability score (0 or 100)
    const availabilityScore = partner.isAvailable ? 100 : 0;

    // Rating score (0-100)
    const ratingScore = (partner.rating / 5) * 100;

    // Weighted score
    const score = (proximityScore * 0.4) + (availabilityScore * 0.3) + (ratingScore * 0.3);
    return Math.min(100, score);
  }

  /**
   * Assign delivery partner to shipment
   */
  async assignDeliveryPartner(shipmentId, pickupLocation, isEmergency = false) {
    try {
      // Get available partners
      let partners = await dbAll(
        this.db,
        `SELECT * FROM deliveryPartners WHERE isAvailable = 1`,
        []
      );

      if (isEmergency) {
        // For emergency, filter to within 2km and highest rated
        partners = partners.filter(p => {
          const distance = this.haversineDistance(
            p.latitude, p.longitude,
            pickupLocation.latitude, pickupLocation.longitude
          );
          return distance <= 2;
        }).sort((a, b) => b.rating - a.rating);
      } else {
        // Regular assignment - calculate scores
        partners = partners.map(p => ({
          ...p,
          assignmentScore: this.calculateAssignmentScore(p, pickupLocation)
        })).sort((a, b) => b.assignmentScore - a.assignmentScore);
      }

      if (partners.length === 0) {
        return null; // No partners available
      }

      const selectedPartner = partners[0];
      const assignmentScore = selectedPartner.assignmentScore || selectedPartner.rating;

      // Update shipment with assigned partner
      await dbRun(
        this.db,
        `UPDATE shipments SET deliveryPartnerId = ?, assignmentScore = ?, isEmergency = ? WHERE id = ?`,
        [selectedPartner.id, assignmentScore, isEmergency ? 1 : 0, shipmentId]
      );

      return selectedPartner;
    } catch (error) {
      console.error('Error assigning delivery partner:', error);
      throw error;
    }
  }

  /**
   * Schedule pickup
   */
  async schedulePickup(bookingId, pickupDate, timeSlot, address, latitude, longitude) {
    try {
      // Validate date (max 14 days in future)
      const pickupDateTime = new Date(pickupDate);
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 14);

      if (pickupDateTime > maxDate) {
        throw new Error('Pickup date cannot be more than 14 days in the future');
      }

      // Create shipment
      const trackingNumber = this.generateTrackingNumber();
      const result = await dbRun(
        this.db,
        `INSERT INTO shipments (bookingId, pickupAddress, pickupLatitude, pickupLongitude, trackingNumber, currentStatus)
         VALUES (?, ?, ?, ?, ?, 'scheduled')`,
        [bookingId, address, latitude, longitude, trackingNumber]
      );

      // Update booking with pickup info
      await dbRun(
        this.db,
        `UPDATE bookings SET pickupDate = ?, pickupTimeSlot = ?, pickupAddress = ? WHERE id = ?`,
        [pickupDate, timeSlot, address, bookingId]
      );

      return {
        shipmentId: result.id,
        trackingNumber
      };
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      throw error;
    }
  }

  /**
   * Update shipment status
   */
  async updateShipmentStatus(shipmentId, status, location = null, notes = '') {
    try {
      const update = {
        currentStatus: status,
        updatedAt: new Date().toISOString()
      };

      if (location) {
        update.latitude = location.latitude;
        update.longitude = location.longitude;
      }

      // Update shipment
      await dbRun(
        this.db,
        `UPDATE shipments SET currentStatus = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, shipmentId]
      );

      // Add to tracking history
      await dbRun(
        this.db,
        `INSERT INTO shipmentTracking (shipmentId, status, latitude, longitude, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [shipmentId, status, location?.latitude, location?.longitude, notes]
      );

      return true;
    } catch (error) {
      console.error('Error updating shipment status:', error);
      throw error;
    }
  }

  /**
   * Get shipment tracking info
   */
  async getShipmentTracking(trackingNumber) {
    try {
      const shipment = await dbGet(
        this.db,
        `SELECT s.*, b.userId FROM shipments s
         JOIN bookings b ON s.bookingId = b.id
         WHERE s.trackingNumber = ?`,
        [trackingNumber]
      );

      if (!shipment) return null;

      // Get tracking history
      const history = await dbAll(
        this.db,
        `SELECT * FROM shipmentTracking WHERE shipmentId = ? ORDER BY createdAt DESC`,
        [shipment.id]
      );

      return {
        ...shipment,
        history
      };
    } catch (error) {
      console.error('Error getting shipment tracking:', error);
      throw error;
    }
  }

  /**
   * Get delivery partner's assigned shipments
   */
  async getPartnerShipments(partnerId) {
    try {
      const shipments = await dbAll(
        this.db,
        `SELECT s.*, b.userId, b.pickupAddress, b.deliveryAddress
         FROM shipments s
         JOIN bookings b ON s.bookingId = b.id
         WHERE s.deliveryPartnerId = ? AND s.currentStatus != 'delivered'
         ORDER BY s.pickupScheduledAt ASC`,
        [partnerId]
      );

      return shipments;
    } catch (error) {
      console.error('Error getting partner shipments:', error);
      throw error;
    }
  }

  /**
   * Update partner location
   */
  async updatePartnerLocation(partnerId, latitude, longitude) {
    try {
      await dbRun(
        this.db,
        `UPDATE deliveryPartners SET latitude = ?, longitude = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [latitude, longitude, partnerId]
      );
      return true;
    } catch (error) {
      console.error('Error updating partner location:', error);
      throw error;
    }
  }

  /**
   * Generate time slots for a date
   */
  generateTimeSlots(date) {
    const slots = [];
    for (let hour = 9; hour < 19; hour += 2) {
      const start = `${String(hour).padStart(2, '0')}:00`;
      const end = `${String(hour + 2).padStart(2, '0')}:00`;
      slots.push(`${start}-${end}`);
    }
    return slots;
  }
}

module.exports = LogisticsService;
