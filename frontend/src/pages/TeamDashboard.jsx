import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Tab,
  Tabs,
  Modal,
  Form,
  ListGroup,
  Alert,
  Spinner,
  ProgressBar,
  Dropdown,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import {
  FaUsers,
  FaPlus,
  FaCog,
  FaCalendarAlt,
  FaTrophy,
  FaCode,
  FaComments,
  FaFile,
  FaDownload,
  FaUpload,
  FaTrash,
  FaEdit,
  FaEye,
  FaCrown,
  FaUserPlus,
  FaSignOutAlt,
  FaBell
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const TeamDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Mock data - replace with API calls
  const mockTeams = [
    {
      id: 1,
      name: 'AI Innovators',
      description: 'Building the next generation of AI-powered applications',
      role: 'leader',
      members: [
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Team Leader',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          skills: ['React', 'Python', 'AI/ML'],
          isOnline: true
        },
        {
          id: 2,
          name: 'Alice Smith',
          email: 'alice@example.com',
          role: 'Frontend Developer',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
          skills: ['React', 'UI/UX', 'TypeScript'],
          isOnline: false
        },
        {
          id: 3,
          name: 'Bob Johnson',
          email: 'bob@example.com',
          role: 'Backend Developer',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          skills: ['Node.js', 'Python', 'MongoDB'],
          isOnline: true
        }
      ],
      hackathons: [
        {
          id: 1,
          name: 'TechCrunch Disrupt Hackathon',
          status: 'registered',
          startDate: '2024-06-15',
          endDate: '2024-06-17',
          prize: '$50,000'
        }
      ],
      files: [
        {
          id: 1,
          name: 'Project Proposal.pdf',
          size: '2.3 MB',
          uploadedBy: 'John Doe',
          uploadedAt: '2024-05-20'
        },
        {
          id: 2,
          name: 'Wireframes.fig',
          size: '5.1 MB',
          uploadedBy: 'Alice Smith',
          uploadedAt: '2024-05-22'
        }
      ],
      progress: {
        completed: 3,
        total: 8,
        tasks: [
          { id: 1, title: 'Set up project repository', completed: true, assignee: 'Bob Johnson' },
          { id: 2, title: 'Design UI mockups', completed: true, assignee: 'Alice Smith' },
          { id: 3, title: 'Research APIs', completed: true, assignee: 'John Doe' },
          { id: 4, title: 'Implement backend', completed: false, assignee: 'Bob Johnson' },
          { id: 5, title: 'Create frontend components', completed: false, assignee: 'Alice Smith' },
          { id: 6, title: 'Integrate AI model', completed: false, assignee: 'John Doe' },
          { id: 7, title: 'Testing and debugging', completed: false, assignee: 'Team' },
          { id: 8, title: 'Prepare presentation', completed: false, assignee: 'Team' }
        ]
      }
    },
    {
      id: 2,
      name: 'Blockchain Builders',
      description: 'Creating decentralized solutions for real-world problems',
      role: 'member',
      members: [
        {
          id: 4,
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          role: 'Team Leader',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
          skills: ['Blockchain', 'Solidity', 'Web3'],
          isOnline: true
        },
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          role: 'Full Stack Developer',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
          skills: ['React', 'Python', 'AI/ML'],
          isOnline: true
        }
      ],
      hackathons: [
        {
          id: 2,
          name: 'Ethereum Global Hackathon',
          status: 'in-progress',
          startDate: '2024-05-28',
          endDate: '2024-05-30',
          prize: '$25,000'
        }
      ],
      files: [],
      progress: {
        completed: 1,
        total: 5,
        tasks: [
          { id: 1, title: 'Research problem statement', completed: true, assignee: 'Sarah Wilson' },
          { id: 2, title: 'Smart contract development', completed: false, assignee: 'Sarah Wilson' },
          { id: 3, title: 'Frontend development', completed: false, assignee: 'John Doe' },
          { id: 4, title: 'Integration testing', completed: false, assignee: 'Team' },
          { id: 5, title: 'Demo preparation', completed: false, assignee: 'Team' }
        ]
      }
    }
  ];

  useEffect(() => {
    // Simulate API call
    const fetchTeams = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTeams(mockTeams);
        setSelectedTeam(mockTeams[0]);
      } catch (error) {
        console.error('Error fetching teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return;
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setToastMessage(`Invitation sent to ${inviteEmail}`);
      setShowToast(true);
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error sending invitation:', error);
    }
  };

  const handleCreateTeam = (teamData) => {
    // Simulate API call to create team
    const newTeam = {
      id: teams.length + 1,
      ...teamData,
      role: 'leader',
      members: [
        {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'Team Leader',
          avatar: user.avatar,
          skills: user.skills || [],
          isOnline: true
        }
      ],
      hackathons: [],
      files: [],
      progress: { completed: 0, total: 0, tasks: [] }
    };

    setTeams([...teams, newTeam]);
    setSelectedTeam(newTeam);
    setShowCreateTeamModal(false);
    setToastMessage('Team created successfully!');
    setShowToast(true);
  };

  const renderOverviewTab = () => (
    <Row>
      <Col lg={8}>
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              <FaTrophy className="me-2 text-warning" />
              Active Hackathons
            </h5>
          </Card.Header>
          <Card.Body>
            {selectedTeam?.hackathons?.length > 0 ? (
              selectedTeam.hackathons.map(hackathon => (
                <div key={hackathon.id} className="border rounded p-3 mb-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 className="mb-1">{hackathon.name}</h6>
                      <p className="text-muted mb-2">
                        <FaCalendarAlt className="me-1" />
                        {hackathon.startDate} - {hackathon.endDate}
                      </p>
                      <Badge bg={hackathon.status === 'in-progress' ? 'success' : 'primary'}>
                        {hackathon.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-end">
                      <h6 className="text-success mb-0">{hackathon.prize}</h6>
                      <small className="text-muted">Prize Pool</small>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Alert variant="info">
                <FaTrophy className="me-2" />
                No active hackathons. Browse available hackathons to participate!
              </Alert>
            )}
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              <FaCode className="me-2 text-primary" />
              Project Progress
            </h5>
          </Card.Header>
          <Card.Body>
            {selectedTeam?.progress && selectedTeam.progress.total > 0 ? (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span>Overall Progress</span>
                  <span className="fw-bold">
                    {selectedTeam.progress.completed}/{selectedTeam.progress.total} tasks
                  </span>
                </div>
                <ProgressBar 
                  now={(selectedTeam.progress.completed / selectedTeam.progress.total) * 100} 
                  className="mb-4"
                  variant="success"
                />
                <div className="row">
                  {selectedTeam.progress.tasks.map(task => (
                    <div key={task.id} className="col-md-6 mb-2">
                      <div className={`p-2 rounded border ${task.completed ? 'bg-light-success' : 'bg-light'}`}>
                        <div className="d-flex align-items-center">
                          <Form.Check
                            type="checkbox"
                            checked={task.completed}
                            readOnly
                            className="me-2"
                          />
                          <div className="flex-grow-1">
                            <div className={task.completed ? 'text-decoration-line-through text-muted' : ''}>
                              {task.title}
                            </div>
                            <small className="text-muted">Assigned to: {task.assignee}</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Alert variant="info">
                <FaCode className="me-2" />
                No project tasks yet. Start by creating your first task!
              </Alert>
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col lg={4}>
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              <FaUsers className="me-2 text-info" />
              Team Members ({selectedTeam?.members?.length || 0})
            </h5>
          </Card.Header>
          <Card.Body>
            {selectedTeam?.members?.map(member => (
              <div key={member.id} className="d-flex align-items-center mb-3">
                <div className="position-relative me-3">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="rounded-circle"
                    width="40"
                    height="40"
                  />
                  {member.isOnline && (
                    <span className="position-absolute bottom-0 end-0 bg-success rounded-circle" 
                          style={{width: '12px', height: '12px', border: '2px solid white'}}></span>
                  )}
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center">
                    <span className="fw-semibold me-2">{member.name}</span>
                    {member.role === 'Team Leader' && (
                      <FaCrown className="text-warning" size="14" />
                    )}
                  </div>
                  <small className="text-muted">{member.role}</small>
                  <div className="mt-1">
                    {member.skills?.slice(0, 2).map(skill => (
                      <Badge key={skill} bg="light" text="dark" className="me-1" style={{fontSize: '0.7em'}}>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {selectedTeam?.role === 'leader' && (
              <Button
                variant="outline-primary"
                size="sm"
                className="w-100"
                onClick={() => setShowInviteModal(true)}
              >
                <FaUserPlus className="me-2" />
                Invite Member
              </Button>
            )}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <h5 className="mb-0">
              <FaFile className="me-2 text-secondary" />
              Recent Files
            </h5>
          </Card.Header>
          <Card.Body>
            {selectedTeam?.files?.length > 0 ? (
              selectedTeam.files.map(file => (
                <div key={file.id} className="d-flex align-items-center justify-content-between py-2 border-bottom">
                  <div>
                    <div className="fw-semibold">{file.name}</div>
                    <small className="text-muted">
                      {file.size} • {file.uploadedBy} • {file.uploadedAt}
                    </small>
                  </div>
                  <Dropdown>
                    <Dropdown.Toggle variant="ghost" size="sm" className="border-0">
                      <FaCog />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item>
                        <FaDownload className="me-2" />
                        Download
                      </Dropdown.Item>
                      <Dropdown.Item>
                        <FaEye className="me-2" />
                        View
                      </Dropdown.Item>
                      <Dropdown.Item className="text-danger">
                        <FaTrash className="me-2" />
                        Delete
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              ))
            ) : (
              <Alert variant="light" className="text-center">
                <FaFile className="me-2" />
                No files uploaded yet
              </Alert>
            )}
            
            <Button
              variant="outline-secondary"
              size="sm"
              className="w-100 mt-3"
              onClick={() => setShowFileModal(true)}
            >
              <FaUpload className="me-2" />
              Upload File
            </Button>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderMembersTab = () => (
    <Row>
      <Col lg={8}>
        <Card>
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Team Members</h5>
              {selectedTeam?.role === 'leader' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowInviteModal(true)}
                >
                  <FaUserPlus className="me-2" />
                  Invite Member
                </Button>
              )}
            </div>
          </Card.Header>
          <Card.Body>
            {selectedTeam?.members?.map(member => (
              <Card key={member.id} className="mb-3">
                <Card.Body>
                  <Row className="align-items-center">
                    <Col md={2}>
                      <div className="position-relative">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="rounded-circle"
                          width="60"
                          height="60"
                        />
                        {member.isOnline && (
                          <span className="position-absolute bottom-0 end-0 bg-success rounded-circle" 
                                style={{width: '16px', height: '16px', border: '3px solid white'}}></span>
                        )}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="d-flex align-items-center mb-1">
                        <h6 className="mb-0 me-2">{member.name}</h6>
                        {member.role === 'Team Leader' && (
                          <FaCrown className="text-warning" />
                        )}
                      </div>
                      <p className="text-muted mb-2">{member.role}</p>
                      <div>
                        {member.skills?.map(skill => (
                          <Badge key={skill} bg="primary" className="me-1 mb-1">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </Col>
                    <Col md={4} className="text-end">
                      <small className="text-muted d-block mb-2">{member.email}</small>
                      {selectedTeam?.role === 'leader' && member.id !== user?.id && (
                        <Dropdown>
                          <Dropdown.Toggle variant="outline-secondary" size="sm">
                            Actions
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item>
                              <FaComments className="me-2" />
                              Send Message
                            </Dropdown.Item>
                            <Dropdown.Item>
                              <FaEdit className="me-2" />
                              Edit Role
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item className="text-danger">
                              <FaSignOutAlt className="me-2" />
                              Remove from Team
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            ))}
          </Card.Body>
        </Card>
      </Col>
      <Col lg={4}>
        <Card>
          <Card.Header>
            <h5 className="mb-0">Team Statistics</h5>
          </Card.Header>
          <Card.Body>
            <div className="text-center mb-3">
              <h3 className="text-primary">{selectedTeam?.members?.length || 0}</h3>
              <p className="text-muted mb-0">Total Members</p>
            </div>
            <hr />
            <div className="row text-center">
              <div className="col-6">
                <h5 className="text-success">
                  {selectedTeam?.members?.filter(m => m.isOnline).length || 0}
                </h5>
                <small className="text-muted">Online Now</small>
              </div>
              <div className="col-6">
                <h5 className="text-info">
                  {selectedTeam?.hackathons?.length || 0}
                </h5>
                <small className="text-muted">Active Hackathons</small>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderFilesTab = () => (
    <Row>
      <Col lg={8}>
        <Card>
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Team Files</h5>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowFileModal(true)}
              >
                <FaUpload className="me-2" />
                Upload File
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {selectedTeam?.files?.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Size</th>
                      <th>Uploaded By</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTeam.files.map(file => (
                      <tr key={file.id}>
                        <td>
                          <FaFile className="me-2 text-muted" />
                          {file.name}
                        </td>
                        <td>{file.size}</td>
                        <td>{file.uploadedBy}</td>
                        <td>{file.uploadedAt}</td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle variant="ghost" size="sm" className="border-0">
                              <FaCog />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item>
                                <FaDownload className="me-2" />
                                Download
                              </Dropdown.Item>
                              <Dropdown.Item>
                                <FaEye className="me-2" />
                                View
                              </Dropdown.Item>
                              <Dropdown.Item className="text-danger">
                                <FaTrash className="me-2" />
                                Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Alert variant="light" className="text-center py-5">
                <FaFile size="48" className="text-muted mb-3" />
                <h5>No files uploaded yet</h5>
                <p className="text-muted">Upload your first file to get started!</p>
                <Button
                  variant="primary"
                  onClick={() => setShowFileModal(true)}
                >
                  <FaUpload className="me-2" />
                  Upload File
                </Button>
              </Alert>
            )}
          </Card.Body>
        </Card>
      </Col>
      <Col lg={4}>
        <Card>
          <Card.Header>
            <h5 className="mb-0">Storage Info</h5>
          </Card.Header>
          <Card.Body>
            <div className="text-center mb-3">
              <h4 className="text-primary">15.2 MB</h4>
              <p className="text-muted mb-0">Used of 1 GB</p>
            </div>
            <ProgressBar now={1.5} className="mb-3" />
            <small className="text-muted">
              You have plenty of storage space remaining for your team files.
            </small>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Loading your teams...</p>
      </Container>
    );
  }

  if (teams.length === 0) {
    return (
      <Container className="py-5 text-center">
        <Card className="border-0 shadow-sm">
          <Card.Body className="py-5">
            <FaUsers size="64" className="text-muted mb-4" />
            <h3>No Teams Yet</h3>
            <p className="text-muted mb-4">
              Create your first team or wait for team invitations to get started!
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowCreateTeamModal(true)}
            >
              <FaPlus className="me-2" />
              Create Your First Team
            </Button>
          </Card.Body>
        </Card>

        <CreateTeamModal
          show={showCreateTeamModal}
          onHide={() => setShowCreateTeamModal(false)}
          onSubmit={handleCreateTeam}
        />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Team Dashboard</h2>
              <p className="text-muted mb-0">Manage your teams and collaborate on projects</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowCreateTeamModal(true)}
            >
              <FaPlus className="me-2" />
              Create Team
            </Button>
          </div>
        </Col>
      </Row>

      {/* Team Selector */}
      {teams.length > 1 && (
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <FaUsers className="me-3 text-primary" />
                  <div className="flex-grow-1">
                    <Form.Select
                      value={selectedTeam?.id || ''}
                      onChange={(e) => {
                        const teamId = parseInt(e.target.value);
                        const team = teams.find(t => t.id === teamId);
                        setSelectedTeam(team);
                      }}
                      className="border-0"
                    >
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.role})
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Team Info Card */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row className="align-items-center">
                <Col md={8}>
                  <div className="d-flex align-items-center mb-2">
                    <h4 className="mb-0 me-3">{selectedTeam?.name}</h4>
                    <Badge bg={selectedTeam?.role === 'leader' ? 'warning' : 'info'}>
                      {selectedTeam?.role === 'leader' ? 'Team Leader' : 'Member'}
                    </Badge>
                  </div>
                  <p className="text-muted mb-0">{selectedTeam?.description}</p>
                </Col>
                <Col md={4} className="text-end">
                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="outline-secondary" size="sm">
                      <FaCog className="me-1" />
                      Settings
                    </Button>
                    <Button variant="outline-primary" size="sm">
                      <FaComments className="me-1" />
                      Chat
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="overview" title={
          <span>
            <FaTrophy className="me-2" />
            Overview
          </span>
        }>
          {renderOverviewTab()}
        </Tab>
        
        <Tab eventKey="members" title={
          <span>
            <FaUsers className="me-2" />
            Members ({selectedTeam?.members?.length || 0})
          </span>
        }>
          {renderMembersTab()}
        </Tab>
        
        <Tab eventKey="files" title={
          <span>
            <FaFile className="me-2" />
            Files ({selectedTeam?.files?.length || 0})
          </span>
        }>
          {renderFilesTab()}
        </Tab>
      </Tabs>

      {/* Modals */}
      <InviteMemberModal
        show={showInviteModal}
        onHide={() => setShowInviteModal(false)}
        onInvite={handleInviteMember}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
      />

      <CreateTeamModal
        show={showCreateTeamModal}
        onHide={() => setShowCreateTeamModal(false)}
        onSubmit={handleCreateTeam}
      />

      <FileUploadModal
        show={showFileModal}
        onHide={() => setShowFileModal(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer position="bottom-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
        >
          <Toast.Header>
            <FaBell className="me-2 text-primary" />
            <strong className="me-auto">Notification</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

// Sub-components for modals
const InviteMemberModal = ({ show, onHide, onInvite, inviteEmail, setInviteEmail }) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>Invite Team Member</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Email Address</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email address"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
        </Form.Group>
        <Alert variant="info" className="small">
          An invitation link will be sent to this email address.
        </Alert>
      </Form>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Cancel
      </Button>
      <Button variant="primary" onClick={onInvite} disabled={!inviteEmail.trim()}>
        Send Invitation
      </Button>
    </Modal.Footer>
  </Modal>
);

const CreateTeamModal = ({ show, onHide, onSubmit }) => {
  const [teamData, setTeamData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (teamData.name.trim()) {
      onSubmit(teamData);
      setTeamData({ name: '', description: '' });
    }
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Create New Team</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Team Name *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter team name"
              value={teamData.name}
              onChange={(e) => setTeamData({...teamData, name: e.target.value})}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Describe your team's goals and interests"
              value={teamData.description}
              onChange={(e) => setTeamData({...teamData, description: e.target.value})}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!teamData.name.trim()}>
            Create Team
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

const FileUploadModal = ({ show, onHide }) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>Upload File</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Form>
        <Form.Group className="mb-3">
          <Form.Label>Select File</Form.Label>
          <Form.Control type="file" />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Description (Optional)</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Add a description for this file"
          />
        </Form.Group>
      </Form>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={onHide}>
        Cancel
      </Button>
      <Button variant="primary">
        Upload File
      </Button>
    </Modal.Footer>
  </Modal>
);

export default TeamDashboard;