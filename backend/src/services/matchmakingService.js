// src/services/matchmakingService.js
const Profile = require('../models/Profile');
const User = require('../models/User');
const Team = require('../models/Team');
const Hackathon = require('../models/Hackathon');
const Match = require('../models/Match');
const aiService = require('./aiService');
const cacheService = require('./cacheService');

class MatchmakingService {
  /**
   * Get AI-powered teammate suggestions for a user
   * @param {string} userId - User ID requesting matches
   * @param {string} hackathonId - Target hackathon ID
   * @param {Object} filters - Additional filters
   * @returns {Array} Array of matched user profiles
   */
  async getTeammatesSuggestions(userId, hackathonId, filters = {}) {
    try {
      // Check cache first
      const cacheKey = `matches:${userId}:${hackathonId}`;
      const cachedMatches = await cacheService.get(cacheKey);
      if (cachedMatches) {
        return JSON.parse(cachedMatches);
      }

      // Get user's profile
      const userProfile = await Profile.findOne({ userId }).populate('userId', 'firstName lastName profilePicture');
      if (!userProfile || !userProfile.aiEmbedding) {
        throw new Error('User profile not found or embedding not generated');
      }

      // Get hackathon details
      const hackathon = await Hackathon.findById(hackathonId);
      if (!hackathon) {
        throw new Error('Hackathon not found');
      }

      // Find potential matches using AI
      const aiMatches = await aiService.findMatches(
        userProfile.aiEmbedding,
        hackathonId,
        filters,
        20 // Get more candidates for filtering
      );

      if (!aiMatches.success) {
        throw new Error(aiMatches.error);
      }

      // Get detailed profiles for matched users
      const matchedUserIds = aiMatches.matches.map(match => match.userId);
      const matchedProfiles = await Profile.find({
        userId: { $in: matchedUserIds, $ne: userId }
      })
      .populate('userId', 'firstName lastName profilePicture email')
      .lean();

      // Apply additional filters
      let filteredProfiles = this.applyFilters(matchedProfiles, filters);

      // Remove users who are already in teams for this hackathon
      const existingTeamMembers = await Team.find({ hackathonId })
        .select('members.userId')
        .lean();
      
      const teamMemberIds = new Set();
      existingTeamMembers.forEach(team => {
        team.members.forEach(member => {
          teamMemberIds.add(member.userId.toString());
        });
      });

      filteredProfiles = filteredProfiles.filter(profile => 
        !teamMemberIds.has(profile.userId._id.toString())
      );

      // Calculate final compatibility scores and format response
      const suggestions = await Promise.all(
        filteredProfiles.slice(0, 10).map(async (profile) => {
          const compatibility = await this.calculateDetailedCompatibility(
            userProfile,
            profile,
            hackathon
          );

          return {
            userId: profile.userId._id,
            name: `${profile.userId.firstName} ${profile.userId.lastName}`,
            profilePicture: profile.userId.profilePicture,
            bio: profile.bio,
            skills: profile.skills,
            location: profile.location,
            experience: profile.experience,
            projects: profile.projects.slice(0, 3), // Limit projects
            compatibilityScore: compatibility.overall,
            compatibilityBreakdown: compatibility.breakdown,
            completionScore: profile.completionScore,
            socialLinks: {
              github: profile.socialLinks?.github,
              linkedin: profile.socialLinks?.linkedin,
              portfolio: profile.socialLinks?.portfolio
            }
          };
        })
      );

      // Sort by compatibility score
      suggestions.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      // Cache results for 1 hour
      await cacheService.set(cacheKey, JSON.stringify(suggestions), 3600);

      return suggestions;
    } catch (error) {
      console.error('Error getting teammate suggestions:', error);
      throw error;
    }
  }

