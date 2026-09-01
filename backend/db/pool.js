import pg from 'pg'
import { getDatabaseConfig } from '../src/config.js'

const config = getDatabaseConfig()
const { Pool } = pg
const pool = new Pool(config)

// SELECT NOW(); best for testing purpose pool connections

// pool
//   .query('select current_database()')
//   .then((resolve) => console.log("Database connected : ",resolve.rows[0]))
//   .catch((error) => console.error(error.message))

export default pool
