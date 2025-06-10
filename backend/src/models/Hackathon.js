const mongoose = require('mongoose');

const hackathonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Hackathon title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Hackathon description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },
  
  organizer: {
    name: {
      type: String,
      required: [true, 'Organizer name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    logo: {
      type: String, // Cloudinary URL
    },
    website: {
      type: String,
      trim: true
    }
  },
  
  dates: {
    startDate: {
      type: Date,
      required: [true, 'Start date is required']
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required']
    },
    registrationStart: {
      type: Date,
      default: Date.now
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required']
    },
    submissionDeadline: {
      type: Date
    },
    resultsDate: {
      type: Date
    }
  },
  
  location: {
    type: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      required: [true, 'Location type is required']
    },
    venue: {
      name: String,
      address: String,
      city: String,
      state: String,
      country: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    platforms: [{
      name: String, // Discord, Zoom, etc.
      url: String
    }]
  },
  
  categories: [{
    type: String,
    enum: [
      'Web Development',
      'Mobile Development', 
      'AI/ML',
      'Blockchain',
      'IoT',
      'AR/VR',
      'Game Development',
      'DevOps',
      'Cybersecurity',
      'Data Science',
      'UI/UX Design',
      'Hardware',
      'Open Source',
      'Social Impact',
      'Fintech',
      'Healthtech',
      'Edtech',
      'Climate Tech',
      'Other'
    ]
  }],
  
  themes: [{
    type: String,
    trim: true
  }],
  
  teamSize: {
    min: {
      type: Number,
      default: 1,
      min: [1, 'Minimum team size must be at least 1']
    },
    max: {
      type: Number,
      default: 4,
      max: [10, 'Maximum team size cannot exceed 10']
    }
  },
  
  eligibility: {
    ageRestrictions: {
      minAge: Number,
      maxAge: Number
    },
    allowedRegions: [String], // Country codes
    restrictions: [String], // Additional restrictions
    requirements: [String] // Student ID, etc.
  },
  
  prizes: [{
    position: {
      type: String,
      required: true // '1st Place', '2nd Place', 'Best Design', etc.
    },
    title: String,
    amount: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    description: String,
    sponsor: String
  }],
  
  sponsors: [{
    name: {
      type: String,
      required: true
    },
    logo: String, // Cloudinary URL
    website: String,
    tier: {
      type: String,
      enum: ['Title', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Partner'],
      default: 'Partner'
    },
    description: String
  }],
  
  judges: [{
    name: {
      type: String,
      required: true
    },
    avatar: String, // Cloudinary URL
    title: String,
    company: String,
    bio: String,
    socialLinks: {
      linkedin: String,
      twitter: String,
      github: String
    }
  }],
  
  technologies: [{
    type: String,
    trim: true
  }],
  
  requirements: [{
    type: String,
    trim: true
  }],
  
  resources: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    url: String,
    type: {
      type: String,
      enum: ['API', 'Dataset', 'Tool', 'Tutorial', 'Documentation', 'Other'],
      default: 'Other'
    }
  }],
  
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
    default: 'All Levels'
  },
  
  status: {
    type: String,
    enum: ['draft', 'upcoming', 'registration_open', 'registration_closed', 'ongoing', 'judging', 'completed', 'cancelled'],
    default: 'draft'
  },
  
  visibility: {
    type: String,
    enum: ['public', 'private', 'invite_only'],
    default: 'public'
  },
  
  registration: {
    url: String,
    isExternal: {
      type: Boolean,
      default: false
    },
    requirements: [String],
    questions: [{
      question: {
        type: String,
        required: true
      },
      type: {
        type: String,
        enum: ['text', 'textarea', 'select', 'multiselect', 'checkbox'],
        default: 'text'
      },
      options: [String], // For select/multiselect
      required: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  submission: {
    guidelines: String,
    requirements: [String],
    formats: [String], // GitHub, DevPost, etc.
    maxFileSize: {
      type: Number,
      default: 100 // MB
    }
  },
  
  schedule: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    startTime: {
      type: Date,
      required: true
    },
    endTime: Date,
    type: {
      type: String,
      enum: ['opening', 'workshop', 'mentoring', 'meal', 'presentation', 'judging', 'closing', 'other'],
      default: 'other'
    },
    location: String,
    speakers: [String]
  }],
  
  statistics: {
    registrations: {
      type: Number,
      default: 0
    },
    participants: {
      type: Number,
      default: 0
    },
    teams: {
      type: Number,
      default: 0
    },
    submissions: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    }
  },
  
  social: {
    website: String,
    discord: String,
    slack: String,
    twitter: String,
    linkedin: String,
    facebook: String,
    instagram: String,
    youtube: String,
    hashtag: String
  },
  
  images: {
    banner: String, // Cloudinary URL
    logo: String,   // Cloudinary URL
    gallery: [String] // Array of Cloudinary URLs
  },
  
  featured: {
    type: Boolean,
    default: false
  },
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
hackathonSchema.index({ status: 1, 'dates.startDate': 1 });
hackathonSchema.index({ categories: 1 });
hackathonSchema.index({ 'location.type': 1 });
// Continuing from where the code was cut off...

