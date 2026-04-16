import React, { useState, useEffect } from 'react';
import '../styles/TrustScoreBadge.css';

const TrustScoreBadge = ({ userId, showDetails = false, size = 'medium' }) => {
  const [trustScore, setTrustScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTrustScore();
  }, [userId]);

  const fetchTrustScore = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fraud/trust-score/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trust score');
      }

      const result = await response.json();
      setTrustScore(result.data);
    } catch (error) {
      console.error('Error fetching trust score:', error);
      setError('Failed to load trust score');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#38a169'; // Green
    if (score >= 40) return '#d69e2e'; // Yellow
    return '#e53e3e'; // Red
  };

  const getScoreIcon = (status) => {
    switch (status) {
      case 'good': return '✅';
      case 'warning': return '⚠️';
      case 'flagged': return '🚩';
      default: return '❓';
    }
  };

  const getScoreText = (status) => {
    switch (status) {
      case 'good': return 'Trusted';
      case 'warning': return 'Caution';
      case 'flagged': return 'Flagged';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className={`trust-score-badge ${size} loading`}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !trustScore) {
    return (
      <div className={`trust-score-badge ${size} error`}>
        <span>❓</span>
        {showDetails && <span className="score-text">Unknown</span>}
      </div>
    );
  }

  return (
    <div className={`trust-score-badge ${size} ${trustScore.status}`}>
      <div className="score-container">
        <div 
          className="score-circle"
          style={{ 
            background: `conic-gradient(${getScoreColor(trustScore.score)} ${trustScore.score * 3.6}deg, #e2e8f0 0deg)`
          }}
        >
          <div className="score-inner">
            <span className="score-number">{trustScore.score}</span>
          </div>
        </div>
        
        <div className="score-info">
          <span className="score-icon">{getScoreIcon(trustScore.status)}</span>
          {showDetails && (
            <div className="score-details">
              <span className="score-text">{getScoreText(trustScore.status)}</span>
              <span className="score-subtitle">Trust Score</span>
            </div>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="score-breakdown">
          <div className="breakdown-item">
            <span className="label">Completed:</span>
            <span className="value">{trustScore.completedBookings || 0}</span>
          </div>
          <div className="breakdown-item">
            <span className="label">Cancelled:</span>
            <span className="value">{trustScore.cancelledBookings || 0}</span>
          </div>
          <div className="breakdown-item">
            <span className="label">Last Updated:</span>
            <span className="value">
              {trustScore.lastCalculated 
                ? new Date(trustScore.lastCalculated).toLocaleDateString()
                : 'Never'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustScoreBadge;