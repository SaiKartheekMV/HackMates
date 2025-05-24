const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: 2000
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  organizer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    website: String,
    logo: String
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
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required']
    },
    teamFormationDeadline: Date
  },
  location: {
    type: {
      type: String,
      enum: ['Online', 'In-Person', 'Hybrid'],
      required: true
    },
    venue: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    onlineLinks: {
      platform: String,
      joinUrl: String,
      backupUrl: String
    }
  },
  theme: {
    type: String,
    required: [true, 'Event theme is required'],
    enum: [
      'General', 'Web Development', 'Mobile Apps', 'AI/ML', 'Blockchain', 
      'IoT', 'Gaming', 'Fintech', 'Healthcare', 'Education', 'Climate Tech',
      'Social Impact', 'AR/VR', 'Cybersecurity', 'DevOps', 'Data Science'
    ]
  },
  categories: [{
    type: String,
    enum: [
      'Beginner Friendly', 'Student Only', 'Professional', 'Open Source',
      'Corporate Sponsored', 'University', 'Community', 'Competition'
    ]
  }],
  requirements: {
    teamSize: {
      min: { type: Number, default: 2 },
      max: { type: Number, default: 5 }
    },
    skillRequirements: [String],
    eligibility: {
      type: String,
      enum: ['Everyone', 'Students Only', 'Professionals Only', 'First-time Hackers'],
      default: 'Everyone'
    },
    experience: {
      type: String,
      enum: ['All Levels', 'Beginner', 'Intermediate', 'Advanced'],
      default: 'All Levels'
    }
  },
  prizes: [{
    position: String, // '1st Place', '2nd Place', 'Best AI Implementation', etc.
    amount: Number,
    currency: { type: String, default: 'USD' },
    description: String,
    sponsor: String
  }],
  sponsors: [{
    name: String,
    logo: String,
    website: String,
    tier: {
      type: String,
      enum: ['Title', 'Platinum', 'Gold', 'Silver', 'Bronze', 'Partner']
    }
  }],
  schedule: [{
    title: String,
    description: String,
    startTime: Date,
    endTime: Date,
    type: {
      type: String,
      enum: ['Opening', 'Workshop', 'Mentoring', 'Meal', 'Judging', 'Closing', 'Networking', 'Other']
    },
    location: String,
    speaker: String
  }],
  resources: {
    apis: [String],
    datasets: [String],
    tools: [String],
    mentors: [{
      name: String,
      expertise: [String],
      company: String,
      linkedin: String,
      availableSlots: [Date]
    }]
  },
  registration: {
    isOpen: { type: Boolean, default: true },
    maxParticipants: Number,
    currentParticipants: { type: Number, default: 0 },
    registrationFee: { type: Number, default: 0 },
    registrationUrl: String,
    requirements: [String]
  },
  media: {
    coverImage: String,
    gallery: [String],
    videos: [String],
    livestreamUrl: String
  },
  social: {
    website: String,
    discord: String,
    slack: String,
    twitter: String,
    linkedin: String,
    instagram: String,
    hashtags: [String]
  },
  rules: {
    codeOfConduct: String,
    judgingCriteria: [String],
    submissionGuidelines: String,
    intellectualProperty: String
  },
  statistics: {
    views: { type: Number, default: 0 },
    registrations: { type: Number, default: 0 },
    teamsFormed: { type: Number, default: 0 },
    projects: { type: Number, default: 0 },
    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 }
    }
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Registration Open', 'Registration Closed', 'In Progress', 'Judging', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
eventSchema.index({ 'dates.startDate': 1 });
eventSchema.index({ 'dates.registrationDeadline': 1 });
eventSchema.index({ theme: 1 });
eventSchema.index({ categories: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ featured: -1, 'dates.startDate': 1 });
eventSchema.index({ 'location.type': 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ 'location.address.city': 1, 'location.address.country': 1 });
eventSchema.index({ 'organizer.name': 1 });
eventSchema.index({ 'statistics.views': -1 });
eventSchema.index({ 'statistics.registrations': -1 });

// Compound indexes for complex queries
eventSchema.index({ theme: 1, 'dates.startDate': 1, status: 1 });
eventSchema.index({ categories: 1, 'requirements.experience': 1 });
eventSchema.index({ 'location.type': 1, 'dates.startDate': 1 });

