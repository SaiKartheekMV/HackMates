// workers/matchUpdater.js
const cron = require('node-cron');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Match = require('../models/Match');
const Hackathon = require('../models/Hackathon');
const aiService = require('../services/aiService');
const matchmakingService = require('../services/matchmakingService');
const cacheService = require('../services/cacheService');

class MatchUpdater {
  constructor() {
    this.isRunning = false;
    this.setupScheduledJobs();
  }

  setupScheduledJobs() {
    // Run match updates every 2 hours during active hours
    cron.schedule('0 */2 6-22 * * *', async () => {
      console.log('🔄 Starting scheduled match update...');
      await this.updateAllMatches();
    });

    // Daily cleanup of expired matches at midnight
    cron.schedule('0 0 * * *', async () => {
      console.log('🧹 Starting daily match cleanup...');
      await this.cleanupExpiredMatches();
    });

    // Weekly recalculation of all embeddings (Sunday at 2 AM)
    cron.schedule('0 2 * * 0', async () => {
      console.log('📊 Starting weekly embedding recalculation...');
      await this.recalculateAllEmbeddings();
    });

    console.log('⏰ Match updater scheduled jobs initialized');
  }

  async updateAllMatches() {
    if (this.isRunning) {
      console.log('⚠️ Match update already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // Get all active hackathons
      const activeHackathons = await Hackathon.find({
        status: { $in: ['upcoming', 'ongoing'] },
        registrationDeadline: { $gte: new Date() }
      }).select('_id title');

      console.log(`📋 Found ${activeHackathons.length} active hackathons`);

      // Get all users with complete profiles
      const users = await this.getActiveUsers();
      console.log(`👥 Processing ${users.length} active users`);

      let totalMatches = 0;
      let processedUsers = 0;

      // Process users in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (user) => {
          try {
            const matchCount = await this.updateUserMatches(user, activeHackathons);
            totalMatches += matchCount;
            processedUsers++;
            
            if (processedUsers % 50 === 0) {
              console.log(`✅ Processed ${processedUsers}/${users.length} users`);
            }
          } catch (error) {
            console.error(`❌ Error updating matches for user ${user._id}:`, error.message);
          }
        });

        await Promise.all(batchPromises);
        
        // Small delay between batches to prevent overload
        await this.delay(100);
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`🎉 Match update completed! Processed ${processedUsers} users, generated ${totalMatches} matches in ${duration}s`);

    } catch (error) {
      console.error('💥 Match update failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async getActiveUsers() {
    return await User.aggregate([
      {
        $lookup: {
          from: 'profiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      {
        $match: {
          'profile.0': { $exists: true },
          'profile.completionScore': { $gte: 50 },
          'profile.aiEmbedding': { $exists: true, $ne: [] },
          isEmailVerified: true,
          updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Active in last 30 days
        }
      },
      {
        $project: {
          _id: 1,
          email: 1,
          firstName: 1,
          lastName: 1,
          'profile.skills': 1,
          'profile.aiEmbedding': 1,
          'profile.location': 1,
          'profile.completionScore': 1
        }
      }
    ]);
  }

  async updateUserMatches(user, hackathons) {
    let totalMatches = 0;

    for (const hackathon of hackathons) {
      try {
        // Get existing matches for this user-hackathon combination
        const existingMatches = await Match.find({
          userId: user._id,
          hackathonId: hackathon._id,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Less than 24 hours old
        });

        // Skip if we have recent matches
        if (existingMatches.length > 0) {
          continue;
        }

        // Find potential matches using AI service
        const potentialMatches = await aiService.findMatches(
          user.profile[0].aiEmbedding,
          hackathon._id.toString(),
          20 // Get more candidates for better filtering
        );

        if (!potentialMatches || potentialMatches.length === 0) {
          continue;
        }

        // Filter and rank matches
        const rankedMatches = await this.filterAndRankMatches(
          user,
          potentialMatches,
          hackathon._id
        );

        // Save top matches
        const topMatches = rankedMatches.slice(0, 10);
        if (topMatches.length > 0) {
          await this.saveMatches(user._id, hackathon._id, topMatches);
          totalMatches += topMatches.length;

          // Update cache
          await cacheService.cacheUserMatches(
            user._id.toString(),
            topMatches,
            3600 // 1 hour TTL
          );
        }

      } catch (error) {
        console.error(`Error updating matches for user ${user._id} in hackathon ${hackathon._id}:`, error.message);
      }
    }

    return totalMatches;
  }

  async filterAndRankMatches(user, potentialMatches, hackathonId) {
    const userProfile = user.profile[0];
    const rankedMatches = [];

    for (const match of potentialMatches) {
      try {
        // Get full profile of potential match
        const matchProfile = await Profile.findOne({ userId: match.userId })
          .populate('userId', 'firstName lastName profilePicture');

        if (!matchProfile || !matchProfile.userId) {
          continue;
        }

        // Skip self-matches
        if (matchProfile.userId._id.toString() === user._id.toString()) {
          continue;
        }

        // Calculate compatibility score
        const compatibilityScore = await matchmakingService.calculateCompatibility(
          userProfile,
          matchProfile
        );

        // Calculate location bonus
        const locationBonus = this.calculateLocationBonus(
          userProfile.location,
          matchProfile.location
        );

        // Calculate skill complementarity
        const skillScore = this.calculateSkillComplementarity(
          userProfile.skills || [],
          matchProfile.skills || []
        );

        // Final score calculation
        const finalScore = (
          compatibilityScore * 0.5 +
          match.similarity * 0.3 +
          locationBonus * 0.1 +
          skillScore * 0.1
        );

        rankedMatches.push({
          userId: matchProfile.userId._id,
          profile: {
            firstName: matchProfile.userId.firstName,
            lastName: matchProfile.userId.lastName,
            profilePicture: matchProfile.userId.profilePicture,
            bio: matchProfile.bio,
            skills: matchProfile.skills,
            location: matchProfile.location,
            completionScore: matchProfile.completionScore
          },
          compatibilityScore: Math.round(compatibilityScore * 100) / 100,
          aiSimilarity: Math.round(match.similarity * 100) / 100,
          finalScore: Math.round(finalScore * 100) / 100,
          reasons: this.generateMatchReasons(userProfile, matchProfile),
          createdAt: new Date()
        });

      } catch (error) {
        console.error(`Error processing match candidate ${match.userId}:`, error.message);
      }
    }

    // Sort by final score descending
    return rankedMatches.sort((a, b) => b.finalScore - a.finalScore);
  }

  calculateLocationBonus(loc1, loc2) {
    if (!loc1 || !loc2) return 0;
    
    if (loc1.city === loc2.city) return 1.0;
    if (loc1.country === loc2.country) return 0.5;
    return 0;
  }

  calculateSkillComplementarity(skills1, skills2) {
    if (!skills1 || !skills2 || skills1.length === 0 || skills2.length === 0) {
      return 0;
    }

    const set1 = new Set(skills1.map(s => s.toLowerCase()));
    const set2 = new Set(skills2.map(s => s.toLowerCase()));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    // Jaccard similarity
    return intersection.size / union.size;
  }

  generateMatchReasons(userProfile, matchProfile) {
    const reasons = [];
    
    // Skill overlap
    const userSkills = new Set((userProfile.skills || []).map(s => s.toLowerCase()));
    const matchSkills = new Set((matchProfile.skills || []).map(s => s.toLowerCase()));
    const commonSkills = [...userSkills].filter(x => matchSkills.has(x));
    
    if (commonSkills.length > 0) {
      reasons.push(`Shared skills: ${commonSkills.slice(0, 3).join(', ')}`);
    }

    // Complementary skills
    const uniqueMatchSkills = [...matchSkills].filter(x => !userSkills.has(x));
    if (uniqueMatchSkills.length > 0) {
      reasons.push(`Complementary skills: ${uniqueMatchSkills.slice(0, 2).join(', ')}`);
    }

    // Location
    if (userProfile.location && matchProfile.location) {
      if (userProfile.location.city === matchProfile.location.city) {
        reasons.push(`Same city: ${userProfile.location.city}`);
      } else if (userProfile.location.country === matchProfile.location.country) {
        reasons.push(`Same country: ${userProfile.location.country}`);
      }
    }

    // Experience level
    const userExpLevel = (userProfile.experience || []).length;
    const matchExpLevel = (matchProfile.experience || []).length;
    if (Math.abs(userExpLevel - matchExpLevel) <= 1) {
      reasons.push('Similar experience level');
    }

    return reasons.slice(0, 3); // Top 3 reasons
  }

  async saveMatches(userId, hackathonId, matches) {
    try {
      // Remove old matches for this user-hackathon combination
      await Match.deleteMany({
        userId,
        hackathonId,
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      // Create new match document
      const matchDoc = new Match({
        userId,
        hackathonId,
        matches,
        generatedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire in 7 days
      });

      await matchDoc.save();
    } catch (error) {
      console.error(`Error saving matches for user ${userId}:`, error.message);
      throw error;
    }
  }

  async cleanupExpiredMatches() {
    try {
      const result = await Match.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} expired matches`);
    } catch (error) {
      console.error('Error cleaning up expired matches:', error);
    }
  }

  async recalculateAllEmbeddings() {
    try {
      const profiles = await Profile.find({
        completionScore: { $gte: 50 },
        $or: [
          { aiEmbedding: { $exists: false } },
          { aiEmbedding: [] },
          { updatedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        ]
      }).limit(100); // Process 100 profiles per week

      console.log(`🔄 Recalculating embeddings for ${profiles.length} profiles`);

      for (const profile of profiles) {
        try {
          const embedding = await aiService.generateEmbedding({
            skills: profile.skills,
            experience: profile.experience,
            projects: profile.projects
          });

          await Profile.findByIdAndUpdate(profile._id, {
            aiEmbedding: embedding,
            updatedAt: new Date()
          });

          // Invalidate cached matches for this user
          await cacheService.invalidateUserCache(profile.userId.toString());

        } catch (error) {
          console.error(`Error recalculating embedding for profile ${profile._id}:`, error.message);
        }
      }

      console.log(`✅ Completed embedding recalculation for ${profiles.length} profiles`);
    } catch (error) {
      console.error('Error in embedding recalculation:', error);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async forceUpdateUser(userId) {
    try {
      const user = await User.findById(userId).populate('profile');
      if (!user || !user.profile) {
        throw new Error('User or profile not found');
      }

      const activeHackathons = await Hackathon.find({
        status: { $in: ['upcoming', 'ongoing'] },
        registrationDeadline: { $gte: new Date() }
      }).select('_id title');

      const matchCount = await this.updateUserMatches(user, activeHackathons);
      console.log(`✅ Force updated matches for user ${userId}: ${matchCount} matches generated`);
      
      return matchCount;
    } catch (error) {
      console.error(`Error force updating user ${userId}:`, error);
      throw error;
    }
  }

  getStatus() {
  return {
    isRunning: this.isRunning,
    scheduledJobs: {
      matchUpdates: 'Every 2 hours (6 AM - 10 PM)',
      dailyCleanup: 'Daily at midnight', 
      weeklyEmbeddings: 'Sundays at 2 AM'
    },
    status: 'Active'
  };
}

   start() {
    console.log('🚀 MatchUpdater started successfully');
    console.log(`📊 Status: ${JSON.stringify(this.getStatus())}`);
    return this;
  }

   
}

module.exports = new MatchUpdater();