// src/services/aiService.js
const axios = require('axios');
const FormData = require('form-data');

class AIService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.timeout = 30000; // 30 seconds timeout
  }

  /**
   * Parse resume using AI service
   * @param {Buffer} resumeBuffer - Resume file buffer
   * @param {string} filename - Original filename
   * @returns {Object} Parsed resume data
   */
  async parseResume(resumeBuffer, filename) {
    try {
      const formData = new FormData();
      formData.append('file', resumeBuffer, filename);
      
      const response = await axios.post(`${this.aiServiceUrl}/parse-resume`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: this.timeout
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Resume parsing failed:', error.message);
      return {
        success: false,
        error: 'Resume parsing failed. Please try again.'
      };
    }
  }

  /**
   * Generate embedding vector for user profile
   * @param {Object} profileData - User profile data
   * @returns {Array} Embedding vector
   */
  async generateEmbedding(profileData) {
    try {
      const payload = {
        skills: profileData.skills || [],
        experience: profileData.experience || [],
        projects: profileData.projects || [],
        bio: profileData.bio || '',
        education: profileData.education || []
      };

      const response = await axios.post(`${this.aiServiceUrl}/generate-embedding`, payload, {
        timeout: this.timeout
      });

      return {
        success: true,
        embedding: response.data.embedding
      };
    } catch (error) {
      console.error('Embedding generation failed:', error.message);
      return {
        success: false,
        error: 'Failed to generate profile embedding'
      };
    }
  }

  /**
   * Find potential teammates using AI matching
   * @param {Array} userEmbedding - User's embedding vector
   * @param {string} hackathonId - Target hackathon ID
   * @param {Object} preferences - User preferences
   * @param {number} limit - Number of matches to return
   * @returns {Array} Matched users
   */
  async findMatches(userEmbedding, hackathonId, preferences = {}, limit = 10) {
    try {
      const payload = {
        embedding: userEmbedding,
        hackathonId,
        preferences: {
          skills: preferences.preferredSkills || [],
          experience: preferences.experienceLevel || 'any',
          location: preferences.location || null,
          ...preferences
        },
        limit
      };

      const response = await axios.post(`${this.aiServiceUrl}/find-matches`, payload, {
        timeout: this.timeout
      });

      return {
        success: true,
        matches: response.data.matches
      };
    } catch (error) {
      console.error('Matchmaking failed:', error.message);
      return {
        success: false,
        error: 'Failed to find matches'
      };
    }
  }

  /**
   * Calculate compatibility score between two users
   * @param {Array} embedding1 - First user's embedding
   * @param {Array} embedding2 - Second user's embedding
   * @returns {number} Compatibility score (0-1)
   */
  async calculateCompatibility(embedding1, embedding2) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/compatibility`, {
        embedding1,
        embedding2
      }, {
        timeout: this.timeout
      });

      return {
        success: true,
        score: response.data.compatibility_score
      };
    } catch (error) {
      console.error('Compatibility calculation failed:', error.message);
      return {
        success: false,
        score: 0
      };
    }
  }

  /**
   * Get skill recommendations based on user profile
   * @param {Object} profileData - User profile data
   * @returns {Array} Recommended skills
   */
  async getSkillRecommendations(profileData) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/recommend-skills`, {
        currentSkills: profileData.skills || [],
        projects: profileData.projects || [],
        experience: profileData.experience || []
      }, {
        timeout: this.timeout
      });

      return {
        success: true,
        recommendations: response.data.recommended_skills
      };
    } catch (error) {
      console.error('Skill recommendation failed:', error.message);
      return {
        success: false,
        recommendations: []
      };
    }
  }

  /**
   * Analyze team composition and suggest improvements
   * @param {Array} teamMembers - Array of team member profiles
   * @param {string} hackathonId - Hackathon ID
   * @returns {Object} Team analysis and suggestions
   */
  async analyzeTeamComposition(teamMembers, hackathonId) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/analyze-team`, {
        teamMembers,
        hackathonId
      }, {
        timeout: this.timeout
      });

      return {
        success: true,
        analysis: response.data
      };
    } catch (error) {
      console.error('Team analysis failed:', error.message);
      return {
        success: false,
        analysis: null
      };
    }
  }

  /**
   * Health check for AI service
   * @returns {boolean} Service availability
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.aiServiceUrl}/health`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('AI service health check failed:', error.message);
      return false;
    }
  }
}

module.exports = new AIService();