const Team = require('../models/Team');
const User = require('../models/User');
const Hackathon = require('../models/Hackathon');
const HackRequest = require('../models/HackRequest');
const { validationResult } = require('express-validator');
const cacheService = require('../services/cacheService');

// @desc    Get user's teams
// @route   GET /api/teams/my
// @access  Private
const getMyTeams = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, hackathonId } = req.query;

    const filter = {
      $or: [
        { leaderId: userId },
        { 'members.userId': userId, 'members.status': 'active' }
      ]
    };

    if (status) {
      filter.status = status;
    }

    if (hackathonId) {
      filter.hackathonId = hackathonId;
    }

    const teams = await Team.find(filter)
      .populate('hackathonId', 'title startDate endDate status')
      .populate('leaderId', 'firstName lastName profilePicture')
      .populate('members.userId', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 });

    // Add user role and availability info
    const teamsWithRole = teams.map(team => {
      const teamObj = team.toObject();
      const isLeader = team.leaderId._id.toString() === userId;
      const memberInfo = team.members.find(m => 
        m.userId._id.toString() === userId && m.status === 'active'
      );

      teamObj.userRole = isLeader ? 'leader' : (memberInfo ? memberInfo.role : null);
      
      // Calculate availability
      const activeMembers = team.members.filter(m => m.status === 'active').length + 1; // +1 for leader
      teamObj.spotsAvailable = team.maxMembers - activeMembers;
      teamObj.isAvailable = teamObj.spotsAvailable > 0 && team.isPublic && team.status === 'forming';

      return teamObj;
    });

    res.status(200).json({
      success: true,
      data: teamsWithRole
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { hackathonId, name, description, requiredSkills, maxMembers, isPublic } = req.body;
    const userId = req.user.id;

    // Verify hackathon exists and is accepting teams
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
        message: 'Cannot create team for this hackathon'
      });
    }

    // Check if user already has a team in this hackathon
    const existingTeam = await Team.findOne({
      hackathonId,
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

    // Validate team size against hackathon limits
    const hackathonMaxSize = hackathon.teamSize?.max || 6;
    const hackathonMinSize = hackathon.teamSize?.min || 1;

    if (maxMembers > hackathonMaxSize || maxMembers < hackathonMinSize) {
      return res.status(400).json({
        success: false,
        message: `Team size must be between ${hackathonMinSize} and ${hackathonMaxSize} members`
      });
    }

    const teamData = {
      name,
      description,
      hackathonId,
      leaderId: userId,
      requiredSkills: requiredSkills || [],
      maxMembers: maxMembers || hackathonMaxSize,
      isPublic: isPublic !== undefined ? isPublic : true,
      status: 'forming',
      members: []
    };

    const team = await Team.create(teamData);

    // Populate the created team
    const populatedTeam = await Team.findById(team._id)
      .populate('hackathonId', 'title startDate endDate teamSize')
      .populate('leaderId', 'firstName lastName profilePicture');

    // Clear hackathon teams cache
    await cacheService.clearPattern(`hackathon:${hackathonId}:*`);

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: populatedTeam
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get team by ID
// @route   GET /api/teams/:id
// @access  Private
const getTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const team = await Team.findById(id)
      .populate('hackathonId', 'title startDate endDate status teamSize')
      .populate('leaderId', 'firstName lastName profilePicture')
      .populate('members.userId', 'firstName lastName profilePicture');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user has access to view this team
    const isLeader = team.leaderId._id.toString() === userId;
    const isMember = team.members.some(m => 
      m.userId._id.toString() === userId && m.status === 'active'
    );
    const isPublic = team.isPublic;

    if (!isLeader && !isMember && !isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to view this team'
      });
    }

    const teamObj = team.toObject();
    
    // Add user-specific information
    teamObj.userRole = isLeader ? 'leader' : (isMember ? 
      team.members.find(m => m.userId._id.toString() === userId)?.role : null
    );
    
    // Calculate availability
    const activeMembers = team.members.filter(m => m.status === 'active').length + 1;
    teamObj.spotsAvailable = team.maxMembers - activeMembers;
    teamObj.isAvailable = teamObj.spotsAvailable > 0 && team.isPublic && team.status === 'forming';

    // Check if current user has pending request to join
    if (!isLeader && !isMember) {
      const pendingRequest = await HackRequest.findOne({
        fromUserId: userId,
        teamId: id,
        status: 'pending'
      });
      teamObj.hasPendingRequest = !!pendingRequest;
    }

    res.status(200).json({
      success: true,
      data: teamObj
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private
const updateTeam = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Only team leader can update team
    if (team.leaderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can update team details'
      });
    }

    // Prevent updates if team is already competing
    if (team.status === 'competing') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update team while competing'
      });
    }

    // Validate maxMembers if being updated
    if (updateData.maxMembers) {
      const hackathon = await Hackathon.findById(team.hackathonId);
      const hackathonMaxSize = hackathon.teamSize?.max || 6;
      const hackathonMinSize = hackathon.teamSize?.min || 1;

      if (updateData.maxMembers > hackathonMaxSize || updateData.maxMembers < hackathonMinSize) {
        return res.status(400).json({
          success: false,
          message: `Team size must be between ${hackathonMinSize} and ${hackathonMaxSize} members`
        });
      }

      // Check if new max size is less than current team size
      const currentSize = team.members.filter(m => m.status === 'active').length + 1;
      if (updateData.maxMembers < currentSize) {
        return res.status(400).json({
          success: false,
          message: 'Cannot reduce team size below current member count'
        });
      }
    }

    // Remove fields that shouldn't be updated directly
    delete updateData.leaderId;
    delete updateData.hackathonId;
    delete updateData.members;
    delete updateData.status;

    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('hackathonId', 'title startDate endDate teamSize')
      .populate('leaderId', 'firstName lastName profilePicture')
      .populate('members.userId', 'firstName lastName profilePicture');

    // Clear cache
    await cacheService.clearPattern(`team:${id}:*`);
    await cacheService.clearPattern(`hackathon:${team.hackathonId}:*`);

    res.status(200).json({
      success: true,
      message: 'Team updated successfully',
      data: updatedTeam
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private
const deleteTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Only team leader can delete team
    if (team.leaderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can delete team'
      });
    }

    // Cannot delete if hackathon has started
    const hackathon = await Hackathon.findById(team.hackathonId);
    if (hackathon.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete team after hackathon has started'
      });
    }

    // Delete related hack requests
    await HackRequest.deleteMany({ teamId: id });

    // Delete the team
    await Team.findByIdAndDelete(id);

    // Clear cache
    await cacheService.clearPattern(`team:${id}:*`);
    await cacheService.clearPattern(`hackathon:${team.hackathonId}:*`);

    res.status(200).json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join public team
