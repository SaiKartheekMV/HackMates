import React, { useState } from 'react';
import { Card, Badge, Button, ProgressBar, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { teamAPI } from './teamAPI'; // Adjust import path as needed

const TeamCard = ({ 
  team, 
  currentUser, 
  onTeamUpdate, 
  onTeamJoin, 
  onTeamLeave,
  showActions = true,
  isDetailed = false 
}) => {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [joinData, setJoinData] = useState({ role: 'developer', message: '' });
  const [leaveData, setLeaveData] = useState({ transferTo: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if current user is team member
  const isTeamMember = team.members?.some(member => 
    member.userId._id === currentUser?._id && member.status === 'active'
  );

  // Check if current user is team leader
  const isTeamLeader = team.leaderId._id === currentUser?._id;

  // Get current user's member data
    // eslint-disable-next-line no-unused-vars
    const currentUserMemberData = team.members?.find(member =>  
    member.userId._id === currentUser?._id
    );
  // Handle join team
  const handleJoinTeam = async () => {
    if (!currentUser) {
      setError('You must be logged in to join a team');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await teamAPI.joinTeam(team._id, joinData);
      if (result.success) {
        setShowJoinModal(false);
        setJoinData({ role: 'developer', message: '' });
        if (onTeamJoin) onTeamJoin(team._id, result.data);
        if (onTeamUpdate) onTeamUpdate();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle leave team
  const handleLeaveTeam = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await teamAPI.leaveTeam(team._id, leaveData);
      if (result.success) {
        setShowLeaveModal(false);
        setLeaveData({ transferTo: '' });
        if (onTeamLeave) onTeamLeave(team._id);
        if (onTeamUpdate) onTeamUpdate();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'forming': return 'warning';
      case 'complete': return 'success';
      case 'competing': return 'primary';
      case 'finished': return 'info';
      case 'disbanded': return 'danger';
      default: return 'secondary';
    }
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'leader': return 'danger';
      case 'developer': return 'primary';
      case 'designer': return 'info';
      case 'data_scientist': return 'success';
      case 'product_manager': return 'warning';
      case 'marketing': return 'secondary';
      default: return 'light';
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <Card className="h-100 shadow-sm team-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-1">{team.name}</h5>
            <Badge bg={getStatusColor(team.status)} className="me-2">
              {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
            </Badge>
            {team.isFull && <Badge bg="danger">Full</Badge>}
          </div>
          <div className="text-muted small">
            {team.teamSize.current}/{team.teamSize.max} members
          </div>
        </Card.Header>

        <Card.Body>
          {/* Description */}
          <p className="text-muted mb-3">
            {team.description.length > 150 && !isDetailed 
              ? `${team.description.substring(0, 150)}...` 
              : team.description}
          </p>

          {/* Team Leader */}
          <div className="mb-3">
            <small className="text-muted">Team Leader:</small>
            <div className="d-flex align-items-center mt-1">
              <img 
                src={team.leaderId.profilePicture || '/default-avatar.png'} 
                alt={`${team.leaderId.firstName} ${team.leaderId.lastName}`}
                className="rounded-circle me-2"
                width="24"
                height="24"
              />
              <span className="fw-medium">
                {team.leaderId.firstName} {team.leaderId.lastName}
              </span>
            </div>
          </div>

          {/* Team Members (if detailed view) */}
          {isDetailed && team.members.length > 0 && (
            <div className="mb-3">
              <small className="text-muted">Team Members:</small>
              <div className="mt-2">
                {team.members
                  .filter(member => member.status === 'active')
                  .map((member, index) => (
                  <div key={member._id || index} className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center">
                      <img 
                        src={member.userId.profilePicture || '/default-avatar.png'} 
                        alt={`${member.userId.firstName} ${member.userId.lastName}`}
                        className="rounded-circle me-2"
                        width="24"
                        height="24"
                      />
                      <span className="me-2">
                        {member.userId.firstName} {member.userId.lastName}
                      </span>
                    </div>
                    <Badge bg={getRoleColor(member.role)} className="small">
                      {member.role.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Skills */}
          {team.requiredSkills.length > 0 && (
            <div className="mb-3">
              <small className="text-muted">Required Skills:</small>
              <div className="mt-1">
                {team.requiredSkills.slice(0, isDetailed ? team.requiredSkills.length : 3).map((skillObj, index) => (
                  <Badge 
                    key={index} 
                    bg={skillObj.fulfilled ? 'success' : 'outline-secondary'} 
                    className="me-1 mb-1"
                  >
                    {skillObj.skill}
                    {skillObj.priority === 'critical' && ' ⚡'}
                    {skillObj.priority === 'high' && ' 🔥'}
                  </Badge>
                ))}
                {!isDetailed && team.requiredSkills.length > 3 && (
                  <Badge bg="light" className="text-muted">
                    +{team.requiredSkills.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Project Info */}
          {team.project?.name && (
            <div className="mb-3">
              <small className="text-muted">Project:</small>
              <div className="mt-1">
                <strong>{team.project.name}</strong>
                {team.project.category && (
                  <Badge bg="outline-primary" className="ms-2 small">
                    {team.project.category.replace('_', ' ')}
                  </Badge>
                )}
              </div>
              {isDetailed && team.project.description && (
                <p className="text-muted small mt-1">{team.project.description}</p>
              )}
            </div>
          )}

          {/* Technologies */}
          {team.project?.technologies?.length > 0 && (
            <div className="mb-3">
              <small className="text-muted">Technologies:</small>
              <div className="mt-1">
                {team.project.technologies.slice(0, isDetailed ? team.project.technologies.length : 4).map((tech, index) => (
                  <Badge key={index} bg="outline-info" className="me-1 mb-1 small">
                    {tech}
                  </Badge>
                ))}
                {!isDetailed && team.project.technologies.length > 4 && (
                  <Badge bg="light" className="text-muted small">
                    +{team.project.technologies.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          {team.location?.preference && (
            <div className="mb-3">
              <small className="text-muted">Work Style:</small>
              <div className="mt-1">
                <Badge bg="outline-secondary" className="me-2">
                  {team.location.preference.replace('_', ' ')}
                </Badge>
                {team.location.city && (
                  <span className="text-muted small">
                    📍 {team.location.city}
                    {team.location.country && `, ${team.location.country}`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {team.tags?.length > 0 && (
            <div className="mb-3">
              <small className="text-muted">Tags:</small>
              <div className="mt-1">
                {team.tags.slice(0, isDetailed ? team.tags.length : 3).map((tag, index) => (
                  <Badge key={index} bg="light" className="text-dark me-1 mb-1 small">
                    #{tag}
                  </Badge>
                ))}
                {!isDetailed && team.tags.length > 3 && (
                  <Badge bg="light" className="text-muted small">
                    +{team.tags.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Profile Completion */}
          {isDetailed && (
            <div className="mb-3">
              <small className="text-muted">Profile Completion:</small>
              <ProgressBar 
                now={team.profileCompletion || team.stats?.completionScore || 0} 
                className="mt-1"
                variant={team.profileCompletion >= 80 ? 'success' : team.profileCompletion >= 50 ? 'warning' : 'danger'}
              />
              <small className="text-muted">
                {team.profileCompletion || team.stats?.completionScore || 0}% complete
              </small>
            </div>
          )}

          {/* Last Activity */}
          <div className="text-muted small">
            <span>Last active: {formatDate(team.stats?.lastActivity || team.updatedAt)}</span>
            {team.stats?.viewCount > 0 && (
              <span className="ms-3">👁 {team.stats.viewCount} views</span>
            )}
          </div>
        </Card.Body>

        {/* Actions */}
        {showActions && (
          <Card.Footer className="bg-light">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                {team.availableSpots > 0 && (
                  <small className="text-success">
                    🟢 {team.availableSpots} spot{team.availableSpots !== 1 ? 's' : ''} available
                  </small>
                )}
                {team.isFull && (
                  <small className="text-danger">🔴 Team full</small>
                )}
              </div>
              
              <div>
                {!isTeamMember && !team.isFull && currentUser && (
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => setShowJoinModal(true)}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : 'Join Team'}
                  </Button>
                )}
                
                {isTeamMember && (
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => setShowLeaveModal(true)}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" /> : 'Leave Team'}
                  </Button>
                )}
                
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="ms-2"
                  onClick={() => window.open(`/teams/${team._id}`, '_blank')}
                >
                  View Details
                </Button>
              </div>
            </div>
          </Card.Footer>
        )}
      </Card>

      {/* Join Team Modal */}
      <Modal show={showJoinModal} onHide={() => setShowJoinModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Join Team: {team.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select 
                value={joinData.role}
                onChange={(e) => setJoinData({...joinData, role: e.target.value})}
              >
                <option value="developer">Developer</option>
                <option value="designer">Designer</option>
                <option value="data_scientist">Data Scientist</option>
                <option value="product_manager">Product Manager</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Message (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Tell the team why you'd like to join..."
                value={joinData.message}
                onChange={(e) => setJoinData({...joinData, message: e.target.value})}
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {joinData.message.length}/500 characters
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowJoinModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleJoinTeam}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" className="me-2" /> : null}
            Join Team
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Leave Team Modal */}
      <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Leave Team: {team.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Alert variant="warning">
            Are you sure you want to leave this team? This action cannot be undone.
          </Alert>
          
          {isTeamLeader && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Transfer Leadership To</Form.Label>
                <Form.Select 
                  value={leaveData.transferTo}
                  onChange={(e) => setLeaveData({...leaveData, transferTo: e.target.value})}
                  required
                >
                  <option value="">Select new leader...</option>
                  {team.members
                    .filter(member => 
                      member.status === 'active' && 
                      member.userId._id !== currentUser._id
                    )
                    .map(member => (
                    <option key={member.userId._id} value={member.userId._id}>
                      {member.userId.firstName} {member.userId.lastName} ({member.role})
                    </option>
                  ))}
                </Form.Select>
                <Form.Text className="text-muted">
                  As team leader, you must transfer leadership before leaving.
                </Form.Text>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleLeaveTeam}
            disabled={loading || (isTeamLeader && !leaveData.transferTo)}
          >
            {loading ? <Spinner size="sm" className="me-2" /> : null}
            Leave Team
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TeamCard;