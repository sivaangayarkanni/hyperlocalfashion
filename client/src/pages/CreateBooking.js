import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './CreateBooking.css';

const CreateBooking = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [tailors, setTailors] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTailor, setSelectedTailor] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    serviceType: 'repair',
    garmentType: '',
    description: '',
    pickupAddress: '',
    deliveryAddress: '',
    pickupMethod: 'pickup',
    tailorId: ''
  });

  const serviceTypes = [
    { id: 'repair', name: 'Repair', icon: '🔧', desc: 'Fix tears, holes, and damage' },
    { id: 'alteration', name: 'Alteration', icon: '📏', desc: 'Adjust fit and size' },
    { id: 'stitching', name: 'Custom Stitching', icon: '🪡', desc: 'Create custom designs' }
  ];

  useEffect(() => {
    if (step === 1) {
      getLocation();
    }
  }, [step]);

  useEffect(() => {
    if (step === 5 && location) {
      fetchNearbyTailors();
    }
  }, [step, location]);

  const getLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          setFormData(prev => ({
            ...prev,
            pickupAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          }));
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.warning('Please enable location access to find nearby tailors');
        }
      );
    }
  };

  const fetchNearbyTailors = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/tailors');
      setTailors(res.data.tailors || []);
    } catch (error) {
      console.error('Error fetching tailors:', error);
      toast.error('Failed to fetch tailors');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleServiceSelect = (serviceId) => {
    setFormData({ ...formData, serviceType: serviceId });
  };

  const handleTailorSelect = (tailor) => {
    setSelectedTailor(tailor);
    setFormData({ ...formData, tailorId: tailor.id });
  };

  const handlePickupMethodSelect = (method) => {
    setFormData({ ...formData, pickupMethod: method });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!location) {
        toast.error('Please enable location access');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.serviceType) {
        toast.error('Please select a service type');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!formData.garmentType || !formData.description) {
        toast.error('Please fill in all fields');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!previewImage) {
        toast.error('Please upload an image');
        return;
      }
      setStep(5);
    } else if (step === 5) {
      if (!selectedTailor) {
        toast.error('Please select a tailor');
        return;
      }
      setStep(6);
    } else if (step === 6) {
      if (!formData.pickupAddress) {
        toast.error('Please enter pickup address');
        return;
      }
      setStep(7);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await axios.post('/api/bookings', {
        tailorId: parseInt(formData.tailorId),
        serviceType: formData.serviceType,
        garmentType: formData.garmentType,
        description: formData.description,
        pickupAddress: formData.pickupAddress,
        deliveryAddress: formData.deliveryAddress || formData.pickupAddress,
        images: []
      });

      toast.success('Booking created successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-booking">
      <div className="progress-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 7) * 100}%` }}></div>
        </div>
        <div className="step-indicators">
          {[1, 2, 3, 4, 5, 6, 7].map(s => (
            <div key={s} className={`step-indicator ${s === step ? 'active' : ''} ${s < step ? 'completed' : ''}`}>
              {s < step ? '✓' : s}
            </div>
          ))}
        </div>
      </div>

      <div className="booking-header">
        <button onClick={handleBack} className="btn-back">← Back</button>
        <h2>Book a Tailor Service</h2>
        <span className="step-counter">Step {step} of 7</span>
      </div>

      {step === 1 && (
        <div className="booking-step">
          <div className="step-content">
            <div className="step-icon">📍</div>
            <h3>Enable Location</h3>
            <p>We'll use your location to find nearby tailors</p>
            <div className="location-status">
              {location ? (
                <div className="location-found">
                  <div className="status-icon">✓</div>
                  <p>Location detected!</p>
                  <small>{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</small>
                </div>
              ) : (
                <div className="location-loading">
                  <div className="spinner"></div>
                  <p>Detecting your location...</p>
                </div>
              )}
            </div>
          </div>
          <button onClick={handleNext} className="btn btn-primary btn-block" disabled={!location}>
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="booking-step">
          <div className="step-content">
            <h3>What service do you need?</h3>
            <div className="service-grid">
              {serviceTypes.map(service => (
                <div
                  key={service.id}
                  className={`service-card ${formData.serviceType === service.id ? 'selected' : ''}`}
                  onClick={() => handleServiceSelect(service.id)}
                >
                  <div className="service-icon">{service.icon}</div>
                  <h4>{service.name}</h4>
                  <p>{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleNext} className="btn btn-primary btn-block">
            Continue
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="booking-step">
          <div className="step-content">
            <h3>Tell us about your garment</h3>
            <div className="form-group">
              <label>Garment Type</label>
              <input
                type="text"
                name="garmentType"
                value={formData.garmentType}
                onChange={(e) => setFormData({ ...formData, garmentType: e.target.value })}
                placeholder="e.g., Jeans, Shirt, Dress"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what needs to be done..."
                rows="4"
                className="form-input"
              />
            </div>
          </div>
          <button onClick={handleNext} className="btn btn-primary btn-block">
            Continue
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="booking-step">
          <div className="step-content">
            <h3>Upload a photo</h3>
            <p>Help tailors understand what needs to be done</p>
            <div className="image-upload-area">
              {previewImage ? (
                <div className="image-preview">
                  <img src={previewImage} alt="Preview" />
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label className="upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                  />
                  <div className="upload-content">
                    <div className="upload-icon">📸</div>
                    <p>Click to upload or drag and drop</p>
                    <small>PNG, JPG up to 5MB</small>
                  </div>
                </label>
              )}
            </div>
          </div>
          <button onClick={handleNext} className="btn btn-primary btn-block" disabled={!previewImage}>
            Continue
          </button>
        </div>
      )}

      {step === 5 && (
        <div className="booking-step">
          <div className="step-content">
            <h3>Choose a tailor</h3>
            <p>Select from nearby tailors</p>
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Finding tailors near you...</p>
              </div>
            ) : tailors.length > 0 ? (
              <div className="tailors-list">
                {tailors.map(tailor => (
                  <div
                    key={tailor.id}
                    className={`tailor-card ${selectedTailor?.id === tailor.id ? 'selected' : ''}`}
                    onClick={() => handleTailorSelect(tailor)}
                  >
                    <div className="tailor-header">
                      <h4>{tailor.shopName}</h4>
                      <div className="rating">⭐ {(tailor.averageRating || 0).toFixed(1)}</div>
                    </div>
                    <p className="experience">{tailor.experience} years experience</p>
                    <div className="tailor-stats">
                      <span>{tailor.completedOrders} orders</span>
                      {tailor.isVerified && <span className="verified">✓ Verified</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No tailors found nearby</p>
              </div>
            )}
          </div>
          <button onClick={handleNext} className="btn btn-primary btn-block" disabled={!selectedTailor}>
            Continue
          </button>
        </div>
      )}

      {step === 6 && (
        <div className="booking-step">
          <div className="step-content">
            <h3>Pickup or Delivery?</h3>
            <div className="method-grid">
              <div
                className={`method-card ${formData.pickupMethod === 'pickup' ? 'selected' : ''}`}
                onClick={() => handlePickupMethodSelect('pickup')}
              >
                <div className="method-icon">🚚</div>
                <h4>We'll Pick Up</h4>
                <p>We'll collect from your address</p>
              </div>
              <div
                className={`method-card ${formData.pickupMethod === 'drop' ? 'selected' : ''}`}
                onClick={() => handlePickupMethodSelect('drop')}
              >
                <div className="method-icon">🏪</div>
                <h4>I'll Drop Off</h4>
                <p>I'll visit the tailor shop</p>
              </div>
            </div>
            <div className="form-group">
              <label>Your Address</label>
              <textarea
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                placeholder="Enter your address"
                rows="3"
                className="form-input"
              />
            </div>
          </div>
          <button onClick={handleNext} className="btn btn-primary btn-block">
            Continue
          </button>
        </div>
      )}

      {step === 7 && (
        <div className="booking-step">
          <div className="step-content">
            <h3>Confirm Your Booking</h3>
            <div className="confirmation-summary">
              <div className="summary-section">
                <h4>Service Details</h4>
                <p><strong>Service:</strong> {serviceTypes.find(s => s.id === formData.serviceType)?.name}</p>
                <p><strong>Garment:</strong> {formData.garmentType}</p>
                <p><strong>Description:</strong> {formData.description}</p>
              </div>
              <div className="summary-section">
                <h4>Tailor</h4>
                <p><strong>Shop:</strong> {selectedTailor?.shopName}</p>
                <p><strong>Rating:</strong> ⭐ {(selectedTailor?.averageRating || 0).toFixed(1)}</p>
                <p><strong>Experience:</strong> {selectedTailor?.experience} years</p>
              </div>
              <div className="summary-section">
                <h4>Pickup Details</h4>
                <p><strong>Method:</strong> {formData.pickupMethod === 'pickup' ? 'We\'ll Pick Up' : 'I\'ll Drop Off'}</p>
                <p><strong>Address:</strong> {formData.pickupAddress}</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Creating Booking...' : 'Confirm & Book'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateBooking;
