// services/aiService.js
const axios = require('axios');
const Profile = require('../models/Profile');

class AIService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.timeout = 30000; // 30 seconds
  }

  // Parse resume from buffer or file path
  async parseResume(resumeBuffer) {
    try {
      const formData = new FormData();
      formData.append('file', resumeBuffer);
      
      const response = await axios.post(`${this.aiServiceUrl}/parse-resume`, formData, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        skills: response.data.skills || [],
        experience: response.data.experience || [],
        education: response.data.education || [],
        projects: response.data.projects || [],
        bio: response.data.summary || '',
        extractedText: response.data.text || ''
      };
    } catch (error) {
      console.error('Resume parsing error:', error.message);
      
      // Fallback: return basic structure if AI service fails
      return {
        skills: [],
        experience: [],
        education: [],
        projects: [],
        bio: 'Profile imported from resume',
        extractedText: ''
      };
    }
  }

  // Generate embedding vector for profile data
  async generateEmbedding(profileData) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/generate-embedding`, {
        skills: profileData.skills || [],
        experience: profileData.experience || [],
        projects: profileData.projects || [],
        bio: profileData.bio || '',
        education: profileData.education || []
      }, {
        timeout: this.timeout
      });

      return response.data.embedding;
    } catch (error) {
      console.error('Embedding generation error:', error.message);
      
      // Fallback: generate simple hash-based embedding
      return this.generateFallbackEmbedding(profileData);
    }
  }

  // Find compatible matches for a user
  async findMatches(userEmbedding, hackathonId = null, limit = 10) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/find-matches`, {
        embedding: userEmbedding,
        hackathonId,
        limit
      }, {
        timeout: this.timeout
      });

      return response.data.matches || [];
    } catch (error) {
      console.error('AI matchmaking error:', error.message);
      
      // Fallback: simple skill-based matching
      return await this.fallbackMatching(userEmbedding, hackathonId, limit);
    }
  }

  // Calculate compatibility between two users
  async calculateCompatibility(userEmbedding, targetEmbedding, additionalData = {}) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/calculate-compatibility`, {
        embedding1: userEmbedding,
        embedding2: targetEmbedding,
        ...additionalData
      }, {
        timeout: this.timeout
      });

      return {
        score: response.data.compatibilityScore || 0,
        reasons: response.data.reasons || [],
        commonSkills: response.data.commonSkills || [],
        complementarySkills: response.data.complementarySkills || []
      };
    } catch (error) {
      console.error('Compatibility calculation error:', error.message);
      
      // Fallback: basic skill comparison
      return this.calculateBasicCompatibility(additionalData);
    }
  }

  // Fallback embedding generation using simple hashing
  generateFallbackEmbedding(profileData) {
    const text = [
      ...(profileData.skills || []),
      profileData.bio || '',
      ...(profileData.experience || []).map(exp => `${exp.title} ${exp.company}`),
      ...(profileData.projects || []).map(proj => `${proj.name} ${proj.description}`)
    ].join(' ').toLowerCase();

    // Generate a simple 256-dimensional embedding
    const embedding = new Array(256).fill(0);
    
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      embedding[i % 256] += charCode / text.length;
    }

    return embedding.map(val => Math.tanh(val)); // Normalize between -1 and 1
  }

  // Fallback matching based on skill similarity
  async fallbackMatching(userEmbedding, hackathonId, limit) {
    try {
      // Get user's profile to extract skills
      const userProfile = await Profile.findOne({ aiEmbedding: userEmbedding });
      if (!userProfile) return [];

      const userSkills = userProfile.skills || [];
      
      // Find profiles with similar skills
      const query = { 
        userId: { $ne: userProfile.userId },
        skills: { $in: userSkills }
      };

      const profiles = await Profile.find(query)
        .populate('userId', 'firstName lastName profilePicture')
        .limit(limit * 2); // Get more to filter better matches

      // Calculate simple compatibility scores
      const matches = profiles.map(profile => {
        const commonSkills = profile.skills.filter(skill => 
          userSkills.includes(skill)
        );
        
        const score = Math.min(commonSkills.length / Math.max(userSkills.length, 1), 1);
        
        return {
          userId: profile.userId._id.toString(),
          compatibilityScore: score,
          reasons: [`${commonSkills.length} common skills`],
          commonSkills,
          user: profile.userId
        };
      })
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, limit);

      return matches;
    } catch (error) {
      console.error('Fallback matching error:', error.message);
      return [];
    }
  }

  // Basic compatibility calculation
  calculateBasicCompatibility(data) {
    const userSkills = data.userSkills || [];
    const targetSkills = data.targetSkills || [];
    
    const commonSkills = userSkills.filter(skill => targetSkills.includes(skill));
    const score = Math.min(commonSkills.length / Math.max(userSkills.length, 1), 1);
    
    return {
      score,
      reasons: [`${commonSkills.length} skills in common`],
      commonSkills,
      complementarySkills: targetSkills.filter(skill => !userSkills.includes(skill))
    };
  }

  // Update user embedding when profile changes
  async updateUserEmbedding(userId, profileData) {
    try {
      const embedding = await this.generateEmbedding(profileData);
      
      await Profile.findOneAndUpdate(
        { userId },
        { 
          aiEmbedding: embedding,
          updatedAt: new Date()
        }
      );

      return embedding;
    } catch (error) {
      console.error('Update user embedding error:', error.message);
      throw error;
    }
  }

  // Batch update embeddings for multiple users
  async batchUpdateEmbeddings(userIds) {
    const results = [];
    
    for (const userId of userIds) {
      try {
        const profile = await Profile.findOne({ userId });
        if (profile) {
          const embedding = await this.generateEmbedding({
            skills: profile.skills,
            experience: profile.experience,
            projects: profile.projects,
            bio: profile.bio,
            education: profile.education
          });
          
          await Profile.findOneAndUpdate(
            { userId },
            { aiEmbedding: embedding }
          );
          
          results.push({ userId, success: true });
        }
      } catch (error) {
        console.error(`Batch update error for user ${userId}:`, error.message);
        results.push({ userId, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

module.exports = new AIService();