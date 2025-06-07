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
  getMyTeams: async () => {
    try {
      const response = await api.get('/teams/my');
      return {
        data: response.data.teams || response.data.data?.teams || response.data
      };
    } catch (error) {
      console.error('API Error (getMyTeams):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  createTeam: async (teamData) => {
    try {
      console.log('Sending team data:', teamData);
      const response = await api.post('/teams', teamData);
      return {
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

  getTeam: async (id) => {
    try {
      const response = await api.get(`/teams/${id}`);
      return {
        data: response.data.team || response.data.data?.team || response.data
      };
    } catch (error) {
      console.error('API Error (getTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  updateTeam: async (id, teamData) => {
    try {
      console.log('Updating team with data:', teamData);
      const response = await api.put(`/teams/${id}`, teamData);
      return {
        data: response.data.team || response.data.data?.team || response.data
      };
    } catch (error) {
      console.error('API Error (updateTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  deleteTeam: async (id) => {
    try {
      const response = await api.delete(`/teams/${id}`);
      return {
        data: response.data
      };
    } catch (error) {
      console.error('API Error (deleteTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  joinTeam: async (id) => {
    try {
      const response = await api.post(`/teams/${id}/join`);
      return {
        data: response.data
      };
    } catch (error) {
      console.error('API Error (joinTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  leaveTeam: async (id) => {
    try {
      const response = await api.post(`/teams/${id}/leave`);
      return {
        data: response.data
      };
    } catch (error) {
      console.error('API Error (leaveTeam):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  removeMember: async (teamId, memberId) => {
    try {
      const response = await api.delete(`/teams/${teamId}/member/${memberId}`);
      return {
        data: response.data
      };
    } catch (error) {
      console.error('API Error (removeMember):', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },
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