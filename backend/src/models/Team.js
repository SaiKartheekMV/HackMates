const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['leader', 'developer', 'designer', 'data_scientist', 'product_manager', 'marketing', 'other'],
    default: 'developer'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'left', 'kicked'],
    default: 'active'
  },
  permissions: {
    canInvite: {
      type: Boolean,
      default: false
    },
    canKick: {
      type: Boolean,
      default: false
    },
    canEditTeam: {
      type: Boolean,
      default: false
    }
  },
  contribution: {
    type: String,
    maxlength: 500
  }
});

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
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  tagline: {
    type: String,
    maxlength: [200, 'Tagline cannot exceed 200 characters']
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
  members: [teamMemberSchema],
  requiredSkills: [{
    skill: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    fulfilled: {
      type: Boolean,
      default: false
    }
  }],
  preferredRoles: [{
    role: {
      type: String,
      enum: ['developer', 'designer', 'data_scientist', 'product_manager', 'marketing', 'other'],
      required: true
    },
    count: {
      type: Number,
      min: 1,
      default: 1
    },
    filled: {
      type: Number,
      default: 0
    }
  }],
  teamSize: {
    current: {
      type: Number,
      default: 1
    },
    max: {
      type: Number,
      required: true,
      min: [2, 'Team must allow at least 2 members'],
      max: [10, 'Team cannot exceed 10 members']
    }
  },
  project: {
    name: {
      type: String,
      maxlength: 150
    },
    description: {
      type: String,
      maxlength: 2000
    },
    category: {
      type: String,
      enum: ['web', 'mobile', 'ai_ml', 'blockchain', 'iot', 'ar_vr', 'gaming', 'fintech', 'healthtech', 'edtech', 'other']
    },
    technologies: [String],
    repositoryUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(github\.com|gitlab\.com|bitbucket\.org)/.test(v);
        },
        message: 'Repository URL must be from GitHub, GitLab, or Bitbucket'
      }
    },
    demoUrl: String,
    figmaUrl: String,
    presentationUrl: String,
    status: {
      type: String,
      enum: ['planning', 'development', 'testing', 'completed'],
      default: 'planning'
    }
  },
  communication: {
    primaryChannel: {
      type: String,
      enum: ['discord', 'slack', 'telegram', 'whatsapp', 'teams', 'other'],
      default: 'discord'
    },
    channelLink: String,
    meetingSchedule: String,
    timezone: String
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    allowDirectJoin: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: true
    },
    autoAcceptSkills: [String], // Auto-accept if user has these skills
    visibility: {
      type: String,
      enum: ['public', 'hackathon_only', 'private'],
      default: 'public'
    }
  },
  stats: {
    totalApplications: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    completionScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['forming', 'complete', 'competing', 'finished', 'disbanded'],
    default: 'forming'
  },
  tags: [String],
  location: {
    preference: {
      type: String,
      enum: ['remote', 'hybrid', 'in_person'],
      default: 'remote'
    },
    city: String,
    country: String,
    timezone: String
  },
  achievements: [{
    type: {
      type: String,
      enum: ['winner', 'runner_up', 'special_mention', 'best_design', 'best_tech', 'peoples_choice']
    },
    hackathonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon'
    },
    date: {
      type: Date,
      default: Date.now
    },
    description: String
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
teamSchema.index({ hackathonId: 1, status: 1 });
teamSchema.index({ leaderId: 1 });
teamSchema.index({ 'members.userId': 1 });
teamSchema.index({ requiredSkills: 1 });
teamSchema.index({ tags: 1 });
teamSchema.index({ createdAt: -1 });
teamSchema.index({ 'stats.lastActivity': -1 });

// Virtual for checking if team is full
teamSchema.virtual('isFull').get(function() {
  return this.teamSize.current >= this.teamSize.max;
});

// Virtual for available spots
teamSchema.virtual('availableSpots').get(function() {
  return this.teamSize.max - this.teamSize.current;
});

// Virtual for team completion percentage
teamSchema.virtual('profileCompletion').get(function() {
  let score = 0;
  if (this.name) score += 15;
  if (this.description) score += 15;
  if (this.requiredSkills.length > 0) score += 15;
  if (this.project.name) score += 10;
  if (this.project.description) score += 10;
  if (this.project.technologies.length > 0) score += 10;
  if (this.communication.channelLink) score += 10;
  if (this.tags.length > 0) score += 5;
  if (this.project.repositoryUrl) score += 10;
  return Math.min(score, 100);
});

// Pre-save middleware to update team size and completion score
teamSchema.pre('save', function(next) {
  // Update current team size
  this.teamSize.current = this.members.filter(member => member.status === 'active').length;
  
  // Update team status based on size
  if (this.teamSize.current >= this.teamSize.max) {
    this.status = 'complete';
  } else if (this.status === 'complete' && this.teamSize.current < this.teamSize.max) {
    this.status = 'forming';
  }
  
  // Update completion score
  this.stats.completionScore = this.profileCompletion;
  
  // Update last activity
  this.stats.lastActivity = new Date();
  
  next();
});

// Method to add a member
teamSchema.methods.addMember = function(userId, role = 'developer') {
  if (this.isFull) {
    throw new Error('Team is already full');
  }
  
  const existingMember = this.members.find(member => 
    member.userId.toString() === userId.toString() && member.status === 'active'
  );
  
  if (existingMember) {
    throw new Error('User is already a member of this team');
  }
  
  this.members.push({
    userId,
    role,
    joinedAt: new Date(),
    status: 'active'
  });
  
  // Update role count
  const roleIndex = this.preferredRoles.findIndex(r => r.role === role);
  if (roleIndex !== -1) {
    this.preferredRoles[roleIndex].filled += 1;
  }
  
  return this.save();
};

// Method to remove a member
teamSchema.methods.removeMember = function(userId, reason = 'left') {
  const memberIndex = this.members.findIndex(member => 
    member.userId.toString() === userId.toString() && member.status === 'active'
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not an active member of this team');
  }
  
  if (this.leaderId.toString() === userId.toString()) {
    throw new Error('Team leader cannot be removed. Transfer leadership first.');
  }
  
  const member = this.members[memberIndex];
  member.status = reason;
  
  // Update role count
  const roleIndex = this.preferredRoles.findIndex(r => r.role === member.role);
  if (roleIndex !== -1 && this.preferredRoles[roleIndex].filled > 0) {
    this.preferredRoles[roleIndex].filled -= 1;
  }
  
  return this.save();
};

// Method to transfer leadership
teamSchema.methods.transferLeadership = function(newLeaderId) {
  const newLeader = this.members.find(member => 
    member.userId.toString() === newLeaderId.toString() && member.status === 'active'
  );
  
  if (!newLeader) {
    throw new Error('New leader must be an active team member');
  }
  
  // Update old leader permissions
  const oldLeader = this.members.find(member => 
    member.userId.toString() === this.leaderId.toString()
  );
  if (oldLeader) {
    oldLeader.permissions = {
      canInvite: false,
      canKick: false,
      canEditTeam: false
    };
  }
  
  // Update new leader
  this.leaderId = newLeaderId;
  newLeader.role = 'leader';
  newLeader.permissions = {
    canInvite: true,
    canKick: true,
    canEditTeam: true
  };
  
  return this.save();
};

// Method to check if user can perform action
teamSchema.methods.canUserPerformAction = function(userId, action) {
  if (this.leaderId.toString() === userId.toString()) {
    return true; // Leader can do everything
  }
  
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString() && member.status === 'active'
  );
  
  if (!member) {
    return false;
  }
  
  switch (action) {
    case 'invite':
      return member.permissions.canInvite;
    case 'kick':
      return member.permissions.canKick;
    case 'edit':
      return member.permissions.canEditTeam;
    default:
      return false;
  }
};

// Static method to find teams by hackathon with filters
teamSchema.statics.findByHackathonWithFilters = function(hackathonId, filters = {}) {
  const query = { hackathonId, status: { $ne: 'disbanded' } };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.skills && filters.skills.length > 0) {
    query.requiredSkills = { $in: filters.skills };
  }
  
  if (filters.hasOpenings) {
    query.$expr = { $lt: ['$teamSize.current', '$teamSize.max'] };
  }
  
  if (filters.location) {
    query['location.preference'] = filters.location;
  }
  
  return this.find(query)
    .populate('leaderId', 'firstName lastName profilePicture')
    .populate('members.userId', 'firstName lastName profilePicture')
    .populate('hackathonId', 'title startDate endDate')
    .sort({ 'stats.lastActivity': -1 });
};

module.exports = mongoose.model('Team', teamSchema);