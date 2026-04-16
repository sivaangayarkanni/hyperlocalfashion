import React, { useState, useEffect } from 'react';
import '../styles/CustomAvatar.css';

const CustomAvatar = ({ 
  userId, 
  name, 
  size = 'medium', 
  customization = null,
  editable = false,
  onUpdate = null 
}) => {
  const [avatar, setAvatar] = useState({
    backgroundColor: '#4299e1',
    pattern: 'geometric',
    icon: '👤',
    borderColor: '#2d3748',
    ...customization
  });

  const [isEditing, setIsEditing] = useState(false);

  const patterns = ['geometric', 'waves', 'dots', 'stripes', 'gradient'];
  const colors = ['#4299e1', '#38a169', '#ed8936', '#805ad5', '#e53e3e', '#d69e2e'];
  const icons = ['👤', '🎨', '✨', '🌟', '💎', '🔥', '🌈', '⚡', '🎯', '🚀'];

  useEffect(() => {
    if (customization) {
      setAvatar(prev => ({ ...prev, ...customization }));
    }
  }, [customization]);

  const getInitials = () => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getSizeClass = () => {
    const sizes = {
      small: 'avatar-small',
      medium: 'avatar-medium',
      large: 'avatar-large',
      xlarge: 'avatar-xlarge'
    };
    return sizes[size] || sizes.medium;
  };

  const getPatternSVG = () => {
    switch (avatar.pattern) {
      case 'geometric':
        return (
          <svg className="avatar-pattern" viewBox="0 0 100 100">
            <defs>
              <pattern id="geometric" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="10" height="10" fill="rgba(255,255,255,0.1)" />
                <rect x="10" y="10" width="10" height="10" fill="rgba(255,255,255,0.1)" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#geometric)" />
          </svg>
        );
      
      case 'waves':
        return (
          <svg className="avatar-pattern" viewBox="0 0 100 100">
            <path d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z" fill="rgba(255,255,255,0.1)" />
            <path d="M0,60 Q25,40 50,60 T100,60 L100,100 L0,100 Z" fill="rgba(255,255,255,0.05)" />
          </svg>
        );
      
      case 'dots':
        return (
          <svg className="avatar-pattern" viewBox="0 0 100 100">
            <defs>
              <pattern id="dots" x="0" y="0" width="15" height="15" patternUnits="userSpaceOnUse">
                <circle cx="7.5" cy="7.5" r="2" fill="rgba(255,255,255,0.15)" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#dots)" />
          </svg>
        );
      
      case 'stripes':
        return (
          <svg className="avatar-pattern" viewBox="0 0 100 100">
            <defs>
              <pattern id="stripes" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect x="0" y="0" width="5" height="10" fill="rgba(255,255,255,0.1)" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#stripes)" />
          </svg>
        );
      
      case 'gradient':
        return (
          <svg className="avatar-pattern" viewBox="0 0 100 100">
            <defs>
              <radialGradient id="grad">
                <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>
            <rect width="100" height="100" fill="url(#grad)" />
          </svg>
        );
      
      default:
        return null;
    }
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(avatar);
    }
    setIsEditing(false);
  };

  return (
    <div className={`custom-avatar-container ${getSizeClass()}`}>
      <div 
        className="custom-avatar"
        style={{ 
          backgroundColor: avatar.backgroundColor,
          borderColor: avatar.borderColor
        }}
        onClick={() => editable && setIsEditing(true)}
      >
        {getPatternSVG()}
        
        <div className="avatar-content">
          {avatar.icon !== '👤' ? (
            <span className="avatar-icon">{avatar.icon}</span>
          ) : (
            <span className="avatar-initials">{getInitials()}</span>
          )}
        </div>

        {editable && (
          <div className="avatar-edit-indicator">
            <span>✏️</span>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="avatar-editor-modal">
          <div className="avatar-editor">
            <h3>Customize Your Avatar</h3>
            
            <div className="editor-section">
              <label>Background Color</label>
              <div className="color-picker">
                {colors.map(color => (
                  <button
                    key={color}
                    className={`color-option ${avatar.backgroundColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setAvatar(prev => ({ ...prev, backgroundColor: color }))}
                  />
                ))}
              </div>
            </div>

            <div className="editor-section">
              <label>Pattern</label>
              <div className="pattern-picker">
                {patterns.map(pattern => (
                  <button
                    key={pattern}
                    className={`pattern-option ${avatar.pattern === pattern ? 'active' : ''}`}
                    onClick={() => setAvatar(prev => ({ ...prev, pattern }))}
                  >
                    {pattern}
                  </button>
                ))}
              </div>
            </div>

            <div className="editor-section">
              <label>Icon</label>
              <div className="icon-picker">
                {icons.map(icon => (
                  <button
                    key={icon}
                    className={`icon-option ${avatar.icon === icon ? 'active' : ''}`}
                    onClick={() => setAvatar(prev => ({ ...prev, icon }))}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="editor-actions">
              <button onClick={() => setIsEditing(false)} className="btn-cancel">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-save">
                Save Avatar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomAvatar;