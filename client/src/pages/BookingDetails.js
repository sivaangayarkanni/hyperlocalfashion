import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import SustainabilityCard from '../components/SustainabilityCard';
import './BookingDetails.css';

const BookingDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [quote, setQuote] = useState({ price: '', estimatedTime: '', notes: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const res = await axios.get(`/api/bookings/${id}`);
      setBooking(res.data.booking);
    } catch (error) {
      toast.error('Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/bookings/${id}/quote`, quote);
      toast.success('Quote sent successfully!');
      fetchBooking();
      setQuote({ price: '', estimatedTime: '', notes: '' });
    } catch (error) {
      console.error('Quote error:', error);
      toast.error(error.response?.data?.message || 'Failed to send quote');
    }
  };

  const handleStatusUpdate = async (status) => {
    try {
      await axios.put(`/api/bookings/${id}/status`, { status });
      toast.success('Status updated!');
      
      // If marking as completed, calculate sustainability score
      if (status === 'completed') {
        try {
          await axios.post('/api/sustainability/calculate', {
            bookingId: id,
            garmentType: booking.garmentType,
            serviceType: booking.serviceType
          });
          toast.success('🌱 Environmental impact calculated!');
        } catch (err) {
          console.error('Error calculating sustainability:', err);
        }
      }
      
      fetchBooking();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!booking) return <div>Booking not found</div>;

  const isTailor = user.role === 'tailor';

  return (
    <div className="booking-details">
      <button onClick={() => navigate(-1)} className="btn-back">← Back</button>
      
      <div className="booking-header">
        <h2>Booking Details</h2>
        <span className="status-badge">{booking.status}</span>
      </div>

      <div className="booking-info">
        <div className="info-section">
          <h3>Service Information</h3>
          <p><strong>Service Type:</strong> {booking.serviceType}</p>
          <p><strong>Garment Type:</strong> {booking.garmentType}</p>
          <p><strong>Description:</strong> {booking.description}</p>
        </div>

        {booking.images && booking.images.length > 0 && (
          <div className="info-section">
            <h3>Photos</h3>
            <div className="image-gallery">
              {booking.images.map((img, idx) => (
                <img key={idx} src={img} alt={`Garment ${idx + 1}`} />
              ))}
            </div>
          </div>
        )}

        {!isTailor && (
          <div className="info-section">
            <h3>Tailor Information</h3>
            <p><strong>Shop:</strong> {booking.shopName}</p>
          </div>
        )}

        {isTailor && (
          <div className="info-section">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> {booking.userName}</p>
            <p><strong>Phone:</strong> {booking.userPhone}</p>
            <p><strong>Pickup Address:</strong> {booking.pickupAddress}</p>
          </div>
        )}

        {booking.quotePrice && (
          <div className="info-section quote-section">
            <h3>Quote</h3>
            <p><strong>Price:</strong> ₹{booking.quotePrice}</p>
            <p><strong>Estimated Time:</strong> {booking.quoteEstimatedTime}</p>
            {booking.quoteNotes && <p><strong>Notes:</strong> {booking.quoteNotes}</p>}
          </div>
        )}
      </div>

      {isTailor && booking.status === 'pending' && (
        <div className="quote-form">
          <h3>Provide Quote</h3>
          <form onSubmit={handleQuoteSubmit}>
            <div className="form-group">
              <label>Price (₹)</label>
              <input
                type="number"
                value={quote.price}
                onChange={(e) => setQuote({ ...quote, price: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Estimated Time</label>
              <input
                type="text"
                value={quote.estimatedTime}
                onChange={(e) => setQuote({ ...quote, estimatedTime: e.target.value })}
                placeholder="e.g., 2-3 days"
                required
              />
            </div>
            <div className="form-group">
              <label>Notes (optional)</label>
              <textarea
                value={quote.notes}
                onChange={(e) => setQuote({ ...quote, notes: e.target.value })}
                rows="3"
              />
            </div>
            <button type="submit" className="btn btn-primary">Send Quote</button>
          </form>
        </div>
      )}

      {!isTailor && booking.status === 'quoted' && (
        <div className="action-buttons">
          <button 
            onClick={() => handleStatusUpdate('accepted')} 
            className="btn btn-primary"
          >
            Accept Quote
          </button>
          <button 
            onClick={() => handleStatusUpdate('rejected')} 
            className="btn btn-outline"
          >
            Reject
          </button>
        </div>
      )}

      {!isTailor && booking.status === 'accepted' && (
        <div className="action-buttons">
          <button 
            onClick={() => handleStatusUpdate('completed')} 
            className="btn btn-success"
          >
            ✓ Mark as Completed
          </button>
        </div>
      )}

      {booking.status === 'completed' && booking.sustainabilityScore && (
        <SustainabilityCard 
          bookingId={booking.id}
          garmentType={booking.garmentType}
          serviceType={booking.serviceType}
        />
      )}

      {booking.status === 'completed' && !booking.sustainabilityScore && (
        <div className="sustainability-pending">
          <p>Calculating your environmental impact...</p>
          <SustainabilityCard 
            bookingId={booking.id}
            garmentType={booking.garmentType}
            serviceType={booking.serviceType}
            onScoreCalculated={() => fetchBooking()}
          />
        </div>
      )}
    </div>
  );
};

export default BookingDetails;
