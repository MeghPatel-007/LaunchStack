import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import {
  addMember,
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

async function setupMember(projectId, cookie) {
  const member = await registerUser()
  createdEmails.push(member.email)
  await addMember(cookie, projectId, member.userId)
  const memberCookie = await loginCookie(member.email, member.password)
  return { ...member, cookie: memberCookie }
}

test('GET /projects - rejects unauthenticated requests', async () => {
  const responses = await Promise.all([
    request(app).get('/projects'),
    request(app).get('/projects/stats'),
    request(app).post('/projects').send({ name: 'x', project_type: 'y' }),
    request(app).get('/projects/1'),
    request(app).put('/projects/1').send({ name: 'x', project_type: 'y' }),
    request(app).delete('/projects/1'),
    request(app).get('/projects/1/members'),
    request(app).post('/projects/1/members').send({ userId: 1 }),
    request(app).delete('/projects/1/members/1'),
  ])

  for (const response of responses) {
    assert.equal(response.status, 401)
    assert.deepEqual(response.body, { error: 'Authentication required' })
  }
})

test('POST /projects - creates a project and its owner membership', async () => {
  const owner = await registerUser()
  createdEmails.push(owner.email)
  const cookie = await loginCookie(owner.email, owner.password)

  const response = await request(app)
    .post('/projects')
    .set('Cookie', cookie)
    .send({
      name: '  Trimmed Project  ',
      description: 'Description',
      project_type: '  web  ',
      tech_stack: 'react',
    })

  assert.equal(response.status, 201)
  assert.equal(response.body.msg, 'Project created successfully')
  assert.equal(typeof response.body.projectID, 'number')
  createdProjectIds.push(response.body.projectID)

  const project = await pool.query(
    'SELECT name, description, project_type, tech_stack FROM projects WHERE project_id = $1',
    [response.body.projectID],
  )
  assert.equal(project.rows[0].name, 'Trimmed Project')
  assert.equal(project.rows[0].project_type, 'web')

  const membership = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [response.body.projectID, owner.userId],
  )
  assert.equal(membership.rows[0].role, 'OWNER')
})

test('POST /projects - accepts a project without optional fields', async () => {
  const owner = await registerUser()
  createdEmails.push(owner.email)
  const cookie = await loginCookie(owner.email, owner.password)

  const response = await request(app)
    .post('/projects')
    .set('Cookie', cookie)
    .send({ name: 'Minimal', project_type: 'api' })

  assert.equal(response.status, 201)
  createdProjectIds.push(response.body.projectID)

  const project = await pool.query(
    'SELECT description, tech_stack FROM projects WHERE project_id = $1',
    [response.body.projectID],
  )
  assert.equal(project.rows[0].description, null)
  assert.equal(project.rows[0].tech_stack, null)
})

test('POST /projects - accepts null optional fields', async () => {
  const owner = await registerUser()
  createdEmails.push(owner.email)
  const cookie = await loginCookie(owner.email, owner.password)

  const response = await request(app)
    .post('/projects')
    .set('Cookie', cookie)
    .send({
      name: 'Null optionals',
      project_type: 'web',
      description: null,
      tech_stack: null,
    })

  assert.equal(response.status, 201)
  createdProjectIds.push(response.body.projectID)

  const project = await pool.query(
    'SELECT description, tech_stack FROM projects WHERE project_id = $1',
    [response.body.projectID],
  )
  assert.equal(project.rows[0].description, null)
  assert.equal(project.rows[0].tech_stack, null)
})

test('POST /projects - rejects missing and invalid required fields', async () => {
  const owner = await registerUser()
  createdEmails.push(owner.email)
  const cookie = await loginCookie(owner.email, owner.password)

  const cases = [
    [{ project_type: 'web' }, 'name is required and must be a non-empty string'],
    [{ name: 'x' }, 'project_type is required and must be a non-empty string'],
    [{ name: '   ', project_type: 'web' }, 'name is required and must be a non-empty string'],
    [{ name: 'x', project_type: '' }, 'project_type is required and must be a non-empty string'],
    [{ name: 123, project_type: 'web' }, 'name is required and must be a non-empty string'],
  ]

  for (const [body, error] of cases) {
    const response = await request(app)
      .post('/projects')
      .set('Cookie', cookie)
      .send(body)

    assert.equal(response.status, 400)
    assert.deepEqual(response.body, { error })
  }
})

test('POST /projects - rejects non-string optional fields', async () => {
  const { cookie } = await setupOwner()

  for (const field of ['description', 'tech_stack']) {
    const response = await request(app)
      .post('/projects')
      .set('Cookie', cookie)
      .send({ name: 'x', project_type: 'web', [field]: 42 })

    assert.equal(response.status, 400)
    assert.deepEqual(response.body, { error: `${field} must be a string if provided` })
  }
})

