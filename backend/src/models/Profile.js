// src/models/Profile.js
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Basic Info
  bio: {
    type: String,
    maxlength: 1000
  },
  location: {
    type: String,
    maxlength: 100
  },
  yearsOfExperience: {
    type: String,
    enum: ['0-1', '1-3', '3-5', '5+', '']
  },
  
  // Skills
  skills: [{
    type: String,
    maxlength: 50
  }],
  
  // Experience (keeping your existing structure)
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
  
  // Education - Updated to match form structure
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
  // Additional education text field
  additionalEducation: {
    type: String,
    maxlength: 500
  },
  
  // New fields from form
  degree: String,
  university: String,
  graduationYear: Number,
  hackathonExperience: {
    type: String,
    enum: ['none', 'beginner', 'intermediate', 'experienced', '']
  },
  
  // Projects (keeping your existing structure)
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
  
  // Updated social links to match form
  socialLinks: {
    github: String,
    linkedin: String,
    portfolio: String
  },
  
  // Preferences
  preferredRoles: [{
    type: String,
    enum: [
      'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
      'Mobile Developer', 'Data Scientist', 'Machine Learning Engineer',
      'UI/UX Designer', 'Product Manager', 'DevOps Engineer',
      'Cybersecurity Specialist', 'Blockchain Developer', 'Game Developer'
    ]
  }],
  availability: {
    type: String,
    enum: ['full-time', 'part-time', 'flexible', '']
  },
  
  // Resume
  resumeUrl: String,
  resumeData: mongoose.Schema.Types.Mixed, // Store parsed resume data
  
  // AI and scoring
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

module.exports = mongoose.model('Profile', profileSchema);