import { validatePortNumber } from './config.js'
import { ensureLogsDir } from './utils/ensureLogsDir.js'
import { app } from './app.js'

const port = validatePortNumber() // validates the port number
await ensureLogsDir() // ensures logs dir exists or not

app.listen(port, '0.0.0.0', () => {
  console.log(`LaunchStack API running on port ${port}`)
})
