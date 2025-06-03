const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [100, 'Team name cannot exceed 100 characters'],
    minlength: [3, 'Team name must be at least 3 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Team description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  hackathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hackathon',
    required: [true, 'Hackathon ID is required']
  },
  
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Team leader is required']
  },
  
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['leader', 'developer', 'designer', 'data_scientist', 'pm', 'marketer', 'other'],
      default: 'developer'
    },
    skills: [String],
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'left', 'removed'],
      default: 'active'
    },
    contribution: {
      type: String,
      maxlength: [500, 'Contribution description cannot exceed 500 characters']
    }
  }],
  
  requiredSkills: [{
    skill: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    }
  }],
  
  lookingFor: {
    roles: [{
      type: String,
      enum: ['developer', 'designer', 'data_scientist', 'pm', 'marketer', 'other']
    }],
    count: {
      type: Number,
      min: 0,
      default: 1
    },
    description: String
  },
  
  maxMembers: {
    type: Number,
    required: [true, 'Maximum members count is required'],
    min: [2, 'Team must have at least 2 members'],
    max: [10, 'Team cannot exceed 10 members']
  },
  
  currentSize: {
    type: Number,
    default: 1
  },
  
  isPublic: {
    type: Boolean,
    default: true
  },
  
  isOpen: {
    type: Boolean,
    default: true
  },
  
  status: {
    type: String,
    enum: ['forming', 'complete', 'competing', 'submitted', 'disbanded'],
    default: 'forming'
  },
  
  projectDetails: {
    idea: {
      type: String,
      maxlength: [2000, 'Project idea cannot exceed 2000 characters']
    },
    technologies: [String],
    repositoryUrl: String,
    liveUrl: String,
    pitch: String // Video/presentation URL
  },
  
  communication: {
    discord: String,
    slack: String,
    whatsapp: String,
    telegram: String,
    email: String,
    preferredMethod: {
      type: String,
      enum: ['discord', 'slack', 'whatsapp', 'telegram', 'email'],
      default: 'discord'
    }
  },
  
  preferences: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    workingStyle: {
      type: String,
      enum: ['collaborative', 'independent', 'mixed'],
      default: 'collaborative'
    },
    meetingFrequency: {
      type: String,
      enum: ['daily', 'every_other_day', 'weekly', 'as_needed'],
      default: 'as_needed'
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
      default: 'mixed'
    }
  },
  
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  achievements: [{
    type: {
      type: String,
      enum: ['winner', 'runner_up', 'special_mention', 'completed'],
      required: true
    },
    title: String,
    description: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  statistics: {
    profileViews: {
      type: Number,
      default: 0
    },
    joinRequests: {
      type: Number,
      default: 0
    },
    applicationsReceived: {
      type: Number,
      default: 0
    }
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  featured: {
    type: Boolean,
    default: false
  },
  
  lastActivity: {
    type: Date,
    default: Date.now
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
teamSchema.index({ hackathonId: 1, status: 1 });
teamSchema.index({ leaderId: 1 });
teamSchema.index({ 'members.userId': 1 });
teamSchema.index({ requiredSkills: 1 });
teamSchema.index({ isPublic: 1, isOpen: 1 });
teamSchema.index({ tags: 1 });
teamSchema.index({ featured: -1, createdAt: -1 });

// Virtual fields
teamSchema.virtual('isComplete').get(function() {
  return this.currentSize >= this.maxMembers;
});

teamSchema.virtual('spotsRemaining').get(function() {
  return Math.max(0, this.maxMembers - this.currentSize);
});

teamSchema.virtual('activeMembers').get(function() {
  return this.members.filter(member => member.status === 'active');
});

teamSchema.virtual('leaderInfo', {
  ref: 'User',
  localField: 'leaderId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware
teamSchema.pre('save', function(next) {
  // Update current size based on active members
  this.currentSize = this.members.filter(member => member.status === 'active').length;
  
  // Update team status based on current size
  if (this.currentSize >= this.maxMembers) {
    this.status = this.status === 'forming' ? 'complete' : this.status;
    this.isOpen = false;
  } else if (this.status === 'complete' && this.currentSize < this.maxMembers) {
    this.status = 'forming';
    this.isOpen = true;
  }
  
  // Generate invite code if public and open
  if (this.isPublic && this.isOpen && !this.inviteCode) {
    this.inviteCode = this.generateInviteCode();
  }
  
  // Update last activity
  this.lastActivity = new Date();
  
  next();
});

// Static methods
teamSchema.statics.findOpenTeams = function(hackathonId, limit = 10) {
  return this.find({
    hackathonId,
    isPublic: true,
    isOpen: true,
    status: 'forming'
  })
  .populate('leaderId', 'firstName lastName profilePicture')
  .populate('members.userId', 'firstName lastName profilePicture')
  .sort({ featured: -1, createdAt: -1 })
  .limit(limit);
};

teamSchema.statics.findBySkills = function(hackathonId, skills, limit = 10) {
  return this.find({
    hackathonId,
    isPublic: true,
    isOpen: true,
    status: 'forming',
    'requiredSkills.skill': { $in: skills }
  })
  .populate('leaderId', 'firstName lastName profilePicture')
  .sort({ 'requiredSkills.priority': -1, createdAt: -1 })
  .limit(limit);
};

teamSchema.statics.findFeatured = function(hackathonId, limit = 5) {
  return this.find({
    hackathonId,
    featured: true,
    isPublic: true
  })
  .populate('leaderId', 'firstName lastName profilePicture')
  .populate('members.userId', 'firstName lastName profilePicture')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Instance methods
teamSchema.methods.addMember = function(userId, role = 'developer', skills = []) {
  if (this.currentSize >= this.maxMembers) {
    throw new Error('Team is already full');
  }
  
  const existingMember = this.members.find(
    member => member.userId.toString() === userId.toString() && member.status === 'active'
  );
  
  if (existingMember) {
    throw new Error('User is already a team member');
  }
  
  this.members.push({
    userId,
    role,
    skills,
    joinedAt: new Date(),
    status: 'active'
  });
  
  return this.save();
};

teamSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(
    member => member.userId.toString() === userId.toString() && member.status === 'active'
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not a team member');
  }
  
  if (this.members[memberIndex].userId.toString() === this.leaderId.toString()) {
    throw new Error('Team leader cannot be removed');
  }
  
  this.members[memberIndex].status = 'left';
  return this.save();
};

teamSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(
    member => member.userId.toString() === userId.toString() && member.status === 'active'
  );
  
  if (!member) {
    throw new Error('User is not a team member');
  }
  
  member.role = newRole;
  return this.save();
};

teamSchema.methods.generateInviteCode = function() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

teamSchema.methods.canUserJoin = function(userId) {
  if (!this.isPublic || !this.isOpen) return false;
  if (this.currentSize >= this.maxMembers) return false;
  
  const isMember = this.members.some(
    member => member.userId.toString() === userId.toString() && member.status === 'active'
  );
  
  return !isMember;
};

teamSchema.methods.incrementView = function() {
  return this.updateOne({ $inc: { 'statistics.profileViews': 1 } });
};

teamSchema.methods.incrementJoinRequests = function() {
  return this.updateOne({ $inc: { 'statistics.joinRequests': 1 } });
};

// Post middleware
teamSchema.post('save', function(doc) {
  console.log(`Team ${doc.name} updated - Current size: ${doc.currentSize}/${doc.maxMembers}`);
});

// Text search index
teamSchema.index({
  name: 'text',
  description: 'text',
  'requiredSkills.skill': 'text',
  'projectDetails.idea': 'text',
  tags: 'text'
});

module.exports = mongoose.model('Team', teamSchema);