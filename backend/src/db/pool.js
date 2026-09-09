import pg from 'pg'
import { getDatabaseConfig } from '../config.js'

const config = getDatabaseConfig()
const { Pool } = pg
const pool = new Pool(config)

export default pool
