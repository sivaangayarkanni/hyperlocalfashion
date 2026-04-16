import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Navigation.css';

const Navigation = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">♻️</span>
          <span className="logo-text">ReWear</span>
        </Link>

        {/* Menu Toggle */}
        <button 
          className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Links */}
        <div className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
            Home
          </Link>

          {user ? (
            <>
              {user.role === 'tailor' ? (
                <>
                  <Link to="/tailor-dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link to="/tailor-profile" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/booking/new" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Create Booking
                  </Link>
                  <Link to="/dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link to="/tailors/nearby" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Find Tailors
                  </Link>
                </>
              )}

              <div className="nav-user">
                <span className="user-name">{user.name}</span>
                <button onClick={handleLogout} className="btn btn-sm btn-outline">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-sm btn-primary" onClick={() => setIsMenuOpen(false)}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
