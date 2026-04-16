import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ShipmentTracking.css';

const ShipmentTracking = ({ bookingId, shipmentId }) => {
  const [shipment, setShipment] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShipmentData();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchShipmentData, 30000);
    return () => clearInterval(interval);
  }, [bookingId, shipmentId]);

  const fetchShipmentData = async () => {
    try {
      setError(null);
      const endpoint = shipmentId 
        ? `/api/logistics/shipments/${bookingId}`
        : `/api/logistics/shipments/${bookingId}`;
      
      const res = await axios.get(endpoint);
      setShipment(res.data.shipment);

      if (res.data.shipment.id) {
        const historyRes = await axios.get(`/api/logistics/shipments/${res.data.shipment.id}/history`);
        setHistory(historyRes.data.history || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shipment data');
      console.error('Error fetching shipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: '📋',
      scheduled: '📅',
      picked: '📦',
      'in-progress': '🚚',
      delivered: '✅',
      cancelled: '❌'
    };
    return icons[status] || '📍';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#95a5a6',
      scheduled: '#3498db',
      picked: '#f39c12',
      'in-progress': '#9c27b0',
      delivered: '#2ecc71',
      cancelled: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  if (loading) {
    return <div className="shipment-tracking loading">Loading shipment details...</div>;
  }

  if (error) {
    return <div className="shipment-tracking error">{error}</div>;
  }

  if (!shipment) {
    return <div className="shipment-tracking">No shipment found</div>;
  }

  const statusSteps = ['pending', 'scheduled', 'picked', 'in-progress', 'delivered'];
  const currentStatusIndex = statusSteps.indexOf(shipment.currentStatus);

  return (
    <div className="shipment-tracking">
      <div className="tracking-header">
        <h3>📦 Shipment Tracking</h3>
        <div className="tracking-number">
          <span className="label">Tracking #:</span>
          <span className="number">{shipment.trackingNumber}</span>
        </div>
      </div>

      <div className="shipment-info">
        <div className="info-row">
          <span className="label">Current Status:</span>
          <span className="status-badge" style={{ backgroundColor: getStatusColor(shipment.currentStatus) }}>
            {getStatusIcon(shipment.currentStatus)} {shipment.currentStatus.toUpperCase()}
          </span>
        </div>

        {shipment.partnerName && (
          <div className="info-row">
            <span className="label">Delivery Partner:</span>
            <span className="value">{shipment.partnerName}</span>
          </div>
        )}

        {shipment.partnerPhone && (
          <div className="info-row">
            <span className="label">Partner Phone:</span>
            <span className="value">{shipment.partnerPhone}</span>
          </div>
        )}

        {shipment.vehicleType && (
          <div className="info-row">
            <span className="label">Vehicle:</span>
            <span className="value">{shipment.vehicleType} ({shipment.vehicleNumber})</span>
          </div>
        )}
      </div>

      <div className="timeline-section">
        <h4>Delivery Timeline</h4>
        <div className="timeline">
          {statusSteps.map((step, index) => (
            <div key={step} className={`timeline-item ${index <= currentStatusIndex ? 'completed' : ''}`}>
              <div className="timeline-dot" style={{ backgroundColor: index <= currentStatusIndex ? getStatusColor(step) : '#ddd' }}>
                {getStatusIcon(step)}
              </div>
              <div className="timeline-label">{step.charAt(0).toUpperCase() + step.slice(1)}</div>
              {index < statusSteps.length - 1 && (
                <div className="timeline-line" style={{ backgroundColor: index < currentStatusIndex ? getStatusColor(step) : '#ddd' }}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="addresses-section">
        <div className="address-card">
          <h4>📍 Pickup Location</h4>
          <p className="address">{shipment.pickupAddress}</p>
          {shipment.estimatedPickupTime && (
            <p className="time">Est. Pickup: {new Date(shipment.estimatedPickupTime).toLocaleString()}</p>
          )}
          {shipment.pickupCompletedAt && (
            <p className="completed">Picked up: {new Date(shipment.pickupCompletedAt).toLocaleString()}</p>
          )}
        </div>

        <div className="address-card">
          <h4>🏠 Delivery Location</h4>
          <p className="address">{shipment.deliveryAddress}</p>
          {shipment.estimatedDeliveryTime && (
            <p className="time">Est. Delivery: {new Date(shipment.estimatedDeliveryTime).toLocaleString()}</p>
          )}
          {shipment.deliveryCompletedAt && (
            <p className="completed">Delivered: {new Date(shipment.deliveryCompletedAt).toLocaleString()}</p>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="history-section">
          <h4>📋 Tracking History</h4>
          <div className="history-list">
            {history.map((entry, index) => (
              <div key={index} className="history-item">
                <div className="history-time">
                  {new Date(entry.createdAt).toLocaleString()}
                </div>
                <div className="history-status">
                  <span className="status-badge" style={{ backgroundColor: getStatusColor(entry.status) }}>
                    {getStatusIcon(entry.status)} {entry.status.toUpperCase()}
                  </span>
                </div>
                {entry.location && (
                  <div className="history-location">
                    📍 {entry.location}
                  </div>
                )}
                {entry.notes && (
                  <div className="history-notes">
                    {entry.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentTracking;
