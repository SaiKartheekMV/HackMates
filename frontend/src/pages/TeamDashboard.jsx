import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

// Custom Hooks
import useTeams from '../components/teams/hooks/useTeams';
import useTeamActions from '../components/teams/hooks/useTeamActions';
import useTeamFilters from '../components/teams/hooks/useTeamFilters';

// Components
import TeamList from '../components/teams/TeamList';
import TeamCard from '../components/teams/TeamCard';
import TeamFilters from '../components/teams/TeamFilters';
import TeamDetails from '../components/teams/TeamDetails';
import CreateTeamModal from '../components/teams/CreateTeamModal';
import JoinTeamModal from '../components/teams/JoinTeamModal';

// Utils
import { hackathonAPI } from '../services/api';

const TeamDashboard = () => {
  const { hackathonId } = useParams();
  
  // State
  const [activeTab, setActiveTab] = useState('myTeams');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [teamToJoin, setTeamToJoin] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [currentHackathonId, setCurrentHackathonId] = useState(hackathonId || '');
  const [alerts, setAlerts] = useState({ success: '', error: '' });

  // Custom Hooks
  const { 
    teams, 
    myTeams, 
    recommendations, 
    userTeams,
    loading, 
    fetchTeams, 
    fetchMyTeams,
    fetchRecommendations 
  } = useTeams(currentHackathonId);

  const { 
    handleJoinTeam, 
    handleLeaveTeam, 
    handleCreateTeam, 
    handleDeleteTeam,
    loading: actionLoading 
  } = useTeamActions(fetchTeams, fetchMyTeams, showAlert);

  const {
    filters,
    filteredTeams,
    filterOptions,
    activeFiltersCount,
    hasActiveFilters,
    updateFilter,
    updateFilters,
    resetFilters
  } = useTeamFilters(teams, hackathons);

  // Current user (you might want to get this from context/auth)
  const currentUser = {
    id: "60d5ec49f8b2c8001f5d4e8a",
    firstName: "John",
    lastName: "Doe",
  };

  // Alert helper
  function showAlert(message, type = 'success') {
    setAlerts(prev => ({
      ...prev,
      [type]: message,
      [type === 'success' ? 'error' : 'success']: ''
    }));
    
    setTimeout(() => {
      setAlerts({ success: '', error: '' });
    }, 5000);
  }

  // Load hackathons
  const loadHackathons = async () => {
    try {
      const response = await hackathonAPI.getHackathons();
      setHackathons(response.data || []);
    } catch (err) {
      console.error('Failed to load hackathons:', err);
      showAlert('Failed to load hackathons', 'error');
    }
  };

  // Enhanced join team handler
  const handleJoinTeamClick = (team) => {
    if (team.settings?.requireApproval || team.settings?.allowDirectJoin === false) {
      setTeamToJoin(team);
      setShowJoinModal(true);
    } else {
      handleJoinTeam(team._id);
    }
  };

  // Handle join from modal
  const handleJoinFromModal = async (teamId, joinData) => {
    try {
      await handleJoinTeam(teamId, joinData);
      setShowJoinModal(false);
      setTeamToJoin(null);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      // Error is handled in useTeamActions
    }
  };

  // Handle create team success
  const handleCreateTeamSuccess = () => {
    setShowCreateModal(false);
    showAlert('Team created successfully!');
  };

  // Initialize data
  useEffect(() => {
    loadHackathons();
  }, []);

  // Update teams when hackathon changes
  useEffect(() => {
    if (currentHackathonId) {
      fetchTeams();
      fetchRecommendations();
    }
  }, [currentHackathonId, fetchTeams, fetchRecommendations]);

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'myTeams':
        return (
          <div className="row">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : myTeams.length === 0 ? (
              <div className="text-center py-5">
                <h5>No teams found</h5>
                <p className="text-muted">Create your first team to get started!</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create Team
                </button>
              </div>
            ) : (
              <TeamList 
                teams={myTeams}
                currentUser={currentUser}
                userTeams={userTeams}
                onTeamClick={setSelectedTeam}
                onJoinTeam={handleJoinTeamClick}
                onLeaveTeam={handleLeaveTeam}
                onDeleteTeam={handleDeleteTeam}
                loading={actionLoading}
                isMyTeams={true}
              />
            )}
          </div>
        );

      case 'discover':
        return (
          <>
            <TeamFilters
              filters={filters}
              filterOptions={filterOptions}
              onUpdateFilter={updateFilter}
              onUpdateFilters={updateFilters}
              onResetFilters={resetFilters}
              activeFiltersCount={activeFiltersCount}
              hasActiveFilters={hasActiveFilters}
              currentHackathonId={currentHackathonId}
              onHackathonChange={setCurrentHackathonId}
              loading={loading}
            />

            <div className="row">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : filteredTeams.length === 0 ? (
                <div className="text-center py-5">
                  <h5>No teams found</h5>
                  <p className="text-muted">
                    {hasActiveFilters 
                      ? "Try adjusting your filters" 
                      : currentHackathonId 
                        ? "No teams available for this hackathon"
                        : "Select a hackathon to discover teams"
                    }
                  </p>
                  {hasActiveFilters && (
                    <button 
                      className="btn btn-outline-primary"
                      onClick={resetFilters}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <TeamList 
                  teams={filteredTeams}
                  currentUser={currentUser}
                  userTeams={userTeams}
                  hackathonId={currentHackathonId}
                  onTeamClick={setSelectedTeam}
                  onJoinTeam={handleJoinTeamClick}
                  onLeaveTeam={handleLeaveTeam}
                  loading={actionLoading}
                />
              )}
            </div>
          </>
        );

      case 'recommendations':
        return (
          <div className="row">
            {!currentHackathonId ? (
              <div className="text-center py-5">
                <h5>Select a hackathon</h5>
                <p className="text-muted">
                  Go to the Discover tab and select a hackathon to get personalized recommendations
                </p>
              </div>
            ) : loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-5">
                <h5>No recommendations found</h5>
                <p className="text-muted">
                  We'll find teams that match your skills and interests!
                </p>
              </div>
            ) : (
              <TeamList 
                teams={recommendations}
                currentUser={currentUser}
                userTeams={userTeams}
                hackathonId={currentHackathonId}
                onTeamClick={setSelectedTeam}
                onJoinTeam={handleJoinTeamClick}
                loading={actionLoading}
                isRecommendations={true}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Alerts */}
      {alerts.success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {alerts.success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlerts(prev => ({ ...prev, success: '' }))}
          />
        </div>
      )}

      {alerts.error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {alerts.error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlerts(prev => ({ ...prev, error: '' }))}
          />
        </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Team Dashboard</h1>
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Team
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'myTeams' ? 'active' : ''}`}
            onClick={() => setActiveTab('myTeams')}
          >
            My Teams ({myTeams.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            Discover Teams
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            Recommendations ({recommendations.length})
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Modals */}
      <CreateTeamModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateTeam={handleCreateTeam}
        hackathons={hackathons}
        loading={actionLoading}
        onSuccess={handleCreateTeamSuccess}
      />

      <JoinTeamModal
        show={showJoinModal}
        team={teamToJoin}
        onClose={() => {
          setShowJoinModal(false);
          setTeamToJoin(null);
        }}
        onJoinTeam={handleJoinFromModal}
        loading={actionLoading}
      />

      <TeamDetails
        team={selectedTeam}
        show={!!selectedTeam}
        onClose={() => setSelectedTeam(null)}
        currentUser={currentUser}
        onLeaveTeam={handleLeaveTeam}
        onDeleteTeam={handleDeleteTeam}
        loading={actionLoading}
      />
    </div>
  );
};

export default TeamDashboard;