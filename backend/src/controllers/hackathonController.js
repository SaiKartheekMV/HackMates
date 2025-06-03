const Hackathon = require('../models/Hackathon');
const Team = require('../models/Team');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const cacheService = require('../services/cacheService');

// @desc    Get all hackathons with filters
// @route   GET /api/hackathons
// @access  Private
const getHackathons = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      location,
      difficulty,
      startDate,
      endDate,
      search,
      sort = '-createdAt'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter object
    const filter = {};

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Category filter
    if (category) {
      filter.categories = { $in: category.split(',') };
    }

    // Location filter
    if (location) {
      filter.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } },
        { 'location.venue': { $regex: location, $options: 'i' } }
      ];
    }

    // Difficulty filter
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) {
        filter.startDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.startDate.$lte = new Date(endDate);
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } }
      ];
    }

    // Check cache first
    const cacheKey = `hackathons:${JSON.stringify({ filter, page, limit, sort })}`;
    let cachedResult = await cacheService.get(cacheKey);

    if (cachedResult) {
      return res.status(200).json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Query database
    const hackathons = await Hackathon.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v');

    const total = await Hackathon.countDocuments(filter);

    const result = {
      hackathons,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      },
      filters: {
        status,
        category,
        location,
        difficulty,
        search
      }
    };

    // Cache the result for 30 minutes
    await cacheService.set(cacheKey, result, 1800);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single hackathon by ID
