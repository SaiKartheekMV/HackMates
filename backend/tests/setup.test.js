const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

// Global test setup
let mongoServer;

beforeAll(async () => {
  // Start in-memory MongoDB instance for testing
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_EXPIRE = '1d';
  process.env.MONGODB_TEST_URI = mongoUri;
  process.env.REDIS_URL = 'redis://localhost:6379';
  
  // Suppress console.log during tests (optional)
  if (process.env.SUPPRESS_TEST_LOGS === 'true') {
    console.log = () => {};
    console.error = () => {};
  }
});

afterAll(async () => {
  // Clean up
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  
  if (mongoServer) {
    await mongoServer.stop();
  }
});


describe('Test Setup', () => {
  it('should run basic test', () => {
    expect(true).toBe(true);
  });
});

// Increase timeout for database operations
jest.setTimeout(30000);