const Team = require('../models/Team');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Hackathon = require('../models/Hackathon');
const HackRequest = require('../models/HackRequest');
const { validationResult } = require('express-validator');
const cacheService = require('../services/cacheService');
const matchmakingService = require('../services/matchmakingService');

class TeamController {
  // Create a new team
  async createTeam(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        name,
        description,
        tagline,
        hackathonId,
        maxMembers,
        requiredSkills,
        preferredRoles,
        project,
        communication,
        settings,
        tags,
        location
      } = req.body;

      // Check if hackathon exists and is active
      const hackathon = await Hackathon.findById(hackathonId);
      if (!hackathon) {
        return res.status(404).json({
          success: false,
          message: 'Hackathon not found'
        });
      }

      if (hackathon.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot create team for completed hackathon'
        });
      }

      // Check if user already has a team for this hackathon
      const existingTeam = await Team.findOne({
        hackathonId,
        $or: [
          { leaderId: req.user._id },
          { 'members.userId': req.user._id, 'members.status': 'active' }
        ]
      });

      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: 'You already have a team for this hackathon'
        });
      }

      // Create team with leader as first member
      const team = new Team({
        name,
        description,
        tagline,
        hackathonId,
        leaderId: req.user._id,
        teamSize: { max: maxMembers },
        requiredSkills: requiredSkills || [],
        preferredRoles: preferredRoles || [],
        project: project || {},
        communication: communication || {},
        settings: { ...settings, isPublic: settings?.isPublic !== false },
        tags: tags || [],
        location: location || {}
      });

      // Add leader as first member
      team.members.push({
        userId: req.user._id,
        role: 'leader',
        permissions: {
          canInvite: true,
          canKick: true,
          canEditTeam: true
        }
      });

      await team.save();

      // Populate team data
      await team.populate([
        { path: 'leaderId', select: 'firstName lastName profilePicture email' },
        { path: 'members.userId', select: 'firstName lastName profilePicture' },
        { path: 'hackathonId', select: 'title startDate endDate location' }
      ]);

      // Clear relevant caches
      await cacheService.invalidatePattern(`teams:hackathon:${hackathonId}*`);

      res.status(201).json({
        success: true,
        message: 'Team created successfully',
        data: { team }
      });

    } catch (error) {
      console.error('Create team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create team',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get team details
  async getTeam(req, res) {
    try {
      const { teamId } = req.params;
      const { detailed = false } = req.query;

      // Try cache first
      const cacheKey = `team:${teamId}:${detailed ? 'detailed' : 'basic'}`;
      let team = await cacheService.get(cacheKey);

      if (!team) {
        const populateFields = [
          { path: 'leaderId', select: 'firstName lastName profilePicture email' },
          { path: 'hackathonId', select: 'title startDate endDate location teamSize status' }
        ];

        if (detailed) {
          populateFields.push({
            path: 'members.userId',
            select: 'firstName lastName profilePicture email',
            populate: {
              path: 'profile',
              select: 'skills bio location socialLinks'
            }
          });
        } else {
          populateFields.push({
            path: 'members.userId',
            select: 'firstName lastName profilePicture'
          });
        }

        team = await Team.findById(teamId).populate(populateFields);

        if (!team) {
          return res.status(404).json({
            success: false,
            message: 'Team not found'
          });
        }

        // Cache for 10 minutes
        await cacheService.set(cacheKey, team, 600);
      }

      // Increment view count if not team member
      const isMember = team.members.some(member => 
        member.userId._id.toString() === req.user._id.toString() && member.status === 'active'
      );

      if (!isMember) {
        await Team.findByIdAndUpdate(teamId, { $inc: { 'stats.viewCount': 1 } });
      }

      // Check if current user can edit team
      const canEdit = team.canUserPerformAction(req.user._id, 'edit');

      res.json({
        success: true,
        data: {
          team,
          permissions: {
            canEdit,
            canInvite: team.canUserPerformAction(req.user._id, 'invite'),
            canKick: team.canUserPerformAction(req.user._id, 'kick'),
            isMember,
            isLeader: team.leaderId._id.toString() === req.user._id.toString()
          }
        }
      });

    } catch (error) {
      console.error('Get team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get team details'
      });
    }
  }

  // Update team
  async updateTeam(req, res) {
    try {
      const { teamId } = req.params;
      const updates = req.body;

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // Check permissions
      if (!team.canUserPerformAction(req.user._id, 'edit')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to edit this team'
        });
      }

      // Prevent certain fields from being updated
      const allowedUpdates = [
        'name', 'description', 'tagline', 'requiredSkills', 'preferredRoles',
        'project', 'communication', 'settings', 'tags', 'location'
      ];

      const updateData = {};
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      });

      // Special handling for team size increase (can only increase)
      if (updates.maxMembers && updates.maxMembers > team.teamSize.max) {
        updateData['teamSize.max'] = updates.maxMembers;
      }

      Object.assign(team, updateData);
      await team.save();

      await team.populate([
        { path: 'leaderId', select: 'firstName lastName profilePicture' },
        { path: 'members.userId', select: 'firstName lastName profilePicture' },
        { path: 'hackathonId', select: 'title startDate endDate' }
      ]);

      // Clear caches
      await cacheService.del(`team:${teamId}:basic`);
      await cacheService.del(`team:${teamId}:detailed`);
      await cacheService.invalidatePattern(`teams:hackathon:${team.hackathonId}*`);

      res.json({
        success: true,
        message: 'Team updated successfully',
        data: { team }
      });

    } catch (error) {
      console.error('Update team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update team'
      });
    }
  }

  // Delete/Disband team
  async deleteTeam(req, res) {
    try {
      const { teamId } = req.params;

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // Only leader can delete team
      if (team.leaderId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only team leader can disband the team'
        });
      }

      // Check if hackathon is ongoing
      const hackathon = await Hackathon.findById(team.hackathonId);
      if (hackathon && hackathon.status === 'ongoing') {
        return res.status(400).json({
          success: false,
          message: 'Cannot disband team during ongoing hackathon'
        });
      }

      // Mark as disbanded instead of deleting
      team.status = 'disbanded';
      await team.save();

      // Cancel all pending requests related to this team
      await HackRequest.updateMany(
        { teamId, status: 'pending' },
        { status: 'rejected' }
      );

      // Clear caches
      await cacheService.invalidatePattern(`team:${teamId}*`);
      await cacheService.invalidatePattern(`teams:hackathon:${team.hackathonId}*`);

      res.json({
        success: true,
        message: 'Team disbanded successfully'
      });

    } catch (error) {
      console.error('Delete team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disband team'
      });
    }
  }

  // Join team (for public teams or auto-accept)
  async joinTeam(req, res) {
    try {
      const { teamId } = req.params;
      const { role = 'developer', message } = req.body;

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      if (team.isFull) {
        return res.status(400).json({
          success: false,
          message: 'Team is already full'
        });
      }

      // Check if user already in a team for this hackathon
      const existingTeam = await Team.findOne({
        hackathonId: team.hackathonId,
        'members.userId': req.user._id,
        'members.status': 'active'
      });

      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: 'You are already in a team for this hackathon'
        });
      }

      // Get user profile for skill matching
      const userProfile = await Profile.findOne({ userId: req.user._id });
      const userSkills = userProfile?.skills || [];

      // Check if can auto-join
      const canAutoJoin = team.settings.allowDirectJoin || 
        (team.settings.autoAcceptSkills.length > 0 && 
         team.settings.autoAcceptSkills.some(skill => userSkills.includes(skill)));

      if (canAutoJoin && !team.settings.requireApproval) {
        // Add directly to team
        await team.addMember(req.user._id, role);
        
        await team.populate([
          { path: 'leaderId', select: 'firstName lastName profilePicture' },
          { path: 'members.userId', select: 'firstName lastName profilePicture' }
        ]);

        // Clear caches
        await cacheService.invalidatePattern(`team:${teamId}*`);

        return res.json({
          success: true,
          message: 'Successfully joined the team',
          data: { team }
        });
      }

      // Create join request
      const existingRequest = await HackRequest.findOne({
        fromUserId: req.user._id,
        teamId,
        status: 'pending',
        type: 'team_join'
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Join request already pending'
        });
      }

      const joinRequest = new HackRequest({
        fromUserId: req.user._id,
        toUserId: team.leaderId,
        hackathonId: team.hackathonId,
        teamId,
        message: message || `I would like to join your team as a ${role}`,
        type: 'team_join',
        metadata: { requestedRole: role }
      });

      await joinRequest.save();

      res.json({
        success: true,
        message: 'Join request sent successfully. Team leader will be notified.'
      });

    } catch (error) {
      console.error('Join team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to join team'
      });
    }
  }

  // Leave team
  async leaveTeam(req, res) {
    try {
      const { teamId } = req.params;
      const { transferTo } = req.body;

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      const isLeader = team.leaderId.toString() === req.user._id.toString();
      
      if (isLeader) {
        if (team.members.length > 1) {
          if (!transferTo) {
            return res.status(400).json({
              success: false,
              message: 'Team leader must transfer leadership before leaving'
            });
          }
          
          // Transfer leadership first
          await team.transferLeadership(transferTo);
        }
      }

      // Remove member
      await team.removeMember(req.user._id, 'left');

      // If no members left, disband team
      if (team.teamSize.current === 0) {
        team.status = 'disbanded';
        await team.save();
      }

      // Clear caches
      await cacheService.invalidatePattern(`team:${teamId}*`);

      res.json({
        success: true,
        message: 'Successfully left the team'
      });

    } catch (error) {
      console.error('Leave team error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to leave team'
      });
    }
  }

  // Kick member from team
  async kickMember(req, res) {
    try {
      const { teamId, userId } = req.params;
      const { reason } = req.body;

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      if (!team.canUserPerformAction(req.user._id, 'kick')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to kick members'
        });
      }

      if (team.leaderId.toString() === userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot kick team leader'
        });
      }

      await team.removeMember(userId, 'kicked');

      // Clear caches
      await cacheService.invalidatePattern(`team:${teamId}*`);

      res.json({
        success: true,
        message: 'Member removed from team'
      });

    } catch (error) {
      console.error('Kick member error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to remove member'
      });
    }
  }

  // Get teams for hackathon with filters
  async getHackathonTeams(req, res) {
    try {
      const { hackathonId } = req.params;
      const {
        page = 1,
        limit = 10,
        status,
        skills,
        hasOpenings,
        location,
        search,
        sortBy = 'lastActivity'
      } = req.query;

      // Build cache key
      const cacheKey = `teams:hackathon:${hackathonId}:${JSON.stringify(req.query)}`;
      let result = await cacheService.get(cacheKey);

      if (!result) {
        const filters = {
          status,
          skills: skills ? skills.split(',') : undefined,
          hasOpenings: hasOpenings === 'true',
          location
        };

        let query = Team.findByHackathonWithFilters(hackathonId, filters);

        // Add search
        if (search) {
          query = query.find({
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
              { tags: { $in: [new RegExp(search, 'i')] } },
              { requiredSkills: { $in: [new RegExp(search, 'i')] } }
            ]
          });
        }

        // Sorting
        const sortOptions = {
          lastActivity: { 'stats.lastActivity': -1 },
          newest: { createdAt: -1 },
          oldest: { createdAt: 1 },
          mostViewed: { 'stats.viewCount': -1 },
          teamSize: { 'teamSize.current': -1 }
        };

        if (sortOptions[sortBy]) {
          query = query.sort(sortOptions[sortBy]);
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const totalTeams = await Team.countDocuments(query.getQuery());
        
        const teams = await query
          .skip(skip)
          .limit(parseInt(limit))
          .lean();

        result = {
          teams,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalTeams / parseInt(limit)),
            totalTeams,
            hasNext: parseInt(page) < Math.ceil(totalTeams / parseInt(limit)),
            hasPrev: parseInt(page) > 1
          }
        };

        // Cache for 5 minutes
        await cacheService.set(cacheKey, result, 300);
      }

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Get hackathon teams error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get teams'
      });
    }
  }

  // Get user's teams
  async getUserTeams(req, res) {
    try {
      const { status, hackathonId } = req.query;
      
      const query = {
        $or: [
          { leaderId: req.user._id },
          { 'members.userId': req.user._id, 'members.status': 'active' }
        ]
      };

      if (status) {
        query.status = status;
      }

      if (hackathonId) {
        query.hackathonId = hackathonId;
      }

      const teams = await Team.find(query)
        .populate('hackathonId', 'title startDate endDate status')
        .populate('leaderId', 'firstName lastName profilePicture')
        .populate('members.userId', 'firstName lastName profilePicture')
        .sort({ 'stats.lastActivity': -1 });

      // Add user's role in each team
      const teamsWithRole = teams.map(team => {
        const isLeader = team.leaderId._id.toString() === req.user._id.toString();
        const member = team.members.find(m => m.userId._id.toString() === req.user._id.toString());
        
        return {
          ...team.toObject(),
          userRole: isLeader ? 'leader' : member?.role || 'member',
          userPermissions: {
            canEdit: team.canUserPerformAction(req.user._id, 'edit'),
            canInvite: team.canUserPerformAction(req.user._id, 'invite'),
            canKick: team.canUserPerformAction(req.user._id, 'kick')
          }
        };
      });

      res.json({
        success: true,
        data: { teams: teamsWithRole }
      });

    } catch (error) {
      console.error('Get user teams error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user teams'
      });
    }
  }

  // Invite user to team
  async inviteToTeam(req, res) {
    try {
      const { teamId } = req.params;
      const { userId, message, role = 'developer' } = req.body;

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      if (!team.canUserPerformAction(req.user._id, 'invite')) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to invite members'
        });
      }

      if (team.isFull) {
        return res.status(400).json({
          success: false,
          message: 'Team is already full'
        });
      }

      // Check if user exists
      const invitedUser = await User.findById(userId);
      if (!invitedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user already in team
      const existingMember = team.members.find(member => 
        member.userId.toString() === userId && member.status === 'active'
      );

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'User is already a team member'
        });
      }

      // Check if invitation already sent
      const existingInvite = await HackRequest.findOne({
        fromUserId: req.user._id,
        toUserId: userId,
        teamId,
        status: 'pending',
        type: 'team_invite'
      });

      if (existingInvite) {
        return res.status(400).json({
          success: false,
          message: 'Invitation already sent'
        });
      }

      // Create invitation
      const invitation = new HackRequest({
        fromUserId: req.user._id,
        toUserId: userId,
        hackathonId: team.hackathonId,
        teamId,
        message: message || `You've been invited to join ${team.name}`,
        type: 'team_invite',
        metadata: { role }
      });

      await invitation.save();

      res.json({
        success: true,
        message: 'Invitation sent successfully'
      });

    } catch (error) {
      console.error('Invite to team error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send invitation'
      });
    }
  }

  // Get team recommendations for user