// @route   GET /api/hackathons/:id
// @access  Private
const getHackathon = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check cache first
    const cacheKey = `hackathon:${id}`;
    let cachedHackathon = await cacheService.get(cacheKey);

    if (cachedHackathon) {
      return res.status(200).json({
        success: true,
        data: cachedHackathon,
        cached: true
      });
    }

    const hackathon = await Hackathon.findById(id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Get teams count for this hackathon
    const teamsCount = await Team.countDocuments({ 
      hackathonId: id,
      status: { $ne: 'disbanded' }
    });

    const hackathonData = {
      ...hackathon.toObject(),
      teamsCount
    };

    // Cache for 1 hour
    await cacheService.set(cacheKey, hackathonData, 3600);

    res.status(200).json({
      success: true,
      data: hackathonData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new hackathon
// @route   POST /api/hackathons
// @access  Private (Admin only)
const createHackathon = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const hackathonData = {
      ...req.body,
      createdBy: req.user.id
    };

    // Auto-determine status based on dates
    const now = new Date();
    const startDate = new Date(hackathonData.startDate);
    const endDate = new Date(hackathonData.endDate);

    if (now < startDate) {
      hackathonData.status = 'upcoming';
    } else if (now >= startDate && now <= endDate) {
      hackathonData.status = 'ongoing';
    } else {
      hackathonData.status = 'completed';
    }

    const hackathon = await Hackathon.create(hackathonData);

    // Clear hackathons cache
    await cacheService.clearPattern('hackathons:*');

    res.status(201).json({
      success: true,
      message: 'Hackathon created successfully',
      data: hackathon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hackathon
// @route   PUT /api/hackathons/:id
// @access  Private (Admin only)
const updateHackathon = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = { ...req.body };

    // Auto-update status based on dates if dates are being updated
    if (updateData.startDate || updateData.endDate) {
      const now = new Date();
      const startDate = new Date(updateData.startDate);
      const endDate = new Date(updateData.endDate);

      if (now < startDate) {
        updateData.status = 'upcoming';
      } else if (now >= startDate && now <= endDate) {
        updateData.status = 'ongoing';
      } else {
        updateData.status = 'completed';
      }
    }

    const hackathon = await Hackathon.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Clear caches
    await cacheService.clearPattern('hackathons:*');
    await cacheService.del(`hackathon:${id}`);

    res.status(200).json({
      success: true,
      message: 'Hackathon updated successfully',
      data: hackathon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete hackathon
// @route   DELETE /api/hackathons/:id
// @access  Private (Admin only)
const deleteHackathon = async (req, res, next) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params;

    // Check if hackathon has active teams
    const activeTeams = await Team.countDocuments({
      hackathonId: id,
      status: { $in: ['forming', 'complete', 'competing'] }
    });

    if (activeTeams > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete hackathon with ${activeTeams} active teams. Please contact teams first.`
      });
    }

    const hackathon = await Hackathon.findByIdAndDelete(id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Clean up related data
    await Team.deleteMany({ hackathonId: id });

    // Clear caches
    await cacheService.clearPattern('hackathons:*');
    await cacheService.del(`hackathon:${id}`);

    res.status(200).json({
      success: true,
      message: 'Hackathon deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get teams for a specific hackathon
// @route   GET /api/hackathons/:id/teams
// @access  Private
const getHackathonTeams = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      status,
      availableOnly = false
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Verify hackathon exists
    const hackathon = await Hackathon.findById(id);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Build filter
    const filter = { hackathonId: id };
    
    if (status) {
      filter.status = status;
    }

    if (availableOnly === 'true') {
      filter.isPublic = true;
      filter.status = 'forming';
    }

    const teams = await Team.find(filter)
      .populate('leaderId', 'firstName lastName profilePicture')
      .populate('members.userId', 'firstName lastName profilePicture')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Team.countDocuments(filter);

    // Add availability info for each team
    const teamsWithAvailability = teams.map(team => {
      const teamObj = team.toObject();
      const activeMembers = team.members.filter(m => m.status === 'active').length + 1; // +1 for leader
      teamObj.spotsAvailable = team.maxMembers - activeMembers;
      teamObj.isAvailable = teamObj.spotsAvailable > 0 && team.isPublic && team.status === 'forming';
      return teamObj;
    });

    res.status(200).json({
      success: true,
      data: {
        teams: teamsWithAvailability,
        hackathon: {
          id: hackathon._id,
          title: hackathon.title,
          status: hackathon.status,
          teamSize: hackathon.teamSize
        },
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

// @desc    Get hackathon statistics
// @route   GET /api/hackathons/:id/stats
// @access  Private
const getHackathonStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const hackathon = await Hackathon.findById(id);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Get team statistics
    const teamStats = await Team.aggregate([
      { $match: { hackathonId: hackathon._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total participants
    const teams = await Team.find({ hackathonId: id });
    let totalParticipants = 0;
    teams.forEach(team => {
      totalParticipants += 1; // leader
      totalParticipants += team.members.filter(m => m.status === 'active').length;
    });

    // Format team stats
    const formattedTeamStats = {
      total: teams.length,
      forming: 0,
      complete: 0,
      competing: 0,
      disbanded: 0
    };

    teamStats.forEach(stat => {
      formattedTeamStats[stat._id] = stat.count;
    });

    const stats = {
      hackathon: {
        id: hackathon._id,
        title: hackathon.title,
        status: hackathon.status,
        startDate: hackathon.startDate,
        endDate: hackathon.endDate
      },
      participants: {
        total: totalParticipants,
        estimated: hackathon.participants || 0
      },
      teams: formattedTeamStats,
      timeline: {
        // Continuation from getHackathonStats function
        daysUntilStart: Math.ceil((hackathon.startDate - new Date()) / (1000 * 60 * 60 * 24)),
        daysUntilEnd: Math.ceil((hackathon.endDate - new Date()) / (1000 * 60 * 60 * 24)),
        duration: Math.ceil((hackathon.endDate - hackathon.startDate) / (1000 * 60 * 60 * 24))
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join hackathon
// @route   POST /api/hackathons/:id/join
// @access  Private
const joinHackathon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const hackathon = await Hackathon.findById(id);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Check if hackathon is still accepting registrations
    if (hackathon.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed for this hackathon'
      });
    }

    if (hackathon.registrationDeadline && new Date() > hackathon.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed'
      });
    }

    // Check if user already has a team in this hackathon
    const existingTeam = await Team.findOne({
      hackathonId: id,
      $or: [
        { leaderId: userId },
        { 'members.userId': userId, 'members.status': 'active' }
      ]
    });

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'You are already part of a team in this hackathon'
      });
    }

    res.status(200).json({
      success: true,
      message: 'You can proceed to create or join a team for this hackathon',
      data: {
        hackathon: {
          id: hackathon._id,
          title: hackathon.title,
          teamSize: hackathon.teamSize
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search hackathons with advanced filters
// @route   GET /api/hackathons/search
// @access  Private
const searchHackathons = async (req, res, next) => {
  try {
    const {
      q, // search query
      page = 1,
      limit = 20,
      status = 'upcoming',
      categories,
      location,
      difficulty,
      teamSize,
      startDate,
      endDate,
      prizes,
      sort = '-createdAt'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build aggregation pipeline
    const pipeline = [];

    // Match stage
    const matchStage = { $match: {} };
    
    if (q) {
      matchStage.$match.$text = { $search: q };
    }

    if (status && status !== 'all') {
      matchStage.$match.status = status;
    }

    if (categories) {
      matchStage.$match.categories = { $in: categories.split(',') };
    }

    if (difficulty) {
      matchStage.$match.difficulty = difficulty;
    }

    if (location) {
      matchStage.$match.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } }
      ];
    }

    if (teamSize) {
      const [min, max] = teamSize.split('-').map(Number);
      if (max) {
        matchStage.$match['teamSize.min'] = { $lte: max };
        matchStage.$match['teamSize.max'] = { $gte: min };
      } else {
        matchStage.$match['teamSize.max'] = { $gte: min };
      }
    }

    if (startDate || endDate) {
      matchStage.$match.startDate = {};
      if (startDate) {
        matchStage.$match.startDate.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.$match.startDate.$lte = new Date(endDate);
      }
    }

    if (prizes === 'true') {
      matchStage.$match.prizes = { $exists: true, $ne: [] };
    }

    pipeline.push(matchStage);

    // Add score for text search
    if (q) {
      pipeline.push({ $addFields: { score: { $meta: 'textScore' } } });
    }

    // Add team count
    pipeline.push({
      $lookup: {
        from: 'teams',
        localField: '_id',
        foreignField: 'hackathonId',
        as: 'teams'
      }
    });

    pipeline.push({
      $addFields: {
        teamsCount: { $size: '$teams' }
      }
    });

    // Remove teams array to reduce payload
    pipeline.push({
      $project: { teams: 0, __v: 0 }
    });

    // Sort stage
    const sortStage = { $sort: {} };
    if (q) {
      sortStage.$sort.score = { $meta: 'textScore' };
    }
    
    // Parse sort parameter
    if (sort.startsWith('-')) {
      sortStage.$sort[sort.substring(1)] = -1;
    } else {
      sortStage.$sort[sort] = 1;
    }
    
    pipeline.push(sortStage);

    // Get total count
    const totalPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Hackathon.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Add pagination
    pipeline.push(
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    const hackathons = await Hackathon.aggregate(pipeline);

    res.status(200).json({
      success: true,
      data: {
        hackathons,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
          hasPrev: parseInt(page) > 1
        },
        searchQuery: q,
        appliedFilters: {
          status,
          categories: categories?.split(','),
          location,
          difficulty,
          teamSize,
          startDate,
          endDate,
          prizes: prizes === 'true'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured/trending hackathons
// @route   GET /api/hackathons/featured
// @access  Private
const getFeaturedHackathons = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;

    // Cache key for featured hackathons
    const cacheKey = 'hackathons:featured';
    let cachedResult = await cacheService.get(cacheKey);

    if (cachedResult) {
      return res.status(200).json({
        success: true,
        data: cachedResult,
        cached: true
      });
    }

    // Get hackathons with most teams (trending)
    const featuredHackathons = await Hackathon.aggregate([
      {
        $match: {
          status: { $in: ['upcoming', 'ongoing'] }
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: '_id',
          foreignField: 'hackathonId',
          as: 'teams'
        }
      },
      {
        $addFields: {
          teamsCount: { $size: '$teams' },
          daysUntilStart: {
            $ceil: {
              $divide: [
                { $subtract: ['$startDate', new Date()] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      {
        $project: { teams: 0, __v: 0 }
      },
      {
        $sort: {
          teamsCount: -1,
          daysUntilStart: 1
        }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Cache for 1 hour
    await cacheService.set(cacheKey, featuredHackathons, 3600);

    res.status(200).json({
      success: true,
      data: featuredHackathons
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHackathons,
  getHackathon,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  getHackathonTeams,
  getHackathonStats,
  joinHackathon,
  searchHackathons,
  getFeaturedHackathons
};