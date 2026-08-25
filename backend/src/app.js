import express from 'express'
import { writingLogs } from './utils/ensureLogsDir.js'

// * application
export const app = express() // express application obj

// * configuration
app.get('/', (req, res) => {
  // '/' verifies the path and then executes the cb func , req and res are also obj
  res.send('hello world')
})

const data = {
  1: { name: 'Project1', id: 1, type: 'software' },
  2: { name: 'Project2', id: 2, type: 'hardware' },
  3: { name: 'Project3', id: 3, type: 'software' },
}
const dataStats = {
  1: { workDone: '10%', id: 1, type: 'software' },
  2: { workDone: '30%', id: 2, type: 'hardware' },
  3: { workDone: '100%', id: 3, type: 'software' },
}

// ? middleware
app.use('/', async (req, res, next) => {
  const logs = req.method + req.path + '\n'
  await writingLogs(logs)
  next()
})

app.use(express.json()) // used to prase the req.body

// ? Express routes
// ! IMP : Route Order
app.get('/projects', (req, res) => {
  const query = req.query
  const filteredData =
    query.type === undefined
      ? data
      : Object.fromEntries(
          Object.entries(data).filter(([k, v]) => v.type === query.type),
        )
  res.json(filteredData)
})

app.post('/projects', (req, res) => {
  const response = req.body
  console.log(response)
  if (response != undefined && Object.keys(response).length !== 0) {
    res.json({ msg: 'Received new project' })
  } else {
    res.status(400).json({ error: 'New project cannot be received' })
  }
})

app.get('/projects/stats', (req, res) => {
  res.json(dataStats)
})

// * routes of ids or any parameter route should be at last
app.get('/projects/:id', (req, res) => {
  const id = req.params.id
  if (Object.hasOwn(data, id)) res.json(data[id])
  else res.status(404).json({ error: 'Id does not exists' }) // http status code and msg
})
