import React, { useState, useEffect } from 'react';
import '../styles/LogisticsManager.css';

const LogisticsManager = ({ partnerId }) => {
  const [shipments, setShipments] = useState([]);
  const [availability, setAvailability] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShipments();
    getCurrentLocation();
  }, [partnerId]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/logistics-advanced/partner/${partnerId}/shipments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shipments');
      }

      const result = await response.json();
      setShipments(result.data);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      setError('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const updateAvailability = async (isAvailable) => {
    try {
      const response = await fetch('/api/logistics-advanced/partner/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isAvailable })
      });

      if (!response.ok) {
        throw new Error('Failed to update availability');
      }

      setAvailability(isAvailable);
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const updateLocation = async () => {
    if (!currentLocation) return;

    try {
      const response = await fetch('/api/logistics-advanced/partner/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(currentLocation)
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const updateShipmentStatus = async (shipmentId, status, notes = '') => {
    try {
      const response = await fetch(`/api/logistics-advanced/shipment/${shipmentId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status,
          location: currentLocation,
          notes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setShipments(prev => prev.map(shipment =>
        shipment.id === shipmentId
          ? { ...shipment, currentStatus: status }
          : shipment
      ));
    } catch (error) {
      console.error('Error updating shipment status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'assigned': '#805ad5',
      'picked': '#ed8936',
      'in-transit': '#38a169',
      'delivered': '#38a169'
    };
    return colors[status] || '#718096';
  };

  const getNextAction = (status) => {
    const actions = {
      'assigned': 'Mark as Picked Up',
      'picked': 'Mark as In Transit',
      'in-transit': 'Mark as Delivered'
    };
    return actions[status];
  };

  const getNextStatus = (status) => {
    const nextStatus = {
      'assigned': 'picked',
      'picked': 'in-transit',
      'in-transit': 'delivered'
    };
    return nextStatus[status];
  };

  if (loading) {
    return (
      <div className="logistics-manager loading">
        <div className="loading-spinner"></div>
        <p>Loading shipments...</p>
      </div>
    );
  }

  return (
    <div className="logistics-manager">
      <div className="manager-header">
        <h2>Delivery Dashboard</h2>
        <div className="availability-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={availability}
              onChange={(e) => updateAvailability(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-text">
              {availability ? 'Available' : 'Unavailable'}
            </span>
          </label>
        </div>
      </div>

      <div className="location-section">
        <div className="location-info">
          <h3>📍 Current Location</h3>
          {currentLocation ? (
            <p>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </p>
          ) : (
            <p>Location not available</p>
          )}
        </div>
        <button onClick={updateLocation} className="btn-update-location">
          Update Location
        </button>
      </div>

      <div className="shipments-section">
        <h3>Active Shipments ({shipments.length})</h3>
        
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {shipments.length === 0 ? (
          <div className="no-shipments">
            <div className="no-shipments-icon">📦</div>
            <h4>No Active Shipments</h4>
            <p>You'll see new shipments here when they're assigned to you</p>
          </div>
        ) : (
          <div className="shipments-list">
            {shipments.map(shipment => (
              <div key={shipment.id} className="shipment-card">
                <div className="shipment-header">
                  <div className="shipment-id">
                    <span className="id-label">Shipment #</span>
                    <span className="id-value">{shipment.trackingNumber}</span>
                  </div>
                  <div 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(shipment.currentStatus) }}
                  >
                    {shipment.currentStatus}
                  </div>
                </div>

                <div className="shipment-details">
                  <div className="detail-item">
                    <span className="detail-label">📍 Pickup:</span>
                    <span className="detail-value">{shipment.pickupAddress}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">🏠 Delivery:</span>
                    <span className="detail-value">{shipment.deliveryAddress}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">⏰ Scheduled:</span>
                    <span className="detail-value">
                      {new Date(shipment.pickupScheduledAt).toLocaleString()}
                    </span>
                  </div>
                  {shipment.isEmergency && (
                    <div className="emergency-badge">
                      <span className="emergency-icon">🚨</span>
                      <span>Emergency Service</span>
                    </div>
                  )}
                </div>

                {shipment.currentStatus !== 'delivered' && (
                  <div className="shipment-actions">
                    <button
                      onClick={() => updateShipmentStatus(
                        shipment.id,
                        getNextStatus(shipment.currentStatus)
                      )}
                      className="btn-action primary"
                    >
                      {getNextAction(shipment.currentStatus)}
                    </button>
                    <button className="btn-action secondary">
                      📞 Contact Customer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="performance-section">
        <h3>Performance Metrics</h3>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-value">12</div>
            <div className="metric-label">Deliveries Today</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">4.8</div>
            <div className="metric-label">Average Rating</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">95%</div>
            <div className="metric-label">On-Time Rate</div>
          </div>
          <div className="metric-item">
            <div className="metric-value">156</div>
            <div className="metric-label">Total Deliveries</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsManager;