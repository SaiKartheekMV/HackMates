/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  InputGroup,
  Button,
  Badge,
  Spinner,
  Alert,
  Card,
  Modal,
} from "react-bootstrap";
import { hackathonAPI } from "../services/api"; // Adjust the import path as necessary

const Hackathons = () => {
  const [hackathons, setHackathons] = useState([]);
  const [filteredHackathons, setFilteredHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    mode: "all",
    difficulty: "all",
    prizeRange: "all",
  });
  const [sortBy, setSortBy] = useState("startDate");
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  // Enhanced mock data with cyberpunk themes
  const mockHackathons = [
    {
      id: 1,
      title: "NEURAL NEXUS 2025",
      subtitle: "Quantum AI Revolution",
      description:
        "Forge the future of consciousness with neural networks that transcend human limitations. Build AI systems that merge reality with digital dreams.",
      startDate: "2025-07-15",
      endDate: "2025-07-17",
      location: "Neo-Bangalore Cyber District",
      mode: "hybrid",
      prizePool: 5000000,
      maxTeamSize: 4,
      registrationDeadline: "2025-07-10",
      tags: ["Neural AI", "Quantum Computing", "Consciousness", "Cybernetics"],
      organizer: "Synaptic Technologies Corp",
      difficulty: "Advanced",
      status: "upcoming",
      category: "AI/ML",
      participants: 2847,
      theme: "neon-blue",
    },
    {
      id: 2,
      title: "CRYPTO UPRISING",
      subtitle: "Decentralized Reality Engine",
      description:
        "Break the chains of centralized control. Build autonomous systems that exist beyond corporate oversight in the digital underground.",
      startDate: "2025-06-20",
      endDate: "2025-06-22",
      location: "The Matrix - Virtual Realm",
      mode: "online",
      prizePool: 3000000,
      maxTeamSize: 3,
      registrationDeadline: "2025-06-15",
      tags: ["Web3", "DeFi", "Decentralization", "Crypto Anarchy"],
      organizer: "Underground Collective",
      difficulty: "Expert",
      status: "ongoing",
      category: "Blockchain",
      participants: 1923,
      theme: "neon-green",
    },
    {
      id: 3,
      title: "TERRA GENESIS",
      subtitle: "Climate Salvation Protocol",
      description:
        "The planet is dying. Code the solutions that will save humanity from environmental collapse using cutting-edge biotechnology.",
      startDate: "2025-08-05",
      endDate: "2025-08-07",
      location: "Mumbai Arcology Complex",
      mode: "offline",
      prizePool: 7500000,
      maxTeamSize: 5,
      registrationDeadline: "2025-07-30",
      tags: [
        "Climate Tech",
        "Bioengineering",
        "Sustainability",
        "Planetary Defense",
      ],
      organizer: "Earth Restoration Initiative",
      difficulty: "Intermediate",
      status: "upcoming",
      category: "ClimaTech",
      participants: 3156,
      theme: "neon-purple",
    },
    {
      id: 4,
      title: "DIGITAL BANK HEIST",
      subtitle: "FinTech Revolution",
      description:
        "Infiltrate the financial system with revolutionary technology. Build the tools that will democratize wealth in the digital age.",
      startDate: "2025-09-12",
      endDate: "2025-09-14",
      location: "Delhi Corporate Sector",
      mode: "hybrid",
      prizePool: 4000000,
      maxTeamSize: 4,
      registrationDeadline: "2025-09-05",
      tags: [
        "FinTech",
        "Digital Banking",
        "Crypto Payments",
        "Financial Liberation",
      ],
      organizer: "Digital Finance Syndicate",
      difficulty: "Advanced",
      status: "upcoming",
      category: "FinTech",
      participants: 2341,
      theme: "neon-orange",
    },
  ];

const fetchHackathons = useCallback(async () => {
  try {
    setLoading(true);
    setError("");

    const params = {};
    
    if (searchTerm) params.search = searchTerm;
    if (filters.status !== "all") params.status = filters.status;
    if (filters.mode !== "all") params.mode = filters.mode;
    if (filters.difficulty !== "all") params.difficulty = filters.difficulty;
    if (filters.prizeRange !== "all") params.prizeRange = filters.prizeRange;
    params.sortBy = sortBy;

    console.log('API Request params:', params);

    const response = await hackathonAPI.getHackathons(params);
    console.log('Processed API Response:', response);
    
    // The response.data should now contain the hackathons array
    const hackathonData = response.data || [];
    console.log('Hackathon data to set:', hackathonData); // Debug log
    
    setHackathons(Array.isArray(hackathonData) ? hackathonData : []);
    setLoading(false);
  } catch (err) {
    console.error("Error fetching hackathons:", err);
    setError("SYSTEM ERROR: Failed to connect to hackathon database");
    setLoading(false);

    // Fallback to mock data if API fails
    setHackathons(mockHackathons);
  }
}, [searchTerm, filters, sortBy]);

 const filterAndSortHackathons = useCallback(() => {
  console.log('Raw hackathons for filtering:', hackathons); // Add this debug log
  
  if (!Array.isArray(hackathons)) {
    console.log('Hackathons is not an array:', typeof hackathons); // Debug log
    setFilteredHackathons([]);
    return;
  }
    let filtered = (hackathons || []).filter((hackathon) => {
      const matchesSearch =
        hackathon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hackathon.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        hackathon.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        filters.status === "all" || hackathon.status === filters.status;
      const matchesMode =
        filters.mode === "all" || hackathon.mode === filters.mode;
      const matchesDifficulty =
        filters.difficulty === "all" ||
        hackathon.difficulty === filters.difficulty;

      let matchesPrizeRange = true;
      if (filters.prizeRange !== "all") {
        switch (filters.prizeRange) {
          case "low":
            matchesPrizeRange = hackathon.prizePool < 3000000;
            break;
          case "medium":
            matchesPrizeRange =
              hackathon.prizePool >= 3000000 && hackathon.prizePool < 6000000;
            break;
          case "high":
            matchesPrizeRange = hackathon.prizePool >= 6000000;
            break;
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMode &&
        matchesDifficulty &&
        matchesPrizeRange
      );
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "startDate":
          return new Date(a.startDate) - new Date(b.startDate);
        case "prizePool":
          return b.prizePool - a.prizePool;
        case "registrationDeadline":
          return (
            new Date(a.registrationDeadline) - new Date(b.registrationDeadline)
          );
        default:
          return 0;
      }
    });

    setFilteredHackathons(filtered);
  }, [hackathons, searchTerm, filters, sortBy]);

  useEffect(() => {
    fetchHackathons();
  }, [fetchHackathons]);

  useEffect(() => {
    filterAndSortHackathons();
  }, [filterAndSortHackathons]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleApply = (hackathon) => {
    alert(`INITIATING CONNECTION TO: ${hackathon.title}`);
  };

  const handleViewDetails = (hackathon) => {
    setSelectedHackathon(hackathon);
    setShowModal(true);
  };

  const formatPrize = (amount) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "ongoing":
        return "success";
      case "upcoming":
        return "warning";
      case "ended":
        return "secondary";
      default:
        return "primary";
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Beginner":
        return "info";
      case "Intermediate":
        return "warning";
      case "Advanced":
        return "danger";
      case "Expert":
        return "dark";
      default:
        return "primary";
    }
  };

  if (loading) {
    return (
      <div
        style={{
          background:
            "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#00ffff",
        }}
      >
        <div className="text-center">
          <div
            style={{
              border: "2px solid #00ffff",
              borderRadius: "50%",
              width: "80px",
              height: "80px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "pulse 2s infinite",
              boxShadow: "0 0 30px #00ffff",
            }}
          >
            <Spinner animation="border" style={{ color: "#00ffff" }} />
          </div>
          <p
            className="mt-3"
            style={{ fontFamily: "monospace", fontSize: "18px" }}
          >
            ACCESSING HACKATHON DATABASE...
          </p>
          <p
            style={{ fontFamily: "monospace", fontSize: "14px", opacity: 0.7 }}
          >
            DECRYPTING NEURAL NETWORKS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)",
        minHeight: "100vh",
        color: "#ffffff",
      }}
    >
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 30px #00ffff; }
            50% { transform: scale(1.05); box-shadow: 0 0 50px #00ffff; }
            100% { transform: scale(1); box-shadow: 0 0 30px #00ffff; }
          }
          
          @keyframes glitch {
            0% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
            100% { transform: translate(0); }
          }
          
          .cyber-card {
            background: linear-gradient(145deg, rgba(15, 15, 35, 0.9), rgba(25, 25, 45, 0.9));
            border: 1px solid #00ffff;
            border-radius: 15px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .cyber-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent);
            transition: left 0.5s;
          }
          
          .cyber-card:hover::before {
            left: 100%;
          }
          
          .cyber-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0, 255, 255, 0.3);
            border-color: #ff00ff;
          }
          
          .neon-text {
            text-shadow: 0 0 10px currentColor;
            animation: pulse 2s infinite;
          }
          
          .glitch-title {
            animation: glitch 0.3s infinite;
          }
          
          .cyber-input {
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid #00ffff;
            color: #00ffff;
            border-radius: 8px;
          }
          
          .cyber-input:focus {
            background: rgba(0, 0, 0, 0.8);
            border-color: #ff00ff;
            box-shadow: 0 0 15px rgba(255, 0, 255, 0.3);
            color: #ff00ff;
          }
          
          .cyber-button {
            background: linear-gradient(45deg, #00ffff, #ff00ff);
            border: none;
            color: #000;
            font-weight: bold;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .cyber-button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
          }
          
          .status-indicator {
            position: absolute;
            top: 15px;
            right: 15px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            animation: pulse 2s infinite;
          }
          
          .grid-background {
            background-image: 
              linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px);
            background-size: 50px 50px;
          }
        `}
      </style>

      <Container fluid className="py-4 grid-background">
        {/* Header */}
        <Row className="mb-5">
          <Col>
            <div className="text-center">
              <h1
                className="display-4 fw-bold mb-2 neon-text glitch-title"
                style={{
                  color: "#00ffff",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "3px",
                }}
              >
                HACKATHON NEXUS
              </h1>
              <p
                style={{
                  color: "#ff00ff",
                  fontSize: "18px",
                  fontFamily: "monospace",
                  textShadow: "0 0 10px #ff00ff",
                }}
              >
                Enter the digital underground. Find your crew. Build the future.
              </p>
              <div
                style={{
                  width: "200px",
                  height: "2px",
                  background: "linear-gradient(90deg, #00ffff, #ff00ff)",
                  margin: "20px auto",
                  borderRadius: "1px",
                }}
              ></div>
            </div>
          </Col>
        </Row>

        {/* Search and Controls */}
        <Row className="mb-4">
          <Col lg={8}>
            <InputGroup>
              <InputGroup.Text
                style={{
                  background: "rgba(0, 0, 0, 0.7)",
                  border: "1px solid #00ffff",
                  color: "#00ffff",
                }}
              >
                🔍
              </InputGroup.Text>
              <Form.Control
                className="cyber-input"
                type="text"
                placeholder="Search the neural network..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontFamily: "monospace" }}
              />
            </InputGroup>
          </Col>
          <Col lg={4}>
            <Form.Select
              className="cyber-input"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ fontFamily: "monospace" }}
            >
              <option value="startDate">Sort by Launch Date</option>
              <option value="prizePool">Sort by Bounty</option>
              <option value="registrationDeadline">Sort by Deadline</option>
            </Form.Select>
          </Col>
        </Row>

        {/* Filters */}
        <Row className="mb-4">
          <Col md={3}>
            <Form.Label
              className="fw-bold small"
              style={{ color: "#00ffff", fontFamily: "monospace" }}
            >
              STATUS
            </Form.Label>
            <Form.Select
              className="cyber-input"
              size="sm"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              style={{ fontFamily: "monospace" }}
            >
              <option value="all">All Status</option>
              <option value="upcoming">Incoming</option>
              <option value="ongoing">Active</option>
              <option value="ended">Archived</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Label
              className="fw-bold small"
              style={{ color: "#00ffff", fontFamily: "monospace" }}
            >
              MODE
            </Form.Label>
            <Form.Select
              className="cyber-input"
              size="sm"
              value={filters.mode}
              onChange={(e) => handleFilterChange("mode", e.target.value)}
              style={{ fontFamily: "monospace" }}
            >
              <option value="all">All Realms</option>
              <option value="online">Virtual</option>
              <option value="offline">Physical</option>
              <option value="hybrid">Hybrid</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Label
              className="fw-bold small"
              style={{ color: "#00ffff", fontFamily: "monospace" }}
            >
              DIFFICULTY
            </Form.Label>
            <Form.Select
              className="cyber-input"
              size="sm"
              value={filters.difficulty}
              onChange={(e) => handleFilterChange("difficulty", e.target.value)}
              style={{ fontFamily: "monospace" }}
            >
              <option value="all">All Levels</option>
              <option value="Beginner">Novice</option>
              <option value="Intermediate">Adept</option>
              <option value="Advanced">Elite</option>
              <option value="Expert">Master</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Label
              className="fw-bold small"
              style={{ color: "#00ffff", fontFamily: "monospace" }}
            >
              BOUNTY
            </Form.Label>
            <Form.Select
              className="cyber-input"
              size="sm"
              value={filters.prizeRange}
              onChange={(e) => handleFilterChange("prizeRange", e.target.value)}
              style={{ fontFamily: "monospace" }}
            >
              <option value="all">All Bounties</option>
              <option value="low">Under ₹30L</option>
              <option value="medium">₹30L - ₹60L</option>
              <option value="high">Above ₹60L</option>
            </Form.Select>
          </Col>
        </Row>

        {/* Results Count */}
        <Row className="mb-3">
          <Col>
            <p style={{ color: "#ff00ff", fontFamily: "monospace", margin: 0 }}>
              NEURAL SCAN COMPLETE: {filteredHackathons.length} /{" "}
              {hackathons.length} EVENTS FOUND
            </p>
          </Col>
        </Row>

        {/* Error */}
        {error && (
          <Row className="mb-4">
            <Col>
              <Alert
                variant="danger"
                style={{
                  background: "rgba(255, 0, 0, 0.1)",
                  border: "1px solid #ff0000",
                  color: "#ff0000",
                  fontFamily: "monospace",
                }}
              >
                {error}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Hackathon Cards */}
        <Row>
          {filteredHackathons.length === 0 ? (
            <Col>
              <div className="text-center py-5">
                <h5 style={{ color: "#ff00ff", fontFamily: "monospace" }}>
                  NO SIGNALS DETECTED
                </h5>
                <p style={{ color: "#00ffff", fontFamily: "monospace" }}>
                  Recalibrate your search parameters and try again
                </p>
              </div>
            </Col>
          ) : (
            filteredHackathons.map((hackathon) => (
              <Col lg={6} xl={4} key={hackathon.id} className="mb-4">
                <Card
                  className="cyber-card h-100"
                  onMouseEnter={() => setHoveredCard(hackathon.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{ position: "relative" }}
                >
                  <div
                    className="status-indicator"
                    style={{
                      backgroundColor:
                        hackathon.status === "ongoing"
                          ? "#00ff00"
                          : hackathon.status === "upcoming"
                          ? "#ffff00"
                          : "#666",
                    }}
                  ></div>

                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <Badge
                        bg={getDifficultyColor(hackathon.difficulty)}
                        style={{ fontFamily: "monospace", fontSize: "10px" }}
                      >
                        {hackathon.difficulty.toUpperCase()}
                      </Badge>
                      <Badge
                        bg={getStatusColor(hackathon.status)}
                        style={{ fontFamily: "monospace", fontSize: "10px" }}
                      >
                        {hackathon.status.toUpperCase()}
                      </Badge>
                    </div>

                    <Card.Title
                      className="mb-2"
                      style={{
                        color: "#00ffff",
                        fontFamily: "monospace",
                        fontSize: "18px",
                        fontWeight: "bold",
                        textShadow:
                          hoveredCard === hackathon.id
                            ? "0 0 10px #00ffff"
                            : "none",
                      }}
                    >
                      {hackathon.title}
                    </Card.Title>

                    <Card.Subtitle
                      className="mb-3"
                      style={{
                        color: "#ff00ff",
                        fontFamily: "monospace",
                        fontSize: "14px",
                        fontStyle: "italic",
                      }}
                    >
                      {hackathon.subtitle}
                    </Card.Subtitle>

                    <Card.Text
                      style={{
                        color: "#cccccc",
                        fontSize: "14px",
                        lineHeight: "1.4",
                      }}
                    >
                      {hackathon.description.substring(0, 120)}...
                    </Card.Text>

                    <div className="mb-3">
                      <div className="d-flex flex-wrap gap-1">
                        {hackathon.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            style={{
                              background: "rgba(0, 255, 255, 0.2)",
                              color: "#00ffff",
                              border: "1px solid #00ffff",
                              fontFamily: "monospace",
                              fontSize: "10px",
                            }}
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div
                      className="mb-3"
                      style={{ fontFamily: "monospace", fontSize: "12px" }}
                    >
                      <div className="d-flex justify-content-between mb-1">
                        <span style={{ color: "#888" }}>BOUNTY:</span>
                        <span style={{ color: "#00ff00", fontWeight: "bold" }}>
                          {formatPrize(hackathon.prizePool)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span style={{ color: "#888" }}>LOCATION:</span>
                        <span style={{ color: "#ffff00" }}>
                          {hackathon.venue}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span style={{ color: "#888" }}>CREW SIZE:</span>
                        <span style={{ color: "#ff00ff" }}>
                          {hackathon.maxTeamSize} MAX
                        </span>
                      </div>
                    </div>

                    <div className="d-grid gap-2">
                      <Button
                        className="cyber-button"
                        size="sm"
                        onClick={() => handleViewDetails(hackathon)}
                      >
                        ACCESS DATA
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleApply(hackathon)}
                        style={{
                          borderColor: "#00ff00",
                          color: "#00ff00",
                          fontFamily: "monospace",
                          fontWeight: "bold",
                        }}
                      >
                        INITIATE CONNECTION
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>

        {/* Detail Modal */}
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="lg"
          centered
        >
          <Modal.Header
            closeButton
            style={{
              background: "linear-gradient(145deg, #1a1a2e, #16213e)",
              border: "1px solid #00ffff",
              color: "#00ffff",
            }}
          >
            <Modal.Title style={{ fontFamily: "monospace" }}>
              {selectedHackathon?.title}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            style={{
              background: "linear-gradient(145deg, #0f0f23, #1a1a2e)",
              color: "#ffffff",
              fontFamily: "monospace",
            }}
          >
            {selectedHackathon && (
              <div>
                <h5 style={{ color: "#ff00ff" }}>
                  {selectedHackathon.subtitle}
                </h5>
                <p>{selectedHackathon.description}</p>

                <Row className="mb-3">
                  <Col md={6}>
                    <strong style={{ color: "#00ffff" }}>Start Date:</strong>
                    <br />
                    {new Date(selectedHackathon.startDate).toLocaleDateString()}
                  </Col>
                  <Col md={6}>
                    <strong style={{ color: "#00ffff" }}>End Date:</strong>
                    <br />
                    {new Date(selectedHackathon.endDate).toLocaleDateString()}
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={6}>
                    <strong style={{ color: "#00ffff" }}>Prize Pool:</strong>
                    <br />
                    <span style={{ color: "#00ff00" }}>
                      {formatPrize(selectedHackathon.prizePool)}
                    </span>
                  </Col>
                  <Col md={6}>
                    <strong style={{ color: "#00ffff" }}>Team Size:</strong>
                    <br />
                    {selectedHackathon.maxTeamSize} members max
                  </Col>
                </Row>

                <div className="mb-3">
                  <strong style={{ color: "#00ffff" }}>Tags:</strong>
                  <br />
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    {selectedHackathon.tags.map((tag) => (
                      <Badge
                        key={tag}
                        style={{
                          background: "rgba(255, 0, 255, 0.2)",
                          color: "#ff00ff",
                          border: "1px solid #ff00ff",
                        }}
                      >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer
            style={{
              background: "linear-gradient(145deg, #1a1a2e, #16213e)",
              border: "1px solid #00ffff",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              style={{ fontFamily: "monospace" }}
            >
              Close
            </Button>
            <Button
              className="cyber-button"
              onClick={() => {
                handleApply(selectedHackathon);
                setShowModal(false);
              }}
            >
              Join Mission
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default Hackathons;
