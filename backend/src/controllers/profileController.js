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
        location: '',
        yearsOfExperience: '',
        skills: [],
        experience: [],
        education: [],
        additionalEducation: '',
        degree: '',
        university: '',
        graduationYear: null,
        hackathonExperience: '',
        projects: [],
        socialLinks: {
          github: '',
          linkedin: '',
          portfolio: ''
        },
        preferredRoles: [],
        availability: '',
        resumeUrl: '',
        resumeData: null,
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

// Update current user's profile - Updated to handle form data
const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const formData = req.body;

    // Transform form data to match database structure
    const updateData = {
      // Basic Info
      bio: formData.bio || '',
      location: formData.location || '',
      yearsOfExperience: formData.yearsOfExperience || '',
      
      // Skills
      skills: formData.skills || [],
      
      // Education from form
      degree: formData.degree || '',
      university: formData.university || '',
      graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : null,
      additionalEducation: formData.education || '', // This maps to the textarea
      hackathonExperience: formData.hackathonExperience || '',
      
      // Social Links
      socialLinks: {
        linkedin: formData.linkedinUrl || '',
        github: formData.githubUrl || '',
        portfolio: formData.portfolioUrl || ''
      },
      
      // Preferences
      preferredRoles: formData.preferredRoles || [],
      availability: formData.availability || '',
      
      // Resume data
      resumeData: formData.resumeData || null
    };

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

    // Return public profile data
    const publicProfile = {
      _id: profile._id,
      userId: profile.userId,
      bio: profile.bio,
      location: profile.location,
      yearsOfExperience: profile.yearsOfExperience,
      skills: profile.skills,
      degree: profile.degree,
      university: profile.university,
      graduationYear: profile.graduationYear,
      hackathonExperience: profile.hackathonExperience,
      experience: profile.experience,
      education: profile.education,
      projects: profile.projects,
      socialLinks: profile.socialLinks,
      preferredRoles: profile.preferredRoles,
      availability: profile.availability,
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

// Updated helper function to calculate completion score
const calculateCompletionScore = (profileData) => {
  let score = 0;
  const maxScore = 100;

  // Bio (10 points)
  if (profileData.bio && profileData.bio.trim().length > 0) {
    score += 10;
  }

  // Location (5 points)
  if (profileData.location && profileData.location.trim().length > 0) {
    score += 5;
  }

  // Years of Experience (10 points)
  if (profileData.yearsOfExperience && profileData.yearsOfExperience.trim().length > 0) {
    score += 10;
  }

  // Skills (20 points)
  if (profileData.skills && profileData.skills.length > 0) {
    score += Math.min(20, profileData.skills.length * 4); // 4 points per skill, max 20
  }

  // Education Info (15 points)
  let educationScore = 0;
  if (profileData.degree && profileData.degree.trim().length > 0) educationScore += 5;
  if (profileData.university && profileData.university.trim().length > 0) educationScore += 5;
  if (profileData.graduationYear) educationScore += 5;
  score += educationScore;

  // Additional Education (5 points)
  if (profileData.additionalEducation && profileData.additionalEducation.trim().length > 0) {
    score += 5;
  }

  // Hackathon Experience (10 points)
  if (profileData.hackathonExperience && profileData.hackathonExperience !== 'none') {
    score += 10;
  }

  // Social Links (10 points)
  if (profileData.socialLinks) {
    let socialScore = 0;
    if (profileData.socialLinks.linkedin && profileData.socialLinks.linkedin.trim().length > 0) socialScore += 4;
    if (profileData.socialLinks.github && profileData.socialLinks.github.trim().length > 0) socialScore += 4;
    if (profileData.socialLinks.portfolio && profileData.socialLinks.portfolio.trim().length > 0) socialScore += 2;
    score += socialScore;
  }

  // Preferred Roles (10 points)
  if (profileData.preferredRoles && profileData.preferredRoles.length > 0) {
    score += Math.min(10, profileData.preferredRoles.length * 3); // 3 points per role, max 10
  }

  // Availability (5 points)
  if (profileData.availability && profileData.availability.trim().length > 0) {
    score += 5;
  }

  return Math.min(score, maxScore);
};

// Search profiles (for matching)
const searchProfiles = async (req, res) => {
  try {
    const { skills, location, roles, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const query = { userId: { $ne: userId } }; // Exclude current user

    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query.skills = { $in: skillsArray };
    }

    if (location) {
      query.location = new RegExp(location, 'i');
    }

    if (roles) {
      const rolesArray = roles.split(',').map(role => role.trim());
      query.preferredRoles = { $in: rolesArray };
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