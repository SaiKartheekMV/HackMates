/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Modal, Form, Alert, Spinner, Tabs, Tab, ListGroup, ProgressBar } from 'react-bootstrap';
import { teamAPI } from '../services/api';

const TeamDashboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [activeTab, setActiveTab] = useState('my-teams');
  
  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    hackathonId: '',
    requiredSkills: [],
    maxMembers: 4,
    isPublic: true
  });

  // Mock data for demonstration
  const mockTeams = [
    {
      _id: '1',
      name: 'Neural Nexus',
      description: 'AI-powered solution for smart city infrastructure',
      hackathonId: { _id: 'h1', title: 'TechCrunch Disrupt 2025', startDate: '2025-07-15', endDate: '2025-07-17', status: 'upcoming' },
      leaderId: { _id: 'u1', firstName: 'Alex', lastName: 'Chen', profilePicture: null },
      members: [
        { userId: { _id: 'u1', firstName: 'Alex', lastName: 'Chen' }, role: 'Team Leader', status: 'active' },
        { userId: { _id: 'u2', firstName: 'Sarah', lastName: 'Kim' }, role: 'Frontend Dev', status: 'active' },
        { userId: { _id: 'u3', firstName: 'Mike', lastName: 'Johnson' }, role: 'AI Engineer', status: 'active' }
      ],
      requiredSkills: ['React', 'Python', 'TensorFlow', 'Node.js'],
      maxMembers: 4,
      status: 'forming',
      isPublic: true,
      createdAt: '2025-06-01'
    },
    {
      _id: '2',
      name: 'Quantum Coders',
      description: 'Blockchain-based decentralized voting system',
      hackathonId: { _id: 'h2', title: 'ETHGlobal 2025', startDate: '2025-08-10', endDate: '2025-08-12' },
      leaderId: { _id: 'u4', firstName: 'David', lastName: 'Park' },
      members: [
        { userId: { _id: 'u4', firstName: 'David', lastName: 'Park' }, role: 'Team Leader', status: 'active' },
        { userId: { _id: 'u5', firstName: 'Emma', lastName: 'Wilson' }, role: 'Smart Contract Dev', status: 'active' }
      ],
      requiredSkills: ['Solidity', 'Web3.js', 'React', 'IPFS'],
      maxMembers: 5,
      status: 'forming',
      isPublic: true,
      createdAt: '2025-06-03'
    }
  ];

 const fetchTeams = async () => {
  try {
    setLoading(true);
    const response = await teamAPI.getMyTeams();
    // Access the data properly
    setTeams(response.data.teams || response.data || []);
  } catch (error) {
    console.error('Error fetching teams:', error);
    const errorMessage = error.response?.data?.message || 'Failed to load teams';
    showAlert(errorMessage, 'danger');
  } finally {
    setLoading(false);
  }
};

const handleCreateTeam = async (e) => {
  e.preventDefault();
  try {
    setLoading(true);
    const response = await teamAPI.createTeam(createForm);
    
    // Refresh teams list
    const teamsResponse = await teamAPI.getMyTeams();
    setTeams(teamsResponse.data.teams || teamsResponse.data || []);
    
    setShowCreateModal(false);
    setCreateForm({ 
      name: '', 
      description: '', 
      hackathonId: '', 
      requiredSkills: [], 
      maxMembers: 4, 
      isPublic: true 
    });
    showAlert('Team created successfully!', 'success');
  } catch (error) {
    console.error('Error creating team:', error);
    const errorMessage = error.response?.data?.message || 'Failed to create team';
    showAlert(errorMessage, 'danger');
  } finally {
    setLoading(false);
  }
};

const handleJoinTeam = async (teamId) => {
  try {
    await teamAPI.joinTeam(teamId);
    showAlert('Successfully joined team!', 'success');
    
    // Refresh teams if needed
    if (activeTab === 'my-teams') {
      const response = await teamAPI.getMyTeams();
      setTeams(response.data);
    }
  } catch (error) {
    console.error('Error joining team:', error);
    showAlert(error.response?.data?.message || 'Failed to join team', 'danger');
  }
};

  const handleLeaveTeam = async (teamId) => {
  try {
    await teamAPI.leaveTeam(teamId);
    
    // Remove team from local state
    setTeams(prev => prev.filter(team => team._id !== teamId));
    showAlert('Successfully left team', 'success');
  } catch (error) {
    console.error('Error leaving team:', error);
    showAlert(error.response?.data?.message || 'Failed to leave team', 'danger');
  }
};

