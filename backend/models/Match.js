const matchSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  matchScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  matchDetails: {
    skillsMatch: Number,
    experienceMatch: Number,
    interestsMatch: Number,
    availabilityMatch: Number,
    locationMatch: Number
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'Withdrawn'],
    default: 'Pending'
  },
  message: {
    type: String,
    maxlength: 500
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  requestType: {
    type: String,
    enum: ['TeamInvite', 'DirectMatch', 'TeamJoin'],
    default: 'DirectMatch'
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }
  }
}, {
  timestamps: true
});

// Method to check if match is expired
matchSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to accept match
matchSchema.methods.accept = function() {
  if (this.isExpired()) {
    throw new Error('Match request has expired');
  }
  this.status = 'Accepted';
  return this.save();
};

// Method to reject match
matchSchema.methods.reject = function() {
  this.status = 'Rejected';
  return this.save();
};

// Indexes
matchSchema.index({ requester: 1, status: 1 });
matchSchema.index({ recipient: 1, status: 1 });
matchSchema.index({ event: 1 });
matchSchema.index({ matchScore: -1 });
matchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound indexes
matchSchema.index({ requester: 1, recipient: 1, event: 1 }, { unique: true });

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;