test('GET /projects - lists only projects the user belongs to', async () => {
  const { cookie, projectId } = await setupOwner({ name: 'Listed', project_type: 'web' })
  const outsider = await registerUser()
  createdEmails.push(outsider.email)
  const outsiderCookie = await loginCookie(outsider.email, outsider.password)

  const ownerList = await request(app).get('/projects').set('Cookie', cookie)
  const outsiderList = await request(app)
    .get('/projects')
    .set('Cookie', outsiderCookie)

  assert.equal(ownerList.status, 200)
  assert.equal(
    ownerList.body.some((project) => project.project_id === projectId),
    true,
  )
  assert.equal(
    outsiderList.body.some((project) => project.project_id === projectId),
    false,
  )
})

test('GET /projects - includes shared projects with the member role', async () => {
  const { cookie, projectId } = await setupOwner()
  const member = await setupMember(projectId, cookie)

  const response = await request(app)
    .get('/projects')
    .set('Cookie', member.cookie)

  const project = response.body.find((row) => row.project_id === projectId)
  assert.equal(project.role, 'MEMBER')
})

test('GET /projects?type= - filters by project type', async () => {
  const { cookie, projectId } = await setupOwner({
    name: 'Web Project',
    project_type: 'web',
  })
  const apiProjectId = await createProject(cookie, {
    name: 'API Project',
    project_type: 'api',
  })
  createdProjectIds.push(apiProjectId)

  const web = await request(app)
    .get('/projects?type=web')
    .set('Cookie', cookie)
  const api = await request(app)
    .get('/projects?type=api')
    .set('Cookie', cookie)

  assert.deepEqual(
    web.body.map((project) => project.project_id),
    [projectId],
  )
  assert.deepEqual(
    api.body.map((project) => project.project_id),
    [apiProjectId],
  )
})

test('GET /projects/:id - returns a project for a member', async () => {
  const { cookie, projectId, owner } = await setupOwner()
  const member = await setupMember(projectId, cookie)

  const response = await request(app)
    .get(`/projects/${projectId}`)
    .set('Cookie', member.cookie)

  assert.equal(response.status, 200)
  assert.equal(response.body.project_id, projectId)
  assert.equal(response.body.name, 'Test Project')
  assert.equal(response.body.role, 'MEMBER')
  assert.equal(response.body.project_id === owner.userId, false)
})

test('GET /projects/:id - rejects non-members, unknown ids, and invalid ids', async () => {
  const { projectId } = await setupOwner()
  const outsider = await registerUser()
  createdEmails.push(outsider.email)
  const outsiderCookie = await loginCookie(outsider.email, outsider.password)

  const forbidden = await request(app)
    .get(`/projects/${projectId}`)
    .set('Cookie', outsiderCookie)
  assert.equal(forbidden.status, 403)
  assert.equal(forbidden.body, 'Non members are not allowed')

  const missing = await request(app)
    .get('/projects/2000000000')
    .set('Cookie', outsiderCookie)
  assert.equal(missing.status, 404)
  assert.equal(missing.body, 'Project does not exist')

  const invalid = await request(app)
    .get('/projects/not-a-number')
    .set('Cookie', outsiderCookie)
  assert.equal(invalid.status, 400)
  assert.equal(invalid.body, 'Invalid Id')
})

test('PUT /projects/:id - updates a project as its owner', async () => {
  const { cookie, projectId } = await setupOwner()

  const response = await request(app)
    .put(`/projects/${projectId}`)
    .set('Cookie', cookie)
    .send({
      name: '  Renamed  ',
      description: 'Updated description',
      project_type: ' mobile ',
      tech_stack: 'nextjs',
    })

  assert.equal(response.status, 200)
  assert.deepEqual(response.body, {
    msg: 'Project updated successfully',
    project_id: projectId,
  })

  const project = await pool.query(
    'SELECT name, description, project_type, tech_stack FROM projects WHERE project_id = $1',
    [projectId],
  )
  assert.equal(project.rows[0].name, 'Renamed')
  assert.equal(project.rows[0].description, 'Updated description')
  assert.equal(project.rows[0].project_type, 'mobile')
  assert.equal(project.rows[0].tech_stack, 'nextjs')
})

test('PUT /projects/:id - accepts a null optional description', async () => {
  const { cookie, projectId } = await setupOwner()

  const response = await request(app)
    .put(`/projects/${projectId}`)
    .set('Cookie', cookie)
    .send({ name: 'Cleared', project_type: 'web', description: null })

  assert.equal(response.status, 200)

  const project = await pool.query(
    'SELECT description FROM projects WHERE project_id = $1',
    [projectId],
  )
  assert.equal(project.rows[0].description, null)
})

