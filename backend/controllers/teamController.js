// controllers/teamController.js
const Team = require('../models/Team');
const Profile = require('../models/Profile');
const Event = require('../models/Event');
const { Match } = require('../models/Team');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
  try {
    const { name, description, eventId, techStack, maxMembers = 4 } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user already has a team for this event
    const existingTeam = await Team.findOne({
      event: eventId,
      $or: [
        { leader: req.user.id },
        { members: req.user.id }
      ]
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of a team for this event'
      });
    }

    // Create team
    const team = await Team.create({
      name,
      description,
      leader: req.user.id,
      members: [req.user.id],
      event: eventId,
      techStack,
      maxMembers,
      status: 'Open'
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .populate('event', 'title startDate');

    res.status(201).json({
      success: true,
      team: populatedTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all teams for an event
// @route   GET /api/teams/event/:eventId
// @access  Public
const getTeamsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status = 'all', techStack, search } = req.query;

    let query = { event: eventId };

    // Filter by status
    if (status !== 'all') {
      query.status = status;
    }

    // Filter by tech stack
    if (techStack) {
      query.techStack = { $in: techStack.split(',') };
    }

    // Search by team name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const teams = await Team.find(query)
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .populate('event', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      teams,
      count: teams.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's teams
// @route   GET /api/teams/my-teams
// @access  Private
const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { leader: req.user.id },
        { members: req.user.id }
      ]
    })
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .populate('event', 'title startDate endDate')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      teams,
      count: teams.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Join a team
// @route   POST /api/teams/:id/join
// @access  Private
const joinTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if team is open
    if (team.status !== 'Open') {
      return res.status(400).json({
        success: false,
        message: 'Team is not accepting new members'
      });
    }

    // Check if team is full
    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Team is full'
      });
    }

    // Check if user is already a member
    if (team.members.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this team'
      });
    }

    // Check if user already has a team for this event
    const existingTeam = await Team.findOne({
      event: team.event,
      $or: [
        { leader: req.user.id },
        { members: req.user.id }
      ],
      _id: { $ne: team._id }
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of another team for this event'
      });
    }

    // Add user to team
    team.members.push(req.user.id);
    
    // Update team status if full
    if (team.members.length >= team.maxMembers) {
      team.status = 'Full';
    }

    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .populate('event', 'title');

    res.json({
      success: true,
      team: updatedTeam,
      message: 'Successfully joined the team'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Leave a team
// @route   DELETE /api/teams/:id/leave
// @access  Private
const leaveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is a member
    if (!team.members.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this team'
      });
    }

    // If user is the leader and there are other members, transfer leadership
    if (team.leader.toString() === req.user.id && team.members.length > 1) {
      // Transfer leadership to the first non-leader member
      const newLeader = team.members.find(member => member.toString() !== req.user.id);
      team.leader = newLeader;
    }

    // Remove user from team
    team.members = team.members.filter(member => member.toString() !== req.user.id);

    // If no members left, delete the team
    if (team.members.length === 0) {
      await Team.findByIdAndDelete(team._id);
      return res.json({
        success: true,
        message: 'Left team successfully. Team was deleted as it had no members.'
      });
    }

    // Update team status
    if (team.status === 'Full' && team.members.length < team.maxMembers) {
      team.status = 'Open';
    }

    await team.save();

    res.json({
      success: true,
      message: 'Left team successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Leader only)
const updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is the team leader
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can update team details'
      });
    }

    const { name, description, techStack, maxMembers, status } = req.body;

    // Update fields
    if (name) team.name = name;
    if (description) team.description = description;
    if (techStack) team.techStack = techStack;
    if (status) team.status = status;
    
    // Handle maxMembers update
    if (maxMembers) {
      if (maxMembers < team.members.length) {
        return res.status(400).json({
          success: false,
          message: 'Cannot set max members less than current member count'
        });
      }
      team.maxMembers = maxMembers;
      
      // Update status based on new max members
      if (team.members.length >= maxMembers) {
        team.status = 'Full';
      } else if (team.status === 'Full') {
        team.status = 'Open';
      }
    }

    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .populate('event', 'title');

    res.json({
      success: true,
      team: updatedTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:memberId
// @access  Private (Leader only)
const removeMember = async (req, res) => {
  try {
    const { id: teamId, memberId } = req.params;
    
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if user is the team leader
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can remove members'
      });
    }

    // Check if member exists in team
    if (!team.members.includes(memberId)) {
      return res.status(400).json({
        success: false,
        message: 'User is not a member of this team'
      });
    }

    // Cannot remove leader
    if (team.leader.toString() === memberId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove team leader. Transfer leadership first.'
      });
    }

    // Remove member
    team.members = team.members.filter(member => member.toString() !== memberId);

    // Update team status
    if (team.status === 'Full' && team.members.length < team.maxMembers) {
      team.status = 'Open';
    }

    await team.save();

    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .populate('event', 'title');

    res.json({
      success: true,
      team: updatedTeam,
      message: 'Member removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get team details
// @route   GET /api/teams/:id
// @access  Public
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leader', 'name email')
      .populate('members', 'name email')
      .populate('event', 'title description startDate endDate');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    res.json({
      success: true,
      team
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
  createTeam,
  getTeamsByEvent,
  getMyTeams,
  joinTeam,
  leaveTeam,
  updateTeam,
  removeMember,
  getTeamById
};