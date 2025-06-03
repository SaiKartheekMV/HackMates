const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import configurations
const connectDB = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');

// Import routes
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const profileRoutes = require('./src/routes/profiles');
const hackathonRoutes = require('./src/routes/hackathons');
const matchmakingRoutes = require('./src/routes/matchmaking');
const teamRoutes = require('./src/routes/teams');
const requestRoutes = require('./src/routes/requests');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');
const { authenticateSocket } = require('./src/middleware/auth');

// Initialize Express app
const app = express();
const server = createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to databases
connectDB();
connectRedis();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization
app.use(mongoSanitize()); // Against NoSQL query injection
app.use(xss()); // Against XSS attacks
app.use(hpp()); // Prevent parameter pollution

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/hackathons', hackathonRoutes);
app.use('/api/matchmaking', matchmakingRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/requests', requestRoutes);

// Socket.io connection handling
io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`User ${socket.user.id} connected`);
  
  // Join user-specific room for notifications
  socket.join(`user_${socket.user.id}`);
  
  // Handle team room joining
  socket.on('join-team', (teamId) => {
    socket.join(`team_${teamId}`);
    console.log(`User ${socket.user.id} joined team ${teamId}`);
  });
  
  // Handle leaving team room
  socket.on('leave-team', (teamId) => {
    socket.leave(`team_${teamId}`);
    console.log(`User ${socket.user.id} left team ${teamId}`);
  });
  
  // Handle hackathon room joining
  socket.on('join-hackathon', (hackathonId) => {
    socket.join(`hackathon_${hackathonId}`);
    console.log(`User ${socket.user.id} joined hackathon ${hackathonId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.id} disconnected`);
  });
});

// Make io available in controllers
app.set('io', io);

// 404 handler
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
🚀 HackMates Backend Server Started!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📊 Database: MongoDB Connected
🔄 Cache: Redis Connected
⏰ Started at: ${new Date().toISOString()}
  `);
});

module.exports = { app, server, io };