import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCode, FaUser, FaSignOutAlt, FaBrain, FaTerminal, FaUsers, FaRocket, FaShieldAlt, FaCog } from 'react-icons/fa';

const AppNavbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for the terminal effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      {/* Cyberpunk CSS Styles */}
      <style jsx>{`
        .cyberpunk-navbar {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000511 100%) !important;
          border-bottom: 2px solid #00ffff;
          backdrop-filter: blur(10px);
          position: relative;
          z-index: 1000;
        }
        
        .cyberpunk-navbar::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #00ffff, #ff00ff, #00ffff, transparent);
          animation: scan-line 3s ease-in-out infinite;
        }
        
        @keyframes scan-line {
          0%, 100% { opacity: 0.3; transform: translateX(-100%); }
          50% { opacity: 1; transform: translateX(100%); }
        }
        
        .brand-logo {
          color: #00ffff !important;
          text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff;
          font-family: 'Orbitron', monospace;
          font-weight: 900;
          font-size: 1.5rem;
          text-decoration: none !important;
          transition: all 0.3s ease;
          position: relative;
        }
        
        .brand-logo:hover {
          color: #ffffff !important;
          text-shadow: 0 0 15px #00ffff, 0 0 30px #00ffff, 0 0 45px #00ffff;
          transform: scale(1.05);
        }
        
        .brand-logo::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(0, 255, 255, 0.1) 50%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .brand-logo:hover::after {
          opacity: 1;
          animation: hologram-sweep 0.6s ease-out;
        }
        
        @keyframes hologram-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .cyber-nav-link {
          color: #ffffff !important;
          font-family: 'Share Tech Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.9rem;
          position: relative;
          transition: all 0.3s ease;
          padding: 8px 16px !important;
          margin: 0 4px;
          border: 1px solid transparent;
        }
        
        .cyber-nav-link::before {
          content: '> ';
          opacity: 0;
          transition: opacity 0.3s ease;
          color: #00ffff;
        }
        
        .cyber-nav-link:hover,
        .cyber-nav-link.active {
          color: #00ffff !important;
          border-color: #00ffff;
          background: rgba(0, 255, 255, 0.1);
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
          text-decoration: none !important;
        }
        
        .cyber-nav-link:hover::before,
        .cyber-nav-link.active::before {
          opacity: 1;
        }
        
        .cyber-button {
          background: transparent !important;
          border: 2px solid #00ffff !important;
          color: #00ffff !important;
          font-family: 'Share Tech Mono', monospace !important;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 0.85rem;
          padding: 6px 16px !important;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          text-decoration: none !important;
        }
        
        .cyber-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .cyber-button:hover {
          background: rgba(0, 255, 255, 0.1) !important;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
          color: #ffffff !important;
          border-color: #ffffff !important;
          transform: translateY(-2px);
        }
        
        .cyber-button:hover::before {
          left: 100%;
        }
        
        .cyber-button-primary {
          border-color: #ff00ff !important;
          color: #ff00ff !important;
        }
        
        .cyber-button-primary:hover {
          background: rgba(255, 0, 255, 0.1) !important;
          box-shadow: 0 0 20px rgba(255, 0, 255, 0.4);
          border-color: #ffffff !important;
          color: #ffffff !important;
        }
        
        .profile-dropdown .dropdown-toggle {
          background: rgba(0, 255, 255, 0.1) !important;
          border: 1px solid #00ffff !important;
          color: #00ffff !important;
          font-family: 'Share Tech Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 0.85rem;
        }
        
        .profile-dropdown .dropdown-toggle:hover {
          background: rgba(0, 255, 255, 0.2) !important;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        }
        
        .profile-dropdown .dropdown-menu {
          background: linear-gradient(135deg, #1a0033 0%, #000511 100%) !important;
          border: 1px solid #00ffff !important;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
          border-radius: 0 !important;
        }
        
        .profile-dropdown .dropdown-item {
          color: #ffffff !important;
          font-family: 'Share Tech Mono', monospace;
          transition: all 0.3s ease;
          padding: 8px 16px;
        }
        
        .profile-dropdown .dropdown-item:hover {
          background: rgba(0, 255, 255, 0.1) !important;
          color: #00ffff !important;
        }
        
        .profile-dropdown .dropdown-divider {
          border-color: #00ffff !important;
          opacity: 0.3;
        }
        
        .status-indicator {
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid #00ff00;
          border-radius: 0;
          padding: 4px 8px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.75rem;
          color: #00ff00;
          margin-left: 10px;
        }
        
        .navbar-toggler {
          border: 1px solid #00ffff !important;
          padding: 4px 8px;
        }
        
        .navbar-toggler:focus {
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }
        
        .navbar-toggler-icon {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%2800, 255, 255, 1%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='m4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
        }
        
        .terminal-time {
          color: #00ff00;
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.8rem;
        }
        
        .glitch-text {
          position: relative;
          animation: glitch-skew 1s infinite linear alternate-reverse;
        }
        
        @keyframes glitch-skew {
          0% { transform: skew(0deg); }
          20% { transform: skew(0.5deg); }
          40% { transform: skew(-0.5deg); }
          60% { transform: skew(0deg); }
          80% { transform: skew(0.2deg); }
          100% { transform: skew(0deg); }
        }
      `}</style>

      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet" />

      <Navbar className="cyberpunk-navbar" variant="dark" expand="lg" sticky="top">
        <Container>
          <Navbar.Brand as={Link} to="/" className="brand-logo">
            <FaBrain className="me-2 glitch-text" />
            HackMates
            <span style={{fontSize: '0.6rem', color: '#ff00ff', marginLeft: '8px'}}>v2.1</span>
          </Navbar.Brand>
          
          <div className="d-flex align-items-center d-lg-none">
            <div className="status-indicator me-2">
              <span className="terminal-time">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </span>
            </div>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
          </div>
          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link 
                as={Link} 
                to="/" 
                className={`cyber-nav-link ${location.pathname === '/' ? 'active' : ''}`}
              >
                <FaTerminal className="me-2" size={12} />
                Home.exe
              </Nav.Link>
              <Nav.Link 
                as={Link} 
                to="/hackathons" 
                className={`cyber-nav-link ${location.pathname === '/hackathons' ? 'active' : ''}`}
              >
                <FaRocket className="me-2" size={12} />
                Events.db
              </Nav.Link>
              {isAuthenticated && (
                <>
                  <Nav.Link 
                    as={Link} 
                    to="/find-partners" 
                    className={`cyber-nav-link ${location.pathname === '/find-partners' ? 'active' : ''}`}
                  >
                    <FaUsers className="me-2" size={12} />
                    Neural_Match
                  </Nav.Link>
                  <Nav.Link 
                    as={Link} 
                    to="/team-dashboard" 
                    className={`cyber-nav-link ${location.pathname === '/team-dashboard' ? 'active' : ''}`}
                  >
                    <FaShieldAlt className="me-2" size={12} />
                    Squad_Hub
                  </Nav.Link>
                </>
              )}
            </Nav>
            
            <Nav className="align-items-center">
              {/* Status indicator for desktop */}
              <div className="status-indicator d-none d-lg-block me-3">
                <span className="terminal-time">
                  [{currentTime.toLocaleTimeString('en-US', { hour12: false })}] ONLINE
                </span>
              </div>

              {isAuthenticated ? (
                <NavDropdown 
                  className="profile-dropdown"
                  title={
                    <span>
                      <FaUser className="me-2" />
                      {user?.name || 'User'}
                      <span style={{color: '#00ff00', marginLeft: '8px', fontSize: '0.7rem'}}>●</span>
                    </span>
                  } 
                  id="profile-dropdown"
                  align="end"
                >
                  <NavDropdown.Item as={Link} to="/profile-setup">
                    <FaCog className="me-2" />
                    Config_Profile
                  </NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/settings">
                    <FaTerminal className="me-2" />
                    System_Settings
                  </NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" />
                    Disconnect
                  </NavDropdown.Item>
                </NavDropdown>
              ) : (
                <div className="d-flex gap-2">
                  <Button 
                    as={Link} 
                    to="/login" 
                    className="cyber-button"
                  >
                    <FaTerminal className="me-2" size={12} />
                    Access
                  </Button>
                  <Button 
                    as={Link} 
                    to="/register" 
                    className="cyber-button cyber-button-primary"
                  >
                    <FaBrain className="me-2" size={12} />
                    Initialize
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
};

export default AppNavbar;