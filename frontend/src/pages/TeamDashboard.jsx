import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Tab,
  Tabs,
  Button,
  Badge,
  Alert,
  Spinner,
  Modal,
  Form,
  ListGroup,
  InputGroup,
  ProgressBar,
  Tooltip,
  OverlayTrigger,
  Dropdown,
  ButtonGroup,
} from "react-bootstrap";

import { teamAPI, hackathonAPI } from '../services/api';



const TeamDashboard = () => {
  const [activeTab, setActiveTab] = useState("my-teams");
  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamApplications, setTeamApplications] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [availableHackathons, setAvailableHackathons] = useState([]);
  const [loadingHackathons, setLoadingHackathons] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  // Create Team Form State
  const [createTeamForm, setCreateTeamForm] = useState({
    name: "",
    description: "",
    hackathonId: "",
    maxMembers: 4,
    requiredSkills: [],
    tags: [],
    applicationRequired: false,
    contactInfo: { email: "" },
  });

  const [skillInput, setSkillInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchMyTeams();
  }, [refreshTrigger]);

  useEffect(() => {
    if (showCreateModal) {
      fetchAvailableHackathons();
    }
  }, [showCreateModal]);

  const fetchMyTeams = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getMyTeams();
      setMyTeams(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch teams");
      console.error("Error fetching teams:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableHackathons = async () => {
    try {
      setLoadingHackathons(true);
      const response = await hackathonAPI.getHackathons();
      setAvailableHackathons(response.data || []);
    } catch (err) {
      console.error("Error fetching hackathons:", err);
      setError("Failed to fetch hackathons");
    } finally {
      setLoadingHackathons(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await teamAPI.createTeam(createTeamForm);
      setSuccess("Team created successfully!");
      setShowCreateModal(false);
      resetCreateForm();
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const resetCreateForm = () => {
    setCreateTeamForm({
      name: "",
      description: "",
      hackathonId: "",
      maxMembers: 4,
      requiredSkills: [],
      tags: [],
      applicationRequired: false,
      contactInfo: { email: "" },
    });
    setSkillInput("");
    setTagInput("");
  };

  const handleViewApplications = async (team) => {
    try {
      setSelectedTeam(team);
      const response = await teamAPI.getTeamApplications(team._id);
      setTeamApplications(response.data || []);
      setShowApplicationsModal(true);
    } catch (err) {
      setError(err.message || "Failed to fetch applications");
    }
  };

  const handleViewMembers = async (team) => {
    try {
      setSelectedTeam(team);
      const response = await teamAPI.getTeamMembers(team._id);
      setTeamMembers(response.data || []);
      setShowMembersModal(true);
    } catch (err) {
      setError(err.message || "Failed to fetch team members");
    }
  };

  const handleApplicationAction = async (teamId, applicationId, status) => {
    try {
      await teamAPI.handleApplication(teamId, applicationId, status);
      setSuccess(`Application ${status} successfully!`);
      const response = await teamAPI.getTeamApplications(teamId);
      setTeamApplications(response.data || []);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err.message || "Failed to handle application");
    }
  };

  const handleLeaveTeam = async (teamId) => {
    if (window.confirm("Are you sure you want to leave this team?")) {
      try {
        await teamAPI.leaveTeam(teamId);
        setSuccess("Left team successfully!");
        setRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        setError(err.message || "Failed to leave team");
      }
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      try {
        await teamAPI.deleteTeam(teamId);
        setSuccess("Team deleted successfully!");
        setRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        setError(err.message || "Failed to delete team");
      }
    }
  };

  const handleKickMember = async (teamId, userId) => {
    if (window.confirm("Are you sure you want to remove this member?")) {
      try {
        await teamAPI.kickMember(teamId, userId);
        setSuccess("Member removed successfully!");
        const response = await teamAPI.getTeamMembers(teamId);
        setTeamMembers(response.data || []);
        setRefreshTrigger((prev) => prev + 1);
      } catch (err) {
        setError(err.message || "Failed to remove member");
      }
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !createTeamForm.requiredSkills.includes(skillInput.trim())) {
      setCreateTeamForm({
        ...createTeamForm,
        requiredSkills: [...createTeamForm.requiredSkills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove) => {
    setCreateTeamForm({
      ...createTeamForm,
      requiredSkills: createTeamForm.requiredSkills.filter(skill => skill !== skillToRemove),
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !createTeamForm.tags.includes(tagInput.trim())) {
      setCreateTeamForm({
        ...createTeamForm,
        tags: [...createTeamForm.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setCreateTeamForm({
      ...createTeamForm,
      tags: createTeamForm.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: { bg: "success", text: "OPEN" },
      full: { bg: "warning", text: "FULL" },
      closed: { bg: "danger", text: "CLOSED" },
    };
    const config = variants[status] || { bg: "secondary", text: status.toUpperCase() };
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };

  const getStatusIcon = (status) => {
    const icons = {
      open: "🟢",
      full: "🟡",
      closed: "🔴",
    };
    return icons[status] || "⚪";
  };

  const filteredAndSortedTeams = myTeams
    .filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.hackathon?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === "all" || team.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "status":
          return a.status.localeCompare(b.status);
        case "members":
          return (b.currentMembers || 0) - (a.currentMembers || 0);
        case "created":
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTeamProgress = (current, max) => {
    const percentage = (current / max) * 100;
    let variant = "info";
    if (percentage >= 100) variant = "success";
    else if (percentage >= 75) variant = "warning";
    return { percentage, variant };
  };

  return (
    <div className="min-vh-100" style={{
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      paddingTop: "2rem",
      paddingBottom: "2rem",
    }}>
      <Container fluid>
        {/* Header */}
        <Row className="mb-5">
          <Col>
            <div className="text-center text-white">
              <h1 className="display-3 fw-bold mb-3" style={{
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                background: "linear-gradient(45deg, #fff, #e3f2fd)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                🚀 TEAM DASHBOARD
              </h1>
              <p className="lead fs-4 opacity-90">
                Build amazing teams and conquer hackathons together
              </p>
            </div>
          </Col>
        </Row>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4 shadow-sm">
            <Alert.Heading><i className="fas fa-exclamation-triangle me-2"></i>Error!</Alert.Heading>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-4 shadow-sm">
            <Alert.Heading><i className="fas fa-check-circle me-2"></i>Success!</Alert.Heading>
            {success}
          </Alert>
        )}

        {/* Main Content */}
        <Row>
          <Col>
            <Card className="shadow-lg border-0" style={{
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
            }}>
              <Card.Body className="p-4">
                <Tabs
                  activeKey={activeTab}
                  onSelect={(k) => setActiveTab(k)}
                  className="mb-4 nav-pills"
                  variant="pills"
                >
                  <Tab eventKey="my-teams" title={
                    <span><i className="fas fa-users me-2"></i>My Teams ({myTeams.length})</span>
                  }>
                    {/* Controls */}
                    <Row className="mb-4 g-3">
                      <Col md={4}>
                        <InputGroup>
                          <InputGroup.Text>
                            <i className="fas fa-search"></i>
                          </InputGroup.Text>
                          <Form.Control
                            type="search"
                            placeholder="Search teams, descriptions, or hackathons..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </Col>
                      <Col md={2}>
                        <Form.Select 
                          value={filterStatus} 
                          onChange={(e) => setFilterStatus(e.target.value)}
                        >
                          <option value="all">All Status</option>
                          <option value="open">Open</option>
                          <option value="full">Full</option>
                          <option value="closed">Closed</option>
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                        <Form.Select 
                          value={sortBy} 
                          onChange={(e) => setSortBy(e.target.value)}
                        >
                          <option value="name">Sort by Name</option>
                          <option value="status">Sort by Status</option>
                          <option value="members">Sort by Members</option>
                          <option value="created">Sort by Created</option>
                        </Form.Select>
                      </Col>
                      <Col md={4} className="text-end">
                        <ButtonGroup>
                          <Button
                            variant="primary"
                            onClick={() => setShowCreateModal(true)}
                            className="px-4"
                          >
                            <i className="fas fa-plus me-2"></i>Create Team
                          </Button>
                          <Button
                            variant="outline-primary"
                            onClick={() => setRefreshTrigger((prev) => prev + 1)}
                          >
                            <i className="fas fa-sync-alt"></i>
                          </Button>
                        </ButtonGroup>
                      </Col>
                    </Row>

                    {/* Teams Display */}
                    {loading ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" size="lg" />
                        <p className="mt-3 fs-5">Loading your awesome teams...</p>
                      </div>
                    ) : filteredAndSortedTeams.length === 0 ? (
                      <div className="text-center py-5">
                        <div className="mb-4">
                          <i className="fas fa-users" style={{ fontSize: "4rem", color: "#6c757d" }}></i>
                        </div>
                        <h4 className="text-muted">
                          {searchTerm || filterStatus !== "all" ? "No teams match your criteria" : "No Teams Found"}
                        </h4>
                        <p className="text-muted mb-4">
                          {searchTerm || filterStatus !== "all" 
                            ? "Try adjusting your search or filter criteria" 
                            : "Create your first team to start collaborating!"}
                        </p>
                        {!searchTerm && filterStatus === "all" && (
                          <Button
                            variant="primary"
                            size="lg"
                            onClick={() => setShowCreateModal(true)}
                            className="px-5"
                          >
                            <i className="fas fa-plus me-2"></i>Create Your First Team
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Row className="g-4">
                        {filteredAndSortedTeams.map((team) => {
                          const progress = getTeamProgress(team.currentMembers || 0, team.maxMembers);
                          const isLeader = team.leader === "current-user-id";
                          
                          return (
                            <Col md={6} lg={4} key={team._id}>
                              <Card className="h-100 shadow-sm border-0 team-card" style={{
                                transition: "transform 0.2s, box-shadow 0.2s",
                                cursor: "pointer",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "translateY(-5px)";
                                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
                              }}>
                                <Card.Header className="bg-white border-0 pb-0">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <h5 className="mb-1 fw-bold text-primary">
                                        {getStatusIcon(team.status)} {team.name}
                                      </h5>
                                      {isLeader && (
                                        <Badge bg="info" className="mb-2">
                                          <i className="fas fa-crown me-1"></i>Leader
                                        </Badge>
                                      )}
                                    </div>
                                    {getStatusBadge(team.status)}
                                  </div>
                                </Card.Header>
                                
                                <Card.Body>
                                  <div className="mb-3">
                                    <small className="text-muted d-flex align-items-center mb-2">
                                      <i className="fas fa-calendar-alt me-2"></i>
                                      {team.hackathon?.name || "Unknown Hackathon"}
                                    </small>
                                    <p className="text-muted mb-3" style={{ 
                                      fontSize: "0.9rem",
                                      lineHeight: "1.4",
                                      display: "-webkit-box",
                                      WebkitLineClamp: "3",
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}>
                                      {team.description}
                                    </p>
                                  </div>

                                  {/* Team Progress */}
                                  <div className="mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                      <small className="text-muted">Team Members</small>
                                      <small className="fw-bold">
                                        {team.currentMembers || 0}/{team.maxMembers}
                                      </small>
                                    </div>
                                    <ProgressBar 
                                      now={progress.percentage} 
                                      variant={progress.variant}
                                      style={{ height: "8px" }}
                                    />
                                  </div>

                                  {/* Tags */}
                                  {team.tags && team.tags.length > 0 && (
                                    <div className="mb-3">
                                      <div className="d-flex flex-wrap gap-1">
                                        {team.tags.slice(0, 3).map((tag, index) => (
                                          <Badge key={index} bg="light" text="dark" className="border">
                                            {tag}
                                          </Badge>
                                        ))}
                                        {team.tags.length > 3 && (
                                          <Badge bg="secondary">
                                            +{team.tags.length - 3}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Action Buttons */}
                                  <div className="d-flex gap-2 flex-wrap">
                                    <Button
                                      size="sm"
                                      variant="outline-primary"
                                      onClick={() => handleViewMembers(team)}
                                      className="flex-fill"
                                    >
                                      <i className="fas fa-users me-1"></i>Members
                                    </Button>

                                    {isLeader && (
                                      <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip>View Applications</Tooltip>}
                                      >
                                        <Button
                                          size="sm"
                                          variant="outline-warning"
                                          onClick={() => handleViewApplications(team)}
                                        >
                                          <i className="fas fa-inbox"></i>
                                        </Button>
                                      </OverlayTrigger>
                                    )}

                                    <Dropdown>
                                      <Dropdown.Toggle
                                        size="sm"
                                        variant="outline-secondary"
                                        id={`dropdown-${team._id}`}
                                      >
                                        <i className="fas fa-ellipsis-v"></i>
                                      </Dropdown.Toggle>
                                      <Dropdown.Menu>
                                        {isLeader ? (
                                          <Dropdown.Item
                                            onClick={() => handleDeleteTeam(team._id)}
                                            className="text-danger"
                                          >
                                            <i className="fas fa-trash me-2"></i>Delete Team
                                          </Dropdown.Item>
                                        ) : (
                                          <Dropdown.Item
                                            onClick={() => handleLeaveTeam(team._id)}
                                            className="text-warning"
                                          >
                                            <i className="fas fa-sign-out-alt me-2"></i>Leave Team
                                          </Dropdown.Item>
                                        )}
                                      </Dropdown.Menu>
                                    </Dropdown>
                                  </div>
                                </Card.Body>
                                
                                <Card.Footer className="bg-light border-0 text-center py-2">
                                  <small className="text-muted">
                                    <i className="fas fa-clock me-1"></i>
                                    Created {formatDate(team.createdAt)}
                                  </small>
                                </Card.Footer>
                              </Card>
                            </Col>
                          );
                        })}
                      </Row>
                    )}
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Create Team Modal */}
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-plus-circle me-2"></i>Create New Team
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            <Form onSubmit={handleCreateTeam}>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      <i className="fas fa-tag me-2"></i>Team Name *
                    </Form.Label>
                    <Form.Control
                      type="text"
                      required
                      value={createTeamForm.name}
                      onChange={(e) => setCreateTeamForm({ ...createTeamForm, name: e.target.value })}
                      placeholder="Enter a catchy team name..."
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      <i className="fas fa-users me-2"></i>Max Members
                    </Form.Label>
                    <Form.Select
                      value={createTeamForm.maxMembers}
                      onChange={(e) => setCreateTeamForm({ ...createTeamForm, maxMembers: parseInt(e.target.value) })}
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <option key={num} value={num}>{num} members</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <i className="fas fa-align-left me-2"></i>Description *
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  required
                  value={createTeamForm.description}
                  onChange={(e) => setCreateTeamForm({ ...createTeamForm, description: e.target.value })}
                  placeholder="Describe your team's goals, what you're building, and what kind of teammates you're looking for..."
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <i className="fas fa-trophy me-2"></i>Select Hackathon *
                </Form.Label>
                <Form.Select
                  required
                  value={createTeamForm.hackathonId}
                  onChange={(e) => setCreateTeamForm({ ...createTeamForm, hackathonId: e.target.value })}
                >
                  <option value="">{loadingHackathons ? "Loading hackathons..." : "Choose a hackathon"}</option>
                  {availableHackathons.map((hackathon) => (
                    <option key={hackathon._id} value={hackathon._id}>
                      {hackathon.name} ({hackathon.status})
                    </option>
                  ))}
                </Form.Select>
                {availableHackathons.length === 0 && !loadingHackathons && (
                  <Form.Text className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    No hackathons available at the moment.
                  </Form.Text>
                )}
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      <i className="fas fa-envelope me-2"></i>Contact Email
                    </Form.Label>
                    <Form.Control
                      type="email"
                      value={createTeamForm.contactInfo.email}
                      onChange={(e) => setCreateTeamForm({
                        ...createTeamForm,
                        contactInfo: { ...createTeamForm.contactInfo, email: e.target.value }
                      })}
                      placeholder="team@example.com"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      <i className="fas fa-shield-alt me-2"></i>Application Settings
                    </Form.Label>
                    <Form.Check
                      type="checkbox"
                      label="Require application to join team"
                      checked={createTeamForm.applicationRequired}
                      onChange={(e) => setCreateTeamForm({ ...createTeamForm, applicationRequired: e.target.checked })}
                      className="mt-2"
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Required Skills */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <i className="fas fa-cogs me-2"></i>Required Skills
                </Form.Label>
                <InputGroup className="mb-2">
                  <Form.Control
                    type="text"
                    placeholder="Add a required skill..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <Button variant="outline-primary" onClick={addSkill} disabled={!skillInput.trim()}>
                    <i className="fas fa-plus"></i>
                  </Button>
                </InputGroup>
                <div className="d-flex flex-wrap gap-2">
                  {createTeamForm.requiredSkills.map((skill, index) => (
                    <Badge key={index} bg="primary" className="d-flex align-items-center">
                      {skill}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-2"
                        style={{ fontSize: '0.6rem' }}
                        onClick={() => removeSkill(skill)}
                      ></button>
                    </Badge>
                  ))}
                </div>
              </Form.Group>

              {/* Tags */}
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">
                  <i className="fas fa-tags me-2"></i>Tags
                </Form.Label>
                <InputGroup className="mb-2">
                  <Form.Control
                    type="text"
                    placeholder="Add a tag (e.g., React, AI, Mobile)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button variant="outline-secondary" onClick={addTag} disabled={!tagInput.trim()}>
                    <i className="fas fa-plus"></i>
                  </Button>
                </InputGroup>
                <div className="d-flex flex-wrap gap-2">
                  {createTeamForm.tags.map((tag, index) => (
                    <Badge key={index} bg="secondary" className="d-flex align-items-center">
                      {tag}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-2"
                        style={{ fontSize: '0.6rem' }}
                        onClick={() => removeTag(tag)}
                      ></button>
                    </Badge>
                  ))}
                </div>
              </Form.Group>

              <div className="d-flex gap-3">
                <Button type="submit" variant="primary" disabled={loading} className="px-4">
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-rocket me-2"></i>Create Team
                    </>
                  )}
                </Button>
                <Button variant="outline-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Team Applications Modal */}
        <Modal show={showApplicationsModal} onHide={() => setShowApplicationsModal(false)} size="lg" centered>
          <Modal.Header closeButton className="bg-warning text-dark">
            <Modal.Title>
              <i className="fas fa-inbox me-2"></i>Applications - {selectedTeam?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {teamApplications.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-inbox" style={{ fontSize: "4rem", color: "#6c757d" }}></i>
                <h5 className="mt-3">No Applications Yet</h5>
                <p className="text-muted">No one has applied to join this team yet. Share your team to get more visibility!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamApplications.map((application) => (
                  <Card key={application._id} className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" 
                                 style={{ width: '40px', height: '40px' }}>
                              <i className="fas fa-user text-white"></i>
                            </div>
                            <div>
                              <h6 className="mb-0 fw-bold">{application.user?.name || "Unknown User"}</h6>
                              <small className="text-muted">{application.user?.email}</small>
                            </div>
                          </div>
                          <p className="mb-2 text-muted">{application.message || "No message provided"}</p>
                          <small className="text-muted">
                            <i className="fas fa-clock me-1"></i>
                            Applied {formatDate(application.appliedAt)}
                          </small>
                        </div>
                        <div className="text-end">
                          <Badge bg={
                            application.status === "pending" ? "warning" :
                            application.status === "accepted" ? "success" : "danger"
                          } className="mb-2">
                            {application.status.toUpperCase()}
                          </Badge>
                          {application.status === "pending" && (
                            <div className="d-flex gap-2">
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleApplicationAction(selectedTeam._id, application._id, "accepted")}
                              >
                                <i className="fas fa-check me-1"></i>Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleApplicationAction(selectedTeam._id, application._id, "rejected")}
                              >
                                <i className="fas fa-times me-1"></i>Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Team Members Modal */}
        <Modal show={showMembersModal} onHide={() => setShowMembersModal(false)} size="lg" centered>
          <Modal.Header closeButton className="bg-info text-white">
            <Modal.Title>
              <i className="fas fa-users me-2"></i>Team Members - {selectedTeam?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {teamMembers.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-users" style={{ fontSize: "4rem", color: "#6c757d" }}></i>
                <h5 className="mt-3">No Members Yet</h5>
                <p className="text-muted">This team has no members yet. Invite people to join!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <Card key={member._id} className="border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="d-flex align-items-center flex-grow-1">
                          <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                            member.role === 'leader' ? 'bg-warning' : 'bg-primary'
                          }`} style={{ width: '50px', height: '50px' }}>
                            <i className={`fas ${member.role === 'leader' ? 'fa-crown' : 'fa-user'} text-white`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-1">
                              <h6 className="mb-0 fw-bold me-2">
                                {member.user?.name || member.name || "Unknown User"}
                              </h6>
                              {member.role === "leader" && (
                                <Badge bg="warning" text="dark">
                                  <i className="fas fa-crown me-1"></i>Leader
                                </Badge>
                              )}
                            </div>
                            <p className="mb-2 text-muted small">{member.user?.email || member.email}</p>
                            {member.skills && member.skills.length > 0 && (
                              <div className="d-flex flex-wrap gap-1">
                                {member.skills.map((skill, index) => (
                                  <Badge key={index} bg="light" text="dark" className="border">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <small className="text-muted">
                              <i className="fas fa-calendar-plus me-1"></i>
                              Joined {formatDate(member.joinedAt)}
                            </small>
                          </div>
                        </div>
                        {selectedTeam?.leader === "current-user-id" && member.role !== "leader" && (
                          <Dropdown>
                            <Dropdown.Toggle size="sm" variant="outline-secondary">
                              <i className="fas fa-ellipsis-v"></i>
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={() => handleKickMember(selectedTeam._id, member.user?._id || member._id)}
                                className="text-danger"
                              >
                                <i className="fas fa-user-minus me-2"></i>Remove Member
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <small className="text-muted w-100 text-center">
              <i className="fas fa-info-circle me-1"></i>
              Team has {teamMembers.length} of {selectedTeam?.maxMembers} members
            </small>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default TeamDashboard;