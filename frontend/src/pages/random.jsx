import React, { useState, useEffect } from 'react';

const HackMatesApp = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [matches, setMatches] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    skills: '',
    experience: '',
    interests: '',
    github: '',
    linkedin: ''
  });

  // Sample data
  useEffect(() => {
    setEvents([
      {
        id: 1,
        name: "AI Innovation Hackathon 2025",
        date: "2025-06-15",
        location: "San Francisco, CA",
        theme: "Artificial Intelligence",
        prize: "$50,000",
        teamSize: "2-4 members",
        description: "Build the next generation of AI applications"
      },
      {
        id: 2,
        name: "Green Tech Challenge",
        date: "2025-07-10",
        location: "Austin, TX",
        theme: "Sustainability",
        prize: "$25,000",
        teamSize: "3-5 members",
        description: "Create solutions for environmental challenges"
      },
      {
        id: 3,
        name: "FinTech Revolution",
        date: "2025-06-28",
        location: "New York, NY",
        theme: "Financial Technology",
        prize: "$40,000",
        teamSize: "2-4 members",
        description: "Revolutionize financial services with technology"
      }
    ]);

    setMatches([
      {
        id: 1,
        name: "Sarah Chen",
        skills: "React, Python, ML",
        experience: "3 years",
        matchScore: 95,
        bio: "Full-stack developer passionate about AI and machine learning",
        avatar: "SC"
      },
      {
        id: 2,
        name: "Alex Kumar",
        skills: "Node.js, MongoDB, AI",
        experience: "2 years",
        matchScore: 88,
        bio: "Backend developer with expertise in AI integration",
        avatar: "AK"
      },
      {
        id: 3,
        name: "Maria Rodriguez",
        skills: "UI/UX, React, Design",
        experience: "4 years",
        matchScore: 82,
        bio: "Creative designer who codes, loves building user-centric apps",
        avatar: "MR"
      }
    ]);
  }, []);

  const handleLogin = () => {
    setUser({ name: "John Doe", email: "john@example.com" });
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setShowProfileModal(false);
  };

  const NavbarComponent = () => (
    <>
      <style>{`
        .navbar-custom {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 2px 20px rgba(0,0,0,0.1);
        }
        .navbar-brand {
          font-size: 1.5rem;
          font-weight: 700;
          color: white !important;
        }
        .nav-link-custom {
          color: rgba(255,255,255,0.9) !important;
          margin: 0 0.5rem;
          padding: 0.5rem 1rem !important;
          border-radius: 20px;
          transition: all 0.3s ease;
        }
        .nav-link-custom:hover, .nav-link-custom.active {
          background: rgba(255,255,255,0.2);
          color: white !important;
          transform: translateY(-2px);
        }
        .btn-glow {
          background: linear-gradient(45deg, #ff6b6b, #feca57);
          border: none;
          padding: 0.5rem 1.5rem;
          border-radius: 25px;
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        .btn-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
          color: white;
        }
        .hero-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 4rem 0;
          margin-bottom: 3rem;
        }
        .feature-card {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          height: 100%;
        }
        .feature-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        .event-card {
          background: white;
          border-radius: 15px;
          padding: 1.5rem;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          margin-bottom: 1.5rem;
          border: 1px solid #e9ecef;
        }
        .event-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.15);
        }
        .match-card {
          background: white;
          border-radius: 15px;
          padding: 1.5rem;
          box-shadow: 0 5px 20px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .match-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.15);
        }
        .avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(45deg, #667eea, #764ba2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 18px;
          margin: 0 auto 1rem;
        }
        .badge-custom {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.8rem;
          margin: 0.2rem;
          display: inline-block;
        }
        .badge-success { background: #28a745; color: white; }
        .badge-info { background: #17a2b8; color: white; }
        .badge-warning { background: #ffc107; color: #212529; }
        .badge-secondary { background: #6c757d; color: white; }
        .badge-primary { background: #007bff; color: white; }
        .btn-primary-custom {
          background: linear-gradient(45deg, #667eea, #764ba2);
          border: none;
          border-radius: 25px;
          padding: 0.7rem 2rem;
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-primary-custom:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          color: white;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-content-custom {
          background: white;
          border-radius: 15px;
          padding: 2rem;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
      `}</style>
      
      <nav className="navbar navbar-expand-lg navbar-custom">
        <div className="container">
          <a className="navbar-brand" href="#">🚀 HackMates</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item">
                <a 
                  className={`nav-link nav-link-custom ${currentPage === 'home' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('home')}
                  href="#"
                >
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className={`nav-link nav-link-custom ${currentPage === 'events' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('events')}
                  href="#"
                >
                  Events
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className={`nav-link nav-link-custom ${currentPage === 'matches' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('matches')}
                  href="#"
                >
                  Find Partners
                </a>
              </li>
              <li className="nav-item">
                <a 
                  className={`nav-link nav-link-custom ${currentPage === 'teams' ? 'active' : ''}`}
                  onClick={() => setCurrentPage('teams')}
                  href="#"
                >
                  My Teams
                </a>
              </li>
            </ul>
            <div className="navbar-nav">
              {user ? (
                <a className="nav-link nav-link-custom" onClick={() => setShowProfileModal(true)} href="#">
                  👤 {user.name}
                </a>
              ) : (
                <button className="btn btn-glow" onClick={handleLogin}>
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );

  const HomePage = () => (
    <div>
      <div className="hero-section">
        <div className="container text-center">
          <h1 className="display-4 fw-bold mb-3">
            Find Your Perfect Hackathon Partner
          </h1>
          <p className="lead mb-4 fs-5">
            AI-powered matching system to connect you with ideal teammates for hackathons
          </p>
          {!user && (
            <button className="btn btn-glow btn-lg" onClick={handleLogin}>
              Get Started
            </button>
          )}
        </div>
      </div>

      <div className="container">
        <div className="row mb-5">
          <div className="col-md-4 mb-4">
            <div className="feature-card text-center">
              <div style={{fontSize: '4rem'}} className="text-success mb-3">📋</div>
              <h4 className="mb-3">Smart Profile Creation</h4>
              <p className="text-muted">
                Upload your resume or connect LinkedIn - our OCR and NLP extract your skills automatically
              </p>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="feature-card text-center">
              <div style={{fontSize: '4rem'}} className="text-warning mb-3">🏆</div>
              <h4 className="mb-3">Team Up & Win</h4>
              <p className="text-muted">
                Form teams, apply to hackathons together, and track your collaboration success
              </p>
            </div>
          </div>
        </div>

        <div className="bg-light rounded p-4 mb-5">
          <h3 className="mb-4">How It Works</h3>
          <div className="row">
            <div className="col-md-3 text-center mb-3">
              <div className="h2 text-primary mb-2">1️⃣</div>
              <h5>Create Profile</h5>
              <p className="small text-muted">Upload resume or connect social profiles</p>
            </div>
            <div className="col-md-3 text-center mb-3">
              <div className="h2 text-primary mb-2">2️⃣</div>
              <h5>AI Analysis</h5>
              <p className="small text-muted">Our AI analyzes your skills and preferences</p>
            </div>
            <div className="col-md-3 text-center mb-3">
              <div className="h2 text-primary mb-2">3️⃣</div>
              <h5>Get Matches</h5>
              <p className="small text-muted">Receive personalized partner recommendations</p>
            </div>
            <div className="col-md-3 text-center mb-3">
              <div className="h2 text-primary mb-2">4️⃣</div>
              <h5>Team Up</h5>
              <p className="small text-muted">Connect, collaborate, and win hackathons</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const EventsPage = () => (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Upcoming Hackathons</h2>
        <select className="form-select" style={{ width: '200px' }}>
          <option>All Categories</option>
          <option>AI/ML</option>
          <option>Web Development</option>
          <option>Mobile Apps</option>
          <option>IoT</option>
        </select>
      </div>
      
      <div className="row">
        {events.map(event => (
          <div key={event.id} className="col-md-6 col-lg-4 mb-4">
            <div className="event-card h-100">
              <h5 className="text-primary mb-3">{event.name}</h5>
              <p className="text-muted mb-3">{event.description}</p>
              <div className="mb-3">
                <span className="badge-custom badge-info">📅 {event.date}</span>
                <span className="badge-custom badge-success">📍 {event.location}</span>
              </div>
              <div className="mb-3">
                <span className="badge-custom badge-warning">💰 {event.prize}</span>
                <span className="badge-custom badge-secondary">{event.teamSize}</span>
              </div>
              <div className="d-grid gap-2">
                <button className="btn btn-primary-custom">Apply Solo</button>
                <button className="btn btn-outline-primary">Find Team First</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const MatchesPage = () => (
    <div className="container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>AI Recommended Partners</h2>
        <button className="btn btn-outline-primary">
          🔄 Refresh Matches
        </button>
      </div>
      
      <div className="alert alert-info mb-4">
        <h5 className="alert-heading">AI Matching Active</h5>
        <p className="mb-0">Based on your profile, we've found {matches.length} potential partners with high compatibility scores.</p>
      </div>

      <div className="row">
        {matches.map(match => (
          <div key={match.id} className="col-md-6 col-lg-4 mb-4">
            <div className="match-card h-100">
              <div className="avatar">
                {match.avatar}
              </div>
              <h5 className="mb-2">{match.name}</h5>
              <div className="mb-2">
                <span 
                  className={`badge-custom ${
                    match.matchScore >= 90 ? 'badge-success' : 
                    match.matchScore >= 80 ? 'badge-warning' : 'badge-secondary'
                  }`}
                >
                  {match.matchScore}% Match
                </span>
              </div>
              <p className="small text-muted mb-3">{match.bio}</p>
              <div className="mb-3 text-start">
                <strong>Skills:</strong> {match.skills}<br/>
                <strong>Experience:</strong> {match.experience}
              </div>
              <div className="d-grid gap-2">
                <button className="btn btn-primary-custom btn-sm">
                  🤝 Send Hack Request
                </button>
                <button className="btn btn-outline-secondary btn-sm">
                  👁️ View Profile
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const TeamsPage = () => (
    <div className="container">
      <h2 className="mb-4">My Teams & Applications</h2>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4" style={{borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)'}}>
            <div className="card-header bg-success text-white" style={{borderRadius: '15px 15px 0 0'}}>
              <h5 className="mb-0">Active Team</h5>
            </div>
            <div className="card-body">
              <h6>AI Innovation Hackathon 2025</h6>
              <p className="text-muted">Team: "Neural Ninjas"</p>
              <div className="mb-3">
                <span className="badge-custom badge-success">Sarah Chen</span>
                <span className="badge-custom badge-success">You</span>
                <span className="badge-custom badge-secondary">+1 Needed</span>
              </div>
              <button className="btn btn-primary-custom btn-sm">View Team Dashboard</button>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card mb-4" style={{borderRadius: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.1)'}}>
            <div className="card-header bg-warning text-dark" style={{borderRadius: '15px 15px 0 0'}}>
              <h5 className="mb-0">Pending Applications</h5>
            </div>
            <div className="card-body">
              <div className="mb-2">
                <strong>Green Tech Challenge</strong>
                <span className="badge-custom badge-warning ms-2">Pending</span>
              </div>
              <p className="small text-muted">Applied as solo, looking for team</p>
              <button className="btn btn-outline-primary btn-sm">Find Teammates</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const ProfileModal = () => (
    showProfileModal && (
      <div className="modal-overlay">
        <div className="modal-content-custom">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>Complete Your Profile</h4>
            <button 
              className="btn-close" 
              onClick={() => setShowProfileModal(false)}
              style={{background: 'none', border: 'none', fontSize: '1.5rem'}}
            >
              ×
            </button>
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Experience Level</label>
                <select 
                  className="form-select"
                  value={profile.experience}
                  onChange={(e) => setProfile({...profile, experience: e.target.value})}
                >
                  <option>Select...</option>
                  <option>Beginner (0-1 years)</option>
                  <option>Intermediate (2-3 years)</option>
                  <option>Advanced (4+ years)</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="mb-3">
            <label className="form-label">Technical Skills</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="e.g., JavaScript, Python, React, Machine Learning"
              value={profile.skills}
              onChange={(e) => setProfile({...profile, skills: e.target.value})}
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Interests & Themes</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="e.g., AI, Web Development, Mobile Apps, IoT"
              value={profile.interests}
              onChange={(e) => setProfile({...profile, interests: e.target.value})}
            />
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">GitHub Profile</label>
                <input 
                  type="url" 
                  className="form-control"
                  placeholder="https://github.com/username"
                  value={profile.github}
                  onChange={(e) => setProfile({...profile, github: e.target.value})}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">LinkedIn Profile</label>
                <input 
                  type="url" 
                  className="form-control"
                  placeholder="https://linkedin.com/in/username"
                  value={profile.linkedin}
                  onChange={(e) => setProfile({...profile, linkedin: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <div className="border rounded p-3 bg-light mb-4">
            <h6>🤖 AI Profile Enhancement</h6>
            <button className="btn btn-outline-primary btn-sm me-2">
              📄 Upload Resume (OCR)
            </button>
            <button className="btn btn-outline-info btn-sm">
              🔗 Import from LinkedIn
            </button>
            <p className="small text-muted mt-2 mb-0">
              Our AI will automatically extract and enhance your profile information
            </p>
          </div>
          
          <div className="d-flex gap-2">
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowProfileModal(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary-custom" 
              onClick={handleProfileSubmit}
            >
              Save Profile & Start Matching
            </button>
          </div>
        </div>
      </div>
    )
  );

  const renderPage = () => {
    switch(currentPage) {
      case 'events': return <EventsPage />;
      case 'matches': return <MatchesPage />;
      case 'teams': return <TeamsPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-vh-100" style={{background: '#f8f9fa'}}>
      <link 
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" 
        rel="stylesheet" 
      />
      
      <NavbarComponent />
      {renderPage()}
      <ProfileModal />
      
      <footer className="bg-dark text-light text-center py-4 mt-5">
        <div className="container">
          <p className="mb-1">🚀 HackMates - AI-Powered Hackathon Partner Matching Platform</p>
          <p className="small text-muted mb-0">Built with React, Bootstrap & AI Magic ✨</p>
        </div>
      </footer>
    </div>
  );
};

export default HackMatesApp; className="text-primary mb-3">🤖</div>
              <h4 className="mb-3">AI-Powered Matching</h4>
              <p className="text-muted">
                Advanced algorithms analyze skills, experience, and interests to find your perfect hackathon partner
              </p>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="feature-card text-center">
              <div style={{fontSize: '4rem'}}