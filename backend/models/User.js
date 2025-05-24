const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't include password in queries by default
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: {
    city: String,
    country: String,
    timezone: String
  },
  social: {
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    twitter: { type: String, default: '' }
  },
  skills: [{
    name: { type: String, required: true },
    level: { 
      type: String, 
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Intermediate'
    },
    verified: { type: Boolean, default: false }
  }],
  interests: [String],
  experience: {
    level: {
      type: String,
      enum: ['Student', 'Junior', 'Mid', 'Senior', 'Lead'],
      default: 'Student'
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 50,
      default: 0
    },
    currentRole: {
      type: String,
      default: ''
    },
    company: {
      type: String,
      default: ''
    }
  },
  preferences: {
    teamSize: {
      type: String,
      enum: ['2-3', '3-4', '4-5', '5+'],
      default: '3-4'
    },
    hackathonTypes: [{
      type: String,
      enum: ['Web Development', 'Mobile Apps', 'AI/ML', 'Blockchain', 'IoT', 'Gaming', 'Fintech', 'Healthcare', 'Education', 'Other']
    }],
    availability: {
      weekends: { type: Boolean, default: true },
      weekdays: { type: Boolean, default: false },
      remote: { type: Boolean, default: true },
      inPerson: { type: Boolean, default: true }
    }
  },
  hackathonHistory: [{
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    role: String,
    achievement: String,
    year: Number
  }],
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  profileCompletion: {
    type: Number,
    default: 20, // Base score for just signing up
    min: 0,
    max: 100
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ 'skills.name': 1 });
userSchema.index({ interests: 1 });
userSchema.index({ location: 1 });
userSchema.index({ lastActive: -1 });

// Virtual for full name
userSchema.virtual('fullProfile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    skills: this.skills,
    interests: this.interests,
    location: this.location,
    social: this.social,
    experience: this.experience,
    profileCompletion: this.profileCompletion
  };
});

// Pre-save hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to calculate profile completion
userSchema.methods.calculateProfileCompletion = function() {
  let score = 20; // Base score for registration
  
  if (this.avatar) score += 10;
  if (this.bio && this.bio.length > 20) score += 10;
  if (this.skills && this.skills.length > 0) score += 15;
  if (this.interests && this.interests.length > 0) score += 10;
  if (this.location && this.location.city) score += 10;
  if (this.social.linkedin || this.social.github) score += 10;
  if (this.experience.currentRole) score += 5;
  if (this.preferences.hackathonTypes.length > 0) score += 10;
  
  this.profileCompletion = score;
  return score;
};

// Method to update last active
userSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', userSchema);