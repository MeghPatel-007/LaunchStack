import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import {
  assertTestEnvironment,
  cleanup,
  closePool,
  createPhase,
  createProject,
  loginCookie,
  registerUser,
  request,
  app,
  pool,
  addMember,
} from './helpers.js'

const createdEmails = []
const createdProjectIds = []

before(async () => {
  assertTestEnvironment()
  await pool.query('SELECT 1')
})

after(async () => {
  await cleanup({ projectIds: createdProjectIds, emails: createdEmails })
  await closePool()
})

async function setupOwner(projectOverrides) {
  const owner = await registerUser()
  createdEmails.push(owner.email)
  const cookie = await loginCookie(owner.email, owner.password)
  const projectId = await createProject(cookie, projectOverrides)
  createdProjectIds.push(projectId)
  return { owner, cookie, projectId }
}

async function setupMember(projectId, ownerCookie) {
  const member = await registerUser()
  createdEmails.push(member.email)
  await addMember(ownerCookie, projectId, member.userId)
  const cookie = await loginCookie(member.email, member.password)
  return { ...member, cookie }
}

function phaseBody(overrides = {}) {
  return {
    name: 'Discovery',
    description: 'Learn the domain',
    status: 'NOT_STARTED',
    position: 1,
    ...overrides,
  }
}

test('phase routes - reject unauthenticated requests', async () => {
  const responses = await Promise.all([
    request(app).post('/projects/1/phases').send(phaseBody()),
    request(app).get('/projects/1/phases'),
    request(app).get('/phases/1'),
    request(app).put('/phases/1').send(phaseBody()),
    request(app).delete('/phases/1'),
  ])

  for (const response of responses) {
    assert.equal(response.status, 401)
    assert.deepEqual(response.body, { error: 'Authentication required' })
  }
})

test('POST /projects/:projectId/phases - creates a phase for the owner', async () => {
  const { cookie, projectId } = await setupOwner()

  const response = await request(app)
    .post(`/projects/${projectId}/phases`)
    .set('Cookie', cookie)
    .send(phaseBody())

  assert.equal(response.status, 201)
  assert.equal(response.body.msg, 'Project Phase is created successfully')
  assert.equal(response.body.phase.project_id, projectId)
  assert.equal(response.body.phase.name, 'Discovery')
  assert.equal(response.body.phase.position, 1)
  assert.equal(response.body.phase.status, 'NOT_STARTED')
  assert.equal(response.body.phase.start_time, null)
  assert.equal(response.body.phase.finished_time, null)

  const stored = await pool.query(
    'SELECT name, description, status, position FROM project_phases WHERE phase_id = $1',
    [response.body.phase.phase_id],
  )
  assert.deepEqual(stored.rows[0], {
    name: 'Discovery',
    description: 'Learn the domain',
    status: 'NOT_STARTED',
    position: 1,
  })
})

test('POST /projects/:projectId/phases - accepts phase descriptions as optional', async () => {
  const { cookie, projectId } = await setupOwner()

  const response = await request(app)
    .post(`/projects/${projectId}/phases`)
    .set('Cookie', cookie)
    .send({ name: 'Build', status: 'NOT_STARTED', position: 1 })

  assert.equal(response.status, 201)
  assert.equal(response.body.phase.description, null)
})

test('POST /projects/:projectId/phases - accepts a null description', async () => {
  const { cookie, projectId } = await setupOwner()

  const response = await request(app)
    .post(`/projects/${projectId}/phases`)
    .set('Cookie', cookie)
    .send({
      name: 'Null description',
      description: null,
      status: 'NOT_STARTED',
      position: 1,
    })

  assert.equal(response.status, 201)
  assert.equal(response.body.phase.description, null)
})

