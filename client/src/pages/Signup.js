import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'user',
    shopName: '',
    experience: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
  });

  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await signup(formData);
      toast.success('Account created successfully!');
      navigate(data.user.role === 'tailor' ? '/tailor-dashboard' : '/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-scale-in">
        <div className="auth-header">
          <h1 className="gradient-text">🧵 ReWear</h1>
          <h2>Create Account</h2>
          <p className="auth-subtitle">Join the sustainable fashion revolution</p>
        </div>
        
        {/* Role Selection */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-btn ${formData.role === 'user' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, role: 'user' })}
          >
            <span className="role-icon">👤</span>
            <div className="role-content">
              <span className="role-label">Customer</span>
              <span className="role-desc">Find tailors & repair clothes</span>
            </div>
          </button>
          <button
            type="button"
            className={`role-btn ${formData.role === 'tailor' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, role: 'tailor' })}
          >
            <span className="role-icon">✂️</span>
            <div className="role-content">
              <span className="role-label">Tailor</span>
              <span className="role-desc">Offer services & grow business</span>
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              required
              minLength="6"
            />
          </div>
          
          {formData.role === 'tailor' && (
            <>
              <div className="form-divider">
                <span>Tailor Information</span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Shop Name</label>
                  <input
                    type="text"
                    name="shopName"
                    value={formData.shopName}
                    onChange={handleChange}
                    placeholder="Your shop name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="Years"
                    required
                    min="0"
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-divider">
            <span>Location Details</span>
          </div>

          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
              />
            </div>
            <div className="form-group">
              <label>Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="Pincode"
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary btn-block">
            Create {formData.role === 'tailor' ? 'Tailor' : 'Customer'} Account
          </button>
        </form>
        
        <div className="auth-divider">
          <span>or</span>
        </div>
        
        <p className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
