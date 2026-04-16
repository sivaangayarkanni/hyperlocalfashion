import React, { useState, useEffect } from 'react';
import '../styles/SmartPriceBreakdown.css';

const SmartPriceBreakdown = ({ 
  damageType, 
  garmentType, 
  tailorId, 
  distance, 
  isEmergency = false,
  onPriceCalculated 
}) => {
  const [priceData, setPriceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (damageType && garmentType && tailorId) {
      calculatePrice();
    }
  }, [damageType, garmentType, tailorId, distance, isEmergency]);

  const calculatePrice = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          damageType,
          garmentType,
          tailorId,
          distance: distance || 0,
          isEmergency
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate price');
      }

      const result = await response.json();
      setPriceData(result.data);
      
      if (onPriceCalculated) {
        onPriceCalculated(result.data);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      setError('Failed to calculate price');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${Math.round(amount)}`;
  };

  const getPremiumIcon = (type) => {
    const icons = {
      express: '⚡',
      top_rated: '⭐',
      distance: '📍'
    };
    return icons[type] || '💰';
  };

  const getPremiumLabel = (type) => {
    const labels = {
      express: 'Express Service',
      top_rated: 'Top Rated Tailor',
      distance: 'Distance Surcharge'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="price-breakdown loading">
        <div className="loading-spinner"></div>
        <p>Calculating smart price...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="price-breakdown error">
        <div className="error-icon">💰</div>
        <p>{error}</p>
        <button onClick={calculatePrice} className="btn-retry">
          Try Again
        </button>
      </div>
    );
  }

  if (!priceData) {
    return (
      <div className="price-breakdown empty">
        <div className="empty-icon">💰</div>
        <p>Enter service details to see price breakdown</p>
      </div>
    );
  }

  const totalSavings = priceData.breakdown.premiums.reduce((sum, p) => sum + p.amount, 0) +
                     priceData.breakdown.surcharges.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="price-breakdown">
      <div className="breakdown-header">
        <h3>Smart Price Breakdown</h3>
        <div className="total-price">
          <span className="price-amount">{formatCurrency(priceData.suggestedPrice)}</span>
          <span className="price-label">Total</span>
        </div>
      </div>

      <div className="breakdown-details">
        <div className="breakdown-item base">
          <div className="item-info">
            <span className="item-icon">🏷️</span>
            <span className="item-label">Base Price</span>
            <span className="item-description">
              {garmentType.replace('_', ' ')} • {damageType.replace('_', ' ')}
            </span>
          </div>
          <span className="item-amount">{formatCurrency(priceData.breakdown.base)}</span>
        </div>

        {priceData.breakdown.premiums.map((premium, index) => (
          <div key={index} className="breakdown-item premium">
            <div className="item-info">
              <span className="item-icon">{getPremiumIcon(premium.type)}</span>
              <span className="item-label">{getPremiumLabel(premium.type)}</span>
              <span className="item-description">
                {premium.type === 'express' && 'Same-day completion'}
                {premium.type === 'top_rated' && 'Premium quality service'}
                {premium.type === 'distance' && `${distance}km from your location`}
              </span>
            </div>
            <span className="item-amount positive">+{formatCurrency(premium.amount)}</span>
          </div>
        ))}

        {priceData.breakdown.surcharges.map((surcharge, index) => (
          <div key={index} className="breakdown-item surcharge">
            <div className="item-info">
              <span className="item-icon">{getPremiumIcon(surcharge.type)}</span>
              <span className="item-label">{getPremiumLabel(surcharge.type)}</span>
              <span className="item-description">
                Additional charges apply
              </span>
            </div>
            <span className="item-amount positive">+{formatCurrency(surcharge.amount)}</span>
          </div>
        ))}
      </div>

      <div className="breakdown-summary">
        <div className="summary-row">
          <span className="summary-label">Subtotal</span>
          <span className="summary-amount">{formatCurrency(priceData.breakdown.base)}</span>
        </div>
        
        {totalSavings > 0 && (
          <div className="summary-row">
            <span className="summary-label">Additional Charges</span>
            <span className="summary-amount positive">+{formatCurrency(totalSavings)}</span>
          </div>
        )}
        
        <div className="summary-row total">
          <span className="summary-label">Total Amount</span>
          <span className="summary-amount">{formatCurrency(priceData.suggestedPrice)}</span>
        </div>
      </div>

      <div className="price-comparison">
        <div className="comparison-item">
          <span className="comparison-label">vs. Market Average</span>
          <span className="comparison-value">
            {priceData.suggestedPrice > priceData.breakdown.base * 1.1 ? (
              <span className="higher">+{formatCurrency(priceData.suggestedPrice - priceData.breakdown.base * 1.1)}</span>
            ) : (
              <span className="lower">-{formatCurrency(priceData.breakdown.base * 1.1 - priceData.suggestedPrice)}</span>
            )}
          </span>
        </div>
        
        <div className="comparison-item">
          <span className="comparison-label">vs. Buying New</span>
          <span className="comparison-value savings">
            Save ~{formatCurrency(priceData.breakdown.base * 8)}
          </span>
        </div>
      </div>

      {isEmergency && (
        <div className="emergency-notice">
          <span className="notice-icon">⚡</span>
          <div className="notice-content">
            <strong>Emergency Service</strong>
            <p>Guaranteed completion within 2 hours or 50% refund</p>
          </div>
        </div>
      )}

      <div className="price-actions">
        <button onClick={calculatePrice} className="btn-recalculate">
          🔄 Recalculate
        </button>
      </div>
    </div>
  );
};

export default SmartPriceBreakdown;