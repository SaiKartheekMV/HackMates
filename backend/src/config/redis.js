// src/config/redis.js
const redis = require('redis');

let client;

const connectRedis = async () => {
  try {
    // Check if client already exists and is connected
    if (client && client.isReady) {
      console.log('Redis already connected');
      return client;
    }

    client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      // Add additional options for better connection handling
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('🔗 Redis connecting...');
    });

    client.on('ready', () => {
      console.log('✅ Redis connected successfully');
    });

    client.on('end', () => {
      console.log('🔌 Redis connection ended');
    });

    client.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    // Connect to Redis
    await client.connect();
    
    // Test the connection
    await client.ping();
    console.log('🏓 Redis ping successful');
    
    return client;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    // Don't throw error, allow app to continue without Redis
    return null;
  }
};

const getRedisClient = () => {
  if (!client || !client.isReady) {
    console.warn('⚠️ Redis client not available');
    return null;
  }
  return client;
};

const closeRedis = async () => {
  if (client && client.isOpen) {
    try {
      await client.quit();
      console.log('🔌 Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing Redis:', error.message);
    }
  }
};

// Helper function to safely execute Redis operations
const safeRedisOperation = async (operation) => {
  const redisClient = getRedisClient();
  if (!redisClient) {
    console.warn('⚠️ Redis not available, skipping operation');
    return null;
  }
  
  try {
    return await operation(redisClient);
  } catch (error) {
    console.error('❌ Redis operation failed:', error.message);
    return null;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
  safeRedisOperation
};