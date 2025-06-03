import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaRocket, FaUsers, FaBrain, FaTrophy, FaTerminal, FaCode, FaShieldAlt, FaEye, FaNetworkWired, FaCog, FaMobile, FaRobot, FaGamepad, FaShoppingCart, FaHeartbeat, FaGraduationCap, FaLeaf, FaMoneyBillWave, FaAtom, FaVrCardboard, FaDna, FaChartLine } from 'react-icons/fa';

const Home = () => {
  const [typedText, setTypedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeHex, setActiveHex] = useState(0);
  const fullText = 'NEURAL NETWORK INITIALIZED... DAVINCI PROTOCOL ACTIVE...';

  // Enhanced typing animation
  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 80);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, fullText]);

  // Hexagon rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveHex(prev => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const hackathonDivisions = [
    {
      icon: <FaMobile size={40} className="neon-icon-cyan" />,
      title: "Mobile Innovation",
      description: "iOS, Android, React Native, Flutter - Mobile apps that reshape daily life",
      color: "#00ffff",
      category: "Development"
    },
    {
      icon: <FaRobot size={40} className="neon-icon-magenta" />,
      title: "AI & Machine Learning",
      description: "Neural networks, computer vision, NLP - Intelligence that thinks beyond human limits",
      color: "#ff00ff",
      category: "Intelligence"
    },
    {
      icon: <FaGamepad size={40} className="neon-icon-green" />,
      title: "Game Development",
      description: "Unity, Unreal, VR/AR gaming - Immersive worlds and interactive experiences",
      color: "#00ff00",
      category: "Experience"
    },
    {
      icon: <FaShoppingCart size={40} className="neon-icon-yellow" />,
      title: "E-Commerce & FinTech",
      description: "Blockchain, payment systems, trading platforms - The future of digital economy",
      color: "#ffff00",
      category: "Commerce"
    },
    {
      icon: <FaHeartbeat size={40} className="neon-icon-red" />,
      title: "HealthTech & BioTech",
      description: "Medical devices, diagnostics, genomics - Technology for human wellness",
      color: "#ff0080",
      category: "Health"
    },
    {
      icon: <FaGraduationCap size={40} className="neon-icon-blue" />,
      title: "EdTech & Learning",
      description: "Adaptive learning, VR education, skill platforms - Knowledge amplification systems",
      color: "#0080ff",
      category: "Education"
    },
    {
      icon: <FaLeaf size={40} className="neon-icon-lime" />,
      title: "CleanTech & Sustainability",
      description: "Renewable energy, carbon tracking, waste reduction - Planetary preservation protocols",
      color: "#80ff00",
      category: "Environment"
    },
    {
      icon: <FaNetworkWired size={40} className="neon-icon-orange" />,
      title: "IoT & Hardware",
      description: "Smart devices, sensors, embedded systems - The connected physical world",
      color: "#ff8000",
      category: "Hardware"
    },
    {
      icon: <FaVrCardboard size={40} className="neon-icon-purple" />,
      title: "AR/VR & Metaverse",
      description: "Virtual worlds, augmented reality, spatial computing - Reality redefined",
      color: "#8000ff",
      category: "Reality"
    },
    {
      icon: <FaDna size={40} className="neon-icon-pink" />,
      title: "Quantum & Research",
      description: "Quantum computing, advanced algorithms, scientific computing - The frontier of possibility",
      color: "#ff0040",
      category: "Research"
    },
    {
      icon: <FaChartLine size={40} className="neon-icon-teal" />,
      title: "Data Science & Analytics",
      description: "Big data, visualization, predictive models - Insights from information chaos",
      color: "#00ff80",
      category: "Analytics"
    },
    {
      icon: <FaAtom size={40} className="neon-icon-gold" />,
      title: "Emerging Technologies",
      description: "Cutting-edge innovations, experimental tech - The unknown made manifest",
      color: "#ffd700",
      category: "Innovation"
    }
  ];

  const davinciFeatures = [
    {
      icon: <FaBrain size={50} className="neon-icon-cyan mb-3" />,
      title: "Neural Synthesis Engine",
      description: "Like Da Vinci's anatomical studies, our AI dissects skill patterns across 50+ domains to create perfect team compositions through systematic analysis.",
      framework: "Renaissance methodology meets quantum computing",
      process: "Observe → Analyze → Synthesize → Perfect"
    },
    {
      icon: <FaNetworkWired size={50} className="neon-icon-magenta mb-3" />,
      title: "Universal Knowledge Network",
      description: "Inspired by the Vitruvian Man's proportions, we map developer skills across all hackathon divisions in perfect mathematical harmony.",
      framework: "Sacred geometry applied to talent distribution",
      process: "Map → Connect → Balance → Optimize"
    },
    {
      icon: <FaRocket size={50} className="neon-icon-green mb-3" />,
      title: "Innovation Flight Mechanics",
      description: "Drawing from Da Vinci's flying machine designs, we launch teams toward hackathon victory through calculated trajectory analysis.",
      framework: "Aerodynamic principles for project momentum",
      process: "Design → Test → Iterate → Soar"
    },
    {
      icon: <FaTrophy size={50} className="neon-icon-yellow mb-3" />,
      title: "Masterpiece Creation Protocol",
      description: "Following Da Vinci's artistic process, we guide teams through systematic creation of award-winning solutions.",
      framework: "Renaissance craftsmanship meets modern innovation",
      process: "Conceive → Sketch → Build → Refine"
    }
  ];

  const thoughtProcess = [
    {
      phase: "Observation",
      description: "Analyze patterns across 12 hackathon divisions",
      icon: <FaEye size={30} />,
      detail: "Like Da Vinci's detailed anatomical drawings, we observe and document every aspect of successful hackathon teams."
    },
    {
      phase: "Hypothesis",
      description: "Form theories about optimal team compositions",
      icon: <FaBrain size={30} />,
      detail: "Generate mathematical models predicting team success based on skill complementarity and domain expertise."
    },
    {
      phase: "Experimentation",
      description: "Test matching algorithms across real hackathons",
      icon: <FaCog size={30} />,
      detail: "Continuous A/B testing and refinement of our neural matching system through live hackathon environments."
    },
    {
      phase: "Innovation",
      description: "Create breakthrough solutions that didn't exist before",
      icon: <FaRocket size={30} />,
      detail: "Transform insights into revolutionary tools that elevate the entire hackathon ecosystem."
    },
    {
      phase: "Iteration",
      description: "Constantly improve based on results and feedback",
      icon: <FaAtom size={30} />,
      detail: "Like Da Vinci's countless sketches and revisions, we never stop improving our understanding and systems."
    },
    {
      phase: "Mastery",
      description: "Achieve excellence across all domains",
      icon: <FaTrophy size={30} />,
      detail: "The culmination of systematic thinking - teams that consistently create award-winning innovations."
    }
  ];

  const stats = [
    { value: "47.3K+", label: "Renaissance Coders", color: "#00ffff", category: "Talent Pool" },
    { value: "2,847+", label: "Innovation Quests", color: "#ff00ff", category: "Active Hackathons" },
    { value: "12", label: "Tech Domains", color: "#00ff00", category: "Coverage Areas" },
    { value: "8.9K+", label: "Legendary Teams", color: "#ffff00", category: "Success Stories" }
  ];

  return (
    <>
      <style jsx>{`
        .leonardo-hero {
          background: radial-gradient(circle at 20% 80%, #1a0033 0%, rgba(26, 0, 51, 0) 50%), 
                      radial-gradient(circle at 80% 20%, #000511 0%, rgba(0, 5, 17, 0) 50%), 
                      radial-gradient(circle at 40% 40%, #0a0a0a 0%, transparent 50%),
                      linear-gradient(135deg, #0a0a0a 0%, #1a0033 30%, #000511 70%, #0a0a0a 100%);
          position: relative;
          overflow: hidden;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }
        
        .leonardo-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='davinci' patternUnits='userSpaceOnUse' width='100' height='100'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%2300ffff' stroke-width='0.3' opacity='0.1'/%3E%3Cpolygon points='50,10 90,85 10,85' fill='none' stroke='%23ff00ff' stroke-width='0.2' opacity='0.05'/%3E%3Crect x='30' y='30' width='40' height='40' fill='none' stroke='%2300ff00' stroke-width='0.2' opacity='0.03'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23davinci)'/%3E%3C/svg%3E") repeat;
          pointer-events: none;
          animation: geometric-float 30s ease-in-out infinite;
        }
        
        @keyframes geometric-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-10px) rotate(1deg); }
          50% { transform: translateY(-20px) rotate(0deg); }
          75% { transform: translateY(-10px) rotate(-1deg); }
        }
        
        .hero-title {
          font-family: 'Playfair Display', serif;
          font-size: 4.5rem;
          font-weight: 900;
          color: #ffffff;
          text-shadow: 0 0 30px #00ffff, 0 0 60px #00ffff;
          line-height: 1.1;
          margin-bottom: 2rem;
          background: linear-gradient(45deg, #ffffff, #00ffff, #ff00ff, #ffffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hero-highlight {
          color: #ff00ff;
          font-family: 'Playfair Display', serif;
          font-size: 4.5rem;
          font-weight: 900;
          color: #ff00ff;
          text-shadow: 0 0 30px #ff00ff, 0 0 60px #ff00ff;
          line-height: 1.1;
          margin-bottom: 2rem;
          background: linear-gradient(45deg, #ff00ff, #ff00ff, #ff00ff, #ff00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hero-subtitle {
          font-family: 'Crimson Text', serif;
          font-size: 1.4rem;
          color: #e0e0e0;
          margin-bottom: 2rem;
          line-height: 1.7;
          font-style: italic;
        }
        
        .davinci-button {
          background: linear-gradient(45deg, transparent, rgba(0, 255, 255, 0.1));
          border: 2px solid #00ffff;
          color: #00ffff;
          font-family: 'Crimson Text', serif;
          text-transform: capitalize;
          letter-spacing: 1px;
          font-size: 1.1rem;
          font-weight: 600;
          padding: 15px 35px;
          margin: 10px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
          text-decoration: none;
          border-radius: 0;
        }
        
        .davinci-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.3), transparent);
          transition: left 0.6s ease;
        }
        
        .davinci-button:hover {
          background: rgba(0, 255, 255, 0.15);
          box-shadow: 0 0 40px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.2);
          color: #ffffff;
          border-color: #ffffff;
          transform: translateY(-5px) scale(1.05);
          text-decoration: none;
        }
        
        .davinci-button:hover::before {
          left: 100%;
        }
        
        .davinci-button-secondary {
          border-color: #ff00ff;
          color: #ff00ff;
        }
        
        .davinci-button-secondary:hover {
          background: rgba(255, 0, 255, 0.15);
          box-shadow: 0 0 40px rgba(255, 0, 255, 0.5);
          border-color: #ffffff;
        }
        
        .vitruvian-stats {
          background: rgba(0, 0, 0, 0.9);
          border: 3px solid;
          border-image: linear-gradient(45deg, #00ffff, #ff00ff, #00ff00, #ffff00) 1;
          backdrop-filter: blur(15px);
          position: relative;
          padding: 3rem;
          margin: 2rem 0;
        }
        
        .vitruvian-stats::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #00ffff, #ff00ff, #00ff00, #ffff00);
          z-index: -1;
          animation: border-pulse 3s ease-in-out infinite;
        }
        
        @keyframes border-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        
        .stat-number {
          font-family: 'Playfair Display', serif;
          font-size: 3rem;
          font-weight: 900;
          text-shadow: 0 0 15px currentColor;
          margin-bottom: 0.5rem;
        }
        
        .stat-label {
          font-family: 'Crimson Text', serif;
          color: #cccccc;
          font-size: 1rem;
          letter-spacing: 0.5px;
        }
        
        .stat-category {
          font-family: 'Share Tech Mono', monospace;
          color: #666;
          font-size: 0.75rem;
          text-transform: uppercase;
          margin-top: 0.25rem;
        }
        
        .terminal-manuscript {
          background: rgba(0, 0, 0, 0.95);
          border: 2px solid #00ff00;
          border-radius: 5px;
          padding: 20px;
          font-family: 'Share Tech Mono', monospace;
          color: #00ff00;
          font-size: 1rem;
          margin-bottom: 2rem;
          position: relative;
        }
        
        .terminal-manuscript::before {
          content: '// Da Vinci Neural Protocol v4.7.3';
          position: absolute;
          top: -10px;
          left: 20px;
          background: #0a0a0a;
          color: #00ff00;
          padding: 0 10px;
          font-size: 0.8rem;
        }
        
        .division-hex {
          width: 120px;
          height: 104px;
          background: linear-gradient(135deg, rgba(26, 0, 51, 0.9) 0%, rgba(0, 5, 17, 0.9) 100%);
          position: relative;
          margin: 20px auto;
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .division-hex::before,
        .division-hex::after {
          content: '';
          position: absolute;
          width: 0;
          border-left: 60px solid transparent;
          border-right: 60px solid transparent;
        }
        
        .division-hex::before {
          bottom: 100%;
          border-bottom: 30px solid rgba(26, 0, 51, 0.9);
        }
        
        .division-hex::after {
          top: 100%;
          border-top: 30px solid rgba(26, 0, 51, 0.9);
        }
        
        .division-hex:hover {
          transform: scale(1.1) rotate(2deg);
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.4);
        }
        
        .hex-content {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: white;
          z-index: 2;
        }
        
        .renaissance-card {
          background: linear-gradient(135deg, rgba(26, 0, 51, 0.95) 0%, rgba(0, 5, 17, 0.95) 100%);
          border: 2px solid #00ffff;
          border-radius: 15px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        
        .renaissance-card::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #00ffff, #ff00ff, #00ffff);
          z-index: -1;
          border-radius: 15px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .renaissance-card:hover {
          transform: translateY(-15px) rotate(1deg);
          box-shadow: 0 25px 50px rgba(0, 255, 255, 0.3);
        }
        
        .renaissance-card:hover::before {
          opacity: 1;
        }
        
        .card-title {
          color: #00ffff;
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          text-shadow: 0 0 10px #00ffff;
          font-size: 1.5rem;
        }
        
        .card-text {
          color: #e0e0e0;
          font-family: 'Crimson Text', serif;
          line-height: 1.7;
          font-size: 1.1rem;
        }
        
        .framework-text {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.85rem;
          color: #ff00ff;
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 0, 255, 0.3);
          font-style: italic;
        }
        
        .process-steps {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.8rem;
          color: #00ff00;
          margin-top: 0.5rem;
          letter-spacing: 0.5px;
        }
        
        .thought-process-section {
          background: linear-gradient(135deg, #000511 0%, #1a0033 50%, #000511 100%);
          position: relative;
        }
        
        .thought-circle {
          width: 100px;
          height: 100px;
          background: conic-gradient(from 0deg, #00ffff, #ff00ff, #00ff00, #ffff00, #ff0080, #0080ff, #00ffff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          position: relative;
          animation: thought-rotate 8s linear infinite;
        }
        
        .thought-circle::before {
          content: '';
          position: absolute;
          top: 5px;
          left: 5px;
          right: 5px;
          bottom: 5px;
          background: #0a0a0a;
          border-radius: 50%;
        }
        
        .thought-circle .icon-content {
          position: relative;
          z-index: 2;
          color: #ffffff;
        }
        
        @keyframes thought-rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .phase-title {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 1rem;
          font-size: 1.3rem;
        }
        
        .phase-description {
          font-family: 'Crimson Text', serif;
          color: #cccccc;
          line-height: 1.7;
          font-size: 1rem;
          margin-bottom: 1rem;
        }
        
        .phase-detail {
          font-family: 'Share Tech Mono', monospace;
          color: #888;
          font-size: 0.85rem;
          line-height: 1.5;
          font-style: italic;
        }
        
        .section-title {
          font-family: 'Playfair Display', serif;
          font-weight: 900;
          color: #00ffff;
          text-shadow: 0 0 20px #00ffff;
          margin-bottom: 1rem;
          font-size: 3rem;
        }
        
        .section-subtitle {
          font-family: 'Crimson Text', serif;
          color: #e0e0e0;
          margin-bottom: 3rem;
          font-size: 1.2rem;
          line-height: 1.6;
          font-style: italic;
        }
        
        .division-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin: 3rem 0;
        }
        
        .division-card {
          background: linear-gradient(135deg, rgba(26, 0, 51, 0.9) 0%, rgba(0, 5, 17, 0.9) 100%);
          border: 2px solid;
          border-radius: 10px;
          padding: 2rem;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .division-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, currentColor, transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .division-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .division-card:hover::before {
          opacity: 1;
        }
        
        .division-title {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          margin: 1rem 0;
          font-size: 1.3rem;
        }
        
        .division-description {
          font-family: 'Crimson Text', serif;
          line-height: 1.6;
          color: #cccccc;
        }
        
        .division-category {
          font-family: 'Share Tech Mono', monospace;
          font-size: 0.8rem;
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          background: rgba(0, 0, 0, 0.3);
          display: inline-block;
        }
        
        .neon-icon-cyan { color: #00ffff; filter: drop-shadow(0 0 10px #00ffff); }
        .neon-icon-magenta { color: #ff00ff; filter: drop-shadow(0 0 10px #ff00ff); }
        .neon-icon-green { color: #00ff00; filter: drop-shadow(0 0 10px #00ff00); }
        .neon-icon-yellow { color: #ffff00; filter: drop-shadow(0 0 10px #ffff00); }
        .neon-icon-red { color: #ff0080; filter: drop-shadow(0 0 10px #ff0080); }
        .neon-icon-blue { color: #0080ff; filter: drop-shadow(0 0 10px #0080ff); }
        .neon-icon-lime { color: #80ff00; filter: drop-shadow(0 0 10px #80ff00); }
        .neon-icon-orange { color: #ff8000; filter: drop-shadow(0 0 10px #ff8000); }
        .neon-icon-purple { color: #8000ff; filter: drop-shadow(0 0 5px #8000ff); }
        .neon-icon-pink { color: #ff0040; filter: drop-shadow(0 0 10px #ff0040); }
        .neon-icon-teal { color: #00ff80; filter: drop-shadow(0 0 10px #00ff80); }
        .neon-icon-gold { color: #ffd700; filter: drop-shadow(0 0 10px #ffd700); }
        
        @media (max-width: 768px) {
          .hero-title { font-size: 2.8rem; }
          .hero-subtitle { font-size: 1.1rem; }
          .section-title { font-size: 2.2rem; }
          .davinci-button { font-size: 1rem; padding: 12px 25px; }
          .division-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Enhanced Google Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Share+Tech+Mono&display=swap" rel="stylesheet" />

      {/* Hero Section with Da Vinci Inspiration */}
      <section className="leonardo-hero">
        <Container className="position-relative">
          <Row className="align-items-center min-vh-100">
            <Col lg={7}>
              <div className="terminal-manuscript">
                <span className="text-success">[RENAISSANCE_PROTOCOL]</span> {typedText}
                <span className="text-warning">█</span>
                <br />
                <span className="text-info">[SYSTEM]</span> <span className="text-muted">Analyzing 12 innovation domains...</span>
                <br />
                <span className="text-warning">[STATUS]</span> <span className="text-success">All neural networks operational</span>
              </div>
              
              <h1 className="hero-title">
                Renaissance of <span className="text-warning hero-highlight">Digital</span> Innovation
              </h1>
              
              <p className="hero-subtitle">
                "Just as Leonardo bridged art and science, we unite diverse minds across all technological frontiers. 
                From mobile apps to quantum computing, from AI to sustainability - forge legendary teams that 
                create tomorrow's masterpieces."
              </p>
              
              <div className="d-flex flex-wrap">
                <Button as={Link} to="/register" className="davinci-button">
                  <FaBrain className="me-2" />
                  Begin Renaissance Journey
                </Button>
                <Button as={Link} to="/hackathons" className="davinci-button davinci-button-secondary">
                  <FaAtom className="me-2" />
                  Explore Innovation Realms
                </Button>
              </div>
            </Col>
            
            <Col lg={5}>
              <div className="vitruvian-stats">
                <h4 className="mb-4 text-center" style={{color: '#00ffff', fontFamily: 'Playfair Display, serif'}}>
                  <FaNetworkWired className="me-2" />
                  Universal Network Status
                </h4>
                <Row className="text-center">
                  {stats.map((stat, index) => (
                    <Col key={index} sm={6} className="mb-3">
                      <div className="stat-number" style={{color: stat.color}}>
                        {stat.value}
                      </div>
                      <div className="stat-label">{stat.label}</div>
                      <div className="stat-category">{stat.category}</div>
                    </Col>
                  ))}
                </Row>
                <div className="mt-4 pt-3 text-center" style={{borderTop: '2px solid #00ffff'}}>
                  <small style={{color: '#00ff00', fontFamily: 'Share Tech Mono, monospace'}}>
                    [VITRUVIAN_STATUS] Perfect proportions achieved • Neural sync: 99.7%
                  </small>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* All Hackathon Divisions Section */}
      <section className="py-5" style={{background: 'linear-gradient(135deg, #1a0033 0%, #000511 100%)'}}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">
                <FaAtom className="me-3" />
                The Universal Innovation Matrix
              </h2>
              <p className="section-subtitle">
                Twelve realms of technological mastery, each a universe of infinite possibility. 
                Like Da Vinci's diverse studies, we embrace every domain of human ingenuity.
              </p>
            </Col>
          </Row>
          
          <div className="division-grid">
            {hackathonDivisions.map((division, index) => (
              <div key={index} className="division-card" style={{borderColor: division.color}}>
                <div style={{color: division.color}}>
                  {division.icon}
                </div>
                <h4 className="division-title" style={{color: division.color}}>
                  {division.title}
                </h4>
                <p className="division-description">
                  {division.description}
                </p>
                <span className="division-category" style={{color: division.color}}>
                  {division.category}
                </span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Da Vinci Features Section */}
      <section className="py-5" style={{background: 'linear-gradient(135deg, #000511 0%, #1a0033 100%)'}}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">
                <FaCog className="me-3" />
                Renaissance Engineering Principles
              </h2>
              <p className="section-subtitle">
                Our systems embody Da Vinci's methodology: systematic observation, mathematical precision, 
                and boundless curiosity applied to the art of team formation
              </p>
            </Col>
          </Row>
          <Row>
            {davinciFeatures.map((feature, index) => (
              <Col md={6} lg={3} key={index} className="mb-4">
                <Card className="renaissance-card h-100">
                  <Card.Body className="p-4 text-center">
                    {feature.icon}
                    <Card.Title className="h5">{feature.title}</Card.Title>
                    <Card.Text>
                      {feature.description}
                    </Card.Text>
                    <div className="framework-text">
                      📐 {feature.framework}
                    </div>
                    <div className="process-steps">
                      ⚙️ {feature.process}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Da Vinci Thought Process Section */}
      <section className="thought-process-section py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">
                <FaBrain className="me-3" />
                The Da Vinci Method
              </h2>
              <p className="section-subtitle">
                Six phases of systematic thinking that transform chaotic innovation into masterful creation. 
                This is how legends are born.
              </p>
            </Col>
          </Row>
          <Row>
            {thoughtProcess.map((phase, index) => (
              <Col md={6} lg={4} key={index} className="mb-5">
                <div className="text-center">
                  <div className="thought-circle">
                    <div className="icon-content">
                      {phase.icon}
                    </div>
                  </div>
                  <h5 className="phase-title">{phase.phase}</h5>
                  <p className="phase-description">{phase.description}</p>
                  <p className="phase-detail">{phase.detail}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Enhanced How It Works Section */}
      <section className="py-5" style={{background: 'linear-gradient(135deg, #1a0033 0%, #000511 100%)'}}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">
                <FaShieldAlt className="me-3" />
                The Renaissance Protocol
              </h2>
              <p className="section-subtitle">
                Three sacred steps to transform individual brilliance into collective mastery
              </p>
            </Col>
          </Row>
          <Row>
            <Col md={4} className="text-center mb-4">
              <div className="thought-circle" style={{width: '120px', height: '120px'}}>
                <div className="icon-content">
                  <h2 style={{color: '#000', fontFamily: 'Playfair Display, serif', fontWeight: 900}}>I</h2>
                </div>
              </div>
              <h5 className="phase-title">Digital Renaissance Portfolio</h5>
              <p className="phase-description">
                Create your comprehensive skill codex spanning all 12 innovation domains. 
                Our quantum analyzers decode your potential across mobile, AI, gaming, and beyond.
              </p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="thought-circle" style={{width: '120px', height: '120px'}}>
                <div className="icon-content">
                  <h2 style={{color: '#000', fontFamily: 'Playfair Display, serif', fontWeight: 900}}>II</h2>
                </div>
              </div>
              <h5 className="phase-title">Neural Harmony Calibration</h5>
              <p className="phase-description">
                Like Da Vinci's perfect proportions, our AI calculates ideal team compositions 
                across complementary skills, personalities, and innovation domains.
              </p>
            </Col>
            <Col md={4} className="text-center mb-4">
              <div className="thought-circle" style={{width: '120px', height: '120px'}}>
                <div className="icon-content">
                  <h2 style={{color: '#000', fontFamily: 'Playfair Display, serif', fontWeight: 900}}>III</h2>
                </div>
              </div>
              <h5 className="phase-title">Masterpiece Manifestation</h5>
              <p className="phase-description">
                Unite with your perfect team constellation and create innovations that reshape reality. 
                From concept to victory, guided by Renaissance principles.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Final CTA Section */}
      <section className="py-5 position-relative" style={{background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0033 100%)'}}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' stroke=\'%2300ffff\' stroke-width=\'0.5\' opacity=\'0.1\'%3E%3Ccircle cx=\'100\' cy=\'100\' r=\'80\'/%3E%3Cpolygon points=\'100,20 180,180 20,180\'/%3E%3Crect x=\'60\' y=\'60\' width=\'80\' height=\'80\'/%3E%3C/g%3E%3C/svg%3E") repeat',
          animation: 'geometric-float 40s ease-in-out infinite reverse'
        }}></div>
        <Container className="position-relative">
          <Row className="text-center">
            <Col>
              <h2 className="section-title mb-4">
                Ready to Begin Your Renaissance?
              </h2>
              <p className="section-subtitle mb-4">
                Join 47,000+ visionary creators who have discovered their perfect innovation companions 
                across every technological frontier. Your masterpiece awaits.
              </p>
              <div className="mb-4">
                <Button as={Link} to="/register" className="davinci-button" size="lg">
                  <FaRocket className="me-2" />
                  Initiate Renaissance Protocol
                </Button>
              </div>
              
              <div className="mt-5">
                <small style={{color: '#888', fontFamily: 'Crimson Text, serif', fontSize: '1rem', fontStyle: 'italic'}}>
                  "Obstacles cannot crush me; every obstacle yields to stern resolve. 
                  Those who are passionate conquer." - Leonardo da Vinci
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