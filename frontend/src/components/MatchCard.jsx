import React, { useState } from 'react';

const MatchCard = ({ 
  match = {
    id: 1,
    name: "Alex Johnson",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    title: "Full Stack Developer",
    location: "San Francisco, CA",
    experience: "3 years",
    matchPercentage: 92,
    skills: ["React", "Node.js", "Python", "MongoDB", "AWS"],
    bio: "Passionate developer with experience in building scalable web applications. Love working on innovative projects and learning new technologies.",
    hackathonsWon: 5,
    projectsCompleted: 12,
    linkedinUrl: "https://linkedin.com/in/alexjohnson",
    githubUrl: "https://github.com/alexjohnson",
    isOnline: true,
    lastActive: "2 hours ago"
  },
  onSendRequest,
  onViewProfile 
}) => {
  const [requestSent, setRequestSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendRequest = async () => {
    setIsLoading(true);
    try {
      if (onSendRequest) {
        await onSendRequest(match.id);
      }
      setRequestSent(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      console.error('Error sending request:', error);
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(match.id);
    }
  };

  const getMatchColor = (percentage) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 60) return 'warning';
    return 'secondary';
  };

  return (
    <div className="card h-100 shadow-sm border-0 match-card" style={{ transition: 'all 0.3s ease' }}>
      <div className="card-body p-4">
        {/* Header with Avatar and Basic Info */}
        <div className="d-flex align-items-start mb-3">
          <div className="position-relative">
            <img 
              src={match.avatar} 
              alt={match.name}
              className="rounded-circle me-3"
              style={{ width: '60px', height: '60px', objectFit: 'cover' }}
            />
            {match.isOnline && (
              <span 
                className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white"
                style={{ width: '16px', height: '16px', marginRight: '12px' }}
                title="Online"
              ></span>
            )}
          </div>
          <div className="flex-grow-1">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h5 className="card-title mb-1 fw-bold">{match.name}</h5>
                <p className="text-muted mb-1">{match.title}</p>
                <small className="text-muted d-flex align-items-center">
                  <i className="bi bi-geo-alt-fill me-1"></i>
                  {match.location}
                </small>
              </div>
              <div className="text-end">
                <span className={`badge bg-${getMatchColor(match.matchPercentage)} fs-6 px-3 py-2`}>
                  {match.matchPercentage}% Match
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="card-text text-muted mb-3" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
          {match.bio}
        </p>

        {/* Skills */}
        <div className="mb-3">
          <small className="text-muted fw-semibold">SKILLS</small>
          <div className="mt-2">
            {match.skills.slice(0, 4).map((skill, index) => (
              <span key={index} className="badge bg-light text-dark me-1 mb-1 px-2 py-1">
                {skill}
              </span>
            ))}
            {match.skills.length > 4 && (
              <span className="badge bg-secondary me-1 mb-1 px-2 py-1">
                +{match.skills.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="row text-center mb-3 py-2 bg-light rounded">
          <div className="col-4">
            <div className="fw-bold text-primary">{match.hackathonsWon}</div>
            <small className="text-muted">Hackathons Won</small>
          </div>
          <div className="col-4 border-start border-end">
            <div className="fw-bold text-success">{match.projectsCompleted}</div>
            <small className="text-muted">Projects</small>
          </div>
          <div className="col-4">
            <div className="fw-bold text-info">{match.experience}</div>
            <small className="text-muted">Experience</small>
          </div>
        </div>

        {/* Social Links */}
        <div className="d-flex justify-content-center mb-3">
          {match.linkedinUrl && (
            <a 
              href={match.linkedinUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm me-2"
              title="LinkedIn Profile"
            >
              <i className="bi bi-linkedin"></i>
            </a>
          )}
          {match.githubUrl && (
            <a 
              href={match.githubUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline-dark btn-sm"
              title="GitHub Profile"
            >
              <i className="bi bi-github"></i>
            </a>
          )}
        </div>

        {/* Last Active */}
        <div className="text-center mb-3">
          <small className="text-muted">
            {match.isOnline ? (
              <span className="text-success">
                <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }}></i>
                Online now
              </span>
            ) : (
              `Last active ${match.lastActive}`
            )}
          </small>
        </div>

        {/* Action Buttons */}
        <div className="d-grid gap-2">
          {!requestSent ? (
            <button 
              className="btn btn-primary btn-lg fw-semibold"
              onClick={handleSendRequest}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Sending Request...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus-fill me-2"></i>
                  Send Hack Request
                </>
              )}
            </button>
          ) : (
            <button className="btn btn-success btn-lg fw-semibold" disabled>
              <i className="bi bi-check-circle-fill me-2"></i>
              Request Sent!
            </button>
          )}
          
          <button 
            className="btn btn-outline-secondary"
            onClick={handleViewProfile}
          >
            View Full Profile
          </button>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        .match-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
        }
        
        .match-card .btn {
          transition: all 0.2s ease;
        }
        
        .match-card .badge {
          font-weight: 500;
        }
        
        .match-card .bg-light {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </div>
  );
};

export default MatchCard;