// src/services/cacheService.js
const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.connect();
  }

  /**
   * Connect to Redis
   */
  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.error('Redis connection refused');
            return new Error('Redis server connection refused');
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            console.error('Redis retry time exhausted');
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            console.error('Redis connection attempts exhausted');
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      this.client.on('error', (error) => {
        console.error('Redis Client Error:', error);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Connected to Redis');
        this.isConnected = true;
      });

      this.client.on('ready', () => {
        console.log('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        console.log('Redis connection ended');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      this.isConnected = false;
    }
  }

  /**
   * Check if Redis is connected
   * @returns {boolean} Connection status
   */
  isRedisConnected() {
    return this.isConnected && this.client && this.client.isOpen;
  }

  /**
   * Set a key-value pair with optional expiration
   * @param {string} key - Cache key
   * @param {string} value - Cache value
   * @param {number} ttl - Time to live in seconds (optional)
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = null) {
    try {
      if (!this.isRedisConnected()) {
        console.warn('Redis not connected, skipping cache set');
        return false;
      }

      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  /**
   * Get value by key
   * @param {string} key - Cache key
   * @returns {Promise<string|null>} Cached value or null
   */
  async get(key) {
    try {
      if (!this.isRedisConnected()) {
        console.warn('Redis not connected, skipping cache get');
        return null;
      }

      const value = await this.client.get(key);
      return value;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  /**
   * Delete a key
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    try {
      if (!this.isRedisConnected()) {
        console.warn('Redis not connected, skipping cache delete');
        return false;
      }

      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DELETE error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   * @returns {Promise<number>} Number of deleted keys
   */
  async deleteByPattern(pattern) {
    try {
      if (!this.isRedisConnected()) {
        console.warn('Redis not connected, skipping pattern delete');
        return 0;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      await this.client.del(keys);
      return keys.length;
    } catch (error) {
      console.error('Redis DELETE BY PATTERN error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Key existence
   */
  async exists(key) {
    try {
      if (!this.isRedisConnected()) {
        return false;
      }

      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  /**
   * Set expiration for a key
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async expire(key, ttl) {
    try {
      if (!this.isRedisConnected()) {
        return false;
      }

      await this.client.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Redis EXPIRE error:', error);
      return false;
    }
  }

  /**
   * Increment a numeric value
   * @param {string} key - Cache key
   * @param {number} increment - Increment amount (default: 1)
   * @returns {Promise<number|null>} New value or null on error
   */
  async increment(key, increment = 1) {
    try {
      if (!this.isRedisConnected()) {
        return null;
      }

      const newValue = await this.client.incrBy(key, increment);
      return newValue;
    } catch (error) {
      console.error('Redis INCREMENT error:', error);
      return null;
    }
  }

  /**
   * Add item to a set
   * @param {string} key - Set key
   * @param {string|Array} members - Member(s) to add
   * @returns {Promise<boolean>} Success status
   */
  async addToSet(key, members) {
    try {
      if (!this.isRedisConnected()) {
        return false;
      }

      if (Array.isArray(members)) {
        await this.client.sAdd(key, members);
      } else {
        await this.client.sAdd(key, members);
      }
      return true;
    } catch (error) {
      console.error('Redis SADD error:', error);
      return false;
    }
  }

  /**
   * Get all members of a set
   * @param {string} key - Set key
   * @returns {Promise<Array>} Set members
   */
  async getSet(key) {
    try {
      if (!this.isRedisConnected()) {
        return [];
      }

      const members = await this.client.sMembers(key);
      return members;
    } catch (error) {
      console.error('Redis SMEMBERS error:', error);
      return [];
    }
  }

  /**
   * Remove item from a set
   * @param {string} key - Set key
   * @param {string} member - Member to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeFromSet(key, member) {
    try {
      if (!this.isRedisConnected()) {
        return false;
      }

      await this.client.sRem(key, member);
      return true;
    } catch (error) {
      console.error('Redis SREM error:', error);
      return false;
    }
  }

  /**
   * Cache user matches with TTL
   * @param {string} userId - User ID
   * @param {string} hackathonId - Hackathon ID
   * @param {Array} matches - Match data
   * @param {number} ttl - Time to live (default: 1 hour)
   */
  async cacheUserMatches(userId, hackathonId, matches, ttl = 3600) {
    const key = `matches:${userId}:${hackathonId}`;
    await this.set(key, JSON.stringify(matches), ttl);
  }

  /**
   * Get cached user matches
   * @param {string} userId - User ID
   * @param {string} hackathonId - Hackathon ID
   * @returns {Promise<Array|null>} Cached matches or null
   */
  async getCachedMatches(userId, hackathonId) {
    const key = `matches:${userId}:${hackathonId}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Invalidate all caches for a user
   * @param {string} userId - User ID
   */
  async invalidateUserCache(userId) {
    await this.deleteByPattern(`matches:${userId}:*`);
    await this.deleteByPattern(`profile:${userId}*`);
    await this.deleteByPattern(`user:${userId}*`);
  }

  /**
   * Cache hackathon data
   * @param {string} hackathonId - Hackathon ID
   * @param {Object} data - Hackathon data
   * @param {number} ttl - Time to live (default: 30 minutes)
   */
  async cacheHackathon(hackathonId, data, ttl = 1800) {
    const key = `hackathon:${hackathonId}`;
    await this.set(key, JSON.stringify(data), ttl);
  }

  /**
   * Get cached hackathon data
   * @param {string} hackathonId - Hackathon ID
   * @returns {Promise<Object|null>} Cached hackathon or null
   */
  async getCachedHackathon(hackathonId) {
    const key = `hackathon:${hackathonId}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Cache hackathon list
   * @param {string} filterHash - Hash of filter parameters
   * @param {Array} hackathons - Hackathon list
   * @param {number} ttl - Time to live (default: 15 minutes)
   */
  async cacheHackathonList(filterHash, hackathons, ttl = 900) {
    const key = `hackathons:list:${filterHash}`;
    await this.set(key, JSON.stringify(hackathons), ttl);
  }

  /**
   * Get cached hackathon list
   * @param {string} filterHash - Hash of filter parameters
   * @returns {Promise<Array|null>} Cached hackathon list or null
   */
  async getCachedHackathonList(filterHash) {
    const key = `hackathons:list:${filterHash}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Store user session
   * @param {string} sessionId - Session ID
   * @param {Object} sessionData - Session data
   * @param {number} ttl - Time to live (default: 24 hours)
   */
  async storeSession(sessionId, sessionData, ttl = 86400) {
    const key = `session:${sessionId}`;
    await this.set(key, JSON.stringify(sessionData), ttl);
  }

  /**
   * Get user session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object|null>} Session data or null
   */
  async getSession(sessionId) {
    const key = `session:${sessionId}`;
    const cached = await this.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  /**
   * Delete user session
   * @param {string} sessionId - Session ID
   */
  async deleteSession(sessionId) {
    const key = `session:${sessionId}`;
    await this.delete(key);
  }

  /**
   * Rate limiting: Check and increment request count
   * @param {string} identifier - IP or user identifier
   * @param {number} windowSeconds - Time window in seconds
   * @param {number} maxRequests - Maximum requests allowed
   * @returns {Promise<Object>} Rate limit info
   */
  async checkRateLimit(identifier, windowSeconds, maxRequests) {
    try {
      if (!this.isRedisConnected()) {
        // If Redis is down, allow requests but log warning
        console.warn('Redis unavailable for rate limiting');
        return { allowed: true, remaining: maxRequests, resetTime: Date.now() + (windowSeconds * 1000) };
      }

      const key = `rate_limit:${identifier}`;
      const current = await this.increment(key);
      
      if (current === 1) {
        // First request in window, set expiration
        await this.expire(key, windowSeconds);
      }

      const remaining = Math.max(0, maxRequests - current);
      const allowed = current <= maxRequests;
      const resetTime = Date.now() + (windowSeconds * 1000);

      return {
        allowed,
        remaining,
        resetTime,
        current
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request
      return { allowed: true, remaining: maxRequests, resetTime: Date.now() + (windowSeconds * 1000) };
    }
  }

  /**
   * Health check for Redis connection
   * @returns {Promise<boolean>} Health status
   */
  async healthCheck() {
    try {
      if (!this.isRedisConnected()) {
        return false;
      }

      await this.client.ping();
      return true;
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Get Redis info
   * @returns {Promise<Object>} Redis information
   */
  async getInfo() {
    try {
      if (!this.isRedisConnected()) {
        return { connected: false };
      }

      const info = await this.client.info();
      return {
        connected: true,
        info: info
      };
    } catch (error) {
      console.error('Redis info error:', error);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Gracefully close Redis connection
   */
  async close() {
    try {
      if (this.client) {
        await this.client.quit();
        console.log('Redis connection closed');
      }
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}

module.exports = new CacheService();