const [exploreTeams, setExploreTeams] = useState([]);


  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'forming': return 'warning';
      case 'complete': return 'success';
      case 'active': return 'primary';
      default: return 'secondary';
    }
  };

  const TeamCard = ({ team, isMyTeam = true }) => (
    <Card className="team-card mb-4 h-100" style={{
      background: 'linear-gradient(145deg, #0a0a0a 0%, #1a1a2e 100%)',
      border: '1px solid #16213e',
      borderRadius: '15px',
      boxShadow: '0 8px 32px rgba(0, 123, 255, 0.1)'
    }}>
      <Card.Header style={{
        background: 'linear-gradient(90deg, #0f3460 0%, #16213e 100%)',
        border: 'none',
        borderRadius: '15px 15px 0 0'
      }}>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0" style={{ color: '#00f5ff', fontWeight: '600' }}>
            {team.name}
          </h5>
          <Badge bg={getStatusColor(team.status)} style={{
            background: team.status === 'forming' ? '#ffd700' : '#00ff00',
            color: '#000',
            textTransform: 'uppercase',
            fontSize: '0.7rem',
            fontWeight: '700'
          }}>
            {team.status}
          </Badge>
        </div>
      </Card.Header>
      
      <Card.Body style={{ color: '#e0e6ed' }}>
        <p className="text-muted mb-3" style={{ color: '#8892b0 !important' }}>
          {team.description}
        </p>
        
        <div className="mb-3">
          <small style={{ color: '#64ffda', fontWeight: '600' }}>HACKATHON EVENT</small>
          <div style={{ color: '#ccd6f6' }}>{team.hackathonId.title}</div>
          <small style={{ color: '#8892b0' }}>
            {new Date(team.hackathonId.startDate).toLocaleDateString()} - {new Date(team.hackathonId.endDate).toLocaleDateString()}
          </small>
        </div>

        <div className="mb-3">
          <small style={{ color: '#64ffda', fontWeight: '600' }}>TEAM COMPOSITION</small>
          <ProgressBar 
            now={(team.members.filter(m => m.status === 'active').length / team.maxMembers) * 100}
            style={{ height: '8px', background: '#16213e' }}
          >
            <ProgressBar 
              now={(team.members.filter(m => m.status === 'active').length / team.maxMembers) * 100}
              style={{ background: 'linear-gradient(90deg, #ffd700, #ff6b6b)' }}
            />
          </ProgressBar>
          <small style={{ color: '#8892b0' }}>
            {team.members.filter(m => m.status === 'active').length}/{team.maxMembers} members
          </small>
        </div>

        <div className="mb-3">
          <small style={{ color: '#64ffda', fontWeight: '600' }}>REQUIRED SKILLS</small>
          <div className="d-flex flex-wrap gap-1 mt-1">
            {team.requiredSkills.slice(0, 4).map((skill, idx) => (
              <Badge 
                key={idx} 
                style={{
                  background: 'linear-gradient(45deg, #ff6b6b, #ffd700)',
                  color: '#000',
                  fontSize: '0.7rem',
                  fontWeight: '600'
                }}
              >
                {skill}
              </Badge>
            ))}
            {team.requiredSkills.length > 4 && (
              <Badge style={{ background: '#16213e', color: '#64ffda' }}>
                +{team.requiredSkills.length - 4}
              </Badge>
            )}
          </div>
        </div>

        <div className="mb-3">
          <small style={{ color: '#64ffda', fontWeight: '600' }}>TEAM MEMBERS</small>
          {team.members.filter(m => m.status === 'active').map((member, idx) => (
            <div key={idx} className="d-flex align-items-center mt-1">
              <div 
                className="rounded-circle me-2" 
                style={{
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(45deg, #00f5ff, #0066ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: '700',
                  color: '#000'
                }}
              >
                {member.userId.firstName[0]}
              </div>
              <small style={{ color: '#ccd6f6' }}>
                {member.userId.firstName} {member.userId.lastName}
                {member.role === 'Team Leader' && (
                  <Badge bg="warning" className="ms-1" style={{ fontSize: '0.6rem', color: '#000' }}>
                    LEADER
                  </Badge>
                )}
              </small>
            </div>
          ))}
        </div>
      </Card.Body>

      <Card.Footer style={{
        background: 'linear-gradient(90deg, #16213e 0%, #0f3460 100%)',
        border: 'none',
        borderRadius: '0 0 15px 15px'
      }}>
        <div className="d-flex gap-2">
          <Button
            size="sm"
            onClick={() => {setSelectedTeam(team); setShowTeamModal(true);}}
            style={{
              background: 'linear-gradient(45deg, #00f5ff, #0066ff)',
              border: 'none',
              color: '#000',
              fontWeight: '600',
              textTransform: 'uppercase',
              fontSize: '0.7rem'
            }}
          >
            View Details
          </Button>
          {isMyTeam ? (
            <Button
              size="sm"
              variant="outline-danger"
              onClick={() => handleLeaveTeam(team._id)}
              style={{
                borderColor: '#ff6b6b',
                color: '#ff6b6b',
                fontWeight: '600',
                textTransform: 'uppercase',
                fontSize: '0.7rem'
              }}
            >
              Leave Team
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => handleJoinTeam(team._id)}
              style={{
                background: 'linear-gradient(45deg, #ffd700, #ff6b6b)',
                border: 'none',
                color: '#000',
                fontWeight: '600',
                textTransform: 'uppercase',
                fontSize: '0.7rem'
              }}
            >
              Join Team
            </Button>
          )}
        </div>
      </Card.Footer>
    </Card>
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" style={{ color: '#00f5ff' }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      color: '#e0e6ed'
    }}>
      <Container fluid className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="text-center mb-4">
              <h1 style={{
                background: 'linear-gradient(45deg, #00f5ff, #ffd700, #ff6b6b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: '3rem',
                fontWeight: '700',
                textShadow: '0 0 20px rgba(0, 245, 255, 0.3)'
              }}>
                TEAM DASHBOARD
              </h1>
              <p style={{ color: '#8892b0', fontSize: '1.1rem' }}>
                Command Center for Your Hackathon Teams
              </p>
            </div>
          </Col>
        </Row>

        {/* Alert */}
        {alert.show && (
          <Row className="mb-3">
            <Col>
              <Alert variant={alert.type} className="text-center">
                {alert.message}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Navigation Tabs */}
        <Row className="mb-4">
          <Col>
            <Tabs
              activeKey={activeTab}
              onSelect={setActiveTab}
              className="custom-tabs"
              style={{
                borderBottom: '2px solid #16213e'
              }}
            >
              <Tab
                eventKey="my-teams"
                title={
                  <span style={{
                    color: activeTab === 'my-teams' ? '#00f5ff' : '#8892b0',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    My Teams ({teams.length})
                  </span>
                }
              >
                <div className="mt-4">
                  <Row className="mb-3">
                    <Col>
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                          background: 'linear-gradient(45deg, #ffd700, #ff6b6b)',
                          border: 'none',
                          color: '#000',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          padding: '10px 30px',
                          borderRadius: '25px',
                          boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
                        }}
                      >
                        + Create New Team
                      </Button>
                    </Col>
                  </Row>

                  {teams.length === 0 ? (
                    <Card style={{
                      background: 'linear-gradient(145deg, #0a0a0a 0%, #1a1a2e 100%)',
                      border: '1px solid #16213e',
                      borderRadius: '15px'
                    }}>
                      <Card.Body className="text-center py-5">
                        <h4 style={{ color: '#64ffda' }}>No Teams Found</h4>
                        <p style={{ color: '#8892b0' }}>Create your first team to get started!</p>
                      </Card.Body>
                    </Card>
                  ) : (
                    <Row>
                      {teams.map(team => (
                        <Col key={team._id} lg={6} xl={4} className="mb-4">
                          <TeamCard team={team} />
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              </Tab>

              <Tab
                eventKey="explore"
                title={
                  <span style={{
                    color: activeTab === 'explore' ? '#00f5ff' : '#8892b0',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    Explore Teams
                  </span>
                }
              >
                <div className="mt-4">
                  <Row>
                    {mockTeams.map(team => (
                      <Col key={team._id} lg={6} xl={4} className="mb-4">
                        <TeamCard team={team} isMyTeam={false} />
                      </Col>
                    ))}
                  </Row>
                </div>
              </Tab>
            </Tabs>
          </Col>
        </Row>

        {/* Create Team Modal */}
        <Modal
          show={showCreateModal}
          onHide={() => setShowCreateModal(false)}
          size="lg"
          centered
          style={{ color: '#000' }}
        >
          <Modal.Header 
            closeButton
            style={{
              background: 'linear-gradient(90deg, #0f3460 0%, #16213e 100%)',
              border: 'none',
              color: '#00f5ff'
            }}
          >
            <Modal.Title style={{ fontWeight: '700', textTransform: 'uppercase' }}>
              Create New Team
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ 
            background: 'linear-gradient(145deg, #1a1a2e 0%, #0a0a0a 100%)',
            color: '#e0e6ed'
          }}>
            <Form onSubmit={handleCreateTeam}>
              <Form.Group className="mb-3">
                <Form.Label style={{ color: '#64ffda', fontWeight: '600' }}>Team Name</Form.Label>
                <Form.Control
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  style={{
                    background: '#16213e',
                    border: '1px solid #64ffda',
                    color: '#e0e6ed',
                    borderRadius: '8px'
                  }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ color: '#64ffda', fontWeight: '600' }}>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  style={{
                    background: '#16213e',
                    border: '1px solid #64ffda',
                    color: '#e0e6ed',
                    borderRadius: '8px'
                  }}
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label style={{ color: '#64ffda', fontWeight: '600' }}>Max Members</Form.Label>
                    <Form.Control
                      type="number"
                      min="2"
                      max="10"
                      value={createForm.maxMembers}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                      style={{
                        background: '#16213e',
                        border: '1px solid #64ffda',
                        color: '#e0e6ed',
                        borderRadius: '8px'
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      label="Public Team"
                      checked={createForm.isPublic}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                      style={{ color: '#e0e6ed', marginTop: '2rem' }}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex gap-2 justify-content-end">
                <Button
                  variant="outline-secondary"
                  onClick={() => setShowCreateModal(false)}
                  style={{ borderColor: '#8892b0', color: '#8892b0' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  style={{
                    background: 'linear-gradient(45deg, #00f5ff, #0066ff)',
                    border: 'none',
                    color: '#000',
                    fontWeight: '600'
                  }}
                >
                  Create Team
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Team Details Modal */}
        <Modal
          show={showTeamModal}
          onHide={() => setShowTeamModal(false)}
          size="lg"
          centered
        >
          <Modal.Header 
            closeButton
            style={{
              background: 'linear-gradient(90deg, #0f3460 0%, #16213e 100%)',
              border: 'none',
              color: '#00f5ff'
            }}
          >
            <Modal.Title style={{ fontWeight: '700', textTransform: 'uppercase' }}>
              {selectedTeam?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ 
            background: 'linear-gradient(145deg, #1a1a2e 0%, #0a0a0a 100%)',
            color: '#e0e6ed'
          }}>
            {selectedTeam && (
              <div>
                <p style={{ color: '#8892b0' }}>{selectedTeam.description}</p>
                
                <div className="mb-3">
                  <h6 style={{ color: '#64ffda' }}>Hackathon</h6>
                  <p style={{ color: '#ccd6f6' }}>{selectedTeam.hackathonId.title}</p>
                </div>

                <div className="mb-3">
                  <h6 style={{ color: '#64ffda' }}>Team Members</h6>
                  <ListGroup variant="flush">
                    {selectedTeam.members.filter(m => m.status === 'active').map((member, idx) => (
                      <ListGroup.Item 
                        key={idx}
                        style={{ 
                          background: 'transparent', 
                          border: '1px solid #16213e',
                          color: '#e0e6ed',
                          marginBottom: '8px',
                          borderRadius: '8px'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <span>{member.userId.firstName} {member.userId.lastName}</span>
                          <Badge 
                            bg={member.role === 'Team Leader' ? 'warning' : 'info'}
                            style={{ color: '#000' }}
                          >
                            {member.role}
                          </Badge>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </div>

                <div className="mb-3">
                  <h6 style={{ color: '#64ffda' }}>Required Skills</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedTeam.requiredSkills.map((skill, idx) => (
                      <Badge 
                        key={idx}
                        style={{
                          background: 'linear-gradient(45deg, #ff6b6b, #ffd700)',
                          color: '#000'
                        }}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
        </Modal>
      </Container>

      <style>{`
        .team-card:hover {
          transform: translateY(-5px);
          transition: all 0.3s ease;
          box-shadow: 0 12px 40px rgba(0, 245, 255, 0.2) !important;
        }
        
        .custom-tabs .nav-link {
          border: none !important;
          background: transparent !important;
        }
        
        .custom-tabs .nav-link.active {
          border-bottom: 2px solid #00f5ff !important;
          background: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default TeamDashboard;