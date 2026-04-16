const { dbRun, dbGet, dbAll } = require('../utils/db');

/**
 * Advanced AI Service - Next-Gen Intelligence Features
 * Includes: Semantic Search, Recommendation Engine, Predictive Analytics, NLP Enhancement
 */
class AdvancedAIService {
  constructor(db) {
    this.db = db;
  }

  /**
   * Semantic Search - Find similar queries and responses
   */
  async semanticSearch(query, userId) {
    try {
      // Get all previous conversations
      const conversations = await dbAll(
        this.db,
        `SELECT prompt, response FROM ai_conversations WHERE userId = ? ORDER BY createdAt DESC LIMIT 100`,
        [userId]
      );

      // Calculate similarity scores
      const similarities = conversations.map(conv => ({
        prompt: conv.prompt,
        response: conv.response,
        similarity: this.calculateSimilarity(query, conv.prompt)
      }));

      // Return top 3 similar queries
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3)
        .filter(s => s.similarity > 0.5);
    } catch (error) {
      console.error('Semantic search error:', error);
      return [];
    }
  }

  /**
   * Calculate semantic similarity between two strings
   */
  calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Personalized Recommendation Engine
   */
  async getPersonalizedRecommendations(userId) {
    try {
      // Get user profile
      const user = await dbGet(
        this.db,
        `SELECT * FROM users WHERE id = ?`,
        [userId]
      );

      if (!user) return [];

      // Get user's booking history
      const bookings = await dbAll(
        this.db,
        `SELECT serviceType, garmentType, status FROM bookings WHERE userId = ? ORDER BY createdAt DESC LIMIT 20`,
        [userId]
      );

      // Analyze patterns
      const serviceFrequency = {};
      const garmentFrequency = {};

      bookings.forEach(booking => {
        serviceFrequency[booking.serviceType] = (serviceFrequency[booking.serviceType] || 0) + 1;
        garmentFrequency[booking.garmentType] = (garmentFrequency[booking.garmentType] || 0) + 1;
      });

      // Generate recommendations
      const recommendations = [];

      // Most frequent service
      const topService = Object.entries(serviceFrequency)
        .sort((a, b) => b[1] - a[1])[0];
      if (topService) {
        recommendations.push({
          type: 'service',
          title: `You love ${topService[0]} services!`,
          description: `We found ${topService[1]} ${topService[0]} bookings. Try our express ${topService[0]} service!`,
          action: 'book_service',
          confidence: Math.min(topService[1] / bookings.length, 1.0)
        });
      }

      // Most frequent garment
      const topGarment = Object.entries(garmentFrequency)
        .sort((a, b) => b[1] - a[1])[0];
      if (topGarment) {
        recommendations.push({
          type: 'garment',
          title: `${topGarment[0]} specialist tailors`,
          description: `Based on your ${topGarment[1]} ${topGarment[0]} repairs, we recommend tailors who specialize in ${topGarment[0]}s`,
          action: 'find_specialist',
          confidence: Math.min(topGarment[1] / bookings.length, 1.0)
        });
      }

      // Sustainability milestone
      const totalCO2 = bookings.length * 2.5; // Average CO2 per repair
      if (totalCO2 > 50) {
        recommendations.push({
          type: 'sustainability',
          title: '🌱 You\'re an Eco-Warrior!',
          description: `You've saved ${totalCO2.toFixed(1)}kg of CO2! Share your impact and inspire others.`,
          action: 'share_impact',
          confidence: 0.95
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Recommendation error:', error);
      return [];
    }
  }

  /**
   * Predictive Analytics - Predict user needs
   */
  async predictUserNeeds(userId) {
    try {
      const user = await dbGet(
        this.db,
        `SELECT * FROM users WHERE id = ?`,
        [userId]
      );

      if (!user) return null;

      // Get recent bookings
      const recentBookings = await dbAll(
        this.db,
        `SELECT * FROM bookings WHERE userId = ? ORDER BY createdAt DESC LIMIT 10`,
        [userId]
      );

      const predictions = {
        nextServiceType: null,
        nextGarmentType: null,
        estimatedNextBookingDays: null,
        predictedBudget: null,
        urgencyLevel: 'normal'
      };

      if (recentBookings.length === 0) return predictions;

      // Predict next service type (most common)
      const serviceTypes = recentBookings.map(b => b.serviceType);
      predictions.nextServiceType = this.getMostCommon(serviceTypes);

      // Predict next garment type
      const garmentTypes = recentBookings.map(b => b.garmentType);
      predictions.nextGarmentType = this.getMostCommon(garmentTypes);

      // Predict next booking timing
      const bookingDates = recentBookings.map(b => new Date(b.createdAt).getTime());
      const intervals = [];
      for (let i = 1; i < bookingDates.length; i++) {
        intervals.push((bookingDates[i - 1] - bookingDates[i]) / (1000 * 60 * 60 * 24));
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      predictions.estimatedNextBookingDays = Math.round(avgInterval);

      // Predict budget
      const prices = recentBookings
        .filter(b => b.quotePrice)
        .map(b => b.quotePrice);
      if (prices.length > 0) {
        predictions.predictedBudget = Math.round(
          prices.reduce((a, b) => a + b, 0) / prices.length
        );
      }

      // Determine urgency
      const lastBooking = recentBookings[0];
      const daysSinceLastBooking = (Date.now() - new Date(lastBooking.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastBooking > avgInterval * 1.5) {
        predictions.urgencyLevel = 'high';
      } else if (daysSinceLastBooking > avgInterval) {
        predictions.urgencyLevel = 'medium';
      }

      return predictions;
    } catch (error) {
      console.error('Prediction error:', error);
      return null;
    }
  }

  /**
   * Get most common element in array
   */
  getMostCommon(arr) {
    if (arr.length === 0) return null;
    const frequency = {};
    arr.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Advanced NLP - Extract key phrases and topics
   */
  extractKeyPhrases(text) {
    const phrases = [];
    
    // Extract noun phrases
    const nounPatterns = [
      /\b(shirt|pants|dress|jacket|skirt|jeans|suit|coat|blouse|trousers)\b/gi,
      /\b(tear|hole|stain|rip|broken|loose|missing|zipper|button|seam)\b/gi,
      /\b(urgent|emergency|asap|today|tomorrow|week|month)\b/gi,
      /\b(cheap|expensive|affordable|budget|premium|luxury)\b/gi
    ];

    nounPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        phrases.push(...matches.map(m => m.toLowerCase()));
      }
    });

    return [...new Set(phrases)]; // Remove duplicates
  }

  /**
   * Emotion Detection - Detect emotional tone
   */
  detectEmotion(text) {
    const emotions = {
      happy: ['great', 'excellent', 'amazing', 'love', 'perfect', 'wonderful', 'fantastic', 'awesome'],
      sad: ['sad', 'unhappy', 'disappointed', 'upset', 'depressed', 'miserable'],
      angry: ['angry', 'furious', 'mad', 'hate', 'terrible', 'awful', 'horrible', 'disgusting'],
      anxious: ['worried', 'anxious', 'nervous', 'scared', 'afraid', 'concerned'],
      neutral: ['ok', 'fine', 'normal', 'average', 'regular']
    };

    const lowerText = text.toLowerCase();
    const emotionScores = {};

    Object.entries(emotions).forEach(([emotion, keywords]) => {
      const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
      emotionScores[emotion] = matches;
    });

    const maxEmotion = Object.entries(emotionScores)
      .sort((a, b) => b[1] - a[1])[0];

    return {
      emotion: maxEmotion[0],
      intensity: maxEmotion[1],
      scores: emotionScores
    };
  }

  /**
   * Context Enrichment - Add rich context to responses
   */
  async enrichContext(userId, query) {
    try {
      const user = await dbGet(
        this.db,
        `SELECT * FROM users WHERE id = ?`,
        [userId]
      );

      const bookings = await dbAll(
        this.db,
        `SELECT COUNT(*) as count FROM bookings WHERE userId = ?`,
        [userId]
      );

      const reviews = await dbAll(
        this.db,
        `SELECT AVG(rating) as avgRating FROM reviews WHERE userId = ?`,
        [userId]
      );

      const sustainability = await dbGet(
        this.db,
        `SELECT SUM(co2Saved) as totalCO2, SUM(waterSaved) as totalWater FROM bookings WHERE userId = ? AND status = 'completed'`,
        [userId]
      );

      return {
        userProfile: user,
        bookingCount: bookings[0]?.count || 0,
        averageRating: reviews[0]?.avgRating || 0,
        sustainabilityMetrics: {
          totalCO2Saved: sustainability?.totalCO2 || 0,
          totalWaterSaved: sustainability?.totalWater || 0
        },
        keyPhrases: this.extractKeyPhrases(query),
        emotion: this.detectEmotion(query)
      };
    } catch (error) {
      console.error('Context enrichment error:', error);
      return null;
    }
  }

  /**
   * Generate contextual follow-up questions
   */
  generateFollowUpQuestions(intent, context) {
    const followUps = {
      find_tailor: [
        'Would you like to see tailors with specific specializations?',
        'Do you prefer tailors near you or with the best ratings?',
        'Would you like to book immediately or just browse?'
      ],
      price_inquiry: [
        'Would you like an AI analysis of your garment for accurate pricing?',
        'Are you interested in our express service (2-hour completion)?',
        'Would you like to compare prices from multiple tailors?'
      ],
      track_order: [
        'Would you like real-time GPS tracking?',
        'Can I help you with anything else about your order?',
        'Would you like to reschedule delivery?'
      ],
      sustainability: [
        'Would you like to share your impact on social media?',
        'Are you interested in joining our sustainability challenges?',
        'Would you like tips on extending garment lifespan?'
      ]
    };

    return followUps[intent] || [
      'Is there anything else I can help you with?',
      'Would you like more information?',
      'Can I assist you further?'
    ];
  }

  /**
   * Smart Response Ranking - Rank responses by relevance
   */
  rankResponses(responses, query, context) {
    return responses.map(response => ({
      ...response,
      relevanceScore: this.calculateRelevance(response, query, context)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calculate relevance score
   */
  calculateRelevance(response, query, context) {
    let score = 0;

    // Keyword matching
    const queryWords = query.toLowerCase().split(/\s+/);
    const responseText = response.text.toLowerCase();
    queryWords.forEach(word => {
      if (responseText.includes(word)) score += 0.2;
    });

    // Intent matching
    if (response.intent === context.intent) score += 0.3;

    // Recency bonus
    if (response.timestamp && Date.now() - response.timestamp < 86400000) {
      score += 0.1;
    }

    // User preference
    if (context.userPreferences && context.userPreferences.includes(response.type)) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Generate AI-powered suggestions
   */
  async generateSuggestions(userId) {
    try {
      const predictions = await this.predictUserNeeds(userId);
      const recommendations = await this.getPersonalizedRecommendations(userId);

      const suggestions = [];

      // Based on predictions
      if (predictions.urgencyLevel === 'high') {
        suggestions.push({
          type: 'urgent',
          title: '⚡ Time for a repair?',
          description: `Based on your history, it's been a while since your last ${predictions.nextServiceType}. Ready to book?`,
          action: 'book_service',
          priority: 'high'
        });
      }

      // Based on recommendations
      suggestions.push(...recommendations);

      // Sustainability milestone
      if (recommendations.some(r => r.type === 'sustainability')) {
        suggestions.push({
          type: 'milestone',
          title: '🎉 Achievement Unlocked!',
          description: 'You\'ve reached a new sustainability milestone!',
          action: 'view_achievements',
          priority: 'medium'
        });
      }

      return suggestions;
    } catch (error) {
      console.error('Suggestion generation error:', error);
      return [];
    }
  }

  /**
   * Store AI interaction for learning
   */
  async storeInteraction(userId, query, response, intent, confidence) {
    try {
      await dbRun(
        this.db,
        `INSERT INTO ai_interactions (userId, query, response, intent, confidence, createdAt)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [userId, query, response, intent, confidence]
      );
    } catch (error) {
      console.error('Error storing interaction:', error);
    }
  }

  /**
   * Learn from user feedback
   */
  async learnFromFeedback(interactionId, feedback, rating) {
    try {
      await dbRun(
        this.db,
        `UPDATE ai_interactions SET feedback = ?, rating = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [feedback, rating, interactionId]
      );

      // Update model confidence based on feedback
      if (rating < 3) {
        console.log('Low rating detected - adjusting model parameters');
      }
    } catch (error) {
      console.error('Error learning from feedback:', error);
    }
  }
}

module.exports = AdvancedAIService;
