import React, { useState, useEffect } from 'react';
import { teamAPI } from '../services/api';

const TeamDashboard = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    tagline: '',
    hackathonId: '',
    maxSize: 5,
    requiredSkills: [],
    preferredRoles: [],
    projectCategory: '',
    communicationChannel: 'discord',
    isPublic: true
  });

  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'developer'
  });

  const [skillInput, setSkillInput] = useState('');
  const [currentUser] = useState({ id: 'current_user_id' }); // This should come from auth context

  const roleOptions = ['developer', 'designer', 'data_scientist', 'product_manager', 'marketing', 'other'];
  const skillPriorities = ['low', 'medium', 'high', 'critical'];
  const projectCategories = ['web', 'mobile', 'ai_ml', 'blockchain', 'iot', 'ar_vr', 'gaming', 'fintech', 'healthtech', 'edtech', 'other'];

  useEffect(() => {
    fetchMyTeams();
  }, []);

  const fetchMyTeams = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getMyTeams();
      setTeams(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedTeam(response.data[0]);
      }
    } catch (error) {
      setError('Failed to fetch teams');
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const teamData = {
        ...newTeam,
        teamSize: { max: newTeam.maxSize },
        requiredSkills: newTeam.requiredSkills.map(skill => ({
          skill: skill.name,
          priority: skill.priority || 'medium'
        })),
        preferredRoles: newTeam.preferredRoles.map(role => ({
          role: role.name,
          count: role.count || 1
        })),
        project: {
          category: newTeam.projectCategory
        },
        communication: {
          primaryChannel: newTeam.communicationChannel
        },
        settings: {
          isPublic: newTeam.isPublic
        }
      };

      const response = await teamAPI.createTeam(teamData);
      setSuccess('Team created successfully!');
      setShowCreateModal(false);
      setNewTeam({
        name: '',
        description: '',
        tagline: '',
        hackathonId: '',
        maxSize: 5,
        requiredSkills: [],
        preferredRoles: [],
        projectCategory: '',
        communicationChannel: 'discord',
        isPublic: true
      });
      fetchMyTeams();
    } catch (error) {
      setError('Failed to create team');
      console.error('Error creating team:', error);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    try {
      await teamAPI.inviteToTeam(selectedTeam._id, inviteData);
      setSuccess('Invitation sent successfully!');
      setShowInviteModal(false);
      setInviteData({ email: '', role: 'developer' });
      // Refresh team data
      const updatedTeam = await teamAPI.getTeamById(selectedTeam._id);
      setSelectedTeam(updatedTeam.data);
    } catch (error) {
      setError('Failed to send invitation');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await teamAPI.removeMember(selectedTeam._id, userId);
        setSuccess('Member removed successfully!');
        const updatedTeam = await teamAPI.getTeamById(selectedTeam._id);
        setSelectedTeam(updatedTeam.data);
      } catch (error) {
        setError('Failed to remove member');
      }
    }
  };

  const handleLeaveTeam = async () => {
    if (window.confirm('Are you sure you want to leave this team?')) {
      try {
        await teamAPI.leaveTeam(selectedTeam._id);
        setSuccess('Left team successfully!');
        fetchMyTeams();
      } catch (error) {
        setError('Failed to leave team');
      }
    }
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setNewTeam({
        ...newTeam,
        requiredSkills: [...newTeam.requiredSkills, { name: skillInput.trim(), priority: 'medium' }]
      });
      setSkillInput('');
    }
  };

  const removeSkill = (index) => {
    setNewTeam({
      ...newTeam,
      requiredSkills: newTeam.requiredSkills.filter((_, i) => i !== index)
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'forming': return 'bg-warning';
      case 'complete': return 'bg-success';
      case 'competing': return 'bg-primary';
      case 'finished': return 'bg-secondary';
      case 'disbanded': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'leader': return 'bg-primary';
      case 'developer': return 'bg-info';
      case 'designer': return 'bg-success';
      case 'data_scientist': return 'bg-warning';
      case 'product_manager': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      <div className="row">
        {/* Sidebar - Team List */}
        <div className="col-md-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">My Teams</h5>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
                <i className="bi bi-plus"></i> New
              </button>
            </div>
            <div className="card-body p-0">
              {teams.length === 0 ? (
                <div className="p-3 text-center text-muted">
                  No teams found
                </div>
              ) : (
                teams.map(team => (
                  <div
                    key={team._id}
                    className={`list-group-item list-group-item-action ${selectedTeam?._id === team._id ? 'active' : ''}`}
                    onClick={() => setSelectedTeam(team)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">{team.name}</h6>
                        <p className="mb-1 small">{team.tagline || 'No tagline'}</p>
                        <small>
                          <span className={`badge ${getStatusBadgeClass(team.status)} me-2`}>
                            {team.status}
                          </span>
                          {team.teamSize?.current || 0}/{team.teamSize?.max || 0} members
                        </small>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-9">
          {selectedTeam ? (
            <div className="card">
              <div className="card-header">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-0">{selectedTeam.name}</h4>
                    <small className="text-muted">{selectedTeam.tagline}</small>
                  </div>
                  <div>
                    <span className={`badge ${getStatusBadgeClass(selectedTeam.status)} me-2`}>
                      {selectedTeam.status}
                    </span>
                    {selectedTeam.leaderId === currentUser.id && (
                      <button className="btn btn-outline-primary btn-sm me-2" onClick={() => setShowInviteModal(true)}>
                        <i className="bi bi-person-plus"></i> Invite
                      </button>
                    )}
                    {selectedTeam.leaderId !== currentUser.id && (
                      <button className="btn btn-outline-danger btn-sm" onClick={handleLeaveTeam}>
                        <i className="bi bi-box-arrow-right"></i> Leave
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="card-body">
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
                      Members
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
                      className={`nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                      onClick={() => setActiveTab('settings')}
                    >
                      Settings
                    </button>
                  </li>
                </ul>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div className="row">
                    <div className="col-md-8">
                      <h5>Description</h5>
                      <p>{selectedTeam.description}</p>

                      <h5>Required Skills</h5>
                      <div className="mb-3">
                        {selectedTeam.requiredSkills?.map((skill, index) => (
                          <span key={index} className={`badge bg-secondary me-2 mb-2`}>
                            {skill.skill} 
                            <span className={`ms-1 badge ${skill.priority === 'critical' ? 'bg-danger' : skill.priority === 'high' ? 'bg-warning' : 'bg-info'}`}>
                              {skill.priority}
                            </span>
                          </span>
                        )) || <span className="text-muted">No specific skills required</span>}
                      </div>

                      <h5>Communication</h5>
                      <p>
                        Primary: <strong>{selectedTeam.communication?.primaryChannel || 'Not set'}</strong>
                        {selectedTeam.communication?.channelLink && (
                          <a href={selectedTeam.communication.channelLink} target="_blank" rel="noopener noreferrer" className="ms-2">
                            Join Channel
                          </a>
                        )}
                      </p>
                    </div>

                    <div className="col-md-4">
                      <div className="card bg-light">
                        <div className="card-body">
                          <h6>Team Statistics</h6>
                          <div className="mb-2">
                            <small className="text-muted">Team Size:</small>
                            <div className="progress mb-2">
                              <div 
                                className="progress-bar" 
                                style={{width: `${((selectedTeam.teamSize?.current || 0) / (selectedTeam.teamSize?.max || 1)) * 100}%`}}
                              >
                                {selectedTeam.teamSize?.current || 0}/{selectedTeam.teamSize?.max || 0}
                              </div>
                            </div>
                          </div>
                          <div className="mb-2">
                            <small className="text-muted">Profile Completion:</small>
                            <div className="progress mb-2">
                              <div 
                                className="progress-bar bg-success" 
                                style={{width: `${selectedTeam.stats?.completionScore || 0}%`}}
                              >
                                {selectedTeam.stats?.completionScore || 0}%
                              </div>
                            </div>
                          </div>
                          <small className="text-muted">
                            Views: {selectedTeam.stats?.viewCount || 0}<br/>
                            Applications: {selectedTeam.stats?.totalApplications || 0}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div>
                    <h5>Team Members ({selectedTeam.members?.filter(m => m.status === 'active').length || 0})</h5>
                    <div className="row">
                      {selectedTeam.members?.filter(m => m.status === 'active').map(member => (
                        <div key={member._id} className="col-md-6 mb-3">
                          <div className="card">
                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <h6 className="mb-1">
                                    {member.userId?.firstName} {member.userId?.lastName}
                                    {member.userId._id === selectedTeam.leaderId && (
                                      <i className="bi bi-crown-fill text-warning ms-2"></i>
                                    )}
                                  </h6>
                                  <span className={`badge ${getRoleBadgeClass(member.role)}`}>
                                    {member.role}
                                  </span>
                                  <small className="text-muted d-block">
                                    Joined: {new Date(member.joinedAt).toLocaleDateString()}
                                  </small>
                                  {member.contribution && (
                                    <small className="text-muted d-block">
                                      {member.contribution}
                                    </small>
                                  )}
                                </div>
                                {selectedTeam.leaderId === currentUser.id && member.userId._id !== selectedTeam.leaderId && (
                                  <button 
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => handleRemoveMember(member.userId._id)}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )) || <p className="text-muted">No active members</p>}
                    </div>

                    <h5 className="mt-4">Open Positions</h5>
                    <div className="row">
                      {selectedTeam.preferredRoles?.map((role, index) => (
                        <div key={index} className="col-md-4 mb-2">
                          <div className="card bg-light">
                            <div className="card-body py-2">
                              <small>
                                <strong>{role.role}</strong>: {role.filled || 0}/{role.count || 1}
                                {role.filled < role.count && (
                                  <span className="badge bg-success ms-2">Open</span>
                                )}
                              </small>
                            </div>
                          </div>
                        </div>
                      )) || <p className="text-muted">No specific roles defined</p>}
                    </div>
                  </div>
                )}

                {activeTab === 'project' && (
                  <div>
                    <div className="row">
                      <div className="col-md-8">
                        <h5>Project Information</h5>
                        <div className="mb-3">
                          <label className="form-label"><strong>Project Name:</strong></label>
                          <p>{selectedTeam.project?.name || 'Not set'}</p>
                        </div>
                        <div className="mb-3">
                          <label className="form-label"><strong>Description:</strong></label>
                          <p>{selectedTeam.project?.description || 'No description provided'}</p>
                        </div>
                        <div className="mb-3">
                          <label className="form-label"><strong>Category:</strong></label>
                          <p>{selectedTeam.project?.category || 'Not specified'}</p>
                        </div>
                        <div className="mb-3">
                          <label className="form-label"><strong>Technologies:</strong></label>
                          <div>
                            {selectedTeam.project?.technologies?.map((tech, index) => (
                              <span key={index} className="badge bg-primary me-2 mb-1">{tech}</span>
                            )) || <span className="text-muted">No technologies listed</span>}
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card bg-light">
                          <div className="card-body">
                            <h6>Project Status</h6>
                            <span className={`badge ${selectedTeam.project?.status === 'completed' ? 'bg-success' : 'bg-warning'} mb-3`}>
                              {selectedTeam.project?.status || 'planning'}
                            </span>
                            
                            <h6>Links</h6>
                            {selectedTeam.project?.repositoryUrl && (
                              <a href={selectedTeam.project.repositoryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm mb-2 d-block">
                                <i className="bi bi-github"></i> Repository
                              </a>
                            )}
                            {selectedTeam.project?.demoUrl && (
                              <a href={selectedTeam.project.demoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-success btn-sm mb-2 d-block">
                                <i className="bi bi-play-circle"></i> Demo
                              </a>
                            )}
                            {selectedTeam.project?.figmaUrl && (
                              <a href={selectedTeam.project.figmaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-info btn-sm mb-2 d-block">
                                <i className="bi bi-palette"></i> Design
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div>
                    <h5>Team Settings</h5>
                    {selectedTeam.leaderId === currentUser.id ? (
                      <div className="row">
                        <div className="col-md-6">
                          <div className="card">
                            <div className="card-body">
                              <h6>Visibility Settings</h6>
                              <div className="mb-3">
                                <span className="badge bg-info">
                                  {selectedTeam.settings?.visibility || 'public'}
                                </span>
                              </div>
                              <div className="form-check">
                                <input 
                                  type="checkbox" 
                                  className="form-check-input" 
                                  checked={selectedTeam.settings?.isPublic}
                                  readOnly
                                />
                                <label className="form-check-label">Public Team</label>
                              </div>
                              <div className="form-check">
                                <input 
                                  type="checkbox" 
                                  className="form-check-input" 
                                  checked={selectedTeam.settings?.allowDirectJoin}
                                  readOnly
                                />
                                <label className="form-check-label">Allow Direct Join</label>
                              </div>
                              <div className="form-check">
                                <input 
                                  type="checkbox" 
                                  className="form-check-input" 
                                  checked={selectedTeam.settings?.requireApproval}
                                  readOnly
                                />
                                <label className="form-check-label">Require Approval</label>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="card">
                            <div className="card-body">
                              <h6>Location Preferences</h6>
                              <p><strong>Type:</strong> {selectedTeam.location?.preference || 'remote'}</p>
                              {selectedTeam.location?.city && (
                                <p><strong>City:</strong> {selectedTeam.location.city}</p>
                              )}
                              {selectedTeam.location?.country && (
                                <p><strong>Country:</strong> {selectedTeam.location.country}</p>
                              )}
                              {selectedTeam.location?.timezone && (
                                <p><strong>Timezone:</strong> {selectedTeam.location.timezone}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-info">
                        Only team leaders can view and modify settings.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body text-center">
                <h5>No Team Selected</h5>
                <p className="text-muted">Select a team from the sidebar or create a new one.</p>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  Create New Team
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Team</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
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
                          maxLength={100}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Tagline</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newTeam.tagline}
                          onChange={(e) => setNewTeam({...newTeam, tagline: e.target.value})}
                          maxLength={200}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Max Team Size</label>
                        <select
                          className="form-select"
                          value={newTeam.maxSize}
                          onChange={(e) => setNewTeam({...newTeam, maxSize: parseInt(e.target.value)})}
                        >
                          {[2,3,4,5,6,7,8,9,10].map(size => (
                            <option key={size} value={size}>{size} members</option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Project Category</label>
                        <select
                          className="form-select"
                          value={newTeam.projectCategory}
                          onChange={(e) => setNewTeam({...newTeam, projectCategory: e.target.value})}
                        >
                          <option value="">Select Category</option>
                          {projectCategories.map(cat => (
                            <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Description *</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          value={newTeam.description}
                          onChange={(e) => setNewTeam({...newTeam, description: e.target.value})}
                          required
                          maxLength={1000}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Communication Channel</label>
                        <select
                          className="form-select"
                          value={newTeam.communicationChannel}
                          onChange={(e) => setNewTeam({...newTeam, communicationChannel: e.target.value})}
                        >
                          <option value="discord">Discord</option>
                          <option value="slack">Slack</option>
                          <option value="telegram">Telegram</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="teams">Microsoft Teams</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id="isPublic"
                            checked={newTeam.isPublic}
                            onChange={(e) => setNewTeam({...newTeam, isPublic: e.target.checked})}
                          />
                          <label className="form-check-label" htmlFor="isPublic">
                            Make team public
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Required Skills</label>
                    <div className="input-group mb-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Add a skill..."
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <button type="button" className="btn btn-outline-secondary" onClick={addSkill}>
                        Add
                      </button>
                    </div>
                    <div>
                      {newTeam.requiredSkills.map((skill, index) => (
                        <span key={index} className="badge bg-secondary me-2 mb-2">
                          {skill.name}
                          <button
                            type="button"
                            className="btn-close btn-close-white ms-2"
                            style={{fontSize: '0.6rem'}}
                            onClick={() => removeSkill(index)}
                          ></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
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

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Invite Team Member</h5>
                <button type="button" className="btn-close" onClick={() => setShowInviteModal(false)}></button>
              </div>
              <form onSubmit={handleInviteMember}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={inviteData.email}
                      onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={inviteData.role}
                      onChange={(e) => setInviteData({...inviteData, role: e.target.value})}
                    >
                      {roleOptions.map(role => (
                        <option key={role} value={role}>
                          {role.replace('_', ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Send Invitation
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDashboard;