import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, NavDropdown, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaCode, FaUser, FaSignOutAlt, FaBrain, FaTerminal, FaUsers, FaRocket, FaShieldAlt, FaCog, FaBars, FaTimes } from 'react-icons/fa';

const AppNavbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setShowMobileMenu(false);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <>
      {/* Enhanced Cyberpunk CSS Styles */}
      <style jsx>{`
        .cyberpunk-navbar {
          background: ${isScrolled 
            ? 'linear-gradient(135deg, rgba(10, 10, 10, 0.95) 0%, rgba(26, 0, 51, 0.95) 50%, rgba(0, 5, 17, 0.95) 100%) !important'
            : 'linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000511 100%) !important'
          };
          border-bottom: 2px solid #00ffff;
          backdrop-filter: blur(15px);
          position: fixed !important;
          width: 100%;
          top: 0;
          z-index: 2000;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          box-shadow: ${isScrolled ? '0 8px 32px rgba(0, 255, 255, 0.15)' : 'none'};
        }
        
        .cyberpunk-navbar::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00ffff, #ff00ff, #00ffff, transparent);
          animation: scan-line 4s ease-in-out infinite;
        }
        
        .cyberpunk-navbar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ffff' fill-opacity='0.03'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          pointer-events: none;
        }
        
        @keyframes scan-line {
          0%, 100% { 
            opacity: 0.3; 
            transform: translateX(-100%) scaleX(0.3); 
          }
          50% { 
            opacity: 1; 
            transform: translateX(100%) scaleX(1); 
          }
        }
        
        .brand-logo {
          color: #00ffff !important;
          text-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px rgba(0, 255, 255, 0.5);
          font-family: 'Orbitron', monospace;
          font-weight: 900;
          font-size: clamp(1.2rem, 2.5vw, 1.8rem);
          text-decoration: none !important;
          transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          position: relative;
          display: flex;
          align-items: center;
          letter-spacing: 1px;
        }
        
        .brand-logo:hover {
          color: #ffffff !important;
          text-shadow: 0 0 20px #00ffff, 0 0 40px #00ffff, 0 0 60px #00ffff;
          transform: scale(1.05) rotateZ(1deg);
        }
        
        .brand-logo::after {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, transparent 30%, rgba(0, 255, 255, 0.1) 50%, transparent 70%);
          opacity: 0;
          transition: opacity 0.4s ease;
          z-index: -1;
        }
        
        .brand-logo:hover::after {
          opacity: 1;
          animation: hologram-sweep 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        @keyframes hologram-sweep {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(100%) skewX(-15deg); }
        }
        
        .version-tag {
          font-size: 0.6rem;
          color: #ff00ff;
          margin-left: 8px;
          opacity: 0.8;
          transition: opacity 0.3s ease;
        }
        
        .brand-logo:hover .version-tag {
          opacity: 1;
          animation: pulse-glow 1s ease-in-out infinite alternate;
        }
        
        @keyframes pulse-glow {
          from { text-shadow: 0 0 5px #ff00ff; }
          to { text-shadow: 0 0 15px #ff00ff, 0 0 25px #ff00ff; }
        }
        
        .cyber-nav-link {
          color: #ffffff !important;
          font-family: 'Share Tech Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: clamp(0.8rem, 1.5vw, 0.9rem);
          position: relative;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          padding: 10px 16px !important;
          margin: 0 6px;
          border: 1px solid transparent;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .cyber-nav-link::before {
          content: '> ';
          position: absolute;
          left: 8px;
          opacity: 0;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          color: #00ffff;
          transform: translateX(-10px);
        }
        
        .cyber-nav-link::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent);
          transition: left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .cyber-nav-link:hover,
        .cyber-nav-link.active {
          color: #00ffff !important;
          border-color: #00ffff;
          background: rgba(0, 255, 255, 0.1);
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.4), inset 0 0 15px rgba(0, 255, 255, 0.1);
          text-decoration: none !important;
          transform: translateY(-2px);
          padding-left: 24px !important;
        }
        
        .cyber-nav-link:hover::before,
        .cyber-nav-link.active::before {
          opacity: 1;
          transform: translateX(0);
        }
        
        .cyber-nav-link:hover::after {
          left: 100%;
        }
        
        .cyber-nav-link svg {
          transition: transform 0.3s ease;
        }
        
        .cyber-nav-link:hover svg {
          transform: scale(1.2) rotate(5deg);
        }
        
        .cyber-button {
          background: transparent !important;
          border: 2px solid #00ffff !important;
          color: #00ffff !important;
          font-family: 'Share Tech Mono', monospace !important;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: clamp(0.75rem, 1.2vw, 0.85rem);
          padding: 8px 16px !important;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          position: relative;
          overflow: hidden;
          text-decoration: none !important;
          border-radius: 0;
          white-space: nowrap;
        }
        
        .cyber-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
          transition: left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          z-index: -1;
        }
        
        .cyber-button:hover {
          background: rgba(0, 255, 255, 0.15) !important;
          box-shadow: 0 0 25px rgba(0, 255, 255, 0.5), inset 0 0 25px rgba(0, 255, 255, 0.1);
          color: #ffffff !important;
          border-color: #ffffff !important;
          transform: translateY(-3px) scale(1.02);
        }
        
        .cyber-button:hover::before {
          left: 100%;
        }
        
        .cyber-button-primary {
          border-color: #ff00ff !important;
          color: #ff00ff !important;
        }
        
        .cyber-button-primary::before {
          background: linear-gradient(90deg, transparent, rgba(255, 0, 255, 0.3), transparent);
        }
        
        .cyber-button-primary:hover {
          background: rgba(255, 0, 255, 0.15) !important;
          box-shadow: 0 0 25px rgba(255, 0, 255, 0.5), inset 0 0 25px rgba(255, 0, 255, 0.1);
          border-color: #ffffff !important;
          color: #ffffff !important;
        }
        
        .profile-dropdown .dropdown-toggle {
          background: rgba(0, 255, 255, 0.1) !important;
          border: 2px solid #00ffff !important;
          color: #00ffff !important;
          font-family: 'Share Tech Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: clamp(0.75rem, 1.2vw, 0.85rem);
          padding: 8px 16px !important;
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          border-radius: 0;
        }
        
        .profile-dropdown .dropdown-toggle:hover,
        .profile-dropdown .dropdown-toggle:focus {
          background: rgba(0, 255, 255, 0.2) !important;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
          transform: translateY(-2px);
        }
        
        .profile-dropdown .dropdown-menu {
          background: linear-gradient(135deg, rgba(26, 0, 51, 0.95) 0%, rgba(0, 5, 17, 0.95) 100%) !important;
          border: 2px solid #00ffff !important;
          box-shadow: 0 0 40px rgba(0, 255, 255, 0.4);
          border-radius: 0 !important;
          backdrop-filter: blur(10px);
          margin-top: 8px;
          animation: dropdown-slide 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        @keyframes dropdown-slide {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .profile-dropdown .dropdown-item {
          color: #ffffff !important;
          font-family: 'Share Tech Mono', monospace;
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          padding: 10px 18px;
          position: relative;
          overflow: hidden;
        }
        
        .profile-dropdown .dropdown-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: #00ffff;
          transform: translateX(-4px);
          transition: transform 0.3s ease;
        }
        
        .profile-dropdown .dropdown-item:hover {
          background: rgba(0, 255, 255, 0.15) !important;
          color: #00ffff !important;
          transform: translateX(8px);
        }
        
        .profile-dropdown .dropdown-item:hover::before {
          transform: translateX(0);
        }
        
        .profile-dropdown .dropdown-divider {
          border-color: rgba(0, 255, 255, 0.3) !important;
          margin: 8px 0;
        }
        
        .status-indicator {
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid #00ff00;
          border-radius: 0;
          padding: 6px 12px;
          font-family: 'Share Tech Mono', monospace;
          font-size: clamp(0.7rem, 1vw, 0.75rem);
          color: #00ff00;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .status-indicator::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 1px;
          background: #00ff00;
          animation: status-scan 3s ease-in-out infinite;
        }
        
        @keyframes status-scan {
          0%, 100% { left: -100%; }
          50% { left: 100%; }
        }
        
        .online-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          background: #00ff00;
          border-radius: 50%;
          margin-left: 8px;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 5px #00ff00; }
          50% { opacity: 0.5; box-shadow: 0 0 15px #00ff00; }
        }
        
        .custom-toggler {
          border: 2px solid #00ffff !important;
          padding: 8px 10px;
          background: transparent;
          transition: all 0.3s ease;
          border-radius: 0;
        }
        
        .custom-toggler:focus {
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
          outline: none;
        }
        
        .custom-toggler:hover {
          background: rgba(0, 255, 255, 0.1);
        }
        
        .mobile-menu-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          z-index: 1999;
          opacity: ${showMobileMenu ? '1' : '0'};
          visibility: ${showMobileMenu ? 'visible' : 'hidden'};
          transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        .mobile-menu {
          position: fixed;
          top: 0;
          right: 0;
          width: min(85vw, 400px);
          height: 100vh;
          background: linear-gradient(135deg, #1a0033 0%, #000511 100%);
          border-left: 2px solid #00ffff;
          padding: 80px 0 20px;
          transform: translateX(${showMobileMenu ? '0' : '100%'});
          transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          z-index: 2001;
          overflow-y: auto;
        }
        
        .mobile-nav-item {
          display: block;
          color: #ffffff;
          font-family: 'Share Tech Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 1rem;
          padding: 16px 24px;
          text-decoration: none;
          transition: all 0.3s ease;
          border-left: 4px solid transparent;
          position: relative;
        }
        
        .mobile-nav-item:hover,
        .mobile-nav-item.active {
          color: #00ffff;
          border-left-color: #00ffff;
          background: rgba(0, 255, 255, 0.1);
          text-decoration: none;
        }
        
        .mobile-nav-item::before {
          content: '> ';
          opacity: 0;
          transition: opacity 0.3s ease;
          color: #00ffff;
        }
        
        .mobile-nav-item:hover::before,
        .mobile-nav-item.active::before {
          opacity: 1;
        }
        
        .mobile-buttons {
          padding: 24px;
          border-top: 1px solid rgba(0, 255, 255, 0.3);
          margin-top: auto;
        }
        
        .mobile-button {
          display: block;
          width: 100%;
          margin-bottom: 12px;
          padding: 12px 16px;
          text-align: center;
        }
        
        .close-mobile-menu {
          position: absolute;
          top: 20px;
          right: 20px;
          background: transparent;
          border: 2px solid #ff00ff;
          color: #ff00ff;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .close-mobile-menu:hover {
          background: rgba(255, 0, 255, 0.1);
          color: #ffffff;
          transform: rotate(90deg);
        }
        
        .glitch-text {
          position: relative;
          animation: glitch-skew 2s infinite linear alternate-reverse;
        }
        
        @keyframes glitch-skew {
          0% { transform: skew(0deg); }
          10% { transform: skew(0.5deg); }
          20% { transform: skew(-0.5deg); }
          30% { transform: skew(0deg); }
          40% { transform: skew(0.2deg); }
          50% { transform: skew(0deg); }
          60% { transform: skew(-0.2deg); }
          70% { transform: skew(0deg); }
          80% { transform: skew(0.3deg); }
          90% { transform: skew(0deg); }
          100% { transform: skew(0deg); }
        }
        
        /* Responsive adjustments */
        @media (max-width: 991.98px) {
          .cyberpunk-navbar {
            padding: 8px 0;
          }
          
          .navbar-nav {
            display: none;
          }
          
          .d-lg-none {
            display: flex !important;
          }
        }
        
        @media (max-width: 575.98px) {
          .brand-logo {
            font-size: 1.2rem;
          }
          
          .status-indicator {
            padding: 4px 8px;
            font-size: 0.65rem;
          }
          
          .cyber-button {
            padding: 6px 12px !important;
            font-size: 0.75rem;
          }
        }
        
        /* Add body padding to account for fixed navbar */
        body {
          padding-top: 80px;
        }
        
        @media (max-width: 991.98px) {
          body {
            padding-top: 70px;
          }
        }
      `}</style>

      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet" />

      {/* Mobile Menu Overlay */}
      <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)} />
      
      {/* Mobile Menu */}
      <div className="mobile-menu">
        <button className="close-mobile-menu" onClick={() => setShowMobileMenu(false)}>
          <FaTimes />
        </button>
        
        <nav>
          <Link 
            to="/" 
            className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => setShowMobileMenu(false)}
          >
            <FaTerminal className="me-2" />
            Home.exe
          </Link>
          <Link 
            to="/hackathons" 
            className={`mobile-nav-item ${location.pathname === '/hackathons' ? 'active' : ''}`}
            onClick={() => setShowMobileMenu(false)}
          >
            <FaRocket className="me-2" />
            Events.db
          </Link>
          {isAuthenticated && (
            <>
              <Link 
                to="/find-partners" 
                className={`mobile-nav-item ${location.pathname === '/find-partners' ? 'active' : ''}`}
                onClick={() => setShowMobileMenu(false)}
              >
                <FaUsers className="me-2" />
                Neural_Match
              </Link>
              <Link 
                to="/team-dashboard" 
                className={`mobile-nav-item ${location.pathname === '/team-dashboard' ? 'active' : ''}`}
                onClick={() => setShowMobileMenu(false)}
              >
                <FaShieldAlt className="me-2" />
                Squad_Hub
              </Link>
              <Link 
                to="/profile-setup" 
                className="mobile-nav-item"
                onClick={() => setShowMobileMenu(false)}
              >
                <FaCog className="me-2" />
                Config_Profile
              </Link>
            </>
          )}
        </nav>
        
        <div className="mobile-buttons">
          {isAuthenticated ? (
            <Button 
              className="cyber-button mobile-button" 
              onClick={handleLogout}
            >
              <FaSignOutAlt className="me-2" />
              Disconnect
            </Button>
          ) : (
            <>
              <Link 
                to="/login" 
                className="cyber-button mobile-button text-decoration-none d-flex align-items-center justify-content-center"
                onClick={() => setShowMobileMenu(false)}
              >
                <FaTerminal className="me-2" />
                Access
              </Link>
              <Link 
                to="/register" 
                className="cyber-button cyber-button-primary mobile-button text-decoration-none d-flex align-items-center justify-content-center"
                onClick={() => setShowMobileMenu(false)}
              >
                <FaBrain className="me-2" />
                Initialize
              </Link>
            </>
          )}
        </div>
      </div>

      <Navbar className="cyberpunk-navbar" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/" className="brand-logo">
            <FaBrain className="me-2 glitch-text" />
            HackMates
            <span className="version-tag">v2.1</span>
          </Navbar.Brand>
          
          <div className="d-flex align-items-center d-lg-none">
            <div className="status-indicator me-3">
              <span>{currentTime.toLocaleTimeString('en-US', { hour12: false })}</span>
              <span className="online-dot"></span>
            </div>
            <button 
              className="custom-toggler"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation"
            >
              <FaBars color="#00ffff" size={16} />
            </button>
          </div>
          
          <Navbar.Collapse id="basic-navbar-nav" className="d-none d-lg-flex">
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
              <div className="status-indicator me-3">
                <span>[{currentTime.toLocaleTimeString('en-US', { hour12: false })}] ONLINE</span>
                <span className="online-dot"></span>
              </div>

              {isAuthenticated ? (
                <NavDropdown 
                  className="profile-dropdown"
                  title={
                    <span>
                      <FaUser className="me-2" />
                      {user?.name || 'User'}
                      <span className="online-dot ms-2"></span>
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