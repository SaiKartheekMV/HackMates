// controllers/matchController.js
const { Match } = require('../models/Team');
const Profile = require('../models/Profile');
const { calculateMatchScore } = require('../services/matchMaker');

// @desc    Get AI-powered matches for user
// @route   GET /api/matches/:eventId
// @access  Private
const getMatches = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { limit = 10, minScore = 50 } = req.query;

    // Get current user's profile
    const userProfile = await Profile.findOne({ user: req.user.id });
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    // Get all other profiles
    const otherProfiles = await Profile.find({
      user: { $ne: req.user.id }
    }).populate('user', 'name email');

    // Calculate match scores using AI algorithm
    const matches = [];
    for (const profile of otherProfiles) {
      const matchScore = await calculateMatchScore(userProfile, profile, eventId);
      
      if (matchScore >= minScore) {
        matches.push({
          profile,
          matchScore,
          matchDetails: matchScore.details
        });
      }
    }

    // Sort by match score and limit results
    matches.sort((a, b) => b.matchScore - a.matchScore);
    const limitedMatches = matches.slice(0, parseInt(limit));

    res.json({
      success: true,
      matches: limitedMatches,
      count: limitedMatches.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Send match request (hack request)
// @route   POST /api/matches/request
// @access  Private
const sendMatchRequest = async (req, res) => {
  try {
    const { recipientId, eventId, message, teamId } = req.body;

    // Check if match request already exists
    const existingMatch = await Match.findOne({
      requester: req.user.id,
      recipient: recipientId,
      event: eventId,
      status: 'Pending'
    });

    if (existingMatch) {
      return res.status(400).json({
        success: false,
        message: 'Match request already sent to this user'
      });
    }

    // Get profiles for match calculation
    const requesterProfile = await Profile.findOne({ user: req.user.id });
    const recipientProfile = await Profile.findOne({ user: recipientId });

    if (!requesterProfile || !recipientProfile) {
      return res.status(404).json({
        success: false,
        message: 'User profiles not found'
      });
    }

    // Calculate match score
    const matchScore = await calculateMatchScore(requesterProfile, recipientProfile, eventId);

    // Create match request
    const match = await Match.create({
      requester: req.user.id,
      recipient: recipientId,
      event: eventId,
      matchScore: matchScore.score,
      matchDetails: matchScore.details,
      message,
      team: teamId,
      requestType: teamId ? 'TeamInvite' : 'DirectMatch'
    });

    const populatedMatch = await Match.findById(match._id)
      .populate('requester', 'name email')
      .populate('recipient', 'name email')
      .populate('event', 'title')
      .populate('team', 'name');

    res.status(201).json({
      success: true,
      match: populatedMatch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get match requests (sent and received)
// @route   GET /api/matches/requests
// @access  Private
const getMatchRequests = async (req, res) => {
  try {
    const { type = 'all', status = 'all' } = req.query;

    let query = {};

    // Filter by type (sent/received/all)
    if (type === 'sent') {
      query.requester = req.user.id;
    } else if (type === 'received') {
      query.recipient = req.user.id;
    } else {
      query.$or = [
        { requester: req.user.id },
        { recipient: req.user.id }
      ];
    }

    // Filter by status
    if (status !== 'all') {
      query.status = status;
    }

    const matches = await Match.find(query)
      .populate('requester', 'name email')
      .populate('recipient', 'name email')
      .populate('event', 'title startDate')
      .populate('team', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      matches,
      count: matches.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Respond to match request
// @route   PUT /api/matches/:id/respond
// @access  Private
const respondToMatch = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'

    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match request not found'
      });
    }

    // Check if user is the recipient
    if (match.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to respond to this match request'
      });
    }

    // Check if match is still pending
    if (match.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Match request has already been responded to'
      });
    }

    // Validate action
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "accept" or "reject"'
      });
    }

    // Update match status
    match.status = action === 'accept' ? 'Accepted' : 'Rejected';
    match.respondedAt = new Date();
    await match.save();

    // If accepted and it's a team invite, add user to team
    if (action === 'accept' && match.requestType === 'TeamInvite' && match.team) {
      const Team = require('../models/Team');
      await Team.findByIdAndUpdate(
        match.team,
        { $addToSet: { members: req.user.id } }
      );
    }

    const updatedMatch = await Match.findById(match._id)
      .populate('requester', 'name email')
      .populate('recipient', 'name email')
      .populate('event', 'title')
      .populate('team', 'name');

    res.json({
      success: true,
      match: updatedMatch,
      message: `Match request ${action}ed successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cancel/withdraw match request
// @route   DELETE /api/matches/:id
// @access  Private
const cancelMatchRequest = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match request not found'
      });
    }

    // Check if user is the requester
    if (match.requester.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this match request'
      });
    }

    // Can only cancel pending requests
    if (match.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending match requests'
      });
    }

    await Match.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Match request cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get match statistics for user
// @route   GET /api/matches/stats
// @access  Private
const getMatchStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Count sent requests
    const sentRequests = await Match.countDocuments({ requester: userId });
    const sentAccepted = await Match.countDocuments({ 
      requester: userId, 
      status: 'Accepted' 
    });
    const sentPending = await Match.countDocuments({ 
      requester: userId, 
      status: 'Pending' 
    });
    const sentRejected = await Match.countDocuments({ 
      requester: userId, 
      status: 'Rejected' 
    });

    // Count received requests
    const receivedRequests = await Match.countDocuments({ recipient: userId });
    const receivedAccepted = await Match.countDocuments({ 
      recipient: userId, 
      status: 'Accepted' 
    });
    const receivedPending = await Match.countDocuments({ 
      recipient: userId, 
      status: 'Pending' 
    });
    const receivedRejected = await Match.countDocuments({ 
      recipient: userId, 
      status: 'Rejected' 
    });

    // Calculate success rates
    const sentSuccessRate = sentRequests > 0 ? 
      Math.round((sentAccepted / sentRequests) * 100) : 0;
    const receivedAcceptanceRate = receivedRequests > 0 ? 
      Math.round((receivedAccepted / receivedRequests) * 100) : 0;

    res.json({
      success: true,
      stats: {
        sent: {
          total: sentRequests,
          accepted: sentAccepted,
          pending: sentPending,
          rejected: sentRejected,
          successRate: sentSuccessRate
        },
        received: {
          total: receivedRequests,
          accepted: receivedAccepted,
          pending: receivedPending,
          rejected: receivedRejected,
          acceptanceRate: receivedAcceptanceRate
        },
        totalMatches: sentAccepted + receivedAccepted
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

// @desc    Get mutual matches (both users matched with each other)
// @route   GET /api/matches/mutual
// @access  Private
const getMutualMatches = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find matches where current user sent request and it was accepted
    const sentAccepted = await Match.find({
      requester: userId,
      status: 'Accepted'
    }).select('recipient event');

    // Find matches where current user received request and accepted it
    const receivedAccepted = await Match.find({
      recipient: userId,
      status: 'Accepted'
    }).select('requester event');

    // Find mutual matches (both users accepted each other's requests)
    const mutualMatches = [];
    
    for (const sent of sentAccepted) {
      const mutual = receivedAccepted.find(
        received => 
          received.requester.toString() === sent.recipient.toString() &&
          received.event.toString() === sent.event.toString()
      );
      
      if (mutual) {
        mutualMatches.push({
          user: sent.recipient,
          event: sent.event,
          matchedAt: sent.respondedAt
        });
      }
    }

    // Populate user and event details
    const populatedMutualMatches = await Match.populate(mutualMatches, [
      { path: 'user', select: 'name email' },
      { path: 'event', select: 'title startDate' }
    ]);

    res.json({
      success: true,
      mutualMatches: populatedMutualMatches,
      count: populatedMutualMatches.length
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
  getMatches,
  sendMatchRequest,
  getMatchRequests,
  respondToMatch,
  cancelMatchRequest,
  getMatchStats,
  getMutualMatches
};