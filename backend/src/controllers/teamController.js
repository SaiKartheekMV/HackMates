const Team = require('../models/Team');
const User = require('../models/User');
const Hackathon = require('../models/Hackathon');
const { validationResult } = require('express-validator');

// @desc    Get all teams for a hackathon
// @route   GET /api/hackathons/:hackathonId/teams
// @access  Public
const getTeamsByHackathon = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    const { status, tags, search, availableOnly, page = 1, limit = 12 } = req.query;
    
    // Build filter object
    const filters = { hackathon: hackathonId };
    
    if (status && status !== 'all') {
      filters.status = status;
    }
    
    if (availableOnly === 'true') {
      filters.status = 'open';
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filters.tags = { $in: tagArray };
    }
    
    // Build query
    let query = Team.find(filters);
    
    // Add search functionality
    if (search) {
      query = query.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    const totalTeams = await Team.countDocuments(query.getFilter());
    
    const teams = await query
      .populate('leader', 'name email profilePicture skills experience')
      .populate('members.user', 'name email profilePicture skills experience')
      .populate('hackathon', 'name startDate endDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: teams,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTeams / limit),
        totalTeams,
        hasNext: page < Math.ceil(totalTeams / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get user's teams
// @route   GET /api/teams/my
// @access  Private
const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.findUserTeams(req.user.id);
    
    res.json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Public
const getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('leader', 'name email profilePicture skills experience bio')
      .populate('members.user', 'name email profilePicture skills experience bio')
      .populate('hackathon', 'name description startDate endDate theme prizes')
      .populate('applications.user', 'name email profilePicture skills experience');
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Create new team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: errors.array()
      });
    }
    
    const {
      name,
      description,
      hackathon,
      requiredSkills,
      maxMembers,
      tags,
      lookingFor,
      contactInfo,
      projectIdea,
      applicationRequired
    } = req.body;
    
    // Check if hackathon exists
    const hackathonExists = await Hackathon.findById(hackathon);
    if (!hackathonExists) {
      return res.status(404).json({ success: false, message: 'Hackathon not found' });
    }
    
    // Check if user already has a team for this hackathon
    const existingTeam = await Team.findOne({
      hackathon,
      $or: [
        { leader: req.user.id },
        { 'members.user': req.user.id }
      ]
    });
    
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of a team for this hackathon'
      });
    }
    
    // Get user skills for team member entry
    const user = await User.findById(req.user.id);
    
    const team = new Team({
      name,
      description,
      hackathon,
      leader: req.user.id,
      requiredSkills: requiredSkills || [],
      maxMembers: maxMembers || 4,
      tags: tags || [],
      lookingFor,
      contactInfo: contactInfo || {},
      projectIdea: projectIdea || {},
      applicationRequired: applicationRequired || false,
      members: [{
        user: req.user.id,
        role: 'leader',
        skills: user.skills || []
      }]
    });
    
    await team.save();
    
    // Populate the team before sending response
    const populatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email profilePicture skills')
      .populate('members.user', 'name email profilePicture skills')
      .populate('hackathon', 'name startDate endDate');
    
    res.status(201).json({
      success: true,
      data: populatedTeam,
      message: 'Team created successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Join team
// @route   POST /api/teams/:id/join
// @access  Private
const joinTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Check if user already has a team for this hackathon
    const existingTeam = await Team.findOne({
      hackathon: team.hackathon,
      $or: [
        { leader: req.user.id },
        { 'members.user': req.user.id }
      ]
    });
    
    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of a team for this hackathon'
      });
    }
    
    // Check if user can join
    if (!team.canUserJoin(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot join this team (full, closed, or already a member)'
      });
    }
    
    // Get user skills
    const user = await User.findById(req.user.id);
    
    // Add member to team
    await team.addMember(req.user.id, user.skills || []);
    
    // Populate and return updated team
    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email profilePicture skills')
      .populate('members.user', 'name email profilePicture skills')
      .populate('hackathon', 'name startDate endDate');
    
    res.json({
      success: true,
      data: updatedTeam,
      message: 'Successfully joined the team'
    });
  } catch (error) {
    console.error(error);
    if (error.message.includes('full') || error.message.includes('already')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Leave team
// @route   POST /api/teams/:id/leave
// @access  Private
const leaveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Check if user is team leader
    if (team.leader.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Team leader cannot leave. Transfer leadership or delete the team.'
      });
    }
    
    // Remove member from team
    await team.removeMember(req.user.id);
    
    // Populate and return updated team
    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email profilePicture skills')
      .populate('members.user', 'name email profilePicture skills')
      .populate('hackathon', 'name startDate endDate');
    
    res.json({
      success: true,
      data: updatedTeam,
      message: 'Successfully left the team'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private (Team Leader only)
const updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Check if user is team leader
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can update team details'
      });
    }
    
    const updateFields = [
      'description', 'requiredSkills', 'maxMembers', 'tags',
      'lookingFor', 'contactInfo', 'projectIdea', 'applicationRequired', 'status'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        team[field] = req.body[field];
      }
    });
    
    await team.save();
    
    // Populate and return updated team
    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email profilePicture skills')
      .populate('members.user', 'name email profilePicture skills')
      .populate('hackathon', 'name startDate endDate');
    
    res.json({
      success: true,
      data: updatedTeam,
      message: 'Team updated successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Team Leader only)
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Check if user is team leader
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can delete the team'
      });
    }
    
    await Team.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Apply to join team
// @route   POST /api/teams/:id/apply
// @access  Private
const applyToTeam = async (req, res) => {
  try {
    const { message } = req.body;
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    if (!team.applicationRequired) {
      return res.status(400).json({
        success: false,
        message: 'This team does not require applications. You can join directly.'
      });
    }
    
    // Check if user already applied
    const existingApplication = team.applications.find(
      app => app.user.toString() === req.user.id
    );
    
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this team'
      });
    }
    
    // Add application
    team.applications.push({
      user: req.user.id,
      message: message || ''
    });
    
    await team.save();
    
    res.json({
      success: true,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Handle team application (accept/reject)
// @route   PUT /api/teams/:id/applications/:applicationId
// @access  Private (Team Leader only)
const handleApplication = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Check if user is team leader
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can handle applications'
      });
    }
    
    const application = team.applications.id(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    
    application.status = status;
    
    // If accepted, add user to team
    if (status === 'accepted' && team.canUserJoin(application.user)) {
      const user = await User.findById(application.user);
      await team.addMember(application.user, user.skills || []);
    }
    
    await team.save();
    
    res.json({
      success: true,
      message: `Application ${status} successfully`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getTeamsByHackathon,
  getMyTeams,
  getTeam,
  createTeam,
  joinTeam,
  leaveTeam,
  updateTeam,
  deleteTeam,
  applyToTeam,
  handleApplication
};