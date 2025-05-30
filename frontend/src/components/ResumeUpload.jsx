import React, { useState, useRef } from 'react';
import { 
  Card, 
  Button, 
  Alert, 
  ProgressBar, 
  Badge, 
  Row, 
  Col,
  Modal,
  Form,
  Spinner
} from 'react-bootstrap';
import { 
  FaUpload, 
  FaFileAlt, 
  FaCheck, 
  FaTimes, 
  FaDownload,
  FaEye,
  FaRobot,
  FaEdit
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';

const ResumeUpload = ({ onResumeDataExtracted, existingResumeData = null }) => {
  const { getToken } = useAuth();
  const fileInputRef = useRef(null);
  
  const [uploadState, setUploadState] = useState({
    file: null,
    uploading: false,
    progress: 0,
    error: null,
    success: false,
  });
  
  const [extractedData, setExtractedData] = useState(existingResumeData);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);

  // Supported file types
  const supportedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  // Validate file
  const validateFile = (file) => {
    if (!file) return { valid: false, error: 'No file selected' };
    
    if (!supportedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Unsupported file type. Please upload PDF, DOC, or DOCX files.' 
      };
    }
    
    if (file.size > maxFileSize) {
      return { 
        valid: false, 
        error: 'File size too large. Please upload files under 10MB.' 
      };
    }
    
    return { valid: true };
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    const validation = validateFile(file);
    
    if (!validation.valid) {
      setUploadState(prev => ({
        ...prev,
        error: validation.error,
        file: null,
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      file,
      error: null,
      success: false,
    }));
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Upload and process resume
  const uploadResume = async () => {
    if (!uploadState.file) return;

    try {
      setUploadState(prev => ({ ...prev, uploading: true, progress: 0, error: null }));
      setAiProcessing(true);

      const formData = new FormData();
      formData.append('resume', uploadState.file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 30, 90)
        }));
      }, 500);

      const response = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Upload failed. Please try again.');
      }

      const data = await response.json();
      
      setUploadState(prev => ({
        ...prev,
        progress: 100,
        success: true,
        uploading: false,
      }));

      setExtractedData(data.extractedData);
      
      // Call parent callback
      if (onResumeDataExtracted) {
        onResumeDataExtracted(data.extractedData);
      }

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        error: error.message,
        progress: 0,
      }));
    } finally {
      setAiProcessing(false);
    }
  };

  // Remove uploaded file
  const removeFile = () => {
    setUploadState({
      file: null,
      uploading: false,
      progress: 0,
      error: null,
      success: false,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Save edited data
  const saveEditedData = async (editedData) => {
    try {
      const response = await fetch('/api/resume/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      setExtractedData(editedData);
      setShowEditModal(false);
      
      if (onResumeDataExtracted) {
        onResumeDataExtracted(editedData);
      }
    } catch (error) {
      console.error('Error saving resume data:', error);
    }
  };

  return (
    <Card className="resume-upload-card">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <FaFileAlt className="me-2" />
          Resume Upload & Analysis
        </h5>
        {extractedData && (
          <div>
            <Button 
              variant="outline-primary" 
              size="sm" 
              className="me-2"
              onClick={() => setShowPreview(true)}
            >
              <FaEye className="me-1" />
              Preview
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={() => setShowEditModal(true)}
            >
              <FaEdit className="me-1" />
              Edit
            </Button>
          </div>
        )}
      </Card.Header>
      
      <Card.Body>
        {/* Upload Area */}
        {!extractedData && (
          <div
            className={`file-upload-area ${isDragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              <FaUpload size={48} className="text-primary mb-3" />
              <h5>Upload Your Resume</h5>
              <p className="text-muted mb-3">
                Drag and drop your resume here, or click to browse
              </p>
              <p className="small text-muted">
                Supported formats: PDF, DOC, DOCX (Max 10MB)
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {/* File Selected */}
        {uploadState.file && !uploadState.uploading && !uploadState.success && (
          <div className="selected-file p-3 bg-light rounded">
            <Row className="align-items-center">
              <Col>
                <div className="d-flex align-items-center">
                  <FaFileAlt className="text-primary me-2" />
                  <div>
                    <div className="fw-bold">{uploadState.file.name}</div>
                    <small className="text-muted">
                      {(uploadState.file.size / 1024 / 1024).toFixed(2)} MB
                    </small>
                  </div>
                </div>
              </Col>
              <Col xs="auto">
                <Button 
                  variant="primary" 
                  onClick={uploadResume}
                  className="me-2"
                >
                  <FaUpload className="me-1" />
                  Upload & Analyze
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={removeFile}
                >
                  <FaTimes />
                </Button>
              </Col>
            </Row>
          </div>
        )}

        {/* Upload Progress */}
        {uploadState.uploading && (
          <div className="upload-progress">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>Uploading and analyzing...</span>
              <span>{Math.round(uploadState.progress)}%</span>
            </div>
            <ProgressBar 
              now={uploadState.progress} 
              animated 
              className="mb-3"
            />
            {aiProcessing && (
              <div className="text-center">
                <Spinner animation="border" size="sm" className="me-2" />
                <small className="text-muted">
                  <FaRobot className="me-1" />
                  AI is extracting information from your resume...
                </small>
              </div>
            )}
          </div>
        )}

        {/* Success State */}
        {uploadState.success && (
          <Alert variant="success" className="d-flex align-items-center">
            <FaCheck className="me-2" />
            Resume uploaded and analyzed successfully!
          </Alert>
        )}

        {/* Error State */}
        {uploadState.error && (
          <Alert variant="danger" className="d-flex align-items-center">
            <FaTimes className="me-2" />
            {uploadState.error}
          </Alert>
        )}

        {/* Extracted Data Summary */}
        {extractedData && (
          <div className="extracted-data-summary">
            <h6 className="mb-3">
              <FaRobot className="me-2 text-primary" />
              AI Extracted Information
            </h6>
            
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Skills Detected:</strong>
                  <div className="mt-2">
                    {extractedData.skills?.map((skill, index) => (
                      <Badge 
                        key={index} 
                        bg="primary" 
                        className="me-1 mb-1"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Experience Level:</strong>
                  <div className="mt-1">
                    <Badge bg="info">
                      {extractedData.experienceLevel || 'Not specified'}
                    </Badge>
                  </div>
                </div>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Education:</strong>
                  <div className="mt-1 small">
                    {extractedData.education || 'Not specified'}
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Contact Email:</strong>
                  <div className="mt-1 small">
                    {extractedData.email || 'Not detected'}
                  </div>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Card.Body>

      {/* Preview Modal */}
      <Modal 
        show={showPreview} 
        onHide={() => setShowPreview(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Resume Data Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {extractedData && (
            <div>
              <h6>Personal Information</h6>
              <ul className="list-unstyled">
                <li><strong>Name:</strong> {extractedData.name || 'N/A'}</li>
                <li><strong>Email:</strong> {extractedData.email || 'N/A'}</li>
                <li><strong>Phone:</strong> {extractedData.phone || 'N/A'}</li>
                <li><strong>Location:</strong> {extractedData.location || 'N/A'}</li>
              </ul>
              
              <h6 className="mt-4">Skills</h6>
              <div>
                {extractedData.skills?.map((skill, index) => (
                  <Badge key={index} bg="primary" className="me-1 mb-1">
                    {skill}
                  </Badge>
                ))}
              </div>
              
              <h6 className="mt-4">Experience</h6>
              <p>{extractedData.experienceLevel || 'Not specified'}</p>
              
              <h6 className="mt-4">Education</h6>
              <p>{extractedData.education || 'Not specified'}</p>
              
              {extractedData.summary && (
                <>
                  <h6 className="mt-4">Summary</h6>
                  <p>{extractedData.summary}</p>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Resume Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <EditResumeForm 
            data={extractedData}
            onSave={saveEditedData}
            onCancel={() => setShowEditModal(false)}
          />
        </Modal.Body>
      </Modal>
    </Card>
  );
};

// Edit Resume Form Component
const EditResumeForm = ({ data, onSave, onCancel }) => {
  const [formData, setFormData] = useState(data || {});
  const [newSkill, setNewSkill] = useState('');

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSkillAdd = () => {
    if (newSkill.trim() && !formData.skills?.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const handleSkillRemove = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter(skill => skill !== skillToRemove) || [],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={formData.email || ''}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Phone</Form.Label>
            <Form.Control
              type="text"
              value={formData.phone || ''}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <Form.Control
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Skills</Form.Label>
        <div className="mb-2">
          {formData.skills?.map((skill, index) => (
            <Badge 
              key={index} 
              bg="primary" 
              className="me-1 mb-1"
              style={{ cursor: 'pointer' }}
              onClick={() => handleSkillRemove(skill)}
            >
              {skill} <FaTimes size={10} className="ms-1" />
            </Badge>
          ))}
        </div>
        <div className="d-flex">
          <Form.Control
            type="text"
            placeholder="Add new skill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd())}
          />
          <Button 
            variant="outline-primary" 
            className="ms-2"
            onClick={handleSkillAdd}
          >
            Add
          </Button>
        </div>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Experience Level</Form.Label>
        <Form.Select 
          value={formData.experienceLevel || ''}
          onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
        >
          <option value="">Select experience level</option>
          <option value="Beginner">Beginner (0-1 years)</option>
          <option value="Intermediate">Intermediate (1-3 years)</option>
          <option value="Advanced">Advanced (3-5 years)</option>
          <option value="Expert">Expert (5+ years)</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Education</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={formData.education || ''}
          onChange={(e) => handleInputChange('education', e.target.value)}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Summary</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          value={formData.summary || ''}
          onChange={(e) => handleInputChange('summary', e.target.value)}
        />
      </Form.Group>

      <div className="d-flex justify-content-end">
        <Button variant="secondary" className="me-2" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};

export default ResumeUpload;