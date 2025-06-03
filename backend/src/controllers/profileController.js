const Profile = require('../models/Profile');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const aiService = require('../services/aiService');
const resumeParserService = require('../services/resumeParserService');
const linkedinService = require('../services/linkedinService');
const cacheService = require('../services/cacheService');
const cloudinary = require('../config/cloudinary');
const multer = require('multer');

// @desc    Get current user's profile
// @route   GET /api/profiles/me
// @access  Private
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update user profile
// @route   PUT /api/profiles/me
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      bio,
      skills,
      experience,
      education,
      projects,
      socialLinks,
      location,
      availability,
      interests
    } = req.body;

    const profileData = {
      userId: req.user.id,
      bio,
      skills: skills || [],
      experience: experience || [],
      education: education || [],
      projects: projects || [],
      socialLinks: socialLinks || {},
      location: location || {},
      availability,
      interests: interests || []
    };

    // Calculate completion score
    profileData.completionScore = calculateCompletionScore(profileData);

    // Generate AI embedding if skills or experience changed
    let embedding = null;
    if (skills || experience || projects) {
      try {
        embedding = await aiService.generateEmbedding({
          skills: profileData.skills,
          experience: profileData.experience,
          projects: profileData.projects
        });
        profileData.aiEmbedding = embedding;
      } catch (error) {
        console.error('AI embedding generation failed:', error);
      }
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      profileData,
      { 
        new: true, 
        upsert: true, 
        runValidators: true 
      }
    );

    // Invalidate cache for user matches
    await cacheService.invalidateUserCache(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public profile by user ID
// @route   GET /api/profiles/:userId
// @access  Private
const getPublicProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('firstName lastName profilePicture createdAt');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profile = await Profile.findOne({ userId })
      .select('-aiEmbedding'); // Don't expose AI embeddings

    const publicProfile = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        memberSince: user.createdAt
      },
      profile: profile || null
    };

    res.status(200).json({
      success: true,
      data: publicProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload and parse resume
// @route   POST /api/profiles/upload-resume
// @access  Private
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file uploaded'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto',
      folder: 'hackmates/resumes',
      public_id: `resume_${req.user.id}_${Date.now()}`
    });

    // Parse resume using AI service
    let parsedData = {};
    try {
      parsedData = await resumeParserService.parseResume(req.file.buffer);
    } catch (parseError) {
      console.error('Resume parsing failed:', parseError);
      // Continue with manual upload even if parsing fails
    }

    // Update profile with resume URL and parsed data
    const updateData = {
      resumeUrl: result.secure_url,
      ...parsedData
    };

    // Generate AI embedding if we have parsed data
    if (parsedData.skills || parsedData.experience) {
      try {
        const embedding = await aiService.generateEmbedding(parsedData);
        updateData.aiEmbedding = embedding;
      } catch (embeddingError) {
        console.error('Embedding generation failed:', embeddingError);
      }
    }

    // Calculate completion score
    const existingProfile = await Profile.findOne({ userId: req.user.id });
    const mergedData = { ...existingProfile?.toObject(), ...updateData };
    updateData.completionScore = calculateCompletionScore(mergedData);

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      updateData,
      { new: true, upsert: true }
    );

    // Invalidate cache
    await cacheService.invalidateUserCache(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Resume uploaded and processed successfully',
      data: {
        resumeUrl: result.secure_url,
        parsedData: parsedData,
        profile: profile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Import LinkedIn profile data
// @route   POST /api/profiles/linkedin
// @access  Private
const importLinkedIn = async (req, res, next) => {
  try {
    const { linkedinUrl } = req.body;

    if (!linkedinUrl) {
      return res.status(400).json({
        success: false,
        message: 'LinkedIn URL is required'
      });
    }

    // Scrape LinkedIn data
    let linkedinData = {};
    try {
      linkedinData = await linkedinService.scrapeProfile(linkedinUrl);
    } catch (scrapeError) {
      return res.status(400).json({
        success: false,
        message: 'Failed to import LinkedIn data. Please check the URL and try again.'
      });
    }

    // Merge with existing profile
    const existingProfile = await Profile.findOne({ userId: req.user.id });
    const mergedData = mergeProfileData(existingProfile, linkedinData);

    // Generate AI embedding
    let embedding = null;
    try {
      embedding = await aiService.generateEmbedding({
        skills: mergedData.skills,
        experience: mergedData.experience,
        projects: mergedData.projects
      });
      mergedData.aiEmbedding = embedding;
    } catch (embeddingError) {
      console.error('Embedding generation failed:', embeddingError);
    }

    // Calculate completion score
    mergedData.completionScore = calculateCompletionScore(mergedData);

    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      mergedData,
      { new: true, upsert: true }
    );

    // Invalidate cache
    await cacheService.invalidateUserCache(req.user.id);

    res.status(200).json({
      success: true,
      message: 'LinkedIn data imported successfully',
      data: {
        importedData: linkedinData,
        profile: profile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get profile completion suggestions
// @route   GET /api/profiles/suggestions
// @access  Private
const getCompletionSuggestions = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    
    const suggestions = [];

    if (!profile) {
      suggestions.push({
        field: 'profile',
        message: 'Create your profile to get started',
        priority: 'high'
      });
    } else {
      // Check missing fields
      if (!profile.bio || profile.bio.length < 50) {
        suggestions.push({
          field: 'bio',
          message: 'Add a compelling bio (at least 50 characters)',
          priority: 'high'
        });
      }

      if (!profile.skills || profile.skills.length < 3) {
        suggestions.push({
          field: 'skills',
          message: 'Add at least 3 technical skills',
          priority: 'high'
        });
      }

      if (!profile.experience || profile.experience.length === 0) {
        suggestions.push({
          field: 'experience',
          message: 'Add your work or project experience',
          priority: 'medium'
        });
      }

      if (!profile.projects || profile.projects.length === 0) {
        suggestions.push({
          field: 'projects',
          message: 'Showcase your projects to attract teammates',
          priority: 'high'
        });
      }

      if (!profile.socialLinks?.github) {
        suggestions.push({
          field: 'socialLinks.github',
          message: 'Add your GitHub profile',
          priority: 'medium'
        });
      }

      if (!profile.location?.city) {
        suggestions.push({
          field: 'location',
          message: 'Add your location for better matching',
          priority: 'low'
        });
      }

      if (!profile.resumeUrl) {
        suggestions.push({
          field: 'resume',
          message: 'Upload your resume for better profile parsing',
          priority: 'medium'
        });
      }
    }

    const completionScore = profile ? profile.completionScore || 0 : 0;

    res.status(200).json({
      success: true,
      data: {
        completionScore,
        suggestions,
        totalSuggestions: suggestions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get skill suggestions based on profile
// @route   GET /api/profiles/skill-suggestions
// @access  Private
const getSkillSuggestions = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    // Get skill suggestions from AI service
    let suggestedSkills = [];
    try {
      suggestedSkills = await aiService.suggestSkills({
        currentSkills: profile.skills || [],
        experience: profile.experience || [],
        projects: profile.projects || []
      });
    } catch (error) {
      console.error('Skill suggestion failed:', error);
      // Fallback to basic suggestions
      suggestedSkills = getBasicSkillSuggestions(profile.skills || []);
    }

    res.status(200).json({
      success: true,
      data: {
        suggestedSkills,
        currentSkills: profile.skills || []
      }
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate profile completion score
const calculateCompletionScore = (profileData) => {
  let score = 0;
  const maxScore = 100;

  // Bio (20 points)
  if (profileData.bio && profileData.bio.length >= 50) score += 20;
  else if (profileData.bio && profileData.bio.length >= 20) score += 10;

  // Skills (20 points)
  if (profileData.skills && profileData.skills.length >= 5) score += 20;
  else if (profileData.skills && profileData.skills.length >= 3) score += 15;
  else if (profileData.skills && profileData.skills.length >= 1) score += 10;

  // Experience (15 points)
  if (profileData.experience && profileData.experience.length >= 2) score += 15;
  else if (profileData.experience && profileData.experience.length >= 1) score += 10;

  // Projects (15 points)
  if (profileData.projects && profileData.projects.length >= 3) score += 15;
  else if (profileData.projects && profileData.projects.length >= 1) score += 10;

  // Education (10 points)
  if (profileData.education && profileData.education.length >= 1) score += 10;

  // Social Links (10 points)
  let socialScore = 0;
  if (profileData.socialLinks?.github) socialScore += 5;
  if (profileData.socialLinks?.linkedin) socialScore += 3;
  if (profileData.socialLinks?.portfolio) socialScore += 2;
  score += Math.min(socialScore, 10);

  // Location (5 points)
  if (profileData.location?.city) score += 5;

  // Resume (5 points)
  if (profileData.resumeUrl) score += 5;

  return Math.min(score, maxScore);
};

// Helper function to merge profile data
const mergeProfileData = (existingProfile, newData) => {
  const existing = existingProfile ? existingProfile.toObject() : {};
  
  return {
    ...existing,
    ...newData,
    skills: [...new Set([...(existing.skills || []), ...(newData.skills || [])])],
    experience: newData.experience || existing.experience || [],
    education: newData.education || existing.education || [],
    projects: [...(existing.projects || []), ...(newData.projects || [])],
    socialLinks: { ...existing.socialLinks, ...newData.socialLinks }
  };
};

// Helper function for basic skill suggestions
const getBasicSkillSuggestions = (currentSkills) => {
  const allSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'MongoDB', 'SQL',
    'HTML', 'CSS', 'Git', 'Docker', 'AWS', 'Machine Learning',
    'Data Analysis', 'UI/UX Design', 'Flutter', 'React Native',
    'Java', 'C++', 'TypeScript', 'GraphQL', 'Redis', 'PostgreSQL'
  ];

  return allSkills
    .filter(skill => !currentSkills.includes(skill))
    .slice(0, 10);
};

module.exports = {
  getMyProfile,
  updateProfile,
  getPublicProfile,
  uploadResume,
  importLinkedIn,
  getCompletionSuggestions,
  getSkillSuggestions
};