import React from 'react';
import { Card, Badge, Button, Row, Col } from 'react-bootstrap';
import { FaCalendar, FaMapMarkerAlt, FaTrophy, FaUsers, FaClock } from 'react-icons/fa';

const HackathonCard = ({ hackathon, onApply, onViewDetails }) => {
  const {
    id,
    title,
    description,
    startDate,
    endDate,
    location,
    mode, // online, offline, hybrid
    prizePool,
    maxTeamSize,
    registrationDeadline,
    tags,
    organizer,
    difficulty,
    status // upcoming, ongoing, ended
  } = hackathon;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'upcoming': return 'primary';
      case 'ongoing': return 'success';
      case 'ended': return 'secondary';
      default: return 'secondary';
    }
  };

  const getModeVariant = (mode) => {
    switch (mode) {
      case 'online': return 'info';
      case 'offline': return 'warning';
      case 'hybrid': return 'success';
      default: return 'secondary';
    }
  };

  const daysUntilStart = getDaysUntil(startDate);
  const daysUntilRegistration = getDaysUntil(registrationDeadline);

  return (
    <Card className="h-100 shadow-sm border-0 hackathon-card">
      <Card.Header className="bg-white border-bottom-0 pt-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <Badge bg={getStatusVariant(status)} className="mb-2">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          <Badge bg={getModeVariant(mode)}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Badge>
        </div>
        <Card.Title className="h5 mb-2">{title}</Card.Title>
        <Card.Subtitle className="text-muted small mb-2">
          by {organizer}
        </Card.Subtitle>
      </Card.Header>

      <Card.Body className="pt-2">
        <Card.Text className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
          {description.length > 120 
            ? `${description.substring(0, 120)}...` 
            : description
          }
        </Card.Text>

        <Row className="g-2 mb-3 small text-muted">
          <Col xs={6}>
            <div className="d-flex align-items-center">
              <FaCalendar className="me-2" />
              <span>{formatDate(startDate)}</span>
            </div>
          </Col>
          <Col xs={6}>
            <div className="d-flex align-items-center">
              <FaMapMarkerAlt className="me-2" />
              <span>{location}</span>
            </div>
          </Col>
          <Col xs={6}>
            <div className="d-flex align-items-center">
              <FaTrophy className="me-2" />
              <span>₹{prizePool.toLocaleString()}</span>
            </div>
          </Col>
          <Col xs={6}>
            <div className="d-flex align-items-center">
              <FaUsers className="me-2" />
              <span>Max {maxTeamSize} members</span>
            </div>
          </Col>
        </Row>

        {daysUntilRegistration > 0 && (
          <div className="d-flex align-items-center mb-3 text-warning small">
            <FaClock className="me-2" />
            <span>
              Registration closes in {daysUntilRegistration} day{daysUntilRegistration !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="mb-3">
          {tags && tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} bg="light" text="dark" className="me-1 mb-1">
              {tag}
            </Badge>
          ))}
          {tags && tags.length > 3 && (
            <Badge bg="light" text="dark">+{tags.length - 3} more</Badge>
          )}
        </div>

        {difficulty && (
          <div className="mb-3">
            <small className="text-muted">Difficulty: </small>
            <Badge 
              bg={difficulty === 'Beginner' ? 'success' : difficulty === 'Intermediate' ? 'warning' : 'danger'}
            >
              {difficulty}
            </Badge>
          </div>
        )}
      </Card.Body>

      <Card.Footer className="bg-white border-top-0">
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={() => onViewDetails(hackathon)}
            className="flex-fill"
          >
            View Details
          </Button>
          {status === 'upcoming' && daysUntilRegistration > 0 && (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => onApply(hackathon)}
              className="flex-fill"
            >
              Apply Now
            </Button>
          )}
        </div>
      </Card.Footer>
    </Card>
  );
};

export default HackathonCard;