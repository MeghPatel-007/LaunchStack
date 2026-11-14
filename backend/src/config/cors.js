const allowedOrigins = process.env.ALLOWED_FRONTEND_ORIGINS?.split(',')
  .map((url) => url.trim())
  .filter(Boolean)

if (!allowedOrigins?.length) {
  throw new Error('ALLOWED_FRONTEND_ORIGINS must be configured')
}
export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}
