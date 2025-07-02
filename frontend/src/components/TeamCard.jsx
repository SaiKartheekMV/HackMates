import React, { useState } from 'react';
import { teamAPI } from '../services/api';

const TeamCard = ({ team, currentUser, onTeamUpdate, showActions = true }) => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const isTeamMember = team.members?.some(member => 
    member.user._id === currentUser?.id || member.user === currentUser?.id
  ) || team.leader._id === currentUser?.id || team.leader === currentUser?.id;

  const isTeamLeader = team.leader._id === currentUser?.id || team.leader === currentUser?.id;

  const handleJoinTeam = async () => {
    setLoading(true);
    try {
      await teamAPI.joinTeam(team._id);
      setAlert({ type: 'success', message: 'Successfully joined the team!' });
      setShowJoinModal(false);
      if (onTeamUpdate) onTeamUpdate();
    } catch (error) {
      setAlert({ type: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToTeam = async () => {
    setLoading(true);
    try {
      await teamAPI.applyToTeam(team._id, { message: applicationMessage });
      setAlert({ type: 'success', message: 'Application submitted successfully!' });
      setShowApplyModal(false);
      setApplicationMessage('');
      if (onTeamUpdate) onTeamUpdate();
    } catch (error) {
      setAlert({ type: 'danger', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'open': return 'badge bg-success';
      case 'full': return 'badge bg-warning';
      case 'closed': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  };

  return (
    <>
      <div className="card h-100 team-card border-0 shadow-lg">
        <div className="card-body d-flex flex-column text-light">
          {/* Team Header */}
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h5 className="card-title text-warning mb-1 team-title">
                <span className="text-shadow">{team.name}</span>
              </h5>
              <small className="text-muted">
                Led by <span className="text-info">{team.leader.name}</span>
              </small>
            </div>
            <span className={`${getStatusBadgeClass(team.status)} status-badge`}>
              {team.status.toUpperCase()}
            </span>
          </div>

          {/* Team Stats */}
          <div className="row mb-3">
            <div className="col-6">
              <div className="stat-box p-2 rounded">
                <div className="text-warning small">Members</div>
                <div className="text-light fw-bold">
                  {team.currentMembers || team.members?.length || 0}/{team.maxMembers}
                </div>
              </div>
            </div>
            <div className="col-6">
              <div className="stat-box-alt p-2 rounded">
                <div className="text-warning small">Available</div>
                <div className="text-light fw-bold">
                  {team.availableSpots || (team.maxMembers - (team.members?.length || 0))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="card-text flex-grow-1 mb-3 text-light team-description">
            {team.description}
          </p>

          {/* Required Skills */}
          {team.requiredSkills && team.requiredSkills.length > 0 && (
            <div className="mb-3">
              <h6 className="text-info mb-2">🎯 Required Skills:</h6>
              <div className="d-flex flex-wrap gap-1">
                {team.requiredSkills.map((skill, index) => (
                  <span key={index} className="badge skill-badge">
                    {typeof skill === 'object' ? skill.skill : skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {team.tags && team.tags.length > 0 && (
            <div className="mb-3">
              <h6 className="text-warning mb-2">⚡ Tech Stack:</h6>
              <div className="d-flex flex-wrap gap-1">
                {team.tags.map((tag, index) => (
                  <span key={index} className="badge tech-badge">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {showActions && !isTeamMember && team.status === 'open' && (
            <div className="mt-auto">
              {team.applicationRequired ? (
                <button 
                  className="btn btn-outline-info w-100 cyber-button"
                  onClick={() => setShowApplyModal(true)}
                >
                  🚀 Apply to Join
                </button>
              ) : (
                <button 
                  className="btn btn-outline-success w-100 cyber-button"
                  onClick={() => setShowJoinModal(true)}
                >
                  ⚡ Join Team
                </button>
              )}
            </div>
          )}

          {isTeamMember && (
            <div className="mt-auto">
              <div className="badge bg-success w-100 p-2 member-badge">
                {isTeamLeader ? '👑 Team Leader' : '✅ Team Member'}
              </div>
            </div>
          )}
        </div>

        {/* Alert */}
        {alert && (
          <div className={`alert alert-${alert.type} alert-dismissible fade show m-3 mb-0`}>
            {alert.message}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setAlert(null)}
            ></button>
          </div>
        )}
      </div>

      {/* Join Confirmation Modal */}
      {showJoinModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content cyber-modal">
              <div className="modal-header">
                <h5 className="modal-title text-warning">🚀 Join Team</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowJoinModal(false)}
                ></button>
              </div>
              <div className="modal-body text-light">
                <p>Are you sure you want to join <strong className="text-info">{team.name}</strong>?</p>
                <p className="text-muted mb-0">You'll be added as a team member immediately.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={() => setShowJoinModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-success cyber-button" 
                  onClick={handleJoinTeam} 
                  disabled={loading}
                >
                  {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
                  Join Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplyModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content cyber-modal">
              <div className="modal-header">
                <h5 className="modal-title text-warning">📝 Apply to Team</h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setShowApplyModal(false)}
                ></button>
              </div>
              <div className="modal-body text-light">
                <p>Apply to join <strong className="text-info">{team.name}</strong></p>
                <div className="mb-3">
                  <label className="form-label text-light">Application Message (Optional)</label>
                  <textarea
                    className="form-control cyber-input"
                    rows="4"
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    placeholder="Tell the team why you'd be a great addition..."
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={() => setShowApplyModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline-info cyber-button" 
                  onClick={handleApplyToTeam} 
                  disabled={loading}
                >
                  {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
                  Submit Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .team-card {
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
          border: 1px solid #00ffff !important;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .team-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.5) !important;
        }

        .team-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00ffff, transparent);
          animation: scan 2s linear infinite;
        }

        @keyframes scan {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .team-title {
          font-size: 1.4rem;
          font-weight: bold;
        }

        .text-shadow {
          text-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
        }

        .status-badge {
          font-size: 0.8rem;
          text-transform: uppercase;
          text-shadow: 0 0 5px currentColor;
        }

        .stat-box {
          background: rgba(0, 255, 255, 0.1);
          border: 1px solid rgba(0, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .stat-box:hover {
          background: rgba(0, 255, 255, 0.2);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
        }

        .stat-box-alt {
          background: rgba(255, 0, 255, 0.1);
          border: 1px solid rgba(255, 0, 255, 0.3);
          transition: all 0.3s ease;
        }

        .stat-box-alt:hover {
          background: rgba(255, 0, 255, 0.2);
          box-shadow: 0 0 10px rgba(255, 0, 255, 0.3);
        }

        .team-description {
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .skill-badge {
          font-size: 0.7rem;
          border: 1px solid #17a2b8;
          color: #17a2b8;
          background: rgba(23, 162, 184, 0.1);
          transition: all 0.3s ease;
        }

        .skill-badge:hover {
          transform: scale(1.05);
          box-shadow: 0 0 10px #17a2b8;
        }

        .tech-badge {
          font-size: 0.7rem;
          border: 1px solid #ffc107;
          color: #ffc107;
          background: rgba(255, 193, 7, 0.1);
          transition: all 0.3s ease;
        }

        .tech-badge:hover {
          transform: scale(1.05);
          box-shadow: 0 0 10px #ffc107;
        }

        .cyber-button {
          border-color: currentColor;
          background: transparent;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .cyber-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left 0.5s;
        }

        .cyber-button:hover::before {
          left: 100%;
        }

        .cyber-button:hover {
          background: rgba(0, 255, 255, 0.1);
          box-shadow: 0 0 15px currentColor;
          transform: translateY(-2px);
        }

        .member-badge {
          font-size: 0.9rem;
          background: linear-gradient(45deg, #28a745, #20c997) !important;
          box-shadow: 0 0 10px rgba(40, 167, 69, 0.5);
        }

        .cyber-modal .modal-content {
          background: linear-gradient(135deg, #0f0f23, #1a1a2e);
          border: 1px solid #00ffff;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
        }

        .cyber-modal .modal-header {
          background: linear-gradient(135deg, #0f0f23, #1a1a2e);
          border-bottom: 1px solid #00ffff;
        }

        .cyber-modal .modal-body {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
        }

        .cyber-modal .modal-footer {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border-top: 1px solid #00ffff;
        }

        .cyber-input {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #00ffff;
          color: #fff;
          transition: all 0.3s ease;
        }

        .cyber-input:focus {
          background: rgba(0, 0, 0, 0.5);
          border-color: #00ffff;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
          color: #fff;
        }

        .cyber-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </>
  );
};

export default TeamCard;