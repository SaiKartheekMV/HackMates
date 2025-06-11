import React, { useState, useEffect } from 'react';
import { teamAPI } from '../services/api'; // Adjust import path as needed

const TeamDashboard = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [applications, setApplications] = useState([]);
  const [teamAnalytics, setTeamAnalytics] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  // New team form state
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    motto: '',
    hackathonId: '',
    maxMembers: 5,
    visibility: 'public',
    joinMethod: 'open',
    categories: [],
    requiredSkills: [],
    technologies: []
  });

  // Load user's teams on component mount
  useEffect(() => {
    loadTeams();
  }, []);

  // Load team details when a team is selected
  useEffect(() => {
    if (selectedTeam) {
      loadTeamDetails(selectedTeam._id);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getMyTeams();
setTeams(Array.isArray(response.data) ? response.data : []);
if (response.data && Array.isArray(response.data) && response.data.length > 0) {
  setSelectedTeam(response.data[0]);
}
    } catch (err) {
      setError('Failed to load teams');
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamDetails = async (teamId) => {
    try {
      const [teamResponse, applicationsResponse, analyticsResponse] = await Promise.all([
        teamAPI.getTeamById(teamId),
        teamAPI.getApplications(teamId).catch(() => ({ data: [] })),
        teamAPI.getTeamAnalytics(teamId).catch(() => ({ data: null }))
      ]);
      
      setSelectedTeam(teamResponse.data);
      setApplications(applicationsResponse.data || []);
      setTeamAnalytics(analyticsResponse.data);
    } catch (err) {
      console.error('Error loading team details:', err);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
const response = await teamAPI.createTeam(newTeam);
setTeams(prevTeams => [...(Array.isArray(prevTeams) ? prevTeams : []), response.data]);

      setShowCreateModal(false);
      setNewTeam({
        name: '',
        description: '',
        motto: '',
        hackathonId: '',
        maxMembers: 5,
        visibility: 'public',
        joinMethod: 'open',
        categories: [],
        requiredSkills: [],
        technologies: []
      });
    } catch (err) {
      setError('Failed to create team');
      console.error('Error creating team:', err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedTeam || !window.confirm('Are you sure you want to remove this member?')) return;
    
    try {
      await teamAPI.removeMember(selectedTeam._id, memberId);
      loadTeamDetails(selectedTeam._id);
    } catch (err) {
      setError('Failed to remove member');
      console.error('Error removing member:', err);
    }
  };

  const handleReviewApplication = async (applicationId, decision) => {
    try {
      await teamAPI.reviewApplication(selectedTeam._id, applicationId, { 
        decision, 
        feedback: decision === 'rejected' ? 'Application reviewed' : 'Welcome to the team!' 
      });
      loadTeamDetails(selectedTeam._id);
    } catch (err) {
      setError('Failed to review application');
      console.error('Error reviewing application:', err);
    }
  };

  const handleGenerateInvite = async () => {
    try {
      const response = await teamAPI.generateInviteLink(selectedTeam._id, {
        maxUses: 5,
        expiresIn: 24
      });
      setInviteLink(response.data.inviteLink || response.data.code);
      setShowInviteModal(true);
    } catch (err) {
      setError('Failed to generate invite link');
      console.error('Error generating invite:', err);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      'forming': 'bg-info',
      'recruiting': 'bg-warning',
      'complete': 'bg-success',
      'developing': 'bg-primary',
      'testing': 'bg-secondary',
      'submitted': 'bg-success',
      'finished': 'bg-dark'
    };
    return statusClasses[status] || 'bg-secondary';
  };

  const getRoleIcon = (role) => {
    const roleIcons = {
      'leader': '👑',
      'co_leader': '⭐',
      'frontend_dev': '🎨',
      'backend_dev': '⚙️',
      'fullstack_dev': '🔧',
      'mobile_dev': '📱',
      'ui_designer': '🎭',
      'ux_designer': '🎯',
      'data_scientist': '📊',
      'ml_engineer': '🤖',
      'devops': '☁️',
      'qa_tester': '🧪',
      'pm': '📋',
      'other': '👤'
    };
    return roleIcons[role] || '👤';
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          {error}
          <button className="btn btn-sm btn-outline-danger ms-2" onClick={loadTeams}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Sidebar - Team List */}
        <div className="col-md-3 col-lg-2">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">My Teams</h6>
              <button 
                className="btn btn-sm btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                <i className="bi bi-plus"></i>
              </button>
            </div>
            <div className="card-body p-0">
              <div className="list-group list-group-flush">
                {Array.isArray(teams) && teams.map(team => (
                  <button
                    key={team._id}
                    className={`list-group-item list-group-item-action ${selectedTeam?._id === team._id ? 'active' : ''}`}
                    onClick={() => setSelectedTeam(team)}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-1">{team.name}</h6>
                        <small className={`badge ${getStatusBadgeClass(team.status)}`}>
                          {team.status}
                        </small>
                      </div>
                      <small>{team.currentSize}/{team.maxMembers}</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9 col-lg-10">
          {selectedTeam ? (
            <>
              {/* Team Header */}
              <div className="card mb-4">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h2 className="card-title">{selectedTeam.name}</h2>
                      <p className="card-text text-muted">{selectedTeam.description}</p>
                      {selectedTeam.motto && (
                        <p className="card-text"><em>"{selectedTeam.motto}"</em></p>
                      )}
                      <div className="d-flex gap-2 flex-wrap">
                        <span className={`badge ${getStatusBadgeClass(selectedTeam.status)}`}>
                          {selectedTeam.status}
                        </span>
                        <span className="badge bg-secondary">
                          {selectedTeam.currentSize}/{selectedTeam.maxMembers} members
                        </span>
                        <span className="badge bg-info">
                          {selectedTeam.visibility}
                        </span>
                      </div>
                    </div>
                    <div className="btn-group">
                      <button 
                        className="btn btn-outline-primary"
                        onClick={handleGenerateInvite}
                      >
                        <i className="bi bi-share"></i> Invite
                      </button>
                      <button className="btn btn-outline-secondary">
                        <i className="bi bi-gear"></i> Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'members' ? 'active' : ''}`}
                    onClick={() => setActiveTab('members')}
                  >
                    Members ({selectedTeam.currentSize})
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'project' ? 'active' : ''}`}
                    onClick={() => setActiveTab('project')}
                  >
                    Project
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applications')}
                  >
                    Applications ({applications.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                  >
                    Analytics
                  </button>
                </li>
              </ul>

              {/* Tab Content */}
              <div className="tab-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="row">
                    <div className="col-md-8">
                      <div className="card mb-4">
                        <div className="card-header">
                          <h5>Team Progress</h5>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label">Team Completion</label>
                            <div className="progress">
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{ width: `${selectedTeam.completionPercentage}%` }}
                              >
                                {selectedTeam.completionPercentage}%
                              </div>
                            </div>
                          </div>
                          {selectedTeam.health && (
                            <div className="mb-3">
                              <label className="form-label">Team Health</label>
                              <div className="progress">
                                <div 
                                  className={`progress-bar ${selectedTeam.health.score > 80 ? 'bg-success' : selectedTeam.health.score > 60 ? 'bg-warning' : 'bg-danger'}`}
                                  role="progressbar" 
                                  style={{ width: `${selectedTeam.health.score}%` }}
                                >
                                  {selectedTeam.health.score}%
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="card">
                        <div className="card-header">
                          <h5>Required Skills</h5>
                        </div>
                        <div className="card-body">
                          {selectedTeam.requiredSkills && selectedTeam.requiredSkills.length > 0 ? (
                            <div className="row">
                              {selectedTeam.requiredSkills.map((skill, index) => (
                                <div key={index} className="col-md-6 col-lg-4 mb-3">
                                  <div className="card">
                                    <div className="card-body">
                                      <h6 className="card-title">{skill.skill}</h6>
                                      <p className="card-text">
                                        <small className="text-muted">
                                          Level: {skill.level} | Priority: {skill.priority}
                                        </small>
                                      </p>
                                      <div className="progress">
                                        <div 
                                          className="progress-bar" 
                                          role="progressbar" 
                                          style={{ width: `${(skill.fulfilled / skill.count) * 100}%` }}
                                        >
                                          {skill.fulfilled}/{skill.count}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted">No specific skills required</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="card mb-4">
                        <div className="card-header">
                          <h5>Quick Stats</h5>
                        </div>
                        <div className="card-body">
                          <div className="row text-center">
                            <div className="col-6">
                              <h3 className="text-primary">{selectedTeam.statistics?.profileViews || 0}</h3>
                              <small className="text-muted">Profile Views</small>
                            </div>
                            <div className="col-6">
                              <h3 className="text-success">{selectedTeam.statistics?.applicationsReceived || 0}</h3>
                              <small className="text-muted">Applications</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="card">
                        <div className="card-header">
                          <h5>Team Categories</h5>
                        </div>
                        <div className="card-body">
                          {selectedTeam.categories && selectedTeam.categories.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                              {selectedTeam.categories.map((category, index) => (
                                <span key={index} className="badge bg-secondary">
                                  {category}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted">No categories assigned</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                  <div className="card">
                    <div className="card-header">
                      <h5>Team Members</h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        {selectedTeam.members && selectedTeam.members.filter(m => m.status === 'active').map((member, index) => (
                          <div key={index} className="col-md-6 col-lg-4 mb-3">
                            <div className="card">
                              <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <h6 className="card-title">
                                      {getRoleIcon(member.role)} {member.userId?.firstName || 'Unknown'} {member.userId?.lastName || ''}
                                    </h6>
                                    <p className="card-text">
                                      <small className="text-muted">{member.role}</small>
                                    </p>
                                    {member.skills && member.skills.length > 0 && (
                                      <div className="mt-2">
                                        {member.skills.slice(0, 3).map((skill, skillIndex) => (
                                          <span key={skillIndex} className="badge bg-light text-dark me-1">
                                            {skill.name}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  {member.role !== 'leader' && (
                                    <div className="dropdown">
                                      <button 
                                        className="btn btn-sm btn-outline-secondary"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                      >
                                        <i className="bi bi-three-dots"></i>
                                      </button>
                                      <ul className="dropdown-menu">
                                        <li>
                                          <button 
                                            className="dropdown-item text-danger"
                                            onClick={() => handleRemoveMember(member.userId._id)}
                                          >
                                            Remove Member
                                          </button>
                                        </li>
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Tab */}
                {activeTab === 'project' && (
                  <div className="card">
                    <div className="card-header">
                      <h5>Project Details</h5>
                    </div>
                    <div className="card-body">
                      {selectedTeam.projectDetails ? (
                        <div className="row">
                          <div className="col-md-8">
                            <h6>Project Idea</h6>
                            <p>{selectedTeam.projectDetails.idea || 'No project idea specified yet'}</p>
                            
                            <h6>Problem Statement</h6>
                            <p>{selectedTeam.projectDetails.problem || 'No problem statement defined yet'}</p>
                            
                            <h6>Solution</h6>
                            <p>{selectedTeam.projectDetails.solution || 'No solution described yet'}</p>
                            
                            {selectedTeam.projectDetails.features && selectedTeam.projectDetails.features.length > 0 && (
                              <>
                                <h6>Features</h6>
                                <ul>
                                  {selectedTeam.projectDetails.features.map((feature, index) => (
                                    <li key={index}>{feature}</li>
                                  ))}
                                </ul>
                              </>
                            )}
                          </div>
                          <div className="col-md-4">
                            <h6>Tech Stack</h6>
                            {selectedTeam.projectDetails.technologies && selectedTeam.projectDetails.technologies.length > 0 ? (
                              <div className="d-flex flex-wrap gap-2">
                                {selectedTeam.projectDetails.technologies.map((tech, index) => (
                                  <span key={index} className="badge bg-primary">
                                    {tech.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted">No technologies specified</p>
                            )}
                            
                            {selectedTeam.projectDetails.repositories && selectedTeam.projectDetails.repositories.length > 0 && (
                              <>
                                <h6 className="mt-3">Repositories</h6>
                                {selectedTeam.projectDetails.repositories.map((repo, index) => (
                                  <div key={index} className="mb-2">
                                    <a href={repo.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                      {repo.name}
                                    </a>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted">No project details available yet</p>
                          <button className="btn btn-primary">Add Project Details</button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Applications Tab */}
                {activeTab === 'applications' && (
                  <div className="card">
                    <div className="card-header">
                      <h5>Team Applications</h5>
                    </div>
                    <div className="card-body">
                      {applications && applications.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Applicant</th>
                                <th>Role</th>
                                <th>Message</th>
                                <th>Applied</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {applications.map((app, index) => (
                                <tr key={index}>
                                  <td>{app.userId?.firstName} {app.userId?.lastName}</td>
                                  <td>{app.role}</td>
                                  <td>{app.message}</td>
                                  <td>{new Date(app.appliedAt).toLocaleDateString()}</td>
                                  <td>
                                    <span className={`badge ${app.status === 'pending' ? 'bg-warning' : app.status === 'accepted' ? 'bg-success' : 'bg-danger'}`}>
                                      {app.status}
                                    </span>
                                  </td>
                                  <td>
                                    {app.status === 'pending' && (
                                      <div className="btn-group">
                                        <button 
                                          className="btn btn-sm btn-success"
                                          onClick={() => handleReviewApplication(app._id, 'accepted')}
                                        >
                                          Accept
                                        </button>
                                        <button 
                                          className="btn btn-sm btn-danger"
                                          onClick={() => handleReviewApplication(app._id, 'rejected')}
                                        >
                                          Reject
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-muted">No applications received yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card mb-4">
                        <div className="card-header">
                          <h5>Performance Metrics</h5>
                        </div>
                        <div className="card-body">
                          <div className="row text-center">
                            <div className="col-6">
                              <h3 className="text-primary">{selectedTeam.statistics?.totalCommits || 0}</h3>
                              <small className="text-muted">Total Commits</small>
                            </div>
                            <div className="col-6">
                              <h3 className="text-success">{selectedTeam.statistics?.tasksCompleted || 0}</h3>
                              <small className="text-muted">Tasks Completed</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card mb-4">
                        <div className="card-header">
                          <h5>Team Engagement</h5>
                        </div>
                        <div className="card-body">
                          <div className="row text-center">
                            <div className="col-6">
                              <h3 className="text-info">{selectedTeam.statistics?.meetingsHeld || 0}</h3>
                              <small className="text-muted">Meetings Held</small>
                            </div>
                            <div className="col-6">
                              <h3 className="text-warning">{selectedTeam.statistics?.averageRating || 0}</h3>
                              <small className="text-muted">Avg Rating</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-5">
              <h3 className="text-muted">No Team Selected</h3>
              <p>Select a team from the sidebar or create a new one</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                Create New Team
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Team</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateTeam}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Team Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newTeam.name}
                          onChange={(e) => setNewTeam({...newTeam, name: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Max Members</label>
                        <select
                          className="form-select"
                          value={newTeam.maxMembers}
                          onChange={(e) => setNewTeam({...newTeam, maxMembers: parseInt(e.target.value)})}
                        >
                          {[2,3,4,5,6,7,8,9,10].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Description *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newTeam.description}
                      onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Team Motto</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTeam.motto}
                      onChange={(e) => setNewTeam({...newTeam, motto: e.target.value})}
                      placeholder="Optional team motto"
                    />
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Visibility</label>
                        <select
                          className="form-select"
                          value={newTeam.visibility}
                          onChange={(e) => setNewTeam({...newTeam, visibility: e.target.value})}
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                          <option value="invite_only">Invite Only</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Join Method</label>
                        <select
                          className="form-select"
                          value={newTeam.joinMethod}
                          onChange={(e) => setNewTeam({...newTeam, joinMethod: e.target.value})}
                        >
                          <option value="open">Open</option>
                          <option value="application">Application</option>
                          <option value="invite_only">Invite Only</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
               <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Invite Team Members</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowInviteModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Invite Link</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={inviteLink}
                      readOnly
                    />
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={copyInviteLink}
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div className="alert alert-info">
                  <small>
                    <i className="bi bi-info-circle"></i> This link is valid for 24 hours and can be used up to 5 times.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowInviteModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDashboard;