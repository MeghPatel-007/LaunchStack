import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') }) // dynamic relative path

export function validatePortNumber() {
  const port = process.env.PORT
  if (typeof port !== 'string' || port.trim() === '') {
    throw new Error('PORT env var is missing or empty')
  }
  const validPort = Number(port)
  if (
    Number.isNaN(validPort) ||
    !Number.isInteger(validPort) ||
    1 > validPort ||
    validPort > 65535
  ) {
    throw new Error('PORT env var is invalid')
  }
  return validPort
}

export function getDatabaseConfig() {
  const host = process.env.DB_HOST
  const port = process.env.DB_PORT
  const database = process.env.DB_NAME
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD
  if (typeof host !== 'string' || host.trim() === '') {
    throw new Error('Database Host name is empty or missing')
  }
  if (typeof port !== 'string' || port.trim() === '') {
    throw new Error('Database port number is empty or missing')
  }
  const validPort = Number(port)
  if (
    Number.isNaN(validPort) ||
    !Number.isInteger(validPort) ||
    validPort < 1 ||
    validPort > 65535
  ) {
    throw new Error('Database port number is not valid')
  }
  if (typeof database !== 'string' || database.trim() === '') {
    throw new Error('Database name is empty or missing')
  }
  if (typeof user !== 'string' || user.trim() === '') {
    throw new Error('Database user name is empty or missing')
  }
  if (typeof password !== 'string' || password.trim() === '') {
    throw new Error('Database password is empty or missing')
  }

  return {
    host: host.trim(),
    port: validPort,
    database: database.trim(),
    user: user.trim(),
    password: password.trim(),
  }
}
