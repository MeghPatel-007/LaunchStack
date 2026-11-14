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

const authRouter = express.Router()

authRouter.post(
  '/register',
  validateRequiredStrings(['username', 'email', 'password']),
  validateEmail(['email']),
  registration,
)
authRouter.post(
  '/login',
  validateRequiredStrings(['email', 'password']),
  validateEmail(['email']),
  login,
)
authRouter.post('/logout', logout)
authRouter.get('/me', authenticate, getCurrentUser)

export default authRouter
