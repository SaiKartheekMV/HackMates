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
      
      // Clean the data to match backend validation
      const cleanTeamData = {
        name: teamData.name?.trim(),
        description: teamData.description?.trim(),
        hackathon: teamData.hackathon || teamData.hackathonId, // Backend expects 'hackathon' field
        maxMembers: teamData.maxMembers ? parseInt(teamData.maxMembers) : 4,
        requiredSkills: teamData.requiredSkills || [],
        tags: teamData.tags || [],
        applicationRequired: teamData.applicationRequired || false
      };

      // Add contact info if provided
      if (teamData.contactInfo?.email) {
        cleanTeamData.contactInfo = {
          email: teamData.contactInfo.email
        };
      }

      const response = await api.post('/teams', cleanTeamData);
      return {
        success: true,
        data: response.data.data || response.data.team || response.data
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
      const response = await api.get('/teams/my', { params });
      return {
        success: true,
        data: response.data.data || response.data.teams || response.data
      };
    } catch (error) {
      console.error('API Error (getMyTeams):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Get team by ID - matches GET /api/teams/:id
  getTeamById: async (teamId) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      
      const response = await api.get(`/teams/${teamId}`);
      return {
        success: true,
        data: response.data.data || response.data.team || response.data
      };
    } catch (error) {
      console.error('API Error (getTeamById):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.status === 404) {
        throw new Error('Team not found');
      }

      throw error;
    }
  },

  // Update team - matches PUT /api/teams/:id
  updateTeam: async (teamId, teamData) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      
      // Clean the data to match backend validation
      const cleanTeamData = {};
      
      if (teamData.description !== undefined) {
        cleanTeamData.description = teamData.description?.trim();
      }
      if (teamData.maxMembers !== undefined) {
        cleanTeamData.maxMembers = parseInt(teamData.maxMembers);
      }
      if (teamData.requiredSkills !== undefined) {
        cleanTeamData.requiredSkills = teamData.requiredSkills || [];
      }
      if (teamData.tags !== undefined) {
        cleanTeamData.tags = teamData.tags || [];
      }
      if (teamData.status !== undefined) {
        cleanTeamData.status = teamData.status; // 'open' or 'closed'
      }
      if (teamData.contactInfo?.email !== undefined) {
        cleanTeamData.contactInfo = {
          email: teamData.contactInfo.email
        };
      }

      console.log('Updating team with data:', cleanTeamData);
      const response = await api.put(`/teams/${teamId}`, cleanTeamData);
      return {
        success: true,
        data: response.data.data || response.data.team || response.data
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
      } else if (error.response?.status === 403) {
        throw new Error('Only team leader can update team details');
      } else if (error.response?.status === 404) {
        throw new Error('Team not found');
      }
      
      throw error;
    }
  },

  // Delete team - matches DELETE /api/teams/:id
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

      if (error.response?.status === 403) {
        throw new Error('Only team leader can delete the team');
      } else if (error.response?.status === 404) {
        throw new Error('Team not found');
      }

      throw error;
    }
  },

  // Join team - matches POST /api/teams/:id/join
  joinTeam: async (teamId) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      
      const response = await api.post(`/teams/${teamId}/join`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (joinTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Cannot join team');
      } else if (error.response?.status === 404) {
        throw new Error('Team not found');
      }

      throw error;
    }
  },

  // Leave team - matches POST /api/teams/:id/leave
  leaveTeam: async (teamId) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      
      const response = await api.post(`/teams/${teamId}/leave`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (leaveTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Cannot leave team');
      } else if (error.response?.status === 404) {
        throw new Error('Team not found');
      }

      throw error;
    }
  },

  // Apply to team - matches POST /api/teams/:id/apply
  applyToTeam: async (teamId, applicationData = {}) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      
      // Clean application data
      const cleanApplicationData = {};
      
      if (applicationData.message && applicationData.message.trim()) {
        cleanApplicationData.message = applicationData.message.trim();
      }
      
      const response = await api.post(`/teams/${teamId}/apply`, cleanApplicationData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (applyToTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Cannot apply to team');
      } else if (error.response?.status === 404) {
        throw new Error('Team not found');
      }

      throw error;
    }
  },

  // Handle application (accept/reject) - matches PUT /api/teams/:id/applications/:applicationId
  handleApplication: async (teamId, applicationId, status) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid application ID format');
      }
      if (!['accepted', 'rejected'].includes(status)) {
        throw new Error('Status must be either accepted or rejected');
      }
      
      const response = await api.put(`/teams/${teamId}/applications/${applicationId}`, { status });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (handleApplication):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.status === 403) {
        throw new Error('Only team leader can handle applications');
      } else if (error.response?.status === 404) {
        throw new Error('Team or application not found');
      }

      throw error;
    }
  },

  // Get teams for a specific hackathon - matches GET /api/hackathons/:hackathonId/teams
  getHackathonTeams: async (hackathonId, params = {}) => {
    try {
      if (!hackathonId || !hackathonId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid hackathon ID format');
      }
      
      console.log('Requesting hackathon teams with params:', params);
      const response = await api.get(`/hackathons/${hackathonId}/teams`, { params });
      return {
        success: true,
        data: response.data.data || response.data.teams || response.data,
        pagination: response.data.pagination,
        total: response.data.total
      };
    } catch (error) {
      console.error('API Error (getHackathonTeams):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Request params that caused error:', params);
      
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Invalid request parameters';
        throw new Error(errorMessage);
      }
      
      throw error;
    }
  },

  // Search teams - matches GET /api/teams/search
  searchTeams: async (searchParams = {}) => {
    try {
      console.log('Searching teams with params:', searchParams);
      const response = await api.get('/teams/search', { params: searchParams });
      return {
        success: true,
        data: response.data.data || response.data.teams || response.data,
        pagination: response.data.pagination
      };
    } catch (error) {
      console.error('API Error (searchTeams):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Get team members - matches GET /api/teams/:id/members
  getTeamMembers: async (teamId) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      
      const response = await api.get(`/teams/${teamId}/members`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('API Error (getTeamMembers):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.status === 404) {
        throw new Error('Team not found');
      }

      throw error;
    }
  },

  // Get team applications - matches GET /api/teams/:id/applications
  getTeamApplications: async (teamId) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      
      const response = await api.get(`/teams/${teamId}/applications`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('API Error (getTeamApplications):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.status === 403) {
        throw new Error('Only team leader can view applications');
      } else if (error.response?.status === 404) {
        throw new Error('Team not found');
      }

      throw error;
    }
  },

  // Kick member from team - matches POST /api/teams/:id/kick/:userId
  kickMember: async (teamId, userId) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid user ID format');
      }
      
      const response = await api.post(`/teams/${teamId}/kick/${userId}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('API Error (kickMember):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.status === 403) {
        throw new Error('Only team leader can remove members');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Cannot remove member');
      } else if (error.response?.status === 404) {
        throw new Error('Team not found');
      }

      throw error;
    }
  },

  // Transfer team leadership - matches POST /api/teams/:id/transfer-leadership/:userId
  transferLeadership: async (teamId, newLeaderId) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      if (!newLeaderId || !newLeaderId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid new leader ID format');
      }
      
      const response = await api.post(`/teams/${teamId}/transfer-leadership/${newLeaderId}`);
      return {
        success: true,
        data: response.data.data || response.data
      };
    } catch (error) {
      console.error('API Error (transferLeadership):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      if (error.response?.status === 403) {
        throw new Error('Only current team leader can transfer leadership');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Cannot transfer leadership');
      } else if (error.response?.status === 404) {
        throw new Error('Team not found');
      }

      throw error;
    }
  },

  // Validate team creation data before sending
  validateTeamData: (teamData) => {
    const errors = [];
    
    // Name validation
    if (!teamData.name || teamData.name.trim().length < 3 || teamData.name.trim().length > 100) {
      errors.push('Team name must be between 3 and 100 characters');
    }
    
    // Description validation
    if (!teamData.description || teamData.description.trim().length < 10 || teamData.description.trim().length > 500) {
      errors.push('Description must be between 10 and 500 characters');
    }
    
    // Hackathon ID validation
    const hackathonId = teamData.hackathon || teamData.hackathonId;
    if (!hackathonId || !hackathonId.match(/^[0-9a-fA-F]{24}$/)) {
      errors.push('Invalid hackathon ID');
    }
    
    // Max members validation
    if (teamData.maxMembers && (teamData.maxMembers < 2 || teamData.maxMembers > 10)) {
      errors.push('Team size must be between 2 and 10 members');
    }
    
    // Required skills validation
    if (teamData.requiredSkills && !Array.isArray(teamData.requiredSkills)) {
      errors.push('Required skills must be an array');
    }
    
    // Tags validation
    if (teamData.tags && !Array.isArray(teamData.tags)) {
      errors.push('Tags must be an array');
    }
    
    // Contact info validation
    if (teamData.contactInfo?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teamData.contactInfo.email)) {
      errors.push('Valid email is required for contact info');
    }
    
    // Application required validation
    if (teamData.applicationRequired && typeof teamData.applicationRequired !== 'boolean') {
      errors.push('Application required must be a boolean');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
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