test('POST /projects/:projectId/phases - enforces status and timestamp rules', async () => {
  const { cookie, projectId } = await setupOwner()

  const cases = [
    [{ status: 'DONE' }, 'Invalid Phase status'],
    [{ status: 'NOT_STARTED', start_time: '2026-01-01' }, 'NOT_STARTED cannot have timestamps'],
    [
      { status: 'NOT_STARTED', finished_time: '2026-01-02' },
      'NOT_STARTED cannot have timestamps',
    ],
    [{ status: 'IN_PROGRESS' }, 'IN_PROGRESS requires a valid startTime and no finished_time'],
    [
      { status: 'IN_PROGRESS', start_time: 'not-a-date' },
      'IN_PROGRESS requires a valid startTime and no finished_time',
    ],
    [
      { status: 'IN_PROGRESS', start_time: '2026-01-01', finished_time: '2026-01-02' },
      'IN_PROGRESS requires a valid startTime and no finished_time',
    ],
    [{ status: 'COMPLETED', start_time: '2026-01-01' }, 'Invalid startTime or finishedTime'],
    [
      { status: 'COMPLETED', start_time: '2026-01-05', finished_time: '2026-01-01' },
      'Invalid startTime or finishedTime',
    ],
  ]

  for (const [overrides, error] of cases) {
    const response = await request(app)
      .post(`/projects/${projectId}/phases`)
      .set('Cookie', cookie)
      .send(phaseBody(overrides))

    assert.equal(response.status, 400)
    assert.deepEqual(response.body, { error })
  }
})

test('POST /projects/:projectId/phases - stores timestamps for started and finished phases', async () => {
  const { cookie, projectId } = await setupOwner()

  const inProgress = await request(app)
    .post(`/projects/${projectId}/phases`)
    .set('Cookie', cookie)
    .send(
      phaseBody({
        status: 'IN_PROGRESS',
        position: 1,
        start_time: '2026-02-01T10:00:00Z',
      }),
    )
  assert.equal(inProgress.status, 201)
  assert.equal(
    new Date(inProgress.body.phase.start_time).toISOString(),
    '2026-02-01T10:00:00.000Z',
  )

  const completed = await request(app)
    .post(`/projects/${projectId}/phases`)
    .set('Cookie', cookie)
    .send(
      phaseBody({
        status: 'COMPLETED',
        position: 2,
        start_time: '2026-02-01T10:00:00Z',
        finished_time: '2026-02-03T10:00:00Z',
      }),
    )
  assert.equal(completed.status, 201)
  assert.equal(completed.body.phase.finished_time !== null, true)
})

test('POST /projects/:projectId/phases - validates the body', async () => {
  const { cookie, projectId } = await setupOwner()

  const cases = [
    [{ name: undefined }, 'name is required and must be a non-empty string'],
    [{ name: '   ' }, 'name is required and must be a non-empty string'],
    [{ status: undefined }, 'status is required and must be a non-empty string'],
    [{ status: 42 }, 'status is required and must be a non-empty string'],
    [{ position: undefined }, 'position must be a positive integer'],
    [{ position: 0 }, 'position must be a positive integer'],
    [{ position: -3 }, 'position must be a positive integer'],
    [{ position: 1.5 }, 'position must be a positive integer'],
    [{ position: '1' }, 'position must be a positive integer'],
    [{ description: 99 }, 'description must be a string if provided'],
  ]

  for (const [overrides, error] of cases) {
    const response = await request(app)
      .post(`/projects/${projectId}/phases`)
      .set('Cookie', cookie)
      .send(phaseBody(overrides))

    assert.equal(response.status, 400)
    assert.deepEqual(response.body, { error })
  }
})

test('POST /projects/:projectId/phases - rejects duplicate positions per project', async () => {
  const { cookie, projectId } = await setupOwner()
  await createPhase(cookie, projectId, { position: 1 })

  const duplicate = await request(app)
    .post(`/projects/${projectId}/phases`)
    .set('Cookie', cookie)
    .send(phaseBody({ position: 1 }))

  assert.equal(duplicate.status, 409)
  assert.deepEqual(duplicate.body, {
    error: 'Position for that project already exist',
  })

  const otherProjectId = await createProject(cookie, { name: 'Other' })
  createdProjectIds.push(otherProjectId)

  const reusedAcrossProjects = await request(app)
    .post(`/projects/${otherProjectId}/phases`)
    .set('Cookie', cookie)
    .send(phaseBody({ position: 1 }))

  assert.equal(reusedAcrossProjects.status, 201)
})

