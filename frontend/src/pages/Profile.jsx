/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, ProgressBar, Modal, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { profileAPI } from '../services/api';
import { 
  FaUser, FaCode, FaGraduationCap, FaLinkedin, FaGithub, FaExternalLinkAlt, 
  FaEdit, FaMapMarkerAlt, FaBriefcase, FaTrophy, FaCalendarAlt, FaDownload,
  FaProjectDiagram, FaBuilding, FaEnvelope, FaPhone, FaStar, FaRocket,
  FaLightbulb, FaAtom, FaCog, FaShieldAlt
} from 'react-icons/fa';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResumeModal, setShowResumeModal] = useState(false);
  const isOwnProfile = !userId || userId === user?.id;

  // Custom CSS styles for the cyberpunk theme
  const customStyles = `
    <style>
      /* Global Cyberpunk Theme Styles */
      .cyberpunk-bg {
        background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000511 100%);
        min-height: 100vh;
        position: relative;
        overflow-x: hidden;
      }
      
      .cyberpunk-bg::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: 
          radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.2) 0%, transparent 50%);
        pointer-events: none;
        z-index: -1;
      }
      
      .davinci-card {
        background: rgba(20, 20, 35, 0.9);
        border: 1px solid rgba(120, 119, 198, 0.3);
        border-radius: 15px;
        backdrop-filter: blur(10px);
        box-shadow: 
          0 8px 32px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .davinci-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(120, 119, 198, 0.1), transparent);
        transition: left 0.5s;
      }
      
      .davinci-card:hover::before {
        left: 100%;
      }
      
      .davinci-card:hover {
        transform: translateY(-5px);
        border-color: rgba(120, 219, 255, 0.6);
        box-shadow: 
          0 20px 40px rgba(0, 0, 0, 0.4),
          0 0 20px rgba(120, 219, 255, 0.3);
      }
      
      .profile-avatar {
        width: 120px;
        height: 120px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: 3px solid rgba(120, 219, 255, 0.6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        box-shadow: 
          0 0 30px rgba(120, 219, 255, 0.4),
          inset 0 0 20px rgba(255, 255, 255, 0.1);
      }
      
      .profile-avatar::after {
        content: '';
        position: absolute;
        top: -3px;
        left: -3px;
        right: -3px;
        bottom: -3px;
        border-radius: 50%;
        border: 2px solid transparent;
        background: linear-gradient(45deg, #ff006e, #8338ec, #3a86ff) border-box;
        mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
        mask-composite: exclude;
        animation: rotate 3s linear infinite;
      }
      
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      
      .neon-text {
        color: #78dbff;
        text-shadow: 
          0 0 5px currentColor,
          0 0 10px currentColor,
          0 0 15px currentColor;
      }
      
      .cyber-badge {
        background: linear-gradient(45deg, #ff006e, #8338ec);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
        box-shadow: 0 4px 15px rgba(255, 0, 110, 0.3);
        transition: all 0.3s ease;
      }
      
      .cyber-badge:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(255, 0, 110, 0.5);
      }
      
      .cyber-btn {
        background: linear-gradient(45deg, #667eea, #764ba2);
        border: 1px solid rgba(120, 219, 255, 0.5);
        color: white;
        border-radius: 25px;
        padding: 10px 20px;
        font-weight: 500;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .cyber-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s;
      }
      
      .cyber-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(102, 126, 234, 0.4);
        border-color: rgba(120, 219, 255, 0.8);
      }
      
      .cyber-btn:hover::before {
        left: 100%;
      }
      
      .section-header {
        background: linear-gradient(45deg, #1e3c72, #2a5298);
        color: white;
        border-radius: 10px 10px 0 0;
        padding: 15px 20px;
        border-bottom: 2px solid rgba(120, 219, 255, 0.3);
        position: relative;
      }
      
      .section-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, #ff006e, #8338ec, #3a86ff);
      }
      
      .progress-cyber {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
        position: relative;
      }
      
      .progress-cyber .progress-bar {
        background: linear-gradient(45deg, #ff006e, #8338ec, #3a86ff);
        border-radius: 10px;
        position: relative;
        overflow: hidden;
      }
      
      .progress-cyber .progress-bar::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        animation: shine 2s infinite;
      }
      
      @keyframes shine {
        0% { left: -100%; }
        100% { left: 100%; }
      }
      
      .stats-card {
        text-align: center;
        padding: 20px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        border: 1px solid rgba(120, 219, 255, 0.2);
        transition: all 0.3s ease;
      }
      
      .stats-card:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(120, 219, 255, 0.5);
        transform: translateY(-5px);
      }
      
      .text-cyber-primary { color: #78dbff !important; }
      .text-cyber-secondary { color: #ff006e !important; }
      .text-cyber-accent { color: #8338ec !important; }
      .text-muted-cyber { color: rgba(255, 255, 255, 0.7) !important; }
      
      .experience-timeline {
        position: relative;
        padding-left: 30px;
      }
      
      .experience-timeline::before {
        content: '';
        position: absolute;
        left: 15px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: linear-gradient(to bottom, #ff006e, #8338ec, #3a86ff);
      }
      
      .timeline-item {
        position: relative;
        margin-bottom: 30px;
      }
      
      .timeline-item::before {
        content: '';
        position: absolute;
        left: -22px;
        top: 5px;
        width: 12px;
        height: 12px;
        background: #78dbff;
        border-radius: 50%;
        box-shadow: 0 0 10px currentColor;
      }
      
      .floating-particles {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
      }
      
      .particle {
        position: absolute;
        width: 2px;
        height: 2px;
        background: #78dbff;
        border-radius: 50%;
        animation: float 6s infinite linear;
      }
      
      @keyframes float {
        0% {
          opacity: 0;
          transform: translateY(100vh) scale(0);
        }
        10% {
          opacity: 1;
        }
        90% {
          opacity: 1;
        }
        100% {
          opacity: 0;
          transform: translateY(-100px) scale(1);
        }
      }
    </style>
  `;

  useEffect(() => {
    fetchProfile();
    // Inject custom styles
    const styleElement = document.createElement('div');
    styleElement.innerHTML = customStyles;
    document.head.appendChild(styleElement);
    
    // Create floating particles
    createFloatingParticles();
    
    return () => {
      // Cleanup
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [userId]);

  const createFloatingParticles = () => {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'floating-particles';
    document.body.appendChild(particlesContainer);

    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 6 + 's';
      particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
      particlesContainer.appendChild(particle);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = isOwnProfile 
        ? await profileAPI.getMyProfile()
        : await profileAPI.getPublicProfile(userId);
      setProfile(response.data);
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigate('/profile-setup');
  };

  const handleDownloadResume = () => {
    if (profile?.resumeUrl) {
      window.open(profile.resumeUrl, '_blank');
    }
  };

  const getCompletionColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="cyberpunk-bg">
        <Container className="py-5 text-center">
          <div className="davinci-card p-5">
            <Spinner animation="border" className="text-cyber-primary mb-3" />
            <p className="text-muted-cyber">Initializing Neural Interface...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cyberpunk-bg">
        <Container className="py-5">
          <Alert variant="danger" className="davinci-card border-danger">
            <FaShieldAlt className="me-2" />
            {error}
          </Alert>
        </Container>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="cyberpunk-bg">
        <Container className="py-5 text-center">
          <div className="davinci-card p-5">
            <FaAtom size={60} className="text-cyber-primary mb-4" />
            <h4 className="neon-text mb-3">Neural Profile Not Found</h4>
            <p className="text-muted-cyber mb-4">
              {isOwnProfile 
                ? "Your digital consciousness awaits initialization." 
                : "This user's neural profile is not yet synchronized."
              }
            </p>
            {isOwnProfile && (
              <button 
                className="cyber-btn"
                onClick={() => navigate('/profile/setup')}
              >
                <FaRocket className="me-2" />
                Initialize Profile
              </button>
            )}
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="cyberpunk-bg">
      <Container className="py-4">
        <Row>
          {/* Profile Header */}
          <Col lg={12}>
            <div className="davinci-card mb-4">
              <div className="p-4">
                <Row className="align-items-center">
                  <Col md={8}>
                    <div className="d-flex align-items-center mb-4">
                      <div className="profile-avatar me-4">
                        <FaUser size={40} className="text-white" />
                      </div>
                      <div>
                        <h2 className="neon-text mb-2">{user?.name || 'Digital Entity'}</h2>
                        <p className="text-muted-cyber mb-2">
                          <FaAtom className="me-2" />
                          {user?.email}
                        </p>
                        {profile.location?.city && (
                          <p className="text-cyber-primary mb-0">
                            <FaMapMarkerAlt className="me-2" />
                            {profile.location.city}{profile.location.country && `, ${profile.location.country}`}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {profile.bio && (
                      <div className="p-3 rounded" style={{background: 'rgba(120, 219, 255, 0.1)', border: '1px solid rgba(120, 219, 255, 0.3)'}}>
                        <FaLightbulb className="text-cyber-primary me-2" />
                        <span className="text-muted-cyber">{profile.bio}</span>
                      </div>
                    )}
                  </Col>
                  
                  <Col md={4} className="text-md-end">
                    {isOwnProfile && (
                      <>
                        <button className="cyber-btn me-2 mb-3" onClick={handleEditProfile}>
                          <FaEdit className="me-2" />
                          Modify Neural Data
                        </button>
                        {profile.resumeUrl && (
                          <button className="cyber-btn mb-3" onClick={handleDownloadResume}>
                            <FaDownload className="me-2" />
                            Download Archive
                          </button>
                        )}
                        
                        {/* Profile Completion */}
                        <div className="mt-3">
                          <small className="text-cyber-primary d-block mb-2">
                            <FaCog className="me-1" />
                            Neural Synchronization
                          </small>
                          <div className="progress-cyber">
                            <div 
                              className="progress-bar" 
                              style={{ width: `${profile.completionScore || 0}%` }}
                            ></div>
                          </div>
                          <small className="text-muted-cyber mt-1 d-block">
                            {profile.completionScore || 0}% Synchronized
                          </small>
                        </div>
                      </>
                    )}
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          {/* Left Column */}
          <Col lg={8}>
            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="davinci-card mb-4">
                <div className="section-header">
                  <FaCode className="me-2" />
                  Neural Capabilities & Technologies
                </div>
                <div className="p-4">
                  <div className="d-flex flex-wrap gap-3">
                    {profile.skills.map((skill, index) => (
                      <span key={index} className="cyber-badge">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <div className="davinci-card mb-4">
                <div className="section-header">
                  <FaBriefcase className="me-2" />
                  Professional Neural Networks
                </div>
                <div className="p-4">
                  <div className="experience-timeline">
                    {profile.experience.map((exp, index) => (
                      <div key={index} className="timeline-item">
                        <div className="p-3 rounded" style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(120, 219, 255, 0.2)'}}>
                          <h6 className="text-cyber-primary mb-2">{exp.title}</h6>
                          <p className="text-cyber-secondary mb-2">
                            <FaBuilding className="me-2" />
                            {exp.company}
                          </p>
                          {exp.duration && (
                            <p className="text-muted-cyber small mb-2">
                              <FaCalendarAlt className="me-2" />
                              {exp.duration}
                            </p>
                          )}
                          {exp.description && (
                            <p className="text-muted-cyber small mb-0">{exp.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Projects */}
            {profile.projects && profile.projects.length > 0 && (
              <div className="davinci-card mb-4">
                <div className="section-header">
                  <FaProjectDiagram className="me-2" />
                  Digital Creations & Innovations
                </div>
                <div className="p-4">
                  {profile.projects.map((project, index) => (
                    <div key={index} className={`p-3 rounded mb-3 ${index !== profile.projects.length - 1 ? 'border-bottom' : ''}`} 
                         style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(120, 219, 255, 0.2)'}}>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <h6 className="neon-text mb-0">{project.name}</h6>
                        <div>
                          {project.githubUrl && (
                            <a 
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cyber-btn me-2"
                              style={{fontSize: '0.8rem', padding: '5px 10px'}}
                            >
                              <FaGithub className="me-1" />
                              Neural Code
                            </a>
                          )}
                          {project.liveUrl && (
                            <a 
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cyber-btn"
                              style={{fontSize: '0.8rem', padding: '5px 10px'}}
                            >
                              <FaExternalLinkAlt className="me-1" />
                              Live Demo
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {project.description && (
                        <p className="text-muted-cyber small mb-3">{project.description}</p>
                      )}
                      
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="d-flex flex-wrap gap-2">
                          {project.technologies.map((tech, techIndex) => (
                            <span key={techIndex} className="badge" 
                                  style={{background: 'rgba(120, 219, 255, 0.2)', color: '#78dbff', border: '1px solid rgba(120, 219, 255, 0.3)'}}>
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Col>

          {/* Right Column */}
          <Col lg={4}>
            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <div className="davinci-card mb-4">
                <div className="section-header">
                  <FaGraduationCap className="me-2" />
                  Knowledge Acquisition
                </div>
                <div className="p-4">
                  {profile.education.map((edu, index) => (
                    <div key={index} className={`p-3 rounded mb-3 ${index !== profile.education.length - 1 ? 'border-bottom' : ''}`}
                         style={{background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(120, 219, 255, 0.2)'}}>
                      <h6 className="text-cyber-primary mb-2">{edu.degree}</h6>
                      <p className="text-muted-cyber mb-2">{edu.institution}</p>
                      {edu.year && (
                        <p className="text-muted-cyber small mb-0">
                          <FaCalendarAlt className="me-2" />
                          {edu.year}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
              <div className="davinci-card mb-4">
                <div className="section-header">
                  <FaExternalLinkAlt className="me-2" />
                  Neural Network Connections
                </div>
                <div className="p-4">
                  <div className="d-grid gap-3">
                    {profile.socialLinks.linkedin && (
                      <a 
                        href={profile.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cyber-btn text-center text-decoration-none"
                      >
                        <FaLinkedin className="me-2" />
                        Professional Network
                      </a>
                    )}
                    {profile.socialLinks.github && (
                      <a 
                        href={profile.socialLinks.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cyber-btn text-center text-decoration-none"
                      >
                        <FaGithub className="me-2" />
                        Code Repository
                      </a>
                    )}
                    {profile.socialLinks.portfolio && (
                      <a 
                        href={profile.socialLinks.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cyber-btn text-center text-decoration-none"
                      >
                        <FaExternalLinkAlt className="me-2" />
                        Digital Showcase
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Stats */}
            <div className="davinci-card mb-4">
              <div className="section-header">
                <FaTrophy className="me-2" />
                Neural Analytics
              </div>
              <div className="p-4">
                <Row className="text-center">
                  <Col-4>
                    <div className="stats-card">
                      <h4 className="text-cyber-primary mb-2">{profile.skills?.length || 0}</h4>
                      <small className="text-muted-cyber">Capabilities</small>
                    </div>
                  </Col-4>
                  <Col-4>
                    <div className="stats-card">
                      <h4 className="text-cyber-secondary mb-2">{profile.projects?.length || 0}</h4>
                      <small className="text-muted-cyber">Creations</small>
                    </div>
                  </Col-4>
                  <Col-4>
                    <div className="stats-card">
                      <h4 className="text-cyber-accent mb-2">{profile.experience?.length || 0}</h4>
                      <small className="text-muted-cyber">Networks</small>
                    </div>
                  </Col-4>
                </Row>
              </div>
            </div>

            {/* Contact Card for Public Profiles */}
            {!isOwnProfile && (
              <div className="davinci-card mb-4">
                <div className="section-header">
                  <FaEnvelope className="me-2" />
                  Neural Communication
                </div>
                <div className="p-4 text-center">
                  <button className="cyber-btn w-100">
                    <FaEnvelope className="me-2" />
                    Initiate Contact Protocol
                  </button>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Profile;