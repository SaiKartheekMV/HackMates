// src/models/Profile.js
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Remove any additional index: true here
  },
  bio: {
    type: String,
    maxlength: 500
  },
  skills: [{
    type: String,
    maxlength: 50
  }],
  experience: [{
    title: {
      type: String,
      required: true
    },
    company: {
      type: String,
      required: true
    },
    duration: String,
    description: String
  }],
  education: [{
    degree: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    year: Number
  }],
  projects: [{
    name: {
      type: String,
      required: true
    },
    description: String,
    technologies: [String],
    githubUrl: String,
    liveUrl: String
  }],
  socialLinks: {
    github: String,
    linkedin: String,
    portfolio: String
  },
  location: {
    city: String,
    country: String
  },
  resumeUrl: String,
  aiEmbedding: [Number],
  completionScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Create index only once - don't use both unique: true and schema.index()
// profileSchema.index({ userId: 1 }); // Remove this line if you have it

module.exports = mongoose.model('Profile', profileSchema);