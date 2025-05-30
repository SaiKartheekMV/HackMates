import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { FaGithub, FaTwitter, FaLinkedin, FaHeart, FaRocket, FaBrain, FaUsers, FaCode, FaShieldAlt, FaTerminal } from 'react-icons/fa';

const Footer = () => {
  return (
    <>
      {/* Cyberpunk CSS Styles */}
      <style jsx>{`
        .cyberpunk-footer {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 50%, #000511 100%);
          border-top: 2px solid #00ffff;
          position: relative;
          overflow: hidden;
        }
        
        .cyberpunk-footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, #00ffff, #ff00ff, #00ffff, transparent);
          animation: pulse-border 3s ease-in-out infinite;
        }
        
        @keyframes pulse-border {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .neon-text {
          color: #00ffff;
          text-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff;
          font-family: 'Orbitron', monospace;
          font-weight: 700;
        }
        
        .neon-text-secondary {
          color: #ff00ff;
          text-shadow: 0 0 5px #ff00ff, 0 0 10px #ff00ff;
          font-family: 'Orbitron', monospace;
        }
        
        .cyber-link {
          color: #ffffff;
          text-decoration: none;
          transition: all 0.3s ease;
          font-family: 'Share Tech Mono', monospace;
          position: relative;
          padding: 2px 0;
        }
        
        .cyber-link::before {
          content: '> ';
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .cyber-link:hover {
          color: #00ffff;
          text-shadow: 0 0 5px #00ffff;
          text-decoration: none;
        }
        
        .cyber-link:hover::before {
          opacity: 1;
        }
        
        .social-icon {
          color: #ffffff;
          transition: all 0.3s ease;
          padding: 8px;
          border: 1px solid transparent;
          border-radius: 4px;
        }
        
        .social-icon:hover {
          color: #00ffff;
          border-color: #00ffff;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
          text-decoration: none;
        }
        
        .tech-badge {
          background: linear-gradient(45deg, #1a0033, #000511);
          border: 1px solid #00ffff;
          color: #00ffff;
          padding: 4px 8px;
          margin: 2px;
          font-size: 0.8rem;
          border-radius: 0;
          font-family: 'Share Tech Mono', monospace;
          display: inline-block;
        }
        
        .glitch-effect {
          position: relative;
        }
        
        .glitch-effect::before {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          color: #ff00ff;
          opacity: 0.8;
          animation: glitch 2s infinite;
          clip: rect(0, 900px, 0, 0);
        }
        
        @keyframes glitch {
          0% { clip: rect(64px, 9999px, 66px, 0); }
          5% { clip: rect(30px, 9999px, 36px, 0); }
          10% { clip: rect(96px, 9999px, 98px, 0); }
          15% { clip: rect(20px, 9999px, 22px, 0); }
          20% { clip: rect(85px, 9999px, 87px, 0); }
          25% { clip: rect(10px, 9999px, 12px, 0); }
          30% { clip: rect(40px, 9999px, 42px, 0); }
          35% { clip: rect(70px, 9999px, 72px, 0); }
          40% { clip: rect(25px, 9999px, 27px, 0); }
          45% { clip: rect(60px, 9999px, 62px, 0); }
          50% { clip: rect(15px, 9999px, 17px, 0); }
          55% { clip: rect(90px, 9999px, 92px, 0); }
          60% { clip: rect(5px, 9999px, 7px, 0); }
          65% { clip: rect(75px, 9999px, 77px, 0); }
          70% { clip: rect(35px, 9999px, 37px, 0); }
          75% { clip: rect(50px, 9999px, 52px, 0); }
          80% { clip: rect(80px, 9999px, 82px, 0); }
          85% { clip: rect(45px, 9999px, 47px, 0); }
          90% { clip: rect(55px, 9999px, 57px, 0); }
          95% { clip: rect(65px, 9999px, 67px, 0); }
          100% { clip: rect(95px, 9999px, 97px, 0); }
        }
        
        .neural-network {
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3Ccircle cx='50' cy='10' r='1'/%3E%3Ccircle cx='10' cy='50' r='1'/%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3Cline x1='30' y1='30' x2='10' y2='10' stroke='%2300ffff' stroke-width='0.5' stroke-opacity='0.3'/%3E%3Cline x1='30' y1='30' x2='50' y2='10' stroke='%2300ffff' stroke-width='0.5' stroke-opacity='0.3'/%3E%3Cline x1='30' y1='30' x2='10' y2='50' stroke='%2300ffff' stroke-width='0.5' stroke-opacity='0.3'/%3E%3Cline x1='30' y1='30' x2='50' y2='50' stroke='%2300ffff' stroke-width='0.5' stroke-opacity='0.3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.1;
          pointer-events: none;
        }
        
        .cyber-button {
          background: transparent;
          border: 2px solid #00ffff;
          color: #00ffff;
          font-family: 'Share Tech Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 1px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
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
          background: rgba(0, 255, 255, 0.1);
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
          color: #ffffff;
          border-color: #ffffff;
        }
        
        .cyber-button:hover::before {
          left: 100%;
        }
        
        .terminal-text {
          font-family: 'Share Tech Mono', monospace;
          color: #00ff00;
          font-size: 0.9rem;
          background: rgba(0, 0, 0, 0.8);
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #00ff00;
        }
      `}</style>

      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet" />

      <footer className="cyberpunk-footer text-light py-5 mt-auto position-relative">
        <div className="neural-network"></div>
        <Container className="position-relative">
          <Row className="mb-4">
            <Col lg={4} md={6} className="mb-4">
              <h3 className="neon-text glitch-effect mb-3" data-text="HackMates">
                <FaBrain className="me-2" />
                HackMates
              </h3>
              <p className="mb-3" style={{color: '#cccccc', fontFamily: 'Share Tech Mono, monospace'}}>
                <FaTerminal className="me-2 text-info" />
                Neural-powered ecosystem connecting elite developers across the digital frontier. 
                Where algorithms meet ambition.
              </p>
              <div className="mb-3">
                <span className="tech-badge">AI-Powered</span>
                <span className="tech-badge">Neural Matching</span>
                <span className="tech-badge">Quantum Teams</span>
              </div>
              <div className="terminal-text">
                <span className="text-success">[SYSTEM]</span> Initializing connection protocols...
              </div>
            </Col>

            <Col lg={2} md={6} className="mb-4">
              <h6 className="neon-text-secondary mb-3">
                <FaRocket className="me-2" />
                Navigate
              </h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="/hackathons" className="cyber-link">Hack_Events.exe</a></li>
                <li className="mb-2"><a href="/find-partners" className="cyber-link">Neural_Match.ai</a></li>
                <li className="mb-2"><a href="/teams" className="cyber-link">Squad_Builder</a></li>
                <li className="mb-2"><a href="/leaderboard" className="cyber-link">Rank_System</a></li>
                <li className="mb-2"><a href="/dashboard" className="cyber-link">Control_Panel</a></li>
              </ul>
            </Col>

            <Col lg={2} md={6} className="mb-4">
              <h6 className="neon-text-secondary mb-3">
                <FaCode className="me-2" />
                Resources
              </h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="/docs" className="cyber-link">API_Docs</a></li>
                <li className="mb-2"><a href="/tutorials" className="cyber-link">Code_Academy</a></li>
                <li className="mb-2"><a href="/community" className="cyber-link">Dev_Network</a></li>
                <li className="mb-2"><a href="/blog" className="cyber-link">Tech_Feed</a></li>
                <li className="mb-2"><a href="/support" className="cyber-link">Help_Protocol</a></li>
              </ul>
            </Col>

            <Col lg={2} md={6} className="mb-4">
              <h6 className="neon-text-secondary mb-3">
                <FaShieldAlt className="me-2" />
                Legal_Matrix
              </h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="/privacy" className="cyber-link">Privacy_Shield</a></li>
                <li className="mb-2"><a href="/terms" className="cyber-link">User_Agreement</a></li>
                <li className="mb-2"><a href="/security" className="cyber-link">Cyber_Security</a></li>
                <li className="mb-2"><a href="/cookies" className="cyber-link">Data_Cookies</a></li>
              </ul>
            </Col>

            <Col lg={2} md={12} className="mb-4">
              <h6 className="neon-text-secondary mb-3">
                <FaUsers className="me-2" />
                Neural_Links
              </h6>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <a href="#" className="social-icon" title="GitHub Repository">
                  <FaGithub size={24} />
                </a>
                <a href="#" className="social-icon" title="Twitter Updates">
                  <FaTwitter size={24} />
                </a>
                <a href="#" className="social-icon" title="LinkedIn Network">
                  <FaLinkedin size={24} />
                </a>
              </div>
              <Button className="cyber-button btn-sm w-100 mb-2">
                Join_Beta
              </Button>
              <div className="terminal-text text-center" style={{fontSize: '0.75rem'}}>
                <span className="text-warning">[ONLINE]</span><br/>
                2,847 Hackers
              </div>
            </Col>
          </Row>

          {/* Divider with animated line */}
          <div className="position-relative my-4">
            <hr style={{
              border: 'none',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #00ffff, #ff00ff, #00ffff, transparent)',
              opacity: 0.6
            }} />
          </div>

          {/* Bottom section */}
          <Row className="align-items-center">
            <Col md={8}>
              <p className="mb-0" style={{
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: '0.9rem',
                color: '#888888'
              }}>
                <span className="text-info">[©2024]</span> HackMates Neural Network. 
                Crafted with <FaHeart className="text-danger mx-1" style={{filter: 'drop-shadow(0 0 5px #ff0040)'}} /> 
                for the <span className="neon-text-secondary">Cyberpunk Developer Matrix</span>
              </p>
            </Col>
            <Col md={4} className="text-md-end">
              <div className="terminal-text d-inline-block">
                <span className="text-success">v2.1.7</span> | 
                <span className="text-warning"> STABLE</span> | 
                <span className="text-info"> 99.9% Uptime</span>
              </div>
            </Col>
          </Row>

          {/* Hidden Easter Egg */}
          <div className="position-absolute" style={{
            bottom: '5px',
            right: '10px',
            fontSize: '0.7rem',
            color: '#333',
            fontFamily: 'Share Tech Mono, monospace'
          }}>
            // DaVinci_Protocol_Active
          </div>
        </Container>
      </footer>
    </>
  );
};

export default Footer;