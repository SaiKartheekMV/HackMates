const Profile = require('../models/Profile');
const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/profile/:id
// @access  Public
const getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ 
      $or: [
        { _id: req.params.id },
        { user: req.params.id }
      ]
    }).populate('user', 'name email');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all profiles for matching
// @route   GET /api/profiles
// @access  Private
const getProfiles = async (req, res) => {
  try {
    const { page = 1, limit = 10, skills, experience, location } = req.query;
    
    const query = { user: { $ne: req.user.id } }; // Exclude current user
    
    // Add filters
    if (skills) {
      query['skills.technical'] = { $in: skills.split(',') };
    }
    if (experience) {
      query.experience = experience;
    }
    if (location) {
      query['location.city'] = new RegExp(location, 'i');
    }

    const profiles = await Profile.find(query)
      .populate('user', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ updatedAt: -1 });

    const total = await Profile.countDocuments(query);

    res.json({
      success: true,
      profiles,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: profiles.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getProfiles
};