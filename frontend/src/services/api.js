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
  // Get user's teams - matches GET /teams/my/teams
  getMyTeams: async () => {
    try {
      const response = await api.get('/teams/my/teams');
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

  // Create a new team - matches POST /teams
  createTeam: async (teamData) => {
    try {
      console.log('Sending team data:', teamData);
      const response = await api.post('/teams', teamData);
      return {
        success: true,
        data: response.data.team || response.data.data?.team || response.data
      };
    } catch (error) {
      console.error('API Error (createTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Request data that failed:', teamData);
      throw error;
    }
  },

  // Get team by ID - matches GET /teams/:identifier
  getTeamById: async (id) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.get(`/teams/${id}`);
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

  // Update team - matches PUT /teams/:id
  updateTeam: async (id, teamData) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      console.log('Updating team with data:', teamData);
      const response = await api.put(`/teams/${id}`, teamData);
      return {
        success: true,
        data: response.data.team || response.data.data?.team || response.data
      };
    } catch (error) {
      console.error('API Error (updateTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Delete team - matches DELETE /teams/:id
  deleteTeam: async (id) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.delete(`/teams/${id}`);
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

  // Join team - matches POST /teams/:id/join
  joinTeam: async (id) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.post(`/teams/${id}/join`);
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

  // Leave team - matches POST /teams/:id/leave
  leaveTeam: async (id) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.post(`/teams/${id}/leave`);
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

  // Remove team member - matches DELETE /teams/:id/members/:memberId
  removeMember: async (teamId, memberId) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      if (!memberId || !memberId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid member ID format');
      }
      const response = await api.delete(`/teams/${teamId}/members/${memberId}`);
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

  // Additional API methods based on your backend routes:

  // Get all teams with optional filters - matches GET /teams
  getTeams: async (params = {}) => {
    try {
      const response = await api.get('/teams', { params });
      return {
        success: true,
        data: response.data.teams || response.data.data?.teams || response.data
      };
    } catch (error) {
      console.error('API Error (getTeams):', error);
      throw error;
    }
  },

  // Search teams - matches GET /teams/search
  searchTeams: async (query, filters = {}) => {
    try {
      const params = { q: query, ...filters };
      const response = await api.get('/teams/search', { params });
      return {
        success: true,
        data: response.data.teams || response.data.data?.teams || response.data
      };
    } catch (error) {
      console.error('API Error (searchTeams):', error);
      throw error;
    }
  },

  // Get featured teams - matches GET /teams/featured
  getFeaturedTeams: async () => {
    try {
      const response = await api.get('/teams/featured');
      return {
        success: true,
        data: response.data.teams || response.data.data?.teams || response.data
      };
    } catch (error) {
      console.error('API Error (getFeaturedTeams):', error);
      throw error;
    }
  },

  // Get trending teams - matches GET /teams/trending
  getTrendingTeams: async () => {
    try {
      const response = await api.get('/teams/trending');
      return {
        success: true,
        data: response.data.teams || response.data.data?.teams || response.data
      };
    } catch (error) {
      console.error('API Error (getTrendingTeams):', error);
      throw error;
    }
  },

  // Get recommendations - matches GET /teams/my/recommendations
  getRecommendations: async () => {
    try {
      const response = await api.get('/teams/my/recommendations');
      return {
        success: true,
        data: response.data.teams || response.data.data?.teams || response.data
      };
    } catch (error) {
      console.error('API Error (getRecommendations):', error);
      throw error;
    }
  },

  // Update member role - matches PUT /teams/:id/members/:memberId/role
  updateMemberRole: async (teamId, memberId, roleData) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      if (!memberId || !memberId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid member ID format');
      }
      const response = await api.put(`/teams/${teamId}/members/${memberId}/role`, roleData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (updateMemberRole):', error);
      throw error;
    }
  },

  // Transfer leadership - matches POST /teams/:id/transfer-leadership
  transferLeadership: async (id, memberData) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.post(`/teams/${id}/transfer-leadership`, memberData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (transferLeadership):', error);
      throw error;
    }
  },

  // Add co-leader - matches POST /teams/:id/co-leaders
  addCoLeader: async (id, memberData) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.post(`/teams/${id}/co-leaders`, memberData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (addCoLeader):', error);
      throw error;
    }
  },

  // Get applications - matches GET /teams/:id/applications
  getApplications: async (id) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.get(`/teams/${id}/applications`);
      return {
        success: true,
        data: response.data.applications || response.data.data?.applications || response.data
      };
    } catch (error) {
      console.error('API Error (getApplications):', error);
      throw error;
    }
  },

  // Review application - matches PUT /teams/:id/applications/:applicationId
  reviewApplication: async (teamId, applicationId, reviewData) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      if (!applicationId || !applicationId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid application ID format');
      }
      const response = await api.put(`/teams/${teamId}/applications/${applicationId}`, reviewData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (reviewApplication):', error);
      throw error;
    }
  },

  // Generate invite link - matches POST /teams/:id/invite-links
  generateInviteLink: async (id, inviteData) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.post(`/teams/${id}/invite-links`, inviteData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (generateInviteLink):', error);
      throw error;
    }
  },

  // Join via invite - matches POST /teams/join/:code
  joinViaInvite: async (code) => {
    try {
      const response = await api.post(`/teams/join/${code}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (joinViaInvite):', error);
      throw error;
    }
  },

  // Update project - matches PUT /teams/:id/project
  updateProject: async (id, projectData) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.put(`/teams/${id}/project`, projectData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (updateProject):', error);
      throw error;
    }
  },

  // Submit project - matches POST /teams/:id/submit
  submitProject: async (id, submissionData) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.post(`/teams/${id}/submit`, submissionData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (submitProject):', error);
      throw error;
    }
  },

  // Toggle like - matches POST /teams/:id/toggle-like
  toggleLike: async (id) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.post(`/teams/${id}/toggle-like`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (toggleLike):', error);
      throw error;
    }
  },

  // Toggle follow - matches POST /teams/:id/toggle-follow
  toggleFollow: async (id) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.post(`/teams/${id}/toggle-follow`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (toggleFollow):', error);
      throw error;
    }
  },

  // Add review - matches POST /teams/:id/reviews
  addReview: async (id, reviewData) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.post(`/teams/${id}/reviews`, reviewData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (addReview):', error);
      throw error;
    }
  },

  // Get team analytics - matches GET /teams/:id/analytics
  getTeamAnalytics: async (id) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.get(`/teams/${id}/analytics`);
      return {
        success: true,
        data: response.data.analytics || response.data.data?.analytics || response.data
      };
    } catch (error) {
      console.error('API Error (getTeamAnalytics):', error);
      throw error;
    }
  },

  // Update settings - matches PUT /teams/:id/settings
  updateSettings: async (id, settingsData) => {
    try {
      if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.put(`/teams/${id}/settings`, settingsData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('API Error (updateSettings):', error);
      throw error;
    }
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