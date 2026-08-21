import express from 'express'

import { validatePortNumber } from './config.js'
import { ensureLogsDir } from './Utils/ensureLogsDir.js'

const port = validatePortNumber() // validates the port number
ensureLogsDir(); // ensures logs dir exists or not
// * Express setup
const app = express()

app.get('/', (req, res) => {
  res.send('hello world')
})

app.listen(port, () => {
  console.log(`Server is running in port number : http://localhost:${port}`)
})
