import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './TailorDashboard.css';

const TailorDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('requests');
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    completed: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteData, setQuoteData] = useState({
    price: '',
    estimatedTime: '',
    notes: ''
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/bookings');
      const bookingsData = res.data.bookings;
      setBookings(bookingsData);

      // Calculate stats
      const pending = bookingsData.filter(b => b.status === 'pending').length;
      const active = bookingsData.filter(b => ['quoted', 'accepted', 'in-progress'].includes(b.status)).length;
      const completed = bookingsData.filter(b => b.status === 'completed').length;
      const totalEarnings = bookingsData
        .filter(b => b.quotePrice && b.status === 'completed')
        .reduce((sum, b) => sum + b.quotePrice, 0);

      setStats({ pending, active, completed, totalEarnings });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuoteModal = (booking) => {
    setSelectedBooking(booking);
    setQuoteData({
      price: booking.quotePrice || '',
      estimatedTime: booking.quoteEstimatedTime || '',
      notes: booking.quoteNotes || ''
    });
    setShowQuoteModal(true);
  };

  const handleSubmitQuote = async () => {
    if (!quoteData.price || !quoteData.estimatedTime) {
      toast.error('Please fill in price and estimated time');
      return;
    }

    try {
      await axios.put(`/api/bookings/${selectedBooking.id}/quote`, quoteData);
      toast.success('Quote sent successfully!');
      setShowQuoteModal(false);
      fetchBookings();
    } catch (error) {
      console.error('Error sending quote:', error);
      toast.error('Failed to send quote');
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, { status: 'accepted' });
      toast.success('Booking accepted!');
      fetchBookings();
    } catch (error) {
      console.error('Error accepting booking:', error);
      toast.error('Failed to accept booking');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, { status: 'rejected' });
      toast.success('Booking rejected');
      fetchBookings();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      toast.error('Failed to reject booking');
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      await axios.put(`/api/bookings/${bookingId}/status`, { status: 'completed' });
      toast.success('Booking marked as completed!');
      fetchBookings();
    } catch (error) {
      console.error('Error completing booking:', error);
      toast.error('Failed to complete booking');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA500',
      quoted: '#2196F3',
      accepted: '#4CAF50',
      'in-progress': '#9C27B0',
      completed: '#4CAF50',
      rejected: '#F44336'
    };
    return colors[status] || '#757575';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Awaiting Quote',
      quoted: 'Quote Sent',
      accepted: 'Accepted',
      'in-progress': 'In Progress',
      completed: 'Completed',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const activeBookings = bookings.filter(b => ['quoted', 'accepted', 'in-progress'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'completed');

  return (
    <div className="tailor-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1>🧵 ReWear Tailor</h1>
          <p className="welcome-text">Welcome, {user?.name}!</p>
        </div>
        <div className="header-right">
          <button onClick={logout} className="btn-logout">Logout</button>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="stats-section">
        <div className="stat-card stat-pending">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending Requests</p>
          </div>
        </div>
        <div className="stat-card stat-active">
          <div className="stat-icon">⚙️</div>
          <div className="stat-content">
            <h3>{stats.active}</h3>
            <p>Active Orders</p>
          </div>
        </div>
        <div className="stat-card stat-completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card stat-earnings">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>₹{stats.totalEarnings}</h3>
            <p>Total Earnings</p>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📥 Requests ({stats.pending})
        </button>
        <button
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          ⚙️ Active ({stats.active})
        </button>
        <button
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          ✅ Completed ({stats.completed})
        </button>
      </div>

      {/* Content */}
      <section className="dashboard-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading bookings...</p>
          </div>
        ) : (
          <>
            {/* Pending Requests Tab */}
            {activeTab === 'requests' && (
              <div className="tab-content">
                {pendingBookings.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No Pending Requests</h3>
                    <p>You're all caught up! New requests will appear here.</p>
                  </div>
                ) : (
                  <div className="bookings-grid">
                    {pendingBookings.map(booking => (
                      <div key={booking.id} className="booking-card">
                        <div className="card-header">
                          <h3>{booking.serviceType}</h3>
                          <span className="status-badge" style={{ backgroundColor: getStatusColor(booking.status) }}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>

                        <div className="card-body">
                          <div className="info-row">
                            <span className="label">Garment:</span>
                            <span className="value">{booking.garmentType}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Description:</span>
                            <span className="value">{booking.description}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Customer:</span>
                            <span className="value">{booking.userName || 'N/A'}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Phone:</span>
                            <span className="value">{booking.userPhone || 'N/A'}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Pickup Address:</span>
                            <span className="value">{booking.pickupAddress}</span>
                          </div>
                        </div>

                        <div className="card-actions">
                          <button
                            onClick={() => handleOpenQuoteModal(booking)}
                            className="btn btn-primary btn-sm"
                          >
                            Send Quote
                          </button>
                          <button
                            onClick={() => handleRejectBooking(booking.id)}
                            className="btn btn-secondary btn-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Active Orders Tab */}
            {activeTab === 'active' && (
              <div className="tab-content">
                {activeBookings.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No Active Orders</h3>
                    <p>Your active orders will appear here.</p>
                  </div>
                ) : (
                  <div className="bookings-grid">
                    {activeBookings.map(booking => (
                      <div key={booking.id} className="booking-card active">
                        <div className="card-header">
                          <h3>{booking.serviceType}</h3>
                          <span className="status-badge" style={{ backgroundColor: getStatusColor(booking.status) }}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>

                        <div className="card-body">
                          <div className="info-row">
                            <span className="label">Garment:</span>
                            <span className="value">{booking.garmentType}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Customer:</span>
                            <span className="value">{booking.userName || 'N/A'}</span>
                          </div>
                          {booking.quotePrice && (
                            <>
                              <div className="info-row highlight">
                                <span className="label">Quote Price:</span>
                                <span className="value price">₹{booking.quotePrice}</span>
                              </div>
                              <div className="info-row highlight">
                                <span className="label">Est. Time:</span>
                                <span className="value">{booking.quoteEstimatedTime}</span>
                              </div>
                            </>
                          )}
                          {booking.quoteNotes && (
                            <div className="info-row">
                              <span className="label">Notes:</span>
                              <span className="value">{booking.quoteNotes}</span>
                            </div>
                          )}
                        </div>

                        <div className="card-actions">
                          {booking.status === 'quoted' && (
                            <>
                              <button
                                onClick={() => handleAcceptBooking(booking.id)}
                                className="btn btn-success btn-sm"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleOpenQuoteModal(booking)}
                                className="btn btn-secondary btn-sm"
                              >
                                Edit Quote
                              </button>
                            </>
                          )}
                          {booking.status === 'accepted' && (
                            <button
                              onClick={() => handleCompleteBooking(booking.id)}
                              className="btn btn-success btn-sm"
                            >
                              Mark Complete
                            </button>
                          )}
                          {booking.status === 'in-progress' && (
                            <button
                              onClick={() => handleCompleteBooking(booking.id)}
                              className="btn btn-success btn-sm"
                            >
                              Mark Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Completed Orders Tab */}
            {activeTab === 'completed' && (
              <div className="tab-content">
                {completedBookings.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No Completed Orders</h3>
                    <p>Your completed orders will appear here.</p>
                  </div>
                ) : (
                  <div className="bookings-grid">
                    {completedBookings.map(booking => (
                      <div key={booking.id} className="booking-card completed">
                        <div className="card-header">
                          <h3>{booking.serviceType}</h3>
                          <span className="status-badge" style={{ backgroundColor: getStatusColor(booking.status) }}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </div>

                        <div className="card-body">
                          <div className="info-row">
                            <span className="label">Garment:</span>
                            <span className="value">{booking.garmentType}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Customer:</span>
                            <span className="value">{booking.userName || 'N/A'}</span>
                          </div>
                          <div className="info-row highlight">
                            <span className="label">Earned:</span>
                            <span className="value price">₹{booking.quotePrice}</span>
                          </div>
                          <div className="info-row">
                            <span className="label">Completed:</span>
                            <span className="value">{new Date(booking.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="card-actions">
                          <Link to={`/booking/${booking.id}`} className="btn btn-secondary btn-sm">
                            View Details
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* Quote Modal */}
      {showQuoteModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowQuoteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Quote</h2>
              <button className="btn-close" onClick={() => setShowQuoteModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="booking-info">
                <h4>{selectedBooking.serviceType} - {selectedBooking.garmentType}</h4>
                <p>{selectedBooking.description}</p>
              </div>

              <div className="form-group">
                <label>Price (₹)</label>
                <input
                  type="number"
                  value={quoteData.price}
                  onChange={(e) => setQuoteData({ ...quoteData, price: e.target.value })}
                  placeholder="Enter price"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Estimated Time</label>
                <input
                  type="text"
                  value={quoteData.estimatedTime}
                  onChange={(e) => setQuoteData({ ...quoteData, estimatedTime: e.target.value })}
                  placeholder="e.g., 2-3 days"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  value={quoteData.notes}
                  onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                  placeholder="Add any notes for the customer..."
                  rows="3"
                  className="form-input"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowQuoteModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleSubmitQuote} className="btn btn-primary">
                Send Quote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TailorDashboard;
