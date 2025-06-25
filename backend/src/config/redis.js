// src/config/redis.js
const redis = require('redis');

let client;

const connectRedis = async () => {
  try {
    // Check if client already exists and is connected
    if (client && client.isReady) {
      console.log('✅ Redis already connected');
      return client;
    }

    // Create Redis client
    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          const delay = Math.min(retries * 50, 500);
          console.log(`🔄 Redis reconnecting in ${delay}ms (attempt ${retries})`);
          return delay;
        },
        connectTimeout: 60000, // 60 seconds
        lazyConnect: true
      },
      // Add retry strategy
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          console.error('❌ Redis server refused connection');
          return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          console.error('❌ Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          console.error('❌ Redis max retry attempts reached');
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });

    // Event listeners
    client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('🔗 Redis connecting...');
    });

    client.on('ready', () => {
      console.log('✅ Redis connected and ready');
    });

    client.on('end', () => {
      console.log('🔌 Redis connection ended');
    });

    client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    client.on('disconnect', () => {
      console.log('🔌 Redis disconnected');
    });

    // Connect to Redis
    console.log('🚀 Attempting to connect to Redis...');
    await client.connect();
    
    // Test the connection
    const pong = await client.ping();
    console.log('🏓 Redis ping response:', pong);
    
    return client;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Clean up failed client
    if (client) {
      try {
        await client.disconnect();
      } catch (disconnectError) {
        console.error('❌ Error during client cleanup:', disconnectError.message);
      }
      client = null;
    }
    
    // Don't throw error, allow app to continue without Redis
    return null;
  }
};

const getRedisClient = () => {
  if (!client) {
    console.warn('⚠️ Redis client not initialized');
    return null;
  }
  
  if (!client.isReady) {
    console.warn('⚠️ Redis client not ready');
    return null;
  }
  
  return client;
};

const closeRedis = async () => {
  if (client) {
    try {
      if (client.isOpen) {
        await client.quit();
        console.log('🔌 Redis connection closed gracefully');
      } else {
        await client.disconnect();
        console.log('🔌 Redis client disconnected');
      }
    } catch (error) {
      console.error('❌ Error closing Redis:', error.message);
      try {
        await client.disconnect();
      } catch (forceError) {
        console.error('❌ Error force disconnecting Redis:', forceError.message);
      }
    } finally {
      client = null;
    }
  }
};

// Helper function to safely execute Redis operations
const safeRedisOperation = async (operation, defaultValue = null) => {
  const redisClient = getRedisClient();
  if (!redisClient) {
    console.warn('⚠️ Redis not available, returning default value');
    return defaultValue;
  }
  
  try {
    const result = await operation(redisClient);
    return result;
  } catch (error) {
    console.error('❌ Redis operation failed:', error.message);
    return defaultValue;
  }
};

// Health check function
const isRedisHealthy = () => {
  return client && client.isReady;
};

// Get Redis status info
const getRedisStatus = () => {
  if (!client) {
    return { status: 'not_initialized', isReady: false, isOpen: false };
  }
  
  return {
    status: client.isReady ? 'ready' : 'not_ready',
    isReady: client.isReady,
    isOpen: client.isOpen
  };
};

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
  safeRedisOperation,
  isRedisHealthy,
  getRedisStatus
};