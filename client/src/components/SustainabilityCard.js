import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/SustainabilityCard.css';

const SustainabilityCard = ({ bookingId, garmentType, serviceType, onScoreCalculated }) => {
  const [scoreData, setScoreData] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCoinAnimation, setShowCoinAnimation] = useState(false);

  const calculateScore = async () => {
    if (!bookingId || !garmentType || !serviceType) {
      setError('Missing required information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/sustainability/calculate', {
        bookingId,
        garmentType,
        serviceType
      });

      setScoreData(response.data.scoreData);
      setEarnedBadges(response.data.earnedBadges || []);
      setShowCoinAnimation(true);
      
      if (onScoreCalculated) {
        onScoreCalculated(response.data.scoreData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to calculate score');
      console.error('Error calculating sustainability score:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId && garmentType && serviceType) {
      calculateScore();
    }
  }, [bookingId, garmentType, serviceType]);

  if (loading) {
    return <div className="sustainability-card loading">Calculating your impact...</div>;
  }

  if (error) {
    return <div className="sustainability-card error">{error}</div>;
  }

  if (!scoreData) {
    return null;
  }

  const getScoreColor = (score) => {
    if (score >= 90) return '#2ecc71';
    if (score >= 75) return '#f39c12';
    if (score >= 60) return '#3498db';
    return '#95a5a6';
  };

  return (
    <div className="sustainability-card">
      {showCoinAnimation && (
        <div className="coin-animation-container">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="floating-coin" style={{ '--delay': `${i * 0.1}s` }}>
              🪙
            </div>
          ))}
        </div>
      )}

      <div className="sustainability-header">
        <h3>🌱 Your Environmental Impact</h3>
      </div>

      <div className="score-section">
        <div className="score-circle" style={{ borderColor: getScoreColor(scoreData.score) }}>
          <div className="score-value">{scoreData.score}</div>
          <div className="score-label">Impact Score</div>
        </div>
        <div className="score-details">
          <p className="garment-info">
            <strong>{scoreData.garmentType}</strong> • {scoreData.repairType}
          </p>
          <div className="reward-points-display">
            <div className="coin-icon">🪙</div>
            <div className="points-text">
              <strong>{scoreData.rewardPoints}</strong>
              <span>Points Earned</span>
            </div>
          </div>
        </div>
      </div>

      <div className="impact-section">
        <h4>Environmental Impact Saved</h4>
        <div className="impact-items">
          {scoreData.messages.map((message, index) => (
            <div key={index} className="impact-item">
              {message}
            </div>
          ))}
        </div>
      </div>

      {earnedBadges.length > 0 && (
        <div className="badges-section">
          <h4>🏆 Badges Earned</h4>
          <div className="badges-grid">
            {earnedBadges.map((badge) => (
              <div key={badge.id} className="badge-item" title={badge.description}>
                <div className="badge-icon">{badge.icon}</div>
                <div className="badge-name">{badge.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="impact-breakdown">
        <div className="breakdown-item">
          <span className="breakdown-label">💧 Water Saved</span>
          <span className="breakdown-value">{scoreData.impact.waterSaved.toLocaleString()} L</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">🌍 CO2 Reduced</span>
          <span className="breakdown-value">{scoreData.impact.co2Reduced} kg</span>
        </div>
        <div className="breakdown-item">
          <span className="breakdown-label">🗑️ Waste Prevented</span>
          <span className="breakdown-value">{scoreData.impact.wasteReduced} kg</span>
        </div>
      </div>
    </div>
  );
};

export default SustainabilityCard;
