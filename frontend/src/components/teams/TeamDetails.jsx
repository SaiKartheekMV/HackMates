import React from 'react';

const TeamDetails = ({ team, currentUser, onClose }) => {
  if (!team) return null;

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
      <span className={`badge bg-${priorityColors[priority] || "primary"}`}>
        {priority}
      </span>
    );
  };

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{team.name}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-8">
                <h6>Description</h6>
                <p>{team.description}</p>

                {team.project && team.project.name && (
                  <>
                    <h6>Project Details</h6>
                    <p>
                      <strong>Name:</strong> {team.project.name}
                    </p>
                    {team.project.description && (
                      <p>
                        <strong>Description:</strong>{" "}
                        {team.project.description}
                      </p>
                    )}
                    {team.project.category && (
                      <p>
                        <strong>Category:</strong>{" "}
                        <span className="badge bg-info">
                          {team.project.category}
                        </span>
                      </p>
                    )}
                    {team.project.technologies &&
                      team.project.technologies.length > 0 && (
                        <div>
                          <strong>Technologies:</strong>
                          <div className="mt-1">
                            {team.project.technologies.map((tech, idx) => (
                              <span
                                key={idx}
                                className="badge bg-secondary me-1"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </>
                )}

                {team.requiredSkills && team.requiredSkills.length > 0 && (
                  <>
                    <h6 className="mt-3">Required Skills</h6>
                    <div>
                      {team.requiredSkills.map((skillObj, idx) => (
                        <span key={idx} className="me-2 mb-1 d-inline-block">
                          {getPriorityBadge(skillObj.priority)}
                          <span className="ms-1">{skillObj.skill}</span>
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {team.preferredRoles && team.preferredRoles.length > 0 && (
                  <>
                    <h6 className="mt-3">Preferred Roles</h6>
                    <div>
                      {team.preferredRoles.map((roleObj, idx) => (
                        <span
                          key={idx}
                          className="badge bg-outline-primary me-2 mb-1"
                        >
                          {roleObj.role} ({roleObj.count})
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {team.tags && team.tags.length > 0 && (
                  <>
                    <h6 className="mt-3">Tags</h6>
                    <div>
                      {team.tags.map((tag, idx) => (
                        <span key={idx} className="badge bg-light text-dark me-1">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="col-md-4">
                <h6>Team Information</h6>
                <div className="card">
                  <div className="card-body">
                    <p>
                      <strong>Status:</strong> {getStatusBadge(team.status)}
                    </p>
                    <p>
                      <strong>Team Size:</strong>{" "}
                      {team.teamSize?.current || 0}/{team.teamSize?.max || 0}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {new Date(team.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Leader:</strong>{" "}
                      {team.leader?.firstName} {team.leader?.lastName}
                    </p>

                    {team.stats && (
                      <>
                        <p>
                          <strong>Completion:</strong>{" "}
                          {team.stats.completionScore}%
                        </p>
                        <p>
                          <strong>Match Score:</strong>{" "}
                          {team.stats.matchScore}%
                        </p>
                      </>
                    )}

                    {team.location && (
                      <p>
                        <strong>Location:</strong>{" "}
                        <span className="badge bg-secondary">
                          {team.location.preference}
                        </span>
                        {team.location.city && (
                          <span className="text-muted ms-1">
                            ({team.location.city})
                          </span>
                        )}
                      </p>
                    )}

                    {team.communication && team.communication.primaryChannel && (
                      <p>
                        <strong>Communication:</strong>{" "}
                        <span className="badge bg-info">
                          {team.communication.primaryChannel}
                        </span>
                      </p>
                    )}

                    {team.settings && (
                      <div className="mt-3">
                        <h6>Settings</h6>
                        <div>
                          {team.settings.isPublic && (
                            <span className="badge bg-success me-1">Public</span>
                          )}
                          {team.settings.allowDirectJoin && (
                            <span className="badge bg-info me-1">
                              Direct Join
                            </span>
                          )}
                          {team.settings.requireApproval && (
                            <span className="badge bg-warning me-1">
                              Requires Approval
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {team.members && team.members.length > 0 && (
                  <>
                    <h6 className="mt-3">Team Members</h6>
                    <div className="list-group list-group-flush">
                      {team.members.map((member, idx) => (
                        <div key={idx} className="list-group-item px-0">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">
                                {member.user?.firstName} {member.user?.lastName}
                              </h6>
                              <p className="mb-1 small text-muted">
                                {member.role}
                              </p>
                              <small className="text-muted">
                                Joined:{" "}
                                {new Date(member.joinedAt).toLocaleDateString()}
                              </small>
                            </div>
                            <span
                              className={`badge ${
                                member.status === "active"
                                  ? "bg-success"
                                  : "bg-warning"
                              }`}
                            >
                              {member.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
            {team.leaderId === currentUser?.id && (
              <div className="btn-group">
                <button className="btn btn-primary">Edit Team</button>
                <button className="btn btn-info">Manage Members</button>
                <button className="btn btn-success">View Analytics</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetails;