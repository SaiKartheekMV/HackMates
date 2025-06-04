// src/services/cacheService.js
const redis = require('../config/redis');

class CacheService {
  constructor() {
    this.defaultTTL = 3600; // 1 hour in seconds
    this.keyPrefix = 'hackmates:';
  }

  // Generate cache key with prefix
  generateKey(key) {
    return `${this.keyPrefix}${key}`;
  }

  // Set cache with TTL
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const cacheKey = this.generateKey(key);
      const serializedValue = JSON.stringify(value);
      
      if (ttl > 0) {
        await redis.setEx(cacheKey, ttl, serializedValue);
      } else {
        await redis.set(cacheKey, serializedValue);
      }
      
      console.log(`Cache set: ${cacheKey}`);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Get cache value
  async get(key) {
    try {
      const cacheKey = this.generateKey(key);
      const cachedValue = await redis.get(cacheKey);
      
      if (cachedValue) {
        console.log(`Cache hit: ${cacheKey}`);
        return JSON.parse(cachedValue);
      }
      
      console.log(`Cache miss: ${cacheKey}`);
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Delete cache key
  async del(key) {
    try {
      const cacheKey = this.generateKey(key);
      const result = await redis.del(cacheKey);
      console.log(`Cache deleted: ${cacheKey}`);
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      const cacheKey = this.generateKey(key);
      const result = await redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Get TTL for a key
  async ttl(key) {
    try {
      const cacheKey = this.generateKey(key);
      return await redis.ttl(cacheKey);
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  }

  // Increment counter
  async incr(key, ttl = this.defaultTTL) {
    try {
      const cacheKey = this.generateKey(key);
      const result = await redis.incr(cacheKey);
      
      if (result === 1 && ttl > 0) {
        await redis.expire(cacheKey, ttl);
      }
      
      return result;
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  // Set with expiration
  async setEx(key, ttl, value) {
    return await this.set(key, value, ttl);
  }

  // Hash operations
  async hSet(key, field, value) {
    try {
      const cacheKey = this.generateKey(key);
      const serializedValue = JSON.stringify(value);
      await redis.hSet(cacheKey, field, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache hSet error:', error);
      return false;
    }
  }

  async hGet(key, field) {
    try {
      const cacheKey = this.generateKey(key);
      const value = await redis.hGet(cacheKey, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache hGet error:', error);
      return null;
    }
  }

  async hGetAll(key) {
    try {
      const cacheKey = this.generateKey(key);
      const hash = await redis.hGetAll(cacheKey);
      
      const parsed = {};
      for (const [field, value] of Object.entries(hash)) {
        try {
          parsed[field] = JSON.parse(value);
        } catch {
          parsed[field] = value;
        }
      }
      
      return parsed;
    } catch (error) {
      console.error('Cache hGetAll error:', error);
      return {};
    }
  }

  // List operations
  async lPush(key, value) {
    try {
      const cacheKey = this.generateKey(key);
      const serializedValue = JSON.stringify(value);
      return await redis.lPush(cacheKey, serializedValue);
    } catch (error) {
      console.error('Cache lPush error:', error);
      return 0;
    }
  }

  async lRange(key, start = 0, stop = -1) {
    try {
      const cacheKey = this.generateKey(key);
      const values = await redis.lRange(cacheKey, start, stop);
      return values.map(value => {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });
    } catch (error) {
      console.error('Cache lRange error:', error);
      return [];
    }
  }

  // Set operations
  async sAdd(key, member) {
    try {
      const cacheKey = this.generateKey(key);
      const serializedMember = JSON.stringify(member);
      return await redis.sAdd(cacheKey, serializedMember);
    } catch (error) {
      console.error('Cache sAdd error:', error);
      return 0;
    }
  }

  async sMembers(key) {
    try {
      const cacheKey = this.generateKey(key);
      const members = await redis.sMembers(cacheKey);
      return members.map(member => {
        try {
          return JSON.parse(member);
        } catch {
          return member;
        }
      });
    } catch (error) {
      console.error('Cache sMembers error:', error);
      return [];
    }
  }

  // Utility methods for common patterns

  // Cache user data
  async cacheUser(userId, userData, ttl = 1800) { // 30 minutes
    return await this.set(`user:${userId}`, userData, ttl);
  }

  async getCachedUser(userId) {
    return await this.get(`user:${userId}`);
  }

  // Cache user sessions
  async cacheUserSession(sessionId, sessionData, ttl = 86400) { // 24 hours
    return await this.set(`session:${sessionId}`, sessionData, ttl);
  }

  async getCachedUserSession(sessionId) {
    return await this.get(`session:${sessionId}`);
  }

  async deleteCachedUserSession(sessionId) {
    return await this.del(`session:${sessionId}`);
  }

  // Cache user matches
  async cacheUserMatches(cacheKey, matches, ttl = 3600) { // 1 hour
    return await this.set(cacheKey, matches, ttl);
  }

  async getCachedMatches(cacheKey) {
    return await this.get(cacheKey);
  }

  // Cache hackathon data
  async cacheHackathon(hackathonId, hackathonData, ttl = 1800) { // 30 minutes
    return await this.set(`hackathon:${hackathonId}`, hackathonData, ttl);
  }

  async getCachedHackathon(hackathonId) {
    return await this.get(`hackathon:${hackathonId}`);
  }

  // Cache hackathon list
  async cacheHackathonList(filters, hackathons, ttl = 900) { // 15 minutes
    const filterKey = this.generateFilterKey(filters);
    return await this.set(`hackathons:${filterKey}`, hackathons, ttl);
  }

  async getCachedHackathonList(filters) {
    const filterKey = this.generateFilterKey(filters);
    return await this.get(`hackathons:${filterKey}`);
  }

  // Cache team data
  async cacheTeam(teamId, teamData, ttl = 1800) { // 30 minutes
    return await this.set(`team:${teamId}`, teamData, ttl);
  }

  async getCachedTeam(teamId) {
    return await this.get(`team:${teamId}`);
  }

  // Cache user profile
  async cacheProfile(userId, profileData, ttl = 3600) { // 1 hour
    return await this.set(`profile:${userId}`, profileData, ttl);
  }

  async getCachedProfile(userId) {
    return await this.get(`profile:${userId}`);
  }

  // Rate limiting
  async checkRateLimit(identifier, limit, windowSeconds) {
    try {
      const key = `ratelimit:${identifier}`;
      const current = await this.incr(key, windowSeconds);
      
      return {
        allowed: current <= limit,
        current,
        limit,
        resetTime: Date.now() + (windowSeconds * 1000)
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true, current: 0, limit, resetTime: Date.now() };
    }
  }

  // Cache API responses
  async cacheAPIResponse(endpoint, params, response, ttl = 600) { // 10 minutes
    const key = `api:${endpoint}:${this.generateFilterKey(params)}`;
    return await this.set(key, response, ttl);
  }

  async getCachedAPIResponse(endpoint, params) {
    const key = `api:${endpoint}:${this.generateFilterKey(params)}`;
    return await this.get(key);
  }

  // Invalidate related caches
  async invalidateUserCache(userId) {
    const patterns = [
      `user:${userId}`,
      `profile:${userId}`,
      `matches:${userId}:*`
    ];
    
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        const keys = await this.getKeysByPattern(pattern);
        for (const key of keys) {
          await this.del(key.replace(this.keyPrefix, ''));
        }
      } else {
        await this.del(pattern);
      }
    }
  }

  async invalidateHackathonCache(hackathonId) {
    await this.del(`hackathon:${hackathonId}`);
    // Also invalidate hackathon lists
    const keys = await this.getKeysByPattern('hackathons:*');
    for (const key of keys) {
      await this.del(key.replace(this.keyPrefix, ''));
    }
  }

  async invalidateTeamCache(teamId) {
    await this.del(`team:${teamId}`);
  }

  // Helper method to get keys by pattern
  async getKeysByPattern(pattern) {
    try {
      const fullPattern = this.generateKey(pattern);
      const keys = await redis.keys(fullPattern);
      return keys;
    } catch (error) {
      console.error('Get keys by pattern error:', error);
      return [];
    }
  }

  // Generate a consistent key from filter object
  generateFilterKey(filters) {
    if (!filters || typeof filters !== 'object') return 'default';
    
    const sortedKeys = Object.keys(filters).sort();
    const keyParts = sortedKeys.map(key => `${key}:${filters[key]}`);
    return keyParts.join('|');
  }

  // Cache statistics
  async getCacheStats() {
    try {
      const info = await redis.info('memory');
      const keyspace = await redis.info('keyspace');
      
      return {
        memory: info.split('\n').filter(line => line.includes('used_memory_human'))[0],
        keyspace: keyspace.split('\n').filter(line => line.includes('db0'))[0],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { error: 'Unable to retrieve cache stats' };
    }
  }

  // Clear all cache (use with caution)
  async flushAll() {
    try {
      await redis.flushAll();
      console.log('All cache cleared');
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  // Close Redis connection
  async close() {
    try {
      await redis.quit();
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Redis close error:', error);
    }
  }
}

module.exports = new CacheService();