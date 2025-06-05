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
  uploadResume: (formData) => api.post('/profiles/me/upload-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  calculateCompletion: () => api.post('/profiles/me/calculate-completion'),
  getPublicProfile: (userId) => api.get(`/profiles/${userId}`)
};

// Hackathon API calls
export const hackathonAPI = {
   getAllHackathons: async (params) => {
    try {
      const response = await api.get('/hackathons', { params });
      console.log('Raw API Response:', response.data); // Debug log
      
      // Extract hackathons from the nested structure
      return {
        data: response.data.hackathons || response.data.data?.hackathons || response.data
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
      console.error('API Error:', error);
      throw error;
    }
  },
  createTeam: async (teamData) => {
    try {
      const response = await api.post('/teams', teamData);
      return {
        data: response.data.team || response.data.data?.team || response.data
      };
    } catch (error) {
      console.error('API Error:', error);
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
      console.error('API Error:', error);
      throw error;
    }
  },
  updateTeam: (id, teamData) => api.put(`/teams/${id}`, teamData),
  deleteTeam: (id) => api.delete(`/teams/${id}`),
  joinTeam: (id) => api.post(`/teams/${id}/join`),
  leaveTeam: (id) => api.post(`/teams/${id}/leave`),
  removeMember: (teamId, memberId) => api.delete(`/teams/${teamId}/member/${memberId}`),
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