// src/controllers/matchmakingController.js
const User = require('../models/User');
const Profile = require('../models/Profile');
const Hackathon = require('../models/Hackathon');
const Match = require('../models/Match');
const { aiService } = require('../services/aiService');
const { cacheService } = require('../services/cacheService');

// Get AI-powered teammate suggestions
const getSuggestions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { hackathonId, limit = 10 } = req.query;

    // Check cache first
    const cacheKey = `suggestions:${userId}:${hackathonId}`;
    const cachedSuggestions = await cacheService.get(cacheKey);
    
    if (cachedSuggestions) {
      return res.json({
        success: true,
        data: JSON.parse(cachedSuggestions)
      });
    }

    // Get user profile
    const userProfile = await Profile.findOne({ userId });
    if (!userProfile) {
      return res.status(400).json({
        error: 'Profile not found. Please complete your profile first.'
      });
    }

    // Get hackathon details
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ error: 'Hackathon not found' });
    }

    // Find potential matches using AI service
    let suggestions = [];
    
    if (userProfile.aiEmbedding && userProfile.aiEmbedding.length > 0) {
      // Use AI-powered matching
      suggestions = await aiService.findMatches(
        userProfile.aiEmbedding,
        hackathonId,
        parseInt(limit) * 2 // Get more results to filter
      );
    } else {
      // Fallback to skill-based matching
      suggestions = await findSkillBasedMatches(userId, hackathonId, parseInt(limit));
    }

    // Filter out current user and already connected users
    const filteredSuggestions = suggestions.filter(suggestion => 
      suggestion.userId.toString() !== userId.toString()
    );

    // Limit results
    const finalSuggestions = filteredSuggestions.slice(0, parseInt(limit));

    // Cache results for 1 hour
    await cacheService.set(cacheKey, JSON.stringify(finalSuggestions), 3600);

    res.json({
      success: true,
      data: finalSuggestions
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};

// Check compatibility between two users
const checkCompatibility = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const { userId } = req.params;
    const { hackathonId } = req.query;

    if (currentUserId.toString() === userId) {
      return res.status(400).json({ error: 'Cannot check compatibility with yourself' });
    }

    // Get both user profiles
    const [currentUserProfile, targetUserProfile] = await Promise.all([
      Profile.findOne({ userId: currentUserId }),
      Profile.findOne({ userId })
    ]);

    if (!currentUserProfile || !targetUserProfile) {
      return res.status(404).json({ error: 'One or both profiles not found' });
    }

    // Calculate compatibility score
    const compatibility = calculateCompatibility(currentUserProfile, targetUserProfile);

    // Get hackathon context if provided
    let hackathonContext = null;
    if (hackathonId) {
      hackathonContext = await Hackathon.findById(hackathonId);
    }

    res.json({
      success: true,
      data: {
        compatibilityScore: compatibility.score,
        breakdown: compatibility.breakdown,
        commonSkills: compatibility.commonSkills,
        complementarySkills: compatibility.complementarySkills,
        hackathonContext
      }
    });

  } catch (error) {
    console.error('Check compatibility error:', error);
    res.status(500).json({ error: 'Failed to check compatibility' });
  }
};

