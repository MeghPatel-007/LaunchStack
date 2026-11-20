import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import jwt from 'jsonwebtoken'
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
const secret = process.env.JWT_SECRET
const ORIGIN = 'http://localhost:3000'

before(() => {
  assertTestEnvironment()
})

after(async () => {
  await cleanup({ emails: createdEmails })
  await closePool()
})

async function createUser() {
  const user = await registerUser()
  createdEmails.push(user.email)
  return user
}

test('security headers are present on API responses', async () => {
  const response = await request(app).get('/auth/me')

  assert.equal(response.status, 401)
  assert.equal(response.headers['x-content-type-options'], 'nosniff')
  assert.equal(response.headers['x-frame-options'], 'SAMEORIGIN')
  assert.equal(response.headers['referrer-policy'], 'no-referrer')
  assert.match(
    response.headers['strict-transport-security'],
    /max-age=\d+/,
  )
  assert.match(response.headers['content-security-policy'], /default-src/)
  assert.equal(response.headers['x-powered-by'], undefined)
})

test('CORS allows the configured frontend origin', async () => {
  const response = await request(app)
    .get('/auth/me')
    .set('Origin', 'http://localhost:3000')

  assert.equal(
    response.headers['access-control-allow-origin'],
    'http://localhost:3000',
  )
  assert.equal(response.headers['access-control-allow-credentials'], 'true')
  assert.match(response.headers.vary ?? '', /Origin/)
})

test('CORS omits headers for disallowed origins', async () => {
  const simple = await request(app)
    .get('/auth/me')
    .set('Origin', 'http://evil.example')
  assert.equal(simple.headers['access-control-allow-origin'], undefined)
  assert.equal(simple.status, 401)

  const preflight = await request(app)
    .options('/projects')
    .set('Origin', 'http://evil.example')
    .set('Access-Control-Request-Method', 'POST')
  assert.equal(preflight.headers['access-control-allow-origin'], undefined)
})

test('CORS preflight succeeds for the configured origin', async () => {
  const response = await request(app)
    .options('/projects')
    .set('Origin', 'http://localhost:3000')
    .set('Access-Control-Request-Method', 'POST')
    .set('Access-Control-Request-Headers', 'content-type')

  assert.equal(response.status, 204)
  assert.equal(
    response.headers['access-control-allow-origin'],
    'http://localhost:3000',
  )
  assert.match(response.headers['access-control-allow-methods'], /POST/)
})

test('login sets a hardened session cookie', async () => {
  const user = await createUser()

  const response = await request(app)
    .post('/auth/login')
    .set('Origin', ORIGIN)
    .send({ email: user.email, password: user.password })

  assert.equal(response.status, 200)
  const cookie = response.headers['set-cookie'][0]
  assert.match(cookie, /^token=/)
  assert.match(cookie, /HttpOnly/i)
  assert.match(cookie, /Path=\//i)
  assert.match(cookie, /SameSite=Lax/i)
  assert.doesNotMatch(cookie, /Secure/i)
  assert.doesNotMatch(cookie, /Domain=/i)
  assert.match(cookie, /Max-Age=86400/i)
})

test('logout clears the session cookie and disables caching', async () => {
  const user = await createUser()
  const cookie = await loginCookie(user.email, user.password)

  const response = await request(app)
    .post('/auth/logout')
    .set('Cookie', cookie)
    .set('Origin', ORIGIN)

  assert.equal(response.status, 200)
  assert.equal(response.headers['cache-control'], 'no-store')
  const cleared = response.headers['set-cookie'][0]
  assert.match(cleared, /^token=;/)
  assert.match(cleared, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/)
})

test('protected routes reject every invalid token shape', async () => {
  const user = await createUser()
  const validPayload = { user_id: user.userId }

  const cases = [
    ['not-a-token', 'Invalid or expired token'],
    [jwt.sign(validPayload, 'wrong-secret'), 'Invalid or expired token'],
    [jwt.sign(validPayload, secret, { expiresIn: '-1s' }), 'Invalid or expired token'],
    [jwt.sign({ user_id: String(user.userId) }, secret), 'Invalid token payload'],
    [jwt.sign({ user_id: 0 }, secret), 'Invalid token payload'],
    [jwt.sign({ user_id: -5 }, secret), 'Invalid token payload'],
    [jwt.sign('plain-string', secret), 'Invalid token payload'],
    [jwt.sign({}, secret), 'Invalid token payload'],
  ]

  for (const [token, error] of cases) {
    const response = await request(app)
      .get('/auth/me')
      .set('Cookie', `token=${token}`)

    assert.equal(response.status, 401)
    assert.deepEqual(response.body, { error })
  }
})

test('protected routes ignore bearer tokens and require the cookie', async () => {
  const user = await createUser()
  const token = jwt.sign({ user_id: user.userId }, secret)

  const response = await request(app)
    .get('/auth/me')
    .set('Authorization', `Bearer ${token}`)

  assert.equal(response.status, 401)
  assert.deepEqual(response.body, { error: 'Authentication required' })
})

test('authentication rejects tokens for deleted users', async () => {
  const user = await createUser()
  const token = jwt.sign({ user_id: user.userId }, secret)
  await pool.query('DELETE FROM users WHERE user_id = $1', [user.userId])

  const response = await request(app)
    .get('/auth/me')
    .set('Cookie', `token=${token}`)

  assert.equal(response.status, 401)
  assert.deepEqual(response.body, { error: 'User does not exist' })
})

test('authentication rejects tokens with an invalid signature', async () => {
  const user = await createUser()
  const valid = jwt.sign({ user_id: user.userId }, secret)
  const tampered = valid.slice(0, -3) + 'abc'

  const response = await request(app)
    .get('/auth/me')
    .set('Cookie', `token=${tampered}`)

  assert.equal(response.status, 401)
  assert.deepEqual(response.body, { error: 'Invalid or expired token' })
})

test('protected routes reject unauthenticated requests before validation', async () => {
  const responses = await Promise.all([
    request(app).post('/projects').set('Origin', ORIGIN).send({}),
    request(app).post('/projects/abc/phases').set('Origin', ORIGIN).send({}),
  ])

  for (const response of responses) {
    assert.equal(response.status, 401)
    assert.deepEqual(response.body, { error: 'Authentication required' })
  }
})

test('login rate limit returns 429 with rate limit headers', async () => {
  const user = await createUser()

  try {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const response = await request(app)
        .post('/auth/login')
        .set('Origin', ORIGIN)
        .send({ email: user.email, password: 'WrongPassword1' })
      assert.equal(response.status, 401, `attempt ${attempt} should be allowed`)
      assert.ok(response.headers.ratelimit, 'rate limit header is present')
    }

    const blocked = await request(app)
      .post('/auth/login')
      .set('Origin', ORIGIN)
      .send({ email: user.email, password: user.password })

    assert.equal(blocked.status, 429)
    assert.equal(blocked.text, 'Too many requests, please try again later.')
    assert.ok(blocked.headers.ratelimit, 'remaining rate limit header is present')
    assert.equal(blocked.headers['retry-after'] !== undefined, true)
  } finally {
    await resetLimiters()
  }
})

test('registration rate limit returns 429 after five attempts', async () => {
  const user = await createUser()

  try {
    await resetLimiters()
    const allowedStatuses = []
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await request(app)
        .post('/auth/register')
        .set('Origin', ORIGIN)
        .send({ username: 'duplicate', email: user.email, password: 'Password123' })
      allowedStatuses.push(response.status)
    }

    assert.deepEqual(allowedStatuses, [409, 409, 409, 409, 409])

    const blocked = await request(app)
      .post('/auth/register')
      .set('Origin', ORIGIN)
      .send({ username: 'duplicate', email: user.email, password: 'Password123' })

    assert.equal(blocked.status, 429)
    assert.equal(blocked.text, 'Too many requests, please try again later.')
  } finally {
    await resetLimiters()
  }
})

test('ID validation rejects zero, negative, fractional, and non-numeric ids', async () => {
  const user = await createUser()
  const cookie = await loginCookie(user.email, user.password)

  for (const id of ['0', '-1', '1.5', 'abc', 'NaN', 'Infinity']) {
    const response = await request(app)
      .get(`/projects/${id}`)
      .set('Cookie', cookie)

    assert.equal(response.status, 400, `id ${id} should be rejected`)
    assert.equal(response.body, 'Invalid Id')
  }
})

test('ID validation accepts large numeric ids', async () => {
  const user = await createUser()
  const cookie = await loginCookie(user.email, user.password)

  const response = await request(app)
    .get('/projects/2000000000')
    .set('Cookie', cookie)

  assert.equal(response.status, 404)
  assert.equal(response.body, 'Project does not exist')
})

test('origin validation allows state-changing requests from an allowed origin', async () => {
  const user = await createUser()

  const response = await request(app)
    .post('/auth/login')
    .set('Origin', ORIGIN)
    .send({ email: user.email, password: user.password })

  assert.equal(response.status, 200)
})

test('origin validation rejects state-changing requests from a disallowed origin', async () => {
  const response = await request(app)
    .post('/auth/login')
    .set('Origin', 'http://evil.example')
    .send({ email: 'nobody@example.com', password: 'Password123' })

  assert.equal(response.status, 403)
  assert.deepEqual(response.body, { error: 'Forbidden: Invalid origin' })
})

test('origin validation rejects state-changing requests without an origin', async () => {
  const response = await request(app)
    .post('/auth/login')
    .send({ email: 'nobody@example.com', password: 'Password123' })

  assert.equal(response.status, 403)
  assert.deepEqual(response.body, { error: 'Forbidden: Invalid origin' })
})

test('origin validation allows safe requests without an origin', async () => {
  const response = await request(app).get('/health')

  assert.equal(response.status, 200)
  assert.deepEqual(response.body, { status: 'ok', service: 'LaunchStack API' })
})
