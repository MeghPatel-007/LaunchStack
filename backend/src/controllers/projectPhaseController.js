// ? handles this requests and responses
// POST /projects/:projectId/phases
// GET /projects/:projectId/phases
// GET /phases/:id
// PUT /phases/:id
// DELETE /phases/:id

import pool from '../../db/pool.js'

export async function createPhase(req, res) {
  const id = req.params.projectId
  const { name, description, status, position, start_time, finished_time } =
    req.body
  const validStatus = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']
  try {
    const projectIdcheck = await pool.query(
      `
        select project_id
        from projects
        where project_id = $1`,
      [id],
    )
    if (projectIdcheck.rowCount === 0) {
      return res.status(404).json({ error: 'Project does not exists' })
    }
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Phase Name is missing or empty' })
    }
    if (
      typeof position !== 'number' ||
      !Number.isInteger(position) ||
      position < 1
    ) {
      return res
        .status(400) // error status code
        .json({ error: 'Phase Position is missing or negative integer' })
    }
    const positionCheck = await pool.query(
      `
        select position
        from project_phases
        where project_id = $1 and position = $2
        `,
      [id, position],
    )
    if (positionCheck.rowCount > 0) {
      return res
        .status(400) // error status code
        .json({ error: 'Position for that project already exists' })
    }
    if (typeof status !== 'string' || !validStatus.includes(status)) {
      return res
        .status(400) // error status code
        .json({ error: 'Invalid Phase status' })
    }
    if (
      status === 'NOT_STARTED' &&
      (start_time !== null || finished_time !== null)
    ) {
      return res.status(400).json({ error: 'start_time is empty or missing' })
    }
    if (
      status === 'IN_PROGRESS' &&
      (start_time === null || finished_time !== null)
    ) {
      return res.status(400).json({ error: 'start_time is empty or missing' })
    }
    if (
      status === 'COMPLETED' &&
      (start_time === null ||
        finished_time === null ||
        finished_time < start_time)
    ) {
      return res
        .status(400)
        .json({ error: 'Start_time or Finished_time is empty or invalid' })
    }
    const query = `
        insert into project_phases(project_id,name, description, status, position, start_time, finished_time)
        values ($1,$2,$3,$4,$5,$6,$7)
        returning *
    `
    const result = await pool.query(query, [
      id, // dependency
      name, //not null
      description,
      status, //not null => condn
      position, //not null
      start_time,
      finished_time,
    ])
    res.status(201).json({
      msg: 'Project Phase is created successfully',
      phase: result.rows[0],
    })
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function getPhases(req, res) {
  try {
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function getPhaseById(req, res) {
  try {
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function putPhaseById(req, res) {
  try {
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function deletePhaseById(req, res) {
  try {
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}
