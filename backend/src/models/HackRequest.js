const mongoose = require('mongoose');

const hackRequestSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender user ID is required']
  },
  
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver user ID is required']
  },
  
  hackathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hackathon',
    required: [true, 'Hackathon ID is required']
  },
  
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: false // Can be null for general teammate requests
  },
  
  type: {
    type: String,
    enum: ['teammate_request', 'team_invite', 'skill_based_match', 'general_collaboration'],
    required: [true, 'Request type is required'],
    default: 'teammate_request'
  },
  
  subject: {
    type: String,
    required: [true, 'Request subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
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
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'expired'],
    default: 'pending'
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  requestedRole: {
    type: String,
    enum: ['developer', 'designer', 'data_scientist', 'pm', 'marketer', 'other'],
    required: false
  },
  
  requiredSkills: [{
    skill: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    }
  }],
  
  proposedContribution: {
    type: String,
    maxlength: [500, 'Proposed contribution cannot exceed 500 characters']
  },
  
  availability: {
    hoursPerWeek: {
      type: Number,
      min: [1, 'Hours per week must be at least 1'],
      max: [168, 'Hours per week cannot exceed 168']
    },
    timezone: String,
    preferredWorkingTimes: [{
      day: {
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      startTime: String, // Format: "HH:MM"
      endTime: String    // Format: "HH:MM"
    }]
  },
  
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  compatibility: {
    skillMatch: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    experienceMatch: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    locationMatch: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    timezoneMatch: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  
  responseMessage: {
    type: String,
    maxlength: [500, 'Response message cannot exceed 500 characters']
  },
  
  responseDate: Date,
  
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  },
  
  metadata: {
    isAIGenerated: {
      type: Boolean,
      default: false
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 100
    },
    referenceId: String, // For tracking AI recommendations
    source: {
      type: String,
      enum: ['manual', 'ai_recommendation', 'mutual_match', 'skill_search'],
      default: 'manual'
    }
  },
  
  notifications: {
    emailSent: {
      type: Boolean,
      default: false
    },
    pushSent: {
      type: Boolean,
      default: false
    },
    reminderSent: {
      type: Boolean,
      default: false
    }
  },
  
  viewedAt: Date,
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }]
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
hackRequestSchema.index({ fromUserId: 1, status: 1 });
hackRequestSchema.index({ toUserId: 1, status: 1 });
hackRequestSchema.index({ hackathonId: 1, status: 1 });
hackRequestSchema.index({ teamId: 1 });
hackRequestSchema.index({ type: 1, status: 1 });
hackRequestSchema.index({ expiresAt: 1 });
hackRequestSchema.index({ createdAt: -1 });
hackRequestSchema.index({ matchScore: -1 });

// Compound indexes
hackRequestSchema.index({ toUserId: 1, status: 1, createdAt: -1 });
hackRequestSchema.index({ hackathonId: 1, type: 1, status: 1 });

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
  if (!this.responseDate) return null;
  return this.responseDate - this.createdAt;
});

// Pre-save middleware
hackRequestSchema.pre('save', function(next) {
  // Prevent self-requests
  if (this.fromUserId.toString() === this.toUserId.toString()) {
    return next(new Error('Cannot send request to yourself'));
  }
  
  // Auto-expire old pending requests
  if (this.status === 'pending' && new Date() > this.expiresAt) {
    this.status = 'expired';
  }
  
  // Set response date when status changes from pending
  if (this.isModified('status') && this.status !== 'pending' && !this.responseDate) {
    this.responseDate = new Date();
  }
  
  // Calculate overall match score from compatibility scores
  if (this.compatibility) {
    const scores = [
      this.compatibility.skillMatch || 0,
      this.compatibility.experienceMatch || 0,
      this.compatibility.locationMatch || 0,
      this.compatibility.timezoneMatch || 0
    ];
    this.matchScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }
  
  next();
});

// Static methods
hackRequestSchema.statics.findPendingRequests = function(userId, limit = 20) {
  return this.find({
    toUserId: userId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  })
  .populate('fromUserId', 'firstName lastName profilePicture email')
  .populate('hackathonId', 'title startDate endDate')
  .populate('teamId', 'name description currentSize maxMembers')
  .sort({ matchScore: -1, createdAt: -1 })
  .limit(limit);
};

hackRequestSchema.statics.findSentRequests = function(userId, status = null, limit = 20) {
  const query = { fromUserId: userId };
  if (status) query.status = status;
  
  return this.find(query)
  .populate('toUserId', 'firstName lastName profilePicture')
  .populate('hackathonId', 'title startDate endDate')
  .populate('teamId', 'name description')
  .sort({ createdAt: -1 })
  .limit(limit);
};

hackRequestSchema.statics.findByHackathon = function(hackathonId, status = null, limit = 50) {
  const query = { hackathonId };
  if (status) query.status = status;
  
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
      $set: { status: 'expired' }
    }
  );
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

// Post middleware
hackRequestSchema.post('save', function(doc) {
  if (doc.isModified('status') && doc.status === 'accepted') {
    console.log(`Request accepted: ${doc.fromUserId} -> ${doc.toUserId} for hackathon ${doc.hackathonId}`);
  }
});

// TTL index for auto-cleanup of old expired requests
hackRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days after expiry

module.exports = mongoose.model('HackRequest', hackRequestSchema);