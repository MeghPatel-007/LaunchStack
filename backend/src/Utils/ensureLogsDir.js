import { promises as fs } from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const __path = path.resolve(__dirname, '../../logs') // made CWD independent

export async function ensureLogsDir() {
  try {
    await fs.access(__path)
    console.log('Logs dir exists')
  } catch (e) {
    if (e.code === 'ENOENT') {
      console.log('Logs dir does not exist')
      console.log('Making one ...')
      try {
        await fs.mkdir(__path)
        console.log('Logs dir is made')
      } catch (e) {
        console.error(`${e.code} : ${e.message}`)
        throw e
      }
    } else {
      console.error(`${e.code} : ${e.message}`)
      throw e
    }
  }
}

export async function writingLogs(logs) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const logFileName = `app-info-${today}.log`
    const logFilePath = path.join(__path, logFileName)
    await fs.appendFile(logFilePath, logs, 'utf-8')
  } catch (e) {
    throw new Error(`Failed to write application logs`, { cause: e })
  }
}
