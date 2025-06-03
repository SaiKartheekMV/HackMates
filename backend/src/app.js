const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
require('dotenv').config();

// Import middleware
const { apiLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');
const notFound = require('./src/middleware/notFound');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const profileRoutes = require('./src/routes/profiles');
const hackathonRoutes = require('./src/routes/hackathons');
const matchmakingRoutes = require('./src/routes/matchmaking');
const teamRoutes = require('./src/routes/teams');
const requestRoutes = require('./src/routes/requests');

const app = express();

// Trust proxy (for deployment behind reverse proxy)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "res.cloudinary.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", process.env.FRONTEND_URL],
    },
  },
}));

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://hackmates.vercel.app'
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression middleware
app.use(compression());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xss());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'HackMates API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes with rate limiting
app.use('/api', apiLimiter);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/requests', requestRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to HackMates API',
    version: '1.0.0',
    documentation: '/api/docs',
    status: 'active'
  });
});

// Handle undefined routes
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;