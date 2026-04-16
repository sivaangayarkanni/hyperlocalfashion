import React, { useState, useEffect, useRef } from 'react';
import '../styles/LiveMapTracker.css';

const LiveMapTracker = ({ shipmentId, userId }) => {
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [shipmentData, setShipmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    initializeTracking();
    setupWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [shipmentId, userId]);

  const initializeTracking = async () => {
    try {
      setLoading(true);
      // Fetch initial shipment data
      const response = await fetch(`/api/logistics-advanced/shipment/${shipmentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shipment data');
      }

      const result = await response.json();
      setShipmentData(result.data);
      
      if (result.data.deliveryPartner) {
        setPartnerLocation({
          latitude: result.data.deliveryPartner.latitude,
          longitude: result.data.deliveryPartner.longitude,
          lastUpdate: result.data.deliveryPartner.lastUpdate
        });
      }
    } catch (error) {
      console.error('Error initializing tracking:', error);
      setError('Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    if (window.io) {
      socketRef.current = window.io();
      
      socketRef.current.emit('join', userId);
      
      socketRef.current.on('shipment:location-update', (data) => {
        if (data.shipmentId === shipmentId) {
          setPartnerLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            lastUpdate: data.timestamp
          });
        }
      });

      socketRef.current.on('shipment:status-update', (data) => {
        if (data.shipmentId === shipmentId) {
          setShipmentData(prev => ({
            ...prev,
            status: data.status
          }));
        }
      });
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
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

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const update = new Date(timestamp);
    const diffMinutes = Math.floor((now - update) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return update.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="live-map-tracker loading">
        <div className="loading-spinner"></div>
        <p>Loading live tracking...</p>
      </div>
    );
  }

  if (error || !shipmentData) {
    return (
      <div className="live-map-tracker error">
        <div className="error-icon">🗺️</div>
        <p>{error || 'Tracking data not available'}</p>
      </div>
    );
  }

  const pickupLocation = {
    latitude: shipmentData.pickupLatitude,
    longitude: shipmentData.pickupLongitude
  };

  const deliveryLocation = {
    latitude: shipmentData.deliveryLatitude,
    longitude: shipmentData.deliveryLongitude
  };

  const distanceToDestination = partnerLocation && deliveryLocation
    ? calculateDistance(
        partnerLocation.latitude,
        partnerLocation.longitude,
        deliveryLocation.latitude,
        deliveryLocation.longitude
      )
    : null;

  return (
    <div className="live-map-tracker">
      <div className="tracker-header">
        <h3>Live Tracking</h3>
        <div className="status-indicator">
          <div 
            className="status-dot"
            style={{ backgroundColor: getStatusColor(shipmentData.status) }}
          ></div>
          <span className="status-text">{shipmentData.status}</span>
        </div>
      </div>

      <div className="map-container">
        {/* Simulated map view */}
        <div className="map-view" ref={mapRef}>
          <div className="map-overlay">
            <div className="location-marker pickup">
              <div className="marker-icon">📍</div>
              <div className="marker-label">Pickup</div>
            </div>

            {partnerLocation && (
              <div className="location-marker partner">
                <div className="marker-icon">🚚</div>
                <div className="marker-label">Delivery Partner</div>
              </div>
            )}

            <div className="location-marker delivery">
              <div className="marker-icon">🏠</div>
              <div className="marker-label">Delivery</div>
            </div>

            <div className="route-line"></div>
          </div>
        </div>
      </div>

      <div className="tracking-info">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Partner Status:</span>
            <span className="info-value">
              {partnerLocation ? 'Active' : 'Not tracking'}
            </span>
          </div>

          {partnerLocation && (
            <>
              <div className="info-item">
                <span className="info-label">Last Update:</span>
                <span className="info-value">
                  {formatLastUpdate(partnerLocation.lastUpdate)}
                </span>
              </div>

              {distanceToDestination && (
                <div className="info-item">
                  <span className="info-label">Distance to Destination:</span>
                  <span className="info-value">
                    {distanceToDestination.toFixed(1)} km
                  </span>
                </div>
              )}

              <div className="info-item">
                <span className="info-label">Estimated Arrival:</span>
                <span className="info-value">
                  {distanceToDestination 
                    ? `${Math.ceil(distanceToDestination * 3)} minutes`
                    : 'Calculating...'
                  }
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="location-details">
        <div className="location-item">
          <h4>📍 Pickup Location</h4>
          <p>{shipmentData.pickupAddress}</p>
        </div>

        <div className="location-item">
          <h4>🏠 Delivery Location</h4>
          <p>{shipmentData.deliveryAddress}</p>
        </div>
      </div>

      {partnerLocation && (
        <div className="live-indicator">
          <div className="pulse-dot"></div>
          <span>Live tracking active</span>
        </div>
      )}
    </div>
  );
};

export default LiveMapTracker;