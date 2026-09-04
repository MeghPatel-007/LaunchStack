import express from 'express'
import { registration } from '../src/controllers/authController.js'

const authRouter = express.Router()

authRouter.post('/register', registration)

export default authRouter
