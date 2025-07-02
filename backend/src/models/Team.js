const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  hackathon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hackathon',
    required: true
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['leader', 'member'],
      default: 'member'
    },
    skills: [String] // Skills they bring to the team
  }],
  requiredSkills: [{
    skill: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    }
  }],
  maxMembers: {
    type: Number,
    default: 4,
    min: 2,
    max: 10
  },
  status: {
    type: String,
    enum: ['open', 'full', 'closed'],
    default: 'open'
  },
  tags: [String], // Tech stack, domain, etc.
  lookingFor: {
    type: String,
    maxlength: 300
  },
  contactInfo: {
    discord: String,
    slack: String,
    email: String,
    telegram: String
  },
  projectIdea: {
    title: String,
    description: String,
    techStack: [String],
    githubRepo: String
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  applicationRequired: {
    type: Boolean,
    default: false
  },
  applications: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  achievements: [{
    title: String,
    description: String,
    date: Date
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for current member count
teamSchema.virtual('currentMembers').get(function() {
  return this.members.length;
});

// Virtual for available spots
teamSchema.virtual('availableSpots').get(function() {
  return this.maxMembers - this.members.length;
});

// Virtual to check if team is full
teamSchema.virtual('isFull').get(function() {
  return this.members.length >= this.maxMembers;
});

// Indexes for efficient queries
teamSchema.index({ hackathon: 1, status: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ tags: 1 });
teamSchema.index({ requiredSkills: 1 });

// Pre-save middleware to update status
teamSchema.pre('save', function(next) {
  if (this.members.length >= this.maxMembers) {
    this.status = 'full';
  } else if (this.status === 'full' && this.members.length < this.maxMembers) {
    this.status = 'open';
  }
  next();
});

// Methods
teamSchema.methods.addMember = function(userId, skills = []) {
  if (this.isFull) {
    throw new Error('Team is full');
  }
  
  const isAlreadyMember = this.members.some(member => 
    member.user.toString() === userId.toString()
  );
  
  if (isAlreadyMember) {
    throw new Error('User is already a team member');
  }
  
  this.members.push({
    user: userId,
    skills: skills,
    role: 'member'
  });
  
  return this.save();
};

teamSchema.methods.removeMember = function(userId) {
  if (this.leader.toString() === userId.toString()) {
    throw new Error('Team leader cannot be removed');
  }
  
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
  
  return this.save();
};

teamSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.user.toString() === userId.toString()
  ) || this.leader.toString() === userId.toString();
};

teamSchema.methods.canUserJoin = function(userId) {
  return !this.isFull && !this.isMember(userId) && this.status === 'open';
};

// Static methods
teamSchema.statics.findByHackathon = function(hackathonId, filters = {}) {
  const query = { hackathon: hackathonId };
  
  if (filters.status) query.status = filters.status;
  if (filters.tags) query.tags = { $in: filters.tags };
  if (filters.availableOnly) query.status = 'open';
  
  return this.find(query)
    .populate('leader', 'name email profilePicture skills')
    .populate('members.user', 'name email profilePicture skills')
    .populate('hackathon', 'name startDate endDate')
    .sort({ createdAt: -1 });
};

teamSchema.statics.findUserTeams = function(userId) {
  return this.find({
    $or: [
      { leader: userId },
      { 'members.user': userId }
    ]
  })
  .populate('hackathon', 'name startDate endDate')
  .populate('leader', 'name email profilePicture')
  .populate('members.user', 'name email profilePicture skills');
};


const Team = mongoose.model('Team', teamSchema);

module.exports = Team;