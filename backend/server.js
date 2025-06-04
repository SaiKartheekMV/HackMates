// server.js
require('dotenv').config();

const http = require('http');
const socketIo = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { connectRedis, getRedisClient, closeRedis } = require('./src/config/redis'); // Fixed import
const mongoose = require('mongoose');

// Import workers
const matchUpdater = require('./src/workers/matchUpdater');

// Socket authentication middleware
const socketAuth = require('./src/middleware/socketAuth');

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket authentication
io.use(socketAuth);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👤 User connected: ${socket.userId}`);

  // Join user-specific room for notifications
  socket.join(`user_${socket.userId}`);

  // Handle team room joining
  socket.on('join-team-room', (teamId) => {
    if (teamId) {
      socket.join(`team_${teamId}`);
      console.log(`👥 User ${socket.userId} joined team room: ${teamId}`);
    }
  });

  // Handle leaving team room
  socket.on('leave-team-room', (teamId) => {
    if (teamId) {
      socket.leave(`team_${teamId}`);
      console.log(`👋 User ${socket.userId} left team room: ${teamId}`);
    }
  });

  // Handle hackathon room joining
  socket.on('join-hackathon-room', (hackathonId) => {
    if (hackathonId) {
      socket.join(`hackathon_${hackathonId}`);
      console.log(`🏆 User ${socket.userId} joined hackathon room: ${hackathonId}`);
    }
  });

  // Handle real-time typing indicators for team chat
  socket.on('typing-start', (data) => {
    if (data.teamId) {
      socket.to(`team_${data.teamId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.userName
      });
    }
  });

  socket.on('typing-stop', (data) => {
    if (data.teamId) {
      socket.to(`team_${data.teamId}`).emit('user-stopped-typing', {
        userId: socket.userId
      });
    }
  });

  // Handle match feedback
  socket.on('match-feedback', (data) => {
    console.log(`👍 Match feedback from ${socket.userId}:`, data);
    // Could be used to improve matching algorithm
  });

  // Handle user status updates
  socket.on('update-status', (status) => {
    socket.broadcast.emit('user-status-update', {
      userId: socket.userId,
      status: status
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`👋 User disconnected: ${socket.userId}, reason: ${reason}`);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`🔥 Socket error for user ${socket.userId}:`, error);
  });
});

// Make io instance available to other modules
app.set('io', io);

// Global socket notification functions
global.notifyUser = (userId, notification) => {
  io.to(`user_${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date()
  });
};

global.notifyTeam = (teamId, notification) => {
  io.to(`team_${teamId}`).emit('team-notification', {
    ...notification,
    timestamp: new Date()
  });
};

global.notifyHackathon = (hackathonId, notification) => {
  io.to(`hackathon_${hackathonId}`).emit('hackathon-notification', {
    ...notification,
    timestamp: new Date()
  });
};

// Start server function
async function startServer() {
  try {
    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected successfully');

    // Connect to Redis - FIXED
    console.log('🔗 Connecting to Redis...');
    const redisClient = await connectRedis(); // Use the connectRedis function
    
    if (redisClient) {
      console.log('✅ Redis connected successfully');
    } else {
      console.log('⚠️ Redis connection failed, continuing without cache');
    }

    // Start the HTTP server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log('🚀 HackMates Backend Server Started!');
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/docs`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Start background workers
      console.log('🔧 Starting background workers...');
      matchUpdater.start();
      console.log('✅ Background workers started successfully');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    
    // Gracefully close connections
    await closeRedis(); // Use the closeRedis function
    
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await gracefulShutdown();
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  await gracefulShutdown();
});

async function gracefulShutdown() {
  try {
    console.log('⏳ Closing server...');
    server.close(() => {
      console.log('✅ HTTP server closed');
    });

    // Close database connections
    console.log('⏳ Closing database connections...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');

    // Close Redis connection - FIXED
    await closeRedis(); // Use the closeRedis function
    console.log('✅ Redis connection closed');

    // Stop background workers
    matchUpdater.stop();
    console.log('✅ Background workers stopped');

    console.log('👋 Server shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('🔥 Unhandled Promise Rejection:', err);
  gracefulShutdown();
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
  gracefulShutdown();
});

// Start the server
startServer();