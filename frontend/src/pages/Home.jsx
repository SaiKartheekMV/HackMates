import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaRocket, FaUsers, FaBrain, FaTrophy, FaTerminal, FaCode, FaShieldAlt, FaEye, FaNetworkWired, FaCog } from 'react-icons/fa';
import Footer from '../components/Footer';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [typedText, setTypedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const fullText = 'NEURAL NETWORK INITIALIZED...';

  // Typing animation effect
  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, fullText]);

  const features = [
    {
      icon: <FaBrain size={50} className="neon-icon-cyan mb-3" />,
      title: "Neural Matchmaking",
      description: "Advanced quantum algorithms analyze your digital DNA to forge perfect team synergies across the developer matrix.",
      techStack: "AI・Neural Networks・Deep Learning"
    },
    {
      icon: <FaNetworkWired size={50} className="neon-icon-magenta mb-3" />,
      title: "Hive Mind Assembly",
      description: "Connect diverse skill nodes - frontend architects, backend wizards, and UX visionaries in perfect harmony.",
      techStack: "Distributed Systems・APIs・Cloud"
    },
    {
      icon: <FaRocket size={50} className="neon-icon-green mb-3" />,
      title: "Event Radar System",
      description: "Scan the digital horizon for premium hackathon opportunities across multiple dimensions and tech domains.",
      techStack: "Web Scraping・Real-time Data・ML"
    },
    {
      icon: <FaTrophy size={50} className="neon-icon-yellow mb-3" />,
      title: "Victory Protocol",
      description: "Strategic team compositions powered by predictive analytics to maximize your probability of conquest.",
      techStack: "Analytics・Statistics・Optimization"
    }
  ];

  const stats = [
    { value: "15.7K+", label: "Code Warriors", color: "#00ffff" },
    { value: "847+", label: "Hack Events", color: "#ff00ff" },
    { value: "3.2K+", label: "Elite Squads", color: "#00ff00" }
  ];

  return (
    <>
      {/* Cyberpunk CSS Styles */}
      <style jsx>{`
        .cyberpunk-hero {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 30%, #000511 70%, #0a0a0a 100%);
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }
        
        .cyberpunk-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300ffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3Ccircle cx='50' cy='10' r='1'/%3E%3Ccircle cx='10' cy='50' r='1'/%3E%3Ccircle cx='50' cy='50' r='1'/%3E%3Cline x1='30' y1='30' x2='10' y2='10' stroke='%2300ffff' stroke-width='0.5' stroke-opacity='0.2'/%3E%3Cline x1='30' y1='30' x2='50' y2='10' stroke='%2300ffff' stroke-width='0.5' stroke-opacity='0.2'/%3E%3Cline x1='30' y1='30' x2='10' y2='50' stroke='%2300ffff' stroke-width='0.5' stroke-opacity='0.2'/%3E%3Cline x1='30' y1='30' x2='50' y2='50' stroke='%2300ffff' stroke-width='0.5' stroke-opacity='0.2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
          pointer-events: none;
        }
        
        .hero-title {
          font-family: 'Orbitron', monospace;
          font-size: 4rem;
          font-weight: 900;
          color: #ffffff;
          text-shadow: 0 0 20px #00ffff, 0 0 40px #00ffff;
          line-height: 1.1;
          margin-bottom: 2rem;
        }
        
        .hero-highlight {
          color: #ff00ff;
          text-shadow: 0 0 20px #ff00ff, 0 0 40px #ff00ff;
          position: relative;
        }
        
        .hero-subtitle {
          font-family: 'Share Tech Mono', monospace;
          font-size: 1.3rem;
          color: #cccccc;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        
        .cyber-button-hero {
          background: transparent;
          border: 2px solid #00ffff;
          color: #00ffff;
          font-family: 'Share Tech Mono', monospace;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 1rem;
          padding: 12px 30px;
          margin: 8px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          text-decoration: none;
        }
        
        .cyber-button-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent);
          transition: left 0.5s ease;
        }
        
        .cyber-button-hero:hover {
          background: rgba(0, 255, 255, 0.1);
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.4);
          color: #ffffff;
          border-color: #ffffff;
          transform: translateY(-3px);
          text-decoration: none;
        }
        
        .cyber-button-hero:hover::before {
          left: 100%;
        }
        
        .cyber-button-secondary {
          border-color: #ff00ff;
          color: #ff00ff;
        }
        
        .cyber-button-secondary:hover {
          background: rgba(255, 0, 255, 0.1);
          box-shadow: 0 0 30px rgba(255, 0, 255, 0.4);
          border-color: #ffffff;
        }
        
        .stats-panel {
          background: rgba(0, 0, 0, 0.8);
          border: 2px solid #00ffff;
          border-radius: 0;
          backdrop-filter: blur(10px);
          position: relative;
          padding: 2rem;
        }
        
        .stats-panel::before {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          background: linear-gradient(45deg, #00ffff, #ff00ff, #00ffff);
          z-index: -1;
          border-radius: 0;
        }
        
        .stat-number {
          font-family: 'Orbitron', monospace;
          font-size: 2.5rem;
          font-weight: 900;
          text-shadow: 0 0 10px currentColor;
        }
        
        .stat-label {
          font-family: 'Share Tech Mono', monospace;
          color: #cccccc;
          text-transform: uppercase;
          font-size: 0.9rem;
          letter-spacing: 1px;
        }
        
        .terminal-output {
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid #00ff00;
          border-radius: 0;
          padding: 15px;
          font-family: 'Share Tech Mono', monospace;
          color: #00ff00;
          font-size: 0.9rem;
          margin-bottom: 2rem;
        }
        
        .neon-icon-cyan {
          color: #00ffff;
          filter: drop-shadow(0 0 10px #00ffff);
        }
        
        .neon-icon-magenta {
          color: #ff00ff;
          filter: drop-shadow(0 0 10px #ff00ff);
        }
        
        .neon-icon-green {
          color: #00ff00;
          filter: drop-shadow(0 0 10px #00ff00);
        }
        
        .neon-icon-yellow {
          color: #ffff00;
          filter: drop-shadow(0 0 10px #ffff00);
        }
        
        .cyber-card {
          background: linear-gradient(135deg, rgba(26, 0, 51, 0.9) 0%, rgba(0, 5, 17, 0.9) 100%);
          border: 1px solid #00ffff;
          border-radius: 0;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .cyber-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00ffff, transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .cyber-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0, 255, 255, 0.2);
          border-color: #ffffff;
        }
        
        .cyber-card:hover::before {
          opacity: 1;
        }
        
        .cyber-card .card-title {
          color: #00ffff;
          font-family: 'Orbitron', monospace;
          font-weight: 700;
          text-shadow: 0 0 5px #00ffff;
        }
        
        .cyber-card .card-text {
          color: #cccccc;
          font-family: 'Share Tech Mono', monospace;
          line-height: 1.6;
        }
        
        .tech-stack {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.75rem;
          color: #ff00ff;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 0, 255, 0.3);
        }
        
        .section-dark {
          background: linear-gradient(135deg, #000511 0%, #1a0033 100%);
          color: #ffffff;
        }
        
        .section-title {
          font-family: 'Orbitron', monospace;
          font-weight: 900;
          color: #00ffff;
          text-shadow: 0 0 15px #00ffff;
          margin-bottom: 1rem;
        }
        
        .section-subtitle {
          font-family: 'Share Tech Mono', monospace;
          color: #cccccc;
          margin-bottom: 3rem;
        }
        
        .step-circle {
          width: 80px;
          height: 80px;
          background: linear-gradient(45deg, #00ffff, #ff00ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Orbitron', monospace;
          font-size: 2rem;
          font-weight: 900;
          color: #000000;
          margin: 0 auto 1.5rem;
          position: relative;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.4);
        }
        
        .step-circle::before {
          content: '';
          position: absolute;
          top: -5px;
          left: -5px;
          right: -5px;
          bottom: -5px;
          background: linear-gradient(45deg, #00ffff, #ff00ff, #00ffff);
          border-radius: 50%;
          z-index: -1;
          animation: rotate 3s linear infinite;
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .step-title {
          font-family: 'Orbitron', monospace;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 1rem;
        }
        
        .step-description {
          font-family: 'Share Tech Mono', monospace;
          color: #cccccc;
          line-height: 1.6;
        }
        
        .cta-section {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a0033 100%);
          position: relative;
          overflow: hidden;
        }
        
        .cta-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10L90 90L10 90Z' fill='none' stroke='%2300ffff' stroke-width='0.5' stroke-opacity='0.1'/%3E%3C/svg%3E") repeat;
          animation: float 20s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }
          
          .hero-subtitle {
            font-size: 1.1rem;
          }
          
          .cyber-button-hero {
            font-size: 0.9rem;
            padding: 10px 20px;
          }
        }
      `}</style>

      {/* Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap" rel="stylesheet" />

      {/* Hero Section */}
      <section className="cyberpunk-hero">
        <Container className="position-relative">
          <Row className="align-items-center min-vh-100">
            <Col lg={6}>
              <div className="terminal-output">
                <span className="text-success">[SYSTEM]</span> {typedText}
                <span className="text-warning">|</span>
              </div>
              
              <h1 className="hero-title">
                Find Your Perfect <span className="hero-highlight">Cyber</span> Squad
              </h1>
              
              <p className="hero-subtitle">
                <FaTerminal className="me-2" />
                Connect with elite developers, visionary designers, and digital architects. 
                Build unstoppable teams with quantum-powered matchmaking across the hackathon multiverse.
              </p>
              
              {!isAuthenticated ? (
                <div className="d-flex flex-wrap">
                  <Button as={Link} to="/register" className="cyber-button-hero">
                    <FaBrain className="me-2" />
                    Initialize Protocol
                  </Button>
                  <Button as={Link} to="/hackathons" className="cyber-button-hero cyber-button-secondary">
                    <FaEye className="me-2" />
                    Scan Events Matrix
                  </Button>
                </div>
              ) : (
                <div className="d-flex flex-wrap">
                  <Button as={Link} to="/find-partners" className="cyber-button-hero">
                    <FaUsers className="me-2" />
                    Find Squad Members
                  </Button>
                  <Button as={Link} to="/hackathons" className="cyber-button-hero cyber-button-secondary">
                    <FaRocket className="me-2" />
                    Browse Missions
                  </Button>
                </div>
              )}
            </Col>
            
            <Col lg={6} className="text-center">
              <div className="stats-panel">
                <h4 className="mb-4" style={{color: '#00ffff', fontFamily: 'Orbitron, monospace'}}>
                  <FaNetworkWired className="me-2" />
                  Network Status
                </h4>
                <Row className="text-center">
                  {stats.map((stat, index) => (
                    <Col key={index}>
                      <div className="stat-number" style={{color: stat.color}}>
                        {stat.value}
                      </div>
                      <div className="stat-label">{stat.label}</div>
                    </Col>
                  ))}
                </Row>
                <div className="mt-4 pt-3" style={{borderTop: '1px solid #00ffff'}}>
                  <small style={{color: '#00ff00', fontFamily: 'Share Tech Mono, monospace'}}>
                    [STATUS] All systems operational • Latency: 12ms
                  </small>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5 section-dark">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">
                <FaCog className="me-3" />
                System Capabilities
              </h2>
              <p className="section-subtitle">
                Advanced neural architecture designed for optimal team synthesis and hackathon domination
              </p>
            </Col>
          </Row>
          <Row>
            {features.map((feature, index) => (
              <Col md={6} lg={3} key={index} className="mb-4">
                <Card className="cyber-card h-100 text-center">
                  <Card.Body className="p-4">
                    {feature.icon}
                    <Card.Title className="h5">{feature.title}</Card.Title>
                    <Card.Text>
                      {feature.description}
                    </Card.Text>
                    <div className="tech-stack">
                      {feature.techStack}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="py-5" style={{background: 'linear-gradient(135deg, #1a0033 0%, #000511 100%)'}}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">
                <FaShieldAlt className="me-3" />
                Activation Protocol
              </h2>
              <p className="section-subtitle">Initialize your journey in 3 quantum steps</p>
            </Col>
          </Row>
          <Row>
            <Col md={4} className="text-center mb-4">
              <div className="step-circle">01</div>
              <h5 className="step-title">Profile Genesis</h5>
              <p className="step-description">
                Upload your digital credentials and let our quantum processors decode your skills matrix automatically.
              </p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="step-circle">02</div>
              <h5 className="step-title">Neural Sync</h5>
              <p className="step-description">
                Our AI consciousness analyzes your profile and identifies optimal teammates across the developer network.
              </p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="step-circle">03</div>
              <h5 className="step-title">Squad Deploy</h5>
              <p className="step-description">
                Forge your elite team, engage hackathon missions together, and construct legendary digital artifacts!
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section text-white py-5 position-relative">
        <Container className="position-relative">
          <Row className="text-center">
            <Col>
              <h2 className="section-title mb-4">
                Ready to Join the Elite Network?
              </h2>
              <p className="section-subtitle mb-4">
                Connect with 15,000+ cyber warriors who have assembled their ultimate hackathon squads
              </p>
              {!isAuthenticated && (
                <Button as={Link} to="/register" className="cyber-button-hero" size="lg">
                  <FaCode className="me-2" />
                  Begin Neural Link Today
                </Button>
              )}
              
              <div className="mt-4">
                <small style={{color: '#666', fontFamily: 'Share Tech Mono, monospace'}}>
                  // Join the revolution. Code the future. Dominate hackathons.
                </small>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </>
  );
};

export default Home;