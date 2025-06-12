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
      throw error;
    }
  },

  // Get current user's teams - matches GET /teams/my
  getMyTeams: async (params = {}) => {
    try {
      const response = await api.get('/teams/my', { params });
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

  // Get team by ID - matches GET /teams/:teamId
  getTeamById: async (teamId, params = {}) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.get(`/teams/${teamId}`, { params });
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

  // Update team - matches PUT /teams/:teamId
  updateTeam: async (teamId, teamData) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      console.log('Updating team with data:', teamData);
      const response = await api.put(`/teams/${teamId}`, teamData);
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

  // Delete/disband team - matches DELETE /teams/:teamId
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

  // Join team - matches POST /teams/:teamId/join
  joinTeam: async (teamId, joinData = {}) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.post(`/teams/${teamId}/join`, joinData);
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

  // Leave team - matches POST /teams/:teamId/leave
  leaveTeam: async (teamId, leaveData = {}) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.post(`/teams/${teamId}/leave`, leaveData);
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

  // Invite user to team - matches POST /teams/:teamId/invite
  inviteToTeam: async (teamId, inviteData) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.post(`/teams/${teamId}/invite`, inviteData);
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

  // Remove/kick team member - matches DELETE /teams/:teamId/members/:userId
  removeMember: async (teamId, userId, kickData = {}) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid user ID format');
      }
      const response = await api.delete(`/teams/${teamId}/members/${userId}`, { data: kickData });
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

  // Transfer team leadership - matches POST /teams/:teamId/transfer-leadership
  transferLeadership: async (teamId, transferData) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      const response = await api.post(`/teams/${teamId}/transfer-leadership`, transferData);
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

  // Update member permissions - matches PUT /teams/:teamId/members/:userId/permissions
  updateMemberPermissions: async (teamId, userId, permissionsData) => {
    try {
      if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid team ID format');
      }
      if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid user ID format');
      }
      const response = await api.put(`/teams/${teamId}/members/${userId}/permissions`, permissionsData);
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

  // Get teams for a specific hackathon - matches GET /teams/hackathon/:hackathonId
  getHackathonTeams: async (hackathonId, params = {}) => {
    try {
      if (!hackathonId || !hackathonId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid hackathon ID format');
      }
      const response = await api.get(`/teams/hackathon/${hackathonId}`, { params });
      return {
        success: true,
        data: response.data.teams || response.data.data?.teams || response.data
      };
    } catch (error) {
      console.error('API Error (getHackathonTeams):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Get team recommendations - matches GET /teams/recommendations/:hackathonId
  getTeamRecommendations: async (hackathonId, params = {}) => {
    try {
      if (!hackathonId || !hackathonId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid hackathon ID format');
      }
      const response = await api.get(`/teams/recommendations/${hackathonId}`, { params });
      return {
        success: true,
        data: response.data.teams || response.data.data?.teams || response.data
      };
    } catch (error) {
      console.error('API Error (getTeamRecommendations):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Get team statistics - matches GET /teams/:teamId/stats
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
      throw error;
    }
  },

  
  searchTeams: async (hackathonId, searchParams = {}) => {
    try {
      if (!hackathonId || !hackathonId.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Invalid hackathon ID format');
      }
      const response = await api.get(`/teams/hackathon/${hackathonId}`, { params: searchParams });
      return {
        success: true,
        data: response.data.teams || response.data.data?.teams || response.data
      };
    } catch (error) {
      console.error('API Error (searchTeams):', error);
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