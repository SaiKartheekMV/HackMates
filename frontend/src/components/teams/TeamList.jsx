import React from 'react';
import TeamCard from './TeamCard';

const TeamList = ({ 
  teams, 
  userTeams, 
  hackathonId, 
  currentUser,
  onJoinTeam, 
  onLeaveTeam, 
  onDeleteTeam,
  onViewDetails,
  loading,
  activeTab = 'discover'
}) => {
  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    const emptyMessages = {
      myTeams: {
        title: "No teams found",
        subtitle: "Create your first team to get started!"
      },
      discover: {
        title: "No teams found",
        subtitle: hackathonId ? "Try adjusting your filters" : "Select a hackathon to discover teams"
      },
      recommendations: {
        title: "No recommendations found",
        subtitle: "We'll find teams that match your skills and interests!"
      }
    };

    const message = emptyMessages[activeTab] || emptyMessages.discover;

    return (
      <div className="text-center py-5">
        <h5>{message.title}</h5>
        <p className="text-muted">{message.subtitle}</p>
      </div>
    );
  }

  return (
    <div className="row">
      {teams.map((team) => (
        <div key={team._id} className="col-lg-6 col-xl-4 mb-4">
          <TeamCard
            team={team}
            userTeams={userTeams}
            hackathonId={hackathonId}
            currentUser={currentUser}
            onJoinTeam={onJoinTeam}
            onLeaveTeam={onLeaveTeam}
            onDeleteTeam={onDeleteTeam}
            onViewDetails={onViewDetails}
            isRecommendation={activeTab === 'recommendations'}
          />
        </div>
      ))}
    </div>
  );
};

export default TeamList;