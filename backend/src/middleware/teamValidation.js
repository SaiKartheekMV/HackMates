// middleware/teamValidation.js
const { body, query, param } = require('express-validator');

// Create Team Validation
const createTeamValidation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Team name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Team name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
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
    .isArray({ max: 20 })
    .withMessage('Required skills must be an array with maximum 20 items'),
  
  body('requiredSkills.*.skill')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each skill must be between 1 and 50 characters'),
  
  body('requiredSkills.*.priority')
    .optional()
    .isIn(['high', 'medium', 'low'])
    .withMessage('Priority must be high, medium, or low'),
  
  body('tags')
    .optional()
    .isArray({ max: 15 })
    .withMessage('Tags must be an array with maximum 15 items'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  
  body('lookingFor')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Looking for description must not exceed 300 characters'),
  
  body('contactInfo.discord')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Discord handle must not exceed 50 characters'),
  
  body('contactInfo.slack')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Slack handle must not exceed 50 characters'),
  
  body('contactInfo.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required for contact info'),
  
  body('contactInfo.telegram')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Telegram handle must not exceed 50 characters'),
  
  body('projectIdea.title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Project title must not exceed 100 characters'),
  
  body('projectIdea.description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Project description must not exceed 1000 characters'),
  
  body('projectIdea.techStack')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Tech stack must be an array with maximum 20 items'),
  
  body('projectIdea.githubRepo')
    .optional()
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('GitHub repo must be a valid HTTPS URL'),
  
  body('applicationRequired')
    .optional()
    .isBoolean()
    .withMessage('Application required must be a boolean')
];

// Update Team Validation
const updateTeamValidation = [
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('maxMembers')
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage('Max members must be between 2 and 10')
    .custom((value, { req }) => {
      // Ensure maxMembers is not less than current member count
      // This validation will be handled in the controller
      return true;
    }),
  
  body('requiredSkills')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Required skills must be an array with maximum 20 items'),
  
  body('tags')
    .optional()
    .isArray({ max: 15 })
    .withMessage('Tags must be an array with maximum 15 items'),
  
  body('lookingFor')
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage('Looking for description must not exceed 300 characters'),
  
  body('status')
    .optional()
    .isIn(['open', 'closed'])
    .withMessage('Status must be either open or closed'),
  
  body('contactInfo.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required for contact info'),
  
  body('projectIdea.githubRepo')
    .optional()
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('GitHub repo must be a valid HTTPS URL')
];

// Application Validation
const applicationValidation = [
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Application message must not exceed 500 characters')
];

// Handle Application Validation
const handleApplicationValidation = [
  body('status')
    .isIn(['accepted', 'rejected'])
    .withMessage('Status must be either accepted or rejected'),
  
  param('id')
    .isMongoId()
    .withMessage('Valid team ID is required'),
  
  param('applicationId')
    .isMongoId()
    .withMessage('Valid application ID is required')
];

// Query Parameter Validation for Team Listing
const teamListingValidation = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be a positive integer less than 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('status')
    .optional()
    .isIn(['open', 'full', 'closed', 'all'])
    .withMessage('Status must be open, full, closed, or all'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must not exceed 100 characters'),
  
  query('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const tags = value.split(',');
        if (tags.length > 10) {
          throw new Error('Maximum 10 tags allowed in filter');
        }
        tags.forEach(tag => {
          if (tag.trim().length > 30) {
            throw new Error('Each tag must not exceed 30 characters');
          }
        });
      }
      return true;
    }),
  
  param('hackathonId')
    .isMongoId()
    .withMessage('Valid hackathon ID is required')
];

// MongoDB ObjectId Parameter Validation
const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid team ID is required')
];

const userIdValidation = [
  param('userId')
    .isMongoId()
    .withMessage('Valid user ID is required')
];

// Search Validation
const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('skills')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const skills = value.split(',');
        if (skills.length > 20) {
          throw new Error('Maximum 20 skills allowed in search');
        }
      }
      return true;
    }),
  
  query('hackathon')
    .optional()
    .isMongoId()
    .withMessage('Valid hackathon ID is required for filtering'),
  
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Page must be between 1 and 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max:50 })
    .withMessage('Limit must be between 1 and 50')
];

// Custom validation middleware for business logic
const teamBusinessValidation = {
  // Check if user can create team for hackathon
  canCreateTeam: async (req, res, next) => {
    try {
      const Team = require('../models/Team');
      const { hackathon } = req.body;
      
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
      
      next();
    } catch (error) {
      console.error('Team business validation error:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  },
  
  // Check if user can join team
  canJoinTeam: async (req, res, next) => {
    try {
      const Team = require('../models/Team');
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
      
      req.team = team; // Pass team to next middleware
      next();
    } catch (error) {
      console.error('Join team validation error:', error);
      res.status(500).json({ success: false, message: 'Server Error' });
    }
  }
};

module.exports = {
  createTeamValidation,
  updateTeamValidation,
  applicationValidation,
  handleApplicationValidation,
  teamListingValidation,
  mongoIdValidation,
  userIdValidation,
  searchValidation,
  teamBusinessValidation
};