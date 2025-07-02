// middleware/sanitize.js
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Secure NoSQL Injection Sanitizer
 * - Prevents operators like $gt, $ne, etc. from being injected into queries
 * - Avoids reassigning `req.query` (which causes errors in latest Express)
 */

const sanitizeMiddleware = mongoSanitize({
  replaceWith: '_', // Replaces keys like $gt with _gt
  onSanitize: ({ req, key }) => {
    console.warn(`[MongoSanitize] Removed dangerous key: ${key}`);
  }
});

module.exports = sanitizeMiddleware;
