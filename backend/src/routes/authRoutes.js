import express from 'express'
import {
  getCurrentUser,
  login,
  logout,
  registration,
} from '../controllers/authController.js'
import {
  validateEmail,
  validateRequiredStrings,
} from '../middleware/validation.js'
import { authenticate } from '../middleware/authMiddleware.js'
import { loginRateLimiter, registerRateLimiter } from '../middleware/limiter.js'

const authRouter = express.Router()

authRouter.post(
  '/register',
  registerRateLimiter,
  validateRequiredStrings(['username', 'email', 'password']),
  validateEmail(['email']),
  registration,
)
authRouter.post(
  '/login',
  loginRateLimiter,
  validateRequiredStrings(['email', 'password']),
  validateEmail(['email']),
  login,
)
authRouter.post('/logout', logout)
authRouter.get('/me', authenticate, getCurrentUser)

export default authRouter
