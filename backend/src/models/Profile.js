const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  technologies: [{
    type: String,
    trim: true
  }]
}, { _id: true });

const educationSchema = new mongoose.Schema({
  degree: {
    type: String,
    required: [true, 'Degree is required'],
    trim: true,
    maxlength: [100, 'Degree cannot exceed 100 characters']
  },
  institution: {
    type: String,
    required: [true, 'Institution is required'],
    trim: true,
    maxlength: [150, 'Institution name cannot exceed 150 characters']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters']
  },
  fieldOfStudy: {
    type: String,
    trim: true,
    maxlength: [100, 'Field of study cannot exceed 100 characters']
  },
  startYear: {
    type: Number,
    min: [1900, 'Start year must be after 1900'],
    max: [new Date().getFullYear() + 10, 'Start year cannot be more than 10 years in the future']
  },
  endYear: {
    type: Number,
    min: [1900, 'End year must be after 1900'],
    max: [new Date().getFullYear() + 10, 'End year cannot be more than 10 years in the future'],
    validate: {
      validator: function(v) {
        return !v || !this.startYear || v >= this.startYear;
      },
      message: 'End year must be after or equal to start year'
    }
  },
  gpa: {
    type: Number,
    min: [0, 'GPA cannot be negative'],
    max: [10, 'GPA cannot exceed 10']
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  technologies: [{
    type: String,
    required: true,
    trim: true
  }],
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  isOngoing: {
    type: Boolean,
    default: false
  },
  githubUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/(www\.)?github\.com\//.test(v);
      },
      message: 'Please provide a valid GitHub URL'
    }
  },
  liveUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\//.test(v);
      },
      message: 'Please provide a valid URL'
    }
  },
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\//.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  }],
  role: {
    type: String,
    enum: ['individual', 'team-lead', 'team-member'],
    default: 'individual'
  },
  teamSize: {
    type: Number,
    min: [1, 'Team size must be at least 1'],
    max: [50, 'Team size cannot exceed 50'],
    default: 1
  },
  achievements: [{
    type: String,
    maxlength: [200, 'Achievement cannot exceed 200 characters']
  }]
}, { _id: true });

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    trim: true
  },
  headline: {
    type: String,
    maxlength: [120, 'Headline cannot exceed 120 characters'],
    trim: true
  },
  location: {
    city: {
      type: String,
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    state: {
      type: String,
      trim: true,
      maxlength: [50, 'State name cannot exceed 50 characters']
    },
    country: {
      type: String,
      trim: true,
      maxlength: [50, 'Country name cannot exceed 50 characters']
    },
    timezone: {
      type: String,
      trim: true
    }
  },
  skills: {
    technical: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      level: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
      },
      yearsOfExperience: {
        type: Number,
        min: [0, 'Years of experience cannot be negative'],
        max: [50, 'Years of experience cannot exceed 50']
      }
    }],
    soft: [{
      type: String,
      trim: true
    }],
    languages: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      proficiency: {
        type: String,
        enum: ['basic', 'conversational', 'fluent', 'native'],
        default: 'conversational'
      }
    }]
  },
  experience: [experienceSchema],
  education: [educationSchema],
  projects: [projectSchema],
  hackathons: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    organizationName: {
      type: String,
      trim: true
    },
    position: {
      type: String,
      enum: ['winner', 'runner-up', 'participant', 'mentor', 'judge'],
      default: 'participant'
    },
    date: {
      type: Date,
      required: true
    },
    teamSize: {
      type: Number,
      min: 1,
      max: 20
    },
    technologies: [{
      type: String,
      trim: true
    }],
    projectName: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    githubUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(www\.)?github\.com\//.test(v);
        },
        message: 'Please provide a valid GitHub URL'
      }
    },
    certificateUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\//.test(v);
        },
        message: 'Please provide a valid certificate URL'
      }
    }
  }],
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    issuer: {
      type: String,
      required: true,
      trim: true
    },
    issueDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date
    },
    credentialId: {
      type: String,
      trim: true
    },
    credentialUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\//.test(v);
        },
        message: 'Please provide a valid credential URL'
      }
    }
  }],
  socialLinks: {
    github: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(www\.)?github\.com\//.test(v);
        },
        message: 'Please provide a valid GitHub URL'
      }
    },
    linkedin: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(www\.)?linkedin\.com\//.test(v);
        },
        message: 'Please provide a valid LinkedIn URL'
      }
    },
    portfolio: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\//.test(v);
        },
        message: 'Please provide a valid portfolio URL'
      }
    },
    twitter: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(www\.)?twitter\.com\//.test(v);
        },
        message: 'Please provide a valid Twitter URL'
      }
    },
    dribbble: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(www\.)?dribbble\.com\//.test(v);
        },
        message: 'Please provide a valid Dribbble URL'
      }
    },
    behance: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/(www\.)?behance\.net\//.test(v);
        },
        message: 'Please provide a valid Behance URL'
      }
    }
  },
  resumeUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\//.test(v);
      },
      message: 'Please provide a valid resume URL'
    }
  },
  resumeLastUpdated: {
    type: Date
  },
  aiEmbedding: {
    type: [Number],
    default: []
  },
  embeddingLastUpdated: {
    type: Date
  },
  profileViews: {
    type: Number,
    default: 0
  },
  profileViewsLastMonth: {
    type: Number,
    default: 0
  },
  completionScore: {
    type: Number,
    min: [0, 'Completion score cannot be negative'],
    max: [100, 'Completion score cannot exceed 100'],
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isOpenToWork: {
    type: Boolean,
    default: true
  },
  preferredRoles: [{
    type: String,
    enum: [
      'frontend-developer',
      'backend-developer',
      'fullstack-developer',
      'mobile-developer',
      'ai-ml-engineer',
      'data-scientist',
      'ui-ux-designer',
      'product-manager',
      'devops-engineer',
      'blockchain-developer',
      'game-developer',
      'security-engineer',
      'qa-engineer',
      'technical-writer',
      'business-analyst'
    ]
  }],
  availability: {
    type: String,
    enum: ['full-time', 'part-time', 'freelance', 'internship', 'not-available'],
    default: 'full-time'
  },
  expectedSalary: {
    min: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative']
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD'],
      default: 'USD'
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
profileSchema.index({ userId: 1 }, { unique: true });
profileSchema.index({ 'skills.technical.name': 1 });
profileSchema.index({ 'location.city': 1, 'location.country': 1 });
profileSchema.index({ preferredRoles: 1 });
profileSchema.index({ isPublic: 1, isOpenToWork: 1 });
profileSchema.index({ completionScore: -1 });
profileSchema.index({ lastActive: -1 });
profileSchema.index({ createdAt: -1 });

// Virtual for years of experience
profileSchema.virtual('totalExperience').get(function() {
  if (!this.experience || this.experience.length === 0) return 0;
  
  let totalMonths = 0;
  this.experience.forEach(exp => {
    const endDate = exp.endDate || new Date();
    const startDate = exp.startDate;
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                   (endDate.getMonth() - startDate.getMonth());
    totalMonths += Math.max(0, months);
  });
  
  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
});

// Virtual for skill summary
profileSchema.virtual('skillSummary').get(function() {
  const technical = this.skills.technical || [];
  const byLevel = technical.reduce((acc, skill) => {
    acc[skill.level] = (acc[skill.level] || 0) + 1;
    return acc;
  }, {});
  
  return {
    total: technical.length,
    byLevel,
    topSkills: technical
      .sort((a, b) => (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0))
      .slice(0, 5)
      .map(s => s.name)
  };
});

// Pre-save middleware to calculate completion score
profileSchema.pre('save', function(next) {
  this.completionScore = this.calculateCompletionScore();
  next();
});

// Method to calculate profile completion score
profileSchema.methods.calculateCompletionScore = function() {
  let score = 0;
  const weights = {
    bio: 5,
    headline: 5,
    location: 5,
    skills: 15,
    experience: 20,
    education: 15,
    projects: 20,
    socialLinks: 10,
    resumeUrl: 5
  };
  
  // Bio
  if (this.bio && this.bio.trim().length > 20) score += weights.bio;
  
  // Headline
  if (this.headline && this.headline.trim().length > 10) score += weights.headline;
  
  // Location
  if (this.location && this.location.city && this.location.country) {
    score += weights.location;
  }
  
  // Skills
  if (this.skills.technical && this.skills.technical.length >= 3) {
    score += weights.skills;
  }
  
  // Experience
  if (this.experience && this.experience.length > 0) {
    score += weights.experience;
  }
  
  // Education
  if (this.education && this.education.length > 0) {
    score += weights.education;
  }
  
  // Projects
  if (this.projects && this.projects.length >= 2) {
    score += weights.projects;
  }
  
  // Social Links
  let socialLinksCount = 0;
  if (this.socialLinks) {
    Object.values(this.socialLinks).forEach(link => {
      if (link && link.trim()) socialLinksCount++;
    });
  }
  if (socialLinksCount >= 2) score += weights.socialLinks;
  
  // Resume
  if (this.resumeUrl) score += weights.resumeUrl;
  
  return Math.min(100, score);
};

// Method to update AI embedding
profileSchema.methods.updateEmbedding = async function(embedding) {
  this.aiEmbedding = embedding;
  this.embeddingLastUpdated = new Date();
  return this.save();
};

// Method to increment profile views
profileSchema.methods.incrementViews = async function() {
  this.profileViews += 1;
  this.profileViewsLastMonth += 1;
  return this.save();
};

// Static method to reset monthly views
profileSchema.statics.resetMonthlyViews = async function() {
  return this.updateMany({}, { $set: { profileViewsLastMonth: 0 } });
};

// Static method to find profiles by skills
profileSchema.statics.findBySkills = function(skills, limit = 10) {
  return this.find({
    'skills.technical.name': { $in: skills },
    isPublic: true,
    isOpenToWork: true
  })
  .populate('userId', 'firstName lastName profilePicture')
  .sort({ completionScore: -1, lastActive: -1 })
  .limit(limit);
};

// Static method to find profiles by location
profileSchema.statics.findByLocation = function(city, country, limit = 10) {
  const query = { isPublic: true, isOpenToWork: true };
  
  if (city) query['location.city'] = new RegExp(city, 'i');
  if (country) query['location.country'] = country;
  
  return this.find(query)
    .populate('userId', 'firstName lastName profilePicture')
    .sort({ completionScore: -1, lastActive: -1 })
    .limit(limit);
};

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;