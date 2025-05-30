import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const useMatchmaking = () => {
  const { getToken, user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    skills: [],
    experience: '',
    location: '',
    roles: [],
    availability: '',
  });
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);

  // Fetch matches based on user profile and filters
  const fetchMatches = useCallback(async (customFilters = null) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      const activeFilters = customFilters || filters;

      // Add filters to query parameters
      if (activeFilters.skills.length > 0) {
        queryParams.append('skills', activeFilters.skills.join(','));
      }
      if (activeFilters.experience) {
        queryParams.append('experience', activeFilters.experience);
      }
      if (activeFilters.location) {
        queryParams.append('location', activeFilters.location);
      }
      if (activeFilters.roles.length > 0) {
        queryParams.append('roles', activeFilters.roles.join(','));
      }
      if (activeFilters.availability) {
        queryParams.append('availability', activeFilters.availability);
      }

      const response = await fetch(`/api/matchmaking/matches?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch matches');
      }

      const data = await response.json();
      setMatches(data.matches || []);
      
      return { success: true, matches: data.matches };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [filters, getToken]);

  // Send hack request to a user
  const sendHackRequest = async (targetUserId, message = '', hackathonId = null) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/matchmaking/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          message,
          hackathonId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send hack request');
      }

      const data = await response.json();
      
      // Update sent requests
      setSentRequests(prev => [...prev, data.request]);
      
      return { success: true, request: data.request };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Respond to hack request (accept/reject)
  const respondToRequest = async (requestId, status, message = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/matchmaking/request/${requestId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status, // 'accepted' or 'rejected'
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to respond to request');
      }

      const data = await response.json();
      
      // Update received requests
      setReceivedRequests(prev => 
        prev.map(req => req.id === requestId ? data.request : req)
      );
      
      return { success: true, request: data.request };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch sent requests
  const fetchSentRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/matchmaking/requests/sent', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sent requests');
      }

      const data = await response.json();
      setSentRequests(data.requests || []);
      
      return { success: true, requests: data.requests };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [getToken]);

  // Fetch received requests
  const fetchReceivedRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/matchmaking/requests/received', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch received requests');
      }

      const data = await response.json();
      setReceivedRequests(data.requests || []);
      
      return { success: true, requests: data.requests };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [getToken]);

  // Get match recommendations based on AI
  const getRecommendations = async (hackathonId = null) => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = hackathonId ? `?hackathonId=${hackathonId}` : '';
      
      const response = await fetch(`/api/matchmaking/recommendations${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      
      return { success: true, recommendations: data.recommendations };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Calculate compatibility score between users
  const calculateCompatibility = (user1Profile, user2Profile) => {
    let score = 0;
    let maxScore = 0;

    // Skills matching (40% weight)
    if (user1Profile.skills && user2Profile.skills) {
      const commonSkills = user1Profile.skills.filter(skill => 
        user2Profile.skills.includes(skill)
      );
      const totalSkills = new Set([...user1Profile.skills, ...user2Profile.skills]).size;
      const skillScore = totalSkills > 0 ? (commonSkills.length / totalSkills) * 40 : 0;
      score += skillScore;
    }
    maxScore += 40;

    // Experience level matching (20% weight)
    if (user1Profile.experience && user2Profile.experience) {
      const expLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
      const exp1Index = expLevels.indexOf(user1Profile.experience);
      const exp2Index = expLevels.indexOf(user2Profile.experience);
      
      if (exp1Index !== -1 && exp2Index !== -1) {
        const expDiff = Math.abs(exp1Index - exp2Index);
        const expScore = ((3 - expDiff) / 3) * 20;
        score += expScore;
      }
    }
    maxScore += 20;

    // Role compatibility (25% weight)
    if (user1Profile.preferredRoles && user2Profile.preferredRoles) {
      const complementaryRoles = {
        'Frontend Developer': ['Backend Developer', 'UI/UX Designer'],
        'Backend Developer': ['Frontend Developer', 'DevOps Engineer'],
        'UI/UX Designer': ['Frontend Developer', 'Product Manager'],
        'Data Scientist': ['Machine Learning Engineer', 'Backend Developer'],
        'Mobile Developer': ['Backend Developer', 'UI/UX Designer'],
      };

      let roleScore = 0;
      user1Profile.preferredRoles.forEach(role1 => {
        user2Profile.preferredRoles.forEach(role2 => {
          if (complementaryRoles[role1]?.includes(role2) || 
              complementaryRoles[role2]?.includes(role1)) {
            roleScore += 25;
          }
        });
      });
      score += Math.min(roleScore, 25);
    }
    maxScore += 25;

    // Location proximity (15% weight)
    if (user1Profile.location && user2Profile.location) {
      const locationScore = user1Profile.location === user2Profile.location ? 15 : 0;
      score += locationScore;
    }
    maxScore += 15;

    return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      skills: [],
      experience: '',
      location: '',
      roles: [],
      availability: '',
    });
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Initialize data on mount
  useEffect(() => {
    if (user) {
      fetchMatches();
      fetchSentRequests();
      fetchReceivedRequests();
    }
  }, [user, fetchMatches, fetchSentRequests, fetchReceivedRequests]);

  return {
    // State
    matches,
    sentRequests,
    receivedRequests,
    loading,
    error,
    filters,
    
    // Actions
    fetchMatches,
    sendHackRequest,
    respondToRequest,
    fetchSentRequests,
    fetchReceivedRequests,
    getRecommendations,
    calculateCompatibility,
    updateFilters,
    clearFilters,
    clearError,
  };
};

export default useMatchmaking;