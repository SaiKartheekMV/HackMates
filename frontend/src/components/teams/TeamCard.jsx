// components/teams/TeamCard.jsx
import React from 'react';

const TeamCard = ({ 
  team, 
  currentUser, 
  myTeams = [], 
  hackathonId, 
  onJoinTeam, 
  onLeaveTeam, 
  onDeleteTeam, 
  onViewDetails,
  showActions = true, 
  isRecommendation = false,
  loading = false 
}) => {
  
  // Check if user is already in a team for this hackathon
  const userTeamForHackathon = myTeams.find(
    userTeam => userTeam.hackathonId === hackathonId || userTeam.hackathon === hackathonId
  );
  
  // Check if user is in THIS specific team
  const isUserInThisTeam = team.members?.some(
    member => member.userId === currentUser?.id || member.user === currentUser?.id
  );
  
  // Check if team is full
  const isTeamFull = (team.members?.length || 0) >= (team.maxMembers || team.teamSize?.max || 0);
  
  // Determine button configuration
  const getButtonConfig = () => {
    if (isUserInThisTeam) {
      return { text: 'Your Team', disabled: true, variant: 'success' };
    }
    
    if (userTeamForHackathon && !isUserInThisTeam) {
      return { text: 'Already in Team', disabled: true, variant: 'secondary' };
    }
    
    if (isTeamFull) {
      return { text: 'Team Full', disabled: true, variant: 'secondary' };
    }
    
    return { text: 'Join Team', disabled: false, variant: 'primary' };
  };

  const buttonConfig = getButtonConfig();

  const getStatusBadge = (status) => {
    const statusColors = {
      forming: "warning",
      complete: "success",
      competing: "info",
      finished: "secondary",
      disbanded: "danger",
    };
    return (
      <span className={`badge bg-${statusColors[status] || "primary"}`}>
        {status}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityColors = {
      low: "secondary",
      medium: "info",
      high: "warning",
      critical: "danger",
    };
    return (
      <span className={`badge bg-${priorityColors[priority] || "primary"} me-1`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="card mb-3 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <h5 className="card-title mb-1">{team.name}</h5>
          {getStatusBadge(team.status)}
        </div>

        {team.tagline && (
          <p className="text-muted small mb-2">{team.tagline}</p>
        )}
        <p className="card-text">{team.description}</p>

        <div className="row mb-3">
          <div className="col-md-6">
            <small className="text-muted">Team Size:</small>
            <div className="progress mb-2" style={{ height: "20px" }}>
              <div
                className="progress-bar"
                style={{
                  width: `${
                    ((team.teamSize?.current || team.members?.length || 0) /
                      (team.teamSize?.max || team.maxMembers || 1)) *
                    100
                  }%`,
                }}
              >
                {team.teamSize?.current || team.members?.length || 0}/
                {team.teamSize?.max || team.maxMembers || 0}
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <small className="text-muted">Profile Completion:</small>
            <div className="progress mb-2" style={{ height: "20px" }}>
              <div
                className="progress-bar bg-success"
                style={{ width: `${team.stats?.completionScore || 0}%` }}
              >
                {team.stats?.completionScore || 0}%
              </div>
            </div>
          </div>
        </div>

        {team.location && (
          <div className="mb-2">
            <small className="text-muted">Location:</small>
            <span className="badge bg-secondary ms-2">
              {team.location.preference}
            </span>
            {team.location.city && (
              <span className="text-muted ms-1">({team.location.city})</span>
            )}
          </div>
        )}

        {team.communication && team.communication.primaryChannel && (
          <div className="mb-2">
            <small className="text-muted">Communication:</small>
            <span className="badge bg-info ms-2">
              {team.communication.primaryChannel}
            </span>
          </div>
        )}

        {team.requiredSkills && team.requiredSkills.length > 0 && (
          <div className="mb-2">
            <small className="text-muted">Required Skills:</small>
            <div className="mt-1">
              {team.requiredSkills.map((skillObj, idx) => (
                <span key={idx} className="me-2">
                  {getPriorityBadge(skillObj.priority)}
                  <span className="small">{skillObj.skill}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {team.tags && team.tags.length > 0 && (
          <div className="mb-2">
            <small className="text-muted">Tags:</small>
            <div className="mt-1">
              {team.tags.map((tag, idx) => (
                <span key={idx} className="badge bg-light text-dark me-1">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {team.project && team.project.name && (
          <div className="mb-2">
            <small className="text-muted">Project:</small>
            <div className="mt-1">
              <strong>{team.project.name}</strong>
              {team.project.category && (
                <span className="badge bg-info ms-2">
                  {team.project.category}
                </span>
              )}
            </div>
          </div>
        )}

        {showActions && (
          <div className="d-flex gap-2 mt-3">
            {isRecommendation ? (
              <button
                className={`btn btn-${buttonConfig.variant} btn-sm`}
                onClick={() => !buttonConfig.disabled && onJoinTeam?.(team._id)}
                disabled={buttonConfig.disabled || loading}
              >
                {buttonConfig.text}
              </button>
            ) : (
              <>
                {team.leaderId === currentUser?.id ? (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => onViewDetails?.(team)}
                    >
                      Manage
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onDeleteTeam?.(team._id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => onViewDetails?.(team)}
                    >
                      View Details
                    </button>
                    {isUserInThisTeam ? (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => onLeaveTeam?.(team._id)}
                        disabled={loading}
                      >
                        Leave Team
                      </button>
                    ) : (
                      <button
                        className={`btn btn-${buttonConfig.variant} btn-sm`}
                        onClick={() => !buttonConfig.disabled && onJoinTeam?.(team._id)}
                        disabled={buttonConfig.disabled || loading}
                      >
                        {buttonConfig.text}
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCard;