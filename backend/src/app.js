import express from 'express'
import { writingLogs } from './utils/ensureLogsDir.js'
import projectRouter from './routes/projectRoutes.js'
import projectPhaseRouter from './routes/projectPhaseRoutes.js'
import authRouter from './routes/authRoutes.js'
import { authenticate } from './middleware/authMiddleware.js'

export const app = express()

app.get('/', (req, res) => {
  res.send('hello world')
})

app.use('/', async (req, res, next) => {
  const logs = req.method + req.path + '\n'
  await writingLogs(logs)
  next()
})

app.use(express.json())

app.use('/auth', authRouter)
app.use('/projects', authenticate, projectRouter)
app.use('/', authenticate, projectPhaseRouter)

app.use((err, req, res, next) => {
  console.error(err)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' })
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Resource already exists' })
  }
  if (err.code === '23514') {
    return res.status(400).json({ error: 'Invalid data' })
  }
  res.status(500).json({ error: 'Internal Server Error' })
})