// Get team recommendations for user
async getTeamRecommendations(req, res) {
  try {
    const { hackathonId } = req.params;
    const { limit = 10 } = req.query;

    // Debug logging
    console.log('Team recommendations request:', {
      hackathonId,
      limit,
      userId: req.user?._id,
      userExists: !!req.user
    });

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      console.error('User not authenticated or missing user ID');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Validate hackathonId format
    if (!hackathonId || !hackathonId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Invalid hackathon ID format:', hackathonId);
      return res.status(400).json({
        success: false,
        message: 'Invalid hackathon ID format'
      });
    }

    // Get user profile with error handling
    let userProfile;
    try {
      userProfile = await Profile.findOne({ userId: req.user._id });
      console.log('User profile found:', !!userProfile);
    } catch (profileError) {
      console.error('Profile lookup error:', profileError);
      return res.status(500).json({
        success: false,
        message: 'Error retrieving user profile'
      });
    }

    if (!userProfile) {
      console.log('No profile found for user:', req.user._id);
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile first'
      });
    }

    // Check cache with error handling
    const cacheKey = `team_recommendations:${req.user._id}:${hackathonId}`;
    let recommendations = null;

    try {
      if (cacheService && typeof cacheService.get === 'function') {
        recommendations = await cacheService.get(cacheKey);
        console.log('Cache lookup completed, found:', !!recommendations);
      } else {
        console.warn('Cache service not available, skipping cache lookup');
      }
    } catch (cacheError) {
      console.error('Cache lookup error:', cacheError);
      // Continue without cache - don't fail the request
    }

    if (!recommendations) {
      // Get AI recommendations with error handling
      try {
        if (!matchmakingService || typeof matchmakingService.getTeamRecommendations !== 'function') {
          console.error('Matchmaking service not available');
          return res.status(503).json({
            success: false,
            message: 'Team recommendation service is currently unavailable'
          });
        }

        console.log('Calling matchmaking service...');
        recommendations = await matchmakingService.getTeamRecommendations(
          req.user._id,
          hackathonId,
          parseInt(limit)
        );
        console.log('Matchmaking service returned:', recommendations?.length || 0, 'recommendations');

        // Cache the results if cache service is available
        try {
          if (cacheService && typeof cacheService.set === 'function') {
            await cacheService.set(cacheKey, recommendations, 1800);
            console.log('Results cached successfully');
          }
        } catch (cacheSetError) {
          console.error('Cache set error:', cacheSetError);
          // Don't fail the request if caching fails
        }

      } catch (matchmakingError) {
        console.error('Matchmaking service error:', matchmakingError);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate team recommendations'
        });
      }
    }

    // Ensure recommendations is an array
    if (!Array.isArray(recommendations)) {
      console.warn('Recommendations is not an array:', typeof recommendations);
      recommendations = [];
    }

    console.log('Sending response with', recommendations.length, 'recommendations');
    
    res.json({
      success: true,
      data: { 
        recommendations,
        count: recommendations.length
      }
    });

  } catch (error) {
    console.error('Team recommendations error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get team recommendations',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack 
      })
    });
  }
}

  // Transfer team leadership
  async transferLeadership(req, res) {
    try {
      const { teamId } = req.params;
      const { newLeaderId } = req.body;

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // Only current leader can transfer
      if (team.leaderId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only team leader can transfer leadership'
        });
      }

      await team.transferLeadership(newLeaderId);

      await team.populate([
        { path: 'leaderId', select: 'firstName lastName profilePicture' },
        { path: 'members.userId', select: 'firstName lastName profilePicture' }
      ]);

      // Clear caches
      await cacheService.invalidatePattern(`team:${teamId}*`);

      res.json({
        success: true,
        message: 'Leadership transferred successfully',
        data: { team }
      });

    } catch (error) {
      console.error('Transfer leadership error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to transfer leadership'
      });
    }
  }

  // Update member permissions
  async updateMemberPermissions(req, res) {
    try {
      const { teamId, userId } = req.params;
      const { permissions } = req.body;

      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // Only leader can update permissions
      if (team.leaderId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only team leader can update permissions'
        });
      }

      const member = team.members.find(m => 
        m.userId.toString() === userId && m.status === 'active'
      );

      if (!member) {
        return res.status(404).json({
          success: false,
          message: 'Member not found'
        });
      }

      // Update permissions
      member.permissions = {
        ...member.permissions,
        ...permissions
      };

      await team.save();

      // Clear caches
      await cacheService.invalidatePattern(`team:${teamId}*`);

      res.json({
        success: true,
        message: 'Member permissions updated successfully'
      });

    } catch (error) {
      console.error('Update member permissions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update member permissions'
      });
    }
  }

  // Get team statistics
  async getTeamStats(req, res) {
    try {
      const { teamId } = req.params;

      const team = await Team.findById(teamId)
        .populate('hackathonId', 'title')
        .populate('members.userId', 'firstName lastName');

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // Check if user is team member
      const isMember = team.members.some(member => 
        member.userId._id.toString() === req.user._id.toString() && member.status === 'active'
      );

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const stats = {
        basic: {
          totalMembers: team.teamSize.current,
          maxMembers: team.teamSize.max,
          availableSpots: team.availableSpots,
          completionScore: team.stats.completionScore,
          viewCount: team.stats.viewCount,
          lastActivity: team.stats.lastActivity
        },
        skills: {
          required: team.requiredSkills.length,
          fulfilled: team.requiredSkills.filter(skill => skill.fulfilled).length
        },
        roles: {
          preferred: team.preferredRoles,
          distribution: team.members.reduce((acc, member) => {
            if (member.status === 'active') {
              acc[member.role] = (acc[member.role] || 0) + 1;
            }
            return acc;
          }, {})
        },
        timeline: {
          created: team.createdAt,
          lastUpdate: team.updatedAt,
          memberJoins: team.members
            .filter(m => m.status === 'active')
            .map(m => ({ userId: m.userId._id, joinedAt: m.joinedAt, role: m.role }))
        }
      };

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      console.error('Get team stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get team statistics'
      });
    }
  }
}

module.exports = new TeamController();