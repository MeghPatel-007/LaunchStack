import { test, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import request from 'supertest'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { app } from '../src/app.js'
import pool from '../src/db/pool.js'
import {
  loginRateLimiter,
  registerRateLimiter,
} from '../src/middleware/limiter.js'

// Keep track of every user this suite creates so cleanup is complete even when
// a test fails partway through.
const createdEmails = []

// express-rate-limit keeps counters in memory per IP. Every Supertest request
// comes from loopback, so clear the counters between tests.
const loopbackKeys = ['127.0.0.1', '::1', '::ffff:127.0.0.1']

async function resetLimiters() {
  for (const limiter of [loginRateLimiter, registerRateLimiter]) {
    for (const key of loopbackKeys) {
      await limiter.resetKey(key)
    }
  }
}

function uniqueEmail(prefix = 'user') {
  return `${prefix}-${randomUUID()}@example.com`
}

function authCookie(response) {
  const setCookie = response.headers['set-cookie']
  assert.ok(setCookie?.length, 'expected a Set-Cookie header')
  return setCookie[0].split(';')[0]
}

async function postRegister(payload) {
  const response = await request(app).post('/auth/register').send(payload)

  if (response.status === 201 && typeof payload.email === 'string') {
    createdEmails.push(payload.email.trim().toLowerCase())
  }

  return response
}

async function postLogin(payload) {
  return request(app).post('/auth/login').send(payload)
}

async function registerUser(overrides = {}) {
  const email = overrides.email ?? uniqueEmail('user')
  const password = overrides.password ?? 'TestPassword123'
  const response = await postRegister({
    username: 'Test User',
    email,
    password,
    ...overrides,
  })
  assert.equal(response.status, 201, 'expected user creation to succeed')
  return {
    email: email.trim().toLowerCase(),
    password,
    userId: response.body.userId,
  }
}

before(async () => {
  assert.equal(
    process.env.NODE_ENV,
    'test',
    'tests must run with NODE_ENV=test',
  )
  assert.ok(
    process.env.DB_NAME?.endsWith('_test'),
    'refusing to run against a non-test database',
  )
  await pool.query('SELECT 1')
})

beforeEach(async () => {
  await resetLimiters()
})

after(async () => {
  if (createdEmails.length > 0) {
    await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [
      createdEmails,
    ])
  }
  // Bun runs every test file in one process, so ending the shared pool would
  // break the files that run after this one.
  if (typeof Bun === 'undefined') {
    await pool.end()
  }
})

test('POST /auth/register - creates a user successfully', async () => {
  const email = uniqueEmail('register-success')
  const password = 'TestPassword123'
  const response = await postRegister({
    username: 'Test User',
    email,
    password,
  })

  const result = await pool.query(
    'SELECT username, email, password_hash FROM users WHERE email = $1',
    [email],
  )
  assert.equal(response.status, 201)
  assert.equal(response.body.msg, 'User is created successfully')
  assert.equal(typeof response.body.userId, 'number')
  assert.equal(result.rowCount, 1)
  assert.equal(result.rows[0].username, 'Test User')
  assert.equal(result.rows[0].email, email)
  assert.notEqual(result.rows[0].password_hash, password)
  assert.equal(
    await bcrypt.compare(password, result.rows[0].password_hash),
    true,
  )

  const count = await pool.query(
    'SELECT count(*)::int AS count FROM users WHERE email = $1',
    [email],
  )
  assert.equal(count.rows[0].count, 1)
})

test('POST /auth/register - rejects duplicate email', async () => {
  const { email } = await registerUser()

  const response = await postRegister({
    username: 'Another User',
    email,
    password: 'AnotherPassword123',
  })

  assert.equal(response.status, 409)
  assert.equal(response.body, 'Email already exists')
})

test('POST /auth/register - rejects missing username', async () => {
  const response = await postRegister({
    email: uniqueEmail('missing-username'),
    password: 'TestPassword123',
  })

  assert.equal(response.status, 400)
  assert.equal(
    response.body.error,
    'username is required and must be a non-empty string',
  )
})

test('POST /auth/register - rejects missing email', async () => {
  const response = await postRegister({
    username: 'Test User',
    password: 'TestPassword123',
  })

  assert.equal(response.status, 400)
  assert.equal(
    response.body.error,
    'email is required and must be a non-empty string',
  )
})

test('POST /auth/register - rejects missing password', async () => {
  const response = await postRegister({
    username: 'Test User',
    email: uniqueEmail('missing-password'),
  })

  assert.equal(response.status, 400)
  assert.equal(
    response.body.error,
    'password is required and must be a non-empty string',
  )
})