// Submit feedback on a match
const submitFeedback = async (req, res) => {
  try {
    const userId = req.user._id;
    const { matchedUserId, hackathonId, rating, feedback, interested } = req.body;

    // Check if feedback already exists
    const existingFeedback = await Match.findOne({
      userId,
      matchedUserId,
      hackathonId
    });

    if (existingFeedback) {
      // Update existing feedback
      existingFeedback.rating = rating;
      existingFeedback.feedback = feedback;
      existingFeedback.interested = interested;
      existingFeedback.updatedAt = new Date();
      await existingFeedback.save();
    } else {
      // Create new feedback
      await Match.create({
        userId,
        matchedUserId,
        hackathonId,
        rating,
        feedback,
        interested,
        status: 'feedback_given'
      });
    }

    // Invalidate cache
    await cacheService.delete(`suggestions:${userId}:${hackathonId}`);
    await cacheService.delete(`history:${userId}`);

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

// Get match history
const getMatchHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    // Check cache first
    const cacheKey = `history:${userId}:${page}:${limit}`;
    const cachedHistory = await cacheService.get(cacheKey);
    
    if (cachedHistory) {
      return res.json({
        success: true,
        data: JSON.parse(cachedHistory)
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const matches = await Match.find({ userId })
      .populate('matchedUserId', 'firstName lastName profilePicture')
      .populate('hackathonId', 'title startDate endDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Match.countDocuments({ userId });

    const result = {
      matches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    };

    // Cache for 30 minutes
    await cacheService.set(cacheKey, JSON.stringify(result), 1800);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get match history error:', error);
    res.status(500).json({ error: 'Failed to get match history' });
  }
};

// Helper function for skill-based matching (fallback)
const findSkillBasedMatches = async (userId, hackathonId, limit) => {
  try {
    // Get current user's skills
    const userProfile = await Profile.findOne({ userId });
    if (!userProfile || !userProfile.skills || userProfile.skills.length === 0) {
      return [];
    }

    // Find users with complementary skills
    const matches = await Profile.aggregate([
      {
        $match: {
          userId: { $ne: userId },
          skills: { $exists: true, $ne: [] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $addFields: {
          commonSkills: {
            $size: {
              $setIntersection: ['$skills', userProfile.skills]
            }
          },
          skillScore: {
            $divide: [
              { $size: { $setIntersection: ['$skills', userProfile.skills] } },
              { $size: { $setUnion: ['$skills', userProfile.skills] } }
            ]
          }
        }
      },
      {
        $match: {
          commonSkills: { $gt: 0 }
        }
      },
      {
        $sort: { skillScore: -1, commonSkills: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          userId: 1,
          skills: 1,
          bio: 1,
          location: 1,
          user: { $arrayElemAt: ['$user', 0] },
          compatibilityScore: { $multiply: ['$skillScore', 100] },
          commonSkills: 1
        }
      }
    ]);

    return matches;
  } catch (error) {
    console.error('Skill-based matching error:', error);
    return [];
  }
};

// Helper function to calculate compatibility
const calculateCompatibility = (profile1, profile2) => {
  let score = 0;
  const breakdown = {};

  // Skills compatibility (40% of total score)
  const skillsScore = calculateSkillsCompatibility(profile1.skills || [], profile2.skills || []);
  score += skillsScore * 0.4;
  breakdown.skills = skillsScore;

  // Location compatibility (20% of total score)
  const locationScore = calculateLocationCompatibility(profile1.location, profile2.location);
  score += locationScore * 0.2;
  breakdown.location = locationScore;

  // Experience compatibility (25% of total score)
  const experienceScore = calculateExperienceCompatibility(profile1.experience || [], profile2.experience || []);
  score += experienceScore * 0.25;
  breakdown.experience = experienceScore;

  // Interest compatibility (15% of total score)
  const interestScore = calculateInterestCompatibility(profile1.projects || [], profile2.projects || []);
  score += interestScore * 0.15;
  breakdown.interests = interestScore;

  // Find common and complementary skills
  const skills1 = profile1.skills || [];
  const skills2 = profile2.skills || [];
  const commonSkills = skills1.filter(skill => skills2.includes(skill));
  const complementarySkills = skills2.filter(skill => !skills1.includes(skill));

  return {
    score: Math.round(score),
    breakdown,
    commonSkills,
    complementarySkills
  };
};

// Helper functions for compatibility calculation
const calculateSkillsCompatibility = (skills1, skills2) => {
  if (skills1.length === 0 || skills2.length === 0) return 0;
  
  const common = skills1.filter(skill => skills2.includes(skill));
  const union = [...new Set([...skills1, ...skills2])];
  
  return Math.round((common.length / union.length) * 100);
};

const calculateLocationCompatibility = (loc1, loc2) => {
  if (!loc1 || !loc2) return 50; // Neutral score if location not provided
  
  if (loc1.country === loc2.country) {
    if (loc1.city === loc2.city) return 100;
    return 75;
  }
  return 25;
};

const calculateExperienceCompatibility = (exp1, exp2) => {
  if (exp1.length === 0 || exp2.length === 0) return 50;
  
  // Simple scoring based on experience levels
  const avgExp1 = exp1.length;
  const avgExp2 = exp2.length;
  
  const diff = Math.abs(avgExp1 - avgExp2);
  return Math.max(0, 100 - (diff * 20));
};

const calculateInterestCompatibility = (proj1, proj2) => {
  if (proj1.length === 0 || proj2.length === 0) return 50;
  
  // Extract technologies from projects
  const tech1 = proj1.flatMap(p => p.technologies || []);
  const tech2 = proj2.flatMap(p => p.technologies || []);
  
  if (tech1.length === 0 || tech2.length === 0) return 50;
  
  const common = tech1.filter(tech => tech2.includes(tech));
  const union = [...new Set([...tech1, ...tech2])];
  
  return Math.round((common.length / union.length) * 100);
};

module.exports = {
  getSuggestions,
  checkCompatibility,
  submitFeedback,
  getMatchHistory
};