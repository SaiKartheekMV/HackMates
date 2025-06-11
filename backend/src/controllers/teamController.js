const Team = require('../models/Team');
const User = require('../models/User');
const Hackathon = require('../models/Hackathon');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

class TeamController {
  // ===== BASIC CRUD OPERATIONS =====
  
  /**
   * Create a new team
   * POST /api/teams
   */
  async createTeam(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const {
        name,
        description,
        motto,
        hackathonId,
        maxMembers,
        requiredSkills,
        lookingFor,
        projectDetails,
        communication,
        preferences,
        tags,
        categories,
        visibility = 'public',
        joinMethod = 'open'
      } = req.body;

      const userId = req.user.id;

      // Check if hackathon exists and is active
      const hackathon = await Hackathon.findById(hackathonId);
      if (!hackathon) {
        return res.status(404).json({
          success: false,
          message: 'Hackathon not found'
        });
      }

      if (hackathon.status !== 'active' && hackathon.status !== 'upcoming') {
        return res.status(400).json({
          success: false,
          message: 'Cannot create team for inactive hackathon'
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

      // Create team
      const team = new Team({
        name,
        description,
        motto,
        hackathonId,
        leaderId: userId,
        maxMembers,
        requiredSkills,
        lookingFor,
        projectDetails,
        communication,
        preferences,
        tags,
        categories,
        visibility,
        joinMethod,
        members: [{
          userId,
          role: 'leader',
          joinedAt: new Date(),
          status: 'active'
        }]
      });

      await team.save();

      // Populate team data for response
      await team.populate([
        { path: 'leaderId', select: 'firstName lastName username profilePicture skills' },
        { path: 'members.userId', select: 'firstName lastName username profilePicture skills' },
        { path: 'hackathonId', select: 'name startDate endDate status' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: team
      });

    } catch (error) {
      console.error('Create team error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get all teams with filters and pagination
   * GET /api/teams
   */
  async getTeams(req, res) {
    try {
      const {
        hackathonId,
        search,
        skills,
        categories,
        difficulty,
        status,
        visibility = 'public',
        isOpen,
        featured,
        trending,
        page = 1,
        limit = 20,
        sort = '-createdAt'
      } = req.query;

      // Build query
      let query = {};
      
      if (hackathonId) query.hackathonId = hackathonId;
      if (visibility) query.visibility = visibility;
      if (status) query.status = status;
      if (isOpen !== undefined) query.isOpen = isOpen === 'true';
      if (featured !== undefined) query.featured = featured === 'true';
      if (trending !== undefined) query.trending = trending === 'true';
      if (difficulty) query.difficulty = difficulty;
      if (categories) {
        const categoryArray = Array.isArray(categories) ? categories : categories.split(',');
        query.categories = { $in: categoryArray };
      }

      // Skills filter
      if (skills) {
        const skillArray = Array.isArray(skills) ? skills : skills.split(',');
        query['requiredSkills.skill'] = { $in: skillArray.map(s => new RegExp(s, 'i')) };
      }

      // Text search
      if (search) {
        query.$text = { $search: search };
      }

      // Pagination
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);
      const skip = (pageNumber - 1) * limitNumber;

      // Build sort object
      let sortObj = {};
      if (search) {
        sortObj.score = { $meta: 'textScore' };
      } else {
        const sortParts = sort.split(',');
        sortParts.forEach(part => {
          if (part.startsWith('-')) {
            sortObj[part.substring(1)] = -1;
          } else {
            sortObj[part] = 1;
          }
        });
      }

      // Execute query
      const teams = await Team.find(query)
        .populate('leaderId', 'firstName lastName username profilePicture skills')
        .populate('members.userId', 'firstName lastName username profilePicture skills')
        .populate('hackathonId', 'name startDate endDate status')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNumber);

      // Get total count
      const total = await Team.countDocuments(query);

      res.json({
        success: true,
        data: teams,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber),
          hasNext: pageNumber < Math.ceil(total / limitNumber),
          hasPrev: pageNumber > 1
        }
      });

    } catch (error) {
      console.error('Get teams error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get team by ID or slug
   * GET /api/teams/:identifier
   */
  async getTeam(req, res) {
    try {
      const { identifier } = req.params;
      const userId = req.user?.id;

      // Find team by ID or slug
      const query = mongoose.Types.ObjectId.isValid(identifier) 
        ? { _id: identifier } 
        : { slug: identifier };

      const team = await Team.findOne(query)
        .populate('leaderId', 'firstName lastName username profilePicture skills experience')
        .populate('members.userId', 'firstName lastName username profilePicture skills experience')
        .populate('coLeaders.userId', 'firstName lastName username profilePicture')
        .populate('hackathonId', 'name description startDate endDate status rules prizes')
        .populate('applications.userId', 'firstName lastName username profilePicture skills')
        .populate('reviews.reviewerId', 'firstName lastName username profilePicture');

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // Check visibility permissions
      if (team.visibility === 'private') {
        const isMember = team.members.some(m => 
          m.userId._id.toString() === userId && m.status === 'active'
        );
        const isLeader = team.leaderId._id.toString() === userId;
        
        if (!isMember && !isLeader && !req.user?.isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to private team'
          });
        }
      }

      // Increment view count (if not team member)
      if (userId) {
        const isMember = team.members.some(m => 
          m.userId._id.toString() === userId && m.status === 'active'
        );
        if (!isMember) {
          await team.incrementView();
        }
      }

      // Get recommended teams
      const recommendedTeams = await team.getRecommendedTeams(5);

      res.json({
        success: true,
        data: {
          team,
          recommended: recommendedTeams,
          canJoin: userId ? team.canUserJoin(userId) : false,
          userIsMember: userId ? team.members.some(m => 
            m.userId._id.toString() === userId && m.status === 'active'
          ) : false
        }
      });

    } catch (error) {
      console.error('Get team error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Update team
   * PUT /api/teams/:id
   */
  async updateTeam(req, res) {
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

      // Check permissions
      if (!team.hasPermission(userId, 'edit_project') && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update this team'
        });
      }

      const allowedUpdates = [
        'name', 'description', 'motto', 'logo', 'coverImage',
        'maxMembers', 'requiredSkills', 'lookingFor', 'projectDetails',
        'communication', 'preferences', 'tags', 'categories',
        'visibility', 'joinMethod', 'isOpen', 'autoAccept'
      ];

      const updates = {};
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      Object.assign(team, updates);
      team.logActivity('team_updated', userId, { updatedFields: Object.keys(updates) });
      
      await team.save();

      await team.populate([
        { path: 'leaderId', select: 'firstName lastName username profilePicture' },
        { path: 'members.userId', select: 'firstName lastName username profilePicture' },
        { path: 'hackathonId', select: 'name startDate endDate status' }
      ]);

      res.json({
        success: true,
        message: 'Team updated successfully',
        data: team
      });

    } catch (error) {
      console.error('Update team error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Delete team
   * DELETE /api/teams/:id
   */
  async deleteTeam(req, res) {
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

      // Only team leader or admin can delete
      if (team.leaderId.toString() !== userId && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Only team leader can delete the team'
        });
      }

      // Check if hackathon has started
      const hackathon = await Hackathon.findById(team.hackathonId);
      if (hackathon && hackathon.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete team after hackathon has started'
        });
      }

      await Team.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Team deleted successfully'
      });

    } catch (error) {
      console.error('Delete team error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // ===== TEAM MEMBER MANAGEMENT =====

  /**
   * Join team
   * POST /api/teams/:id/join
   */
  async joinTeam(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { role = 'other', skills = [], message } = req.body;

      const team = await Team.findById(id);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      if (!team.canUserJoin(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot join this team'
        });
      }

      if (team.joinMethod === 'application' || team.requiresApproval) {
        // Submit application
        await team.submitApplication({
          userId,
          role,
          skills,
          message
        });

        return res.json({
          success: true,
          message: 'Application submitted successfully',
          requiresApproval: true
        });
      } else {
        // Direct join
        await team.addMember(userId, role, skills);

        await team.populate('members.userId', 'firstName lastName username profilePicture');

        res.json({
          success: true,
          message: 'Successfully joined the team',
          data: team
        });
      }

    } catch (error) {
      console.error('Join team error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Leave team
   * POST /api/teams/:id/leave
   */
  async leaveTeam(req, res) {
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

      if (team.leaderId.toString() === userId) {
        return res.status(400).json({
          success: false,
          message: 'Team leader cannot leave. Transfer leadership first.'
        });
      }

      await team.removeMember(userId, 'left');

      res.json({
        success: true,
        message: 'Successfully left the team'
      });

    } catch (error) {
      console.error('Leave team error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Remove team member
   * DELETE /api/teams/:id/members/:memberId
   */
  async removeMember(req, res) {
    try {
      const { id, memberId } = req.params;
      const userId = req.user.id;

      const team = await Team.findById(id);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      if (!team.hasPermission(userId, 'manage_members')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to remove members'
        });
      }

      await team.removeMember(memberId, 'removed');

      await team.populate('members.userId', 'firstName lastName username profilePicture');

      res.json({
        success: true,
        message: 'Member removed successfully',
        data: team
      });

    } catch (error) {
      console.error('Remove member error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Update member role
   * PUT /api/teams/:id/members/:memberId/role
   */
  async updateMemberRole(req, res) {
    try {
      const { id, memberId } = req.params;
      const { role } = req.body;
      const userId = req.user.id;

      const team = await Team.findById(id);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      if (!team.hasPermission(userId, 'manage_members')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update member roles'
        });
      }

      await team.updateMemberRole(memberId, role, userId);

      await team.populate('members.userId', 'firstName lastName username profilePicture');

      res.json({
        success: true,
        message: 'Member role updated successfully',
        data: team
      });

    } catch (error) {
      console.error('Update member role error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Transfer leadership
   * POST /api/teams/:id/transfer-leadership
   */
  async transferLeadership(req, res) {
    try {
      const { id } = req.params;
      const { newLeaderId } = req.body;
      const userId = req.user.id;

      const team = await Team.findById(id);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      await team.transferLeadership(newLeaderId, userId);

      await team.populate([
        { path: 'leaderId', select: 'firstName lastName username profilePicture' },
        { path: 'members.userId', select: 'firstName lastName username profilePicture' }
      ]);

      res.json({
        success: true,
        message: 'Leadership transferred successfully',
        data: team
      });

    } catch (error) {
      console.error('Transfer leadership error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  /**
   * Add co-leader
   * POST /api/teams/:id/co-leaders
   */
  async addCoLeader(req, res) {
    try {
      const { id } = req.params;
      const { userId: targetUserId, permissions = [] } = req.body;
      const userId = req.user.id;

      const team = await Team.findById(id);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      if (team.leaderId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Only team leader can add co-leaders'
        });
      }

      await team.addCoLeader(targetUserId, permissions, userId);

      await team.populate('coLeaders.userId', 'firstName lastName username profilePicture');

      res.json({
        success: true,
        message: 'Co-leader added successfully',
        data: team
      });

    } catch (error) {
      console.error('Add co-leader error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // ===== APPLICATION MANAGEMENT =====

  /**
   * Get team applications
   * GET /api/teams/:id/applications
   */
  async getApplications(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { status = 'pending' } = req.query;

      const team = await Team.findById(id)
        .populate('applications.userId', 'firstName lastName username profilePicture skills experience');

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      if (!team.hasPermission(userId, 'manage_members')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view applications'
        });
      }

      const applications = team.applications.filter(app => 
        status === 'all' || app.status === status
      );

      res.json({
        success: true,
        data: applications
      });

    } catch (error) {
      console.error('Get applications error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Review application
   * PUT /api/teams/:id/applications/:applicationId
   */
  async reviewApplication(req, res) {
    try {
      const { id, applicationId } = req.params;
      const { decision, feedback = '' } = req.body;
      const userId = req.user.id;

      const team = await Team.findById(id);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      if (!team.hasPermission(userId, 'manage_members')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to review applications'
        });
      }

      await team.reviewApplication(applicationId, decision, userId, feedback);

      await team.populate('applications.userId', 'firstName lastName username profilePicture');

      res.json({
        success: true,
        message: `Application ${decision} successfully`,
        data: team.applications.id(applicationId)
      });

    } catch (error) {
      console.error('Review application error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // ===== INVITE MANAGEMENT =====

  /**
   * Generate invite link
   * POST /api/teams/:id/invite-links
   */
  async generateInviteLink(req, res) {
    try {
      const { id } = req.params;
      const { maxUses = 1, expiresIn = 24 } = req.body;
      const userId = req.user.id;

      const team = await Team.findById(id);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      if (!team.hasPermission(userId, 'manage_members')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to generate invite links'
        });
      }

      const inviteCode = team.generateInviteLink(userId, maxUses, expiresIn);
      await team.save();

      const inviteUrl = `${process.env.FRONTEND_URL}/teams/join/${inviteCode}`;

      res.json({
        success: true,
        message: 'Invite link generated successfully',
        data: {
          code: inviteCode,
          url: inviteUrl,
          maxUses,
          expiresIn
        }
      });

    } catch (error) {
      console.error('Generate invite link error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Join team via invite link
   * POST /api/teams/join/:code
   */
  async joinViaInvite(req, res) {
    try {
      const { code } = req.params;
      const { role = 'other' } = req.body;
      const userId = req.user.id;

      // Find team with this invite code
      const team = await Team.findOne({
        'inviteLinks.code': code,
        'inviteLinks.isActive': true,
        'inviteLinks.expiresAt': { $gt: new Date() }
      });

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Invalid or expired invite link'
        });
      }

      await team.useInviteLink(code, userId);

      await team.populate('members.userId', 'firstName lastName username profilePicture');

      res.json({
        success: true,
        message: 'Successfully joined the team via invite link',
        data: team
      });

    } catch (error) {
      console.error('Join via invite error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // ===== PROJECT MANAGEMENT =====

  /**
   * Update project details
   * PUT /api/teams/:id/project
   */
  async updateProject(req, res) {
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

      if (!team.hasPermission(userId, 'edit_project')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update project details'
        });
      }

      const allowedFields = [
        'idea', 'problem', 'solution', 'targetAudience', 'uniqueValue',
        'technologies', 'techStack', 'repositories', 'liveUrl', 'demoUrl',
        'documentationUrl', 'pitch', 'features', 'roadmap', 'challenges', 'learnings'
      ];

      const projectUpdates = {};
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          projectUpdates[key] = req.body[key];
        }
      });

      await team.updateProject(projectUpdates, userId);

      res.json({
        success: true,
        message: 'Project details updated successfully',
        data: team.projectDetails
      });

    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Submit project
   * POST /api/teams/:id/submit
   */
  async submitProject(req, res) {
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

      if (!team.hasPermission(userId, 'submit_project')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to submit project'
        });
      }

      // Check if project has minimum required details
      if (!team.projectDetails.idea || !team.projectDetails.repositories?.length) {
        return res.status(400).json({
          success: false,
          message: 'Project must have an idea and at least one repository to submit'
        });
      }

      team.status = 'submitted';
      team.phase = 'completed';
      team.logActivity('project_submitted', userId);

      await team.save();

      res.json({
        success: true,
        message: 'Project submitted successfully',
        data: team
      });

    } catch (error) {
      console.error('Submit project error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // ===== SEARCH AND DISCOVERY =====

  /**
   * Search teams
   * GET /api/teams/search
   */
  async searchTeams(req, res) {
    try {
      const {
        hackathonId,
        q: searchTerm,
        skills,
        categories,
        difficulty,
        page = 1,
        limit = 20
      } = req.query;

      if (!hackathonId) {
        return res.status(400).json({
          success: false,
          message: 'Hackathon ID is required'
        });
      }

      const filters = {};
      if (skills) {
        const skillArray = Array.isArray(skills) ? skills : skills.split(',');
        filters['requiredSkills.skill'] = { $in: skillArray.map(s => new RegExp(s, 'i')) };
      }
      if (categories) {
        const categoryArray = Array.isArray(categories) ? categories : categories.split(',');
        filters.categories = { $in: categoryArray };
      }
      if (difficulty) {
        filters.difficulty = difficulty;
      }

      const teams = await Team.searchTeams(
        hackathonId,
        searchTerm,
        filters,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: teams,
        query: { searchTerm, skills, categories, difficulty }
      });

    } catch (error) {
      console.error('Search teams error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get featured teams
   * GET /api/teams/featured
   */
  async getFeaturedTeams(req, res) {
    try {
      const { hackathonId, limit = 5 } = req.query;

      if (!hackathonId) {
        return res.status(400).json({
          success: false,
          message: 'Hackathon ID is required'
        });
      }

      const teams = await Team.findFeatured(hackathonId, parseInt(limit));

      res.json({
        success: true,
        data: teams
      });

    } catch (error) {
      console.error('Get featured teams error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get trending teams
   * GET /api/teams/trending
   */
  async getTrendingTeams(req, res) {
    try {
      const { hackathonId, limit = 10 } = req.query;

      if (!hackathonId) {
        return res.status(400).json({
          success: false,
          message: 'Hackathon ID is required'
        });
      }

      const teams = await Team.findTrending(hackathonId, parseInt(limit));

      res.json({
        success: true,
        data: teams
      });

    } catch (error) {
      console.error('Get trending teams error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get recommended teams for user
   * GET /api/teams/recommendations
   */
  async getRecommendations(req, res) {
    try {
      const { hackathonId, limit = 10 } = req.query;
      const userId = req.user.id;

      if (!hackathonId) {
        return res.status(400).json({
          success: false,
          message: 'Hackathon ID is required'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const recommendations = await Team.getRecommendationsForUser(
        userId, 
        hackathonId, 
        parseInt(limit)
      );

      res.json({
        success: true,
        data: recommendations
      });

    } catch (error) {
      console.error('Get recommendations error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // ===== ANALYTICS AND INSIGHTS =====

  /**
   * Get team analytics
   * GET /api/teams/:id/analytics
   */
  async getTeamAnalytics(req, res) {
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

      if (!team.hasPermission(userId, 'view_analytics')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view team analytics'
        });
      }

      const analytics = await team.getAnalytics();

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Get team analytics error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user's teams
   * GET /api/teams/my-teams
   */
  async getMyTeams(req, res) {
    try {
      const userId = req.user.id;
      const { status, hackathonId, page = 1, limit = 10 } = req.query;

      let query = {
        $or: [
          { leaderId: userId },
          { 'members.userId': userId, 'members.status': 'active' }
        ]
      };

      if (status) query.status = status;
      if (hackathonId) query.hackathonId = hackathonId;

      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);
      const skip = (pageNumber - 1) * limitNumber;

      const teams = await Team.find(query)
        .populate('leaderId', 'firstName lastName username profilePicture')
        .populate('members.userId', 'firstName lastName username profilePicture')
        .populate('hackathonId', 'name startDate endDate status')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNumber);

      const total = await Team.countDocuments(query);

      res.json({
        success: true,
        data: teams,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          pages: Math.ceil(total / limitNumber)
        }
      });

    } catch (error) {
      console.error('Get my teams error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // ===== TEAM INTERACTIONS =====

  /**
   * Like/Unlike team
   * POST /api/teams/:id/toggle-like
   */
  async toggleLike(req, res) {
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

      const isLiked = await team.toggleLike(userId);

      res.json({
        success: true,
        message: isLiked ? 'Team liked' : 'Team unliked',
        data: {
          isLiked,
          likesCount: team.likes.length
        }
      });

    } catch (error) {
      console.error('Toggle like error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Follow/Unfollow team
   * POST /api/teams/:id/toggle-follow
   */
  async toggleFollow(req, res) {
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

      const isFollowing = await team.toggleFollow(userId);

      res.json({
        success: true,
        message: isFollowing ? 'Team followed' : 'Team unfollowed',
        data: {
          isFollowing,
          followersCount: team.followers.length
        }
      });

    } catch (error) {
      console.error('Toggle follow error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Add team review/rating
   * POST /api/teams/:id/reviews
   */
  async addReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user.id;

      const team = await Team.findById(id);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // Check if user can review (not a current member)
      const isMember = team.members.some(m => 
        m.userId.toString() === userId && m.status === 'active'
      );
      
      if (isMember) {
        return res.status(400).json({
          success: false,
          message: 'Team members cannot review their own team'
        });
      }

      await team.addReview(userId, rating, comment);

      await team.populate('reviews.reviewerId', 'firstName lastName username profilePicture');

      res.json({
        success: true,
        message: 'Review added successfully',
        data: team.reviews[team.reviews.length - 1]
      });

    } catch (error) {
      console.error('Add review error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  }

  // ===== TEAM SETTINGS =====

  /**
   * Update team settings
   * PUT /api/teams/:id/settings
   */
  async updateSettings(req, res) {
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

      if (!team.hasPermission(userId, 'manage_settings')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update team settings'
        });
      }

      const allowedSettings = [
        'autoAccept', 'requiresApproval', 'allowDirectMessages',
        'showProgress', 'publicActivity', 'emailNotifications',
        'slackIntegration', 'discordIntegration'
      ];

      const settings = {};
      Object.keys(req.body).forEach(key => {
        if (allowedSettings.includes(key)) {
          settings[key] = req.body[key];
        }
      });

      Object.assign(team.settings, settings);
      team.logActivity('settings_updated', userId, { updatedSettings: Object.keys(settings) });
      
      await team.save();

      res.json({
        success: true,
        message: 'Team settings updated successfully',
        data: team.settings
      });

    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = TeamController;