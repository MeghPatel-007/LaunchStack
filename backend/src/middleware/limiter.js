import rateLimit from 'express-rate-limit'
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: 'draft-8', // Return standard rate limit info headers
  legacyHeaders: false, // Disable the old X-RateLimit-* headers
  message: 'Too many requests, please try again later.',
  statusCode: 429,
})

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hrs
  limit: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: 'draft-8', // Return standard rate limit info headers
  legacyHeaders: false, // Disable the old X-RateLimit-* headers
  message: 'Too many requests, please try again later.',
  statusCode: 429,
})
