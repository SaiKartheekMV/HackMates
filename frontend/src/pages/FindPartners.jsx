/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Badge, 
  Spinner,
  Alert,
  InputGroup,
  Accordion,
  Offcanvas
} from 'react-bootstrap';
import { 
  FaSearch, 
  FaFilter, 
  FaMapMarkerAlt, 
  FaClock, 
  FaCode,
  FaGraduationCap,
  FaUsers,
  FaTimes,
  FaSlidersH
} from 'react-icons/fa';
import MatchCard from '../components/MatchCard';
import { useAuth } from '../context/AuthContext';

const FindPartners = () => {
  const { user } = useAuth();
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    skills: [],
    experience: '',
    location: '',
    availability: '',
    hackathonExperience: '',
    preferredRoles: []
  });

  // Mock data - in real app, this would come from API
  const mockPartners = [
    {
      id: 1,
      name: 'Alice Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      bio: 'Full-stack developer passionate about AI and machine learning. Love building innovative solutions.',
      location: 'San Francisco, CA',
      yearsOfExperience: '3-5',
      skills: ['React', 'Python', 'Machine Learning', 'Node.js', 'PostgreSQL'],
      preferredRoles: ['Full Stack Developer', 'Machine Learning Engineer'],
      hackathonExperience: 'intermediate',
      availability: 'full-time',
      matchScore: 95,
      university: 'Stanford University',
      linkedinUrl: 'https://linkedin.com/in/alicejohnson',
      githubUrl: 'https://github.com/alicejohnson'
    },
    {
      id: 2,
      name: 'Bob Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'Frontend specialist with a keen eye for design. Experienced in creating responsive web applications.',
      location: 'New York, NY',
      yearsOfExperience: '1-3',
      skills: ['React', 'JavaScript', 'UI/UX Design', 'HTML/CSS', 'Vue.js'],
      preferredRoles: ['Frontend Developer', 'UI/UX Designer'],
      hackathonExperience: 'beginner',
      availability: 'part-time',
      matchScore: 87,
      university: 'MIT',
      linkedinUrl: 'https://linkedin.com/in/bobchen',
      githubUrl: 'https://github.com/bobchen'
    },
    {
      id: 3,
      name: 'Sarah Williams',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      bio: 'Data scientist and blockchain enthusiast. Looking to work on innovative fintech solutions.',
      location: 'Austin, TX',
      yearsOfExperience: '5+',
      skills: ['Python', 'Blockchain', 'Data Science', 'Solidity', 'R'],
      preferredRoles: ['Data Scientist', 'Blockchain Developer'],
      hackathonExperience: 'experienced',
      availability: 'flexible',
      matchScore: 92,
      university: 'University of Texas',
      linkedinUrl: 'https://linkedin.com/in/sarahwilliams',
      githubUrl: 'https://github.com/sarahwilliams'
    },
    {
      id: 4,
      name: 'Mike Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      bio: 'Mobile app developer with experience in both iOS and Android. Love creating user-friendly apps.',
      location: 'Los Angeles, CA',
      yearsOfExperience: '1-3',
      skills: ['React Native', 'Swift', 'Kotlin', 'JavaScript', 'Firebase'],
      preferredRoles: ['Mobile Developer', 'Full Stack Developer'],
      hackathonExperience: 'intermediate',
      availability: 'part-time',
      matchScore: 78,
      university: 'UCLA',
      linkedinUrl: 'https://linkedin.com/in/mikerodriguez',
      githubUrl: 'https://github.com/mikerodriguez'
    },
    {
      id: 5,
      name: 'Emma Davis',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'DevOps engineer passionate about cloud computing and automation. Always learning new technologies.',
      location: 'Seattle, WA',
      yearsOfExperience: '3-5',
      skills: ['Docker', 'Kubernetes', 'AWS', 'Python', 'CI/CD'],
      preferredRoles: ['DevOps Engineer', 'Backend Developer'],
      hackathonExperience: 'beginner',
      availability: 'full-time',
      matchScore: 85,
      university: 'University of Washington',
      linkedinUrl: 'https://linkedin.com/in/emmadavis',
      githubUrl: 'https://github.com/emmadavis'
    }
  ];

  const skillOptions = [
    'JavaScript', 'Python', 'React', 'Node.js', 'HTML/CSS', 'Java', 'C++',
    'Machine Learning', 'AI', 'Data Science', 'UI/UX Design', 'Mobile Development',
    'Cloud Computing', 'Docker', 'Kubernetes', 'SQL', 'NoSQL', 'GraphQL',
    'Blockchain', 'Cybersecurity', 'DevOps', 'Arduino', 'IoT', 'Game Development'
  ];

  const roleOptions = [
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Mobile Developer', 'Data Scientist', 'Machine Learning Engineer',
    'UI/UX Designer', 'Product Manager', 'DevOps Engineer',
    'Cybersecurity Specialist', 'Blockchain Developer', 'Game Developer'
  ];

  useEffect(() => {
    // Simulate API call
    const fetchPartners = async () => {
      setLoading(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPartners(mockPartners);
        setFilteredPartners(mockPartners);
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filters, partners]);

  const applyFilters = () => {
    let filtered = partners.filter(partner => {
      // Search term filter
      const matchesSearch = !searchTerm || 
        partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        partner.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

      // Skills filter
      const matchesSkills = filters.skills.length === 0 ||
        filters.skills.some(skill => partner.skills.includes(skill));

      // Experience filter
      const matchesExperience = !filters.experience || 
        partner.yearsOfExperience === filters.experience;

      // Location filter
      const matchesLocation = !filters.location ||
        partner.location.toLowerCase().includes(filters.location.toLowerCase());

      // Availability filter
      const matchesAvailability = !filters.availability ||
        partner.availability === filters.availability;

      // Hackathon experience filter
      const matchesHackathonExp = !filters.hackathonExperience ||
        partner.hackathonExperience === filters.hackathonExperience;

      // Preferred roles filter
      const matchesRoles = filters.preferredRoles.length === 0 ||
        filters.preferredRoles.some(role => partner.preferredRoles.includes(role));

      return matchesSearch && matchesSkills && matchesExperience && 
             matchesLocation && matchesAvailability && matchesHackathonExp && matchesRoles;
    });

    // Sort by match score
    filtered.sort((a, b) => b.matchScore - a.matchScore);
    setFilteredPartners(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSkillToggle = (skill) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleRoleToggle = (role) => {
    setFilters(prev => ({
      ...prev,
      preferredRoles: prev.preferredRoles.includes(role)
        ? prev.preferredRoles.filter(r => r !== role)
        : [...prev.preferredRoles, role]
    }));
  };

  const clearFilters = () => {
    setFilters({
      skills: [],
      experience: '',
      location: '',
      availability: '',
      hackathonExperience: '',
      preferredRoles: []
    });
    setSearchTerm('');
  };

  const renderFilters = () => (
    <Card className="border-0 shadow-sm mb-4">
      <Card.Header className="bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <FaFilter className="me-2" />
            Filters
          </h6>
          <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
            Clear All
          </Button>
        </div>
      </Card.Header>
      <Card.Body>
        <Accordion>
          <Accordion.Item eventKey="0">
            <Accordion.Header>Skills</Accordion.Header>
            <Accordion.Body>
              <div className="d-flex flex-wrap gap-2">
                {skillOptions.map((skill, index) => (
                  <Badge
                    key={index}
                    bg={filters.skills.includes(skill) ? "primary" : "outline-secondary"}
                    className="p-2 cursor-pointer"
                    style={{ 
                      cursor: 'pointer',
                      border: filters.skills.includes(skill) ? 'none' : '1px solid #6c757d'
                    }}
                    onClick={() => handleSkillToggle(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="1">
            <Accordion.Header>Experience & Preferences</Accordion.Header>
            <Accordion.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Experience Level</Form.Label>
                    <Form.Select
                      value={filters.experience}
                      onChange={(e) => handleFilterChange('experience', e.target.value)}
                    >
                      <option value="">Any level</option>
                      <option value="0-1">0-1 years (Beginner)</option>
                      <option value="1-3">1-3 years (Junior)</option>
                      <option value="3-5">3-5 years (Mid-level)</option>
                      <option value="5+">5+ years (Senior)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Availability</Form.Label>
                    <Form.Select
                      value={filters.availability}
                      onChange={(e) => handleFilterChange('availability', e.target.value)}
                    >
                      <option value="">Any availability</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="flexible">Flexible</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Hackathon Experience</Form.Label>
                    <Form.Select
                      value={filters.hackathonExperience}
                      onChange={(e) => handleFilterChange('hackathonExperience', e.target.value)}
                    >
                      <option value="">Any experience</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="experienced">Experienced</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter city or state"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Accordion.Body>
          </Accordion.Item>

          <Accordion.Item eventKey="2">
            <Accordion.Header>Preferred Roles</Accordion.Header>
            <Accordion.Body>
              <div className="d-flex flex-wrap gap-2">
                {roleOptions.map((role, index) => (
                  <Badge
                    key={index}
                    bg={filters.preferredRoles.includes(role) ? "success" : "outline-secondary"}
                    className="p-2 cursor-pointer"
                    style={{ 
                      cursor: 'pointer',
                      border: filters.preferredRoles.includes(role) ? 'none' : '1px solid #6c757d'
                    }}
                    onClick={() => handleRoleToggle(role)}
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </Card.Body>
    </Card>
  );

  const renderMobileFilters = () => (
    <Offcanvas show={showFilters} onHide={() => setShowFilters(false)} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          <FaFilter className="me-2" />
          Filters
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {renderFilters()}
      </Offcanvas.Body>
    </Offcanvas>
  );

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Finding amazing teammates for you...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        {/* Desktop Filters Sidebar */}
        <Col lg={3} className="d-none d-lg-block">
          {renderFilters()}
        </Col>

        {/* Main Content */}
        <Col lg={9}>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">Find Your Perfect Teammates</h2>
              <p className="text-muted mb-0">
                {filteredPartners.length} potential partners found
              </p>
            </div>
            
            {/* Mobile Filters Button */}
            <Button
              variant="outline-primary"
              className="d-lg-none"
              onClick={() => setShowFilters(true)}
            >
              <FaSlidersH className="me-2" />
              Filters
            </Button>
          </div>

          {/* Search Bar */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, skills, or bio..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Card.Body>
          </Card>

          {/* Active Filters Display */}
          {(filters.skills.length > 0 || filters.preferredRoles.length > 0 || 
            filters.experience || filters.location || filters.availability || 
            filters.hackathonExperience) && (
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body>
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <small className="text-muted me-2">Active filters:</small>
                  
                  {filters.skills.map(skill => (
                    <Badge key={skill} bg="primary" className="d-flex align-items-center">
                      {skill}
                      <FaTimes 
                        className="ms-1" 
                        style={{ cursor: 'pointer', fontSize: '0.8em' }}
                        onClick={() => handleSkillToggle(skill)}
                      />
                    </Badge>
                  ))}
                  
                  {filters.preferredRoles.map(role => (
                    <Badge key={role} bg="success" className="d-flex align-items-center">
                      {role}
                      <FaTimes 
                        className="ms-1" 
                        style={{ cursor: 'pointer', fontSize: '0.8em' }}
                        onClick={() => handleRoleToggle(role)}
                      />
                    </Badge>
                  ))}
                  
                  {filters.experience && (
                    <Badge bg="info" className="d-flex align-items-center">
                      {filters.experience} years
                      <FaTimes 
                        className="ms-1" 
                        style={{ cursor: 'pointer', fontSize: '0.8em' }}
                        onClick={() => handleFilterChange('experience', '')}
                      />
                    </Badge>
                  )}
                  
                  <Button variant="link" size="sm" onClick={clearFilters} className="p-0">
                    Clear all
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Results */}
          {filteredPartners.length === 0 ? (
            <Alert variant="info" className="text-center">
              <h5>No teammates found</h5>
              <p className="mb-0">Try adjusting your filters or search terms to find more matches.</p>
            </Alert>
          ) : (
            <Row>
              {filteredPartners.map(partner => (
                <Col key={partner.id} md={6} xl={4} className="mb-4">
                  <MatchCard partner={partner} />
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>

      {/* Mobile Filters Offcanvas */}
      {renderMobileFilters()}
    </Container>
  );
};

export default FindPartners;