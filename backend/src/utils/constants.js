// src/utils/constants.js
// ==============================================

// User roles
const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Request status
const REQUEST_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
};

// Request types
const REQUEST_TYPES = {
  TEAMMATE: 'teammate',
  TEAM_INVITE: 'team_invite'
};

// Team status
const TEAM_STATUS = {
  FORMING: 'forming',
  COMPLETE: 'complete',
  COMPETING: 'competing'
};

// Hackathon status
const HACKATHON_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed'
};

// Hackathon location types
const LOCATION_TYPES = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  HYBRID: 'hybrid'
};

// Difficulty levels
const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
};

// Profile visibility
const VISIBILITY_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private'
};

// Common skill categories
const SKILL_CATEGORIES = {
  FRONTEND: [
    'React', 'Vue.js', 'Angular', 'HTML', 'CSS', 'JavaScript', 'TypeScript',
    'Svelte', 'Next.js', 'Nuxt.js', 'Tailwind CSS', 'Bootstrap', 'SASS'
  ],
  BACKEND: [
    'Node.js', 'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
    'Express.js', 'Django', 'Flask', 'Spring Boot', '.NET', 'Laravel'
  ],
  DATABASE: [
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
    'SQLite', 'Oracle', 'Cassandra', 'DynamoDB'
  ],
  MOBILE: [
    'React Native', 'Flutter', 'Swift', 'Kotlin', 'Ionic',
    'Xamarin', 'Cordova', 'iOS', 'Android'
  ],
  DEVOPS: [
    'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Jenkins',
    'GitLab CI', 'Terraform', 'Ansible', 'Linux'
  ],
  AI_ML: [
    'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy',
    'OpenCV', 'NLP', 'Computer Vision', 'Deep Learning'
  ],
  DESIGN: [
    'UI/UX', 'Figma', 'Adobe XD', 'Photoshop', 'Illustrator',
    'Sketch', 'InVision', 'Wireframing', 'Prototyping'
  ]
};

// Common hackathon categories
const HACKATHON_CATEGORIES = [
  'Web Development',
  'Mobile App',
  'AI/Machine Learning',
  'Blockchain',
  'IoT',
  'Game Development',
  'Fintech',
  'Healthcare',
  'Education',
  'Social Impact',
  'Cybersecurity',
  'AR/VR',
  'Data Science',
  'Climate Tech'
];

// API response messages
const RESPONSE_MESSAGES = {
  SUCCESS: {
    USER_CREATED: 'User created successfully',
    USER_UPDATED: 'User updated successfully',
    USER_DELETED: 'User deleted successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    PROFILE_UPDATED: 'Profile updated successfully',
    TEAM_CREATED: 'Team created successfully',
    TEAM_UPDATED: 'Team updated successfully',
    REQUEST_SENT: 'Request sent successfully',
    REQUEST_ACCEPTED: 'Request accepted successfully',
    REQUEST_REJECTED: 'Request rejected successfully',
    PASSWORD_RESET: 'Password reset successfully',
    EMAIL_VERIFIED: 'Email verified successfully'
  },
  ERROR: {
    USER_NOT_FOUND: 'User not found',
    INVALID_CREDENTIALS: 'Invalid credentials',
    EMAIL_EXISTS: 'Email already exists',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    VALIDATION_ERROR: 'Validation error',
    SERVER_ERROR: 'Internal server error',
    TEAM_FULL: 'Team is already full',
    REQUEST_EXISTS: 'Request already exists',
    INVALID_TOKEN: 'Invalid or expired token',
    FILE_UPLOAD_ERROR: 'File upload failed',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded'
  }
};

// Validation rules
const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true
  },
  TEAM: {
    MIN_MEMBERS: 1,
    MAX_MEMBERS: 6,
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 500
  },
  PROFILE: {
    BIO_MAX_LENGTH: 1000,
    SKILLS_MAX_COUNT: 50,
    PROJECTS_MAX_COUNT: 20,
    EXPERIENCE_MAX_COUNT: 10
  },
  FILE_UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['pdf', 'doc', 'docx'],
    ALLOWED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif']
  }
};

// Cache keys
const CACHE_KEYS = {
  USER_MATCHES: (userId) => `matches:${userId}`,
  USER_PROFILE: (userId) => `profile:${userId}`,
  HACKATHON_LIST: 'hackathons:list',
  TEAM_MEMBERS: (teamId) => `team:${teamId}:members`,
  USER_REQUESTS: (userId) => `requests:${userId}`
};

// Cache TTL (Time To Live) in seconds
const CACHE_TTL = {
  USER_MATCHES: 3600, // 1 hour
  USER_PROFILE: 1800, // 30 minutes
  HACKATHON_LIST: 1800, // 30 minutes
  TEAM_MEMBERS: 600, // 10 minutes
  USER_REQUESTS: 300 // 5 minutes
};

// Queue job types
const QUEUE_JOBS = {
  RESUME_PROCESSING: 'resume_processing',
  MATCH_UPDATE: 'match_update',
  NOTIFICATION_SEND: 'notification_send',
  PROFILE_EMBEDDING: 'profile_embedding'
};

// Socket events
const SOCKET_EVENTS = {
  NOTIFICATION: 'notification',
  TEAM_UPDATE: 'team_update',
  REQUEST_RECEIVED: 'request_received',
  MATCH_FOUND: 'match_found',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline'
};

// Default pagination
const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
};

// Time constants (in milliseconds)
const TIME_CONSTANTS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000
};

// Rate limiting windows
const RATE_LIMITS = {
  AUTH: {
    WINDOW: 15 * TIME_CONSTANTS.MINUTE,
    MAX_ATTEMPTS: 5
  },
  API: {
    WINDOW: 15 * TIME_CONSTANTS.MINUTE,
    MAX_REQUESTS: 100
  },
  UPLOAD: {
    WINDOW: TIME_CONSTANTS.HOUR,
    MAX_UPLOADS: 10
  }
};

module.exports = {
  USER_ROLES,
  REQUEST_STATUS,
  REQUEST_TYPES,
  TEAM_STATUS,
  HACKATHON_STATUS,
  LOCATION_TYPES,
  DIFFICULTY_LEVELS,
  VISIBILITY_TYPES,
  SKILL_CATEGORIES,
  HACKATHON_CATEGORIES,
  RESPONSE_MESSAGES,
  VALIDATION_RULES,
  CACHE_KEYS,
  CACHE_TTL,
  QUEUE_JOBS,
  SOCKET_EVENTS,
  DEFAULT_PAGINATION,
  TIME_CONSTANTS,
  RATE_LIMITS
};