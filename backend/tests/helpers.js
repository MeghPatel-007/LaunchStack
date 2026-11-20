import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { app } from '../src/app.js'
import pool from '../src/db/pool.js'
import {
  loginRateLimiter,
  registerRateLimiter,
} from '../src/middleware/limiter.js'

const loopbackKeys = ['127.0.0.1', '::1', '::ffff:127.0.0.1']
const ORIGIN = 'http://localhost:3000'

export function assertTestEnvironment() {
  assert.equal(process.env.NODE_ENV, 'test', 'tests must run with NODE_ENV=test')
  assert.ok(
    process.env.DB_NAME?.endsWith('_test'),
    'refusing to run against a non-test database',
  )
}

export async function resetLimiters() {
  for (const limiter of [loginRateLimiter, registerRateLimiter]) {
    for (const key of loopbackKeys) {
      await limiter.resetKey(key)
    }
  }
}

export function uniqueEmail(prefix = 'user') {
  return `${prefix}-${randomUUID()}@example.com`
}

export async function registerUser(overrides = {}) {
  await resetLimiters()
  const email = (overrides.email ?? uniqueEmail('user')).trim().toLowerCase()
  const password = overrides.password ?? 'TestPassword123'
  const response = await request(app)
    .post('/auth/register')
    .set('Origin', ORIGIN)
    .send({ username: 'Test User', email, password, ...overrides })

  assert.equal(response.status, 201, 'expected user registration to succeed')
  return { email, password, userId: response.body.userId }
}

export async function loginCookie(email, password) {
  await resetLimiters()
  const response = await request(app)
    .post('/auth/login')
    .set('Origin', ORIGIN)
    .send({ email, password })

  assert.equal(response.status, 200, 'expected login to succeed')
  return response.headers['set-cookie'][0].split(';')[0]
}

export async function createProject(cookie, overrides = {}) {
  const response = await request(app)
    .post('/projects')
    .set('Cookie', cookie)
    .set('Origin', ORIGIN)
    .send({
      name: 'Test Project',
      description: 'Project description',
      project_type: 'web',
      tech_stack: 'react',
      ...overrides,
    })

  assert.equal(response.status, 201, 'expected project creation to succeed')
  return response.body.projectID
}

export async function createPhase(cookie, projectId, overrides = {}) {
  const response = await request(app)
    .post(`/projects/${projectId}/phases`)
    .set('Cookie', cookie)
    .set('Origin', ORIGIN)
    .send({
      name: 'Test Phase',
      description: 'Phase description',
      status: 'NOT_STARTED',
      position: 1,
      ...overrides,
    })

  assert.equal(response.status, 201, 'expected phase creation to succeed')
  return response.body.phase
}

export async function addMember(cookie, projectId, userId) {
  const response = await request(app)
    .post(`/projects/${projectId}/members`)
    .set('Cookie', cookie)
    .set('Origin', ORIGIN)
    .send({ userId })

  assert.equal(response.status, 200, 'expected member creation to succeed')
}

// Projects cascade to phases and memberships. Users are deleted last so the
// membership foreign keys never block cleanup.
export async function cleanup({ projectIds = [], emails = [] } = {}) {
  if (projectIds.length > 0) {
    await pool.query('DELETE FROM projects WHERE project_id = ANY($1::int[])', [
      projectIds,
    ])
  }
  if (emails.length > 0) {
    await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [
      emails,
    ])
  }
}

export async function closePool() {
  // Bun runs every test file in one process, so ending the shared pool would
  // break the files that run after this one.
  if (typeof Bun !== 'undefined') return
  await pool.end()
}

export { app, pool, request }
