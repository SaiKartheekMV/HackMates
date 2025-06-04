const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const app = require('../src/app');
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');

// Test database
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/hackmates_test';

describe('Profile Management Endpoints', () => {
  let testUser, validToken, testProfile;

  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Profile.deleteMany({});

    // Create test user
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

    // Create test profile
    testProfile = await Profile.create({
      userId: testUser._id,
      bio: 'Software developer with 3 years of experience',
      skills: ['JavaScript', 'React', 'Node.js'],
      location: {
        city: 'San Francisco',
        country: 'USA'
      },
      completionScore: 50
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/profiles/me', () => {
    it('should get current user profile', async () => {
      const response = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId', testUser._id.toString());
      expect(response.body).toHaveProperty('bio', 'Software developer with 3 years of experience');
      expect(response.body.skills).toEqual(['JavaScript', 'React', 'Node.js']);
      expect(response.body.location.city).toBe('San Francisco');
    });

    it('should create empty profile if none exists', async () => {
      // Delete existing profile
      await Profile.deleteOne({ userId: testUser._id });

      const response = await request(app)
        .get('/api/profiles/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId', testUser._id.toString());
      expect(response.body).toHaveProperty('completionScore', 0);
      expect(response.body.skills).toEqual([]);
    });

    it('should not get profile without authentication', async () => {
      const response = await request(app)
        .get('/api/profiles/me')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('PUT /api/profiles/me', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        bio: 'Full-stack developer with expertise in modern web technologies',
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB'],
        experience: [
          {
            title: 'Senior Developer',
            company: 'Tech Corp',
            duration: '2021-2024',
            description: 'Led development of multiple web applications'
          }
        ],
        education: [
          {
            degree: 'Computer Science',
            institution: 'Stanford University',
            year: 2020
          }
        ],
        projects: [
          {
            name: 'E-commerce Platform',
            description: 'Built a full-stack e-commerce solution',
            technologies: ['React', 'Node.js', 'MongoDB'],
            githubUrl: 'https://github.com/user/ecommerce',
            liveUrl: 'https://ecommerce-demo.com'
          }
        ],
        socialLinks: {
          github: 'https://github.com/johndoe',
          linkedin: 'https://linkedin.com/in/johndoe',
          portfolio: 'https://johndoe.dev'
        },
        location: {
          city: 'New York',
          country: 'USA'
        }
      };

      const response = await request(app)
        .put('/api/profiles/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Profile updated successfully');
      expect(response.body.profile.bio).toBe(updateData.bio);
      expect(response.body.profile.skills).toEqual(updateData.skills);
      expect(response.body.profile.experience[0].title).toBe('Senior Developer');
      expect(response.body.profile.location.city).toBe('New York');
      expect(response.body.profile.completionScore).toBeGreaterThan(50);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        experience: [
          {
            // Missing required title
            company: 'Tech Corp',
            duration: '2021-2024'
          }
        ]
      };

      const response = await request(app)
        .put('/api/profiles/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate social links format', async () => {
      const invalidData = {
        socialLinks: {
          github: 'not-a-url',
          linkedin: 'https://linkedin.com/in/valid'
        }
      };

      const response = await request(app)
        .put('/api/profiles/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not update profile without authentication', async () => {
      const updateData = {
        bio: 'Updated bio'
      };

      const response = await request(app)
        .put('/api/profiles/me')
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('GET /api/profiles/:userId', () => {
    let anotherUser, anotherProfile;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      anotherUser = await User.create({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        password: hashedPassword,
        isEmailVerified: true
      });

      anotherProfile = await Profile.create({
        userId: anotherUser._id,
        bio: 'Frontend developer passionate about UX',
        skills: ['React', 'Vue.js', 'CSS', 'JavaScript'],
        location: {
          city: 'Los Angeles',
          country: 'USA'
        },
        completionScore: 70
      });
    });

    it('should get public profile of another user', async () => {
      const response = await request(app)
        .get(`/api/profiles/${anotherUser._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId', anotherUser._id.toString());
      expect(response.body).toHaveProperty('bio', 'Frontend developer passionate about UX');
      expect(response.body.skills).toEqual(['React', 'Vue.js', 'CSS', 'JavaScript']);
      expect(response.body.user.firstName).toBe('Jane');
      expect(response.body.user.lastName).toBe('Smith');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not get profile of non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/profiles/${fakeUserId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Profile not found');
    });

    it('should not get profile with invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/profiles/invalid-id')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not get profile without authentication', async () => {
      const response = await request(app)
        .get(`/api/profiles/${anotherUser._id}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('POST /api/profiles/upload-resume', () => {
    // Create a mock PDF file for testing
    const createMockPDF = () => {
      const mockPDFContent = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000125 00000 n \n0000000230 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n323\n%%EOF');
      return mockPDFContent;
    };

    it('should upload and parse resume successfully', async () => {
      const mockPDF = createMockPDF();

      const response = await request(app)
        .post('/api/profiles/upload-resume')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('resume', mockPDF, 'resume.pdf')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Resume uploaded and parsed successfully');
      expect(response.body).toHaveProperty('resumeUrl');
    });

    it('should not upload invalid file type', async () => {
      const mockTextFile = Buffer.from('This is not a PDF file');

      const response = await request(app)
        .post('/api/profiles/upload-resume')
        .set('Authorization', `Bearer ${validToken}`)
        .attach('resume', mockTextFile, 'resume.txt')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not upload file without authentication', async () => {
      const mockPDF = createMockPDF();

      const response = await request(app)
        .post('/api/profiles/upload-resume')
        .attach('resume', mockPDF, 'resume.pdf')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should not upload without file', async () => {
      const response = await request(app)
        .post('/api/profiles/upload-resume')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Profile Completion Score Calculation', () => {
    it('should calculate completion score correctly', async () => {
      const completeProfileData = {
        bio: 'Complete bio with detailed information about experience and skills',
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB'],
        experience: [
          {
            title: 'Senior Developer',
            company: 'Tech Corp',
            duration: '2021-2024',
            description: 'Led development of multiple web applications'
          }
        ],
        education: [
          {
            degree: 'Computer Science',
            institution: 'Stanford University',
            year: 2020
          }
        ],
        projects: [
          {
            name: 'E-commerce Platform',
            description: 'Built a full-stack e-commerce solution',
            technologies: ['React', 'Node.js', 'MongoDB'],
            githubUrl: 'https://github.com/user/ecommerce'
          }
        ],
        socialLinks: {
          github: 'https://github.com/johndoe',
          linkedin: 'https://linkedin.com/in/johndoe',
          portfolio: 'https://johndoe.dev'
        },
        location: {
          city: 'New York',
          country: 'USA'
        }
      };

      const response = await request(app)
        .put('/api/profiles/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send(completeProfileData)
        .expect(200);

      expect(response.body.profile.completionScore).toBeGreaterThan(90);
    });

    it('should have low completion score for minimal profile', async () => {
      const minimalProfileData = {
        bio: 'Short bio'
      };

      const response = await request(app)
        .put('/api/profiles/me')
        .set('Authorization', `Bearer ${validToken}`)
        .send(minimalProfileData)
        .expect(200);

      expect(response.body.profile.completionScore).toBeLessThan(30);
    });
  });

  describe('Profile Search and Filtering', () => {
    let profiles = [];

    beforeEach(async () => {
      // Create multiple users and profiles for search testing
      const users = [
        {
          firstName: 'Alice',
          lastName: 'Johnson',
          email: 'alice@example.com',
          skills: ['Python', 'Django', 'Machine Learning'],
          location: { city: 'Boston', country: 'USA' }
        },
        {
          firstName: 'Bob',
          lastName: 'Wilson',
          email: 'bob@example.com',
          skills: ['Java', 'Spring', 'Microservices'],
          location: { city: 'Seattle', country: 'USA' }
        },
        {
          firstName: 'Carol',
          lastName: 'Davis',
          email: 'carol@example.com',
          skills: ['React', 'JavaScript', 'TypeScript'],
          location: { city: 'Austin', country: 'USA' }
        }
      ];

      for (const userData of users) {
        const hashedPassword = await bcrypt.hash('Password123!', 10);
        const user = await User.create({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: hashedPassword,
          isEmailVerified: true
        });

        const profile = await Profile.create({
          userId: user._id,
          skills: userData.skills,
          location: userData.location,
          bio: `I'm ${userData.firstName}, a developer specializing in ${userData.skills.join(', ')}`,
          completionScore: 75
        });

        profiles.push({ user, profile });
      }
    });

    it('should search profiles by skills', async () => {
      const response = await request(app)
        .get('/api/profiles/search?skills=Python,Machine Learning')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.profiles).toHaveLength(1);
      expect(response.body.profiles[0].user.firstName).toBe('Alice');
    });

    it('should search profiles by location', async () => {
      const response = await request(app)
        .get('/api/profiles/search?city=Seattle')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.profiles).toHaveLength(1);
      expect(response.body.profiles[0].user.firstName).toBe('Bob');
    });

    it('should paginate search results', async () => {
      const response = await request(app)
        .get('/api/profiles/search?limit=2&page=1')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.profiles.length).toBeLessThanOrEqual(2);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('currentPage', 1);
      expect(response.body.pagination).toHaveProperty('totalPages');
    });
  });
});