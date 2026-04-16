import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Redirects a logged-in tailor to their own public profile page
const TailorOwnProfile = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.tailorId) {
      navigate(`/tailor/${user.tailorId}`, { replace: true });
    } else if (user && !user.tailorId) {
      // Tailor profile not set up yet
      navigate('/tailor-dashboard', { replace: true });
    }
  }, [user, navigate]);

  return <div className="loading">Loading profile...</div>;
};

export default TailorOwnProfile;