test('POST /projects/:projectId/phases - enforces project ownership', async () => {
  const { cookie, projectId } = await setupOwner()
  const member = await setupMember(projectId, cookie)
  const outsider = await registerUser()
  createdEmails.push(outsider.email)
  const outsiderCookie = await loginCookie(outsider.email, outsider.password)

  const asMember = await request(app)
    .post(`/projects/${projectId}/phases`)
    .set('Cookie', member.cookie)
    .send(phaseBody())
  assert.equal(asMember.status, 403)
  assert.equal(asMember.body, 'Only project owners are allowed')

  const asOutsider = await request(app)
    .post(`/projects/${projectId}/phases`)
    .set('Cookie', outsiderCookie)
    .send(phaseBody())
  assert.equal(asOutsider.status, 403)
  assert.equal(asOutsider.body, 'Only project owners are allowed')

  const count = await pool.query(
    'SELECT 1 FROM project_phases WHERE project_id = $1',
    [projectId],
  )
  assert.equal(count.rowCount, 0)
})

test('POST /projects/:projectId/phases - rejects invalid or unknown projects', async () => {
  const { cookie } = await setupOwner()

  const invalid = await request(app)
    .post('/projects/abc/phases')
    .set('Cookie', cookie)
    .send(phaseBody())
  assert.equal(invalid.status, 400)
  assert.equal(invalid.body, 'Invalid Id')

  const missing = await request(app)
    .post('/projects/2000000000/phases')
    .set('Cookie', cookie)
    .send(phaseBody())
  assert.equal(missing.status, 404)
  assert.equal(missing.body, 'Project doesnot exist')
})

test('GET /projects/:projectId/phases - lists phases ordered by position', async () => {
  const { cookie, projectId } = await setupOwner()
  await createPhase(cookie, projectId, { name: 'Third', position: 3 })
  await createPhase(cookie, projectId, { name: 'First', position: 1 })
  await createPhase(cookie, projectId, { name: 'Second', position: 2 })

  const asOwner = await request(app)
    .get(`/projects/${projectId}/phases`)
    .set('Cookie', cookie)

  assert.equal(asOwner.status, 200)
  assert.deepEqual(
    asOwner.body.map((phase) => phase.name),
    ['First', 'Second', 'Third'],
  )

  const member = await setupMember(projectId, cookie)
  const asMember = await request(app)
    .get(`/projects/${projectId}/phases`)
    .set('Cookie', member.cookie)

  assert.equal(asMember.status, 200)
  assert.equal(asMember.body.length, 3)
})

test('GET /projects/:projectId/phases - returns an empty list for a project without phases', async () => {
  const { cookie, projectId } = await setupOwner()

  const response = await request(app)
    .get(`/projects/${projectId}/phases`)
    .set('Cookie', cookie)

  assert.equal(response.status, 200)
  assert.deepEqual(response.body, [])
})

test('GET /projects/:projectId/phases - rejects invalid, unknown, and foreign projects', async () => {
  const { projectId } = await setupOwner()
  const outsider = await registerUser()
  createdEmails.push(outsider.email)
  const outsiderCookie = await loginCookie(outsider.email, outsider.password)

  const invalid = await request(app)
    .get('/projects/abc/phases')
    .set('Cookie', outsiderCookie)
  assert.equal(invalid.status, 400)
  assert.equal(invalid.body, 'Invalid Id')

  const missing = await request(app)
    .get('/projects/2000000000/phases')
    .set('Cookie', outsiderCookie)
  assert.equal(missing.status, 404)
  assert.equal(missing.body, 'Project doesnot exist')

  const forbidden = await request(app)
    .get(`/projects/${projectId}/phases`)
    .set('Cookie', outsiderCookie)
  assert.equal(forbidden.status, 403)
  assert.equal(forbidden.body, 'Non members are not allowed')
})

test('GET /phases/:id - returns a phase to project members', async () => {
  const { cookie, projectId } = await setupOwner()
  const phase = await createPhase(cookie, projectId)
  const member = await setupMember(projectId, cookie)

  const response = await request(app)
    .get(`/phases/${phase.phase_id}`)
    .set('Cookie', member.cookie)

  assert.equal(response.status, 200)
  assert.equal(response.body.phase_id, phase.phase_id)
  assert.equal(response.body.project_id, projectId)
})

test('GET /phases/:id - rejects invalid ids, unknown phases, and non-members', async () => {
  const { cookie, projectId } = await setupOwner()
  const phase = await createPhase(cookie, projectId)
  const outsider = await registerUser()
  createdEmails.push(outsider.email)
  const outsiderCookie = await loginCookie(outsider.email, outsider.password)

  const invalid = await request(app)
    .get('/phases/abc')
    .set('Cookie', outsiderCookie)
  assert.equal(invalid.status, 400)
  assert.equal(invalid.body, 'Invalid Id')

  const unknown = await request(app)
    .get('/phases/2000000000')
    .set('Cookie', outsiderCookie)
  assert.equal(unknown.status, 404)
  assert.equal(unknown.body, 'Phase does not exist')

  const forbidden = await request(app)
    .get(`/phases/${phase.phase_id}`)
    .set('Cookie', outsiderCookie)
  assert.equal(forbidden.status, 403)
  assert.equal(forbidden.body, 'Non members are not allowed')
})

test('PUT /phases/:id - updates a phase as the owner', async () => {
  const { cookie, projectId } = await setupOwner()
  const phase = await createPhase(cookie, projectId)

  const response = await request(app)
    .put(`/phases/${phase.phase_id}`)
    .set('Cookie', cookie)
    .send({
      name: 'Delivery',
      description: 'Ship it',
      status: 'IN_PROGRESS',
      position: 2,
      start_time: '2026-03-01T09:00:00Z',
    })

  assert.equal(response.status, 200)
  assert.equal(response.body.msg, 'Project Phase is updated successfully')
  assert.equal(response.body.phase.name, 'Delivery')
  assert.equal(response.body.phase.status, 'IN_PROGRESS')
  assert.equal(response.body.phase.position, 2)
  assert.equal(
    new Date(response.body.phase.start_time).toISOString(),
    '2026-03-01T09:00:00.000Z',
  )
  assert.equal(response.body.phase.finished_time, null)
  assert.equal(
    new Date(response.body.phase.updated_at) >= new Date(phase.updated_at),
    true,
  )

  const stored = await pool.query(
    'SELECT name, description, status, position FROM project_phases WHERE phase_id = $1',
    [phase.phase_id],
  )
  assert.deepEqual(stored.rows[0], {
    name: 'Delivery',
    description: 'Ship it',
    status: 'IN_PROGRESS',
    position: 2,
  })
})

test('PUT /phases/:id - accepts a null optional description', async () => {
  const { cookie, projectId } = await setupOwner()
  const phase = await createPhase(cookie, projectId)

  const response = await request(app)
    .put(`/phases/${phase.phase_id}`)
    .set('Cookie', cookie)
    .send({
      name: 'Cleared',
      description: null,
      status: 'NOT_STARTED',
      position: 1,
    })

  assert.equal(response.status, 200)
  assert.equal(response.body.phase.description, null)

  const stored = await pool.query(
    'SELECT description FROM project_phases WHERE phase_id = $1',
    [phase.phase_id],
  )
  assert.equal(stored.rows[0].description, null)
})

test('PUT /phases/:id - allows keeping the current position and completing a phase', async () => {
  const { cookie, projectId } = await setupOwner()
  const phase = await createPhase(cookie, projectId, {
    status: 'IN_PROGRESS',
    position: 1,
    start_time: '2026-03-01T09:00:00Z',
  })

  const response = await request(app)
    .put(`/phases/${phase.phase_id}`)
    .set('Cookie', cookie)
    .send({
      name: 'Done',
      status: 'COMPLETED',
      position: 1,
      start_time: '2026-03-01T09:00:00Z',
      finished_time: '2026-03-10T09:00:00Z',
    })

  assert.equal(response.status, 200)
  assert.equal(response.body.phase.status, 'COMPLETED')
  assert.equal(
    new Date(response.body.phase.finished_time).toISOString(),
    '2026-03-10T09:00:00.000Z',
  )
})

test('PUT /phases/:id - rejects positions used by another phase', async () => {
  const { cookie, projectId } = await setupOwner()
  await createPhase(cookie, projectId, { position: 1 })
  const second = await createPhase(cookie, projectId, { position: 2 })

  const response = await request(app)
    .put(`/phases/${second.phase_id}`)
    .set('Cookie', cookie)
    .send(phaseBody({ position: 1 }))

  assert.equal(response.status, 409)
  assert.deepEqual(response.body, {
    error: 'Position is already used by another phase',
  })
})

test('PUT /phases/:id - enforces status and timestamp rules', async () => {
  const { cookie, projectId } = await setupOwner()
  const phase = await createPhase(cookie, projectId)

  const cases = [
    [{ status: 'ARCHIVED' }, 'Invalid Phase status'],
    [{ status: 'NOT_STARTED', start_time: '2026-01-01' }, 'NOT_STARTED cannot have timestamps'],
    [{ status: 'IN_PROGRESS' }, 'IN_PROGRESS requires a valid startTime and no finished_time'],
    [
      { status: 'COMPLETED', start_time: '2026-04-02', finished_time: '2026-04-01' },
      'Invalid startTime or finishedTime',
    ],
  ]

  for (const [overrides, error] of cases) {
    const response = await request(app)
      .put(`/phases/${phase.phase_id}`)
      .set('Cookie', cookie)
      .send(phaseBody(overrides))

    assert.equal(response.status, 400)
    assert.deepEqual(response.body, { error })
  }

  const unchanged = await pool.query(
    'SELECT name, status, position FROM project_phases WHERE phase_id = $1',
    [phase.phase_id],
  )
  assert.deepEqual(unchanged.rows[0], {
    name: 'Test Phase',
    status: 'NOT_STARTED',
    position: 1,
  })
})

test('PUT /phases/:id - validates the body', async () => {
  const { cookie, projectId } = await setupOwner()
  const phase = await createPhase(cookie, projectId)

  const cases = [
    [{ name: '' }, 'name is required and must be a non-empty string'],
    [{ status: '' }, 'status is required and must be a non-empty string'],
    [{ position: 0 }, 'position must be a positive integer'],
    [{ description: [] }, 'description must be a string if provided'],
  ]

  for (const [overrides, error] of cases) {
    const response = await request(app)
      .put(`/phases/${phase.phase_id}`)
      .set('Cookie', cookie)
      .send(phaseBody(overrides))

    assert.equal(response.status, 400)
    assert.deepEqual(response.body, { error })
  }
})

test('PUT /phases/:id - enforces ownership and existence', async () => {
  const { cookie, projectId } = await setupOwner()
  const phase = await createPhase(cookie, projectId)
  const member = await setupMember(projectId, cookie)

  const asMember = await request(app)
    .put(`/phases/${phase.phase_id}`)
    .set('Cookie', member.cookie)
    .send(phaseBody())
  assert.equal(asMember.status, 403)
  assert.equal(asMember.body, 'Only project owners are allowed')

  const unknown = await request(app)
    .put('/phases/2000000000')
    .set('Cookie', cookie)
    .send(phaseBody())
  assert.equal(unknown.status, 404)
  assert.equal(unknown.body, 'Phase does not exist')

  const invalidId = await request(app)
    .put('/phases/abc')
    .set('Cookie', cookie)
    .send(phaseBody())
  assert.equal(invalidId.status, 400)
  assert.equal(invalidId.body, 'Invalid Id')
})

test('DELETE /phases/:id - deletes a phase as the owner', async () => {
  const { cookie, projectId } = await setupOwner()
  const phase = await createPhase(cookie, projectId)

  const response = await request(app)
    .delete(`/phases/${phase.phase_id}`)
    .set('Cookie', cookie)

  assert.equal(response.status, 200)
  assert.equal(response.body, 'successfully deleted')

  const stored = await pool.query(
    'SELECT 1 FROM project_phases WHERE phase_id = $1',
    [phase.phase_id],
  )
  assert.equal(stored.rowCount, 0)

  // The freed position can be reused.
  const replacement = await request(app)
    .post(`/projects/${projectId}/phases`)
    .set('Cookie', cookie)
    .send(phaseBody())
  assert.equal(replacement.status, 201)
})

test('DELETE /phases/:id - enforces ownership and existence', async () => {
  const { cookie, projectId } = await setupOwner()
  const phase = await createPhase(cookie, projectId)
  const member = await setupMember(projectId, cookie)

  const asMember = await request(app)
    .delete(`/phases/${phase.phase_id}`)
    .set('Cookie', member.cookie)
  assert.equal(asMember.status, 403)
  assert.equal(asMember.body, 'Only project owners are allowed')

  const stillThere = await pool.query(
    'SELECT 1 FROM project_phases WHERE phase_id = $1',
    [phase.phase_id],
  )
  assert.equal(stillThere.rowCount, 1)

  const unknown = await request(app)
    .delete('/phases/2000000000')
    .set('Cookie', cookie)
  assert.equal(unknown.status, 404)
  assert.equal(unknown.body, 'Phase does not exist')

  const invalidId = await request(app)
    .delete('/phases/abc')
    .set('Cookie', cookie)
  assert.equal(invalidId.status, 400)
  assert.equal(invalidId.body, 'Invalid Id')
})
