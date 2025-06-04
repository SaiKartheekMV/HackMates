const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authController = {
  // Registration
 register: async (req, res) => {
  try {
    console.log('Registration request body:', req.body); // Debug logging
    
    const { email, password, firstName, lastName, name } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Handle name fields - support both single name and firstName/lastName
    let userFirstName = firstName;
    let userLastName = lastName;
    
    if (!userFirstName && !userLastName && name) {
      // If only 'name' is provided, split it
      const nameParts = name.trim().split(' ');
      userFirstName = nameParts[0] || '';
      userLastName = nameParts.slice(1).join(' ') || '';
    }

  

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password: password,
      firstName: userFirstName || '',
      lastName: userLastName || ''
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Registration error details:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
},

  // Login
  login: async (req, res) => {
    try {
    const { email, password } = req.body;
    console.log("Login request received:", req.body);

      // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
      console.log("User not found");
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log("Received password:", `"${password}"`);
    console.log("Stored hash from DB:", `"${user.password}"`);

      // Check password
    const isValidPassword = await user.comparePassword(password);
    console.log("Comparing password:", password, "with hash:", user.password);
    console.log("Password match:", isValidPassword);
    console.log("Received password:", `"${password}"`);
    console.log("Stored hash from DB:", `"${user.password}"`);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

      // Generate JWT
      const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

      res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
    } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'Login failed' });
  }
},

  // Get Profile - THIS WAS MISSING!
  getProfile: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified,
          preferences: user.preferences,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  },

  // Update Profile - THIS WAS MISSING TOO!
  updateProfile: async (req, res) => {
    try {
      const { firstName, lastName, preferences } = req.body;
      
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          firstName,
          lastName,
          preferences,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          preferences: user.preferences
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  },

  // Refresh Token
  refreshToken: async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      const newToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.json({ token: newToken });
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  },

  // Logout (optional - mainly for clearing client-side token)
  logout: async (req, res) => {
    res.json({ message: 'Logged out successfully' });
  }
};

module.exports = authController;