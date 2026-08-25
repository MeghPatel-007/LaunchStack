import { validatePortNumber } from './config.js'
import { ensureLogsDir } from './utils/ensureLogsDir.js'
// * app connection
import { app } from './app.js'

// * intial setup
const port = validatePortNumber() // validates the port number
await ensureLogsDir() // ensures logs dir exists or not

// * server startup
app.listen(port, () => {
  console.log(`Server is running in port number : http://localhost:${port}`)
})
