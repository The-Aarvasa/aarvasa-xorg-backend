const rateLimit = require('express-rate-limit');

// Apply to login/signup/verify to prevent spam and brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 5 requests per windowMs
  message: {
    status: 429,
    message: 'Too many requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = authLimiter;
