const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateToken: auth } = require('../middleware/auth');
const {
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
} = require('../controllers/teamController');

// Validation middleware
const createTeamValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Team name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('hackathon')
    .isMongoId()
    .withMessage('Valid hackathon ID is required'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage('Max members must be between 2 and 10'),
  body('requiredSkills')
    .optional()
    .isArray()
    .withMessage('Required skills must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required for contact info'),
  body('applicationRequired')
    .optional()
    .isBoolean()
    .withMessage('Application required must be a boolean')
];

const updateTeamValidation = [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage('Max members must be between 2 and 10'),
  body('requiredSkills')
    .optional()
    .isArray()
    .withMessage('Required skills must be an array'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('status')
    .optional()
    .isIn(['open', 'closed'])
    .withMessage('Status must be either open or closed'),
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required for contact info')
];

const applicationValidation = [
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Application message must not exceed 500 characters')
];

const handleApplicationValidation = [
  body('status')
    .isIn(['accepted', 'rejected'])
    .withMessage('Status must be either accepted or rejected')
];

// @route   GET /api/hackathons/:hackathonId/teams
// @desc    Get all teams for a specific hackathon
// @access  Public
router.get('/hackathons/:hackathonId/teams', getTeamsByHackathon);

// @route   GET /api/teams/my
// @desc    Get current user's teams
// @access  Private
console.log('getMyTeams:', typeof getMyTeams);
router.get('/my', auth, getMyTeams);

// @route   GET /api/teams/search
// @desc    Search teams across all hackathons
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, skills, hackathon, page = 1, limit = 12 } = req.query;
    const Team = require('../models/Team');
    
    let query = {};
    
    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }
    
    // Skills filter
    if (skills) {
      const skillArray = skills.split(',').map(skill => skill.trim());
      query['requiredSkills.skill'] = { $in: skillArray };
    }
    
    // Hackathon filter
    if (hackathon) {
      query.hackathon = hackathon;
    }
    
    // Only show open teams
    query.status = 'open';
    
    const skip = (page - 1) * limit;
    const totalTeams = await Team.countDocuments(query);
    
    const teams = await Team.find(query)
      .populate('leader', 'name email profilePicture skills')
      .populate('members.user', 'name email profilePicture skills')
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
});



// @route   GET /api/teams/:id
// @desc    Get single team by ID
// @access  Public
router.get('/:id', getTeam);

// @route   POST /api/teams
// @desc    Create a new team
// @access  Private
router.post('/', auth, createTeamValidation, createTeam);

// @route   POST /api/teams/:id/join
// @desc    Join a team
// @access  Private
router.post('/:id/join', auth, joinTeam);

// @route   POST /api/teams/:id/leave
// @desc    Leave a team
// @access  Private
router.post('/:id/leave', auth, leaveTeam);

// @route   PUT /api/teams/:id
// @desc    Update team details
// @access  Private (Team Leader only)
router.put('/:id', auth, updateTeamValidation, updateTeam);

// @route   DELETE /api/teams/:id
// @desc    Delete a team
// @access  Private (Team Leader only)
router.delete('/:id', auth, deleteTeam);

// @route   POST /api/teams/:id/apply
// @desc    Apply to join a team
// @access  Private
router.post('/:id/apply', auth, applicationValidation, applyToTeam);

// @route   PUT /api/teams/:id/applications/:applicationId
// @desc    Handle team application (accept/reject)
// @access  Private (Team Leader only)
router.put('/:id/applications/:applicationId', auth, handleApplicationValidation, handleApplication);

// Additional utility routes

// @route   GET /api/teams/:id/members
// @desc    Get team members
// @access  Public
router.get('/:id/members', async (req, res) => {
  try {
    const Team = require('../models/Team');
    const team = await Team.findById(req.params.id)
      .select('members leader')
      .populate('leader', 'name email profilePicture skills experience')
      .populate('members.user', 'name email profilePicture skills experience');
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    res.json({
      success: true,
      data: {
        leader: team.leader,
        members: team.members
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/teams/:id/applications
// @desc    Get team applications (Team Leader only)
// @access  Private
router.get('/:id/applications', auth, async (req, res) => {
  try {
    const Team = require('../models/Team');
    const team = await Team.findById(req.params.id)
      .select('applications leader')
      .populate('applications.user', 'name email profilePicture skills experience');
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Check if user is team leader
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can view applications'
      });
    }
    
    res.json({
      success: true,
      data: team.applications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/teams/:id/kick/:userId
// @desc    Remove member from team (Team Leader only)
// @access  Private
router.post('/:id/kick/:userId', auth, async (req, res) => {
  try {
    const Team = require('../models/Team');
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Check if user is team leader
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only team leader can remove members'
      });
    }
    
    // Cannot kick the leader
    if (team.leader.toString() === req.params.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove team leader'
      });
    }
    
    // Remove member
    await team.removeMember(req.params.userId);
    
    // Return updated team
    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email profilePicture skills')
      .populate('members.user', 'name email profilePicture skills')
      .populate('hackathon', 'name startDate endDate');
    
    res.json({
      success: true,
      data: updatedTeam,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/teams/:id/transfer-leadership/:userId
// @desc    Transfer team leadership (Team Leader only)
// @access  Private
router.post('/:id/transfer-leadership/:userId', auth, async (req, res) => {
  try {
    const Team = require('../models/Team');
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    
    // Check if user is current team leader
    if (team.leader.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only current team leader can transfer leadership'
      });
    }
    
    // Check if new leader is a team member
    const newLeader = team.members.find(member => 
      member.user.toString() === req.params.userId
    );
    
    if (!newLeader) {
      return res.status(400).json({
        success: false,
        message: 'New leader must be a team member'
      });
    }
    
    // Update leadership
    const oldLeaderId = team.leader;
    team.leader = req.params.userId;
    
    // Update member roles
    team.members.forEach(member => {
      if (member.user.toString() === req.params.userId) {
        member.role = 'leader';
      } else if (member.user.toString() === oldLeaderId.toString()) {
        member.role = 'member';
      }
    });
    
    await team.save();
    
    // Return updated team
    const updatedTeam = await Team.findById(team._id)
      .populate('leader', 'name email profilePicture skills')
      .populate('members.user', 'name email profilePicture skills')
      .populate('hackathon', 'name startDate endDate');
    
    res.json({
      success: true,
      data: updatedTeam,
      message: 'Leadership transferred successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});



module.exports = router;