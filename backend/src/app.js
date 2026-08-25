import express from 'express'

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
// ! IMP : Route Order
app.get('/projects', (req, res) => {
  res.send(data)
})

app.get('/projects/stats', (req, res) => {
  res.send(dataStats)
})

// * routes of ids or any parameter route should be at last
app.get('/projects/:id', (req, res) => {
  const id = req.params.id
  if (Object.hasOwn(data, id)) res.send(data[id])
  else res.status(404).json({ error: 'Id does not exists' })
})
