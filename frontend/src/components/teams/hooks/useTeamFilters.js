import { useState, useMemo, useCallback } from 'react';

const useTeamFilters = (teams = [], hackathons = []) => {
  const [filters, setFilters] = useState({
    search: '',
    hackathonId: '',
    status: '',
    hasOpenings: false,
    skills: '',
    location: '',
    sortBy: 'newest', // newest, oldest, name, members, completion
    tags: []
  });

  // Update individual filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      hackathonId: '',
      status: '',
      hasOpenings: false,
      skills: '',
      location: '',
      sortBy: 'newest',
      tags: []
    });
  }, []);

  // Get available filter options from teams data
  const filterOptions = useMemo(() => {
    const statuses = [...new Set(teams.map(team => team.status).filter(Boolean))];
    const locations = [...new Set(teams.map(team => team.location?.preference).filter(Boolean))];
    const allSkills = teams.flatMap(team => 
      (team.requiredSkills || []).map(skill => 
        typeof skill === 'string' ? skill : skill.skill
      )
    );
    const skills = [...new Set(allSkills)].filter(Boolean);
    const allTags = teams.flatMap(team => team.tags || []);
    const tags = [...new Set(allTags)].filter(Boolean);

    return {
      statuses,
      locations,
      skills,
      tags,
      hackathons: hackathons || []
    };
  }, [teams, hackathons]);

  // Apply filters to teams
  const filteredTeams = useMemo(() => {
    let filtered = [...teams];

    // Search filter (name, description, tags)
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(team => 
        team.name?.toLowerCase().includes(searchTerm) ||
        team.description?.toLowerCase().includes(searchTerm) ||
        team.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        team.requiredSkills?.some(skill => {
          const skillName = typeof skill === 'string' ? skill : skill.skill;
          return skillName?.toLowerCase().includes(searchTerm);
        })
      );
    }

    // Hackathon filter
    if (filters.hackathonId) {
      filtered = filtered.filter(team => team.hackathonId === filters.hackathonId);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(team => team.status === filters.status);
    }

    // Has openings filter
    if (filters.hasOpenings) {
      filtered = filtered.filter(team => {
        const current = team.teamSize?.current || team.members?.length || 0;
        const max = team.teamSize?.max || team.maxMembers || 0;
        return current < max;
      });
    }

    // Skills filter
    if (filters.skills.trim()) {
      const skillTerms = filters.skills.toLowerCase().split(',').map(s => s.trim());
      filtered = filtered.filter(team =>
        skillTerms.some(term =>
          team.requiredSkills?.some(skill => {
            const skillName = typeof skill === 'string' ? skill : skill.skill;
            return skillName?.toLowerCase().includes(term);
          })
        )
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(team => 
        team.location?.preference === filters.location
      );
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(team =>
        filters.tags.some(tag => team.tags?.includes(tag))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'members':
          { const aCurrent = a.teamSize?.current || a.members?.length || 0;
          const bCurrent = b.teamSize?.current || b.members?.length || 0;
          return bCurrent - aCurrent; }
        case 'completion':
          { const aCompletion = a.stats?.completionScore || 0;
          const bCompletion = b.stats?.completionScore || 0;
          return bCompletion - aCompletion; }
        default:
          return 0;
      }
    });

    return filtered;
  }, [teams, filters]);

  // Get active filters count for UI
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.hackathonId) count++;
    if (filters.status) count++;
    if (filters.hasOpenings) count++;
    if (filters.skills.trim()) count++;
    if (filters.location) count++;
    if (filters.tags.length > 0) count++;
    return count;
  }, [filters]);

  // Check if any filters are active
  const hasActiveFilters = activeFiltersCount > 0;

  return {
    filters,
    filteredTeams,
    filterOptions,
    activeFiltersCount,
    hasActiveFilters,
    updateFilter,
    updateFilters,
    resetFilters
  };
};

export default useTeamFilters;