// @route   POST /api/teams/:id/join
// @access  Private
const joinTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role = 'member' } = req.body;
    const userId = req.user.id;

    const team = await Team.findById(id).populate('hackathonId');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if team is public and accepting members
    if (!team.isPublic) {
      return res.status(400).json({
        success: false,
        message: 'This team is private. You need an invitation to join.'
      });
    }

    if (team.status !== 'forming') {
      return res.status(400).json({
        success: false,
        message: 'Team is not accepting new members'
      });
    }

    // Check if user is team leader
    if (team.leaderId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You are already the leader of this team'
      });
    }

    // Check if user is already a member
    const existingMember = team.members.find(m => 
      m.userId.toString() === userId && m.status === 'active'
    );
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team'
      });
    }

    // Check if user has another team in same hackathon
    const existingTeam = await Team.findOne({
      hackathonId: team.hackathonId,
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

    // Check if team has available spots
    const activeMembers = team.members.filter(m => m.status === 'active').length + 1;
    if (activeMembers >= team.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Team is full'
      });
    }

    // Add user to team
    team.members.push({
      userId,
      role,
      joinedAt: new Date(),
      status: 'active'
    });

    // Update team status if team is now at max capacity
    if (activeMembers + 1 >= team.maxMembers) {
      team.status = 'complete';
    }

    await team.save();

    // Populate the updated team
    const updatedTeam = await Team.findById(id)
      .populate('hackathonId', 'title startDate endDate')
      .populate('leaderId', 'firstName lastName profilePicture')
      .populate('members.userId', 'firstName lastName profilePicture');

    // Clear cache
    await cacheService.clearPattern(`team:${id}:*`);
    await cacheService.clearPattern(`hackathon:${team.hackathonId}:*`);

    res.status(200).json({
      success: true,
      message: 'Successfully joined the team',
      data: updatedTeam
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave team
// @route   POST /api/teams/:id/leave
// @access  Private
const leaveTeam = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const team = await Team.findById(id).populate('hackathonId');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Team leader cannot leave (must transfer leadership or delete team)
    if (team.leaderId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Team leader cannot leave. Transfer leadership or delete the team.'
      });
    }

    // Check if user is a member
    const memberIndex = team.members.findIndex(m => 
      m.userId.toString() === userId && m.status === 'active'
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    // Cannot leave if hackathon has started
    if (team.hackathonId.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave team after hackathon has started'
      });
    }

    // Remove member from team
    team.members[memberIndex].status = 'left';
    team.members[memberIndex].leftAt = new Date();

    // Update team status if it was complete
    if (team.status === 'complete') {
      team.status = 'forming';
    }

    await team.save();

    // Clear cache
    await cacheService.clearPattern(`team:${id}:*`);
    await cacheService.clearPattern(`hackathon:${team.hackathonId._id}:*`);

    res.status(200).json({
      success: true,
      message: 'Successfully left the team'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:memberId
// @access  Private
const removeMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user.id;

    const team = await Team.findById(id).populate('hackathonId');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Only team leader can remove members
    if (team.leaderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can remove members'
      });
    }

    // Cannot remove members if hackathon has started
    if (team.hackathonId.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove members after hackathon has started'
      });
    }

    // Find member to remove
    const memberIndex = team.members.findIndex(m => 
      m.userId.toString() === memberId && m.status === 'active'
    );

    if (memberIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Member not found in team'
      });
    }

    // Remove member
    team.members[memberIndex].status = 'removed';
    team.members[memberIndex].removedAt = new Date();

    // Update team status if it was complete
    if (team.status === 'complete') {
      team.status = 'forming';
    }

    await team.save();

    // Clear cache
    await cacheService.clearPattern(`team:${id}:*`);
    await cacheService.clearPattern(`hackathon:${team.hackathonId._id}:*`);

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Transfer team leadership
// @route   PUT /api/teams/:id/transfer-leadership
// @access  Private
const transferLeadership = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newLeaderId } = req.body;
    const userId = req.user.id;

    if (!newLeaderId) {
      return res.status(400).json({
        success: false,
        message: 'New leader ID is required'
      });
    }

    const team = await Team.findById(id).populate('hackathonId');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Only current leader can transfer leadership
    if (team.leaderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can transfer leadership'
      });
    }

    // Cannot transfer if hackathon has started
    if (team.hackathonId.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer leadership after hackathon has started'
      });
    }

    // Check if new leader is a team member
    const memberIndex = team.members.findIndex(m => 
      m.userId.toString() === newLeaderId && m.status === 'active'
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'New leader must be an active team member'
      });
    }

    // Transfer leadership
    const oldLeaderId = team.leaderId;
    team.leaderId = newLeaderId;

    // Remove new leader from members array
    team.members.splice(memberIndex, 1);

    // Add old leader to members array
    team.members.push({
      userId: oldLeaderId,
      role: 'member',
      joinedAt: new Date(),
      status: 'active'
    });

    await team.save();

    // Populate updated team
    const updatedTeam = await Team.findById(id)
      .populate('hackathonId', 'title startDate endDate')
      .populate('leaderId', 'firstName lastName profilePicture')
      .populate('members.userId', 'firstName lastName profilePicture');

    // Clear cache
    await cacheService.clearPattern(`team:${id}:*`);

    res.status(200).json({
      success: true,
      message: 'Leadership transferred successfully',
      data: updatedTeam
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyTeams,
  createTeam,
  getTeam,
  updateTeam,
  deleteTeam,
  joinTeam,
  leaveTeam,
  removeMember,
  transferLeadership
};  