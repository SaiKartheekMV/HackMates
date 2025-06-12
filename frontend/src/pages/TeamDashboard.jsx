import React, { useState, useEffect, useCallback } from "react";
import { teamAPI, hackathonAPI } from "../services/api";

const TeamDashboard = () => {
  const [activeTab, setActiveTab] = useState("myTeams");
  const [myTeams, setMyTeams] = useState([]);
  const [hackathonTeams, setHackathonTeams] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    hasOpenings: false,
    skills: "",
    location: "",
  });
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    hackathonId: "",
    maxMembers: 4,
    requiredSkills: [],
    preferredRoles: [],
    tags: [],
    settings: {
      isPublic: true,
      allowDirectJoin: false,
      requireApproval: true,
    },
  });
  const [currentHackathonId, setCurrentHackathonId] = useState("");
  const [lastRequestTime, setLastRequestTime] = useState({
    myTeams: 0,
    hackathons: 0,
    hackathonTeams: 0
  });

  // Simulated current user data
  const currentUser = {
    id: "60d5ec49f8b2c8001f5d4e8a",
    firstName: "John",
    lastName: "Doe",
  };

  const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const canMakeRequest = (requestType) => {
    const now = Date.now();
    const lastTime = lastRequestTime[requestType];
    return now - lastTime > MIN_REQUEST_INTERVAL;
  };

  const updateRequestTime = (requestType) => {
    setLastRequestTime(prev => ({
      ...prev,
      [requestType]: Date.now()
    }));
  };

  const loadHackathons = async () => {
    try {
      const response = await hackathonAPI.getHackathons();
      // response.data already contains the hackathons array from your API structure
      setHackathons(response.data || []);
    } catch (err) {
      console.error("Failed to load hackathons:", err);
      if (err.response?.status === 429) {
        showAlert("Too many requests. Please wait before trying again.", "error");
      } else {
        showAlert("Failed to load hackathons", "error");
      }
    }
  };

  const showAlert = (message, type = "success") => {
    if (type === "success") {
      setSuccess(message);
      setError("");
    } else {
      setError(message);
      setSuccess("");
    }
    setTimeout(() => {
      setSuccess("");
      setError("");
    }, 5000);
  };

  const loadMyTeams = useCallback(async () => {
    if (loading || !canMakeRequest('myTeams')) return;
    updateRequestTime('myTeams');
    try {
      setLoading(true);
      const response = await teamAPI.getMyTeams();
      setMyTeams(response.data || []);
    } catch (error) {
      console.error("Failed to load teams:", error);
      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.retryAfter || "a few minutes";
        showAlert(`Too many requests. Please wait ${retryAfter} before trying again.`, "error");
      } else {
        showAlert("Failed to load your teams", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [loading, canMakeRequest]);

  const loadHackathonTeams = useCallback(async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getTeamsWithFilters(
        currentHackathonId,
        filters
      );
      setHackathonTeams(response.data || []);
    } catch (error) {
      console.error("Failed to load hackathon teams:", error);
      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.retryAfter || "a few minutes";
        showAlert(`Too many requests. Please wait ${retryAfter} before trying again.`, "error");
      } else {
        showAlert("Failed to load hackathon teams", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [currentHackathonId, filters]);

  const loadRecommendations = useCallback(async () => {
    try {
      const response = await teamAPI.getTeamRecommendations(currentHackathonId);
      setRecommendations(response.data || []);
    } catch (err) {
      console.error("Failed to load recommendations:", err);
    }
  }, [currentHackathonId]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Validate team data
      const validation = teamAPI.validateTeamData(newTeam);
      if (!validation.isValid) {
        showAlert(validation.errors.join(", "), "error");
        return;
      }

      const response = await teamAPI.createTeam(newTeam);
      console.log("Team created:", response.data); 
      showAlert("Team created successfully!");
      setShowCreateModal(false);
      resetNewTeam();
      loadMyTeams();
    } catch  {
      showAlert("Failed to create team", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (teamId) => {
    try {
      setLoading(true);
      await teamAPI.joinTeam(teamId);
      showAlert("Successfully joined the team!");
      loadMyTeams();
      loadHackathonTeams();
    } catch {
      showAlert("Failed to join team", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async (teamId) => {
    if (!window.confirm("Are you sure you want to leave this team?")) return;

    try {
      setLoading(true);
      await teamAPI.leaveTeam(teamId);
      showAlert("Successfully left the team");
      loadMyTeams();
      loadHackathonTeams();
    } catch{
      showAlert("Failed to leave team", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this team? This action cannot be undone."
      )
    )
      return;

    try {
      setLoading(true);
      await teamAPI.deleteTeam(teamId);
      showAlert("Team deleted successfully");
      loadMyTeams();
      loadHackathonTeams();
    } catch {
      showAlert("Failed to delete team", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    const loadInitialData = async () => {
      if (!mounted) return;
      
      // Load hackathons first, then teams with a small delay
      try {
        await loadHackathons();
        if (mounted) {
          setTimeout(() => {
            if (mounted) loadMyTeams();
          }, 500); // Increased delay to prevent rate limiting
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    };

    loadInitialData();
    
    return () => {
      mounted = false;
    };
  }, []); // Remove dependencies to prevent multiple calls

  useEffect(() => {
    if (currentHackathonId) {
      loadHackathonTeams();
      loadRecommendations();
    }
  }, [currentHackathonId, filters, loadHackathonTeams, loadRecommendations]);

  const resetNewTeam = () => {
    setNewTeam({
      name: "",
      description: "",
      hackathonId: "",
      maxMembers: 4,
      requiredSkills: [],
      preferredRoles: [],
      tags: [],
      settings: {
        isPublic: true,
        allowDirectJoin: false,
        requireApproval: true,
      },
    });
  };

  const addSkill = () => {
    setNewTeam((prev) => ({
      ...prev,
      requiredSkills: [
        ...prev.requiredSkills,
        { skill: "", priority: "medium" },
      ],
    }));
  };

  const updateSkill = (index, field, value) => {
    setNewTeam((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.map((skill, i) =>
        i === index ? { ...skill, [field]: value } : skill
      ),
    }));
  };

  const removeSkill = (index) => {
    setNewTeam((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((_, i) => i !== index),
    }));
  };

  const addRole = () => {
    setNewTeam((prev) => ({
      ...prev,
      preferredRoles: [...prev.preferredRoles, { role: "developer", count: 1 }],
    }));
  };

  const updateRole = (index, field, value) => {
    setNewTeam((prev) => ({
      ...prev,
      preferredRoles: prev.preferredRoles.map((role, i) =>
        i === index ? { ...role, [field]: value } : role
      ),
    }));
  };

  const removeRole = (index) => {
    setNewTeam((prev) => ({
      ...prev,
      preferredRoles: prev.preferredRoles.filter((_, i) => i !== index),
    }));
  };

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
      <span
        className={`badge bg-${priorityColors[priority] || "primary"} me-1`}
      >
        {priority}
      </span>
    );
  };

  const TeamCard = ({ team, showActions = true, isRecommendation = false }) => (
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
                    ((team.teamSize?.current || 0) /
                      (team.teamSize?.max || 1)) *
                    100
                  }%`,
                }}
              >
                {team.teamSize?.current || 0}/{team.teamSize?.max || 0}
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
                className="btn btn-success btn-sm"
                onClick={() => handleJoinTeam(team._id)}
                disabled={loading}
              >
                Join Team
              </button>
            ) : (
              <>
                {team.leaderId === currentUser.id ? (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedTeam(team)}
                    >
                      Manage
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteTeam(team._id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => setSelectedTeam(team)}
                    >
                      View Details
                    </button>
                    {team.members?.some(
                      (member) => member.userId === currentUser.id
                    ) ? (
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleLeaveTeam(team._id)}
                        disabled={loading}
                      >
                        Leave Team
                      </button>
                    ) : (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => handleJoinTeam(team._id)}
                        disabled={loading || team.isFull}
                      >
                        {team.isFull ? "Team Full" : "Join Team"}
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

  return (
    <div className="container-fluid py-4">
      {/* Alerts */}
      {success && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          ></button>
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
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
            className={`nav-link ${activeTab === "myTeams" ? "active" : ""}`}
            onClick={() => setActiveTab("myTeams")}
          >
            My Teams ({myTeams.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "discover" ? "active" : ""}`}
            onClick={() => setActiveTab("discover")}
          >
            Discover Teams
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${
              activeTab === "recommendations" ? "active" : ""
            }`}
            onClick={() => setActiveTab("recommendations")}
          >
            Recommendations ({recommendations.length})
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      {activeTab === "myTeams" && (
        <div className="row">
          <div className="col-12">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : myTeams.length === 0 ? (
              <div className="text-center py-5">
                <h5>No teams found</h5>
                <p className="text-muted">
                  Create your first team to get started!
                </p>
              </div>
            ) : (
              <div className="row">
                {myTeams.map((team) => (
                  <div key={team._id} className="col-lg-6 col-xl-4">
                    <TeamCard team={team} isRecommendation={false} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "discover" && (
        <>
          {/* Filters */}
          <div className="card mb-4">
            <div className="card-body">
              <h6 className="card-title">Filters</h6>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Hackathon</label>
                  <select
                    className="form-select"
                    value={selectedHackathon}
                    onChange={(e) => {
                      setSelectedHackathon(e.target.value);
                      setCurrentHackathonId(e.target.value);
                    }}
                  >
                    <option value="">Select Hackathon</option>
                    {hackathons.map((hackathon) => (
                      <option key={hackathon._id} value={hackathon._id}>
                        {hackathon.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={filters.status}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                  >
                    <option value="">All</option>
                    <option value="forming">Forming</option>
                    <option value="complete">Complete</option>
                    <option value="competing">Competing</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Location</label>
                  <select
                    className="form-select"
                    value={filters.location}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                  >
                    <option value="">All</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="in_person">In Person</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label">Skills</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., React, Python"
                    value={filters.skills}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        skills: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="col-md-2 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={filters.hasOpenings}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          hasOpenings: e.target.checked,
                        }))
                      }
                    />
                    <label className="form-check-label">Has Openings</label>
                  </div>
                </div>
                <div className="col-md-1 d-flex align-items-end">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      if (selectedHackathon) {
                        // Add small delay to prevent rapid clicking
                        setTimeout(loadHackathonTeams, 200);
                      }
                    }}
                    disabled={!selectedHackathon || loading}
                  >
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="row">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : hackathonTeams.length === 0 ? (
              <div className="text-center py-5">
                <h5>No teams found</h5>
                <p className="text-muted">
                  {currentHackathonId
                    ? "Try adjusting your filters"
                    : "Enter a hackathon ID to discover teams"}
                </p>
              </div>
            ) : (
              hackathonTeams.map((team) => (
                <div key={team._id} className="col-lg-6 col-xl-4">
                  <TeamCard team={team} isRecommendation={false} />
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === "recommendations" && (
        <div className="row">
          {currentHackathonId ? (
            recommendations.length === 0 ? (
              <div className="text-center py-5">
                <h5>No recommendations found</h5>
                <p className="text-muted">
                  We'll find teams that match your skills and interests!
                </p>
              </div>
            ) : (
              recommendations.map((team) => (
                <div key={team._id} className="col-lg-6 col-xl-4">
                  <TeamCard team={team} isRecommendation={true} />
                </div>
              ))
            )
          ) : (
            <div className="text-center py-5">
              <h5>Enter a hackathon ID</h5>
              <p className="text-muted">
                Go to the Discover tab and enter a hackathon ID to get
                personalized recommendations
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <form onSubmit={handleCreateTeam}>
                <div className="modal-header">
                  <h5 className="modal-title">Create New Team</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCreateModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Team Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newTeam.name}
                        onChange={(e) =>
                          setNewTeam((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Hackathon *</label>
                      <select
                        className="form-select"
                        value={newTeam.hackathonId}
                        onChange={(e) =>
                          setNewTeam((prev) => ({
                            ...prev,
                            hackathonId: e.target.value,
                          }))
                        }
                        required
                      >
                        <option value="">Select Hackathon</option>
                        {hackathons.map((hackathon) => (
                          <option key={hackathon._id} value={hackathon._id}>
                            {hackathon.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description *</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={newTeam.description}
                        onChange={(e) =>
                          setNewTeam((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        required
                      ></textarea>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Max Members</label>
                      <input
                        type="number"
                        className="form-control"
                        min="2"
                        max="10"
                        value={newTeam.maxMembers}
                        onChange={(e) =>
                          setNewTeam((prev) => ({
                            ...prev,
                            maxMembers: parseInt(e.target.value),
                          }))
                        }
                      />
                    </div>

                    {/* Required Skills */}
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label mb-0">
                          Required Skills
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={addSkill}
                        >
                          Add Skill
                        </button>
                      </div>
                      {newTeam.requiredSkills.map((skill, index) => (
                        <div key={index} className="row g-2 mb-2">
                          <div className="col-md-6">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Skill name"
                              value={skill.skill}
                              onChange={(e) =>
                                updateSkill(index, "skill", e.target.value)
                              }
                            />
                          </div>
                          <div className="col-md-4">
                            <select
                              className="form-select"
                              value={skill.priority}
                              onChange={(e) =>
                                updateSkill(index, "priority", e.target.value)
                              }
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                          <div className="col-md-2">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removeSkill(index)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Preferred Roles */}
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label mb-0">
                          Preferred Roles
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={addRole}
                        >
                          Add Role
                        </button>
                      </div>
                      {newTeam.preferredRoles.map((role, index) => (
                        <div key={index} className="row g-2 mb-2">
                          <div className="col-md-6">
                            <select
                              className="form-select"
                              value={role.role}
                              onChange={(e) =>
                                updateRole(index, "role", e.target.value)
                              }
                            >
                              <option value="developer">Developer</option>
                              <option value="designer">Designer</option>
                              <option value="data_scientist">
                                Data Scientist
                              </option>
                              <option value="product_manager">
                                Product Manager
                              </option>
                              <option value="marketing">Marketing</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="col-md-4">
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Count"
                              min="1"
                              value={role.count}
                              onChange={(e) =>
                                updateRole(
                                  index,
                                  "count",
                                  parseInt(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div className="col-md-2">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removeRole(index)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tags */}
                    <div className="col-12">
                      <label className="form-label">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g., AI, Web Development, Mobile"
                        value={newTeam.tags.join(", ")}
                        onChange={(e) =>
                          setNewTeam((prev) => ({
                            ...prev,
                            tags: e.target.value
                              .split(",")
                              .map((tag) => tag.trim())
                              .filter((tag) => tag),
                          }))
                        }
                      />
                    </div>

                    {/* Settings */}
                    <div className="col-12">
                      <h6>Team Settings</h6>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={newTeam.settings.isPublic}
                          onChange={(e) =>
                            setNewTeam((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                isPublic: e.target.checked,
                              },
                            }))
                          }
                        />
                        <label className="form-check-label">Public Team</label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={newTeam.settings.allowDirectJoin}
                          onChange={(e) =>
                            setNewTeam((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                allowDirectJoin: e.target.checked,
                              },
                            }))
                          }
                        />
                        <label className="form-check-label">
                          Allow Direct Join
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={newTeam.settings.requireApproval}
                          onChange={(e) =>
                            setNewTeam((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                requireApproval: e.target.checked,
                              },
                            }))
                          }
                        />
                        <label className="form-check-label">
                          Require Approval
                        </label>
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
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Team"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {selectedTeam && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedTeam.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedTeam(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-8">
                    <h6>Description</h6>
                    <p>{selectedTeam.description}</p>

                    {selectedTeam.project && selectedTeam.project.name && (
                      <>
                        <h6>Project Details</h6>
                        <p>
                          <strong>Name:</strong> {selectedTeam.project.name}
                        </p>
                        {selectedTeam.project.description && (
                          <p>
                            <strong>Description:</strong>{" "}
                            {selectedTeam.project.description}
                          </p>
                        )}
                        {selectedTeam.project.category && (
                          <p>
                            <strong>Category:</strong>{" "}
                            <span className="badge bg-info">
                              {selectedTeam.project.category}
                            </span>
                          </p>
                        )}
                        {selectedTeam.project.technologies &&
                          selectedTeam.project.technologies.length > 0 && (
                            <div>
                              <strong>Technologies:</strong>
                              <div className="mt-1">
                                {selectedTeam.project.technologies.map(
                                  (tech, idx) => (
                                    <span
                                      key={idx}
                                      className="badge bg-secondary me-1"
                                    >
                                      {tech}
                                    </span>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </>
                    )}

                    {selectedTeam.requiredSkills &&
                      selectedTeam.requiredSkills.length > 0 && (
                        <>
                          <h6 className="mt-3">Required Skills</h6>
                          <div>
                            {selectedTeam.requiredSkills.map(
                              (skillObj, idx) => (
                                <span
                                  key={idx}
                                  className="me-2 mb-1 d-inline-block"
                                >
                                  {getPriorityBadge(skillObj.priority)}
                                  <span>{skillObj.skill}</span>
                                </span>
                              )
                            )}
                          </div>
                        </>
                      )}

                    {selectedTeam.preferredRoles &&
                      selectedTeam.preferredRoles.length > 0 && (
                        <>
                          <h6 className="mt-3">Preferred Roles</h6>
                          <div>
                            {selectedTeam.preferredRoles.map((roleObj, idx) => (
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
                  </div>

                  <div className="col-md-4">
                    <h6>Team Information</h6>
                    <div className="card">
                      <div className="card-body">
                        <p>
                          <strong>Status:</strong>{" "}
                          {getStatusBadge(selectedTeam.status)}
                        </p>
                        <p>
                          <strong>Team Size:</strong>{" "}
                          {selectedTeam.teamSize?.current || 0}/
                          {selectedTeam.teamSize?.max || 0}
                        </p>
                        <p>
                          <strong>Created:</strong>{" "}
                          {new Date(
                            selectedTeam.createdAt
                          ).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Leader:</strong>{" "}
                          {selectedTeam.leader?.firstName}{" "}
                          {selectedTeam.leader?.lastName}
                        </p>

                        {selectedTeam.stats && (
                          <>
                            <p>
                              <strong>Completion:</strong>{" "}
                              {selectedTeam.stats.completionScore}%
                            </p>
                            <p>
                              <strong>Match Score:</strong>{" "}
                              {selectedTeam.stats.matchScore}%
                            </p>
                          </>
                        )}

                        {selectedTeam.settings && (
                          <div className="mt-3">
                            <h6>Settings</h6>
                            <small className="text-muted">
                              {selectedTeam.settings.isPublic && (
                                <span className="badge bg-success me-1">
                                  Public
                                </span>
                              )}
                              {selectedTeam.settings.allowDirectJoin && (
                                <span className="badge bg-info me-1">
                                  Direct Join
                                </span>
                              )}
                              {selectedTeam.settings.requireApproval && (
                                <span className="badge bg-warning me-1">
                                  Requires Approval
                                </span>
                              )}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedTeam.members &&
                      selectedTeam.members.length > 0 && (
                        <>
                          <h6 className="mt-3">Team Members</h6>
                          <div className="list-group list-group-flush">
                            {selectedTeam.members.map((member, idx) => (
                              <div key={idx} className="list-group-item px-0">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <h6 className="mb-1">
                                      {member.user?.firstName}{" "}
                                      {member.user?.lastName}
                                    </h6>
                                    <p className="mb-1 small text-muted">
                                      {member.role}
                                    </p>
                                    <small className="text-muted">
                                      Joined:{" "}
                                      {new Date(
                                        member.joinedAt
                                      ).toLocaleDateString()}
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
                  onClick={() => setSelectedTeam(null)}
                >
                  Close
                </button>
                {selectedTeam.leaderId === currentUser.id && (
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
      )}
    </div>
  );
};

export default TeamDashboard;
