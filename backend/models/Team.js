const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
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
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Frontend', 'Backend', 'Designer', 'Data Scientist', 'PM', 'Other'],
      default: 'Other'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxMembers: {
    type: Number,
    default: 4,
    min: 2,
    max: 10
  },
  requiredSkills: [String],
  techStack: [String],
  status: {
    type: String,
    enum: ['Forming', 'Complete', 'Applied', 'Participating', 'Completed'],
    default: 'Forming'
  },
  lookingFor: [{
    role: String,
    skills: [String],
    experience: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'All'
    }
  }],
  project: {
    idea: String,
    description: String,
    repository: String,
    demoUrl: String,
    submissionUrl: String
  },
  communication: {
    discord: String,
    slack: String,
    whatsapp: String,
    telegram: String
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtual for current team size
teamSchema.virtual('currentSize').get(function() {
  return this.members.length;
});

// Virtual for available spots
teamSchema.virtual('availableSpots').get(function() {
  return this.maxMembers - this.members.length;
});

// Method to check if user can join team
teamSchema.methods.canUserJoin = function(userId) {
  // Check if team is full
  if (this.members.length >= this.maxMembers) {
    return { canJoin: false, reason: 'Team is full' };
  }
  
  // Check if user is already a member
  const isMember = this.members.some(member => member.user.toString() === userId.toString());
  if (isMember) {
    return { canJoin: false, reason: 'User is already a member' };
  }
  
  // Check if team is still forming
  if (this.status !== 'Forming') {
    return { canJoin: false, reason: 'Team is no longer accepting members' };
  }
  
  return { canJoin: true };
};

// Generate unique invite code
teamSchema.methods.generateInviteCode = function() {
  this.inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return this.save();
};

// Pre-save middleware
teamSchema.pre('save', function(next) {
  // Update status based on team size
  if (this.members.length === this.maxMembers && this.status === 'Forming') {
    this.status = 'Complete';
  }
  next();
});

teamSchema.index({ event: 1, status: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ requiredSkills: 1 });
teamSchema.index({ inviteCode: 1 });

const Team = mongoose.model('Team', teamSchema);
module.exports = Team;