hackathonSchema.index({ featured: -1, 'dates.startDate': 1 });
hackathonSchema.index({ tags: 1 });
hackathonSchema.index({ 'dates.registrationDeadline': 1 });
hackathonSchema.index({ createdBy: 1 });
hackathonSchema.index({ 'location.city': 1, 'location.country': 1 });

// Virtual fields
hackathonSchema.virtual('isRegistrationOpen').get(function() {
  const now = new Date();
  return now >= this.dates.registrationStart && 
         now <= this.dates.registrationDeadline && 
         this.status === 'registration_open';
});

hackathonSchema.virtual('daysUntilStart').get(function() {
  const now = new Date();
  const diffTime = this.dates.startDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

hackathonSchema.virtual('duration').get(function() {
  const diffTime = this.dates.endDate - this.dates.startDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

hackathonSchema.virtual('totalPrizePool').get(function() {
  if (!this.prizes || !Array.isArray(this.prizes)) {
    return 0;
  }
  return this.prizes.reduce((total, prize) => {
    if (prize.currency === 'USD') {
      return total + (prize.amount || 0);
    }
    return total;
  }, 0);
});
// Pre-save middleware
hackathonSchema.pre('save', function(next) {
  // Validate dates
  if (this.dates.startDate >= this.dates.endDate) {
    return next(new Error('End date must be after start date'));
  }
  
  if (this.dates.registrationDeadline >= this.dates.startDate) {
    return next(new Error('Registration deadline must be before start date'));
  }
  
  // Auto-update status based on dates
  const now = new Date();
  
  if (this.status !== 'cancelled' && this.status !== 'draft') {
    if (now < this.dates.registrationStart) {
      this.status = 'upcoming';
    } else if (now <= this.dates.registrationDeadline) {
      this.status = 'registration_open';
    } else if (now < this.dates.startDate) {
      this.status = 'registration_closed';
    } else if (now <= this.dates.endDate) {
      this.status = 'ongoing';
    } else if (this.dates.resultsDate && now < this.dates.resultsDate) {
      this.status = 'judging';
    } else {
      this.status = 'completed';
    }
  }
  
  // Generate tags from categories and themes
  const autoTags = [...this.categories, ...this.themes]
    .map(tag => tag.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(tag => tag.length > 0);
  
  this.tags = [...new Set([...this.tags, ...autoTags])];
  
  next();
});

// Static methods
hackathonSchema.statics.findUpcoming = function(limit = 10) {
  return this.find({
    status: { $in: ['upcoming', 'registration_open'] },
    visibility: 'public'
  })
  .sort({ 'dates.startDate': 1 })
  .limit(limit)
  .populate('createdBy', 'firstName lastName');
};

hackathonSchema.statics.findByCategory = function(category, limit = 10) {
  return this.find({
    categories: category,
    status: { $in: ['upcoming', 'registration_open', 'ongoing'] },
    visibility: 'public'
  })
  .sort({ featured: -1, 'dates.startDate': 1 })
  .limit(limit);
};

hackathonSchema.statics.findFeatured = function(limit = 5) {
  return this.find({
    featured: true,
    status: { $in: ['upcoming', 'registration_open', 'ongoing'] },
    visibility: 'public'
  })
  .sort({ 'dates.startDate': 1 })
  .limit(limit);
};

// Instance methods
hackathonSchema.methods.canUserRegister = function(user) {
  if (!this.isRegistrationOpen) return false;
  
  // Check age restrictions
  if (this.eligibility.ageRestrictions) {
    const userAge = user.age; // Assuming user has age field
    if (this.eligibility.ageRestrictions.minAge && userAge < this.eligibility.ageRestrictions.minAge) {
      return false;
    }
    if (this.eligibility.ageRestrictions.maxAge && userAge > this.eligibility.ageRestrictions.maxAge) {
      return false;
    }
  }
  
  // Check region restrictions
  if (this.eligibility.allowedRegions && this.eligibility.allowedRegions.length > 0) {
    if (!this.eligibility.allowedRegions.includes(user.country)) {
      return false;
    }
  }
  
  return true;
};

hackathonSchema.methods.incrementView = function() {
  return this.updateOne({ $inc: { 'statistics.views': 1 } });
};

hackathonSchema.methods.updateRegistrationCount = function(increment = 1) {
  return this.updateOne({ 
    $inc: { 
      'statistics.registrations': increment,
      'statistics.participants': increment 
    } 
  });
};

// Post middleware for logging
hackathonSchema.post('save', function(doc) {
  console.log(`Hackathon ${doc.title} has been saved with status: ${doc.status}`);
});

hackathonSchema.post('findOneAndUpdate', function(doc) {
  if (doc) {
    console.log(`Hackathon ${doc.title} has been updated`);
  }
});

// Custom validation
hackathonSchema.path('teamSize.max').validate(function(value) {
  return value >= this.teamSize.min;
}, 'Maximum team size must be greater than or equal to minimum team size');

hackathonSchema.path('dates.endDate').validate(function(value) {
  return value > this.dates.startDate;
}, 'End date must be after start date');

// Text search index
hackathonSchema.index({
  title: 'text',
  description: 'text',
  'organizer.name': 'text',
  themes: 'text',
  tags: 'text'
});

module.exports = mongoose.model('Hackathon', hackathonSchema);