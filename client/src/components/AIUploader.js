import React, { useState, useRef } from 'react';
import '../styles/AIUploader.css';

const AIUploader = ({ onAnalysisComplete, bookingId }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        setError('Please select a JPEG, PNG, or WebP image');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }

      setSelectedImage(file);
      setError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Simulate file input change
      const fakeEvent = { target: { files: [file] } };
      handleImageSelect(fakeEvent);
    }
  };

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const simulateAIAnalysis = async (imageFile) => {
    // Simulate AI analysis with realistic results
    await new Promise(resolve => setTimeout(resolve, 3000));

    const damageTypes = ['tear', 'loose_seam', 'missing_button', 'fitting_issue', 'stain', 'zipper_problem', 'hole', 'fraying', 'discoloration'];
    const severities = ['minor', 'moderate', 'severe'];
    const garmentTypes = ['shirt', 'pants', 'dress', 'jacket', 'skirt', 'traditional_wear', 'formal_wear'];

    const selectedDamage = damageTypes[Math.floor(Math.random() * damageTypes.length)];
    const selectedSeverity = severities[Math.floor(Math.random() * severities.length)];
    const selectedGarment = garmentTypes[Math.floor(Math.random() * garmentTypes.length)];
    const confidence = 0.6 + Math.random() * 0.4; // 60-100%

    return {
      damageTypes: [selectedDamage],
      severity: selectedSeverity,
      garmentType: selectedGarment,
      confidence: confidence,
      imageUrl: URL.createObjectURL(imageFile)
    };
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Compress image
      const compressedImage = await compressImage(selectedImage);
      
      // Simulate AI analysis (in production, this would call the actual AI service)
      const aiResult = await simulateAIAnalysis(compressedImage);

      // Call API to store analysis
      const response = await fetch('/api/ai/analyze-damage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...aiResult,
          bookingId
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysisResult(result.data);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(result.data);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="ai-uploader">
      <div className="upload-section">
        <h3>AI Damage Detection</h3>
        <p>Upload an image of your garment for instant damage analysis</p>

        {!imagePreview ? (
          <div 
            className="upload-area"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">📷</div>
            <p>Drag & drop an image here or click to select</p>
            <small>Supports JPEG, PNG, WebP (max 10MB)</small>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div className="image-preview">
            <img src={imagePreview} alt="Selected garment" />
            <div className="image-actions">
              <button onClick={handleReset} className="btn-secondary">
                Change Image
              </button>
              <button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                className="btn-primary"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Damage'}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </div>

      {isAnalyzing && (
        <div className="analysis-progress">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <p>AI is analyzing your garment...</p>
        </div>
      )}

      {analysisResult && (
        <div className="analysis-result">
          <h4>Analysis Complete</h4>
          
          {analysisResult.lowConfidenceWarning && (
            <div className="warning-message">
              <span className="warning-icon">⚠️</span>
              Low confidence detection. Results may not be accurate.
            </div>
          )}

          <div className="result-grid">
            <div className="result-item">
              <label>Damage Type:</label>
              <span className="damage-type">
                {analysisResult.damageTypes.join(', ').replace(/_/g, ' ')}
              </span>
            </div>

            <div className="result-item">
              <label>Severity:</label>
              <span className={`severity ${analysisResult.severity}`}>
                {analysisResult.severity}
              </span>
            </div>

            <div className="result-item">
              <label>Garment Type:</label>
              <span>{analysisResult.garmentType.replace(/_/g, ' ')}</span>
            </div>

            <div className="result-item">
              <label>Confidence:</label>
              <span className="confidence">
                {Math.round(analysisResult.confidence * 100)}%
              </span>
            </div>
          </div>

          {analysisResult.recommendations && (
            <div className="recommendations">
              <h5>Recommendations</h5>
              <div className="recommendation-item">
                <label>Estimated Cost:</label>
                <span>₹{analysisResult.recommendations.estimatedCost.min} - ₹{analysisResult.recommendations.estimatedCost.max}</span>
              </div>
              <div className="recommendation-item">
                <label>Estimated Time:</label>
                <span>{analysisResult.recommendations.estimatedTime}</span>
              </div>
              <div className="recommendation-item">
                <label>Recommended Tailor:</label>
                <span>{analysisResult.recommendations.tailorSpecialization}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIUploader;