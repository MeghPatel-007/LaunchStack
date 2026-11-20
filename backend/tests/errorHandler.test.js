import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import {
  assertTestEnvironment,
  cleanup,
  closePool,
  loginCookie,
  registerUser,
  resetLimiters,
  request,
  app,
  pool,
} from './helpers.js'

const createdEmails = []

before(() => {
  assertTestEnvironment()
})

after(async () => {
  await cleanup({ emails: createdEmails })
  await closePool()
})

// The error handler maps database error codes, so the database call itself is
// simulated here. The route and middleware pipeline stay real.
async function withDatabaseError(code, fn) {
  const originalQuery = pool.query
  const originalConsoleError = console.error
  pool.query = async () => {
    const error = new Error(`simulated database failure ${code}`)
    if (code) {
      error.code = code
    }
    throw error
  }
  console.error = () => {}

  try {
    await fn()
  } finally {
    pool.query = originalQuery
    console.error = originalConsoleError
    await resetLimiters()
  }
}

function register(overrides = {}) {
  return request(app)
    .post('/auth/register')
    .set('Origin', 'http://localhost:3000')
    .send({
      username: 'Error User',
      email: `errors-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      password: 'Password123',
      ...overrides,
    })
}

test('unique constraint violations map to 409 without leaking details', async () => {
  await withDatabaseError('23505', async () => {
    const response = await register()

    assert.equal(response.status, 409)
    assert.deepEqual(response.body, { error: 'Resource already exists' })
  })
})

test('check constraint violations map to 400', async () => {
  await withDatabaseError('23514', async () => {
    const response = await register()

    assert.equal(response.status, 400)
    assert.deepEqual(response.body, { error: 'Invalid data' })
  })
})

test('unexpected database errors return a generic 500', async () => {
  await withDatabaseError(undefined, async () => {
    const response = await register()

    assert.equal(response.status, 500)
    assert.deepEqual(response.body, { error: 'Internal Server Error' })
    assert.doesNotMatch(response.text, /simulated database failure/)
  })
})

test('unexpected errors on protected routes return a generic 500', async () => {
  const user = await registerUser()
  createdEmails.push(user.email)
  const cookie = await loginCookie(user.email, user.password)

  await withDatabaseError(undefined, async () => {
    const response = await request(app)
      .get('/projects')
      .set('Cookie', cookie)

    assert.equal(response.status, 500)
    assert.deepEqual(response.body, { error: 'Internal Server Error' })
  })
})

test('malformed JSON on protected routes is rejected before authentication', async () => {
  const originalConsoleError = console.error
  console.error = () => {}

  try {
    const response = await request(app)
      .post('/projects')
      .set('Origin', 'http://localhost:3000')
      .set('Content-Type', 'application/json')
      .send('{"name": ')

    assert.equal(response.status, 400)
    assert.deepEqual(response.body, { error: 'Invalid JSON' })
  } finally {
    console.error = originalConsoleError
  }
})

test('malformed JSON on auth routes returns 400', async () => {
  const originalConsoleError = console.error
  console.error = () => {}

  try {
    const response = await request(app)
      .post('/auth/login')
      .set('Origin', 'http://localhost:3000')
      .set('Content-Type', 'application/json')
      .send('not json')

    assert.equal(response.status, 400)
    assert.deepEqual(response.body, { error: 'Invalid JSON' })
  } finally {
    console.error = originalConsoleError
  }
})
