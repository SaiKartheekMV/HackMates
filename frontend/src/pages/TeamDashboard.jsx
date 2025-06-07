import React, { useState, useEffect, } from 'react';
import { teamAPI, hackathonAPI} from '../services/api'; // Adjust import path as needed

const TeamDashboard = () => {
  // State management
  const [activeTab, setActiveTab] = useState('browse');
  const [teams, setTeams] = useState([]);
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [hackathons, setHackathons] = useState([]); // State for hackathons
  

  // Form state for team creation
const [teamForm, setTeamForm] = useState({
  name: '',
  description: '',
  hackathonId: '', // Required field for hackathon selection
  maxMembers: 5,
  requiredSkills: [],
  lookingFor: { 
    roles: [], 
    count: 1, 
    description: '' 
  },
  isPublic: true,
  projectDetails: { 
    idea: '', 
    technologies: [] 
  },
  communication: { 
    preferredMethod: 'discord', 
    discord: '', 
    email: '' 
  },
  preferences: {
    timezone: 'UTC',
    workingStyle: 'collaborative',
    meetingFrequency: 'as_needed',
    experienceLevel: 'mixed'
  },
  tags: []
});

  const [newSkill, setNewSkill] = useState({ skill: '', level: 'intermediate', priority: 'medium' });
  const [newTag, setNewTag] = useState('');
  const [newTech, setNewTech] = useState('');

  // Predefined options
  const skillLevels = ['beginner', 'intermediate', 'advanced'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  const roles = ['developer', 'designer', 'data_scientist', 'pm', 'marketer', 'other'];
  const workingStyles = ['collaborative', 'independent', 'mixed'];
  const meetingFreq = ['daily', 'every_other_day', 'weekly', 'as_needed'];
  const expLevels = ['beginner', 'intermediate', 'advanced', 'mixed'];
  const commMethods = ['discord', 'slack', 'whatsapp', 'telegram', 'email'];

  // Load data on component mount
  useEffect(() => {
    loadMyTeams();
    loadBrowseTeams();
  }, []);

  useEffect(() => {
  if (showCreateModal) {
    fetchHackathonsForDropdown();
  }
}, [showCreateModal]);

const fetchHackathonsForDropdown = async () => {
  try {
    console.log('Fetching hackathons for dropdown...');
    
    // Fetch only active/open hackathons for team creation
    const params = {
      status: 'upcoming,ongoing', // Only fetch hackathons that are open for registration
      sortBy: 'registrationDeadline',
      limit: 50 // Limit to avoid too many options
    };
    
    const response = await hackathonAPI.getHackathons(params);
    console.log('Hackathons fetched for dropdown:', response);
    
    // Make sure we have the hackathons data
    const hackathonData = response.data || [];
    console.log('Setting hackathons for dropdown:', hackathonData);
    
    // You might want to use a separate state for dropdown hackathons
    // or reuse the existing hackathons state
    setHackathons(Array.isArray(hackathonData) ? hackathonData : []);
    
  } catch (error) {
    console.error('Error fetching hackathons for dropdown:', error);
    // Handle error - maybe show a toast notification
  }
};


  const loadMyTeams = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getMyTeams();
      setMyTeams(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Failed to load your teams');
      console.error('Error loading my teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadBrowseTeams = async () => {
    try {
      setLoading(true);
      // You'll need to implement a browse/search endpoint
      // For now, using the same endpoint
      const response = await teamAPI.getMyTeams();
      setTeams(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError('Failed to load teams');
      console.error('Error loading browse teams:', err);
    } finally {
      setLoading(false);
    }
  };

const handleCreateTeam = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    setError(''); // Clear any previous errors
    
    // Clean the team data before sending
    const cleanedTeamData = { ...teamForm };
    
    // CRITICAL FIX: Ensure hackathonId is provided and valid
    if (!cleanedTeamData.hackathonId || cleanedTeamData.hackathonId.trim() === '') {
      setError('Please select a hackathon before creating a team');
      setLoading(false);
      return; // Stop execution if no hackathonId
    }
    
    // Remove empty arrays if they're not required
    if (cleanedTeamData.requiredSkills && cleanedTeamData.requiredSkills.length === 0) {
      delete cleanedTeamData.requiredSkills;
    }
    
    // Ensure maxMembers is a number
    if (cleanedTeamData.maxMembers) {
      cleanedTeamData.maxMembers = Number(cleanedTeamData.maxMembers);
    }
    
    console.log('Cleaned team data being sent:', cleanedTeamData);
    
    const response = await teamAPI.createTeam(cleanedTeamData);
    
    // Update the teams list
    setMyTeams(prev => [...prev, response.data]);
    
    // Close modal and reset form
    setShowCreateModal(false);
    resetForm();
    setActiveTab('my-teams');
    
    console.log('Team created successfully:', response.data);
    
  } catch (err) {
    console.error('Error creating team:', err);
    
    // Enhanced error handling
    if (err.response?.data?.details) {
      console.log('=== DETAILED VALIDATION ERRORS ===');
      err.response.data.details.forEach((detail, index) => {
        console.log(`Validation Error ${index + 1}:`, detail);
        console.log('Field:', detail.field || detail.path || 'unknown');
        console.log('Message:', detail.message || detail.msg || 'unknown');
        console.log('Value:', detail.value || 'unknown');
        console.log('---');
      });
    }
    
    // Set more specific error message
    let errorMessage = 'Failed to create team';
    
    if (err.response?.data?.details) {
      const validationErrors = err.response.data.details;
      if (validationErrors.some(error => error.path === 'hackathonId')) {
        errorMessage = 'Please select a valid hackathon';
      } else {
        errorMessage = validationErrors[0]?.msg || errorMessage;
      }
    } else if (err.response?.data?.error) {
      errorMessage = err.response.data.error;
    }
    
    setError(errorMessage);
    
  } finally {
    setLoading(false);
  }
};

  const handleJoinTeam = async (teamId) => {
    try {
      setLoading(true);
      await teamAPI.joinTeam(teamId);
      loadMyTeams();
      loadBrowseTeams();
    } catch (err) {
      setError('Failed to join team');
      console.error('Error joining team:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async (teamId) => {
    try {
      setLoading(true);
      await teamAPI.leaveTeam(teamId);
      loadMyTeams();
      loadBrowseTeams();
    } catch (err) {
      setError('Failed to leave team');
      console.error('Error leaving team:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTeamForm({
      name: '',
      description: '',
      hackathonId: '',
      maxMembers: 5,
      requiredSkills: [],
      lookingFor: { roles: [], count: 1, description: '' },
      isPublic: true,
      projectDetails: { idea: '', technologies: [] },
      communication: { preferredMethod: 'discord', discord: '', email: '' },
      preferences: {
        timezone: 'UTC',
        workingStyle: 'collaborative',
        meetingFrequency: 'as_needed',
        experienceLevel: 'mixed'
      },
      tags: []
    });
  };

  const addSkill = () => {
    if (newSkill.skill.trim()) {
      setTeamForm(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, { ...newSkill }]
      }));
      setNewSkill({ skill: '', level: 'intermediate', priority: 'medium' });
    }
  };

  const removeSkill = (index) => {
    setTeamForm(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !teamForm.tags.includes(newTag.trim().toLowerCase())) {
      setTeamForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim().toLowerCase()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setTeamForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addTechnology = () => {
    if (newTech.trim() && !teamForm.projectDetails.technologies.includes(newTech.trim())) {
      setTeamForm(prev => ({
        ...prev,
        projectDetails: {
          ...prev.projectDetails,
          technologies: [...prev.projectDetails.technologies, newTech.trim()]
        }
      }));
      setNewTech('');
    }
  };

  const removeTechnology = (tech) => {
    setTeamForm(prev => ({
      ...prev,
      projectDetails: {
        ...prev.projectDetails,
        technologies: prev.projectDetails.technologies.filter(t => t !== tech)
      }
    }));
  };


  

  const TeamCard = ({ team, showJoinButton = false, showManageButton = false }) => (
    <div className="team-card">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h5 className="team-name">{team.name}</h5>
            <div className="team-status">
              <span className={`status-badge ${team.status}`}>{team.status}</span>
              <span className={`visibility-badge ${team.isPublic ? 'public' : 'private'}`}>
                {team.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
          <div className="team-size">
            {team.currentSize || 1}/{team.maxMembers}
          </div>
        </div>
      </div>
      
      <div className="card-body">
        <p className="team-description">{team.description}</p>
        
        {team.requiredSkills && team.requiredSkills.length > 0 && (
          <div className="skills-section">
            <h6>Required Skills:</h6>
            <div className="skills-list">
              {team.requiredSkills.map((skill, index) => (
                <span key={index} className={`skill-badge ${skill.priority}`}>
                  {skill.skill} ({skill.level})
                </span>
              ))}
            </div>
          </div>
        )}
        
        {team.lookingFor && team.lookingFor.roles && team.lookingFor.roles.length > 0 && (
          <div className="looking-for-section">
            <h6>Looking for:</h6>
            <div className="roles-list">
              {team.lookingFor.roles.map((role, index) => (
                <span key={index} className="role-badge">{role}</span>
              ))}
            </div>
          </div>
        )}
        
        {team.tags && team.tags.length > 0 && (
          <div className="tags-section">
            {team.tags.map((tag, index) => (
              <span key={index} className="tag-badge">#{tag}</span>
            ))}
          </div>
        )}
      </div>
      
      <div className="card-footer">
        <div className="action-buttons">
          <button 
            className="btn btn-info btn-sm"
            onClick={() => {
              setSelectedTeam(team);
              setShowTeamModal(true);
            }}
          >
            View Details
          </button>
          
          {showJoinButton && team.isOpen && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => handleJoinTeam(team._id)}
              disabled={loading}
            >
              Join Team
            </button>
          )}
          
          {showManageButton && (
            <>
              <button className="btn btn-warning btn-sm">Edit</button>
              <button 
                className="btn btn-danger btn-sm"
                onClick={() => handleLeaveTeam(team._id)}
                disabled={loading}
              >
                Leave
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="team-dashboard">
      <style jsx>{`
        .team-dashboard {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000066 100%);
          min-height: 100vh;
          color: #00ffff;
          font-family: 'Courier New', monospace;
        }
        
        .dashboard-header {
          background: rgba(0, 255, 255, 0.1);
          border-bottom: 2px solid #00ffff;
          padding: 20px;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        }
        
        .cyber-title {
          font-size: 2.5rem;
          font-weight: bold;
          text-shadow: 0 0 10px #00ffff;
          color: #00ffff;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .nav-tabs {
          border-bottom: 2px solid #ff00ff;
          background: rgba(255, 0, 255, 0.1);
        }
        
        .nav-tabs .nav-link {
          color: #00ffff;
          background: transparent;
          border: 1px solid #ff00ff;
          margin-right: 5px;
          text-transform: uppercase;
          font-weight: bold;
          transition: all 0.3s ease;
        }
        
        .nav-tabs .nav-link:hover {
          background: rgba(255, 0, 255, 0.2);
          color: #ff00ff;
          box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
        }
        
        .nav-tabs .nav-link.active {
          background: #ff00ff;
          color: #000;
          border-color: #ff00ff;
          box-shadow: 0 0 15px rgba(255, 0, 255, 0.7);
        }
        
        .team-card {
          background: linear-gradient(145deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
          border: 1px solid #00ffff;
          border-radius: 10px;
          margin-bottom: 20px;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
          transition: all 0.3s ease;
        }
        
        .team-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0 25px rgba(0, 255, 255, 0.5);
          border-color: #ff00ff;
        }
        
        .card-header {
          background: rgba(255, 0, 255, 0.2);
          border-bottom: 1px solid #ff00ff;
          padding: 15px;
        }
        
        .team-name {
          color: #00ffff;
          font-size: 1.3rem;
          font-weight: bold;
          text-shadow: 0 0 5px #00ffff;
        }
        
        .status-badge {
          padding: 3px 8px;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: bold;
          text-transform: uppercase;
          margin-right: 10px;
        }
        
        .status-badge.forming { background: #ffff00; color: #000; }
        .status-badge.complete { background: #00ff00; color: #000; }
        .status-badge.competing { background: #ff8800; color: #000; }
        .status-badge.submitted { background: #0088ff; color: #fff; }
        
        .visibility-badge {
          padding: 3px 8px;
          border-radius: 15px;
          font-size: 0.8rem;
          font-weight: bold;
        }
        
        .visibility-badge.public { background: #00ff00; color: #000; }
        .visibility-badge.private { background: #ff0000; color: #fff; }
        
        .team-size {
          background: rgba(0, 255, 255, 0.2);
          padding: 10px;
          border-radius: 50%;
          font-weight: bold;
          color: #00ffff;
          border: 2px solid #00ffff;
        }
        
        .card-body {
          padding: 15px;
        }
        
        .team-description {
          color: #cccccc;
          margin-bottom: 15px;
        }
        
        .skills-section, .looking-for-section, .tags-section {
          margin-bottom: 15px;
        }
        
        .skills-section h6, .looking-for-section h6 {
          color: #ff00ff;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .skill-badge {
          display: inline-block;
          padding: 3px 8px;
          margin: 2px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: bold;
        }
        
        .skill-badge.low { background: #666; color: #fff; }
        .skill-badge.medium { background: #ffff00; color: #000; }
        .skill-badge.high { background: #ff8800; color: #fff; }
        .skill-badge.critical { background: #ff0000; color: #fff; }
        
        .role-badge {
          display: inline-block;
          background: rgba(0, 255, 255, 0.3);
          color: #00ffff;
          padding: 3px 8px;
          margin: 2px;
          border-radius: 12px;
          font-size: 0.8rem;
          border: 1px solid #00ffff;
        }
        
        .tag-badge {
          display: inline-block;
          background: rgba(255, 0, 255, 0.3);
          color: #ff00ff;
          padding: 3px 8px;
          margin: 2px;
          border-radius: 12px;
          font-size: 0.8rem;
          border: 1px solid #ff00ff;
        }
        
        .card-footer {
          background: rgba(0, 0, 0, 0.3);
          border-top: 1px solid #00ffff;
          padding: 15px;
        }
        
        .action-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .btn {
          border: 2px solid;
          font-weight: bold;
          text-transform: uppercase;
          transition: all 0.3s ease;
        }
        
        .btn-primary {
          background: transparent;
          border-color: #00ffff;
          color: #00ffff;
        }
        
        .btn-primary:hover {
          background: #00ffff;
          color: #000;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.7);
        }
        
        .btn-info {
          background: transparent;
          border-color: #0088ff;
          color: #0088ff;
        }
        
        .btn-info:hover {
          background: #0088ff;
          color: #fff;
          box-shadow: 0 0 15px rgba(0, 136, 255, 0.7);
        }
        
        .btn-warning {
          background: transparent;
          border-color: #ffff00;
          color: #ffff00;
        }
        
        .btn-warning:hover {
          background: #ffff00;
          color: #000;
          box-shadow: 0 0 15px rgba(255, 255, 0, 0.7);
        }
        
        .btn-danger {
          background: transparent;
          border-color: #ff0000;
          color: #ff0000;
        }
        
        .btn-danger:hover {
          background: #ff0000;
          color: #fff;
          box-shadow: 0 0 15px rgba(255, 0, 0, 0.7);
        }
        
        .btn-success {
          background: transparent;
          border-color: #00ff00;
          color: #00ff00;
        }
        
        .btn-success:hover {
          background: #00ff00;
          color: #000;
          box-shadow: 0 0 15px rgba(0, 255, 0, 0.7);
        }
        
        .modal-content {
          background: linear-gradient(145deg, #1a0033, #000066);
          border: 2px solid #00ffff;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
        }
        
        .modal-header {
          border-bottom: 2px solid #ff00ff;
          background: rgba(255, 0, 255, 0.1);
        }
        
        .modal-title {
          color: #00ffff;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .form-control, .form-select {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid #00ffff;
          color: #00ffff;
        }
        
        .form-control:focus, .form-select:focus {
          background: rgba(0, 0, 0, 0.7);
          border-color: #ff00ff;
          color: #00ffff;
          box-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
        }
        
        .form-label {
          color: #ff00ff;
          font-weight: bold;
        }
        
        .search-bar {
          background: rgba(0, 0, 0, 0.5);
          border: 2px solid #00ffff;
          border-radius: 25px;
          padding: 10px 20px;
          color: #00ffff;
          margin-bottom: 20px;
        }
        
        .search-bar:focus {
          background: rgba(0, 0, 0, 0.7);
          border-color: #ff00ff;
          box-shadow: 0 0 15px rgba(255, 0, 255, 0.5);
        }
        
        .create-team-btn {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #ff00ff;
          border: 2px solid #00ffff;
          color: #000;
          font-size: 24px;
          font-weight: bold;
          box-shadow: 0 0 20px rgba(255, 0, 255, 0.7);
          transition: all 0.3s ease;
          z-index: 1000;
        }
        
        .create-team-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 0 30px rgba(255, 0, 255, 1);
        }
        
        .loading-spinner {
          border: 4px solid rgba(0, 255, 255, 0.1);
          border-left: 4px solid #00ffff;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-alert {
          background: rgba(255, 0, 0, 0.1);
          border: 2px solid #ff0000;
          color: #ff0000;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
        }
        
        .empty-state {
          text-align: center;
          padding: 50px;
          color: #666;
        }
        
        .empty-state h3 {
          color: #00ffff;
          margin-bottom: 20px;
        }
        
        .skill-input-group {
          display: flex;
          gap: 10px;
          margin-bottom: 10px;
          align-items: end;
        }
        
        .tag-item {
          display: inline-block;
          background: rgba(255, 0, 255, 0.3);
          color: #ff00ff;
          padding: 5px 10px;
          margin: 3px;
          border-radius: 15px;
          border: 1px solid #ff00ff;
        }
        
        .remove-btn {
          background: transparent;
          border: none;
          color: #ff0000;
          margin-left: 5px;
          cursor: pointer;
        }
      `}</style>

      {/* Header */}
      <div className="dashboard-header">
        <div className="container">
          <h1 className="cyber-title">Team Matrix</h1>
          <p className="lead">Connect • Collaborate • Conquer</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="container mt-4">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'browse' ? 'active' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              Browse Teams
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'my-teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-teams')}
            >
              My Teams
            </button>
          </li>
        </ul>

        {/* Error Alert */}
        {error && (
          <div className="error-alert">
            <strong>Error:</strong> {error}
            <button 
              className="btn btn-sm btn-outline-danger float-end"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="tab-content mt-4">
          {/* Browse Teams Tab */}
          {activeTab === 'browse' && (
            <div className="tab-pane active">
              <div className="row mb-4">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control search-bar"
                    placeholder="Search teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <button 
                    className="btn btn-primary"
                    onClick={loadBrowseTeams}
                    disabled={loading}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {loading && <div className="loading-spinner"></div>}

              <div className="row">
                {teams.length === 0 && !loading ? (
                  <div className="empty-state">
                    <h3>No Teams Found</h3>
                    <p>Be the first to create a team!</p>
                  </div>
                ) : (
                  teams
                    .filter(team => 
                      team.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      team.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(team => (
                      <div key={team._id} className="col-md-6 col-lg-4">
                        <TeamCard team={team} showJoinButton={true} />
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* My Teams Tab */}
          {activeTab === 'my-teams' && (
            <div className="tab-pane active">
              {loading && <div className="loading-spinner"></div>}

              <div className="row">
                {myTeams.length === 0 && !loading ? (
                  <div className="empty-state">
                    <h3>You Haven't Joined Any Teams Yet</h3>
                    <p>Create or join a team to get started!</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create Your First Team
                    </button>
                  </div>
                ) : (
                  myTeams.map(team => (
                    <div key={team._id} className="col-md-6 col-lg-4">
                      <TeamCard team={team} showManageButton={true} />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Create Button */}
      <button 
        className="create-team-btn"
        onClick={() => setShowCreateModal(true)}
        title="Create New Team"
      >
        +
      </button>

      {/* Create Team Modal */}
{showCreateModal && (
  <div className="modal show d-block" tabIndex="-1">
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
            {/* Hackathon Selection - NEW */}
<div className="mb-3">
  <label className="form-label">Select Hackathon *</label>
  <select
    className="form-select"
    value={teamForm.hackathonId || ''}
    onChange={(e) => {
      console.log('Selected hackathon ID:', e.target.value);
      setTeamForm(prev => ({...prev, hackathonId: e.target.value}));
    }}
    required
    disabled={loading} // Disable while loading
  >
    <option value="">
      {loading ? 'Loading hackathons...' : 'Choose a hackathon...'}
    </option>
    {hackathons && hackathons.length > 0 ? (
      hackathons.map((hackathon) => {
        // Handle different possible ID fields
        const hackathonId = hackathon._id || hackathon.id;
        const title = hackathon.title || hackathon.name || 'Untitled Hackathon';
        const status = hackathon.status || 'unknown';
        
        return (
          <option key={hackathonId} value={hackathonId}>
            {title} - {status.toUpperCase()}
            {hackathon.registrationDeadline && (
              ` (Deadline: ${new Date(hackathon.registrationDeadline).toLocaleDateString()})`
            )}
          </option>
        );
      })
    ) : (
      !loading && (
        <option value="" disabled>
          No hackathons available
        </option>
      )
    )}
  </select>
  
  {/* Better error/empty state messaging */}
  {!loading && hackathons.length === 0 && (
    <small className="text-muted">
      No hackathons available for team creation. Please try refreshing the page or contact support.
    </small>
  )}
  
  {loading && (
    <small className="text-muted">
      <i className="spinner-border spinner-border-sm me-2" role="status"></i>
      Loading available hackathons...
    </small>
  )}
  
  {/* Debug info - remove in production */}
  {import.meta.env.NODE_ENV === 'development' && (
    <small className="text-muted">
      Debug: {hackathons.length} hackathons loaded
    </small>
  )}
</div>
            {/* Basic Info */}
            <div className="row mb-3">
              <div className="col-md-8">
                <label className="form-label">Team Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm(prev => ({...prev, name: e.target.value}))}
                  required
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Max Members *</label>
                <input
                  type="number"
                  className="form-control"
                  min="2"
                  max="10"
                  value={teamForm.maxMembers}
                  onChange={(e) => setTeamForm(prev => ({...prev, maxMembers: parseInt(e.target.value)}))}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Description *</label>
              <textarea
                className="form-control"
                rows="3"
                value={teamForm.description}
                onChange={(e) => setTeamForm(prev => ({...prev, description: e.target.value}))}
                required
              ></textarea>
            </div>

            {/* Project Details */}
            <div className="mb-3">
              <label className="form-label">Project Idea</label>
              <textarea
                className="form-control"
                rows="3"
                value={teamForm.projectDetails.idea}
                onChange={(e) => setTeamForm(prev => ({
                  ...prev, 
                  projectDetails: {...prev.projectDetails, idea: e.target.value}
                }))}
              ></textarea>
            </div>

            {/* Technologies */}
            <div className="mb-3">
              <label className="form-label">Technologies</label>
              <div className="skill-input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add technology"
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
                />
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={addTechnology}
                >
                  Add
                </button>
              </div>
              <div className="mt-2">
                {teamForm.projectDetails.technologies.map((tech, index) => (
                  <span key={index} className="tag-item">
                    {tech}
                    <button 
                      type="button" 
                      className="remove-btn"
                      onClick={() => removeTechnology(tech)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Required Skills */}
            <div className="mb-3">
              <label className="form-label">Required Skills</label>
              <div className="skill-input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Skill name"
                  value={newSkill.skill}
                  onChange={(e) => setNewSkill(prev => ({...prev, skill: e.target.value}))}
                />
                <select
                  className="form-select"
                  value={newSkill.level}
                  onChange={(e) => setNewSkill(prev => ({...prev, level: e.target.value}))}
                >
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
                <select
                  className="form-select"
                  value={newSkill.priority}
                  onChange={(e) => setNewSkill(prev => ({...prev, priority: e.target.value}))}
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={addSkill}
                >
                  Add
                </button>
              </div>
              <div className="mt-2">
                {teamForm.requiredSkills.map((skill, index) => (
                  <span key={index} className={`skill-badge ${skill.priority}`}>
                    {skill.skill} ({skill.level})
                    <button 
                      type="button" 
                      className="remove-btn"
                      onClick={() => removeSkill(index)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Looking For */}
            <div className="mb-3">
              <label className="form-label">Looking For</label>
              <div className="row">
                <div className="col-md-6">
                  <select
                    className="form-select"
                    multiple
                    value={teamForm.lookingFor.roles}
                    onChange={(e) => {
                      const selectedRoles = Array.from(e.target.selectedOptions, option => option.value);
                      setTeamForm(prev => ({
                        ...prev,
                        lookingFor: {...prev.lookingFor, roles: selectedRoles}
                      }));
                    }}
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>{role.replace('_', ' ')}</option>
                    ))}
                  </select>
                  <small className="text-muted">Hold Ctrl/Cmd to select multiple</small>
                </div>
                <div className="col-md-3">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Count"
                    min="1"
                    value={teamForm.lookingFor.count}
                    onChange={(e) => setTeamForm(prev => ({
                      ...prev,
                      lookingFor: {...prev.lookingFor, count: parseInt(e.target.value) || 1}
                    }))}
                  />
                </div>
                <div className="col-md-12 mt-2">
                  <textarea
                    className="form-control"
                    placeholder="Description of what you're looking for"
                    rows="2"
                    value={teamForm.lookingFor.description}
                    onChange={(e) => setTeamForm(prev => ({
                      ...prev,
                      lookingFor: {...prev.lookingFor, description: e.target.value}
                    }))}
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Communication */}
            <div className="mb-3">
              <label className="form-label">Communication</label>
              <div className="row">
                <div className="col-md-4">
                  <label className="form-label">Preferred Method</label>
                  <select
                    className="form-select"
                    value={teamForm.communication.preferredMethod}
                    onChange={(e) => setTeamForm(prev => ({
                      ...prev,
                      communication: {...prev.communication, preferredMethod: e.target.value}
                    }))}
                  >
                    {commMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">Discord</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Discord username"
                    value={teamForm.communication.discord}
                    onChange={(e) => setTeamForm(prev => ({
                      ...prev,
                      communication: {...prev.communication, discord: e.target.value}
                    }))}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Contact email"
                    value={teamForm.communication.email}
                    onChange={(e) => setTeamForm(prev => ({
                      ...prev,
                      communication: {...prev.communication, email: e.target.value}
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="mb-3">
              <label className="form-label">Team Preferences</label>
              <div className="row">
                <div className="col-md-3">
                  <label className="form-label">Working Style</label>
                  <select
                    className="form-select"
                    value={teamForm.preferences.workingStyle}
                    onChange={(e) => setTeamForm(prev => ({
                      ...prev,
                      preferences: {...prev.preferences, workingStyle: e.target.value}
                    }))}
                  >
                    {workingStyles.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Meeting Frequency</label>
                  <select
                    className="form-select"
                    value={teamForm.preferences.meetingFrequency}
                    onChange={(e) => setTeamForm(prev => ({
                      ...prev,
                      preferences: {...prev.preferences, meetingFrequency: e.target.value}
                    }))}
                  >
                    {meetingFreq.map(freq => (
                      <option key={freq} value={freq}>{freq.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Experience Level</label>
                  <select
                    className="form-select"
                    value={teamForm.preferences.experienceLevel}
                    onChange={(e) => setTeamForm(prev => ({
                      ...prev,
                      preferences: {...prev.preferences, experienceLevel: e.target.value}
                    }))}
                  >
                    {expLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Timezone</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="UTC"
                    value={teamForm.preferences.timezone}
                    onChange={(e) => setTeamForm(prev => ({
                      ...prev,
                      preferences: {...prev.preferences, timezone: e.target.value}
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="mb-3">
              <label className="form-label">Tags</label>
              <div className="skill-input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={addTag}
                >
                  Add
                </button>
              </div>
              <div className="mt-2">
                {teamForm.tags.map((tag, index) => (
                  <span key={index} className="tag-item">
                    #{tag}
                    <button 
                      type="button" 
                      className="remove-btn"
                      onClick={() => removeTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={teamForm.isPublic}
                  onChange={(e) => setTeamForm(prev => ({...prev, isPublic: e.target.checked}))}
                />
                <label className="form-check-label">
                  Make team public (visible to everyone)
                </label>
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
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}

      {/* Team Details Modal */}
      {showTeamModal && selectedTeam && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedTeam.name}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowTeamModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-8">
                    <h6>Description</h6>
                    <p>{selectedTeam.description}</p>

                    {selectedTeam.projectDetails?.idea && (
                      <>
                        <h6>Project Idea</h6>
                        <p>{selectedTeam.projectDetails.idea}</p>
                      </>
                    )}

                    {selectedTeam.lookingFor?.description && (
                      <>
                        <h6>Looking For</h6>
                        <p>{selectedTeam.lookingFor.description}</p>
                      </>
                    )}

                    {selectedTeam.communication && (
                      <>
                        <h6>Communication</h6>
                        <p>Preferred: {selectedTeam.communication.preferredMethod}</p>
                        {selectedTeam.communication.discord && <p>Discord: {selectedTeam.communication.discord}</p>}
                        {selectedTeam.communication.email && <p>Email: {selectedTeam.communication.email}</p>}
                      </>
                    )}
                  </div>
                  <div className="col-md-4">
                    <h6>Team Info</h6>
                    <p><strong>Size:</strong> {selectedTeam.currentSize || 1}/{selectedTeam.maxMembers}</p>
                    <p><strong>Status:</strong> {selectedTeam.status}</p>
                    <p><strong>Visibility:</strong> {selectedTeam.isPublic ? 'Public' : 'Private'}</p>
                    
                    {selectedTeam.preferences && (
                      <>
                        <h6>Preferences</h6>
                        <p><strong>Working Style:</strong> {selectedTeam.preferences.workingStyle}</p>
                        <p><strong>Meeting Frequency:</strong> {selectedTeam.preferences.meetingFrequency}</p>
                        <p><strong>Experience Level:</strong> {selectedTeam.preferences.experienceLevel}</p>
                        <p><strong>Timezone:</strong> {selectedTeam.preferences.timezone}</p>
                      </>
                    )}
                  </div>
                </div>

                {selectedTeam.projectDetails?.technologies && selectedTeam.projectDetails.technologies.length > 0 && (
                  <div className="mt-3">
                    <h6>Technologies</h6>
                    <div>
                      {selectedTeam.projectDetails.technologies.map((tech, index) => (
                        <span key={index} className="tag-badge">{tech}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTeam.requiredSkills && selectedTeam.requiredSkills.length > 0 && (
                  <div className="mt-3">
                    <h6>Required Skills</h6>
                    <div>
                      {selectedTeam.requiredSkills.map((skill, index) => (
                        <span key={index} className={`skill-badge ${skill.priority}`}>
                          {skill.skill} ({skill.level})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTeam.members && selectedTeam.members.length > 0 && (
                  <div className="mt-3">
                    <h6>Team Members</h6>
                    {selectedTeam.members
                      .filter(member => member.status === 'active')
                      .map((member, index) => (
                        <div key={index} className="mb-2">
                          <strong>{member.role}</strong>
                          {member.skills && member.skills.length > 0 && (
                            <div>
                              Skills: {member.skills.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {selectedTeam.isOpen && selectedTeam.isPublic && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      handleJoinTeam(selectedTeam._id);
                      setShowTeamModal(false);
                    }}
                    disabled={loading}
                  >
                    Join Team
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowTeamModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backdrop */}
      {(showCreateModal || showTeamModal) && (
        <div 
          className="modal-backdrop show"
          onClick={() => {
            setShowCreateModal(false);
            setShowTeamModal(false);
          }}
        ></div>
      )}
    </div>
  );
};

export default TeamDashboard;