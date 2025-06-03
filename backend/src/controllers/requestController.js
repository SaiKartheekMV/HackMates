const HackRequest = require('../models/HackRequest');
const Team = require('../models/Team');
const User = require('../models/User');
const Hackathon = require('../models/Hackathon');
const { validationResult } = require('express-validator');

// @desc    Get received requests
// @route   GET /api/requests/received
// @access  Private
const getReceivedRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      status = 'pending',
      type,
      hackathonId 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { toUserId: userId };
    
    if (status !== 'all') {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (hackathonId) {
      filter.hackathonId = hackathonId;
    }

    const requests = await HackRequest.find(filter)
      .populate('fromUserId', 'firstName lastName profilePicture')
      .populate('hackathonId', 'title startDate endDate status')
      .populate('teamId', 'name status maxMembers')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HackRequest.countDocuments(filter);

    // Add additional info for each request
    const requestsWithInfo = await Promise.all(
      requests.map(async (request) => {
        const requestObj = request.toObject();
        
        if (request.teamId) {
          // Get current team size
          const team = await Team.findById(request.teamId);
          if (team) {
            const activeMembers = team.members.filter(m => m.status === 'active').length + 1;
            requestObj.teamInfo = {
              currentSize: activeMembers,
              spotsAvailable: team.maxMembers - activeMembers,
              isAvailable: activeMembers < team.maxMembers && team.status === 'forming'
            };
          }
        }
        
        return requestObj;
      })
    );

    res.status(200).json({
      success: true,
      data: {
        requests: requestsWithInfo,
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

// @desc    Get sent requests
// @route   GET /api/requests/sent
// @access  Private
const getSentRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      status = 'pending',
      type,
      hackathonId 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { fromUserId: userId };
    
    if (status !== 'all') {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (hackathonId) {
      filter.hackathonId = hackathonId;
    }

    const requests = await HackRequest.find(filter)
      .populate('toUserId', 'firstName lastName profilePicture')
      .populate('hackathonId', 'title startDate endDate status')
      .populate('teamId', 'name status maxMembers')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await HackRequest.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        requests,
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

// @desc    Send hack request
// @route   POST /api/requests/send
// @access  Private
const sendRequest = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { toUserId, hackathonId, teamId, message, type } = req.body;
    const fromUserId = req.user.id;

    // Validate request type
    const validTypes = ['teammate', 'team_invite'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request type'
      });
    }

    // Cannot send request to yourself
    if (fromUserId === toUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send request to yourself'
      });
    }

    // Verify hackathon exists and is upcoming
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    if (hackathon.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send requests for this hackathon'
      });
    }

    // Verify target user exists
    const toUser = await User.findById(toUserId);
    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    // Check if target user already has a team in this hackathon
    const existingTeam = await Team.findOne({
      hackathonId,
      $or: [
        { leaderId: toUserId },
        { 'members.userId': toUserId, 'members.status': 'active' }
      ]
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'User already has a team in this hackathon'
      });
    }

    // Type-specific validations
    if (type === 'team_invite') {
      // Verify team exists and sender is the leader
      if (!teamId) {
        return res.status(400).json({
          success: false,
          message: 'Team ID required for team invitations'
        });
      }

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // Check if sender is team leader
      if (team.leaderId.toString() !== fromUserId) {
        return res.status(403).json({
          success: false,
          message: 'Only team leaders can send invitations'
        });
      }

      // Check if team has available spots
      const activeMembers = team.members.filter(m => m.status === 'active').length + 1; // +1 for leader
      if (activeMembers >= team.maxMembers) {
        return res.status(400).json({
          success: false,
          message: 'Team is already full'
        });
      }

      // Check if team is still forming
      if (team.status !== 'forming') {
        return res.status(400).json({
          success: false,
          message: 'Team is no longer accepting new members'
        });
      }

      // Check if team belongs to the same hackathon
      if (team.hackathonId.toString() !== hackathonId) {
        return res.status(400).json({
          success: false,
          message: 'Team does not belong to this hackathon'
        });
      }

    } else if (type === 'teammate') {
      // For teammate requests, sender should not have a team yet or should be looking for team
      const senderTeam = await Team.findOne({
        hackathonId,
        $or: [
          { leaderId: fromUserId },
          { 'members.userId': fromUserId, 'members.status': 'active' }
        ]
      });

      if (senderTeam) {
        return res.status(400).json({
          success: false,
          message: 'You already have a team in this hackathon'
        });
      }
    }

    // Check for duplicate requests
    const existingRequest = await HackRequest.findOne({
      fromUserId,
      toUserId,
      hackathonId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Request already sent to this user'
      });
    }

    // Create the request
    const hackRequest = new HackRequest({
      fromUserId,
      toUserId,
      hackathonId,
      teamId: type === 'team_invite' ? teamId : undefined,
      message,
      type,
      status: 'pending'
    });

    await hackRequest.save();

    // Populate the request for response
    await hackRequest.populate([
      { path: 'fromUserId', select: 'firstName lastName profilePicture' },
      { path: 'toUserId', select: 'firstName lastName profilePicture' },
      { path: 'hackathonId', select: 'title startDate endDate' },
      { path: 'teamId', select: 'name status maxMembers' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Request sent successfully',
      data: hackRequest
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Accept hack request
// @route   PUT /api/requests/:id/accept
// @access  Private
const acceptRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;

    // Find the request
    const request = await HackRequest.findById(requestId)
      .populate('fromUserId', 'firstName lastName')
      .populate('hackathonId', 'title')
      .populate('teamId');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Verify user is the recipient
    if (request.toUserId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to accept this request'
      });
    }

    // Check if request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    // Check if user still doesn't have a team
    const existingTeam = await Team.findOne({
      hackathonId: request.hackathonId,
      $or: [
        { leaderId: userId },
        { 'members.userId': userId, 'members.status': 'active' }
      ]
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You already have a team in this hackathon'
      });
    }

    if (request.type === 'team_invite') {
      // Join the team
      const team = request.teamId;
      
      // Verify team still has space
      const activeMembers = team.members.filter(m => m.status === 'active').length + 1;
      if (activeMembers >= team.maxMembers) {
        return res.status(400).json({
          success: false,
          message: 'Team is now full'
        });
      }

      // Add user to team
      team.members.push({
        userId: userId,
        role: 'member',
        joinedAt: new Date(),
        status: 'active'
      });

      // Update team status if now complete
      const newActiveMembers = team.members.filter(m => m.status === 'active').length + 1;
      if (newActiveMembers >= team.maxMembers) {
        team.status = 'complete';
      }

      await team.save();

    } else if (request.type === 'teammate') {
      // Create a new team with both users
      const newTeam = new Team({
        name: `${request.fromUserId.firstName} & ${req.user.firstName}'s Team`,
        hackathonId: request.hackathonId,
        leaderId: request.fromUserId._id,
        members: [
          {
            userId: userId,
            role: 'member',
            joinedAt: new Date(),
            status: 'active'
          }
        ],
        maxMembers: 4, // Default team size
        isPublic: false,
        status: 'forming'
      });

      await newTeam.save();
    }

    // Update request status
    request.status = 'accepted';
    await request.save();

    // Cancel any other pending requests for the same hackathon for both users
    await HackRequest.updateMany(
      {
        $or: [
          { toUserId: userId, hackathonId: request.hackathonId, status: 'pending' },
          { fromUserId: userId, hackathonId: request.hackathonId, status: 'pending' },
          { toUserId: request.fromUserId._id, hackathonId: request.hackathonId, status: 'pending' },
          { fromUserId: request.fromUserId._id, hackathonId: request.hackathonId, status: 'pending' }
        ],
        _id: { $ne: requestId }
      },
      { status: 'rejected' }
    );

    res.status(200).json({
      success: true,
      message: 'Request accepted successfully',
      data: request
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Reject hack request
// @route   PUT /api/requests/:id/reject
// @access  Private
const rejectRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;

    // Find the request
    const request = await HackRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Verify user is the recipient
    if (request.toUserId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to reject this request'
      });
    }

    // Check if request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Request has already been processed'
      });
    }

    // Update request status
    request.status = 'rejected';
    await request.save();

    res.status(200).json({
      success: true,
      message: 'Request rejected successfully',
      data: request
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Cancel hack request
// @route   DELETE /api/requests/:id
// @access  Private
const cancelRequest = async (req, res, next) => {
  try {
    const requestId = req.params.id;
    const userId = req.user.id;

    // Find the request
    const request = await HackRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Verify user is the sender
    if (request.fromUserId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this request'
      });
    }

    // Can only cancel pending requests
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending requests'
      });
    }

    // Delete the request
    await HackRequest.findByIdAndDelete(requestId);

    res.status(200).json({
      success: true,
      message: 'Request cancelled successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get request statistics
// @route   GET /api/requests/stats
// @access  Private
const getRequestStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { hackathonId } = req.query;

    const filter = hackathonId ? { hackathonId } : {};

    const stats = await Promise.all([
      // Received requests stats
      HackRequest.countDocuments({ 
        toUserId: userId, 
        status: 'pending',
        ...filter 
      }),
      HackRequest.countDocuments({ 
        toUserId: userId, 
        status: 'accepted',
        ...filter 
      }),
      
      // Sent requests stats
      HackRequest.countDocuments({ 
        fromUserId: userId, 
        status: 'pending',
        ...filter 
      }),
      HackRequest.countDocuments({ 
        fromUserId: userId, 
        status: 'accepted',
        ...filter 
      }),
      HackRequest.countDocuments({ 
        fromUserId: userId, 
        status: 'rejected',
        ...filter 
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        received: {
          pending: stats[0],
          accepted: stats[1]
        },
        sent: {
          pending: stats[2],
          accepted: stats[3],
          rejected: stats[4]
        }
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReceivedRequests,
  getSentRequests,
  sendRequest,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  getRequestStats
};