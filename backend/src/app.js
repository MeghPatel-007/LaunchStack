import express from 'express'
import { writingLogs } from './utils/ensureLogsDir.js'
import {
  createProject,
  getProjects,
  getProjectById,
  getProjectStats,
  deleteProjectById,
} from './controllers/projectController.js'

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
// ! IMP : Route Order
app.get('/projects', getProjects)

app.post('/projects', createProject)

app.get('/projects/stats', getProjectStats)

// * routes of ids or any parameter route should be at last
app.get('/projects/:id', getProjectById)

app.delete('/projects/:id', deleteProjectById)

// * just for testing purpose
// app.get('/test-route', (req, res, next) => {
//   const error = new Error('testing route')
//   next(error)
// })

// ? centralize error handling middleware => converts error into http response
app.use((err, req, res, next) => {
  console.console.error(err)
  res.status(500).json({ error: 'Interval Server Error' })
})
