const mongoose = require('mongoose');
const crypto = require('crypto');

const teamSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [100, 'Team name cannot exceed 100 characters'],
    minlength: [3, 'Team name must be at least 3 characters'],
    unique: true
  },
  
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  
  description: {
    type: String,
    required: [true, 'Team description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  motto: {
    type: String,
    trim: true,
    maxlength: [200, 'Team motto cannot exceed 200 characters']
  },
  
  logo: {
    url: String,
    publicId: String // For Cloudinary or similar services
  },
  
  coverImage: {
    url: String,
    publicId: String
  },
  
  // Hackathon Association
  hackathonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hackathon',
    required: [true, 'Hackathon ID is required'],
    index: true
  },
  
  // Leadership
  leaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Team leader is required'],
    index: true
  },
  
  coLeaders: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    permissions: [{
      type: String,
      enum: ['manage_members', 'edit_project', 'manage_communications', 'submit_project', 'view_analytics']
    }]
  }],
  
  // Team Members
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['leader', 'co_leader', 'frontend_dev', 'backend_dev', 'fullstack_dev', 'mobile_dev', 'ui_designer', 'ux_designer', 'data_scientist', 'ml_engineer', 'devops', 'qa_tester', 'pm', 'product_owner', 'business_analyst', 'marketer', 'content_creator', 'researcher', 'mentor', 'other'],
      default: 'other'
    },
    skills: [{
      name: String,
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
      },
      verified: {
        type: Boolean,
        default: false
      }
    }],
    specialization: String,
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'left', 'removed', 'banned'],
      default: 'active'
    },
    contribution: {
      description: {
        type: String,
        maxlength: [500, 'Contribution description cannot exceed 500 characters']
      },
      hours: {
        type: Number,
        default: 0,
        min: 0
      },
      commits: {
        type: Number,
        default: 0,
        min: 0
      },
      tasksCompleted: {
        type: Number,
        default: 0,
        min: 0
      }
    },
    availability: {
      hoursPerWeek: {
        type: Number,
        min: 1,
        max: 168
      },
      timezone: String,
      schedule: [{
        day: {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        },
        startTime: String, // Format: "HH:MM"
        endTime: String
      }]
    },
    performance: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 3
      },
      feedback: [String],
      warnings: [{
        reason: String,
        date: {
          type: Date,
          default: Date.now
        },
        issuedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }]
    }
  }],
  
  // Team Requirements & Recruitment
  requiredSkills: [{
    skill: {
      type: String,
      required: true,
      trim: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    count: {
      type: Number,
      default: 1,
      min: 1
    },
    fulfilled: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  
  lookingFor: {
    roles: [{
      role: {
        type: String,
        enum: ['frontend_dev', 'backend_dev', 'fullstack_dev', 'mobile_dev', 'ui_designer', 'ux_designer', 'data_scientist', 'ml_engineer', 'devops', 'qa_tester', 'pm', 'product_owner', 'business_analyst', 'marketer', 'content_creator', 'researcher', 'other']
      },
      count: {
        type: Number,
        min: 1,
        default: 1
      },
      description: String,
      requirements: [String],
      urgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      }
    }],
    description: String,
    applicationDeadline: Date
  },
  
  // Team Configuration
  maxMembers: {
    type: Number,
    required: [true, 'Maximum members count is required'],
    min: [2, 'Team must have at least 2 members'],
    max: [15, 'Team cannot exceed 15 members']
  },
  
  currentSize: {
    type: Number,
    default: 1
  },
  
  minMembers: {
    type: Number,
    default: 2,
    min: 2
  },
  
  // Team Settings
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite_only'],
    default: 'public'
  },
  
  joinMethod: {
    type: String,
    enum: ['open', 'application', 'invite_only'],
    default: 'open'
  },
  
  isOpen: {
    type: Boolean,
    default: true
  },
  
  autoAccept: {
    type: Boolean,
    default: false
  },
  
  requiresApproval: {
    type: Boolean,
    default: true
  },
  
  // Team Status
  status: {
    type: String,
    enum: ['forming', 'recruiting', 'complete', 'developing', 'testing', 'submitted', 'judging', 'finished', 'disbanded', 'disqualified'],
    default: 'forming'
  },
  
  phase: {
    type: String,
    enum: ['planning', 'development', 'testing', 'deployment', 'presentation', 'completed'],
    default: 'planning'
  },
  
  // Project Information
  projectDetails: {
    idea: {
      type: String,
      maxlength: [3000, 'Project idea cannot exceed 3000 characters']
    },
    problem: {
      type: String,
      maxlength: [1500, 'Problem statement cannot exceed 1500 characters']
    },
    solution: {
      type: String,
      maxlength: [2000, 'Solution description cannot exceed 2000 characters']
    },
    targetAudience: String,
    uniqueValue: String,
    technologies: [{
      name: String,
      category: {
        type: String,
        enum: ['frontend', 'backend', 'database', 'mobile', 'ai_ml', 'blockchain', 'cloud', 'devops', 'design', 'other']
      },
      version: String
    }],
    techStack: {
      frontend: [String],
      backend: [String],
      database: [String],
      mobile: [String],
      cloud: [String],
      other: [String]
    },
    repositories: [{
      name: String,
      url: String,
      type: {
        type: String,
        enum: ['main', 'frontend', 'backend', 'mobile', 'documentation', 'other'],
        default: 'main'
      },
      isPrivate: {
        type: Boolean,
        default: false
      }
    }],
    liveUrl: String,
    demoUrl: String,
    documentationUrl: String,
    pitch: {
      videoUrl: String,
      presentationUrl: String,
      description: String
    },
    features: [String],
    roadmap: [{
      phase: String,
      description: String,
      deadline: Date,
      status: {
        type: String,
        enum: ['planned', 'in_progress', 'completed', 'delayed', 'cancelled'],
        default: 'planned'
      }
    }],
    challenges: [String],
    learnings: [String]
  },
  
  // Communication & Collaboration
  communication: {
    discord: {
      serverId: String,
      channelId: String,
      inviteUrl: String
    },
    slack: {
      workspaceUrl: String,
      channelName: String
    },
    whatsapp: String,
    telegram: String,
    email: String,
    teams: String,
    zoom: String,
    meet: String,
    preferredMethod: {
      type: String,
      enum: ['discord', 'slack', 'whatsapp', 'telegram', 'email', 'teams', 'zoom', 'meet'],
      default: 'discord'
    },
    meetingSchedule: [{
      type: {
        type: String,
        enum: ['standup', 'planning', 'review', 'retrospective', 'demo', 'other']
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly', 'as_needed']
      },
      day: String,
      time: String,
      duration: Number, // in minutes
      timezone: String
    }]
  },
  
  // Team Preferences & Culture
  preferences: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    workingStyle: {
      type: String,
      enum: ['collaborative', 'independent', 'hybrid', 'pair_programming', 'mob_programming'],
      default: 'collaborative'
    },
    meetingFrequency: {
      type: String,
      enum: ['daily', 'every_other_day', 'weekly', 'biweekly', 'as_needed'],
      default: 'as_needed'
    },
    communicationStyle: {
      type: String,
      enum: ['formal', 'casual', 'mixed'],
      default: 'casual'
    },
    decisionMaking: {
      type: String,
      enum: ['leader_decides', 'democratic', 'consensus', 'expertise_based'],
      default: 'democratic'
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'mixed'],
      default: 'mixed'
    },
    codeReview: {
      required: {
        type: Boolean,
        default: true
      },
      minReviewers: {
        type: Number,
        default: 1,
        min: 1
      }
    },
    methodology: {
      type: String,
      enum: ['agile', 'scrum', 'kanban', 'waterfall', 'lean', 'custom'],
      default: 'agile'
    }
  },
  
  // Invitations & Access Control
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  
  inviteLinks: [{
    code: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    expiresAt: Date,
    maxUses: {
      type: Number,
      default: 1
    },
    currentUses: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // Applications & Requests
  applications: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String,
    message: String,
    skills: [String],
    portfolio: String,
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    feedback: String
  }],
  
  // Achievements & Recognition
  achievements: [{
    type: {
      type: String,
      enum: ['winner', 'runner_up', 'finalist', 'special_mention', 'best_innovation', 'best_design', 'best_technical', 'peoples_choice', 'completed', 'outstanding_teamwork'],
      required: true
    },
    title: String,
    description: String,
    hackathon: String,
    date: {
      type: Date,
      default: Date.now
    },
    prize: String,
    certificate: String
  }],
  
  awards: [{
    name: String,
    category: String,
    rank: Number,
    prize: String,
    awardedBy: String,
    date: Date
  }],
  
  // Analytics & Statistics
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
    },
    applicationsAccepted: {
      type: Number,
      default: 0
    },
    totalCommits: {
      type: Number,
      default: 0
    },
    linesOfCode: {
      type: Number,
      default: 0
    },
    meetingsHeld: {
      type: Number,
      default: 0
    },
    tasksCompleted: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  
  // Social & Discovery
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  categories: [{
    type: String,
    enum: ['web', 'mobile', 'ai_ml', 'blockchain', 'iot', 'fintech', 'healthtech', 'edtech', 'social_impact', 'gaming', 'ar_vr', 'sustainability', 'security', 'other']
  }],
  
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  trending: {
    type: Boolean,
    default: false
  },
  
  // Activity Tracking
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  activityLog: [{
    action: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
  }],
  
  // Reviews & Feedback
  reviews: [{
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    categories: {
      teamwork: Number,
      communication: Number,
      technical: Number,
      leadership: Number,
      innovation: Number
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Integrations
  integrations: {
    github: {
      connected: {
        type: Boolean,
        default: false
      },
      orgName: String,
      repoNames: [String],
      webhookUrl: String
    },
    jira: {
      connected: {
        type: Boolean,
        default: false
      },
      projectKey: String,
      apiUrl: String
    },
    figma: {
      connected: {
        type: Boolean,
        default: false
      },
      fileId: String,
      projectUrl: String
    },
    notion: {
      connected: {
        type: Boolean,
        default: false
      },
      workspaceId: String,
      pageUrl: String
    }
  },
  
  // Team Health & Metrics
  health: {
    score: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    lastCalculated: {
      type: Date,
      default: Date.now
    },
    factors: {
      activity: Number,
      collaboration: Number,
      progress: Number,
      communication: Number
    }
  },
  
  // Notifications & Alerts
  notifications: {
    newMember: {
      type: Boolean,
      default: true
    },
    memberLeft: {
      type: Boolean,
      default: true
    },
    newApplication: {
      type: Boolean,
      default: true
    },
    deadlineReminder: {
      type: Boolean,
      default: true
    },
    activitySummary: {
      type: Boolean,
      default: false
    }
  },
  
  // Backup & Recovery
  backup: {
    lastBackup: Date,
    backupUrl: String,
    autoBackup: {
      type: Boolean,
      default: false
    }
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

// Indexes for Performance
teamSchema.index({ hackathonId: 1, status: 1 });
teamSchema.index({ leaderId: 1 });
teamSchema.index({ 'members.userId': 1 });
teamSchema.index({ 'requiredSkills.skill': 1 });
teamSchema.index({ visibility: 1, isOpen: 1 });
teamSchema.index({ tags: 1 });
teamSchema.index({ categories: 1 });
teamSchema.index({ featured: -1, trending: -1, createdAt: -1 });
teamSchema.index({ 'statistics.profileViews': -1 });
teamSchema.index({ slug: 1 });
teamSchema.index({ inviteCode: 1 });
teamSchema.index({ lastActivity: -1 });

// Compound Indexes
teamSchema.index({ hackathonId: 1, visibility: 1, status: 1 });
teamSchema.index({ hackathonId: 1, categories: 1, difficulty: 1 });
teamSchema.index({ 'requiredSkills.skill': 1, 'requiredSkills.priority': -1 });

// Text Search Index
teamSchema.index({
  name: 'text',
  description: 'text',
  motto: 'text',
  'requiredSkills.skill': 'text',
  'projectDetails.idea': 'text',
  'projectDetails.problem': 'text',
  'projectDetails.solution': 'text',
  tags: 'text'
}, {
  weights: {
    name: 10,
    description: 5,
    'projectDetails.idea': 3,
    tags: 2
  }
});

// Virtual Fields
teamSchema.virtual('isComplete').get(function() {
  return this.currentSize >= this.maxMembers;
});

teamSchema.virtual('spotsRemaining').get(function() {
  return Math.max(0, this.maxMembers - this.currentSize);
});

teamSchema.virtual('activeMembers').get(function() {
  return this.members.filter(member => member.status === 'active');
});

teamSchema.virtual('completionPercentage').get(function() {
  return Math.round((this.currentSize / this.maxMembers) * 100);
});

teamSchema.virtual('avgMemberRating').get(function() {
  const activeMembers = this.members.filter(m => m.status === 'active');
  if (activeMembers.length === 0) return 0;
  const totalRating = activeMembers.reduce((sum, m) => sum + (m.performance.rating || 0), 0);
  return Math.round((totalRating / activeMembers.length) * 10) / 10;
});

teamSchema.virtual('skillsAvailable').get(function() {
  const skills = new Set();
  this.members.forEach(member => {
    if (member.status === 'active') {
      member.skills.forEach(skill => skills.add(skill.name));
    }
  });
  return Array.from(skills);
});

teamSchema.virtual('url').get(function() {
  return `/teams/${this.slug || this._id}`;
});

// Population virtuals
teamSchema.virtual('leaderInfo', {
  ref: 'User',
  localField: 'leaderId',
  foreignField: '_id',
  justOne: true
});

teamSchema.virtual('hackathonInfo', {
  ref: 'Hackathon',
  localField: 'hackathonId',
  foreignField: '_id',
  justOne: true
});

// Pre-save Middleware
teamSchema.pre('save', async function(next) {
  try {
    // Generate slug from name if not exists
    if (!this.slug && this.name) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      
      // Ensure slug uniqueness
      let counter = 1;
      let originalSlug = this.slug;
      while (await this.constructor.findOne({ slug: this.slug, _id: { $ne: this._id } })) {
        this.slug = `${originalSlug}-${counter}`;
        counter++;
      }
    }
    
    // Update current size based on active members
    this.currentSize = this.members.filter(member => member.status === 'active').length;
    
    // Update team status based on current size and phase
    if (this.currentSize >= this.maxMembers && this.status === 'forming') {
      this.status = 'complete';
      this.isOpen = false;
    } else if (this.status === 'complete' && this.currentSize < this.maxMembers) {
      this.status = 'recruiting';
      this.isOpen = true;
    }
    
    // Generate invite code if needed
    if (this.visibility === 'public' && this.isOpen && !this.inviteCode) {
      this.inviteCode = this.generateInviteCode();
    }
    
    // Update fulfilled requirements
    this.requiredSkills.forEach(req => {
      const membersWithSkill = this.members.filter(member => 
        member.status === 'active' && 
        member.skills.some(skill => 
          skill.name.toLowerCase() === req.skill.toLowerCase()
        )
      ).length;
      req.fulfilled = Math.min(membersWithSkill, req.count);
    });
    
    // Calculate team health score
    this.calculateHealthScore();
    
    // Update last activity
    this.lastActivity = new Date();
    
    next();
  } catch (error) {
    next(error);
  }
});

// Static Methods
teamSchema.statics.findOpenTeams = function(hackathonId, filters = {}, limit = 10) {
  const query = {
    hackathonId,
    visibility: 'public',
    isOpen: true,
    status: { $in: ['forming', 'recruiting'] },
    ...filters
  };
  
  return this.find(query)
    .populate('leaderId', 'firstName lastName username profilePicture skills')
    .populate('members.userId', 'firstName lastName username profilePicture')
    .sort({ featured: -1, trending: -1, 'statistics.profileViews': -1, createdAt: -1 })
    .limit(limit);
};

teamSchema.statics.findBySkills = function(hackathonId, skills, limit = 10) {
  return this.find({
    hackathonId,
    visibility: 'public',
    isOpen: true,
    status: { $in: ['forming', 'recruiting'] },
    'requiredSkills.skill': { $in: skills.map(s => new RegExp(s, 'i')) }
  })
  .populate('leaderId', 'firstName lastName username profilePicture')
  .sort({ 'requiredSkills.priority': -1, featured: -1, createdAt: -1 })
  .limit(limit);
};

teamSchema.statics.findFeatured = function(hackathonId, limit = 5) {
  return this.find({
    hackathonId,
    featured: true,
    visibility: 'public'
  })
  .populate('leaderId', 'firstName lastName username profilePicture')
  .populate('members.userId', 'firstName lastName username profilePicture')
  .sort({ createdAt: -1 })
  .limit(limit);
};

teamSchema.statics.searchTeams = function(hackathonId, searchTerm, filters = {}, limit = 20) {
  const query = {
    hackathonId,
    visibility: 'public',
    ...filters
  };
  
  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }
  
  return this.find(query)
    .populate('leaderId', 'firstName lastName username profilePicture')
    .sort(searchTerm ? { score: { $meta: 'textScore' } } : { featured: -1, createdAt: -1 })
    .limit(limit);
};

teamSchema.statics.getTeamStats = function(hackathonId) {
  return this.aggregate([
    { $match: { hackathonId: mongoose.Types.ObjectId(hackathonId) } },
    {
      $group: {
        _id: null,
        totalTeams: { $sum: 1 },
        completedTeams: { $sum: { $cond: [{ $gte: ['$currentSize', '$maxMembers'] }, 1, 0] } },
        openTeams: { $sum: { $cond: ['$isOpen', 1, 0] } },
        avgTeamSize: { $avg: '$currentSize' },
        totalMembers: { $sum: '$currentSize' }
      }
    }
  ]);
};

// Instance Methods
teamSchema.methods.addMember = async function(userId, role = 'other', skills = [], options = {}) {
  if (this.currentSize >= this.maxMembers) {
    throw new Error('Team is already full');
  }
  
  const existingMember = this.members.find(
    member => member.userId.toString() === userId.toString() && 
              ['active', 'inactive'].includes(member.status)
  );
  
  if (existingMember) {
    if (existingMember.status === 'inactive') {
      existingMember.status = 'active';
      existingMember.joinedAt = new Date();
      return this.save();
    }
    throw new Error('User is already a team member');
  }
  
  const memberData = {
    userId,
    role,
    skills: skills.map(skill => typeof skill === 'string' ? { name: skill } : skill),
    joinedAt: new Date(),
    status: 'active',
    ...options
  };
  
  this.members.push(memberData);
  this.logActivity('member_added', userId, { role, memberCount: this.currentSize + 1 });
  
  return this.save();
};

teamSchema.methods.removeMember = async function(userId, reason = 'left') {
  const memberIndex = this.members.findIndex(
    member => member.userId.toString() === userId.toString() && 
              member.status === 'active'
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not an active team member');
  }
  
  if (this.members[memberIndex].userId.toString() === this.leaderId.toString()) {
    throw new Error('Team leader cannot be removed. Transfer leadership first.');
  }
  
  this.members[memberIndex].status = reason === 'removed' ? 'removed' : 'left';
  this.logActivity('member_removed', userId, { reason, memberCount: this.currentSize - 1 });
  
  return this.save();
};

teamSchema.methods.updateMemberRole = async function(userId, newRole, updatedBy) {
  const member = this.members.find(
    member => member.userId.toString() === userId.toString() && 
              member.status === 'active'
  );
  
  if (!member) {
    throw new Error('User is not an active team member');
  }
  
  const oldRole = member.role;
  member.role = newRole;
  
  this.logActivity('role_updated', updatedBy, { 
    targetUser: userId, 
    oldRole, 
    newRole 
  });
  
  return this.save();
};

teamSchema.methods.transferLeadership = async function(newLeaderId, currentLeaderId) {
  if (this.leaderId.toString() !== currentLeaderId.toString()) {
    throw new Error('Only current leader can transfer leadership');
  }
  
  const newLeader = this.members.find(
    member => member.userId.toString() === newLeaderId.toString() && 
              member.status === 'active'
  );
  
  if (!newLeader) {
    throw new Error('New leader must be an active team member');
  }
  
  // Update roles
  const oldLeader = this.members.find(
    member => member.userId.toString() === currentLeaderId.toString()
  );
  if (oldLeader) {
    oldLeader.role = 'other';
  }
  
  newLeader.role = 'leader';
  this.leaderId = newLeaderId;
  
  this.logActivity('leadership_transferred', currentLeaderId, {
    newLeader: newLeaderId,
    oldLeader: currentLeaderId
  });
  
  return this.save();
};

teamSchema.methods.addCoLeader = async function(userId, permissions = [], assignedBy) {
  const member = this.members.find(
    member => member.userId.toString() === userId.toString() && 
              member.status === 'active'
  );
  
  if (!member) {
    throw new Error('User must be an active team member');
  }
  
  const existingCoLeader = this.coLeaders.find(
    coLeader => coLeader.userId.toString() === userId.toString()
  );
  
  if (existingCoLeader) {
    throw new Error('User is already a co-leader');
  }
  
  this.coLeaders.push({
    userId,
    permissions,
    assignedAt: new Date()
  });
  
  member.role = 'co_leader';
  
  this.logActivity('co_leader_added', assignedBy, { coLeader: userId, permissions });
  
  return this.save();
};

teamSchema.methods.submitApplication = async function(applicationData) {
  const existingApplication = this.applications.find(
    app => app.userId.toString() === applicationData.userId.toString() && 
           app.status === 'pending'
  );
  
  if (existingApplication) {
    throw new Error('User already has a pending application');
  }
  
  if (this.currentSize >= this.maxMembers) {
    throw new Error('Team is full');
  }
  
  this.applications.push({
    ...applicationData,
    appliedAt: new Date(),
    status: 'pending'
  });
  
  this.statistics.applicationsReceived++;
  this.logActivity('application_received', applicationData.userId, { role: applicationData.role });
  
  return this.save();
};

teamSchema.methods.reviewApplication = async function(applicationId, decision, reviewerId, feedback = '') {
  const application = this.applications.id(applicationId);
  
  if (!application) {
    throw new Error('Application not found');
  }
  
  if (application.status !== 'pending') {
    throw new Error('Application has already been reviewed');
  }
  
  application.status = decision;
  application.reviewedBy = reviewerId;
  application.reviewedAt = new Date();
  application.feedback = feedback;
  
  if (decision === 'accepted') {
    this.statistics.applicationsAccepted++;
    await this.addMember(
      application.userId, 
      application.role, 
      application.skills
    );
  }
  
  this.logActivity('application_reviewed', reviewerId, {
    applicant: application.userId,
    decision,
    role: application.role
  });
  
  return this.save();
};

teamSchema.methods.generateInviteLink = function(createdBy, maxUses = 1, expiresIn = 24) {
  const code = crypto.randomBytes(16).toString('hex');
  const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000);
  
  this.inviteLinks.push({
    code,
    createdBy,
    expiresAt,
    maxUses,
    currentUses: 0,
    isActive: true
  });
  
  return code;
};

teamSchema.methods.useInviteLink = async function(code, userId) {
  const invite = this.inviteLinks.find(
    inv => inv.code === code && inv.isActive && inv.expiresAt > new Date()
  );
  
  if (!invite) {
    throw new Error('Invalid or expired invite link');
  }
  
  if (invite.currentUses >= invite.maxUses) {
    throw new Error('Invite link has reached maximum uses');
  }
  
  invite.currentUses++;
  if (invite.currentUses >= invite.maxUses) {
    invite.isActive = false;
  }
  
  await this.addMember(userId);
  this.logActivity('joined_via_invite', userId, { inviteCode: code });
  
  return this.save();
};

teamSchema.methods.generateInviteCode = function() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

teamSchema.methods.canUserJoin = function(userId) {
  if (this.visibility === 'private') return false;
  if (!this.isOpen) return false;
  if (this.currentSize >= this.maxMembers) return false;
  
  const isMember = this.members.some(
    member => member.userId.toString() === userId.toString() && 
              ['active', 'inactive'].includes(member.status)
  );
  
  return !isMember;
};

teamSchema.methods.hasPermission = function(userId, permission) {
  if (this.leaderId.toString() === userId.toString()) return true;
  
  const coLeader = this.coLeaders.find(
    cl => cl.userId.toString() === userId.toString()
  );
  
  return coLeader && coLeader.permissions.includes(permission);
};

teamSchema.methods.updateProject = function(projectData, updatedBy) {
  Object.assign(this.projectDetails, projectData);
  this.logActivity('project_updated', updatedBy, { fields: Object.keys(projectData) });
  return this.save();
};

teamSchema.methods.addAchievement = function(achievementData) {
  this.achievements.push({
    ...achievementData,
    date: achievementData.date || new Date()
  });
  
  this.logActivity('achievement_added', null, { achievement: achievementData.type });
  return this.save();
};

teamSchema.methods.logActivity = function(action, userId, details = {}) {
  this.activityLog.push({
    action,
    userId,
    timestamp: new Date(),
    details
  });
  
  // Keep only last 100 activities
  if (this.activityLog.length > 100) {
    this.activityLog = this.activityLog.slice(-100);
  }
};

teamSchema.methods.calculateHealthScore = function() {
  let score = 100;
  const now = new Date();
  const daysSinceLastActivity = (now - this.lastActivity) / (1000 * 60 * 60 * 24);
  
  // Activity factor (0-25 points)
  let activityScore = Math.max(0, 25 - (daysSinceLastActivity * 2));
  
  // Collaboration factor (0-25 points)
  const recentActivities = this.activityLog.filter(
    log => (now - log.timestamp) < (7 * 24 * 60 * 60 * 1000)
  ).length;
  let collaborationScore = Math.min(25, recentActivities * 2);
  
  // Progress factor (0-25 points)
  const completedRoadmapItems = this.projectDetails.roadmap?.filter(
    item => item.status === 'completed'
  ).length || 0;
  const totalRoadmapItems = this.projectDetails.roadmap?.length || 1;
  let progressScore = (completedRoadmapItems / totalRoadmapItems) * 25;
  
  // Communication factor (0-25 points)
  const hasActiveComm = Object.values(this.communication).some(v => v && v !== '');
  let communicationScore = hasActiveComm ? 25 : 10;
  
  this.health = {
    score: Math.round(activityScore + collaborationScore + progressScore + communicationScore),
    lastCalculated: now,
    factors: {
      activity: Math.round(activityScore),
      collaboration: Math.round(collaborationScore),
      progress: Math.round(progressScore),
      communication: Math.round(communicationScore)
    }
  };
};

teamSchema.methods.incrementView = function() {
  return this.updateOne({ 
    $inc: { 'statistics.profileViews': 1 },
    $set: { lastActivity: new Date() }
  });
};

teamSchema.methods.incrementJoinRequests = function() {
  return this.updateOne({ $inc: { 'statistics.joinRequests': 1 } });
};

teamSchema.methods.addReview = function(reviewData) {
  this.reviews.push({
    ...reviewData,
    date: new Date()
  });
  
  // Recalculate average rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.statistics.averageRating = totalRating / this.reviews.length;
  
  return this.save();
};

teamSchema.methods.createBackup = async function() {
  const backupData = this.toObject();
  // In a real implementation, you would save this to cloud storage
  this.backup.lastBackup = new Date();
  return this.save();
};

teamSchema.methods.getRecommendedTeams = function(limit = 5) {
  const skills = this.skillsAvailable;
  const categories = this.categories;
  
  return this.constructor.find({
    _id: { $ne: this._id },
    hackathonId: this.hackathonId,
    visibility: 'public',
    $or: [
      { 'requiredSkills.skill': { $in: skills } },
      { categories: { $in: categories } },
      { tags: { $in: this.tags } }
    ]
  })
  .populate('leaderId', 'firstName lastName username profilePicture')
  .sort({ 'statistics.profileViews': -1, featured: -1 })
  .limit(limit);
};

teamSchema.methods.getSimilarTeams = function(limit = 5) {
  return this.constructor.find({
    _id: { $ne: this._id },
    hackathonId: this.hackathonId,
    visibility: 'public',
    categories: { $in: this.categories },
    difficulty: this.difficulty
  })
  .populate('leaderId', 'firstName lastName username profilePicture')
  .sort({ 'statistics.profileViews': -1 })
  .limit(limit);
};

// Post-save middleware
teamSchema.post('save', function(doc) {
  console.log(`Team "${doc.name}" updated - Status: ${doc.status}, Size: ${doc.currentSize}/${doc.maxMembers}, Health: ${doc.health.score}%`);
});

// Post-remove middleware
teamSchema.post('remove', function(doc) {
  console.log(`Team "${doc.name}" has been deleted`);
});

// Query helpers
teamSchema.query.byHackathon = function(hackathonId) {
  return this.where({ hackathonId });
};

teamSchema.query.isOpen = function() {
  return this.where({ isOpen: true, visibility: 'public' });
};

teamSchema.query.hasSkill = function(skill) {
  return this.where({ 'requiredSkills.skill': new RegExp(skill, 'i') });
};

teamSchema.query.inCategories = function(categories) {
  return this.where({ categories: { $in: categories } });
};

teamSchema.query.featured = function() {
  return this.where({ featured: true });
};

teamSchema.query.withLeader = function() {
  return this.populate('leaderId', 'firstName lastName username profilePicture skills');
};

teamSchema.query.withMembers = function() {
  return this.populate('members.userId', 'firstName lastName username profilePicture skills');
};

teamSchema.query.withHackathon = function() {
  return this.populate('hackathonId', 'name startDate endDate status');
};

// Export the model
module.exports = mongoose.model('Team', teamSchema);