const jwt = require('jsonwebtoken');

// Replace this with a secure, private key in production (use environment variables)
const SECRET_KEY = 'your_secret_key';

// Sample user data to encode in token (payload)
const user = {
  id: 1,
  username: 'john_doe',
  role: 'admin'
};

// Generate Token
const token = jwt.sign(user, SECRET_KEY, {
  expiresIn: '1h' // Token expires in 1 hour
});

console.log('Generated JWT Token:', token);
