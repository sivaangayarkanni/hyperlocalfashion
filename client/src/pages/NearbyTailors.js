import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './NearbyTailors.css';

const NearbyTailors = () => {
  const [tailors, setTailors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNearbyTailors();
  }, [filter]);

  const fetchNearbyTailors = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          const serviceParam = filter !== 'all' ? `&serviceType=${filter}` : '';
          const res = await axios.get(`/api/tailors/nearby?lat=${latitude}&lng=${longitude}${serviceParam}`);
          setTailors(res.data.tailors);
          setLoading(false);
        });
      }
    } catch (error) {
      console.error('Error fetching tailors:', error);
      setLoading(false);
    }
  };

  return (
    <div className="nearby-tailors">
      <div className="page-header">
        <h2>Nearby Tailors</h2>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={filter === 'repair' ? 'active' : ''} 
            onClick={() => setFilter('repair')}
          >
            Repair
          </button>
          <button 
            className={filter === 'alteration' ? 'active' : ''} 
            onClick={() => setFilter('alteration')}
          >
            Alteration
          </button>
          <button 
            className={filter === 'stitching' ? 'active' : ''} 
            onClick={() => setFilter('stitching')}
          >
            Stitching
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Finding tailors near you...</div>
      ) : tailors.length === 0 ? (
        <div className="empty-state">No tailors found nearby</div>
      ) : (
        <div className="tailors-grid">
          {tailors.map((tailor) => (
            <Link key={tailor.id} to={`/tailor/${tailor.id}`} className="tailor-card">
              <div className="tailor-header">
                <h3>{tailor.shopName}</h3>
                <div className="rating">
                  ⭐ {(tailor.averageRating || 0).toFixed(1)} ({tailor.ratingCount || 0})
                </div>
              </div>
              <p className="experience">{tailor.experience} years experience</p>
              <div className="specializations">
                {tailor.specializations && JSON.parse(tailor.specializations).map(spec => (
                  <span key={spec} className="spec-badge">{spec}</span>
                ))}
              </div>
              <div className="tailor-footer">
                <span>{tailor.completedOrders} orders completed</span>
                {tailor.isVerified && <span className="verified">✓ Verified</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyTailors;