test('POST /auth/register - rejects empty required fields', async () => {
  const base = { username: 'Field User', password: 'FieldPassword123' }

  for (const field of ['username', 'email', 'password']) {
    const response = await postRegister({
      ...base,
      email: uniqueEmail(`empty-${field}`),
      [field]: '',
    })

    assert.equal(response.status, 400, `field: ${field}`)
    assert.deepEqual(response.body, {
      error: `${field} is required and must be a non-empty string`,
    })
  }
})

test('POST /auth/register - rejects whitespace-only required fields', async () => {
  const base = { username: 'Field User', password: 'FieldPassword123' }

  for (const field of ['username', 'email', 'password']) {
    const response = await postRegister({
      ...base,
      email: uniqueEmail(`blank-${field}`),
      [field]: '   ',
    })

    assert.equal(response.status, 400, `field: ${field}`)
    assert.deepEqual(response.body, {
      error: `${field} is required and must be a non-empty string`,
    })
  }
})

test('POST /auth/register - rejects non-string required fields', async () => {
  const base = {
    username: 'Field User',
    email: uniqueEmail('non-string'),
    password: 'FieldPassword123',
  }

  for (const [field, value] of [
    ['username', 123],
    ['email', 123],
    ['password', null],
  ]) {
    const response = await postRegister({
      ...base,
      email: field === 'email' ? 123 : base.email,
      [field]: value,
    })

    assert.equal(response.status, 400, `field: ${field}`)
    assert.deepEqual(response.body, {
      error: `${field} is required and must be a non-empty string`,
    })
  }
})

test('POST /auth/register - rejects invalid email formats', async () => {
  const base = { username: 'Field User', password: 'FieldPassword123' }

  const invalidEmails = [
    'plainaddress',
    'user@domain',
    'user@domain.c',
    'user name@example.com',
    'user@@example.com',
    '@example.com',
  ]

  for (const email of invalidEmails) {
    await resetLimiters()

    const response = await postRegister({ ...base, email })

    assert.equal(response.status, 400, `email: ${email}`)
    assert.deepEqual(response.body, {
      error: 'email has an invalid email format',
    })
  }
})

test('POST /auth/register - stores a mixed-case email in lowercase', async () => {
  const localPart = `Normalize-${randomUUID()}`
  const normalizedEmail = `${localPart.toLowerCase()}@example.com`

  const response = await postRegister({
    username: 'Normalize User',
    email: `  ${localPart}@Example.COM  `,
    password: 'NormalizePassword123',
  })

  assert.equal(response.status, 201)
  const result = await pool.query('SELECT email FROM users WHERE email = $1', [
    normalizedEmail,
  ])
  assert.equal(result.rowCount, 1)
  assert.equal(result.rows[0].email, normalizedEmail)
})

test('POST /auth/login - rejects non-string required fields', async () => {
  for (const [field, value] of [
    ['email', 123],
    ['password', null],
  ]) {
    const response = await postLogin({
      email: uniqueEmail(`login-type-${field}`),
      password: 'TestPassword123',
      [field]: value,
    })

    assert.equal(response.status, 400)
    assert.deepEqual(response.body, {
      error: `${field} is required and must be a non-empty string`,
    })
  }
})

test('POST /auth/login - rejects missing email', async () => {
  const response = await postLogin({ password: 'TestPassword123' })

  assert.equal(response.status, 400)
  assert.equal(
    response.body.error,
    'email is required and must be a non-empty string',
  )
})

test('POST /auth/login - rejects missing password', async () => {
  const response = await postLogin({ email: uniqueEmail('login-missing') })

  assert.equal(response.status, 400)
  assert.equal(
    response.body.error,
    'password is required and must be a non-empty string',
  )
})

test('POST /auth/login - rejects empty required fields', async () => {
  for (const field of ['email', 'password']) {
    const response = await postLogin({
      email: uniqueEmail(`login-empty-${field}`),
      password: 'TestPassword123',
      [field]: '',
    })

    assert.equal(response.status, 400, `field: ${field}`)
    assert.deepEqual(response.body, {
      error: `${field} is required and must be a non-empty string`,
    })
  }
})

test('POST /auth/login - rejects whitespace-only required fields', async () => {
  for (const field of ['email', 'password']) {
    const response = await postLogin({
      email: uniqueEmail(`login-blank-${field}`),
      password: 'TestPassword123',
      [field]: '   ',
    })

    assert.equal(response.status, 400, `field: ${field}`)
    assert.deepEqual(response.body, {
      error: `${field} is required and must be a non-empty string`,
    })
  }
})

test('POST /auth/login - rejects invalid email format', async () => {
  const response = await postLogin({
    email: 'not-an-email',
    password: 'TestPassword123',
  })

  assert.equal(response.status, 400)
  assert.deepEqual(response.body, {
    error: 'email has an invalid email format',
  })
})

test('POST /auth/login - logs in with correct credentials', async () => {
  const { email, password, userId } = await registerUser()

  const response = await postLogin({ email, password })

  assert.equal(response.status, 200)
  assert.equal(response.body.msg, 'User can login successfully')
  assert.equal(response.body.userId, userId)
  assert.equal('password' in response.body, false)
  assert.equal('password_hash' in response.body, false)
  assert.ok(response.headers['set-cookie']?.length)
})

test('POST /auth/login - normalizes email before lookup', async () => {
  const { email, password } = await registerUser()

  const response = await postLogin({
    email: `  ${email.toUpperCase()}  `,
    password,
  })

  assert.equal(response.status, 200)
  assert.equal(response.body.msg, 'User can login successfully')
})

test('POST /auth/login - rejects incorrect password', async () => {
  const { email } = await registerUser()

  const response = await postLogin({ email, password: 'WrongPassword123' })

  assert.equal(response.status, 401)
  assert.equal(response.body, 'Invalid email or password')
})

test('POST /auth/login - rejects an email that does not exist', async () => {
  const response = await postLogin({
    email: uniqueEmail('unknown'),
    password: 'TestPassword123',
  })

  assert.equal(response.status, 401)
  assert.equal(response.body, 'Invalid email or password')
})

test('POST /auth/login - issues an HttpOnly session cookie with the configured attributes', async () => {
  const { email, password } = await registerUser()

  const response = await postLogin({ email, password })

  assert.equal(response.status, 200)
  const cookie = response.headers['set-cookie'][0]
  assert.match(cookie, /^token=[^;]+/)
  assert.match(cookie, /Path=\//)
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /SameSite=Lax/)
  // secure is only enabled when NODE_ENV=production.
  assert.doesNotMatch(cookie, /Secure/)
  // cookieOptions sets no maxAge/expires, so the cookie is a session cookie.
  assert.doesNotMatch(cookie, /Max-Age|Expires=/)
})

test('POST /auth/logout - clears the cookie and disables caching', async () => {
  const { email, password } = await registerUser()
  const agent = request.agent(app)
  await resetLimiters()
  const login = await agent.post('/auth/login').send({ email, password })
  assert.ok(login.headers['set-cookie']?.length)

  const response = await agent.post('/auth/logout')

  assert.equal(response.status, 200)
  assert.equal(response.body.msg, 'User logged out successfully')
  assert.equal(response.headers['cache-control'], 'no-store')
  const cookie = response.headers['set-cookie'][0]
  assert.match(cookie, /^token=;/)
  assert.match(cookie, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/)
  assert.match(cookie, /HttpOnly/)
})

test('POST /auth/logout - allows a request without an Origin header', async () => {
  const previous = process.env.ALLOWED_FRONTEND_ORIGINS
  process.env.ALLOWED_FRONTEND_ORIGINS = 'http://localhost:3000'

  try {
    const response = await request(app).post('/auth/logout')
    assert.equal(response.status, 200)
    assert.equal(response.body.msg, 'User logged out successfully')
  } finally {
    if (previous === undefined) delete process.env.ALLOWED_FRONTEND_ORIGINS
    else process.env.ALLOWED_FRONTEND_ORIGINS = previous
  }
})

test('POST /auth/logout - rejects a disallowed Origin when ALLOWED_FRONTEND_ORIGINS is configured', async () => {
  const previous = process.env.ALLOWED_FRONTEND_ORIGINS
  process.env.ALLOWED_FRONTEND_ORIGINS = 'http://localhost:3000'

  try {
    const response = await request(app)
      .post('/auth/logout')
      .set('Origin', 'http://evil.example.com')

    assert.equal(response.status, 403)
    assert.deepEqual(response.body, { msg: 'Forbidden: Invalid origin' })
  } finally {
    if (previous === undefined) delete process.env.ALLOWED_FRONTEND_ORIGINS
    else process.env.ALLOWED_FRONTEND_ORIGINS = previous
  }
})

