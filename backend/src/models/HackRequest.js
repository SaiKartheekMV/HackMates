const mongoose = require('mongoose');

const hackRequestSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender user ID is required'],
    index: true
  },
  
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver user ID is required'],
    index: true
  },
  
  hackathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hackathon',
    required: [true, 'Hackathon ID is required'],
    index: true
  },
  
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: false,
    default: null
  },
  
  type: {
    type: String,
    enum: {
      values: ['teammate_request', 'team_invite', 'skill_based_match', 'general_collaboration'],
      message: '{VALUE} is not a valid request type'
    },
    required: [true, 'Request type is required'],
    default: 'teammate_request'
  },
  
  subject: {
    type: String,
    required: [true, 'Request subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters'],
    minlength: [5, 'Subject must be at least 5 characters']
  },
  
  message: {
    type: String,
    required: [true, 'Request message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
    minlength: [10, 'Message must be at least 10 characters']
  },
  
  status: {
    type: String,
    enum: {
      values: ['pending', 'accepted', 'rejected', 'cancelled', 'expired'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending',
    index: true
  },
  
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: '{VALUE} is not a valid priority level'
    },
    default: 'medium'
  },
  
  requestedRole: {
    type: String,
    enum: {
      values: ['frontend_developer', 'backend_developer', 'fullstack_developer', 'mobile_developer', 
               'ui_ux_designer', 'data_scientist', 'ml_engineer', 'devops_engineer', 
               'product_manager', 'business_analyst', 'marketing_specialist', 'other'],
      message: '{VALUE} is not a valid role'
    },
    required: false
  },
  
  requiredSkills: [{
    skill: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    level: {
      type: String,
      enum: {
        values: ['beginner', 'intermediate', 'advanced', 'expert'],
        message: '{VALUE} is not a valid skill level'
      },
      default: 'intermediate'
    },
    priority: {
      type: String,
      enum: ['must_have', 'nice_to_have'],
      default: 'nice_to_have'
    }
  }],
  
  proposedContribution: {
    type: String,
    maxlength: [500, 'Proposed contribution cannot exceed 500 characters'],
    trim: true
  },
  
  availability: {
    hoursPerWeek: {
      type: Number,
      min: [1, 'Hours per week must be at least 1'],
      max: [168, 'Hours per week cannot exceed 168'],
      validate: {
        validator: Number.isInteger,
        message: 'Hours per week must be a whole number'
      }
    },
    timezone: {
      type: String,
      validate: {
        validator: function(v) {
          // Basic timezone validation (e.g., UTC, UTC+5:30, America/New_York)
          return !v || /^(UTC[+-]\d{1,2}(:\d{2})?|[A-Za-z]+\/[A-Za-z_]+)$/.test(v);
        },
        message: 'Invalid timezone format'
      }
    },
    preferredWorkingTimes: [{
      day: {
        type: String,
        enum: {
          values: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          message: '{VALUE} is not a valid day'
        },
        required: true
      },
      startTime: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Start time must be in HH:MM format'
        }
      },
      endTime: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'End time must be in HH:MM format'
        }
      }
    }]
  },
  
  matchScore: {
    type: Number,
    min: [0, 'Match score cannot be negative'],
    max: [100, 'Match score cannot exceed 100'],
    default: 0,
    validate: {
      validator: function(v) {
        return v === Math.round(v);
      },
      message: 'Match score must be a whole number'
    }
  },
  
  compatibility: {
    skillMatch: {
      type: Number,
      min: [0, 'Skill match score cannot be negative'],
      max: [100, 'Skill match score cannot exceed 100'],
      default: 0
    },
    experienceMatch: {
      type: Number,
      min: [0, 'Experience match score cannot be negative'],
      max: [100, 'Experience match score cannot exceed 100'],
      default: 0
    },
    locationMatch: {
      type: Number,
      min: [0, 'Location match score cannot be negative'],
      max: [100, 'Location match score cannot exceed 100'],
      default: 0
    },
    timezoneMatch: {
      type: Number,
      min: [0, 'Timezone match score cannot be negative'],
      max: [100, 'Timezone match score cannot exceed 100'],
      default: 0
    },
    availabilityMatch: {
      type: Number,
      min: [0, 'Availability match score cannot be negative'],
      max: [100, 'Availability match score cannot exceed 100'],
      default: 0
    }
  },
  
  responseMessage: {
    type: String,
    maxlength: [500, 'Response message cannot exceed 500 characters'],
    trim: true
  },
  
  responseDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v >= this.createdAt;
      },
      message: 'Response date cannot be before creation date'
    }
  },
  
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    },
    validate: {
      validator: function(v) {
        return v > new Date();
      },
      message: 'Expiry date must be in the future'
    }
  },
  
  metadata: {
    isAIGenerated: {
      type: Boolean,
      default: false
    },
    aiConfidence: {
      type: Number,
      min: [0, 'AI confidence cannot be negative'],
      max: [100, 'AI confidence cannot exceed 100'],
      validate: {
        validator: function(v) {
          return !this.metadata.isAIGenerated || (v !== null && v !== undefined);
        },
        message: 'AI confidence is required for AI-generated requests'
      }
    },
    referenceId: {
      type: String,
      trim: true
    },
    source: {
      type: String,
      enum: {
        values: ['manual', 'ai_recommendation', 'mutual_match', 'skill_search', 'hackathon_browse'],
        message: '{VALUE} is not a valid source'
      },
      default: 'manual'
    },
    algorithmVersion: {
      type: String,
      default: '1.0'
    }
  },
  
  notifications: {
    emailSent: {
      type: Boolean,
      default: false
    },
    emailSentAt: Date,
    pushSent: {
      type: Boolean,
      default: false
    },
    pushSentAt: Date,
    reminderSent: {
      type: Boolean,
      default: false
    },
    reminderSentAt: Date,
    reminderCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  
  viewedAt: Date,
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  
  // Analytics tracking
  analytics: {
    viewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastViewedAt: Date,
    responseTimeHours: Number // Calculated field
  }
  
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
hackRequestSchema.index({ fromUserId: 1, status: 1, createdAt: -1 });
hackRequestSchema.index({ toUserId: 1, status: 1, createdAt: -1 });
hackRequestSchema.index({ hackathonId: 1, status: 1, matchScore: -1 });
hackRequestSchema.index({ hackathonId: 1, type: 1, status: 1 });
hackRequestSchema.index({ teamId: 1, status: 1 });
hackRequestSchema.index({ matchScore: -1, createdAt: -1 });
hackRequestSchema.index({ expiresAt: 1, status: 1 });

// Text index for searching
hackRequestSchema.index({ 
  subject: 'text', 
  message: 'text', 
  tags: 'text' 
});

// Virtual fields
hackRequestSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt && this.status === 'pending';
});

hackRequestSchema.virtual('timeRemaining').get(function() {
  if (this.status !== 'pending') return 0;
  const remaining = this.expiresAt - new Date();
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60))); // Hours remaining
});

hackRequestSchema.virtual('isViewed').get(function() {
  return !!this.viewedAt;
});

hackRequestSchema.virtual('responseTime').get(function() {
  if (!this.responseDate || !this.createdAt) return null;
  return Math.round((this.responseDate - this.createdAt) / (1000 * 60 * 60)); // Hours
});

hackRequestSchema.virtual('daysUntilExpiry').get(function() {
  if (this.status !== 'pending') return 0;
  const remaining = this.expiresAt - new Date();
  return Math.max(0, Math.ceil(remaining / (1000 * 60 * 60 * 24))); // Days remaining
});

// Pre-save middleware
hackRequestSchema.pre('save', function(next) {
  // Prevent self-requests
  if (this.fromUserId && this.toUserId && this.fromUserId.toString() === this.toUserId.toString()) {
    return next(new Error('Cannot send request to yourself'));
  }
  
  // Auto-expire old pending requests
  if (this.status === 'pending' && new Date() > this.expiresAt) {
    this.status = 'expired';
  }
  
  // Set response date when status changes from pending
  if (this.isModified('status') && this.status !== 'pending' && !this.responseDate) {
    this.responseDate = new Date();
    
    // Calculate response time
    if (this.createdAt) {
      this.analytics.responseTimeHours = Math.round(
        (this.responseDate - this.createdAt) / (1000 * 60 * 60)
      );
    }
  }
  
  // Calculate overall match score from compatibility scores
  if (this.compatibility && this.isModified('compatibility')) {
    const scores = [
      this.compatibility.skillMatch || 0,
      this.compatibility.experienceMatch || 0,
      this.compatibility.locationMatch || 0,
      this.compatibility.timezoneMatch || 0,
      this.compatibility.availabilityMatch || 0
    ].filter(score => score > 0);
    
    if (scores.length > 0) {
      this.matchScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }
  
  // Validate working times
  if (this.availability && this.availability.preferredWorkingTimes) {
    for (const timeSlot of this.availability.preferredWorkingTimes) {
      if (timeSlot.startTime >= timeSlot.endTime) {
        return next(new Error('Start time must be before end time'));
      }
    }
  }
  
  next();
});

// Pre-validate middleware
hackRequestSchema.pre('validate', function(next) {
  // Ensure AI confidence is provided for AI-generated requests
  if (this.metadata && this.metadata.isAIGenerated && 
      (this.metadata.aiConfidence === null || this.metadata.aiConfidence === undefined)) {
    return next(new Error('AI confidence is required for AI-generated requests'));
  }
  
  next();
});

// Static methods
hackRequestSchema.statics.findPendingRequests = function(userId, options = {}) {
  const {
    limit = 20,
    page = 1,
    sortBy = 'matchScore',
    sortOrder = -1,
    hackathonId = null
  } = options;
  
  const query = {
    toUserId: userId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  };
  
  if (hackathonId) {
    query.hackathonId = hackathonId;
  }
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('fromUserId', 'firstName lastName profilePicture email')
    .populate('hackathonId', 'title startDate endDate location')
    .populate('teamId', 'name description currentSize maxMembers')
    .sort({ [sortBy]: sortOrder, createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

hackRequestSchema.statics.findSentRequests = function(userId, options = {}) {
  const { status = null, limit = 20, page = 1 } = options;
  const query = { fromUserId: userId };
  
  if (status) query.status = status;
  
  const skip = (page - 1) * limit;
  
  return this.find(query)
    .populate('toUserId', 'firstName lastName profilePicture')
    .populate('hackathonId', 'title startDate endDate location')
    .populate('teamId', 'name description')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

hackRequestSchema.statics.findByHackathon = function(hackathonId, options = {}) {
  const { status = null, limit = 50, type = null } = options;
  const query = { hackathonId };
  
  if (status) query.status = status;
  if (type) query.type = type;
  
  return this.find(query)
    .populate('fromUserId', 'firstName lastName profilePicture')
    .populate('toUserId', 'firstName lastName profilePicture')
    .populate('teamId', 'name description')
    .sort({ matchScore: -1, createdAt: -1 })
    .limit(limit);
};

hackRequestSchema.statics.findDuplicateRequest = function(fromUserId, toUserId, hackathonId, teamId = null) {
  const query = {
    fromUserId,
    toUserId,
    hackathonId,
    status: { $in: ['pending', 'accepted'] }
  };
  
  if (teamId) query.teamId = teamId;
  
  return this.findOne(query);
};

hackRequestSchema.statics.expireOldRequests = function() {
  return this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { 
        status: 'expired',
        updatedAt: new Date()
      }
    }
  );
};

hackRequestSchema.statics.getAnalytics = function(hackathonId, dateRange = {}) {
  const { startDate, endDate } = dateRange;
  const matchStage = { hackathonId };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = new Date(startDate);
    if (endDate) matchStage.createdAt.$lte = new Date(endDate);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgMatchScore: { $avg: '$matchScore' },
        avgResponseTime: { $avg: '$analytics.responseTimeHours' }
      }
    }
  ]);
};

