import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') }) // dynamic relative path

// dotenv.config({ path: path.resolve('./../.env') }) // static relative path

// * ValidatePortNumber is in range , float number , NaN
export function validatePortNumber() {
  // * Path configuration
  const port = process.env.PORT
  // * checking
  if (typeof port !== 'string' || port.trim() === '') {
    throw new Error('PORT env var is missing or empty')
  }
  const validPort = Number(port) // port converted to number
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
