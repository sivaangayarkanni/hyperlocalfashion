import React, { useState, useEffect } from 'react';
import '../styles/DeliveryTracker.css';

const DeliveryTracker = ({ trackingNumber, bookingId, userId }) => {
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (trackingNumber) {
      fetchShipmentData();
      
      // Set up real-time updates
      const socket = window.io && window.io();
      if (socket) {
        socket.emit('join', userId);
        
        socket.on('shipment:status-update', (data) => {
          if (data.shipmentId === shipment?.id) {
            updateShipmentStatus(data);
          }
        });

        socket.on('shipment:location-update', (data) => {
          if (data.shipmentId === shipment?.id) {
            updateShipmentLocation(data);
          }
        });

        return () => {
          socket.disconnect();
        };
      }
    }
  }, [trackingNumber, userId]);

  const fetchShipmentData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/logistics/track/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shipment data');
      }

      const result = await response.json();
      setShipment(result.data);
    } catch (error) {
      console.error('Error fetching shipment:', error);
      setError('Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  const updateShipmentStatus = (data) => {
    setShipment(prev => ({
      ...prev,
      currentStatus: data.status,
      history: [
        {
          status: data.status,
          createdAt: data.timestamp,
          notes: 'Status updated'
        },
        ...(prev.history || [])
      ]
    }));
  };

  const updateShipmentLocation = (data) => {
    setShipment(prev => ({
      ...prev,
      latitude: data.latitude,
      longitude: data.longitude,
      lastLocationUpdate: data.timestamp
    }));
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      scheduled: '📅',
      assigned: '👤',
      picked: '📦',
      'in-transit': '🚚',
      delivered: '✅',
      cancelled: '❌'
    };
    return icons[status] || '❓';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#718096',
      scheduled: '#4299e1',
      assigned: '#805ad5',
      picked: '#ed8936',
      'in-transit': '#38a169',
      delivered: '#38a169',
      cancelled: '#e53e3e'
    };
    return colors[status] || '#718096';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending',
      scheduled: 'Scheduled',
      assigned: 'Partner Assigned',
      picked: 'Picked Up',
      'in-transit': 'In Transit',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return texts[status] || status;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateETA = () => {
    if (!shipment || shipment.currentStatus === 'delivered') return null;
    
    // Simple ETA calculation based on status
    const now = new Date();
    let etaHours = 0;
    
    switch (shipment.currentStatus) {
      case 'pending':
      case 'scheduled':
        etaHours = 24;
        break;
      case 'assigned':
        etaHours = 4;
        break;
      case 'picked':
        etaHours = 2;
        break;
      case 'in-transit':
        etaHours = 1;
        break;
      default:
        return null;
    }
    
    const eta = new Date(now.getTime() + etaHours * 60 * 60 * 1000);
    return eta;
  };

  if (loading) {
    return (
      <div className="delivery-tracker loading">
        <div className="loading-spinner"></div>
        <p>Loading tracking information...</p>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="delivery-tracker error">
        <div className="error-icon">❌</div>
        <p>{error || 'Tracking information not available'}</p>
      </div>
    );
  }

  const eta = calculateETA();

  return (
    <div className="delivery-tracker">
      <div className="tracker-header">
        <h3>Delivery Tracking</h3>
        <div className="tracking-number">
          <span className="label">Tracking #:</span>
          <span className="number">{trackingNumber}</span>
        </div>
      </div>

      <div className="current-status">
        <div className="status-badge" style={{ backgroundColor: getStatusColor(shipment.currentStatus) }}>
          <span className="status-icon">{getStatusIcon(shipment.currentStatus)}</span>
          <span className="status-text">{getStatusText(shipment.currentStatus)}</span>
        </div>
        
        {eta && (
          <div className="eta">
            <span className="eta-label">Estimated Delivery:</span>
            <span className="eta-time">{formatDateTime(eta)}</span>
          </div>
        )}
      </div>

      {shipment.isEmergency && (
        <div className="emergency-banner">
          <span className="emergency-icon">🚨</span>
          <span>Emergency Service - 2 Hour Guarantee</span>
        </div>
      )}

      <div className="tracking-timeline">
        <h4>Tracking History</h4>
        <div className="timeline">
          {shipment.history && shipment.history.length > 0 ? (
            shipment.history.map((event, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-marker" style={{ backgroundColor: getStatusColor(event.status) }}>
                  {getStatusIcon(event.status)}
                </div>
                <div className="timeline-content">
                  <div className="timeline-status">{getStatusText(event.status)}</div>
                  <div className="timeline-time">{formatDateTime(event.createdAt)}</div>
                  {event.notes && <div className="timeline-notes">{event.notes}</div>}
                  {event.location && (
                    <div className="timeline-location">📍 {event.location}</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-history">
              <p>No tracking history available yet</p>
            </div>
          )}
        </div>
      </div>

      {shipment.deliveryPartnerId && (
        <div className="partner-info">
          <h4>Delivery Partner</h4>
          <div className="partner-details">
            <div className="partner-item">
              <span className="label">Partner ID:</span>
              <span className="value">#{shipment.deliveryPartnerId}</span>
            </div>
            {shipment.lastLocationUpdate && (
              <div className="partner-item">
                <span className="label">Last Location Update:</span>
                <span className="value">{formatDateTime(shipment.lastLocationUpdate)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="addresses">
        <div className="address-item">
          <h5>Pickup Address</h5>
          <p>{shipment.pickupAddress}</p>
        </div>
        <div className="address-item">
          <h5>Delivery Address</h5>
          <p>{shipment.deliveryAddress}</p>
        </div>
      </div>

      <div className="tracker-actions">
        <button onClick={fetchShipmentData} className="btn-refresh">
          🔄 Refresh
        </button>
        {shipment.currentStatus !== 'delivered' && shipment.currentStatus !== 'cancelled' && (
          <button className="btn-support">
            💬 Contact Support
          </button>
        )}
      </div>
    </div>
  );
};

export default DeliveryTracker;