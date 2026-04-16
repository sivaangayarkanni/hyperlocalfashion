import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="home">
      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-blob hero-blob-1" style={{ transform: `translateY(${scrollY * 0.5}px)` }}></div>
          <div className="hero-blob hero-blob-2" style={{ transform: `translateY(${scrollY * 0.3}px)` }}></div>
          
          {/* Animated Trees */}
          <div className="tree-container tree-left">
            <div className="tree">
              <div className="tree-roots"></div>
              <div className="tree-trunk"></div>
              <div className="tree-foliage"></div>
            </div>
          </div>
          
          <div className="tree-container tree-right">
            <div className="tree">
              <div className="tree-roots"></div>
              <div className="tree-trunk"></div>
              <div className="tree-foliage"></div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="hero-content">
            <div className="hero-text animate-fade-in">
              <h1 className="hero-title">
                Repair. Reuse. <span className="text-accent">ReWear.</span>
              </h1>
              <p className="hero-subtitle">
                <strong>Give your clothes a second life. Connect with skilled tailors in your neighborhood and embrace sustainable fashion.</strong>
              </p>
              <div className="hero-cta">
                {user ? (
                  <>
                    <Link to="/booking/new" className="btn btn-primary btn-lg">
                      📦 Create Booking
                    </Link>
                    <Link to="/dashboard" className="btn btn-outline btn-lg">
                      📊 Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/signup" className="btn btn-primary btn-lg">
                      🚀 Get Started
                    </Link>
                    <Link to="/login" className="btn btn-outline btn-lg">
                      🔑 Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="hero-visual animate-slide-in-right">
              <div className="hero-card">
                <div className="hero-icon">👗</div>
                <h3>Sustainable Fashion</h3>
                <p>Reduce waste, save money, save the planet</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          PROBLEM SECTION
          ============================================ */}
      <section className="section problem-section">
        <div className="container">
          <div className="section-header">
            <h2>The Problem We're Solving</h2>
            <p className="section-subtitle">Every year, millions of tons of textile waste end up in landfills</p>
          </div>

          <div className="problem-grid">
            <div className="problem-card animate-fade-in">
              <div className="problem-icon">🌍</div>
              <h3>92 Million Tons</h3>
              <p>of textile waste generated annually worldwide</p>
            </div>
            <div className="problem-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="problem-icon">💧</div>
              <h3>2,700 Liters</h3>
              <p>of water needed to make one cotton shirt</p>
            </div>
            <div className="problem-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="problem-icon">🏭</div>
              <h3>10% of Emissions</h3>
              <p>from the fashion industry's carbon footprint</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          HOW IT WORKS SECTION
          ============================================ */}
      <section className="section how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How ReWear Works</h2>
            <p className="section-subtitle">Simple steps to sustainable fashion</p>
          </div>

          <div className="steps-grid">
            <div className="step-card animate-scale-in">
              <div className="step-number">1</div>
              <div className="step-icon">📸</div>
              <h3>Upload Your Garment</h3>
              <p>Take a photo of the item you want to repair or alter</p>
            </div>

            <div className="step-card animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="step-number">2</div>
              <div className="step-icon">🔍</div>
              <h3>Find a Tailor</h3>
              <p>Browse nearby tailors with ratings and experience</p>
            </div>

            <div className="step-card animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="step-number">3</div>
              <div className="step-icon">💬</div>
              <h3>Get a Quote</h3>
              <p>Receive personalized quotes from tailors</p>
            </div>

            <div className="step-card animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="step-number">4</div>
              <div className="step-icon">🚚</div>
              <h3>Pickup & Delivery</h3>
              <p>We handle the logistics with our delivery partners</p>
            </div>

            <div className="step-card animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className="step-number">5</div>
              <div className="step-icon">✨</div>
              <h3>Get Your Item Back</h3>
              <p>Receive your beautifully repaired garment</p>
            </div>

            <div className="step-card animate-scale-in" style={{ animationDelay: '0.5s' }}>
              <div className="step-number">6</div>
              <div className="step-icon">🌱</div>
              <h3>Track Your Impact</h3>
              <p>See how much you've saved for the planet</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          BENEFITS SECTION
          ============================================ */}
      <section className="section benefits-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose ReWear?</h2>
            <p className="section-subtitle">Benefits that matter</p>
          </div>

          <div className="benefits-grid">
            <div className="benefit-card card-elevated">
              <div className="benefit-icon">💰</div>
              <h3>Save Money</h3>
              <p>Repair costs 70% less than buying new clothes</p>
            </div>

            <div className="benefit-card card-elevated">
              <div className="benefit-icon">🌍</div>
              <h3>Save the Planet</h3>
              <p>Reduce your carbon footprint with every repair</p>
            </div>

            <div className="benefit-card card-elevated">
              <div className="benefit-icon">⏱️</div>
              <h3>Save Time</h3>
              <p>We handle pickup and delivery for you</p>
            </div>

            <div className="benefit-card card-elevated">
              <div className="benefit-icon">⭐</div>
              <h3>Quality Tailors</h3>
              <p>Verified professionals with excellent ratings</p>
            </div>

            <div className="benefit-card card-elevated">
              <div className="benefit-icon">📍</div>
              <h3>Local Support</h3>
              <p>Support local tailors in your community</p>
            </div>

            <div className="benefit-card card-elevated">
              <div className="benefit-icon">🎁</div>
              <h3>Earn Rewards</h3>
              <p>Get points and badges for sustainable choices</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          IMPACT TRACKER SECTION
          ============================================ */}
      <section className="section impact-section">
        <div className="container">
          <div className="section-header">
            <h2>Your Impact Matters</h2>
            <p className="section-subtitle">Track your environmental contribution</p>
          </div>

          <div className="impact-tracker">
            <div className="impact-stat">
              <div className="impact-number">2,700</div>
              <div className="impact-label">Liters of Water Saved</div>
              <div className="impact-bar">
                <div className="impact-fill" style={{ width: '85%' }}></div>
              </div>
            </div>

            <div className="impact-stat">
              <div className="impact-number">1.5</div>
              <div className="impact-label">kg CO2 Reduced</div>
              <div className="impact-bar">
                <div className="impact-fill" style={{ width: '60%' }}></div>
              </div>
            </div>

            <div className="impact-stat">
              <div className="impact-number">0.2</div>
              <div className="impact-label">kg Waste Prevented</div>
              <div className="impact-bar">
                <div className="impact-fill" style={{ width: '40%' }}></div>
              </div>
            </div>

            <div className="impact-stat">
              <div className="impact-number">150</div>
              <div className="impact-label">Reward Points</div>
              <div className="impact-bar">
                <div className="impact-fill" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          TESTIMONIALS SECTION
          ============================================ */}
      <section className="section testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>What Our Users Say</h2>
            <p className="section-subtitle">Real stories from real people</p>
          </div>

          <div className="testimonials-grid">
            <div className="testimonial-card card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "ReWear helped me save my favorite jacket! The process was so easy and the tailor did an amazing job. Plus, I love tracking my environmental impact!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👩</div>
                <div>
                  <div className="author-name">Sarah Johnson</div>
                  <div className="author-role">Fashion Enthusiast</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "As a tailor, ReWear has been a game-changer. I get consistent bookings and the platform makes it easy to manage everything. Highly recommended!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👨</div>
                <div>
                  <div className="author-name">Rajesh Kumar</div>
                  <div className="author-role">Professional Tailor</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">
                "I've saved so much money and reduced my environmental footprint. ReWear is the future of sustainable fashion. Love it!"
              </p>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍🦱</div>
                <div>
                  <div className="author-name">Emma Wilson</div>
                  <div className="author-role">Eco-Conscious Shopper</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          CTA SECTION
          ============================================ */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Make a Difference?</h2>
            <p>Join thousands of people choosing sustainable fashion</p>
            <div className="cta-buttons">
              {user ? (
                <Link to="/booking/new" className="btn btn-primary btn-lg">
                  Start Your First Repair
                </Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary btn-lg">
                    Become a User
                  </Link>
                  <Link to="/signup?role=tailor" className="btn btn-secondary btn-lg">
                    Become a Tailor
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-section">
              <h4>ReWear</h4>
              <p>Making sustainable fashion accessible to everyone</p>
            </div>
            <div className="footer-section">
              <h5>Quick Links</h5>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h5>For Users</h5>
              <ul>
                <li><Link to="/booking/new">Create Booking</Link></li>
                <li><Link to="/tailors/nearby">Find Tailors</Link></li>
                <li><Link to="/dashboard">Dashboard</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h5>For Tailors</h5>
              <ul>
                <li><Link to="/signup?role=tailor">Join as Tailor</Link></li>
                <li><Link to="/tailor-dashboard">Dashboard</Link></li>
                <li><Link to="/profile">Profile</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2024 ReWear. All rights reserved. | Sustainable Fashion for Everyone</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
