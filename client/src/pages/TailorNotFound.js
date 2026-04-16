import React from 'react';
import { Link } from 'react-router-dom';
import './TailorNotFound.css';

const TailorNotFound = () => {
  return (
    <div className="tailor-not-found">
      <div className="container">
        <div className="not-found-content">
          {/* Animated Trees */}
          <div className="tree-container tree-left-404">
            <div className="tree">
              <div className="tree-roots"></div>
              <div className="tree-trunk"></div>
              <div className="tree-foliage"></div>
            </div>
          </div>

          <div className="tree-container tree-right-404">
            <div className="tree">
              <div className="tree-roots"></div>
              <div className="tree-trunk"></div>
              <div className="tree-foliage"></div>
            </div>
          </div>

          <div className="not-found-card">
            <div className="not-found-icon">🔍</div>
            <h1>Tailor Not Found</h1>
            <p className="not-found-subtitle">
              We couldn't find the tailor you're looking for. They might be unavailable or the profile has been removed.
            </p>

            <div className="not-found-suggestions">
              <h3>What you can do:</h3>
              <ul>
                <li>
                  <Link to="/tailors/nearby" className="suggestion-link">
                    🗺️ Find Nearby Tailors
                  </Link>
                </li>
                <li>
                  <Link to="/booking/new" className="suggestion-link">
                    📦 Create a New Booking
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="suggestion-link">
                    📊 Go to Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/" className="suggestion-link">
                    🏠 Back to Home
                  </Link>
                </li>
              </ul>
            </div>

            <div className="not-found-message">
              <p>
                <strong>Tip:</strong> If you're looking for a specific tailor, try searching in the nearby tailors section or create a booking request and let tailors come to you!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailorNotFound;
