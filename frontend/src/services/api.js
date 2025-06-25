import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData)
};

// User API calls
export const userAPI = {
  getCurrentUser: () => api.get('/users/me'),
  updateCurrentUser: (userData) => api.put('/users/me', userData),
  deleteCurrentUser: () => api.delete('/users/me')
};

// Profile API calls
export const profileAPI = {
  getMyProfile: () => api.get('/profiles/me'),
  
  updateMyProfile: (profileData) => api.put('/profiles/me', profileData),
  
  // New method specifically for profile setup
  setupProfile: (formData) => api.put('/profiles/me', formData),
  
  uploadResume: (formData) => api.post('/profiles/me/upload-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  calculateCompletion: () => api.post('/profiles/me/calculate-completion'),
  
  getPublicProfile: (userId) => api.get(`/profiles/${userId}`),
  
  // Search profiles with additional filters
  searchProfiles: (filters) => {
    const params = new URLSearchParams();
    if (filters.skills) params.append('skills', filters.skills.join(','));
    if (filters.location) params.append('location', filters.location);
    if (filters.roles) params.append('roles', filters.roles.join(','));
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    return api.get(`/profiles/search?${params.toString()}`);
  }
};

// Hackathon API calls
export const hackathonAPI = {
   getHackathons: async (params = {}) => {
    try {
      const response = await api.get('/hackathons', { params });
      return {
        data: response.data.data.hackathons || [], // Extract the hackathons array
        pagination: response.data.data.pagination
      };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  getHackathon: (id) => api.get(`/hackathons/${id}`),
  getHackathonTeams: (id) => api.get(`/hackathons/${id}/teams`),
  createHackathon: (hackathonData) => api.post('/hackathons', hackathonData),
  updateHackathon: (id, hackathonData) => api.put(`/hackathons/${id}`, hackathonData),
  deleteHackathon: (id) => api.delete(`/hackathons/${id}`)
};

// Matchmaking API calls
export const matchmakingAPI = {
  getSuggestions: (params) => api.get('/matchmaking/suggestions', { params }),
  checkCompatibility: (userId) => api.get(`/matchmaking/compatibility/${userId}`),
  submitFeedback: (feedbackData) => api.post('/matchmaking/feedback', feedbackData),
  getMatchHistory: () => api.get('/matchmaking/history')
};

// Team API calls
export const teamAPI = {
  // Create a new team - matches POST /api/teams
  createTeam: async (teamData) => {
    try {
      // Validate data before sending
      const validation = teamAPI.validateTeamData(teamData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      console.log('Sending team data:', teamData);
      
      // Clean the data before sending
      const cleanTeamData = {
        ...teamData,
        name: teamData.name?.trim(),
        description: teamData.description?.trim(),
        // Ensure arrays are properly formatted
        requiredSkills: teamData.requiredSkills || [],
        preferredRoles: teamData.preferredRoles || [],
        tags: teamData.tags || [],
        // Ensure maxMembers is a number
        maxMembers: teamData.maxMembers ? parseInt(teamData.maxMembers) : 4
      };

      const response = await api.post('/teams', cleanTeamData);
      return {
        success: true,
        data: response.data.team || response.data.data?.team || response.data
      };
    } catch (error) {
      console.error('API Error (createTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Request data that caused error:', teamData);
      
      // More detailed error handling
      if (error.response?.status === 500) {
        console.error('Server Error - Check backend logs for details');
        throw new Error('Server error occurred. Please try again or contact support.');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Invalid team data';
        const validationErrors = error.response.data?.errors;
        if (validationErrors && Array.isArray(validationErrors)) {
          throw new Error(`Validation failed: ${validationErrors.map(err => err.msg || err.message || err).join(', ')}`);
        }
        throw new Error(errorMessage);
      } else if (error.response?.status === 401) {
        throw new Error('You must be logged in to create a team');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to create a team');
      }
      
      throw error;
    }
  },

  // Get current user's teams - matches GET /api/teams/my
  getMyTeams: async (params = {}) => {
    try {
      // Clean params to match backend validation
      const cleanParams = {};
      
      if (params.status && ['forming', 'complete', 'competing', 'finished', 'disbanded'].includes(params.status)) {
        cleanParams.status = params.status;
      }
      
      if (params.hackathonId && params.hackathonId.match(/^[0-9a-fA-F]{24}$/)) {
        cleanParams.hackathonId = params.hackathonId;
      }
      
      const response = await api.get('/teams/my', { params: cleanParams });
      return {
        success: true,
        data: response.data.teams || response.data.data?.teams || response.data
      };
    } catch (error) {
      console.error('API Error (getMyTeams):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Get team by ID - matches GET /api/teams/:teamId
  getTeamById: async (teamId, params = {}) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      
      // Clean params
      const cleanParams = {};
      if (params.detailed !== undefined) {
        cleanParams.detailed = params.detailed === true || params.detailed === 'true';
      }
      
      const response = await api.get(`/teams/${teamId}`, { params: cleanParams });
      return {
        success: true,
        data: response.data.team || response.data.data?.team || response.data
      };
    } catch (error) {
      console.error('API Error (getTeamById):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Update team - matches PUT /api/teams/:teamId
  updateTeam: async (teamId, teamData) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      
      // Clean the data before sending - only include fields that can be updated
      const cleanTeamData = {};
      
      if (teamData.name !== undefined) {
        cleanTeamData.name = teamData.name?.trim();
      }
      if (teamData.description !== undefined) {
        cleanTeamData.description = teamData.description?.trim();
      }
      if (teamData.maxMembers !== undefined) {
        cleanTeamData.maxMembers = parseInt(teamData.maxMembers);
      }
      
      // Include other updatable fields if they exist
      if (teamData.requiredSkills !== undefined) {
        cleanTeamData.requiredSkills = teamData.requiredSkills || [];
      }
      if (teamData.preferredRoles !== undefined) {
        cleanTeamData.preferredRoles = teamData.preferredRoles || [];
      }
      if (teamData.tags !== undefined) {
        cleanTeamData.tags = teamData.tags || [];
      }
      if (teamData.project !== undefined) {
        cleanTeamData.project = teamData.project;
      }
      if (teamData.communication !== undefined) {
        cleanTeamData.communication = teamData.communication;
      }
      if (teamData.settings !== undefined) {
        cleanTeamData.settings = teamData.settings;
      }
      if (teamData.location !== undefined) {
        cleanTeamData.location = teamData.location;
      }

      console.log('Updating team with data:', cleanTeamData);
      const response = await api.put(`/teams/${teamId}`, cleanTeamData);
      return {
        success: true,
        data: response.data.team || response.data.data?.team || response.data
      };
    } catch (error) {
      console.error('API Error (updateTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid update data';
        const validationErrors = error.response.data?.errors;
        if (validationErrors && Array.isArray(validationErrors)) {
          throw new Error(`Validation failed: ${validationErrors.map(err => err.msg || err.message || err).join(', ')}`);
        }
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },

  // Delete/disband team - matches DELETE /api/teams/:teamId
  deleteTeam: async (teamId) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.delete(`/teams/${teamId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (deleteTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Join team - matches POST /api/teams/:teamId/join
  joinTeam: async (teamId, joinData = {}) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      
      // Clean join data
      const cleanJoinData = {};
      
      if (joinData.role && ['developer', 'designer', 'data_scientist', 'product_manager', 'marketing', 'other'].includes(joinData.role)) {
        cleanJoinData.role = joinData.role;
      }
      
      if (joinData.message && joinData.message.trim()) {
        cleanJoinData.message = joinData.message.trim();
      }
      
      const response = await api.post(`/teams/${teamId}/join`, cleanJoinData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (joinTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Leave team - matches POST /api/teams/:teamId/leave
  leaveTeam: async (teamId, leaveData = {}) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      
      // Clean leave data
      const cleanLeaveData = {};
      
      if (leaveData.transferTo && leaveData.transferTo.match(/^[0-9a-fA-F]{24}$/)) {
        cleanLeaveData.transferTo = leaveData.transferTo;
      }
      
      const response = await api.post(`/teams/${teamId}/leave`, cleanLeaveData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (leaveTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Invite user to team - matches POST /api/teams/:teamId/invite
  inviteToTeam: async (teamId, inviteData) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      
      if (!inviteData.userId || !inviteData.userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid user ID format');
      }
      
      // Clean invite data
      const cleanInviteData = {
        userId: inviteData.userId
      };
      
      if (inviteData.role && ['developer', 'designer', 'data_scientist', 'product_manager', 'marketing', 'other'].includes(inviteData.role)) {
        cleanInviteData.role = inviteData.role;
      }
      
      if (inviteData.message && inviteData.message.trim()) {
        cleanInviteData.message = inviteData.message.trim();
      }
      
      const response = await api.post(`/teams/${teamId}/invite`, cleanInviteData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (inviteToTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Remove/kick team member - matches DELETE /api/teams/:teamId/members/:userId
  removeMember: async (teamId, userId, kickData = {}) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid user ID format');
      }
      
      // Clean kick data
      const cleanKickData = {};
      if (kickData.reason && kickData.reason.trim()) {
        cleanKickData.reason = kickData.reason.trim();
      }
      
      const response = await api.delete(`/teams/${teamId}/members/${userId}`, { 
        data: cleanKickData 
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (removeMember):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Transfer team leadership - matches POST /api/teams/:teamId/transfer-leadership
  transferLeadership: async (teamId, transferData) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      
      if (!transferData.newLeaderId || !transferData.newLeaderId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid new leader ID format');
      }
      
      const cleanTransferData = {
        newLeaderId: transferData.newLeaderId
      };
      
      const response = await api.post(`/teams/${teamId}/transfer-leadership`, cleanTransferData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (transferLeadership):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Update member permissions - matches PUT /api/teams/:teamId/members/:userId/permissions
  updateMemberPermissions: async (teamId, userId, permissionsData) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid user ID format');
      }
      
      // Clean permissions data
      const cleanPermissionsData = {
        permissions: {}
      };
      
      if (permissionsData.permissions) {
        if (permissionsData.permissions.canInvite !== undefined) {
          cleanPermissionsData.permissions.canInvite = Boolean(permissionsData.permissions.canInvite);
        }
        if (permissionsData.permissions.canKick !== undefined) {
          cleanPermissionsData.permissions.canKick = Boolean(permissionsData.permissions.canKick);
        }
        if (permissionsData.permissions.canEditTeam !== undefined) {
          cleanPermissionsData.permissions.canEditTeam = Boolean(permissionsData.permissions.canEditTeam);
        }
      }
      
      const response = await api.put(`/teams/${teamId}/members/${userId}/permissions`, cleanPermissionsData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (updateMemberPermissions):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Get teams for a specific hackathon - matches GET /api/teams/hackathon/:hackathonId
  getHackathonTeams: async (hackathonId, params = {}) => {
    try {
      if (!hackathonId || !hackathonId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid hackathon ID format');
      }
      
      // Clean and validate parameters according to backend validation
      const cleanParams = {};
      
      // Pagination parameters
      if (params.page) {
        const page = parseInt(params.page);
        if (page >= 1) cleanParams.page = page;
      }
      
      if (params.limit) {
        const limit = parseInt(params.limit);
        if (limit >= 1 && limit <= 50) cleanParams.limit = limit;
      }
      
      // Sort parameter
      if (params.sortBy && ['lastActivity', 'newest', 'oldest', 'mostViewed', 'teamSize'].includes(params.sortBy)) {
        cleanParams.sortBy = params.sortBy;
      }
      
      // Status filter
      if (params.status && ['forming', 'complete', 'competing', 'finished'].includes(params.status)) {
        cleanParams.status = params.status;
      }
      
      // Skills filter (comma-separated string)
      if (params.skills && typeof params.skills === 'string' && params.skills.trim()) {
        cleanParams.skills = params.skills.trim();
      }
      
      // Boolean filters
      if (params.hasOpenings !== undefined && params.hasOpenings !== '') {
        cleanParams.hasOpenings = params.hasOpenings === true || params.hasOpenings === 'true';
      }
      
      // Location filter
      if (params.location && ['remote', 'hybrid', 'in_person'].includes(params.location)) {
        cleanParams.location = params.location;
      }
      
      // Search query
      if (params.search && typeof params.search === 'string' && params.search.trim().length >= 2) {
        cleanParams.search = params.search.trim();
      }
      
      console.log('Requesting hackathon teams with params:', cleanParams);
      const response = await api.get(`/teams/hackathon/${hackathonId}`, { params: cleanParams });
      return {
        success: true,
        data: response.data.teams || response.data.data?.teams || response.data,
        pagination: response.data.pagination || response.data.data?.pagination,
        total: response.data.total || response.data.data?.total
      };
    } catch (error) {
      console.error('API Error (getHackathonTeams):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Request params that caused error:', params);
      
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid request parameters';
        const validationErrors = error.response.data?.errors;
        if (validationErrors && Array.isArray(validationErrors)) {
          throw new Error(`Validation failed: ${validationErrors.map(err => err.msg || err.message || err).join(', ')}`);
        }
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },

  // Get team recommendations - matches GET /api/teams/recommendations/:hackathonId
getTeamRecommendations: async (hackathonId, params = {}) => {
  try {
    // Validate hackathonId before making request
    if (!hackathonId) {
      throw new Error('Hackathon ID is required');
    }
    
    if (!hackathonId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new Error('Invalid hackathon ID format');
    }
    
    // Clean parameters for recommendations
    const cleanParams = {};
    
    if (params.limit) {
      const limit = parseInt(params.limit);
      if (limit >= 1 && limit <= 20) {
        cleanParams.limit = limit;
      }
    }
    
    console.log('Requesting team recommendations with params:', {
      hackathonId,
      cleanParams
    });
    
    const response = await api.get(`/teams/recommendations/${hackathonId}`, { 
      params: cleanParams,
      timeout: 10000 // 10 second timeout
    });
    
    console.log('API Response:', response.data);
    
    return {
      success: true,
      data: response.data.data?.recommendations || 
            response.data.recommendations || 
            response.data.teams || 
            response.data.data?.teams || 
            response.data.data || 
            []
    };
    
  } catch (error) {
    console.error('API Error (getTeamRecommendations):', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Request params that caused error:', params);
    console.error('Hackathon ID:', hackathonId);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      console.warn('User not authenticated');
      return {
        success: false,
        data: [],
        error: 'Please log in to get recommendations'
      };
    }
    
    if (error.response?.status === 400) {
      const message = error.response.data?.message || 'Bad request';
      console.warn('Bad request:', message);
      return {
        success: false,
        data: [],
        error: message
      };
    }
    
    // Handle 501 errors gracefully for recommendations (when method not implemented)
    if (error.response?.status === 501) {
      console.warn('Team recommendations service not implemented yet');
      return {
        success: false,
        data: [],
        error: 'Team recommendations not available yet'
      };
    }
    
    // Handle 503 errors (service unavailable)
    if (error.response?.status === 503) {
      console.warn('Team recommendations service unavailable');
      return {
        success: false,
        data: [],
        error: 'Team recommendation service is currently unavailable'
      };
    }
    
    // Handle 500 errors gracefully for recommendations
    if (error.response?.status === 500) {
      console.warn('Recommendations service temporarily unavailable');
      return {
        success: false,
        data: [],
        error: 'Recommendations temporarily unavailable'
      };
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        data: [],
        error: 'Request timed out. Please try again.'
      };
    }
    
    // For other errors, throw to be handled by the calling component
    throw error;
  }
},

  // Get team statistics - matches GET /api/teams/:teamId/stats
  getTeamStats: async (teamId) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.get(`/teams/${teamId}/stats`);
      return {
        success: true,
        data: response.data.stats || response.data.data?.stats || response.data
      };
    } catch (error) {
      console.error('API Error (getTeamStats):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Handle 501 errors gracefully for stats (when method not implemented)
      if (error.response?.status === 501) {
        console.warn('Team stats service not implemented yet');
        return {
          success: false,
          data: null,
          error: 'Team statistics not available yet'
        };
      }
      
      throw error;
    }
  },

  // Search teams within a hackathon - uses GET /api/teams/hackathon/:hackathonId with search params
  searchTeams: async (hackathonId, searchParams = {}) => {
    // This is just an alias for getHackathonTeams with search parameters
    return teamAPI.getHackathonTeams(hackathonId, searchParams);
  },

  // Validate team creation data before sending
  validateTeamData: (teamData) => {
    const errors = [];
    
    // Name validation
    if (!teamData.name || teamData.name.trim().length < 3 || teamData.name.trim().length > 100) {
      errors.push('Team name must be between 3 and 100 characters');
    }
    
    // Description validation
    if (!teamData.description || teamData.description.trim().length < 10 || teamData.description.trim().length > 1000) {
      errors.push('Description must be between 10 and 1000 characters');
    }
    
    // Hackathon ID validation
    if (!teamData.hackathonId || !teamData.hackathonId.match(/^[0-9a-fA-F]{24}$/)) {
      errors.push('Invalid hackathon ID');
    }
    
    // Max members validation
    if (teamData.maxMembers && (teamData.maxMembers < 2 || teamData.maxMembers > 10)) {
      errors.push('Team size must be between 2 and 10 members');
    }
    
    // Required skills validation
    if (teamData.requiredSkills && Array.isArray(teamData.requiredSkills)) {
      teamData.requiredSkills.forEach((skillObj, idx) => {
        if (!skillObj.skill || skillObj.skill.trim().length < 2 || skillObj.skill.trim().length > 50) {
          errors.push(`Skill ${idx + 1} name must be between 2 and 50 characters`);
        }
        if (skillObj.priority && !['low', 'medium', 'high', 'critical'].includes(skillObj.priority)) {
          errors.push(`Skill ${idx + 1} priority must be one of: low, medium, high, critical`);
        }
      });
    }
    
    // Preferred roles validation
    if (teamData.preferredRoles && Array.isArray(teamData.preferredRoles)) {
      const validRoles = ['developer', 'designer', 'data_scientist', 'product_manager', 'marketing', 'other'];
      teamData.preferredRoles.forEach((roleObj, idx) => {
        if (!validRoles.includes(roleObj.role)) {
          errors.push(`Role ${idx + 1} must be one of: ${validRoles.join(', ')}`);
        }
        if (roleObj.count && roleObj.count < 1) {
          errors.push(`Role ${idx + 1} count must be at least 1`);
        }
      });
    }
    
    // Project category validation
    if (teamData.project && teamData.project.category) {
      const validCategories = ['web', 'mobile', 'ai_ml', 'blockchain', 'iot', 'ar_vr', 'gaming', 'fintech', 'healthtech', 'edtech', 'other'];
      if (!validCategories.includes(teamData.project.category)) {
        errors.push(`Project category must be one of: ${validCategories.join(', ')}`);
      }
    }
    
    // Project repository URL validation
    if (teamData.project && teamData.project.repositoryUrl) {
      try {
        new URL(teamData.project.repositoryUrl);
      } catch {
        errors.push('Repository URL must be a valid URL');
      }
    }
    
    // Communication channel validation
    if (teamData.communication && teamData.communication.primaryChannel) {
      const validChannels = ['discord', 'slack', 'telegram', 'whatsapp', 'teams', 'other'];
      if (!validChannels.includes(teamData.communication.primaryChannel)) {
        errors.push(`Communication channel must be one of: ${validChannels.join(', ')}`);
      }
    }
    
    // Location preference validation
    if (teamData.location && teamData.location.preference) {
      const validPreferences = ['remote', 'hybrid', 'in_person'];
      if (!validPreferences.includes(teamData.location.preference)) {
        errors.push(`Location preference must be one of: ${validPreferences.join(', ')}`);
      }
    }
    
    // Tags validation
    if (teamData.tags && Array.isArray(teamData.tags)) {
      if (teamData.tags.length > 10) {
        errors.push('Maximum 10 tags allowed');
      }
      teamData.tags.forEach((tag, idx) => {
        if (!tag || tag.trim().length < 2 || tag.trim().length > 30) {
          errors.push(`Tag ${idx + 1} must be between 2 and 30 characters`);
        }
      });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Get teams with advanced filtering - improved version
  getTeamsWithFilters: async (hackathonId, filters = {}) => {
    // This is an alias for getHackathonTeams with better parameter handling
    return teamAPI.getHackathonTeams(hackathonId, filters);
  },

  // Utility method to check if backend methods are implemented
  checkMethodAvailability: async (teamId = null) => {
    const methods = {
      createTeam: true, // Always available
      getUserTeams: true, // Always available
      getTeam: true, // Always available
      updateTeam: true, // Always available
      deleteTeam: true, // Always available
      joinTeam: false, // Check implementation
      leaveTeam: false, // Check implementation
      inviteToTeam: false, // Check implementation
      kickMember: false, // Check implementation
      transferLeadership: false, // Check implementation
      updateMemberPermissions: false, // Check implementation
      getHackathonTeams: false, // Check implementation
      getTeamRecommendations: false, // Check implementation
      getTeamStats: false // Check implementation
    };

    // If teamId is provided, we can test some methods
    if (teamId && teamId.match(/^[0-9a-fA-F]{24}$/)) {
      try {
        const statsResponse = await teamAPI.getTeamStats(teamId);
        methods.getTeamStats = statsResponse.success;
      } catch (error) {
        methods.getTeamStats = error.response?.status !== 501;
      }
    }

    return methods;
  }
};
// Request API calls
export const requestAPI = {
  getReceivedRequests: () => api.get('/requests/received'),
  getSentRequests: () => api.get('/requests/sent'),
  sendRequest: (requestData) => api.post('/requests/send', requestData),
  acceptRequest: (requestId) => api.put(`/requests/${requestId}/accept`),
  rejectRequest: (requestId) => api.put(`/requests/${requestId}/reject`),
  cancelRequest: (requestId) => api.delete(`/requests/${requestId}`)
};

export default api;