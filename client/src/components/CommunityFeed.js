import React, { useState, useEffect } from 'react';
import '../styles/CommunityFeed.css';

const CommunityFeed = ({ userId }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/sustainability-advanced/feed?page=${pageNum}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }

      const result = await response.json();
      
      if (pageNum === 1) {
        setStories(result.data.stories);
      } else {
        setStories(prev => [...prev, ...result.data.stories]);
      }
      
      setHasMore(result.data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setError('Failed to load community stories');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (storyId) => {
    try {
      const response = await fetch(`/api/sustainability-advanced/stories/${storyId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to like story');
      }

      const result = await response.json();
      
      // Update local state
      setStories(prev => prev.map(story => 
        story.id === storyId 
          ? { ...story, likes: result.data.likes }
          : story
      ));
    } catch (error) {
      console.error('Error liking story:', error);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchStories(page + 1);
    }
  };

  if (loading && stories.length === 0) {
    return (
      <div className="community-feed loading">
        <div className="loading-spinner"></div>
        <p>Loading community stories...</p>
      </div>
    );
  }

  if (error && stories.length === 0) {
    return (
      <div className="community-feed error">
        <div className="error-icon">📖</div>
        <p>{error}</p>
        <button onClick={() => fetchStories(1)} className="btn-retry">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="community-feed">
      <div className="feed-header">
        <h2>Community Repair Stories</h2>
        <p>Discover inspiring repair journeys from our community</p>
      </div>

      <div className="stories-grid">
        {stories.map(story => (
          <div key={story.id} className={`story-card ${story.featured ? 'featured' : ''}`}>
            {story.featured && (
              <div className="featured-badge">
                <span className="badge-icon">⭐</span>
                <span>Featured</span>
              </div>
            )}

            <div className="story-images">
              <div className="image-container before">
                <img src={story.beforeImage} alt="Before repair" />
                <div className="image-label">Before</div>
              </div>
              <div className="image-divider">→</div>
              <div className="image-container after">
                <img src={story.afterImage} alt="After repair" />
                <div className="image-label">After</div>
              </div>
            </div>

            <div className="story-content">
              <h3 className="story-title">{story.title}</h3>
              {story.description && (
                <p className="story-description">{story.description}</p>
              )}

              <div className="story-meta">
                <div className="author-info">
                  <div className="author-avatar">
                    {story.avatar ? (
                      <img src={story.avatar} alt={story.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {story.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="author-details">
                    <span className="author-name">{story.name}</span>
                    <span className="story-date">
                      {new Date(story.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="story-actions">
                  <button 
                    className="like-btn"
                    onClick={() => handleLike(story.id)}
                  >
                    <span className="like-icon">❤️</span>
                    <span className="like-count">{story.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="load-more">
          <button 
            onClick={loadMore} 
            disabled={loading}
            className="btn-load-more"
          >
            {loading ? 'Loading...' : 'Load More Stories'}
          </button>
        </div>
      )}

      {stories.length === 0 && !loading && (
        <div className="empty-feed">
          <div className="empty-icon">📖</div>
          <h3>No Stories Yet</h3>
          <p>Be the first to share your repair story with the community!</p>
        </div>
      )}
    </div>
  );
};

export default CommunityFeed;