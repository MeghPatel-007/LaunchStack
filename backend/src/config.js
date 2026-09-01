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

export function getDatabaseConfig() {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const database = process.env.DB_NAME;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  if(typeof host !== 'string' || host.trim() === ''){ // does not exist
    throw new Error("Database Host name is empty or missing");
  }
  if(typeof port !== 'string' || port.trim() === ''){
    throw new Error("Database port number is empty or missing");
  }
  if(Number.isNaN(Number(port)) || !Number.isInteger(Number(port)) || (1 > Number(port) && Number(port) > 65535)){
    throw new Error("Database port number is not valid");
  }
  if(typeof database !== 'string' || database.trim() === ''){
    throw new Error("Database name is empty or missing");
  }
  if(typeof user !== 'string' || user.trim() === ''){
    throw new Error("Database user name is empty or missing");
  }
  if(typeof password !== 'string' || password.trim() === ''){
    throw new Error("Database password is empty or missing");
  }

  return {
    host : host.trim(),
    port : Number(port),
    database : database.trim(),
    user : user.trim(),
    password : password.trim()
  }
}
