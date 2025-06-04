// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/hackmates_test';

// Set longer timeout for database operations
jest.setTimeout(30000);

// Suppress console.log during tests (optional)
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.error = jest.fn();
}