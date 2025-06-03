const User = require('../models/User');
const Profile = require('../models/Profile');
const HackRequest = require('../models/HackRequest');
const Team = require('../models/Team');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('profile');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user
// @route   PUT /api/users/me
// @access  Private
const updateCurrentUser = async (req, res, next) => {
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
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      preferences
    } = req.body;

    // Check if email is already taken by another user
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.user.id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email.toLowerCase();
    if (phone) updateData.phone = phone;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user password
// @route   PUT /api/users/me/password
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
const getDashboard = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's teams
    const teams = await Team.find({
      $or: [
        { leaderId: userId },
        { 'members.userId': userId, 'members.status': 'active' }
      ]
    })
    .populate('hackathonId', 'title startDate endDate status')
    .populate('leaderId', 'firstName lastName profilePicture')
    .limit(5)
    .sort({ createdAt: -1 });

    // Get pending requests
    const pendingRequests = await HackRequest.countDocuments({
      toUserId: userId,
      status: 'pending'
    });

    // Get sent requests
    const sentRequests = await HackRequest.countDocuments({
      fromUserId: userId,
      status: 'pending'
    });

    // Get user's recent activity/matches
    const recentRequests = await HackRequest.find({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    })
    .populate('fromUserId', 'firstName lastName profilePicture')
    .populate('toUserId', 'firstName lastName profilePicture')
    .populate('hackathonId', 'title startDate')
    .sort({ createdAt: -1 })
    .limit(10);

    // Get profile completion status
    const profile = await Profile.findOne({ userId });
    const completionScore = profile ? profile.completionScore || 0 : 0;

    const dashboardData = {
      user: {
        id: req.user.id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email,
        profilePicture: req.user.profilePicture
      },
      stats: {
        activeTeams: teams.length,
        pendingRequests,
        sentRequests,
        profileCompletion: completionScore
      },
      recentTeams: teams,
      recentActivity: recentRequests
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/me
// @access  Private
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user is a team leader
    const leaderTeams = await Team.find({ 
      leaderId: userId,
      status: { $in: ['forming', 'complete'] }
    });

    if (leaderTeams.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account while leading active teams. Please transfer leadership or disband teams first.'
      });
    }

    // Remove user from all teams
    await Team.updateMany(
      { 'members.userId': userId },
      { 
        $pull: { members: { userId } }
      }
    );

    // Delete all hack requests involving this user
    await HackRequest.deleteMany({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    });

    // Delete user profile
    await Profile.findOneAndDelete({ userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Get hack requests as notifications
    const notifications = await HackRequest.find({
      toUserId: req.user.id
    })
    .populate('fromUserId', 'firstName lastName profilePicture')
    .populate('hackathonId', 'title')
    .populate('teamId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await HackRequest.countDocuments({
      toUserId: req.user.id
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notifications as read
// @route   PUT /api/users/notifications/read
// @access  Private
const markNotificationsRead = async (req, res, next) => {
  try {
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'notificationIds array is required'
      });
    }

    await HackRequest.updateMany(
      {
        _id: { $in: notificationIds },
        toUserId: req.user.id
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'Notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Count teams user is part of
    const totalTeams = await Team.countDocuments({
      $or: [
        { leaderId: userId },
        { 'members.userId': userId, 'members.status': 'active' }
      ]
    });

    // Count teams user is leading
    const teamsLed = await Team.countDocuments({
      leaderId: userId
    });

    // Count successful collaborations (accepted requests)
    const successfulConnections = await HackRequest.countDocuments({
      $or: [
        { fromUserId: userId, status: 'accepted' },
        { toUserId: userId, status: 'accepted' }
      ]
    });

    // Count total requests sent
    const requestsSent = await HackRequest.countDocuments({
      fromUserId: userId
    });

    // Count total requests received
    const requestsReceived = await HackRequest.countDocuments({
      toUserId: userId
    });

    // Get profile completion
    const profile = await Profile.findOne({ userId });
    const profileCompletion = profile ? profile.completionScore || 0 : 0;

    const stats = {
      totalTeams,
      teamsLed,
      successfulConnections,
      requestsSent,
      requestsReceived,
      profileCompletion,
      memberSince: req.user.createdAt
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users for collaboration
// @route   GET /api/users/search
// @access  Private
const searchUsers = async (req, res, next) => {
  try {
    const { 
      query, 
      skills, 
      location, 
      page = 1, 
      limit = 20,
      hackathonId 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build search criteria
    const searchCriteria = {};
    const profileCriteria = {};

    // Exclude current user
    searchCriteria._id = { $ne: req.user.id };

    // Text search on name
    if (query) {
      searchCriteria.$or = [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } }
      ];
    }

    // Skills filter
    if (skills) {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      profileCriteria.skills = { $in: skillsArray };
    }

    // Location filter
    if (location) {
      profileCriteria.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } }
      ];
    }

    // Find users with profiles
    const users = await User.find(searchCriteria)
      .select('-password -email')
      .populate({
        path: 'profile',
        match: profileCriteria,
        select: 'bio skills location projects socialLinks completionScore'
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Filter out users without matching profiles
    const filteredUsers = users.filter(user => user.profile);

    const total = await User.countDocuments(searchCriteria);

    res.status(200).json({
      success: true,
      data: {
        users: filteredUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  updatePassword,
  getDashboard,
  deleteAccount,
  getNotifications,
  markNotificationsRead,
  getUserStats,
  searchUsers
};