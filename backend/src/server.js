import { validatePortNumber } from './config.js'
import { ensureLogsDir } from './utils/ensureLogsDir.js'
import { app } from './app.js'

const port = validatePortNumber() // validates the port number
await ensureLogsDir() // ensures logs dir exists or not

app.listen(port, () => {
  console.log(`Server is running in port number : http://localhost:${port}`)
})
