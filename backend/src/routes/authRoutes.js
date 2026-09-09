import express from 'express'
import { login, registration } from '../controllers/authController.js'
import {
  validateEmail,
  validateRequiredStrings,
} from '../middleware/validation.js'

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

export default authRouter