// Instance methods
hackRequestSchema.methods.accept = function(responseMessage = '') {
  if (this.status !== 'pending') {
    throw new Error('Only pending requests can be accepted');
  }
  
  if (this.isExpired) {
    throw new Error('Cannot accept expired request');
  }
  
  this.status = 'accepted';
  this.responseMessage = responseMessage;
  this.responseDate = new Date();
  
  return this.save();
};

hackRequestSchema.methods.reject = function(responseMessage = '') {
  if (this.status !== 'pending') {
    throw new Error('Only pending requests can be rejected');
  }
  
  this.status = 'rejected';
  this.responseMessage = responseMessage;
  this.responseDate = new Date();
  
  return this.save();
};

hackRequestSchema.methods.cancel = function() {
  if (this.status !== 'pending') {
    throw new Error('Only pending requests can be cancelled');
  }
  
  this.status = 'cancelled';
  return this.save();
};

hackRequestSchema.methods.markAsViewed = function() {
  if (!this.viewedAt) {
    this.viewedAt = new Date();
    this.analytics.viewCount += 1;
    this.analytics.lastViewedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

hackRequestSchema.methods.extendExpiry = function(days = 7) {
  if (this.status !== 'pending') {
    throw new Error('Only pending requests can be extended');
  }
  
  this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return this.save();
};

hackRequestSchema.methods.updateMatchScore = function(compatibility) {
  this.compatibility = { ...this.compatibility.toObject(), ...compatibility };
  return this.save();
};

hackRequestSchema.methods.sendReminder = function() {
  if (this.status !== 'pending') {
    throw new Error('Only pending requests can have reminders sent');
  }
  
  this.notifications.reminderSent = true;
  this.notifications.reminderSentAt = new Date();
  this.notifications.reminderCount += 1;
  
  return this.save();
};

// Post middleware
hackRequestSchema.post('save', function(doc, next) {
  if (doc.isModified('status')) {
    if (doc.status === 'accepted') {
      console.log(`✅ Request accepted: ${doc.fromUserId} -> ${doc.toUserId} for hackathon ${doc.hackathonId}`);
    } else if (doc.status === 'rejected') {
      console.log(`❌ Request rejected: ${doc.fromUserId} -> ${doc.toUserId} for hackathon ${doc.hackathonId}`);
    }
  }
  next();
});

// TTL index for auto-cleanup of old expired requests (30 days after expiry)
hackRequestSchema.index({ expiresAt: 1 }, { 
  expireAfterSeconds: 2592000,
  partialFilterExpression: { status: 'expired' }
});

module.exports = mongoose.model('HackRequest', hackRequestSchema);