test('POST /auth/logout - allows any Origin when ALLOWED_FRONTEND_ORIGINS is not configured', async () => {
  const previous = process.env.ALLOWED_FRONTEND_ORIGINS
  delete process.env.ALLOWED_FRONTEND_ORIGINS

  try {
    const response = await request(app)
      .post('/auth/logout')
      .set('Origin', 'http://evil.example.com')

    assert.equal(response.status, 200)
    assert.equal(response.body.msg, 'User logged out successfully')
  } finally {
    if (previous !== undefined) process.env.ALLOWED_FRONTEND_ORIGINS = previous
  }
})

test('GET /auth/me - returns the current user id for a valid session cookie', async () => {
  const { email, password, userId } = await registerUser()
  const login = await postLogin({ email, password })

  const response = await request(app)
    .get('/auth/me')
    .set('Cookie', authCookie(login))

  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { userId })
})

test('GET /auth/me - rejects a request without a token', async () => {
  const response = await request(app).get('/auth/me')

  assert.equal(response.status, 401)
  assert.deepEqual(response.body, { error: 'Authentication required' })
  assert.equal('userId' in response.body, false)
})

test('GET /auth/me - rejects an invalid token', async () => {
  const response = await request(app)
    .get('/auth/me')
    .set('Cookie', 'token=not-a-jwt')

  assert.equal(response.status, 401)
  assert.deepEqual(response.body, { error: 'Invalid or expired token' })
})

test('GET /auth/me - rejects an expired token', async () => {
  const token = jwt.sign({ user_id: 999999 }, process.env.JWT_SECRET, {
    expiresIn: '-10s',
  })

  const response = await request(app)
    .get('/auth/me')
    .set('Cookie', `token=${token}`)

  assert.equal(response.status, 401)
  assert.deepEqual(response.body, { error: 'Invalid or expired token' })
})

test('GET /auth/me - rejects a token with an invalid payload', async () => {
  const token = jwt.sign({ user_id: '1' }, process.env.JWT_SECRET)

  const response = await request(app)
    .get('/auth/me')
    .set('Cookie', `token=${token}`)

  assert.equal(response.status, 401)
  assert.deepEqual(response.body, { error: 'Invalid token payload' })
})

test('GET /auth/me - rejects a token for a user that does not exist', async () => {
  const token = jwt.sign({ user_id: 2000000000 }, process.env.JWT_SECRET)

  const response = await request(app)
    .get('/auth/me')
    .set('Cookie', `token=${token}`)

  assert.equal(response.status, 401)
  assert.deepEqual(response.body, { error: 'User does not exist' })
})

test('POST /auth/register - rejects requests above the rate limit', async () => {
  const base = { password: 'LimitPassword123' }
  const statuses = []

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await request(app)
      .post('/auth/register')
      .send({ ...base, email: uniqueEmail(`rate-${attempt}`) })
    statuses.push(response.status)
  }

  const response = await request(app)
    .post('/auth/register')
    .send({ ...base, email: uniqueEmail('rate-blocked') })

  assert.deepEqual(statuses, [400, 400, 400, 400, 400])
  assert.equal(response.status, 429)
  assert.equal(response.text, 'Too many requests, please try again later.')
  assert.ok(response.headers['ratelimit-policy'])
  assert.ok(response.headers['retry-after'])
})

test('POST /auth/login - rejects requests above the rate limit', async () => {
  const statuses = []

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: uniqueEmail(`rate-${attempt}`) })
    statuses.push(response.status)
  }

  const response = await request(app)
    .post('/auth/login')
    .send({ email: uniqueEmail('rate-blocked') })

  assert.deepEqual(statuses, [400, 400, 400, 400, 400, 400, 400, 400, 400, 400])
  assert.equal(response.status, 429)
  assert.equal(response.text, 'Too many requests, please try again later.')
  assert.ok(response.headers['ratelimit-policy'])
  assert.ok(response.headers['retry-after'])
})

test('POST /auth/register - returns 400 for malformed JSON', async () => {
  const response = await request(app)
    .post('/auth/register')
    .set('Content-Type', 'application/json')
    .send('{"username": "Broken"')

  assert.equal(response.status, 400)
  assert.deepEqual(response.body, { error: 'Invalid JSON' })
})

test('POST /auth/register - forwards unexpected database errors as a generic 500', async () => {
  const originalQuery = pool.query
  pool.query = async () => {
    throw new Error('simulated database failure')
  }

  try {
    const response = await postRegister({
      username: 'Database Error User',
      email: uniqueEmail('db-error'),
      password: 'TestPassword123',
    })

    assert.equal(response.status, 500)
    assert.deepEqual(response.body, { error: 'Internal Server Error' })
    assert.equal(JSON.stringify(response.body).includes('simulated'), false)
  } finally {
    pool.query = originalQuery
  }
})
