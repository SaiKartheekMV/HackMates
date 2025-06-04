// src/controllers/teamController.js
const Team = require('../models/Team');
const User = require('../models/User');
const Hackathon = require('../models/Hackathon');
const HackRequest = require('../models/HackRequest');

// Get user's teams
const getMyTeams = async (req, res) => {
  try {
    const userId = req.user._id;

    const teams = await Team.find({
      $or: [
        { leaderId: userId },
        { 'members.userId': userId, 'members.status': 'active' }
      ]
    })
    .populate('hackathonId', 'title startDate endDate status')
    .populate('leaderId', 'firstName lastName profilePicture')
    .populate('members.userId', 'firstName lastName profilePicture')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('Get my teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Create new team
const createTeam = async (req, res) => {
  try {
    const { name, description, hackathonId, requiredSkills, maxMembers, isPublic } = req.body;
    const userId = req.user._id;

    // Verify hackathon exists
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Check if user already has a team for this hackathon
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
        message: 'You already have a team for this hackathon'
      });
    }

    const team = new Team({
      name,
      description,
      hackathonId,
      leaderId: userId,
      members: [{
        userId,
        role: 'Team Leader',
        joinedAt: new Date(),
        status: 'active'
      }],
      requiredSkills,
      maxMembers: maxMembers || hackathon.teamSize?.max || 4,
      isPublic: isPublic !== false,
      status: 'forming'
    });

    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('hackathonId', 'title startDate endDate')
      .populate('leaderId', 'firstName lastName profilePicture')
      .populate('members.userId', 'firstName lastName profilePicture');

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      data: populatedTeam
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get team details
const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;

    const team = await Team.findById(id)
      .populate('hackathonId', 'title startDate endDate status')
      .populate('leaderId', 'firstName lastName profilePicture')
      .populate('members.userId', 'firstName lastName profilePicture')
      .populate({
        path: 'members.userId',
        populate: {
          path: 'profileId',
          select: 'skills bio'
        }
      });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update team
const updateTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, requiredSkills, maxMembers, isPublic } = req.body;
    const userId = req.user._id;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader
    if (team.leaderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can update team'
      });
    }

    // Update team
    const updatedTeam = await Team.findByIdAndUpdate(
      id,
      {
        name,
        description,
        requiredSkills,
        maxMembers,
        isPublic,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
    .populate('hackathonId', 'title startDate endDate')
    .populate('leaderId', 'firstName lastName profilePicture')
    .populate('members.userId', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: 'Team updated successfully',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete team
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader
    if (team.leaderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can delete team'
      });
    }

    await Team.findByIdAndDelete(id);

    // Delete related hack requests
    await HackRequest.deleteMany({
      $or: [
        { teamId: id },
        { fromUserId: { $in: team.members.map(m => m.userId) } },
        { toUserId: { $in: team.members.map(m => m.userId) } }
      ]
    });

    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Join public team
const joinTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if team is public
    if (!team.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'This team is private'
      });
    }

    // Check if team is full
    const activeMembers = team.members.filter(m => m.status === 'active');
    if (activeMembers.length >= team.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Team is full'
      });
    }

    // Check if user is already a member
    const existingMember = team.members.find(
      m => m.userId.toString() === userId.toString() && m.status === 'active'
    );
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team'
      });
    }

    // Check if user already has a team for this hackathon
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
        message: 'You already have a team for this hackathon'
      });
    }

    // Add user to team
    team.members.push({
      userId,
      role: 'Member',
      joinedAt: new Date(),
      status: 'active'
    });

    // Update team status if full
    if (team.members.filter(m => m.status === 'active').length >= team.maxMembers) {
      team.status = 'complete';
    }

    await team.save();

    const updatedTeam = await Team.findById(id)
      .populate('hackathonId', 'title startDate endDate')
      .populate('leaderId', 'firstName lastName profilePicture')
      .populate('members.userId', 'firstName lastName profilePicture');

    res.json({
      success: true,
      message: 'Successfully joined team',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Leave team
const leaveTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader
    if (team.leaderId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Team leader cannot leave team. Delete team instead.'
      });
    }

    // Find and update member status
    const memberIndex = team.members.findIndex(
      m => m.userId.toString() === userId.toString() && m.status === 'active'
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    team.members[memberIndex].status = 'left';
    team.status = 'forming'; // Team is no longer complete

    await team.save();

    res.json({
      success: true,
      message: 'Successfully left team'
    });
  } catch (error) {
    console.error('Leave team error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Remove team member (leader only)
const removeMember = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is team leader
    if (team.leaderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can remove members'
      });
    }

    // Cannot remove team leader
    if (memberId === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove team leader'
      });
    }

    // Find and update member status
    const memberIndex = team.members.findIndex(
      m => m.userId.toString() === memberId && m.status === 'active'
    );

    if (memberIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Member not found in team'
      });
    }

    team.members[memberIndex].status = 'left';
    team.status = 'forming'; // Team is no longer complete

    await team.save();

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getMyTeams,
  createTeam,
  getTeamById,
  updateTeam,
  deleteTeam,
  joinTeam,
  leaveTeam,
  removeMember
};