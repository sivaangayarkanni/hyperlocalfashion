import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './TailorProfile.css';

const TailorProfile = () => {
  const { id } = useParams();
  const [tailor, setTailor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTailorData();
  }, [id]);

  const fetchTailorData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [tailorRes, reviewsRes] = await Promise.all([
        axios.get(`/api/tailors/${id}`),
        axios.get(`/api/reviews/tailor/${id}`)
      ]);
      setTailor(tailorRes.data.tailor);
      setReviews(reviewsRes.data.reviews || []);
    } catch (error) {
      console.error('Error fetching tailor data:', error);
      setError(error.response?.data?.message || 'Failed to load tailor profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  
  if (error || !tailor) {
    return (
      <div className="tailor-not-found-container">
        <div className="container">
          <div className="not-found-content">
            <div className="not-found-icon">🔍</div>
            <h1>Tailor Not Found</h1>
            <p>{error || 'The tailor profile you are looking for does not exist.'}</p>
            <div className="not-found-actions">
              <Link to="/tailors/nearby" className="btn btn-primary">
                Find Nearby Tailors
              </Link>
              <Link to="/" className="btn btn-outline">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tailor-profile">
      <div className="profile-header">
        <h1>{tailor.shopName}</h1>
        <div className="rating-large">
          ⭐ {(tailor.averageRating || 0).toFixed(1)} ({tailor.ratingCount || 0} reviews)
        </div>
      </div>

      <div className="profile-info">
        <div className="info-card">
          <h3>Experience</h3>
          <p>{tailor.experience} years</p>
        </div>
        <div className="info-card">
          <h3>Completed Orders</h3>
          <p>{tailor.completedOrders}</p>
        </div>
        <div className="info-card">
          <h3>Status</h3>
          <p>{tailor.isAvailable ? '✅ Available' : '❌ Unavailable'}</p>
        </div>
      </div>

      <div className="specializations-section">
        <h3>Specializations</h3>
        <div className="spec-list">
          {tailor.specializations && JSON.parse(tailor.specializations).map(spec => (
            <span key={spec} className="spec-badge">{spec}</span>
          ))}
        </div>
      </div>

      {tailor.pricing && (
        <div className="pricing-section">
          <h3>Pricing Range</h3>
          <div className="pricing-grid">
            {Object.entries(JSON.parse(tailor.pricing)).map(([service, range]) => (
              <div key={service} className="price-card">
                <h4>{service}</h4>
                <p>₹{range.min} - ₹{range.max}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="reviews-section">
        <h3>Reviews</h3>
        {reviews.length === 0 ? (
          <p>No reviews yet</p>
        ) : (
          <div className="reviews-list">
            {reviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <strong>User</strong>
                  <span>{'⭐'.repeat(review.rating)}</span>
                </div>
                <p>{review.comment}</p>
                <span className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TailorProfile;