test('PUT /projects/:id - rejects members, non-members, and missing projects', async () => {
  const { cookie, projectId } = await setupOwner()
  const member = await setupMember(projectId, cookie)

  const memberResponse = await request(app)
    .put(`/projects/${projectId}`)
    .set('Cookie', member.cookie)
    .send({ name: 'x', project_type: 'web' })
  assert.equal(memberResponse.status, 403)
  assert.equal(memberResponse.body, 'Only project owners are allowed')

  const missing = await request(app)
    .put('/projects/2000000000')
    .set('Cookie', cookie)
    .send({ name: 'x', project_type: 'web' })
  assert.equal(missing.status, 404)
  assert.equal(missing.body, 'Project does not exist')
})

test('PUT /projects/:id - rejects invalid bodies', async () => {
  const { cookie, projectId } = await setupOwner()

  const response = await request(app)
    .put(`/projects/${projectId}`)
    .set('Cookie', cookie)
    .send({ name: '', project_type: 'web' })

  assert.equal(response.status, 400)
  assert.deepEqual(response.body, {
    error: 'name is required and must be a non-empty string',
  })
})

test('DELETE /projects/:id - deletes the project and cascades phases and members', async () => {
  const { cookie, projectId, owner } = await setupOwner()
  await createPhase(cookie, projectId)

  const response = await request(app)
    .delete(`/projects/${projectId}`)
    .set('Cookie', cookie)

  assert.equal(response.status, 200)
  assert.equal(response.body, 'successfully deleted')

  const project = await pool.query('SELECT 1 FROM projects WHERE project_id = $1', [
    projectId,
  ])
  const phases = await pool.query(
    'SELECT 1 FROM project_phases WHERE project_id = $1',
    [projectId],
  )
  const members = await pool.query(
    'SELECT 1 FROM project_members WHERE project_id = $1 OR user_id = $2',
    [projectId, owner.userId],
  )
  assert.equal(project.rowCount, 0)
  assert.equal(phases.rowCount, 0)
  assert.equal(members.rowCount, 0)
})

test('DELETE /projects/:id - rejects non-owners and missing projects', async () => {
  const { cookie, projectId } = await setupOwner()
  const member = await setupMember(projectId, cookie)

  const memberResponse = await request(app)
    .delete(`/projects/${projectId}`)
    .set('Cookie', member.cookie)
  assert.equal(memberResponse.status, 403)
  assert.equal(memberResponse.body, 'Only project owners are allowed')

  const missing = await request(app)
    .delete('/projects/2000000000')
    .set('Cookie', cookie)
  assert.equal(missing.status, 404)
  assert.equal(missing.body, 'Project does not exist')
})

test('GET /projects/stats - aggregates phase progress per project', async () => {
  const { cookie, projectId } = await setupOwner()
  await createPhase(cookie, projectId, { position: 1 })
  await createPhase(cookie, projectId, {
    name: 'Completed',
    status: 'COMPLETED',
    position: 2,
    start_time: '2026-01-01',
    finished_time: '2026-01-05',
  })

  const response = await request(app)
    .get('/projects/stats')
    .set('Cookie', cookie)

  assert.equal(response.status, 200)
  const stats = response.body.find((row) => row.project_id === projectId)
  assert.equal(stats.total_phases, 2)
  assert.equal(stats.not_started_phases, 1)
  assert.equal(stats.in_progress_phases, 0)
  assert.equal(stats.completed_phases, 1)
  assert.equal(stats.work_done, 50)
})

test('GET /projects/stats - returns zero progress for a project without phases', async () => {
  const { cookie, projectId } = await setupOwner()

  const response = await request(app)
    .get('/projects/stats')
    .set('Cookie', cookie)

  const stats = response.body.find((row) => row.project_id === projectId)
  assert.equal(stats.total_phases, 0)
  assert.equal(stats.completed_phases, 0)
  assert.equal(stats.work_done, 0)
})

test('POST /projects/:id/members - adds a member as the owner', async () => {
  const { cookie, projectId } = await setupOwner()
  const member = await registerUser()
  createdEmails.push(member.email)

  const response = await request(app)
    .post(`/projects/${projectId}/members`)
    .set('Cookie', cookie)
    .send({ userId: member.userId })

  assert.equal(response.status, 200)
  assert.equal(response.body.msg, 'User is added as a member')
  assert.deepEqual(response.body.userId, { user_id: member.userId })

  const membership = await pool.query(
    'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, member.userId],
  )
  assert.equal(membership.rows[0].role, 'MEMBER')
})

