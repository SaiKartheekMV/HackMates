const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const Team = require('../src/models/Team');
const Hackathon = require('../src/models/Hackathon');

// Test database
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/hackmates_test';

describe('Team Management Endpoints', () => {
  let testUser, validToken, testHackathon, testTeam;
  let teamMembers = [];

  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Team.deleteMany({});
    await Hackathon.deleteMany({});

    // Create test user (team leader)
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
    await Profile.create({
      userId: testUser._id,
      bio: 'Team leader with full-stack experience',
      skills: ['JavaScript', 'React', 'Node.js', 'Leadership'],
      completionScore: 90
    });

    // Create test hackathon
    testHackathon = await Hackathon.create({
      title: 'Innovation Hackathon 2024',
      description: 'Build innovative solutions',
      organizer: 'TechCorp',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      location: {
        type: 'hybrid',
        venue: 'TechHub',
        city: 'San Francisco',
        country: 'USA'
      },
      teamSize: { min: 2, max: 4 },
      status: 'upcoming'
    });

    // Create potential team members
    const memberData = [
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        skills: ['Python', 'Machine Learning', 'Data Science']
      },
      {
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        skills: ['React', 'TypeScript', 'UI/UX']
      },
      {
        firstName: 'Carol',
        lastName: 'Wilson',
        email: 'carol@example.com',
        skills: ['Java', 'Spring', 'Backend Development']
      }
    ];

    for (const member of memberData) {
      const user = await User.create({
        ...member,
        password: hashedPassword,
        isEmailVerified: true
      });

      await Profile.create({
        userId: user._id,
        bio: `${member.firstName} - Developer specializing in ${member.skills.join(', ')}`,
        skills: member.skills,
        completionScore: 75
      });

      teamMembers.push(user);
    }

    // Create a test team
    testTeam = await Team.create({
      name: 'Innovation Squad',
      description: 'A team focused on building innovative solutions',
      hackathonId: testHackathon._id,
      leaderId: testUser._id,
      members: [
        {
          userId: testUser._id,
          role: 'Leader',
          status: 'active'
        }
      ],
      requiredSkills: ['JavaScript', 'Python', 'UI/UX'],
      maxMembers: 4,
      isPublic: true,
      status: 'forming'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/teams/my', () => {
    it('should get user teams', async () => {
      const response = await request(app)
        .get('/api/teams/my')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('teams');
      expect(response.body.teams).toBeInstanceOf(Array);
      expect(response.body.teams.length).toBe(1);
      
      const team = response.body.teams[0];
      expect(team.name).toBe('Innovation Squad');
      expect(team.leaderId.toString()).toBe(testUser._id.toString());
      expect(team.members).toHaveLength(1);
      expect(team.hackathon).toHaveProperty('title', 'Innovation Hackathon 2024');
    });

    it('should return empty array when user has no teams', async () => {
      // Create a new user with no teams
      const newUser = await User.create({
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        password: await bcrypt.hash('Password123!', 10),
        isEmailVerified: true
      });

      const newToken = jwt.sign(
        { userId: newUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/teams/my')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(200);

      expect(response.body.teams).toEqual([]);
    });

    it('should not get teams without authentication', async () => {
      const response = await request(app)
        .get('/api/teams/my')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });
  });

  describe('POST /api/teams', () => {
    it('should create a new team', async () => {
      const teamData = {
        name: 'AI Innovators',
        description: 'Team focused on AI and machine learning solutions',
        hackathonId: testHackathon._id,
        requiredSkills: ['Python', 'Machine Learning', 'TensorFlow'],
        maxMembers: 3,
        isPublic: true
      };

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${validToken}`)
        .send(teamData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Team created successfully');
      expect(response.body.team.name).toBe(teamData.name);
      expect(response.body.team.leaderId.toString()).toBe(testUser._id.toString());
      expect(response.body.team.members).toHaveLength(1);
      expect(response.body.team.members[0].role).toBe('Leader');
      expect(response.body.team.status).toBe('forming');
    });

    it('should not create team with invalid hackathon', async () => {
      const teamData = {
        name: 'Invalid Team',
        description: 'Team with invalid hackathon',
        hackathonId: new mongoose.Types.ObjectId(),
        maxMembers: 4
      };

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${validToken}`)
        .send(teamData)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Hackathon not found');
    });

    it('should not create team with missing required fields', async () => {
      const teamData = {
        name: 'Incomplete Team'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${validToken}`)
        .send(teamData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should not create duplicate team for same hackathon', async () => {
      const teamData = {
        name: 'Duplicate Team',
        description: 'Another team for same hackathon',
        hackathonId: testHackathon._id,
        maxMembers: 4
      };

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${validToken}`)
        .send(teamData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'You already have a team for this hackathon');
    });

    it('should not create team without authentication', async () => {
      const teamData = {
        name: 'Unauthorized Team',
        description: 'Team without auth',
        hackathonId: testHackathon._id,
        maxMembers: 4
      };

      const response = await request(app)
        .post('/api/teams')
        .send(teamData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    it('should not create team with invalid max members', async () => {
      const teamData = {
        name: 'Invalid Size Team',
        description: 'Team with invalid size',
        hackathonId: testHackathon._id,
        maxMembers: 10 // Exceeds hackathon max
      };

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${validToken}`)
        .send(teamData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('exceeds hackathon maximum');
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should get team details', async () => {
      const response = await request(app)
        .get(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.team.name).toBe('Innovation Squad');
      expect(response.body.team.members).toHaveLength(1);
      expect(response.body.team.hackathon).toHaveProperty('title');
      expect(response.body.team.leader).toHaveProperty('firstName', 'John');
    });

    it('should not get team with invalid ID', async () => {
      const response = await request(app)
        .get(`/api/teams/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Team not found');
    });

    it('should not get private team details if not a member', async () => {
      // Make team private
      await Team.findByIdAndUpdate(testTeam._id, { isPublic: false });

      // Create another user
      const otherUser = await User.create({
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        password: await bcrypt.hash('Password123!', 10),
        isEmailVerified: true
      });

      const otherToken = jwt.sign(
        { userId: otherUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Access denied to private team');
    });
  });

  describe('PUT /api/teams/:id', () => {
    it('should update team as leader', async () => {
      const updateData = {
        name: 'Updated Innovation Squad',
        description: 'Updated description',
        requiredSkills: ['JavaScript', 'Python', 'React', 'MongoDB']
      };

      const response = await request(app)
        .put(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.team.name).toBe(updateData.name);
      expect(response.body.team.description).toBe(updateData.description);
      expect(response.body.team.requiredSkills).toEqual(updateData.requiredSkills);
    });

    it('should not update team if not leader', async () => {
      const memberToken = jwt.sign(
        { userId: teamMembers[0]._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const updateData = {
        name: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Only team leader can update team');
    });

    it('should not update team with invalid max members', async () => {
      const updateData = {
        maxMembers: 1 // Less than current members
      };

      const response = await request(app)
        .put(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('current member count');
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('should delete team as leader', async () => {
      const response = await request(app)
        .delete(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Team deleted successfully');

      // Verify team is actually deleted
      const deletedTeam = await Team.findById(testTeam._id);
      expect(deletedTeam).toBeNull();
    });

    it('should not delete team if not leader', async () => {
      const memberToken = jwt.sign(
        { userId: teamMembers[0]._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .delete(`/api/teams/${testTeam._id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Only team leader can delete team');
    });

    it('should not delete non-existent team', async () => {
      const response = await request(app)
        .delete(`/api/teams/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Team not found');
    });
  });

  describe('POST /api/teams/:id/join', () => {
    beforeEach(async () => {
      // Ensure team is public for join tests
      await Team.findByIdAndUpdate(testTeam._id, { isPublic: true });
    });

    it('should join public team', async () => {
      const memberToken = jwt.sign(
        { userId: teamMembers[0]._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/join`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Successfully joined team');
      
      // Verify member was added
      const updatedTeam = await Team.findById(testTeam._id);
      expect(updatedTeam.members).toHaveLength(2);
      expect(updatedTeam.members.some(m => m.userId.toString() === teamMembers[0]._id.toString())).toBe(true);
    });

    it('should not join private team', async () => {
      await Team.findByIdAndUpdate(testTeam._id, { isPublic: false });

      const memberToken = jwt.sign(
        { userId: teamMembers[0]._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/join`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Cannot join private team without invitation');
    });

    it('should not join team if already a member', async () => {
      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/join`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'You are already a member of this team');
    });

    it('should not join full team', async () => {
      // Fill the team to max capacity
      await Team.findByIdAndUpdate(testTeam._id, {
        maxMembers: 1 // Current team has 1 member (leader)
      });

      const memberToken = jwt.sign(
        { userId: teamMembers[0]._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/join`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Team is already full');
    });

    it('should not join team for hackathon with existing team', async () => {
      // Create another team for the same hackathon with the member as leader
      const memberTeam = await Team.create({
        name: 'Member Team',
        description: 'Team led by member',
        hackathonId: testHackathon._id,
        leaderId: teamMembers[0]._id,
        members: [{
          userId: teamMembers[0]._id,
          role: 'Leader',
          status: 'active'
        }],
        maxMembers: 4,
        isPublic: true,
        status: 'forming'
      });

      const memberToken = jwt.sign(
        { userId: teamMembers[0]._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/join`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'You already have a team for this hackathon');
    });
  });

  describe('POST /api/teams/:id/leave', () => {
    beforeEach(async () => {
      // Add a member to the team
      await Team.findByIdAndUpdate(testTeam._id, {
        $push: {
          members: {
            userId: teamMembers[0]._id,
            role: 'Member',
            status: 'active',
            joinedAt: new Date()
          }
        }
      });
    });

    it('should leave team as member', async () => {
      const memberToken = jwt.sign(
        { userId: teamMembers[0]._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/leave`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Successfully left team');

      // Verify member was removed
      const updatedTeam = await Team.findById(testTeam._id);
      const activeMember = updatedTeam.members.find(m => 
        m.userId.toString() === teamMembers[0]._id.toString() && m.status === 'active'
      );
      expect(activeMember).toBeUndefined();
    });

    it('should not leave team as leader', async () => {
      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/leave`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Team leader cannot leave. Transfer leadership or delete team.');
    });

    it('should not leave team if not a member', async () => {
      const nonMemberToken = jwt.sign(
        { userId: teamMembers[1]._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post(`/api/teams/${testTeam._id}/leave`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'You are not a member of this team');
    });
  });

  describe('PUT /api/teams/:id/transfer-leadership', () => {
    beforeEach(async () => {
      // Add a member to the team
      await Team.findByIdAndUpdate(testTeam._id, {
        $push: {
          members: {
            userId: teamMembers[0]._id,
            role: 'Member',
            status: 'active',
            joinedAt: new Date()
          }
        }
      });
    });

    it('should transfer leadership to team member', async () => {
      const transferData = {
        newLeaderId: teamMembers[0]._id
      };

      const response = await request(app)
        .put(`/api/teams/${testTeam._id}/transfer-leadership`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(transferData)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Leadership transferred successfully');

      // Verify leadership transfer
      const updatedTeam = await Team.findById(testTeam._id);
      expect(updatedTeam.leaderId.toString()).toBe(teamMembers[0]._id.toString());
      
      const newLeader = updatedTeam.members.find(m => m.userId.toString() === teamMembers[0]._id.toString());
      expect(newLeader.role).toBe('Leader');
      
      const oldLeader = updatedTeam.members.find(m => m.userId.toString() === testUser._id.toString());
      expect(oldLeader.role).toBe('Member');
    });

    it('should not transfer leadership if not current leader', async () => {
      const memberToken = jwt.sign(
        { userId: teamMembers[0]._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const transferData = {
        newLeaderId: teamMembers[1]._id
      };

      const response = await request(app)
        .put(`/api/teams/${testTeam._id}/transfer-leadership`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(transferData)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Only team leader can transfer leadership');
    });

    it('should not transfer leadership to non-member', async () => {
      const transferData = {
        newLeaderId: teamMembers[1]._id // Not a team member
      };

      const response = await request(app)
        .put(`/api/teams/${testTeam._id}/transfer-leadership`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(transferData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'New leader must be a team member');
    });

    it('should not transfer leadership to self', async () => {
      const transferData = {
        newLeaderId: testUser._id
      };

      const response = await request(app)
        .put(`/api/teams/${testTeam._id}/transfer-leadership`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(transferData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Cannot transfer leadership to yourself');
    });
  });

  describe('GET /api/teams/search', () => {
    beforeEach(async () => {
      // Create additional teams for search testing
      await Team.create({
        name: 'Web Development Team',
        description: 'Frontend and backend web development',
        hackathonId: testHackathon._id,
        leaderId: teamMembers[0]._id,
        members: [{
          userId: teamMembers[0]._id,
          role: 'Leader',
          status: 'active'
        }],
        requiredSkills: ['HTML', 'CSS', 'JavaScript', 'Node.js'],
        maxMembers: 3,
        isPublic: true,
        status: 'forming'
      });

      await Team.create({
        name: 'AI Research Team',
        description: 'Machine learning and AI research',
        hackathonId: testHackathon._id,
        leaderId: teamMembers[1]._id,
        members: [{
          userId: teamMembers[1]._id,
          role: 'Leader',
          status: 'active'
        }],
        requiredSkills: ['Python', 'TensorFlow', 'Machine Learning'],
        maxMembers: 2,
        isPublic: false, // Private team
        status: 'forming'
      });
    });

    it('should search teams by name', async () => {
      const response = await request(app)
        .get('/api/teams/search')
        .query({ 
          hackathonId: testHackathon._id,
          search: 'Innovation'
        })
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.teams).toHaveLength(1);
      expect(response.body.teams[0].name).toBe('Innovation Squad');
    });

    it('should search teams by skills', async () => {
      const response = await request(app)
        .get('/api/teams/search')
        .query({ 
          hackathonId: testHackathon._id,
          skills: 'JavaScript,Node.js'
        })
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.teams.length).toBeGreaterThan(0);
      const teamNames = response.body.teams.map(t => t.name);
      expect(teamNames).toContain('Innovation Squad');
      expect(teamNames).toContain('Web Development Team');
    });

    it('should only return public teams for non-members', async () => {
      const response = await request(app)
        .get('/api/teams/search')
        .query({ hackathonId: testHackathon._id })
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // Should not include the private AI Research Team
      const teamNames = response.body.teams.map(t => t.name);
      expect(teamNames).not.toContain('AI Research Team');
    });

    it('should filter teams by availability', async () => {
      const response = await request(app)
        .get('/api/teams/search')
        .query({ 
          hackathonId: testHackathon._id,
          availableOnly: 'true'
        })
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      // All teams should have space available
      response.body.teams.forEach(team => {
        expect(team.members.length).toBeLessThan(team.maxMembers);
      });
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/teams/search')
        .query({ 
          hackathonId: testHackathon._id,
          page: 1,
          limit: 1
        })
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.teams).toHaveLength(1);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/teams/:id/recommendations', () => {
    it('should get user recommendations for team', async () => {
      const response = await request(app)
        .get(`/api/teams/${testTeam._id}/recommendations`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('recommendations');
      expect(response.body.recommendations).toBeInstanceOf(Array);
      
      // Should recommend users with matching skills
      const recommendations = response.body.recommendations;
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('user');
        expect(rec).toHaveProperty('matchScore');
        expect(rec).toHaveProperty('matchingSkills');
      });
    });

    it('should not get recommendations if not team leader', async () => {
      const memberToken = jwt.sign(
        { userId: teamMembers[0]._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get(`/api/teams/${testTeam._id}/recommendations`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Only team leader can view recommendations');
    });
  });
});