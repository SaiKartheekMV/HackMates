// src/workers/resumeProcessor.js
// ==============================================

const Queue = require('bull');
const Profile = require('../models/Profile');
const aiService = require('../services/aiService');
const cacheService = require('../services/cacheService');
const { calculateCompletionScore } = require('../utils/helpers');
const { QUEUE_JOBS } = require('../utils/constants');

// Create resume processing queue
const resumeQueue = new Queue('resume processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
});

/**
 * Process resume parsing job
 */
resumeQueue.process(QUEUE_JOBS.RESUME_PROCESSING, async (job) => {
  const { userId, resumeUrl, resumeBuffer } = job.data;
  
  try {
    console.log(`Processing resume for user ${userId}`);
    
    // Update job progress
    job.progress(10);
    
    // Parse resume using AI service
    const parsedData = await aiService.parseResume(resumeBuffer || resumeUrl);
    job.progress(40);
    
    // Extract and clean data
    const cleanedData = {
      skills: parsedData.skills?.filter(skill => skill.trim()) || [],
      experience: parsedData.experience?.map(exp => ({
        title: exp.title?.trim() || '',
        company: exp.company?.trim() || '',
        duration: exp.duration?.trim() || '',
        description: exp.description?.trim() || ''
      })) || [],
      education: parsedData.education?.map(edu => ({
        degree: edu.degree?.trim() || '',
        institution: edu.institution?.trim() || '',
        year: edu.year || null
      })) || [],
      projects: parsedData.projects?.map(proj => ({
        name: proj.name?.trim() || '',
        description: proj.description?.trim() || '',
        technologies: proj.technologies?.filter(tech => tech.trim()) || [],
        githubUrl: proj.githubUrl?.trim() || '',
        liveUrl: proj.liveUrl?.trim() || ''
      })) || []
    };
    
    job.progress(60);
    
    // Generate AI embedding for the profile
    const embedding = await aiService.generateEmbedding({
      skills: cleanedData.skills,
      experience: cleanedData.experience,
      projects: cleanedData.projects
    });
    
    job.progress(80);
    
    // Calculate completion score
    const completionScore = calculateCompletionScore(cleanedData);
    
    // Update user profile in database
    const updatedProfile = await Profile.findOneAndUpdate(
      { userId },
      {
        $set: {
          ...cleanedData,
          aiEmbedding: embedding,
          completionScore,
          resumeUrl: resumeUrl || null,
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );
    
    job.progress(90);
    
    // Clear cached profile data
    await cacheService.invalidateUserCache(userId);
    
    // Trigger match updates for this user
    await matchUpdateQueue.add(QUEUE_JOBS.MATCH_UPDATE, {
      userId,
      reason: 'resume_updated'
    }, {
      delay: 5000, // 5 second delay
      attempts: 3
    });
    
    job.progress(100);
    
    console.log(`Resume processing completed for user ${userId}`);
    
    return {
      success: true,
      profileId: updatedProfile._id,
      completionScore,
      skillsCount: cleanedData.skills.length,
      experienceCount: cleanedData.experience.length
    };
    
  } catch (error) {
    console.error(`Resume processing failed for user ${userId}:`, error);
    
    // Log error to database or monitoring service
    await logProcessingError(userId, 'resume_processing', error);
    
    throw error;
  }
});

/**
 * Add resume processing job to queue
 */
const processResume = async (userId, resumeData) => {
  try {
    const job = await resumeQueue.add(QUEUE_JOBS.RESUME_PROCESSING, {
      userId,
      ...resumeData
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: 10,
      removeOnFail: 5
    });
    
    return job;
  } catch (error) {
    console.error('Failed to add resume processing job:', error);
    throw error;
  }
};

/**
 * Get job status
 */
const getJobStatus = async (jobId) => {
  try {
    const job = await resumeQueue.getJob(jobId);
    if (!job) return null;
    
    const state = await job.getState();
    const progress = job.progress();
    
    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : null,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : null,
      error: job.failedReason || null
    };
  } catch (error) {
    console.error('Failed to get job status:', error);
    return null;
  }
};

/**
 * Log processing errors
 */
const logProcessingError = async (userId, jobType, error) => {
  try {
    // You can implement error logging to database or external service
    console.error(`Job ${jobType} failed for user ${userId}:`, {
      error: error.message,
      stack: error.stack,
      timestamp: new Date()
    });
  } catch (logError) {
    console.error('Failed to log processing error:', logError);
  }
};

// Queue event handlers
resumeQueue.on('completed', (job, result) => {
  console.log(`Resume processing job ${job.id} completed:`, result);
});

resumeQueue.on('failed', (job, err) => {
  console.error(`Resume processing job ${job.id} failed:`, err);
});

resumeQueue.on('stalled', (job) => {
  console.warn(`Resume processing job ${job.id} stalled`);
});

// Create match update queue (used by resume processor)
const matchUpdateQueue = new Queue('match update', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD
  }
});

module.exports = {
  resumeQueue,
  processResume,
  getJobStatus
};