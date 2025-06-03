const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Don't return password in queries by default
  },
  profilePicture: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      hackRequests: {
        type: Boolean,
        default: true
      },
      teamUpdates: {
        type: Boolean,
        default: true
      },
      hackathonReminders: {
        type: Boolean,
        default: true
      }
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'public'
    },
    matchmaking: {
      allowAutoMatch: {
        type: Boolean,
        default: true
      },
      preferredTeamSize: {
        type: Number,
        min: 1,
        max: 10,
        default: 4
      },
      preferredRoles: [{
        type: String,
        enum: ['frontend', 'backend', 'fullstack', 'mobile', 'ai/ml', 'data-science', 'ui/ux', 'devops', 'blockchain', 'game-dev']
      }]
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  lockUntil: {
    type: Date,
    select: false
  },
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }],
  socialLinks: {
    github: String,
    linkedin: String,
    twitter: String,
    portfolio: String
  },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  termsAccepted: {
    type: Boolean,
    required: true,
    default: false
  },
  privacyPolicyAccepted: {
    type: Boolean,
    required: true,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to handle login attempts
userSchema.pre('save', function(next) {
  // If we're modifying login attempts and we have a previous lock that's expired
  if (this.isModified('loginAttempts') && this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        lockUntil: 1
      }
    }, next);
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to generate JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Instance method to generate refresh token
userSchema.methods.generateRefreshToken = function() {
  const refreshToken = jwt.sign(
    { userId: this._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  this.refreshTokens.push({ token: refreshToken });
  return refreshToken;
};

// Instance method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that's expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: {
        loginAttempts: 1
      },
      $unset: {
        lockUntil: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.lockUntil) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

// Instance method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const token = require('crypto').randomBytes(32).toString('hex');
  this.emailVerificationToken = token;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const token = require('crypto').randomBytes(32).toString('hex');
  this.passwordResetToken = token;
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async function(email, password) {
  const user = await this.findOne({ 
    email: email.toLowerCase(),
    status: 'active'
  }).select('+password +loginAttempts +lockUntil');
  
  if (!user) {
    throw new Error('Invalid login credentials');
  }
  
  // Check if account is locked
  if (user.isLocked) {
    await user.incLoginAttempts();
    throw new Error('Account temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Invalid login credentials');
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts && user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }
  
  // Update last login
  user.lastLogin = new Date();
  await user.save();
  
  return user;
};

// Static method to cleanup expired refresh tokens
userSchema.statics.cleanupExpiredTokens = async function() {
  return this.updateMany(
    {},
    {
      $pull: {
        refreshTokens: {
          createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }
    }
  );
};

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  
  delete user.password;
  delete user.refreshTokens;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.loginAttempts;
  delete user.lockUntil;
  delete user.__v;
  
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;