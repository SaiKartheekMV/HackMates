/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResumeUpload from '../components/ResumeUpload';
import { FaUser, FaCode, FaGraduationCap, FaLinkedin, FaGithub, FaPlus, FaTimes } from 'react-icons/fa';

const ProfileSetup = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Basic Info
    bio: '',
    location: '',
    yearsOfExperience: '',
    
    // Skills
    skills: [],
    newSkill: '',
    
    // Education
    education: '',
    degree: '',
    university: '',
    graduationYear: '',
    
    // Social Links
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    
    // Preferences
    preferredRoles: [],
    hackathonExperience: '',
    availability: '',
    
    // Resume
    resumeData: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const skillSuggestions = [
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillAdd = () => {
    if (formData.newSkill.trim() && !formData.skills.includes(formData.newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.newSkill.trim()],
        newSkill: ''
      }));
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleRoleToggle = (role) => {
    setFormData(prev => ({
      ...prev,
      preferredRoles: prev.preferredRoles.includes(role)
        ? prev.preferredRoles.filter(r => r !== role)
        : [...prev.preferredRoles, role]
    }));
  };

  const handleResumeUpload = (resumeData) => {
    setFormData(prev => ({
      ...prev,
      resumeData
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await updateProfile(formData);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfo = () => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-primary text-white">
        <FaUser className="me-2" />
        Basic Information
      </Card.Header>
      <Card.Body>
        <Form>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Bio</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Location</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="City, Country"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Years of Experience</Form.Label>
                <Form.Select
                  value={formData.yearsOfExperience}
                  onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                >
                  <option value="">Select experience level</option>
                  <option value="0-1">0-1 years (Beginner)</option>
                  <option value="1-3">1-3 years (Junior)</option>
                  <option value="3-5">3-5 years (Mid-level)</option>
                  <option value="5+">5+ years (Senior)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );

  const renderSkills = () => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-success text-white">
        <FaCode className="me-2" />
        Skills & Technologies
      </Card.Header>
      <Card.Body>
        <Form.Group className="mb-3">
          <Form.Label>Add Skills</Form.Label>
          <div className="d-flex">
            <Form.Control
              type="text"
              placeholder="Enter a skill"
              value={formData.newSkill}
              onChange={(e) => handleInputChange('newSkill', e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd())}
            />
            <Button
              variant="outline-success"
              className="ms-2"
              onClick={handleSkillAdd}
            >
              <FaPlus />
            </Button>
          </div>
        </Form.Group>

        {formData.skills.length > 0 && (
          <div className="mb-4">
            <h6>Your Skills:</h6>
            <div className="d-flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <Badge
                  key={index}
                  bg="success"
                  className="p-2 d-flex align-items-center"
                >
                  {skill}
                  <FaTimes
                    className="ms-2 cursor-pointer"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSkillRemove(skill)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <h6>Suggested Skills:</h6>
          <div className="d-flex flex-wrap gap-2">
            {skillSuggestions
              .filter(skill => !formData.skills.includes(skill))
              .map((skill, index) => (
                <Badge
                  key={index}
                  bg="outline-secondary"
                  className="p-2 cursor-pointer"
                  style={{ cursor: 'pointer', border: '1px solid #6c757d' }}
                  onClick={() => handleInputChange('newSkill', skill)}
                >
                  {skill}
                </Badge>
              ))}
          </div>
        </div>
      </Card.Body>
    </Card>
  );

  const renderEducation = () => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-info text-white">
        <FaGraduationCap className="me-2" />
        Education & Background
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Degree</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g., Bachelor's in Computer Science"
                value={formData.degree}
                onChange={(e) => handleInputChange('degree', e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>University/Institution</Form.Label>
              <Form.Control
                type="text"
                placeholder="Your university name"
                value={formData.university}
                onChange={(e) => handleInputChange('university', e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Graduation Year</Form.Label>
              <Form.Control
                type="number"
                placeholder="e.g., 2024"
                value={formData.graduationYear}
                onChange={(e) => handleInputChange('graduationYear', e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Hackathon Experience</Form.Label>
              <Form.Select
                value={formData.hackathonExperience}
                onChange={(e) => handleInputChange('hackathonExperience', e.target.value)}
              >
                <option value="">Select experience</option>
                <option value="none">No experience</option>
                <option value="beginner">1-2 hackathons</option>
                <option value="intermediate">3-5 hackathons</option>
                <option value="experienced">5+ hackathons</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        <Form.Group className="mb-3">
          <Form.Label>Additional Education/Certifications</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Online courses, certifications, bootcamps..."
            value={formData.education}
            onChange={(e) => handleInputChange('education', e.target.value)}
          />
        </Form.Group>
      </Card.Body>
    </Card>
  );

  const renderPreferences = () => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-warning text-dark">
        <FaUser className="me-2" />
        Preferences & Social Links
      </Card.Header>
      <Card.Body>
        <div className="mb-4">
          <h6>Preferred Roles:</h6>
          <div className="d-flex flex-wrap gap-2">
            {roleOptions.map((role, index) => (
              <Badge
                key={index}
                bg={formData.preferredRoles.includes(role) ? "primary" : "outline-secondary"}
                className="p-2 cursor-pointer"
                style={{ 
                  cursor: 'pointer',
                  border: formData.preferredRoles.includes(role) ? 'none' : '1px solid #6c757d'
                }}
                onClick={() => handleRoleToggle(role)}
              >
                {role}
              </Badge>
            ))}
          </div>
        </div>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>
                <FaLinkedin className="me-2" />
                LinkedIn URL
              </Form.Label>
              <Form.Control
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedinUrl}
                onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>
                <FaGithub className="me-2" />
                GitHub URL
              </Form.Label>
              <Form.Control
                type="url"
                placeholder="https://github.com/yourusername"
                value={formData.githubUrl}
                onChange={(e) => handleInputChange('githubUrl', e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
        <Form.Group className="mb-3">
          <Form.Label>Portfolio URL</Form.Label>
          <Form.Control
            type="url"
            placeholder="https://yourportfolio.com"
            value={formData.portfolioUrl}
            onChange={(e) => handleInputChange('portfolioUrl', e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Availability</Form.Label>
          <Form.Select
            value={formData.availability}
            onChange={(e) => handleInputChange('availability', e.target.value)}
          >
            <option value="">Select availability</option>
            <option value="full-time">Full-time commitment</option>
            <option value="part-time">Part-time (weekends/evenings)</option>
            <option value="flexible">Flexible schedule</option>
          </Form.Select>
        </Form.Group>

        <div className="mt-4">
          <h6>Upload Resume (Optional)</h6>
          <ResumeUpload onUpload={handleResumeUpload} />
        </div>
      </Card.Body>
    </Card>
  );

  const steps = [
    { number: 1, title: 'Basic Info', component: renderBasicInfo },
    { number: 2, title: 'Skills', component: renderSkills },
    { number: 3, title: 'Education', component: renderEducation },
    { number: 4, title: 'Preferences', component: renderPreferences }
  ];

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <div className="text-center mb-4">
            <h2 className="text-primary">Complete Your Profile</h2>
            <p className="text-muted">
              Help us match you with the perfect hackathon teammates
            </p>
          </div>

          {/* Progress Bar */}
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                {steps.map((step) => (
                  <div
                    key={step.number}
                    className={`d-flex align-items-center ${
                      step.number <= currentStep ? 'text-primary' : 'text-muted'
                    }`}
                  >
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${
                        step.number <= currentStep
                          ? 'bg-primary text-white'
                          : 'bg-light text-muted'
                      }`}
                      style={{ width: '30px', height: '30px', fontSize: '14px' }}
                    >
                      {step.number}
                    </div>
                    <span className="fw-medium">{step.title}</span>
                  </div>
                ))}
              </div>
              <ProgressBar
                now={(currentStep / steps.length) * 100}
                variant="primary"
                className="mb-2"
              />
              <small className="text-muted">
                Step {currentStep} of {steps.length}
              </small>
            </Card.Body>
          </Card>

          {/* Error Alert */}
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {/* Current Step Component */}
          <div className="mb-4">
            {steps.find(step => step.number === currentStep)?.component()}
          </div>

          {/* Navigation Buttons */}
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between">
                <Button
                  variant="outline-secondary"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep < steps.length ? (
                  <Button
                    variant="primary"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    onClick={handleSubmit}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Complete Profile'}
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProfileSetup;