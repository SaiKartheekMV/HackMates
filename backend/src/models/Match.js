const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  potentialMatches: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    reasons: [String], // Why they matched
    hackathonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hackathon'
    }
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
matchSchema.index({ userId: 1 });
matchSchema.index({ 'potentialMatches.userId': 1 });
matchSchema.index({ 'potentialMatches.hackathonId': 1 });

module.exports = mongoose.model('Match', matchSchema);