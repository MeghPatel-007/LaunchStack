import pool from '../../db/pool.js'
// ! never make circular dependencies
// * experimental data
// const data = {
//   1: { name: 'Project1', id: 1, type: 'software' },
//   2: { name: 'Project2', id: 2, type: 'hardware' },
//   3: { name: 'Project3', id: 3, type: 'software' },
// }
// const dataStats = {
//   1: { workDone: '10%', id: 1, type: 'software' },
//   2: { workDone: '30%', id: 2, type: 'hardware' },
//   3: { workDone: '100%', id: 3, type: 'software' },
// }

// * without db connection
// export function getProjects(req, res) {
// * http handler
// * route handler
//   const query = req.query //ex GET /projects?type=web%20app
//   const filteredData =
//     query.type === undefined
//       ? data
//       : Object.fromEntries(
//           Object.entries(data).filter(([k, v]) => v.type === query.type),
//         )
//   res.json(filteredData)
// }

// export function getProjectById(req, res) {
//   const id = req.params.id //ex GET /projects/1
//   if (Object.hasOwn(data, id)) res.json(data[id])
//   else {
//     res.status(404).json({ error: 'Id does not exists' }) // http status code and msg
//   }
// }

// export function createProject(req, res) {
//   const response = req.body
//   if (response != undefined && Object.keys(response).length !== 0) {
//     res.json({ msg: 'Received new project' })
//   } else {
//     res.status(400).json({ error: 'New project cannot be received' })
//   }
// }

// export function deleteProjectById(req, res) {
//   const id = req.params.id
//   if (Object.hasOwn(data, id)) {
//     delete data[id]
//     res.json(`Project ID ${id} is deleted successfully`)
//   } else {
//     res.status(404).json({ error: 'Id does not exists' })
//   }
//}

// export function getProjectStats(req, res) {
//   res.json(dataStats)
// }

// ? handles these request and responses
// GET /projects
// POST /projects
// PUT /projects/:id
// DELETE /projects/:id
// GET /projects/stats

export async function getProjects(req, res) {
  const type = req.query.type
  try {
    let result
    if (type === undefined) {
      result = await pool.query('select * from projects')
    } else {
      result = await pool.query(
        'select * from projects where project_type = $1',
        [type], // ! it is done to prevent sql injection
      ) // to check the db and db_user
    }
    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function createProject(req, res) {
  const { name, description, project_type, tech_stack } = req.body
  try {
    if (
      typeof name !== 'string' ||
      name.trim() === '' ||
      typeof project_type !== 'string' ||
      project_type.trim() === ''
    ) {
      return res.status(400).json({ error: 'New project cannot be received' })
    }
    const query = `
    insert into projects(name,description,project_type,tech_stack)
    values ($1,$2,$3,$4) returning *
    `
    const result = await pool.query(query, [
      name.trim(),
      description,
      project_type.trim(),
      tech_stack,
    ])
    res.status(201).json({
      msg: 'Project created successfully',
      project: result.rows[0],
    })
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function getProjectStats(req, res) {
  try {
    const query = `with phase_stats as (
      select pp.project_id,
      count(pp.phase_id) as total_phases,
      count(pp.status) filter(where pp.status = 'COMPLETED') as completed_phases
      from project_phases as pp
      group by pp.project_id
      )
      select p.project_id,
      p.name,
      p.project_type,
      coalesce(ps.total_phases,0)::int as total_phases,
      count(pp.status) filter(where pp.status = 'NOT_STARTED')::int as not_started_phases,
      count(pp.status) filter(where pp.status = 'IN_PROGRESS')::int as in_progress_phases,
      coalesce(ps.completed_phases,0)::int as completed_phases,
      case
        when coalesce(ps.total_phases,0) = 0
          then 0
        else
        ((ps.completed_phases::numeric / ps.total_phases)*100)::int
        end as work_done
      from projects as p
      left join project_phases as pp
      on p.project_id = pp.project_id
      left join phase_stats as ps
      on ps.project_id = p.project_id
      group by p.project_id,ps.total_phases,ps.completed_phases
      order by p.project_id;`
    const result = await pool.query(query)
    res.json(result.rows)
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function getProjectById(req, res) {
  const id = req.params.id
  try {
    const result = await pool.query(
      'select * from projects where project_id = $1',
      [id],
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Id does not exist' })
    }
    res.json(result.rows[0])
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function putProjectById(req, res) {
  const id = req.params.id
  const { name, description, project_type, tech_stack } = req.body
  try {
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Project Name is empty or missing' })
    }
    if (typeof project_type !== 'string' || project_type.trim() === '') {
      return res.status(400).json({ error: 'Project Type is empty or missing' })
    }
    const query = `
      update projects
      set name = $2,
      description = $3,
      project_type = $4,
      tech_stack = $5,
      updated_at = current_timestamp
      where project_id = $1
      returning project_id;
    `
    const result = await pool.query(
      `select project_id
      from projects
      where project_id = $1`,
      [id],
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Id does not exist' })
    }
    const updateResult = await pool.query(query, [
      id,
      name,
      description,
      project_type,
      tech_stack,
    ])
    res.status(200).json({
      msg: 'Project updated successfully',
      project_id: updateResult.rows[0].project_id,
    })
  } catch (e) {
    res.status(500).json({ databaseError: e.message })
  }
}

export async function deleteProjectById(req, res) {
  const id = req.params.id
  try {
    const result = await pool.query(
      'delete from projects where project_id = $1',
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
