// controllers/requestController.js
const HackRequest = require('../models/HackRequest');
const Team = require('../models/Team');
const User = require('../models/User');
const Profile = require('../models/Profile');
const { validationResult } = require('express-validator');

const requestController = {
  // Get received requests
  getReceivedRequests: async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const userId = req.user._id;

      const filter = { toUserId: userId };
      if (status) filter.status = status;

      const requests = await HackRequest.find(filter)
        .populate('fromUserId', 'firstName lastName profilePicture')
        .populate('hackathonId', 'title startDate endDate')
        .populate('teamId', 'name description')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await HackRequest.countDocuments(filter);

      res.json({
        success: true,
        data: {
          requests,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            total
          }
        }
      });
    } catch (error) {
      console.error('Get received requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get received requests'
      });
    }
  },

  // Get sent requests
  getSentRequests: async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const userId = req.user._id;

      const filter = { fromUserId: userId };
      if (status) filter.status = status;

      const requests = await HackRequest.find(filter)
        .populate('toUserId', 'firstName lastName profilePicture')
        .populate('hackathonId', 'title startDate endDate')
        .populate('teamId', 'name description')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

      const total = await HackRequest.countDocuments(filter);

      res.json({
        success: true,
        data: {
          requests,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            total
          }
        }
      });
    } catch (error) {
      console.error('Get sent requests error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get sent requests'
      });
    }
  },

  // Send hack request
  sendRequest: async (req, res) => {
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
      const fromUserId = req.user._id;

      // Check if request already exists
      const existingRequest = await HackRequest.findOne({
        fromUserId,
        toUserId,
        hackathonId,
        status: 'pending'
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Request already sent'
        });
      }

      // Validate team if teamId provided
      if (teamId) {
        const team = await Team.findById(teamId);
        if (!team) {
          return res.status(404).json({
            success: false,
            message: 'Team not found'
          });
        }

        if (team.leaderId.toString() !== fromUserId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Only team leader can send team invitations'
          });
        }
      }

      // Create the request
      const request = await HackRequest.create({
        fromUserId,
        toUserId,
        hackathonId,
        teamId,
        message,
        type,
        status: 'pending'
      });

      // Populate the created request for response
      const populatedRequest = await HackRequest.findById(request._id)
        .populate('fromUserId', 'firstName lastName profilePicture')
        .populate('toUserId', 'firstName lastName')
        .populate('hackathonId', 'title')
        .populate('teamId', 'name');

      res.status(201).json({
        success: true,
        data: populatedRequest,
        message: 'Request sent successfully'
      });
    } catch (error) {
      console.error('Send request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send request'
      });
    }
  },

  // Accept request
  acceptRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user._id;

      const request = await HackRequest.findById(requestId)
        .populate('teamId')
        .populate('hackathonId');

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      if (request.toUserId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to accept this request'
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Request is not pending'
        });
      }

      // Update request status
      request.status = 'accepted';
      await request.save();

      // If it's a team invitation, add user to team
      if (request.type === 'team_invite' && request.teamId) {
        const team = await Team.findById(request.teamId);
        
        // Check if team is not full
        if (team.members.length >= team.maxMembers) {
          return res.status(400).json({
            success: false,
            message: 'Team is already full'
          });
        }

        // Add user to team
        team.members.push({
          userId: userId,
          role: 'member',
          joinedAt: new Date(),
          status: 'active'
        });

        await team.save();
      }

      res.json({
        success: true,
        message: 'Request accepted successfully'
      });
    } catch (error) {
      console.error('Accept request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to accept request'
      });
    }
  },

  // Reject request
  rejectRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user._id;

      const request = await HackRequest.findById(requestId);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      if (request.toUserId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to reject this request'
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Request is not pending'
        });
      }

      request.status = 'rejected';
      await request.save();

      res.json({
        success: true,
        message: 'Request rejected successfully'
      });
    } catch (error) {
      console.error('Reject request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reject request'
      });
    }
  },

  // Cancel request
  cancelRequest: async (req, res) => {
    try {
      const { requestId } = req.params;
      const userId = req.user._id;

      const request = await HackRequest.findById(requestId);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      if (request.fromUserId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to cancel this request'
        });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Can only cancel pending requests'
        });
      }

      await HackRequest.findByIdAndDelete(requestId);

      res.json({
        success: true,
        message: 'Request cancelled successfully'
      });
    } catch (error) {
      console.error('Cancel request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel request'
      });
    }
  }
};

module.exports = requestController;