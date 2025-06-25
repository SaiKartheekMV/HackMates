// src/services/matchmakingService.js
const Profile = require('../models/Profile');
const User = require('../models/User');
const Match = require('../models/Match');
const Hackathon = require('../models/Hackathon');
const aiService = require('./aiService');
const cacheService = require('./cacheService');

class MatchmakingService {
  // Calculate skill similarity score between two profiles
  calculateSkillSimilarity(skills1, skills2) {
    if (!skills1?.length || !skills2?.length) return 0;
    
    const set1 = new Set(skills1.map(s => s.toLowerCase()));
    const set2 = new Set(skills2.map(s => s.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }

  // Calculate experience compatibility
  calculateExperienceCompatibility(exp1, exp2) {
    const getExperienceLevel = (experience) => {
      if (!experience?.length) return 0;
      return experience.reduce((total, exp) => {
        const years = exp.duration?.match(/(\d+)/)?.[0] || 1;
        return total + parseInt(years);
      }, 0);
    };

    const level1 = getExperienceLevel(exp1);
    const level2 = getExperienceLevel(exp2);
    
    // Prefer similar experience levels
    const diff = Math.abs(level1 - level2);
    return Math.max(0, 1 - (diff / 10)); // Normalize to 0-1
  }

  // Calculate location proximity score
  calculateLocationScore(loc1, loc2) {
    if (!loc1 || !loc2) return 0.5; // Neutral if location unknown
    
    if (loc1.city === loc2.city) return 1.0;
    if (loc1.country === loc2.country) return 0.7;
    return 0.3; // Different countries
  }

  // Calculate project similarity
  calculateProjectSimilarity(projects1, projects2) {
    if (!projects1?.length || !projects2?.length) return 0;
    
    const extractTechnologies = (projects) => {
      return projects.flatMap(p => p.technologies || []).map(t => t.toLowerCase());
    };

    const tech1 = extractTechnologies(projects1);
    const tech2 = extractTechnologies(projects2);
    
    return this.calculateSkillSimilarity(tech1, tech2);
  }

  // Main matching algorithm using multiple factors
  async calculateCompatibilityScore(profile1, profile2, hackathon = null) {
    const weights = {
      skills: 0.4,
      experience: 0.2,
      location: 0.15,
      projects: 0.15,
      embedding: 0.1
    };

    const scores = {
      skills: this.calculateSkillSimilarity(profile1.skills, profile2.skills),
      experience: this.calculateExperienceCompatibility(profile1.experience, profile2.experience),
      location: this.calculateLocationScore(profile1.location, profile2.location),
      projects: this.calculateProjectSimilarity(profile1.projects, profile2.projects),
      embedding: 0 // Will be calculated if embeddings exist
    };

    // Use AI embeddings if available
    if (profile1.aiEmbedding?.length && profile2.aiEmbedding?.length) {
      scores.embedding = this.calculateCosineSimilarity(profile1.aiEmbedding, profile2.aiEmbedding);
    }

    // Adjust weights based on hackathon requirements
    if (hackathon?.categories?.length) {
      const relevantSkills1 = profile1.skills?.filter(skill => 
        hackathon.categories.some(cat => skill.toLowerCase().includes(cat.toLowerCase()))
      ) || [];
      const relevantSkills2 = profile2.skills?.filter(skill => 
        hackathon.categories.some(cat => skill.toLowerCase().includes(cat.toLowerCase()))
      ) || [];
      
      if (relevantSkills1.length > 0 || relevantSkills2.length > 0) {
        weights.skills += 0.1; // Boost skill importance for relevant hackathons
      }
    }

    // Calculate weighted score
    const totalScore = Object.keys(scores).reduce((total, key) => {
      return total + (scores[key] * weights[key]);
    }, 0);

    return {
      totalScore: Math.round(totalScore * 100) / 100,
      breakdown: scores
    };
  }

  // Calculate cosine similarity between two vectors
  calculateCosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  // Find potential matches for a user
  async findMatches(userId, hackathonId = null, limit = 10) {
    try {
      // Check cache first
      const cacheKey = `matches:${userId}:${hackathonId || 'all'}`;
      const cachedMatches = await cacheService.getCachedMatches(cacheKey);
      if (cachedMatches) {
        return cachedMatches;
      }

      // Get user's profile
      const userProfile = await Profile.findOne({ userId }).populate('userId');
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      // Get hackathon info if specified
      let hackathon = null;
      if (hackathonId) {
        hackathon = await Hackathon.findById(hackathonId);
      }

      // Find potential matches
      const matchQuery = { userId: { $ne: userId } };
      
      // Filter by hackathon relevance if specified
      if (hackathon?.categories?.length) {
        matchQuery.skills = { 
          $in: hackathon.categories.map(cat => new RegExp(cat, 'i'))
        };
      }

      const potentialMatches = await Profile.find(matchQuery)
        .populate('userId', 'firstName lastName profilePicture')
        .limit(limit * 3); // Get more candidates for better filtering

      // Calculate compatibility scores
      const scoredMatches = await Promise.all(
        potentialMatches.map(async (profile) => {
          const compatibility = await this.calculateCompatibilityScore(
            userProfile, 
            profile, 
            hackathon
          );
          
          return {
            userId: profile.userId._id,
            userInfo: {
              firstName: profile.userId.firstName,
              lastName: profile.userId.lastName,
              profilePicture: profile.userId.profilePicture
            },
            profile: {
              bio: profile.bio,
              skills: profile.skills,
              location: profile.location,
              completionScore: profile.completionScore
            },
            compatibility: compatibility.totalScore,
            breakdown: compatibility.breakdown,
            lastActive: profile.updatedAt
          };
        })
      );

      // Sort by compatibility and filter
      const matches = scoredMatches
        .filter(match => match.compatibility > 0.3) // Only show meaningful matches
        .sort((a, b) => b.compatibility - a.compatibility)
        .slice(0, limit);

      // Cache results
      await cacheService.cacheUserMatches(cacheKey, matches, 3600); // 1 hour

      return matches;
    } catch (error) {
      console.error('Error finding matches:', error);
      throw error;
    }
  }

    async getTeamRecommendations(userId, hackathonId, limit = 10) {
    try {
      const matches = await this.findMatches(userId, hackathonId, limit);
      
      const teamRecommendations = matches.map(match => ({
        type: 'user_match',
        userId: match.userId,
        userInfo: match.userInfo,
        profile: match.profile,
        compatibility: match.compatibility,
        breakdown: match.breakdown,
        recommendationReason: `${Math.round(match.compatibility * 100)}% compatibility match`
      }));

      return teamRecommendations;
    } catch (error) {
      console.error('Error getting team recommendations:', error);
      throw error;
    }
  }


  // Update matches for a user (called after profile changes)
  async updateUserMatches(userId) {
    try {
      // Clear existing caches
      await cacheService.invalidateUserCache(userId);
      
      // Pre-compute matches for active hackathons
      const activeHackathons = await Hackathon.find({ 
        status: { $in: ['upcoming', 'ongoing'] }
      }).select('_id').limit(5);

      for (const hackathon of activeHackathons) {
        await this.findMatches(userId, hackathon._id, 10);
      }

      // Also compute general matches
      await this.findMatches(userId, null, 15);
      
      console.log(`Updated matches for user: ${userId}`);
    } catch (error) {
      console.error('Error updating user matches:', error);
    }
  }

  // Store match feedback for improving algorithm
  async recordMatchFeedback(userId, matchedUserId, feedback, hackathonId = null) {
    try {
      const matchRecord = new Match({
        fromUserId: userId,
        toUserId: matchedUserId,
        hackathonId,
        feedback: {
          rating: feedback.rating,
          interested: feedback.interested,
          reason: feedback.reason
        },
        timestamp: new Date()
      });

      await matchRecord.save();

      // Invalidate cache to reflect feedback
      const cacheKey = `matches:${userId}:${hackathonId || 'all'}`;
      await cacheService.invalidateCache(cacheKey);

      return matchRecord;
    } catch (error) {
      console.error('Error recording match feedback:', error);
      throw error;
    }
  }

  // Get match statistics for a user
  async getMatchStats(userId) {
    try {
      const stats = await Match.aggregate([
        { $match: { fromUserId: userId } },
        {
          $group: {
            _id: null,
            totalMatches: { $sum: 1 },
            avgRating: { $avg: '$feedback.rating' },
            interestedCount: { 
              $sum: { $cond: ['$feedback.interested', 1, 0] } 
            }
          }
        }
      ]);

      return stats[0] || {
        totalMatches: 0,
        avgRating: 0,
        interestedCount: 0
      };
    } catch (error) {
      console.error('Error getting match stats:', error);
      return { totalMatches: 0, avgRating: 0, interestedCount: 0 };
    }
  }

  // Get detailed compatibility analysis between two users
  async getDetailedCompatibility(userId1, userId2, hackathonId = null) {
    try {
      const [profile1, profile2] = await Promise.all([
        Profile.findOne({ userId: userId1 }).populate('userId'),
        Profile.findOne({ userId: userId2 }).populate('userId')
      ]);

      if (!profile1 || !profile2) {
        throw new Error('One or both profiles not found');
      }

      let hackathon = null;
      if (hackathonId) {
        hackathon = await Hackathon.findById(hackathonId);
      }

      const compatibility = await this.calculateCompatibilityScore(
        profile1, 
        profile2, 
        hackathon
      );

      return {
        users: [
          {
            id: profile1.userId._id,
            name: `${profile1.userId.firstName} ${profile1.userId.lastName}`,
            skills: profile1.skills,
            location: profile1.location
          },
          {
            id: profile2.userId._id,
            name: `${profile2.userId.firstName} ${profile2.userId.lastName}`,
            skills: profile2.skills,
            location: profile2.location
          }
        ],
        compatibility: compatibility.totalScore,
        breakdown: compatibility.breakdown,
        recommendations: this.generateCompatibilityRecommendations(compatibility.breakdown)
      };
    } catch (error) {
      console.error('Error getting detailed compatibility:', error);
      throw error;
    }
  }

  // Generate recommendations based on compatibility breakdown
  generateCompatibilityRecommendations(breakdown) {
    const recommendations = [];

    if (breakdown.skills < 0.3) {
      recommendations.push({
        type: 'skills',
        message: 'Consider learning complementary skills to improve collaboration potential'
      });
    }

    if (breakdown.experience < 0.4) {
      recommendations.push({
        type: 'experience',
        message: 'Different experience levels can be beneficial - mentor/mentee opportunities'
      });
    }

    if (breakdown.location < 0.5) {
      recommendations.push({
        type: 'location',
        message: 'Remote collaboration tools will be important for this partnership'
      });
    }

    if (breakdown.projects > 0.7) {
      recommendations.push({
        type: 'projects',
        message: 'Strong project similarity - great potential for shared interests'
      });
    }

    return recommendations;
  }
}

module.exports = new MatchmakingService();