import express from 'express'
import { writingLogs } from './utils/ensureLogsDir.js'
import projectRouter from '../routes/projectRoutes.js'
import projectPhaseRouter from '../routes/projectPhaseRoutes.js'

// * application
export const app = express() // express application obj

// * configuration
app.get('/', (req, res) => {
  // '/' verifies the path and then executes the cb func , req and res are also obj
  res.send('hello world')
})

// ? middleware
app.use('/', async (req, res, next) => {
  // if i donot put '/' then also it would pass through it
  const logs = req.method + req.path + '\n'
  await writingLogs(logs)
  next() // pass the error to the centralized error handling middleware
})

app.use(express.json()) // used to prase the req.body

// ? Express routes
app.use('/projects',projectRouter)
app.use('/',projectPhaseRouter)

// ? centralize error handling middleware => converts error into http response
app.use((err, req, res, next) => {
  console.console.error(err)
  res.status(500).json({ error: 'Interval Server Error' })
})