// Virtual for event duration in days
eventSchema.virtual('duration').get(function() {
  if (this.dates.startDate && this.dates.endDate) {
    const diffTime = Math.abs(this.dates.endDate - this.dates.startDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for registration status
eventSchema.virtual('registrationStatus').get(function() {
  const now = new Date();
  if (now > this.dates.registrationDeadline) return 'Closed';
  if (!this.registration.isOpen) return 'Closed';
  if (this.registration.maxParticipants && this.registration.currentParticipants >= this.registration.maxParticipants) {
    return 'Full';
  }
  return 'Open';
});

// Virtual for time until event
eventSchema.virtual('timeUntilEvent').get(function() {
  const now = new Date();
  const eventStart = this.dates.startDate;
  
  if (now > eventStart) return 'Started';
  
  const diffTime = eventStart - now;
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} days`;
  if (hours > 0) return `${hours} hours`;
  return 'Starting soon';
});

// Virtual for total prize pool
eventSchema.virtual('totalPrizePool').get(function() {
  if (!this.prizes || this.prizes.length === 0) return 0;
  return this.prizes.reduce((total, prize) => {
    return total + (prize.amount || 0);
  }, 0);
});

// Virtual for formatted address
eventSchema.virtual('formattedAddress').get(function() {
  if (!this.location.address) return '';
  const addr = this.location.address;
  const parts = [addr.street, addr.city, addr.state, addr.country].filter(Boolean);
  return parts.join(', ');
});

// Method to check if user can register
eventSchema.methods.canUserRegister = function(user) {
  const now = new Date();
  
  // Check if registration is open
  if (!this.registration.isOpen) return { canRegister: false, reason: 'Registration is closed' };
  
  // Check if deadline has passed
  if (now > this.dates.registrationDeadline) {
    return { canRegister: false, reason: 'Registration deadline has passed' };
  }
  
  // Check if event is full
  if (this.registration.maxParticipants && this.registration.currentParticipants >= this.registration.maxParticipants) {
    return { canRegister: false, reason: 'Event is full' };
  }
  
  // Check eligibility
  if (this.requirements.eligibility === 'Students Only' && user.experience?.level !== 'Student') {
    return { canRegister: false, reason: 'This event is for students only' };
  }
  
  return { canRegister: true };
};

// Method to get matching participants for team formation
eventSchema.methods.getMatchingParticipants = function(userProfile, limit = 10) {
  // This will be implemented with the AI matching service
  // For now, return empty array
  return [];
};

// Method to increment view count
eventSchema.methods.incrementView = function() {
  this.statistics.views += 1;
  return this.save({ validateBeforeSave: false });
};

// Method to add rating
eventSchema.methods.addRating = function(rating) {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  const currentTotal = this.statistics.ratings.average * this.statistics.ratings.count;
  this.statistics.ratings.count += 1;
  this.statistics.ratings.average = (currentTotal + rating) / this.statistics.ratings.count;
  
  return this.save({ validateBeforeSave: false });
};

// Method to get upcoming events
eventSchema.statics.getUpcoming = function(limit = 10) {
  const now = new Date();
  return this.find({
    'dates.startDate': { $gte: now },
    status: { $in: ['Published', 'Registration Open', 'Registration Closed'] }
  })
  .sort({ 'dates.startDate': 1 })
  .limit(limit);
};

// Method to get featured events
eventSchema.statics.getFeatured = function(limit = 5) {
  return this.find({ featured: true, status: { $ne: 'Cancelled' } })
    .sort({ 'dates.startDate': 1 })
    .limit(limit);
};

// Method to search events
eventSchema.statics.searchEvents = function(query, filters = {}) {
  const searchQuery = {};
  
  // Text search
  if (query) {
    searchQuery.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ];
  }
  
  // Apply filters
  if (filters.theme) searchQuery.theme = filters.theme;
  if (filters.location) searchQuery['location.type'] = filters.location;
  if (filters.experience) searchQuery['requirements.experience'] = filters.experience;
  if (filters.categories) searchQuery.categories = { $in: filters.categories };
  if (filters.status) searchQuery.status = filters.status;
  
  // Date filters
  if (filters.startDate) {
    searchQuery['dates.startDate'] = { $gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    searchQuery['dates.endDate'] = { $lte: new Date(filters.endDate) };
  }
  
  return this.find(searchQuery);
};

// Pre-save middleware
eventSchema.pre('save', function(next) {
  // Auto-generate short description if not provided
  if (!this.shortDescription && this.description) {
    this.shortDescription = this.description.substring(0, 197) + '...';
  }
  
  // Auto-update status based on dates
  const now = new Date();
  if (this.status !== 'Cancelled' && this.status !== 'Draft') {
    if (now < this.dates.registrationDeadline && this.registration.isOpen) {
      this.status = 'Registration Open';
    } else if (now >= this.dates.registrationDeadline && now < this.dates.startDate) {
      this.status = 'Registration Closed';
    } else if (now >= this.dates.startDate && now < this.dates.endDate) {
      this.status = 'In Progress';
    } else if (now >= this.dates.endDate) {
      this.status = 'Completed';
    }
  }
  
  // Validate date logic
  if (this.dates.startDate >= this.dates.endDate) {
    return next(new Error('End date must be after start date'));
  }
  
  if (this.dates.registrationDeadline > this.dates.startDate) {
    return next(new Error('Registration deadline must be before start date'));
  }
  
  // Validate team size
  if (this.requirements.teamSize.min > this.requirements.teamSize.max) {
    return next(new Error('Minimum team size cannot be greater than maximum team size'));
  }
  
  next();
});

// Post-save middleware
eventSchema.post('save', function(doc) {
  // You could add logic here to send notifications, update caches, etc.
  console.log(`Event ${doc.title} has been saved with status: ${doc.status}`);
});

// Pre-remove middleware
eventSchema.pre('remove', function(next) {
  // Clean up related data when event is deleted
  // This would include removing registrations, teams, etc.
  console.log(`Event ${this.title} is being deleted`);
  next();
});

// Create and export the model
const Event = mongoose.model('Event', eventSchema);

module.exports = Event;