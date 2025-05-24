const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  resumeData: {
    fileName: String,
    filePath: String,
    uploadDate: { type: Date, default: Date.now },
    parsedData: {
      text: String,
      skills: [String],
      experience: [{
        company: String,
        role: String,
        duration: String,
        description: String
      }],
      education: [{
        institution: String,
        degree: String,
        field: String,
        year: String,
        gpa: String
      }],
      projects: [{
        name: String,
        description: String,
        technologies: [String],
        url: String
      }],
      certifications: [{
        name: String,
        issuer: String,
        date: String,
        url: String
      }],
      languages: [String],
      achievements: [String]
    }
  },
  linkedinData: {
    profileUrl: String,
    headline: String,
    summary: String,
    connections: Number,
    skills: [String],
    experience: [{
      company: String,
      role: String,
      duration: String,
      description: String
    }],
    education: [{
      institution: String,
      degree: String,
      field: String
    }],
    lastScraped: { type: Date, default: Date.now }
  },
  aiProfile: {
    skillsVector: [Number], // Embedding vector for skills
    interestsVector: [Number], // Embedding vector for interests
    experienceVector: [Number], // Embedding vector for experience
    personalityTraits: {
      leadership: { type: Number, min: 0, max: 1, default: 0.5 },
      collaboration: { type: Number, min: 0, max: 1, default: 0.5 },
      innovation: { type: Number, min: 0, max: 1, default: 0.5 },
      technical: { type: Number, min: 0, max: 1, default: 0.5 },
      communication: { type: Number, min: 0, max: 1, default: 0.5 }
    },
    compatibilityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    lastUpdated: { type: Date, default: Date.now }
  },
  matchingPreferences: {
    rolePreferences: [{
      type: String,
      enum: ['Frontend', 'Backend', 'Fullstack', 'Mobile', 'AI/ML', 'Data Science', 'DevOps', 'UI/UX', 'Product Manager', 'Marketing']
    }],
    skillPriorities: [{
      skill: String,
      importance: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
      }
    }],
    experienceLevelPreference: {
      type: String,
      enum: ['Similar', 'Mixed', 'Senior-Led', 'No Preference'],
      default: 'No Preference'
    },
    teamDynamics: {
      preferredTeamSize: {
        type: Number,
        min: 2,
        max: 8,
        default: 4
      },
      leadershipRole: {
        type: String,
        enum: ['Lead', 'Member', 'Either'],
        default: 'Either'
      },
      workStyle: {
        type: String,
        enum: ['Structured', 'Flexible', 'Either'],
        default: 'Either'
      }
    }
  },
  statistics: {
    profileViews: { type: Number, default: 0 },
    matchRequests: {
      sent: { type: Number, default: 0 },
      received: { type: Number, default: 0 },
      accepted: { type: Number, default: 0 }
    },
    hackathonsParticipated: { type: Number, default: 0 },
    successfulTeams: { type: Number, default: 0 },
    averageTeamRating: { type: Number, min: 0, max: 5, default: 0 }
  },
  visibility: {
    isPublic: { type: Boolean, default: true },
    showEmail: { type: Boolean, default: false },
    showPhone: { type: Boolean, default: false },
    allowMatching: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
profileSchema.index({ userId: 1 });
profileSchema.index({ 'aiProfile.compatibilityScore': -1 });
profileSchema.index({ 'resumeData.parsedData.skills': 1 });
profileSchema.index({ 'linkedinData.skills': 1 });
profileSchema.index({ 'visibility.isPublic': 1, 'visibility.allowMatching': 1 });

// Virtual for complete profile data
profileSchema.virtual('completeProfile').get(function() {
  return {
    id: this._id,
    userId: this.userId,
    skills: [
      ...(this.resumeData?.parsedData?.skills || []),
      ...(this.linkedinData?.skills || [])
    ],
    experience: [
      ...(this.resumeData?.parsedData?.experience || []),
      ...(this.linkedinData?.experience || [])
    ],
    aiProfile: this.aiProfile,
    statistics: this.statistics,
    lastUpdated: this.updatedAt
  };
});

// Method to merge skills from different sources
profileSchema.methods.getMergedSkills = function() {
  const resumeSkills = this.resumeData?.parsedData?.skills || [];
  const linkedinSkills = this.linkedinData?.skills || [];
  
  // Remove duplicates and merge
  const allSkills = [...new Set([...resumeSkills, ...linkedinSkills])];
  return allSkills.filter(skill => skill && skill.trim().length > 0);
};

// Method to get experience level
profileSchema.methods.getExperienceLevel = function() {
  const experiences = [
    ...(this.resumeData?.parsedData?.experience || []),
    ...(this.linkedinData?.experience || [])
  ];
  
  if (experiences.length === 0) return 'Student';
  if (experiences.length <= 2) return 'Junior';
  if (experiences.length <= 4) return 'Mid';
  return 'Senior';
};

// Method to calculate match compatibility with another profile
profileSchema.methods.calculateCompatibility = function(otherProfile) {
  let score = 0;
  let factors = 0;
  
  // Skills similarity (40% weight)
  const mySkills = this.getMergedSkills();
  const otherSkills = otherProfile.getMergedSkills();
  const commonSkills = mySkills.filter(skill => 
    otherSkills.some(otherSkill => 
      otherSkill.toLowerCase().includes(skill.toLowerCase())
    )
  );
  const skillsSimilarity = commonSkills.length / Math.max(mySkills.length, otherSkills.length, 1);
  score += skillsSimilarity * 40;
  factors += 40;
  
  // Experience level compatibility (20% weight)
  const myLevel = this.getExperienceLevel();
  const otherLevel = otherProfile.getExperienceLevel();
  const levelCompatibility = (myLevel === otherLevel) ? 1 : 0.7;
  score += levelCompatibility * 20;
  factors += 20;
  
  // AI personality traits (40% weight)
  if (this.aiProfile?.personalityTraits && otherProfile.aiProfile?.personalityTraits) {
    const traits = ['leadership', 'collaboration', 'innovation', 'technical', 'communication'];
    let traitScore = 0;
    
    traits.forEach(trait => {
      const diff = Math.abs(this.aiProfile.personalityTraits[trait] - otherProfile.aiProfile.personalityTraits[trait]);
      traitScore += (1 - diff); // Closer values = higher score
    });
    
    score += (traitScore / traits.length) * 40;
    factors += 40;
  }
  
  return Math.round((score / factors) * 100);
};

// Pre-save middleware to update AI profile timestamp
profileSchema.pre('save', function(next) {
  if (this.isModified('aiProfile')) {
    this.aiProfile.lastUpdated = new Date();
  }
  next();
});

module.exports = mongoose.model('Profile', profileSchema);