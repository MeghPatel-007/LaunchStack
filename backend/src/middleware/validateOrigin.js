import { allowedOrigins } from '../config/cors.js'

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

export function validateOrigin(req, res, next) {
  if (SAFE_METHODS.includes(req.method)) return next()

  const origin = req.get('origin')

  if (!origin || !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: 'Forbidden: Invalid origin',
    })
  }

  next()
}
