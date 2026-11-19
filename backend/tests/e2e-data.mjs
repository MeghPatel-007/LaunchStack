import bcrypt from 'bcrypt'
import pool from '../src/db/pool.js'

// Only test-created accounts: the frontend E2E suite names them e2e_<...>.
const E2E_EMAIL_PATTERN = 'e2e\\_%'

if (process.env.NODE_ENV !== 'test' || !process.env.DB_NAME?.endsWith('_test')) {
  throw new Error('refusing to run E2E data helpers outside the test database')
}

async function cleanup() {
  await pool.query(
    `delete from projects
     where project_id in (
       select pm.project_id
       from project_members pm
       join users u on u.user_id = pm.user_id
       where u.email like $1
     )`,
    [E2E_EMAIL_PATTERN],
  )
  await pool.query('delete from users where email like $1', [E2E_EMAIL_PATTERN])
}

async function seed(emails, outputPath) {
  await cleanup()

  const passwordHash = await bcrypt.hash('Passw0rd!123', 10)
  const users = []
  for (const email of emails) {
    const result = await pool.query(
      `insert into users(username, email, password_hash)
       values ($1, $2, $3)
       returning user_id`,
      [email.split('@')[0], email, passwordHash],
    )
    users.push({ email, userId: result.rows[0].user_id })
  }

  const { writeFileSync } = await import('node:fs')
  writeFileSync(outputPath, JSON.stringify(users, null, 2))
}

const [mode, arg] = process.argv.slice(2)

try {
  if (mode === 'seed') {
    const { emails, outputPath } = JSON.parse(arg)
    await seed(emails, outputPath)
  } else if (mode === 'cleanup') {
    await cleanup()
  } else {
    throw new Error(`unknown mode: ${mode}`)
  }
} finally {
  await pool.end()
}
