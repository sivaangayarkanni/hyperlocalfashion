import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import SustainabilityDashboard from '../components/SustainabilityDashboard';
import './Dashboard.css';

const UserDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get('/api/bookings');
      setBookings(res.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA500',
      quoted: '#2196F3',
      accepted: '#4CAF50',
      'in-progress': '#9C27B0',
      completed: '#4CAF50',
      cancelled: '#F44336',
      rejected: '#F44336'
    };
    return colors[status] || '#757575';
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <h1>🧵 ReWear</h1>
        <div className="nav-right">
          <span>Welcome, {user?.name}</span>
          <button onClick={logout} className="btn btn-outline">Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="dashboard-header">
          <h2>My Dashboard</h2>
          <Link to="/booking/new" className="btn btn-primary">
            + New Booking
          </Link>
        </div>

        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📋 My Bookings
          </button>
          <button 
            className={`tab-button ${activeTab === 'sustainability' ? 'active' : ''}`}
            onClick={() => setActiveTab('sustainability')}
          >
            🌱 Sustainability
          </button>
        </div>

        {activeTab === 'bookings' && (
          <>
            <div className="quick-actions">
              <Link to="/tailors/nearby" className="action-card">
                <span className="action-icon">📍</span>
                <div>
                  <h3>Find Tailors</h3>
                  <p>Discover nearby tailors</p>
                </div>
              </Link>
              <div className="action-card">
                <span className="action-icon">🌱</span>
                <div>
                  <h3>Sustainability Score</h3>
                  <p>{user?.sustainabilityScore || 0} points</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading bookings...</div>
            ) : bookings.length === 0 ? (
              <div className="empty-state">
                <p>No bookings yet. Create your first booking!</p>
                <Link to="/booking/new" className="btn btn-primary">
                  Create Booking
                </Link>
              </div>
            ) : (
              <div className="bookings-list">
                {bookings.map((booking) => (
                  <Link 
                    key={booking.id} 
                    to={`/booking/${booking.id}`}
                    className="booking-card"
                  >
                    <div className="booking-header">
                      <h3>{booking.serviceType}</h3>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(booking.status) }}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="booking-description">{booking.description}</p>
                    <div className="booking-footer">
                      <span>Tailor: {booking.shopName || 'N/A'}</span>
                      {booking.quotePrice && (
                        <span className="price">₹{booking.quotePrice}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'sustainability' && (
          <SustainabilityDashboard />
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
