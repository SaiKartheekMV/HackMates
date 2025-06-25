import React, { useState } from 'react';

const JoinTeamModal = ({ 
  show, 
  onClose, 
  team, 
  onJoinTeam, 
  loading = false 
}) => {
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onJoinTeam(team._id, {
      message: message.trim(),
      requestedRole: selectedRole
    });
  };

  const resetForm = () => {
    setMessage('');
    setSelectedRole('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!show || !team) return null;

  const availableRoles = team.preferredRoles?.map(role => role.role) || [
    'developer', 'designer', 'data_scientist', 'product_manager', 'marketing'
  ];

  return (
    <div 
      className="modal show d-block" 
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Join Team: {team.name}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                disabled={loading}
              />
            </div>
            
            <div className="modal-body">
              {/* Team Info */}
              <div className="mb-3">
                <h6>Team Information</h6>
                <div className="card bg-light">
                  <div className="card-body py-2">
                    <p className="mb-1"><strong>Description:</strong> {team.description}</p>
                    <p className="mb-1">
                      <strong>Team Size:</strong> {team.teamSize?.current || 0}/{team.teamSize?.max || 0}
                    </p>
                    {team.requiredSkills?.length > 0 && (
                      <div>
                        <strong>Required Skills:</strong>
                        <div className="mt-1">
                          {team.requiredSkills.map((skill, idx) => (
                            <span key={idx} className="badge bg-primary me-1">
                              {skill.skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div className="mb-3">
                <label className="form-label">Preferred Role</label>
                <select
                  className="form-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  required
                >
                  <option value="">Select your role</option>
                  {availableRoles.map(role => (
                    <option key={role} value={role}>
                      {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div className="mb-3">
                <label className="form-label">
                  Message to Team Leader 
                  {team.settings?.requireApproval && <span className="text-danger">*</span>}
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Tell the team why you'd like to join and what you can contribute..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required={team.settings?.requireApproval}
                />
                <div className="form-text">
                  {team.settings?.requireApproval 
                    ? "This team requires approval. Please explain why you'd like to join."
                    : "Optional: Add a message to introduce yourself to the team."
                  }
                </div>
              </div>

              {/* Warning for approval required */}
              {team.settings?.requireApproval && (
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  This team requires approval from the team leader. You'll be notified once your request is reviewed.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || (!message.trim() && team.settings?.requireApproval)}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Joining...
                  </>
                ) : team.settings?.requireApproval ? (
                  'Send Join Request'
                ) : (
                  'Join Team'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinTeamModal;