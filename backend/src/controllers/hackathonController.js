// src/controllers/hackathonController.js
const Hackathon = require('../models/Hackathon');
const Team = require('../models/Team');

// Get all hackathons with filters
const getHackathons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      location,
      difficulty,
      search,
      sortBy = 'startDate',
      sortOrder = 'asc',
    } = req.query;

    // Build query
    let query = {};

    if (status) {
      query.status = status;
    }

    if (category) {
      query.categories = { $in: [category] };
    }

    if (location) {
      query.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.country': new RegExp(location, 'i') },
        { 'location.venue': new RegExp(location, 'i') },
      ];
    }

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { organizer: new RegExp(search, 'i') },
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const hackathons = await Hackathon.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Hackathon.countDocuments(query);

    res.json({
      success: true,
      data: {
        hackathons,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalHackathons: total,
          hasNext: skip + hackathons.length < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get hackathons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Get single hackathon by ID
const getHackathonById = async (req, res) => {
  try {
    const { id } = req.params;

    const hackathon = await Hackathon.findById(id);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found',
      });
    }

    // Get teams count for this hackathon
    const teamsCount = await Team.countDocuments({ hackathonId: id });

    res.json({
      success: true,
      data: {
        ...hackathon.toObject(),
        teamsCount,
      },
    });
  } catch (error) {
    console.error('Get hackathon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}; // ✅ FIXED - Removed the extra }; that was on line 79

// Create new hackathon (admin only)
const createHackathon = async (req, res) => {
  try {
    const {
      title,
      description,
      organizer,
      startDate,
      endDate,
      registrationDeadline,
      location,
      categories,
      teamSize,
      prizes,
      requirements,
      technologies,
      difficulty,
      registrationUrl,
      websiteUrl
    } = req.body;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    if (new Date(registrationDeadline) >= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline must be before start date'
      });
    }

    const hackathon = new Hackathon({
      title,
      description,
      organizer,
      startDate,
      endDate,
      registrationDeadline,
      location,
      categories,
      teamSize,
      prizes,
      requirements,
      technologies,
      difficulty,
      registrationUrl,
      websiteUrl,
      status: 'upcoming'
    });

    await hackathon.save();

    res.status(201).json({
      success: true,
      message: 'Hackathon created successfully',
      data: hackathon
    });
  } catch (error) {
    console.error('Create hackathon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Update hackathon (admin only)
const updateHackathon = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Validate dates if provided
    if (updates.startDate && updates.endDate) {
      if (new Date(updates.startDate) >= new Date(updates.endDate)) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    const hackathon = await Hackathon.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    res.json({
      success: true,
      message: 'Hackathon updated successfully',
      data: hackathon
    });
  } catch (error) {
    console.error('Update hackathon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Delete hackathon (admin only)
const deleteHackathon = async (req, res) => {
  try {
    const { id } = req.params;

    const hackathon = await Hackathon.findByIdAndDelete(id);

    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    // Also delete associated teams
    await Team.deleteMany({ hackathonId: id });

    res.json({
      success: true,
      message: 'Hackathon deleted successfully'
    });
  } catch (error) {
    console.error('Delete hackathon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get teams for a hackathon
const getHackathonTeams = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const hackathon = await Hackathon.findById(id);
    if (!hackathon) {
      return res.status(404).json({
        success: false,
        message: 'Hackathon not found'
      });
    }

    const skip = (page - 1) * limit;
    const teams = await Team.find({ hackathonId: id })
      .populate('leaderId', 'firstName lastName profilePicture')
      .populate('members.userId', 'firstName lastName profilePicture')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Team.countDocuments({ hackathonId: id });

    res.json({
      success: true,
      data: {
        teams,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTeams: total,
          hasNext: skip + teams.length < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get hackathon teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  getHackathons,
  getHackathonById,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  getHackathonTeams
};