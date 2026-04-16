import React, { useState, useEffect, useRef } from 'react';
import '../styles/SustainabilityDashboard.css';
import io from 'socket.io-client';

const SustainabilityDashboard = ({ userId }) => {
  const [sustainabilityData, setSustainabilityData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize Socket.io for real-time updates
    socketRef.current = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('sustainability-update', (data) => {
      if (data.userId === parseInt(userId)) {
        setSustainabilityData(prev => ({
          ...prev,
          ...data
        }));
      }
    });

    socketRef.current.on('leaderboard-update', (data) => {
      setLeaderboard(data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId]);

  useEffect(() => {
    fetchSustainabilityData();
    fetchLeaderboard();
    
    // Refresh data every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchSustainabilityData();
      fetchLeaderboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId]);

  const fetchSustainabilityData = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/sustainability-advanced/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch sustainability data');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setSustainabilityData(result.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching sustainability data:', error);
      setError(error.message || 'Failed to load sustainability data');
      // Set default data to prevent blank screen
      setSustainabilityData({
        totalCO2Saved: 0,
        totalWaterSaved: 0,
        sustainabilityScore: 0,
        badge: null,
        rank: 0,
        totalUsers: 0,
        bookingCount: 0
      });
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/sustainability-advanced/leaderboard?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch leaderboard');
      }

      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setLeaderboard(result.data);
      } else if (result.success && result.data && Array.isArray(result.data.leaderboard)) {
        setLeaderboard(result.data.leaderboard);
      } else {
        throw new Error('Invalid leaderboard format');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError(error.message || 'Failed to load leaderboard');
      setLeaderboard([]);
      setLoading(false);
    }
  };

  const getBadgeIcon = (badge) => {
    const icons = {
      bronze: '🥉',
      silver: '🥈',
      gold: '🥇'
    };
    return icons[badge] || '';
  };

  const getBadgeColor = (badge) => {
    const colors = {
      bronze: '#cd7f32',
      silver: '#c0c0c0',
      gold: '#ffd700'
    };
    return colors[badge] || '#e2e8f0';
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toFixed(1);
  };

  const shareAchievement = () => {
    if (!sustainabilityData) return;

    const message = `I've saved ${sustainabilityData.totalCO2Saved.toFixed(1)}kg of CO2 and ${sustainabilityData.totalWaterSaved.toFixed(0)} liters of water by repairing clothes instead of buying new ones! 🌱 #SustainableFashion #ReWear`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Sustainability Impact',
        text: message,
        url: window.location.href
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(message).then(() => {
        alert('Achievement copied to clipboard!');
      });
    }
  };

  if (loading) {
    return (
      <div className="sustainability-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading sustainability data...</p>
      </div>
    );
  }

  if (error || !sustainabilityData) {
    return (
      <div className="sustainability-dashboard error">
        <div className="error-icon">🌱</div>
        <p>{error || 'Sustainability data not available'}</p>
      </div>
    );
  }

  return (
    <div className="sustainability-dashboard">
      <div className="dashboard-header">
        <h2>Your Sustainability Impact</h2>
        <p>See how your repair choices are helping the planet</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          Leaderboard
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-tab">
          <div className="impact-cards">
            <div className="impact-card co2">
              <div className="card-icon">🌍</div>
              <div className="card-content">
                <h3>{sustainabilityData.totalCO2Saved.toFixed(1)} kg</h3>
                <p>CO2 Saved</p>
                <small>Equivalent to {Math.round(sustainabilityData.totalCO2Saved / 2.3)} km of driving</small>
              </div>
            </div>

            <div className="impact-card water">
              <div className="card-icon">💧</div>
              <div className="card-content">
                <h3>{formatNumber(sustainabilityData.totalWaterSaved)} L</h3>
                <p>Water Saved</p>
                <small>Equivalent to {Math.round(sustainabilityData.totalWaterSaved / 8)} glasses of water</small>
              </div>
            </div>

            <div className="impact-card score">
              <div className="card-icon">⭐</div>
              <div className="card-content">
                <h3>{sustainabilityData.sustainabilityScore.toFixed(0)}</h3>
                <p>Sustainability Score</p>
                <small>Rank #{sustainabilityData.rank} of {sustainabilityData.totalUsers}</small>
              </div>
            </div>
          </div>

          {sustainabilityData.badge && (
            <div className="badge-section">
              <div className="current-badge" style={{ borderColor: getBadgeColor(sustainabilityData.badge) }}>
                <div className="badge-icon">{getBadgeIcon(sustainabilityData.badge)}</div>
                <div className="badge-info">
                  <h4>{sustainabilityData.badge.charAt(0).toUpperCase() + sustainabilityData.badge.slice(1)} Saver</h4>
                  <p>You've earned the {sustainabilityData.badge} sustainability badge!</p>
                </div>
              </div>
            </div>
          )}

          <div className="progress-section">
            <h4>Progress to Next Badge</h4>
            <div className="progress-bars">
              <div className="progress-item">
                <div className="progress-label">
                  <span>Bronze Badge (100 points)</span>
                  <span>{Math.min(sustainabilityData.sustainabilityScore, 100).toFixed(0)}/100</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill bronze"
                    style={{ width: `${Math.min(sustainabilityData.sustainabilityScore / 100 * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-label">
                  <span>Silver Badge (500 points)</span>
                  <span>{Math.min(sustainabilityData.sustainabilityScore, 500).toFixed(0)}/500</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill silver"
                    style={{ width: `${Math.min(sustainabilityData.sustainabilityScore / 500 * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="progress-item">
                <div className="progress-label">
                  <span>Gold Badge (1000 points)</span>
                  <span>{Math.min(sustainabilityData.sustainabilityScore, 1000).toFixed(0)}/1000</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill gold"
                    style={{ width: `${Math.min(sustainabilityData.sustainabilityScore / 1000 * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="actions-section">
            <button onClick={shareAchievement} className="btn-share">
              📱 Share Achievement
            </button>
          </div>
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="leaderboard-tab">
          <div className="leaderboard-header">
            <h3>Top Sustainability Champions</h3>
            <p>See how you rank among other eco-warriors</p>
          </div>

          <div className="leaderboard-list">
            {leaderboard.map((user, index) => (
              <div 
                key={user.userId} 
                className={`leaderboard-item ${user.userId === userId ? 'current-user' : ''}`}
              >
                <div className="rank">
                  {index < 3 ? (
                    <span className="medal">{['🥇', '🥈', '🥉'][index]}</span>
                  ) : (
                    <span className="rank-number">#{user.rank}</span>
                  )}
                </div>

                <div className="user-info">
                  <div className="user-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="user-details">
                    <h4>{user.name}</h4>
                    {user.badge && (
                      <div className="user-badge">
                        {getBadgeIcon(user.badge)} {user.badge}
                      </div>
                    )}
                  </div>
                </div>

                <div className="user-score">
                  <span className="score-number">{user.sustainabilityScore.toFixed(0)}</span>
                  <span className="score-label">points</span>
                </div>
              </div>
            ))}
          </div>

          {sustainabilityData.rank > 10 && (
            <div className="current-user-rank">
              <div className="rank-divider">...</div>
              <div className="leaderboard-item current-user">
                <div className="rank">
                  <span className="rank-number">#{sustainabilityData.rank}</span>
                </div>
                <div className="user-info">
                  <div className="user-details">
                    <h4>You</h4>
                    {sustainabilityData.badge && (
                      <div className="user-badge">
                        {getBadgeIcon(sustainabilityData.badge)} {sustainabilityData.badge}
                      </div>
                    )}
                  </div>
                </div>
                <div className="user-score">
                  <span className="score-number">{sustainabilityData.sustainabilityScore.toFixed(0)}</span>
                  <span className="score-label">points</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SustainabilityDashboard;