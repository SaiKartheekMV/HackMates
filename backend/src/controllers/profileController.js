// src/controllers/profileController.js
const Profile = require('../models/Profile');
const User = require('../models/User');

// Get current user's profile
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let profile = await Profile.findOne({ userId }).populate('userId', 'firstName lastName email profilePicture');
    
    if (!profile) {
      // Create empty profile if doesn't exist
      profile = new Profile({
        userId,
        bio: '',
        skills: [],
        experience: [],
        education: [],
        projects: [],
        socialLinks: {},
        location: {},
        completionScore: 0
      });
      await profile.save();
      await profile.populate('userId', 'firstName lastName email profilePicture');
    }

    res.json(profile);
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update current user's profile
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;

    // Calculate completion score
    const completionScore = calculateCompletionScore(updateData);
    updateData.completionScore = completionScore;

    const profile = await Profile.findOneAndUpdate(
      { userId },
      updateData,
      { 
        new: true, 
        upsert: true, 
        runValidators: true 
      }
    ).populate('userId', 'firstName lastName email profilePicture');

    res.json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get public profile of any user
const getPublicProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await Profile.findOne({ userId }).populate('userId', 'firstName lastName profilePicture');
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Remove sensitive information for public view
    const publicProfile = {
      _id: profile._id,
      userId: profile.userId,
      bio: profile.bio,
      skills: profile.skills,
      experience: profile.experience,
      education: profile.education,
      projects: profile.projects,
      socialLinks: profile.socialLinks,
      location: profile.location,
      completionScore: profile.completionScore,
      createdAt: profile.createdAt
    };

    res.json(publicProfile);
  } catch (error) {
    console.error('Get public profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Upload and parse resume
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user._id;
    const resumeUrl = req.file.path; // Cloudinary URL

    // Update profile with resume URL
    await Profile.findOneAndUpdate(
      { userId },
      { resumeUrl },
      { upsert: true }
    );

    // TODO: Integrate with AI service to parse resume
    // const parsedData = await aiService.parseResume(resumeUrl);
    // const embedding = await aiService.generateEmbedding(parsedData);

    res.json({
      message: 'Resume uploaded successfully',
      resumeUrl
    });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Calculate profile completion score
const calculateCompletion = async (req, res) => {
  try {
    const userId = req.user._id;
    const profile = await Profile.findOne({ userId });

    if (!profile) {
      return res.json({ completionScore: 0 });
    }

    const completionScore = calculateCompletionScore(profile);
    
    // Update the score in database
    await Profile.findOneAndUpdate(
      { userId },
      { completionScore }
    );

    res.json({ completionScore });
  } catch (error) {
    console.error('Calculate completion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Helper function to calculate completion score
const calculateCompletionScore = (profileData) => {
  let score = 0;
  const maxScore = 100;

  // Bio (10 points)
  if (profileData.bio && profileData.bio.trim().length > 0) {
    score += 10;
  }

  // Skills (20 points)
  if (profileData.skills && profileData.skills.length > 0) {
    score += Math.min(20, profileData.skills.length * 4); // 4 points per skill, max 20
  }

  // Experience (25 points)
  if (profileData.experience && profileData.experience.length > 0) {
    score += Math.min(25, profileData.experience.length * 12); // 12 points per experience, max 25
  }

  // Education (15 points)
  if (profileData.education && profileData.education.length > 0) {
    score += Math.min(15, profileData.education.length * 8); // 8 points per education, max 15
  }

  // Projects (20 points)
  if (profileData.projects && profileData.projects.length > 0) {
    score += Math.min(20, profileData.projects.length * 10); // 10 points per project, max 20
  }

  // Social Links (5 points)
  if (profileData.socialLinks) {
    const socialCount = Object.values(profileData.socialLinks).filter(link => link && link.trim().length > 0).length;
    score += Math.min(5, socialCount * 2); // 2 points per social link, max 5
  }

  // Location (5 points)
  if (profileData.location && (profileData.location.city || profileData.location.country)) {
    score += 5;
  }

  return Math.min(score, maxScore);
};

// Search profiles (for matching)
const searchProfiles = async (req, res) => {
  try {
    const { skills, location, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const query = { userId: { $ne: userId } }; // Exclude current user

    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillsArray };
    }

    if (location) {
      query.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.country': new RegExp(location, 'i') }
      ];
    }

    const profiles = await Profile.find(query)
      .populate('userId', 'firstName lastName profilePicture')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ completionScore: -1, createdAt: -1 });

    const total = await Profile.countDocuments(query);

    res.json({
      profiles,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Search profiles error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
  uploadResume,
  calculateCompletion,
  searchProfiles
};