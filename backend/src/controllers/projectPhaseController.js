// ? handles this requests and responses
// POST /projects/:projectId/phases
// GET /projects/:projectId/phases
// GET /phases/:id
// PUT /phases/:id
// DELETE /phases/:id

import pool from '../../db/pool.js'

function isParsableTime(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

export async function createPhase(req, res) {
  const id = req.params.projectId
  const { name, description, status, position, start_time , finished_time } =
    req.body
    const startTime = start_time ?? null;
    const finishedTime = finished_time ?? null;

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
      return res.status(404).json({ error: 'Project does not exist' })
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
        .json({ error: 'Position for that project already exist' })
    }
    if (typeof status !== 'string' || !validStatus.includes(status)) {
      return res
        .status(400) // error status code
        .json({ error: 'Invalid Phase status' })
    }
    if (
      status === 'NOT_STARTED' &&
      (startTime !== null || finishedTime !== null)
    ) {
      return res.status(400).json({ error: 'NOT_STARTED cannot have timestamps' })
    }
    if (
      status === 'IN_PROGRESS' &&
      (!isParsableTime(startTime) || finishedTime !== null)
    ) {
      return res.status(400).json({ error: 'IN_PROGRESS requires a valid startTime and no finished_time' })
    }
    if (
      status === 'COMPLETED' &&
      (!isParsableTime(startTime) ||
        !isParsableTime(finishedTime) ||
        new Date(finishedTime) < new Date(startTime))
    ) {
      return res
        .status(400)
        .json({ error: 'Invalid startTime or finishedTime' })
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
      startTime,
      finishedTime,
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
  const id = req.params.projectId
  try {
    const projectIdcheck = await pool.query(
      `
        select project_id
        from projects
        where project_id = $1`,
      [id],
    )
    if (projectIdcheck.rowCount === 0) {
      return res.status(404).json({ error: 'Project does not exist' })
    }
    const query = `
      select *
      from project_phases
      where project_id = $1
      order by position;
    `
    const result = await pool.query(query, [id])
    res.status(200).json(result.rows)
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function getPhaseById(req, res) {
  const id = req.params.id
  try {
    const query = `
      select *
      from project_phases
      where phase_id = $1;
    `
    const result = await pool.query(query, [id])
    if (result.rowCount === 0) {
      return res.status(404).json('Phase id does not exist')
    }
    res.status(200).json(result.rows[0])
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function putPhaseById(req, res) {
  const id = req.params.id
  const { name, description, status, position, start_time, finished_time } =
    req.body
    const startTime = start_time ?? null;
    const finishedTime = finished_time ?? null;
  const validStatus = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']
  try {
    const phaseIdcheck = await pool.query(
      `
        select phase_id
        from project_phases
        where phase_id = $1`,
      [id],
    )
    if (phaseIdcheck.rowCount === 0) {
      return res.status(404).json({ error: 'Phase id does not exist' })
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
        where project_id = (
          select project_id
          from project_phases
          where phase_id = $1
        )
        and position = $2
        and phase_id != $1
        `,
      [id, position],
    )
    if (positionCheck.rowCount > 0) {
      return res
        .status(400) // error status code
        .json({ error: 'Position is already used by another phase' })
    }
    if (typeof status !== 'string' || !validStatus.includes(status)) {
      return res
        .status(400) // error status code
        .json({ error: 'Invalid Phase status' })
    }
     if (
      status === 'NOT_STARTED' &&
      (startTime !== null || finishedTime !== null)
    ) {
      return res.status(400).json({ error: 'NOT_STARTED cannot have timestamps' })
    }
    if (
      status === 'IN_PROGRESS' &&
      (!isParsableTime(startTime) || finishedTime !== null)
    ) {
      return res.status(400).json({ error: 'IN_PROGRESS requires a valid startTime and no finished_time' })
    }
    if (
      status === 'COMPLETED' &&
      (!isParsableTime(startTime) ||
        !isParsableTime(finishedTime) ||
        new Date(finishedTime) < new Date(startTime))
    ) {
      return res
        .status(400)
        .json({ error: 'Invalid startTime or finishedTime' })
    }
    const query = `
      update project_phases
      set name = $2,
      description = $3,
      status = $4 ,
      position = $5,
      start_time = $6,
      finished_time = $7,
      updated_at = current_timestamp
      where phase_id = $1
      returning *;
    `
    const result = await pool.query(query, [
      id,
      name,
      description,
      status,
      position,
      startTime,
      finishedTime,
    ])
    res.status(200).json({
      msg: 'Project Phase is updated successfully',
      phase: result.rows[0],
    })
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function deletePhaseById(req, res) {
  const id = req.params.id
  try {
    const result = await pool.query(
      'delete from project_phases where phase_id = $1',
      [id],
    )
    if (!result.rowCount) {
      return res.status(404).json({ error: 'Id does not exist' })
    }
    res.json('successfully deleted')
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}
