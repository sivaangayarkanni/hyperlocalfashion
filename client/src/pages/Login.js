import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '', role: 'user' });
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(formData.email, formData.password);
      toast.success(`Welcome back, ${data.user.name}!`);
      
      // Navigate based on user's actual role from database
      if (data.user.role === 'tailor') {
        navigate('/tailor-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-scale-in">
        <div className="auth-header">
          <h1 className="gradient-text">🧵 ReWear</h1>
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Login to continue your sustainable fashion journey</p>
        </div>
        
        {/* Role Selection */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-btn ${formData.role === 'user' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, role: 'user' })}
          >
            <span className="role-icon">👤</span>
            <span className="role-label">Customer</span>
          </button>
          <button
            type="button"
            className={`role-btn ${formData.role === 'tailor' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, role: 'tailor' })}
          >
            <span className="role-icon">✂️</span>
            <span className="role-label">Tailor</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
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
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            Login as {formData.role === 'tailor' ? 'Tailor' : 'Customer'}
          </button>
        </form>
        
        <div className="auth-divider">
          <span>or</span>
        </div>
        
        <p className="auth-footer">
          Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
