import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AIUploader from '../components/AIUploader';
import TrustScoreBadge from '../components/TrustScoreBadge';
import DeliveryTracker from '../components/DeliveryTracker';
import SustainabilityDashboard from '../components/SustainabilityDashboard';
import SmartPriceBreakdown from '../components/SmartPriceBreakdown';
import './FeaturesDemo.css';

const FeaturesDemo = () => {
  const { user } = useContext(AuthContext);
  const [activeDemo, setActiveDemo] = useState('ai');
  const [demoData, setDemoData] = useState({
    trackingNumber: 'RW1703123456ABC123',
    bookingId: 1,
    tailorId: 1,
    damageType: 'tear',
    garmentType: 'shirt',
    distance: 5.2
  });

  const features = [
    {
      id: 'ai',
      title: 'AI Damage Detection',
      description: 'Upload garment images for instant AI-powered damage analysis',
      icon: '🤖',
      component: 'AIUploader'
    },
    {
      id: 'trust',
      title: 'Trust Score System',
      description: 'Dynamic trust scoring for fraud prevention',
      icon: '🛡️',
      component: 'TrustScore'
    },
    {
      id: 'tracking',
      title: 'Real-time Tracking',
      description: 'Live delivery tracking with partner assignment',
      icon: '📍',
      component: 'DeliveryTracker'
    },
    {
      id: 'sustainability',
      title: 'Sustainability Gamification',
      description: 'Track environmental impact and earn badges',
      icon: '🌱',
      component: 'SustainabilityDashboard'
    },
    {
      id: 'pricing',
      title: 'Smart Pricing Engine',
      description: 'Dynamic pricing with transparent breakdown',
      icon: '💰',
      component: 'SmartPricing'
    }
  ];

  const handleAIAnalysis = (result) => {
    console.log('AI Analysis Result:', result);
    setDemoData(prev => ({
      ...prev,
      damageType: result.damageTypes[0],
      garmentType: result.garmentType
    }));
  };

  const renderFeatureComponent = () => {
    switch (activeDemo) {
      case 'ai':
        return (
          <div className="demo-component">
            <AIUploader 
              onAnalysisComplete={handleAIAnalysis}
              bookingId={demoData.bookingId}
            />
          </div>
        );
      
      case 'trust':
        return (
          <div className="demo-component">
            <div className="trust-demo">
              <h3>Trust Score Examples</h3>
              <div className="trust-examples">
                <div className="trust-example">
                  <h4>Your Trust Score</h4>
                  <TrustScoreBadge 
                    userId={user?.id || 1} 
                    showDetails={true} 
                    size="large"
                  />
                </div>
                <div className="trust-example">
                  <h4>Different Score Levels</h4>
                  <div className="score-levels">
                    <div className="score-demo good">
                      <div className="score-circle" style={{ background: 'conic-gradient(#38a169 288deg, #e2e8f0 0deg)' }}>
                        <div className="score-inner">
                          <span className="score-number">80</span>
                        </div>
                      </div>
                      <span className="score-label">Good (70+)</span>
                    </div>
                    <div className="score-demo warning">
                      <div className="score-circle" style={{ background: 'conic-gradient(#d69e2e 180deg, #e2e8f0 0deg)' }}>
                        <div className="score-inner">
                          <span className="score-number">50</span>
                        </div>
                      </div>
                      <span className="score-label">Warning (40-69)</span>
                    </div>
                    <div className="score-demo flagged">
                      <div className="score-circle" style={{ background: 'conic-gradient(#e53e3e 108deg, #e2e8f0 0deg)' }}>
                        <div className="score-inner">
                          <span className="score-number">30</span>
                        </div>
                      </div>
                      <span className="score-label">Flagged (&lt;40)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'tracking':
        return (
          <div className="demo-component">
            <DeliveryTracker 
              trackingNumber={demoData.trackingNumber}
              bookingId={demoData.bookingId}
              userId={user?.id || 1}
            />
          </div>
        );
      
      case 'sustainability':
        return (
          <div className="demo-component">
            <SustainabilityDashboard userId={user?.id || 1} />
          </div>
        );
      
      case 'pricing':
        return (
          <div className="demo-component">
            <SmartPriceBreakdown 
              damageType={demoData.damageType}
              garmentType={demoData.garmentType}
              tailorId={demoData.tailorId}
              distance={demoData.distance}
              isEmergency={false}
            />
            <div className="pricing-controls">
              <h4>Try Different Scenarios</h4>
              <div className="control-group">
                <label>Damage Type:</label>
                <select 
                  value={demoData.damageType}
                  onChange={(e) => setDemoData(prev => ({ ...prev, damageType: e.target.value }))}
                >
                  <option value="tear">Tear</option>
                  <option value="loose_seam">Loose Seam</option>
                  <option value="missing_button">Missing Button</option>
                  <option value="fitting_issue">Fitting Issue</option>
                  <option value="zipper_problem">Zipper Problem</option>
                </select>
              </div>
              <div className="control-group">
                <label>Garment Type:</label>
                <select 
                  value={demoData.garmentType}
                  onChange={(e) => setDemoData(prev => ({ ...prev, garmentType: e.target.value }))}
                >
                  <option value="shirt">Shirt</option>
                  <option value="pants">Pants</option>
                  <option value="dress">Dress</option>
                  <option value="jacket">Jacket</option>
                </select>
              </div>
              <div className="control-group">
                <label>Distance (km):</label>
                <input 
                  type="number" 
                  value={demoData.distance}
                  onChange={(e) => setDemoData(prev => ({ ...prev, distance: parseFloat(e.target.value) }))}
                  min="0"
                  max="50"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Select a feature to demo</div>;
    }
  };

  return (
    <div className="features-demo">
      <div className="demo-header">
        <h1>Advanced Platform Features</h1>
        <p>Experience the cutting-edge features that make ReWear the future of sustainable fashion</p>
      </div>

      <div className="demo-navigation">
        {features.map(feature => (
          <button
            key={feature.id}
            className={`nav-item ${activeDemo === feature.id ? 'active' : ''}`}
            onClick={() => setActiveDemo(feature.id)}
          >
            <span className="nav-icon">{feature.icon}</span>
            <div className="nav-content">
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="demo-content">
        <div className="feature-header">
          <h2>
            {features.find(f => f.id === activeDemo)?.icon} {features.find(f => f.id === activeDemo)?.title}
          </h2>
          <p>{features.find(f => f.id === activeDemo)?.description}</p>
        </div>

        {renderFeatureComponent()}
      </div>

      <div className="demo-footer">
        <div className="feature-highlights">
          <h3>🚀 What Makes These Features Special</h3>
          <div className="highlights-grid">
            <div className="highlight-item">
              <h4>🤖 AI-Powered</h4>
              <p>Advanced machine learning for damage detection and predictive maintenance</p>
            </div>
            <div className="highlight-item">
              <h4>🔒 Fraud Prevention</h4>
              <p>Multi-layered trust scoring and fraud detection algorithms</p>
            </div>
            <div className="highlight-item">
              <h4>📱 Real-time Updates</h4>
              <p>Live tracking and notifications via WebSocket connections</p>
            </div>
            <div className="highlight-item">
              <h4>🌱 Sustainability Focus</h4>
              <p>Gamified environmental impact tracking with social features</p>
            </div>
            <div className="highlight-item">
              <h4>💰 Smart Pricing</h4>
              <p>Dynamic pricing engine with transparent cost breakdown</p>
            </div>
            <div className="highlight-item">
              <h4>🛡️ Secure Payments</h4>
              <p>Escrow system with dispute resolution and automatic refunds</p>
            </div>
          </div>
        </div>

        <div className="tech-stack">
          <h3>🛠️ Technology Stack</h3>
          <div className="tech-items">
            <span className="tech-item">React.js</span>
            <span className="tech-item">Node.js</span>
            <span className="tech-item">SQLite</span>
            <span className="tech-item">Socket.io</span>
            <span className="tech-item">TensorFlow.js</span>
            <span className="tech-item">Stripe API</span>
            <span className="tech-item">WebRTC</span>
            <span className="tech-item">PWA</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturesDemo;