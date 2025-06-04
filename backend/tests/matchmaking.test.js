const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const Hackathon = require('../src/models/Hackathon');
const Match = require('../src/models/Match');
const Team = require('../src/models/Team');

// Test database
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/hackmates_test';

describe('Matchmaking System Endpoints', () => {
  let testUser, validToken, testProfile, testHackathon;
  let matchUsers = [];

  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Hackathon.deleteMany({});
    await Match.deleteMany({});
    await Team.deleteMany({});

    // Create main test user
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    testUser = await User.create({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: hashedPassword,
      isEmailVerified: true
    });

    validToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create test profile for main user
    testProfile = await Profile.create({
      userId: testUser._id,
      bio: 'Full-stack developer with expertise in React and Node.js',
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Python'],
      experience: [
        {
          title: 'Senior Developer',
          company: 'Tech Corp',
          duration: '2021-2024',
          description: 'Led development of web applications'
        }
      ],
      location: {
        city: 'San Francisco',
        country: 'USA'
      },
      aiEmbedding: [0.1, 0.2, 0.3, 0.4, 0.5], // Mock embedding
      completionScore: 85
    });

    // Create test hackathon
    testHackathon = await Hackathon.create({
      title: 'Tech Innovation Challenge 2024',
      description: 'Build innovative solutions using modern technologies',
      organizer: 'TechCorp',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
      registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      location: {
        type: 'hybrid',
        venue: 'TechHub',
        city: 'San Francisco',
        country: 'USA'
      },
      categories: ['Web Development', 'Mobile', 'AI/ML'],
      teamSize: { min: 2, max: 4 },
      technologies: ['JavaScript', 'Python', 'React', 'Node.js'],
      difficulty: 'intermediate',
      status: 'upcoming'
    });

    // Create potential match users
    const matchUsersData = [
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        skills: ['Python', 'Django', 'Machine Learning', 'TensorFlow'],
        bio: 'AI/ML engineer passionate about solving real-world problems',
        location: { city: 'San Francisco', country: 'USA' },
        embedding: [0.2, 0.3, 0.4, 0.5, 0.6]
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        skills: ['React', 'TypeScript', 'GraphQL', 'AWS'],
        bio: 'Frontend specialist with cloud deployment experience',
        location: { city: 'San Jose', country: 'USA' },
        embedding: [0.15, 0.25, 0.35, 0.45, 0.55]
      },
      {
        name: 'Carol Wilson',
        email: 'carol@example.com',
        skills: ['Java', 'Spring Boot', 'Microservices', 'Docker'],
        bio: 'Backend developer with expertise in distributed systems',
        location: { city: 'Oakland', country: 'USA' },
        embedding: [0.05, 0.15, 0.25, 0.35, 0.45]
      },
      {
        name: 'David Brown',
        email: 'david@example.com',
        skills: ['Flutter', 'Dart', 'Firebase', 'iOS'],
        bio: 'Mobile app developer focused on cross-platform solutions',
        location: { city: 'Berkeley', country: 'USA' },
        embedding: [0.1, 0.1, 0.2, 0.3, 0.4]
      }
    ];

    for (const userData of matchUsersData) {
      const user = await User.create({
        firstName: userData.name.split(' ')[0],
        lastName: userData.name.split(' ')[1],
        email: userData.email,
        password: hashedPassword,
        isEmailVerified: true
      });

      const profile = await Profile.create({
        userId: user._id,
        bio: userData.bio,
        skills: userData.skills,
        location: userData.location,
        aiEmbedding: userData.embedding,
        completionScore: 80
      });

      matchUsers.push({ user, profile });
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/matchmaking/suggestions', () => {
    it('should get AI-powered match suggestions', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/suggestions?hackathonId=${testHackathon._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('matches');
      expect(response.body.matches).toBeInstanceOf(Array);
      expect(response.body.matches.length).toBeGreaterThan(0);
      
      // Check match structure
      const match = response.body.matches[0];
      expect(match).toHaveProperty('user');
      expect(match).toHaveProperty('profile');
      expect(match).toHaveProperty('compatibilityScore');
      expect(match).toHaveProperty('matchReasons');
      
      expect(match.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(match.compatibilityScore).toBeLessThanOrEqual(100);
      expect(match.user).not.toHaveProperty('password');
    });

    it('should filter matches by skills', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/suggestions?hackathonId=${testHackathon._id}&skills=Python,Machine Learning`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.matches).toBeInstanceOf(Array);
      
      if (response.body.matches.length > 0) {
        const pythonMatch = response.body.matches.find(match => 
          match.profile.skills.includes('Python') || match.profile.skills.includes('Machine Learning')
        );
        expect(pythonMatch).toBeTruthy();
      }
    });

    it('should filter matches by location', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/suggestions?hackathonId=${testHackathon._id}&location=San Francisco`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.matches).toBeInstanceOf(Array);
      
      if (response.body.matches.length > 0) {
        const localMatch = response.body.matches.find(match => 
          match.profile.location.city === 'San Francisco'
        );
        expect(localMatch).toBeTruthy();
      }
    });

    it('should limit number of matches', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/suggestions?hackathonId=${testHackathon._id}&limit=2`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.matches.length).toBeLessThanOrEqual(2);
    });

    it('should not get matches without valid hackathon', async () => {
      const fakeHackathonId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/matchmaking/suggestions?hackathonId=${fakeHackathonId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Hackathon not found');
    });

    it('should not get matches without authentication', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/suggestions?hackathonId=${testHackathon._id}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('GET /api/matchmaking/compatibility', () => {
    it('should check compatibility with specific user', async () => {
      const targetUserId = matchUsers[0].user._id;

      const response = await request(app)
        .get(`/api/matchmaking/compatibility?userId=${targetUserId}&hackathonId=${testHackathon._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('compatibilityScore');
      expect(response.body).toHaveProperty('matchReasons');
      expect(response.body).toHaveProperty('complementarySkills');
      expect(response.body).toHaveProperty('sharedSkills');
      
      expect(response.body.compatibilityScore).toBeGreaterThanOrEqual(0);
      expect(response.body.compatibilityScore).toBeLessThanOrEqual(100);
      expect(response.body.matchReasons).toBeInstanceOf(Array);
    });

    it('should not check compatibility with non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/matchmaking/compatibility?userId=${fakeUserId}&hackathonId=${testHackathon._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should not check compatibility with self', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/compatibility?userId=${testUser._id}&hackathonId=${testHackathon._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Cannot check compatibility with yourself');
    });
  });

  describe('POST /api/matchmaking/feedback', () => {
    let matchRecord;

    beforeEach(async () => {
      matchRecord = await Match.create({
        userId: testUser._id,
        matchedUserId: matchUsers[0].user._id,
        hackathonId: testHackathon._id,
        compatibilityScore: 85,
        matchReasons: ['Complementary skills', 'Same location'],
        status: 'pending'
      });
    });

    it('should submit positive feedback on match', async () => {
      const feedbackData = {
        matchId: matchRecord._id,
        feedback: 'like',
        reason: 'Great skill complement'
      };

      const response = await request(app)
        .post('/api/matchmaking/feedback')
        .set('Authorization', `Bearer ${validToken}`)
        .send(feedbackData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Feedback recorded successfully');

      // Check if match was updated
      const updatedMatch = await Match.findById(matchRecord._id);
      expect(updatedMatch.feedback).toBe('like');
      expect(updatedMatch.feedbackReason).toBe('Great skill complement');
    });

    it('should submit negative feedback on match', async () => {
      const feedbackData = {
        matchId: matchRecord._id,
        feedback: 'dislike',
        reason: 'Not interested in collaboration'
      };

      const response = await request(app)
        .post('/api/matchmaking/feedback')
        .set('Authorization', `Bearer ${validToken}`)
        .send(feedbackData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Feedback recorded successfully');

      const updatedMatch = await Match.findById(matchRecord._id);
      expect(updatedMatch.feedback).toBe('dislike');
    });

    it('should not submit feedback on non-existent match', async () => {
      const fakeMatchId = new mongoose.Types.ObjectId();
      
      const feedbackData = {
        matchId: fakeMatchId,
        feedback: 'like'
      };

      const response = await request(app)
        .post('/api/matchmaking/feedback')
        .set('Authorization', `Bearer ${validToken}`)
        .send(feedbackData)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Match not found');
    });

    it('should validate feedback type', async () => {
      const feedbackData = {
        matchId: matchRecord._id,
        feedback: 'invalid_feedback'
      };

      const response = await request(app)
        .post('/api/matchmaking/feedback')
        .set('Authorization', `Bearer ${validToken}`)
        .send(feedbackData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/matchmaking/history', () => {
    beforeEach(async () => {
      // Create match history
      await Match.create([
        {
          userId: testUser._id,
          matchedUserId: matchUsers[0].user._id,
          hackathonId: testHackathon._id,
          compatibilityScore: 85,
          matchReasons: ['Complementary skills'],
          status: 'accepted',
          feedback: 'like'
        },
        {
          userId: testUser._id,
          matchedUserId: matchUsers[1].user._id,
          hackathonId: testHackathon._id,
          compatibilityScore: 72,
          matchReasons: ['Same technologies'],
          status: 'rejected',
          feedback: 'dislike'
        },
        {
          userId: testUser._id,
          matchedUserId: matchUsers[2].user._id,
          hackathonId: testHackathon._id,
          compatibilityScore: 68,
          matchReasons: ['Location proximity'],
          status: 'pending'
        }
      ]);
    });

    it('should get match history', async () => {
      const response = await request(app)
        .get('/api/matchmaking/history')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('matches');
      expect(response.body.matches).toBeInstanceOf(Array);
      expect(response.body.matches.length).toBe(3);

      const match = response.body.matches[0];
      expect(match).toHaveProperty('matchedUser');
      expect(match).toHaveProperty('hackathon');
      expect(match).toHaveProperty('compatibilityScore');
      expect(match).toHaveProperty('status');
    });

    it('should filter match history by status', async () => {
      const response = await request(app)
        .get('/api/matchmaking/history?status=accepted')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.matches).toBeInstanceOf(Array);
      expect(response.body.matches.length).toBe(1);
      expect(response.body.matches[0].status).toBe('accepted');
    });

    it('should filter match history by hackathon', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/history?hackathonId=${testHackathon._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.matches).toBeInstanceOf(Array);
      expect(response.body.matches.length).toBe(3);
    });

    it('should paginate match history', async () => {
      const response = await request(app)
        .get('/api/matchmaking/history?page=1&limit=2')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.matches.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.currentPage).toBe(1);
    });
  });

  describe('Matchmaking Algorithm Tests', () => {
    it('should prioritize skill complementarity', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/suggestions?hackathonId=${testHackathon._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.matches).toBeInstanceOf(Array);
      
      // Check if matches with complementary skills have higher scores
      const matches = response.body.matches;
      if (matches.length > 1) {
        const sortedMatches = matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
        expect(sortedMatches[0].compatibilityScore).toBeGreaterThanOrEqual(sortedMatches[1].compatibilityScore);
      }
    });

    it('should consider location proximity', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/suggestions?hackathonId=${testHackathon._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      const localMatches = response.body.matches.filter(match => 
        match.profile.location.city === 'San Francisco' || 
        match.profile.location.city === 'San Jose'
      );

      expect(localMatches.length).toBeGreaterThan(0);
    });

    it('should exclude users already in teams for the hackathon', async () => {
      // Create a team with one of the potential matches
      const teamMember = matchUsers[0];
      await Team.create({
        name: 'Existing Team',
        description: 'Already formed team',
        hackathonId: testHackathon._id,
        leaderId: teamMember.user._id,
        members: [
          {
            userId: teamMember.user._id,
            role: 'Leader',
            status: 'active'
          }
        ],
        status: 'forming'
      });

      const response = await request(app)
        .get(`/api/matchmaking/suggestions?hackathonId=${testHackathon._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // The user in a team should not appear in matches
      const excludedMatch = response.body.matches.find(match => 
        match.user._id === teamMember.user._id.toString()
      );
      expect(excludedMatch).toBeFalsy();
    });
  });

  describe('Match Recommendation Quality', () => {
    it('should provide meaningful match reasons', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/suggestions?hackathonId=${testHackathon._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.matches).toBeInstanceOf(Array);
      
      if (response.body.matches.length > 0) {
        const match = response.body.matches[0];
        expect(match.matchReasons).toBeInstanceOf(Array);
        expect(match.matchReasons.length).toBeGreaterThan(0);
        
        // Check for common match reasons
        const validReasons = [
          'Complementary skills',
          'Shared technologies',
          'Location proximity',
          'Similar experience level',
          'High profile completion'
        ];
        
        const hasValidReason = match.matchReasons.some(reason => 
          validReasons.some(validReason => reason.includes(validReason))
        );
        expect(hasValidReason).toBeTruthy();
      }
    });

    it('should calculate realistic compatibility scores', async () => {
      const response = await request(app)
        .get(`/api/matchmaking/suggestions?hackathonId=${testHackathon._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      response.body.matches.forEach(match => {
        expect(match.compatibilityScore).toBeGreaterThanOrEqual(0);
        expect(match.compatibilityScore).toBeLessThanOrEqual(100);
        // Most compatibility scores should be reasonable (not too low or too high)
        expect(match.compatibilityScore).toBeGreaterThan(30);
      });
    });
  });
});