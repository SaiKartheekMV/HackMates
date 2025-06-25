// hooks/useTeams.js
import { useState, useCallback } from 'react';
import { teamAPI, hackathonAPI } from '../../../services/api';

const useTeams = (hackathonId) => {
  // eslint-disable-next-line no-unused-vars
  const [teams, setTeams] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [hackathonTeams, setHackathonTeams] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState({
    myTeams: 0,
    hackathons: 0,
    hackathonTeams: 0
  });

  const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

  const canMakeRequest = (requestType) => {
    const now = Date.now();
    const lastTime = lastRequestTime[requestType];
    return now - lastTime > MIN_REQUEST_INTERVAL;
  };

  const updateRequestTime = (requestType) => {
    setLastRequestTime(prev => ({
      ...prev,
      [requestType]: Date.now()
    }));
  };

  const loadHackathons = useCallback(async () => {
    if (!canMakeRequest('hackathons')) return;
    updateRequestTime('hackathons');

    try {
      setLoading(true);
      const response = await hackathonAPI.getHackathons();
      setHackathons(response.data || []);
    } catch (error) {
      console.error("Failed to load hackathons:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyTeams = useCallback(async () => {
    if (loading || !canMakeRequest('myTeams')) return;
    updateRequestTime('myTeams');

    try {
      setLoading(true);
      const response = await teamAPI.getMyTeams();
      setMyTeams(response.data || []);
    } catch (error) {
      console.error("Failed to load my teams:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const loadHackathonTeams = useCallback(async (filters = {}) => {
    if (!hackathonId || !canMakeRequest('hackathonTeams')) return;
    updateRequestTime('hackathonTeams');

    try {
      setLoading(true);
      const response = await teamAPI.getTeamsWithFilters(hackathonId, filters);
      setHackathonTeams(response.data || []);
    } catch (error) {
      console.error("Failed to load hackathon teams:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [hackathonId]);

  const loadRecommendations = useCallback(async () => {
    if (!hackathonId) return;

    try {
      const response = await teamAPI.getTeamRecommendations(hackathonId);
      setRecommendations(response.data || []);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    }
  }, [hackathonId]);

  return {
    teams,
    myTeams,
    hackathonTeams,
    recommendations,
    hackathons,
    loading,
    loadHackathons,
    loadMyTeams,
    loadHackathonTeams,
    loadRecommendations
  };
};

export default useTeams;