test('POST /projects/:id/members - rejects unknown users, duplicate members, and non-owners', async () => {
  const { cookie, projectId } = await setupOwner()
  const member = await setupMember(projectId, cookie)

  const unknown = await request(app)
    .post(`/projects/${projectId}/members`)
    .set('Cookie', cookie)
    .send({ userId: 2000000000 })
  assert.equal(unknown.status, 404)
  assert.equal(unknown.body, 'User id does not exists')

  const duplicate = await request(app)
    .post(`/projects/${projectId}/members`)
    .set('Cookie', cookie)
    .send({ userId: member.userId })
  assert.equal(duplicate.status, 409)
  assert.equal(duplicate.body, 'User is already a member')

  const forbidden = await request(app)
    .post(`/projects/${projectId}/members`)
    .set('Cookie', member.cookie)
    .send({ userId: 2000000000 })
  assert.equal(forbidden.status, 403)
  assert.equal(forbidden.body, 'Only project owners are allowed')
})

test('POST /projects/:id/members - validates the userId body', async () => {
  const { cookie, projectId } = await setupOwner()

  for (const userId of [undefined, '2', 0, -1, 1.5]) {
    const response = await request(app)
      .post(`/projects/${projectId}/members`)
      .set('Cookie', cookie)
      .send({ userId })

    assert.equal(response.status, 400)
    assert.deepEqual(response.body, {
      error: 'userId must be a positive integer',
    })
  }
})

test('GET /projects/:id/members - lists members with the owner first', async () => {
  const { cookie, projectId, owner } = await setupOwner()
  const member = await setupMember(projectId, cookie)

  const response = await request(app)
    .get(`/projects/${projectId}/members`)
    .set('Cookie', member.cookie)

  assert.equal(response.status, 200)
  assert.equal(response.body.length, 2)
  assert.equal(response.body[0].user_id, owner.userId)
  assert.equal(response.body[0].role, 'OWNER')
  assert.equal(response.body[1].user_id, member.userId)
  assert.equal(response.body[1].role, 'MEMBER')
  assert.equal(typeof response.body[0].username, 'string')
  assert.equal(typeof response.body[0].email, 'string')
})

test('GET /projects/:id/members - rejects non-members', async () => {
  const { projectId } = await setupOwner()
  const outsider = await registerUser()
  createdEmails.push(outsider.email)
  const outsiderCookie = await loginCookie(outsider.email, outsider.password)

  const response = await request(app)
    .get(`/projects/${projectId}/members`)
    .set('Cookie', outsiderCookie)

  assert.equal(response.status, 403)
  assert.equal(response.body, 'Non members are not allowed')
})

test('DELETE /projects/:id/members/:userId - removes a member as the owner', async () => {
  const { cookie, projectId } = await setupOwner()
  const member = await setupMember(projectId, cookie)

  const response = await request(app)
    .delete(`/projects/${projectId}/members/${member.userId}`)
    .set('Cookie', cookie)

  assert.equal(response.status, 200)
  assert.equal(response.body.msg, 'User is removed from the project')
  assert.equal(response.body.userId, member.userId)

  const membership = await pool.query(
    'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, member.userId],
  )
  assert.equal(membership.rowCount, 0)
})

test('DELETE /projects/:id/members/:userId - rejects self-removal, unknown members, and non-owners', async () => {
  const { cookie, projectId, owner } = await setupOwner()
  const member = await setupMember(projectId, cookie)

  const self = await request(app)
    .delete(`/projects/${projectId}/members/${owner.userId}`)
    .set('Cookie', cookie)
  assert.equal(self.status, 403)
  assert.equal(self.body, 'Project owner cannot remove themselves')

  const unknown = await request(app)
    .delete(`/projects/${projectId}/members/2000000000`)
    .set('Cookie', cookie)
  assert.equal(unknown.status, 404)
  assert.equal(unknown.body, 'User is not a member of this project')

  const forbidden = await request(app)
    .delete(`/projects/${projectId}/members/${owner.userId}`)
    .set('Cookie', member.cookie)
  assert.equal(forbidden.status, 403)
  assert.equal(forbidden.body, 'Only project owners are allowed')
})

test('DELETE /projects/:id/members/:userId - validates both ids', async () => {
  const { cookie, projectId } = await setupOwner()

  const invalidUser = await request(app)
    .delete(`/projects/${projectId}/members/abc`)
    .set('Cookie', cookie)
  assert.equal(invalidUser.status, 400)
  assert.equal(invalidUser.body, 'Invalid Id')

  const invalidProject = await request(app)
    .delete('/projects/abc/members/1')
    .set('Cookie', cookie)
  assert.equal(invalidProject.status, 400)
  assert.equal(invalidProject.body, 'Invalid Id')
})