  /**
   * Apply filters to matched profiles
   * @param {Array} profiles - Array of user profiles
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered profiles
   */
  applyFilters(profiles, filters) {
    let filtered = [...profiles];

    // Filter by skills
    if (filters.requiredSkills && filters.requiredSkills.length > 0) {
      filtered = filtered.filter(profile => 
        filters.requiredSkills.some(skill => 
          profile.skills.some(userSkill => 
            userSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    // Filter by experience level
    if (filters.experienceLevel && filters.experienceLevel !== 'any') {
      filtered = filtered.filter(profile => {
        const experienceYears = this.calculateExperienceYears(profile.experience);
        switch (filters.experienceLevel) {
          case 'beginner': return experienceYears <= 2;
          case 'intermediate': return experienceYears > 2 && experienceYears <= 5;
          case 'senior': return experienceYears > 5;
          default: return true;
        }
      });
    }

    // Filter by location
    if (filters.location && filters.location.city) {
      filtered = filtered.filter(profile => 
        profile.location?.city?.toLowerCase() === filters.location.city.toLowerCase()
      );
    }

    // Filter by minimum completion score
    if (filters.minCompletionScore) {
      filtered = filtered.filter(profile => 
        profile.completionScore >= filters.minCompletionScore
      );
    }

    return filtered;
  }

  /**
   * Calculate detailed compatibility between two users
   * @param {Object} userProfile1 - First user's profile
   * @param {Object} userProfile2 - Second user's profile
   * @param {Object} hackathon - Hackathon details
   * @returns {Object} Compatibility scores
   */
  async calculateDetailedCompatibility(userProfile1, userProfile2, hackathon) {
    try {
      // Skill compatibility
      const skillCompatibility = this.calculateSkillCompatibility(
        userProfile1.skills,
        userProfile2.skills
      );

      // Experience compatibility
      const experienceCompatibility = this.calculateExperienceCompatibility(
        userProfile1.experience,
        userProfile2.experience
      );

      // Project compatibility
      const projectCompatibility = this.calculateProjectCompatibility(
        userProfile1.projects,
        userProfile2.projects,
        hackathon.technologies
      );

      // Location compatibility
      const locationCompatibility = this.calculateLocationCompatibility(
        userProfile1.location,
        userProfile2.location
      );

      // AI-based compatibility (if available)
      let aiCompatibility = 0.5; // Default neutral score
      if (userProfile1.aiEmbedding && userProfile2.aiEmbedding) {
        const aiResult = await aiService.calculateCompatibility(
          userProfile1.aiEmbedding,
          userProfile2.aiEmbedding
        );
        if (aiResult.success) {
          aiCompatibility = aiResult.score;
        }
      }

      // Weighted overall score
      const weights = {
        skills: 0.3,
        experience: 0.2,
        projects: 0.2,
        location: 0.1,
        ai: 0.2
      };

      const overall = (
        skillCompatibility * weights.skills +
        experienceCompatibility * weights.experience +
        projectCompatibility * weights.projects +
        locationCompatibility * weights.location +
        aiCompatibility * weights.ai
      );

      return {
        overall: Math.round(overall * 100) / 100,
        breakdown: {
          skills: skillCompatibility,
          experience: experienceCompatibility,
          projects: projectCompatibility,
          location: locationCompatibility,
          ai: aiCompatibility
        }
      };
    } catch (error) {
      console.error('Error calculating compatibility:', error);
      return {
        overall: 0.5,
        breakdown: {
          skills: 0.5,
          experience: 0.5,
          projects: 0.5,
          location: 0.5,
          ai: 0.5
        }
      };
    }
  }

  /**
   * Calculate skill compatibility between two users
   * @param {Array} skills1 - First user's skills
   * @param {Array} skills2 - Second user's skills
   * @returns {number} Compatibility score (0-1)
   */
  calculateSkillCompatibility(skills1, skills2) {
    if (!skills1?.length || !skills2?.length) return 0.3;

    const normalizedSkills1 = skills1.map(s => s.toLowerCase().trim());
    const normalizedSkills2 = skills2.map(s => s.toLowerCase().trim());

    // Calculate Jaccard similarity
    const intersection = normalizedSkills1.filter(skill => 
      normalizedSkills2.includes(skill)
    ).length;

    const union = new Set([...normalizedSkills1, ...normalizedSkills2]).size;
    
    // Ensure some complementary skills (not 100% overlap)
    const jaccardSimilarity = intersection / union;
    const complementarity = 1 - Math.abs(0.3 - jaccardSimilarity); // Optimal overlap around 30%
    
    return Math.min(jaccardSimilarity + complementarity * 0.5, 1);
  }

  /**
   * Calculate experience compatibility
   * @param {Array} exp1 - First user's experience
   * @param {Array} exp2 - Second user's experience
   * @returns {number} Compatibility score (0-1)
   */
  calculateExperienceCompatibility(exp1, exp2) {
    const years1 = this.calculateExperienceYears(exp1);
    const years2 = this.calculateExperienceYears(exp2);

    // Prefer balanced experience levels
    const avgYears = (years1 + years2) / 2;
    const yearsDiff = Math.abs(years1 - years2);

    // Score based on experience balance
    if (yearsDiff <= 2) return 0.9; // Very similar experience
    if (yearsDiff <= 4) return 0.7; // Moderately different
    if (yearsDiff <= 6) return 0.5; // Different but can work
    return 0.3; // Very different experience levels
  }

  /**
   * Calculate project compatibility
   * @param {Array} projects1 - First user's projects
   * @param {Array} projects2 - Second user's projects
   * @param {Array} hackathonTech - Hackathon technologies
   * @returns {number} Compatibility score (0-1)
   */
  calculateProjectCompatibility(projects1, projects2, hackathonTech = []) {
    if (!projects1?.length && !projects2?.length) return 0.5;

    const allTech1 = this.extractTechnologiesFromProjects(projects1);
    const allTech2 = this.extractTechnologiesFromProjects(projects2);

    // Check relevance to hackathon
    const hackathonRelevance1 = this.calculateHackathonRelevance(allTech1, hackathonTech);
    const hackathonRelevance2 = this.calculateHackathonRelevance(allTech2, hackathonTech);

    // Check complementarity
    const techOverlap = this.calculateSkillCompatibility(allTech1, allTech2);

    return (hackathonRelevance1 + hackathonRelevance2 + techOverlap) / 3;
  }

  /**
   * Calculate location compatibility
   * @param {Object} loc1 - First user's location
   * @param {Object} loc2 - Second user's location
   * @returns {number} Compatibility score (0-1)
   */
  calculateLocationCompatibility(loc1, loc2) {
    if (!loc1 || !loc2) return 0.5;

    if (loc1.city === loc2.city && loc1.country === loc2.country) return 1.0;
    if (loc1.country === loc2.country) return 0.7;
    return 0.3;
  }

  /**
   * Extract technologies from projects
   * @param {Array} projects - Array of projects
   * @returns {Array} Array of technologies
   */
  extractTechnologiesFromProjects(projects) {
    if (!projects?.length) return [];
    return projects.flatMap(project => project.technologies || []);
  }

  /**
   * Calculate hackathon relevance score
   * @param {Array} userTech - User's technologies
   * @param {Array} hackathonTech - Hackathon technologies
   * @returns {number} Relevance score (0-1)
   */
  calculateHackathonRelevance(userTech, hackathonTech) {
    if (!hackathonTech?.length) return 0.5;
    if (!userTech?.length) return 0.2;

    const matches = userTech.filter(tech => 
      hackathonTech.some(hTech => 
        tech.toLowerCase().includes(hTech.toLowerCase()) ||
        hTech.toLowerCase().includes(tech.toLowerCase())
      )
    ).length;

    return Math.min(matches / hackathonTech.length, 1);
  }

  /**
   * Calculate total years of experience
   * @param {Array} experience - Experience array
   * @returns {number} Years of experience
   */
  calculateExperienceYears(experience) {
    if (!experience?.length) return 0;

    return experience.reduce((total, exp) => {
      if (exp.duration) {
        const years = this.parseDurationToYears(exp.duration);
        return total + years;
      }
      return total;
    }, 0);
  }

  /**
   * Parse duration string to years
   * @param {string} duration - Duration string (e.g., "2 years", "6 months")
   * @returns {number} Years
   */
  parseDurationToYears(duration) {
    const lowerDuration = duration.toLowerCase();
    
    // Extract numbers
    const numbers = lowerDuration.match(/\d+/g);
    if (!numbers) return 0;

    const num = parseInt(numbers[0]);
    
    if (lowerDuration.includes('year')) return num;
    if (lowerDuration.includes('month')) return num / 12;
    if (lowerDuration.includes('week')) return num / 52;
    
    return 0;
  }

  /**
   * Save match feedback for AI learning
   * @param {string} userId - User who provided feedback
   * @param {string} matchedUserId - Matched user ID
   * @param {string} hackathonId - Hackathon ID
   * @param {string} feedback - 'like' or 'dislike'
   * @param {string} reason - Optional reason
   */
  async saveMatchFeedback(userId, matchedUserId, hackathonId, feedback, reason = null) {
    try {
      await Match.findOneAndUpdate(
        { userId, matchedUserId, hackathonId },
        {
          feedback,
          feedbackReason: reason,
          feedbackAt: new Date()
        },
        { upsert: true }
      );

      // Invalidate cache for this user
      await cacheService.delete(`matches:${userId}:${hackathonId}`);
    } catch (error) {
      console.error('Error saving match feedback:', error);
      throw error;
    }
  }

  /**
   * Get match history for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of matches to return
   * @returns {Array} Match history
   */
  async getMatchHistory(userId, limit = 50) {
    try {
      const matches = await Match.find({ userId })
        .populate('matchedUserId', 'firstName lastName profilePicture')
        .populate('hackathonId', 'title')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return matches;
    } catch (error) {
      console.error('Error getting match history:', error);
      throw error;
    }
  }
}

module.exports = new MatchmakingService();